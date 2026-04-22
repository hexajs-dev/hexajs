import { inject } from '@hexajs/common';
import { DevtoolsPort } from '@hexajs/ports';

// Resolve the DevtoolsPort from the DI container.
// This file runs as the devtools_page (bridge) — its only job is to register the panel.
const devtools = inject(DevtoolsPort);

devtools.panels.create('ClipVolt', '', 'ui/devtools/index.html').then((panel) => {
  panel.onShown.addListener((_panelWindow: Window) => {
    console.log('[HexaJS] DevTools panel shown');
  });
});
