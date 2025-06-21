'use strict';
import { getAll, updateNode, deleteNode, ready } from './dataService.js';

function showToast(msg) {
  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

let table;
let allData = [];
// Active dataset filters. Empty array means "all".
let selectedFilters = [];
const skeleton = document.getElementById('tableSkeleton');
const searchSpinner = document.getElementById('searchSpinner');

if (skeleton) {
  skeleton.innerHTML = Array.from({ length: 8 })
    .map(() => '<div class="skeleton skeleton-table-row"></div>')
    .join('');
}

function closeModal(dialog) {
  dialog.classList.add('closing');
  dialog.addEventListener('transitionend', () => dialog.close(), { once: true });
}

const columnSets = {
  '': [
    { title: 'Tipo', field: 'Tipo', headerSort: true },
    { title: 'Descripción', field: 'Descripción', headerSort: true },
    { title: 'Código', field: 'Código', headerSort: true },
    { title: 'Acciones', formatter: actionsFormatter, hozAlign: 'center', headerSort: false },
  ],
  Cliente: [
    { title: 'Descripción', field: 'Descripción', headerSort: true },
    { title: 'Código', field: 'Código', headerSort: true },
    { title: 'Acciones', formatter: actionsFormatter, hozAlign: 'center', headerSort: false },
  ],
  Producto: [
    { title: 'Descripción', field: 'Descripción', headerSort: true },
    { title: 'Código', field: 'Código', headerSort: true },
    { title: 'Largo', field: 'Largo', headerSort: true },
    { title: 'Ancho', field: 'Ancho', headerSort: true },
    { title: 'Alto', field: 'Alto', headerSort: true },
    { title: 'Peso', field: 'Peso', headerSort: true },
    { title: 'Imagen', field: 'imagen_path', formatter: cell => getImageHTML(cell.getValue()), hozAlign: 'center', headerSort: false },
    { title: 'Acciones', formatter: actionsFormatter, hozAlign: 'center', headerSort: false },
  ],
  Subproducto: [
    { title: 'Descripción', field: 'Descripción', headerSort: true },
    { title: 'Código', field: 'Código', headerSort: true },
    { title: 'Acciones', formatter: actionsFormatter, hozAlign: 'center', headerSort: false },
  ],
  Insumo: [
    { title: 'Descripción', field: 'Descripción', headerSort: true },
    { title: 'Código', field: 'Código', headerSort: true },
    { title: 'Unidad', field: 'Unidad', headerSort: true },
    { title: 'Proveedor', field: 'Proveedor', headerSort: true },
    { title: 'Material', field: 'Material', headerSort: true },
    { title: 'Origen', field: 'Origen', headerSort: true },
    { title: 'Observaciones', field: 'Observaciones', headerSort: true },
    { title: 'Imagen', field: 'imagen_path', formatter: cell => getImageHTML(cell.getValue()), hozAlign: 'center', headerSort: false },
    { title: 'Acciones', formatter: actionsFormatter, hozAlign: 'center', headerSort: false },
  ],
  Desactivado: [
    { title: 'Tipo', field: 'Tipo', headerSort: true },
    { title: 'Descripción', field: 'Descripción', headerSort: true },
    { title: 'Código', field: 'Código', headerSort: true },
    { title: 'Acciones', formatter: actionsFormatter, hozAlign: 'center', headerSort: false },
  ],
};

// Reuse the product columns for the combined Product + Subproduct view
columnSets.ProductoSub = columnSets.Producto;

const detailFields = {
  Cliente: ['Descripción', 'Código'],
  Producto: ['Descripción', 'Código', 'Largo', 'Ancho', 'Alto', 'Peso', 'imagen_path'],
  Subproducto: ['Descripción', 'Código'],
  Insumo: ['Descripción', 'Código', 'Unidad', 'Proveedor', 'Material', 'Origen', 'Observaciones', 'imagen_path'],
  Desactivado: ['Tipo', 'Descripción', 'Código'],
};

// The combined dataset shares the same detail fields as Producto
detailFields.ProductoSub = detailFields.Producto;

function getImageHTML(path) {
  const safe = String(path || '').replace(/\.\.\/|[^\w.\-/]/g, '');
  if (!safe) return '';
  const src = `imagenes_sinoptico/${safe}`;
  const alt = safe.split('/').pop().replace(/\.[^.]+$/, '');
  return `<img src="${src}" alt="${alt}" loading="lazy" class="fade-img" style="max-width:60px;" onload="this.classList.add('loaded')">`;
}

function actionsFormatter(cell) {
  const data = cell.getRow().getData();
  const toggleTitle = data.Desactivado ? 'Reactivar' : 'Desactivar';
  const toggleIcon = data.Desactivado ? '✅' : '🚫';
  const badge = data.Desactivado ? '<span class="badge inactive" data-tooltip="Inactivo">Inactivo</span>' : '';
  return `
    ${badge}
    <button class="toggle-status" data-id="${data.ID}" data-tooltip="${toggleTitle}">${toggleIcon}</button>
    <button class="delete-row" data-id="${data.ID}" data-tooltip="Eliminar">🗑️</button>`;
}

async function loadData() {
  skeleton.hidden = false;
  await ready;
  allData = await getAll('sinoptico');
  applyFilter();
  skeleton.hidden = true;
}

function applyFilter() {
  let rows = allData.slice();
  if (selectedFilters.length > 0) {
    rows = rows.filter(r => {
      if (selectedFilters.includes('Desactivado')) {
        if (!r.Desactivado) return false;
        const others = selectedFilters.filter(f => f !== 'Desactivado');
        return others.length ? others.includes(r.Tipo) : true;
      }
      return !r.Desactivado && selectedFilters.includes(r.Tipo);
    });
  }
  const tableEl = document.getElementById('dbTable');
  tableEl.classList.add('slide-from-right');
  requestAnimationFrame(() => {
    tableEl.classList.remove('slide-from-right', 'slide-from-left');
  });
  let cols = columnSets[''];
  if (selectedFilters.length === 1) {
    cols = columnSets[selectedFilters[0]] || columnSets[''];
  }
  table.setColumns(cols);
  table.replaceData(rows);
}

/**
 * Change the active dataset and refresh the table.
 * Exported for other modules and legacy pages.
 * @param {string} filter dataset name or empty string for all
 */
export function setDataset(filter) {
  selectedFilters = filter ? [filter] : [];
  const sidebar = document.getElementById('datasetSidebar');
  if (sidebar) {
    sidebar.querySelectorAll('button[data-filter]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
  }
  applyFilter();
}

function setupFilterButtons() {
  const select = document.getElementById('datasetSelect');
  if (select) {
    select.addEventListener('change', () => {
      setDataset(select.value || '');
    });
  }
}

function setupSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('datasetSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar || !toggle) return;
  const close = () => {
    document.body.classList.remove('sidebar-open');
    toggle.setAttribute('aria-label', 'Abrir filtros');
  };
  const open = () => {
    document.body.classList.add('sidebar-open');
    toggle.setAttribute('aria-label', 'Cerrar filtros');
  };
  toggle.addEventListener('click', () => {
    if (document.body.classList.contains('sidebar-open')) {
      close();
    } else {
      open();
    }
  });
  overlay && overlay.addEventListener('click', close);
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') close();
  });
  sidebar.addEventListener('click', ev => {
    const btn = ev.target.closest('button[data-filter]');
    if (!btn) return;
    const filter = btn.dataset.filter || '';
    if (!filter) {
      selectedFilters = [];
      sidebar.querySelectorAll('button[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      close();
    } else {
      btn.classList.toggle('active');
      if (btn.classList.contains('active')) {
        selectedFilters.push(filter);
        sidebar.querySelector('button[data-filter=""]')?.classList.remove('active');
      } else {
        selectedFilters = selectedFilters.filter(f => f !== filter);
      }
    }
    applyFilter();
  });
}

// Bind buttons outside the sidebar that also change datasets
function setupSidebarButtons() {
  document.querySelectorAll('[data-dataset]')
    .forEach(btn => {
      btn.addEventListener('click', () => {
        setDataset(btn.dataset.dataset || '');
      });
    });
}

function setupSearch() {
  const input = document.getElementById('globalSearch');
  if (!input) return;
  let t;
  input.addEventListener('input', () => {
    searchSpinner.style.display = 'inline-block';
    clearTimeout(t);
    t = setTimeout(() => {
      const value = input.value.trim();
      if (value) {
        table.setFilter(customSearch, { term: value });
      } else {
        table.clearFilter(customSearch);
      }
      searchSpinner.style.display = 'none';
    }, 300);
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
      if (confirm('¿Eliminar elemento?') && confirm('Esta acción no se puede deshacer. ¿Continuar?')) {
        await deleteNode(id);
        await loadData();
        showToast('Eliminado');
      }
    } else if (btn.classList.contains('toggle-status')) {
      const row = allData.find(r => r.ID === id);
      if (!row) return;
      const newState = !row.Desactivado;
      const msg = newState ? '¿Desactivar elemento?' : '¿Reactivar elemento?';
      if (confirm(msg)) {
        await updateNode(id, { Desactivado: newState });
        await loadData();
        showToast(newState ? 'Desactivado' : 'Reactivado');
      }
    }
  });
}

function setupExport() {
  const excelBtn = document.getElementById('btnExcel');
  const pdfBtn = document.getElementById('btnPdf');
  async function exportServer(fmt) {
    const resp = await fetch(`/api/sinoptico/export?format=${fmt}`);
    if (!resp.ok) throw new Error('fail');
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const ext = fmt === 'excel' ? 'xlsx' : 'pdf';
    const a = document.createElement('a');
    a.href = url;
    a.download = `sinoptico.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  excelBtn?.addEventListener('click', () => exportServer('excel').catch(() => {}));
  pdfBtn?.addEventListener('click', () => exportServer('pdf').catch(() => {}));
}


function openDetail(data) {
  const dialog = document.getElementById('detailDialog');
  if (!dialog) return;
  dialog.classList.remove('closing');
  dialog.innerHTML = '<button class="close-dialog">✖</button><div class="detail-content"></div>';
  dialog.querySelector('.close-dialog').addEventListener('click', () => closeModal(dialog), { once: true });
  const container = dialog.querySelector('.detail-content');
  const fields = detailFields[data.Tipo] || Object.keys(data);
  const dl = document.createElement('dl');
  fields.forEach(f => {
    const dt = document.createElement('dt');
    dt.textContent = f;
    const dd = document.createElement('dd');
    if (f === 'imagen_path') {
      dd.innerHTML = getImageHTML(data.imagen_path);
    } else {
      dd.textContent = data[f] || '';
    }
    dl.appendChild(dt);
    dl.appendChild(dd);
  });
  container.appendChild(dl);
  dialog.showModal();
}

function initTable() {
  table = new Tabulator('#dbTable', {
    layout: 'fitColumns',
    pagination: 'local',
    paginationSize: 10,
    reactiveData: true,
    columns: columnSets[''],
  });
  table.on('rowClick', (e, row) => {
    if (e.target.closest('button')) return;
    openDetail(row.getData());
  });
  table.on('scrollVertical', () => {
    const max = table.getPageMax();
    if (table.getPage() < max) {
      const el = table.element; 
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 20) {
        table.nextPage();
      }
    }
  });
}

export function initInteractiveTable() {
  initTable();
  setupFilterButtons();
  setupSidebar();
  setupSidebarButtons();
  setupSearch();
  setupActions();
  setupExport();
  loadData();
}

document.addEventListener('DOMContentLoaded', initInteractiveTable);

// Expose API for legacy pages that load this script without modules.
// Allows external scripts to switch the active dataset via window.setDataset().
if (typeof window !== 'undefined') {
  window.setDataset = setDataset;
}
