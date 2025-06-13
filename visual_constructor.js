document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('isAdmin') !== 'true') {
    alert('Debe iniciar sesión para editar');
    location.href = 'login.html';
    return;
  }

  const progressBar = document.getElementById('progressBar');
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  const productCard = document.getElementById('productCard');
  const summaryTree = document.getElementById('summaryTree');
  const saveBtn = document.getElementById('saveAll');

  const root = { descripcion: '', codigo: '', subproductos: [] };

  function showToast(msg) {
    const div = document.createElement('div');
    div.className = 'toast';
    div.textContent = msg;
    document.getElementById('toastContainer').appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }

  function updateProgress(step) {
    progressBar.style.width = step * 33 + '%';
    [step1, step2, step3].forEach((s,i) => {
      if (i === step-1) s.classList.remove('hidden');
      else s.classList.add('hidden');
    });
  }

  function updateSummary() {
    summaryTree.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'tree-list';
    ul.appendChild(renderNode(root));
    summaryTree.appendChild(ul);
  }

  function renderNode(node) {
    const li = document.createElement('li');
    const div = document.createElement('div');
    div.className = 'tree-node';
    div.textContent = node.descripcion + (node.codigo ? ` - ${node.codigo}` : '');
    li.appendChild(div);
    if (node.subproductos && node.subproductos.length) {
      const ul = document.createElement('ul');
      ul.className = 'tree-list';
      node.subproductos.forEach(sp => {
        const liSp = renderNode(sp);
        if (sp.insumos && sp.insumos.length) {
          const ulIns = document.createElement('ul');
          ulIns.className = 'tree-list';
          sp.insumos.forEach(ins => ulIns.appendChild(renderNode(ins)));
          liSp.appendChild(ulIns);
        }
        ul.appendChild(liSp);
      });
      li.appendChild(ul);
    }
    return li;
  }

  function addInlineForm(parentEl, callback) {
    const form = document.createElement('div');
    form.className = 'inline-form';
    const desc = document.createElement('input');
    desc.placeholder = 'Descripción';
    const code = document.createElement('input');
    code.placeholder = 'Código';
    const ok = document.createElement('button');
    ok.textContent = '✔';
    const cancel = document.createElement('button');
    cancel.textContent = '✖';
    cancel.className = 'cancel';
    form.append(desc, code, ok, cancel);
    parentEl.appendChild(form);

    ok.addEventListener('click', () => {
      if (!desc.value.trim()) {
        desc.style.border = '1px solid red';
        return;
      }
      callback(desc.value.trim(), code.value.trim());
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
    addBtn.title = '+ Insumo';
    addBtn.textContent = '+';
    card.appendChild(addBtn);
    const children = document.createElement('div');
    children.className = 'children';
    card.appendChild(children);

    addBtn.addEventListener('click', () => {
      addInlineForm(card, (d,c) => {
        const ins = { descripcion: d, codigo: c };
        sub.insumos.push(ins);
        children.appendChild(createInsumoCard(ins));
        updateSummary();
        showToast('Insumo agregado');
      });
    });

    return card;
  }

  function createInsumoCard(ins) {
    const card = document.createElement('div');
    card.className = 'builder-card';
    card.textContent = ins.descripcion + (ins.codigo ? ` - ${ins.codigo}` : '');
    card.style.marginLeft = '30px';
    return card;
  }

  document.getElementById('toStep2').addEventListener('click', () => {
    const desc = document.getElementById('prodDesc').value.trim();
    if (!desc) {
      document.getElementById('prodDesc').style.border = '1px solid red';
      return;
    }
    root.descripcion = desc;
    root.codigo = document.getElementById('prodCode').value.trim();
    productCard.innerHTML = '';
    productCard.textContent = desc + (root.codigo ? ` - ${root.codigo}` : '');
    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn';
    addBtn.title = '+ Subproducto';
    addBtn.textContent = '+';
    productCard.appendChild(addBtn);
    const children = document.createElement('div');
    children.className = 'children';
    productCard.appendChild(children);
    addBtn.addEventListener('click', () => {
      addInlineForm(productCard, (d,c) => {
        const sub = { descripcion: d, codigo: c, insumos: [] };
        root.subproductos.push(sub);
        const subCard = createSubCard(sub);
        children.appendChild(subCard);
        updateSummary();
        showToast('Subproducto creado');
      });
    });
    updateProgress(2);
  });

  document.getElementById('toStep3').addEventListener('click', () => {
    updateSummary();
    updateProgress(3);
  });

  saveBtn.addEventListener('click', () => {
    updateSummary();
    const data = {
      Tipo: 'Pieza final',
      Descripción: root.descripcion,
      Código: root.codigo,
      children: root.subproductos.map(sp => ({
        Tipo: 'Subensamble',
        Descripción: sp.descripcion,
        Código: sp.codigo,
        children: (sp.insumos || []).map(ins => ({
          Tipo: 'Insumo',
          Descripción: ins.descripcion,
          Código: ins.codigo
        }))
      }))
    };
    if (window.SinopticoEditor && SinopticoEditor.addNode) {
      SinopticoEditor.addNode({
        Tipo: data.Tipo,
        Descripción: data.Descripción,
        Código: data.Código
      }, data.children);
      showToast('Producto guardado');
      root.descripcion = '';
      root.codigo = '';
      root.subproductos = [];
      document.getElementById('prodDesc').value = '';
      document.getElementById('prodCode').value = '';
      productCard.innerHTML = '';
      updateSummary();
      updateProgress(1);
    } else {
      showToast('Error: SinopticoEditor no disponible');
    }
  });
});
