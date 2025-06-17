'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.querySelector('#historyTable tbody');
  try {
    const resp = await fetch('/api/history');
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
});

