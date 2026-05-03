import { describe, expect, it } from 'vitest';
import { Container, Inject, Injectable, HexaContext, createToken } from '../index';
import { getInjectMetadata, getInjectableMetadata, setInjectMetadata } from '../src/di/metadata';

describe('DI metadata hardening contracts', () => {
  it('stores Injectable metadata as an immutable copy', () => {
    const options = { context: HexaContext.Background };

    @Injectable(options)
    class BackgroundService {}

    options.context = HexaContext.UI;

    const stored = getInjectableMetadata(BackgroundService);

    expect(stored).toEqual({ context: HexaContext.Background });
    expect(Object.isFrozen(stored)).toBe(true);
  });

  it('stores Inject metadata as immutable snapshot independent from caller array', () => {
    class Target {}

    const initial = ['TOKEN_A'];
    setInjectMetadata(Target, initial);
    initial[0] = 'TOKEN_B';

    const stored = getInjectMetadata(Target);

    expect(stored).toEqual(['TOKEN_A']);
    expect(Object.isFrozen(stored)).toBe(true);
  });

  it('supports mixed string and token-ref constructor injections with sparse indexes', () => {
    const API_TOKEN = createToken('API_TOKEN', 'secret', HexaContext.Background);

    @Injectable({ context: HexaContext.Background })
    class MixedInjectionService {
      constructor(
        @Inject('STRING_TOKEN') readonly first: string,
        @Inject(API_TOKEN) readonly second: string,
        readonly third: unknown,
        @Inject('TAIL_TOKEN') readonly fourth: string,
      ) {}
    }

    expect(getInjectMetadata(MixedInjectionService)).toEqual(['STRING_TOKEN', 'API_TOKEN', undefined, 'TAIL_TOKEN']);
  });

  it('keeps Injectable metadata isolated per class in inheritance chains', () => {
    @Injectable({ context: HexaContext.Content })
    class ParentService {}

    class ChildService extends ParentService {}

    expect(getInjectableMetadata(ParentService)).toEqual({ context: HexaContext.Content });
    expect(getInjectableMetadata(ChildService)).toBeUndefined();
  });

  it('resolves sparse constructor metadata with undefined holes preserved', () => {
    @Injectable({ context: HexaContext.Background })
    class SparseDependencies {
      constructor(
        @Inject('FIRST_TOKEN') readonly first: string,
        readonly middle: unknown,
        @Inject('THIRD_TOKEN') readonly third: string,
      ) {}
    }

    const container = new Container();
    container.register('FIRST_TOKEN', () => 'first');
    container.register('THIRD_TOKEN', () => 'third');

    const resolved = container.resolve<SparseDependencies>(SparseDependencies);

    expect(resolved.first).toBe('first');
    expect(resolved.middle).toBeUndefined();
    expect(resolved.third).toBe('third');
  });
});
