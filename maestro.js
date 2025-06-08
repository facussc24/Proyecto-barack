document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.querySelector('#maestro tbody');
  const nameInput = document.getElementById('docName');
  const numberInput = document.getElementById('docNumber');
  const addBtn = document.getElementById('addDoc');
  const STORAGE_KEY = 'maestroDocs';

  let docs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
    { name: 'Hojas de operaciones', number: '' },
    { name: 'AMFE', number: '' },
    { name: 'Flujograma', number: '' },
    { name: 'Mylar', number: '' },
    { name: 'ULM', number: '' }
  ];

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  }

  function render() {
    tbody.textContent = '';
    docs.forEach((doc, idx) => {
      const tr = document.createElement('tr');

      const tdName = document.createElement('td');
      tdName.textContent = doc.name;
      tr.appendChild(tdName);

      const tdNum = document.createElement('td');
      tdNum.textContent = doc.number;
      tdNum.addEventListener('click', () => {
        const nuevo = prompt('Nuevo número', doc.number);
        if (nuevo !== null) {
          docs[idx].number = nuevo.trim();
          save();
          render();
        }
      });
      tr.appendChild(tdNum);

      const tdAct = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Eliminar';
      delBtn.addEventListener('click', () => {
        docs.splice(idx, 1);
        save();
        render();
      });
      tdAct.appendChild(delBtn);
      tr.appendChild(tdAct);

      tbody.appendChild(tr);
    });
  }

  addBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const num = numberInput.value.trim();
    if (!name || !num) return;
    docs.push({ name, number: num });
    save();
    render();
    nameInput.value = '';
    numberInput.value = '';
  });

  render();
});
