import { isGuest } from './session.js';
// Apply saved UI preferences like brightness and version overlay
// The API URL field in settings stores its value in localStorage ('apiUrl').
// dataService reads it on page load after a reload.
export function applyUserSettings() {
  const brightness = localStorage.getItem('pageBrightness') || '100';
  document.documentElement.style.setProperty('--page-brightness', brightness + '%');
  const showVersion = localStorage.getItem('showVersion');
  const show = showVersion !== 'false';
  const overlay = document.querySelector('.version-info');
  if (overlay) overlay.style.display = show ? 'block' : 'none';

  const grid = localStorage.getItem('showGrid') === 'true';
  document.body.classList.toggle('grid-overlay', grid);

  const edit = localStorage.getItem('defaultEditMode') === 'true';
  if (edit && !isGuest()) {
    sessionStorage.setItem('sinopticoEdit', 'true');
    document.dispatchEvent(new Event('sinoptico-mode'));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyUserSettings();
});
