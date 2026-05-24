/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { VueShadowRenderer } from '../src/services/vue-shadow-renderer';

describe('VueShadowRenderer', () => {
  it('mounts a Vue component into shadow DOM and tears it down cleanly', () => {
    const StubComponent = defineComponent({
      props: {
        controller: { type: Object, required: true },
      },
      setup(props) {
        return () => h('span', { id: 'overlay-content' }, `controller=${(props.controller as any).name}`);
      },
    });

    const controller = { name: 'test-controller' };

    const teardown = VueShadowRenderer.mount({
      id: 'overlay',
      component: StubComponent,
      controllerInstance: controller,
      cssText: ':host { color: red; }',
    });

    const host = document.querySelector('hexa-overlay');
    expect(host).not.toBeNull();
    expect(host?.shadowRoot).not.toBeNull();
    const styleEl = host?.shadowRoot?.querySelector('style');
    expect(styleEl?.textContent).toContain(':host { color: red; }');
    const content = host?.shadowRoot?.querySelector('#overlay-content');
    expect(content?.textContent).toBe('controller=test-controller');

    teardown();

    expect(document.querySelector('hexa-overlay')).toBeNull();
  });

  it('throws when the configured anchor selector does not match', () => {
    const StubComponent = defineComponent({
      setup() {
        return () => h('span', 'hello');
      },
    });

    expect(() =>
      VueShadowRenderer.mount({
        id: 'absent',
        component: StubComponent,
        controllerInstance: {},
        anchorSelector: '#missing-anchor',
      })
    ).toThrow(/Anchor "#missing-anchor" not found/);
  });

  it('appends the host element under a custom anchor when present', () => {
    const StubComponent = defineComponent({
      setup() {
        return () => h('span', 'mounted');
      },
    });

    const anchor = document.createElement('div');
    anchor.id = 'custom-anchor';
    document.body.appendChild(anchor);

    const teardown = VueShadowRenderer.mount({
      id: 'with-anchor',
      component: StubComponent,
      controllerInstance: {},
      anchorSelector: '#custom-anchor',
    });

    expect(anchor.querySelector('hexa-with-anchor')).not.toBeNull();
    teardown();
    expect(anchor.querySelector('hexa-with-anchor')).toBeNull();

    anchor.remove();
  });
});
