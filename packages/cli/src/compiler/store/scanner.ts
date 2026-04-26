import ts from "typescript";
import { DIScanner } from "../di/scanner";
import { EffectClassRef, StateMetadata } from "./types";
import { extractProp, getDecorator } from "../shared/props.methods";
import { ReducerScanner } from "./reducer/scanner";
import { ReducerMetadata } from "./reducer/types";




export class StoreScanner {
    private reducerScanner: ReducerScanner;

    constructor(private checker: ts.TypeChecker, private diScanner: DIScanner) {
        this.reducerScanner = new ReducerScanner(checker, diScanner);
    }


    public scan(node: ts.Node): StateMetadata | null {
        if (ts.isClassDeclaration(node) && node.name) {
            const metadata = this.processStore(node);
            if (metadata) { 
                return metadata;
            }
        }
        return null;
    }

    processStore(node: ts.ClassDeclaration): StateMetadata | null {
        const stateDecorator = getDecorator(node, this.checker, 'State', ['@hexajs-dev/core']);
        if (!stateDecorator) return null;

        // Extract decorator options (context and state object)
        const expression = stateDecorator.expression;
        if (!ts.isCallExpression(expression) || expression.arguments.length === 0) {
            throw new Error('@State decorator must have options argument');
        }

        const optionsArg = expression.arguments[0];
        if (!ts.isObjectLiteralExpression(optionsArg)) {
            throw new Error('@State decorator options must be an object literal');
        }

        // Extract context
        const contextProp = optionsArg.properties.find(
            p => ts.isPropertyAssignment(p) && p.name?.getText() === 'context'
        ) as ts.PropertyAssignment | undefined;

        if (!contextProp || !contextProp.initializer) {
            throw new Error('@State decorator must have a "context" property');
        }

        const context = extractProp(this.checker, contextProp);

        // Extract state object
        const stateProp = optionsArg.properties.find(
            p => ts.isPropertyAssignment(p) && p.name?.getText() === 'state'
        ) as ts.PropertyAssignment | undefined;

        if (!stateProp || !ts.isObjectLiteralExpression(stateProp.initializer)) {
            throw new Error('@State decorator must have a "state" property with an object literal');
        }

        const stateObject = stateProp.initializer;
        const reducers: { [feature: string]: ReducerMetadata } = {};

        // Iterate through each reducer in the state object
        stateObject.properties.forEach(prop => {
            if (ts.isPropertyAssignment(prop)) {
                const featureName = prop.name.getText();
                const reducerClassRef = prop.initializer;

                // Resolve the reducer class symbol
                const symbol = this.checker.getSymbolAtLocation(reducerClassRef);
                if (!symbol) {
                    throw new Error(`Cannot resolve reducer class for feature "${featureName}"`);
                }

                // Resolve aliases (for imported symbols)
                const actualSymbol = symbol.flags & ts.SymbolFlags.Alias 
                    ? this.checker.getAliasedSymbol(symbol) 
                    : symbol;

                // Get the class declaration
                const declaration = actualSymbol.valueDeclaration || actualSymbol.declarations?.[0];
                if (!declaration || !ts.isClassDeclaration(declaration)) {
                    throw new Error(`Feature "${featureName}" must reference a class, got ${declaration ? ts.SyntaxKind[declaration.kind] : 'undefined'}`);
                }

                // Use ReducerScanner to scan the reducer class
                const reducerMetadata = this.reducerScanner.processClass(declaration);
                if (!reducerMetadata) {
                    throw new Error(`Feature "${featureName}" class must have @Reducer decorator`);
                }

                reducers[featureName] = reducerMetadata;
            }
        });

        // Extract effects array (optional)
        const effects = this.extractEffects(optionsArg);

        return {
            context,
            state: reducers,
            effects
        };
    }

    private extractEffects(optionsArg: ts.ObjectLiteralExpression): EffectClassRef[] {
        const effectsProp = optionsArg.properties.find(
            p => ts.isPropertyAssignment(p) && p.name?.getText() === 'effects'
        ) as ts.PropertyAssignment | undefined;

        if (!effectsProp || !ts.isArrayLiteralExpression(effectsProp.initializer)) {
            return [];
        }

        const effects: EffectClassRef[] = [];

        effectsProp.initializer.elements.forEach(element => {
            const symbol = this.checker.getSymbolAtLocation(element);
            if (!symbol) {
                throw new Error(`Cannot resolve effect class reference in effects array`);
            }

            const actualSymbol = symbol.flags & ts.SymbolFlags.Alias
                ? this.checker.getAliasedSymbol(symbol)
                : symbol;

            const declaration = actualSymbol.valueDeclaration || actualSymbol.declarations?.[0];
            if (!declaration || !ts.isClassDeclaration(declaration)) {
                throw new Error(`Effects array must contain class references, got ${declaration ? ts.SyntaxKind[declaration.kind] : 'undefined'}`);
            }

            effects.push({
                className: declaration.name?.getText() || element.getText(),
                importPath: declaration.getSourceFile().fileName,
            });
        });

        return effects;
    }
}