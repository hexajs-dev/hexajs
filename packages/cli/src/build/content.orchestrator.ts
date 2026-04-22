import * as path from 'path';
import { ValidatorGenerator } from '../generators/validator/generator';
import { buildContentArtifacts } from './content.builder';
import { writeGeneratedFile } from './runtime';
import { BuildFoundationOutput, ContentOrchestratorOutput } from './types';
import { ContentScriptOutput } from '../generators/content/generator';

export function runContentOrchestrator(foundation: BuildFoundationOutput): ContentOrchestratorOutput {
    const { registry, storeOutputs, mergedTokens, outputDir, watch } = foundation;
    const { contentBootstraps } = buildContentArtifacts(registry, storeOutputs, mergedTokens, outputDir, watch ?? false);

    const validatorGenerator = new ValidatorGenerator(registry);
    const validators = validatorGenerator.generate();

    const generatedRows = [];
    const contentValidatorsPath = path.join(outputDir, 'content', 'content.validators.js');
    generatedRows.push(writeGeneratedFile(contentValidatorsPath, validators.content));

    const contentBundleEntries: string[] = [];
    contentBootstraps.forEach((contentScript: ContentScriptOutput) => {
        const contentPath = path.join(outputDir, 'content', `${contentScript.name}.js`);
        contentBundleEntries.push(contentPath);
        generatedRows.push(writeGeneratedFile(contentPath, contentScript.content));
    });

    return { contentBootstraps, contentBundleEntries, generatedRows };
}
