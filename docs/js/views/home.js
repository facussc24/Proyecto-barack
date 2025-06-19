// Página de inicio con enlaces directos a las herramientas

export function render(container) {
  container.innerHTML = `
    <section class="hero">
      <div class="hero-content">
        <h1>Ingeniería Barack</h1>
        <div class="tagline-card">
          <p class="tagline">Soluciones modernas para tu negocio</p>
          <p id="reviewCount" class="review-count"></p>
        </div>
      </div>
    </section>
    <section class="kpi-panel">
      <div class="kpi-grid" id="kpiGrid"></div>
    </section>
    <section class="home-menu">
      <div class="menu-grid">
        <a href="sinoptico-editor.html" class="menu-item card no-guest">
          <span class="menu-icon" aria-hidden="true">📝</span>
          <span class="menu-text">Editar Sinóptico</span>
        </a>
        <a href="sinoptico.html" class="menu-item card">
          <span class="menu-icon" aria-hidden="true">📄</span>
          <span class="menu-text">Ver Sinóptico</span>
        </a>
        <a href="#/amfe" class="menu-item card">
          <span class="menu-icon" aria-hidden="true">🔧</span>
          <span class="menu-text">AMFE</span>
        </a>
        <a href="maestro.html" class="menu-item card">
          <span class="menu-icon" aria-hidden="true">📋</span>
          <span class="menu-text">Listado Maestro</span>
        </a>
        <a href="maestro_editor.html" class="menu-item card no-guest">
          <span class="menu-icon" aria-hidden="true">✏️</span>
          <span class="menu-text">Editar Maestro</span>
        </a>
        <a href="database.html" class="menu-item card no-guest">
          <span class="menu-icon" aria-hidden="true">🗄️</span>
          <span class="menu-text">Base de Datos</span>
        </a>
        <a href="history.html" class="menu-item card admin-only">
          <span class="menu-icon" aria-hidden="true">📜</span>
          <span class="menu-text">Historial</span>
        </a>
        <a href="#/settings" class="menu-item card no-guest">
          <span class="menu-icon" aria-hidden="true">⚙️</span>
          <span class="menu-text">Ajustes</span>
        </a>
      </div>
    </section>
  `;

  const reviewCountEl = container.querySelector('#reviewCount');
  const count = parseInt(localStorage.getItem('reviewCount') || '0', 10);
  if (count > 0) {
    reviewCountEl.textContent = `Hoy ${count} archivos por revisar`;
  } else {
    reviewCountEl.remove();
  }


  const kpiGrid = container.querySelector('#kpiGrid');
  if (kpiGrid) loadKpis(kpiGrid);
}

async function loadKpis(el) {
  try {
    let products = [];
    let history = [];
    if (window.API_BASE) {
      const [prodRes, histRes] = await Promise.all([
        fetch(`${window.API_BASE}/api/products`),
        fetch(`${window.API_BASE}/api/history`),
      ]);
      if (prodRes.ok) products = await prodRes.json();
      if (histRes.ok) history = await histRes.json();
    } else {
      products = window.mockProducts || [];
      history = window.mockHistory || [];
    }
    const pending = products.filter(p => p.pending).length;
    const completed = products.length - pending;
    const data = [
      { icon: '📦', label: 'Productos', value: products.length },
      { icon: '⏳', label: 'Pendientes', value: pending },
      { icon: '✅', label: 'Completados', value: completed },
      { icon: '📝', label: 'Cambios', value: history.length },
    ];
    el.innerHTML = data
      .map(
        d => `\n      <div class="kpi-card">\n        <span class="kpi-icon" aria-hidden="true">${d.icon}</span>\n        <span class="kpi-number">${d.value}</span>\n        <span class="kpi-label">${d.label}</span>\n      </div>`
      )
      .join('');
  } catch (err) {
    console.error('KPI fetch failed', err);
  }
}
