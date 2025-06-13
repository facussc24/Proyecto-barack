document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('isAdmin') !== 'true') {
    alert('Debe iniciar sesión para editar');
    location.href = 'login.html';
    return;
  }

  const subsDiv = document.getElementById('availableSubs');
  const insDiv = document.getElementById('availableIns');
  const subContainer = document.getElementById('subInputContainer');
  const addSubBtn = document.getElementById('addSubRow');
  const treePreview = document.getElementById('treePreview');
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
      btn.addEventListener('click', () => addItem({ ID: s.ID, Tipo: s.Tipo, Descripción: s['Descripción'], Código: s['Código'] }));
      subsDiv.appendChild(btn);
    });
    ins.forEach(i => {
      const btn = document.createElement('button');
      btn.textContent = `${i['Descripción'] || ''} - ${i['Código'] || ''}`;
      btn.addEventListener('click', () => addItem({ ID: i.ID, Tipo: i.Tipo, Descripción: i['Descripción'], Código: i['Código'] }));
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
    renderPreview();
  }

  function addItem(item) {
    selected.push(item);
    renderSelected();
  }

  function addSubRow() {
    if (!subContainer) return;
    const row = document.createElement('div');
    row.className = 'new-sub-row';
    row.innerHTML = `
      <input type="text" class="new-sub-desc" placeholder="Descripción">
      <input type="text" class="new-sub-code" placeholder="Código">
      <button type="button" class="remove-sub">×</button>`;
    row.querySelector('.remove-sub').addEventListener('click', () => {
      row.remove();
      renderPreview();
    });
    row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', renderPreview));
    subContainer.appendChild(row);
  }

  function getSubRowsData() {
    if (!subContainer) return [];
    return Array.from(subContainer.querySelectorAll('.new-sub-row')).map(r => {
      const desc = r.querySelector('.new-sub-desc').value.trim();
      const code = r.querySelector('.new-sub-code').value.trim();
      if (!desc) return null;
      return { Tipo: 'Subensamble', Descripción: desc, Código: code };
    }).filter(Boolean);
  }

  function buildNodeFromExisting(id, map) {
    const n = map[id];
    if (!n) return null;
    const children = Object.values(map).filter(ch => ch.ParentID === id).map(ch => buildNodeFromExisting(ch.ID, map)).filter(Boolean);
    return { Descripción: n['Descripción'], Código: n['Código'], children };
  }

  function renderPreview() {
    if (!treePreview) return;
    const desc = document.getElementById('builderDesc').value.trim();
    if (!desc) { treePreview.innerHTML = ''; return; }
    const code = document.getElementById('builderCode').value.trim();
    const root = { Descripción: desc, Código: code, children: [] };
    const nodes = window.SinopticoEditor && SinopticoEditor.getNodes ? SinopticoEditor.getNodes() : [];
    const map = {};
    nodes.forEach(n => { map[n.ID] = n; });

    selected.forEach(it => {
      if (it.ID) {
        const sub = buildNodeFromExisting(it.ID, map);
        if (sub) root.children.push(sub);
      } else {
        root.children.push({ Descripción: it.Descripción, Código: it.Código, children: [] });
      }
    });

    getSubRowsData().forEach(it => root.children.push(it));

    treePreview.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'tree-list';
    ul.appendChild(renderItem(root));
    treePreview.appendChild(ul);
  }

  function renderItem(node) {
    const li = document.createElement('li');
    const div = document.createElement('div');
    div.className = 'tree-node';
    div.textContent = node.Descripción + (node.Código ? ` - ${node.Código}` : '');
    li.appendChild(div);
    if (node.children && node.children.length) {
      const ul = document.createElement('ul');
      ul.className = 'tree-list';
      node.children.forEach(ch => ul.appendChild(renderItem(ch)));
      li.appendChild(ul);
    }
    return li;
  }

  document.getElementById('saveProduct').addEventListener('click', () => {
    const desc = document.getElementById('builderDesc').value.trim();
    const code = document.getElementById('builderCode').value.trim();
    if (!desc) return;
    const children = selected.concat(getSubRowsData());
    SinopticoEditor.addNode({ Tipo: 'Pieza final', Descripción: desc, Código: code }, children);
    selected = [];
    document.getElementById('builderDesc').value = '';
    document.getElementById('builderCode').value = '';
    if (subContainer) subContainer.innerHTML = '';
    renderSelected();
    renderPreview();
    alert('Producto creado');
  });

  if (addSubBtn) addSubBtn.addEventListener('click', addSubRow);

  document.getElementById('builderDesc').addEventListener('input', renderPreview);
  document.getElementById('builderCode').addEventListener('input', renderPreview);

  document.addEventListener('sinoptico-mode', () => { renderLists(); renderPreview(); });
  document.addEventListener('sinoptico-loaded', () => { renderLists(); renderPreview(); });
});

