
'use strict';

const socket = (typeof io !== 'undefined')
  ? io({ transports: ['websocket'] })
  : (alert('Socket.IO no disponible'), null);


function showToast(msg) {
  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.querySelector('#historyTable tbody');
  const pageInput = document.getElementById('pageFilter');
  const userInput = document.getElementById('userFilter');
  const startInput = document.getElementById('startDate');
  const endInput = document.getElementById('endDate');
  const applyBtn = document.getElementById('applyFilters');
  const backupSel = document.getElementById('backupList');
  const createBtn = document.getElementById('createBackup');
  const descInput = document.getElementById('backupDesc');
  const descLabel = document.getElementById('selectedDesc');
  const restoreBtn = document.getElementById('restoreBackup');
  const deleteBtn = document.getElementById('deleteBackup');
  const statusSpan = document.getElementById('backupMessage');
  const simpleCreate = document.getElementById('simpleCreate');
  const simpleRestore = document.getElementById('simpleRestore');
  const simpleList = document.getElementById('simpleList');

  async function loadHistory() {
    try {
      const resp = await fetch('/api/history');
      if (!resp.ok) {
        if (resp.status === 409) alert('Conflicto al cargar historial');
        else showToast('Error al cargar historial');
        return;
      }
      const data = await resp.json();
      tbody.innerHTML = '';
      data.slice().reverse().forEach(entry => {
        const tr = document.createElement('tr');
        const ts = entry.ts ? dayjs(entry.ts).format('DD/MM/YYYY HH:mm') : '';
        tr.innerHTML =
          `<td>${ts}</td>` +
          `<td>${entry.summary || ''}</td>`;
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.error(e);
      tbody.innerHTML = '<tr><td colspan="2">Error al cargar historial</td></tr>';
    }
  }

  async function loadBackups() {
    try {
      const resp = await fetch('/api/backups');
      if (!resp.ok) {
        if (resp.status === 409) alert('Conflicto al obtener respaldos');
        else showToast('Error al obtener respaldos');
        return;
      }
      const list = await resp.json();
      backupSel.innerHTML = list
        .map(b => `<option value="${b.name}" data-desc="${b.description || ''}">${b.name}</option>`)
        .join('');
      const opt = backupSel.selectedOptions[0];
      if (descLabel) descLabel.textContent = opt ? opt.dataset.desc : '';
    } catch (e) {
      console.error(e);
    }
  }

  async function loadSimple() {
    try {
      const resp = await fetch('/api/simple-backups');
      if (!resp.ok) {
        if (resp.status === 409) alert('Conflicto al listar respaldos');
        else showToast('Error al listar respaldos');
        return;
      }
      const list = await resp.json();
      if (simpleList)
        simpleList.innerHTML = list
          .map(n => `<option value="${n}">${n}</option>`)
          .join('');
    } catch (e) {
      console.error(e);
    }
  }

  createBtn?.addEventListener('click', async () => {
    const description = descInput?.value.trim() || '';
    if (!description) {
      if (statusSpan) {
        statusSpan.textContent = 'Ingresa una descripción';
        statusSpan.classList.add('show', 'error');
        setTimeout(() => statusSpan.classList.remove('show'), 3000);
      }
      return;
    }
    const resp = await fetch('/api/backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });
    if (resp.ok && statusSpan) {
      statusSpan.textContent = 'Backup creado';
      statusSpan.classList.remove('error');
      statusSpan.classList.add('show');
      setTimeout(() => statusSpan.classList.remove('show'), 3000);
    } else if (!resp.ok && statusSpan) {
      if (resp.status === 409) {
        alert('Conflicto al crear backup. Recargá la página.');
      }
      let msg = '';
      try {
        const data = await resp.json();
        msg = data.error || resp.statusText;
      } catch {
        msg = resp.statusText;
      }
      statusSpan.textContent = `Error al crear backup: ${msg}`;
      statusSpan.classList.add('show', 'error');
      setTimeout(() => statusSpan.classList.remove('show'), 5000);
    }
    if (descInput) descInput.value = '';
    loadBackups();
  });

  backupSel?.addEventListener('change', () => {
    const opt = backupSel.selectedOptions[0];
    if (descLabel) descLabel.textContent = opt ? opt.dataset.desc : '';
  });

  restoreBtn?.addEventListener('click', async () => {
    const name = backupSel.value;
    if (!name) return;
    const resp = await fetch('/api/backups/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (resp.status === 409) {
      alert('Conflicto al restaurar. Recargá la página.');
      return;
    }
    if (resp.ok) {
      alert('Backup restaurado con éxito');
      if (typeof loadClients === 'function') loadClients();
      loadHistory();
    } else {
      showToast('Error al restaurar backup');
    }
  });

  simpleCreate?.addEventListener('click', async () => {
    const resp = await fetch('/api/simple-backup', { method: 'POST' });
    if (!resp.ok) {
      showToast('Error al crear respaldo rápido');
      return;
    }
    loadSimple();
  });

  simpleRestore?.addEventListener('click', async () => {
    const name = simpleList?.value;
    if (!name) return;
    const resp = await fetch('/api/simple-restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (resp.status === 409) {
      alert('Conflicto al restaurar. Recargá la página.');
      return;
    }
    if (resp.ok) location.reload();
    else showToast('Error al restaurar respaldo');
  });

  deleteBtn?.addEventListener('click', async () => {
    const name = backupSel.value;
    if (!name) return;
    const resp = await fetch(`/api/backups/${encodeURIComponent(name)}`, { method: 'DELETE' });
    if (!resp.ok) {
      showToast('Error al eliminar backup');
      return;
    }
    loadBackups();
  });

  applyBtn?.addEventListener('click', loadHistory);

  loadBackups();
  loadSimple();
  loadHistory();

  if (socket) {
    socket.on('data_updated', () => {
      loadHistory();
      if (typeof loadClients === 'function') loadClients();
    });

    socket.on('connect_error', e => console.error('WS error', e));
  }
});
