document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('isAdmin') !== 'true') {
    alert('Debe iniciar sesión para editar');
    location.href = 'login.html';
    return;
  }

  const subsDiv = document.getElementById('availableSubs');
  const insDiv = document.getElementById('availableIns');
  const selectedList = document.getElementById('selectedList');
  let selected = [];

  function renderLists() {
    if (!window.SinopticoEditor || !SinopticoEditor.getNodes) return;
    const nodes = SinopticoEditor.getNodes();
    const subs = nodes.filter(n => (n.Tipo || '').toLowerCase() === 'subensamble');
    const ins = nodes.filter(n => (n.Tipo || '').toLowerCase() === 'insumo');
    subsDiv.innerHTML = '';
    insDiv.innerHTML = '';
    subs.forEach(s => {
      const btn = document.createElement('button');
      btn.textContent = `${s['Descripción'] || ''} - ${s['Código'] || ''}`;
      btn.addEventListener('click', () => addItem({ Tipo: s.Tipo, Descripción: s['Descripción'], Código: s['Código'] }));
      subsDiv.appendChild(btn);
    });
    ins.forEach(i => {
      const btn = document.createElement('button');
      btn.textContent = `${i['Descripción'] || ''} - ${i['Código'] || ''}`;
      btn.addEventListener('click', () => addItem({ Tipo: i.Tipo, Descripción: i['Descripción'], Código: i['Código'] }));
      insDiv.appendChild(btn);
    });
  }

  function renderSelected() {
    selectedList.innerHTML = '';
    selected.forEach((item, idx) => {
      const li = document.createElement('li');
      li.textContent = `${item.Descripción || ''} - ${item.Código || ''}`;
      const rm = document.createElement('button');
      rm.textContent = '×';
      rm.addEventListener('click', () => { selected.splice(idx, 1); renderSelected(); });
      li.appendChild(rm);
      selectedList.appendChild(li);
    });
  }

  function addItem(item) {
    selected.push(item);
    renderSelected();
  }

  document.getElementById('saveProduct').addEventListener('click', () => {
    const desc = document.getElementById('builderDesc').value.trim();
    const code = document.getElementById('builderCode').value.trim();
    if (!desc) return;
    SinopticoEditor.addNode({ Tipo: 'Pieza final', Descripción: desc, Código: code }, selected);
    selected = [];
    document.getElementById('builderDesc').value = '';
    document.getElementById('builderCode').value = '';
    renderSelected();
    alert('Producto creado');
  });

  document.addEventListener('sinoptico-mode', renderLists);
  setTimeout(renderLists, 300);
});

