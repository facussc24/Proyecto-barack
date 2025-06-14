'use strict';
const root = typeof global !== 'undefined' ? global : globalThis;

document.addEventListener('DOMContentLoaded', () => {
  const dataService =
    root.dataService ||
    (typeof require === 'function' ? require('../dataService.js') : null);
  if (typeof root.requestAnimationFrame === 'undefined') {
    root.requestAnimationFrame = cb => setTimeout(cb, 0);
  }
  let fuseSinoptico = null;
  let sinopticoData = [];
  const sinopticoElem = document.getElementById('sinoptico');
  const loader = document.getElementById('loading');

  function showLoader() {
    if (loader) loader.style.display = 'flex';
  }

  function hideLoader() {
    if (loader) loader.style.display = 'none';
  }

  function generarDatosIniciales() {
    return [
      {
        ID: '1', ParentID: '', Tipo: 'Cliente', Secuencia: '', Descripción: 'Cliente demo',
        Cliente: 'Cliente demo', Vehículo: '', RefInterno: '', versión: '', Imagen: '',
        Consumo: '', Unidad: '', Sourcing: '', Código: ''
      },
      {
        ID: '2', ParentID: '1', Tipo: 'Pieza final', Secuencia: '', Descripción: 'Producto demo',
        Cliente: 'Cliente demo', Vehículo: 'Modelo X', RefInterno: 'REF1', versión: 'v1',
        Imagen: '', Consumo: '1', Unidad: 'pz', Sourcing: '', Código: 'P-1'
      }
    ];
  }
  const selectedItemsContainer = document.getElementById('selectedItems');
  const selectedItems = [];

  /* ==================================================
     1) Mostrar/Ocultar Columnas
  ==================================================*/
  const toggles = document.querySelectorAll('.toggle-col');

  function applyColumnVisibility() {
    toggles.forEach(chk => {
      const colIndex = parseInt(chk.getAttribute('data-colindex'));
      const checked = chk.checked;
      const th = document.querySelector(`#sinoptico thead th:nth-child(${colIndex + 1})`);
      if (th) th.style.display = checked ? '' : 'none';
      document.querySelectorAll('#sinoptico tbody tr').forEach(tr => {
        const td = tr.querySelector(`td:nth-child(${colIndex + 1})`);
        if (td) td.style.display = checked ? '' : 'none';
      });
    });
  }

  toggles.forEach(chk => chk.addEventListener('change', applyColumnVisibility));

  /* ==================================================
     2) Funciones de alerta y filtrado
  ==================================================*/
  function mostrarMensaje(texto, tipo = 'error') {
    const div = document.getElementById('appMessage');
    if (!div) return;
    const colores = { error: '#e74c3c', warning: '#f39c12', success: '#2ecc71' };
    div.textContent = texto;
    div.style.backgroundColor = colores[tipo] || colores.error;
    div.style.color = '#ffffff';
    div.style.display = 'block';
    requestAnimationFrame(() => div.style.opacity = '1');
    setTimeout(() => {
      div.style.opacity = '0';
      div.addEventListener('transitionend', () => div.style.display = 'none', { once: true });
    }, 2000);
  }
  window.mostrarMensaje = mostrarMensaje;

  if (typeof Fuse === 'undefined') {
    mostrarMensaje('Fuse.js no cargó – búsqueda deshabilitada', 'warning');
  }

  function aplicarFiltro() {
    showLoader();
    const criterio = document.getElementById('filtroInsumo')?.value.trim().toLowerCase() || '';
    const mostrarFlags = [
      'chkMostrarNivel0','chkMostrarNivel1','chkMostrarNivel2','chkMostrarNivel3'
    ].map(id => document.getElementById(id)?.checked ?? true);

    const todasFilas = Array.from(document.querySelectorAll('#sinoptico tbody tr'));
    const mapIdToRow = {};
    todasFilas.forEach(tr => mapIdToRow[tr.dataset.id] = tr);

    function mostrarAncestros(id) {
      const fila = mapIdToRow[id];
      if (!fila) return;
      fila.style.display = '';
      mostrarAncestros(fila.dataset.parent);
    }

    if (!criterio) {
      todasFilas.forEach(tr => {
        const lvl = parseInt(tr.dataset.level || '0', 10);
        tr.style.display = mostrarFlags[lvl] ? '' : 'none';
      });
      hideLoader();
      return;
    }

    todasFilas.forEach(tr => tr.style.display = 'none');
    if (fuseSinoptico) {
      const idSet = new Set();
      criterio.split(/[\,\s]+/).forEach(k =>
        fuseSinoptico.search(k).forEach(res => idSet.add(res.item.ID.toString()))
      );
      todasFilas.forEach(tr => {
        if (!idSet.has(tr.dataset.id)) return;
        const lvl = parseInt(tr.dataset.level || '0', 10);
        if (mostrarFlags[lvl]) tr.style.display = '';
        mostrarAncestros(tr.dataset.parent);
      });
    } else {
      todasFilas.forEach(tr => {
        if (tr.textContent.toLowerCase().includes(criterio)) {
          const lvl = parseInt(tr.dataset.level || '0', 10);
          if (mostrarFlags[lvl]) tr.style.display = '';
          mostrarAncestros(tr.dataset.parent);
        }
      });
    }
    hideLoader();
  }

  document.getElementById('filtroInsumo')?.addEventListener('input', aplicarFiltro);
  document.getElementById('clearSearch')?.addEventListener('click', () => {
    document.getElementById('sinopticoSuggestions').innerHTML = '';
    document.getElementById('filtroInsumo').value = '';
    selectedItems.length = 0;
    aplicarFiltro();
  });
  ['chkIncluirAncestros','chkMostrarNivel0','chkMostrarNivel1','chkMostrarNivel2','chkMostrarNivel3']
    .forEach(id => document.getElementById(id)?.addEventListener('change', aplicarFiltro));

  /* ==================================================
     3) Expand/Collapse / Refresh
  ==================================================*/
  function showChildren(parentId) {
    const parentRow = document.querySelector(`#sinoptico tbody tr[data-id="${parentId}"]`);
    const baseLevel = parseInt(parentRow.dataset.level || '0', 10);
    let next = parentRow.nextElementSibling;
    while (next && parseInt(next.dataset.level || '0', 10) > baseLevel) {
      if (parseInt(next.dataset.level) === baseLevel + 1) next.style.display = '';
      next = next.nextElementSibling;
    }
  }
  function hideSubtree(parentId) {
    const parentRow = document.querySelector(`#sinoptico tbody tr[data-id="${parentId}"]`);
    const base = parseInt(parentRow.dataset.level || '0', 10);
    let nxt = parentRow.nextElementSibling;
    while (nxt && parseInt(nxt.dataset.level || '0', 10) > base) {
      nxt.style.display = 'none'; nxt = nxt.nextElementSibling;
    }
  }
  function toggleNodo(btn, parentId) {
    const exp = btn.getAttribute('data-expanded') === 'true';
    if (exp) { btn.textContent='+'; btn.setAttribute('data-expanded','false'); hideSubtree(parentId); }
    else { btn.textContent='–'; btn.setAttribute('data-expanded','true'); showChildren(parentId); }
  }
  document.getElementById('expandirTodo')?.addEventListener('click', () => {
    document.querySelectorAll('#sinoptico tbody tr').forEach(tr => tr.style.display = '');
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.textContent='–');
  });
  document.getElementById('colapsarTodo')?.addEventListener('click', () => {
    document.querySelectorAll('#sinoptico tbody tr').forEach(tr => tr.dataset.level>0 && (tr.style.display='none'));
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.textContent='+');
  });
  document.getElementById('btnRefrescar')?.addEventListener('click', loadData);

  /* ==================================================
     4) Exportar a Excel
  ==================================================*/
  document.getElementById('btnExcel')?.addEventListener('click', () => {
    if (typeof XLSX==='undefined') return mostrarMensaje('Excel deshabilitado','warning');
    const datos=[...document.querySelectorAll('#sinoptico thead th')].filter(th=>th.style.display!=='none').map(th=>th.textContent);
    const filas=[];
    document.querySelectorAll('#sinoptico tbody tr').forEach(tr=>{
      if (tr.style.display==='') filas.push(
        [...tr.querySelectorAll('td')].filter((td,i)=>document.querySelectorAll('#sinoptico thead th')[i].style.display!=='none').map(td=>td.textContent)
      );
    });
    const wb=XLSX.utils.book_new(); const ws=XLSX.utils.aoa_to_sheet([datos,...filas]);
    XLSX.utils.book_append_sheet(wb,ws,'Sinoptico'); XLSX.writeFile(wb,'sinoptico.xlsx');
  });

  /* ==================================================
     5) Construir tabla jerárquica y editar inline
  ==================================================*/
  function construirSinoptico(datos) {
    const agrupado={}; datos.forEach(r=>{ const p=r.ParentID||''; (agrupado[p]||(agrupado[p]=[])).push(r); });
    Object.keys(agrupado).forEach(k=> agrupado[k].sort((a,b)=>a.Descripción.toLowerCase().localeCompare(b.Descripción.toLowerCase(),undefined,{numeric:true})) );
    // Inline edit helper
    const fieldOrder=['Descripción','Cliente','Vehículo','RefInterno','versión','Imagen','Consumo','Unidad','Sourcing','Código'];
    function startEditRow(tr,fila) {
      if(tr.classList.contains('editing'))return; tr.classList.add('editing');
      const cells=tr.querySelectorAll('td'); tr._orig=[...cells].map(td=>td.innerHTML);
      const it=cells[0].querySelector('.item-text'); if(it) it.innerHTML=`<input value="${fila.Descripción||''}">`;
      fieldOrder.slice(1).forEach((f,i)=>{ const td=cells[i+1]; const val=fila[f]||''; td.innerHTML=''; if(f==='Unidad'){ let opts=['pz','kg','g','m','cm']; if(!opts.includes(val))opts.unshift(val); const sel=document.createElement('select'); sel.innerHTML=opts.map(o=>`<option${o===val?' selected':''}>${o}</option>`).join(''); td.appendChild(sel);} else{const inp=document.createElement('input'); inp.value=val; td.appendChild(inp);} });
      const act=cells[cells.length-1]; act.innerHTML=''; const save=document.createElement('button');save.textContent='Guardar'; act.appendChild(save); const cancel=document.createElement('button');cancel.textContent='Cancelar';act.appendChild(cancel);
      save.onclick=async()=>{ const changes={}; changes.Descripción=cells[0].querySelector('input').value; fieldOrder.slice(1).forEach((f,i)=>{ const e=cells[i+1].querySelector('input,select'); changes[f]=e.value; }); await dataService.updateNode(fila.ID,changes); loadData(); };
      cancel.onclick=()=> loadData();
    }
    function dibujar(parent='',nivel=0){ (agrupado[parent]||[]).forEach(fila=>{
      const tr=document.createElement('tr'); tr.dataset.id=fila.ID; tr.dataset.parent=fila.ParentID||''; tr.dataset.level=nivel;
      const tipo=fila.Tipo.toLowerCase(); tr.classList.add(`nivel-${nivel}`);
      const td0=document.createElement('td'); const btn=document.createElement('button'); btn.classList.add('toggle-btn'); btn.textContent='+'; btn.onclick=()=>toggleNodo(btn,fila.ID); td0.appendChild(btn); const span=document.createElement('span'); span.classList.add('item-text'); span.textContent=fila['Descripción']||''; td0.appendChild(span); tr.appendChild(td0);
      ['Cliente','Vehículo','RefInterno','versión'].forEach(f=>{ const td=document.createElement('td'); td.textContent=fila[f]||''; tr.appendChild(td); });
      const tdImg=document.createElement('td'); if(fila.Imagen){ const img=document.createElement('img'); img.src=`images/${fila.Imagen}`;tdImg.appendChild(img);} tr.appendChild(tdImg);
      ['Consumo','Unidad','Sourcing','Código'].forEach(f=>{ const td=document.createElement('td'); td.textContent=fila[f]||''; tr.appendChild(td); });
      const editing=sessionStorage.getItem('sinopticoEdit')==='true';
      if(editing){ const tdA=document.createElement('td'); const eBtn=document.createElement('button'); eBtn.textContent='Editar'; eBtn.onclick=()=>startEditRow(tr,fila); tdA.appendChild(eBtn); const dBtn=document.createElement('button'); dBtn.textContent='Eliminar'; dBtn.onclick=()=>window.SinopticoEditor.deleteSubtree(fila.ID); tdA.appendChild(dBtn); tr.appendChild(tdA);}    
      document.querySelector('#sinoptico tbody').appendChild(tr);
      dibujar(fila.ID,nivel+1);
    }); }
    dibujar();
  }

  async function loadData() {
    showLoader();
    try { sinopticoData = await dataService.getAll(); } catch { sinopticoData = []; }
    if(!sinopticoData.length) sinopticoData = generarDatosIniciales();
    construirSinoptico(sinopticoData);
    hideLoader();
  }

  loadData();

  if(dataService.subscribeToChanges) dataService.subscribeToChanges(loadData);
});
