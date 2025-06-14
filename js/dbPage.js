'use strict';
import { getAll, addNode, updateNode, deleteNode, ready } from './dataService.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('dbAddForm');
  const parentSel = form.querySelector('#dbParent');
  const tipoSel = form.querySelector('#dbTipo');
  const descInput = form.querySelector('#dbDesc');
  const codeInput = form.querySelector('#dbCode');
  const clientFilter = document.getElementById('dbClienteFilter');
  const tipoFilter = document.getElementById('dbTipoFilter');
  const tableBody = document.querySelector('.db-table tbody');

  async function load() {
    await ready;
    const data = await getAll('sinoptico');
    const clientes = data.filter(d => d.Tipo === 'Cliente');
    const sel = clientFilter.value || '';
    clientFilter.innerHTML = '<option value="">Todos</option>' +
      clientes.map(c => `<option value="${c.Descripción}">${c.Descripción}</option>`).join('');
    clientFilter.value = sel;

    tableBody.innerHTML = '';
    let items = data.slice();
    if (clientFilter.value) {
      items = items.filter(i => i.Cliente === clientFilter.value || i.Descripción === clientFilter.value);
    }
    if (tipoFilter.value) {
      items = items.filter(i => i.Tipo === tipoFilter.value);
    }

    items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.Tipo}</td>` +
        `<td>${item.Descripción || ''}</td>` +
        `<td>${item.Código || ''}</td>` +
        `<td></td>` +
        `<td></td>` +
        `<td><button class="db-edit" data-id="${item.ID}">✏️</button>` +
        `<button class="db-del" data-id="${item.ID}">🗑️</button></td>`;
      tableBody.appendChild(tr);
    });
    parentSel.innerHTML = '<option value="">(raíz)</option>' +
      data.map(d => `<option value="${d.ID}">${d.Descripción} [${d.Tipo}]</option>`).join('');
  }

  clientFilter.addEventListener('change', load);
  tipoFilter.addEventListener('change', load);

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

  load();
});
