import { getAll, add, update, remove, ready } from '../dataService.js';
import { getUser } from '../session.js';

let maestroData = [];

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
        <button class="edit-row">✏️</button>
        <button class="del-row">🗑️</button>
        <button class="ok-row">✔</button>
      </td>`;
    tbody.appendChild(tr);
  });
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
        </thead>
        <tbody></tbody>
      </table>
    </div>
    <dialog id="historialDlg">
      <table>
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
      <button id="cerrarHistorial">Cerrar</button>
    </dialog>
  `;
  await ready;
  maestroData = await getAll('maestro');
  renderTabla(container);

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
    } else if (btn.classList.contains('edit-row')) {
      startEdit(tr, item);
    } else if (btn.classList.contains('ok-row')) {
      await setNotification(id, true);
      renderTabla(container);
    }
  });

  container.querySelector('#btnNuevoMaestro').addEventListener('click', async () => {
    const row = nuevaFila();
    maestroData.push(row);
    await add('maestro', row);
    renderTabla(container);
  });

  container.querySelector('#btnExportMaestro').addEventListener('click', () => {
    if (typeof XLSX === 'undefined') return;
    const headers = Array.from(container.querySelectorAll('#maestro thead th')).map(th => th.textContent);
    const rows = maestroData.map(r => [r.notificado ? 'OK' : 'ALERTA', r.tipo, r.nro, r.codigo_producto, r.revision, formatDate(r.fecha_ultima_revision), r.link]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers.slice(0,7), ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Maestro');
    XLSX.writeFile(wb, 'maestro.xlsx');
  });

  const dlg = container.querySelector('#historialDlg');
  container.querySelector('#btnHistorial').addEventListener('click', async () => {
    const body = dlg.querySelector('#historialBody');
    const historial = await getAll('maestroHist');
    body.innerHTML = '';
    historial.sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
    historial.forEach(h => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(h.timestamp).toLocaleString('es-ES')}</td>
        <td>${h.usuario}</td>
        <td>${maestroData.find(x=>x.id===h.elemento_id)?.tipo||''}</td>
        <td>${maestroData.find(x=>x.id===h.elemento_id)?.nro||''}</td>
        <td>${h.campo}</td>
        <td>${h.antes}</td>
        <td>${h.despues}</td>`;
      body.appendChild(tr);
    });
    dlg.showModal();
  });
  dlg.querySelector('#cerrarHistorial').addEventListener('click',()=>dlg.close());
}
