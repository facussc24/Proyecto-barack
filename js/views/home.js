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
    </section>
  `;

  // sin lógica adicional
}
