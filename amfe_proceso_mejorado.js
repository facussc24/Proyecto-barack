(function(){
const STORAGE_KEY = 'amfeProcesoMejorado';
let data = {
  header: {
    organizacion: '',
    planta: '',
    fecha: '',
    responsable: '',
    cliente: '',
    confidencialidad: '',
    modelo: '',
    equipo: []
  },
  processes: []
};

function load(){
  const saved = localStorage.getItem(STORAGE_KEY);
  if(saved){
    try{ data = JSON.parse(saved); }catch(e){}
  }
}
function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function logged(){
  return sessionStorage.getItem('currentUser');
}

function renderHeader(){
  ['organizacion','planta','fecha','responsable','cliente','confidencialidad','modelo'].forEach(k=>{
    const el = document.getElementById('hdr-'+k);
    if(el){ el.value = data.header[k] || ''; }
  });
  const list = document.getElementById('teamList');
  list.innerHTML='';
  data.header.equipo.forEach((n,i)=>{
    const span = document.createElement('span');
    span.textContent = n;
    if(logged()){
      const del=document.createElement('button');
      del.textContent='🗑';
      del.onclick=()=>{ data.header.equipo.splice(i,1); save(); renderHeader(); };
      span.appendChild(del);
    }
    list.appendChild(span);
  });
  const controls = document.getElementById('teamControls');
  if(logged()){
    controls.style.display='block';
    document.getElementById('teamAddBtn').onclick=()=>{
      const name = document.getElementById('teamAdd').value.trim();
      if(name){
        data.header.equipo.push(name);
        document.getElementById('teamAdd').value='';
        save();
        renderHeader();
      }
    };
  } else {
    controls.style.display='none';
  }
}

function editableCell(text,onSave){
  const td=document.createElement('td');
  td.contentEditable='true';
  td.textContent=text||'';
  td.onfocus=()=>{ td.dataset.orig=td.textContent; };
  td.onkeydown=e=>{
    if(e.key==='Enter'){ e.preventDefault(); td.blur(); }
    if(e.key==='Escape'){ td.textContent=td.dataset.orig||''; td.blur(); }
  };
  td.onblur=()=>{ onSave(td.textContent.trim()); };
  return td;
}

function numberCell(value,onSave){
  const td=document.createElement('td');
  const inp=document.createElement('input');
  inp.type='number';
  inp.min='1';
  inp.value=value||'';
  if(!inp.value) inp.classList.add('invalid');
  inp.onfocus=()=>{ inp.dataset.orig=inp.value; };
  inp.onkeydown=e=>{
    if(e.key==='Enter'){ e.preventDefault(); inp.blur(); }
    if(e.key==='Escape'){ inp.value=inp.dataset.orig||''; inp.dispatchEvent(new Event('input')); inp.blur(); }
  };
  inp.oninput=()=>{
    onSave(inp.value?inp.valueAsNumber:'');
    if(!inp.value) inp.classList.add('invalid');
    else inp.classList.remove('invalid');
  };
  td.appendChild(inp);
  return td;
}

function estadoCell(value,onSave){
  const td=document.createElement('td');
  if(logged()){
    const sel=document.createElement('select');
    ['Abierto','Cerrado'].forEach(v=>{
      const opt=document.createElement('option');
      opt.value=v; opt.textContent=v; sel.appendChild(opt);
    });
    sel.value=value||'Abierto';
    sel.onfocus=()=>{ sel.dataset.orig=sel.value; };
    sel.onkeydown=e=>{ if(e.key==='Escape'){ sel.value=sel.dataset.orig; sel.blur(); } };
    sel.onchange=()=>{ onSave(sel.value); };
    td.appendChild(sel);
  } else {
    td.textContent=value||'';
  }
  return td;
}

function render(){
  renderHeader();
  const cont=document.getElementById('processContainer');
  cont.innerHTML='';
  data.processes.forEach((proc,pIdx)=>{
    const details=document.createElement('details');
    details.className='process-section';
    details.open=true;
    const summary=document.createElement('summary');
    const title=document.createElement('span');
    title.textContent=proc.titulo||`Proceso ${pIdx+1}`;
    if(logged()){
      title.contentEditable='true';
      title.onfocus=()=>{ title.dataset.orig=title.textContent; };
      title.onkeydown=e=>{
        if(e.key==='Enter'){ e.preventDefault(); title.blur(); }
        if(e.key==='Escape'){ title.textContent=title.dataset.orig||''; title.blur(); }
      };
      title.onblur=()=>{ proc.titulo=title.textContent.trim(); save(); };
    }
    summary.appendChild(title);
    if(logged()){
      const btns=document.createElement('span');
      const dup=document.createElement('button');
      dup.textContent='Duplicar';
      dup.onclick=()=>{ const copy=JSON.parse(JSON.stringify(proc)); data.processes.splice(pIdx+1,0,copy); save(); render(); };
      const del=document.createElement('button');
      del.textContent='🗑';
      del.onclick=()=>{ if(confirm('¿Eliminar proceso?')){ data.processes.splice(pIdx,1); save(); render(); } };
      btns.appendChild(dup); btns.appendChild(del);
      summary.appendChild(btns);
    }
    details.appendChild(summary);
    const fields=document.createElement('div');
    fields.className='process-fields';
    ['estacion','descripcion','materiales','requerimientos'].forEach(f=>{
      const lab=document.createElement('label');
      lab.textContent=f.charAt(0).toUpperCase()+f.slice(1);
      if(logged()){
        const inp=document.createElement('input');
        inp.value=proc[f]||'';
        if(!inp.value) inp.classList.add('invalid');
        inp.onfocus=()=>{ inp.dataset.orig=inp.value; };
        inp.onkeydown=e=>{
          if(e.key==='Enter'){ e.preventDefault(); inp.blur(); }
          if(e.key==='Escape'){ inp.value=inp.dataset.orig||''; inp.dispatchEvent(new Event('input')); inp.blur(); }
        };
        inp.oninput=()=>{
          proc[f]=inp.value.trim();
          if(!proc[f]) inp.classList.add('invalid'); else inp.classList.remove('invalid');
          save();
        };
        lab.appendChild(inp);
      } else {
        const span=document.createElement('span'); span.textContent=proc[f]||''; lab.appendChild(span);
      }
      fields.appendChild(lab);
    });
    details.appendChild(fields);
    const wrap=document.createElement('div');
    wrap.className='table-wrapper';
    const table=document.createElement('table');
    table.id='tabla-'+pIdx;
    table.className='fmea-table display';
    table.innerHTML='<thead><tr><th>Efecto planta interna</th><th>Efecto planta cliente</th><th>Efecto usuario final</th><th>Causa</th><th>S</th><th>O</th><th>D</th><th>RPN</th><th>Acción preventiva</th><th>Acción detectiva</th><th>Responsable</th><th>Fecha objetivo</th><th>Estado</th><th>Observaciones</th><th></th></tr><tr class="filters"></tr></thead><tbody></tbody>';
    wrap.appendChild(table);
    details.appendChild(wrap);
    proc.modos.forEach((m,rIdx)=>{
      const tr=document.createElement('tr');
      ['efInt','efCli','efUsu','causa','s','o','d','rpn','prev','det','resp','fecha','estado','obs'].forEach((fld,idx)=>{
        let td;
        if(idx===7){
          td=document.createElement('td');
          td.textContent=m.rpn||'';
        } else if(!logged()){
          td=document.createElement('td');
          td.textContent=m[fld]||'';
        } else if(['s','o','d'].includes(fld)){
          td=numberCell(m[fld],val=>{
            m[fld]=val;
            const s=Number(m.s)||0,o=Number(m.o)||0,d=Number(m.d)||0;
            m.rpn=s*o*d;
            tr.children[7].textContent=m.rpn||'';
            save();
          });
        } else if(fld==='estado'){
          td=estadoCell(m[fld],val=>{ m[fld]=val; save(); });
        } else {
          td=editableCell(m[fld],val=>{ m[fld]=val; save(); });
        }
        tr.appendChild(td);
      });
      const tdDel=document.createElement('td');
      if(logged()){
        const del=document.createElement('button');
        del.textContent='🗑';
        del.onclick=()=>{ proc.modos.splice(rIdx,1); save(); render(); };
        tdDel.appendChild(del);
      }
      tr.appendChild(tdDel);
      table.querySelector('tbody').appendChild(tr);
    });
    if(logged()){
      const addBtn=document.createElement('button');
      addBtn.textContent='+ Modo de Falla';
      addBtn.className='add-mode-btn';
      addBtn.onclick=()=>{ proc.modos.push({}); save(); render(); };
      details.appendChild(addBtn);
    }
    cont.appendChild(details);

    const dt=$(table).DataTable({paging:false,ordering:true,info:false,searching:false,scrollX:true,dom:'t'});
    const filterRow=table.querySelector('tr.filters');
    dt.columns().every(function(){
      const th=document.createElement('th');
      if(this.index()<14){
        const input=document.createElement('input');
        input.placeholder='Filtrar';
        input.style.width='100%';
        input.oninput=()=>{ dt.column(this.index()).search(input.value).draw(); };
        th.appendChild(input);
      }
      filterRow.appendChild(th);
    });
  });
}

window.addEventListener('DOMContentLoaded',()=>{
  load();
  render();
  document.getElementById('addProcess').onclick=()=>{
    if(!logged()) return;
    data.processes.push({titulo:'',estacion:'',descripcion:'',materiales:'',requerimientos:'',modos:[]});
    save();
    render();
  };
});
})();
