// Página de inicio con enlaces directos a las herramientas

export function render(container) {
  container.innerHTML = `
    <section class="hero">
      <div class="hero-content">
        <h1>Ingeniería Barack</h1>
        <p class="tagline">Soluciones modernas para tu negocio</p>
      </div>
    </section>
    <section class="home-menu">
      <div class="menu-grid">
        <a href="sinoptico-editor.html" class="menu-item no-guest">Editar Sinóptico</a>
        <a href="sinoptico.html" class="menu-item">Ver Sinóptico</a>
        <a href="#/amfe" class="menu-item">AMFE</a>
        <a href="maestro.html" class="menu-item">Listado Maestro</a>
        <a href="maestro_editor.html" class="menu-item no-guest">Editar Maestro</a>
        <a href="database.html" class="menu-item no-guest">Base de Datos</a>
        <a href="history.html" class="menu-item admin-only">Historial</a>
        <a href="#/settings" class="menu-item no-guest">Ajustes</a>
      </div>
      <div class="db-actions no-guest">
        <button id="importBtn">Importar datos</button>
        <input id="importFile" type="file" accept="application/json" hidden>
      </div>
    </section>
  `;

  const importBtn = container.querySelector('#importBtn');
  const fileInput = container.querySelector('#importFile');

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
