'use strict';
import { getAllSinoptico, subscribeSinopticoChanges } from './dataService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loader = document.getElementById('loading');
  if (loader) loader.style.display = 'block';

  const nodes = await getAllSinoptico();
  console.log('▷ nodos obtenidos', nodes);

  const tbody = document.getElementById('sinopticoBody');
  if (tbody) {
    tbody.innerHTML = '';
    if (!nodes.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="8">No hay productos</td>`;
      tbody.appendChild(tr);
    } else {
      nodes.forEach(n => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${n.id}</td>
          <td>${n.parentId}</td>
          <td>${n.nombre}</td>
          <td>${n.orden}</td>
          <td>
            <button data-id="${n.id}" class="edit">Editar</button>
            <button data-id="${n.id}" class="delete">Borrar</button>
          </td>`;
        tbody.appendChild(tr);
      });
    }
  }

  if (loader) loader.style.display = 'none';
  console.log('▶ spinner oculto');

  subscribeSinopticoChanges(async () => {
    const updated = await getAllSinoptico();
    const body = document.getElementById('sinopticoBody');
    if (body) {
      body.innerHTML = '';
      if (!updated.length) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="8">No hay productos</td>`;
        body.appendChild(tr);
      } else {
        updated.forEach(n => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${n.id}</td>
            <td>${n.parentId}</td>
            <td>${n.nombre}</td>
            <td>${n.orden}</td>
            <td>
              <button data-id="${n.id}" class="edit">Editar</button>
              <button data-id="${n.id}" class="delete">Borrar</button>
            </td>`;
          body.appendChild(tr);
        });
      }
    }
  });
});
