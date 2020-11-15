import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import pify = require('pify');
import * as jsonc from 'jsonc-parser';
import { Snippet } from '../models/Snippet';
import { warnMessage } from './message';
import { createGuid } from './text';

function getPathSettings(): string {
    const osName = os.type();
    const vscodeDir = vscode.env.appName.includes('Visual Studio Code - Insiders') ? 'Code - Insiders' : 'Code';

    if (osName === 'Darwin' && process.env.HOME) {
        return path.join(process.env.HOME, 'Library', 'Application Support', vscodeDir, 'User');
    }

    if (osName === 'Linux' && process.env.HOME) {
        return path.join(process.env.HOME, '.config', vscodeDir, 'User');
    }

    if (osName === 'Windows_NT' && process.env.APPDATA) {
        return path.join(process.env.APPDATA, vscodeDir, 'User');
    }

    throw new Error('Cannot detect user settings folder');
}

function testFileExists(filepath: string): Promise<any> {
    if (fs.access) {
        return pify(fs.access)(filepath);
    }
    return pify(fs.exists)(filepath);
}

async function writeEmptyJson(filepath: string): Promise<any> {
    return await pify(fs.writeFile)(filepath, '{}');
}

export function getSnippetFilePathLanguage(languageId: string): string {
    return path.join(getPathSettings(), 'snippets', `${languageId}.json`);
}

export function getSnippetFilePathGlobal(): string {
    return path.join(getPathSettings(), 'snippets', 'my-snippets.code-snippets');
}

export function getFilepath(languageId: string, isGlobal: boolean): string {
    let filepath: string = '';
    try {
        if (isGlobal) {
            filepath = getSnippetFilePathGlobal();
        } else {
            filepath = getSnippetFilePathLanguage(languageId);
        }
    } catch (error) {
        filepath = '';
    }
    return filepath;
}

export async function createSnippet(filepath: string, snippet: Snippet): Promise<any> {
    try {
        await testFileExists(filepath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeEmptyJson(filepath);
        }
        else {
            throw error;
        }
    }

    const dataFile = await pify(fs.readFile)(filepath);
    const rawSnippets = dataFile.toString();
    const snippetsSaved = jsonc.parse(rawSnippets);

    if (snippetsSaved !== undefined && snippetsSaved[snippet.name] !== undefined) {
        const name = snippet.name;
        snippet.name = `${snippet.name}-${createGuid()}`;
        warnMessage(`A snippet '${name}' already exists. New name created: '${snippet.name}'`);
    }

    const formattingOptions = {
        tabSize: 2,
        insertSpaces: false,
        eol: ''
    };

    let snippetModel: { [k: string]: any } = {};
    snippetModel = {
        prefix: snippet.prefix,
        body: snippet.body,
        description: snippet.description,
    };

    if (snippet.isGlobal) {
        snippetModel.scope = Array.isArray(snippet.scope) ? snippet.scope.join(',') : snippet.scope;
    }

    const newSnippet = jsonc.applyEdits(
        rawSnippets,
        jsonc.modify(rawSnippets, [snippet.name], snippetModel, { formattingOptions: formattingOptions })
    );

    return await pify(fs.writeFile)(filepath, newSnippet);
}
