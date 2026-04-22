import { BuildContext, BuildContextMapRecord } from '../build/types';
import { readSourceContextMap } from '../build/context-map.builder';
import { analyzeDecoratorContexts } from './decorator-analysis';

/**
 * Analyzes a changed file and determines which contexts are affected based on the context map.
 * Returns contexts where this file is imported or referenced.
 */
export function analyzeChangedFile(filePath: string, contextMap: BuildContextMapRecord): BuildContext[] {
    const normalized = filePath.replace(/\\/g, '/');
    
    if (!contextMap[normalized]) {
        return [];
    }

    const contexts: BuildContext[] = [];
    const entry = contextMap[normalized];
    
    if (entry.background) contexts.push('background');
    if (entry.content) contexts.push('content');
    if (entry.ui) contexts.push('ui');
    
    return contexts;
}

/**
 * Loads context map from the builder's persisted format.
 */
export async function loadContextMap(): Promise<BuildContextMapRecord> {
    return readSourceContextMap();
}

/**
 * Fallback function that analyzes decorators for context assignment.
 * Currently a stub that returns an empty array.
 * 
 * In future phases, this will scan the file's AST for:
 * - @Injectable() with context parameter
 * - @Handler() decorators
 * - @Service() decorators  
 * - @Store() decorators
 * 
 * TODO: Implement decorator-based context detection
 */
export async function getDecoratorFallbackContexts(filePath: string): Promise<BuildContext[]> {
    // Stub implementation - decorator analysis deferred to future phases
    const contexts = analyzeDecoratorContexts(filePath);
    return contexts;
}
