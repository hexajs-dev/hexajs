import { BehaviorSubject, distinctUntilChanged, map, Observable, OperatorFunction } from "rxjs";
import { HexaActionWithPayload } from "./action.abstract";
import { Injectable, InjectableContext } from '@hexajs/common';
import { ActionsSubject } from './actions';

export class HexaStoreAbstract<T> {
    
    private readonly state$: BehaviorSubject<T> = new BehaviorSubject<T>(undefined as unknown as T);
    private reducers: Map<string, (state: any, action: HexaActionWithPayload<string, any>) => any> = new Map();
    private actionsSubject?: ActionsSubject;

    constructor(reducers?: { [K in keyof T]: (state: T[K] | undefined, action: HexaActionWithPayload<string, any>) => T[K] }, actionsSubject?: ActionsSubject) {
        this.actionsSubject = actionsSubject;
        if (reducers) {
            for (const key in reducers) {
                this.addReducer(key as Extract<keyof T, string>, reducers[key as Extract<keyof T, string>]);
            }
            // Initialize state by calling each reducer with undefined
            const initialState = {} as T;
            for (const key in reducers) {
                initialState[key] = reducers[key](undefined, { type: '@@INIT', payload: undefined });
            }
            this.state$.next(initialState);
        }
    }

    pipe<R>(transform: OperatorFunction<T, R>): Observable<R> {
        return this.state$.pipe(transform);
    }

    /**
     * Register a reducer for a specific slice of state
     * @param key The state slice key
     * @param reducer The reducer function
     */
    protected addReducer<K extends keyof T>(key: K, reducer: (state: T[K], action: HexaActionWithPayload<string, any>) => T[K]): void {
        this.reducers.set(key as string, reducer);
    }

    /**
     * Dispatch an action to update state
     * Runs all registered reducers and only emits if state actually changed
     */
    dispatch(action: HexaActionWithPayload<string, any>): void {
        const currentState = this.state$.value;
        let newState = { ...currentState };
        let hasChanged = false;

        // Run each reducer on its slice of state
        this.reducers.forEach((reducer, key) => {
            const oldSlice = (currentState as any)[key];
            const newSlice = reducer(oldSlice, action);
            
            // Only update if the slice actually changed (reference check)
            if (oldSlice !== newSlice) {
                (newState as any)[key] = newSlice;
                hasChanged = true;
            }
        });

        // Only emit if state actually changed
        // This prevents unnecessary emissions at the root level
        if (hasChanged) {
            this.state$.next(newState);
        }

        // Push action to the stream AFTER state emission so effects see current state
        this.actionsSubject?.next(action);
    }
    

}

export function select<T, V>(selector: (state: T) => V) {
  return (source$: Observable<T>): Observable<V> => {
    return source$.pipe(
      // 1. Transform the state using the selector function
      map(selector),
      // 2. Only emit if the selected slice actually changed (reference check)
      distinctUntilChanged()
    );
  };
}

/**
 * Create a store with multiple reducers
 * 
 * @example
 * // Define state interface
 * interface AppState {
 *   counter: { count: number };
 *   user: { name: string };
 * }
 * 
 * // Create reducers
 * const counterReducer = createReducer(
 *   { count: 0 },
 *   on('INCREMENT', (state) => ({ count: state.count + 1 }))
 * );
 * 
 * const userReducer = createReducer(
 *   { name: '' },
 *   on('SET_NAME', (state, action) => ({ name: action.payload }))
 * );
 * 
 * // Create store
 * const store = createStore<AppState>({
 *   counter: counterReducer,
 *   user: userReducer
 * });
 * 
 * // Subscribe to specific slices - no unnecessary emissions!
 * store.pipe(select(state => state.counter.count))
 *   .subscribe(count => console.log('Count:', count));
 * 
 * store.dispatch({ type: 'INCREMENT', payload: undefined });
 */
export function createStore<T extends Record<string, any>>(reducers: 
  { [K in keyof T]: (state: T[K] | undefined, 
    action: HexaActionWithPayload<string, any>) => T[K] }, actionsSubject?: ActionsSubject): HexaStoreAbstract<T> {
  return new HexaStoreAbstract<T>(reducers, actionsSubject);
}

@Injectable({ context: InjectableContext.Background })
export class HexaBackgroundStore<T extends Record<string, any>> extends HexaStoreAbstract<T> {
  constructor(reducers?: { [K in keyof T]: (state: T[K] | undefined, action: HexaActionWithPayload<string, any>) => T[K] }, actionsSubject?: ActionsSubject) {
    super(reducers, actionsSubject);
  }
}

@Injectable({ context: InjectableContext.Content })
export class HexaContentStore<T extends Record<string, any>> extends HexaStoreAbstract<T> {
  constructor(reducers?: { [K in keyof T]: (state: T[K] | undefined, action: HexaActionWithPayload<string, any>) => T[K] }, actionsSubject?: ActionsSubject) {
    super(reducers, actionsSubject);
  }
}