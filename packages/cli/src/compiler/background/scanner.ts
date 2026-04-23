// packages/cli/src/compiler/background/scanner.ts
import * as ts from 'typescript';
import { BackgroundEntryMetadata } from './types';
import { findDecorator, hasLifecycleMethod } from '../shared/props.methods';
import { DIScanner } from '../di/scanner';

export class BackgroundScanner {
    constructor(private checker: ts.TypeChecker, private diScanner: DIScanner) { }


    public scan(node: ts.Node): BackgroundEntryMetadata | null {
        if (ts.isClassDeclaration(node) && node.name) {
            const metadata = this.processClass(node);
            if (metadata) {
                return metadata;
            }
        }
        return null;
    }

    private processClass(node: ts.ClassDeclaration): BackgroundEntryMetadata | null {
        // 1. Check if class has @Background decorator
        const background = findDecorator(node, this.checker, 'Background', ['@hexajs/core']);

        if (!background) return null;

        // 3. Extract dependencies from constructor (using shared method)
        const { dependencies, tokenDependencies } = this.diScanner.extractConstructorDeps(node);

        return {
            className: node.name!.text,
            dependencies,
            tokenDependencies,
            importPath: node.getSourceFile().fileName,
            hasOnInit: hasLifecycleMethod(node, 'onInit'),
            hasOnDestroy: hasLifecycleMethod(node, 'onDestroy')
        };
    }

}