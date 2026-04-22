import { ViewMetadata } from '../../../compiler/content/view/types';
import { buildDependencyArgs, normalizeImportPath } from '../../shared';

export class ContentViewGenerator {
  public generateImports(views: ViewMetadata[], outputDir: string): string[] {
    if (views.length === 0) {
      return [];
    }

    const imports: string[] = [
      `import { ViewRef } from '@hexajs/core';`,
      `import { ReactShadowRenderer } from '@hexajs/ui';`
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

    views.forEach(view => {
      const anchorArg = view.anchorSelector ? `'${view.anchorSelector}'` : `'body'`;
      const stylesArg = view.stylesImportPath ? `${view.className}__Styles` : `undefined`;
      const deps = buildDependencyArgs(view);

      if (view.extendsHexaView) {
        registrations.push(`  container.register(${view.className}, (c) => {`);
        registrations.push(`    const instance = new ${view.className}(${deps});`);
        registrations.push(`    instance.viewRef = new ViewRef(instance, () => ReactShadowRenderer.mount({`);
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
        registrations.push(`    return new ViewRef(instance, () => ReactShadowRenderer.mount({`);
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
