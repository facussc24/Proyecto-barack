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
  const subSearch = document.getElementById('subSearch');
  const subSuggestions = document.getElementById('subSuggestions');
  const subDescInput = document.getElementById('subDesc');
  const subCodeInput = document.getElementById('subCode');
  const insSearch = document.getElementById('insSearch');
  const insSuggestions = document.getElementById('insSuggestions');
  const insDescInput = document.getElementById('insDesc');
  const insCodeInput = document.getElementById('insCode');
  const prodCodeInput = document.getElementById('prodCode');

  let subFuse = null;
  let insFuse = null;
  let selectedSubId = null;
  let selectedInsId = null;

  let addAnotherProduct = false;
  if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
      addAnotherProduct = true;
      productForm.classList.remove('hidden');
    });
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
    rebuildFuses();
  }

  function rebuildFuses() {
    if (typeof Fuse === 'undefined' || !window.SinopticoEditor || !SinopticoEditor.getNodes) {
      subFuse = null;
      insFuse = null;
      return;
    }
    const nodes = SinopticoEditor.getNodes();
    const subs = nodes.filter(n => (n.Tipo || '').toLowerCase() === 'subensamble');
    const ins = nodes.filter(n => (n.Tipo || '').toLowerCase() === 'insumo');
    subFuse = new Fuse(subs, { keys: ['Descripción', 'Código', 'ID'], threshold: 0.2 });
    insFuse = new Fuse(ins, { keys: ['Descripción', 'Código', 'ID'], threshold: 0.2 });
  }

  function attachSearch(input, list, fuseGetter, onPick, clearSel) {
    if (!input || !list) return;
    input.addEventListener('input', () => {
      if (clearSel) clearSel();
      list.innerHTML = '';
      const text = input.value.trim();
      const fuse = fuseGetter();
      if (!text || !fuse) {
        list.style.display = 'none';
        return;
      }
      const results = fuse.search(text).slice(0, 8);
      results.forEach(r => {
        const li = document.createElement('li');
        const item = r.item;
        const desc = item['Descripción'] || item.ID;
        const codeTxt = item['Código'] ? ` - ${item['Código']}` : '';
        li.textContent = `${desc}${codeTxt}`;
        li.addEventListener('mousedown', () => {
          onPick(item);
          list.innerHTML = '';
          list.style.display = 'none';
        });
        list.appendChild(li);
      });
      list.style.display = results.length ? 'block' : 'none';
    });
    input.addEventListener('blur', () => setTimeout(() => list.style.display = 'none', 200));
  }

  attachSearch(
    subSearch,
    subSuggestions,
    () => subFuse,
    item => {
      selectedSubId = item.ID;
      subDescInput.value = item['Descripción'] || '';
    },
    () => { selectedSubId = null; }
  );

  attachSearch(
    insSearch,
    insSuggestions,
    () => insFuse,
    item => {
      selectedInsId = item.ID;
      insDescInput.value = item['Descripción'] || '';
      if (insCodeInput) insCodeInput.value = item['Código'] || '';
    },
    () => { selectedInsId = null; }
  );

  clientForm.addEventListener('submit', e => {
    e.preventDefault();
    const desc = document.getElementById('clientDesc').value.trim();
    if (!desc) return;
    SinopticoEditor.addNode({ Tipo: 'Cliente', Descripción: desc, Cliente: desc });
    if (window.mostrarMensaje) window.mostrarMensaje('Elemento creado', 'success');
    clientForm.reset();
    hideAll();
    level.value = '';
  });

  productForm.addEventListener('submit', e => {
    e.preventDefault();
    const parent = prodClient.value;
    const desc = document.getElementById('prodDesc').value.trim();
    const code = prodCodeInput ? prodCodeInput.value.trim() : '';
    if (!desc) return;
    const id = SinopticoEditor.addNode({ ParentID: parent, Tipo: 'Pieza final', Descripción: desc, Código: code });
    if (window.mostrarMensaje) window.mostrarMensaje('Elemento creado', 'success');
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
    const desc = subDescInput.value.trim();
    const code = subCodeInput ? subCodeInput.value.trim() : '';
    if (!desc && !selectedSubId) return;
    let data;
    if (selectedSubId) {
      const node = SinopticoEditor.getNodes().find(n => n.ID === selectedSubId);
      data = { ParentID: parent, Tipo: node ? node.Tipo : 'Subensamble', Descripción: node ? node['Descripción'] : desc, Código: node ? node['Código'] : code };
    } else {
      data = { ParentID: parent, Tipo: 'Subensamble', Descripción: desc, Código: code };
    }
    lastSubId = SinopticoEditor.addNode(data);
    if (window.mostrarMensaje) window.mostrarMensaje('Elemento creado', 'success');
    selectedSubId = null;
    subForm.reset();
    fillOptions();
  });

  insForm.addEventListener('submit', e => {
    e.preventDefault();
    const parent = insParent.value;
    const desc = insDescInput.value.trim();
    const code = insCodeInput.value.trim();
    if (!desc && !selectedInsId) return;
    let data;
    if (selectedInsId) {
      const node = SinopticoEditor.getNodes().find(n => n.ID === selectedInsId);
      data = { ParentID: parent, Tipo: node ? node.Tipo : 'Insumo', Descripción: node ? node['Descripción'] : desc, Código: node ? node['Código'] : code };
    } else {
      data = { ParentID: parent, Tipo: 'Insumo', Descripción: desc, Código: code };
    }
    SinopticoEditor.addNode(data);
    if (window.mostrarMensaje) window.mostrarMensaje('Elemento creado', 'success');
    selectedInsId = null;
    insForm.reset();
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
        if (window.mostrarMensaje) window.mostrarMensaje('Elemento creado', 'success');
      fillOptions();
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
        if (window.mostrarMensaje) window.mostrarMensaje('Elemento creado', 'success');
      fillOptions();
      form.remove();
    });
  }

  document.addEventListener('sinoptico-mode', () => {
    fillOptions();
  });
  document.addEventListener('sinoptico-loaded', () => {
    fillOptions();
  });
  document.addEventListener('sinoptico-data-changed', () => {
    fillOptions();
  });
  setTimeout(() => {
    fillOptions();
  }, 300);
});
