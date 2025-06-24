'use strict';
import { addNode, getAll, ready } from './dataService.js';

export function initNewSubDialog() {
  const dialog = document.getElementById('dlgNuevoSub');
  const openBtn = document.getElementById('btnNuevoSub');
  if (!dialog || !openBtn) return;

  const parentSelect = dialog.querySelector('#nuevoSubParent');
  const descInput = dialog.querySelector('#nuevoSubDescripcion');
  const codeInput = dialog.querySelector('#nuevoSubCodigo');

  openBtn.addEventListener('click', async () => {
    await ready;
    if (parentSelect) {
      const nodes = await getAll('sinoptico');
      const padres = nodes.filter(n =>
        n.Tipo === 'Producto' || n.Tipo === 'Pieza final' || n.Tipo === 'Subproducto'
      );
      parentSelect.innerHTML = padres
        .map(p => `<option value="${p.ID}">${p.Descripción}</option>`)
        .join('');
    }
    dialog.showModal();
  });

  dialog.querySelector('#cancelNuevoSub')?.addEventListener('click', () => dialog.close());

  const form = dialog.querySelector('form');
  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const parentId = parentSelect?.value;
    const desc = descInput?.value.trim();
    if (!parentId || !desc) return;
    await addNode({
      ID: Date.now().toString(),
      ParentID: parentId,
      Tipo: 'Subproducto',
      Descripción: desc,
      Cliente: '',
      Vehículo: '',
      RefInterno: '',
      versión: '',
      Imagen: '',
      Consumo: '',
      Unidad: '',
      Sourcing: '',
      Código: codeInput?.value.trim() || ''
    });
    if (typeof window.mostrarMensaje === 'function') {
      window.mostrarMensaje('Subproducto creado con éxito', 'success');
    }
    if (form) form.reset();
    dialog.close();
  });
}

if (typeof window !== 'undefined') {
  window.initNewSubDialog = initNewSubDialog;
  document.addEventListener('DOMContentLoaded', initNewSubDialog);
}
