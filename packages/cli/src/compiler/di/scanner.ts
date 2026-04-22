
import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import { HexaContext, ServiceMetadata, TokenMetadata, TokenDependency, ViewPropertyDependency } from "./types";
import { ViewDependency } from "../content/view/types";
import { extractProp, getDecoratorName, hasLifecycleMethod } from "../shared/props.methods";

export interface HexaPackageMetadata {
  [className: string]: {
    injectable: true;
    context: string;
  };
}

export class DIScanner {
  private packageMetadata: HexaPackageMetadata = {};

  constructor(private checker: ts.TypeChecker, private debug?: boolean) {
    this.loadPackageMetadata();
  }

  /**
   * Load and merge hexa-metadata.json from HexaJS runtime packages.
   * Resolution order per package:
   * 1) package direct dist subpath from target project (process.cwd())
   * 2) package.json lookup + dist/hexa-metadata.json sibling
   * 3) package root hexa-metadata.json sibling to package.json
   * 4) monorepo workspace fallback: <repo>/packages/<name>/dist/hexa-metadata.json
   */
  private loadPackageMetadata(): void {
    const packageNames: Array<'@hexajs/core' | '@hexajs/ports' | '@hexajs/ui'> = ['@hexajs/core', '@hexajs/ports', '@hexajs/ui'];
    const loadedFrom: string[] = [];

    for (const packageName of packageNames) {
      const metadataCandidates = this.getMetadataCandidates(packageName);

      for (const metadataPath of metadataCandidates) {
        if (!metadataPath || !fs.existsSync(metadataPath)) continue;
        try {
          const content = fs.readFileSync(metadataPath, 'utf-8');
          const parsed = JSON.parse(content) as HexaPackageMetadata;

          for (const [className, metadata] of Object.entries(parsed)) {
            if (this.packageMetadata[className] && this.debug) {
              console.warn(`[DIScanner] Duplicate package metadata class "${className}". Keeping first loaded value.`);
              continue;
            }
            this.packageMetadata[className] = metadata;
          }

          loadedFrom.push(`${packageName}: ${metadataPath}`);
          if (this.debug) {
            console.log(`[DIScanner] Loaded ${packageName} metadata from: ${metadataPath}`);
          }
          break;
        } catch (error) {
          if (this.debug) {
            console.warn(`[DIScanner] Failed to parse metadata at ${metadataPath}:`, error);
          }
        }
      }
    }

    if (loadedFrom.length === 0) {
      if (this.debug) {
        console.warn('[DIScanner] No Hexa package metadata files could be loaded.');
      }
      console.warn('[DIScanner] Could not load Hexa package metadata from any known location.');
      return;
    }

    if (this.debug) {
      console.log('[DIScanner] Loaded package metadata from:', loadedFrom);
    }
  }

  private getMetadataCandidates(packageName: '@hexajs/core' | '@hexajs/ports' | '@hexajs/ui'): string[] {
    const candidates: string[] = [];

    // 1) Direct subpath resolution from the target project root.
    const directFromCwd = this.tryResolve(`${packageName}/dist/hexa-metadata.json`, [process.cwd()]);
    if (directFromCwd) candidates.push(directFromCwd);

    // 2) Resolve package root first, then append dist metadata path.
    const packageJsonFromCwd = this.tryResolve(`${packageName}/package.json`, [process.cwd()]);
    if (packageJsonFromCwd) {
      candidates.push(path.join(path.dirname(packageJsonFromCwd), 'dist', 'hexa-metadata.json'));
      candidates.push(path.join(path.dirname(packageJsonFromCwd), 'hexa-metadata.json'));
    }

    // 4) Monorepo fallback for local development (walk up from cwd).
    const packageDirName = packageName === '@hexajs/core' ? 'core' : packageName === '@hexajs/ports' ? 'ports' : 'ui';
    const workspaceFallback = this.findWorkspacePackageMetadata(process.cwd(), packageDirName);
    if (workspaceFallback) candidates.push(workspaceFallback);

    return Array.from(new Set(candidates));
  }

  private tryResolve(specifier: string, paths?: string[]): string | undefined {
    try {
      return require.resolve(specifier, paths ? { paths } : undefined);
    } catch {
      return undefined;
    }
  }

  private findWorkspacePackageMetadata(startDir: string, packageDirName: string): string | undefined {
    let currentDir = path.resolve(startDir);

    while (true) {
      const workspaceCandidate = path.join(currentDir, 'packages', packageDirName, 'dist', 'hexa-metadata.json');
      if (fs.existsSync(workspaceCandidate)) {
        return workspaceCandidate;
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break;
      currentDir = parentDir;
    }

    return undefined;
  }

  /**
   * Get loaded package metadata for external use (e.g., by Analyzer)
   */
  public getPackageMetadata(): HexaPackageMetadata {
    return this.packageMetadata;
  }

  public scan(node: ts.Node): ServiceMetadata | null {
    if (ts.isClassDeclaration(node) && node.name) {
      const injectableData = this.processClass(node);
      if (injectableData) {
        return injectableData;
      }
    }
    return null;
  }

  private processClass(node: ts.ClassDeclaration): ServiceMetadata | null {
    // 1. Check if class has @Injectable decorator
    const decorators = ts.getDecorators(node);
    const injectable = decorators?.find((d: ts.Decorator) => getDecoratorName(d) === 'Injectable');

    if (!injectable) return null;

    // 2. Extract context from @Injectable({ context: '...' })
    const context = this.extractContext(injectable) || HexaContext.General;

    // 3. Extract dependencies from constructor (using shared method)
    const { dependencies, tokenDependencies, viewDependencies } = this.extractConstructorDeps(node);

    // 4. Extract @InjectView() property dependencies
    const viewPropertyDependencies = this.extractViewPropertyDeps(node);

    return {
      className: node.name!.text,
      context,
      dependencies,
      tokenDependencies,
      viewDependencies,
      viewPropertyDependencies,
      importPath: node.getSourceFile().fileName,
      hasOnInit: hasLifecycleMethod(node, 'onInit'),
      hasOnDestroy: hasLifecycleMethod(node, 'onDestroy')
    };
  }


  public extractContext(decorator: ts.Decorator): any {
    const expression = decorator.expression;
    if (ts.isCallExpression(expression) && expression.arguments.length > 0) {
      const arg = expression.arguments[0];
      if (ts.isObjectLiteralExpression(arg)) {
        const prop = arg.properties.find((p: ts.ObjectLiteralElementLike) => p.name?.getText() === 'context');
        return extractProp(this.checker, prop);
      }
    }
    return null;
  }



  /**
   * Scan a top-level node for a createToken() variable declaration.
   * Detects patterns like: const X = createToken('KEY', defaultValue, InjectableContext.Background)
   */
  public scanToken(node: ts.Node): TokenMetadata | null {
    if (!ts.isVariableStatement(node)) return null;

    for (const decl of node.declarationList.declarations) {
      if (!decl.initializer || !ts.isCallExpression(decl.initializer)) continue;

      const callExpr = decl.initializer;
      const callee = callExpr.expression;

      // Check if it's a createToken() call
      if (!ts.isIdentifier(callee) || callee.text !== 'createToken') continue;

      const args = callExpr.arguments;
      if (args.length < 2) {
        throw new Error(
          `createToken() requires at least 2 arguments (key, value). Found in ${node.getSourceFile().fileName}`
        );
      }

      // Extract key (1st arg — must be a string literal)
      const keyArg = args[0];
      if (!ts.isStringLiteral(keyArg)) {
        throw new Error(
          `createToken() first argument (key) must be a string literal. Found in ${node.getSourceFile().fileName}`
        );
      }
      const key = keyArg.text;

      // Extract defaultValue (2nd arg — must be a static literal)
      const defaultValue = this.resolveExpressionValue(args[1]);
      if (defaultValue === undefined) {
        throw new Error(
          `createToken() second argument (value) must be a literal (string, number, boolean, or null). Found in ${node.getSourceFile().fileName}`
        );
      }

      // Extract context (3rd arg — optional enum member access)
      let context = HexaContext.General;
      if (args.length >= 3) {
        const contextValue = this.resolveExpressionValue(args[2]);
        if (typeof contextValue === 'string') {
          context = this.mapCoreContextToHexaContext(contextValue);
        }
      }

      return { key, defaultValue, context, importPath: node.getSourceFile().fileName };
    }

    return null;
  }

  /**
   * Shared method: extract both class dependencies and token dependencies from a class constructor.
   * Used by all scanners (DI, Controller, Handler, Content, Background).
   */
  public extractConstructorDeps(node: ts.ClassDeclaration): { dependencies: string[]; tokenDependencies: TokenDependency[]; viewDependencies: ViewDependency[] } {
    const dependencies: string[] = [];
    const tokenDependencies: TokenDependency[] = [];
    const viewDependencies: ViewDependency[] = [];
    const constructor = node.members.find(ts.isConstructorDeclaration);

    if (constructor) {
      constructor.parameters.forEach((param: ts.ParameterDeclaration, index: number) => {
        const hasInjectDecorator = this.hasDecoratorNamed(param, 'Inject');
        const hasInjectWorkerDecorator = this.hasDecoratorNamed(param, 'InjectWorker');

        if (hasInjectDecorator && hasInjectWorkerDecorator) {
          throw new Error(
            `Constructor parameter cannot use both @Inject() and @InjectWorker(). [${node.name?.text ?? '<anonymous>'}::${this.getParameterName(param)} in ${node.getSourceFile().fileName}]`
          );
        }

        if (hasInjectWorkerDecorator) {
          dependencies.push(this.getInjectWorkerClassName(node, param));
          return;
        }

        // Check for @Inject decorator on this parameter
        const injectTokenKey = this.getInjectTokenKey(param);

        if (injectTokenKey) {
          tokenDependencies.push({ paramIndex: index, tokenKey: injectTokenKey });
        } else {
          // Regular class dependency
          const type = this.checker.getTypeAtLocation(param);
          const typeSymbol = this.getTypeSymbol(type, param.type);
          const typeName = this.checker.typeToString(type);
          const className = node.name?.text ?? '<anonymous>';
          const fileName = node.getSourceFile().fileName;
          const paramName = this.getParameterName(param);
          if (this.isTypeWorker(type, param.type)) {
            throw new Error(`Worker dependency ${typeName} must use @InjectWorker(). [${className}::${paramName} in ${fileName}]`);
          }
          if (!this.isTypeInjectable(type, param.type)) {
            if (this.isFromCorePackage(type, param.type)) {
              throw new Error(
                `Dependency ${typeName} from HexaJS package sources is not registered in package metadata. Rebuild @hexajs/core and @hexajs/ports packages. [${className}::${paramName} in ${fileName}]`
              );
            }
            if (!typeSymbol) {
              throw new Error(
                `Dependency ${typeName} cannot be resolved to a symbol. This usually means its import/type is unresolved in TypeScript. [${className}::${paramName} in ${fileName}]`
              );
            }
            throw new Error(`Dependency ${typeName} does not include @Injectable decorator. [${className}::${paramName} in ${fileName}]`);
          }
          // Use symbol name (strips generic type params) for DI container resolution
          dependencies.push(typeSymbol!.getName());
        }
      });
    }

    return { dependencies, tokenDependencies, viewDependencies };
  }

  /**
   * Extract @InjectView() property dependencies from class members.
   * Returns an array of { propertyName, viewClassName } for each decorated property.
   */
  public extractViewPropertyDeps(node: ts.ClassDeclaration): ViewPropertyDependency[] {
    const deps: ViewPropertyDependency[] = [];

    for (const member of node.members) {
      if (!ts.isPropertyDeclaration(member) || !member.name) {
        continue;
      }

      if (!this.hasDecoratorNamed(member, 'InjectView')) {
        continue;
      }

      const propertyName = member.name.getText();

      if (!member.type) {
        throw new Error(`@InjectView() property "${propertyName}" must have an explicit type annotation. [${node.name?.text ?? '<anonymous>'} in ${node.getSourceFile().fileName}]`);
      }

      const type = this.checker.getTypeAtLocation(member);
      const typeSymbol = this.getTypeSymbol(type, member.type);

      if (!typeSymbol) {
        const typeName = this.checker.typeToString(type);
        throw new Error(`@InjectView() property "${propertyName}" type "${typeName}" cannot be resolved. [${node.name?.text ?? '<anonymous>'} in ${node.getSourceFile().fileName}]`);
      }

      deps.push({ propertyName, viewClassName: typeSymbol.getName() });
    }

    return deps;
  }

  private getInjectWorkerClassName(node: ts.ClassDeclaration, param: ts.ParameterDeclaration): string {
    if (!param.type) {
      throw new Error(
        `@InjectWorker() requires an explicit worker class type annotation. [${node.name?.text ?? '<anonymous>'}::${this.getParameterName(param)} in ${node.getSourceFile().fileName}]`
      );
    }

    const type = this.checker.getTypeAtLocation(param);
    const typeSymbol = this.getTypeSymbol(type, param.type);
    const typeName = this.checker.typeToString(type);
    const className = node.name?.text ?? '<anonymous>';
    const fileName = node.getSourceFile().fileName;
    const paramName = this.getParameterName(param);

    if (!this.isTypeWorker(type, param.type)) {
      throw new Error(`@InjectWorker() can only be used with classes decorated by @Worker. Found ${typeName}. [${className}::${paramName} in ${fileName}]`);
    }

    if (!typeSymbol) {
      throw new Error(`Worker dependency ${typeName} cannot be resolved to a symbol. [${className}::${paramName} in ${fileName}]`);
    }

    return typeSymbol.getName();
  }

  /**
   * Check if a constructor parameter has an @Inject() decorator and return the token key.
   */
  private getInjectTokenKey(param: ts.ParameterDeclaration): string | null {
    const decorators = this.getNodeDecorators(param);
    if (decorators.length === 0) return null;

    const injectDecorator = decorators.find(d => {
      const rawText = d.expression.getText();
      const expr = this.getDecoratorExpression(d);
      const exprText = expr.getText();

      if (rawText.startsWith('Inject(') || rawText.includes('.Inject(')) return true;
      if (exprText === 'Inject' || exprText.endsWith('.Inject')) return true;

      if (ts.isIdentifier(expr) && expr.text === 'Inject') return true;
      if (ts.isPropertyAccessExpression(expr) && expr.name.getText() === 'Inject') return true;

      const sym = this.checker.getSymbolAtLocation(expr);
      if (!sym) return false;
      const realSym = (sym.flags & ts.SymbolFlags.Alias) ? this.checker.getAliasedSymbol(sym) : sym;
      if (realSym.getName() === 'Inject') return true;

      const decls = realSym.getDeclarations() || [];
      return decls.some((decl: ts.Declaration) => {
        if (!('name' in decl) || !(decl as ts.Declaration & { name?: ts.Node }).name) return false;
        const nameNode = (decl as ts.Declaration & { name?: ts.Node }).name!;
        return nameNode.getText() === 'Inject';
      });
    });
    if (!injectDecorator) return null;

    if (ts.isCallExpression(injectDecorator.expression)) {
      const arg = injectDecorator.expression.arguments[0];
      if (!arg) return null;

      // Case 1: @Inject('TOKEN_KEY') — string literal
      if (ts.isStringLiteral(arg)) {
        return arg.text;
      }

      // Case 2: @Inject(myTokenRef) — identifier referring to a string constant or a createToken() result
      if (ts.isIdentifier(arg)) {
        // Case 2a: identifier resolves to a plain string constant (e.g. const HEXA_PLATFORM = 'HEXA_PLATFORM')
        const resolved = this.resolveExpressionValue(arg);
        if (typeof resolved === 'string') {
          return resolved;
        }

        const tokenSym = this.checker.getSymbolAtLocation(arg);
        if (tokenSym) {
          const realTokenSym = (tokenSym.flags & ts.SymbolFlags.Alias) ? this.checker.getAliasedSymbol(tokenSym) : tokenSym;
          const tokenType = this.checker.getTypeOfSymbolAtLocation(realTokenSym, arg);
          if (tokenType && (tokenType.flags & ts.TypeFlags.StringLiteral) !== 0) {
            const literal = tokenType as ts.StringLiteralType;
            return literal.value;
          }
        }

        const identifierType = this.checker.getTypeAtLocation(arg);
        if (identifierType && (identifierType.flags & ts.TypeFlags.StringLiteral) !== 0) {
          const literal = identifierType as ts.StringLiteralType;
          return literal.value;
        }

        if (arg.text === 'HEXA_PLATFORM' || arg.text === 'HEXA_BUILD_MODE' || arg.text === 'HEXA_DEBUG') {
          return arg.text;
        }

        // Case 2b: identifier refers to a createToken() variable declaration
        const sym = this.checker.getSymbolAtLocation(arg);
        if (sym) {
          const realSym = (sym.flags & ts.SymbolFlags.Alias) ? this.checker.getAliasedSymbol(sym) : sym;
          const decl = realSym.valueDeclaration;
          if (decl && ts.isVariableDeclaration(decl) && decl.initializer && ts.isCallExpression(decl.initializer)) {
            const callExpr = decl.initializer;
            if (ts.isIdentifier(callExpr.expression) && callExpr.expression.text === 'createToken') {
              const keyArg = callExpr.arguments[0];
              if (keyArg && ts.isStringLiteral(keyArg)) {
                return keyArg.text;
              }
            }
          }
        }
      }
    }

    return null;
  }

  private getParameterName(param: ts.ParameterDeclaration): string {
    return ts.isIdentifier(param.name) ? param.name.text : '<param>';
  }

  /**
   * Resolve a TS expression to a static literal value.
   * Returns undefined if the expression cannot be statically resolved.
   */
  private resolveExpressionValue(expr: ts.Expression): string | number | boolean | null | undefined {
    if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return expr.text;
    if (ts.isNumericLiteral(expr)) return Number(expr.text);
    if (expr.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (expr.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (expr.kind === ts.SyntaxKind.NullKeyword) return null;

    // Try to resolve through the type checker (e.g., enum members, const variables)
    const sym = this.checker.getSymbolAtLocation(expr);
    if (sym) {
      const realSym = (sym.flags & ts.SymbolFlags.Alias) ? this.checker.getAliasedSymbol(sym) : sym;
      const decl = realSym.valueDeclaration || realSym.declarations?.[0];
      if (decl) {
        if (ts.isEnumMember(decl)) {
          const constVal = this.checker.getConstantValue(decl as ts.EnumMember);
          if (constVal !== undefined) return constVal as string | number;
        }
        if (ts.isVariableDeclaration(decl) && decl.initializer) {
          return this.resolveExpressionValue(decl.initializer);
        }
      }
    }

    return undefined;
  }

  /**
   * Map InjectableContext enum values (from @hexajs/core) to HexaContext (CLI internal).
   */
  private mapCoreContextToHexaContext(coreContext: string): HexaContext {
    switch (coreContext) {
      case 'content': return HexaContext.Content;
      case 'background': return HexaContext.Background;
      case 'ui': return HexaContext.UI;
      case 'empty':
      default: return HexaContext.General;
    }
  }


  // analyze types
  private getDecoratorExpression(decorator: ts.Decorator): ts.Expression {
    const expr = decorator.expression;
    return ts.isCallExpression(expr) ? expr.expression : expr;
  }

  private isInjectableDecorator(decorator: ts.Decorator): boolean {
    const expr = this.getDecoratorExpression(decorator);

    if (ts.isIdentifier(expr) && expr.text === 'Injectable') return true;
    if (ts.isPropertyAccessExpression(expr) && expr.name.getText() === 'Injectable') return true;

    const symbol = this.checker.getSymbolAtLocation(expr);
    if (!symbol) {
      return false;
    }

    const realSymbol = (symbol.flags & ts.SymbolFlags.Alias) ? this.checker.getAliasedSymbol(symbol) : symbol;
    if (realSymbol.getName() === 'Injectable') return true;

    const decls = realSymbol.getDeclarations() || [];
    return decls.some((d: ts.Declaration) => {
      if (!('name' in d) || !(d as ts.Declaration & { name?: ts.Node }).name) return false;
      const nameNode = (d as ts.Declaration & { name?: ts.Node }).name!;
      return nameNode.getText() === 'Injectable';
    });
  }

  private hasDecoratorNamed(node: ts.Node, name: string): boolean {
    return this.getNodeDecorators(node).some((decorator: ts.Decorator) => {
      const rawText = decorator.expression.getText();
      const expr = this.getDecoratorExpression(decorator);
      const exprText = expr.getText();

      if (rawText.startsWith(`${name}(`) || rawText.includes(`.${name}(`)) return true;
      if (exprText === name || exprText.endsWith(`.${name}`)) return true;

      if (ts.isIdentifier(expr) && expr.text === name) return true;
      if (ts.isPropertyAccessExpression(expr) && expr.name.getText() === name) return true;

      const symbol = this.checker.getSymbolAtLocation(expr);
      if (!symbol) {
        return false;
      }

      const realSymbol = (symbol.flags & ts.SymbolFlags.Alias) ? this.checker.getAliasedSymbol(symbol) : symbol;
      if (realSymbol.getName() === name) return true;

      const decls = realSymbol.getDeclarations() || [];
      return decls.some((decl: ts.Declaration) => {
        if (!('name' in decl) || !(decl as ts.Declaration & { name?: ts.Node }).name) return false;
        const nameNode = (decl as ts.Declaration & { name?: ts.Node }).name!;
        return nameNode.getText() === name;
      });
    });
  }

  private getNodeDecorators(node: ts.Node): readonly ts.Decorator[] {
    const viaApi = ts.canHaveDecorators(node) ? (ts.getDecorators(node) ?? []) : [];
    if (viaApi.length > 0) return viaApi;

    const modifiers = (node as ts.Node & { modifiers?: ts.NodeArray<ts.ModifierLike> }).modifiers;
    if (!modifiers || modifiers.length === 0) return [];

    return modifiers.filter((modifier: ts.ModifierLike): modifier is ts.Decorator => ts.isDecorator(modifier));
  }

  private getCandidateSymbols(type: ts.Type, typeNode?: ts.TypeNode): ts.Symbol[] {
    const symbols: ts.Symbol[] = [];
    const add = (sym?: ts.Symbol) => {
      if (!sym) return;
      if (!symbols.some(existing => existing === sym)) {
        symbols.push(sym);
      }
      if (sym.flags & ts.SymbolFlags.Alias) {
        const aliased = this.checker.getAliasedSymbol(sym);
        if (aliased && !symbols.some(existing => existing === aliased)) {
          symbols.push(aliased);
        }
      }
    };

    add(type.getSymbol());
    add((type as ts.Type & { aliasSymbol?: ts.Symbol }).aliasSymbol);
    add(this.checker.getApparentType(type).getSymbol());

    if (typeNode) {
      if (ts.isTypeReferenceNode(typeNode)) {
        add(this.checker.getSymbolAtLocation(typeNode.typeName));
      }
      add(this.checker.getSymbolAtLocation(typeNode));
    }

    if ((type.flags & ts.TypeFlags.Union) !== 0 || (type.flags & ts.TypeFlags.Intersection) !== 0) {
      const unionOrIntersection = type as ts.UnionOrIntersectionType;
      unionOrIntersection.types.forEach((t: ts.Type) => this.getCandidateSymbols(t).forEach(add));
    }

    const typeRef = type as ts.TypeReference;
    add(typeRef.target?.symbol);

    return symbols;
  }

  private getTypeSymbol(type: ts.Type, typeNode?: ts.TypeNode): ts.Symbol | undefined {
    const candidates = this.getCandidateSymbols(type, typeNode);
    return candidates[0];
  }

  public isTypeInjectable(type: ts.Type, typeNode?: ts.TypeNode): boolean {
    const symbols = this.getCandidateSymbols(type, typeNode);
    if (symbols.length === 0) return false;

    for (const symbol of symbols) {
      const className = symbol.getName();
      if (this.packageMetadata[className]) {
        return true;
      }
    }

    for (const symbol of symbols) {
      const decls = symbol.getDeclarations() || [];
      for (const d of decls) {
        if (ts.isClassDeclaration(d)) {
          const decs = this.getNodeDecorators(d);
          if (decs.some(dec => this.isInjectableDecorator(dec) || this.isWorkerDecorator(dec))) {
            return true;
          }
        }
      }
    }

    return false;
  }

  public isTypeWorker(type: ts.Type, typeNode?: ts.TypeNode): boolean {
    const symbols = this.getCandidateSymbols(type, typeNode);
    if (symbols.length === 0) return false;

    for (const symbol of symbols) {
      const decls = symbol.getDeclarations() || [];
      for (const declaration of decls) {
        if (!ts.isClassDeclaration(declaration)) {
          continue;
        }

        const decorators = this.getNodeDecorators(declaration);
        if (decorators.some((decorator: ts.Decorator) => this.isWorkerDecorator(decorator))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if a type is from a HexaJS package source (core/ports).
   */
  public isFromCorePackage(type: ts.Type, typeNode?: ts.TypeNode): boolean {
    const symbols = this.getCandidateSymbols(type, typeNode);
    if (symbols.length === 0) return false;

    for (const symbol of symbols) {
      const className = symbol.getName();
      const decls = symbol.getDeclarations() || [];
      for (const d of decls) {
        const sourceFile = d.getSourceFile();
        if (sourceFile.fileName.includes('@hexajs/') ||
          sourceFile.fileName.includes('packages/core') ||
          sourceFile.fileName.includes('packages\\core') ||
          sourceFile.fileName.includes('packages/ports') ||
          sourceFile.fileName.includes('packages\\ports')) {
          return !!this.packageMetadata[className];
        }
      }
    }

    return false;
  }

  /**
   * Get the context for a type (Background, Content, or General)
   * Returns null if type is not injectable
   */
  public getTypeContext(type: ts.Type, typeNode?: ts.TypeNode): string | null {
    const symbols = this.getCandidateSymbols(type, typeNode);
    if (symbols.length === 0) return null;

    for (const symbol of symbols) {
      const className = symbol.getName();
      if (this.packageMetadata[className]) {
        return this.packageMetadata[className].context;
      }
    }

    for (const symbol of symbols) {
      const decls = symbol.getDeclarations() || [];
      for (const d of decls) {
        if (ts.isClassDeclaration(d)) {
          const decorators = this.getNodeDecorators(d);
          const injectable = decorators.find(dec => this.isInjectableDecorator(dec));
          if (injectable) {
            return this.extractContext(injectable) || HexaContext.General;
          }

          const worker = decorators.find(dec => this.isWorkerDecorator(dec));
          if (worker) {
            return HexaContext.Background;
          }
        }
      }
    }
    
    return null;
  }

  private isWorkerDecorator(decorator: ts.Decorator): boolean {
    const expression = decorator.expression;

    if (ts.isCallExpression(expression)) {
      const expr = expression.expression;
      if (ts.isIdentifier(expr)) return expr.text === 'Worker';
      if (ts.isPropertyAccessExpression(expr)) return expr.name.getText() === 'Worker';
      return false;
    }

    if (ts.isIdentifier(expression)) return expression.text === 'Worker';
    if (ts.isPropertyAccessExpression(expression)) return expression.name.getText() === 'Worker';
    return false;
  }
}

