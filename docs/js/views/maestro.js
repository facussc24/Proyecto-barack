import { ready, getAll, add, update, remove } from '../dataService.js';
import { getUser } from '../session.js';

const DEPENDENCIES = {
  flujograma: ['amfe', 'hojaOp'],
  amfe: [],
  hojaOp: [],
  mylar: [],
  planos: [],
  ulm: [],
  fichaEmb: [],
  tizada: []
};

const DOC_KEYS = ['amfe','flujograma','hojaOp','mylar','planos','ulm','fichaEmb','tizada'];
let productos = [];
let historial = [];
const SHARED_LINK = 'rutaCompartida';
const filters = {};

function crearFilaVacia(){
  const obj = {producto:'', notificado:false};
  for(const k of DOC_KEYS) obj[k] = '';
  return obj;
}

function crearEntradaHistorial(producto,campo,antes,despues){
  const usuario = (getUser()||{}).name || 'Anon';
  const entry = {
    hist_id: (crypto&&crypto.randomUUID)? crypto.randomUUID(): Date.now().toString(),
    producto,
    timestamp: new Date().toISOString(),
    usuario,
    campo,
    antes,
    despues
  };
  historial.push(entry);
  add('productosHist', entry);
}

function aplicaDependencias(item,campo){
  const deps = DEPENDENCIES[campo] || [];
  for(const d of deps){
    if(item[d]){
      crearEntradaHistorial(item.producto,d,item[d],'');
      item[d] = '';
    }
  }
}

function verificarNotificado(item){
  for(const k of DOC_KEYS){
    if(!item[k]){ item.notificado=false; return; }
  }
  item.notificado=true;
}

function renderTabla(container){
  const tbody = container.querySelector('#maestro-table tbody');
  tbody.innerHTML='';
  const datos = productos.filter(row=>{
    for(const key in filters){
      if(filters[key] && !String(row[key]||'').toLowerCase().includes(filters[key])) return false;
    }
    return true;
  });
  datos.forEach(item=>{
    const tr = document.createElement('tr');
    tr.dataset.producto=item.producto;
    tr.innerHTML = `
      <td class="semaforo">${item.notificado?'🟢':'🔴'}</td>
      <td class="editable" data-key="producto">${item.producto}</td>
      ${DOC_KEYS.map(k=>`<td class="editable" data-key="${k}">${item[k]||''} <a href="${SHARED_LINK}" target="_blank" class="doc-link" title="Abrir">📂</a></td>`).join('')}
      <td><button class="del">🗑️</button></td>`;
    tbody.appendChild(tr);
  });
}

function startEdit(td){
  const key = td.dataset.key;
  if(!key) return;
  const tr = td.parentElement;
  const valor = td.textContent.trim();
  td.innerHTML='';
  const inp = document.createElement('input');
  inp.value=valor;
  td.appendChild(inp);
  inp.focus();
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter') inp.blur(); });
  inp.addEventListener('blur', async ()=>{
    const nuevo = inp.value.trim();
    const prod = tr.dataset.producto;
    let item = productos.find(p=>p.producto===prod);
    if(!item) return;
    const antes = item[key] || '';
    if(nuevo!==antes){
      item[key]=nuevo;
      item.notificado=false;
      crearEntradaHistorial(item.producto,key,antes,nuevo);
      aplicaDependencias(item,key);
      verificarNotificado(item);
      await update('productos', item.producto, item);
    }
    renderTabla(td.closest('.maestro-container'));
  });
}

function setupEventos(container){
  const tbody = container.querySelector('#maestro-table tbody');
  tbody.addEventListener('dblclick',ev=>{
    const td = ev.target.closest('td.editable');
    if(td) startEdit(td);
  });
  tbody.addEventListener('click', async ev=>{
    const btn = ev.target.closest('button.del');
    if(!btn) return;
    const tr = btn.closest('tr');
    const prod = tr.dataset.producto;
    if(confirm('¿Eliminar producto?')){
      await remove('productos', prod);
      productos = productos.filter(p=>p.producto!==prod);
      renderTabla(container);
    }
  });
  container.querySelector('#btnNuevo').addEventListener('click', async ()=>{
    const row = crearFilaVacia();
    productos.push(row);
    await add('productos', row);
    renderTabla(container);
  });
  container.querySelector('#btnExcel').addEventListener('click', exportarExcel);
  container.querySelector('#btnHistorial').addEventListener('click',()=>{
    mostrarHistorial(container);
  });
  container.querySelectorAll('thead input').forEach(inp=>{
    inp.addEventListener('input',()=>{
      filters[inp.dataset.key]=inp.value.toLowerCase();
      renderTabla(container);
    });
  });
}

function exportarExcel(){
  if(typeof XLSX==='undefined') return;
  const headers = ['Producto', ...DOC_KEYS.map(k=>k.toUpperCase())];
  const rows = productos.map(p=>[p.producto,...DOC_KEYS.map(k=>p[k])]);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers,...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Maestro');
  const histHead = ['Fecha','Usuario','Producto','Campo','Antes','Después'];
  const histRows = historial.map(h=>[new Date(h.timestamp).toLocaleString('es-ES'),h.usuario,h.producto,h.campo,h.antes,h.despues]);
  const wsHist = XLSX.utils.aoa_to_sheet([histHead,...histRows]);
  XLSX.utils.book_append_sheet(wb, wsHist, 'Historial');
  XLSX.writeFile(wb,'maestro.xlsx');
}

function mostrarHistorial(container){
  const dlg = container.querySelector('#historialDlg');
  renderHistorial(dlg);
  dlg.showModal();
  dlg.querySelector('.close').addEventListener('click',()=>dlg.close());
  dlg.querySelectorAll('input').forEach(inp=>{
    inp.addEventListener('input',()=>renderHistorial(dlg));
  });
}

function renderHistorial(dlg){
  const tbody = dlg.querySelector('tbody');
  const fDesde = dlg.querySelector('#fDesde').value;
  const fHasta = dlg.querySelector('#fHasta').value;
  const usuario = dlg.querySelector('#fUsuario').value.toLowerCase();
  const prod = dlg.querySelector('#fProducto').value.toLowerCase();
  tbody.innerHTML='';
  historial.filter(h=>{
    if(fDesde && h.timestamp < fDesde) return false;
    if(fHasta && h.timestamp > fHasta+'T23:59:59') return false;
    if(usuario && !h.usuario.toLowerCase().includes(usuario)) return false;
    if(prod && !h.producto.toLowerCase().includes(prod)) return false;
    return true;
  }).forEach(h=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${new Date(h.timestamp).toLocaleString('es-ES')}</td><td>${h.usuario}</td><td>${h.producto}</td><td>${h.campo}</td><td>${h.antes}</td><td>${h.despues}</td>`;
    tbody.appendChild(tr);
  });
}

export async function render(container){
  container.innerHTML=`
    <h1>Listado Maestro</h1>
    <div class="maestro-header">
      <button id="btnNuevo">+ Nuevo</button>
      <button id="btnExcel">Exportar Excel</button>
      <button id="btnHistorial">Historial</button>
    </div>
    <div class="tabla-contenedor maestro-container">
      <table id="maestro-table">
        <thead>
          <tr>
            <th style="width:40px">semáforo</th>
            <th style="width:200px">Producto/Código<br><input data-key="producto" class="filtro"></th>
            ${DOC_KEYS.map(k=>`<th>${k.toUpperCase()}<br><input data-key="${k}" class="filtro"></th>`).join('')}
            <th></th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
    <dialog id="historialDlg" class="modal-historial">
      <div class="filtros">
        <input type="date" id="fDesde"> <input type="date" id="fHasta">
        <input placeholder="Usuario" id="fUsuario">
        <input placeholder="Producto" id="fProducto">
        <button class="close">Cerrar</button>
      </div>
      <table>
        <thead><tr><th>Fecha</th><th>Usuario</th><th>Producto</th><th>Campo</th><th>Antes</th><th>Después</th></tr></thead>
        <tbody></tbody>
      </table>
    </dialog>
  `;
  await ready;
  productos = await getAll('productos');
  historial = await getAll('productosHist');
  renderTabla(container);
  setupEventos(container);
}
