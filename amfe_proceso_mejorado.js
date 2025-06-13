(function(){
  const data = {
    header: {
      organizacion: '',
      planta: '',
      fecha: '',
      responsable: '',
      cliente: '',
      conf: '',
      modelo: '',
      equipo: []
    }
  };

  function logged(){
    return sessionStorage.getItem('isAdmin') === 'true';
  }

  function renderTeam(){
    const list = document.getElementById('teamList');
    if (!list) return;
    list.innerHTML = '';
    data.header.equipo.forEach((name, idx) => {
      const span = document.createElement('span');
      span.textContent = name;
      if (logged()) {
        const del = document.createElement('button');
        del.textContent = '×';
        del.onclick = () => {
          data.header.equipo.splice(idx, 1);
          renderTeam();
        };
        span.appendChild(del);
      }
      list.appendChild(span);
    });
    const controls = document.getElementById('teamControls');
    if (!controls) return;
    if (logged()) {
      controls.style.display = 'block';
      const add = document.getElementById('teamAdd');
      if (add) {
        add.onclick = () => {
          const inp = document.getElementById('teamInput');
          const name = inp.value.trim();
          if (name) {
            data.header.equipo.push(name);
            inp.value = '';
            renderTeam();
          }
        };
      }
    } else {
      controls.style.display = 'none';
    }
  }

  function renderHeader(){
    ['organizacion','planta','fecha','responsable','cliente','conf','modelo'].forEach(key => {
      const el = document.getElementById('hdr-' + key);
      if (!el) return;
      el.value = data.header[key] || '';
      el.readOnly = !logged();
      if (el.type === 'date') {
        el.disabled = !logged();
      }
      el.addEventListener('input', () => {
        data.header[key] = el.value;
      });
    });
    renderTeam();
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
  });
})();
