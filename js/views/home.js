// Página de inicio con enlaces directos a las herramientas

export function render(container) {
  container.innerHTML = `
    <section class="hero">
      <h1>Ingeniería Barack</h1>
      <p class="tagline">Soluciones modernas para tu negocio</p>
    <div class="quick-links">
      <a href="sinoptico-editor.html" class="btn-link no-guest">Editar Sinóptico</a>
      <a href="sinoptico.html" class="btn-link">Ver Sinóptico</a>
      <a href="#/amfe" class="btn-link">AMFE</a>
    </div>
    </section>
    <section class="intro">
      <h1>Características</h1>
      <ul class="features">
        <li>Gestión avanzada de AMFE</li>
        <li>Visualización de sinóptico interactivo</li>
        <li>Modo oscuro integrado</li>
      </ul>
      <div class="db-actions no-guest">
        <button id="exportBtn">Exportar datos</button>
        <button id="importBtn">Importar datos</button>
        <input id="importFile" type="file" accept="application/json" hidden>
      </div>
    </section>
  `;

  const exportBtn = container.querySelector('#exportBtn');
  const importBtn = container.querySelector('#importBtn');
  const fileInput = container.querySelector('#importFile');

  exportBtn.addEventListener('click', async () => {
    const json = await window.dataService.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'base_datos.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async ev => {
    const file = ev.target.files[0];
    if (!file) return;
    const text = await file.text();
    await window.dataService.importJSON(text);
    alert('Datos importados');
    fileInput.value = '';
  });
}
