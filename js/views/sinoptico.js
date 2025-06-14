import { getAll, remove, exportJSON, importJSON } from '../dataService.js';
import { createSinopticoEditor } from '../editors/sinopticoEditor.js';

export async function render(container) {
  container.innerHTML = `
    <div class="toolbar">
      <button id="sin-edit">Editar</button>
      <button id="sin-delete">Borrar</button>
      <button id="sin-export">Exportar</button>
      <input id="sin-import-file" type="file" accept="application/json" hidden>
      <button id="sin-import">Importar</button>
    </div>

    <div class="column-toggle-container">
      <label><input type="checkbox" class="toggle-col" data-colindex="0" checked>Item</label>
      <label><input type="checkbox" class="toggle-col" data-colindex="1" checked>Cliente</label>
      <label><input type="checkbox" class="toggle-col" data-colindex="2" checked>Vehículo</label>
      <label><input type="checkbox" class="toggle-col" data-colindex="3" checked>RefInterno</label>
      <label><input type="checkbox" class="toggle-col" data-colindex="4" checked>Versión</label>
      <label><input type="checkbox" class="toggle-col" data-colindex="5" checked>Imagen</label>
      <label><input type="checkbox" class="toggle-col" data-colindex="6" checked>Consumo</label>
      <label><input type="checkbox" class="toggle-col" data-colindex="7" checked>Unidad</label>
      <label><input type="checkbox" class="toggle-col" data-colindex="8" checked>Sourcing</label>
      <label><input type="checkbox" class="toggle-col" data-colindex="9" checked>Código</label>
    </div>

    <div class="filtro-contenedor">
      <div class="filtros-texto">
        <label for="filtroInsumo">Buscar:</label>
        <div class="search-wrap">
          <input id="filtroInsumo" type="text" placeholder="Insumo o código">
          <button id="clearSearch" type="button">×</button>
          <ul id="sinopticoSuggestions" class="suggestions-list"></ul>
        </div>
        <div id="selectedItems" class="chips"></div>
      </div>

      <div class="filtro-opciones">
        <label><input id="chkIncluirAncestros" type="checkbox" checked>Ancestros</label>
        <label><input id="chkMostrarNivel0" type="checkbox" checked>Nivel 0</label>
        <label><input id="chkMostrarNivel1" type="checkbox" checked>Nivel 1</label>
        <label><input id="chkMostrarNivel2" type="checkbox" checked>Nivel 2</label>
        <label><input id="chkMostrarNivel3" type="checkbox" checked>Nivel 3</label>
      </div>

      <div class="filtro-opciones">
        <button id="expandirTodo">Expandir todo</button>
        <button id="colapsarTodo">Colapsar todo</button>
        <button id="btnRefrescar">Refrescar</button>
        <button id="btnExcel">Excel</button>
      </div>
    </div>

    <div class="tabla-contenedor">
      <table id="sinoptico">
        <thead>
          <tr>
            <th>Item</th>
            <th>Cliente</th>
            <th>Vehículo</th>
            <th>RefInterno</th>
            <th>Versión</th>
            <th>Imagen</th>
            <th>Consumo</th>
            <th>Unidad</th>
            <th>Sourcing</th>
            <th>Código</th>
            <th id="thActions">Acciones</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  const data = await getAll('sinoptico');
  if (typeof window.renderSinoptico === 'function') {
    window.renderSinoptico(data);
  }

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

  container.querySelector('#sin-export').addEventListener('click', async () => {
    const json = await exportJSON();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = 'sinoptico.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const fileInput = container.querySelector('#sin-import-file');
  container.querySelector('#sin-import').addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async ev => {
    const file = ev.target.files[0];
    if (!file) return;
    const text = await file.text();
    await importJSON(text);
  });
}

// expose editor factory for renderer.js
export { createSinopticoEditor };
if (typeof window !== 'undefined') {
  window.createSinopticoEditor = createSinopticoEditor;
}
