import { getAll, add, update, remove, ready } from '../dataService.js';
import { getUser } from '../session.js';
import { showDeleteDialog } from './maestro_vivo.js';

const columnDefs = [
  { field: 'id', headerName: 'Producto', editable: true },
  { field: 'flujograma', headerName: 'Flujograma', editable: true },
  { field: 'amfe', headerName: 'AMFE', editable: true },
  { field: 'hojaOp', headerName: 'Hoja Op', editable: true },
  { field: 'mylar', headerName: 'Mylar', editable: true },
  { field: 'planos', headerName: 'Planos', editable: true },
  { field: 'ulm', headerName: 'ULM', editable: true },
  { field: 'fichaEmb', headerName: 'Ficha Embalaje', editable: true },
  { field: 'tizada', headerName: 'Tizada', editable: true },
  {
    field: 'notificado',
    headerName: 'Notificado',
    editable: false,
    valueFormatter: params => (params.value ? '🟢' : '🔴')
  },
  {
    headerName: '',
    field: 'actions',
    width: 80,
    sortable: false,
    filter: false,
    editable: false,
    cellRenderer: params => {
      const btn = document.createElement('button');
      btn.textContent = '🗑️';
      btn.addEventListener('click', async () => {
        const ok = await showDeleteDialog();
        if (!ok) return;
        await remove('maestro', params.data.id);
        params.api.applyTransaction({ remove: [params.node.data] });
      });
      return btn;
    }
  }
];

const dependencies = {
  flujograma: ['amfe', 'hojaOp'],
  amfe: ['hojaOp'],
  hojaOp: ['mylar', 'planos', 'ulm', 'fichaEmb', 'tizada'],
  mylar: ['planos'],
  planos: [],
  ulm: [],
  fichaEmb: [],
  tizada: []
};

let gridOptions;

function nuevaFila(codigo) {
  return {
    id: codigo || Date.now().toString(),
    flujograma: '',
    amfe: '',
    hojaOp: '',
    mylar: '',
    planos: '',
    ulm: '',
    fichaEmb: '',
    tizada: '',
    notificado: false
  };
}

function dependents(key) {
  return dependencies[key] || [];
}

function agregarHistorial(id, campo, antes, despues) {
  const usuario = (getUser() || {}).name || 'Admin';
  const entry = {
    hist_id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    elemento_id: id,
    timestamp: new Date().toISOString(),
    usuario,
    campo,
    antes,
    despues
  };
  add('maestroHist', entry);
}

function clearDependents(row, key) {
  const changes = [];
  for (const dep of dependents(key)) {
    if (row[dep]) {
      changes.push({ field: dep, old: row[dep] });
      row[dep] = '';
    }
  }
  if (changes.length) row.notificado = false;
  return changes;
}

async function onCellValueChanged(ev) {
  const { data, colDef, oldValue, newValue } = ev;
  if (oldValue === newValue) return;
  const id = data.id;
  const field = colDef.field;
  data[field] = newValue;
  data.notificado = false;
  const changes = { [field]: newValue, notificado: false };
  agregarHistorial(id, field, oldValue || '', newValue || '');
  clearDependents(data, field).forEach(d => {
    agregarHistorial(id, d.field, d.old || '', '');
    changes[d.field] = '';
  });
  await update('maestro', id, changes);
  ev.api.refreshCells({ rowNodes: [ev.node] });
}

export async function render(container) {
  container.innerHTML = `
    <h1>Listado Maestro Vivo</h1>
    <div class="maestro-header">
      <button id="btnNuevoMaestro">+ Nuevo</button>
      <button id="btnExportMaestro">Exportar Excel</button>
      <button id="btnHistorial">Historial</button>
    </div>
    <div id="maestroGrid" class="ag-theme-alpine maestro-container" style="height:70vh"></div>
    <dialog id="historialDlg" class="modal">
      <div class="filtros-texto">
        <label>Desde <input id="historialDesde" type="date"></label>
        <label>Hasta <input id="historialHasta" type="date"></label>
        <label>Usuario <input id="historialUsuario" type="text"></label>
        <label>Producto <input id="historialProducto" type="text"></label>
      </div>
      <table class="db-table">
        <thead>
          <tr>
            <th>Fecha/hora</th>
            <th>Usuario</th>
            <th>Producto</th>
            <th>Campo</th>
            <th>Antes</th>
            <th>Después</th>
          </tr>
        </thead>
        <tbody id="historialBody"></tbody>
      </table>
      <div class="form-actions">
        <button id="cerrarHistorial" type="button">Cerrar</button>
      </div>
    </dialog>
  `;

  gridOptions = {
    columnDefs,
    defaultColDef: { resizable: true, editable: true },
    onCellValueChanged
  };

  new agGrid.Grid(container.querySelector('#maestroGrid'), gridOptions);
  await ready;
  const data = await getAll('maestro');
  gridOptions.api.setRowData(data);

  container.querySelector('#btnNuevoMaestro').addEventListener('click', async () => {
    const codigo = prompt('Código de producto?');
    if (!codigo) return;
    if (data.some(r => r.id === codigo)) {
      alert('Ya existe un producto con ese código');
      return;
    }
    const row = nuevaFila(codigo);
    data.push(row);
    await add('maestro', row);
    gridOptions.api.applyTransaction({ add: [row] });
  });

  container.querySelector('#btnExportMaestro').addEventListener('click', async () => {
    if (typeof XLSX === 'undefined') return;
    const blob = gridOptions.api.getDataAsExcel({ sheetName: 'Maestro' });
    const buffer = await blob.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const histHeaders = ['Fecha/hora', 'Usuario', 'Producto', 'Campo', 'Antes', 'Después'];
    const hist = (await getAll('maestroHist')).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const histRows = hist.map(h => [
      new Date(h.timestamp).toLocaleString('es-ES'),
      h.usuario,
      h.elemento_id,
      h.campo,
      h.antes,
      h.despues
    ]);
    const wsHist = XLSX.utils.aoa_to_sheet([histHeaders, ...histRows]);
    XLSX.utils.book_append_sheet(wb, wsHist, 'Historial');
    XLSX.writeFile(wb, 'ListadoMaestro.xlsx');
  });

  const dlg = container.querySelector('#historialDlg');
  const body = dlg.querySelector('#historialBody');
  const desdeInp = dlg.querySelector('#historialDesde');
  const hastaInp = dlg.querySelector('#historialHasta');
  const usuarioInp = dlg.querySelector('#historialUsuario');
  const productoInp = dlg.querySelector('#historialProducto');
  let historialData = [];

  function renderHist() {
    body.innerHTML = '';
    const start = desdeInp.value ? new Date(desdeInp.value) : null;
    if (start) start.setHours(0, 0, 0, 0);
    const end = hastaInp.value ? new Date(hastaInp.value) : null;
    if (end) end.setHours(23, 59, 59, 999);
    const usuario = usuarioInp.value.toLowerCase();
    const prod = productoInp.value.toLowerCase();
    historialData
      .filter(h => {
        const ts = new Date(h.timestamp);
        if (start && ts < start) return false;
        if (end && ts > end) return false;
        if (usuario && !h.usuario.toLowerCase().includes(usuario)) return false;
        if (prod && !String(h.elemento_id).toLowerCase().includes(prod)) return false;
        return true;
      })
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${new Date(h.timestamp).toLocaleString('es-ES')}</td>
          <td>${h.usuario}</td>
          <td>${h.elemento_id}</td>
          <td>${h.campo}</td>
          <td>${h.antes}</td>
          <td>${h.despues}</td>`;
        body.appendChild(tr);
      });
  }

  [desdeInp, hastaInp, usuarioInp, productoInp].forEach(inp => inp.addEventListener('input', renderHist));

  container.querySelector('#btnHistorial').addEventListener('click', async () => {
    historialData = await getAll('maestroHist');
    renderHist();
    dlg.showModal();
    desdeInp.focus();
  });
  dlg.querySelector('#cerrarHistorial').addEventListener('click', () => dlg.close());
}
