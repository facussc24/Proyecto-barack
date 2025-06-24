'use strict';
import { getAll, ready } from './dataService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('maestroBody');
  const search = document.getElementById('search');
  const exportExcelBtn = document.getElementById('exportExcelSrv');
  const exportPdfBtn = document.getElementById('exportPdfSrv');

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
        if (r.id) tr.dataset.id = r.id; // keep ID for internal use
        tr.innerHTML = `
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

  function showSpinner() {
    const el = document.getElementById('loading');
    if (el) el.style.display = 'flex';
  }

  function hideSpinner() {
    const el = document.getElementById('loading');
    if (el) el.style.display = 'none';
  }

  async function exportServer(fmt) {
    showSpinner();
    try {
      // If localStorage.getItem('useMock') === 'true', intercept this fetch
      // and return a Blob of your choice for offline mode.
      const resp = await fetch(`/api/maestro/export?format=${fmt}`);
      if (!resp.ok) throw new Error('fail');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const ext = fmt === 'excel' ? 'xlsx' : 'pdf';
      const a = document.createElement('a');
      a.href = url;
      a.download = `maestro.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (window.mostrarMensaje) window.mostrarMensaje('Exportación completa', 'success');
    } catch {
      if (window.mostrarMensaje) window.mostrarMensaje('Error al exportar');
    } finally {
      hideSpinner();
    }
  }

  exportExcelBtn?.addEventListener('click', () => exportServer('excel'));
  exportPdfBtn?.addEventListener('click', () => exportServer('pdf'));

  render();
});
