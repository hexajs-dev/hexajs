import { createServer, Server } from 'net';
import { afterEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { resolveHMRServerAddress, UIHMRServer } from '../src/hmr/ui-hmr-server';

async function occupyPort(): Promise<{ server: Server; port: number }> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Could not acquire an occupied test port'));
        return;
      }
      resolve({ server, port: address.port });
    });
  });
}

async function closeNetServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function waitForWebSocketOpen(ws: WebSocket): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    if (ws.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }

    const onOpen = () => {
      cleanup();
      resolve();
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      ws.off('open', onOpen);
      ws.off('error', onError);
    };

    ws.on('open', onOpen);
    ws.on('error', onError);
  });
}

function authenticateClient(ws: WebSocket, token: string): void {
  ws.send(JSON.stringify({ type: 'auth', token, timestamp: Date.now() }));
}

async function waitForContentReload(ws: WebSocket): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for content:reload event'));
    }, 1000);

    const onMessage = (raw: WebSocket.RawData) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message?.type === 'content:reload') {
          cleanup();
          resolve(message);
        }
      } catch {
        // ignore malformed messages
      }
    };

    const cleanup = () => {
      clearTimeout(timeout);
      ws.off('message', onMessage);
    };

    ws.on('message', onMessage);
  });
}

async function assertNoContentReload(ws: WebSocket, durationMs: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, durationMs);

    const onMessage = (raw: WebSocket.RawData) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message?.type === 'content:reload') {
          cleanup();
          reject(new Error('Received unexpected content:reload event'));
        }
      } catch {
        // ignore malformed messages
      }
    };

    const cleanup = () => {
      clearTimeout(timeout);
      ws.off('message', onMessage);
    };

    ws.on('message', onMessage);
  });
}

describe('UIHMRServer', () => {
  const serversToClose: UIHMRServer[] = [];
  const socketsToClose: WebSocket[] = [];

  afterEach(async () => {
    while (socketsToClose.length > 0) {
      const socket = socketsToClose.pop();
      if (socket) {
        socket.close();
      }
    }

    while (serversToClose.length > 0) {
      const server = serversToClose.pop();
      if (server) {
        await server.close();
      }
    }
  });

  it('falls back to a random free port when requested port is occupied', async () => {
    const occupied = await occupyPort();

    try {
      const hmrServer = new UIHMRServer({ host: '127.0.0.1', port: occupied.port });
      serversToClose.push(hmrServer);

      const address = await hmrServer.start();

      expect(address.port).not.toBe(occupied.port);
      expect(address.port).toBeGreaterThan(0);
      expect(address.url).toContain(`:${address.port}`);
    } finally {
      await closeNetServer(occupied.server);
    }
  });

  it('rejects non-loopback hosts and privileged ports', () => {
    expect(() => resolveHMRServerAddress({ host: '0.0.0.0', port: 55333 })).toThrow(/loopback host/i);
    expect(() => resolveHMRServerAddress({ host: '127.0.0.1', port: 80 })).toThrow(/non-privileged tcp port/i);
  });

  it('publishes queued content patches on background:online and consumes queue once', async () => {
    const hmrServer = new UIHMRServer({ host: '127.0.0.1', port: 0 });
    serversToClose.push(hmrServer);

    const address = await hmrServer.start();
    const client = new WebSocket(address.url);
    socketsToClose.push(client);
    await waitForWebSocketOpen(client);

    hmrServer.setPendingContentPatches([
      {
        filename: 'content/example.js',
        matches: ['<all_urls>'],
        allFrames: false,
      },
    ]);

    authenticateClient(client, address.sessionToken);
    client.send(JSON.stringify({ type: 'background:online', timestamp: Date.now() }));

    const first = await waitForContentReload(client);
    expect(first.patches).toEqual([
      {
        filename: 'content/example.js',
        matches: ['<all_urls>'],
        allFrames: false,
      },
    ]);

    client.send(JSON.stringify({ type: 'background:online', timestamp: Date.now() }));
    await assertNoContentReload(client, 150);
  });

  it('ignores background:online until the client authenticates with the session token', async () => {
    const hmrServer = new UIHMRServer({ host: '127.0.0.1', port: 0 });
    serversToClose.push(hmrServer);

    const address = await hmrServer.start();
    const client = new WebSocket(address.url);
    socketsToClose.push(client);
    await waitForWebSocketOpen(client);

    hmrServer.setPendingContentPatches([
      {
        filename: 'content/secure.js',
        matches: ['<all_urls>'],
        allFrames: false,
      },
    ]);

    client.send(JSON.stringify({ type: 'background:online', timestamp: Date.now() }));
    await assertNoContentReload(client, 150);

    authenticateClient(client, address.sessionToken);
    client.send(JSON.stringify({ type: 'background:online', timestamp: Date.now() }));

    const message = await waitForContentReload(client);
    expect(message.patches[0].filename).toBe('content/secure.js');
  });
});
