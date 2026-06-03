import { describe, expect, it } from 'vitest';
import { StoreGenerator } from '../src/generators/store/generator';
import { MetadataRegistry } from '../src/compiler/registry';
import { StateMetadata } from '../src/compiler/store/types';
import { ReducerMetadata } from '../src/compiler/store/reducer/types';

function makeReducer(overrides: Partial<ReducerMetadata>): ReducerMetadata {
  return { className: 'TestReducer', methods: [], dependencies: [], importPath: 'src/test.ts', hasInitState: false, isAsyncInitState: false, ...overrides };
}

function generateForState(state: StateMetadata) {
  const registry = { getStates: () => [state] } as unknown as MetadataRegistry;
  const generator = new StoreGenerator(registry, '');
  return generator.generate();
}

describe('StoreGenerator - initState branching', () => {
  it('emits .initialState for property-based reducer', () => {
    const state: StateMetadata = {
      context: 'background',
      state: { counter: makeReducer({ className: 'CounterReducer', hasInitState: false, isAsyncInitState: false }) },
      effects: [],
    };
    const [output] = generateForState(state);
    expect(output.content).toContain('.initialState');
    expect(output.content).not.toContain('.initState()');
    expect(output.content).not.toContain('await');
    expect(output.hasAsyncReducers).toBe(false);
  });

  it('emits .initState() without await for sync method reducer', () => {
    const state: StateMetadata = {
      context: 'background',
      state: { counter: makeReducer({ className: 'CounterReducer', hasInitState: true, isAsyncInitState: false }) },
      effects: [],
    };
    const [output] = generateForState(state);
    expect(output.content).toContain('.initState()');
    expect(output.content).not.toContain('await');
    expect(output.hasAsyncReducers).toBe(false);
  });

  it('emits await .initState() for async method reducer', () => {
    const state: StateMetadata = {
      context: 'background',
      state: { config: makeReducer({ className: 'ConfigReducer', hasInitState: true, isAsyncInitState: true }) },
      effects: [],
    };
    const [output] = generateForState(state);
    expect(output.content).toContain('await');
    expect(output.content).toContain('.initState()');
    expect(output.hasAsyncReducers).toBe(true);
  });

  it('wraps content store in initContentStore when async reducer exists', () => {
    const state: StateMetadata = {
      context: 'content',
      state: { clips: makeReducer({ className: 'ClipsReducer', hasInitState: true, isAsyncInitState: true }) },
      effects: [],
    };
    const [output] = generateForState(state);
    expect(output.content).toContain('initContentStore');
    expect(output.content).toContain('await');
    expect(output.hasAsyncReducers).toBe(true);
  });

  it('does not wrap content store when all reducers are sync', () => {
    const state: StateMetadata = {
      context: 'content',
      state: { clips: makeReducer({ className: 'ClipsReducer', hasInitState: true, isAsyncInitState: false }) },
      effects: [],
    };
    const [output] = generateForState(state);
    expect(output.content).not.toContain('initContentStore');
    expect(output.content).toContain('.initState()');
    expect(output.hasAsyncReducers).toBe(false);
  });
});
