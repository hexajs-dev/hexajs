import { Command } from 'commander';
import * as path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli } from './helpers/command.utils';

const shared = vi.hoisted(() => ({
  collectDecoratedClasses: vi.fn(),
  ensureUiSurface: vi.fn(),
  ensureUiSurfaceMissing: vi.fn(),
  findClassByName: vi.fn(),
  getBackgroundDir: vi.fn(),
  getContentDir: vi.fn(),
  getHandlerDir: vi.fn(),
  insertImport: vi.fn(),
  loadProject: vi.fn(),
  parseUrlList: vi.fn(),
  printSchematicSuccess: vi.fn(),
  relativeImport: vi.fn(),
  resolveContentRunAt: vi.fn(),
  resolveGeneratedClassName: vi.fn(),
  toKebabCase: vi.fn(),
  updateFileWithTransform: vi.fn(),
  updateUiSurfaceConfig: vi.fn(),
  validateName: vi.fn(),
  writeFileWithGuard: vi.fn(),
}));

const popupFallbackHtmlTemplateMock = vi.hoisted(() => vi.fn(() => '<popup-fallback/>'));
const devtoolsFallbackHtmlTemplateMock = vi.hoisted(() => vi.fn(() => '<devtools-fallback/>'));
const backgroundTemplateMock = vi.hoisted(() => vi.fn(() => '// background template'));
const contentTemplateMock = vi.hoisted(() => vi.fn(() => '// content template'));

vi.mock('../src/bin/programs/new/templates/popup-fallback-html.template', () => ({
  popupFallbackHtmlTemplate: popupFallbackHtmlTemplateMock,
}));

vi.mock('../src/bin/programs/new/templates/devtools-fallback-html.template', () => ({
  devtoolsFallbackHtmlTemplate: devtoolsFallbackHtmlTemplateMock,
}));

vi.mock('../src/bin/programs/schematics/templates', () => ({
  backgroundTemplate: backgroundTemplateMock,
  contentTemplate: contentTemplateMock,
}));

vi.mock('../src/bin/programs/schematics/shared', () => ({
  addSharedOptions: (command: Command) => command,
  collectDecoratedClasses: shared.collectDecoratedClasses,
  ensureUiSurface: shared.ensureUiSurface,
  ensureUiSurfaceMissing: shared.ensureUiSurfaceMissing,
  findClassByName: shared.findClassByName,
  getBackgroundDir: shared.getBackgroundDir,
  getContentDir: shared.getContentDir,
  getHandlerDir: shared.getHandlerDir,
  insertImport: shared.insertImport,
  loadProject: shared.loadProject,
  parseUrlList: shared.parseUrlList,
  printSchematicSuccess: shared.printSchematicSuccess,
  relativeImport: shared.relativeImport,
  resolveContentRunAt: shared.resolveContentRunAt,
  resolveGeneratedClassName: shared.resolveGeneratedClassName,
  toKebabCase: shared.toKebabCase,
  updateFileWithTransform: shared.updateFileWithTransform,
  updateUiSurfaceConfig: shared.updateUiSurfaceConfig,
  validateName: shared.validateName,
  writeFileWithGuard: shared.writeFileWithGuard,
}));

import { addCommand } from '../src/bin/programs/add';

describe('add command', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    shared.loadProject.mockResolvedValue({
      cwd: 'D:/repo',
      configPath: 'D:/repo/hexa-cli.config.json',
      config: { project: { sourceRoot: 'src' } },
    });
    shared.getContentDir.mockReturnValue(path.join('src', 'content'));
    shared.getBackgroundDir.mockReturnValue(path.join('src', 'background'));
    shared.getHandlerDir.mockReturnValue(path.join('src', 'content'));
    shared.resolveGeneratedClassName.mockImplementation((name: string, suffix: string) => `${name[0].toUpperCase()}${name.slice(1)}${suffix}`);
    shared.toKebabCase.mockImplementation((name: string) => name.toLowerCase());
    shared.parseUrlList.mockReturnValue(['https://*/*']);
    shared.resolveContentRunAt.mockReturnValue('ContentRunAt.DocumentIdle');
    shared.collectDecoratedClasses.mockResolvedValue([]);
    shared.ensureUiSurface.mockImplementation((value: string) => value);
    shared.insertImport.mockImplementation((content: string) => content);
    shared.updateFileWithTransform.mockResolvedValue(undefined);
    shared.relativeImport.mockReturnValue('../content/user.content');
  });

  it('routes add content and writes the content schematic file', async () => {
    const program = new Command();
    addCommand(program);

    await runCli(program, ['add', 'content', 'user', 'https://*/*']);

    expect(contentTemplateMock).toHaveBeenCalledWith('UserContent', ['https://*/*'], 'ContentRunAt.DocumentIdle');
    expect(shared.writeFileWithGuard).toHaveBeenCalledTimes(1);
    expect(String(shared.writeFileWithGuard.mock.calls[0][0])).toContain(path.join('src', 'content', 'user.content.ts'));
    expect(shared.printSchematicSuccess).toHaveBeenCalledWith(
      'Added content UserContent',
      [expect.stringContaining(path.join('src', 'content', 'user.content.ts'))],
      expect.any(Object)
    );
  });

  it('routes add content with an explicit run-at value', async () => {
    shared.parseUrlList.mockReturnValueOnce(['https://example.com/*']);
    shared.resolveContentRunAt.mockReturnValueOnce('ContentRunAt.DocumentStart');

    const program = new Command();
    addCommand(program);

    await runCli(program, ['add', 'content', 'metrics', 'https://example.com/*', '--run-at', 'document-start']);

    expect(shared.resolveContentRunAt).toHaveBeenCalledWith('document-start');
    expect(contentTemplateMock).toHaveBeenCalledWith('MetricsContent', ['https://example.com/*'], 'ContentRunAt.DocumentStart');
  });

  it('rejects add background when a background class exists and allow-multiple is false', async () => {
    shared.collectDecoratedClasses.mockResolvedValue([{ className: 'MainBackground', filePath: 'D:/repo/src/background/main.background.ts' }]);

    const program = new Command();
    addCommand(program);

    await expect(runCli(program, ['add', 'background', 'main'])).rejects.toThrow('A @Background class already exists');

    expect(shared.writeFileWithGuard).not.toHaveBeenCalled();
  });

  it('routes add background with allow-multiple when an existing class is present', async () => {
    shared.collectDecoratedClasses.mockResolvedValue([{ className: 'MainBackground', filePath: 'D:/repo/src/background/main.background.ts' }]);

    const program = new Command();
    addCommand(program);

    await runCli(program, ['add', 'background', 'secondary', '--allow-multiple']);

    expect(backgroundTemplateMock).toHaveBeenCalledWith('SecondaryBackground');
    expect(shared.writeFileWithGuard).toHaveBeenCalledTimes(1);
    expect(String(shared.writeFileWithGuard.mock.calls[0][0])).toContain(path.join('src', 'background', 'secondary.background.ts'));
    expect(shared.printSchematicSuccess).toHaveBeenCalledWith(
      'Added background SecondaryBackground',
      [expect.stringContaining(path.join('src', 'background', 'secondary.background.ts'))],
      expect.any(Object)
    );
  });

  it('routes add ui popup and updates project ui config', async () => {
    shared.ensureUiSurface.mockReturnValue('popup');

    const program = new Command();
    addCommand(program);

    await runCli(program, ['add', 'ui', 'popup']);

    expect(popupFallbackHtmlTemplateMock).toHaveBeenCalledTimes(1);
    expect(shared.writeFileWithGuard).toHaveBeenCalledWith(
      expect.stringContaining(path.join('ui', 'popup', 'index.html')),
      '<popup-fallback/>',
      expect.any(Object)
    );
    expect(shared.updateUiSurfaceConfig).toHaveBeenCalledWith(
      'D:/repo/hexa-cli.config.json',
      'popup',
      expect.any(Object),
      {
        mode: 'managed',
        sourceDir: 'ui/popup',
        indexFile: 'index.html',
      }
    );
  });

  it('routes add ui devtools and updates project ui config', async () => {
    shared.ensureUiSurface.mockReturnValue('devtools');

    const program = new Command();
    addCommand(program);

    await runCli(program, ['add', 'ui', 'devtools']);

    expect(devtoolsFallbackHtmlTemplateMock).toHaveBeenCalledTimes(1);
    expect(shared.writeFileWithGuard).toHaveBeenCalledWith(
      expect.stringContaining(path.join('ui', 'devtools', 'index.html')),
      '<devtools-fallback/>',
      expect.any(Object)
    );
    expect(shared.updateUiSurfaceConfig).toHaveBeenCalledWith(
      'D:/repo/hexa-cli.config.json',
      'devtools',
      expect.any(Object),
      {
        mode: 'managed',
        sourceDir: 'ui/devtools',
        indexFile: 'index.html',
      }
    );
  });

  it('routes add handler and appends content class to handler decorator Contents', async () => {
    shared.findClassByName
      .mockResolvedValueOnce({ className: 'DomHandler', filePath: 'D:/repo/src/handlers/dom.handler.ts' })
      .mockResolvedValueOnce({ className: 'UserContent', filePath: 'D:/repo/src/content/user.content.ts' });
    shared.insertImport.mockImplementation((content: string, importStatement: string) => `${importStatement}\n${content}`);
    shared.updateFileWithTransform.mockImplementation(async (_filePath: string, _options: unknown, transform: (content: string) => string) => {
      const next = transform('@Handler({ Contents: [] })\nexport class DomHandler {}');
      expect(next).toContain("import { UserContent } from '../content/user.content';");
      expect(next).toContain('Contents: [UserContent]');
    });

    const program = new Command();
    addCommand(program);

    await runCli(program, ['add', 'handler', 'dom', 'user']);

    expect(shared.findClassByName).toHaveBeenNthCalledWith(1, 'D:/repo', 'dom', 'Handler', 'Handler');
    expect(shared.findClassByName).toHaveBeenNthCalledWith(2, 'D:/repo', 'user', 'Content', 'Content');
    expect(shared.updateFileWithTransform).toHaveBeenCalledWith(
      'D:/repo/src/handlers/dom.handler.ts',
      expect.any(Object),
      expect.any(Function)
    );
    expect(shared.printSchematicSuccess).toHaveBeenCalledWith(
      'Attached UserContent to DomHandler',
      ['D:/repo/src/handlers/dom.handler.ts'],
      expect.any(Object)
    );
  });

  it('fails fast when project sourceRoot escapes the project root', async () => {
    shared.loadProject.mockRejectedValueOnce(new Error('Invalid project.sourceRoot "../outside". sourceRoot must stay within the project root.'));

    const program = new Command();
    addCommand(program);

    await expect(runCli(program, ['add', 'content', 'user', 'https://*/*'])).rejects.toThrow(/sourceRoot must stay within the project root/i);
    expect(shared.writeFileWithGuard).not.toHaveBeenCalled();
  });
});
