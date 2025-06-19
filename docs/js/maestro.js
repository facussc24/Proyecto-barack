import { version } from './version.js';

function showError(msg) {
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.top = '0';
  div.style.left = '0';
  div.style.right = '0';
  div.style.background = '#fdd';
  div.style.color = '#900';
  div.style.padding = '10px';
  div.style.fontFamily = 'sans-serif';
  div.textContent = msg;
  document.body.prepend(div);
}

window.addEventListener('error', e => {
  showError('Error en la página: ' + e.message);
});

const columns = ['producto','amfe','flujograma','hojaOp','mylar','planos','ulm','fichaEmb','tizada'];
let data = [];
let history = [];
const searchInput = document.getElementById('searchInput');

const stored = localStorage.getItem('maestroVivoVersion');
if (stored !== version) {
  localStorage.removeItem('maestroVivo');
  localStorage.setItem('maestroVivoVersion', version);
}

function load() {
  const raw = localStorage.getItem('maestroVivo');
  if (raw) {
    try {
      const obj = JSON.parse(raw);
      data = Array.isArray(obj.data) ? obj.data : [];
      history = Array.isArray(obj.history) ? obj.history : [];
    } catch {}
  }
}

function render() {
  const tbody = document.querySelector('#maestro tbody');
  tbody.innerHTML = '';
  if (!data.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = columns.length + 1;
    td.textContent = 'No hay registros disponibles';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  data.forEach(row => {
    const tr = document.createElement('tr');
    if (row.pending) tr.classList.add('pending');
    const cells = ['', row.producto || '', row.amfe || '', row.flujograma || '', row.hojaOp || '', row.mylar || '', row.planos || '', row.ulm || '', row.fichaEmb || '', row.tizada || ''];
    cells.forEach(val => {
      const td = document.createElement('td');
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  filterRows();
}

function exportExcel() {
  if (typeof XLSX === 'undefined') return;
  const headers = ['Producto / Código','AMFE','Flujograma','Hoja de Operaciones','Mylar','Planos','ULM','Ficha de Embalaje','Tizada','Estado'];
  const rows = data.map(r => [r.producto || '', r.amfe || '', r.flujograma || '', r.hojaOp || '', r.mylar || '', r.planos || '', r.ulm || '', r.fichaEmb || '', r.tizada || '', r.pending ? 'ALERTA' : 'OK']);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Maestro');
  const histHeaders = ['Fecha/hora','Producto','Columna','Antes','Después'];
  const histRows = history.map(h => [new Date(h.timestamp).toLocaleString('es-ES'), h.producto, h.columna, h.antes, h.despues]);
  const wsHist = XLSX.utils.aoa_to_sheet([histHeaders, ...histRows]);
  XLSX.utils.book_append_sheet(wb, wsHist, 'Historial');
  XLSX.writeFile(wb, 'ListadoMaestro.xlsx');
}

function openHistory() {
  const tbody = document.getElementById('historyBody');
  tbody.innerHTML = '';
  history.forEach(h => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${new Date(h.timestamp).toLocaleString('es-ES')}</td><td>${h.producto}</td><td>${h.columna}</td><td>${h.antes}</td><td>${h.despues}</td>`;
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

document.getElementById('closeHist').onclick = () => document.getElementById('historyDialog').close();
document.getElementById('export').onclick = exportExcel;
document.getElementById('showHistory').onclick = openHistory;
load();
render();
searchInput.addEventListener('input', filterRows);

