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
  const restoreBtn = document.getElementById('restoreBackup');

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
        .map(name => `<option value="${name}">${name}</option>`) 
        .join('');
    } catch (e) {
      console.error(e);
    }
  }

  createBtn?.addEventListener('click', async () => {
    await fetch('/api/backups', { method: 'POST' });
    loadBackups();
  });

  restoreBtn?.addEventListener('click', async () => {
    const name = backupSel.value;
    if (!name) return;
    await fetch('/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  });

  applyBtn?.addEventListener('click', loadHistory);

  loadBackups();
  loadHistory();
});
