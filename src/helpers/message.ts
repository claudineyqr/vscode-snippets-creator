import * as vscode from 'vscode';
const nameExtension = 'Snippets Creator';

export function infoMessage(message: string) {
    vscode.window.showInformationMessage(`${nameExtension}: ${message}`);
}

export function warnMessage(message: string) {
    vscode.window.showWarningMessage(`${nameExtension}: ${message}`);
}

export function errorMessage(message: string) {
    vscode.window.showErrorMessage(`${nameExtension}: ${message}`);
}
