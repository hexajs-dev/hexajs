declare global {
    interface HexaWebRuleCondition {
        [key: string]: any;
    }

    interface HexaWebRuleAction {
        [key: string]: any;
    }

    interface HexaWebRule {
        id?: string;
        priority?: number;
        conditions: HexaWebRuleCondition[];
        actions: HexaWebRuleAction[];
        tags?: string[];
    }

    interface HexaWebEvent<TCallback extends (...args: any[]) => any> {
        addListener(callback: TCallback): void;
        removeListener(callback: TCallback): void;
        hasListener(callback: TCallback): boolean;
        hasListeners(): boolean;
        addRules?(rules: HexaWebRule[], callback?: (rules: HexaWebRule[]) => void): void;
        getRules?(ruleIdentifiers?: string[], callback?: (rules: HexaWebRule[]) => void): void;
        removeRules?(ruleIdentifiers?: string[], callback?: () => void): void;
    }
}

export {};
