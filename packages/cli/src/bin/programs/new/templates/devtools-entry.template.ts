import type { ScaffoldContext } from '../models/scaffold.types';

/** The devtools bridge script — runs as the devtools_page, registers the panel. */
export const devtoolsEntryTemplate = (ctx: ScaffoldContext): string =>
  `import { inject } from '@hexajs-dev/common';
import { DevtoolsPort } from '@hexajs-dev/ports';

// Resolve the DevtoolsPort from the DI container.
// This file runs as the devtools_page (bridge) — its only job is to register the panel.
const devtools = inject(DevtoolsPort);

devtools.panels.create('${ctx.name}', '', 'ui/devtools/index.html').then((panel) => {
  panel.onShown.addListener((_panelWindow: Window) => {
    console.log('[HexaJS] DevTools panel shown');
  });
}).catch((error: unknown) => {
  console.error('[HexaJS] Failed to create DevTools panel', error);
});
`;
