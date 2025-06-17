import { getAll, add, update, remove, ready } from '../dataService.js';
import { getUser } from '../session.js';

let maestroData = [];

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
      <td>${item.link ? `<a href="${item.link}" target="_blank">📂</a>` : ''}</td>
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

  save.addEventListener('click', async () => {
    const nuevo = {
      tipo: tipo.value.trim(),
      nro: nro.value.trim(),
      codigo_producto: codigo.value.trim(),
      revision: rev.value.trim(),
      link: link.value.trim(),
      fecha_ultima_revision: new Date().toISOString()
    };
    const cambios = {};
    for (const campo of Object.keys(nuevo)) {
      if (nuevo[campo] !== (item[campo] || '')) {
        cambios[campo] = nuevo[campo];
        agregarHistorial(item.id, campo, item[campo] || '', nuevo[campo]);
      }
    }
    if (cambios.revision || cambios.nro || cambios.codigo_producto) {
      cambios.notificado = false;
    }
    Object.assign(item, cambios);
    await update('maestro', item.id, cambios);
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
      item.notificado = true;
      await update('maestro', id, { notificado: true });
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
