import { describe, expect, it } from 'vitest';
import { resolveConfig } from '../src/bin/config/resolve';
import type { HexaConfig } from '../src/bin/config/config';

function makeConfig(overrides: Partial<HexaConfig> = {}): HexaConfig {
    return {
        $schema: '',
        project: { name: 'test', version: '1.0.0', sourceRoot: 'src' },
        compilerOptions: { tsConfig: 'tsconfig.json', assets: [], minify: false, cssMinify: false, sourceMap: true, terserOptions: {} },
        environments: {
            development: {
                platforms: {
                    chrome: { outDir: 'dist/chrome', manifest: '' },
                },
            },
        },
        ...overrides,
    };
}

describe('autoLaunch config resolution', () => {
    it('defaults to isolated when autoLaunch is absent', () => {
        const resolved = resolveConfig(makeConfig(), 'chrome', 'development');
        expect(resolved.autoLaunch.profile).toBe('isolated');
        expect(resolved.autoLaunch.profileName).toBe('');
    });

    it('root-level autoLaunch propagates to resolved config', () => {
        const resolved = resolveConfig(makeConfig({ autoLaunch: { profile: 'default' } }), 'chrome', 'development');
        expect(resolved.autoLaunch.profile).toBe('default');
    });

    it('environment-level autoLaunch overrides root', () => {
        const config = makeConfig({ autoLaunch: { profile: 'isolated' } });
        config.environments!.development.autoLaunch = { profile: 'default' };
        const resolved = resolveConfig(config, 'chrome', 'development');
        expect(resolved.autoLaunch.profile).toBe('default');
    });

    it('platform-level autoLaunch overrides environment', () => {
        const config = makeConfig({ autoLaunch: { profile: 'default' } });
        config.environments!.development.autoLaunch = { profile: 'default' };
        config.environments!.development.platforms!.chrome.autoLaunch = { profile: 'isolated' };
        const resolved = resolveConfig(config, 'chrome', 'development');
        expect(resolved.autoLaunch.profile).toBe('isolated');
    });

    it('profileName propagates through layers', () => {
        const config = makeConfig();
        config.environments!.development.platforms!.chrome.autoLaunch = { profile: 'default', profileName: 'Work' };
        const resolved = resolveConfig(config, 'chrome', 'development');
        expect(resolved.autoLaunch.profile).toBe('default');
        expect(resolved.autoLaunch.profileName).toBe('Work');
    });

    it('profileName from lower layer is overridden by higher layer', () => {
        const config = makeConfig({ autoLaunch: { profile: 'default', profileName: 'Personal' } });
        config.environments!.development.platforms!.chrome.autoLaunch = { profileName: 'Work' };
        const resolved = resolveConfig(config, 'chrome', 'development');
        expect(resolved.autoLaunch.profileName).toBe('Work');
    });
});
