import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadHexaConfigFrom } from '../src/bin/config/config';
import { resolveConfig } from '../src/bin/config/resolve';
import { scaffold } from '../src/bin/programs/new/services/scaffold.service';
import { buildUiEntries } from '../src/build/ui.builder';

describe('external popup ui copy', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-external-ui-'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('scaffolds a blank app and copies external popup build output into dist ui folder', async () => {
    const projectName = 'external-ui-app';
    const projectDir = path.join(tempRoot, projectName);

    await scaffold({
      name: projectName,
      platforms: ['chrome'],
      blank: true,
      reactPopup: false,
      managedDevtools: false,
      destRoot: projectDir,
      packageManager: 'npm',
      packageManagerVersion: '10.9.0',
    });

    const configPath = path.join(projectDir, 'hexa-cli.config.json');
    const configRaw = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as any;

    expect(configRaw.ui?.popup?.mode).toBe('none');
    expect(configRaw.ui?.devtools?.mode).toBe('none');

    const reactBuildDir = path.join(projectDir, 'ui', 'popup-react-build');
    fs.mkdirSync(path.join(reactBuildDir, 'assets'), { recursive: true });
    fs.writeFileSync(
      path.join(reactBuildDir, 'index.html'),
      '<!doctype html><html><body><div id="root"></div><script src="./assets/main.js"></script></body></html>',
      'utf-8'
    );
    fs.writeFileSync(path.join(reactBuildDir, 'assets', 'main.js'), 'console.log("popup");', 'utf-8');

    configRaw.ui.popup = {
      mode: 'external',
      distDir: 'ui/popup-react-build',
      indexFile: 'index.html',
    };
    configRaw.ui.devtools = { mode: 'none' };
    fs.writeFileSync(configPath, JSON.stringify(configRaw, null, 2), 'utf-8');

    const config = await loadHexaConfigFrom(projectDir);
    const resolved = resolveConfig(config, 'chrome', 'development');
    const outputDir = path.join(projectDir, resolved.outDir);
    fs.mkdirSync(outputDir, { recursive: true });

    vi.spyOn(process, 'cwd').mockReturnValue(projectDir);
    const entries = await buildUiEntries(
      resolved,
      outputDir,
      path.join(outputDir, 'ui', 'ui.bootstrap.js')
    );

    const copiedPopupIndex = path.join(outputDir, 'ui', 'popup', 'index.html');
    const copiedPopupScript = path.join(outputDir, 'ui', 'popup', 'assets', 'main.js');

    expect(entries.popup).toBe('ui/popup/index.html');
    expect(entries.devtools).toBeUndefined();
    expect(fs.existsSync(copiedPopupIndex)).toBe(true);
    expect(fs.existsSync(copiedPopupScript)).toBe(true);
    expect(fs.readFileSync(copiedPopupIndex, 'utf-8')).toContain('<div id="root"></div>');
    expect(fs.readFileSync(copiedPopupScript, 'utf-8')).toContain('console.log("popup");');
  });
});
