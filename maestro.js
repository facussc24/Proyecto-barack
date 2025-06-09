document.addEventListener('DOMContentLoaded', () => {
  const maestroContainer = document.getElementById('maestro');
  const nameInput = document.getElementById('docName');
  const numberInput = document.getElementById('docNumber');
  const detailInput = document.getElementById('docDetail');
  const DOC_TYPES = [
    { name: 'Amfe', category: 'Amfe' },
    { name: 'Hojas de operaciones', category: 'Hojas de operaciones' },
    { name: 'Mylar', category: 'Mylar' },
    { name: 'Ulm', category: 'Ulm' },
    { name: 'Flujograma', category: 'Flujograma' }
  ];
  const filterInput = document.getElementById('maestroFilter');
  const addBtn = document.getElementById('addDoc');
  const STORAGE_KEY = 'maestroDocs';
  let isAdmin = sessionStorage.getItem('maestroAdmin') === 'true';

  // Support persistence using a JSON file when running in Electron/Node
  let fs = null;
  let path = null;
  let jsonPath = null;
  if (typeof window !== 'undefined' && typeof window.require === 'function') {
    try {
      fs = window.require('fs');
      path = window.require('path');
      jsonPath = path.join(__dirname, 'no-borrar', 'no borrar - listado maestro.json');
    } catch (e) {
      fs = null;
    }
  }

  let docs = [];
  if (fs && jsonPath && fs.existsSync(jsonPath)) {
    try {
      docs = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) || [];
    } catch (e) {
      docs = [];
    }
  } else {
    docs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }
  if (Array.isArray(docs)) {
    // Remove empty placeholder entries from older versions
    docs = docs.filter(d => !(DOC_TYPES.some(t => t.name === d.name) && !d.number && !d.detail));
    // Update old "Operaciones" categories to specific names
    docs.forEach(d => {
      if (d.category === 'Operaciones') {
        const match = DOC_TYPES.find(t => t.name === d.name);
        if (match) {
          d.category = match.category;
        }
      }
    });
  } else {
    docs = [];
  }

  function updateDocOptions() {
    if (!nameInput) return;
    nameInput.innerHTML = '';
    const def = document.createElement('option');
    def.value = '';
    def.textContent = 'Seleccione...';
    def.disabled = true;
    def.selected = true;
    nameInput.appendChild(def);

    const groups = {};
    DOC_TYPES.forEach(t => {
      if (!groups[t.category]) {
        const g = document.createElement('optgroup');
        g.label = t.category;
        groups[t.category] = g;
        nameInput.appendChild(g);
      }
      const opt = document.createElement('option');
      opt.value = t.name;
      opt.textContent = t.name;
      groups[t.category].appendChild(opt);
    });
  }

  function applyFilter() {
    if (!filterInput) return;
    const text = filterInput.value.toLowerCase();
    document.querySelectorAll('#maestro tbody tr').forEach(tr => {
      const tds = tr.querySelectorAll('td');
      const name = tds[0].textContent.toLowerCase();
      const num = tds[1].textContent.toLowerCase();
      const det = tds[2].textContent.toLowerCase();
      const match = name.includes(text) || num.includes(text) || det.includes(text);
      tr.style.display = match ? '' : 'none';
    });
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    if (fs && jsonPath) {
      try {
        fs.writeFileSync(jsonPath, JSON.stringify(docs, null, 2), 'utf8');
      } catch (e) {
        console.error('Error writing JSON file', e);
      }
    }
  }

  function render() {
    isAdmin = sessionStorage.getItem('maestroAdmin') === 'true';
    maestroContainer.textContent = '';

    const categories = Array.from(new Set(docs.map(d => d.category)));
    categories.forEach(cat => {
      const section = document.createElement('details');
      section.className = 'category-section';
      section.open = true;

      const summary = document.createElement('summary');
      summary.textContent = cat;
      section.appendChild(summary);

      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      ['Documento', 'Número', 'Detalle', 'Acciones'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');

      docs.forEach((doc, idx) => {
        if (doc.category !== cat) return;
        const tr = document.createElement('tr');
        tr.classList.add('fade-in');

        const tdName = document.createElement('td');
        tdName.textContent = doc.name;
        tr.appendChild(tdName);

      const tdNum = document.createElement('td');
      tdNum.textContent = doc.number;
      if (isAdmin) {
        tdNum.addEventListener('click', () => {
          const nuevo = prompt('Nuevo número', doc.number);
          if (nuevo !== null) {
            docs[idx].number = nuevo.trim();
            save();
            render();
          }
        });
      }
      tr.appendChild(tdNum);

      const tdDet = document.createElement('td');
      tdDet.textContent = doc.detail || '';
      if (isAdmin) {
        tdDet.addEventListener('click', () => {
          const nuevo = prompt('Nuevo detalle', doc.detail || '');
          if (nuevo !== null) {
            docs[idx].detail = nuevo.trim();
            save();
            render();
          }
        });
      }
      tr.appendChild(tdDet);

      const tdAct = document.createElement('td');
      if (isAdmin) {
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Eliminar';
        delBtn.addEventListener('click', () => {
          if (doc.name === 'Amfe') {
            const count = docs.filter(d => d.name === 'Amfe').length;
            if (count <= 1) {
              alert('No se puede eliminar la columna Amfe');
              return;
            }
          }
          docs.splice(idx, 1);
          save();
          render();
        });
        tdAct.appendChild(delBtn);
      }
      tr.appendChild(tdAct);

        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      section.appendChild(table);
      maestroContainer.appendChild(section);
    });

    updateDocOptions();

    // Mostrar u ocultar formulario según modo
    const form = document.querySelector('.maestro-form');
    form.style.display = isAdmin ? 'flex' : 'none';

    applyFilter();
  }

  addBtn.addEventListener('click', () => {
    const name = nameInput.value;
    const num = numberInput.value.trim();
    const det = detailInput.value.trim();
    const type = DOC_TYPES.find(t => t.name === name);
    const cat = type ? type.category : 'Otros';
    if (!name || !num) return;
    docs.push({ name, number: num, detail: det, category: cat });
    save();
    render();
    nameInput.selectedIndex = 0;
    numberInput.value = '';
    detailInput.value = '';
  });

  if (filterInput) {
    filterInput.addEventListener('input', applyFilter);
  }

  document.addEventListener('maestro-mode', render);
  render();
});
