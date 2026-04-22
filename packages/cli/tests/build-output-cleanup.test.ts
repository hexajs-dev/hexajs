import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { prepareOutputDirForTarget } from '../src/index';

describe('prepareOutputDirForTarget', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-build-cleanup-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('recreates the full output directory for full builds', () => {
    fs.mkdirSync(path.join(tempDir, 'background'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'background', 'background.bootstrap.js'), 'background', 'utf-8');
    fs.mkdirSync(path.join(tempDir, 'ui', 'popup'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'ui', 'popup', 'index.html'), '<html></html>', 'utf-8');

    prepareOutputDirForTarget(tempDir, 'all');

    expect(fs.existsSync(tempDir)).toBe(true);
    expect(fs.readdirSync(tempDir)).toEqual([]);
  });

  it('removes only previous content outputs during content rebuilds', () => {
    fs.writeFileSync(path.join(tempDir, 'manifest.json'), JSON.stringify({
      content_scripts: [
        { js: ['content/content.js'] },
        { js: ['content/content.extra.js'] },
      ],
    }), 'utf-8');
    fs.mkdirSync(path.join(tempDir, 'content'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'content', 'content.js'), 'content', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'content', 'content.extra.js'), 'content-extra', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'content', 'content.validators.js'), 'validators', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'content', 'content.store.js'), 'store', 'utf-8');
    fs.mkdirSync(path.join(tempDir, 'background'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'background', 'background.bootstrap.js'), 'background', 'utf-8');
    fs.mkdirSync(path.join(tempDir, 'ui', 'popup'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'ui', 'popup', 'index.html'), '<html></html>', 'utf-8');

    prepareOutputDirForTarget(tempDir, 'content');

    expect(fs.existsSync(path.join(tempDir, 'content', 'content.js'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'content', 'content.extra.js'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'content', 'content.validators.js'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'content', 'content.store.js'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'background', 'background.bootstrap.js'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'ui', 'popup', 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'manifest.json'))).toBe(true);
  });

  it('removes only previous background outputs during background rebuilds', () => {
    fs.mkdirSync(path.join(tempDir, 'background'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'background', 'background.bootstrap.js'), 'background', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'background', 'background.validators.js'), 'validators', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'background', 'background.store.js'), 'store', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'background', 'hexa-vendor-background.js'), 'vendor', 'utf-8');
    fs.mkdirSync(path.join(tempDir, 'content'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'content', 'content.js'), 'content', 'utf-8');
    fs.mkdirSync(path.join(tempDir, 'ui', 'devtools'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'ui', 'devtools', 'index.html'), '<html></html>', 'utf-8');

    prepareOutputDirForTarget(tempDir, 'background');

    expect(fs.existsSync(path.join(tempDir, 'background', 'background.bootstrap.js'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'background', 'background.validators.js'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'background', 'background.store.js'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'background', 'hexa-vendor-background.js'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'content', 'content.js'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'ui', 'devtools', 'index.html'))).toBe(true);
  });

  it('removes only previous ui outputs during ui rebuilds', () => {
    fs.mkdirSync(path.join(tempDir, 'ui'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'ui', 'ui.bootstrap.js'), 'ui-bootstrap', 'utf-8');
    fs.mkdirSync(path.join(tempDir, 'ui', 'popup'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'ui', 'devtools'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'ui', 'popup', 'index.html'), '<html></html>', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'ui', 'devtools', 'index.html'), '<html></html>', 'utf-8');
    fs.mkdirSync(path.join(tempDir, 'content'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'content', 'content.js'), 'content', 'utf-8');
    fs.mkdirSync(path.join(tempDir, 'background'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'background', 'background.bootstrap.js'), 'background', 'utf-8');

    prepareOutputDirForTarget(tempDir, 'ui');

    expect(fs.existsSync(path.join(tempDir, 'ui', 'ui.bootstrap.js'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'ui', 'popup'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'ui', 'devtools'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'content', 'content.js'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'background', 'background.bootstrap.js'))).toBe(true);
  });
});