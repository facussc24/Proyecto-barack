import { getAll, DATA_CHANGED } from './dataService.js';

function refresh() {
  const data = getAll();
  try {
    localStorage.setItem('sinopticoData', JSON.stringify(data));
  } catch (e) {
    console.error('Could not persist sinoptico data', e);
  }
  document.dispatchEvent(new CustomEvent('sinoptico-data-changed'));
}

document.addEventListener('DOMContentLoaded', () => {
  sessionStorage.setItem('sinopticoEdit', 'false');
  refresh();
  window.addEventListener('load', () => {
    const loader = document.getElementById('loading');
    if (loader) loader.style.display = 'none';
  });
});

document.addEventListener(DATA_CHANGED, refresh);

// Load existing rendering logic
import '../renderer.js';
