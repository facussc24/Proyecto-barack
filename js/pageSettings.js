// Apply saved UI preferences like brightness and version overlay
export function applyUserSettings() {
  const brightness = localStorage.getItem('pageBrightness') || '100';
  document.documentElement.style.setProperty('--page-brightness', brightness + '%');
  const showVersion = localStorage.getItem('showVersion');
  const show = showVersion !== 'false';
  const overlay = document.querySelector('.version-info');
  if (overlay) overlay.style.display = show ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', applyUserSettings);
