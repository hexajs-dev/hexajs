import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Container, Inject, Injectable, HexaContext, createToken, inject, setContainer } from '../index';
import { getInjectMetadata, getInjectableMetadata, isBrandedToken } from '../src/di/metadata';

describe('common DI container and token contracts', () => {
  beforeEach(() => {
    setContainer(null as unknown as Container);
  });

  it('resolves registered providers as singletons', () => {
    const container = new Container();
    const factory = vi.fn(() => ({ value: 42 }));

    container.register('SERVICE', factory);

    const first = container.resolve<{ value: number }>('SERVICE');
    const second = container.resolve<{ value: number }>('SERVICE');

    expect(first).toEqual({ value: 42 });
    expect(second).toBe(first);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('auto-wires constructor dependencies from Inject metadata', () => {
    const LOGGER = createToken('LOGGER', {}, HexaContext.Background);

    @Injectable({ context: HexaContext.Background })
    class Greeter {
      constructor(@Inject(LOGGER) readonly logger: { name: string }) {}
    }

    const container = new Container();
    container.register('LOGGER', () => ({ name: 'hexa' }));

    const greeter = container.resolve<Greeter>(Greeter);

    expect(greeter.logger).toEqual({ name: 'hexa' });
    expect(getInjectMetadata(Greeter)).toEqual(['LOGGER']);
    expect(getInjectableMetadata(Greeter)).toEqual({ context: HexaContext.Background });
  });

  it('detects circular dependencies during resolution', () => {
    const container = new Container();

    container.register('A', (c) => ({ dep: c.resolve('B') }));
    container.register('B', (c) => ({ dep: c.resolve('A') }));

    expect(() => container.resolve('A')).toThrow('Circular dependency detected');
  });

  it('throws a clear error when global inject runs before bootstrap', () => {
    expect(() => inject('SERVICE')).toThrow('inject() called before the DI container was initialized');
  });

  it('resolves global inject tokens after container bootstrap', () => {
    const container = new Container();
    container.register('SERVICE', () => ({ ok: true }));
    setContainer(container);

    const resolved = inject<{ ok: boolean }>('SERVICE');

    expect(resolved).toEqual({ ok: true });
  });

  it('brands and freezes created token objects', () => {
    const token = createToken('AUTH_TOKEN', { scope: 'test' }, HexaContext.UI);

    expect(isBrandedToken(token)).toBe(true);
    expect(Object.isFrozen(token)).toBe(true);
  });

  it('rejects unbranded object tokens in Inject decorator', () => {
    expect(() => {
      class InvalidInjection {
        constructor(@Inject({ key: 'BROKEN' } as any) readonly value: unknown) {}
      }

      return InvalidInjection;
    }).toThrow('must be created via createToken()');
  });
});
