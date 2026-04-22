import { TokenDependency } from "../../di/types";

export interface MethodMetadata {
    methodName: string;
    actionName?: string; // For @Action
    eventName?: string;  // For @On
    payloadDtoType?: string;
    responseDtoType?: string;
}

export interface ControllerMetadata {
    className: string;
    namespace: string;
    methods: MethodMetadata[];
    dependencies: string[];
    tokenDependencies: TokenDependency[];
    importPath: string;
    hasOnInit: boolean;
    hasOnDestroy: boolean;
}