import { getAll, ready } from '../dataService.js';

export async function render(container) {
  container.innerHTML = `
    <h1>Listado Maestro</h1>
    <div class="editor-menu">
      <label for="search">Buscar:</label>
      <input id="search" type="text">
      <button id="exportExcelSrv" class="btn-excel" aria-label="Exportar a Excel" title="Exportar a Excel">📊 Exportar Excel</button>
      <button id="exportPdfSrv" class="btn-pdf" aria-label="Exportar a PDF" title="Exportar a PDF">📄 Exportar PDF</button>
    </div>
    <div class="tabla-contenedor">
      <table id="maestroTable" class="db-table">
        <thead>
          <tr>
            <th>Flujograma</th>
            <th>AMFE</th>
            <th>Hoja Op</th>
            <th>Mylar</th>
            <th>Planos</th>
            <th>ULM</th>
            <th>Ficha Emb.</th>
            <th>Tizada</th>
            <th>Notificado</th>
          </tr>
        </thead>
        <tbody id="maestroBody"></tbody>
      </table>
    </div>
  `;

  const tbody = container.querySelector('#maestroBody');
  const search = container.querySelector('#search');
  const exportExcelBtn = container.querySelector('#exportExcelSrv');
  const exportPdfBtn = container.querySelector('#exportPdfSrv');

  await ready;
  let rows = await getAll('maestro');
  if (!Array.isArray(rows)) rows = [];

  function renderRows() {
    const term = search.value.trim().toLowerCase();
    tbody.innerHTML = '';
    rows
      .filter(r => {
        if (!term) return true;
        return Object.values(r).some(v => String(v).toLowerCase().includes(term));
      })
      .forEach(r => {
        const tr = document.createElement('tr');
        if (r.id) tr.dataset.id = r.id; // mantiene ID internamente
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

  search.addEventListener('input', renderRows);

  function showSpinner() {
    const el = document.getElementById('loading');
    if (el) el.style.display = 'flex';
  }

  function hideSpinner() {
    const el = document.getElementById('loading');
    if (el) el.style.display = 'none';
  }

  async function checkHealth() {
    try {
      const resp = await fetch('/health');
      if (!resp.ok) throw new Error('bad');
    } catch {
      exportExcelBtn.disabled = true;
      exportPdfBtn.disabled = true;
    }
  }

  async function exportServer(fmt) {
    showSpinner();
    try {
      // Interception point: if localStorage.getItem('useMock') is 'true',
      // you can skip this fetch and return a local Blob for offline tests.
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
    } catch (e) {
      if (window.mostrarMensaje) window.mostrarMensaje('Error al exportar');
    } finally {
      hideSpinner();
    }
  }

  exportExcelBtn?.addEventListener('click', () => exportServer('excel'));
  exportPdfBtn?.addEventListener('click', () => exportServer('pdf'));

  checkHealth();

  renderRows();
}
