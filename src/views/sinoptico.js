import { getAll, remove, exportJSON, importJSON } from '../dataService.js';

export async function render(container) {
  container.innerHTML = `
    <div class="toolbar">
      <button id="sin-edit">Editar</button>
      <button id="sin-delete">Borrar</button>
      <button id="sin-export">Exportar</button>
      <input id="sin-import-file" type="file" accept="application/json" hidden>
      <button id="sin-import">Importar</button>
    </div>
    <div id="sinoptico"></div>
  `;

  const data = await getAll('sinoptico');
  if (typeof window.renderSinoptico === 'function') {
    window.renderSinoptico(data);
  }

  container.querySelector('#sin-edit').addEventListener('click', () => {
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
