import { describe, expect, it } from 'vitest';
import { ContentGenerator } from '../src/generators/content/generator';
import { MetadataRegistry } from '../src/compiler/registry';
import { ContentRunAt } from '../src/compiler/content/types';

function createRegistry(): MetadataRegistry {
  const registry = new MetadataRegistry();
  registry.addContentEntry({
    className: 'ClipperContent',
    importPath: 'src/content/clipper.content.ts',
    dependencies: [],
    tokenDependencies: [],
    hasOnInit: false,
    hasOnDestroy: false,
    options: {
      matches: ['https://example.com/*', 'https://docs.example.com/*'],
      runAt: ContentRunAt.DocumentIdle,
      allFrames: false,
    },
  });
  return registry;
}

describe('ContentGenerator', () => {
  it('uses deterministic content script names in non-watch mode', () => {
    const registry = createRegistry();

    const nameA = new ContentGenerator(registry, [], [], '', false).generate()[0].name;
    const nameB = new ContentGenerator(registry, [], [], '', false).generate()[0].name;

    expect(nameA).toBe(nameB);
    expect(nameA).toMatch(/^content-[a-f0-9]{8}$/);
  });

  it('keeps names stable between watch and non-watch mode', () => {
    const registry = createRegistry();

    const watchName = new ContentGenerator(registry, [], [], '', true).generate()[0].name;
    const nonWatchName = new ContentGenerator(registry, [], [], '', false).generate()[0].name;

    expect(watchName).toBe(nonWatchName);
  });

  it('changes name when injection group key changes', () => {
    const registryA = createRegistry();
    const registryB = createRegistry();

    registryB.addContentEntry({
      className: 'FrameContent',
      importPath: 'src/content/frame.content.ts',
      dependencies: [],
      tokenDependencies: [],
      hasOnInit: false,
      hasOnDestroy: false,
      options: {
        matches: ['https://example.com/*'],
        runAt: ContentRunAt.DocumentEnd,
        allFrames: true,
      },
    });

    const baseName = new ContentGenerator(registryA).generate()[0].name;
    const names = new Set(new ContentGenerator(registryB).generate().map(output => output.name));

    expect(names.size).toBeGreaterThanOrEqual(2);
    expect(names.has(baseName)).toBe(true);
  });

  it('uses a bundle-specific HMR shell key in watch mode', () => {
    const registry = createRegistry();

    registry.addContentEntry({
      className: 'GoogleClipperContent',
      importPath: 'src/content/google-clipper.content.ts',
      dependencies: [],
      tokenDependencies: [],
      viewDependencies: [],
      viewPropertyDependencies: [],
      hasOnInit: false,
      hasOnDestroy: false,
      options: {
        matches: ['https://www.google.com/*'],
        runAt: ContentRunAt.DocumentIdle,
        allFrames: false,
      },
    });

    const outputs = new ContentGenerator(registry, [], [], '', true).generate();

    expect(outputs).toHaveLength(2);

    const shellKeys = outputs.map(output => output.content.match(/const __HEXA_SHELL_KEY__ = "([^"]+)";/)?.[1]);

    expect(shellKeys[0]).toBe(`__HEXA_SHELL__:${outputs[0].name}`);
    expect(shellKeys[1]).toBe(`__HEXA_SHELL__:${outputs[1].name}`);
    expect(shellKeys[0]).not.toBe(shellKeys[1]);

    outputs.forEach(output => {
      expect(output.content).toContain('window[__HEXA_SHELL_KEY__]');
      expect(output.content).not.toContain('window.__HEXA_SHELL__');
    });
  });
});
