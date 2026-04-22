import ts from "typescript";
import { DIScanner } from "../di/scanner";
import { ContentEntryMetadata, ContentOptions } from "./types";
import { extractProp, getDecoratorName, hasLifecycleMethod } from "../shared/props.methods";


export class ContentScanner {

    constructor(private checker: ts.TypeChecker, private diScanner: DIScanner) { }

    public scan(node: ts.Node): ContentEntryMetadata | null {
        if (ts.isClassDeclaration(node) && node.name) {
            const metadata = this.processClass(node);
            if (metadata) {
                return metadata;
            }
        }
        return null;
    }

    private processClass(node: ts.ClassDeclaration): ContentEntryMetadata | null {
        // 1. Check if class has @Content decorator
        const decorators = ts.getDecorators(node);
        const content = decorators?.find(d => getDecoratorName(d) === 'Content');

        if (!content) return null;

        // 3. Extract dependencies from constructor (using shared method)
        const { dependencies, tokenDependencies, viewDependencies } = this.diScanner.extractConstructorDeps(node);
        const viewPropertyDependencies = this.diScanner.extractViewPropertyDeps(node);
        const options = this.extractOptions(content!);
        if (!options) {
            throw new Error(`@Content decorator is missing or has invalid options.`);
        }
        return {
            className: node.name!.text,
            dependencies,
            tokenDependencies,
            viewDependencies,
            viewPropertyDependencies,
            importPath: node.getSourceFile().fileName,
            options: options!,
            hasOnInit: hasLifecycleMethod(node, 'onInit'),
            hasOnDestroy: hasLifecycleMethod(node, 'onDestroy')
        };
    }

    public extractOptions(decorator: ts.Decorator): ContentOptions | null {
        const expression = decorator.expression;
        if (ts.isCallExpression(expression) && expression.arguments.length > 0) {
            const arg = expression.arguments[0];
            if (ts.isObjectLiteralExpression(arg)) {
                const find = (name: string) => arg.properties.find(p => p.name?.getText() === name);
                const matchesProp = find('matches');
                const runAtProp = find('runAt');
                const allFramesProp = find('allFrames');

                const matches = matchesProp ? extractProp(this.checker, matchesProp) : undefined;
                const runAt = runAtProp ? extractProp(this.checker, runAtProp) : undefined;
                const allFrames = allFramesProp ? extractProp(this.checker, allFramesProp) : undefined;

                if (!matches || !Array.isArray(matches) || !matches.every(m => typeof m === 'string')) {
                    throw new Error('@Content: "matches" must be a string[]');
                }
                if (runAt !== undefined && typeof runAt !== 'string') {
                    throw new Error('@Content: "runAt" must be a string');
                }
                if (allFrames !== undefined && typeof allFrames !== 'boolean') {
                    throw new Error('@Content: "allFrames" must be a boolean');
                }

                return { matches, runAt: runAt as any, allFrames: !!allFrames };
            }
        }
        return null;
    }


}