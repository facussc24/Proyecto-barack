import { render as renderSinoptico } from './views/sinoptico.js';
import { render as renderAmfe } from './views/amfe.js';
import { render as renderSettings } from './views/settings.js';

function renderNotFound(container) {
  container.textContent = 'Página no encontrada';
}

const routes = {
  '#/sinoptico': renderSinoptico,
  '#/amfe': renderAmfe,
  '#/settings': renderSettings,
  '#/404': renderNotFound,
};

export function router() {
  const hash = location.hash || '#/sinoptico';
  const view = routes[hash];
  const container = document.getElementById('app');
  if (!container) return;
  container.innerHTML = '';
  if (view) {
    view(container);
  } else {
    if (hash === '#/404') {
      renderNotFound(container);
    } else {
      location.hash = '#/sinoptico';
    }
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
