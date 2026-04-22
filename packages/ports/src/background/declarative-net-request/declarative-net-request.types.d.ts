declare global {
    type HexaWebDNRResourceType = 'main_frame' | 'sub_frame' | 'stylesheet' | 'script' | 'image' | 'font' | 'object' | 'xmlhttprequest' | 'ping' | 'csp_report' | 'media' | 'websocket' | 'webtransport' | 'webbundle' | 'other';
    type HexaWebDNROperator = 'equals' | 'contains' | 'startsWith' | 'endsWith';

    interface HexaWebDNRRequestMethodCondition {
        values: string[];
    }

    interface HexaWebDNRRuleCondition {
        urlFilter?: string;
        regexFilter?: string;
        isUrlFilterCaseSensitive?: boolean;
        resourceTypes?: HexaWebDNRResourceType[];
        excludedResourceTypes?: HexaWebDNRResourceType[];
        requestMethods?: string[];
        excludedRequestMethods?: string[];
        domains?: string[];
        excludedDomains?: string[];
        tabIds?: number[];
        excludedTabIds?: number[];
    }

    interface HexaWebDNRRedirectAction {
        extensionPath?: string;
        transform?: { host?: string; path?: string; query?: string; fragment?: string; scheme?: string; port?: string };
        regexSubstitution?: string;
        url?: string;
    }

    interface HexaWebDNRAction {
        type: 'block' | 'redirect' | 'allow' | 'upgradeScheme' | 'modifyHeaders' | 'allowAllRequests';
        redirect?: HexaWebDNRRedirectAction;
    }

    interface HexaWebDNRRule {
        id: number;
        priority: number;
        action: HexaWebDNRAction;
        condition: HexaWebDNRRuleCondition;
    }

    interface HexaWebDNRUpdateDynamicRulesOptions {
        removeRuleIds?: number[];
        addRules?: HexaWebDNRRule[];
    }

    namespace webExt {
        namespace declarativeNetRequest {
            function updateDynamicRules(options: HexaWebDNRUpdateDynamicRulesOptions): Promise<void>;
            function getDynamicRules(): Promise<HexaWebDNRRule[]>;
        }
    }
}

export {};
