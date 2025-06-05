import { createApp } from 'vue'
import { createPinia } from 'pinia';
import App from './App.vue'
import './styles/theme.css'

const pinia = createPinia()

const mountVueWidget = () => {
  const container = document.getElementById('teemboom_chat');
  if (container) {
    const app = createApp(App);
    app.use(pinia)
    app.mount(container);
  }
};

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountVueWidget);
} else {
  mountVueWidget();
}