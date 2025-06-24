'use strict';
import { addNode, ready } from './dataService.js';

export function initNewClientDialog() {
  const dialog = document.getElementById('dlgNuevoCliente');
  const openBtn = document.getElementById('btnNuevoCliente');
  if (!dialog || !openBtn) return;

  openBtn.addEventListener('click', () => dialog.showModal());

  const form = dialog.querySelector('form');
  const cancelBtn = dialog.querySelector('button[type="button"]');
  cancelBtn?.addEventListener('click', () => dialog.close());

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const input = dialog.querySelector('#nuevoClienteNombre');
    const nombre = input.value.trim();
    if (!nombre) return;
    await ready;
    await addNode({
      ID: Date.now().toString(),
      ParentID: '',
      Tipo: 'Cliente',
      Descripción: nombre,
      Cliente: nombre,
      Vehículo: '',
      RefInterno: '',
      versión: '',
      Imagen: '',
      Consumo: '',
      Unidad: '',
      Sourcing: '',
      Código: ''
    });
    if (typeof window.mostrarMensaje === 'function') {
      window.mostrarMensaje('Cliente creado con éxito', 'success');
    }
    input.value = '';
    dialog.close();
  });
}

if (typeof window !== 'undefined') {
  window.initNewClientDialog = initNewClientDialog;
  document.addEventListener('DOMContentLoaded', initNewClientDialog);
}
