import { renderSinoptico } from './views/sinoptico.js';
import { renderAmfe } from './views/amfe.js';
import { renderSettings } from './views/settings.js';

const routes = {
  '#/sinoptico': renderSinoptico,
  '#/amfe': renderAmfe,
  '#/settings': renderSettings,
};

export function router() {
  const view = routes[location.hash] || renderSinoptico;
  const container = document.getElementById('app');
  if (container) {
    container.innerHTML = '';
    view(container);
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
