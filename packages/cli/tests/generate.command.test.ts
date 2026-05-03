import { Command } from 'commander';
import * as path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli } from './helpers/command.utils';

const shared = vi.hoisted(() => ({
  ensureContext: vi.fn(),
  ensureStoreContext: vi.fn(),
  getControllerDir: vi.fn(),
  getHandlerDir: vi.fn(),
  getServicesDir: vi.fn(),
  getStoreDir: vi.fn(),
  insertImport: vi.fn(),
  loadProject: vi.fn(),
  mapHexaContext: vi.fn(),
  printSchematicSuccess: vi.fn(),
  readFileIfExists: vi.fn(),
  resolveGeneratedClassName: vi.fn(),
  toCamelCase: vi.fn(),
  toKebabCase: vi.fn(),
  updateFileWithTransform: vi.fn(),
  validateName: vi.fn(),
  writeFileWithGuard: vi.fn(),
}));

const controllerTemplateMock = vi.hoisted(() => vi.fn(() => '// controller template'));
const handlerTemplateMock = vi.hoisted(() => vi.fn(() => '// handler template'));
const reducerTemplateMock = vi.hoisted(() => vi.fn(() => '// reducer template'));
const serviceTemplateMock = vi.hoisted(() => vi.fn(() => '// service template'));
const stateTemplateMock = vi.hoisted(() => vi.fn(() => '// state template'));

vi.mock('../src/bin/programs/schematics/templates', () => ({
  controllerTemplate: controllerTemplateMock,
  handlerTemplate: handlerTemplateMock,
  reducerTemplate: reducerTemplateMock,
  serviceTemplate: serviceTemplateMock,
  stateTemplate: stateTemplateMock,
}));

vi.mock('../src/bin/programs/schematics/shared', () => ({
  addSharedOptions: (command: Command) => command,
  ensureContext: shared.ensureContext,
  ensureStoreContext: shared.ensureStoreContext,
  getControllerDir: shared.getControllerDir,
  getHandlerDir: shared.getHandlerDir,
  getServicesDir: shared.getServicesDir,
  getStoreDir: shared.getStoreDir,
  insertImport: shared.insertImport,
  loadProject: shared.loadProject,
  mapHexaContext: shared.mapHexaContext,
  printSchematicSuccess: shared.printSchematicSuccess,
  readFileIfExists: shared.readFileIfExists,
  resolveGeneratedClassName: shared.resolveGeneratedClassName,
  toCamelCase: shared.toCamelCase,
  toKebabCase: shared.toKebabCase,
  updateFileWithTransform: shared.updateFileWithTransform,
  validateName: shared.validateName,
  writeFileWithGuard: shared.writeFileWithGuard,
}));

import { generateCommand } from '../src/bin/programs/generate';

describe('generate command', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    shared.loadProject.mockResolvedValue({
      cwd: 'D:/repo',
      configPath: 'D:/repo/hexa-cli.config.json',
      config: { project: { sourceRoot: 'src' } },
    });
    shared.resolveGeneratedClassName.mockImplementation((name: string, suffix: string) => `${name[0].toUpperCase()}${name.slice(1)}${suffix}`);
    shared.toKebabCase.mockImplementation((name: string) => name.toLowerCase());
    shared.toCamelCase.mockImplementation((name: string) => `${name[0].toLowerCase()}${name.slice(1)}`);
    shared.getControllerDir.mockReturnValue(path.join('src', 'background'));
    shared.getHandlerDir.mockReturnValue(path.join('src', 'content'));
    shared.getServicesDir.mockReturnValue(path.join('src', 'services'));
    shared.getStoreDir.mockReturnValue(path.join('src', 'background', 'store'));
    shared.ensureContext.mockImplementation((value: string) => value);
    shared.ensureStoreContext.mockImplementation((value: string) => value);
    shared.mapHexaContext.mockReturnValue('HexaContext.Background');
    shared.insertImport.mockImplementation((content: string) => content);
    shared.readFileIfExists.mockResolvedValue('// reducer exists');
    shared.updateFileWithTransform.mockResolvedValue(true);
  });

  it('routes generate controller and writes controller file with default namespace', async () => {
    const program = new Command();
    generateCommand(program);

    await runCli(program, ['generate', 'controller', 'user']);

    expect(controllerTemplateMock).toHaveBeenCalledWith('UserController', 'user');
    expect(shared.writeFileWithGuard).toHaveBeenCalledWith(
      expect.stringContaining(path.join('src', 'background', 'user.controller.ts')),
      '// controller template',
      expect.any(Object)
    );
  });

  it('routes generate service and maps injectable context', async () => {
    const program = new Command();
    generateCommand(program);

    await runCli(program, ['generate', 'service', 'logger', 'background']);

    expect(shared.ensureContext).toHaveBeenCalledWith('background');
    expect(serviceTemplateMock).toHaveBeenCalledWith('LoggerService', 'background', 'HexaContext.Background');
    expect(shared.writeFileWithGuard).toHaveBeenCalledWith(
      expect.stringContaining(path.join('src', 'services', 'logger.service.ts')),
      '// service template',
      expect.any(Object)
    );
  });

  it('fails generate state when reducer file does not exist', async () => {
    shared.ensureStoreContext.mockReturnValue('background');
    shared.readFileIfExists.mockResolvedValueOnce(null);

    const program = new Command();
    generateCommand(program);

    await expect(runCli(program, ['generate', 'state', 'user', 'background'])).rejects.toThrow('Reducer file not found');

    expect(shared.writeFileWithGuard).not.toHaveBeenCalled();
  });
});
