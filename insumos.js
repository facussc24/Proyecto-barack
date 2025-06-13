document.addEventListener('DOMContentLoaded', () => {
  const cont = document.getElementById('insumos');
  const searchInput = document.getElementById('insumoSearch');
  const clearBtn = document.getElementById('clearInsumoSearch');
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

  let fuse = null;

  function buildFuse() {
    if (typeof Fuse === 'undefined') {
      fuse = null;
      return;
    }
    fuse = new Fuse(data, {
      keys: ['nombre', 'descripcion', 'especificaciones', 'id'],
      threshold: 0.4
    });
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

  function applyFilter() {
    if (!searchInput) return;
    const text = searchInput.value.trim();
    const rows = cont.querySelectorAll('tbody tr');
    if (!text) {
      rows.forEach(r => (r.style.display = ''));
      return;
    }
    if (fuse) {
      const results = fuse.search(text);
      const ids = new Set(results.map(r => r.item.id));
      rows.forEach(r => {
        const id = parseInt(r.getAttribute('data-id'));
        r.style.display = ids.has(id) ? '' : 'none';
      });
    } else {
      const lower = text.toLowerCase();
      rows.forEach(r => {
        r.style.display = r.textContent.toLowerCase().includes(lower)
          ? ''
          : 'none';
      });
    }
  }

  function highlightInsumo(name) {
    const sel = (name || '').toString().trim().toLowerCase();
    const rows = Array.from(cont.querySelectorAll('tbody tr'));
    const row = rows.find(tr =>
      Array.from(tr.children).some(td => td.textContent.trim().toLowerCase() === sel)
    );
    if (row) {
      row.classList.add('highlight');
      row.scrollIntoView({ block: 'center' });
      setTimeout(() => row.classList.remove('highlight'), 2000);
    }
  }
  window.highlightInsumo = highlightInsumo;

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
      tr.setAttribute('data-id', item.id);
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
  buildFuse();

  if (searchInput) {
    searchInput.addEventListener('input', applyFilter);
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      applyFilter();
    });
  }

  const stored = sessionStorage.getItem('insumoQuery');
  if (stored) {
    if (searchInput) searchInput.value = stored;
    applyFilter();
    highlightInsumo(stored);
  }
});
