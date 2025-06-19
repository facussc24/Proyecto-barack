// Página de inicio con enlaces directos a las herramientas

export function render(container) {
  container.innerHTML = `
    <section class="kpi-panel">
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-icon" aria-hidden="true">📈</span>
          <span class="kpi-number">120</span>
          <span class="kpi-label">Proyectos</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon" aria-hidden="true">👥</span>
          <span class="kpi-number">50</span>
          <span class="kpi-label">Clientes</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon" aria-hidden="true">⚙️</span>
          <span class="kpi-number">300</span>
          <span class="kpi-label">Equipos</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon" aria-hidden="true">⭐</span>
          <span class="kpi-number">95%</span>
          <span class="kpi-label">Satisfacción</span>
        </div>
      </div>
    </section>
    <section class="hero">
      <div class="hero-content">
        <h1>Ingeniería Barack</h1>
        <div class="tagline-card">
          <p class="tagline">Soluciones modernas para tu negocio</p>
          <p id="reviewCount" class="review-count"></p>
        </div>
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
  const reviewCountEl = container.querySelector('#reviewCount');
  const count = parseInt(localStorage.getItem('reviewCount') || '0', 10);
  if (count > 0) {
    reviewCountEl.textContent = `Hoy ${count} archivos por revisar`;
  } else {
    reviewCountEl.remove();
  }

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
