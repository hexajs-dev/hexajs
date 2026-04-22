declare global {
    interface HexaWebUserScriptOptions {
        id?: string;
        js?: Array<{ code?: string; file?: string }>;
        matches: string[];
        excludeMatches?: string[];
        runAt?: 'document_start' | 'document_end' | 'document_idle';
        allFrames?: boolean;
        world?: 'USER_SCRIPT' | 'MAIN';
    }

    namespace webExt {
        namespace userScripts {
            function register(scripts: HexaWebUserScriptOptions[]): Promise<any>;
            function unregister(filter?: { ids?: string[] }): Promise<void>;
            function configureWorld(properties: { csp?: string; messaging?: boolean }): Promise<void>;
            function getScripts(filter?: { ids?: string[] }): Promise<HexaWebUserScriptOptions[]>;
        }
    }
}

export {};
