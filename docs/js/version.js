export const version = '365';
export function displayVersion() {
  const div = document.createElement('div');
  div.className = 'version-info';
  const now = new Date().toLocaleString('es-ES');
  div.textContent = `v${version} - ${now}`;
  document.body.appendChild(div);
}
displayVersion();
