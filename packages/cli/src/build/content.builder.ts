import * as path from 'path';
import { ConfigToken } from '../bin/config/config';
import { MetadataRegistry } from '../compiler/registry';
import { ContentGenerator } from '../generators/content/generator';
import { StoreScriptOutput } from '../generators/store/generator';
import { ContentBuildOutput } from './types';

export function buildContentArtifacts(registry: MetadataRegistry, storeOutputs: StoreScriptOutput[], tokens: ConfigToken[], outputDir: string, watch: boolean = false): ContentBuildOutput {
    const contentOutputDir = path.join(outputDir, 'content');
    const contentGenerator = new ContentGenerator(registry, storeOutputs, tokens, contentOutputDir, watch);
    return { contentBootstraps: contentGenerator.generate() };
}
