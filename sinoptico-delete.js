'use strict';
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('isAdmin') !== 'true') {
    alert('Debe iniciar sesión para editar');
    location.href = 'login.html';
    return;
  }

  function buildList(elem, items) {
    elem.innerHTML = '';
    items.forEach(n => {
      const li = document.createElement('li');
      li.textContent = `${n.ID} - ${n['Descripción'] || ''}`;
      const btn = document.createElement('button');
      btn.textContent = 'Eliminar';
      btn.addEventListener('click', () => {
        if (confirm(`¿Eliminar "${n['Descripción']}"?`)) {
          if (window.SinopticoEditor) {
            window.SinopticoEditor.deleteSubtree(n.ID);
            li.remove();
          }
        }
      });
      li.appendChild(btn);
      elem.appendChild(li);
    });
  }

  function search(type, query) {
    const q = (query || '').toLowerCase();
    return (window.SinopticoEditor.getNodes() || []).filter(n => {
      const t = (n.Tipo || '').toLowerCase();
      const d = (n['Descripción'] || '').toLowerCase();
      if (type === 'cliente') return t === 'cliente' && d.includes(q);
      if (type === 'producto') return ['pieza final','producto'].includes(t) && d.includes(q);
      if (type === 'insumo') return t === 'insumo' && d.includes(q);
      return false;
    });
  }


  const sClient = document.getElementById('searchClient');
  const rClient = document.getElementById('resultsClient');
  if (sClient) sClient.addEventListener('input', () =>
    buildList(rClient, search('cliente', sClient.value))
  );

  const sProd = document.getElementById('searchProduct');
  const rProd = document.getElementById('resultsProduct');
  if (sProd) sProd.addEventListener('input', () =>
    buildList(rProd, search('producto', sProd.value))
  );

  const sIns = document.getElementById('searchInsumo');
  const rIns = document.getElementById('resultsInsumo');
  if (sIns) sIns.addEventListener('input', () =>
    buildList(rIns, search('insumo', sIns.value))
  );

  document.dispatchEvent(new Event('sinoptico-mode'));
  document.addEventListener('sinoptico-loaded', () => {
    buildList(rClient, search('cliente', sClient.value));
    buildList(rProd, search('producto', sProd.value));
    buildList(rIns, search('insumo', sIns.value));
  });
  document.addEventListener('sinoptico-data-changed', () => {
    buildList(rClient, search('cliente', sClient.value));
    buildList(rProd, search('producto', sProd.value));
    buildList(rIns, search('insumo', sIns.value));
  });
  setTimeout(() => {
    buildList(rClient, []);
    buildList(rProd, []);
    buildList(rIns, []);
  }, 300);
});
