import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadProject, updateFileWithTransform, writeFileWithGuard } from '../src/bin/programs/schematics/shared';

const tempDirs: string[] = [];

function createTempProject(sourceRoot: string): string {
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-schematics-path-'));
  tempDirs.push(projectDir);

  const configPath = path.join(projectDir, 'hexa-cli.config.json');
  fs.writeFileSync(configPath, JSON.stringify({ project: { name: 'fixture', sourceRoot } }, null, 2), 'utf8');

  return projectDir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('schematics path safety', () => {
  it('rejects sourceRoot values that escape the project root', async () => {
    const projectDir = createTempProject('../outside');

    await expect(loadProject({ cwd: projectDir })).rejects.toThrow(/sourceRoot must stay within the project root/i);
  });

  it('allows nested sourceRoot values within the project root', async () => {
    const projectDir = createTempProject('src/extension');

    const project = await loadProject({ cwd: projectDir });
    expect(project.cwd).toBe(projectDir);
    expect(project.config.project.sourceRoot).toBe('src/extension');
  });

  it('rejects schematic writes that escape the project root', async () => {
    const projectDir = createTempProject('src');
    const escapedPath = path.resolve(projectDir, '..', 'escaped.file.ts');

    await expect(writeFileWithGuard(escapedPath, '// test', { cwd: projectDir, force: true })).rejects.toThrow(/must stay within the project root/i);
  });

  it('rejects schematic updates that escape the project root', async () => {
    const projectDir = createTempProject('src');
    const escapedPath = path.resolve(projectDir, '..', 'escaped.update.ts');

    await expect(updateFileWithTransform(escapedPath, { cwd: projectDir }, (content) => content)).rejects.toThrow(/must stay within the project root/i);
  });
});
