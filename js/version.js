export const version = '373';
export const POLLING_INTERVAL = 60000;
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
    const res = await fetch('js/version.js', { cache: 'no-cache' });
    const text = await res.text();
    const match = text.match(/export const version = ['"]([^'"]+)['"]/);
    if (match && match[1] !== version) {
      location.reload();
    }
  } catch (err) {
    console.error('Version check failed', err);
  }
}

if (location.protocol !== 'file:') {
  setInterval(pollVersion, POLLING_INTERVAL);
}
