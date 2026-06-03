export interface ReduceMetadata {
    methodName: string;
    reduce: string; // The action type string (e.g., '[Background] Tab Opened')
}

export interface ReducerMetadata {
    className: string;
    methods: ReduceMetadata[];
    dependencies: string[];
    importPath: string;
    hasInitState: boolean;
    isAsyncInitState: boolean;
}

export type HexaAction<T extends string = string> = {
    type: T;
};

export type HexaActionWithPayload<T extends string, P> = HexaAction<T> & {
    payload: P;
};
