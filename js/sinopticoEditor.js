'use strict';
const root = typeof global !== 'undefined' ? global : globalThis;

export function createSinopticoEditor({
  getData,
  setData,
  generateId,
  saveSinoptico,
  loadData,
  dataService,
} = {}) {
  if (!getData) {
    let data = [];
    getData = () => data;
    setData = d => {
      data = d;
    };
  }
  if (!setData) {
    throw new Error('setData must be provided when getData is supplied');
  }
  if (!generateId) {
    generateId = () =>
      Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  function addNode(opts = {}, children) {
    const row = {
      ID: generateId(),
      ParentID: opts.ParentID || '',
      Tipo: opts.Tipo || 'Producto',
      Secuencia: opts.Secuencia || '',
      Descripción: opts.Descripción || '',
      Cliente: '',
      Vehículo: '',
      RefInterno: '',
      versión: '',
      Imagen: '',
      Consumo: '',
      Unidad: '',
      Sourcing: '',
      Código: opts.Código || '',
    };
    if (row.Tipo === 'Cliente') {
      row.Cliente = row['Descripción'];
    }
    row.id = row.ID;
    row.parentId = row.ParentID;
    row.nombre = row['Descripción'];
    row.orden = 0;
    const data = getData();
    data.push(row);
    setData(data);
    if (dataService && dataService.addNode) {
      dataService.addNode(row);
    }
    if (Array.isArray(children)) {
      children.forEach(child => {
        if (child) {
          const sub = Object.assign({}, child, { ParentID: row.ID });
          addNode(sub, child.children || []);
        }
      });
    }
    if (saveSinoptico) saveSinoptico();
    if (loadData) loadData();
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('sinoptico-data-changed'));
    }
    return row.ID;
  }

  function deleteSubtree(id) {
    const data = getData();
    const ids = new Set();
    (function collect(pid) {
      ids.add(pid);
      data.filter(r => r.ParentID === pid).forEach(r => collect(r.ID));
    })(id);
    const newData = data.filter(r => !ids.has(r.ID));
    setData(newData);
    if (dataService && dataService.deleteNode) {
      ids.forEach(dbid => dataService.deleteNode(dbid));
    }
    if (saveSinoptico) saveSinoptico();
    if (loadData) loadData();
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('sinoptico-data-changed'));
    }
  }

  function updateNode(id, attrs = {}) {
    const data = getData();
    const node = data.find(r => r.ID === id);
    if (!node) return;
    Object.assign(node, attrs);
    if (node.Tipo === 'Cliente' && attrs['Descripción']) {
      node.Cliente = attrs['Descripción'];
    }
    if (dataService && dataService.updateNode) {
      const changes = Object.assign({}, attrs);
      if (changes['Descripción']) changes.nombre = changes['Descripción'];
      if (node.id) {
        dataService.updateNode(node.id, changes);
      }
    }
    setData(data);
    if (saveSinoptico) saveSinoptico();
    if (loadData) loadData();
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('sinoptico-data-changed'));
    }
  }

  function getNodes() {
    const data = getData();
    return data.slice();
  }

  return { addNode, deleteSubtree, updateNode, getNodes };
}

if (typeof window !== 'undefined') {
  window.createSinopticoEditor = createSinopticoEditor;
}
