const columns = ['producto','amfe','flujograma','hojaOp','mylar','planos','ulm','fichaEmb','tizada'];
let data = [];
let history = [];
const searchInput = document.getElementById('searchInput');

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

function save() {
  localStorage.setItem('maestroVivo', JSON.stringify({ data, history }));
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

function addHistory(prod, col, before, after) {
  history.push({
    timestamp: new Date().toISOString(),
    producto: prod,
    columna: col,
    antes: before,
    despues: after
  });
}

function handleInput(e) {
  const td = e.target.closest('td[contenteditable="true"]');
  if (!td) return;
  const tr = td.parentElement;
  const rowIndex = Array.from(tr.parentElement.children).indexOf(tr);
  const colIndex = Array.from(tr.children).indexOf(td) - 1;
  const key = columns[colIndex];
  const before = data[rowIndex][key] || '';
  const after = td.textContent.trim();
  if (before === after) return;
  addHistory(data[rowIndex].producto || '', key, before, after);
  data[rowIndex][key] = after;
  if (key === 'flujograma') {
    ['amfe', 'hojaOp'].forEach((depKey, idx) => {
      if (data[rowIndex][depKey]) {
        addHistory(data[rowIndex].producto || '', depKey, data[rowIndex][depKey], '');
        data[rowIndex][depKey] = '';
        tr.children[idx + 2].textContent = '';
      }
    });
  }
  data[rowIndex].pending = true;
  tr.classList.add('pending');
  save();
}

function addRow() {
  data.push({ producto: '', amfe: '', flujograma: '', hojaOp: '', mylar: '', planos: '', ulm: '', fichaEmb: '', tizada: '', pending: false });
  render();
  save();
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

function handleClick(e) {
  const btn = e.target.closest('.delete-row');
  if (!btn) return;
  const tr = btn.closest('tr');
  const rowIndex = Array.from(tr.parentElement.children).indexOf(tr);
  if (confirm('¿Eliminar fila?')) {
    data.splice(rowIndex, 1);
    save();
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
load();
render();
searchInput.addEventListener('input', filterRows);
