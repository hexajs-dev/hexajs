import ts from "typescript";
import { ControllerMetadata, MethodMetadata } from "./types";
import { evalNode, findDecorator, getBoundaryPolicyFromDecorators, getDecoratorArgument, hasLifecycleMethod } from "../../shared/props.methods";
import { RouteBoundaryPolicyMetadata } from '../../shared/boundary.types';


export class ControllerScanner {
    constructor(private checker: ts.TypeChecker, private diScanner: any) { }

    public scan(node: ts.Node): ControllerMetadata | null {
        if (ts.isClassDeclaration(node) && node.name) {
            const metadata = this.processClass(node);
            if (metadata) {
                return metadata;
            }
        }
        return null;
    }
    processClass(node: ts.ClassDeclaration): ControllerMetadata | null {
        const controllerOptions = this.getControllerOptions(node);
        if (!controllerOptions) return null;
        if (!node.name) return null;
        const { namespace } = controllerOptions;
        const classBoundaryPolicy = getBoundaryPolicyFromDecorators(node, this.checker, ['@hexajs-dev/common']);
        const methods: MethodMetadata[] = [];

        // 2. Iterate over class members
        node.members.forEach(member => {
            if (ts.isMethodDeclaration(member)) {
                const methodName = member.name.getText();

                // Check for @Action
                const actionName = getDecoratorArgument(member, 'Action', this.checker, ['@hexajs-dev/core']);
                if (actionName) {
                    const payloadDtoType = this.getFirstPayloadDtoType(member);
                    const responseDtoType = this.getResponseDtoType(member);
                    const resolvedBoundaryPolicy = this.resolveMethodBoundaryPolicy(member, classBoundaryPolicy);
                    methods.push({
                        methodName,
                        actionName: `${namespace}:${actionName}`, // Combine for unique key
                        payloadDtoType,
                        responseDtoType,
                        boundaryPolicy: resolvedBoundaryPolicy,
                        externalSubscribed: resolvedBoundaryPolicy.mode === 'allow-external'
                    });
                }

                // Check for @On
                const eventName = getDecoratorArgument(member, 'On', this.checker, ['@hexajs-dev/core']);
                if (eventName) {
                    const resolvedBoundaryPolicy = this.resolveMethodBoundaryPolicy(member, classBoundaryPolicy);
                    methods.push({
                        methodName,
                        eventName: `${namespace}:${eventName}`,
                        boundaryPolicy: resolvedBoundaryPolicy,
                        externalSubscribed: resolvedBoundaryPolicy.mode === 'allow-external'
                    });
                }
            }
        });

        // 3. Extract dependencies from constructor (using shared method)
        const { dependencies, tokenDependencies } = this.diScanner.extractConstructorDeps(node);

        return {
            dependencies,
            tokenDependencies,
            importPath: node.getSourceFile().fileName,
            className: node.name.getText(),
            namespace,
            methods,
            hasOnInit: hasLifecycleMethod(node, 'onInit'),
            hasOnDestroy: hasLifecycleMethod(node, 'onDestroy')
        };
    }

    private getControllerOptions(node: ts.ClassDeclaration): { namespace: string } | null {
        const decorator = findDecorator(node, this.checker, 'Controller', ['@hexajs-dev/core']);

        if (decorator && ts.isCallExpression(decorator.expression)) {
            const arg = decorator.expression.arguments[0];

            // Controller({ namespace: '...' })
            if (arg && ts.isObjectLiteralExpression(arg)) {
                let namespace = '';

                arg.properties.forEach(prop => {
                    if (ts.isPropertyAssignment(prop) && prop.name.getText() === 'namespace') {
                        if (ts.isStringLiteral(prop.initializer)) {
                            namespace = prop.initializer.text;
                        } else {
                            const value = evalNode(this.checker, prop.initializer);
                            if (typeof value === 'string') namespace = value;
                        }
                    }
                });

                return namespace ? { namespace } : null;
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

    private resolveMethodBoundaryPolicy(member: ts.MethodDeclaration, classBoundaryPolicy: RouteBoundaryPolicyMetadata | null): RouteBoundaryPolicyMetadata {
        const methodBoundaryPolicy = getBoundaryPolicyFromDecorators(member, this.checker, ['@hexajs-dev/common']);

        if (methodBoundaryPolicy) {
            return methodBoundaryPolicy;
        }

        if (classBoundaryPolicy) {
            return classBoundaryPolicy;
        }

        return { mode: 'internal-only' };
    }


}