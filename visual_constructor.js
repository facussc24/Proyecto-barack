document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('isAdmin') !== 'true') {
    alert('Debe iniciar sesión para editar');
    location.href = 'login.html';
    return;
  }

  const progressBar = document.getElementById('progressBar');
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const productCard = document.getElementById('productCard');
  const summaryTree = document.getElementById('summaryTree');
  const saveBtn = document.getElementById('saveAll');
  const clientSelect = document.getElementById('prodClient');
  const clientLabel = document.getElementById('clientInfo');

  const root = { descripcion: '', codigo: '', subproductos: [], insumos: [] };

  fillClientOptions();

  function fillClientOptions() {
    if (!clientSelect) return;
    if (!window.SinopticoEditor || !SinopticoEditor.getNodes) return;
    const nodes = SinopticoEditor.getNodes();
    const clients = nodes.filter(n => (n.Tipo || '').toLowerCase() === 'cliente');
    clientSelect.innerHTML = '';
    clients.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.ID;
      opt.textContent = c['Descripción'] || '';
      clientSelect.appendChild(opt);
    });
  }

  function showToast(msg) {
    const div = document.createElement('div');
    div.className = 'toast';
    div.textContent = msg;
    document.getElementById('toastContainer').appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }

  function updateProgress(step) {
    progressBar.style.width = step * 50 + '%';
    [step1, step2].forEach((s,i) => {
      if (i === step-1) {
        s.classList.remove('hidden');
        s.classList.add('active');
      } else {
        s.classList.add('hidden');
        s.classList.remove('active');
      }
    });
    if (clientLabel) {
      if (step === 1) clientLabel.classList.add('hidden');
    }
  }

  function updateSummary() {
    summaryTree.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'tree-list';
    ul.appendChild(renderNode(root));
    summaryTree.appendChild(ul);
  }

  function renderNode(node, isSub = false) {
    const li = document.createElement('li');
    const div = document.createElement('div');
    div.className = 'tree-node';
    div.textContent = node.descripcion + (node.codigo ? ` - ${node.codigo}` : '');
    if (isSub) {
      const btn = document.createElement('button');
      btn.className = 'add-child-btn';
      btn.textContent = '+';
      div.appendChild(btn);
      btn.addEventListener('click', () => {
        addChildForm(div, (type,d,c) => {
          if (type === 'sub') {
            const child = { descripcion: d, codigo: c, subproductos: [], insumos: [] };
            node.subproductos = node.subproductos || [];
            node.subproductos.push(child);
            updateSummary();
          } else {
            const ins = { descripcion: d, codigo: c };
            node.insumos = node.insumos || [];
            node.insumos.push(ins);
            updateSummary();
          }
          showToast('Elemento agregado');
        });
      });
    }
    li.appendChild(div);
    if ((node.subproductos && node.subproductos.length) || (node.insumos && node.insumos.length)) {
      const ul = document.createElement('ul');
      ul.className = 'tree-list';
      (node.subproductos || []).forEach(sp => ul.appendChild(renderNode(sp, true)));
      (node.insumos || []).forEach(ins => ul.appendChild(renderNode(ins)));
      li.appendChild(ul);
    }
    return li;
  }

  function addChildForm(parentEl, callback) {
    const form = document.createElement('div');
    form.className = 'inline-form';
    const typeSel = document.createElement('select');
    typeSel.innerHTML = '<option value="sub">Subproducto</option><option value="ins">Insumo</option>';
    const desc = document.createElement('input');
    desc.placeholder = 'Descripción';
    const code = document.createElement('input');
    code.placeholder = 'Código';
    const ok = document.createElement('button');
    ok.textContent = '✔';
    const cancel = document.createElement('button');
    cancel.textContent = '✖';
    cancel.className = 'cancel';
    form.append(typeSel, desc, code, ok, cancel);
    parentEl.appendChild(form);

    ok.addEventListener('click', () => {
      if (!desc.value.trim()) {
        desc.style.border = '1px solid red';
        return;
      }
      callback(typeSel.value, desc.value.trim(), code.value.trim());
      form.remove();
    });
    cancel.addEventListener('click', () => {
      form.remove();
      showToast('Acción cancelada');
    });
  }

  function createSubCard(sub) {
    const card = document.createElement('div');
    card.className = 'builder-card';
    const title = document.createElement('div');
    title.textContent = sub.descripcion + (sub.codigo ? ` - ${sub.codigo}` : '');
    card.appendChild(title);
    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn';
    addBtn.title = 'Agregar';
    addBtn.textContent = '+';
    card.appendChild(addBtn);
    const children = document.createElement('div');
    children.className = 'children';
    card.appendChild(children);

    function renderChildren() {
      children.innerHTML = '';
      (sub.subproductos || []).forEach(sp => children.appendChild(createSubCard(sp)));
      (sub.insumos || []).forEach(ins => children.appendChild(createInsumoCard(ins)));
    }

    addBtn.addEventListener('click', () => {
      addChildForm(card, (type,d,c) => {
        if (type === 'sub') {
          const child = { descripcion: d, codigo: c, subproductos: [], insumos: [] };
          sub.subproductos = sub.subproductos || [];
          sub.subproductos.push(child);
          renderChildren();
          showToast('Subproducto agregado');
        } else {
          const ins = { descripcion: d, codigo: c };
          sub.insumos = sub.insumos || [];
          sub.insumos.push(ins);
          renderChildren();
          showToast('Insumo agregado');
        }
        updateSummary();
      });
    });

    renderChildren();
    return card;
  }

  function createInsumoCard(ins) {
    const card = document.createElement('div');
    card.className = 'builder-card';
    card.textContent = ins.descripcion + (ins.codigo ? ` - ${ins.codigo}` : '');
    card.style.marginLeft = '30px';
    return card;
  }

  const toStep2Btn = document.getElementById('toStep2');
  if (toStep2Btn) toStep2Btn.addEventListener('click', () => {
    const desc = document.getElementById('prodDesc').value.trim();
    if (!desc) {
      document.getElementById('prodDesc').style.border = '1px solid red';
      return;
    }
    root.descripcion = desc;
    root.codigo = document.getElementById('prodCode').value.trim();
    const selected = clientSelect && clientSelect.options[clientSelect.selectedIndex];
    if (clientLabel) {
      if (selected) {
        clientLabel.textContent = 'Cliente: ' + selected.textContent;
        clientLabel.classList.remove('hidden');
      } else {
        clientLabel.classList.add('hidden');
      }
    }
    productCard.innerHTML = '';
    productCard.textContent = desc + (root.codigo ? ` - ${root.codigo}` : '');
    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn';
    addBtn.title = 'Agregar';
    addBtn.textContent = '+';
    productCard.appendChild(addBtn);
    const children = document.createElement('div');
    children.className = 'children';
    productCard.appendChild(children);
    function renderChildren() {
      children.innerHTML = '';
      root.subproductos.forEach(sp => children.appendChild(createSubCard(sp)));
      root.insumos.forEach(ins => children.appendChild(createInsumoCard(ins)));
    }

    addBtn.addEventListener('click', () => {
      addChildForm(productCard, (type,d,c) => {
        if (type === 'sub') {
          const sub = { descripcion: d, codigo: c, subproductos: [], insumos: [] };
          root.subproductos.push(sub);
          renderChildren();
          showToast('Subproducto creado');
        } else {
          const ins = { descripcion: d, codigo: c };
          root.insumos.push(ins);
          renderChildren();
          showToast('Insumo agregado');
        }
        updateSummary();
      });
    });

    renderChildren();
    updateProgress(2);
  });


  if (saveBtn) saveBtn.addEventListener('click', () => {
    updateSummary();
    function serialize(node, tipo) {
      const obj = { Tipo: tipo, Descripción: node.descripcion, Código: node.codigo };
      const children = [];
      (node.subproductos || []).forEach(sp => children.push(serialize(sp, 'Subensamble')));
      (node.insumos || []).forEach(ins => children.push({ Tipo: 'Insumo', Descripción: ins.descripcion, Código: ins.codigo }));
      if (children.length) obj.children = children;
      return obj;
    }

    const data = serialize(root, 'Pieza final');
    if (window.SinopticoEditor && SinopticoEditor.addNode) {
      const parentId = clientSelect ? clientSelect.value : '';
      SinopticoEditor.addNode({
        ParentID: parentId,
        Tipo: data.Tipo,
        Descripción: data.Descripción,
        Código: data.Código
      }, data.children);
      showToast('Producto guardado');
      root.descripcion = '';
      root.codigo = '';
      root.subproductos = [];
      root.insumos = [];
      document.getElementById('prodDesc').value = '';
      document.getElementById('prodCode').value = '';
      productCard.innerHTML = '';
      if (clientLabel) clientLabel.classList.add('hidden');
      updateSummary();
      updateProgress(1);
    } else {
      showToast('Error: SinopticoEditor no disponible');
    }
  });

  document.addEventListener('sinoptico-mode', fillClientOptions);
  document.addEventListener('sinoptico-loaded', fillClientOptions);
  document.addEventListener('sinoptico-data-changed', fillClientOptions);
  setTimeout(fillClientOptions, 300);
});
