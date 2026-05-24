import * as path from 'path';
import { popupAppTemplate } from '../new/templates/popup-app.template';
import { popupAppVueTemplate } from '../new/templates/popup-app-vue.template';
import { popupIndexHtmlTemplate } from '../new/templates/popup-index-html.template';
import { popupIndexHtmlVueTemplate } from '../new/templates/popup-index-html-vue.template';
import { popupMainTemplate } from '../new/templates/popup-main.template';
import { popupMainVueTemplate } from '../new/templates/popup-main-vue.template';
import { popupStyleTemplate } from '../new/templates/popup-style.template';
import { popupTsConfigTemplate } from '../new/templates/popup-tsconfig.template';
import { popupTsConfigVueTemplate } from '../new/templates/popup-tsconfig-vue.template';
import { popupViteConfigTemplate } from '../new/templates/popup-vite-config.template';
import { popupViteConfigVueTemplate } from '../new/templates/popup-vite-config-vue.template';
import { devtoolsAppTemplate } from '../new/templates/devtools-app.template';
import { devtoolsAppVueTemplate } from '../new/templates/devtools-app-vue.template';
import { devtoolsBridgeHtmlTemplate } from '../new/templates/devtools-bridge-html.template';
import { devtoolsEntryTemplate } from '../new/templates/devtools-entry.template';
import { devtoolsIndexHtmlTemplate } from '../new/templates/devtools-index-html.template';
import { devtoolsIndexHtmlVueTemplate } from '../new/templates/devtools-index-html-vue.template';
import { devtoolsMainTemplate } from '../new/templates/devtools-main.template';
import { devtoolsMainVueTemplate } from '../new/templates/devtools-main-vue.template';
import { devtoolsStyleTemplate } from '../new/templates/devtools-style.template';
import { devtoolsTsConfigTemplate } from '../new/templates/devtools-tsconfig.template';
import { devtoolsTsConfigVueTemplate } from '../new/templates/devtools-tsconfig-vue.template';
import { devtoolsViteConfigTemplate } from '../new/templates/devtools-vite-config.template';
import { devtoolsViteConfigVueTemplate } from '../new/templates/devtools-vite-config-vue.template';
import type { ScaffoldContext } from '../new/models/scaffold.types';

export type UiSurfaceFramework = 'react' | 'vue';
export type AddUiSurface = 'popup' | 'devtools';

export interface UiSurfaceFile {
  /** Path joined to the project cwd. */
  absolutePath: string;
  /** Generated content. */
  content: string;
}

/**
 * Build the list of files to write for a managed UI surface (popup/devtools)
 * based on the project's framework. Returns a complete file set including
 * vite/tsconfig/main entry/App component/style/index.html.
 *
 * Returns an empty array when the surface or framework is unsupported.
 */
export function buildUiSurfaceFiles(
  cwd: string,
  surface: AddUiSurface,
  framework: UiSurfaceFramework,
  projectName: string,
): UiSurfaceFile[] {
  if (surface === 'popup') {
    return buildPopupFiles(cwd, framework);
  }
  if (surface === 'devtools') {
    return buildDevtoolsFiles(cwd, framework, projectName);
  }
  return [];
}

function buildPopupFiles(cwd: string, framework: UiSurfaceFramework): UiSurfaceFile[] {
  const dir = path.join(cwd, 'ui', 'popup');
  const isVue = framework === 'vue';
  return [
    { absolutePath: path.join(dir, 'index.html'), content: isVue ? popupIndexHtmlVueTemplate() : popupIndexHtmlTemplate() },
    { absolutePath: path.join(dir, 'vite.config.ts'), content: isVue ? popupViteConfigVueTemplate() : popupViteConfigTemplate() },
    { absolutePath: path.join(dir, 'tsconfig.json'), content: isVue ? popupTsConfigVueTemplate() : popupTsConfigTemplate() },
    {
      absolutePath: path.join(dir, 'src', isVue ? 'main.ts' : 'main.tsx'),
      content: isVue ? popupMainVueTemplate() : popupMainTemplate(),
    },
    {
      absolutePath: path.join(dir, 'src', isVue ? 'App.vue' : 'App.tsx'),
      content: isVue ? popupAppVueTemplate() : popupAppTemplate(),
    },
    { absolutePath: path.join(dir, 'src', 'style.css'), content: popupStyleTemplate() },
  ];
}

function buildDevtoolsFiles(cwd: string, framework: UiSurfaceFramework, projectName: string): UiSurfaceFile[] {
  const dir = path.join(cwd, 'ui', 'devtools');
  const isVue = framework === 'vue';

  // The bridge entry is framework-agnostic and only needs the project name to
  // call devtools.panels.create(name, ...).
  const stubCtx = { name: projectName } as unknown as ScaffoldContext;

  return [
    { absolutePath: path.join(dir, 'index.html'), content: isVue ? devtoolsIndexHtmlVueTemplate() : devtoolsIndexHtmlTemplate() },
    { absolutePath: path.join(dir, 'devtools.html'), content: devtoolsBridgeHtmlTemplate() },
    { absolutePath: path.join(dir, 'devtools.ts'), content: devtoolsEntryTemplate(stubCtx) },
    { absolutePath: path.join(dir, 'vite.config.ts'), content: isVue ? devtoolsViteConfigVueTemplate() : devtoolsViteConfigTemplate() },
    { absolutePath: path.join(dir, 'tsconfig.json'), content: isVue ? devtoolsTsConfigVueTemplate() : devtoolsTsConfigTemplate() },
    {
      absolutePath: path.join(dir, 'src', isVue ? 'main.ts' : 'main.tsx'),
      content: isVue ? devtoolsMainVueTemplate() : devtoolsMainTemplate(),
    },
    {
      absolutePath: path.join(dir, 'src', isVue ? 'App.vue' : 'App.tsx'),
      content: isVue ? devtoolsAppVueTemplate() : devtoolsAppTemplate(),
    },
    { absolutePath: path.join(dir, 'src', 'style.css'), content: devtoolsStyleTemplate() },
  ];
}
