import { version, displayVersion } from './version.js';
import { getAll, add, update, remove, ready } from './dataService.js';

const columns = ['producto','amfe','flujograma','hojaOp','mylar','planos','ulm','fichaEmb','tizada'];
let data = [];
let history = [];
const searchInput = document.getElementById('searchInput');

function rowFromStore(rec = {}) {
  return {
    id: rec.id || Date.now().toString(),
    producto: rec.id || '',
    amfe: rec.amfe || '',
    flujograma: rec.flujograma || '',
    hojaOp: rec.hojaOp || '',
    mylar: rec.mylar || '',
    planos: rec.planos || '',
    ulm: rec.ulm || '',
    fichaEmb: rec.fichaEmb || '',
    tizada: rec.tizada || '',
    pending: rec.notificado === false,
  };
}

function rowToStore(row = {}) {
  return {
    id: row.id,
    flujograma: row.flujograma || '',
    amfe: row.amfe || '',
    hojaOp: row.hojaOp || '',
    mylar: row.mylar || '',
    planos: row.planos || '',
    ulm: row.ulm || '',
    fichaEmb: row.fichaEmb || '',
    tizada: row.tizada || '',
    notificado: row.pending ? false : true,
  };
}

async function load() {
  await ready;
  try {
    data = (await getAll('maestro')).map(rowFromStore);
    history = await getAll('maestroHist');
  } catch {
    data = [];
    history = [];
  }
}

function render() {
  const tbody = document.querySelector('#maestro tbody');
  tbody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    if (row.pending) tr.classList.add('pending');
    const cells = ['', row.producto || '', row.amfe || '', row.flujograma || '', row.hojaOp || '', row.mylar || '', row.planos || '', row.ulm || '', row.fichaEmb || '', row.tizada || ''];
    cells.forEach((val, i) => {
      const td = document.createElement('td');
      if (i > 0) td.contentEditable = 'true';
      td.textContent = val;
      tr.appendChild(td);
    });
    const delTd = document.createElement('td');
    delTd.innerHTML = '<button class="delete-row">🗑️</button>';
    tr.appendChild(delTd);
    tbody.appendChild(tr);
  });
  filterRows();
}

async function addHistory(id, col, before, after) {
  const entry = {
    hist_id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(),
    elemento_id: id,
    timestamp: new Date().toISOString(),
    campo: col,
    antes: before,
    despues: after,
  };
  history.push(entry);
  await add('maestroHist', entry);
}

async function handleInput(e) {
  const td = e.target.closest('td[contenteditable="true"]');
  if (!td) return;
  const tr = td.parentElement;
  const rowIndex = Array.from(tr.parentElement.children).indexOf(tr);
  const colIndex = Array.from(tr.children).indexOf(td) - 1;
  const key = columns[colIndex];
  const before = data[rowIndex][key] || '';
  const after = td.textContent.trim();
  if (before === after) return;
  const row = data[rowIndex];
  await addHistory(row.id, key, before, after);
  row[key] = after;
  if (key === 'flujograma') {
    ['amfe', 'hojaOp'].forEach((depKey, idx) => {
      if (row[depKey]) {
        addHistory(row.id, depKey, row[depKey], '');
        row[depKey] = '';
        tr.children[idx + 2].textContent = '';
      }
    });
  }
  row.pending = true;
  tr.classList.add('pending');
  await update('maestro', row.id, rowToStore(row));
}

async function addRow() {
  const row = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(),
    producto: '',
    amfe: '',
    flujograma: '',
    hojaOp: '',
    mylar: '',
    planos: '',
    ulm: '',
    fichaEmb: '',
    tizada: '',
    pending: false,
  };
  data.push(row);
  await add('maestro', rowToStore(row));
  render();
}

function exportExcel() {
  if (typeof XLSX === 'undefined') return;
  const headers = ['Producto / Código','AMFE','Flujograma','Hoja de Operaciones','Mylar','Planos','ULM','Ficha de Embalaje','Tizada','Estado'];
  const rows = data.map(r => [r.producto || '', r.amfe || '', r.flujograma || '', r.hojaOp || '', r.mylar || '', r.planos || '', r.ulm || '', r.fichaEmb || '', r.tizada || '', r.pending ? 'ALERTA' : 'OK']);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Maestro');
  const histHeaders = ['Fecha/hora','Producto','Columna','Antes','Después'];
  const histRows = history.map(h => [new Date(h.timestamp).toLocaleString('es-ES'), h.elemento_id, h.campo, h.antes, h.despues]);
  const wsHist = XLSX.utils.aoa_to_sheet([histHeaders, ...histRows]);
  XLSX.utils.book_append_sheet(wb, wsHist, 'Historial');
  XLSX.writeFile(wb, 'ListadoMaestro.xlsx');
}

function openHistory() {
  const tbody = document.getElementById('historyBody');
  tbody.innerHTML = '';
  history.forEach(h => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${new Date(h.timestamp).toLocaleString('es-ES')}</td><td>${h.elemento_id}</td><td>${h.campo}</td><td>${h.antes}</td><td>${h.despues}</td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('historyDialog').showModal();
}

function filterRows() {
  const term = (searchInput.value || '').toLowerCase();
  document.querySelectorAll('#maestro tbody tr').forEach(tr => {
    const text = tr.textContent.toLowerCase();
    tr.style.display = text.includes(term) ? '' : 'none';
  });
}

async function handleClick(e) {
  const btn = e.target.closest('.delete-row');
  if (!btn) return;
  const tr = btn.closest('tr');
  const rowIndex = Array.from(tr.parentElement.children).indexOf(tr);
  if (confirm('¿Eliminar fila?')) {
    const row = data.splice(rowIndex, 1)[0];
    if (row) await remove('maestro', row.id);
    render();
  }
}

document.getElementById('closeHist').onclick = () => document.getElementById('historyDialog').close();
document.getElementById('addRow').onclick = addRow;
document.getElementById('export').onclick = exportExcel;
document.getElementById('showHistory').onclick = openHistory;
const tbodyEl = document.querySelector('#maestro tbody');
tbodyEl.addEventListener('input', handleInput);
tbodyEl.addEventListener('click', handleClick);
(async () => {
  await load();
  render();
})();
searchInput.addEventListener('input', filterRows);
displayVersion();
