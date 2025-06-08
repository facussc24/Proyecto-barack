document.addEventListener('DOMContentLoaded', () => {
  const maestroContainer = document.getElementById('maestro');
  const nameInput = document.getElementById('docName');
  const numberInput = document.getElementById('docNumber');
  const detailInput = document.getElementById('docDetail');
  const categorySelect = document.getElementById('docCategory');
  const addBtn = document.getElementById('addDoc');
  const STORAGE_KEY = 'maestroDocs';
  let isAdmin = sessionStorage.getItem('maestroAdmin') === 'true';

  let docs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
    { name: 'Hojas de operaciones', number: '', detail: '', category: 'Operaciones' },
    { name: 'Flujograma', number: '', detail: '', category: 'Operaciones' },
    { name: 'Mylar', number: '', detail: '', category: 'Operaciones' },
    { name: 'ULM', number: '', detail: '', category: 'Operaciones' },
    { name: 'AMFE', number: '', detail: '', category: 'AMFE' }
  ];

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
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
          if (doc.name === 'AMFE') {
            const count = docs.filter(d => d.name === 'AMFE').length;
            if (count <= 1) {
              alert('No se puede eliminar la columna AMFE');
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

    // Mostrar u ocultar formulario según modo
    const form = document.querySelector('.maestro-form');
    form.style.display = isAdmin ? 'flex' : 'none';
  }

  addBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const num = numberInput.value.trim();
    const det = detailInput.value.trim();
    const cat = categorySelect.value;
    if (!name || !num) return;
    docs.push({ name, number: num, detail: det, category: cat });
    save();
    render();
    nameInput.value = '';
    numberInput.value = '';
    detailInput.value = '';
    categorySelect.value = 'Operaciones';
  });

  document.addEventListener('maestro-mode', render);
  render();
});
