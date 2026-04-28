import chalk from 'chalk';
import fg from 'fast-glob';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Command } from 'commander';
import { HexaConfig, UiSurfaceConfig, loadHexaConfigFrom } from '../../config/config';
import { relativePathFromCwd } from '../../../shared/path-utils';

export type HexaRuntimeContext = 'background' | 'content' | 'general' | 'ui';
export type UiSurface = 'devtools' | 'popup';

export interface SchematicCommandOptions {
  cwd?: string;
  dryRun?: boolean;
  force?: boolean;
  verbose?: boolean;
}

export interface LoadedProject {
  config: HexaConfig;
  configPath: string;
  cwd: string;
}

export interface LocatedClass {
  className: string;
  filePath: string;
}

const VALID_NAME_RE = /^[a-zA-Z][a-zA-Z0-9-_]*$/;
const CONTENT_RUN_AT = new Map<string, string>([
  ['document-start', 'ContentRunAt.DocumentStart'],
  ['document-end', 'ContentRunAt.DocumentEnd'],
  ['document-idle', 'ContentRunAt.DocumentIdle'],
]);

export function addSharedOptions(command: Command): Command {
  return command
    .option('--cwd <path>', 'Project directory', process.cwd())
    .option('--dry-run', 'Preview changes without writing files', false)
    .option('--force', 'Overwrite existing files', false)
    .option('--verbose', 'Print additional details', false);
}

export function toPascalCase(value: string): string {
  return value
    .replace(/(^|[-_\s]+)([a-zA-Z0-9])/g, (_match, _prefix, chunk: string) => chunk.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

export function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return pascal ? pascal.charAt(0).toLowerCase() + pascal.slice(1) : pascal;
}

export function resolveGeneratedClassName(name: string, suffix: string): string {
  const pascal = toPascalCase(name);
  return pascal.endsWith(suffix) ? pascal : `${pascal}${suffix}`;
}

export function validateName(name: string, label: string): void {
  if (!VALID_NAME_RE.test(name)) {
    throw new Error(`${label} "${name}" is invalid. Use letters, numbers, hyphens, and underscores, starting with a letter.`);
  }
}

export function ensureContext(value: string): HexaRuntimeContext {
  if (value === 'background' || value === 'content' || value === 'general' || value === 'ui') {
    return value;
  }
  throw new Error(`Unknown context "${value}". Allowed values: background, content, general, ui.`);
}

export function ensureStoreContext(value: string): 'background' | 'content' {
  if (value === 'background' || value === 'content') {
    return value;
  }
  throw new Error(`Unknown store context "${value}". Allowed values: background, content.`);
}

export function ensureUiSurface(value: string): UiSurface {
  if (value === 'popup' || value === 'devtools') {
    return value;
  }
  throw new Error(`Unknown UI type "${value}". Allowed values: popup, devtools.`);
}

export function parseUrlList(raw: string): string[] {
  const matches = raw.split(',').map(match => match.trim()).filter(Boolean);
  if (matches.length === 0) {
    throw new Error('URL_LIST must contain at least one match pattern.');
  }
  return matches;
}

export function resolveContentRunAt(raw: string | undefined): string {
  const key = (raw || 'document-idle').toLowerCase();
  const value = CONTENT_RUN_AT.get(key);
  if (!value) {
    throw new Error(`Unknown runAt value "${raw}". Allowed values: document-start, document-end, document-idle.`);
  }
  return value;
}

export function getConfigPath(cwd: string): string {
  const preferred = path.join(cwd, 'hexa-cli.config.json');
  if (fs.existsSync(preferred)) {
    return preferred;
  }
  return path.join(cwd, 'hexa-cli.json');
}

export async function loadProject(options: SchematicCommandOptions): Promise<LoadedProject> {
  const cwd = path.resolve(options.cwd || process.cwd());
  const configPath = getConfigPath(cwd);
  if (!(await fs.pathExists(configPath))) {
    throw new Error(`Hexa config not found at ${configPath}. Run this inside a HexaJS project.`);
  }

  const config = await loadHexaConfigFrom(cwd);
  return { config, configPath, cwd };
}

export function getControllerDir(config: HexaConfig): string {
  return path.join(config.project.sourceRoot, 'background');
}

export function getHandlerDir(config: HexaConfig): string {
  return path.join(config.project.sourceRoot, 'content');
}

export function getServicesDir(config: HexaConfig): string {
  return path.join(config.project.sourceRoot, 'services');
}

export function getStoreDir(config: HexaConfig, context: 'background' | 'content'): string {
  return path.join(config.project.sourceRoot, context, 'store');
}

export function getContentDir(config: HexaConfig): string {
  return path.join(config.project.sourceRoot, 'content');
}

export function getBackgroundDir(config: HexaConfig): string {
  return path.join(config.project.sourceRoot, 'background');
}

export async function collectDecoratedClasses(cwd: string, decoratorName: string): Promise<LocatedClass[]> {
  const files = await fg(['src/**/*.ts'], { cwd, absolute: true });
  const matches: LocatedClass[] = [];

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf8');
    if (!content.includes(`@${decoratorName}`)) {
      continue;
    }

    const classRegex = /@\w+(?:\([^]*?\))?\s*export class\s+(\w+)/g;
    for (const match of content.matchAll(classRegex)) {
      const prefix = content.slice(0, match.index || 0);
      const lastDecoratorIndex = prefix.lastIndexOf(`@${decoratorName}`);
      if (lastDecoratorIndex === -1) {
        continue;
      }
      const classBlockStart = prefix.lastIndexOf('export class');
      if (classBlockStart > lastDecoratorIndex) {
        continue;
      }
      matches.push({ className: match[1], filePath });
    }
  }

  return matches;
}

export async function findClassByName(cwd: string, requestedName: string, suffix: string, decoratorName?: string): Promise<LocatedClass | null> {
  const exactClassNames = new Set<string>([requestedName, resolveGeneratedClassName(requestedName, suffix)]);
  const files = await fg(['src/**/*.ts'], { cwd, absolute: true });

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf8');
    for (const className of exactClassNames) {
      const classPattern = new RegExp(`export class\\s+${className}\\b`);
      if (!classPattern.test(content)) {
        continue;
      }
      if (decoratorName && !new RegExp(`@${decoratorName}\\b`).test(content)) {
        continue;
      }
      return { className, filePath };
    }
  }

  return null;
}

export async function readFileIfExists(filePath: string): Promise<string | null> {
  return (await fs.pathExists(filePath)) ? fs.readFile(filePath, 'utf8') : null;
}

export async function writeFileWithGuard(filePath: string, content: string, options: SchematicCommandOptions): Promise<void> {
  const exists = await fs.pathExists(filePath);
  if (exists && !options.force) {
    throw new Error(`File already exists: ${filePath}. Re-run with --force to overwrite.`);
  }

  if (options.dryRun) {
    logDryRun(`write ${relativePathFromCwd(filePath)}`);
    return;
  }

  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
}

export async function updateFileWithTransform(filePath: string, options: SchematicCommandOptions, transform: (content: string) => string): Promise<boolean> {
  const current = await readFileIfExists(filePath);
  if (current === null) {
    throw new Error(`File not found: ${filePath}`);
  }

  const next = transform(current);
  if (next === current) {
    return false;
  }

  if (options.dryRun) {
    logDryRun(`update ${relativePathFromCwd(filePath)}`);
    return true;
  }

  await fs.writeFile(filePath, next, 'utf8');
  return true;
}

export function insertImport(content: string, importStatement: string): string {
  if (content.includes(importStatement)) {
    return content;
  }

  const importMatches = [...content.matchAll(/^import .*;$/gm)];
  if (importMatches.length === 0) {
    return `${importStatement}\n${content}`;
  }

  const lastImport = importMatches[importMatches.length - 1];
  const insertAt = (lastImport.index || 0) + lastImport[0].length;
  return `${content.slice(0, insertAt)}\n${importStatement}${content.slice(insertAt)}`;
}

export function relativeImport(fromFile: string, toFile: string): string {
  let rel = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/').replace(/\.ts$/, '');
  if (!rel.startsWith('.')) {
    rel = `./${rel}`;
  }
  return rel;
}

export function mapInjectableContext(context: HexaRuntimeContext): string | null {
  switch (context) {
    case 'background': return 'InjectableContext.Background';
    case 'content': return 'InjectableContext.Content';
    case 'ui': return 'InjectableContext.UI';
    case 'general': return null;
  }
}

export function ensureUiSurfaceMissing(config: HexaConfig, surface: UiSurface): void {
  const surfaceConfig = config.ui?.[surface];
  if (surfaceConfig && surfaceConfig.mode && surfaceConfig.mode !== 'none') {
    throw new Error(`UI surface "${surface}" is already configured with mode "${surfaceConfig.mode}".`);
  }
}

export async function updateUiSurfaceConfig(configPath: string, surface: UiSurface, options: SchematicCommandOptions, overrides: UiSurfaceConfig): Promise<void> {
  const raw = await fs.readJSON(configPath) as HexaConfig;
  const next: HexaConfig = {
    ...raw,
    ui: {
      ...(raw.ui || {}),
      [surface]: {
        ...((raw.ui || {})[surface] || {}),
        ...overrides,
      },
    },
  };

  if (options.dryRun) {
    logDryRun(`update ${relativePathFromCwd(configPath)}`);
    return;
  }

  await fs.writeJSON(configPath, next, { spaces: 2 });
}

export function printSchematicSuccess(title: string, files: string[], options: SchematicCommandOptions): void {
  console.log(chalk.green(`✓ ${title}`));
  if (options.verbose || options.dryRun) {
    files.forEach(file => console.log(chalk.gray(`  - ${relativePathFromCwd(file)}`)));
  }
}

function logDryRun(message: string): void {
  console.log(chalk.yellow(`DRY RUN ${message}`));
}