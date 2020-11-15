import * as vscode from 'vscode';
import { infoMessage, errorMessage } from './helpers/message';
import { createSnippet, getFilepath } from './helpers/file';
import { removeCharactersPrefix, textToArray } from './helpers/text';
import { Snippet } from './models/Snippet';

function showFileInEditor(filepath: string) {
    vscode.workspace.openTextDocument(filepath)
        .then(doc => vscode.window.showTextDocument(doc))
        .then(() => vscode.commands.executeCommand('cursorBottom'));
}

export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('snippets-creator.createSnippet', async () => {
        const activeTextEditor = vscode.window.activeTextEditor;
        if (!activeTextEditor) {
            return;
        }

        const selection = activeTextEditor.selection;
        const textSelected = activeTextEditor.document.getText(new vscode.Range(selection.start, selection.end));
        if (selection.isEmpty) {
            errorMessage('Select code blocks');
            return;
        }

        const languages: string[] = await vscode.languages.getLanguages();

        let snippet: Snippet = {
            prefix: '',
            name: '',
            scope: [],
            languageId: activeTextEditor.document.languageId,
            body: textToArray(textSelected),
            description: '',
            isGlobal: false
        };

        const snippetTypes: string[] = [
            `Snippet for Language: ${snippet.languageId}`,
            'Snippet Global'
        ];

        const snippetType = await vscode.window.showQuickPick(snippetTypes, { placeHolder: 'Select the snippet type' });
        if (snippetType === undefined || snippetType === '') {
            errorMessage('Unselected snippet type');
            return;
        }

        snippet.isGlobal = snippetType === 'Snippet Global';
        if (snippet.isGlobal) {
            let quickPickItems: vscode.QuickPickItem[] = languages
                .sort(function (a, b) {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                }).map(item => {
                    return {
                        label: item,
                        picked: item === snippet.languageId
                    };
                });

            const languagesSelected = await vscode.window.showQuickPick(quickPickItems, { placeHolder: 'Select languages', canPickMany: true });
            if (languagesSelected === undefined || languagesSelected?.length === 0) {
                errorMessage('Unselected languages');
                return;
            }
            snippet.scope = languagesSelected?.map(item => item.label) ?? [];
        }

        const prefix = await vscode.window.showInputBox({ placeHolder: 'Prefix', prompt: 'Enter the snippet prefix' });
        if (prefix === undefined || prefix === '') {
            errorMessage('Prefix not provided');
            return;
        }
        snippet.prefix = removeCharactersPrefix(prefix);

        const name = await vscode.window.showInputBox({ placeHolder: 'Name', prompt: 'Enter the snippet name' });
        if (name === undefined || name === '') {
            errorMessage('Name not provided');
            return;
        }
        snippet.name = name;
        snippet.description = await vscode.window.showInputBox({ placeHolder: 'Description', prompt: 'Enter the snippet description (Optional)' });

        const filepath: string = getFilepath(snippet.languageId, snippet.isGlobal);
        if (filepath === undefined || filepath === '') {
            errorMessage('Unknown OS');
            return;
        }

        return createSnippet(filepath, snippet)
            .then(() => showFileInEditor(filepath))
            .then(() => infoMessage('Snippet Saved'));
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }
