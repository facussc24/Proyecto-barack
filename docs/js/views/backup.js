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
      <button id="restoreBackup" type="button">Restaurar</button>
      <button id="deleteBackup" type="button">Eliminar backup</button>
    </section>`;

  animateInsert(container);

  const backupList = container.querySelector('#backupList');
  const createBtn = container.querySelector('#createBackup');
  const descInput = container.querySelector('#backupDesc');
  const backupMsg = container.querySelector('#backupMessage');
  const descLabel = container.querySelector('#selectedDesc');
  const restoreBtn = container.querySelector('#restoreBackup');
  const deleteBtn = container.querySelector('#deleteBackup');

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
    highlightSelected();
  });

  loadBackups();
}
