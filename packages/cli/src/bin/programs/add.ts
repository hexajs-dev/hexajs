import { Command } from 'commander';
import * as path from 'path';
import { devtoolsFallbackHtmlTemplate } from './new/templates/devtools-fallback-html.template';
import { popupFallbackHtmlTemplate } from './new/templates/popup-fallback-html.template';
import { backgroundTemplate, contentTemplate } from './schematics/templates';
import { addSharedOptions, collectDecoratedClasses, ensureUiSurface, ensureUiSurfaceMissing, findClassByName, getBackgroundDir, getContentDir, getHandlerDir, insertImport, loadProject, parseUrlList, printSchematicSuccess, relativeImport, resolveContentRunAt, resolveGeneratedClassName, toKebabCase, updateFileWithTransform, updateUiSurfaceConfig, validateName, writeFileWithGuard, type SchematicCommandOptions } from './schematics/shared';

interface AddBackgroundOptions extends SchematicCommandOptions {
  allowMultiple?: boolean;
}

interface AddContentOptions extends SchematicCommandOptions {
  runAt?: string;
}

export const addCommand = (program: Command): void => {
  const add = program.command('add').description('Add extension building blocks to the current HexaJS project');

  addSharedOptions(
    add
      .command('content <name> <urlList>')
      .description('Add a content class with URL match patterns')
      .option('--run-at <value>', 'document-start, document-end, or document-idle', 'document-idle')
  ).action(async (name: string, urlList: string, options: AddContentOptions) => {
    const project = await loadProject(options);
    validateName(name, 'Content name');

    const className = resolveGeneratedClassName(name, 'Content');
    const filePath = path.join(project.cwd, getContentDir(project.config), `${toKebabCase(name)}.content.ts`);
    const matches = parseUrlList(urlList);
    const runAt = resolveContentRunAt(options.runAt);

    await writeFileWithGuard(filePath, contentTemplate(className, matches, runAt), options);
    printSchematicSuccess(`Added content ${className}`, [filePath], options);
  });

  addSharedOptions(
    add
      .command('background <name>')
      .description('Add a background class')
      .option('--allow-multiple', 'Allow creating more than one @Background class', false)
  ).action(async (name: string, options: AddBackgroundOptions) => {
    const project = await loadProject(options);
    validateName(name, 'Background name');

    const existing = await collectDecoratedClasses(project.cwd, 'Background');
    if (existing.length > 0 && !options.allowMultiple) {
      throw new Error(`A @Background class already exists (${existing.map(item => item.className).join(', ')}). Re-run with --allow-multiple to add another.`);
    }

    const className = resolveGeneratedClassName(name, 'Background');
    const filePath = path.join(project.cwd, getBackgroundDir(project.config), `${toKebabCase(name)}.background.ts`);

    await writeFileWithGuard(filePath, backgroundTemplate(className), options);
    printSchematicSuccess(`Added background ${className}`, [filePath], options);
  });

  addSharedOptions(
    add
      .command('ui <type>')
      .description('Add a managed UI surface')
  ).action(async (type: string, options: SchematicCommandOptions) => {
    const surface = ensureUiSurface(type);
    const project = await loadProject(options);
    ensureUiSurfaceMissing(project.config, surface);

    const sourceDir = path.join(project.cwd, 'ui', surface);
    const indexFile = path.join(sourceDir, 'index.html');
    const content = surface === 'popup' ? popupFallbackHtmlTemplate() : devtoolsFallbackHtmlTemplate();

    await writeFileWithGuard(indexFile, content, options);
    await updateUiSurfaceConfig(project.configPath, surface, options, {
      mode: 'managed',
      sourceDir: `ui/${surface}`,
      indexFile: 'index.html',
    });

    printSchematicSuccess(`Added ${surface} UI`, [indexFile, project.configPath], options);
  });

  addSharedOptions(
    add
      .command('handler <name> <contentClass>')
      .description('Attach an existing content class to a handler decorator')
  ).action(async (name: string, contentClass: string, options: SchematicCommandOptions) => {
    const project = await loadProject(options);
    validateName(name, 'Handler name');

    const handler = await findClassByName(project.cwd, name, 'Handler', 'Handler');
    if (!handler) {
      throw new Error(`Handler "${name}" was not found in ${getHandlerDir(project.config)}.`);
    }

    const contentEntry = await findClassByName(project.cwd, contentClass, 'Content', 'Content');
    if (!contentEntry) {
      throw new Error(`Content class "${contentClass}" was not found.`);
    }

    const importStatement = `import { ${contentEntry.className} } from '${relativeImport(handler.filePath, contentEntry.filePath)}';`;
    await updateFileWithTransform(handler.filePath, options, content => {
      const next = insertImport(content, importStatement);
      const handlerDecoratorRegex = /@Handler\(\{([\s\S]*?)Contents:\s*\[([^\]]*)\]([\s\S]*?)\}\)/;
      const match = next.match(handlerDecoratorRegex);
      if (!match) {
        throw new Error(`Could not find @Handler decorator with Contents array in ${handler.filePath}.`);
      }

      const currentContents = match[2].split(',').map(value => value.trim()).filter(Boolean);
      if (currentContents.includes(contentEntry.className)) {
        return next;
      }

      const updatedContents = [...currentContents, contentEntry.className].join(', ');
      return next.replace(handlerDecoratorRegex, `@Handler({${match[1]}Contents: [${updatedContents}]${match[3]}})`);
    });

    printSchematicSuccess(`Attached ${contentEntry.className} to ${handler.className}`, [handler.filePath], options);
  });
};