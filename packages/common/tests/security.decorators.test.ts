import { describe, expect, it } from 'vitest';
import { AllowExternal, InternalOnly } from '../src/security/decorators';
import { getClassBoundaryPolicy, getMethodBoundaryPolicy, resolveRouteBoundaryPolicy } from '../src/security/metadata';

describe('security boundary decorators', () => {
  it('defaults to internal-only when no decorator metadata is present', () => {
    class DefaultBoundaryController {
      action(): void {}
    }

    expect(resolveRouteBoundaryPolicy(DefaultBoundaryController, 'action')).toEqual({ mode: 'internal-only' });
  });

  it('treats empty AllowExternal options as allow-all external', () => {
    @AllowExternal()
    class PublicBoundaryController {
      action(): void {}
    }

    expect(resolveRouteBoundaryPolicy(PublicBoundaryController, 'action')).toEqual({ mode: 'allow-external' });
  });

  it('applies method-level InternalOnly over class-level AllowExternal', () => {
    @AllowExternal({ ids: ['external.app'] })
    class MixedBoundaryController {
      @InternalOnly()
      secureAction(): void {}

      publicAction(): void {}
    }

    expect(resolveRouteBoundaryPolicy(MixedBoundaryController, 'secureAction')).toEqual({ mode: 'internal-only' });
    expect(resolveRouteBoundaryPolicy(MixedBoundaryController, 'publicAction')).toEqual({ mode: 'allow-external', ids: ['external.app'] });
  });

  it('applies method-level AllowExternal over class-level InternalOnly', () => {
    @InternalOnly()
    class MixedBoundaryHandler {
      @AllowExternal({ origins: ['https://client.example.com'] })
      publicHandle(): void {}

      privateHandle(): void {}
    }

    expect(resolveRouteBoundaryPolicy(MixedBoundaryHandler, 'publicHandle')).toEqual({ mode: 'allow-external', origins: ['https://client.example.com'] });
    expect(resolveRouteBoundaryPolicy(MixedBoundaryHandler, 'privateHandle')).toEqual({ mode: 'internal-only' });
  });

  it('stores class and method policies as immutable normalized snapshots', () => {
    const ids = [' external.app ', 'external.app', ''];
    const origins = ['https://one.example.com', ' https://one.example.com ', ''];

    @AllowExternal({ ids, origins })
    class SnapshotController {
      @AllowExternal({ ids: [' route.app '] })
      routeAction(): void {}
    }

    ids[0] = 'mutated';
    origins[0] = 'https://mutated.example.com';

    const classPolicy = getClassBoundaryPolicy(SnapshotController);
    const methodPolicy = getMethodBoundaryPolicy(SnapshotController, 'routeAction');

    expect(classPolicy).toEqual({
      mode: 'allow-external',
      ids: ['external.app'],
      origins: ['https://one.example.com'],
    });
    expect(methodPolicy).toEqual({ mode: 'allow-external', ids: ['route.app'] });
    expect(Object.isFrozen(classPolicy)).toBe(true);
    expect(Object.isFrozen(classPolicy?.ids)).toBe(true);
    expect(Object.isFrozen(classPolicy?.origins)).toBe(true);
  });
});
