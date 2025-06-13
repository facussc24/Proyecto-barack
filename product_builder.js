'use strict';
document.addEventListener('DOMContentLoaded', () => {
  // Solo administradores pueden editar
  if (sessionStorage.getItem('isAdmin') !== 'true') {
    alert('Debe iniciar sesión para editar');
    location.href = 'login.html';
    return;
  }

  // Referencias al DOM
  const subsDiv        = document.getElementById('availableSubs');
  const insDiv         = document.getElementById('availableIns');
  const subContainer   = document.getElementById('subInputContainer');
  const addSubBtn      = document.getElementById('addSubRow');
  const treePreview    = document.getElementById('treePreview');
  const selectedList   = document.getElementById('selectedList');
  let selected = [];

  // Renderiza botones de subensambles e insumos disponibles
  function renderLists() {
    subsDiv.innerHTML = '';
    insDiv.innerHTML = '';
    if (!window.SinopticoEditor || !SinopticoEditor.getNodes) return;
    const nodes = SinopticoEditor.getNodes();
    if (!Array.isArray(nodes) || nodes.length === 0 ||
        !nodes.some(n => (n.Tipo || '').toLowerCase() === 'cliente')) {
      subsDiv.textContent = 'Sinóptico vacío';
      return;
    }
    const subs = nodes.filter(n => (n.Tipo || '').toLowerCase() === 'subensamble');
    const ins  = nodes.filter(n => (n.Tipo || '').toLowerCase() === 'insumo');
    subs.forEach(s => {
      const btn = document.createElement('button');
      btn.textContent = `${s['Descripción'] || ''} - ${s['Código'] || ''}`;
      btn.addEventListener('click', () => addItem({
        ID: s.ID,
        Tipo: s.Tipo,
        Descripción: s['Descripción'],
        Código: s['Código']
      }));
      subsDiv.appendChild(btn);
    });
    ins.forEach(i => {
      const btn = document.createElement('button');
      btn.textContent = `${i['Descripción'] || ''} - ${i['Código'] || ''}`;
      btn.addEventListener('click', () => addItem({
        ID: i.ID,
        Tipo: i.Tipo,
        Descripción: i['Descripción'],
        Código: i['Código']
      }));
      insDiv.appendChild(btn);
    });
  }

  // Renderiza la lista de elementos seleccionados
  function renderSelected() {
    selectedList.innerHTML = '';
    selected.forEach((item, idx) => {
      const li = document.createElement('li');
      li.textContent = `${item.Descripción || ''} - ${item.Código || ''}`;
      const rm = document.createElement('button');
      rm.textContent = '×';
      rm.addEventListener('click', () => {
        selected.splice(idx, 1);
        renderSelected();
      });
      li.appendChild(rm);
      selectedList.appendChild(li);
    });
    renderPreview();
  }

  // Añade un ítem (existente o nuevo) a la selección
  function addItem(item) {
    selected.push(item);
    renderSelected();
  }

  // Crea una nueva fila inline para agregar subensamble manual
  function addSubRow() {
    if (!subContainer) return;
    const row = document.createElement('div');
    row.className = 'new-sub-row';
    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.className = 'new-sub-desc';
    descInput.placeholder = 'Descripción';

    const codeInput = document.createElement('input');
    codeInput.type = 'text';
    codeInput.className = 'new-sub-code';
    codeInput.placeholder = 'Código';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-sub';
    removeBtn.textContent = '×';

    row.appendChild(descInput);
    row.appendChild(codeInput);
    row.appendChild(removeBtn);

    removeBtn.addEventListener('click', () => {
      row.remove();
      renderPreview();
    });
    [descInput, codeInput].forEach(inp =>
      inp.addEventListener('input', renderPreview)
    );
    subContainer.appendChild(row);
  }

  // Recoge datos de las filas de subensamble manual
  function getSubRowsData() {
    if (!subContainer) return [];
    return Array.from(subContainer.querySelectorAll('.new-sub-row'))
      .map(r => {
        const desc = r.querySelector('.new-sub-desc').value.trim();
        const code = r.querySelector('.new-sub-code').value.trim();
        if (!desc) return null;
        return { Tipo: 'Subensamble', Descripción: desc, Código: code };
      })
      .filter(Boolean);
  }

  // Construye recursivamente un nodo existente desde el mapa
  function buildNodeFromExisting(id, map) {
    const n = map[id];
    if (!n) return null;
    const children = Object.values(map)
      .filter(ch => ch.ParentID === id)
      .map(ch => buildNodeFromExisting(ch.ID, map))
      .filter(Boolean);
    return { Descripción: n['Descripción'], Código: n['Código'], children };
  }

  // Renderiza la vista previa del árbol completo
  function renderPreview() {
    if (!treePreview) return;
    const desc = document.getElementById('builderDesc').value.trim();
    if (!desc) { treePreview.innerHTML = ''; return; }
    const code = document.getElementById('builderCode').value.trim();
    const root = { Descripción: desc, Código: code, children: [] };

    // Mapa de nodos existentes
    const nodes = window.SinopticoEditor?.getNodes?.() || [];
    const map = {};
    nodes.forEach(n => { map[n.ID] = n; });

    // Agrega ítems seleccionados
    selected.forEach(it => {
      if (it.ID) {
        const sub = buildNodeFromExisting(it.ID, map);
        if (sub) root.children.push(sub);
      } else {
        root.children.push({ Descripción: it.Descripción, Código: it.Código, children: [] });
      }
    });

    // Agrega subensambles manuales
    getSubRowsData().forEach(it => root.children.push(it));

    // Dibuja el árbol
    treePreview.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'tree-list';
    ul.appendChild(renderItem(root));
    treePreview.appendChild(ul);
  }

  // Renderiza un nodo (y recursivamente sus hijos)
  function renderItem(node) {
    const li = document.createElement('li');
    const div = document.createElement('div');
    div.className = 'tree-node';
    div.textContent = node.Descripción + (node.Código ? ` - ${node.Código}` : '');
    li.appendChild(div);
    if (node.children?.length) {
      const ul = document.createElement('ul');
      ul.className = 'tree-list';
      node.children.forEach(ch => ul.appendChild(renderItem(ch)));
      li.appendChild(ul);
    }
    return li;
  }

  // Guardar producto final junto con hijos
  document.getElementById('saveProduct').addEventListener('click', () => {
    const desc = document.getElementById('builderDesc').value.trim();
    const code = document.getElementById('builderCode').value.trim();
    if (!desc) return;
    const children = selected.concat(getSubRowsData());
    SinopticoEditor.addNode(
      { Tipo: 'Pieza final', Descripción: desc, Código: code },
      children
    );
    // Reset estado
    selected = [];
    document.getElementById('builderDesc').value = '';
    document.getElementById('builderCode').value = '';
    subContainer.innerHTML = '';
    renderSelected();
    renderPreview();
    alert('Producto creado');
  });

  // Event listeners adicionales
  if (addSubBtn) addSubBtn.addEventListener('click', addSubRow);
  document.getElementById('builderDesc')
    .addEventListener('input', renderPreview);
  document.getElementById('builderCode')
    .addEventListener('input', renderPreview);

  // Suscripción a eventos del sinóptico
  document.addEventListener('sinoptico-mode',         () => { renderLists(); renderPreview(); });
  document.addEventListener('sinoptico-loaded',       () => { renderLists(); renderPreview(); });
  document.addEventListener('sinoptico-data-changed', () => { renderLists(); renderPreview(); });
  // Fallback por si algún evento no llega
  setTimeout(() => { renderLists(); renderPreview(); }, 300);
});

