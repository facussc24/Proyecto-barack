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

async function handleCrear() {
  const nombre = prompt('Nombre del cliente');
  if (!nombre) return;
  await addNode({
    ID: Date.now().toString(),
    ParentID: '',
    Tipo: 'Cliente',
    Descripción: nombre,
    Cliente: nombre,
    Vehículo: '',
    RefInterno: '',
    versión: '',
    Imagen: '',
    Consumo: '',
    Unidad: '',
    Sourcing: '',
    Código: ''
  });
  mostrarOk('Creado con éxito');
}

function init() {
  document.getElementById('btnCrearCliente')?.addEventListener('click', handleCrear);
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
  document.getElementById('btnArbol')?.addEventListener('click', () => {
    alert('Función Árbol Producto no implementada');
  });
  window.SinopticoEditor = { deleteSubtree };
}

document.addEventListener('DOMContentLoaded', init);
