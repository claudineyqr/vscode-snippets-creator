export interface Snippet {
    name: string;
    scope: string[] | string;
    languageId: string;
    prefix: string;
    body: string[];
    description?: string;
    isGlobal: boolean;
}
