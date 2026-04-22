import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ControllerContainer } from '../src/background/controller/container';
import { HandlerContainer } from '../src/content/handler/container';
import { HexaPipeRunner } from '../src/services/hexa-pipe-runner';
import { RuntimePort } from '@hexajs/ports';

describe('Validator Pipe Integration', () => {
  let mockRuntimePort: RuntimePort;
  let mockTabsPort: any;

  beforeEach(() => {
    mockRuntimePort = {
      onMessage: vi.fn(),
      sendMessage: vi.fn(),
    } as any;

    mockTabsPort = {
      sendTabMessage: vi.fn(),
      broadcastMessage: vi.fn(),
    };
  });

  describe('ControllerContainer pipe execution', () => {
    it('should unsubscribe runtime listeners and clear handlers on destroy', () => {
      const cleanup = vi.fn();
      (mockRuntimePort.onMessage as any).mockReturnValue(cleanup);

      const container = new ControllerContainer(mockRuntimePort);
      container.registerUnicast('test:action', () => ({ ok: true }));
      container.registerMulticast('test:event', () => ({ ok: true }));

      container.destroy();

      expect(cleanup).toHaveBeenCalledTimes(1);
      expect((container as any).unicastHandlers.size).toBe(0);
      expect((container as any).multicastHandlers.size).toBe(0);
      expect((container as any).pipeRunner).toBeNull();
    });

    it('should execute inbound validation pipe before handler invocation', async () => {
      const container = new ControllerContainer(mockRuntimePort);
      const pipeRunner = new HexaPipeRunner();
      
      let handlerCalled = false;
      let messageReceived: any = null;

      // Register a handler
      const handler = (payload: any) => {
        handlerCalled = true;
        messageReceived = payload;
        return { success: true, received: payload };
      };
      container.registerUnicast('test:action', handler);

      // Register a pipe on the client that rejects invalid payloads
      const validationPipe = (input: any) => {
        if (input.payload && input.payload.valid === false) {
          return {
            valid: false,
            error: 'Validation failed',
            code: 'VALIDATION_FAILED',
            details: []
          };
        }
        return input.payload;
      };

      pipeRunner.usePipe(validationPipe);
      container.setPipeRunner(pipeRunner);

      // Get the listener callback
      const onMessageCall = (mockRuntimePort.onMessage as any).mock.calls[0][0];
      expect(onMessageCall).toBeDefined();

      // Test 1: Valid payload passes through
      const sendResponse1 = vi.fn();
      onMessageCall(
        { action: 'test:action', payload: { valid: true, data: 'test' } },
        { tab: { id: 1 } },
        sendResponse1
      );

      // Give promise time to resolve
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(handlerCalled).toBe(true);
      expect(messageReceived).toEqual({ valid: true, data: 'test' });

      // Test 2: Invalid payload rejected by pipe
      handlerCalled = false;
      messageReceived = null;
      const sendResponse2 = vi.fn();
      onMessageCall(
        { action: 'test:action', payload: { valid: false } },
        { tab: { id: 1 } },
        sendResponse2
      );

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(handlerCalled).toBe(false);
      expect(sendResponse2).toHaveBeenCalledWith(
        expect.objectContaining({
          __hexa_error__: expect.any(String),
          __hexa_code__: 'VALIDATION_FAILED'
        })
      );
    });
  });

  describe('HexaPipeRunner usePipe API', () => {
    it('should register and execute pipe middleware', async () => {
      const pipeRunner = new HexaPipeRunner();
      let pipeExecuted = false;

      const testPipe = (input: any) => {
        pipeExecuted = true;
        return input.payload;
      };

      pipeRunner.usePipe(testPipe);
      expect(pipeExecuted).toBe(false); // Just registration, no execution yet

      // Execute pipes manually
      const result = await pipeRunner.runInboundPipes({
        route: 'test:action',
        payload: { test: 'data' },
        sender: { tab: { id: 1 } },
        context: 'background'
      });

      expect(pipeExecuted).toBe(true);
      expect(result).toEqual({ test: 'data' });
    });

    it('should register and execute outbound pipe middleware', async () => {
      const pipeRunner = new HexaPipeRunner();
      let outboundPipeExecuted = false;

      const outboundPipe = (input: any) => {
        outboundPipeExecuted = true;
        return { ...input.payload, validated: true };
      };

      pipeRunner.useOutboundPipe(outboundPipe);
      expect(outboundPipeExecuted).toBe(false);

      const result = await pipeRunner.runOutboundPipes({
        route: 'test:action',
        payload: { test: 'data' },
        sender: { tab: { id: 1 } },
        context: 'background'
      });

      expect(outboundPipeExecuted).toBe(true);
      expect(result).toEqual({ test: 'data', validated: true });
    });
  });

  describe('Structured validation error responses', () => {
    it('should return structured error payload on validation failure', async () => {
      const container = new ControllerContainer(mockRuntimePort);
      const pipeRunner = new HexaPipeRunner();

      // Register handler that will fail validation
      container.registerUnicast('test:action', (payload: any) => {
        return { ok: true };
      });

      // Register pipe that always rejects
      const strictPipe = (input: any) => {
        return {
          valid: false,
          error: 'Strict validation failed',
          code: 'STRICT_VALIDATION_FAILED',
          details: [{ field: 'username', constraint: 'required' }]
        };
      };

      pipeRunner.usePipe(strictPipe);
      container.setPipeRunner(pipeRunner);

      const onMessageCall = (mockRuntimePort.onMessage as any).mock.calls[0][0];
      const sendResponse = vi.fn();

      onMessageCall(
        { action: 'test:action', payload: { test: 'data' } },
        { tab: { id: 1 } },
        sendResponse
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify structured error response
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          __hexa_error__: expect.any(String),
          __hexa_code__: 'STRICT_VALIDATION_FAILED',
          __hexa_details__: expect.any(Array)
        })
      );
    });

    it('should return structured error payload when outbound validation fails in controller flow', async () => {
      const container = new ControllerContainer(mockRuntimePort);
      const pipeRunner = new HexaPipeRunner();

      container.registerUnicast('test:action', () => ({ ok: true, extra: 'field' }));

      pipeRunner.useOutboundPipe(() => ({
        valid: false,
        error: 'Response validation failed',
        code: 'HEXA_RESPONSE_VALIDATION_FAILED',
        details: { extraKeys: ['extra'] }
      }));

      container.setPipeRunner(pipeRunner);

      const onMessageCall = (mockRuntimePort.onMessage as any).mock.calls[0][0];
      const sendResponse = vi.fn();

      onMessageCall(
        { action: 'test:action', payload: { test: 'data' } },
        { tab: { id: 1 } },
        sendResponse
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          __hexa_error__: 'Response validation failed',
          __hexa_code__: 'HEXA_RESPONSE_VALIDATION_FAILED',
          __hexa_details__: { extraKeys: ['extra'] }
        })
      );
    });

    it('should return structured error payload when outbound validation fails in handler flow', async () => {
      const container = new HandlerContainer(mockRuntimePort);
      const pipeRunner = new HexaPipeRunner();

      container.registerUnicast('test:handle', () => ({ ok: true, extra: 'field' }));

      pipeRunner.useOutboundPipe(() => ({
        valid: false,
        error: 'Response validation failed',
        code: 'HEXA_RESPONSE_VALIDATION_FAILED',
        details: { extraKeys: ['extra'] }
      }));

      container.setPipeRunner(pipeRunner);

      const onMessageCall = (mockRuntimePort.onMessage as any).mock.calls[0][0];
      const sendResponse = vi.fn();

      onMessageCall(
        { action: 'test:handle', payload: { test: 'data' } },
        { tab: { id: 1 } },
        sendResponse
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          __hexa_error__: 'Response validation failed',
          __hexa_code__: 'HEXA_RESPONSE_VALIDATION_FAILED',
          __hexa_details__: { extraKeys: ['extra'] }
        })
      );
    });
  });

  describe('Multicast and unicast response behavior', () => {
    it('should validate before multicast fan-out without opening a response channel', async () => {
      const container = new ControllerContainer(mockRuntimePort);
      const pipeRunner = new HexaPipeRunner();

      const firstHandler = vi.fn((payload: any) => ({ source: 'first', payload }));
      const secondHandler = vi.fn(async (payload: any) => ({ source: 'second', payload }));

      container.registerMulticast('test:event', firstHandler);
      container.registerMulticast('test:event', secondHandler);

      pipeRunner.usePipe((input: any) => ({ ...input.payload, validated: true }));
      container.setPipeRunner(pipeRunner);

      const onMessageCall = (mockRuntimePort.onMessage as any).mock.calls[0][0];
      const sendResponse = vi.fn();

      const keepOpen = onMessageCall(
        { event: 'test:event', payload: { id: 7 } },
        { tab: { id: 1 } },
        sendResponse
      );

      expect(keepOpen).toBeUndefined();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(firstHandler).toHaveBeenCalledWith({ id: 7, validated: true }, { tab: { id: 1 } });
      expect(secondHandler).toHaveBeenCalledWith({ id: 7, validated: true }, { tab: { id: 1 } });
      expect(sendResponse).not.toHaveBeenCalled();
    });

    it('should skip multicast handlers when validation fails and only log error', async () => {
      const container = new ControllerContainer(mockRuntimePort);
      const pipeRunner = new HexaPipeRunner();

      const multicastHandler = vi.fn();
      container.registerMulticast('test:event', multicastHandler);

      pipeRunner.usePipe(() => ({
        valid: false,
        error: 'Multicast validation failed',
        code: 'MULTICAST_VALIDATION_FAILED',
        details: [{ field: 'id', constraint: 'required' }]
      }));

      container.setPipeRunner(pipeRunner);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const onMessageCall = (mockRuntimePort.onMessage as any).mock.calls[0][0];
      const sendResponse = vi.fn();

      onMessageCall(
        { event: 'test:event', payload: {} },
        { tab: { id: 1 } },
        sendResponse
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(multicastHandler).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(sendResponse).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should console error and return structured payload for unicast handler errors', async () => {
      const container = new ControllerContainer(mockRuntimePort);
      container.registerUnicast('test:action', () => {
        throw new Error('Boom');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const onMessageCall = (mockRuntimePort.onMessage as any).mock.calls[0][0];
      const sendResponse = vi.fn();

      onMessageCall(
        { action: 'test:action', payload: { id: 1 } },
        { tab: { id: 1 } },
        sendResponse
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({ __hexa_error__: 'Boom' })
      );

      consoleErrorSpy.mockRestore();
    });
  });
});

