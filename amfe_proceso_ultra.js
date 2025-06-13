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

  const PLACEHOLDERS = {
    operacion: 'Operación Nº',
    maquina: 'Máquina / Estación',
    funcion: 'Función de la máquina',
    materiales: 'Materiales indirectos',
    requerimientos: 'Requerimientos'
  };

  function calcRpn(s,o,d){
    if(!s||!o||!d) return '';
    return s*o*d;
  }

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && typeof stored === 'object') {
      if (stored.header) Object.assign(data.header, stored.header);
      if (Array.isArray(stored.processes)) data.processes = stored.processes;
    }
  } catch (e) {}

  data.processes.forEach((p, i) => {
    if (typeof p.operacion === 'undefined') p.operacion = i + 1;
    if (!Array.isArray(p.modos)) p.modos = [];
    p.modos.forEach(m=>{
      if(typeof m.rpn==='undefined'){
        const s=Number(m.s)||0,o=Number(m.o)||0,d=Number(m.d)||0;
        if(typeof m.nivel!=='undefined') delete m.nivel;
        m.rpn=calcRpn(s,o,d);
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

  function fieldSpan(text, placeholder){
    const span=document.createElement('span');
    span.textContent=text||'';
    span.contentEditable=isAdmin;
    if(placeholder) span.dataset.placeholder=placeholder;
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
      const summaryText=document.createElement('span');
      summaryText.textContent=`Operación Nº${proc.operacion}`;
      summary.appendChild(summaryText);
      if(isAdmin){
        const btnWrap=document.createElement('span');
        const edit=document.createElement('button'); edit.textContent='✎';
        edit.onclick=()=>{ const n=prompt('Título del proceso', proc.titulo||''); if(n!=null){ proc.titulo=n; save(); } };
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
      ['operacion','maquina','funcion','materiales','requerimientos'].forEach(f=>{
        if(f==='operacion'){
          if(isAdmin){
            const inp=document.createElement('input');
            inp.type='number';
            inp.value=proc.operacion||'';
            inp.oninput=()=>{ proc.operacion=parseInt(inp.value,10)||0; summaryText.textContent=`Operación Nº${proc.operacion}`; save(); };
            fields.appendChild(inp);
          } else {
            const span=document.createElement('span');
            span.textContent=proc.operacion||'';
            span.dataset.placeholder=PLACEHOLDERS[f];
            fields.appendChild(span);
          }
        } else {
          const span=fieldSpan(proc[f], PLACEHOLDERS[f]);
          span.onblur=()=>{ proc[f]=span.textContent.trim(); validateFields(details); save(); };
          fields.appendChild(span);
        }
      });
      details.appendChild(fields);
      const wrap=document.createElement('div');
      wrap.className='table-wrapper';
      const table=document.createElement('table');
      table.className='fmea-table';
      table.innerHTML='<thead><tr><th>Efecto planta interna</th><th>Efecto planta cliente</th><th>Efecto usuario final</th><th>Causa</th><th>S</th><th>O</th><th>D</th><th>RPN</th><th>Acción preventiva</th><th>Acción detectiva</th><th>Responsable</th><th>Fecha objetivo</th><th>Estado</th><th>Observaciones</th><th></th></tr></thead><tbody></tbody>';
      wrap.appendChild(table);
      details.appendChild(wrap);
      proc.modos.forEach((m,rIdx)=>{
        const tr=document.createElement('tr');
        const fields=['efInt','efCli','efUsu','causa','s','o','d','rpn','prev','det','resp','fecha','estado','obs'];
        fields.forEach((fld,idx)=>{
          const td=document.createElement('td');
          if(fld==='rpn'){ td.textContent=m.rpn||''; }
          else {
            td.contentEditable=isAdmin;
            td.textContent=m[fld]||'';
            td.onblur=()=>{
              m[fld]=td.textContent.trim();
              if(['s','o','d'].includes(fld)){
                m[fld]=Number(m[fld])||0;
                const s=Number(m.s)||0,o=Number(m.o)||0,d=Number(m.d)||0;
                m.rpn=calcRpn(s,o,d);
                tr.children[7].textContent=m.rpn||'';
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
            rpn:'',prev:'',det:'',resp:'',fecha:'',estado:'',obs:''
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

  const addProcessBtn = document.getElementById('addProcess');
  if (addProcessBtn) addProcessBtn.addEventListener('click',()=>{
    data.processes.push({operacion:data.processes.length+1,titulo:'',maquina:'',funcion:'',materiales:'',requerimientos:'',modos:[{efInt:'',efCli:'',efUsu:'',causa:'',s:'',o:'',d:'',rpn:'',prev:'',det:'',resp:'',fecha:'',estado:'',obs:''}]});
    save();
    renderProcesses();
  });


  function showToast(msg){
    const t=document.getElementById('toast');
    t.textContent=msg;
    t.style.display='block';
    setTimeout(()=>{t.style.display='none';},2500);
  }

  const saveAmfeBtn = document.getElementById('saveAmfe');
  if (saveAmfeBtn) saveAmfeBtn.addEventListener('click',()=>{
    if(!isAdmin) return;
    let valid=true;
    document.querySelectorAll('.process-section').forEach(sec=>{ if(!validateFields(sec)) valid=false; });
    if(!valid) return alert('Complete los campos marcados');
    const payload=JSON.parse(JSON.stringify(data));
    save();
    fetch('/api/amfe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(r=>{ if(!r.ok) throw new Error(); })
      .then(()=>{
        showToast('AMFE guardado correctamente');
        const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a');
        a.href=url;
        a.download='amfe.json';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(()=>showToast('Sin conexión con el servidor; AMFE guardado localmente'));
  });

  document.addEventListener('DOMContentLoaded',()=>{
    initHeader();
    renderProcesses();
    if(!isAdmin){
      document.getElementById('saveAmfe').style.display='none';
    }
  });
})();
