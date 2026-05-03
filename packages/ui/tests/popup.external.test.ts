import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { copyExternalPopup } from '../src/popup/external';

describe('copyExternalPopup hardening', () => {
  let tempRoot: string;
  let outputDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-ui-external-'));
    outputDir = path.join(tempRoot, 'extension-dist');
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempRoot);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('copies external popup dist and returns manifest-relative entry', () => {
    const distDir = path.join(tempRoot, 'popup-dist');
    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>', 'utf-8');
    fs.writeFileSync(path.join(distDir, 'main.js'), 'console.log("popup");', 'utf-8');

    const entry = copyExternalPopup({ mode: 'external', distDir: 'popup-dist', indexFile: 'index.html' }, outputDir);

    expect(entry).toBe('ui/popup/index.html');
    expect(fs.existsSync(path.join(outputDir, 'ui', 'popup', 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'ui', 'popup', 'main.js'))).toBe(true);
  });

  it('rejects missing distDir in external mode', () => {
    expect(() => copyExternalPopup({ mode: 'external', indexFile: 'index.html' }, outputDir)).toThrow('distDir" is missing');
  });

  it('rejects distDir values that escape project root', () => {
    expect(() => copyExternalPopup({ mode: 'external', distDir: '../outside', indexFile: 'index.html' }, outputDir)).toThrow('distDir must stay inside project root');
  });

  it('rejects indexFile values that escape distDir', () => {
    const distDir = path.join(tempRoot, 'popup-dist');
    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>', 'utf-8');

    expect(() => copyExternalPopup({ mode: 'external', distDir: 'popup-dist', indexFile: '../index.html' }, outputDir)).toThrow('indexFile must stay inside distDir');
  });

  it('rejects missing index file in dist directory', () => {
    const distDir = path.join(tempRoot, 'popup-dist');
    fs.mkdirSync(distDir, { recursive: true });

    expect(() => copyExternalPopup({ mode: 'external', distDir: 'popup-dist', indexFile: 'index.html' }, outputDir)).toThrow('indexFile does not exist inside distDir');
  });
});
