import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { persistDebugGeneratedArtifacts } from '../src/build/debug-snapshot';
import { GeneratedArtifactRow } from '../src/build/types';

describe('persistDebugGeneratedArtifacts', () => {
  let tempDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-debug-snapshot-'));
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('copies generated artifacts into .hexa snapshot when debug is enabled', () => {
    const outputDir = path.join(tempDir, 'dist');
    fs.mkdirSync(outputDir, { recursive: true });

    const sourceFile = path.join(outputDir, 'background', 'background.bootstrap.js');
    fs.mkdirSync(path.dirname(sourceFile), { recursive: true });
    fs.writeFileSync(sourceFile, 'bootstrap-content', 'utf-8');

    const rows: GeneratedArtifactRow[] = [
      { file: path.relative(tempDir, sourceFile), size: '17 B', duration: '0.1 ms' },
    ];

    persistDebugGeneratedArtifacts({ debug: true } as any, outputDir, rows, 'background');

    const copiedFile = path.join(tempDir, '.hexa', 'generated-debug', 'background', 'background', 'background.bootstrap.js');
    expect(fs.existsSync(copiedFile)).toBe(true);
    expect(fs.readFileSync(copiedFile, 'utf-8')).toBe('bootstrap-content');
  });

  it('does not create snapshot when debug is disabled', () => {
    const outputDir = path.join(tempDir, 'dist');
    fs.mkdirSync(outputDir, { recursive: true });

    const sourceFile = path.join(outputDir, 'content', 'content.validators.js');
    fs.mkdirSync(path.dirname(sourceFile), { recursive: true });
    fs.writeFileSync(sourceFile, 'validators-content', 'utf-8');

    const rows: GeneratedArtifactRow[] = [
      { file: path.relative(tempDir, sourceFile), size: '18 B', duration: '0.1 ms' },
    ];

    persistDebugGeneratedArtifacts({ debug: false } as any, outputDir, rows, 'content');

    const snapshotDir = path.join(tempDir, '.hexa', 'generated-debug', 'content');
    expect(fs.existsSync(snapshotDir)).toBe(false);
  });

  it('cleans stale files for context before copying latest artifacts', () => {
    const outputDir = path.join(tempDir, 'dist');
    fs.mkdirSync(outputDir, { recursive: true });

    const contextDir = path.join(tempDir, '.hexa', 'generated-debug', 'ui');
    fs.mkdirSync(contextDir, { recursive: true });
    fs.writeFileSync(path.join(contextDir, 'stale.js'), 'old', 'utf-8');

    const sourceFile = path.join(outputDir, 'ui', 'ui.bootstrap.js');
    fs.mkdirSync(path.dirname(sourceFile), { recursive: true });
    fs.writeFileSync(sourceFile, 'new-bootstrap', 'utf-8');

    const rows: GeneratedArtifactRow[] = [
      { file: path.relative(tempDir, sourceFile), size: '12 B', duration: '0.1 ms' },
    ];

    persistDebugGeneratedArtifacts({ debug: true } as any, outputDir, rows, 'ui');

    expect(fs.existsSync(path.join(contextDir, 'stale.js'))).toBe(false);
    expect(fs.readFileSync(path.join(contextDir, 'ui', 'ui.bootstrap.js'), 'utf-8')).toBe('new-bootstrap');
  });
});
