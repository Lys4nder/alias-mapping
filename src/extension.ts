// src/extension.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let decorationType: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext) {
  console.log('Variable Alias extension is active!');

  const toggleCommand = vscode.commands.registerCommand('aliasView.toggleAliases', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      applyAliases(editor);
    }
  });

  context.subscriptions.push(toggleCommand);
}

function applyAliases(editor: vscode.TextEditor) {
  const aliasFilePath = path.join(vscode.workspace.rootPath || '', '.vscode', 'alias-mapping.json');

  if (!fs.existsSync(aliasFilePath)) {
    vscode.window.showWarningMessage('Alias mapping file not found. Please create .vscode/alias-mapping.json');
    return;
  }

  const aliasMap: Record<string, string> = JSON.parse(fs.readFileSync(aliasFilePath, 'utf-8'));
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
            contentText: ` ← ${alias}`,
            color: '#999999',
            margin: '0 0 0 10px'
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
  if (decorationType) {
    decorationType.dispose();
  }
}
