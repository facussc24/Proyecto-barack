import { getAll, add, update, ready } from '../dataService.js';
import { getUser } from '../session.js';

let maestroData = [];
let historialData = [];

const columns = [
  { key: 'id', label: 'Producto' },
  { key: 'flujograma', label: 'Flujograma' },
  { key: 'amfe', label: 'AMFE' },
  { key: 'hojaOp', label: 'Hoja Op' },
  { key: 'mylar', label: 'Mylar' },
  { key: 'planos', label: 'Planos' },
  { key: 'ulm', label: 'ULM' },
  { key: 'fichaEmb', label: 'Ficha Embalaje' },
  { key: 'tizada', label: 'Tizada' },
  { key: 'notificado', label: 'Notificado' }
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

function dependents(key) {
  return dependencies[key] || [];
}

function agregarHistorial(id, campo, antes, despues) {
  const usuario = (getUser() || {}).name || 'Admin';
  const hasCrypto = typeof crypto !== 'undefined';
  const entry = {
    hist_id: hasCrypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
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

// Clear revision numbers of dependent documents when working with the old
// maestro schema. This is a no-op for the new schema where `tipo` is not
// defined on the row.
export function clearDependentRevisions(row, data) {
  if (!row || !row.tipo) return [];
  const dependents = dependencies[row.tipo] || [];
  const result = [];
  for (const tipo of dependents) {
    const dep = data.find(
      r => r.codigo_producto === row.codigo_producto && r.tipo === tipo
    );
    if (dep && dep.revision !== '') {
      result.push({ id: dep.id, oldValue: dep.revision });
      dep.revision = '';
      dep.notificado = false;
    }
  }
  return result;
}

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

function saveFilters(container) {
  const data = {};
  columns.forEach(c => {
    const el = container.querySelector(`#filter_${c.key}`);
    if (el) data[c.key] = el.value || '';
  });
  const search = container.querySelector('#searchMaestro');
  if (search) data._search = search.value || '';
  localStorage.setItem('maestroFilters', JSON.stringify(data));
}

function loadFilters(container) {
  try {
    const obj = JSON.parse(localStorage.getItem('maestroFilters') || '{}');
    Object.entries(obj).forEach(([k, v]) => {
      const el = container.querySelector(`#filter_${k}`);
      if (el) el.value = v;
    });
    if (obj._search) {
      const s = container.querySelector('#searchMaestro');
      if (s) s.value = obj._search;
    }
  } catch {}
}

function applyFilters(container) {
  const search = container.querySelector('#searchMaestro');
  const global = (search?.value || '').trim().toLowerCase();
  const vals = {};
  columns.forEach(c => {
    const el = container.querySelector(`#filter_${c.key}`);
    vals[c.key] = (el?.value || '').trim().toLowerCase();
  });
  container.querySelectorAll('#maestro tbody tr').forEach(tr => {
    const row = maestroData.find(r => r.id === tr.dataset.id);
    let show = true;
    if (global) {
      const g = columns.some(c => {
        if (c.key === 'notificado') return false;
        return String(row[c.key] || '').toLowerCase().includes(global);
      });
      if (!g) show = false;
    }
    columns.forEach((c, idx) => {
      if (!show) return;
      if (c.key === 'notificado') {
        if (vals.notificado) {
          const state = row.notificado ? 'ok' : 'alerta';
          if (state !== vals.notificado) show = false;
        }
      } else {
        const val = String(row[c.key] || '').toLowerCase();
        if (vals[c.key] && !val.includes(vals[c.key])) show = false;
      }
    });
    tr.style.display = show ? '' : 'none';
  });
}

function renderTabla(container) {
  const tbody = container.querySelector('#maestro tbody');
  tbody.innerHTML = '';
  maestroData.forEach(row => {
    const tr = document.createElement('tr');
    tr.dataset.id = row.id;
    columns.forEach(col => {
      const td = document.createElement('td');
      if (col.key === 'notificado') {
        td.className = 'notify-cell';
        td.textContent = row.notificado ? '🟢' : '🔴';
      } else {
        td.textContent = row[col.key] || '';
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  applyFilters(container);
}

async function onCellEdit(rowId, key, value) {
  const row = maestroData.find(r => r.id === rowId);
  if (!row) return;
  const old = row[key] || '';
  if (old === value) return;
  row[key] = value;
  row.notificado = false;
  agregarHistorial(rowId, key, old, value);
  if (key === 'nro') {
    const affected = clearDependentRevisions(row, maestroData);
    for (const { id, oldValue } of affected) {
      agregarHistorial(id, 'revision', oldValue, '');
      await update('maestro', id, { revision: '', notificado: false });
    }
  }
  const dep = clearDependents(row, key);
  const changes = { [key]: value, notificado: false };
  dep.forEach(d => {
    agregarHistorial(rowId, d.field, d.old, '');
    changes[d.field] = '';
  });
  await update('maestro', rowId, changes);
  renderTabla(document.querySelector('.maestro-page'));
}

function setupEditing(container) {
  const tbody = container.querySelector('#maestro tbody');
  tbody.addEventListener('dblclick', ev => {
    const cell = ev.target.closest('td');
    if (!cell) return;
    const tr = cell.closest('tr');
    const idx = Array.from(tr.children).indexOf(cell);
    const col = columns[idx];
    if (!col || col.key === 'id' || col.key === 'notificado') return;
    if (cell.querySelector('input')) return;
    const rowId = tr.dataset.id;
    const original = maestroData.find(r => r.id === rowId)[col.key] || '';
    cell.textContent = '';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = original;
    cell.appendChild(inp);
    inp.focus();
    inp.select();
    const finish = () => {
      const val = inp.value.trim();
      cell.textContent = val;
      onCellEdit(rowId, col.key, val);
    };
    const onKey = e => {
      if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
      else if (e.key === 'Escape') { cell.textContent = original; }
    };
    inp.addEventListener('blur', finish, { once: true });
    inp.addEventListener('keydown', onKey);
  });

  tbody.addEventListener('click', ev => {
    const cell = ev.target.closest('td.notify-cell');
    if (!cell) return;
    const tr = cell.closest('tr');
    const rowId = tr.dataset.id;
    const row = maestroData.find(r => r.id === rowId);
    row.notificado = !row.notificado;
    cell.textContent = row.notificado ? '🟢' : '🔴';
    update('maestro', rowId, { notificado: row.notificado });
  });
}

function startEdit(rowId, key = 'flujograma') {
  const tbody = document.querySelector('#maestro tbody');
  const tr = tbody?.querySelector(`tr[data-id="${rowId}"]`);
  if (!tr) return;
  const idx = columns.findIndex(c => c.key === key);
  const cell = tr.children[idx];
  if (cell) {
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  }
}

export async function render(container) {
  container.classList.add('maestro-page');
  container.innerHTML = `
    <h1>Listado Maestro</h1>
    <p class="maestro-help">Doble clic en una celda para editarla</p>
    <div class="maestro-header">
      <button id="btnNuevoMaestro">+ Nuevo</button>
      <button id="btnExportMaestro">Exportar Excel</button>
      <button id="btnHistorial">Historial</button>
      <input id="searchMaestro" type="text" placeholder="Buscar...">
    </div>
    <div class="tabla-contenedor maestro-container">
      <table id="maestro">
        <thead>
          <tr>
            ${columns.map(c => `<th>${c.label}</th>`).join('')}
          </tr>
          <tr>
            ${columns
              .map(c => {
                if (c.key === 'notificado') {
                  return `<th><select id="filter_${c.key}" class="maestro-filter"><option value=""></option><option value="ok">🟢</option><option value="alerta">🔴</option></select></th>`;
                }
                return `<th><input id="filter_${c.key}" class="maestro-filter" type="text"></th>`;
              })
              .join('')}
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
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

  await ready;
  maestroData = await getAll('maestro');
  renderTabla(container);
  loadFilters(container);

  container.querySelectorAll('.maestro-filter').forEach(inp => {
    const ev = inp.tagName === 'SELECT' ? 'change' : 'input';
    inp.addEventListener(ev, () => {
      applyFilters(container);
      saveFilters(container);
    });
  });
  const searchInput = container.querySelector('#searchMaestro');
  searchInput?.addEventListener('input', () => {
    applyFilters(container);
    saveFilters(container);
  });

  setupEditing(container);

  container.querySelector('#btnNuevoMaestro').addEventListener('click', async () => {
    const codigo = prompt('Código de producto?');
    if (!codigo) return;
    if (maestroData.some(r => r.id === codigo)) {
      alert('Ya existe un producto con ese código');
      return;
    }
    const row = nuevaFila(codigo);
    maestroData.push(row);
    await add('maestro', row);
    renderTabla(container);
    startEdit(codigo);
  });

  container.querySelector('#btnExportMaestro').addEventListener('click', async () => {
    if (typeof XLSX === 'undefined') return;
    const headers = columns.map(c => c.label);
    const rows = maestroData.map(r => [
      r.id,
      r.flujograma,
      r.amfe,
      r.hojaOp,
      r.mylar,
      r.planos,
      r.ulm,
      r.fichaEmb,
      r.tizada,
      r.notificado ? 'OK' : 'ALERTA'
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const headerStyle = { font: { color: { rgb: 'FFFFFF' }, bold: true }, fill: { fgColor: { rgb: '44546A' } } };
    headers.forEach((_, idx) => {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: idx })];
      if (cell) cell.s = headerStyle;
    });
    const colWidths = headers.map((h, i) => {
      const max = Math.max(h.length, ...rows.map(r => String(r[i] || '').length));
      return { wch: max + 2 };
    });
    ws['!cols'] = colWidths;

    const histHeaders = ['Fecha/hora', 'Usuario', 'Producto', 'Campo', 'Antes', 'Después'];
    const histRows = (await getAll('maestroHist'))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(h => [
        new Date(h.timestamp).toLocaleString('es-ES'),
        h.usuario,
        h.elemento_id,
        h.campo,
        h.antes,
        h.despues
      ]);
    const wsHist = XLSX.utils.aoa_to_sheet([histHeaders, ...histRows]);
    histHeaders.forEach((_, idx) => {
      const cell = wsHist[XLSX.utils.encode_cell({ r: 0, c: idx })];
      if (cell) cell.s = headerStyle;
    });
    wsHist['!cols'] = histHeaders.map((h, i) => {
      const max = Math.max(h.length, ...histRows.map(r => String(r[i] || '').length));
      return { wch: max + 2 };
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Maestro');
    XLSX.utils.book_append_sheet(wb, wsHist, 'Historial');
    XLSX.writeFile(wb, 'ListadoMaestro.xlsx');
  });

  const dlg = container.querySelector('#historialDlg');
  const body = dlg.querySelector('#historialBody');
  const desdeInp = dlg.querySelector('#historialDesde');
  const hastaInp = dlg.querySelector('#historialHasta');
  const usuarioInp = dlg.querySelector('#historialUsuario');
  const productoInp = dlg.querySelector('#historialProducto');

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
