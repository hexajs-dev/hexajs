import { describe, expect, it } from 'vitest';
import { MetadataRegistry } from '../src/compiler/registry';
import { UIGenerator } from '../src/generators/ui/generator';

describe('UIGenerator bootstrap imports', () => {
  it('imports HexaUIClient from the renderer-free client entry, not the barrel', () => {
    const { content } = new UIGenerator(new MetadataRegistry()).generate();

    expect(content).toContain(`import { HexaUIClient } from '@hexajs-dev/ui/client';`);
    expect(content).not.toContain(`from '@hexajs-dev/ui';`);
  });
});
