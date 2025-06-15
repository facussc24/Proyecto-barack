'use strict';
import { getAll, updateNode, deleteNode, ready } from './dataService.js';

document.addEventListener('DOMContentLoaded', () => {
  const clientFilter = document.getElementById('dbClienteFilter');
  const tipoFilter = document.getElementById('dbTipoFilter');
  const clientesBody = document.querySelector('#clientesSection tbody');
  const productosBody = document.querySelector('#productosSection tbody');
  const subproductosBody = document.querySelector('#subproductosSection tbody');
  const insumosBody = document.querySelector('#insumosSection tbody');
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
    subproductosBody.innerHTML = '';
    insumosBody.innerHTML = '';
    let items = data.slice();
    if (clientFilter.value) {
      items = items.filter(i => i.Cliente === clientFilter.value || i.Descripción === clientFilter.value);
    }
    if (tipoFilter.value) {
      items = items.filter(i => i.Tipo === tipoFilter.value);
    }

    items.forEach(item => {
      const tr = document.createElement('tr');
      if (item.Tipo === 'Cliente') {
        tr.innerHTML = `<td>${item.Descripción || ''}</td>` +
          `<td>${item.Código || ''}</td>` +
          `<td><button class="db-edit" data-id="${item.ID}">✏️</button>` +
          `<button class="db-del" data-id="${item.ID}">🗑️</button></td>`;
        clientesBody.appendChild(tr);
      } else if (item.Tipo === 'Producto') {
        tr.innerHTML =
          `<td>${item.Descripción || ''}</td>` +
          `<td>${item.Código || ''}</td>` +
          `<td>${item.Largo || ''}</td>` +
          `<td>${item.Ancho || ''}</td>` +
          `<td>${item.Alto || ''}</td>` +
          `<td>${item.Peso || ''}</td>` +
          `<td><button class="db-edit" data-id="${item.ID}">✏️</button>` +
          `<button class="db-del" data-id="${item.ID}">🗑️</button></td>`;
        productosBody.appendChild(tr);
      } else if (item.Tipo === 'Insumo') {
        tr.innerHTML =
          `<td>${item.Unidad || ''}</td>` +
          `<td>${item.Proveedor || ''}</td>` +
          `<td>${item.Descripción || ''}</td>` +
          `<td>${item.Código || ''}</td>` +
          `<td>${item.Material || ''}</td>` +
          `<td>${item.Observaciones || ''}</td>` +
          `<td>${item.Sourcing || ''}</td>` +
          `<td><button class="db-edit" data-id="${item.ID}">✏️</button>` +
          `<button class="db-del" data-id="${item.ID}">🗑️</button></td>`;
        insumosBody.appendChild(tr);
      } else {
        // Subproducto o cualquier otro
        tr.innerHTML = `<td>${item.Descripción || ''}</td>` +
          `<td>${item.Código || ''}</td>` +
          `<td><button class="db-edit" data-id="${item.ID}">✏️</button>` +
          `<button class="db-del" data-id="${item.ID}">🗑️</button></td>`;
        subproductosBody.appendChild(tr);
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
