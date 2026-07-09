import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';

let decorationType: vscode.TextEditorDecorationType | undefined;
let decorationStyleKey: string | undefined;
let cachedAliasMap: { filePath: string; mtimeMs: number; aliasMap: Record<string, string> } | undefined;
const updateTimers = new Map<string, NodeJS.Timeout>();
const outputChannel = vscode.window.createOutputChannel('Alias View');
const lastDiagnostics = new Map<string, number>();

type AliasViewConfig = {
  enabled: boolean;
  prefix: string;
  color: string;
  margin: string;
  silentWarnings: boolean;
  refreshOnType: boolean;
  refreshOnSave: boolean;
  debounceMs: number;
  mappingFile: string;
};

export function activate(context: vscode.ExtensionContext) {
  const enable = vscode.commands.registerCommand('aliasView.toggleAliases', async () => {
    const config = vscode.workspace.getConfiguration('aliasView');
    const current = config.get<boolean>('enabled', true);
    await config.update('enabled', !current, vscode.ConfigurationTarget.Workspace);
    if (!current) {
      applyAliasesToVisibleEditors();
    } else {
      deactivateAliases();
    }
  });

  const close = vscode.commands.registerCommand('aliasView.hideAliases', async () => {
    const config = vscode.workspace.getConfiguration('aliasView');
    await config.update('enabled', false, vscode.ConfigurationTarget.Workspace);
    deactivateAliases();
  });

  const openFile = vscode.commands.registerCommand('aliasView.openAliasFile', async () => {
    const aliasFilePath = getAliasFilePath();
    const config = getConfig();
    if (!aliasFilePath) {
      reportDiagnostic(
        'workspace-missing',
        'Alias View: no open workspace folder found.',
        config.silentWarnings
      );
      return;
    }

    await fsPromises.mkdir(path.dirname(aliasFilePath), { recursive: true });
    if (!fs.existsSync(aliasFilePath)) {
      await fsPromises.writeFile(aliasFilePath, JSON.stringify({}, null, 2), 'utf-8');
    }
    await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(aliasFilePath));
  });

  const tabChange = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      scheduleApplyAliases(editor, true);
    }
  });

  context.subscriptions.push(enable);
  context.subscriptions.push(openFile);
  context.subscriptions.push(tabChange);
  context.subscriptions.push(close);

  // Listen for document save and change events
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      const config = getConfig();
      if (!config.refreshOnSave) {
        return;
      }
      for (const editor of vscode.window.visibleTextEditors) {
        if (document === editor.document) {
          scheduleApplyAliases(editor, true);
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const config = getConfig();
      if (!config.refreshOnType) {
        return;
      }
      for (const editor of vscode.window.visibleTextEditors) {
        if (event.document === editor.document) {
          scheduleApplyAliases(editor);
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration('aliasView')) {
        return;
      }
      if (!getConfig().enabled) {
        deactivateAliases();
        return;
      }
      applyAliasesToVisibleEditors();
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      cachedAliasMap = undefined;
    })
  );

  context.subscriptions.push(outputChannel);

  if (vscode.window.activeTextEditor) {
    scheduleApplyAliases(vscode.window.activeTextEditor, true);
  }
}

function getConfig(): AliasViewConfig {
  const config = vscode.workspace.getConfiguration('aliasView');
  const debounceMs = config.get<number>('debounceMs', 150);
  return {
    enabled: config.get<boolean>('enabled', true),
    prefix: config.get<string>('prefix', '←'),
    color: config.get<string>('ghostTextColor', '#999999'),
    margin: config.get<string>('ghostTextMargin', '10px 0 0 10px'),
    silentWarnings: config.get<boolean>('silentWarnings', true),
    refreshOnType: config.get<boolean>('refreshOnType', true),
    refreshOnSave: config.get<boolean>('refreshOnSave', true),
    debounceMs: Number.isFinite(debounceMs) ? Math.max(0, debounceMs) : 150,
    mappingFile: config.get<string>('mappingFile', '.vscode/alias-mapping.json')
  };
}

function getAliasFilePath(editor?: vscode.TextEditor): string | undefined {
  const workspaceFolder =
    editor?.document.uri
      ? vscode.workspace.getWorkspaceFolder(editor.document.uri)
      : vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return undefined;
  }
  const config = getConfig();
  return path.join(workspaceFolder.uri.fsPath, config.mappingFile);
}

function scheduleApplyAliases(editor: vscode.TextEditor, immediate = false) {
  const key = editor.document.uri.toString();
  const existing = updateTimers.get(key);
  if (existing) {
    clearTimeout(existing);
  }

  const delay = immediate ? 0 : getConfig().debounceMs;
  const timer = setTimeout(() => {
    updateTimers.delete(key);
    void applyAliases(editor);
  }, delay);

  updateTimers.set(key, timer);
}

function applyAliasesToVisibleEditors() {
  for (const editor of vscode.window.visibleTextEditors) {
    scheduleApplyAliases(editor, true);
  }
}

async function applyAliases(editor: vscode.TextEditor) {
  const config = getConfig();
  if (!config.enabled) {
    clearEditorDecorations(editor);
    return;
  }

  const aliasFilePath = getAliasFilePath(editor);
  if (!aliasFilePath) {
    reportDiagnostic(
      'workspace-missing',
      'Alias View: no open workspace folder found.',
      config.silentWarnings
    );
    clearEditorDecorations(editor);
    return;
  }

  const aliasMap = await loadAliasMap(aliasFilePath, config.silentWarnings);
  if (!aliasMap) {
    clearEditorDecorations(editor);
    return;
  }

  ensureDecorationType(config.color, config.margin);
  const text = editor.document.getText();
  const decorationsArray: vscode.DecorationOptions[] = [];
  for (const [original, alias] of Object.entries(aliasMap)) {
    const regex = new RegExp(`\\b${escapeRegex(original)}\\b`, 'g');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const startPos = editor.document.positionAt(match.index);
      const endPos = editor.document.positionAt(match.index + original.length);
      const decoration = {
        range: new vscode.Range(startPos, endPos),
        renderOptions: {
          after: {
            contentText: `${config.prefix} ${alias}`
          }
        }
      };
      decorationsArray.push(decoration);
    }
  }

  if (decorationType) {
    editor.setDecorations(decorationType, decorationsArray);
  }
}

function ensureDecorationType(color: string, margin: string) {
  const styleKey = `${color}::${margin}`;
  if (decorationType && decorationStyleKey === styleKey) {
    return;
  }

  if (decorationType) {
    decorationType.dispose();
  }

  decorationType = vscode.window.createTextEditorDecorationType({
    after: {
      color,
      margin
    }
  });
  decorationStyleKey = styleKey;
}

async function loadAliasMap(
  aliasFilePath: string,
  silentWarnings: boolean
): Promise<Record<string, string> | undefined> {
  if (!fs.existsSync(aliasFilePath)) {
    reportDiagnostic(
      'missing-alias-file',
      `Alias View: mapping file not found at ${aliasFilePath}.`,
      silentWarnings
    );
    cachedAliasMap = undefined;
    return undefined;
  }

  const fileStats = await fsPromises.stat(aliasFilePath);
  if (
    cachedAliasMap &&
    cachedAliasMap.filePath === aliasFilePath &&
    cachedAliasMap.mtimeMs === fileStats.mtimeMs
  ) {
    return cachedAliasMap.aliasMap;
  }

  const rawContent = await fsPromises.readFile(aliasFilePath, 'utf-8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    reportDiagnostic(
      'invalid-alias-json',
      `Alias View: failed to parse ${aliasFilePath}.`,
      silentWarnings
    );
    return undefined;
  }

  if (!isStringRecord(parsed)) {
    reportDiagnostic(
      'invalid-alias-shape',
      'Alias View: alias mapping must be a JSON object with string values.',
      silentWarnings
    );
    return undefined;
  }

  cachedAliasMap = {
    filePath: aliasFilePath,
    mtimeMs: fileStats.mtimeMs,
    aliasMap: parsed
  };

  return parsed;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((entry) => typeof entry === 'string');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function reportDiagnostic(key: string, message: string, silentWarnings: boolean) {
  const now = Date.now();
  const lastLogged = lastDiagnostics.get(key) ?? 0;
  if (now - lastLogged < 10_000) {
    return;
  }

  lastDiagnostics.set(key, now);
  if (silentWarnings) {
    outputChannel.appendLine(message);
  } else {
    void vscode.window.showWarningMessage(message);
  }
}

function clearEditorDecorations(editor: vscode.TextEditor) {
  if (decorationType) {
    editor.setDecorations(decorationType, []);
  }
}

export function deactivate() {
  for (const timer of updateTimers.values()) {
    clearTimeout(timer);
  }
  updateTimers.clear();
  deactivateAliases();
}

export function deactivateAliases() {
  if (decorationType) {
    for (const editor of vscode.window.visibleTextEditors) {
      editor.setDecorations(decorationType, []);
    }
    decorationType.dispose();
    decorationType = undefined;
    decorationStyleKey = undefined;
  }
}