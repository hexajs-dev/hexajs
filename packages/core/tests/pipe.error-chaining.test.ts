import { describe, expect, it, vi } from 'vitest';
import { HexaPipeRunner } from '../src/services/hexa-pipe-runner';
import { HexaPipeValidationError } from '../src/services/hexa-client.base';

describe('HexaPipeRunner error chaining hardening', () => {
  it('executes inbound pipes in order and passes transformed payload through chain', async () => {
    const runner = new HexaPipeRunner();
    const first = vi.fn((input: any) => ({ ...input.payload, stage: 1 }));
    const second = vi.fn((input: any) => ({ ...input.payload, stage: 2 }));

    runner.usePipe(first);
    runner.usePipe(second);

    const result = await runner.runInboundPipes({
      route: 'test:action',
      payload: { value: 1 },
      sender: { tabId: 1 },
      context: 'background',
    });

    expect(first).toHaveBeenCalledWith(expect.objectContaining({ payload: { value: 1 } }));
    expect(second).toHaveBeenCalledWith(expect.objectContaining({ payload: { value: 1, stage: 1 } }));
    expect(result).toEqual({ value: 1, stage: 2 });
  });

  it('throws HexaPipeValidationError and stops remaining inbound pipes on valid=false result', async () => {
    const runner = new HexaPipeRunner();
    const first = vi.fn(() => ({ valid: false, error: 'blocked', code: 'PIPE_BLOCKED', details: { field: 'name' } }));
    const second = vi.fn(() => ({ shouldNotRun: true }));

    runner.usePipe(first);
    runner.usePipe(second);

    await expect(
      runner.runInboundPipes({
        route: 'test:action',
        payload: { value: 1 },
        sender: null,
        context: 'content',
      }),
    ).rejects.toMatchObject({
      name: 'HexaPipeValidationError',
      message: 'blocked',
      code: 'PIPE_BLOCKED',
      details: { field: 'name' },
    } as Partial<HexaPipeValidationError>);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it('treats valid=true objects as validation markers and keeps previous payload', async () => {
    const runner = new HexaPipeRunner();
    const second = vi.fn((input: any) => input.payload);

    runner.usePipe(() => ({ valid: true, transformed: true } as any));
    runner.usePipe(second);

    const result = await runner.runInboundPipes({
      route: 'test:action',
      payload: { value: 5 },
      sender: null,
      context: 'background',
    });

    expect(second).toHaveBeenCalledWith(expect.objectContaining({ payload: { value: 5 } }));
    expect(result).toEqual({ value: 5 });
  });

  it('propagates outbound thrown errors and skips remaining outbound pipes', async () => {
    const runner = new HexaPipeRunner();
    const first = vi.fn(() => {
      throw new Error('outbound failed');
    });
    const second = vi.fn(() => ({ shouldNotRun: true }));

    runner.useOutboundPipe(first);
    runner.useOutboundPipe(second);

    await expect(
      runner.runOutboundPipes({
        route: 'test:action',
        payload: { ok: true },
        sender: null,
        context: 'background',
      }),
    ).rejects.toThrow('outbound failed');

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });
});
