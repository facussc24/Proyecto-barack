import { render as renderHome } from './views/home.js';
import { render as renderSinoptico } from './views/sinoptico.js';
import { render as renderAmfe } from './views/amfe.js';
import { render as renderMaestro } from './views/maestro.js';

const routes = {
  '#/home': renderHome,
  '#/sinoptico': renderSinoptico,
  '#/amfe': renderAmfe,
  '#/maestro': renderMaestro,
};

const bodyClasses = {
  '#/home': 'home',
  '#/sinoptico': 'sinoptico-page',
  '#/amfe': 'amfe-page',
  '#/maestro': 'maestro-page',
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
    'maestro-page'
  );
  const cls = bodyClasses[hash];
  if (cls) document.body.classList.add(cls);

  container.innerHTML = '';
  routes[hash](container);
  if (window.applyRoleRules) {
    window.applyRoleRules();
  }
}

window.addEventListener('DOMContentLoaded', router);
window.addEventListener('hashchange', router);
