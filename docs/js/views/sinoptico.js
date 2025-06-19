import { getAll, remove } from '../dataService.js';
import { createSinopticoEditor } from '../editors/sinopticoEditor.js';

export async function render(container) {
  container.innerHTML = `
    <div class="toolbar">
      <button id="sin-edit">Editar</button>
      <button id="btnNuevoCliente">Nuevo cliente</button>
      <button id="sin-delete">Borrar</button>
      <button id="sin-export">Exportar...</button>
      <div class="export-menu">
        <button data-fmt="excel">Excel</button> |
        <button data-fmt="pdf">PDF</button>
      </div>
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

  const data = await getAll('sinoptico');
  if (typeof window.renderSinoptico === 'function') {
    window.renderSinoptico(data);
  }

  const exportBtn = container.querySelector('#sin-export');
  const menu = container.querySelector('.export-menu');

  function showSpinner() {
    const el = document.getElementById('loading');
    if (el) el.style.display = 'flex';
  }

  function hideSpinner() {
    const el = document.getElementById('loading');
    if (el) el.style.display = 'none';
  }

  async function checkHealth() {
    try {
      const resp = await fetch('/health');
      if (!resp.ok) throw new Error();
    } catch {
      exportBtn.disabled = true;
    }
  }

  exportBtn?.addEventListener('click', () => {
    if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  });

  menu?.addEventListener('click', async ev => {
    const btn = ev.target.closest('button[data-fmt]');
    if (!btn) return;
    const fmt = btn.getAttribute('data-fmt');
    menu.style.display = 'none';
    showSpinner();
    try {
      const resp = await fetch(`/api/sinoptico/export?format=${fmt}`);
      if (!resp.ok) throw new Error('fail');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const ext = fmt === 'excel' ? 'xlsx' : 'pdf';
      const a = document.createElement('a');
      a.href = url;
      a.download = `sinoptico.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (window.mostrarMensaje) window.mostrarMensaje('Exportación completa', 'success');
    } catch (e) {
      if (window.mostrarMensaje) window.mostrarMensaje('Error al exportar');
    } finally {
      hideSpinner();
    }
  });

  checkHealth();

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
