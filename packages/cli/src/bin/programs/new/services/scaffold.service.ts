import * as path from 'path';
import * as fs from 'fs-extra';
import type { ScaffoldContext } from '../models/scaffold.types';
import { packageJsonTemplate } from '../templates/package-json.template';
import { tsconfigTemplate } from '../templates/tsconfig.template';
import { hexaConfigTemplate } from '../templates/hexa-config.template';
import { hexaIconSvgTemplate } from '../templates/hexa-icon-svg.template';
import { backgroundMainTemplate } from '../templates/background-main.template';
import { backgroundControllerTemplate } from '../templates/background-controller.template';
import { backgroundActionsTemplate } from '../templates/background-actions.template';
import { backgroundReducerTemplate } from '../templates/background-reducer.template';
import { backgroundStateTemplate } from '../templates/background-state.template';
import { contentTemplate } from '../templates/content.template';
import { contentHandlerTemplate } from '../templates/content-handler.template';
import { contentActionsTemplate } from '../templates/content-actions.template';
import { contentReducerTemplate } from '../templates/content-reducer.template';
import { contentStateTemplate } from '../templates/content-state.template';
import { contractStartMessagesTemplate } from '../templates/contract-start-messages.template';
import { loggerServiceTemplate } from '../templates/logger-service.template';
import { blankBackgroundMainTemplate } from '../templates/blank-background-main.template';
import { blankBackgroundControllerTemplate } from '../templates/blank-background-controller.template';
import { blankContentTemplate } from '../templates/blank-content.template';
import { blankContentHandlerTemplate } from '../templates/blank-content-handler.template';
import { popupIndexHtmlTemplate } from '../templates/popup-index-html.template';
import { popupTsConfigTemplate } from '../templates/popup-tsconfig.template';
import { popupMainTemplate } from '../templates/popup-main.template';
import { popupAppTemplate } from '../templates/popup-app.template';
import { popupStyleTemplate } from '../templates/popup-style.template';
import { popupFallbackHtmlTemplate } from '../templates/popup-fallback-html.template';
import { devtoolsFallbackHtmlTemplate } from '../templates/devtools-fallback-html.template';
import { devtoolsIndexHtmlTemplate } from '../templates/devtools-index-html.template';
import { devtoolsMainTemplate } from '../templates/devtools-main.template';
import { devtoolsAppTemplate } from '../templates/devtools-app.template';
import { devtoolsStyleTemplate } from '../templates/devtools-style.template';
import { devtoolsTsConfigTemplate } from '../templates/devtools-tsconfig.template';
import { devtoolsEntryTemplate } from '../templates/devtools-entry.template';
import { devtoolsBridgeHtmlTemplate } from '../templates/devtools-bridge-html.template';
import { popupViteConfigTemplate } from '../templates/popup-vite-config.template';
import { devtoolsViteConfigTemplate } from '../templates/devtools-vite-config.template';
import { newtabIndexHtmlTemplate } from '../templates/newtab-index-html.template';
import { newtabViteConfigTemplate } from '../templates/newtab-vite-config.template';
import { newtabTsConfigTemplate } from '../templates/newtab-tsconfig.template';
import { newtabMainTemplate } from '../templates/newtab-main.template';
import { newtabAppTemplate } from '../templates/newtab-app.template';
import { newtabStyleTemplate } from '../templates/newtab-style.template';
import type { PackageManager } from '../../../../shared/package-manager';

/** Convert a kebab-case / snake_case name to PascalCase */
function toPascalCase(name: string): string {
  return name
    .replace(/[-_](.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());
}

export interface ScaffoldOptions {
  name: string;
  platforms: string[];
  packageManager?: PackageManager;
  packageManagerVersion?: string;
  /** Whether to scaffold a managed React popup (default: false → plain HTML) */
  reactPopup?: boolean;
  /** Whether to scaffold a managed devtools panel (default: false) */
  managedDevtools?: boolean;
  /** Whether to scaffold the devtools panel with React (requires managedDevtools, default: false) */
  reactDevtools?: boolean;
  /** Whether to scaffold a managed new tab page (default: false) */
  managedNewtab?: boolean;
  /** Whether to scaffold a minimal blank project (no store, no services, no contract demo) */
  blank?: boolean;
  /** Destination root — defaults to process.cwd()/<name> */
  destRoot?: string;
}

/**
 * Scaffolds a full HexaJS extension project under `<destRoot>/<name>/`.
 * Returns the absolute path to the created project directory.
 */
export async function scaffold(options: ScaffoldOptions): Promise<string> {
  const { name, platforms, packageManager = 'npm', packageManagerVersion = '0.0.0' } = options;
  const projectDir = options.destRoot ?? path.resolve(process.cwd(), name);

  const ctx: ScaffoldContext = {
    name,
    className: toPascalCase(name),
    platforms,
    reactPopup: options.reactPopup ?? false,
    managedDevtools: options.managedDevtools ?? false,
    reactDevtools: options.reactDevtools ?? false,
    managedNewtab: options.managedNewtab ?? false,
    blank: options.blank ?? false,
    packageManager,
    packageManagerVersion,
  };

  const files: Array<{ rel: string; content: string }> = [
    { rel: 'package.json', content: packageJsonTemplate(ctx) },
    { rel: 'tsconfig.json', content: tsconfigTemplate(ctx) },
    { rel: 'hexa-cli.config.json', content: hexaConfigTemplate(ctx) },
    // hexa icon — always present so hexa build generates icons from the local file
    { rel: 'src/assets/hexa-logo.svg', content: hexaIconSvgTemplate() },
  ];

  if (ctx.blank) {
    // ── Blank project: minimal background + content, no store/services/contract ──
    files.push(
      { rel: 'src/background/main.ts', content: blankBackgroundMainTemplate(ctx) },
      { rel: 'src/background/controller.ts', content: blankBackgroundControllerTemplate(ctx) },
      { rel: 'src/content/content.ts', content: blankContentTemplate(ctx) },
      { rel: 'src/content/handler.ts', content: blankContentHandlerTemplate(ctx) }
    );
  } else {
    // ── Full example project ──
    files.push(
      // background
      { rel: 'src/background/main.ts', content: backgroundMainTemplate(ctx) },
      { rel: 'src/background/controller.ts', content: backgroundControllerTemplate(ctx) },
      { rel: 'src/background/store/background.actions.ts', content: backgroundActionsTemplate(ctx) },
      { rel: 'src/background/store/background.reducer.ts', content: backgroundReducerTemplate(ctx) },
      { rel: 'src/background/store/background.state.ts', content: backgroundStateTemplate(ctx) },
      // content
      { rel: 'src/content/content.ts', content: contentTemplate(ctx) },
      { rel: 'src/content/handler.ts', content: contentHandlerTemplate(ctx) },
      { rel: 'src/content/store/content.actions.ts', content: contentActionsTemplate(ctx) },
      { rel: 'src/content/store/content.reducer.ts', content: contentReducerTemplate(ctx) },
      { rel: 'src/content/store/content.state.ts', content: contentStateTemplate(ctx) },
      // services
      { rel: 'src/services/logger.service.ts', content: loggerServiceTemplate(ctx) },
      // contract
      { rel: 'src/contract/start/messages.ts', content: contractStartMessagesTemplate(ctx) }
    );
  }

  // popup ui — always managed when opted in; React source files are added below if opted in
  files.push({
    rel: 'ui/popup/index.html',
    content: ctx.reactPopup ? popupIndexHtmlTemplate() : popupFallbackHtmlTemplate(),
  });

  // React popup extras
  if (ctx.reactPopup) {
    files.push(
      { rel: 'ui/popup/vite.config.ts', content: popupViteConfigTemplate() },
      { rel: 'ui/popup/tsconfig.json', content: popupTsConfigTemplate() },
      { rel: 'ui/popup/src/main.tsx', content: popupMainTemplate() },
      { rel: 'ui/popup/src/App.tsx', content: popupAppTemplate() },
      { rel: 'ui/popup/src/style.css', content: popupStyleTemplate() }
    );
  }

  // Managed devtools panel
  if (ctx.managedDevtools) {
    if (ctx.reactDevtools) {
      files.push(
        { rel: 'ui/devtools/vite.config.ts', content: devtoolsViteConfigTemplate() },
        { rel: 'ui/devtools/devtools.html', content: devtoolsBridgeHtmlTemplate() },
        { rel: 'ui/devtools/devtools.ts', content: devtoolsEntryTemplate(ctx) },
        { rel: 'ui/devtools/index.html', content: devtoolsIndexHtmlTemplate() },
        { rel: 'ui/devtools/tsconfig.json', content: devtoolsTsConfigTemplate() },
        { rel: 'ui/devtools/src/main.tsx', content: devtoolsMainTemplate() },
        { rel: 'ui/devtools/src/App.tsx', content: devtoolsAppTemplate() },
        { rel: 'ui/devtools/src/style.css', content: devtoolsStyleTemplate() }
      );
    } else {
      files.push({ rel: 'ui/devtools/index.html', content: devtoolsFallbackHtmlTemplate() });
    }
  }

  // Managed new tab page
  if (ctx.managedNewtab) {
    files.push(
      { rel: 'ui/newtab/index.html', content: newtabIndexHtmlTemplate() },
      { rel: 'ui/newtab/vite.config.ts', content: newtabViteConfigTemplate() },
      { rel: 'ui/newtab/tsconfig.json', content: newtabTsConfigTemplate() },
      { rel: 'ui/newtab/src/main.tsx', content: newtabMainTemplate() },
      { rel: 'ui/newtab/src/App.tsx', content: newtabAppTemplate() },
      { rel: 'ui/newtab/src/style.css', content: newtabStyleTemplate() }
    );
  }

  for (const { rel, content } of files) {
    const abs = path.join(projectDir, rel);
    await fs.ensureDir(path.dirname(abs));
    await fs.writeFile(abs, content, 'utf8');
  }

  return projectDir;
}
