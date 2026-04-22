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
});
