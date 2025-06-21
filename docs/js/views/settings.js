import { getAll, ready } from '../dataService.js';
import { getUser } from '../session.js';
import { activateDevMode } from '../pageSettings.js';

export async function render(container) {
  container.innerHTML = `
    <h1>Modo Desarrollador</h1>
    <section class="dev-options">
      <label>
        Brillo de la página:
        <input id="brightnessRange" type="range" min="50" max="150" step="10">
        <span id="brightnessValue"></span>
      </label>
      <label>
        <input type="checkbox" id="toggleVersionOverlay">
        Mostrar versión en pantalla
      </label>
      <label>
        <input type="checkbox" id="toggleGridOverlay">
        Mostrar cuadrícula
      </label>
    </section>
    <section class="dev-info">
      <h2>Información del servidor</h2>
      <p>Usuario actual: <span id="devUser"></span></p>
      <p>Hora del servidor: <span id="devTime">-</span></p>
      <p>Usuarios conectados: <span id="devClients">-</span></p>
      <p>Entradas historial: <span id="devHistory">-</span></p>
    </section>
    <section class="backup-tools">
      <h2>Copias de seguridad</h2>
      <button id="createBackup" type="button">Crear backup</button>
      <select id="backupList"></select>
      <button id="restoreBackup" type="button">Restaurar</button>
    </section>`;

  activateDevMode();

  await ready;
  const data = await getAll('sinoptico');
  const p = document.createElement('p');
  p.textContent = `Registros en sinóptico: ${data.length}`;
  container.appendChild(p);

  const range = container.querySelector('#brightnessRange');
  const valueLabel = container.querySelector('#brightnessValue');
  const versionChk = container.querySelector('#toggleVersionOverlay');
  const gridChk = container.querySelector('#toggleGridOverlay');
  const userSpan = container.querySelector('#devUser');
  const timeSpan = container.querySelector('#devTime');
  const clientsSpan = container.querySelector('#devClients');
  const histSpan = container.querySelector('#devHistory');
  const backupSel = container.querySelector('#backupList');
  const createBtn = container.querySelector('#createBackup');
  const restoreBtn = container.querySelector('#restoreBackup');

  const storedBrightness = localStorage.getItem('pageBrightness') || '100';
  range.value = storedBrightness;
  valueLabel.textContent = storedBrightness + '%';

  range.addEventListener('input', ev => {
    const val = ev.target.value;
    document.documentElement.style.setProperty('--page-brightness', val + '%');
    valueLabel.textContent = val + '%';
  });
  range.addEventListener('change', ev => {
    localStorage.setItem('pageBrightness', ev.target.value);
    activateDevMode();
  });

  const overlay = document.querySelector('.version-info');
  const showVersion = localStorage.getItem('showVersion');
  const show = showVersion !== 'false';
  versionChk.checked = show;
  if (overlay) overlay.style.display = show ? 'block' : 'none';

  versionChk.addEventListener('change', ev => {
    const state = ev.target.checked;
    if (overlay) overlay.style.display = state ? 'block' : 'none';
    localStorage.setItem('showVersion', state);
  });

  const gridState = localStorage.getItem('showGrid') === 'true';
  gridChk.checked = gridState;
  document.body.classList.toggle('grid-overlay', gridState);
  gridChk.addEventListener('change', ev => {
    const val = ev.target.checked;
    document.body.classList.toggle('grid-overlay', val);
    localStorage.setItem('showGrid', val);
    activateDevMode();
  });

  const user = getUser();
  if (user && userSpan) {
    userSpan.textContent = `${user.name} (${user.role})`;
  }

  async function loadBackups() {
    try {
      const resp = await fetch('/api/backups');
      if (!resp.ok) return;
      const list = await resp.json();
      if (backupSel) {
        backupSel.innerHTML = list
          .map((name) => `<option value="${name}">${name}</option>`) 
          .join('');
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (createBtn) {
    createBtn.addEventListener('click', async () => {
      await fetch('/api/backups', { method: 'POST' });
      loadBackups();
    });
  }

  if (restoreBtn) {
    restoreBtn.addEventListener('click', async () => {
      const name = backupSel.value;
      if (!name) return;
      await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      window.location.reload();
    });
  }

  loadBackups();

  async function refreshInfo() {
    try {
      const resp = await fetch('/api/server-info');
      if (!resp.ok) return;
      const info = await resp.json();
      if (timeSpan) timeSpan.textContent = new Date(info.server_time).toLocaleString();
      if (clientsSpan) clientsSpan.textContent = info.connected_clients;
      if (histSpan) histSpan.textContent = info.history_entries;
    } catch (e) {
      console.error(e);
    }
  }

  refreshInfo();
  setInterval(refreshInfo, 5000);

}
