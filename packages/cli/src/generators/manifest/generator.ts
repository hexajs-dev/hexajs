import * as fs from 'fs';
import * as path from 'path';
import { HexaConfig } from '../../bin/config/config';
import { ResolvedBuildConfig } from '../../bin/config/resolve';
import { ContentScriptOutput } from '../content/generator';
import { ManifestV3 } from './types';
import { getTemplateForPlatform } from './templates';

export interface ManifestUiEntries {
    popup?: string;
    devtools?: string;
}

export interface ManifestGenerationOptions {
    watch?: boolean;
    hmrAddress?: string;
    hasOffscreenPage?: boolean;
}

export class ManifestGenerator {
    constructor(private contentBootstraps: ContentScriptOutput[], private resolved: ResolvedBuildConfig, private uiEntries: ManifestUiEntries = {}, private options: ManifestGenerationOptions = {}) {}

    generate(): string {
        // 1. Start from the platform default template (deep copy)
        const manifest = getTemplateForPlatform(this.resolved.platform);

        // 2. Apply project metadata from hexa config
        manifest.name = this.resolved.project.name;
        manifest.version = this.resolved.project.version;

        // 3. If user provided a base manifest path, try to merge it — user fields win on all except
        //    content_scripts and background, which HexaJS always controls.
        //    If the path is set but the file is missing, a warning is printed and we fall back to the platform template.
        if (this.resolved.manifest) {
            const userManifest = this.loadUserManifest(this.resolved.manifest);
            if (userManifest) {
                this.mergeUserManifest(manifest, userManifest);
            }
        }

        // 4. HexaJS always owns background — inject from template (already set by getTemplateForPlatform)
        //    nothing to do here, it's already in the template

        // 5. HexaJS always owns content_scripts — build from contentBootstraps.
        //    Content scripts are bundled as IIFE (self-contained), so no
        //    `type: "module"` is needed — they work on all browsers.
        manifest.content_scripts = this.contentBootstraps.map(cs => ({
            js: [`content/${cs.name}.js`],
            matches: cs.matches,
            run_at: cs.runAt,
            all_frames: cs.allFrames,
        }));

        this.applyUiEntries(manifest);
        this.applyWorkerMutations(manifest);
        this.applyWatchModeMutations(manifest);

        // 6. Stringify with minify flag
        const minify = this.resolved.compilerOptions.minify;
        return minify
            ? JSON.stringify(manifest)
            : JSON.stringify(manifest, null, 2);
    }

    private loadUserManifest(manifestPath: string): Partial<ManifestV3> | null {
        const absolutePath = path.resolve(process.cwd(), manifestPath);
        if (!fs.existsSync(absolutePath)) {
            console.warn(`[ManifestGenerator] Warning: manifest file not found at "${absolutePath}". Falling back to platform template.`);
            return null;
        }
        try {
            return JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
        } catch {
            throw new Error(`Failed to parse manifest file at: ${absolutePath}`);
        }
    }

    private mergeUserManifest(base: ManifestV3, user: Partial<ManifestV3>): void {
        // HexaJS always controls these — skip them from user manifest
        const HEXA_OWNED_KEYS: (keyof ManifestV3)[] = ['background', 'content_scripts', 'manifest_version', 'action', 'devtools_page'];

        for (const [key, value] of Object.entries(user)) {
            if (HEXA_OWNED_KEYS.includes(key as keyof ManifestV3)) {
                continue;
            }
            (base as Record<string, unknown>)[key] = value;
        }
    }

    private applyUiEntries(manifest: ManifestV3): void {
        if (this.uiEntries.popup) {
            manifest.action = {
                ...(manifest.action || {}),
                default_popup: this.uiEntries.popup,
            };
        } else if (manifest.action) {
            delete manifest.action.default_popup;
        }

        if (this.uiEntries.devtools) {
            manifest.devtools_page = this.uiEntries.devtools;
            return;
        }

        delete manifest.devtools_page;
    }

    private applyWorkerMutations(manifest: ManifestV3): void {
        if (!this.options.hasOffscreenPage) return;

        const isChromium = ['chrome', 'edge', 'brave', 'opera'].includes(this.resolved.platform);
        if (!isChromium) return;

        if (!manifest.permissions) {
            manifest.permissions = [];
        }
        if (!manifest.permissions.includes('offscreen')) {
            manifest.permissions.push('offscreen');
        }
    }

    private applyWatchModeMutations(manifest: ManifestV3): void {
        if (!this.options.watch) {
            return;
        }

        // Add scripting permission for HMR content script updates
        if (!manifest.permissions) {
            manifest.permissions = [];
        }
        if (!manifest.permissions.includes('scripting')) {
            manifest.permissions.push('scripting');
        }

        if (this.resolved.platform === 'firefox') {
            this.patchFirefoxScriptSrc(manifest);
        }

        if (this.resolved.platform !== 'safari') {
            return;
        }

        if (!this.options.hmrAddress) {
            return;
        }

        const existing = manifest.content_security_policy?.extension_pages ?? "script-src 'self'; object-src 'self';";
        const connectValue = this.extractConnectSrcValue(existing);
        if (connectValue.includes(this.options.hmrAddress)) {
            return;
        }

        const appendedConnect = connectValue.length > 0
            ? `${connectValue} ${this.options.hmrAddress}`
            : `${this.options.hmrAddress}`;
        const nextPolicy = this.upsertConnectSrc(existing, appendedConnect);

        manifest.content_security_policy = {
            ...(manifest.content_security_policy || {}),
            extension_pages: nextPolicy,
        };
    }

    private patchFirefoxScriptSrc(manifest: ManifestV3): void {
        const existing = manifest.content_security_policy?.extension_pages ?? "script-src 'self'; object-src 'self';";
        const scriptValue = this.extractScriptSrcValue(existing);
        const requiredOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
        const missingOrigins = requiredOrigins.filter(origin => !scriptValue.includes(origin));

        if (missingOrigins.length === 0) {
            return;
        }

        const nextScriptValue = scriptValue.length > 0
            ? `${scriptValue} ${missingOrigins.join(' ')}`
            : `'self' ${missingOrigins.join(' ')}`;

        const nextPolicy = this.upsertScriptSrc(existing, nextScriptValue);

        manifest.content_security_policy = {
            ...(manifest.content_security_policy || {}),
            extension_pages: nextPolicy,
        };
    }

    private extractConnectSrcValue(policy: string): string {
        const match = policy.match(/connect-src\s+([^;]+)/i);
        return match?.[1]?.trim() ?? '';
    }

    private extractScriptSrcValue(policy: string): string {
        const match = policy.match(/script-src\s+([^;]+)/i);
        return match?.[1]?.trim() ?? '';
    }

    private upsertConnectSrc(policy: string, connectValue: string): string {
        if (/connect-src\s+[^;]+;?/i.test(policy)) {
            return policy.replace(/connect-src\s+[^;]+;?/i, `connect-src ${connectValue};`);
        }

        const trimmed = policy.trim();
        if (!trimmed.endsWith(';')) {
            return `${trimmed}; connect-src ${connectValue};`;
        }
        return `${trimmed} connect-src ${connectValue};`;
    }

    private upsertScriptSrc(policy: string, scriptValue: string): string {
        if (/script-src\s+[^;]+;?/i.test(policy)) {
            return policy.replace(/script-src\s+[^;]+;?/i, `script-src ${scriptValue};`);
        }

        const trimmed = policy.trim();
        if (!trimmed.endsWith(';')) {
            return `${trimmed}; script-src ${scriptValue};`;
        }
        return `${trimmed} script-src ${scriptValue};`;
    }
}
