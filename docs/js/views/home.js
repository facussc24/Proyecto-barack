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
      <div class="menu-grid" id="moduleGrid"></div>
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
  const moduleGrid = container.querySelector('#moduleGrid');
  if (moduleGrid) loadModules(moduleGrid);
}

function showSpinner() {
  const el = document.getElementById('loading');
  if (el) el.style.display = 'flex';
}

function hideSpinner() {
  const el = document.getElementById('loading');
  if (el) el.style.display = 'none';
}

async function loadKpis(el) {
  showSpinner();
  try {
    let stats = {};
    let history = [];
    try {
      const [statsRes, histRes] = await Promise.all([
        fetch('/api/db-stats'),
        fetch('/api/history'),
      ]);
      if (statsRes.ok) stats = await statsRes.json();
      if (histRes.ok) history = await histRes.json();
    } catch {
      stats = window.mockStats || {};
      history = window.mockHistory || [];
    }
    const data = [
      { icon: '📦', label: 'Productos', value: stats.Producto || 0 },
      { icon: '🧩', label: 'Subproductos', value: stats.Subproducto || 0 },
      { icon: '🛠️', label: 'Insumos', value: stats.Insumo || 0 },
      { icon: '👥', label: 'Clientes', value: stats.Cliente || 0 },
      { icon: '📝', label: 'Cambios', value: history.length },
    ];
    el.innerHTML = data
      .map((d, i) => {
        const trend = Array.from({ length: 12 }, () => Math.max(0, d.value + Math.round((Math.random() - 0.5) * d.value)));
        return `\n      <div class="kpi-card" title="${trend.join(', ')}">\n        <span class="kpi-icon" aria-hidden="true">${d.icon}</span>\n        <span class="kpi-number">${d.value}</span>\n        <span class="kpi-label">${d.label}</span>\n        <canvas id="spark${i}" class="kpi-sparkline" width="100" height="30"></canvas>\n      </div>`;
      })
      .join('');
    data.forEach((d, i) => {
      const ctx = document.getElementById(`spark${i}`);
      if (!ctx) return;
      const trend = ctx.parentElement.title.split(', ').map(Number);
      new Chart(ctx, {
        type: 'line',
        data: { labels: trend.map((_, j) => j + 1), datasets: [{ data: trend, borderColor: '#4e79a7', tension: 0.3, fill: false, pointRadius: 0 }] },
        options: { plugins: { legend: false }, scales: { x: { display: false }, y: { display: false } } }
      });
    });
  } catch (err) {
    console.error('KPI fetch failed', err);
    if (window.mostrarMensaje) window.mostrarMensaje('Error al cargar');
  }
  hideSpinner();
  if (window.mostrarMensaje) window.mostrarMensaje('Guardado', 'success');
}

function loadModules(el) {
  const modules = [
    {
      main: '#/sinoptico',
      icon: '📄',
      text: 'Ver Sinóptico',
      actions: [
        { label: 'Ver Sinóptico', href: '#/sinoptico' },
      ],
    },
    {
      main: '#/amfe',
      icon: '🔧',
      text: 'AMFE',
      actions: [
        { label: 'Editar AMFE', href: '#/amfe' },
        { label: 'Ver AMFE', href: '#/amfe' },
      ],
    },
    {
      main: 'arbol.html',
      icon: '🌳',
      text: 'Árbol de Producto',
      actions: [
        { label: 'Crear Árbol', href: 'arbol.html' },
        { label: 'Asistente', href: 'asistente.html' },
      ],
      class: 'no-guest',
    },
    {
      main: '#/maestro',
      icon: '📋',
      text: 'Listado Maestro',
      actions: [
        { label: 'Ver maestro', href: '#/maestro' },
      ],
    },
    {
      main: 'registros.html',
      icon: '🗄️',
      text: 'Sinóptico de Registros',
      actions: [],
      class: 'no-guest',
    },
    {
      main: 'dbviewer.html',
      icon: '💾',
      text: 'Base de Datos',
      actions: [],
      class: 'no-guest',
    },
    {
      main: 'history.html',
      icon: '📜',
      text: 'Historial',
      actions: [],
      class: 'admin-only',
    },
  ];

  el.innerHTML = modules
    .map(
      (m) => `\n      <div class="menu-item card ${m.class || ''}" data-main="${m.main}">\n        <span class="menu-icon" aria-hidden="true">${m.icon}</span>\n        <span class="menu-text">${m.text}</span>\n        <div class="menu-actions">${m.actions
          .map((a) => `<a href="${a.href}">${a.label}</a>`)
          .join(' ')}</div>\n      </div>`
    )
    .join('');

  el.querySelectorAll('.menu-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.menu-actions')) return;
      const link = item.dataset.main;
      if (link) window.location.href = link;
    });
  });
}
