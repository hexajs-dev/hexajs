import { inject } from '@hexajs-dev/common';
import { DevtoolsPort } from '@hexajs-dev/ports';

// Resolve the DevtoolsPort from the DI container.
// This file runs as the devtools_page (bridge) — its only job is to register the panel.
const devtools = inject(DevtoolsPort);

devtools.panels.create('Smart Clipper', 'ui/devtools/devtools-icon.png', 'ui/devtools/index.html').then((panel) => {
  panel.onShown.addListener((_panelWindow: Window) => {
    console.log('[HexaJS] DevTools panel shown');
  });
}).catch((error: unknown) => {
  console.error('[HexaJS] Failed to create DevTools panel', error);
});
