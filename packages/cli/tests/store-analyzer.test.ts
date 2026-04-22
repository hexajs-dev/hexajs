import { describe, expect, it } from 'vitest';
import { StoreAnalyzer } from '../src/analyzer/store/analyzer';
import { HexaContext, ServiceMetadata } from '../src/compiler/di/types';
import { StateMetadata } from '../src/compiler/store/types';

describe('StoreAnalyzer', () => {
  it('reports an analysis error when the same reducer class is used by multiple state properties', () => {
    const state: StateMetadata = {
      context: 'content',
      state: {
        clips: {
          className: 'ContentClipsReducer',
          importPath: 'src/content/store/content.reducer.ts',
          methods: [],
          dependencies: [],
        },
        filteredClips: {
          className: 'ContentClipsReducer',
          importPath: 'src/content/store/content.reducer.ts',
          methods: [],
          dependencies: [],
        },
      },
      effects: [],
    };

    const states = new Map<string, StateMetadata>([['content', state]]);
    const services = new Map<string, ServiceMetadata>();

    const analyzer = new StoreAnalyzer(states, services);
    const result = analyzer.analyze();

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('duplicate-reducer-usage');
    expect(result.errors[0].className).toBe('ContentClipsReducer');
    expect(result.errors[0].context).toBe(HexaContext.Content);
    expect(result.errors[0].message).toContain('clips');
    expect(result.errors[0].message).toContain('filteredClips');
  });
});
