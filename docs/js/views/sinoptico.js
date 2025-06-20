import { getAll } from '../dataService.js';
import { createSinopticoEditor } from '../editors/sinopticoEditor.js';

export async function render(container) {
  container.innerHTML = `
    <div class="toolbar">
      <button id="sin-edit">Editar</button>
      <a id="linkCrear" href="asistente.html">Crear</a>
      <a id="linkBaseDatos" href="database.html">Base de Datos</a>
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
      // Interception point: developers can set localStorage.setItem('useMock','true')
      // to skip the network call and provide local data when running offline.
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


  container.querySelector('#sin-edit').addEventListener('click', () => {
    const curr = sessionStorage.getItem('sinopticoEdit') === 'true';
    sessionStorage.setItem('sinopticoEdit', (!curr).toString());
    document.dispatchEvent(new Event('sinoptico-mode'));
  });



}

// expose editor factory for renderer.js
export { createSinopticoEditor };
if (typeof window !== 'undefined') {
  window.createSinopticoEditor = createSinopticoEditor;
}
