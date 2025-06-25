import { animateInsert } from '../ui/animations.js';

export async function render(container) {
  container.innerHTML = `
    <h1>Backups</h1>
    <section class="backup-tools">
      <h2>Copias de seguridad</h2>
      <input id="backupDesc" type="text" placeholder="Descripción">
      <button id="createBackup" type="button">Crear backup</button>
      <span id="backupMessage" class="backup-status" aria-live="polite"></span>
      <ol id="backupList" class="backup-list"></ol>
      <span id="selectedDesc"></span>
      <ul id="selectedStats" class="stats-list"></ul>
      <button id="restoreBackup" type="button">Restaurar</button>
      <button id="deleteBackup" type="button">Eliminar backup</button>
    </section>
    <section class="stats">
      <h2>Datos actuales</h2>
      <ul id="statsList"></ul>
    </section>`;

  animateInsert(container);

  const backupList = container.querySelector('#backupList');
  const createBtn = container.querySelector('#createBackup');
  const descInput = container.querySelector('#backupDesc');
  const backupMsg = container.querySelector('#backupMessage');
  const descLabel = container.querySelector('#selectedDesc');
  const restoreBtn = container.querySelector('#restoreBackup');
  const deleteBtn = container.querySelector('#deleteBackup');
  const statsList = container.querySelector('#statsList');
  const selectedStats = container.querySelector('#selectedStats');

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
      if (!resp.ok) {
        if (backupMsg) {
          backupMsg.textContent = 'Error al cargar la lista de backups';
          backupMsg.classList.add('show', 'error');
          setTimeout(() => backupMsg.classList.remove('show'), 5000);
        }
        return;
      }
      const list = await resp.json();
      if (backupList) {
        backupList.innerHTML = list
          .map(b => `<li data-name="${b.name}" data-desc="${b.description || ''}" data-stats='${JSON.stringify(b.stats || {})}'><strong>${b.name.replace('.zip','')}</strong> - ${b.description || ''}</li>`)
          .join('');
        const first = backupList.querySelector('li');
        if (first) {
          selectedBackup = first.dataset.name;
          if (descLabel) descLabel.textContent = first.dataset.desc || '';
          if (selectedStats) {
            const stats = JSON.parse(first.dataset.stats || '{}');
            selectedStats.innerHTML = Object.entries(stats)
              .map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`)
              .join('');
          }
        } else {
          selectedBackup = '';
          if (descLabel) descLabel.textContent = '';
          if (selectedStats) selectedStats.innerHTML = '';
        }
        highlightSelected();
      }
    } catch (e) {
      console.error(e);
      if (backupMsg) {
        backupMsg.textContent = 'Error al cargar la lista de backups';
        backupMsg.classList.add('show', 'error');
        setTimeout(() => backupMsg.classList.remove('show'), 5000);
      }
    }
  }

  async function loadStats() {
    if (!statsList) return;
    try {
      const resp = await fetch('/api/db-stats');
      if (!resp.ok) return;
      const data = await resp.json();
      statsList.innerHTML = Object.entries(data)
        .map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`)
        .join('');
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
        if (backupMsg) {
          backupMsg.textContent = `Error al crear el backup: ${msg}. \nVerifica que el servidor esté en funcionamiento.`;
          backupMsg.classList.add('show', 'error');
          setTimeout(() => backupMsg.classList.remove('show'), 5000);
        }
        return;
      }
      if (backupMsg) {
        backupMsg.textContent = 'Backup creado correctamente';
        backupMsg.classList.remove('error');
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
    if (selectedStats) {
      const stats = JSON.parse(li.dataset.stats || '{}');
      selectedStats.innerHTML = Object.entries(stats)
        .map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`)
        .join('');
    }
    highlightSelected();
  });

  loadBackups();
  loadStats();
}
