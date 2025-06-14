'use strict';
import { addNode, getAll, ready } from './dataService.js';

export function initNewProductDialog() {
  const dialog = document.getElementById('dlgNuevoProducto');
  const openBtn = document.getElementById('btnArbol');
  if (!dialog || !openBtn) return;

  const clienteSelect = dialog.querySelector('#nuevoProductoCliente');
  const descInput = dialog.querySelector('#nuevoProductoDescripcion');
  const codeInput = dialog.querySelector('#nuevoProductoCodigo');
  const subList = dialog.querySelector('#subproductList');
  const addSubBtn = dialog.querySelector('#addSubproduct');

  function addSubRow() {
    if (!subList) return;
    const div = document.createElement('div');
    div.className = 'subproduct-item';
    div.innerHTML = `<input type="text" class="subDesc" placeholder="Descripción"> ` +
      `<input type="text" class="subCode" placeholder="Código"> ` +
      `<button type="button" class="removeSub">×</button>`;
    div.querySelector('.removeSub').onclick = () => div.remove();
    subList.appendChild(div);
  }

  addSubBtn?.addEventListener('click', addSubRow);

  openBtn.addEventListener('click', async () => {
    await ready;
    if (clienteSelect) {
      const clientes = (await getAll('sinoptico')).filter(n => n.Tipo === 'Cliente');
      clienteSelect.innerHTML = clientes
        .map(c => `<option value="${c.ID}">${c.Descripción}</option>`)
        .join('');
    }
    if (subList) subList.innerHTML = '';
    dialog.showModal();
  });

  const cancelBtn = dialog.querySelector('button[type="button"]');
  cancelBtn?.addEventListener('click', () => dialog.close());

  const form = dialog.querySelector('form');
  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const clienteId = clienteSelect?.value;
    const desc = descInput?.value.trim();
    if (!clienteId || !desc) return;
    await ready;
    const clientes = await getAll('sinoptico');
    const cliente = clientes.find(c => String(c.ID) === String(clienteId));
    const baseId = Date.now().toString();
    await addNode({
      ID: baseId,
      ParentID: clienteId,
      Tipo: 'Producto',
      Descripción: desc,
      Cliente: cliente?.Descripción || '',
      Vehículo: '',
      RefInterno: '',
      versión: '',
      Imagen: '',
      Consumo: '',
      Unidad: '',
      Sourcing: '',
      Código: codeInput?.value.trim() || ''
    });
    if (subList) {
      const rows = Array.from(subList.querySelectorAll('.subproduct-item'));
      rows.forEach((row, idx) => {
        const sDesc = row.querySelector('.subDesc')?.value.trim();
        if (!sDesc) return;
        const sCode = row.querySelector('.subCode')?.value.trim() || '';
        addNode({
          ID: `${baseId}-${idx+1}`,
          ParentID: baseId,
          Tipo: 'Subproducto',
          Descripción: sDesc,
          Cliente: cliente?.Descripción || '',
          Vehículo: '',
          RefInterno: '',
          versión: '',
          Imagen: '',
          Consumo: '',
          Unidad: '',
          Sourcing: '',
          Código: sCode
        });
      });
    }
    if (typeof window.mostrarMensaje === 'function') {
      window.mostrarMensaje('Producto creado con éxito', 'success');
    }
    if (form) form.reset();
    dialog.close();
    document.dispatchEvent(new Event('sinopticoUpdated'));
  });
}

if (typeof window !== 'undefined') {
  window.initNewProductDialog = initNewProductDialog;
  document.addEventListener('DOMContentLoaded', initNewProductDialog);
}
