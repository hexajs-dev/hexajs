import ts from "typescript";
import { RouteBoundaryPolicyMetadata } from './boundary.types';


export function extractProp(checker: ts.TypeChecker, prop?: ts.ObjectLiteralElementLike): any {
    if (!prop) return undefined;
    if (ts.isPropertyAssignment(prop)) return evalNode(checker, prop.initializer);
    if (ts.isShorthandPropertyAssignment(prop)) {
        const sym = checker.getSymbolAtLocation(prop.name);
        return resolveSymbolValue(checker, sym);
    }
    return undefined;
}

export function evalNode(checker: ts.TypeChecker, node: ts.Expression): any {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isAsExpression(node)) return evalNode(checker, node.expression);
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(e => evalNode(checker, e as ts.Expression));
    if (ts.isObjectLiteralExpression(node)) {
        const out: any = {};
        for (const p of node.properties) {
            if (ts.isPropertyAssignment(p) && p.name) {
                const key = p.name.getText().replace(/^['"]|['"]$/g, "");
                out[key] = evalNode(checker, p.initializer);
            }
        }
        return out;
    }
    if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) {
        const sym = checker.getSymbolAtLocation(node);
        return resolveSymbolValue(checker, sym);
    }
    return undefined;
}

function resolveSymbolValue(checker: ts.TypeChecker, sym?: ts.Symbol): any {
    if (!sym) return undefined;
    const real = (sym.flags & ts.SymbolFlags.Alias) ? checker.getAliasedSymbol(sym) : sym;
    const decl = real.valueDeclaration || real.declarations?.[0];
    if (!decl) return undefined;
    if (ts.isVariableDeclaration(decl) && decl.initializer) return evalNode(checker, decl.initializer as ts.Expression);
    if (ts.isPropertyAssignment(decl)) return evalNode(checker, decl.initializer as ts.Expression);
    if (ts.isEnumMember(decl)) {
        const constVal = checker.getConstantValue(decl as any);
        if (constVal !== undefined) return constVal;
    }
    return undefined;
}


export const getDecoratorName = (decorator: ts.Decorator): string | undefined => {
    const expression = ts.isCallExpression(decorator.expression)
        ? decorator.expression.expression
        : decorator.expression;

    if (ts.isIdentifier(expression)) {
        return expression.text;
    }

    if (ts.isPropertyAccessExpression(expression)) {
        return expression.name.text;
    }

    return undefined;
}

function getDecoratorExpression(decorator: ts.Decorator): ts.Expression {
    return ts.isCallExpression(decorator.expression) ? decorator.expression.expression : decorator.expression;
}

function getImportSourceFromDeclarations(declarations: readonly ts.Declaration[]): string | undefined {
    for (const declaration of declarations) {
        if (ts.isImportSpecifier(declaration)) {
            const importDecl = declaration.parent.parent.parent;
            if (ts.isImportDeclaration(importDecl) && ts.isStringLiteral(importDecl.moduleSpecifier)) {
                return importDecl.moduleSpecifier.text;
            }
        }

        if (ts.isImportClause(declaration)) {
            const importDecl = declaration.parent;
            if (ts.isImportDeclaration(importDecl) && ts.isStringLiteral(importDecl.moduleSpecifier)) {
                return importDecl.moduleSpecifier.text;
            }
        }

        if (ts.isNamespaceImport(declaration)) {
            const importDecl = declaration.parent.parent;
            if (ts.isImportDeclaration(importDecl) && ts.isStringLiteral(importDecl.moduleSpecifier)) {
                return importDecl.moduleSpecifier.text;
            }
        }
    }

    return undefined;
}

function hasExpectedNamedDeclaration(symbol: ts.Symbol, decoratorName: string): boolean {
    const declarations = symbol.getDeclarations() || [];

    return declarations.some(declaration => {
        if (ts.isFunctionDeclaration(declaration) || ts.isMethodDeclaration(declaration) || ts.isClassDeclaration(declaration)) {
            return declaration.name?.getText() === decoratorName;
        }

        return false;
    });
}

export function isDecoratorNamed(decorator: ts.Decorator, checker: ts.TypeChecker, decoratorName: string, allowedImportSources?: readonly string[]): boolean {
    const expression = getDecoratorExpression(decorator);
    const decoratorLocalName = getDecoratorName(decorator);
    const symbol = checker.getSymbolAtLocation(expression);
    if (!symbol) {
        return ts.isIdentifier(expression) && decoratorLocalName === decoratorName;
    }

    const resolvedSymbol = (symbol.flags & ts.SymbolFlags.Alias) ? checker.getAliasedSymbol(symbol) : symbol;
    const importSource = getImportSourceFromDeclarations(symbol.getDeclarations() || []);
    if (resolvedSymbol.getName() !== decoratorName || (!hasExpectedNamedDeclaration(resolvedSymbol, decoratorName) && importSource)) {
        return false;
    }

    if (allowedImportSources && importSource && !allowedImportSources.includes(importSource)) {
        return false;
    }

    if (!importSource && allowedImportSources && ts.isPropertyAccessExpression(expression)) {
        const namespaceSymbol = checker.getSymbolAtLocation(expression.expression);
        if (namespaceSymbol) {
            const namespaceImportSource = getImportSourceFromDeclarations(namespaceSymbol.getDeclarations() || []);
            if (namespaceImportSource && !allowedImportSources.includes(namespaceImportSource)) {
                return false;
            }
        }
    }

    return decoratorLocalName === decoratorName;
}

export function findDecorator(node: ts.Node, checker: ts.TypeChecker, decoratorName: string, allowedImportSources?: readonly string[]): ts.Decorator | null {
    const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
    if (!decorators) return null;

    return decorators.find(decorator => isDecoratorNamed(decorator, checker, decoratorName, allowedImportSources)) || null;
}


// Helper to extract the string argument from a decorator
export const getDecoratorArgument = (node: ts.Node, decoratorName: string, checker: ts.TypeChecker, allowedImportSources?: readonly string[]): string | null => {
    const decorator = findDecorator(node, checker, decoratorName, allowedImportSources);

    if (decorator && ts.isCallExpression(decorator.expression)) {
        const arg = decorator.expression.arguments[0];
        if (arg && ts.isStringLiteral(arg)) {
            return arg.text;
        }
        if (arg) {
            const value = evalNode(checker, arg as ts.Expression);
            if (typeof value === 'string') return value;
        }
    }
    return null;
}

export const getDecorator = (node: ts.Node, checker: ts.TypeChecker, decoratorName: string, allowedImportSources?: readonly string[]): ts.Decorator | null => {
    return findDecorator(node, checker, decoratorName, allowedImportSources);
}

function normalizeStringList(value: unknown, decoratorName: string, propertyName: 'ids' | 'origins'): string[] | undefined {
    if (typeof value === 'undefined') {
        return undefined;
    }

    if (!Array.isArray(value) || !value.every(item => typeof item === 'string')) {
        throw new Error(`HexaJS Build Error: @${decoratorName} option "${propertyName}" must be a string[].`);
    }

    const normalized = Array.from(new Set(value.map(item => item.trim()).filter(item => item.length > 0)));
    return normalized.length > 0 ? normalized : undefined;
}

export function getBoundaryPolicyFromDecorators(node: ts.Node, checker: ts.TypeChecker, allowedImportSources: readonly string[] = ['@hexajs-dev/common']): RouteBoundaryPolicyMetadata | null {
    const allowExternalDecorator = findDecorator(node, checker, 'AllowExternal', allowedImportSources);
    const internalOnlyDecorator = findDecorator(node, checker, 'InternalOnly', allowedImportSources);

    if (allowExternalDecorator && internalOnlyDecorator) {
        throw new Error('HexaJS Build Error: @AllowExternal and @InternalOnly cannot be used together on the same target.');
    }

    if (internalOnlyDecorator) {
        return { mode: 'internal-only' };
    }

    if (!allowExternalDecorator) {
        return null;
    }

    if (!ts.isCallExpression(allowExternalDecorator.expression)) {
        throw new Error('HexaJS Build Error: @AllowExternal must be used as @AllowExternal().');
    }

    if (allowExternalDecorator.expression.arguments.length === 0) {
        return { mode: 'allow-external' };
    }

    const optionsArg = allowExternalDecorator.expression.arguments[0];
    const resolved = evalNode(checker, optionsArg as ts.Expression);
    if (!resolved || typeof resolved !== 'object' || Array.isArray(resolved)) {
        throw new Error('HexaJS Build Error: @AllowExternal options must be a statically analyzable object literal.');
    }

    const options = resolved as { ids?: unknown; origins?: unknown };
    const ids = normalizeStringList(options.ids, 'AllowExternal', 'ids');
    const origins = normalizeStringList(options.origins, 'AllowExternal', 'origins');

    return {
        mode: 'allow-external',
        ...(ids ? { ids } : {}),
        ...(origins ? { origins } : {}),
    };
}

export const hasLifecycleMethod = (node: ts.ClassDeclaration, methodName: 'onInit' | 'onDestroy'): boolean => {
    return node.members.some(member => ts.isMethodDeclaration(member) && member.name.getText() === methodName);
}