// Apply saved UI preferences like brightness and version overlay
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
  if (edit) {
    sessionStorage.setItem('sinopticoEdit', 'true');
    document.dispatchEvent(new Event('sinoptico-mode'));
  }
}

export function showDevBanner() {
  if (typeof window.mostrarMensaje === 'function') {
    window.mostrarMensaje('Modo Dev activo', 'warning');
  }
}

export function activateDevMode() {
  localStorage.setItem('devMode', 'true');
  showDevBanner();
}

export function checkDevBanner() {
  const inSettings = document.body.classList.contains('settings-page');
  if (inSettings && localStorage.getItem('devMode') === 'true') {
    showDevBanner();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyUserSettings();
  checkDevBanner();
});
