import * as path from 'path';
import { ValidatorGenerator } from '../generators/validator/generator';
import { buildContentArtifacts } from './content.builder';
import { writeGeneratedFile } from './runtime';
import { BuildFoundationOutput, ContentOrchestratorOutput } from './types';
import { ContentScriptOutput } from '../generators/content/generator';

export function runContentOrchestrator(foundation: BuildFoundationOutput): ContentOrchestratorOutput {
    const { registry, storeOutputs, mergedTokens, outputDir, watch, resolved } = foundation;
    const framework = resolved.ui?.framework ?? 'react';
    const { contentBootstraps } = buildContentArtifacts(registry, storeOutputs, mergedTokens, outputDir, watch ?? false, framework);

    const validators = foundation.validators ?? new ValidatorGenerator(registry).generate();

    const generatedRows = [];
    const contentValidatorsPath = path.join(outputDir, 'content', 'content.validators.js');
    generatedRows.push(writeGeneratedFile(contentValidatorsPath, validators.content));

    const contentBundleEntries: string[] = [];
    contentBootstraps.forEach((contentScript: ContentScriptOutput) => {
        const contentPath = path.join(outputDir, 'content', `${contentScript.name}.js`);
        contentBundleEntries.push(contentPath);
        generatedRows.push(writeGeneratedFile(contentPath, contentScript.content));
    });

    return { contentBootstraps, contentBundleEntries, contentValidatorPath: contentValidatorsPath, generatedRows };
}
