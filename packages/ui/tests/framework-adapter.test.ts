import { describe, expect, it } from 'vitest';
import { getAdapter, __resetAdapterCacheForTests } from '../src/core/framework-adapter';

describe('getAdapter', () => {
  it('returns the registered adapter for "react"', () => {
    __resetAdapterCacheForTests();
    const adapter = getAdapter('react');
    expect(adapter.name).toBe('react');
    expect(adapter.vitePluginPackage).toBe('@vitejs/plugin-react');
    expect(adapter.shadowRendererImport).toEqual({
      module: '@hexajs-dev/ui/react',
      exportName: 'ReactShadowRenderer',
    });
    expect(adapter.dedupe).toContain('react');
    expect(adapter.dedupe).toContain('react-dom');
  });

  it('returns the registered adapter for "vue"', () => {
    __resetAdapterCacheForTests();
    const adapter = getAdapter('vue');
    expect(adapter.name).toBe('vue');
    expect(adapter.vitePluginPackage).toBe('@vitejs/plugin-vue');
    expect(adapter.shadowRendererImport).toEqual({
      module: '@hexajs-dev/ui/vue',
      exportName: 'VueShadowRenderer',
    });
    expect(adapter.dedupe).toContain('vue');
  });

  it('throws a contributor-friendly error pointing to the contributing doc for unknown frameworks', () => {
    __resetAdapterCacheForTests();
    // 'svelte' and 'solid' both stand in for "any future framework not yet wired up".
    expect(() => getAdapter('svelte' as any)).toThrow(/Unsupported UI framework "svelte"/);
    expect(() => getAdapter('solid' as any)).toThrow(/Supported frameworks: react, vue/);
    expect(() => getAdapter('solid' as any)).toThrow(/adding-frameworks/);
  });

  it('caches adapter lookups to avoid repeated import work', () => {
    __resetAdapterCacheForTests();
    const first = getAdapter('react');
    const second = getAdapter('react');
    expect(second).toBe(first);
  });
});
