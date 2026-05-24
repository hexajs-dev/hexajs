import { createApp, type App, type Component } from 'vue';

export interface VueShadowRenderOptions {
  /** Stable id used for the host element tag (e.g. <hexa-{id}>). */
  id: string;
  /** Vue component to mount inside shadow DOM. */
  component: Component;
  /**
   * The HexaJS controller instance passed to the component as the
   * `controller` prop, exactly mirroring ReactShadowRenderer.
   */
  controllerInstance: unknown;
  /** Optional CSS text injected into the shadow root. */
  cssText?: string;
  /** CSS selector for the parent element to attach the host to. Defaults to 'body'. */
  anchorSelector?: string;
}

/**
 * Vue 3 counterpart to ReactShadowRenderer.
 *
 * Mounts a Vue component inside a shadow DOM rooted at a custom
 * `<hexa-{id}>` element so the overlay's CSS does not leak into the host
 * page. The `controller` prop is passed exactly the same way as the React
 * renderer for parity with content/@View handlers.
 *
 * The returned function unmounts the Vue app and removes the host element,
 * ensuring HMR teardown does not leak DOM nodes or Vue reactivity scopes.
 */
export class VueShadowRenderer {
  static mount(options: VueShadowRenderOptions): () => void {
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

    const mountElement = document.createElement('div');
    mountElement.id = `hexa-vue-root-${options.id}`;
    mountElement.style.all = 'initial';
    shadowRoot.appendChild(mountElement);
    targetAnchor.appendChild(hostElement);

    const app: App = createApp(options.component, { controller: options.controllerInstance });
    app.mount(mountElement);

    return () => {
      try {
        app.unmount();
      } finally {
        hostElement.remove();
      }
    };
  }
}
