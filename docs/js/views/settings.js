import { getAll, ready, subscribeToChanges, syncNow } from '../dataService.js';
import { getUser } from '../session.js';
import { activateDevMode, deactivateDevMode } from '../pageSettings.js';
import { animateInsert } from '../ui/animations.js';

export async function render(container) {
  await syncNow();
  container.innerHTML = `
    <h1>Modo Dev</h1>
    <section class="dev-options">
      <label>
        <input type="checkbox" id="toggleDevMode">
        Activar Modo Dev
      </label>
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
      <label>
        Servidor API:
        <input id="apiUrlInput" type="text" placeholder="http://host:puerto/api/data">
        <button id="saveApiUrl" type="button">Guardar</button>
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
      <input id="backupDesc" type="text" placeholder="Descripción">
      <button id="createBackup" type="button">Crear backup</button>
      <span id="backupMessage" class="backup-status" aria-live="polite"></span>
      <ol id="backupList" class="backup-list"></ol>
      <span id="selectedDesc"></span>
      <button id="restoreBackup" type="button">Restaurar</button>
      <button id="deleteBackup" type="button">Eliminar backup</button>
    </section>`;

  animateInsert(container);

  const p = document.createElement('p');
  container.appendChild(p);

  async function load() {
    await ready;
    const data = await getAll('sinoptico');
    p.textContent = `Registros en sinóptico: ${data.length}`;
  }

  await load();
  subscribeToChanges(load);

  const range = container.querySelector('#brightnessRange');
  const valueLabel = container.querySelector('#brightnessValue');
  const devChk = container.querySelector('#toggleDevMode');
  const versionChk = container.querySelector('#toggleVersionOverlay');
  const gridChk = container.querySelector('#toggleGridOverlay');
  const userSpan = container.querySelector('#devUser');
  const timeSpan = container.querySelector('#devTime');
  const clientsSpan = container.querySelector('#devClients');
  const histSpan = container.querySelector('#devHistory');
  const backupList = container.querySelector('#backupList');
  const createBtn = container.querySelector('#createBackup');
  const descInput = container.querySelector('#backupDesc');
  const backupMsg = container.querySelector('#backupMessage');
  const descLabel = container.querySelector('#selectedDesc');
  const restoreBtn = container.querySelector('#restoreBackup');
  const deleteBtn = container.querySelector('#deleteBackup');
  const apiInput = container.querySelector('#apiUrlInput');
  const saveApiBtn = container.querySelector('#saveApiUrl');

  const storedBrightness = localStorage.getItem('pageBrightness') || '100';
  range.value = storedBrightness;
  valueLabel.textContent = storedBrightness + '%';

  const savedApiUrl = localStorage.getItem('apiUrl');
  if (apiInput && savedApiUrl) apiInput.value = savedApiUrl;

  const devActive = localStorage.getItem('devMode') === 'true';
  if (devChk) devChk.checked = devActive;

  devChk?.addEventListener('change', ev => {
    if (ev.target.checked) {
      activateDevMode();
    } else {
      deactivateDevMode();
    }
  });

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

  saveApiBtn?.addEventListener('click', () => {
    const url = apiInput?.value.trim();
    if (url) localStorage.setItem('apiUrl', url);
    else localStorage.removeItem('apiUrl');
    location.reload();
  });

  const user = getUser();
  if (user && userSpan) {
    userSpan.textContent = `${user.name} (${user.role})`;
  }

  let selectedBackup = '';

  function highlightSelected() {
    if (!backupList) return;
    [...backupList.children].forEach(li => {
      li.classList.toggle('selected', li.dataset.name === selectedBackup);
    });
  }

  async function loadBackups() {
    try {
      const resp = await fetch('/api/backups');
      if (!resp.ok) return;
      const list = await resp.json();
      if (backupList) {
        backupList.innerHTML = list
          .map(b => `<li data-name="${b.name}" data-desc="${b.description || ''}"><strong>${b.name.replace('.zip','')}</strong> - ${b.description || ''}</li>`)
          .join('');
        const first = backupList.querySelector('li');
        if (first) {
          selectedBackup = first.dataset.name;
          if (descLabel) descLabel.textContent = first.dataset.desc || '';
        } else {
          selectedBackup = '';
          if (descLabel) descLabel.textContent = '';
        }
        highlightSelected();
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (createBtn) {
    createBtn.addEventListener('click', async () => {
      const description = descInput?.value || '';
      const resp = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      if (!resp.ok) {
        let msg = '';
        try {
          const data = await resp.json();
          msg = data.error || resp.statusText;
        } catch {
          msg = resp.statusText;
        }
        if (backupMsg) backupMsg.textContent = `Error: ${msg}`;
        return;
      }
      if (backupMsg) {
        backupMsg.textContent = 'Backup creado correctamente';
        backupMsg.classList.add('show');
        setTimeout(() => backupMsg.classList.remove('show'), 3000);
      }
      if (descInput) descInput.value = '';
      loadBackups();
    });
  }

  if (restoreBtn) {
    restoreBtn.addEventListener('click', async () => {
      const name = selectedBackup;
      if (!name) return;
      const resp = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!resp.ok) {
        let msg = '';
        try {
          const data = await resp.json();
          msg = data.error || resp.statusText;
        } catch {
          msg = resp.statusText;
        }
        if (window.mostrarMensaje) window.mostrarMensaje(`Error al restaurar: ${msg}`);
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const name = selectedBackup;
      if (!name) return;
      const resp = await fetch(`/api/backups/${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (!resp.ok) {
        let msg = '';
        try {
          const data = await resp.json();
          msg = data.error || resp.statusText;
        } catch {
          msg = resp.statusText;
        }
        if (window.mostrarMensaje) window.mostrarMensaje(`Error al eliminar: ${msg}`);
        return;
      }
      loadBackups();
    });
  }

  backupList?.addEventListener('click', ev => {
    const li = ev.target.closest('li');
    if (!li) return;
    selectedBackup = li.dataset.name;
    if (descLabel) descLabel.textContent = li.dataset.desc || '';
    highlightSelected();
  });

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
