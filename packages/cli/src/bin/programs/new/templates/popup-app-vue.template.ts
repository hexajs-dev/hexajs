/**
 * Vue 3 single-file popup component mirroring the React popup-app.template.ts
 * showcase: Hexa logo, theme toggle, nav cards, footer.
 */
export const popupAppVueTemplate = (): string => `<script setup lang="ts">
import { ref } from 'vue';

const dark = ref(true);

const navCards = [
  { icon: '\u{1F4D6}', title: 'Documentation', desc: 'Learn about HexaJS features and API', href: '#' },
  { icon: '</>', title: 'Code Examples', desc: 'Browse sample projects and snippets', href: '#' },
  { icon: '\u{1F4C4}', title: 'Tutorials', desc: 'Step-by-step guides for common tasks', href: '#' },
];
</script>

<template>
  <div :class="['popup-root', { dark }]">
    <header class="popup-header">
      <button
        class="theme-btn"
        type="button"
        :aria-label="'Toggle theme'"
        @click="dark = !dark"
      >
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

      <svg class="ghost-hexa" width="160" height="160" viewBox="0 0 100 100" fill="none">
        <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" stroke-width="4" />
      </svg>

      <div class="logo-icon">
        <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
          <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" stroke-width="5" />
          <text x="50" y="50" dominant-baseline="central" text-anchor="middle" font-size="26" font-family="monospace" fill="currentColor">&lt;/&gt;</text>
        </svg>
      </div>

      <h1>HexaJS</h1>
      <p class="tagline">Powerful JavaScript Framework Extension</p>
      <span class="version-badge">v1.0.0</span>
    </header>

    <main class="popup-content">
      <section>
        <h2>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Getting Started
        </h2>
        <p class="section-desc">
          Welcome to HexaJS! Your extension is ready to use. Explore the features below to get started with your development workflow.
        </p>
      </section>

      <div class="nav-cards">
        <a
          v-for="card in navCards"
          :key="card.title"
          class="nav-card"
          :href="card.href"
          @click.prevent
        >
          <span class="card-icon-wrap">{{ card.icon }}</span>
          <div>
            <div class="card-title">{{ card.title }}</div>
            <div class="card-desc">{{ card.desc }}</div>
          </div>
        </a>
      </div>

      <section>
        <h2>Quick Actions</h2>
        <div class="quick-actions" style="margin-top: 10px">
          <button type="button">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            New Project
          </button>
          <button type="button">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.69c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85.004 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z" />
            </svg>
            GitHub
          </button>
        </div>
      </section>

      <div class="next-steps">
        <h3>
          <svg width="14" height="14" viewBox="0 0 100 100" fill="none">
            <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" stroke-width="10" />
          </svg>
          Next Steps
        </h3>
        <ul>
          <li>Configure your development environment</li>
          <li>Explore the component library</li>
          <li>Join our community on GitHub</li>
        </ul>
      </div>
    </main>

    <footer class="popup-footer">
      <span class="footer-brand">
        <svg width="13" height="13" viewBox="0 0 100 100" fill="none">
          <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" stroke-width="10" />
        </svg>
        HexaJS Team
      </span>
      <div class="footer-links">
        <a href="#" @click.prevent>Help</a>
        <a href="#" @click.prevent>Settings</a>
      </div>
    </footer>
  </div>
</template>
`;
