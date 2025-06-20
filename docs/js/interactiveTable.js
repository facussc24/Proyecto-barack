'use strict';
import { getAll, updateNode, deleteNode, ready } from './dataService.js';

let table;
let allData = [];
let currentFilter = '';

function getImageHTML(code) {
  const sanitized = String(code || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (!sanitized) return '';
  const src = `imagenes_sinoptico/${sanitized}.jpg`;
  return `<img src="${src}" alt="${code}" style="max-width:60px;">`;
}

function actionsFormatter(cell) {
  const data = cell.getRow().getData();
  const toggleTitle = data.Desactivado ? 'Reactivar' : 'Desactivar';
  const toggleIcon = data.Desactivado ? '✅' : '🚫';
  return `
    <button class="toggle-status" data-id="${data.ID}" title="${toggleTitle}">${toggleIcon}</button>
    <button class="delete-row" data-id="${data.ID}" title="Eliminar">🗑️</button>`;
}

async function loadData() {
  await ready;
  allData = await getAll('sinoptico');
  applyFilter();
}

function applyFilter() {
  let rows = allData.slice();
  if (currentFilter === 'Desactivado') {
    rows = rows.filter(r => r.Desactivado);
  } else if (currentFilter) {
    rows = rows.filter(r => r.Tipo === currentFilter && !r.Desactivado);
  }
  table.replaceData(rows);
}

function setupFilterButtons() {
  const btns = document.querySelectorAll('.db-tabs button');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.type || '';
      applyFilter();
    });
  });
}

function setupSearch() {
  const input = document.getElementById('globalSearch');
  if (!input) return;
  input.addEventListener('input', () => {
    const value = input.value.trim();
    if (value) {
      table.setFilter(customSearch, { term: value });
    } else {
      table.clearFilter(customSearch);
    }
  });
}

function customSearch(data, filterParams) {
  const term = filterParams.term.toLowerCase();
  return Object.values(data).some(v => String(v).toLowerCase().includes(term));
}

function setupActions() {
  const container = document.getElementById('dbTable');
  container.addEventListener('click', async ev => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('delete-row')) {
      if (confirm('¿Eliminar elemento?')) {
        await deleteNode(id);
        await loadData();
      }
    } else if (btn.classList.contains('toggle-status')) {
      const row = allData.find(r => r.ID === id);
      if (!row) return;
      const newState = !row.Desactivado;
      const msg = newState ? '¿Desactivar elemento?' : '¿Reactivar elemento?';
      if (confirm(msg)) {
        await updateNode(id, { Desactivado: newState });
        await loadData();
      }
    }
  });
}

function initTable() {
  table = new Tabulator('#dbTable', {
    layout: 'fitColumns',
    pagination: 'local',
    paginationSize: 10,
    reactiveData: true,
    columns: [
      { title: 'Descripción', field: 'Descripción', headerSort: true },
      { title: 'Código', field: 'Código', headerSort: true },
      { title: 'Largo', field: 'Largo', sorter: 'number' },
      { title: 'Ancho', field: 'Ancho', sorter: 'number' },
      { title: 'Alto', field: 'Alto', sorter: 'number' },
      { title: 'Peso', field: 'Peso', sorter: 'number' },
      { title: 'Imagen', field: 'Código', formatter: cell => getImageHTML(cell.getValue()), hozAlign: 'center' },
      { title: 'Acciones', formatter: actionsFormatter, hozAlign: 'center', headerSort: false },
    ],
  });
}

export function initInteractiveTable() {
  initTable();
  setupFilterButtons();
  setupSearch();
  setupActions();
  loadData();
}

document.addEventListener('DOMContentLoaded', initInteractiveTable);
