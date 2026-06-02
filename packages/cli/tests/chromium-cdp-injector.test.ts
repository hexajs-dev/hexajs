import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ChromiumCdpInjector } from '../src/hmr/chromium-cdp-injector';

describe('ChromiumCdpInjector security', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.stubEnv('HEXA_CHROMIUM_DEBUG_ENDPOINT', '');
    vi.stubEnv('HEXA_CHROMIUM_EXTENSION_ID', '');
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  it('accepts valid loopback endpoint', () => {
    const injector = new ChromiumCdpInjector({ endpoint: 'http://127.0.0.1:9222' });
    expect(injector).toBeDefined();
  });

  it('accepts localhost endpoint', () => {
    const injector = new ChromiumCdpInjector({ endpoint: 'http://localhost:9222' });
    expect(injector).toBeDefined();
  });

  it('accepts ::1 IPv6 loopback endpoint', () => {
    const injector = new ChromiumCdpInjector({ endpoint: 'http://[::1]:9222' });
    expect(injector).toBeDefined();
  });

  it('rejects non-loopback host', () => {
    expect(() => new ChromiumCdpInjector({ endpoint: 'http://192.168.1.100:9222' })).toThrow(/must use a loopback host/i);
  });

  it('rejects non-loopback hostname', () => {
    expect(() => new ChromiumCdpInjector({ endpoint: 'http://evil.com:9222' })).toThrow(/must use a loopback host/i);
  });

  it('rejects endpoint with credentials', () => {
    expect(() => new ChromiumCdpInjector({ endpoint: 'http://user:pass@127.0.0.1:9222' })).toThrow(/must not include credentials/i);
  });

  it('rejects endpoint with path', () => {
    expect(() => new ChromiumCdpInjector({ endpoint: 'http://127.0.0.1:9222/json' })).toThrow(/must not include a path/i);
  });

  it('rejects endpoint with query string', () => {
    expect(() => new ChromiumCdpInjector({ endpoint: 'http://127.0.0.1:9222?foo=bar' })).toThrow(/must not include query string/i);
  });

  it('rejects endpoint with fragment', () => {
    expect(() => new ChromiumCdpInjector({ endpoint: 'http://127.0.0.1:9222#section' })).toThrow(/must not include fragment/i);
  });

  it('accepts valid port range (1024-65535)', () => {
    // Ports 1024-65535 should be accepted
    const injector = new ChromiumCdpInjector({ endpoint: 'http://127.0.0.1:5000' });
    expect(injector).toBeDefined();
  });

  it('uses HEXA_CHROMIUM_DEBUG_ENDPOINT env var', () => {
    vi.stubEnv('HEXA_CHROMIUM_DEBUG_ENDPOINT', 'http://127.0.0.1:9333');
    const injector = new ChromiumCdpInjector();
    expect(injector).toBeDefined();
  });

  it('rejects non-loopback from env var', () => {
    vi.stubEnv('HEXA_CHROMIUM_DEBUG_ENDPOINT', 'http://evil.com:9222');
    expect(() => new ChromiumCdpInjector()).toThrow(/must use a loopback host/i);
  });
});