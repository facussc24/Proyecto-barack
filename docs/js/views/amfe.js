import { getAll, ready, subscribeToChanges, syncNow } from '../dataService.js';

export async function render(container) {
  await syncNow();
  container.innerHTML = `
    <h1>AMFE</h1>
    <button id="amfe-export" aria-label="Opciones de exportación" title="Opciones de exportación">Exportar...</button>
    <div class="export-menu">
      <button data-fmt="excel" aria-label="Exportar a Excel" title="Exportar a Excel">Excel</button> |
      <button data-fmt="pdf" aria-label="Exportar a PDF" title="Exportar a PDF">PDF</button>
    </div>
    <div id="amfe"></div>
  `;

  async function load() {
    await ready;
    const data = await getAll('amfe');
    if (typeof window.renderAMFE === 'function') {
      window.renderAMFE(data);
    }
  }

  await load();
  subscribeToChanges(load);

  const exportBtn = container.querySelector('#amfe-export');
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
      // Interception point: set localStorage.setItem('useMock','true') to
      // bypass the network request and provide your own Blob when testing
      // offline or mocking the server.
      const resp = await fetch(`/api/amfe/export?format=${fmt}`);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Error al exportar');
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const ext = fmt === 'excel' ? 'xlsx' : 'pdf';
      const a = document.createElement('a');
      a.href = url;
      a.download = `amfe.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (window.mostrarMensaje) window.mostrarMensaje('Exportación completa', 'success');
    } catch (e) {
      const err = e && e.message ? e.message : 'Error al exportar';
      if (window.mostrarMensaje) window.mostrarMensaje(err);
    } finally {
      hideSpinner();
    }
  });

  checkHealth();
}
