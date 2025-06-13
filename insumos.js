document.addEventListener('DOMContentLoaded', () => {
  const cont = document.getElementById('insumos');
  const searchInput = document.getElementById('insumoSearch');
  const clearBtn = document.getElementById('clearInsumoSearch');
  const form = document.getElementById('insForm');
  const inNombre = document.getElementById('inNombre');
  const inDesc = document.getElementById('inDescripcion');
  const inEsp = document.getElementById('inEspecificaciones');
  let editId = null;
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
  let isEditMode = sessionStorage.getItem('insumosAdmin') === 'true';

  function buildFuse() {
    if (typeof Fuse === 'undefined') {
      fuse = null;
      if (typeof mostrarMensaje === 'function') {
        mostrarMensaje('Fuse.js no cargó – búsqueda deshabilitada', 'warning');
      }
      return;
    }
    fuse = new Fuse(data, {
      keys: ['nombre', 'descripcion', 'especificaciones', 'id'],
      threshold: 0.4
    });
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (typeof addHistoryEntry === 'function') {
      try { addHistoryEntry('insumosHistory', data); } catch(e){}
    }
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

  function createItem(obj) {
    const maxId = data.reduce((m, i) => Math.max(m, i.id || 0), 0);
    const item = { id: maxId + 1, nombre: '', descripcion: '', especificaciones: '', ...obj };
    data.push(item);
    save();
    buildFuse();
    render();
    applyFilter();
    return item.id;
  }

  function updateItem(id, obj) {
    const idx = data.findIndex(i => i.id === id);
    if (idx === -1) return false;
    data[idx] = { ...data[idx], ...obj, id };
    save();
    buildFuse();
    render();
    applyFilter();
    return true;
  }

  function deleteItem(id) {
    const idx = data.findIndex(i => i.id === id);
    if (idx === -1) return false;
    data.splice(idx, 1);
    save();
    buildFuse();
    render();
    applyFilter();
    return true;
  }

  window.InsumosEditor = { createItem, updateItem, deleteItem, getData: () => data.slice() };

  function render() {
    isEditMode = sessionStorage.getItem('insumosAdmin') === 'true';
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
    if (isEditMode) {
      const th = document.createElement('th');
      th.textContent = 'Acciones';
      hr.appendChild(th);
    }
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
      if (isEditMode) {
        const td = document.createElement('td');
        const eBtn = document.createElement('button');
        eBtn.textContent = 'Editar';
        eBtn.addEventListener('click', () => {
          editId = item.id;
          if (form) {
            inNombre.value = item.nombre || '';
            inDesc.value = item.descripcion || '';
            inEsp.value = item.especificaciones || '';
          }
        });
        const dBtn = document.createElement('button');
        dBtn.textContent = 'Eliminar';
        dBtn.addEventListener('click', () => {
          if (confirm('¿Eliminar insumo?')) deleteItem(item.id);
        });
        td.appendChild(eBtn);
        td.appendChild(dBtn);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    cont.appendChild(table);
    if (form) form.style.display = isEditMode ? 'flex' : 'none';
  }

  render();
  buildFuse();

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const nombre = inNombre.value.trim();
      const descripcion = inDesc.value.trim();
      const especificaciones = inEsp.value.trim();
      if (!nombre) return;
      if (editId !== null) {
        updateItem(editId, { nombre, descripcion, especificaciones });
      } else {
        createItem({ nombre, descripcion, especificaciones });
      }
      editId = null;
      form.reset();
    });
  }

  document.addEventListener('insumos-mode', render);

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
