import { describe, expect, it } from 'vitest';
import { HexaContext, ServiceMetadata } from '../src/compiler/di/types';
import { ContentRunAt } from '../src/compiler/content/types';
import { MetadataRegistry } from '../src/compiler/registry';
import { UsedPortsCollector } from '../src/build/used-ports.collector';

function createService(className: string, dependencies: string[]): ServiceMetadata {
  return {
    className,
    importPath: `src/${className}.ts`,
    context: HexaContext.General,
    dependencies,
    tokenDependencies: [],
    viewDependencies: [],
    viewPropertyDependencies: [],
    workerPropertyDependencies: [],
    hasOnInit: false,
    hasOnDestroy: false,
  };
}

describe('used ports collector', () => {
  it('collects unique supported ports from registry dependency sources', () => {
    const registry = new MetadataRegistry();

    registry.setPackageMetadata({
      ClipboardPort: { injectable: true, context: 'general' },
      DownloadsPort: { injectable: true, context: 'background' },
      NonInjectablePort: { injectable: false, context: 'background' } as any,
    } as any);

    registry.addService(createService('MainService', ['ClipboardPort', 'ClipboardPort', 'LoggerService']));

    registry.addController({
      className: 'MainController',
      namespace: 'main',
      methods: [],
      dependencies: ['DownloadsPort', 'NonInjectablePort'],
      tokenDependencies: [],
      importPath: 'src/controllers/main.controller.ts',
      hasOnInit: false,
      hasOnDestroy: false,
    });

    registry.addBackgroundEntry({
      className: 'BackgroundEntry',
      importPath: 'src/background/entry.ts',
      dependencies: ['ClipboardPort'],
      tokenDependencies: [],
      hasOnInit: false,
      hasOnDestroy: false,
    });

    registry.addHandler({
      className: 'MainHandler',
      namespace: 'main',
      methods: [],
      dependencies: ['DownloadsPort'],
      tokenDependencies: [],
      viewDependencies: [],
      viewPropertyDependencies: [],
      importPath: 'src/content/main.handler.ts',
      contents: [],
      hasOnInit: false,
      hasOnDestroy: false,
    });

    registry.addContentEntry({
      className: 'MainContent',
      importPath: 'src/content/main.content.ts',
      dependencies: ['ClipboardPort'],
      tokenDependencies: [],
      viewDependencies: [],
      viewPropertyDependencies: [],
      options: {
        matches: ['<all_urls>'],
        runAt: ContentRunAt.DocumentIdle,
        allFrames: false,
      },
      hasOnInit: false,
      hasOnDestroy: false,
    });

    registry.addView({
      className: 'MainView',
      importPath: 'src/content/main.view.ts',
      id: 'main-view',
      componentImportPath: 'src/content/main.component.tsx',
      componentExportName: 'MainComponent',
      dependencies: ['DownloadsPort'],
      tokenDependencies: [],
      viewDependencies: [],
      viewPropertyDependencies: [],
      extendsHexaView: false,
      hasOnInit: false,
      hasOnDestroy: false,
    });

    registry.addWorker({
      className: 'MainWorker',
      name: 'main-worker',
      environment: 'compute',
      importPath: 'src/background/main.worker.ts',
      dependencies: ['ClipboardPort'],
      tokenDependencies: [],
      workerPropertyDependencies: [],
      publicMethods: [],
    });

    const usedPorts = new UsedPortsCollector(registry).collect();

    expect(usedPorts).toEqual(['ClipboardPort', 'DownloadsPort']);
  });

  it('returns an empty list when no port dependencies are present', () => {
    const registry = new MetadataRegistry();
    registry.addService(createService('MainService', ['LoggerService', 'MetricsClient']));

    const usedPorts = new UsedPortsCollector(registry).collect();

    expect(usedPorts).toEqual([]);
  });
});
