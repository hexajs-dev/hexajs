---
title: Shadow Views — Vue
sidebar_position: 8
description: Complete guide for building Shadow DOM-backed views with Vue 3 single-file components in HexaJS.
---

# Shadow Views — Vue

> This page covers the Vue-specific implementation. For shared concepts — `@View`, `@InjectView`, lifecycle control, and anchor selection — see [Shadow Views](./shadow-views).

## Prerequisites

Vue Shadow Views require:

```json
{
  "ui": {
    "framework": "vue"
  }
}
```

in your `hexa-cli.config.json`. Also ensure `vue@^3.5` and `@vitejs/plugin-vue@^5` are installed.

## Complete example

A Shadow View has two files: the view class (`.ts`) and the Vue SFC (`.vue`). They always live side by side.

### The view class

The view class extends `HexaView`, holds domain state, and exposes lifecycle helpers. The `component` field points to a `.vue` SFC.

```ts
// grayscale-toggle-view.ts
import { HexaView, View } from '@hexajs-dev/core';
import GrayscaleToggleComponent from './grayscale-toggle.component.vue';
import styles from './grayscale-toggle.css?inline';

@View({
  id: 'hexa-grayscale-toggle',
  component: GrayscaleToggleComponent,
  styles,
  anchorSelector: 'body',
})
export class GrayscaleToggleView extends HexaView {
  private enabled = false;

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    document.documentElement.classList.toggle('hexa-grayscale-enabled', enabled);
  }

  toggle = (): boolean => {
    const nextEnabled = !this.enabled;
    this.setEnabled(nextEnabled);
    return nextEnabled;
  };

  reset(): void {
    this.enabled = false;
    document.documentElement.classList.remove('hexa-grayscale-enabled');
  }
}
```

### The Vue SFC

The component is a Vue 3 SFC using `<script setup>`. HexaJS passes the view instance as the `controller` prop.

```vue
<!-- grayscale-toggle.component.vue -->
<template>
  <button
    type="button"
    class="hexa-grayscale-toggle"
    @click="handleClick"
    :aria-label="enabled ? 'Disable grayscale' : 'Enable grayscale'"
    :title="enabled ? 'Disable grayscale' : 'Enable grayscale'"
  >
    <span class="hexa-grayscale-toggle__icon">
      <svg v-if="enabled" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M3.78 4.84L2.72 5.9l3.11 3.11A11.81 11.81 0 0 0 2.9 12c1.7 3.43 5.15 5.75 9.1 5.75c1.66 0 3.23-.41 4.62-1.14l3.76 3.76l1.06-1.06L3.78 4.84z" />
      </svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12 6.25c4.09 0 7.36 2.5 8.85 5.75c-1.49 3.25-4.76 5.75-8.85 5.75S4.64 15.25 3.15 12C4.64 8.75 7.91 6.25 12 6.25z" />
      </svg>
    </span>
    <span class="hexa-grayscale-toggle__label">{{ enabled ? 'On' : 'Off' }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { GrayscaleToggleView } from './grayscale-toggle-view';

const props = defineProps<{
  controller: GrayscaleToggleView;
}>();

const enabled = ref(props.controller.isEnabled());

function handleClick(): void {
  enabled.value = props.controller.toggle();
}
</script>
```

### The stylesheet

Import styles with the `?inline` query so Vite returns the CSS as a string. HexaJS injects it into the Shadow Root.

Use `:host { all: initial; }` as the first rule to reset all inherited styles at the Shadow Root boundary before your scoped rules apply.

```css
/* grayscale-toggle.css */
:host {
  all: initial;
}

.hexa-grayscale-toggle {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483646;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  border-radius: 999px;
  box-shadow: 0 10px 26px rgba(2, 6, 23, 0.25);
  height: 44px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
  font-weight: 700;
}

.hexa-grayscale-toggle:hover {
  background: #f9fafb;
}

.hexa-grayscale-toggle:focus-visible {
  outline: 2px solid #111827;
  outline-offset: 2px;
}
```

## Patterns

### Type `controller` against the view class

Always use the concrete view class as the prop type, not a partial interface. This gives you full autocomplete on domain methods.

```ts
// correct — typed against the class
const props = defineProps<{
  controller: GrayscaleToggleView;
}>();

// avoid — loses type safety on domain methods
const props = defineProps<{
  controller: { toggle: () => boolean };
}>();
```

### Bridge controller state into Vue reactivity

The view class owns domain state. To make that state reactive in the template, copy the initial value into a `ref` and update it via controller method return values.

```ts
// read initial value once
const enabled = ref(props.controller.isEnabled());

// update reactive ref through the controller
function handleClick(): void {
  enabled.value = props.controller.toggle();
}
```

Avoid reading `props.controller` state directly in the template — controller properties are plain class fields, not reactive. Bridge them into `ref` or `computed` first.

### Always include `:host { all: initial; }` 

Without this rule, Shadow DOM does not fully isolate inherited styles. The page's `font-family`, `color`, `line-height`, and other inheritable properties bleed through. Add it as the first rule in every view's stylesheet.

## How `VueShadowRenderer` works

When `mount()` is called on the view, HexaJS runs this sequence:

1. resolve `document.querySelector(anchorSelector || 'body')`,
2. create a host element named `hexa-${id}`,
3. attach an open Shadow Root,
4. inject a `<style>` tag with your inline CSS,
5. create a mount `<div>` inside the Shadow Root,
6. set `mountElement.style.all = 'initial'`,
7. call `createApp(YourComponent, { controller: viewInstance }).mount(mountElement)`,
8. return a teardown that calls `app.unmount()` and removes the host element.

## Suggested file structure

```
src/
  content/
    ui/
      grayscale-toggle/
        grayscale-toggle-view.ts           ← HexaView subclass + @View decorator
        grayscale-toggle.component.vue     ← Vue SFC
        grayscale-toggle.css               ← scoped styles (imported ?inline)
```

## Related reading

- [Shadow Views](./shadow-views) — shared concepts
- [Vue Integration](./vue-integration) — DI, `HexaUIClient`, managed UI surfaces
- [State Management](../state-management/)
