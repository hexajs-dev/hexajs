import ts from 'typescript';
import * as path from 'path';
import { DIScanner } from '../../di/scanner';
import { ViewMetadata } from './types';
import { extractProp, getDecoratorName, hasLifecycleMethod } from '../../shared/props.methods';

export class ViewScanner {
  constructor(private checker: ts.TypeChecker, private diScanner: DIScanner) {}

  public scan(node: ts.Node): ViewMetadata | null {
    if (ts.isClassDeclaration(node) && node.name) {
      return this.processClass(node);
    }
    return null;
  }

  private processClass(node: ts.ClassDeclaration): ViewMetadata | null {
    const decorators = ts.getDecorators(node);
    const viewDec = decorators?.find(d => getDecoratorName(d) === 'View');
    if (!viewDec) return null;

    const options = this.extractViewOptions(viewDec, node.getSourceFile());
    if (!options) {
      throw new Error(`@View decorator is missing or has invalid options on class ${node.name!.text}.`);
    }

    const { dependencies, tokenDependencies } = this.diScanner.extractConstructorDeps(node);
    const viewPropertyDependencies = this.diScanner.extractViewPropertyDeps(node);
    const extendsHexaView = this.checkExtendsHexaView(node);

    return {
      className: node.name!.text,
      importPath: node.getSourceFile().fileName,
      id: options.id,
      componentImportPath: options.componentImportPath,
      componentExportName: options.componentExportName,
      stylesImportPath: options.stylesImportPath,
      stylesExportName: options.stylesExportName,
      anchorSelector: options.anchorSelector,
      dependencies,
      tokenDependencies,
      viewDependencies: [],
      viewPropertyDependencies,
      extendsHexaView,
      hasOnInit: hasLifecycleMethod(node, 'onInit'),
      hasOnDestroy: hasLifecycleMethod(node, 'onDestroy'),
    };
  }

  private checkExtendsHexaView(node: ts.ClassDeclaration): boolean {
    if (!node.heritageClauses) return false;

    for (const clause of node.heritageClauses) {
      if (clause.token !== ts.SyntaxKind.ExtendsKeyword) continue;

      for (const typeExpr of clause.types) {
        const exprText = typeExpr.expression.getText();
        if (exprText === 'HexaView') return true;

        const sym = this.checker.getSymbolAtLocation(typeExpr.expression);
        if (!sym) continue;
        const realSym = (sym.flags & ts.SymbolFlags.Alias) ? this.checker.getAliasedSymbol(sym) : sym;
        if (realSym.getName() === 'HexaView') return true;
      }
    }

    return false;
  }

  private extractViewOptions(decorator: ts.Decorator, sourceFile: ts.SourceFile): {
    id: string;
    componentImportPath: string;
    componentExportName: string;
    stylesImportPath?: string;
    stylesExportName?: string;
    anchorSelector?: string;
  } | null {
    const expression = decorator.expression;
    if (!ts.isCallExpression(expression) || expression.arguments.length === 0) return null;

    const arg = expression.arguments[0];
    if (!ts.isObjectLiteralExpression(arg)) return null;

    const find = (name: string) => arg.properties.find(p => p.name?.getText() === name);

    const idProp = find('id');
    const componentProp = find('component');
    const stylesProp = find('styles');
    const anchorProp = find('anchorSelector');

    const id = idProp ? extractProp(this.checker, idProp) : undefined;
    if (!id || typeof id !== 'string') {
      throw new Error('@View: "id" must be a string.');
    }

    if (!componentProp) {
      throw new Error('@View: "component" is required.');
    }

    const componentExpr = this.getPropertyExpression(componentProp);
    if (!componentExpr) {
      throw new Error(`@View: "component" must be a property assignment or shorthand identifier.`);
    }

    const componentInfo = this.resolveImportedIdentifier(componentExpr, sourceFile);
    if (!componentInfo) {
      throw new Error(`@View: "component" must be an imported identifier. Could not resolve "${componentExpr.getText()}".`);
    }

    let stylesInfo: { importPath: string; exportName: string } | undefined;
    if (stylesProp) {
      const stylesExpr = this.getPropertyExpression(stylesProp);
      stylesInfo = stylesExpr ? this.resolveImportedIdentifier(stylesExpr, sourceFile) ?? undefined : undefined;
      if (!stylesInfo) {
        throw new Error(`@View: "styles" must be an imported identifier. Could not resolve "${stylesExpr ? stylesExpr.getText() : stylesProp.getText()}".`);
      }
    }

    const anchorSelector = anchorProp ? extractProp(this.checker, anchorProp) : undefined;
    if (anchorSelector !== undefined && typeof anchorSelector !== 'string') {
      throw new Error('@View: "anchorSelector" must be a string.');
    }

    return {
      id,
      componentImportPath: componentInfo.importPath,
      componentExportName: componentInfo.exportName,
      stylesImportPath: stylesInfo?.importPath,
      stylesExportName: stylesInfo?.exportName,
      anchorSelector,
    };
  }

  /**
   * Resolve an identifier expression to its import declaration source.
   * Returns the module specifier and the export name.
   */
  private resolveImportedIdentifier(expr: ts.Expression, sourceFile: ts.SourceFile): { importPath: string; exportName: string } | null {
    if (!ts.isIdentifier(expr)) return null;

    let sym = this.checker.getSymbolAtLocation(expr);
    if (!sym) return null;

    const shorthandDecl = sym.getDeclarations()?.find(ts.isShorthandPropertyAssignment);
    if (shorthandDecl) {
      const shorthandValueSym = this.checker.getShorthandAssignmentValueSymbol(shorthandDecl);
      if (shorthandValueSym) {
        sym = shorthandValueSym;
      }
    }

    const realSym = (sym.flags & ts.SymbolFlags.Alias) ? this.checker.getAliasedSymbol(sym) : sym;
    const decls = [
      ...(sym.getDeclarations() || []),
      ...(realSym.getDeclarations() || [])
    ];

    for (const decl of decls) {
      // import { Foo } from './bar' → ImportSpecifier
      if (ts.isImportSpecifier(decl)) {
        const importDecl = decl.parent.parent.parent;
        if (ts.isImportDeclaration(importDecl) && ts.isStringLiteral(importDecl.moduleSpecifier)) {
          const exportName = decl.propertyName?.text ?? decl.name.text;
          return { importPath: this.resolveImportPath(sourceFile, importDecl.moduleSpecifier.text), exportName };
        }
      }

      // import Foo from './bar' → ImportClause (default import)
      if (ts.isImportClause(decl)) {
        const importDecl = decl.parent;
        if (ts.isImportDeclaration(importDecl) && ts.isStringLiteral(importDecl.moduleSpecifier)) {
          return { importPath: this.resolveImportPath(sourceFile, importDecl.moduleSpecifier.text), exportName: 'default' };
        }
      }

      // import * as Foo from './bar' → NamespaceImport
      if (ts.isNamespaceImport(decl)) {
        const importDecl = decl.parent.parent;
        if (ts.isImportDeclaration(importDecl) && ts.isStringLiteral(importDecl.moduleSpecifier)) {
          return { importPath: this.resolveImportPath(sourceFile, importDecl.moduleSpecifier.text), exportName: '*' };
        }
      }
    }

    return null;
  }

  private resolveImportPath(sourceFile: ts.SourceFile, moduleSpecifier: string): string {
    if (!moduleSpecifier.startsWith('.')) {
      return moduleSpecifier;
    }

    const [basePath, query] = moduleSpecifier.split('?');
    const absoluteBasePath = path.resolve(path.dirname(sourceFile.fileName), basePath);
    return query ? `${absoluteBasePath}?${query}` : absoluteBasePath;
  }

  private getPropertyExpression(prop: ts.ObjectLiteralElementLike): ts.Expression | null {
    if (ts.isPropertyAssignment(prop)) {
      return prop.initializer;
    }

    if (ts.isShorthandPropertyAssignment(prop)) {
      return prop.name;
    }

    return null;
  }
}
