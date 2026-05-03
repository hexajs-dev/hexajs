import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { copyExternalPopup } from '../src/popup/external';

describe('copyExternalPopup edge cases', () => {
  let tempRoot: string;
  let outputDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-ui-external-edge-'));
    outputDir = path.join(tempRoot, 'extension-dist');
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempRoot);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('rejects distDir that exists as a file instead of directory', () => {
    const distFile = path.join(tempRoot, 'popup-dist');
    fs.writeFileSync(distFile, 'not-a-directory', 'utf-8');

    expect(() => copyExternalPopup({ mode: 'external', distDir: 'popup-dist', indexFile: 'index.html' }, outputDir)).toThrow('distDir does not exist or is not a directory');
  });

  it('rejects absolute indexFile path values outside distDir', () => {
    const distDir = path.join(tempRoot, 'popup-dist');
    const outsideIndex = path.join(tempRoot, 'outside.html');
    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>', 'utf-8');
    fs.writeFileSync(outsideIndex, '<html>outside</html>', 'utf-8');

    expect(() => copyExternalPopup({ mode: 'external', distDir: 'popup-dist', indexFile: outsideIndex }, outputDir)).toThrow('indexFile must stay inside distDir');
  });

  it('rejects backslash traversal segments that escape distDir', () => {
    const distDir = path.join(tempRoot, 'popup-dist');
    const outsideDir = path.join(tempRoot, 'outside');
    fs.mkdirSync(distDir, { recursive: true });
    fs.mkdirSync(outsideDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>', 'utf-8');
    fs.writeFileSync(path.join(outsideDir, 'index.html'), '<html>outside</html>', 'utf-8');

    expect(() => copyExternalPopup({ mode: 'external', distDir: 'popup-dist', indexFile: '..\\outside\\index.html' }, outputDir)).toThrow('indexFile must stay inside distDir');
  });

  it('rejects index files whose real path resolves outside distDir', () => {
    const distDir = path.join(tempRoot, 'popup-dist');
    const outsideDir = path.join(tempRoot, 'outside-popup-dir');
    const linkedDir = path.join(distDir, 'linked');
    fs.mkdirSync(distDir, { recursive: true });
    fs.mkdirSync(outsideDir, { recursive: true });
    fs.writeFileSync(path.join(outsideDir, 'index.html'), '<html>outside</html>', 'utf-8');

    try {
      fs.symlinkSync(outsideDir, linkedDir, process.platform === 'win32' ? 'junction' : 'dir');
    } catch {
      // Some environments disallow symlink creation; skip this edge case there.
      expect(true).toBe(true);
      return;
    }

    expect(() => copyExternalPopup({ mode: 'external', distDir: 'popup-dist', indexFile: 'linked/index.html' }, outputDir)).toThrow('indexFile resolves outside distDir');
  });

  it('normalizes manifest entry paths when indexFile includes backslashes', () => {
    const nestedDir = path.join(tempRoot, 'popup-dist', 'nested');
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(path.join(nestedDir, 'index.html'), '<html>nested</html>', 'utf-8');

    const entry = copyExternalPopup({ mode: 'external', distDir: 'popup-dist', indexFile: 'nested\\index.html' }, outputDir);

    expect(entry).toBe('ui/popup/nested/index.html');
    expect(fs.existsSync(path.join(outputDir, 'ui', 'popup', 'nested', 'index.html'))).toBe(true);
  });
});
