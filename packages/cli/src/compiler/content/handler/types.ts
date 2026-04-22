import { TokenDependency, ViewPropertyDependency } from "../../di/types";
import { ViewDependency } from "../view/types";

export interface MethodMetadata {
    methodName: string;
    handleName?: string; // For @handle
    eventName?: string;  // For @On
    payloadDtoType?: string;
    responseDtoType?: string;
}

export interface HandlerMetadata {
    className: string;
    namespace: string;
    methods: MethodMetadata[];
    dependencies: string[];
    tokenDependencies: TokenDependency[];
    viewDependencies: ViewDependency[];
    viewPropertyDependencies: ViewPropertyDependency[];
    importPath: string;
    /** Content class names this handler is associated with */
    contents: string[];
    hasOnInit: boolean;
    hasOnDestroy: boolean;
}