import { describe, expect, it } from 'vitest';
import { MetadataRegistry } from '../src/compiler/registry';
import { ContentRunAt } from '../src/compiler/content/types';
import { BackgroundGenerator } from '../src/generators/background/generator';
import { ContentGenerator } from '../src/generators/content/generator';

function createRegistry(): MetadataRegistry {
  const registry = new MetadataRegistry();

  registry.addController({
    className: 'DemoController',
    namespace: 'security',
    methods: [
      {
        methodName: 'onPing',
        actionName: 'security:ping',
        boundaryPolicy: { mode: 'allow-external', ids: ['trusted-app'] },
        externalSubscribed: true,
      },
      {
        methodName: 'onNotify',
        eventName: 'security:notify',
        boundaryPolicy: { mode: 'internal-only' },
        externalSubscribed: false,
      },
    ],
    dependencies: [],
    tokenDependencies: [],
    importPath: 'src/background/controller.ts',
    hasOnInit: false,
    hasOnDestroy: false,
  });

  registry.addBackgroundEntry({
    className: 'DemoBackground',
    importPath: 'src/background/main.ts',
    dependencies: [],
    tokenDependencies: [],
    hasOnInit: false,
    hasOnDestroy: false,
  });

  registry.addHandler({
    className: 'DemoHandler',
    namespace: 'security',
    methods: [
      { methodName: 'onReceive', handleName: 'security:receive' },
      { methodName: 'onFanout', eventName: 'security:fanout' },
    ],
    dependencies: [],
    tokenDependencies: [],
    viewDependencies: [],
    viewPropertyDependencies: [],
    importPath: 'src/content/handler.ts',
    contents: ['DemoContent'],
    hasOnInit: false,
    hasOnDestroy: false,
  });

  registry.addContentEntry({
    className: 'DemoContent',
    importPath: 'src/content/content.ts',
    dependencies: [],
    tokenDependencies: [],
    viewDependencies: [],
    viewPropertyDependencies: [],
    options: {
      matches: ['https://example.com/*'],
      runAt: ContentRunAt.DocumentIdle,
      allFrames: false,
    },
    hasOnInit: false,
    hasOnDestroy: false,
  });

  return registry;
}

describe('route boundary policy generator wiring', () => {
  it('injects static route boundary options into background bootstrap registrations', () => {
    const output = new BackgroundGenerator(createRegistry()).generate();

    expect(output).toContain("import { Container, setContainer, HEXA_PLATFORM } from '@hexajs-dev/common';");
    expect(output).toContain("controllerContainer.registerUnicast('security:ping', demoController.onPing.bind(demoController), { mode: 'allow-external', ids: [\"trusted-app\"] }, true);");
    expect(output).toContain("controllerContainer.registerMulticast('security:notify', demoController.onNotify.bind(demoController), { mode: 'internal-only' }, false);");
  });

  it('injects route boundary policy resolver into content bootstrap registrations', () => {
    const outputs = new ContentGenerator(createRegistry()).generate();
    const content = outputs[0].content;

    expect(content).toContain("import { Container, setContainer, HEXA_PLATFORM, resolveRouteBoundaryPolicy } from '@hexajs-dev/common';");
    expect(content).toContain("handlerContainer.registerUnicast('security:receive', demoHandler.onReceive.bind(demoHandler), resolveRouteBoundaryPolicy(DemoHandler, 'onReceive'));");
    expect(content).toContain("handlerContainer.registerMulticast('security:fanout', demoHandler.onFanout.bind(demoHandler), resolveRouteBoundaryPolicy(DemoHandler, 'onFanout'));");
  });
});
