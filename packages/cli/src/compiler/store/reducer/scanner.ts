import ts from "typescript";
import { DIScanner } from "../../di/scanner";
import { ReduceMetadata, ReducerMetadata } from "./types";
import { findDecorator, getDecorator } from "../../shared/props.methods";


export class ReducerScanner {
        constructor(private checker: ts.TypeChecker, private diScanner: DIScanner) { }
    
    
        public scan(node: ts.Node): ReducerMetadata | null {
            if (ts.isClassDeclaration(node) && node.name) {
                const metadata = this.processClass(node);
                if (metadata) {
                    return metadata;
                }
            }
            return null;
        }
    
            processClass(node: ts.ClassDeclaration): ReducerMetadata | null {
        // 1. Check if class has @Background decorator
        const reducer = findDecorator(node, this.checker, 'Reducer', ['@hexajs-dev/core']);

        if (!reducer) return null;
        const methods: ReduceMetadata[] = [];

        // 2. Iterate over class members
        node.members.forEach(member => {
            if (ts.isMethodDeclaration(member)) {
                const methodName = member.name.getText();

                const decorator = getDecorator(member, this.checker, 'Reduce', ['@hexajs-dev/core']);
                if (decorator) {
                    const actionName = this.extractOptions(decorator);
                    if (!actionName) {
                        throw new Error(`@Reduce decorator on method '${methodName}' must have a valid action type`);
                    }
                    methods.push({
                        methodName,
                        reduce: actionName
                    });
                }
            }
        });

        // Check for initState method and determine if it's async via return type
        let hasInitState = false;
        let isAsyncInitState = false;
        const initStateMethod = node.members.find(member =>
            ts.isMethodDeclaration(member) && member.name.getText() === 'initState'
        ) as ts.MethodDeclaration | undefined;

        if (initStateMethod) {
            hasInitState = true;
            const sig = this.checker.getSignatureFromDeclaration(initStateMethod);
            if (sig) {
                const returnType = this.checker.getReturnTypeOfSignature(sig);
                const types = returnType.isUnion() ? returnType.types : [returnType];
                isAsyncInitState = types.some(t => !!t.getProperty('then'));
            }
        }

        // Check for initialState property
        const hasInitialState = node.members.some(member =>
            ts.isPropertyDeclaration(member) && member.name.getText() === 'initialState'
        );

        if (hasInitState && hasInitialState) {
            throw new Error(`Reducer "${node.name?.getText()}" defines both initialState and initState(). Use one or the other.`);
        }

        if (!hasInitState && !hasInitialState) {
            throw new Error(`Reducer "${node.name?.getText()}" must define either initialState or initState().`);
        }

        // 3. Extract dependencies from constructor
        const dependencies: string[] = [];
        const constructor = node.members.find(ts.isConstructorDeclaration);

        if (constructor) {
            for (const param of constructor.parameters) {
                // Use TypeChecker to find the name of the class type
                const type = this.checker.getTypeAtLocation(param);
                const typeName = this.checker.typeToString(type);
                if (!this.diScanner.isTypeInjectable(type, param.type)) {
                    if (this.diScanner.isFromCorePackage(type, param.type)) {
                        throw new Error(`Dependency ${typeName} from HexaJS package sources is not registered in package metadata. Rebuild @hexajs-dev/core and @hexajs-dev/ports packages.`);
                    }
                    throw new Error(`Dependency ${typeName} does not include @Injectable decorator.`);
                }
                dependencies.push(typeName);
            }
        }

        return {
            dependencies,
            importPath: reducer.getSourceFile().fileName,
            className: node.name?.getText() || 'Unknown',
            methods,
            hasInitState,
            isAsyncInitState
        };
    }


    private extractOptions(decorator: ts.Decorator): string | null {
        const expression = decorator.expression;
        if (ts.isCallExpression(expression) && expression.arguments.length > 0) {
            const arg = expression.arguments[0];
            
            // Handle direct string literals or references (e.g., BackgroundActions.TAB_CLOSED)
            let actionType: any;
            
            if (ts.isStringLiteral(arg)) {
                // Direct string: @Reduce('[Background] Tab Closed')
                actionType = arg.text;
            } else if (ts.isIdentifier(arg) || ts.isPropertyAccessExpression(arg)) {
                // Identifier or property access: @Reduce(TAB_CLOSED) or @Reduce(BackgroundActions.TAB_CLOSED)
                const symbol = this.checker.getSymbolAtLocation(arg);
                if (symbol) {
                    // Resolve aliases (for imported symbols)
                    const actualSymbol = symbol.flags & ts.SymbolFlags.Alias 
                        ? this.checker.getAliasedSymbol(symbol) 
                        : symbol;
                    
                    const decl = actualSymbol.valueDeclaration || actualSymbol.declarations?.[0];
                    if (decl && ts.isVariableDeclaration(decl) && decl.initializer) {
                        if (ts.isStringLiteral(decl.initializer)) {
                            actionType = decl.initializer.text;
                        }
                    }
                }
            }
            
            if (actionType !== undefined && typeof actionType !== 'string') {
                throw new Error('@Reduce: action type must be a string');
            }
            
            return actionType || null;
        }
        return null;
    }
}