import { initialized } from './dataService.js';

document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('loading');
  if (!loader) return;
  initialized.finally(() => {
    loader.style.display = 'none';
  });
});
