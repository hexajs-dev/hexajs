import * as path from 'path';
import { BuildFoundationOutput, UiOrchestratorOutput } from './types';
import { buildUiBootstrap, buildUiEntries } from './ui.builder';
import { withQuietLogs, writeGeneratedFile } from './runtime';

export async function runUiOrchestrator(foundation: BuildFoundationOutput): Promise<UiOrchestratorOutput> {
    const { registry, storeOutputs, mergedTokens, outputDir, resolved } = foundation;
    const generatedRows = [];

    const { uiBootstrapContent } = buildUiBootstrap(registry, storeOutputs, mergedTokens, outputDir, resolved);
    const uiBootstrapPath = path.join(outputDir, 'ui', 'ui.bootstrap.js');

    if (uiBootstrapContent) {
        generatedRows.push(writeGeneratedFile(uiBootstrapPath, uiBootstrapContent));
    }

    const uiEntries = await withQuietLogs(true, async () => buildUiEntries(resolved, outputDir, uiBootstrapPath, foundation.watch, foundation.hmrAddress));
    return { uiEntries, generatedRows };
}
