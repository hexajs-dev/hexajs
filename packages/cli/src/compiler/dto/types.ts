export interface DtoDecoratorMetadata {
    name: string;
    args: unknown[];
}

export interface DtoPropertyMetadata {
    name: string;
    decorators: DtoDecoratorMetadata[];
}

export interface DtoValidationMetadata {
    className: string;
    importPath: string;
    properties: DtoPropertyMetadata[];
    hasIndexSignature: boolean;
}
