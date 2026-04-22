declare global {
    interface HexaWebDevtoolsEvalOptions {
        frameURL?: string;
        useContentScriptContext?: boolean;
        contextSecurityOrigin?: string;
    }

    interface HexaWebDevtoolsReloadOptions {
        ignoreCache?: boolean;
        userAgent?: string;
        injectedScript?: string;
    }
}

export {};
