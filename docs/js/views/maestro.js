import { getAll, ready } from '../dataService.js';

export async function render(container) {
  container.innerHTML = `
    <h1>Listado Maestro</h1>
    <div class="editor-menu">
      <label for="search">Buscar:</label>
      <input id="search" type="text">
      <button id="exportExcel">Exportar Excel</button>
    </div>
    <div class="tabla-contenedor">
      <table id="maestroTable" class="db-table">
        <thead>
          <tr>
            <th>ID</th>
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
  const exportBtn = container.querySelector('#exportExcel');

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

  search.addEventListener('input', renderRows);

  exportBtn?.addEventListener('click', () => {
    if (typeof XLSX === 'undefined') return;
    const headers = Array.from(
      container.querySelectorAll('#maestroTable thead th')
    ).map(th => th.textContent);
    const data = Array.from(
      container.querySelectorAll('#maestroTable tbody tr')
    ).map(tr => Array.from(tr.children).map(td => td.textContent));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    XLSX.utils.book_append_sheet(wb, ws, 'Maestro');
    XLSX.writeFile(wb, 'maestro.xlsx');
  });

  renderRows();
}
