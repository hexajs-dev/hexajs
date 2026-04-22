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

  it('rejects add background when a background class exists and allow-multiple is false', async () => {
    shared.collectDecoratedClasses.mockResolvedValue([{ className: 'MainBackground', filePath: 'D:/repo/src/background/main.background.ts' }]);

    const program = new Command();
    addCommand(program);

    await expect(runCli(program, ['add', 'background', 'main'])).rejects.toThrow('A @Background class already exists');

    expect(shared.writeFileWithGuard).not.toHaveBeenCalled();
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
});
