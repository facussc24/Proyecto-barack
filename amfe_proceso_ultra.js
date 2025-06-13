(function(){
  const STORAGE_KEY = 'amfeUltraData';
  const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
  const data = {
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

  function calcNivel(s,o,d){
    const r=s*o*d;
    if(!s||!o||!d) return '';
    if(r>=150) return 'Alto';
    if(r>=75) return 'Medio';
    return 'Bajo';
  }

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && typeof stored === 'object') {
      if (stored.header) Object.assign(data.header, stored.header);
      if (Array.isArray(stored.processes)) data.processes = stored.processes;
    }
  } catch (e) {}

  data.processes.forEach((p, i) => {
    if (typeof p.secuencia === 'undefined') p.secuencia = i + 1;
    if (!Array.isArray(p.modos)) p.modos = [];
    p.modos.forEach(m=>{
      if(typeof m.nivel==='undefined'){
        const s=Number(m.s)||0,o=Number(m.o)||0,d=Number(m.d)||0;
        if(typeof m.rpn!=='undefined') delete m.rpn;
        m.nivel=calcNivel(s,o,d);
      }
    });
  });

  function save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (typeof addHistoryEntry === 'function') {
      try { addHistoryEntry('amfeUltraHistory', data); } catch(e){}
    }
  }

  function initHeader(){
    ['organizacion','planta','fecha','responsable','cliente','conf','modelo'].forEach(key=>{
      const el=document.getElementById('hdr-'+key);
      if(!el) return;
      el.value=data.header[key]||'';
      el.readOnly=!isAdmin;
      el.addEventListener('input',()=>{ data.header[key]=el.value; save(); });
    });
    renderTeam();
  }

  function renderTeam(){
    const list=document.getElementById('teamList');
    list.innerHTML='';
    data.header.equipo.forEach((name,idx)=>{
      const span=document.createElement('span');
      span.textContent=name;
      if(isAdmin){
        const del=document.createElement('button');
        del.textContent='×';
        del.onclick=()=>{ data.header.equipo.splice(idx,1); save(); renderTeam(); };
        span.appendChild(del);
      }
      list.appendChild(span);
    });
    const controls=document.getElementById('teamControls');
    if(isAdmin){
      controls.style.display='block';
      document.getElementById('teamAdd').onclick=()=>{
        const inp=document.getElementById('teamInput');
        const name=inp.value.trim();
        if(name){ data.header.equipo.push(name); inp.value=''; save(); renderTeam(); }
      };
    } else {
      controls.style.display='none';
    }
  }

  function fieldSpan(text){
    const span=document.createElement('span');
    span.textContent=text||'';
    span.contentEditable=isAdmin;
    return span;
  }

  function validateFields(container){
    let valid=true;
    container.querySelectorAll('.process-fields span, .process-fields input').forEach(el=>{
      const val = el.tagName==='INPUT' ? el.value : el.textContent;
      if(!val.toString().trim()){ el.classList.add('invalid'); valid=false; }
      else el.classList.remove('invalid');
    });
    return valid;
  }


  function renderProcesses(){
    const cont=document.getElementById('processContainer');
    cont.innerHTML='';
    data.processes.forEach((proc,pIdx)=>{
      const details=document.createElement('details');
      details.className='process-section';
      details.open=true;
      const summary=document.createElement('summary');
      const title=document.createElement('span');
      title.textContent=proc.titulo||`Proceso ${pIdx+1}`;
      summary.appendChild(title);
      if(isAdmin){
        const btnWrap=document.createElement('span');
        const edit=document.createElement('button'); edit.textContent='✎';
        edit.onclick=()=>{ const n=prompt('Nombre del proceso', title.textContent); if(n){ proc.titulo=n; title.textContent=n; save(); } };
        const dup=document.createElement('button'); dup.textContent='📄';
        dup.onclick=()=>{ const copy=JSON.parse(JSON.stringify(proc)); data.processes.splice(pIdx+1,0,copy); save(); renderProcesses(); };
        const del=document.createElement('button'); del.textContent='🗑️';
        del.onclick=()=>{ if(confirm('¿Eliminar proceso?')){ data.processes.splice(pIdx,1); save(); renderProcesses(); } };
        btnWrap.append(edit,dup,del);
        summary.appendChild(btnWrap);
      }
      details.appendChild(summary);
      const fields=document.createElement('div');
      fields.className='process-fields';
      ['secuencia','estacion','descripcion','materiales','requerimientos'].forEach(f=>{
        if(f==='secuencia'){
          if(isAdmin){
            const inp=document.createElement('input');
            inp.type='number';
            inp.value=proc.secuencia||'';
            inp.oninput=()=>{ proc.secuencia=parseInt(inp.value,10)||0; save(); };
            fields.appendChild(inp);
          } else {
            const span=document.createElement('span');
            span.textContent=proc.secuencia||'';
            fields.appendChild(span);
          }
        } else {
          const span=fieldSpan(proc[f]);
          span.onblur=()=>{ proc[f]=span.textContent.trim(); validateFields(details); save(); };
          fields.appendChild(span);
        }
      });
      details.appendChild(fields);
      const wrap=document.createElement('div');
      wrap.className='table-wrapper';
      const table=document.createElement('table');
      table.className='fmea-table';
      table.innerHTML='<thead><tr><th>Efecto planta interna</th><th>Efecto planta cliente</th><th>Efecto usuario final</th><th>Causa</th><th>S</th><th>O</th><th>D</th><th>Nivel</th><th>Acción preventiva</th><th>Acción detectiva</th><th>Responsable</th><th>Fecha objetivo</th><th>Estado</th><th>Observaciones</th><th></th></tr></thead><tbody></tbody>';
      wrap.appendChild(table);
      details.appendChild(wrap);
      proc.modos.forEach((m,rIdx)=>{
        const tr=document.createElement('tr');
        const fields=['efInt','efCli','efUsu','causa','s','o','d','nivel','prev','det','resp','fecha','estado','obs'];
        fields.forEach((fld,idx)=>{
          const td=document.createElement('td');
          if(fld==='nivel'){ td.textContent=m.nivel||''; }
          else {
            td.contentEditable=isAdmin;
            td.textContent=m[fld]||'';
            td.onblur=()=>{
              m[fld]=td.textContent.trim();
              if(['s','o','d'].includes(fld)){
                m[fld]=Number(m[fld])||0;
                const s=Number(m.s)||0,o=Number(m.o)||0,d=Number(m.d)||0;
                m.nivel=calcNivel(s,o,d);
                tr.children[7].textContent=m.nivel||'';
              }
              save();
            };
          }
          tr.appendChild(td);
        });
        const tdDel=document.createElement('td');
        if(isAdmin){
          const del=document.createElement('button'); del.textContent='🗑️';
          del.onclick=()=>{ proc.modos.splice(rIdx,1); save(); renderProcesses(); };
          tdDel.appendChild(del);
        }
        tr.appendChild(tdDel);
        table.querySelector('tbody').appendChild(tr);
      });
      if(isAdmin){
        const addBtn=document.createElement('button'); addBtn.textContent='+ Modo de Falla'; addBtn.className='add-mode-btn';
        addBtn.onclick=()=>{
          proc.modos.push({
            efInt:'',efCli:'',efUsu:'',causa:'',s:'',o:'',d:'',
            nivel:'',prev:'',det:'',resp:'',fecha:'',estado:'',obs:''
          });
          save();
          renderProcesses();
        };
        details.appendChild(addBtn);
      }
      cont.appendChild(details);
    });
    if(isAdmin){
      document.getElementById('addProcess').style.display='block';
    } else {
      document.getElementById('addProcess').style.display='none';
    }
  }

  document.getElementById('addProcess').addEventListener('click',()=>{
    data.processes.push({secuencia:data.processes.length+1,titulo:'',estacion:'',descripcion:'',materiales:'',requerimientos:'',modos:[{efInt:'',efCli:'',efUsu:'',causa:'',s:'',o:'',d:'',nivel:'',prev:'',det:'',resp:'',fecha:'',estado:'',obs:''}]});
    save();
    renderProcesses();
  });


  function showToast(msg){
    const t=document.getElementById('toast');
    t.textContent=msg;
    t.style.display='block';
    setTimeout(()=>{t.style.display='none';},2500);
  }

  document.getElementById('saveAmfe').addEventListener('click',()=>{
    if(!isAdmin) return;
    let valid=true;
    document.querySelectorAll('.process-section').forEach(sec=>{ if(!validateFields(sec)) valid=false; });
    if(!valid) return alert('Complete los campos marcados');
    const payload=JSON.parse(JSON.stringify(data));
    save();
    fetch('/api/amfe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(r=>{ if(!r.ok) throw new Error(); })
      .then(()=>showToast('AMFE guardado correctamente'))
      .catch(()=>alert('Error al guardar AMFE'));
  });

  document.addEventListener('DOMContentLoaded',()=>{
    initHeader();
    renderProcesses();
    if(!isAdmin){
      document.getElementById('saveAmfe').style.display='none';
    }
  });
})();
