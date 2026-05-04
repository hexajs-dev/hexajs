import { describe, expect, it } from 'vitest';
import { map } from 'rxjs';
import { Actions, ActionsSubject, HexaBackgroundStore, HexaContentStore, createReducer, createStore, on, select } from '../src/store';

interface CounterState {
  counter: {
    count: number;
  };
}

interface MultiSliceState {
  counter: {
    count: number;
  };
  flags: {
    enabled: boolean;
  };
}

const counterReducer = createReducer(
  { count: 0 },
  on('counter/increment', (state) => ({ count: state.count + 1 })),
  on('counter/set', (state, action: { type: string; payload: { value: number } }) => ({ count: action.payload.value })),
);

const flagsReducer = createReducer(
  { enabled: false },
  on('flags/toggle', (state) => ({ enabled: !state.enabled })),
);

describe('store context behavior', () => {
  it('HexaBackgroundStore initializes state from reducers', () => {
    const store = new HexaBackgroundStore<CounterState>({ counter: counterReducer });
    let snapshot: CounterState | undefined;

    store.pipe(map((state) => state)).subscribe((state) => {
      snapshot = state;
    });

    expect(snapshot).toEqual({ counter: { count: 0 } });
  });

  it('HexaContentStore initializes state from reducers', () => {
    const store = new HexaContentStore<CounterState>({ counter: counterReducer });
    let snapshot: CounterState | undefined;

    store.pipe(map((state) => state)).subscribe((state) => {
      snapshot = state;
    });

    expect(snapshot).toEqual({ counter: { count: 0 } });
  });

  it('HexaBackgroundStore emits updated state before actions stream notification', () => {
    const actionsSubject = new ActionsSubject();
    const actions$ = new Actions(actionsSubject);
    const store = new HexaBackgroundStore<CounterState>({ counter: counterReducer }, actionsSubject);

    let latestCount = -1;
    let countAtAction = -1;

    store.pipe(select((state) => state.counter.count)).subscribe((count) => {
      latestCount = count;
    });

    actions$.subscribe(() => {
      countAtAction = latestCount;
    });

    store.dispatch({ type: 'counter/increment', payload: undefined });

    expect(latestCount).toBe(1);
    expect(countAtAction).toBe(1);
  });

  it('HexaBackgroundStore publishes dispatched actions even when state does not change', () => {
    const actionsSubject = new ActionsSubject();
    const actions$ = new Actions(actionsSubject);
    const store = new HexaBackgroundStore<CounterState>({ counter: counterReducer }, actionsSubject);
    const observedTypes: string[] = [];

    actions$.subscribe((action) => {
      observedTypes.push(action.type);
    });

    store.dispatch({ type: 'unknown/action', payload: undefined });

    expect(observedTypes).toEqual(['unknown/action']);
  });

  it('HexaContentStore does not emit root state for no-op actions', () => {
    const store = new HexaContentStore<CounterState>({ counter: counterReducer });
    let rootEmissions = 0;

    store.pipe((source) => source).subscribe(() => {
      rootEmissions += 1;
    });

    store.dispatch({ type: 'unknown/action', payload: undefined });

    expect(rootEmissions).toBe(1);
  });

  it('select emits only when selected slice reference changes', () => {
    const store = new HexaContentStore<CounterState>({ counter: counterReducer });
    const selectedValues: number[] = [];

    store.pipe(select((state) => state.counter.count)).subscribe((count) => {
      selectedValues.push(count);
    });

    store.dispatch({ type: 'unknown/action', payload: undefined });
    store.dispatch({ type: 'counter/increment', payload: undefined });
    store.dispatch({ type: 'counter/increment', payload: undefined });

    expect(selectedValues).toEqual([0, 1, 2]);
  });

  it('updates only changed slices in multi-slice stores', () => {
    const store = new HexaBackgroundStore<MultiSliceState>({ counter: counterReducer, flags: flagsReducer });
    const counterValues: number[] = [];
    const flagValues: boolean[] = [];

    store.pipe(select((state) => state.counter.count)).subscribe((count) => {
      counterValues.push(count);
    });

    store.pipe(select((state) => state.flags.enabled)).subscribe((enabled) => {
      flagValues.push(enabled);
    });

    store.dispatch({ type: 'counter/increment', payload: undefined });
    store.dispatch({ type: 'counter/increment', payload: undefined });
    store.dispatch({ type: 'flags/toggle', payload: undefined });

    expect(counterValues).toEqual([0, 1, 2]);
    expect(flagValues).toEqual([false, true]);
  });

  it('createStore helper mirrors store semantics and dispatches reducer updates', () => {
    const store = createStore<CounterState>({ counter: counterReducer });
    let currentCount = -1;

    store.pipe(select((state) => state.counter.count)).subscribe((count) => {
      currentCount = count;
    });

    store.dispatch({ type: 'counter/set', payload: { value: 7 } });

    expect(currentCount).toBe(7);
  });
});
