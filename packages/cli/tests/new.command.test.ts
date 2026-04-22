import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli } from './helpers/command.utils';

const promptMock = vi.hoisted(() => vi.fn());
const scaffoldMock = vi.hoisted(() => vi.fn());
const printErrorMock = vi.hoisted(() => vi.fn());
const printSuccessMock = vi.hoisted(() => vi.fn());

vi.mock('enquirer', () => ({
  default: { prompt: promptMock },
}));

vi.mock('../src/bin/programs/new/services/scaffold.service', () => ({
  scaffold: scaffoldMock,
}));

vi.mock('../src/bin/shared/reporter', () => ({
  printError: printErrorMock,
  printSuccess: printSuccessMock,
}));

import { newCommand } from '../src/bin/programs/new/new';

describe('new command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    scaffoldMock.mockResolvedValue('D:/tmp/my-extension');
  });

  it('uses explicit --platform list and calls scaffold with parsed platforms', async () => {
    promptMock
      .mockResolvedValueOnce({ template: 'full' })
      .mockResolvedValueOnce({ reactPopup: false })
      .mockResolvedValueOnce({ managedDevtools: false });

    const program = new Command();
    newCommand(program);

    await runCli(program, ['new', 'my-extension', '--platform', 'chrome,firefox']);

    expect(scaffoldMock).toHaveBeenCalledTimes(1);
    expect(scaffoldMock).toHaveBeenCalledWith({
      name: 'my-extension',
      platforms: ['chrome', 'firefox'],
      reactPopup: false,
      managedDevtools: false,
      reactDevtools: false,
      blank: false,
    });
    expect(printSuccessMock).toHaveBeenCalledTimes(1);
  });

  it('prompts for platform selection when --platform is omitted', async () => {
    promptMock
      .mockResolvedValueOnce({ template: 'full' })
      .mockResolvedValueOnce({ platforms: ['chrome', 'edge'] })
      .mockResolvedValueOnce({ reactPopup: true })
      .mockResolvedValueOnce({ managedDevtools: true });

    const program = new Command();
    newCommand(program);

    await runCli(program, ['new', 'my-extension']);

    expect(scaffoldMock).toHaveBeenCalledWith({
      name: 'my-extension',
      platforms: ['chrome', 'edge'],
      reactPopup: true,
      managedDevtools: true,
      reactDevtools: true,
      blank: false,
    });
  });

  it('reports error and exits when --platform contains invalid values', async () => {
    promptMock.mockResolvedValueOnce({ template: 'full' });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code}`);
    }) as never);

    const program = new Command();
    newCommand(program);

    await expect(runCli(program, ['new', 'my-extension', '--platform', 'chrome,invalid'])).rejects.toThrow('process.exit:1');

    expect(printErrorMock).toHaveBeenCalledTimes(1);
    expect(String(printErrorMock.mock.calls[0][0])).toContain('Unknown platform');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('returns silently when prompt is canceled by user', async () => {
    promptMock.mockRejectedValueOnce('');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code}`);
    }) as never);

    const program = new Command();
    newCommand(program);

    await runCli(program, ['new', 'bad name']);

    expect(scaffoldMock).not.toHaveBeenCalled();
    expect(printErrorMock).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
