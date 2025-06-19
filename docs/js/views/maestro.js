import { getAll, ready } from '../dataService.js';

export async function render(container) {
  container.innerHTML = `
    <div class="top-actions">
      <button id="printBtn">🖨 Print</button>
      <div class="export-group">
        <button id="exportBtn">⬇ Export</button>
        <div class="export-menu">
          <button data-fmt="excel" class="btn-excel">Excel</button>
          <button data-fmt="pdf" class="btn-pdf">PDF</button>
        </div>
      </div>
      <button id="newClientBtn">+ Crear Cliente</button>
    </div>
    <div class="search-bar">
      <input id="search" type="text" placeholder="Buscar por cualquier parámetro…">
    </div>
    <div class="maestro-tabs">
      <button data-tab="all" class="active">Todos</button>
      <button data-tab="pickup">Pickups</button>
      <button data-tab="return">Returns</button>
    </div>
    <div class="advanced-filters">
      <input type="date" id="startDate">
      <input type="date" id="endDate">
      <select id="estado"><option value="">Estado</option></select>
      <select id="departamento"><option value="">Departamento</option></select>
      <select id="savedFilters"><option value="">Saved filters</option></select>
      <button id="moreFilters">More filters</button>
    </div>
    <div id="loading"><div class="spinner"></div></div>
    <section class="tabla-contenedor">
      <table id="maestroTable" class="master-table">
        <thead>
          <tr>
            <th class="checkbox-col"><input type="checkbox" id="selectAll"></th>
            <th>REF</th>
            <th>Created</th>
            <th>Customer</th>
            <th>Products</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Distribution</th>
            <th>Status</th>
            <th>Delivery Status</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody id="maestroBody"></tbody>
      </table>
    </section>
    <div class="results-info">
      <span id="resultsCount"></span>
      <label>Resultados por página
        <select id="pageSize">
          <option>10</option>
          <option>25</option>
          <option>50</option>
        </select>
      </label>
    </div>
    <div class="pagination">
      <button id="prevPage" disabled>← Anterior</button>
      <button id="nextPage">Siguiente →</button>
    </div>
  `;

  const tbody = container.querySelector('#maestroBody');
  const search = container.querySelector('#search');
  const resultsCount = container.querySelector('#resultsCount');
  const pageSizeSelect = container.querySelector('#pageSize');
  const prevBtn = container.querySelector('#prevPage');
  const nextBtn = container.querySelector('#nextPage');
  const exportBtn = container.querySelector('#exportBtn');
  const exportMenu = container.querySelector('.export-menu');

  let currentPage = 1;
  let pageSize = parseInt(pageSizeSelect.value, 10);

  function showSpinner() {
    const el = container.querySelector('#loading');
    if (el) el.style.display = 'flex';
  }

  function hideSpinner() {
    const el = container.querySelector('#loading');
    if (el) el.style.display = 'none';
  }

  showSpinner();
  await ready;
  let rows = await getAll('maestro');
  if (!Array.isArray(rows)) rows = [];
  hideSpinner();

  function filterRows() {
    const term = search.value.trim().toLowerCase();
    return rows.filter(r =>
      !term || Object.values(r).some(v => String(v).toLowerCase().includes(term))
    );
  }

  function renderRows() {
    const filtered = filterRows();
    const total = filtered.length;
    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    resultsCount.textContent = `Mostrando ${total ? start + 1 : 0}–${end} de ${total} resultados`;
    tbody.innerHTML = '';
    filtered.slice(start, end).forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="checkbox-col"><input type="checkbox"></td>
        <td>${r.ref || ''}</td>
        <td>${r.created || ''}</td>
        <td>${r.customer || ''}</td>
        <td>${r.products || ''}</td>
        <td>${r.startTime || ''}</td>
        <td>${r.endTime || ''}</td>
        <td>${r.distribution || ''}</td>
        <td>${r.status || ''}</td>
        <td>${r.deliveryStatus || ''}</td>
        <td>${r.price || ''}</td>
      `;
      tbody.appendChild(tr);
    });
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = end >= total;
  }

  search.addEventListener('input', () => {
    currentPage = 1;
    renderRows();
  });

  pageSizeSelect.addEventListener('change', () => {
    pageSize = parseInt(pageSizeSelect.value, 10);
    currentPage = 1;
    renderRows();
  });

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderRows();
    }
  });

  nextBtn.addEventListener('click', () => {
    currentPage++;
    renderRows();
  });

  exportBtn.addEventListener('click', () => {
    exportMenu.style.display = exportMenu.style.display === 'block' ? 'none' : 'block';
  });

  exportMenu.addEventListener('click', async ev => {
    const btn = ev.target.closest('button[data-fmt]');
    if (!btn) return;
    const fmt = btn.getAttribute('data-fmt');
    exportMenu.style.display = 'none';
    showSpinner();
    try {
      if (typeof API_BASE === 'string' && API_BASE) {
        const resp = await fetch(`${API_BASE}/api/maestro/export?format=${fmt}`);
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
      } else {
        const data = localStorage.getItem(`maestro-${fmt}`) || 'Mock data';
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const ext = fmt === 'excel' ? 'xlsx' : 'pdf';
        const a = document.createElement('a');
        a.href = url;
        a.download = `maestro.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch {
      console.error('Error exporting');
    } finally {
      hideSpinner();
    }
  });

  renderRows();
}
