import { afterEach, describe, expect, it, vi } from 'vitest';
import { HexaMessageBoundaryPolicy } from '@hexajs-dev/common';
import { ControllerContainer } from '../src/background/controller/container';
import { HandlerContainer } from '../src/content/handler/container';

function createRuntimePortWithExternal() {
  let internalListener: ((message: any, sender: unknown, sendResponse: (response?: any) => void) => boolean | void) | null = null;
  let externalListener: ((message: any, sender: unknown, sendResponse: (response?: any) => void) => boolean | void) | null = null;

  const runtimePort = {
    onMessage: vi.fn((callback: any) => {
      internalListener = callback;
      return () => undefined;
    }),
    onMessageExternal: vi.fn((callback: any) => {
      externalListener = callback;
      return () => undefined;
    }),
  };

  return {
    runtimePort,
    getInternalListener: () => internalListener,
    getExternalListener: () => externalListener,
  };
}

function createRuntimePortInternalOnly() {
  let internalListener: ((message: any, sender: unknown, sendResponse: (response?: any) => void) => boolean | void) | null = null;
  const runtimePort = {
    onMessage: vi.fn((callback: any) => {
      internalListener = callback;
      return () => undefined;
    }),
  };

  return {
    runtimePort,
    getInternalListener: () => internalListener,
  };
}

function allowExternalPolicy(options: Omit<HexaMessageBoundaryPolicy, 'mode'> = {}): HexaMessageBoundaryPolicy {
  return {
    mode: 'allow-external',
    ...options,
  };
}

describe('message boundary policy enforcement', () => {
  afterEach(() => {
    delete (globalThis as any).chrome;
    delete (globalThis as any).browser;
    delete (globalThis as any).webExt;
    vi.restoreAllMocks();
  });

  it('ignores external unicast requests when route is not externally subscribed in background container', () => {
    (globalThis as any).chrome = { runtime: { id: 'self.extension' } };
    const runtime = createRuntimePortWithExternal();
    const container = new ControllerContainer(runtime.runtimePort as any);
    const handler = vi.fn(() => ({ ok: true }));

    container.registerUnicast('security:ping', handler);

    const sendResponse = vi.fn();
    runtime.getExternalListener()?.(
      { action: 'security:ping', payload: { value: 1 } },
      { id: 'external.extension', origin: 'https://evil.example' },
      sendResponse,
    );

    expect(handler).not.toHaveBeenCalled();
    expect(sendResponse).not.toHaveBeenCalled();
  });

  it('allows external unicast requests when route policy explicitly permits them', async () => {
    (globalThis as any).chrome = { runtime: { id: 'self.extension' } };
    const runtime = createRuntimePortWithExternal();
    const container = new ControllerContainer(runtime.runtimePort as any);
    const handler = vi.fn((payload: any) => ({ ok: true, payload }));

    container.registerUnicast('security:ping', handler, allowExternalPolicy());

    const sendResponse = vi.fn();
    runtime.getExternalListener()?.(
      { action: 'security:ping', payload: { value: 42 } },
      { id: 'external.extension', origin: 'https://client.example' },
      sendResponse,
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(handler).toHaveBeenCalledWith({ value: 42 }, { id: 'external.extension', origin: 'https://client.example' });
    expect(sendResponse).toHaveBeenCalledWith({ ok: true, payload: { value: 42 } });
  });

  it('matches allow-external by ids or origins in background container', async () => {
    (globalThis as any).chrome = { runtime: { id: 'self.extension' } };
    const runtime = createRuntimePortWithExternal();
    const container = new ControllerContainer(runtime.runtimePort as any);
    const handler = vi.fn(() => ({ ok: true }));

    container.registerUnicast('security:ping', handler, allowExternalPolicy({ ids: ['trusted.extension'], origins: ['https://trusted.example'] }));

    const deniedResponse = vi.fn();
    runtime.getExternalListener()?.(
      { action: 'security:ping', payload: {} },
      { id: 'blocked.extension', origin: 'https://blocked.example' },
      deniedResponse,
    );

    const allowedByIdResponse = vi.fn();
    runtime.getExternalListener()?.(
      { action: 'security:ping', payload: {} },
      { id: 'trusted.extension', origin: 'https://blocked.example' },
      allowedByIdResponse,
    );

    const allowedByOriginResponse = vi.fn();
    runtime.getExternalListener()?.(
      { action: 'security:ping', payload: {} },
      { id: 'blocked.extension', url: 'https://trusted.example/path?x=1' },
      allowedByOriginResponse,
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(deniedResponse).toHaveBeenCalledWith(expect.objectContaining({ __hexa_code__: 'HEXA_BOUNDARY_POLICY_DENIED' }));
    expect(allowedByIdResponse).toHaveBeenCalledWith({ ok: true });
    expect(allowedByOriginResponse).toHaveBeenCalledWith({ ok: true });
  });

  it('ignores external multicast routes when route is not externally subscribed in background container', () => {
    (globalThis as any).chrome = { runtime: { id: 'self.extension' } };
    const runtime = createRuntimePortWithExternal();
    const container = new ControllerContainer(runtime.runtimePort as any);
    const handler = vi.fn();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    container.registerMulticast('security:event', handler);

    const sendResponse = vi.fn();
    runtime.getExternalListener()?.(
      { event: 'security:event', payload: { id: 1 } },
      { id: 'external.extension', origin: 'https://evil.example' },
      sendResponse,
    );

    expect(handler).not.toHaveBeenCalled();
    expect(sendResponse).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('drops externally subscribed multicast routes when sender violates boundary policy', () => {
    (globalThis as any).chrome = { runtime: { id: 'self.extension' } };
    const runtime = createRuntimePortWithExternal();
    const container = new ControllerContainer(runtime.runtimePort as any);
    const handler = vi.fn();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    container.registerMulticast('security:event', handler, allowExternalPolicy({ ids: ['trusted.extension'] }));

    const sendResponse = vi.fn();
    runtime.getExternalListener()?.(
      { event: 'security:event', payload: { id: 1 } },
      { id: 'external.extension', origin: 'https://evil.example' },
      sendResponse,
    );

    expect(handler).not.toHaveBeenCalled();
    expect(sendResponse).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('executes externally subscribed multicast routes when sender is allowed', async () => {
    (globalThis as any).chrome = { runtime: { id: 'self.extension' } };
    const runtime = createRuntimePortWithExternal();
    const container = new ControllerContainer(runtime.runtimePort as any);
    const handler = vi.fn();

    container.registerMulticast('security:event', handler, allowExternalPolicy({ ids: ['trusted.extension'] }));

    const sendResponse = vi.fn();
    runtime.getExternalListener()?.(
      { event: 'security:event', payload: { id: 7 } },
      { id: 'trusted.extension', origin: 'https://allowed.example' },
      sendResponse,
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(handler).toHaveBeenCalledWith({ id: 7 }, { id: 'trusted.extension', origin: 'https://allowed.example' });
    expect(sendResponse).not.toHaveBeenCalled();
  });

  it('enforces content route policy when sender id does not match extension id', async () => {
    (globalThis as any).chrome = { runtime: { id: 'self.extension' } };
    const runtime = createRuntimePortInternalOnly();
    const container = new HandlerContainer(runtime.runtimePort as any);
    const handler = vi.fn(() => ({ ok: true }));

    container.registerUnicast('security:handle', handler);

    const deniedResponse = vi.fn();
    runtime.getInternalListener()?.(
      { action: 'security:handle', payload: {} },
      { id: 'external.extension', origin: 'https://blocked.example' },
      deniedResponse,
    );

    container.registerUnicast('security:allow', handler, allowExternalPolicy({ origins: ['https://allowed.example'] }));

    const allowedResponse = vi.fn();
    runtime.getInternalListener()?.(
      { action: 'security:allow', payload: {} },
      { id: 'external.extension', url: 'https://allowed.example/path' },
      allowedResponse,
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(deniedResponse).toHaveBeenCalledWith(expect.objectContaining({ __hexa_code__: 'HEXA_BOUNDARY_POLICY_DENIED' }));
    expect(allowedResponse).toHaveBeenCalledWith({ ok: true });
  });
});
