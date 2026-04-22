import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const scriptFile = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(scriptFile), '..');
const docsOutDir = path.join(rootDir, 'documentation', 'docs', 'reference-models');

const PACKAGE_CONFIGS = [
  { name: 'common', entry: 'packages/common/index.ts', srcRoot: 'packages/common/src' },
  { name: 'core', entry: 'packages/core/index.ts', srcRoot: 'packages/core/src' },
  { name: 'ports', entry: 'packages/ports/index.ts', srcRoot: 'packages/ports/src' },
  { name: 'ui', entry: 'packages/ui/index.ts', srcRoot: 'packages/ui/src' },
];

function loadTypeScript() {
  const lookupPaths = [
    rootDir,
    path.join(rootDir, 'documentation'),
    path.join(rootDir, 'packages', 'cli'),
    path.join(rootDir, 'packages', 'core'),
    path.join(rootDir, 'packages', 'ports'),
    path.join(rootDir, 'packages', 'common'),
    path.join(rootDir, 'packages', 'ui'),
  ];

  for (const lookup of lookupPaths) {
    try {
      const resolved = require.resolve('typescript', { paths: [lookup] });
      return require(resolved);
    } catch {
      // continue lookup
    }
  }

  throw new Error('Unable to resolve typescript. Install dependencies with pnpm install.');
}

const ts = loadTypeScript();

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function walkFiles(dirPath, matcher, out = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, matcher, out);
      continue;
    }

    if (matcher(fullPath)) {
      out.push(fullPath);
    }
  }
  return out;
}

function cleanGeneratedDirectory(targetDir) {
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  ensureDir(targetDir);
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveModulePath(fromFile, modulePath) {
  const basePath = path.resolve(path.dirname(fromFile), modulePath);
  const candidates = [
    `${basePath}.ts`,
    `${basePath}.d.ts`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.d.ts'),
  ];

  for (const candidate of candidates) {
    if (fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

function isRelativeImport(specifier) {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

function normalizeRelative(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join('/');
}

function toDocSlug(fileName) {
  return fileName
    .replace(/\.d\.ts$/, '')
    .replace(/\.ts$/, '')
    .replace(/\./g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function collectPublicModules(packageConfig) {
  const entryFile = path.join(rootDir, packageConfig.entry);
  const srcRoot = path.join(rootDir, packageConfig.srcRoot);

  const publicModules = new Set();
  const visited = new Set();
  const queue = [entryFile];

  while (queue.length > 0) {
    const currentFile = queue.shift();
    if (!currentFile || visited.has(currentFile) || !fileExists(currentFile)) {
      continue;
    }

    visited.add(currentFile);
    const sourceText = fs.readFileSync(currentFile, 'utf8');
    const sourceFile = ts.createSourceFile(currentFile, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

    for (const statement of sourceFile.statements) {
      if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier) {
        continue;
      }

      const specifier = statement.moduleSpecifier.getText(sourceFile).slice(1, -1);
      if (!isRelativeImport(specifier)) {
        continue;
      }

      const resolved = resolveModulePath(currentFile, specifier);
      if (!resolved) {
        continue;
      }

      const inSrc = resolved.startsWith(srcRoot);
      if (!inSrc) {
        queue.push(resolved);
        continue;
      }

      const basename = path.basename(resolved).toLowerCase();
      if (basename === 'index.ts' || basename === 'index.d.ts') {
        queue.push(resolved);
        continue;
      }

      publicModules.add(resolved);
    }
  }

  return [...publicModules].sort((a, b) => a.localeCompare(b));
}

function getExportedSymbols(checker, sourceFile) {
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) {
    return [];
  }

  const exports = checker.getExportsOfModule(moduleSymbol);
  return exports.map((symbol) => {
    if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
      return checker.getAliasedSymbol(symbol);
    }
    return symbol;
  });
}

function hasModifier(node, modifierKind) {
  return !!node.modifiers?.some((modifier) => modifier.kind === modifierKind);
}

function isPrivateOrProtected(tsInstance, node) {
  return hasModifier(node, tsInstance.SyntaxKind.PrivateKeyword) || hasModifier(node, tsInstance.SyntaxKind.ProtectedKeyword);
}

function normalizeDeclarationText(text) {
  if (typeof text !== 'string') {
    return null;
  }

  let normalized = normalizePublicTypeText(text.trim());
  while (/^(export|declare|default)\s+/.test(normalized)) {
    normalized = normalized.replace(/^(export|declare|default)\s+/, '');
  }
  return normalized.trim();
}

function normalizePublicTypeText(text) {
  if (typeof text !== 'string') {
    return text;
  }

  return text.replace(/`\$\{string\}:\$\{string\}`/g, '`${namespace}:${api}`');
}

function getJsDocDescription(node) {
  const jsDocs = node.jsDoc;
  if (!jsDocs || jsDocs.length === 0) {
    return null;
  }

  const lastDoc = jsDocs[jsDocs.length - 1];
  const comment = lastDoc?.comment;
  if (!comment) {
    return null;
  }

  if (typeof comment === 'string') {
    return comment.trim() || null;
  }

  const text = comment
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim();

  return text || null;
}

function printNodeText(tsInstance, node, sourceFile = node.getSourceFile()) {
  const printer = tsInstance.createPrinter({ removeComments: true });
  return normalizePublicTypeText(printer.printNode(tsInstance.EmitHint.Unspecified, node, sourceFile).trim());
}

function getTypeText(tsInstance, checker, node) {
  const type = checker.getTypeAtLocation(node);
  return normalizePublicTypeText(checker.typeToString(type, node, tsInstance.TypeFormatFlags.NoTruncation));
}

function getTypeParametersText(tsInstance, typeParameters, sourceFile) {
  if (!typeParameters || typeParameters.length === 0) {
    return '';
  }

  return `<${typeParameters.map((parameter) => printNodeText(tsInstance, parameter, sourceFile)).join(', ')}>`;
}

function getParametersText(tsInstance, checker, parameters, sourceFile, ownerName = null, supportingTypes = null) {
  return parameters.map((parameter) => {
    const name = printNodeText(tsInstance, parameter.name, sourceFile);
    const isOptional = !!parameter.questionToken || !!parameter.initializer;
    const restPrefix = parameter.dotDotDotToken ? '...' : '';

    if (ownerName && supportingTypes && parameter.type && tsInstance.isTypeLiteralNode(parameter.type)) {
      const interfaceName = `${toPascalCase(ownerName)}${toPascalCase(name)}`;
      if (!supportingTypes.find((t) => t.name === interfaceName)) {
        const memberLines = renderTypeLiteralMembers(tsInstance, checker, parameter.type, sourceFile);
        const interfaceText = `interface ${interfaceName} {\n${memberLines.join('\n')}\n}`;
        supportingTypes.push({ name: interfaceName, description: null, text: interfaceText, isClassData: false });
      }
      return `${restPrefix}${name}${isOptional ? '?' : ''}: ${interfaceName}`;
    }

    const typeText = parameter.type ? printNodeText(tsInstance, parameter.type, sourceFile) : getTypeText(tsInstance, checker, parameter);
    return `${restPrefix}${name}${isOptional ? '?' : ''}: ${typeText}`;
  }).join(', ');
}

function toPascalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderTypeLiteralMembers(tsInstance, checker, typeLiteralNode, sourceFile) {
  const lines = [];
  for (const member of typeLiteralNode.members) {
    if (tsInstance.isPropertySignature(member)) {
      const memberName = printNodeText(tsInstance, member.name, sourceFile);
      const isOptional = !!member.questionToken;
      const typeText = member.type ? printNodeText(tsInstance, member.type, sourceFile) : getTypeText(tsInstance, checker, member);
      lines.push(`  ${memberName}${isOptional ? '?' : ''}: ${typeText};`);
    } else {
      lines.push(`  ${printNodeText(tsInstance, member, sourceFile)}`);
    }
  }
  return lines;
}

function getMethodSignatureText(tsInstance, checker, methodDecl, sourceFile, ownerName = null, supportingTypes = null) {
  const methodName = printNodeText(tsInstance, methodDecl.name, sourceFile);
  const typeParameters = getTypeParametersText(tsInstance, methodDecl.typeParameters, sourceFile);
  const parameters = getParametersText(tsInstance, checker, methodDecl.parameters, sourceFile, ownerName ?? methodName, supportingTypes);
  const returnType = methodDecl.type ? printNodeText(tsInstance, methodDecl.type, sourceFile) : getTypeText(tsInstance, checker, methodDecl);
  const staticPrefix = hasModifier(methodDecl, tsInstance.SyntaxKind.StaticKeyword) ? 'static ' : '';
  
  return {
    name: methodName,
    signature: `${staticPrefix}${methodName}${typeParameters}(${parameters}): ${returnType}`,
    description: getJsDocDescription(methodDecl) || ''
  };
}

function getPropertySignatureText(tsInstance, checker, propertyDecl, sourceFile) {
  const propertyName = printNodeText(tsInstance, propertyDecl.name, sourceFile);
  const isOptional = !!propertyDecl.questionToken;
  const staticPrefix = hasModifier(propertyDecl, tsInstance.SyntaxKind.StaticKeyword) ? 'static ' : '';
  const readonlyPrefix = hasModifier(propertyDecl, tsInstance.SyntaxKind.ReadonlyKeyword) ? 'readonly ' : '';
  const typeText = propertyDecl.type ? printNodeText(tsInstance, propertyDecl.type, sourceFile) : getTypeText(tsInstance, checker, propertyDecl.name ?? propertyDecl);
  
  return {
    name: propertyName,
    signature: `${staticPrefix}${readonlyPrefix}${propertyName}${isOptional ? '?' : ''}: ${typeText};`,
    description: getJsDocDescription(propertyDecl) || ''
  };
}

function getInheritedClassData(tsInstance, checker, classDecl, sourceFile, supportingTypes) {
  const inherited = { properties: [], methods: [] };
  const classType = checker.getTypeAtLocation(classDecl);
  const baseTypes = classType.getBaseTypes?.() ?? [];

  for (const baseType of baseTypes) {
    const baseSymbol = baseType.getSymbol();
    if (!baseSymbol || baseSymbol.getName() !== 'HexaClientBase') {
      continue;
    }

    const baseDecl = (baseSymbol.getDeclarations() || []).find((decl) => tsInstance.isClassDeclaration(decl));
    if (!baseDecl || !tsInstance.isClassDeclaration(baseDecl)) {
      continue;
    }

    const baseSource = baseDecl.getSourceFile();
    for (const member of baseDecl.members) {
      if (isPrivateOrProtected(tsInstance, member)) continue;
      if (tsInstance.isConstructorDeclaration(member)) continue;

      if (tsInstance.isMethodDeclaration(member)) {
        const methodName = member.name.getText(baseSource);
        inherited.methods.push(getMethodSignatureText(tsInstance, checker, member, baseSource, methodName, supportingTypes));
      } else if (tsInstance.isPropertyDeclaration(member)) {
        inherited.properties.push(getPropertySignatureText(tsInstance, checker, member, baseSource));
      }
    }
  }

  return inherited;
}

function extractClassData(tsInstance, checker, classDecl, sourceFile, supportingTypes) {
  const declarationSourceFile = classDecl.getSourceFile();
  const className = classDecl.name?.getText(declarationSourceFile) || 'AnonymousClass';
  const typeParameters = getTypeParametersText(tsInstance, classDecl.typeParameters, declarationSourceFile);
  const classType = checker.getTypeAtLocation(classDecl);
  const baseTypes = classType.getBaseTypes?.() ?? [];
  const hidesHexaClientBase = baseTypes.some((baseType) => baseType.getSymbol()?.getName() === 'HexaClientBase');
  const heritageClauses = hidesHexaClientBase
    ? ''
    : classDecl.heritageClauses?.map((clause) => printNodeText(tsInstance, clause, declarationSourceFile)).join(' ') ?? '';
  
  const classDefinition = `class ${className}${typeParameters}${heritageClauses ? ` ${heritageClauses}` : ''}`;
  const properties = [];
  const methods = [];

  for (const member of classDecl.members) {
    if (isPrivateOrProtected(tsInstance, member)) continue;
    if (tsInstance.isConstructorDeclaration(member)) continue;

    if (tsInstance.isMethodDeclaration(member)) {
      const methodName = member.name.getText(declarationSourceFile);
      methods.push(getMethodSignatureText(tsInstance, checker, member, declarationSourceFile, methodName, supportingTypes));
    } else if (tsInstance.isPropertyDeclaration(member)) {
      properties.push(getPropertySignatureText(tsInstance, checker, member, declarationSourceFile));
    }
  }

  if (hidesHexaClientBase) {
    const inherited = getInheritedClassData(tsInstance, checker, classDecl, sourceFile, supportingTypes);
    for (const property of inherited.properties) {
      if (!properties.some((current) => current.name === property.name)) {
        properties.push(property);
      }
    }

    for (const method of inherited.methods) {
      if (!methods.some((current) => current.name === method.name)) {
        methods.push(method);
      }
    }
  }

  properties.sort((a, b) => a.name.localeCompare(b.name));
  methods.sort((a, b) => a.name.localeCompare(b.name));

  return { className, classDefinition, properties, methods };
}

// ------------------------------------------------------------------
// NEW: Intelligent Function / Decorator parsing
// ------------------------------------------------------------------
function extractFunctionData(tsInstance, checker, funcDecl, sourceFile, supportingTypes) {
  const functionName = funcDecl.name?.getText(sourceFile) || 'anonymous';
  const typeParameters = getTypeParametersText(tsInstance, funcDecl.typeParameters, sourceFile);
  const signatureObj = checker.getSignatureFromDeclaration(funcDecl);
  const returnType = funcDecl.type ? printNodeText(tsInstance, funcDecl.type, sourceFile) : checker.typeToString(checker.getReturnTypeOfSignature(signatureObj), sourceFile, tsInstance.TypeFormatFlags.NoTruncation);

  // Heuristic 1: Is it a bare decorator? e.g., @Injectable (takes target directly)
  const firstParamName = funcDecl.parameters[0]?.name?.getText(sourceFile);
  const isBareDecorator = firstParamName === 'target' || firstParamName === 'constructor';

  // Heuristic 2: Is it a decorator factory? (Returns a function taking target/descriptor, or returns *Decorator type)
  const isDecoratorFactory = returnType.includes('Decorator') || returnType.includes('(target') || returnType.includes('target:');

  const forceFunctionNames = new Set(['Inject']);
  const isDecorator = forceFunctionNames.has(functionName) ? false : isBareDecorator || isDecoratorFactory;
  
  let signature;

  if (isDecorator && isBareDecorator) {
    // Hide the internal target/descriptor parameters
    signature = `@${functionName}`;
  } else if (isDecorator && isDecoratorFactory) {
    // Show only the factory arguments the user cares about
    const parameters = getParametersText(tsInstance, checker, funcDecl.parameters, sourceFile, functionName, supportingTypes);
    signature = `@${functionName}${typeParameters}(${parameters})`;
  } else {
    // Standard function
    const parameters = getParametersText(tsInstance, checker, funcDecl.parameters, sourceFile, functionName, supportingTypes);
    signature = `function ${functionName}${typeParameters}(${parameters}): ${returnType}`;
  }

  return {
    name: functionName,
    signature,
    isDecorator,
    description: getJsDocDescription(funcDecl) || ''
  };
}

function extractVariableFunctionData(tsInstance, checker, symbol, variableDecl, sourceFile, supportingTypes) {
  const initializer = variableDecl.initializer;
  if (!initializer || (!tsInstance.isArrowFunction(initializer) && !tsInstance.isFunctionExpression(initializer))) {
    return null;
  }

  const functionName = symbol.getName();
  const typeParameters = getTypeParametersText(tsInstance, initializer.typeParameters, sourceFile);
  const parameters = getParametersText(tsInstance, checker, initializer.parameters, sourceFile, functionName, supportingTypes);
  const returnType = initializer.type
    ? printNodeText(tsInstance, initializer.type, sourceFile)
    : getTypeText(tsInstance, checker, initializer);

  return {
    name: functionName,
    signature: `function ${functionName}${typeParameters}(${parameters}): ${returnType}`,
    isDecorator: false,
    description: getJsDocDescription(variableDecl) || ''
  };
}

function getConstantDeclarationText(tsInstance, checker, symbol, declaration) {
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  const typeText = checker.typeToString(type, declaration, tsInstance.TypeFormatFlags.NoTruncation);
  return `const ${symbol.getName()}: ${typeText};`;
}

function createEntry(name, declaration, text, isClassData = false, classData = null, packageName = '', funcData = null) {
  return {
    name,
    description: getJsDocDescription(declaration),
    text: isClassData ? null : normalizeDeclarationText(text),
    isClassData,
    classData,
    funcData,
    packageName
  };
}

function shouldHideExport(name) {
  const hiddenSymbols = new Set([
    'Container',
    'Factory',
    'inject',
    'setContainer',
    'HexaClientBase',
    'createStore',
    'HexaAction',
    'HexaActionWithPayload',
    'HexaReducer',
    'on',
    'HexaBackgroundStore',
    'HexaContentStore',
    'HexaStoreAbstract',
  ]);

  return hiddenSymbols.has(name);
}

function hasRenderableEntries(categorized) {
  return categorized.decorators.length > 0
    || categorized.classes.length > 0
    || categorized.interfaces.length > 0
    || categorized.types.length > 0
    || categorized.enums.length > 0
    || categorized.functions.length > 0
    || categorized.constants.length > 0
    || categorized.supportingTypes.length > 0;
}

function categorizeExports(tsInstance, checker, symbols, sourceFile, packageName) {
  const result = {
    decorators: [],
    classes: [],
    interfaces: [],
    types: [],
    enums: [],
    functions: [],
    constants: [],
    supportingTypes: [],
  };

  for (const symbol of symbols) {
    const name = symbol.getName();
    if (!name || name === 'default' || name.startsWith('__')) continue;
    if (shouldHideExport(name)) continue;

    const declarations = symbol.getDeclarations() || [];

    if ((symbol.flags & tsInstance.SymbolFlags.Class) !== 0) {
      const classDecl = declarations.find((decl) => tsInstance.isClassDeclaration(decl));
      if (classDecl && tsInstance.isClassDeclaration(classDecl)) {
        const classData = extractClassData(tsInstance, checker, classDecl, sourceFile, result.supportingTypes);
        result.classes.push(createEntry(name, classDecl, null, true, classData, packageName));
      }
      continue;
    }

    if ((symbol.flags & tsInstance.SymbolFlags.Interface) !== 0) {
      const interfaceDecl = declarations.find((decl) => tsInstance.isInterfaceDeclaration(decl));
      if (interfaceDecl && tsInstance.isInterfaceDeclaration(interfaceDecl)) {
        result.interfaces.push(createEntry(name, interfaceDecl, printNodeText(tsInstance, interfaceDecl, sourceFile), false, null, packageName));
      }
      continue;
    }

    if ((symbol.flags & tsInstance.SymbolFlags.TypeAlias) !== 0) {
      const typeDecl = declarations.find((decl) => tsInstance.isTypeAliasDeclaration(decl));
      if (typeDecl && tsInstance.isTypeAliasDeclaration(typeDecl)) {
        result.types.push(createEntry(name, typeDecl, printNodeText(tsInstance, typeDecl, sourceFile), false, null, packageName));
      }
      continue;
    }

    if ((symbol.flags & tsInstance.SymbolFlags.Enum) !== 0) {
      const enumDecl = declarations.find((decl) => tsInstance.isEnumDeclaration(decl));
      if (enumDecl && tsInstance.isEnumDeclaration(enumDecl)) {
        result.enums.push(createEntry(name, enumDecl, printNodeText(tsInstance, enumDecl, sourceFile), false, null, packageName));
      }
      continue;
    }

    if ((symbol.flags & tsInstance.SymbolFlags.Function) !== 0) {
      const functionDecls = declarations.filter((decl) => tsInstance.isFunctionDeclaration(decl));
      if (functionDecls.length > 0) {
        const funcData = extractFunctionData(tsInstance, checker, functionDecls[0], sourceFile, result.supportingTypes);
        const entry = createEntry(name, functionDecls[0], null, false, null, packageName, funcData);
        
        if (funcData.isDecorator) {
          result.decorators.push(entry);
        } else {
          result.functions.push(entry);
        }
      }
      continue;
    }

    if ((symbol.flags & tsInstance.SymbolFlags.Variable) !== 0 || (symbol.flags & tsInstance.SymbolFlags.BlockScopedVariable) !== 0) {
      const variableDecl = declarations.find((decl) => tsInstance.isVariableDeclaration(decl));
      if (variableDecl && tsInstance.isVariableDeclaration(variableDecl)) {
        const variableFunctionData = extractVariableFunctionData(tsInstance, checker, symbol, variableDecl, sourceFile, result.supportingTypes);
        if (variableFunctionData) {
          result.functions.push(createEntry(name, variableDecl, null, false, null, packageName, variableFunctionData));
          continue;
        }

        result.constants.push(createEntry(name, variableDecl, getConstantDeclarationText(tsInstance, checker, symbol, variableDecl), false, null, packageName));
      }
      continue;
    }
  }

  result.decorators.sort((a, b) => a.name.localeCompare(b.name));
  result.classes.sort((a, b) => a.name.localeCompare(b.name));
  result.interfaces.sort((a, b) => a.name.localeCompare(b.name));
  result.types.sort((a, b) => a.name.localeCompare(b.name));
  result.enums.sort((a, b) => a.name.localeCompare(b.name));
  result.functions.sort((a, b) => a.name.localeCompare(b.name));
  result.constants.sort((a, b) => a.name.localeCompare(b.name));
  result.supportingTypes.sort((a, b) => a.name.localeCompare(b.name));

  return result;
}

function renderSymbolSection(lines, title, items, showTitle = true) {
  if (!items || items.length === 0) return;

  lines.push('');
  if (showTitle) {
    lines.push(`### ${title}`);
    lines.push('');
  }

  for (const item of items) {
    // If it's a decorator, show it with the @ symbol in the title
    const displayName = item.funcData?.isDecorator ? `@${item.name}` : item.name;
    lines.push(`#### ${displayName}`);
    lines.push('');

    if (item.description) {
      lines.push(item.description);
      lines.push('');
    }

    if (item.packageName) {
     // lines.push(`**Import:**`);
      lines.push('```ts');
      lines.push(`import { ${item.name} } from '@hexajs/${item.packageName}';`);
      lines.push('```');
      lines.push('');
    }

    // Render Decorators & Functions cleanly without the internal AST garbage
    if (item.funcData) {
      lines.push('```typescript');
      lines.push(item.funcData.signature);
      lines.push('```');
      lines.push('');
    } 
    // Render Classes mapped out clearly
    else if (item.isClassData && item.classData) {
      lines.push('```typescript');
      lines.push(`${item.classData.classDefinition} { ... }`);
      lines.push('```');
      lines.push('');

      if (item.classData.properties.length > 0) {
        lines.push(`#### Properties`);
        for (const prop of item.classData.properties) {
          lines.push(`- \`${prop.name}\``);
          if (prop.description) lines.push(`  - *${prop.description}*`);
        }
        lines.push('');
      }

      if (item.classData.methods.length > 0) {
        lines.push(`#### Methods`);
        lines.push('');
        for (const method of item.classData.methods) {
          lines.push(`**\`${method.name}()\`**`);
          if (method.description) lines.push(`> ${method.description}`);
          lines.push('```typescript');
          lines.push(method.signature);
          lines.push('```');
          lines.push('');
        }
      }
    } 
    // Render everything else (Interfaces, Enums, Constants)
    else {
      lines.push('```typescript');
      lines.push(item.text);
      lines.push('```');
      lines.push('');
    }
  }
}

function renderModuleMarkdown(packageName, modulePath, categorized) {
  const relativeSource = normalizeRelative(modulePath);
  const moduleBase = path.basename(modulePath).replace(/\.d\.ts$/, '').replace(/\.ts$/, '');
  const titleBase = moduleBase
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  const title = `${titleBase || moduleBase} (${packageName})`;

  const lines = [
    '---',
    `title: ${title}`,
    `description: Public API model reference for ${packageName} module ${relativeSource}.`,
    '---',
    ''
  ];

  // Render Decorators first so developers see them right at the top
  const isDecoratorsModule = moduleBase.toLowerCase() === 'decorators';
  renderSymbolSection(lines, 'Decorators', categorized.decorators, !isDecoratorsModule);
  renderSymbolSection(lines, 'Classes', categorized.classes);
  renderSymbolSection(lines, 'Types & Interfaces', [...categorized.interfaces, ...categorized.types]);
  renderSymbolSection(lines, 'Enums', categorized.enums);
  renderSymbolSection(lines, 'Functions', categorized.functions);
  renderSymbolSection(lines, 'Constants', categorized.constants);
  renderSymbolSection(lines, 'Supporting Types', categorized.supportingTypes);

  return `${lines.join('\n')}\n`;
}

function getOutputPath(packageName, modulePath, srcRoot) {
  const srcRootPath = path.join(rootDir, srcRoot);
  const relativeFromSrc = path.relative(srcRootPath, modulePath).split(path.sep).join('/');
  const dirName = path.dirname(relativeFromSrc);
  const baseName = toDocSlug(path.basename(relativeFromSrc));
  const outputDir = path.join(docsOutDir, packageName, dirName);
  return path.join(outputDir, `${baseName}.md`);
}

function buildProgramInput() {
  const tsFiles = walkFiles(path.join(rootDir, 'packages'), (filePath) => {
    if (filePath.includes(`${path.sep}dist${path.sep}`) || filePath.includes(`${path.sep}node_modules${path.sep}`) || filePath.includes(`${path.sep}tests${path.sep}`) || filePath.includes(`${path.sep}test${path.sep}`)) {
      return false;
    }

    return filePath.endsWith('.ts') || filePath.endsWith('.d.ts');
  });

  return tsFiles;
}

function run() {
  cleanGeneratedDirectory(docsOutDir);

  const packageModules = [];
  for (const pkg of PACKAGE_CONFIGS) {
    const modules = collectPublicModules(pkg);
    packageModules.push({ pkg, modules });
  }

  const allFiles = buildProgramInput();
  const compilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    allowJs: false,
    skipLibCheck: true,
    noResolve: false,
  };

  const program = ts.createProgram(allFiles, compilerOptions);
  const checker = program.getTypeChecker();

  let generatedCount = 0;
  for (const { pkg, modules } of packageModules) {
    for (const modulePath of modules) {
      const sourceFile = program.getSourceFile(modulePath);
      if (!sourceFile) continue;

      const symbols = getExportedSymbols(checker, sourceFile);
      const categorized = categorizeExports(ts, checker, symbols, sourceFile, pkg.name);
      if (!hasRenderableEntries(categorized)) {
        continue;
      }

      const markdown = renderModuleMarkdown(pkg.name, modulePath, categorized);
      const outputPath = getOutputPath(pkg.name, modulePath, pkg.srcRoot);

      ensureDir(path.dirname(outputPath));
      fs.writeFileSync(outputPath, markdown, 'utf8');
      generatedCount += 1;
    }
  }

  console.log(`Generated ${generatedCount} clean API reference docs in ${normalizeRelative(docsOutDir)}.`);
}

run();