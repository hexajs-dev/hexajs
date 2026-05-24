/** Vue 3 new tab main entry. */
export const newtabMainVueTemplate = (): string => `import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('New Tab root element not found');
}

createApp(App).mount(rootElement);
`;
