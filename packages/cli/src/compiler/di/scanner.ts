
import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { HEXA_METADATA_HMAC_KEY } from "@hexajs/common";
import { HexaContext, ServiceMetadata, TokenMetadata, TokenDependency, ViewPropertyDependency, WorkerPropertyDependency } from "./types";
import { ViewDependency } from "../content/view/types";
import { extractProp, findDecorator, hasLifecycleMethod, isDecoratorNamed } from "../shared/props.methods";

/** Workspace root markers: stop filesystem walk at these files/dirs */
const WORKSPACE_ROOT_MARKERS = ['.git', 'pnpm-workspace.yaml', 'package-lock.json', 'yarn.lock', 'bun.lockb'];

/** Keys that must never appear in untrusted metadata to prevent prototype pollution */
const FORBIDDEN_METADATA_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Accepted context values produced by the generator */
const VALID_CONTEXTS = new Set(['background', 'content', 'ui', 'general', 'empty']);

export interface HexaPackageMetadata {
  [className: string]: {
    injectable: true;
    context: string;
  };
}

export class DIScanner {
  private packageMetadata: HexaPackageMetadata = Object.create(null);

  constructor(private checker: ts.TypeChecker, private debug?: boolean) {
    this.loadPackageMetadata();
  }

  /**
   * Load and merge hexa-metadata.json from HexaJS runtime packages.
   * Resolution order per package:
   * 1) package direct dist subpath from target project (process.cwd())
   * 2) package.json lookup + dist/hexa-metadata.json sibling
   * 3) package root hexa-metadata.json sibling to package.json
   * 4) monorepo workspace fallback: walk up from cwd to the workspace root
   *
   * Each loaded file is signature-verified and schema-validated before use.
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
          const parsed = JSON.parse(content) as unknown;
          const validated = this.verifyAndValidateMetadata(parsed, metadataPath);

          for (const [className, metadata] of Object.entries(validated)) {
            if (Object.prototype.hasOwnProperty.call(this.packageMetadata, className)) {
              throw new Error(
                `[DIScanner] Duplicate package metadata class "${className}" found while loading "${metadataPath}". ` +
                `Package metadata class names must be globally unique across HexaJS runtime packages.`
              );
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
            console.warn(`[DIScanner] Failed to load metadata at ${metadataPath}:`, error);
          }
        }
      }
    }

    if (loadedFrom.length === 0) {
      if (this.debug) {
        console.warn('[DIScanner] No Hexa package metadata files could be loaded.');
        console.warn('[DIScanner] Could not load Hexa package metadata from any known location.');
      }
      return;
    }

    if (this.debug) {
      console.log('[DIScanner] Loaded package metadata from:', loadedFrom);
    }
  }

  /**
   * Verify HMAC signature and validate schema of a parsed metadata file.
   * Throws if the signature is invalid or the structure is not trusted.
   */
  private verifyAndValidateMetadata(parsed: unknown, filePath: string): HexaPackageMetadata {
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error(`[DIScanner] "${filePath}": metadata file must be a JSON object.`);
    }

    const raw = parsed as Record<string, unknown>;

    // ── Signed format: { v, signature, metadata } ────────────────────────────
    if ('v' in raw && 'signature' in raw && 'metadata' in raw) {
      if (typeof raw['signature'] !== 'string') {
        throw new Error(`[DIScanner] "${filePath}": "signature" field must be a string.`);
      }

      const metadataJson = JSON.stringify(raw['metadata']);
      const hmac = crypto.createHmac('sha256', HEXA_METADATA_HMAC_KEY);
      hmac.update(metadataJson, 'utf8');
      const expected = hmac.digest('hex');
      const provided = raw['signature'] as string;

      if (expected.length !== provided.length ||
          !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) {
        throw new Error(
          `[DIScanner] "${filePath}": HMAC signature verification failed. ` +
          `Rebuild @hexajs/core, @hexajs/ports, and @hexajs/ui packages to regenerate signed metadata.`
        );
      }

      return this.validateMetadataSchema(raw['metadata'], filePath);
    }

    // ── Unsigned (legacy) format ──────────────────────────────────────────────
    throw new Error(
      `[DIScanner] "${filePath}": metadata file is not signed. ` +
      `Rebuild @hexajs/core, @hexajs/ports, and @hexajs/ui packages to generate signed metadata.`
    );
  }

  /**
   * Validate that metadata is a safe plain-object map of injectable class descriptors.
   * Rejects prototype-polluting keys and any entry that does not match the expected shape.
   */
  private validateMetadataSchema(raw: unknown, filePath: string): HexaPackageMetadata {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw new Error(`[DIScanner] "${filePath}": "metadata" value must be a plain object.`);
    }

    const result: HexaPackageMetadata = Object.create(null);

    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (FORBIDDEN_METADATA_KEYS.has(key)) {
        throw new Error(`[DIScanner] "${filePath}": forbidden key "${key}" in metadata. Metadata rejected.`);
      }
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`[DIScanner] "${filePath}": entry "${key}" must be an object.`);
      }
      const entry = value as Record<string, unknown>;
      if (entry['injectable'] !== true) {
        throw new Error(`[DIScanner] "${filePath}": entry "${key}" must have injectable: true.`);
      }
      if (typeof entry['context'] !== 'string' || !VALID_CONTEXTS.has(entry['context'])) {
        throw new Error(
          `[DIScanner] "${filePath}": entry "${key}" has invalid context "${entry['context']}". ` +
          `Expected one of: ${[...VALID_CONTEXTS].join(', ')}.`
        );
      }
      result[key] = { injectable: true, context: entry['context'] as string };
    }

    return result;
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

    // 4) Monorepo fallback for local development (walk up to workspace root).
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

  /**
   * Walk upward from startDir looking for the workspace monorepo fallback path.
   * Stops at the workspace/git root (detected by WORKSPACE_ROOT_MARKERS) so the
   * walk is bounded and cannot escape the project hierarchy.
   */
  private findWorkspacePackageMetadata(startDir: string, packageDirName: string): string | undefined {
    let currentDir = path.resolve(startDir);

    while (true) {
      const workspaceCandidate = path.join(currentDir, 'packages', packageDirName, 'dist', 'hexa-metadata.json');
      if (fs.existsSync(workspaceCandidate)) {
        return workspaceCandidate;
      }

      // Stop at any recognised workspace or git root – never walk above it.
      if (WORKSPACE_ROOT_MARKERS.some(marker => fs.existsSync(path.join(currentDir, marker)))) {
        break;
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break; // reached filesystem root
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
    const injectable = findDecorator(node, this.checker, 'Injectable', ['@hexajs/common']);

    if (!injectable) return null;

    // 2. Extract context from @Injectable({ context: '...' })
    const context = this.extractContext(injectable) || HexaContext.General;

    // 3. Extract dependencies from constructor (using shared method)
    const { dependencies, tokenDependencies, viewDependencies } = this.extractConstructorDeps(node);

    // 4. Extract @InjectView() property dependencies
    const viewPropertyDependencies = this.extractViewPropertyDeps(node);
    const workerPropertyDependencies = this.extractWorkerPropertyDeps(node);

    return {
      className: node.name!.text,
      context,
      dependencies,
      tokenDependencies,
      viewDependencies,
      viewPropertyDependencies,
      workerPropertyDependencies,
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
          const typeName = this.getParameterTypeName(param);
          throw new Error(
            `Constructor @InjectWorker() is no longer supported. Move worker dependency ${typeName} to a class property with @InjectWorker() or use injectWorker(${typeName}). [${node.name?.text ?? '<anonymous>'}::${this.getParameterName(param)} in ${node.getSourceFile().fileName}]`
          );
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
            throw new Error(
              `Worker dependency ${typeName} must use @InjectWorker() on a class property or injectWorker(${typeName}). Constructor worker injection is not supported. [${className}::${paramName} in ${fileName}]`
            );
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

  public extractWorkerPropertyDeps(node: ts.ClassDeclaration): WorkerPropertyDependency[] {
    const deps: WorkerPropertyDependency[] = [];

    for (const member of node.members) {
      if (!ts.isPropertyDeclaration(member) || !member.name) {
        continue;
      }

      if (!this.hasDecoratorNamed(member, 'InjectWorker')) {
        continue;
      }

      const propertyName = member.name.getText();
      const workerClassName = this.getInjectWorkerClassName(node, member, propertyName);
      deps.push({ propertyName, workerClassName });
    }

    return deps;
  }

  private getInjectWorkerClassName(node: ts.ClassDeclaration, member: ts.PropertyDeclaration, propertyName: string): string {
    if (!member.type) {
      throw new Error(
        `@InjectWorker() property "${propertyName}" requires an explicit worker class type annotation. [${node.name?.text ?? '<anonymous>'} in ${node.getSourceFile().fileName}]`
      );
    }

    const type = this.checker.getTypeAtLocation(member);
    const typeSymbol = this.getTypeSymbol(type, member.type);
    const typeName = this.checker.typeToString(type);
    const className = node.name?.text ?? '<anonymous>';
    const fileName = node.getSourceFile().fileName;

    if (!this.isTypeWorker(type, member.type)) {
      throw new Error(`@InjectWorker() can only be used with classes decorated by @Worker. Found ${typeName}. [${className}.${propertyName} in ${fileName}]`);
    }

    if (!typeSymbol) {
      throw new Error(`Worker dependency ${typeName} cannot be resolved to a symbol. [${className}.${propertyName} in ${fileName}]`);
    }

    return typeSymbol.getName();
  }

  private getParameterTypeName(param: ts.ParameterDeclaration): string {
    if (!param.type) {
      return 'UnknownWorker';
    }

    return this.checker.typeToString(this.checker.getTypeAtLocation(param));
  }

  /**
   * Check if a constructor parameter has an @Inject() decorator and return the token key.
   */
  private getInjectTokenKey(param: ts.ParameterDeclaration): string | null {
    const injectDecorator = findDecorator(param, this.checker, 'Inject', ['@hexajs/common']);
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
  private getDecoratorImportSources(name: string): readonly string[] | undefined {
    switch (name) {
      case 'Injectable':
      case 'Inject':
      case 'InjectWorker':
        return ['@hexajs/common'];
      case 'Worker':
      case 'Background':
      case 'Content':
      case 'Controller':
      case 'Action':
      case 'On':
      case 'Handler':
      case 'Handle':
      case 'Subscribe':
      case 'View':
      case 'InjectView':
      case 'Reducer':
      case 'Reduce':
      case 'State':
        return ['@hexajs/core'];
      default:
        return undefined;
    }
  }

  private isInjectableDecorator(decorator: ts.Decorator): boolean {
    return isDecoratorNamed(decorator, this.checker, 'Injectable', ['@hexajs/common']);
  }

  private hasDecoratorNamed(node: ts.Node, name: string): boolean {
    return this.getNodeDecorators(node).some((decorator: ts.Decorator) =>
      isDecoratorNamed(decorator, this.checker, name, this.getDecoratorImportSources(name))
    );
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
    return isDecoratorNamed(decorator, this.checker, 'Worker', ['@hexajs/core']);
  }
}

