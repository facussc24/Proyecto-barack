'use strict';
import { getAll, addNode, updateNode, deleteNode, ready } from './dataService.js';

export function initDBManager() {
  const dlg = document.getElementById('dlgDBManager');
  const openBtn = document.getElementById('btnModificar');
  if (!dlg || !openBtn) return;
  const form = dlg.querySelector('#dbAddForm');
  const parentSel = form.querySelector('#dbParent');
  const tipoSel = form.querySelector('#dbTipo');
  const descInput = form.querySelector('#dbDesc');
  const codeInput = form.querySelector('#dbCode');
  const clientFilter = form.querySelector('#dbClienteFilter');
  const tipoFilter = form.querySelector('#dbTipoFilter');
  const tableBody = dlg.querySelector('tbody');

  function showSpinner() {
    const el = document.getElementById('loading');
    if (el) el.style.display = 'flex';
  }

  function hideSpinner() {
    const el = document.getElementById('loading');
    if (el) el.style.display = 'none';
  }

  async function load() {
    showSpinner();
    await ready;
    let data = [];
    try {
      data = await getAll('sinoptico');
      if (window.mostrarMensaje) window.mostrarMensaje('Guardado', 'success');
    } catch {
      if (window.mostrarMensaje) window.mostrarMensaje('Error al cargar');
    } finally {
      hideSpinner();
    }
    const clientes = data.filter(d => d.Tipo === 'Cliente');
    if (clientFilter) {
      const sel = clientFilter.value || '';
      clientFilter.innerHTML = '<option value="">Todos</option>' +
        clientes.map(c => `<option value="${c.Descripción}">${c.Descripción}</option>`).join('');
      clientFilter.value = sel;
    }

    tableBody.innerHTML = '';
    let items = data.slice();
    if (clientFilter && clientFilter.value) {
      items = items.filter(i => i.Cliente === clientFilter.value || i.Descripción === clientFilter.value);
    }
    if (tipoFilter && tipoFilter.value) {
      items = items.filter(i => i.Tipo === tipoFilter.value);
    }

    items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.Tipo}</td>`+
        `<td>${item.Descripción || ''}</td>` +
        `<td>${item.Código || ''}</td>` +
        `<td><button class="db-edit" data-id="${item.ID}">✏️</button>` +
        `<button class="db-del" data-id="${item.ID}">🗑️</button></td>`;
      tableBody.appendChild(tr);
    });
    parentSel.innerHTML = '<option value="">(raíz)</option>' +
      data.map(d => `<option value="${d.ID}">${d.Descripción} [${d.Tipo}]</option>`).join('');
  }

  openBtn.addEventListener('click', async () => {
    await load();
    dlg.showModal();
  });

  dlg.querySelector('#closeDBTop')?.addEventListener('click', () => dlg.close());
  
  dlg.querySelector('#closeDB')?.addEventListener('click', () => dlg.close());

  clientFilter?.addEventListener('change', load);
  tipoFilter?.addEventListener('change', load);

  tableBody.addEventListener('click', async ev => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('db-edit')) {
      const desc = prompt('Nueva descripción');
      if (desc != null) {
        showSpinner();
        await updateNode(id, { Descripción: desc });
        await load();
        hideSpinner();
        if (window.mostrarMensaje) window.mostrarMensaje('Guardado', 'success');
      }
    } else if (btn.classList.contains('db-del')) {
      if (confirm('¿Eliminar elemento?')) {
        showSpinner();
        await deleteNode(id);
        await load();
        hideSpinner();
        if (window.mostrarMensaje) window.mostrarMensaje('Guardado', 'success');
      }
    }
  });

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const newItem = {
      ID: Date.now().toString(),
      ParentID: parentSel.value,
      Tipo: tipoSel.value,
      Descripción: descInput.value.trim(),
      Cliente: '',
      Vehículo: '',
      RefInterno: '',
      versión: '',
      Imagen: '',
      Consumo: '',
      Unidad: '',
      Sourcing: '',
      Código: codeInput.value.trim()
    };
    showSpinner();
    await addNode(newItem);
    form.reset();
    await load();
    hideSpinner();
    if (window.mostrarMensaje) window.mostrarMensaje('Guardado', 'success');
  });
}

document.addEventListener('DOMContentLoaded', initDBManager);
