import { getAll, remove } from '../dataService.js';
import { createSinopticoEditor } from '../editors/sinopticoEditor.js';
import { isGuest } from '../session.js';

export async function render(container) {
  container.innerHTML = `
    <div class="toolbar">
      <button id="sin-edit">Editar</button>
      <button id="btnNuevoCliente">Nuevo cliente</button>
      <button id="sin-delete">Borrar</button>
    </div>
    <table id="sinoptico">
      <thead>
        <tr>
          <th>Descripción</th>
          <th>Proyecto</th>
          <th>Código</th>
          <th>Consumo</th>
          <th>Unidad</th>
          <th>Imagen</th>
          <th id="thActions" style="display:none">Acciones</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;
  if (isGuest()) {
    container.querySelector('.toolbar').style.display = 'none';
  }

  const data = await getAll('sinoptico');
  if (typeof window.renderSinoptico === 'function') {
    window.renderSinoptico(data);
  }

  container.querySelector('#btnNuevoCliente').addEventListener('click', () => {
    const dlg = document.getElementById('dlgNuevoCliente');
    if (dlg && dlg.showModal) dlg.showModal();
  });

  container.querySelector('#sin-edit').addEventListener('click', () => {
    const curr = sessionStorage.getItem('sinopticoEdit') === 'true';
    sessionStorage.setItem('sinopticoEdit', (!curr).toString());
    document.dispatchEvent(new Event('sinoptico-mode'));
  });

  container.querySelector('#sin-delete').addEventListener('click', async () => {
    if (!confirm('¿Eliminar todos los elementos?')) return;
    const items = await getAll('sinoptico');
    for (const item of items) await remove('sinoptico', item.id);
  });

}

// expose editor factory for renderer.js
export { createSinopticoEditor };
if (typeof window !== 'undefined') {
  window.createSinopticoEditor = createSinopticoEditor;
}
