import { getAll, add, update, remove, ready } from '../dataService.js';
import { getUser } from '../session.js';

let maestroData = [];
let historialData = [];

// Dependencies between document types. When a document revision changes
// the related documents listed here will be marked as pending review.
const dependencies = {
  'Flujograma': ['AMFE', 'Hoja de Operaciones'],
  AMFE: [],
  'Hoja de Operaciones': [],
  Mylar: [],
  Planos: [],
  ULM: [],
  'Ficha de Embalaje': [],
  Tizada: []
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES');
  } catch {
    return dateStr;
  }
}

function nuevaFila() {
  return {
    id: Date.now().toString(),
    tipo: '',
    nro: '',
    codigo_producto: '',
    revision: '',
    link: '',
    fecha_ultima_revision: new Date().toISOString(),
    notificado: true
  };
}

function crearCeldaInput(valor) {
  const inp = document.createElement('input');
  inp.value = valor || '';
  return inp;
}

function renderTabla(container) {
  const tbody = container.querySelector('#maestro tbody');
  tbody.innerHTML = '';
  if (!maestroData.length) {
    const tr = document.createElement('tr');
    tr.id = 'maestro-empty';
    const td = document.createElement('td');
    td.colSpan = 8;
    td.textContent = 'No hay datos disponibles';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  maestroData.forEach(item => {
    const tr = document.createElement('tr');
    tr.dataset.id = item.id;
    tr.innerHTML = `
      <td>${item.notificado ? '🟢' : '🔴'}</td>
      <td>${item.tipo || ''}</td>
      <td>${item.nro || ''}</td>
      <td>${item.codigo_producto || ''}</td>
      <td>${item.revision || ''}</td>
      <td>${formatDate(item.fecha_ultima_revision)}</td>
      <td>${item.link ? `<span title="Abrir carpeta"><a href="${item.link}" target="_blank" aria-label="Abrir carpeta">📂</a></span>` : ''}</td>
      <td>
        <button class="del-row">🗑️</button>
        <button class="ok-row">✔</button>
      </td>`;
    tbody.appendChild(tr);
  });

  applyFilters(container);
}

function agregarHistorial(id, campo, antes, despues) {
  const usuario = (getUser() || {}).name || 'Admin';
  const hasCrypto = typeof crypto !== 'undefined';
  const entry = {
    hist_id:
      hasCrypto && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(),
    elemento_id: id,
    timestamp: new Date().toISOString(),
    usuario,
    campo,
    antes,
    despues
  };
  add('maestroHist', entry);
}

// When a document revision changes, mark dependent documents of the same
// product as pending by clearing their revision and setting notificado=false.
async function aplicarDependencias(item, cambios) {
  if (!cambios.revision) return;
  const dependents = dependencies[item.tipo] || [];
  if (!dependents.length) return;
  for (const depTipo of dependents) {
    const depRow = maestroData.find(
      r => r.codigo_producto === item.codigo_producto && r.tipo === depTipo
    );
    if (depRow) {
      const oldRev = depRow.revision || '';
      if (oldRev !== '') {
        agregarHistorial(depRow.id, 'revision', oldRev, '');
      }
      depRow.revision = '';
      depRow.notificado = false;
      await update('maestro', depRow.id, { revision: '', notificado: false });
    }
  }
}

async function onCellEdit(rowId, columnKey, newValue) {
  const row = maestroData.find(r => r.id === rowId);
  if (!row) return;
  const oldValue = row[columnKey] || '';
  if (oldValue === newValue) return;
  row[columnKey] = newValue;
  row.fecha_ultima_revision = new Date().toISOString();
  row.notificado = false;
  agregarHistorial(rowId, columnKey, oldValue, newValue);
  await update('maestro', rowId, {
    [columnKey]: newValue,
    fecha_ultima_revision: row.fecha_ultima_revision,
    notificado: false
  });
  if (columnKey === 'revision') {
    const dependents = dependencies[row.tipo] || [];
    for (const depTipo of dependents) {
      const depRow = maestroData.find(
        r => r.codigo_producto === row.codigo_producto && r.tipo === depTipo
      );
      if (depRow) {
        const oldRev = depRow.revision || '';
        if (oldRev !== '') agregarHistorial(depRow.id, 'revision', oldRev, '');
        depRow.revision = '';
        depRow.notificado = false;
        await update('maestro', depRow.id, { revision: '', notificado: false });
        refreshSemaphore(depRow.id);
      }
    }
  }
  refreshSemaphore(rowId);
}

async function setNotification(rowId, state) {
  const row = maestroData.find(r => r.id === rowId);
  if (!row) return;
  row.notificado = state;
  await update('maestro', rowId, { notificado: state });
}

function refreshSemaphore(rowId) {
  const tr = document.querySelector(`#maestro tbody tr[data-id="${rowId}"]`);
  if (!tr) return;
  const row = maestroData.find(r => r.id === rowId);
  if (!row) return;
  const cell = tr.querySelector('td');
  if (cell) cell.textContent = row.notificado ? '🟢' : '🔴';
}

function saveFilters(container) {
  const ids = ['Status','Tipo','Nro','Codigo','Rev','Fecha','Link'];
  const data = {};
  ids.forEach(k => {
    const el = container.querySelector(`#filter${k}`);
    if (el) data[k] = el.value || '';
  });
  localStorage.setItem('maestroFilters', JSON.stringify(data));
}

function loadFilters(container) {
  try {
    const stored = JSON.parse(localStorage.getItem('maestroFilters') || '{}');
    Object.entries(stored).forEach(([k,v]) => {
      const el = container.querySelector(`#filter${k}`);
      if (el) el.value = v;
    });
  } catch {}
}

function applyFilters(container) {
  const val = id =>
    (container.querySelector(`#${id}`)?.value || '').trim().toLowerCase();
  const status = val('filterStatus');
  const tipo = val('filterTipo');
  const nro = val('filterNro');
  const codigo = val('filterCodigo');
  const rev = val('filterRev');
  const fecha = val('filterFecha');
  const link = val('filterLink');

  container
    .querySelectorAll('#maestro tbody tr')
    .forEach(row => {
      const cells = row.querySelectorAll('td');
      let show = true;
      if (status) {
        const icon = cells[0].textContent.includes('🟢') ? 'ok' : 'alerta';
        if (status !== icon) show = false;
      }
      if (show && tipo && !cells[1].textContent.toLowerCase().includes(tipo)) show = false;
      if (show && nro && !cells[2].textContent.toLowerCase().includes(nro)) show = false;
      if (show && codigo && !cells[3].textContent.toLowerCase().includes(codigo)) show = false;
      if (show && rev && !cells[4].textContent.toLowerCase().includes(rev)) show = false;
      if (show && fecha && !cells[5].textContent.toLowerCase().includes(fecha)) show = false;
      if (show && link && !cells[6].textContent.toLowerCase().includes(link)) show = false;
      row.style.display = show ? '' : 'none';
    });
}

function startEdit(tr, item) {
  if (tr.classList.contains('editing')) return;
  tr.classList.add('editing');
  const cells = tr.querySelectorAll('td');
  cells[1].textContent = '';
  const tipo = crearCeldaInput(item.tipo);
  cells[1].appendChild(tipo);
  cells[2].textContent = '';
  const nro = crearCeldaInput(item.nro);
  cells[2].appendChild(nro);
  cells[3].textContent = '';
  const codigo = crearCeldaInput(item.codigo_producto);
  cells[3].appendChild(codigo);
  cells[4].textContent = '';
  const rev = crearCeldaInput(item.revision);
  cells[4].appendChild(rev);
  cells[5].textContent = '';
  const fecha = crearCeldaInput(formatDate(item.fecha_ultima_revision));
  cells[5].appendChild(fecha);
  cells[6].textContent = '';
  const link = crearCeldaInput(item.link);
  cells[6].appendChild(link);
  const actions = cells[7];
  actions.innerHTML = '';
  const save = document.createElement('button');
  save.textContent = 'Guardar';
  actions.appendChild(save);
  const cancel = document.createElement('button');
  cancel.textContent = 'Cancelar';
  actions.appendChild(cancel);

  tipo.addEventListener('change', () => onCellEdit(item.id, 'tipo', tipo.value.trim()));
  nro.addEventListener('change', () => onCellEdit(item.id, 'nro', nro.value.trim()));
  codigo.addEventListener('change', () => onCellEdit(item.id, 'codigo_producto', codigo.value.trim()));
  rev.addEventListener('change', () => onCellEdit(item.id, 'revision', rev.value.trim()));
  fecha.addEventListener('change', () => onCellEdit(item.id, 'fecha_ultima_revision', fecha.value.trim()));
  link.addEventListener('change', () => onCellEdit(item.id, 'link', link.value.trim()));

  save.addEventListener('click', () => {
    tr.classList.remove('editing');
    renderTabla(tr.closest('table').closest('.tabla-contenedor').parentNode);
  });
  cancel.addEventListener('click', () => {
    renderTabla(tr.closest('table').closest('.tabla-contenedor').parentNode);
  });
}

export async function render(container) {
  container.innerHTML = `
    <h1>Listado Maestro</h1>
    <div class="maestro-header">
      <button id="btnNuevoMaestro">+ Nuevo</button>
      <button id="btnExportMaestro">Exportar Excel</button>
      <button id="btnHistorial">Historial</button>
    </div>
    <div class="tabla-contenedor maestro-container">
      <table id="maestro">
        <thead>
          <tr>
            <th>⚠️</th>
            <th>Tipo</th>
            <th>Nro</th>
            <th>Código producto</th>
            <th>Revisión</th>
            <th>Fecha última revisión</th>
            <th>Link</th>
            <th></th>
          </tr>
          <tr>
            <th><select id="filterStatus" class="maestro-filter">
                <option value=""></option>
                <option value="ok">🟢</option>
                <option value="alerta">🔴</option>
            </select></th>
            <th><input id="filterTipo" class="maestro-filter" type="text"></th>
            <th><input id="filterNro" class="maestro-filter" type="text"></th>
            <th><input id="filterCodigo" class="maestro-filter" type="text"></th>
            <th><input id="filterRev" class="maestro-filter" type="text"></th>
            <th><input id="filterFecha" class="maestro-filter" type="text"></th>
            <th><input id="filterLink" class="maestro-filter" type="text"></th>
            <th></th>
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
            <th>Tipo</th>
            <th>Nro</th>
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
  applyFilters(container);

  container.querySelectorAll('.maestro-filter').forEach(inp => {
    const ev = inp.tagName === 'SELECT' ? 'change' : 'input';
    inp.addEventListener(ev, () => {
      applyFilters(container);
      saveFilters(container);
    });
  });

  const tbody = container.querySelector('#maestro tbody');
  tbody.addEventListener('click', async ev => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const tr = btn.closest('tr');
    const id = tr.dataset.id;
    const idx = maestroData.findIndex(x => x.id === id);
    const item = maestroData[idx];
    if (btn.classList.contains('del-row')) {
      if (confirm('¿Eliminar fila?')) {
        await remove('maestro', id);
        maestroData.splice(idx, 1);
        renderTabla(container);
      }
    } else if (btn.classList.contains('ok-row')) {
      await setNotification(id, true);
      renderTabla(container);
    }
  });

  const columnMap = [null, 'tipo', 'nro', 'codigo_producto', 'revision',
    'fecha_ultima_revision', 'link'];

  tbody.addEventListener('dblclick', ev => {
    const cell = ev.target.closest('td');
    if (!cell) return;
    const tr = cell.closest('tr');
    if (!tr) return;
    const cells = Array.from(tr.children);
    const colIndex = cells.indexOf(cell);
    if (colIndex <= 0 || colIndex >= cells.length - 1) return;
    if (cell.querySelector('input')) return;
    const rowId = tr.dataset.id;
    const key = columnMap[colIndex];
    if (!key) return;
    const row = maestroData.find(r => r.id === rowId);
    if (!row) return;
    const original = row[key] || '';
    cell.innerHTML = '';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = key === 'fecha_ultima_revision' ? formatDate(original) : original;
    cell.appendChild(inp);
    inp.focus();
    inp.select();

    const finish = () => {
      const val = inp.value.trim();
      cell.innerHTML =
        key === 'link' && val ? `<a href="${val}" target="_blank">📂</a>` : val;
      onCellEdit(rowId, key, val);
    };

    const onKey = e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        inp.blur();
      } else if (e.key === 'Escape') {
        cell.innerHTML =
          key === 'link' && original
            ? `<a href="${original}" target="_blank">📂</a>`
            : key === 'fecha_ultima_revision'
            ? formatDate(original)
            : original;
      }
    };

    inp.addEventListener('blur', finish, { once: true });
    inp.addEventListener('keydown', onKey);
  });

  container.querySelector('#btnNuevoMaestro').addEventListener('click', async () => {
    const row = nuevaFila();
    maestroData.push(row);
    await add('maestro', row);
    renderTabla(container);
  });

  container.querySelector('#btnExportMaestro').addEventListener('click', async () => {
    if (typeof XLSX === 'undefined') return;
    const headers = Array.from(container.querySelectorAll('#maestro thead th')).map(th => th.textContent);
    const rows = maestroData.map(r => [r.notificado ? 'OK' : 'ALERTA', r.tipo, r.nro, r.codigo_producto, r.revision, formatDate(r.fecha_ultima_revision), r.link]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers.slice(0,7), ...rows]);

    const headerStyle = { font: { color: { rgb: 'FFFFFF' }, bold: true }, fill: { fgColor: { rgb: '44546A' } } };
    headers.slice(0,7).forEach((_, idx) => {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: idx })];
      if (cell) cell.s = headerStyle;
    });

    rows.forEach((row, rIdx) => {
      const addr = XLSX.utils.encode_cell({ r: rIdx + 1, c: 0 });
      const cell = ws[addr];
      if (cell) cell.s = { fill: { fgColor: { rgb: row[0] === 'OK' ? '00B050' : 'FF0000' } } };
    });

    const colWidths = headers.slice(0,7).map((h, i) => {
      if (i === 0) return { wch: 10 };
      const max = Math.max(h.length, ...rows.map(r => String(r[i] || '').length));
      return { wch: max + 2 };
    });
    ws['!cols'] = colWidths;

    const histHeaders = ['Fecha/hora','Usuario','Tipo','Nro','Campo','Antes','Después'];
    const historial = await getAll('maestroHist');
    historial.sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
    const histRows = historial.map(h => [
      new Date(h.timestamp).toLocaleString('es-ES'),
      h.usuario,
      maestroData.find(x=>x.id===h.elemento_id)?.tipo||'',
      maestroData.find(x=>x.id===h.elemento_id)?.nro||'',
      h.campo,
      h.antes,
      h.despues
    ]);
    const wsHist = XLSX.utils.aoa_to_sheet([histHeaders, ...histRows]);
    histHeaders.forEach((_, idx) => {
      const cell = wsHist[XLSX.utils.encode_cell({ r: 0, c: idx })];
      if (cell) cell.s = headerStyle;
    });
    wsHist['!cols'] = histHeaders.map((h,i)=>{
      const max = Math.max(h.length, ...histRows.map(r=>String(r[i]||'').length));
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
    const producto = productoInp.value.toLowerCase();

    historialData
      .filter(h => {
        const ts = new Date(h.timestamp);
        if (start && ts < start) return false;
        if (end && ts > end) return false;
        if (usuario && !h.usuario.toLowerCase().includes(usuario)) return false;
        if (producto) {
          const item = maestroData.find(x => x.id === h.elemento_id);
          const codigo = item?.codigo_producto || '';
          if (!codigo.toLowerCase().includes(producto)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${new Date(h.timestamp).toLocaleString('es-ES')}</td>
          <td>${h.usuario}</td>
          <td>${maestroData.find(x => x.id === h.elemento_id)?.tipo || ''}</td>
          <td>${maestroData.find(x => x.id === h.elemento_id)?.nro || ''}</td>
          <td>${h.campo}</td>
          <td>${h.antes}</td>
          <td>${h.despues}</td>`;
        body.appendChild(tr);
      });
  }

  [desdeInp, hastaInp, usuarioInp, productoInp].forEach(inp =>
    inp.addEventListener('input', renderHist)
  );

  container.querySelector('#btnHistorial').addEventListener('click', async () => {
    historialData = await getAll('maestroHist');
    renderHist();
    dlg.showModal();
    desdeInp.focus();
  });
  dlg.querySelector('#cerrarHistorial').addEventListener('click', () => dlg.close());
}
