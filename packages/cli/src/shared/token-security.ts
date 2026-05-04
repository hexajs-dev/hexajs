export const TOKEN_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_.:-]*$/;

export function isValidTokenKey(tokenKey: string): boolean {
    return TOKEN_KEY_PATTERN.test(tokenKey);
}

export function assertValidTokenKey(tokenKey: string, source: string): void {
    if (!isValidTokenKey(tokenKey)) {
        throw new Error(
            `Invalid token key "${tokenKey}" from ${source}. ` +
            'Token keys must start with a letter or underscore and can only include letters, numbers, underscores, dots, colons, and hyphens.'
        );
    }
}
