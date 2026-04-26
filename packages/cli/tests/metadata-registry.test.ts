import { describe, expect, it } from 'vitest';
import { MetadataRegistry } from '../src/compiler/registry';
import { HEXA_PLATFORM } from '@hexajs-dev/common';

describe('MetadataRegistry', () => {
  it('rejects reserved framework token keys', () => {
    const registry = new MetadataRegistry();

    expect(() => registry.addToken({
      key: HEXA_PLATFORM,
      defaultValue: 'chrome',
      context: 'general',
      importPath: 'src/platform.token.ts'
    })).toThrow(/reserved by the framework/);
  });

  it('rejects duplicate @View class names even with different ids', () => {
    const registry = new MetadataRegistry();

    registry.addView({
      className: 'DashboardView',
      importPath: 'src/dashboard.view.ts',
      id: 'dashboard-root',
      componentImportPath: './dashboard.component',
      componentExportName: 'DashboardComponent',
      dependencies: [],
      tokenDependencies: [],
      viewDependencies: [],
      viewPropertyDependencies: [],
      extendsHexaView: false,
      hasOnInit: false,
      hasOnDestroy: false,
    });

    expect(() => registry.addView({
      className: 'DashboardView',
      importPath: 'src/dashboard-copy.view.ts',
      id: 'dashboard-copy-root',
      componentImportPath: './dashboard-copy.component',
      componentExportName: 'DashboardCopyComponent',
      dependencies: [],
      tokenDependencies: [],
      viewDependencies: [],
      viewPropertyDependencies: [],
      extendsHexaView: false,
      hasOnInit: false,
      hasOnDestroy: false,
    })).toThrow(/Duplicate @View class/);
  });
});
