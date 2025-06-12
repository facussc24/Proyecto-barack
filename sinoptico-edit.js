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
    const prodParents = nodes.filter(n => ['pieza final','producto'].includes((n.Tipo||'').toLowerCase()) || (n.Tipo||'').toLowerCase() === 'cliente');
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
        if (confirm('¿Agregar hijos para ' + desc + '?')) askChildren(id);
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
  });

  pForm.addEventListener('submit', e => {
    e.preventDefault();
    const parent = prodClient.value;
    const desc = document.getElementById('prodDesc').value.trim();
    const seq = document.getElementById('prodSeq').value.trim();
    if (!desc) return;
    const id = SinopticoEditor.addNode({ ParentID: parent, Tipo: 'Pieza final', Secuencia: seq, Descripción: desc });
    pForm.reset();
    fillOptions();
    if (confirm('¿Desea agregar subelementos al producto?')) askChildren(id);
  });

  sForm.addEventListener('submit', e => {
    e.preventDefault();
    const parent = subParent.value;
    const desc = document.getElementById('subDesc').value.trim();
    const seq = document.getElementById('subSeq').value.trim();
    if (!desc) return;
    const id = SinopticoEditor.addNode({ ParentID: parent, Tipo: 'Subensamble', Secuencia: seq, Descripción: desc });
    sForm.reset();
    fillOptions();
    if (confirm('¿Agregar subelementos a este subensamble?')) askChildren(id);
  });

  iForm.addEventListener('submit', e => {
    e.preventDefault();
    const parent = insParent.value;
    const desc = document.getElementById('insDesc').value.trim();
    const seq = document.getElementById('insSeq').value.trim();
    const code = document.getElementById('insCode').value.trim();
    if (!desc) return;
    SinopticoEditor.addNode({ ParentID: parent, Tipo: 'Insumo', Secuencia: seq, Descripción: desc, Código: code });
    iForm.reset();
    fillOptions();
  });

  document.addEventListener('sinoptico-mode', fillOptions);
  setTimeout(fillOptions, 300);
});
