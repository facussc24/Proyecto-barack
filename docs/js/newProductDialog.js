'use strict';
import { addNode, getAll, ready } from './dataService.js';

export function initNewProductDialog() {
  const dialog = document.getElementById('dlgNuevoProducto');
  const openBtn = document.getElementById('btnNuevoProducto');
  if (!dialog ||
      !openBtn ||
      openBtn.tagName !== 'BUTTON') return;

  const clienteSelect = dialog.querySelector('#nuevoProductoCliente');
  const descInput = dialog.querySelector('#nuevoProductoDescripcion');
  const codeInput = dialog.querySelector('#nuevoProductoCodigo');
  const largoInput = dialog.querySelector('#nuevoProductoLargo');
  const anchoInput = dialog.querySelector('#nuevoProductoAncho');
  const altoInput = dialog.querySelector('#nuevoProductoAlto');
  const pesoInput = dialog.querySelector('#nuevoProductoPeso');

  openBtn.addEventListener('click', async () => {
    await ready;
    if (clienteSelect) {
      const clientes = (await getAll('sinoptico')).filter(n => n.Tipo === 'Cliente');
      clienteSelect.innerHTML = clientes
        .map(c => `<option value="${c.ID}">${c.Descripción}</option>`)
        .join('');
    }
    dialog.showModal();
  });

  const cancelBtn = dialog.querySelector('#cancelNuevoProducto');
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
    await addNode({
      ID: Date.now().toString(),
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
      Código: codeInput?.value.trim() || '',
      Largo: largoInput?.value.trim() || '',
      Ancho: anchoInput?.value.trim() || '',
      Alto: altoInput?.value.trim() || '',
      Peso: pesoInput?.value.trim() || ''
    });
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
