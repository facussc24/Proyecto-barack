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
  const tableBody = dlg.querySelector('tbody');

  async function load() {
    await ready;
    const data = await getAll('sinoptico');
    tableBody.innerHTML = '';
    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.ID}</td><td>${item.ParentID || ''}</td>` +
        `<td>${item.Tipo}</td><td>${item.Descripción || ''}</td>` +
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

  dlg.querySelector('#closeDB')?.addEventListener('click', () => dlg.close());

  tableBody.addEventListener('click', async ev => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('db-edit')) {
      const desc = prompt('Nueva descripción');
      if (desc != null) {
        await updateNode(id, { Descripción: desc });
        await load();
      }
    } else if (btn.classList.contains('db-del')) {
      if (confirm('¿Eliminar elemento?')) {
        await deleteNode(id);
        await load();
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
    await addNode(newItem);
    form.reset();
    await load();
  });
}

document.addEventListener('DOMContentLoaded', initDBManager);
