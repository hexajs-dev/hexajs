import { describe, expect, it } from 'vitest';
import { Container } from '../../common/src/di/container';
import { createToken, Inject, Injectable } from '../../common/src/di/decorators';

describe('common DI security', () => {
  it('ignores tampering with public __hexa_injects__ properties', () => {
    class SecureService {
      constructor(readonly dep: string) {}
    }

    Injectable()(SecureService);
    Inject('SAFE_DEP')(SecureService, undefined, 0);

    const container = new Container();
    container.register('SAFE_DEP', () => 'safe');
    container.register('EVIL_DEP', () => 'evil');
    (SecureService as any).__hexa_injects__ = ['EVIL_DEP'];

    const service = container.resolve<SecureService>(SecureService);

    expect(service.dep).toBe('safe');
  });

  it('rejects forged token objects passed to Inject()', () => {
    expect(() => {
      class ForgedTokenService {
        constructor(readonly dep: string) {}
      }

      Injectable()(ForgedTokenService);
      Inject({ key: 'FORGED', value: 'x' } as any)(ForgedTokenService, undefined, 0);

      return ForgedTokenService;
    }).toThrow(/createToken\(\)/);
  });

  it('allows tokens created via createToken()', () => {
    const token = createToken('SAFE_TOKEN', 'safe-value');

    class TokenBackedService {
      constructor(readonly dep: string) {}
    }

    Injectable()(TokenBackedService);
    Inject(token)(TokenBackedService, undefined, 0);

    const container = new Container();
    container.register('SAFE_TOKEN', () => 'safe-value');

    const service = container.resolve<TokenBackedService>(TokenBackedService);
    expect(service.dep).toBe('safe-value');
  });

  it('detects circular dependencies during resolution', () => {
    class ServiceA {
      constructor(readonly dep: ServiceB) {}
    }

    class ServiceB {
      constructor(readonly dep: ServiceA) {}
    }

    Injectable()(ServiceA);
    Injectable()(ServiceB);
    Inject('SERVICE_B')(ServiceA, undefined, 0);
    Inject('SERVICE_A')(ServiceB, undefined, 0);

    const container = new Container();
    container.register('SERVICE_A', (c) => c.resolve(ServiceA));
    container.register('SERVICE_B', (c) => c.resolve(ServiceB));

    expect(() => container.resolve(ServiceA)).toThrow(/circular dependency/i);
  });
});