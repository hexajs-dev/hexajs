/**
 * Vue 3 popup main entry point.
 * Vue counterpart to popup-main.template.ts.
 */
export const popupMainVueTemplate = (): string => `import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Popup root element not found');
}

createApp(App).mount(rootElement);
`;
