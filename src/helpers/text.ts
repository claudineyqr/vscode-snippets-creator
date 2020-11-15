import dedent from "ts-dedent";

export function removeCharactersPrefix(prefix: string) {
    prefix = prefix
        .normalize("NFD")
        .replace(/\s+$/gim, '')
        .replace(/\s+/gim, '-')
        .replace(/[^a-zA-Z-]/gim, '');

    return prefix.toLowerCase();
}

export function createGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/gim, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function textToArray(text: string): string[] {
    text = dedent(text);
    return text.split('\n');
}
