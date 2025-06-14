'use strict';
import { getAll, updateNode, deleteNode, ready } from './dataService.js';

document.addEventListener('DOMContentLoaded', () => {
  const clientFilter = document.getElementById('dbClienteFilter');
  const tipoFilter = document.getElementById('dbTipoFilter');
  const clientesBody = document.querySelector('#clientesSection tbody');
  const productosBody = document.querySelector('#productosSection tbody');
  const componentesBody = document.querySelector('#componentesSection tbody');
  const tableContainer = document.getElementById('dbTables');

  async function load() {
    await ready;
    const data = await getAll('sinoptico');
    const clientes = data.filter(d => d.Tipo === 'Cliente');
    const sel = clientFilter.value || '';
    clientFilter.innerHTML = '<option value="">Todos</option>' +
      clientes.map(c => `<option value="${c.Descripción}">${c.Descripción}</option>`).join('');
    clientFilter.value = sel;

    clientesBody.innerHTML = '';
    productosBody.innerHTML = '';
    componentesBody.innerHTML = '';
    let items = data.slice();
    if (clientFilter.value) {
      items = items.filter(i => i.Cliente === clientFilter.value || i.Descripción === clientFilter.value);
    }
    if (tipoFilter.value) {
      items = items.filter(i => i.Tipo === tipoFilter.value);
    }

    items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.Descripción || ''}</td>` +
        `<td>${item.Código || ''}</td>` +
        `<td><button class="db-edit" data-id="${item.ID}">✏️</button>` +
        `<button class="db-del" data-id="${item.ID}">🗑️</button></td>`;
      if (item.Tipo === 'Cliente') {
        clientesBody.appendChild(tr);
      } else if (item.Tipo === 'Producto') {
        productosBody.appendChild(tr);
      } else {
        componentesBody.appendChild(tr);
      }
    });
  }

  clientFilter.addEventListener('change', load);
  tipoFilter.addEventListener('change', load);

  tableContainer.addEventListener('click', async ev => {
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

  load();
});
