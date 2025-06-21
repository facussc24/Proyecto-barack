import { getAll, exportJSON, importJSON } from '../dataService.js';
import { createSinopticoEditor } from '../editors/sinopticoEditor.js';
import { isAdmin } from '../session.js';

export async function render(container) {
  const editBtnHtml = isAdmin() ? '<button id="sin-edit">Editar</button>' : '';
  container.innerHTML = `
    <div class="toolbar">
      ${editBtnHtml}
      <a id="linkCrear" href="asistente.html">Crear</a>
      <a id="linkBaseDatos" href="database.html">Base de Datos</a>
      <div class="export-group">
        <button data-fmt="excel" id="btnExcel" class="btn-excel">Excel</button>
        <button data-fmt="pdf" id="btnPdf" class="btn-pdf">PDF</button>
        <button id="btnExportJson" class="btn-json">JSON</button>
        <button id="btnImportJson" class="btn-json admin-only">Importar</button>
        <input id="jsonFileInput" type="file" accept="application/json" hidden />
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

  const excelBtn = container.querySelector('#btnExcel');
  const pdfBtn = container.querySelector('#btnPdf');
  const exportJsonBtn = container.querySelector('#btnExportJson');
  const importJsonBtn = container.querySelector('#btnImportJson');
  const fileInput = container.querySelector('#jsonFileInput');

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
      excelBtn.disabled = true;
      pdfBtn.disabled = true;
    }
  }

  async function exportServer(fmt) {
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
      throw e;
    } finally {
      hideSpinner();
    }
  }

  excelBtn?.addEventListener('click', () => exportServer('excel').catch(() => {
    if (window.mostrarMensaje) window.mostrarMensaje('Error al exportar');
  }));

  pdfBtn?.addEventListener('click', async () => {
    try {
      await exportServer('pdf');
    } catch {
      try {
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF || !jsPDF.API.autoTable) throw new Error('fallback');
        const doc = new jsPDF();
        doc.autoTable({ html: '#sinoptico' });
        doc.save('sinoptico.pdf');
        if (window.mostrarMensaje) window.mostrarMensaje('Exportación completa', 'success');
      } catch {
        if (window.mostrarMensaje) window.mostrarMensaje('Error al exportar');
      }
    }
  });

  exportJsonBtn?.addEventListener('click', async () => {
    try {
      const json = await exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sinoptico.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (window.mostrarMensaje) window.mostrarMensaje('Exportación completa', 'success');
    } catch {
      if (window.mostrarMensaje) window.mostrarMensaje('Error al exportar');
    }
  });

  importJsonBtn?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importJSON(text);
      if (window.mostrarMensaje) window.mostrarMensaje('Importación completa', 'success');
      document.dispatchEvent(new Event('sinoptico-mode'));
    } catch (e) {
      console.error(e);
      if (window.mostrarMensaje) window.mostrarMensaje('Error al importar');
    } finally {
      fileInput.value = '';
    }
  });

  checkHealth();


  container.querySelector('#sin-edit')?.addEventListener('click', () => {
    sessionStorage.setItem('sinopticoEdit', 'true');
    document.dispatchEvent(new Event('sinoptico-mode'));
  });



}

// expose editor factory for renderer.js
export { createSinopticoEditor };
if (typeof window !== 'undefined') {
  window.createSinopticoEditor = createSinopticoEditor;
}
