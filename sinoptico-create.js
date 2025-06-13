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
  const addProductBtn = document.getElementById('addProductBtn');
  const childContainer = document.getElementById('childContainer');
  const preview = document.getElementById('treePreview');

  let addAnotherProduct = false;
  if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
      addAnotherProduct = true;
      productForm.classList.remove('hidden');
    });
  }

  function renderTree() {
    if (!preview || !window.SinopticoEditor || !SinopticoEditor.getNodes) return;
    const nodes = SinopticoEditor.getNodes();
    const map = {};
    nodes.forEach(n => (map[n.ID] = Object.assign({ children: [] }, n)));
    nodes.forEach(n => {
      if (n.ParentID && map[n.ParentID]) {
        map[n.ParentID].children.push(map[n.ID]);
      }
    });
    const roots = nodes.filter(n => !n.ParentID).map(n => map[n.ID]);
    const levels = [];
    function traverse(node, depth) {
      levels[depth] = levels[depth] || [];
      levels[depth].push(node);
      node.children.forEach(c => traverse(c, depth + 1));
    }
    roots.forEach(r => traverse(r, 0));

    preview.innerHTML = '';
    levels.forEach(lv => {
      const lvDiv = document.createElement('div');
      lvDiv.className = 'tree-level';
      lv.forEach(n => {
        const nd = document.createElement('div');
        nd.className = 'tree-node';
        nd.textContent = n['Descripción'] || n.ID;
        lvDiv.appendChild(nd);
      });
      preview.appendChild(lvDiv);
    });
  }

  function hideAll() {
    [clientForm, productForm, subForm, insForm].forEach(f => f.classList.add('hidden'));
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
    const addMore = addAnotherProduct || (e.submitter && e.submitter.id === 'addProductBtn');
    addAnotherProduct = false;
    if (addMore) {
      productForm.classList.remove('hidden');
      level.value = 'Producto';
      fillOptions();
    } else if (confirm('¿Va a incluir subproductos o insumos?')) {
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
