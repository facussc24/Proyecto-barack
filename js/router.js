import { render as renderHome } from './views/home.js';
import { render as renderSinoptico } from './views/sinoptico.js';
import { render as renderAmfe } from './views/amfe.js';
import { render as renderSettings } from './views/settings.js';
import { render as renderUsers } from './views/users.js';

const routes = {
  '#/home': renderHome,
  '#/sinoptico': renderSinoptico,
  '#/amfe': renderAmfe,
  '#/settings': renderSettings,
  '#/users': renderUsers,
};

const bodyClasses = {
  '#/home': 'home',
  '#/sinoptico': 'sinoptico-page',
  '#/amfe': 'amfe-page',
  '#/settings': 'settings-page',
  '#/users': 'users-page',
};

export function router() {
  const hash = routes[location.hash] ? location.hash : '#/home';
  const container = document.getElementById('app');
  if (!container) return;

  // Update body classes
  document.body.classList.remove(
    'home',
    'sinoptico-page',
    'amfe-page',
    'settings-page',
    'users-page'
  );
  const cls = bodyClasses[hash];
  if (cls) document.body.classList.add(cls);

  container.innerHTML = '';
  routes[hash](container);
  if (typeof window.applyRoleRules === 'function') {
    window.applyRoleRules();
  }
}

window.addEventListener('DOMContentLoaded', router);
window.addEventListener('hashchange', router);
