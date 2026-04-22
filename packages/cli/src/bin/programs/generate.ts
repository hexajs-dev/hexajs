import { Command } from 'commander';
import * as path from 'path';
import { controllerTemplate, handlerTemplate, reducerTemplate, serviceTemplate, stateTemplate } from './schematics/templates';
import { addSharedOptions, ensureContext, ensureStoreContext, getControllerDir, getHandlerDir, getServicesDir, getStoreDir, insertImport, loadProject, mapInjectableContext, printSchematicSuccess, readFileIfExists, resolveGeneratedClassName, toCamelCase, toKebabCase, updateFileWithTransform, validateName, writeFileWithGuard, type SchematicCommandOptions } from './schematics/shared';

interface NamespaceOptions extends SchematicCommandOptions {
  namespace?: string;
}

export const generateCommand = (program: Command): void => {
  const generate = program.command('generate').description('Generate HexaJS classes and store scaffolds');

  addSharedOptions(
    generate
      .command('controller <name>')
      .description('Generate a controller class')
      .option('--namespace <value>', 'Controller namespace')
  ).action(async (name: string, options: NamespaceOptions) => {
    const project = await loadProject(options);
    validateName(name, 'Controller name');

    const className = resolveGeneratedClassName(name, 'Controller');
    const namespace = options.namespace || toKebabCase(name);
    const filePath = path.join(project.cwd, getControllerDir(project.config), `${toKebabCase(name)}.controller.ts`);

    await writeFileWithGuard(filePath, controllerTemplate(className, namespace), options);
    printSchematicSuccess(`Generated controller ${className}`, [filePath], options);
  });

  addSharedOptions(
    generate
      .command('handler <name>')
      .description('Generate a handler class')
      .option('--namespace <value>', 'Handler namespace')
  ).action(async (name: string, options: NamespaceOptions) => {
    const project = await loadProject(options);
    validateName(name, 'Handler name');

    const className = resolveGeneratedClassName(name, 'Handler');
    const namespace = options.namespace || toKebabCase(name);
    const filePath = path.join(project.cwd, getHandlerDir(project.config), `${toKebabCase(name)}.handler.ts`);

    await writeFileWithGuard(filePath, handlerTemplate(className, namespace), options);
    printSchematicSuccess(`Generated handler ${className}`, [filePath], options);
  });

  addSharedOptions(
    generate
      .command('service <name> <context>')
      .description('Generate an injectable service')
  ).action(async (name: string, contextArg: string, options: SchematicCommandOptions) => {
    const project = await loadProject(options);
    validateName(name, 'Service name');

    const context = ensureContext(contextArg);
    const className = resolveGeneratedClassName(name, 'Service');
    const filePath = path.join(project.cwd, getServicesDir(project.config), `${toKebabCase(name)}.service.ts`);
    const injectableContext = mapInjectableContext(context);

    await writeFileWithGuard(filePath, serviceTemplate(className, context, injectableContext), options);
    printSchematicSuccess(`Generated service ${className}`, [filePath], options);
  });

  addSharedOptions(
    generate
      .command('reducer <name> <context>')
      .description('Generate a reducer class for a store context')
  ).action(async (name: string, contextArg: string, options: SchematicCommandOptions) => {
    const project = await loadProject(options);
    validateName(name, 'Reducer name');

    const context = ensureStoreContext(contextArg);
    const storeDir = path.join(project.cwd, getStoreDir(project.config, context));
    const className = resolveGeneratedClassName(name, 'Reducer');
    const stateName = resolveGeneratedClassName(name, 'State');
    const filePath = path.join(storeDir, `${toKebabCase(name)}.reducer.ts`);

    await writeFileWithGuard(filePath, reducerTemplate(className, stateName), options);
    printSchematicSuccess(`Generated reducer ${className}`, [filePath], options);
  });

  addSharedOptions(
    generate
      .command('state <name> <context>')
      .description('Create or extend a context state configuration using an existing reducer')
  ).action(async (name: string, contextArg: string, options: SchematicCommandOptions) => {
    const project = await loadProject(options);
    validateName(name, 'State name');

    const context = ensureStoreContext(contextArg);
    const storeDir = path.join(project.cwd, getStoreDir(project.config, context));
    const reducerFilePath = path.join(storeDir, `${toKebabCase(name)}.reducer.ts`);
    const reducerFile = await readFileIfExists(reducerFilePath);
    if (!reducerFile) {
      throw new Error(`Reducer file not found: ${reducerFilePath}. Run "hexa generate reducer ${name} ${context}" first.`);
    }

    const reducerClassName = resolveGeneratedClassName(name, 'Reducer');
    const reducerStateName = resolveGeneratedClassName(name, 'State');
    const featureName = toCamelCase(name);
    const stateFilePath = path.join(storeDir, `${context}.state.ts`);
    const reducerImportPath = `./${toKebabCase(name)}.reducer`;
    const touchedFiles = [stateFilePath];

    const stateFileContent = await readFileIfExists(stateFilePath);
    if (!stateFileContent) {
      await writeFileWithGuard(stateFilePath, stateTemplate(context, reducerImportPath, reducerClassName, reducerStateName, featureName), options);
      printSchematicSuccess(`Generated ${context} state config`, touchedFiles, options);
      return;
    }

    const importStatement = `import { ${reducerClassName}, ${reducerStateName} } from '${reducerImportPath}';`;
    const rootStateName = context === 'background' ? 'BackgroundState' : 'ContentState';
    const remoteInterfaceImport = stateFileContent.match(new RegExp(`import\\s*{[^}]*\\b${rootStateName}\\b[^}]*}\\s*from\\s*'([^']+)'`));

    let interfaceTargetPath = stateFilePath;
    if (remoteInterfaceImport && !new RegExp(`export interface\\s+${rootStateName}\\b`).test(stateFileContent)) {
      interfaceTargetPath = path.resolve(path.dirname(stateFilePath), `${remoteInterfaceImport[1]}.ts`);
      touchedFiles.push(interfaceTargetPath);
    }

    await updateFileWithTransform(interfaceTargetPath, options, content => {
      if (new RegExp(`\\b${featureName}:\\s*${reducerStateName}\\b`).test(content)) {
        return content;
      }

      const interfaceRegex = new RegExp(`export interface\\s+${rootStateName}\\s*{([\\s\\S]*?)}`);
      const match = content.match(interfaceRegex);
      if (!match) {
        throw new Error(`Could not find ${rootStateName} interface in ${interfaceTargetPath}.`);
      }

      const body = match[1].trimEnd();
      const nextBody = `${body}${body ? '\n' : ''}  ${featureName}: ${reducerStateName};\n`;
      return content.replace(interfaceRegex, `export interface ${rootStateName} {\n${nextBody}}`);
    });

    await updateFileWithTransform(stateFilePath, options, content => {
      let next = insertImport(content, importStatement);
      if (new RegExp(`\\b${featureName}:\\s*${reducerClassName}\\b`).test(next)) {
        return next;
      }

      const stateObjectRegex = /state:\s*{([\s\S]*?)}\s*\)\s*export class/s;
      const match = next.match(stateObjectRegex);
      if (!match) {
        throw new Error(`Could not find @State state object in ${stateFilePath}.`);
      }

      const body = match[1].trimEnd();
      const trailing = body ? `${body}\n    ${featureName}: ${reducerClassName},\n  ` : `\n    ${featureName}: ${reducerClassName},\n  `;
      return next.replace(stateObjectRegex, `state: {${trailing}})\nexport class`);
    });

    printSchematicSuccess(`Updated ${context} state config with ${featureName}`, Array.from(new Set(touchedFiles)), options);
  });
};