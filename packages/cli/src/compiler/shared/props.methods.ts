import ts from "typescript";


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
    const expression = decorator.expression;
    if (ts.isCallExpression(expression)) {
        return expression.expression.getText();
    }
    return expression.getText();
}


// Helper to extract the string argument from a decorator
export const getDecoratorArgument = (node: ts.Node, decoratorName: string, checker?: ts.TypeChecker): string | null => {
    const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
    if (!decorators) return null;

    const decorator = decorators.find(d =>
        d.expression.getText().startsWith(decoratorName)
    );

    if (decorator && ts.isCallExpression(decorator.expression)) {
        const arg = decorator.expression.arguments[0];
        if (arg && ts.isStringLiteral(arg)) {
            return arg.text;
        }
        if (arg && checker) {
            const value = evalNode(checker, arg as ts.Expression);
            if (typeof value === 'string') return value;
        }
    }
    return null;
}

export const getDecorator = (node: ts.Node, decoratorName: string): ts.Decorator | null => {
    const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
    if (!decorators) return null;
    const decorator = decorators.find(d =>
        d.expression.getText().startsWith(decoratorName)
    );
    return decorator || null;
}

export const hasLifecycleMethod = (node: ts.ClassDeclaration, methodName: 'onInit' | 'onDestroy'): boolean => {
    return node.members.some(member => ts.isMethodDeclaration(member) && member.name.getText() === methodName);
}