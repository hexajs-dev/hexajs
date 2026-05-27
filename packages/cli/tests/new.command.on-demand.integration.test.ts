import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { scaffold } from '../src/bin/programs/new/services/scaffold.service';
import { getPackageManagerVersion } from '../src/shared/package-manager';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface HexaUiConfig {
  framework?: 'react' | 'vue';
  popup?: { mode?: string };
  devtools?: { mode?: string };
  newtab?: { mode?: string };
}

interface HexaConfig {
  ui?: HexaUiConfig;
}

const ON_DEMAND_ENV = 'HEXA_RUN_ON_DEMAND_NEW_APP_TESTS';
const RUN_ON_DEMAND = process.env[ON_DEMAND_ENV] === '1';
const ALL_PLATFORMS = ['chrome', 'firefox', 'safari', 'opera', 'edge', 'brave'] as const;
const describeOnDemand = RUN_ON_DEMAND ? describe : describe.skip;
const cleanupTargets: string[] = [];

function toFileSpecifier(absolutePath: string): string {
  return `file:${absolutePath.replace(/\\/g, '/')}`;
}

function getWorkspaceRoot(): string {
  return path.resolve(process.cwd(), '..', '..');
}

function getWindowsCmdPath(): string {
  const systemRoot = process.env.SystemRoot || process.env.WINDIR;
  if (systemRoot) {
    const cmdPath = path.join(systemRoot, 'System32', 'cmd.exe');
    if (fs.existsSync(cmdPath)) {
      return cmdPath;
    }
  }

  return 'cmd.exe';
}

function runCommand(cwd: string, commandText: string): void {
  if (process.platform === 'win32') {
    execFileSync(getWindowsCmdPath(), ['/d', '/s', '/c', commandText], {
      cwd,
      stdio: 'inherit',
      windowsHide: true,
    });
    return;
  }

  execFileSync('sh', ['-lc', commandText], {
    cwd,
    stdio: 'inherit',
  });
}

function rewriteWorkspacePackageLinks(projectDir: string): void {
  const workspaceRoot = getWorkspaceRoot();
  const packageJsonPath = path.join(projectDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJson;

  const dependencyLinks = {
    '@hexajs-dev/common': toFileSpecifier(path.join(workspaceRoot, 'packages/common')),
    '@hexajs-dev/core': toFileSpecifier(path.join(workspaceRoot, 'packages/core')),
    '@hexajs-dev/ports': toFileSpecifier(path.join(workspaceRoot, 'packages/ports')),
    '@hexajs-dev/ui': toFileSpecifier(path.join(workspaceRoot, 'packages/ui')),
  };

  const devDependencyLinks = {
    '@hexajs-dev/cli': toFileSpecifier(path.join(workspaceRoot, 'packages/cli')),
  };

  packageJson.dependencies = {
    ...(packageJson.dependencies ?? {}),
    ...dependencyLinks,
  };
  packageJson.devDependencies = {
    ...(packageJson.devDependencies ?? {}),
    ...devDependencyLinks,
  };

  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8');
}

function assertBuildArtifacts(projectDir: string): void {
  for (const platform of ALL_PLATFORMS) {
    const baseDir = path.join(projectDir, 'dist', platform, 'production');

    expect(fs.existsSync(path.join(baseDir, 'manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(baseDir, 'ui', 'popup', 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(baseDir, 'ui', 'devtools', 'devtools.html'))).toBe(true);
    expect(fs.existsSync(path.join(baseDir, 'ui', 'newtab', 'index.html'))).toBe(true);
  }
}

async function scaffoldInstallAndBuild(framework: 'react' | 'vue'): Promise<void> {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `hexa-new-${framework}-`));
  const projectDir = path.join(tempRoot, `hexa-${framework}-all-platforms`);
  cleanupTargets.push(tempRoot);

  await scaffold({
    name: `hexa-${framework}-all-platforms`,
    platforms: [...ALL_PLATFORMS],
    packageManager: 'npm',
    packageManagerVersion: getPackageManagerVersion('npm'),
    reactPopup: true,
    managedDevtools: true,
    reactDevtools: true,
    managedNewtab: true,
    framework,
    blank: false,
    destRoot: projectDir,
  });

  const hexaConfigPath = path.join(projectDir, 'hexa-cli.config.json');
  const hexaConfig = JSON.parse(fs.readFileSync(hexaConfigPath, 'utf-8')) as HexaConfig;

  expect(hexaConfig.ui?.framework).toBe(framework);
  expect(hexaConfig.ui?.popup?.mode).toBe('managed');
  expect(hexaConfig.ui?.devtools?.mode).toBe('managed');
  expect(hexaConfig.ui?.newtab?.mode).toBe('managed');

  rewriteWorkspacePackageLinks(projectDir);

  runCommand(projectDir, 'npm install --no-audit --no-fund');

  for (const platform of ALL_PLATFORMS) {
    runCommand(projectDir, `npm run build:${platform}`);
  }

  assertBuildArtifacts(projectDir);
}

describeOnDemand('new command integration (on demand)', () => {
  afterEach(() => {
    while (cleanupTargets.length > 0) {
      const target = cleanupTargets.pop();
      if (!target) {
        continue;
      }
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  it('scaffolds, installs, and builds an all-platform React managed UI app', async () => {
    await scaffoldInstallAndBuild('react');
  }, 900000);

  it('scaffolds, installs, and builds an all-platform Vue managed UI app', async () => {
    await scaffoldInstallAndBuild('vue');
  }, 900000);
});
