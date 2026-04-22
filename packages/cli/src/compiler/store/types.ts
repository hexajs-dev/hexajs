import { ReducerMetadata } from "./reducer/types";

export interface EffectClassRef {
    className: string;
    importPath: string;
}

export interface StateMetadata {
    context: string;
    state: { [feature: string]: ReducerMetadata };
    effects: EffectClassRef[];
}