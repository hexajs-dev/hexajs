import * as path from 'path';
import { ValidatorGenerator } from '../generators/validator/generator';
import { buildBackgroundArtifacts } from './background.builder';
import { writeGeneratedFile } from './runtime';
import { BackgroundOrchestratorOutput, BuildFoundationOutput } from './types';

export function runBackgroundOrchestrator(foundation: BuildFoundationOutput): BackgroundOrchestratorOutput {
    const { registry, resolved, storeOutputs, mergedTokens, outputDir, watch, hmrAddress } = foundation;
    const { backgroundBootstrap, workerHostRouter, workerScripts, offscreenHtml } = buildBackgroundArtifacts(registry, storeOutputs, mergedTokens, outputDir, watch ?? false, hmrAddress ?? '', resolved.platform);

    const validatorGenerator = new ValidatorGenerator(registry);
    const validators = validatorGenerator.generate();

    const generatedRows = [];

    const backgroundPath = path.join(outputDir, 'background', 'background.bootstrap.js');
    generatedRows.push(writeGeneratedFile(backgroundPath, backgroundBootstrap));

    const backgroundValidatorsPath = path.join(outputDir, 'background', 'background.validators.js');
    generatedRows.push(writeGeneratedFile(backgroundValidatorsPath, validators.background));

    const workerBundleEntries: string[] = [];

    // Write worker host router
    if (workerHostRouter) {
        const hostRouterPath = path.join(outputDir, 'background', 'hexa.worker.js');
        generatedRows.push(writeGeneratedFile(hostRouterPath, workerHostRouter));
        workerBundleEntries.push(hostRouterPath);
    }

    // Write individual worker scripts
    for (const script of workerScripts) {
        const scriptPath = path.join(outputDir, 'background', `${script.name}.js`);
        generatedRows.push(writeGeneratedFile(scriptPath, script.content));
        workerBundleEntries.push(scriptPath);
    }

    // Write offscreen HTML (Chromium only, when DOM workers exist)
    if (offscreenHtml) {
        const offscreenPath = path.join(outputDir, 'background', 'hexa-offscreen.html');
        generatedRows.push(writeGeneratedFile(offscreenPath, offscreenHtml));
    }

    return {
        backgroundBootstrap,
        backgroundBundleEntries: [backgroundPath],
        workerBundleEntries,
        hasOffscreenPage: offscreenHtml !== null,
        generatedRows,
    };
}
