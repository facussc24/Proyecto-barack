import { render as renderSinoptico } from './views/sinoptico.js';
import { render as renderAmfe } from './views/amfe.js';
import { render as renderSettings } from './views/settings.js';
import { render as renderUsers } from './views/users.js';
import { render as renderHome } from './views/home.js';

function renderNotFound(container) {
  container.textContent = 'Página no encontrada';
}

const routes = {
  '#/home': renderHome,
  '#/sinoptico': renderSinoptico,
  '#/amfe': renderAmfe,
  '#/settings': renderSettings,
  '#/users': renderUsers,
  '#/404': renderNotFound,
};

export function router() {
  const hash = location.hash || '#/home';
  const view = routes[hash];
  const container = document.getElementById('app');
  if (!container) return;
  container.innerHTML = '';
  document.body.classList.toggle('home', hash === '#/home');
  if (view) {
    view(container);
  } else {
    if (hash === '#/404') {
      renderNotFound(container);
    } else {
      location.hash = '#/home';
    }
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
