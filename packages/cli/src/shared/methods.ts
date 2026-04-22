import { ConfigToken } from "../bin/config/config";
import { TokenMetadata } from "../compiler/di/types";

/**
 * Merges code-scanned token defaults with config-resolved tokens.
 * Config tokens override code defaults (by key).
 */
export function mergeTokensWithCodeDefaults(systemTokens: ConfigToken[], codeTokens: TokenMetadata[], configTokens: ConfigToken[]): ConfigToken[] {
    const map = new Map<string, ConfigToken>();

    // Layer 0: system tokens (lowest priority — always present, overridable by everything)
    for (const st of systemTokens) {
        map.set(st.key, { ...st });
    }

    // Layer 1: code-scanned defaults
    for (const ct of codeTokens) {
        map.set(ct.key, {
            key: ct.key,
            value: ct.defaultValue,
            context: ct.context === 'general' ? undefined : ct.context as 'background' | 'content' | 'ui',
        });
    }

    // Layer 2: config tokens (already merged from root → env → platform → env×platform)
    for (const token of configTokens) {
        map.set(token.key, { ...token });
    }

    return Array.from(map.values());
}