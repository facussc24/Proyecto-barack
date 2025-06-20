import { getAll, replaceAll, ready } from './dataService.js';
import { isAdmin } from './session.js';

// Library exposes a global named `reactOrganizationalChart`.
// Using the wrong name prevents the tree from rendering.
const { Tree, TreeNode } = window.reactOrganizationalChart || {};
const { useState, useEffect } = React;

async function fetchSinoptico() {
  await ready;
  return await getAll('sinoptico');
}

async function saveSinoptico(data) {
  await replaceAll(data);
}

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
    if (children) children.forEach(ch => visit(ch, n.ID));
  }
  nodes.forEach(n => visit(n, n.ParentID || ''));
  return result;
}

function NodeLabel({ node, onView, onAdd, admin }) {
  return React.createElement('div', { className: 'node-label' },
    React.createElement('div', null, node.Descripción + (node.Código ? ` (${node.Código})` : '')),
    React.createElement('div', { className: 'node-actions' },
      React.createElement('button', { onClick: onView }, 'Ver'),
      admin && React.createElement('button', { onClick: onAdd }, 'Añadir subcomponente')
    )
  );
}

function RenderNode({ node, admin, onSelect, onAdd }) {
  return React.createElement(TreeNode, { label: React.createElement(NodeLabel, {
      node,
      onView: () => onSelect(node),
      onAdd: () => onAdd(node),
      admin
    }) },
    node.children && node.children.map(ch =>
      React.createElement(RenderNode, { key: ch.ID, node: ch, admin, onSelect, onAdd })
    )
  );
}

function SidePanel({ node, onChange, onClose }) {
  if (!node) return null;
  const update = (field) => (e) => onChange(field, e.target.value);
  return React.createElement('div', { className: 'side-panel' },
    React.createElement('h2', null, 'Editar nodo'),
    React.createElement('label', null, 'Cliente:',
      React.createElement('input', { value: node.Cliente || '', onChange: update('Cliente') })
    ),
    React.createElement('label', null, 'Descripción:',
      React.createElement('input', { value: node.Descripción || '', onChange: update('Descripción') })
    ),
    React.createElement('label', null, 'Código:',
      React.createElement('input', { value: node.Código || '', onChange: update('Código') })
    ),
    React.createElement('label', null, 'Largo (mm):',
      React.createElement('input', { type: 'number', value: node.Largo || '', onChange: update('Largo') })
    ),
    React.createElement('label', null, 'Ancho (mm):',
      React.createElement('input', { type: 'number', value: node.Ancho || '', onChange: update('Ancho') })
    ),
    React.createElement('label', null, 'Alto (mm):',
      React.createElement('input', { type: 'number', value: node.Alto || '', onChange: update('Alto') })
    ),
    React.createElement('label', null, 'Peso (kg):',
      React.createElement('input', { type: 'number', value: node.Peso || '', onChange: update('Peso') })
    ),
    React.createElement('button', { onClick: onClose }, 'Cerrar')
  );
}

function App() {
  const [tree, setTree] = useState([]);
  const [selected, setSelected] = useState(null);
  const admin = isAdmin();

  useEffect(() => {
    fetchSinoptico().then(data => setTree(buildTree(data)));
  }, []);

  const addRoot = () => {
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
    setTree([root]);
    setSelected(root);
  };

  const addChild = (parent) => {
    const id = Date.now().toString();
    const child = { ID: id, ParentID: parent.ID, Tipo: 'Subcomponente', Descripción: 'Nuevo', Código: '', Largo: '', Ancho: '', Alto: '', Peso: '', children: [] };
    parent.children.push(child);
    setTree([...tree]);
    setSelected(child);
  };

  const updateNode = (field, value) => {
    if (!selected) return;
    selected[field] = value;
    setSelected({ ...selected });
    setTree([...tree]);
  };

  const closePanel = () => setSelected(null);

  const handleSave = async () => {
    const flat = flatten(tree);
    await saveSinoptico(flat);
    if (window.mostrarMensaje) window.mostrarMensaje('Árbol guardado', 'success');
  };

  return React.createElement('div', { className: 'tree-app' },
    tree.length === 0 && admin &&
      React.createElement('button', { id: 'createRoot', onClick: addRoot }, 'Crear producto'),
    tree.length > 0 &&
      React.createElement('div', { className: 'tree-container' },
        React.createElement(Tree, { lineWidth: '2px', lineColor: '#888', lineBorderRadius: '10px' },
          tree.map(n => React.createElement(RenderNode, { key: n.ID, node: n, admin, onSelect: setSelected, onAdd: addChild }))
        )
      ),
    admin && tree.length > 0 && React.createElement('button', { id: 'saveTree', onClick: handleSave }, 'Guardar árbol'),
    React.createElement(SidePanel, { node: selected, onChange: updateNode, onClose: closePanel })
  );
}

ReactDOM.render(React.createElement(App), document.getElementById('root'));
