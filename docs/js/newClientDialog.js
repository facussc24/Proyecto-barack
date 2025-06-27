'use strict';

export function initNewClientDialog() {
  const dialog = document.getElementById('dlgNuevoCliente');
  const openBtn = document.getElementById('btnNuevoCliente');
  if (!dialog || !openBtn) return;

  const form = dialog.querySelector('form');
  const input = dialog.querySelector('#nuevoClienteNombre');
  const submitBtn = form?.querySelector('button[type="submit"]');

  openBtn.addEventListener('click', () => {
    if (input) input.disabled = false;
    if (submitBtn) submitBtn.disabled = false;
    dialog.showModal();
    input?.focus();
  });

  fetch('/api/clientes').catch(() => {});

  const cancelBtn = dialog.querySelector('button[type="button"]');
  cancelBtn?.addEventListener('click', () => dialog.close());

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (!input) return;
    const nombre = input.value.trim();
    if (!nombre) {
      alert('El nombre es obligatorio');
      return;
    }
    input.disabled = true;
    submitBtn && (submitBtn.disabled = true);
    let resp;
    try {
      resp = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nombre })
      });
      if (!resp.ok) throw new Error('bad status');
      input.disabled = false;
      submitBtn && (submitBtn.disabled = false);
      input.value = '';
      dialog.close();
    } catch (e) {
      alert('Error al crear cliente');
    }
  });
}

if (typeof window !== 'undefined') {
  window.initNewClientDialog = initNewClientDialog;
  document.addEventListener('DOMContentLoaded', initNewClientDialog);
}
