import ts from "typescript";
import { HandlerMetadata, MethodMetadata } from "./types";
import { evalNode, getDecoratorArgument, findDecorator, hasLifecycleMethod } from "../../shared/props.methods";


export class HandlerScanner {
    constructor(private checker: ts.TypeChecker, private diScanner: any) { }

    public scan(node: ts.Node): HandlerMetadata | null {
        if (ts.isClassDeclaration(node) && node.name) {
            const metadata = this.processClass(node);
            if (metadata) {
                return metadata;
            }
        }
        return null;
    }
    processClass(node: ts.ClassDeclaration): HandlerMetadata | null {
        const handlerOptions = this.getHandlerOptions(node);
        if (!handlerOptions) return null;
        if (!node.name) return null;
        
        const { namespace, contents } = handlerOptions;
        const methods: MethodMetadata[] = [];

        // 2. Iterate over class members
        node.members.forEach(member => {
            if (ts.isMethodDeclaration(member)) {
                const methodName = member.name.getText();

                // Check for @handle
                const handleName = getDecoratorArgument(member, 'Handle', this.checker, ['@hexajs/core']);
                if (handleName) {
                    const payloadDtoType = this.getFirstPayloadDtoType(member);
                    const responseDtoType = this.getResponseDtoType(member);
                    methods.push({
                        methodName,
                        handleName: `${namespace}:${handleName}`, // Combine for unique key
                        payloadDtoType,
                        responseDtoType
                    });
                }

                // Check for @On
                const eventName = getDecoratorArgument(member, 'Subscribe', this.checker, ['@hexajs/core']);
                if (eventName) {
                    methods.push({
                        methodName,
                        eventName: `${namespace}:${eventName}`
                    });
                }
            }
        });

        // 3. Extract dependencies from constructor (using shared method)
        const { dependencies, tokenDependencies, viewDependencies } = this.diScanner.extractConstructorDeps(node);
        const viewPropertyDependencies = this.diScanner.extractViewPropertyDeps(node);
        
        return {
            dependencies,
            tokenDependencies,
            viewDependencies,
            viewPropertyDependencies,
            importPath: node.getSourceFile().fileName,
            className: node.name.getText(),
            namespace,
            methods,
            contents,
            hasOnInit: hasLifecycleMethod(node, 'onInit'),
            hasOnDestroy: hasLifecycleMethod(node, 'onDestroy')
        };
    }

    /**
     * Extracts Handler decorator options (namespace and contents)
     */
    private getHandlerOptions(node: ts.ClassDeclaration): { namespace: string; contents: string[] } | null {
        const decorator = findDecorator(node, this.checker, 'Handler', ['@hexajs/core']);

        if (decorator && ts.isCallExpression(decorator.expression)) {
            const arg = decorator.expression.arguments[0];
            
            // Handler({ namespace: '...', Contents: [...] })
            if (arg && ts.isObjectLiteralExpression(arg)) {
                let namespace = '';
                const contents: string[] = [];
                
                arg.properties.forEach(prop => {
                    if (ts.isPropertyAssignment(prop)) {
                        const propName = prop.name.getText();
                        
                        if (propName === 'namespace') {
                            if (ts.isStringLiteral(prop.initializer)) {
                                namespace = prop.initializer.text;
                            } else {
                                const value = evalNode(this.checker, prop.initializer);
                                if (typeof value === 'string') namespace = value;
                            }
                        }
                        
                        if (propName === 'Contents' && ts.isArrayLiteralExpression(prop.initializer)) {
                            prop.initializer.elements.forEach(el => {
                                // Handle: Contents: [MyContentClass]
                                if (ts.isIdentifier(el)) {
                                    contents.push(el.getText());
                                }
                            });
                        }
                    }
                });
                
                return namespace ? { namespace, contents } : null;
            }
        }
        return null;
    }

    private getFirstPayloadDtoType(node: ts.MethodDeclaration): string | undefined {
        const firstParam = node.parameters[0];
        if (!firstParam || !firstParam.type || !ts.isTypeReferenceNode(firstParam.type)) {
            return undefined;
        }

        const typeName = firstParam.type.typeName;
        if (ts.isIdentifier(typeName)) {
            return typeName.text;
        }

        return undefined;
    }

    private getResponseDtoType(node: ts.MethodDeclaration): string | undefined {
        if (!node.type || !ts.isTypeReferenceNode(node.type)) {
            return undefined;
        }

        const typeName = node.type.typeName;
        if (ts.isIdentifier(typeName) && typeName.text === 'Promise' && node.type.typeArguments?.length) {
            const promiseType = node.type.typeArguments[0];
            if (ts.isTypeReferenceNode(promiseType) && ts.isIdentifier(promiseType.typeName)) {
                return promiseType.typeName.text;
            }
        }

        if (ts.isIdentifier(typeName)) {
            return typeName.text;
        }

        return undefined;
    }
}