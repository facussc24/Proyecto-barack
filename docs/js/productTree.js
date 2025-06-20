import { getAll, replaceAll, ready } from './dataService.js';
import { isAdmin } from './session.js';

let tree = [];
let selected = null;
let admin = false;
let sidePanel;

function buildTree(arr) {
  const map = {};
  arr.forEach(n => map[n.ID] = { ...n, children: [] });
  const roots = [];
  arr.forEach(n => {
    const pid = String(n.ParentID || '');
    if (pid && map[pid]) map[pid].children.push(map[n.ID]);
    else roots.push(map[n.ID]);
  });
  return roots;
}

function flatten(nodes) {
  const result = [];
  function visit(n, parentId) {
    const { children, ...rest } = n;
    result.push({ ...rest, ParentID: parentId });
    (n.children || []).forEach(ch => visit(ch, n.ID));
  }
  nodes.forEach(n => visit(n, n.ParentID || ''));
  return result;
}

function createNodeElement(node) {
  const li = document.createElement('li');
  const label = document.createElement('div');
  label.className = 'tree-node';
  label.textContent = node.Descripción + (node.Código ? ` (${node.Código})` : '');

  const viewBtn = document.createElement('button');
  viewBtn.textContent = 'Ver';
  viewBtn.addEventListener('click', () => selectNode(node));
  label.appendChild(viewBtn);

  if (admin) {
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Añadir subcomponente';
    addBtn.addEventListener('click', () => addChild(node));
    label.appendChild(addBtn);
  }

  li.appendChild(label);
  if (node.children && node.children.length) {
    const ul = document.createElement('ul');
    node.children.forEach(ch => ul.appendChild(createNodeElement(ch)));
    li.appendChild(ul);
  }
  return li;
}

function render() {
  const rootEl = document.getElementById('root');
  rootEl.innerHTML = '';

  if (!tree.length && admin) {
    const btn = document.createElement('button');
    btn.id = 'createRoot';
    btn.textContent = 'Crear producto';
    btn.addEventListener('click', addRoot);
    rootEl.appendChild(btn);
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'tree-list flow-diagram';
  tree.forEach(n => ul.appendChild(createNodeElement(n)));
  rootEl.appendChild(ul);

  if (admin && tree.length) {
    const saveBtn = document.createElement('button');
    saveBtn.id = 'saveTree';
    saveBtn.textContent = 'Guardar árbol';
    saveBtn.addEventListener('click', saveTree);
    rootEl.appendChild(saveBtn);
  }
}

function selectNode(node) {
  selected = node;
  showSidePanel();
}

function addRoot() {
  const id = Date.now().toString();
  const root = {
    ID: id,
    ParentID: '',
    Tipo: 'Producto',
    Descripción: 'Nuevo producto',
    Código: '',
    Largo: '',
    Ancho: '',
    Alto: '',
    Peso: '',
    children: []
  };
  tree = [root];
  selectNode(root);
  render();
}

function addChild(parent) {
  const id = Date.now().toString();
  const child = { ID: id, ParentID: parent.ID, Tipo: 'Subcomponente', Descripción: 'Nuevo', Código: '', Largo: '', Ancho: '', Alto: '', Peso: '', children: [] };
  parent.children.push(child);
  render();
  selectNode(child);
}

function updateNode(field, value) {
  if (!selected) return;
  selected[field] = value;
}

function showSidePanel() {
  if (!sidePanel) createSidePanel();
  sidePanel.style.display = selected ? 'block' : 'none';
  if (!selected) return;
  sidePanel.querySelector('#inpCliente').value = selected.Cliente || '';
  sidePanel.querySelector('#inpDesc').value = selected.Descripción || '';
  sidePanel.querySelector('#inpCodigo').value = selected.Código || '';
  sidePanel.querySelector('#inpLargo').value = selected.Largo || '';
  sidePanel.querySelector('#inpAncho').value = selected.Ancho || '';
  sidePanel.querySelector('#inpAlto').value = selected.Alto || '';
  sidePanel.querySelector('#inpPeso').value = selected.Peso || '';
}

function createSidePanel() {
  sidePanel = document.createElement('div');
  sidePanel.className = 'side-panel';
  sidePanel.innerHTML = `
    <h2>Editar nodo</h2>
    <label>Cliente:<input id="inpCliente"></label>
    <label>Descripción:<input id="inpDesc"></label>
    <label>Código:<input id="inpCodigo"></label>
    <label>Largo (mm):<input id="inpLargo" type="number"></label>
    <label>Ancho (mm):<input id="inpAncho" type="number"></label>
    <label>Alto (mm):<input id="inpAlto" type="number"></label>
    <label>Peso (kg):<input id="inpPeso" type="number"></label>
    <button id="btnClose">Cerrar</button>
  `;
  sidePanel.style.display = 'none';
  sidePanel.addEventListener('input', ev => {
    const id = ev.target.id;
    if (!id) return;
    const map = {
      inpCliente: 'Cliente',
      inpDesc: 'Descripción',
      inpCodigo: 'Código',
      inpLargo: 'Largo',
      inpAncho: 'Ancho',
      inpAlto: 'Alto',
      inpPeso: 'Peso'
    };
    if (map[id]) updateNode(map[id], ev.target.value);
  });
  sidePanel.querySelector('#btnClose').addEventListener('click', () => {
    selected = null;
    sidePanel.style.display = 'none';
  });
  document.body.appendChild(sidePanel);
}

async function saveTree() {
  const flat = flatten(tree);
  await replaceAll(flat);
  window.mostrarMensaje?.('Árbol guardado', 'success');
}

async function init() {
  await ready;
  admin = isAdmin();
  tree = buildTree(await getAll('sinoptico'));
  render();
}

document.addEventListener('DOMContentLoaded', init);
