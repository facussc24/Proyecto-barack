'use strict';

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

  async function loadHistory() {
    const params = new URLSearchParams();
    if (pageInput.value) params.append('page', pageInput.value);
    if (userInput.value) params.append('user', userInput.value);
    if (startInput.value) params.append('from', startInput.value);
    if (endInput.value) params.append('to', endInput.value);
    try {
      const resp = await fetch('/api/history?' + params.toString());
      if (!resp.ok) throw new Error('Request failed');
      const data = await resp.json();
      tbody.innerHTML = '';
      data.slice().reverse().forEach(entry => {
        const tr = document.createElement('tr');
        let summary = entry.summary;
        if (!summary && entry.changes) {
          try {
            summary = entry.changes.summary || JSON.stringify(entry.changes).slice(0, 60);
          } catch {
            summary = '';
          }
        }
        tr.innerHTML =
          `<td>${entry.timestamp || ''}</td>` +
          `<td>${entry.ip || ''}</td>` +
          `<td>${summary || ''}</td>`;
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.error(e);
      tbody.innerHTML = '<tr><td colspan="3">Error al cargar historial</td></tr>';
    }
  }

  async function loadBackups() {
    try {
      const resp = await fetch('/api/backups');
      if (!resp.ok) return;
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

  createBtn?.addEventListener('click', async () => {
    const description = descInput?.value || '';
    try {
      const resp = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        if (window.mostrarMensaje) window.mostrarMensaje(err.error || 'Error al crear backup');
      } else {
        if (window.mostrarMensaje) window.mostrarMensaje('Backup creado', 'success');
      }
    } catch (e) {
      console.error(e);
      if (window.mostrarMensaje) window.mostrarMensaje('Error al crear backup');
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
    try {
      const resp = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        if (window.mostrarMensaje) window.mostrarMensaje(err.error || 'Error al restaurar');
      } else {
        if (window.mostrarMensaje) window.mostrarMensaje('Restaurado', 'success');
      }
    } catch (e) {
      console.error(e);
      if (window.mostrarMensaje) window.mostrarMensaje('Error al restaurar');
    }
  });

  deleteBtn?.addEventListener('click', async () => {
    const name = backupSel.value;
    if (!name) return;
    try {
      const resp = await fetch(`/api/backups/${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        if (window.mostrarMensaje) window.mostrarMensaje(err.error || 'Error al eliminar');
      } else {
        if (window.mostrarMensaje) window.mostrarMensaje('Backup eliminado', 'success');
        loadBackups();
      }
    } catch (e) {
      console.error(e);
      if (window.mostrarMensaje) window.mostrarMensaje('Error al eliminar');
    }
  });

  applyBtn?.addEventListener('click', loadHistory);

  loadBackups();
  loadHistory();
});
