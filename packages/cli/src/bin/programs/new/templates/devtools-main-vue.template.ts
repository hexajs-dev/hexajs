/** Vue 3 devtools panel main entry. */
export const devtoolsMainVueTemplate = (): string => `import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('DevTools panel root element not found');

createApp(App).mount(rootElement);
`;
