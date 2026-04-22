import { BuildContext } from '../build/types';

/**
 * Analyzes a source file for decorator-based context assignment.
 * 
 * Detects context via the following decorators:
 * - @Injectable() with context parameter → determines context (background/content/ui/general)
 * - @Handler() → content context
 * - @Service() → assigned context
 * - @Store() → assigned context
 * 
 * This is a future-phase implementation stub.
 * Currently returns an empty array (fallback unused).
 * 
 * TODO: Implement AST scanning for decorator analysis
 * - Parse file with TypeScript compiler API
 * - Walk ClassDeclaration nodes
 * - Check for decorator names and parameters
 * - Extract context from @Injectable(context: '...')
 * - Return detected contexts
 * 
 * @param filePath - Relative or absolute path to the source file
 * @param program - Optional TypeScript program for AST analysis
 * @returns Array of contexts detected via decorators
 */
export function analyzeDecoratorContexts(filePath: string, program?: any): BuildContext[] {
    // TODO: Implement decorator analysis
    // This stub is called by rebuild-decision as fallback when map entry is missing
    // Return empty array to defer to UI-only rebuild (safe default)
    return [];
}
