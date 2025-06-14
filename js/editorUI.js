import { addNode, updateNode, deleteNode, getAll } from './dataService.js';

function mostrarOk(msg) {
  if (typeof window.mostrarMensaje === 'function') {
    window.mostrarMensaje(msg, 'success');
  }
}

async function deleteSubtree(id) {
  const data = await getAll('sinoptico');
  const queue = [String(id)];
  const toDel = new Set();
  while (queue.length) {
    const cur = queue.pop();
    toDel.add(cur);
    data.forEach(it => {
      if (String(it.ParentID) === cur) queue.push(String(it.ID));
    });
  }
  for (const del of toDel) {
    await deleteNode(del);
  }
  mostrarOk('Eliminado con éxito');
}


async function handleArbol() {
  const cliente = prompt('Nombre del cliente raíz');
  if (!cliente) return;
  const rootId = Date.now().toString();
  await addNode({
    ID: rootId,
    ParentID: '',
    Tipo: 'Cliente',
    Descripción: cliente,
    Cliente: cliente,
    Vehículo: '',
    RefInterno: '',
    versión: '',
    Imagen: '',
    Consumo: '',
    Unidad: '',
    Sourcing: '',
    Código: ''
  });

  async function addChildren(parentId) {
    while (true) {
      const tipo = prompt('Agregar: s=subproducto, i=insumo, f=fin');
      if (!tipo || tipo.toLowerCase() === 'f') break;
      if (tipo.toLowerCase() === 's') {
        const desc = prompt('Nombre del subproducto');
        if (!desc) continue;
        const id = Date.now().toString();
        await addNode({
          ID: id,
          ParentID: parentId,
          Tipo: 'Subproducto',
          Descripción: desc,
          Cliente: cliente,
          Vehículo: '',
          RefInterno: '',
          versión: '',
          Imagen: '',
          Consumo: '',
          Unidad: '',
          Sourcing: '',
          Código: ''
        });
        await addChildren(id);
      } else if (tipo.toLowerCase() === 'i') {
        const desc = prompt('Descripción del insumo');
        if (!desc) continue;
        const id = Date.now().toString();
        await addNode({
          ID: id,
          ParentID: parentId,
          Tipo: 'Insumo',
          Descripción: desc,
          Cliente: cliente,
          Vehículo: '',
          RefInterno: '',
          versión: '',
          Imagen: '',
          Consumo: '',
          Unidad: '',
          Sourcing: '',
          Código: ''
        });
      }
    }
  }

  await addChildren(rootId);
  mostrarOk('Árbol creado con éxito');
}

function init() {
  document.getElementById('btnEliminar')?.addEventListener('click', async () => {
    const id = prompt('ID a eliminar');
    if (id) await deleteSubtree(id);
  });
  // simple placeholders
  document.getElementById('btnModificar')?.addEventListener('click', async () => {
    const id = prompt('ID a modificar');
    if (!id) return;
    const campo = prompt('Campo a modificar');
    const valor = prompt('Nuevo valor');
    if (campo && valor != null) {
      await updateNode(id, { [campo]: valor });
      mostrarOk('Actualizado con éxito');
    }
  });
  document.getElementById('btnArbol')?.addEventListener('click', handleArbol);
  window.SinopticoEditor = { deleteSubtree };
}

document.addEventListener('DOMContentLoaded', init);
