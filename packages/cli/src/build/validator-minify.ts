import { ResolvedBuildConfig } from '../bin/config/resolve';
import { bundleBootstrapFiles } from '../bundler';

interface MinifyValidatorArtifactsOptions {
    outputDir: string;
    validatorArtifactPaths: string[];
    resolved: ResolvedBuildConfig;
}

export async function minifyValidatorArtifacts(options: MinifyValidatorArtifactsOptions): Promise<void> {
    const { outputDir, validatorArtifactPaths, resolved } = options;
    if (validatorArtifactPaths.length === 0 || resolved.compilerOptions.minify === false) {
        return;
    }

    await bundleBootstrapFiles({
        outputDir,
        entryPoints: Array.from(new Set(validatorArtifactPaths)),
        minify: resolved.compilerOptions.minify,
        sourceMap: resolved.compilerOptions.sourceMap,
        cssMinify: resolved.compilerOptions.cssMinify,
        terserOptions: resolved.compilerOptions.terserOptions,
        projectRoot: process.cwd(),
        platform: resolved.platform,
        context: 'background',
        tsConfigPath: resolved.tsConfig,
        preserveEntrySignatures: 'strict',
    });
}