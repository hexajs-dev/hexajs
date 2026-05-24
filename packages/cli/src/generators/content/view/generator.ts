import { ViewMetadata } from '../../../compiler/content/view/types';
import { buildDependencyArgs, normalizeImportPath } from '../../shared';

export type ViewGeneratorFramework = 'react' | 'vue';

interface ShadowRendererTarget {
  module: string;
  exportName: string;
}

const SHADOW_RENDERER_BY_FRAMEWORK: Record<ViewGeneratorFramework, ShadowRendererTarget> = {
  react: { module: '@hexajs-dev/ui/react', exportName: 'ReactShadowRenderer' },
  vue: { module: '@hexajs-dev/ui/vue', exportName: 'VueShadowRenderer' },
};

/**
 * Generates the per-@View imports and DI registrations that the content
 * bootstrap stitches together. The framework determines:
 *  - Which ShadowRenderer to import (ReactShadowRenderer vs VueShadowRenderer)
 *  - From which subpath of @hexajs-dev/ui to import it
 */
export class ContentViewGenerator {
  private framework: ViewGeneratorFramework;
  private shadowRenderer: ShadowRendererTarget;

  constructor(framework: ViewGeneratorFramework = 'react') {
    this.framework = framework;
    this.shadowRenderer = SHADOW_RENDERER_BY_FRAMEWORK[framework] ?? SHADOW_RENDERER_BY_FRAMEWORK.react;
  }

  public generateImports(views: ViewMetadata[], outputDir: string): string[] {
    if (views.length === 0) {
      return [];
    }

    const imports: string[] = [
      `import { ViewRef } from '@hexajs-dev/core';`,
      `import { ${this.shadowRenderer.exportName} } from '${this.shadowRenderer.module}';`,
    ];

    views.forEach(view => {
      imports.push(`import { ${view.className} } from '${normalizeImportPath(view.importPath, outputDir)}';`);
      const componentImportPath = normalizeImportPath(view.componentImportPath, outputDir);

      if (view.componentExportName === 'default') {
        imports.push(`import ${view.className}__Component from '${componentImportPath}';`);
      } else {
        imports.push(`import { ${view.componentExportName} as ${view.className}__Component } from '${componentImportPath}';`);
      }

      if (view.stylesImportPath) {
        const stylesImportPath = normalizeImportPath(view.stylesImportPath, outputDir);
        const stylesPath = stylesImportPath.includes('?') ? stylesImportPath : `${stylesImportPath}?inline`;
        if (view.stylesExportName && view.stylesExportName !== 'default') {
          imports.push(`import { ${view.stylesExportName} as ${view.className}__Styles } from '${stylesPath}';`);
        } else {
          imports.push(`import ${view.className}__Styles from '${stylesPath}';`);
        }
      }
    });

    return imports;
  }

  public generateRegistrations(views: ViewMetadata[]): string[] {
    if (views.length === 0) {
      return [];
    }

    const registrations: string[] = [
      ``,
      `  // Register views`
    ];

    const renderer = this.shadowRenderer.exportName;

    views.forEach(view => {
      const anchorArg = view.anchorSelector ? `'${view.anchorSelector}'` : `'body'`;
      const stylesArg = view.stylesImportPath ? `${view.className}__Styles` : `undefined`;
      const deps = buildDependencyArgs(view);

      if (view.extendsHexaView) {
        registrations.push(`  container.register(${view.className}, (c) => {`);
        registrations.push(`    const instance = new ${view.className}(${deps});`);
        registrations.push(`    instance.viewRef = new ViewRef(instance, () => ${renderer}.mount({`);
        registrations.push(`      id: '${view.id}',`);
        registrations.push(`      component: ${view.className}__Component,`);
        registrations.push(`      controllerInstance: instance,`);
        registrations.push(`      cssText: ${stylesArg},`);
        registrations.push(`      anchorSelector: ${anchorArg},`);
        registrations.push(`    }));`);
        registrations.push(`    return instance;`);
        registrations.push(`  });`);
        registrations.push(`  container.register('__hexa_view_ref__${view.className}', (c) => c.resolve(${view.className}).viewRef);`);
      } else {
        registrations.push(`  container.register(${view.className}, (c) => new ${view.className}(${deps}));`);
        registrations.push(`  container.register('__hexa_view_ref__${view.className}', (c) => {`);
        registrations.push(`    const instance = c.resolve(${view.className});`);
        registrations.push(`    return new ViewRef(instance, () => ${renderer}.mount({`);
        registrations.push(`      id: '${view.id}',`);
        registrations.push(`      component: ${view.className}__Component,`);
        registrations.push(`      controllerInstance: instance,`);
        registrations.push(`      cssText: ${stylesArg},`);
        registrations.push(`      anchorSelector: ${anchorArg},`);
        registrations.push(`    }));`);
        registrations.push(`  });`);
      }
    });

    return registrations;
  }
}
