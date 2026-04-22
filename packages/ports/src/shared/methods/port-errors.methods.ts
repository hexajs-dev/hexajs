export function rejectUnsupportedApi(reject: (reason?: any) => void, methodName: string, platform: string | undefined, apiName: string): void {
    console.warn(`[${methodName}] Unsupported API for platform: ${platform}`);
    reject(new Error(`${apiName} API not available in this context`));
}

export function rejectUnsupportedPlatform(reject: (reason?: any) => void, methodName: string, platform: string | undefined, apiName: string): void {
    console.warn(`[${methodName}] Unsupported platform: ${platform}`);
    reject(new Error(`Unsupported platform for ${apiName}: ${platform}`));
}

export function throwUnsupportedApi(methodName: string, platform: string | undefined, apiName: string): never {
    console.warn(`[${methodName}] Unsupported API for platform: ${platform}`);
    throw new Error(`${apiName} API not available in this context`);
}

export function throwUnsupportedPlatform(methodName: string, platform: string | undefined, apiName: string): never {
    console.warn(`[${methodName}] Unsupported platform: ${platform}`);
    throw new Error(`Unsupported platform for ${apiName}: ${platform}`);
}
