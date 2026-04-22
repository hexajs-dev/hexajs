




/**
 * Action type with props
 */
export type HexaAction<T extends string = string> = {
    type: T;
};

export type HexaActionWithPayload<T extends string, P> = HexaAction<T> & {
    payload: P;
};

/**
 * Props creator for actions with payload
 * 
 * @example
 * const setName = createAction(
 *   'SET_NAME',
 *   props<{ name: string }>()
 * );
 * 
 * store.dispatch(setName({ name: 'John' }));
 */
export function props<P>(): P {
    return undefined as any as P;
}

/**
 * Create an action creator with optional props
 * 
 * @example
 * // Action without props
 * const increment = createAction('INCREMENT');
 * store.dispatch(increment());
 * 
 * // Action with props
 * const setScores = createAction(
 *   '[Scoreboard Page] Set Scores',
 *   props<{ game: Game }>()
 * );
 * store.dispatch(setScores({ game: myGame }));
 */
export function createAction<T extends string>(type: T): () => HexaAction<T>;
export function createAction<T extends string, P>(type: T, config: P): (props: P) => HexaActionWithPayload<T, P>;
export function createAction<T extends string, P>(type: T, config?: P): any {
    const hasPropsConfig = arguments.length >= 2;

    if (!hasPropsConfig) {
        // No props version
        return () => ({ type });
    } else {
        // With props version
        return (props: P) => ({ type, payload: props });
    }
}
