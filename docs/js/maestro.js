'use strict';
import { getAll, ready } from './dataService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('maestroBody');
  const search = document.getElementById('search');
  const exportBtn = document.getElementById('exportExcel');

  await ready;
  let rows = await getAll('maestro');
  if (!Array.isArray(rows)) rows = [];

  function render() {
    const term = search.value.trim().toLowerCase();
    tbody.innerHTML = '';
    rows
      .filter(r => {
        if (!term) return true;
        return Object.values(r).some(v =>
          String(v).toLowerCase().includes(term)
        );
      })
      .forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${r.id || ''}</td>
          <td>${r.flujograma || ''}</td>
          <td>${r.amfe || ''}</td>
          <td>${r.hojaOp || ''}</td>
          <td>${r.mylar || ''}</td>
          <td>${r.planos || ''}</td>
          <td>${r.ulm || ''}</td>
          <td>${r.fichaEmb || ''}</td>
          <td>${r.tizada || ''}</td>
          <td>${r.notificado ? 'Sí' : 'No'}</td>
        `;
        tbody.appendChild(tr);
      });
  }

  search.addEventListener('input', render);

  exportBtn?.addEventListener('click', () => {
    if (typeof XLSX === 'undefined') return;
    const headers = Array.from(
      document.querySelectorAll('#maestroTable thead th')
    ).map(th => th.textContent);
    const data = Array.from(
      document.querySelectorAll('#maestroTable tbody tr')
    ).map(tr => Array.from(tr.children).map(td => td.textContent));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    XLSX.utils.book_append_sheet(wb, ws, 'Maestro');
    XLSX.writeFile(wb, 'maestro.xlsx');
  });

  render();
});
