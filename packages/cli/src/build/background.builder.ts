import * as path from 'path';
import { ConfigToken } from '../bin/config/config';
import { MetadataRegistry } from '../compiler/registry';
import { BackgroundGenerator } from '../generators/background/generator';
import { WorkerGenerator } from '../generators/background/worker/generator';
import { StoreScriptOutput } from '../generators/store/generator';
import { BackgroundBuildOutput } from './types';

export function buildBackgroundArtifacts(registry: MetadataRegistry, storeOutputs: StoreScriptOutput[], tokens: ConfigToken[], outputDir: string, watch: boolean = false, hmrAddress: string = '', hmrSessionToken: string = '', platform: string = 'chrome'): BackgroundBuildOutput {
    const backgroundOutputDir = path.join(outputDir, 'background');
    const backgroundGenerator = new BackgroundGenerator(registry, storeOutputs, tokens, backgroundOutputDir, watch, hmrAddress, hmrSessionToken);
    const workerGenerator = new WorkerGenerator(registry, storeOutputs, tokens, backgroundOutputDir, platform);
    const workerOutput = workerGenerator.generate();

    return {
        backgroundBootstrap: backgroundGenerator.generate(),
        workerHostRouter: workerOutput.hostRouterContent,
        workerScripts: workerOutput.workerScripts,
        offscreenHtml: workerOutput.offscreenHtml,
    };
}
