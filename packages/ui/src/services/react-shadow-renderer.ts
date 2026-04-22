import { createRoot, Root } from 'react-dom/client';
import React from 'react';

export interface ShadowRenderOptions {
  id: string;
  component: React.FC<any>;
  controllerInstance: any;
  cssText?: string;
  anchorSelector?: string;
}

export class ReactShadowRenderer {
  static mount(options: ShadowRenderOptions): () => void {
    const targetAnchor = document.querySelector(options.anchorSelector || 'body');
    if (!targetAnchor) {
      throw new Error(`[HexaJS] Anchor "${options.anchorSelector}" not found.`);
    }

    const hostElement = document.createElement(`hexa-${options.id}`);
    const shadowRoot = hostElement.attachShadow({ mode: 'open' });

    if (options.cssText) {
      const styleTag = document.createElement('style');
      styleTag.textContent = options.cssText;
      shadowRoot.appendChild(styleTag);
    }

    const reactRootElement = document.createElement('div');
    reactRootElement.id = `hexa-react-root-${options.id}`;
    reactRootElement.style.all = 'initial';
    shadowRoot.appendChild(reactRootElement);
    targetAnchor.appendChild(hostElement);

    const reactRoot: Root = createRoot(reactRootElement);
    reactRoot.render(React.createElement(options.component, { controller: options.controllerInstance }));

    return () => {
      reactRoot.unmount();
      hostElement.remove();
    };
  }
}
