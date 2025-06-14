'use strict';
const root = typeof global !== 'undefined' ? global : globalThis;

export function createSinopticoEditor(options = {}) {
  const {
    getData = () => [],
    setData = () => {},
    generateId = () => Date.now().toString(),
    saveSinoptico = () => {},
    loadData = () => {},
    dataService = null
  } = options;

  const service =
    dataService ||
    (typeof require === 'function'
      ? require('../dataService.js')
      : null);

  function setEditFlag(val) {
    if (root.sessionStorage) {
      root.sessionStorage.setItem('sinopticoEdit', val ? 'true' : 'false');
    }
  }

  function refresh() {
    if (typeof loadData === 'function') {
      loadData();
    }
  }

  async function addNode(node) {
    const data = Array.isArray(getData()) ? getData().slice() : [];
    const newNode = { ID: generateId(), ...node };
    data.push(newNode);
    setData(data);
    if (service && service.addNode) {
      await service.addNode(newNode);
    }
    setEditFlag(true);
    refresh();
  }

  async function updateNode(id, changes) {
    const data = Array.isArray(getData()) ? getData().slice() : [];
    const idStr = String(id);
    const item = data.find(n => String(n.ID) === idStr);
    if (item) Object.assign(item, changes);
    setData(data);
    if (service && service.updateNode) {
      await service.updateNode(id, changes);
    }
    setEditFlag(true);
    refresh();
  }

  async function deleteSubtree(id) {
    const data = Array.isArray(getData()) ? getData().slice() : [];
    const idStr = String(id);
    const toDelete = new Set();
    const stack = [idStr];
    while (stack.length) {
      const pid = stack.pop();
      toDelete.add(pid);
      data
        .filter(n => String(n.ParentID) === pid)
        .forEach(n => stack.push(String(n.ID)));
    }
    const newData = data.filter(n => !toDelete.has(String(n.ID)));
    setData(newData);
    if (service && service.deleteNode) {
      for (const del of toDelete) {
        await service.deleteNode(del);
      }
    }
    setEditFlag(true);
    refresh();
  }

  function save() {
    setEditFlag(false);
    if (typeof saveSinoptico === 'function') saveSinoptico();
    refresh();
  }

  return { addNode, updateNode, deleteSubtree, save };
}

if (root) {
  root.createSinopticoEditor = createSinopticoEditor;
}
