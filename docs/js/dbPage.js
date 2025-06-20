'use strict';
import { getAll, updateNode, deleteNode, ready } from './dataService.js';
import { animateInsert } from './ui/animations.js';

document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.db-tabs button');
  let activeType = '';
  const clientesBody = document.querySelector('#clientesSection tbody');
  const productosBody = document.querySelector('#productosSection tbody');
  const subproductosBody = document.querySelector('#subproductosSection tbody');
  const insumosBody = document.querySelector('#insumosSection tbody');
  const desactivadosBody = document.querySelector('#desactivadosSection tbody');
  const clientesSection = document.getElementById('clientesSection');
  const productosSection = document.getElementById('productosSection');
  const subproductosSection = document.getElementById('subproductosSection');
  const insumosSection = document.getElementById('insumosSection');
  const desactivadosSection = document.getElementById('desactivadosSection');
  const tableContainer = document.getElementById('dbTables');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeType = btn.dataset.type || '';
      load();
    });
  });

  async function load() {
    await ready;
    const data = await getAll('sinoptico');
    clientesBody.innerHTML = '';
    productosBody.innerHTML = '';
    subproductosBody.innerHTML = '';
    insumosBody.innerHTML = '';
    desactivadosBody.innerHTML = '';

    const sections = {
      Cliente: clientesSection,
      Producto: productosSection,
      Subproducto: subproductosSection,
      Insumo: insumosSection,
      Desactivado: desactivadosSection
    };
    Object.values(sections).forEach(s => (s.style.display = ''));
    let items = data.slice();
    if (activeType && activeType !== 'Desactivado') {
      items = items.filter(i => i.Tipo === activeType && !i.Desactivado);
      Object.keys(sections).forEach(k => {
        sections[k].style.display = k === activeType ? '' : 'none';
      });
    } else if (activeType === 'Desactivado') {
      items = items.filter(i => i.Desactivado);
      Object.keys(sections).forEach(k => {
        sections[k].style.display = k === 'Desactivado' ? '' : 'none';
      });
    } else {
      // Sin filtro: mostrar activos y desactivados
    }

    items.forEach(item => {
      const tr = document.createElement('tr');
      const actBtn = item.Desactivado
        ? `<button class="db-activate" data-id="${item.ID}">✅</button>`
        : `<button class="db-deact" data-id="${item.ID}">🚫</button>`;
      if (item.Tipo === 'Cliente') {
        tr.innerHTML =
          `<td data-edit="Descripción" data-id="${item.ID}">${item.Descripción || ''}</td>` +
          `<td data-edit="Código" data-id="${item.ID}">${item.Código || ''}</td>` +
          `<td>${actBtn}<button class="db-del" data-id="${item.ID}">🗑️</button></td>`;
      } else if (item.Tipo === 'Producto') {
        tr.innerHTML =
          `<td data-edit="Descripción" data-id="${item.ID}">${item.Descripción || ''}</td>` +
          `<td data-edit="Código" data-id="${item.ID}">${item.Código || ''}</td>` +
          `<td data-edit="Largo" data-id="${item.ID}">${item.Largo || ''}</td>` +
          `<td data-edit="Ancho" data-id="${item.ID}">${item.Ancho || ''}</td>` +
          `<td data-edit="Alto" data-id="${item.ID}">${item.Alto || ''}</td>` +
          `<td data-edit="Peso" data-id="${item.ID}">${item.Peso || ''}</td>` +
          `<td><button class="view-img-btn" data-cod="${item.Código}">Ver</button></td>` +
          `<td>${actBtn}<button class="db-del" data-id="${item.ID}">🗑️</button></td>`;
      } else if (item.Tipo === 'Insumo') {
        tr.innerHTML =
          `<td data-edit="Unidad" data-id="${item.ID}">${item.Unidad || ''}</td>` +
          `<td data-edit="Proveedor" data-id="${item.ID}">${item.Proveedor || ''}</td>` +
          `<td data-edit="Descripción" data-id="${item.ID}">${item.Descripción || ''}</td>` +
          `<td data-edit="Código" data-id="${item.ID}">${item.Código || ''}</td>` +
          `<td data-edit="Material" data-id="${item.ID}">${item.Material || ''}</td>` +
          `<td data-edit="Observaciones" data-id="${item.ID}">${item.Observaciones || ''}</td>` +
          `<td data-edit="Sourcing" data-id="${item.ID}">${item.Sourcing || ''}</td>` +
          `<td><button class="view-img-btn" data-cod="${item.Código}">Ver</button></td>` +
          `<td>${actBtn}<button class="db-del" data-id="${item.ID}">🗑️</button></td>`;
      } else {
        // Subproducto o cualquier otro
        tr.innerHTML =
          `<td data-edit="Descripción" data-id="${item.ID}">${item.Descripción || ''}</td>` +
          `<td data-edit="Código" data-id="${item.ID}">${item.Código || ''}</td>` +
          `<td>${actBtn}<button class="db-del" data-id="${item.ID}">🗑️</button></td>`;
      }

      let target = desactivadosBody;
      if (!item.Desactivado) {
        if (item.Tipo === 'Cliente') target = clientesBody;
        else if (item.Tipo === 'Producto') target = productosBody;
        else if (item.Tipo === 'Insumo') target = insumosBody;
        else target = subproductosBody;
      }
      target.appendChild(tr);
      animateInsert(tr);
    });
  }


  tableContainer.addEventListener('click', async ev => {
    const btn = ev.target.closest('button');
    if (btn) {
      const id = btn.dataset.id;
      if (btn.classList.contains('db-del')) {
        if (confirm('¿Eliminar elemento?')) {
          await deleteNode(id);
          await load();
        }
      } else if (btn.classList.contains('db-deact')) {
        if (confirm('¿Desactivar elemento?')) {
          await updateNode(id, { Desactivado: true });
          await load();
        }
      } else if (btn.classList.contains('db-activate')) {
        if (confirm('¿Reactivar elemento?')) {
          await updateNode(id, { Desactivado: false });
          await load();
        }
      } else if (btn.classList.contains('view-img-btn')) {
        const code = btn.dataset.cod || '';
        const sanitized = code.replace(/[^a-z0-9]/gi, '').toLowerCase();
        const src = sanitized ? `imagenes_sinoptico/${sanitized}.jpg` : '';
        if (window.showImageModal) window.showImageModal(src);
      }
      return;
    }

    const cell = ev.target.closest('td[data-edit]');
    if (!cell) return;
    cell.contentEditable = 'true';
    cell.focus();
    const original = cell.textContent;
    function finishEdit(ev2) {
      if (ev2.type === 'keydown' && ev2.key !== 'Enter') return;
      ev2.preventDefault();
      cell.removeEventListener('blur', finishEdit);
      cell.removeEventListener('keydown', finishEdit);
      cell.contentEditable = 'false';
      const value = cell.textContent.trim();
      if (value === original) return;
      if (confirm(`¿Aplicar el nuevo valor "${value}"?`)) {
        const field = cell.dataset.edit;
        updateNode(cell.dataset.id, { [field]: value }).then(load);
      } else {
        cell.textContent = original;
      }
    }
    cell.addEventListener('blur', finishEdit);
    cell.addEventListener('keydown', finishEdit);
  });

  load();
});
