import { HexaAction, HexaActionWithPayload } from "./action.abstract";

/**
 * Represents a reducer handler for a specific action type
 */
interface OnHandler<T, P = void> {
    actionType: string;
    on: (state: T, action: HexaActionWithPayload<string, P>) => T;
}

/**
 * Creates an action-reducer pair that maps an action to a reducer function
 * 
 * @example
 * on('INCREMENT', (state, action) => ({ count: state.count + 1 }))
 * on('SET_NAME', (state, action) => ({ ...state, name: action.payload.name }))
 */
export function on<T, P = void>(actionType: string, 
    handler: (state: T, action: HexaActionWithPayload<string, P>) => T): OnHandler<T, P> {
    return {
        actionType,
        on: handler,
    };
}

/**
 * Creates a reducer function from an initial state and one or more action handlers
 * 
 * @example
 * const counterReducer = createReducer(
 *   { count: 0 },
 *   on('INCREMENT', (state) => ({ count: state.count + 1 })),
 *   on('SET_VALUE', (state, action) => ({ count: action.payload.value }))
 * );
 */
export function createReducer<T>(initialState: T,
    ...handlers: OnHandler<T, any>[]): (state: T | undefined, action: HexaAction | HexaActionWithPayload<string, any>) => T {
    // Create a map for O(1) lookup of handlers by action type
    const handlerMap = new Map<string, (state: T, action: any) => T>();

    for (const handler of handlers) {
        handlerMap.set(handler.actionType, handler.on);
    }

    return (state: T | undefined = initialState, action: HexaAction | HexaActionWithPayload<string, any>): T => {
        const handler = handlerMap.get(action.type);

        if (handler) {
            return handler(state, action);
        }

        return state;
    };
}


export abstract class HexaReducer<T> {
  initialState?: T;
  initState?(): T | Promise<T>;
}





















