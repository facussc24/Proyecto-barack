const fs = require('fs');
const path = require('path');
const csvPath = path.join(__dirname, 'sinoptico.csv');
const content = fs.readFileSync(csvPath, 'utf8').trim();
const rows = content.split(/\r?\n/).map(line => line.split(';'));

function buildTable() {
  const container = document.getElementById('tabla');
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const headers = ['Item','Cliente','Vehículo','RefInterno','Versión','Imagen','Pzas/h','Unidad','Sourcing','Código'];
  const headerRow = document.createElement('tr');
  headerRow.appendChild(document.createElement('th'));
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  for (let i = 1; i < rows.length; i++) {
    const parts = rows[i];
    const id = parts[0];
    const parent = parts[1];
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', id);
    tr.setAttribute('data-parent', parent);
    if (parent) tr.style.display = 'none';

    const tdBtn = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'toggle';
    btn.setAttribute('data-expanded', 'false');
    btn.textContent = '+';
    btn.onclick = () => toggleNodo(btn, id);
    tdBtn.appendChild(btn);
    tr.appendChild(tdBtn);

    const cols = [parts[4], parts[5], parts[6], parts[7], parts[8], parts[9], parts[10], parts[11], parts[12], parts[13]];
    cols.forEach(val => {
      const td = document.createElement('td');
      td.textContent = val || '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  container.appendChild(table);
}

function toggleNodo(btn, parentId) {
  const expanded = btn.getAttribute('data-expanded') === 'true';
  if (expanded) {
    btn.textContent = '+';
    btn.setAttribute('data-expanded', 'false');
    hideSubtree(parentId);
  } else {
    btn.textContent = '–';
    btn.setAttribute('data-expanded', 'true');
    showChildren(parentId);
  }
}

function showChildren(parentId) {
  document.querySelectorAll(`tr[data-parent="${parentId}"]`).forEach(tr => tr.style.display = '');
}

function hideSubtree(parentId) {
  document.querySelectorAll(`tr[data-parent="${parentId}"]`).forEach(tr => {
    hideSubtree(tr.getAttribute('data-id'));
    tr.style.display = 'none';
    const btn = tr.querySelector('.toggle');
    if (btn) {
      btn.textContent = '+';
      btn.setAttribute('data-expanded', 'false');
    }
  });
}

function expandirTodo() {
  document.querySelectorAll('.toggle').forEach(btn => {
    if (btn.getAttribute('data-expanded') === 'false') {
      toggleNodo(btn, btn.parentElement.parentElement.getAttribute('data-id'));
    }
  });
}

function colapsarTodo() {
  document.querySelectorAll('.toggle').forEach(btn => {
    if (btn.getAttribute('data-expanded') === 'true') {
      toggleNodo(btn, btn.parentElement.parentElement.getAttribute('data-id'));
    }
  });
}

window.toggleNodo = toggleNodo;
window.expandirTodo = expandirTodo;
window.colapsarTodo = colapsarTodo;

document.addEventListener('DOMContentLoaded', () => {
  buildTable();
  document.getElementById('expandirTodo').addEventListener('click', expandirTodo);
  document.getElementById('colapsarTodo').addEventListener('click', colapsarTodo);
});
