import ts from 'typescript';
import { getDecoratorName } from '../shared/props.methods';
import { DtoDecoratorMetadata, DtoPropertyMetadata, DtoValidationMetadata } from './types';

const SUPPORTED_DECORATORS = new Set<string>([
    'IsDefined', 'IsOptional', 'Equals', 'NotEquals', 'IsEmpty', 'IsNotEmpty', 'IsIn', 'IsNotIn',
    'IsBoolean', 'IsString', 'IsNumber', 'IsInt', 'IsArray', 'IsEnum', 'IsObject',
    'IsEmail', 'IsUrl', 'IsUUID', 'IsJSON', 'IsLowercase', 'IsUppercase', 'Length', 'MinLength', 'MaxLength', 'Matches',
    'Min', 'Max', 'IsPositive', 'IsNegative',
    'IsDateString', 'ValidateNested'
]);

export class DtoScanner {
    constructor(private checker: ts.TypeChecker) { }

    public scan(node: ts.Node): DtoValidationMetadata | null {
        if (!ts.isClassDeclaration(node) || !node.name) {
            return null;
        }

        const properties: DtoPropertyMetadata[] = [];
        const hasIndexSignature = node.members.some(member => ts.isIndexSignatureDeclaration(member));

        node.members.forEach(member => {
            if (!ts.isPropertyDeclaration(member) || !member.name) {
                return;
            }

            const decorators = ts.canHaveDecorators(member) ? ts.getDecorators(member) : undefined;
            if (!decorators || decorators.length === 0) {
                return;
            }

            const mapped = decorators
                .map(d => this.toDecoratorMetadata(d))
                .filter((d): d is DtoDecoratorMetadata => !!d && SUPPORTED_DECORATORS.has(d.name));

            if (mapped.length === 0) {
                return;
            }

            properties.push({
                name: member.name.getText(),
                decorators: mapped
            });
        });

        if (properties.length === 0) {
            return null;
        }

        return {
            className: node.name.text,
            importPath: node.getSourceFile().fileName,
            properties,
            hasIndexSignature
        };
    }

    private toDecoratorMetadata(decorator: ts.Decorator): DtoDecoratorMetadata | null {
        const name = getDecoratorName(decorator);
        if (!name) {
            return null;
        }

        if (ts.isCallExpression(decorator.expression)) {
            return {
                name,
                args: decorator.expression.arguments.map(arg => this.parseArg(arg))
            };
        }

        return {
            name,
            args: []
        };
    }

    private parseArg(arg: ts.Expression): unknown {
        if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) return arg.text;
        if (ts.isNumericLiteral(arg)) return Number(arg.text);
        if (arg.kind === ts.SyntaxKind.TrueKeyword) return true;
        if (arg.kind === ts.SyntaxKind.FalseKeyword) return false;
        if (ts.isArrayLiteralExpression(arg)) return arg.elements.map(element => this.parseArg(element as ts.Expression));
        if (ts.isRegularExpressionLiteral(arg)) return arg.text;
        if (ts.isObjectLiteralExpression(arg)) {
            const out: Record<string, unknown> = {};
            arg.properties.forEach(prop => {
                if (ts.isPropertyAssignment(prop)) {
                    out[prop.name.getText().replace(/^['"]|['"]$/g, '')] = this.parseArg(prop.initializer);
                }
            });
            return out;
        }

        if (ts.isIdentifier(arg) || ts.isPropertyAccessExpression(arg)) {
            const symbol = this.checker.getSymbolAtLocation(arg);
            if (!symbol) return arg.getText();
            const resolved = (symbol.flags & ts.SymbolFlags.Alias) ? this.checker.getAliasedSymbol(symbol) : symbol;
            const decl = resolved.valueDeclaration || resolved.declarations?.[0];
            if (decl && ts.isVariableDeclaration(decl) && decl.initializer) {
                return this.parseArg(decl.initializer as ts.Expression);
            }
            return arg.getText();
        }

        return arg.getText();
    }
}
