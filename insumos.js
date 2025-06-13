document.addEventListener('DOMContentLoaded', () => {
  const cont = document.getElementById('insumos');
  const STORAGE_KEY = 'insumosData';
  let fs = null;
  let path = null;
  let jsonPath = null;
  if (typeof window !== 'undefined' && typeof window.require === 'function') {
    try {
      fs = window.require('fs');
      path = window.require('path');
      jsonPath = path.join(__dirname, 'insumos.json');
    } catch (e) {
      fs = null;
    }
  }
  let data = [];
  if (fs && jsonPath && fs.existsSync(jsonPath)) {
    try {
      data = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) || [];
    } catch (e) {
      data = [];
    }
  } else {
    data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (fs && jsonPath) {
      try {
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      } catch (e) {
        console.error('Error writing insumos JSON', e);
      }
    }
  }

  function render() {
    cont.textContent = '';
    const table = document.createElement('table');
    table.className = 'insumos-table';
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    ['ID','Nombre','Descripción','Especificaciones'].forEach(t => {
      const th = document.createElement('th');
      th.textContent = t;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    data.forEach(item => {
      const tr = document.createElement('tr');
      [item.id, item.nombre, item.descripcion, item.especificaciones].forEach(v => {
        const td = document.createElement('td');
        td.textContent = v || '';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    cont.appendChild(table);
  }

  render();
});
