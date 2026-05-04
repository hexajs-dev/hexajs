import { describe, expect, expectTypeOf, it } from 'vitest';
import { OnDestroy, OnInit } from '../src/di/lifecycle';

class LifecycleService implements OnInit, OnDestroy {
  initialized = false;
  destroyed = false;

  onInit(): void {
    this.initialized = true;
  }

  async onDestroy(): Promise<void> {
    this.destroyed = true;
  }
}

describe('Hexa lifecycle contracts', () => {
  it('supports classes implementing OnInit and OnDestroy signatures', async () => {
    const service = new LifecycleService();

    expectTypeOf(service).toMatchTypeOf<OnInit>();
    expectTypeOf(service).toMatchTypeOf<OnDestroy>();

    service.onInit();
    await service.onDestroy();

    expect(service.initialized).toBe(true);
    expect(service.destroyed).toBe(true);
  });
});
