'use strict';
import { getAllSinoptico, subscribeSinopticoChanges } from './dataService.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[sinoptico] DOMContentLoaded');
  const loader = document.getElementById('loading');
  if (loader) loader.style.display = 'block';

  let nodes = [];
  try {
    nodes = await getAllSinoptico();
    console.log('[sinoptico] nodes obtained', nodes);
  } catch (e) {
    console.error('[sinoptico] error loading nodes', e);
  }

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
    console.log('[sinoptico] change detected');
    let updated = [];
    try {
      updated = await getAllSinoptico();
    } catch (e) {
      console.error('[sinoptico] error refreshing nodes', e);
      return;
    }
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
