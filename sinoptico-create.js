document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('isAdmin') !== 'true') {
    alert('Debe iniciar sesión para editar');
    location.href = 'login.html';
    return;
  }

  sessionStorage.setItem('sinopticoEdit', 'true');
  document.dispatchEvent(new Event('sinoptico-mode'));

  const level = document.getElementById('levelSelect');
  const clientForm = document.getElementById('clientForm');
  const productForm = document.getElementById('productForm');
  const subForm = document.getElementById('subForm');
  const insForm = document.getElementById('insForm');
  const prodClient = document.getElementById('prodClient');
  const subParent = document.getElementById('subParent');
  const insParent = document.getElementById('insParent');
  const childContainer = document.getElementById('childContainer');
  const preview = document.getElementById('treePreview');

  function renderTree() {
    if (!preview || !window.SinopticoEditor || !SinopticoEditor.getNodes) return;
    const nodes = SinopticoEditor.getNodes();
    const map = {};
    nodes.forEach(n => (map[n.ID] = Object.assign({ children: [] }, n)));
    nodes.forEach(n => {
      if (n.ParentID && map[n.ParentID]) map[n.ParentID].children.push(map[n.ID]);
    });
    const roots = nodes.filter(n => !n.ParentID).map(n => map[n.ID]);

    preview.innerHTML = '';
    const rootList = document.createElement('ul');
    rootList.className = 'tree-list';
    roots.forEach(r => rootList.appendChild(buildItem(r)));
    preview.appendChild(rootList);

    function buildItem(node) {
      const li = document.createElement('li');
      const container = document.createElement('div');
      container.className = 'tree-node';
      const label = document.createElement('span');
      label.textContent = node['Descripción'] || node.ID;
      container.appendChild(label);

      if ((node.Tipo || '').toLowerCase() !== 'insumo') {
        const addSub = document.createElement('button');
        addSub.textContent = '+S';
        addSub.className = 'add-child-btn';
        addSub.title = 'Agregar subproducto';
        addSub.addEventListener('click', () => openSubForm(node.ID));
        container.appendChild(addSub);

        const addIns = document.createElement('button');
        addIns.textContent = '+I';
        addIns.className = 'add-child-btn';
        addIns.title = 'Agregar insumo';
        addIns.addEventListener('click', () => openInsForm(node.ID));
        container.appendChild(addIns);
      }

      li.appendChild(container);
      if (node.children && node.children.length) {
        const ul = document.createElement('ul');
        node.children.forEach(c => ul.appendChild(buildItem(c)));
        li.appendChild(ul);
      }
      return li;
    }
  }

  function hideAll() {
    [clientForm, productForm, subForm, insForm].forEach(f => f.classList.add('hidden'));
  }

  function openSubForm(pid) {
    hideAll();
    level.value = 'Subproducto';
    subForm.classList.remove('hidden');
    fillOptions();
    if (pid) subParent.value = pid;
  }

  function openInsForm(pid) {
    hideAll();
    level.value = 'Insumo';
    insForm.classList.remove('hidden');
    fillOptions();
    if (pid) insParent.value = pid;
  }

  level.addEventListener('change', () => {
    hideAll();
    switch (level.value) {
      case 'Cliente':
        clientForm.classList.remove('hidden');
        break;
      case 'Producto':
        productForm.classList.remove('hidden');
        fillOptions();
        break;
      case 'Subproducto':
        subForm.classList.remove('hidden');
        fillOptions();
        break;
      case 'Insumo':
        insForm.classList.remove('hidden');
        fillOptions();
        break;
    }
  });

  document.querySelectorAll('.cancelBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      hideAll();
      level.value = '';
    });
  });

  function fillOptions() {
    if (!window.SinopticoEditor || !SinopticoEditor.getNodes) return;
    const nodes = SinopticoEditor.getNodes();
    const clients = nodes.filter(n => (n.Tipo || '').toLowerCase() === 'cliente');
    const parents = nodes.filter(n => ['pieza final','producto','subensamble'].includes((n.Tipo||'').toLowerCase()));

    prodClient.innerHTML = '';
    clients.forEach(n => {
      const opt = document.createElement('option');
      opt.value = n.ID;
      opt.textContent = n['Descripción'] || '';
      prodClient.appendChild(opt);
    });

    [subParent, insParent].forEach(sel => {
      if (!sel) return;
      sel.innerHTML = '';
      parents.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n.ID;
        opt.textContent = `${n.ID} - ${n['Descripción'] || ''}`;
        sel.appendChild(opt);
      });
    });
  }

  clientForm.addEventListener('submit', e => {
    e.preventDefault();
    const desc = document.getElementById('clientDesc').value.trim();
    if (!desc) return;
    SinopticoEditor.addNode({ Tipo: 'Cliente', Descripción: desc, Cliente: desc });
    renderTree();
    clientForm.reset();
    hideAll();
    level.value = '';
  });

  productForm.addEventListener('submit', e => {
    e.preventDefault();
    const parent = prodClient.value;
    const desc = document.getElementById('prodDesc').value.trim();
    if (!desc) return;
    const id = SinopticoEditor.addNode({ ParentID: parent, Tipo: 'Pieza final', Descripción: desc });
    renderTree();
    productForm.reset();
    if (confirm('¿Va a incluir subproductos o insumos?')) {
      level.value = 'Subproducto';
      level.dispatchEvent(new Event('change'));
      subParent.value = id;
    } else {
      hideAll();
      level.value = '';
    }
  });

  let lastSubId = null;

  subForm.addEventListener('submit', e => {
    e.preventDefault();
    const parent = subParent.value;
    const desc = document.getElementById('subDesc').value.trim();
    if (!desc) return;
    lastSubId = SinopticoEditor.addNode({ ParentID: parent, Tipo: 'Subensamble', Descripción: desc });
    renderTree();
    subForm.reset();
    fillOptions();
  });

  document.getElementById('addChildSub').addEventListener('click', () => {
    if (!lastSubId) return;
    createSubChildForm(lastSubId);
  });

  document.getElementById('addChildIns').addEventListener('click', () => {
    if (!lastSubId) return;
    createInsChildForm(lastSubId);
  });

  function createSubChildForm(pid) {
    const form = document.createElement('form');
    form.className = 'node-form child-form';
    form.innerHTML = `
      <input type="text" placeholder="Descripción" required>
      <div class="form-actions">
        <button type="submit">Guardar</button>
        <button type="button" class="cancelBtn">Cancelar</button>
      </div>`;
    childContainer.appendChild(form);
    form.querySelector('.cancelBtn').addEventListener('click', () => form.remove());
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const desc = form.querySelector('input').value.trim();
      if (!desc) return;
      SinopticoEditor.addNode({ ParentID: pid, Tipo: 'Subensamble', Descripción: desc });
      renderTree();
      form.remove();
    });
  }

  function createInsChildForm(pid) {
    const form = document.createElement('form');
    form.className = 'node-form child-form';
    form.innerHTML = `
      <input type="text" placeholder="Descripción" required>
      <input type="text" placeholder="Código">
      <div class="form-actions">
        <button type="submit">Guardar</button>
        <button type="button" class="cancelBtn">Cancelar</button>
      </div>`;
    childContainer.appendChild(form);
    form.querySelector('.cancelBtn').addEventListener('click', () => form.remove());
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const inputs = form.querySelectorAll('input');
      const desc = inputs[0].value.trim();
      const code = inputs[1].value.trim();
      if (!desc) return;
      SinopticoEditor.addNode({ ParentID: pid, Tipo: 'Insumo', Descripción: desc, Código: code });
      renderTree();
      form.remove();
    });
  }

  document.addEventListener('sinoptico-mode', () => {
    fillOptions();
    renderTree();
  });
  setTimeout(() => {
    fillOptions();
    renderTree();
  }, 300);
});
