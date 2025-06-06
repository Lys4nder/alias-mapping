import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as utils from './utils';

let decorationType: vscode.TextEditorDecorationType | undefined;

export function activate(context: vscode.ExtensionContext) {
  utils.showProgress('Alias View is now active!', 3);

  setSettingsFile();

  const enable = vscode.commands.registerCommand('aliasView.toggleAliases', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      applyAliases(editor);
    }
  });

  const close = vscode.commands.registerCommand('aliasView.hideAliases', () => {
    deactivateAliases();
  });

  const openFile = vscode.commands.registerCommand('aliasView.openAliasFile', () => {
    const aliasFilePath = path.join(vscode.workspace.rootPath || '', '.vscode', 'alias-mapping.json');
    if (fs.existsSync(aliasFilePath)) {
      vscode.commands.executeCommand('vscode.open', vscode.Uri.file(aliasFilePath));
    } else {
      vscode.window.showWarningMessage('Alias mapping file not found. Please create .vscode/alias-mapping.json');
    }
  });

  const tabChange = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      applyAliases(editor);
    }
  });

  context.subscriptions.push(enable);
  context.subscriptions.push(openFile);
  context.subscriptions.push(tabChange);
  context.subscriptions.push(close);

  // Listen for document save and change events
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && document === editor.document) {
        applyAliases(editor);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document) {
        applyAliases(editor);
      }
    })
  );
}

function applyAliases(editor: vscode.TextEditor) {
  const aliasFilePath = path.join(vscode.workspace.rootPath || '', '.vscode', 'alias-mapping.json');

  if (!fs.existsSync(aliasFilePath)) {
    vscode.window.showWarningMessage('Alias mapping file not found. Please create .vscode/alias-mapping.json');
    return;
  }

  let aliasMap: Record<string, string> = {};
  try {
    aliasMap = JSON.parse(fs.readFileSync(aliasFilePath, 'utf-8'));
  } catch (e) {
    vscode.window.showWarningMessage('Failed to parse alias-mapping.json. Please check the file format.');
    return;
  }

  const text = editor.document.getText();
  const decorationsArray: vscode.DecorationOptions[] = [];
  for (const [original, alias] of Object.entries(aliasMap)) {
    const regex = new RegExp(`\\b${original}\\b`, 'g');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const startPos = editor.document.positionAt(match.index);
      const endPos = editor.document.positionAt(match.index + original.length);
      const decoration = {
        range: new vscode.Range(startPos, endPos),
        renderOptions: {
          after: {
            contentText: `← ${alias}`,
            color: '#999999',
            margin: '10px 0 0 10px'
          }
        }
      };
      decorationsArray.push(decoration);
    }
  }

  if (decorationType) {
    decorationType.dispose();
  }
  decorationType = vscode.window.createTextEditorDecorationType({});
  editor.setDecorations(decorationType, decorationsArray);
}

export function deactivate() {
  deactivateAliases();
}

export function deactivateAliases() {
  if (decorationType) {
    for (const editor of vscode.window.visibleTextEditors) {
      editor.setDecorations(decorationType, []);
    }
    decorationType.dispose();
    decorationType = undefined;
  }
}

export function setSettingsFile() {
  const settingsFilePath = path.join(vscode.workspace.rootPath || '', '.vscode', 'alias-mapping.json');
  if (!fs.existsSync(settingsFilePath)) {
    fs.writeFileSync(settingsFilePath, JSON.stringify({}, null, 2));
    vscode.window.showInformationMessage('Alias mapping file created at .vscode/alias-mapping.json');
  } else {
    utils.showProgress('Alias mapping file found.', 3);
  }
  vscode.commands.executeCommand('vscode.open', vscode.Uri.file(settingsFilePath));
}