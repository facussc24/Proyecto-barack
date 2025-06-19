'use strict';
import { addNode, getAll, ready } from './dataService.js';

export function initNewInsumoDialog() {
  const dialog = document.getElementById('dlgNuevoInsumo');
  const openBtn = document.getElementById('btnNuevoInsumo');
  if (!dialog || !openBtn) return;

  const parentSelect = dialog.querySelector('#nuevoInsumoParent');
  const unidadInput = dialog.querySelector('#nuevoInsumoUnidad');
  const proveedorInput = dialog.querySelector('#nuevoInsumoProveedor');
  const descInput = dialog.querySelector('#nuevoInsumoDescripcion');
  const codeInput = dialog.querySelector('#nuevoInsumoCodigo');
  const materialInput = dialog.querySelector('#nuevoInsumoMaterial');
  const obsInput = dialog.querySelector('#nuevoInsumoObservaciones');
  const origenInput = dialog.querySelector('#nuevoInsumoOrigen');

  openBtn.addEventListener('click', async () => {
    await ready;
    if (parentSelect) {
      const nodes = await getAll('sinoptico');
      const padres = nodes.filter(n => n.Tipo === 'Producto' || n.Tipo === 'Subproducto');
      parentSelect.innerHTML = padres
        .map(p => `<option value="${p.ID}">${p.Descripción}</option>`)
        .join('');
    }
    dialog.showModal();
  });

  dialog.querySelector('#cancelNuevoInsumo')?.addEventListener('click', () => dialog.close());

  const form = dialog.querySelector('form');
  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const parentId = parentSelect?.value;
    const desc = descInput?.value.trim();
    if (!parentId || !desc) return;
    await addNode({
      ID: Date.now().toString(),
      ParentID: parentId,
      Tipo: 'Insumo',
      Descripción: desc,
      Cliente: '',
      Vehículo: '',
      RefInterno: '',
      versión: '',
      Imagen: '',
      Consumo: '',
      Unidad: unidadInput?.value.trim() || '',
      Proveedor: proveedorInput?.value.trim() || '',
      Material: materialInput?.value.trim() || '',
      Observaciones: obsInput?.value.trim() || '',
      Sourcing: origenInput?.value.trim() || '',
      Código: codeInput?.value.trim() || ''
    });
    if (typeof window.mostrarMensaje === 'function') {
      window.mostrarMensaje('Insumo creado con éxito', 'success');
    }
    if (form) form.reset();
    dialog.close();
    document.dispatchEvent(new Event('sinopticoUpdated'));
  });
}

if (typeof window !== 'undefined') {
  window.initNewInsumoDialog = initNewInsumoDialog;
  document.addEventListener('DOMContentLoaded', initNewInsumoDialog);
}
