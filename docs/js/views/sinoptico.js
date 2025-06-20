import { getAll } from '../dataService.js';
import { createSinopticoEditor } from '../editors/sinopticoEditor.js';

export async function render(container) {
  container.innerHTML = `
    <div class="toolbar">
      <button id="sin-edit">Editar</button>
      <a id="linkCrear" href="asistente.html">Crear</a>
      <a id="linkBaseDatos" href="database.html">Base de Datos</a>
      <div class="export-group">
        <button data-fmt="excel" id="btnExcel" class="btn-excel">Excel</button>
        <button data-fmt="pdf" id="btnPdf" class="btn-pdf">PDF</button>
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
