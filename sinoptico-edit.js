document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('isAdmin') !== 'true') {
    alert('Debe iniciar sesión para editar');
    location.href = 'login.html';
    return;
  }

  const cForm = document.getElementById('clientForm');
  const pForm = document.getElementById('productForm');
  const sForm = document.getElementById('subForm');
  const iForm = document.getElementById('insForm');

  const prodClient = document.getElementById('prodClient');
  const subParent = document.getElementById('subParent');
  const insParent = document.getElementById('insParent');

  function fillOptions() {
    if (!window.SinopticoEditor || !SinopticoEditor.getNodes) return;
    const nodes = SinopticoEditor.getNodes();
    const clients = nodes.filter(n => (n.Tipo || '').toLowerCase() === 'cliente');
    const subParentsList = nodes.filter(n => ['pieza final','producto','subensamble'].includes((n.Tipo||'').toLowerCase()));

    function populate(sel, list) {
      if (!sel) return;
      sel.innerHTML = '';
      list.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n.ID;
        opt.textContent = `${n.ID} - ${n['Descripción'] || ''}`;
        sel.appendChild(opt);
      });
    }

    populate(prodClient, clients);
    populate(subParent, subParentsList);
    populate(insParent, subParentsList);

    const hasProducts = subParentsList.length > 0;
    const sBtn = sForm.querySelector('button[type="submit"]');
    const iBtn = iForm.querySelector('button[type="submit"]');
    if (sBtn) sBtn.disabled = !hasProducts;
    if (iBtn) iBtn.disabled = !hasProducts;
  }

  function askChildren(parentId) {
    if (!parentId) return;
    while (true) {
      const desc = prompt('Descripción del hijo (Cancelar para terminar)');
      if (!desc) break;
      const tipo = prompt('Tipo: S=subensamble, I=insumo', 'I');
      if (!tipo) break;
      if (tipo.toUpperCase().startsWith('I')) {
        SinopticoEditor.addNode({ ParentID: parentId, Tipo: 'Insumo', Descripción: desc });
      } else {
        const id = SinopticoEditor.addNode({ ParentID: parentId, Tipo: 'Subensamble', Descripción: desc });
        if (confirm('¿Desea agregar subelementos a "' + desc + '"? (Aceptar=Sí / Cancelar=No)'))
          askChildren(id);
      }
    }
  }

  cForm.addEventListener('submit', e => {
    e.preventDefault();
    const desc = document.getElementById('clientDesc').value.trim();
    if (!desc) return;
    SinopticoEditor.addNode({ Tipo: 'Cliente', Descripción: desc, Cliente: desc });
    cForm.reset();
    fillOptions();
    if (window.mostrarMensaje)
      window.mostrarMensaje('Cliente agregado exitosamente!', 'success');
  });

  pForm.addEventListener('submit', e => {
    e.preventDefault();
    const parent = prodClient.value;
    const desc = document.getElementById('prodDesc').value.trim();
    if (!desc) return;
    const id = SinopticoEditor.addNode({ ParentID: parent, Tipo: 'Pieza final', Descripción: desc });
    pForm.reset();
    fillOptions();
    if (confirm('¿Desea agregar subproductos? (Aceptar=Sí / Cancelar=No)')) {
      askChildren(id);
      if (window.mostrarMensaje)
        window.mostrarMensaje('Producto y subproductos agregados!', 'success');
    } else {
      if (window.mostrarMensaje)
        window.mostrarMensaje('Producto agregado exitosamente!', 'success');
    }
  });

  sForm.addEventListener('submit', e => {
    e.preventDefault();
    const parent = subParent.value;
    const desc = document.getElementById('subDesc').value.trim();
    if (!parent) {
      if (window.mostrarMensaje) window.mostrarMensaje('Seleccione un padre', 'warning');
      return;
    }
    if (!desc) return;
    const id = SinopticoEditor.addNode({ ParentID: parent, Tipo: 'Subensamble', Descripción: desc });
    sForm.reset();
    fillOptions();
    if (confirm('¿Agregar subelementos a este subensamble? (Aceptar=Sí / Cancelar=No)')) {
      askChildren(id);
      if (window.mostrarMensaje)
        window.mostrarMensaje('Subensamble y subelementos agregados!', 'success');
    } else {
      if (window.mostrarMensaje)
        window.mostrarMensaje('Subensamble agregado exitosamente!', 'success');
    }
  });

  iForm.addEventListener('submit', e => {
    e.preventDefault();
    const parent = insParent.value;
    const desc = document.getElementById('insDesc').value.trim();
    const code = document.getElementById('insCode').value.trim();
    if (!parent) {
      if (window.mostrarMensaje) window.mostrarMensaje('Seleccione un padre', 'warning');
      return;
    }
    if (!desc) return;
    SinopticoEditor.addNode({ ParentID: parent, Tipo: 'Insumo', Descripción: desc, Código: code });
    iForm.reset();
    fillOptions();
    if (window.mostrarMensaje)
      window.mostrarMensaje('Insumo agregado exitosamente!', 'success');
  });

  document.addEventListener('sinoptico-mode', fillOptions);
  setTimeout(fillOptions, 300);
});
