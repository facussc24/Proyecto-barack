export const version = '355';
export const POLLING_INTERVAL = 60000; // 1 minute
export function displayVersion() {
  const div = document.createElement('div');
  div.className = 'version-info';
  const now = new Date().toLocaleString('es-ES');
  div.textContent = `v${version} - ${now}`;
  document.body.appendChild(div);
}
displayVersion();

async function pollVersion() {
  try {
    const response = await fetch('js/version.js', { cache: 'no-cache' });
    const text = await response.text();
    const match = text.match(/version\s*=\s*['"](\d+)['"]/);
    if (match && match[1] !== version) {
      location.reload();
    }
  } catch (e) {
    console.error('Error checking version', e);
  }
}

if (location.protocol !== 'file:') {
  setInterval(pollVersion, POLLING_INTERVAL);
}
