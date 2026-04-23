import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { BackgroundPatchServer } from '../src/hmr/background-patch-server';

async function requestText(host: string, port: number, requestPath: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const request = http.request({ host, port, path: requestPath, method: 'GET' }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode ?? 0,
          body: Buffer.concat(chunks).toString('utf-8'),
        });
      });
    });

    request.on('error', reject);
    request.end();
  });
}

describe('BackgroundPatchServer security', () => {
  const serversToClose: BackgroundPatchServer[] = [];
  const tempDirs: string[] = [];

  afterEach(async () => {
    while (serversToClose.length > 0) {
      const server = serversToClose.pop();
      if (server) {
        await server.close();
      }
    }

    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('rejects non-loopback hosts and privileged ports', async () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-patch-security-'));
    tempDirs.push(rootDir);

    const hostServer = new BackgroundPatchServer({ host: '0.0.0.0', port: 5173, rootDir });
    await expect(hostServer.start()).rejects.toThrow(/loopback host/i);

    const portServer = new BackgroundPatchServer({ host: '127.0.0.1', port: 80, rootDir });
    await expect(portServer.start()).rejects.toThrow(/non-privileged tcp port/i);
  });

  it('does not leak sibling files for traversal-style requests', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-patch-security-'));
    tempDirs.push(tempRoot);

    const rootDir = path.join(tempRoot, 'dist');
    const siblingDir = path.join(tempRoot, 'dist-evil');
    fs.mkdirSync(rootDir, { recursive: true });
    fs.mkdirSync(siblingDir, { recursive: true });
    fs.writeFileSync(path.join(rootDir, 'background.js'), 'safe', 'utf-8');
    fs.writeFileSync(path.join(siblingDir, 'secret.js'), 'secret', 'utf-8');

    const patchServer = new BackgroundPatchServer({ host: '127.0.0.1', port: 0, rootDir });
    serversToClose.push(patchServer);

    const address = await patchServer.start();
    const response = await requestText(address.host, address.port, '/../dist-evil/secret.js');

    expect(response.statusCode).not.toBe(200);
    expect(response.body).not.toBe('secret');
  });
});