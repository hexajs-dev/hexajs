/**
 * Vue 3 single-file devtools panel component mirroring the React
 * devtools-app.template.ts showcase: hexa logo, theme toggle, MDN link cards,
 * step-by-step quick start, capability grid, resources, footer, help button.
 */
export const devtoolsAppVueTemplate = (): string => `<script setup lang="ts">
import { ref, h, type Component } from 'vue';

const dark = ref(true);

const MDN_LINKS = [
  { label: 'devtools API', desc: 'Core API for creating browser DevTools extensions', href: 'https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/devtools' },
  { label: 'devtools.panels', desc: 'Create and manage custom panels in the DevTools', href: 'https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/devtools/panels' },
  { label: 'devtools.inspectedWindow', desc: 'Interact with the window being inspected', href: 'https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/devtools/inspectedWindow' },
  { label: 'devtools.network', desc: 'Access network request information', href: 'https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/devtools/network' },
];

const STEPS = [
  { title: 'Register DevTools Panel', desc: 'Add the devtools_page to your manifest.json to register your DevTools panel', code: '"devtools_page": "devtools.html"' },
  { title: 'Create Custom Panel', desc: 'Use the devtools.panels API to create custom panels in the browser DevTools', code: 'browser.devtools.panels.create( "HexaJS", "icon.png", "panel.html" );' },
  { title: 'Access Inspected Window', desc: 'Interact with the page being inspected using devtools.inspectedWindow API', code: \`browser.devtools.inspectedWindow.eval( "console.log('Hello from HexaJS!')" );\` },
];

const CAPABILITIES: Array<{ title: string; desc: string }> = [
  { title: 'Component Inspector', desc: 'Inspect and debug framework components in real-time' },
  { title: 'Performance Profiler', desc: 'Monitor render times and performance metrics' },
  { title: 'State Manager', desc: 'Track and modify application state' },
  { title: 'Event Logger', desc: 'Capture and analyze events and interactions' },
];

const RESOURCES = [
  { label: 'WebExtensions API Overview', href: 'https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API' },
  { label: 'Chrome DevTools Extensions', href: 'https://developer.chrome.com/docs/extensions/how-to/devtools/extend-devtools' },
  { label: 'WebExtensions Examples on GitHub', href: 'https://github.com/mdn/webextensions-examples' },
];
</script>

<template>
  <div :class="['dt-root', { dark }]">
    <header class="dt-header">
      <button class="dt-theme-btn" type="button" aria-label="Toggle theme" @click="dark = !dark">
        <svg v-if="dark" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12,9c1.65,0,3,1.35,3,3s-1.35,3-3,3s-3-1.35-3-3S10.35,9,12,9 M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5 S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1 s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1C11.45,19,11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0 c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95 c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41 L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41 s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06 c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z"
          />
        </svg>
      </button>

      <svg class="dt-ghost-hexa" width="200" height="200" viewBox="0 0 100 100" fill="none">
        <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" stroke-width="4" />
      </svg>

      <div class="dt-header-inner">
        <div class="dt-logo">
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
            <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" stroke-width="5" />
            <path d="M35 42 L50 35 L65 42 M35 58 L50 65 L65 58 M50 35 L50 65 M38 46 L62 54 M62 46 L38 54" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
          </svg>
        </div>
        <div class="dt-header-text">
          <h1>HexaJS DevTools</h1>
          <p class="dt-tagline">Browser DevTools Extension Panel</p>
        </div>
      </div>
      <span class="dt-version-badge">DevTools Template &bull; v1.0.0</span>
    </header>

    <main class="dt-content">
      <section class="dt-section">
        <h2 class="dt-section-title">DevTools Panel Template</h2>
        <p class="dt-section-desc">
          This is your DevTools panel entry point. Build powerful inspection and debugging tools for your web applications. Use the MDN Web Extensions API documentation below to get started.
        </p>
      </section>

      <section class="dt-section">
        <h2 class="dt-section-title">MDN Web Extensions API Documentation</h2>
        <div class="dt-link-cards">
          <a
            v-for="link in MDN_LINKS"
            :key="link.label"
            class="dt-link-card"
            :href="link.href"
            target="_blank"
            rel="noreferrer"
          >
            <div class="dt-link-card-body">
              <span class="dt-link-card-label">{{ link.label }}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
            <p class="dt-link-card-desc">{{ link.desc }}</p>
          </a>
        </div>
      </section>

      <section class="dt-section">
        <h2 class="dt-section-title">Quick Start Guide</h2>
        <div class="dt-steps">
          <div v-for="(step, i) in STEPS" :key="step.title" class="dt-step">
            <div class="dt-step-header">
              <span class="dt-step-num">{{ i + 1 }}</span>
              <div>
                <div class="dt-step-title">{{ step.title }}</div>
                <div class="dt-step-desc">{{ step.desc }}</div>
              </div>
            </div>
            <pre class="dt-code"><code>{{ step.code }}</code></pre>
          </div>
        </div>
      </section>

      <section class="dt-section">
        <h2 class="dt-section-title">What You Can Build</h2>
        <div class="dt-capability-grid">
          <div v-for="cap in CAPABILITIES" :key="cap.title" class="dt-capability-card">
            <div class="dt-capability-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </div>
            <div>
              <div class="dt-capability-title">{{ cap.title }}</div>
              <div class="dt-capability-desc">{{ cap.desc }}</div>
            </div>
          </div>
        </div>

        <div class="dt-resources-card">
          <h3 class="dt-resources-title">Additional Resources</h3>
          <ul class="dt-resources-list">
            <li v-for="res in RESOURCES" :key="res.label">
              <a :href="res.href" target="_blank" rel="noreferrer">{{ res.label }}</a>
            </li>
          </ul>
        </div>
      </section>
    </main>

    <footer class="dt-footer">
      <span class="dt-footer-brand">
        <svg width="13" height="13" viewBox="0 0 100 100" fill="none">
          <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" stroke-width="10" />
        </svg>
        HexaJS DevTools Template
      </span>
      <div class="dt-footer-links">
        <a href="https://hexajs.dev/docs" target="_blank" rel="noreferrer">Documentation</a>
        <a href="https://github.com/hexajs" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </footer>

    <button class="dt-help-btn" type="button" aria-label="Help">?</button>
  </div>
</template>
`;
