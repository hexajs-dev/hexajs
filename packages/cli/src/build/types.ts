import * as ts from 'typescript';
import { ConfigToken } from '../bin/config/config';
import { ResolvedBuildConfig } from '../bin/config/resolve';
import { MetadataRegistry } from '../compiler/registry';
import { ContentScriptOutput } from '../generators/content/generator';
import { ManifestUiEntries } from '../generators/manifest/generator';
import { StoreScriptOutput } from '../generators/store/generator';

export type BuildTarget = 'all' | 'ui' | 'content' | 'background';

export interface BuildActionOptions {
    verbose?: boolean;
    target?: BuildTarget;
    watch?: boolean;
    hmrAddress?: string;
    hmrSessionToken?: string;
}

export interface GeneratedArtifactRow {
    file: string;
    size: string;
    duration: string;
}

export interface BuildFoundationOutput {
    registry: MetadataRegistry;
    program: ts.Program;
    resolved: ResolvedBuildConfig;
    outputDir: string;
    mergedTokens: ConfigToken[];
    storeOutputs: StoreScriptOutput[];
    watch?: boolean;
    hmrAddress?: string;
    hmrSessionToken?: string;
    rebuild?: {ui: boolean};
}

export interface BackgroundOrchestratorOutput {
    backgroundBootstrap: string;
    backgroundBundleEntries: string[];
    workerBundleEntries: string[];
    hasOffscreenPage: boolean;
    generatedRows: GeneratedArtifactRow[];
}

export interface BackgroundBuildOutput {
    backgroundBootstrap: string;
    workerHostRouter: string;
    workerScripts: { name: string; content: string }[];
    offscreenHtml: string | null;
}

export interface ContentOrchestratorOutput {
    contentBootstraps: ContentScriptOutput[];
    contentBundleEntries: string[];
    generatedRows: GeneratedArtifactRow[];
}

export interface ContentBuildOutput {
    contentBootstraps: ContentScriptOutput[];
}

export interface UiOrchestratorOutput {
    uiEntries: ManifestUiEntries;
    generatedRows: GeneratedArtifactRow[];
}

export type BuildContext = 'background' | 'content' | 'ui';

export type BuildContextMapRecord = Record<string, Partial<Record<BuildContext, true>>>;

export interface WatchRunnerCallbacks {
    onInitialBuild: (hmrAddress: string, hmrSessionToken: string) => Promise<ContentScriptOutput[]>;
    onUiRebuild: (hmrAddress: string, hmrSessionToken: string) => Promise<void>;
    onBackgroundRebuild?: (hmrAddress: string, hmrSessionToken: string) => Promise<void>;
    onContentRebuild?: (hmrAddress: string, hmrSessionToken: string) => Promise<ContentScriptOutput[]>;
}
