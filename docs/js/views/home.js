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
  }
}

function loadModules(el) {
  const modules = [
    {
      main: 'sinoptico-editor.html',
      icon: '📝',
      text: 'Editar Sinóptico',
      actions: [
        { label: 'Editar Sinóptico', href: 'sinoptico-editor.html' },
        { label: 'Ver Sinóptico', href: 'sinoptico.html' },
      ],
      class: 'no-guest',
    },
    {
      main: 'sinoptico.html',
      icon: '📄',
      text: 'Ver Sinóptico',
      actions: [
        { label: 'Ver Sinóptico', href: 'sinoptico.html' },
        { label: 'Editar Sinóptico', href: 'sinoptico-editor.html' },
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
      main: 'maestro.html',
      icon: '📋',
      text: 'Listado Maestro',
      actions: [
        { label: 'Ver maestro', href: 'maestro.html' },
        { label: 'Exportar maestro', href: 'maestro.html#export' },
      ],
    },
    {
      main: 'maestro_editor.html',
      icon: '✏️',
      text: 'Editar Maestro',
      actions: [
        { label: 'Editar maestro', href: 'maestro_editor.html' },
        { label: 'Ver maestro', href: 'maestro.html' },
      ],
      class: 'no-guest',
    },
    {
      main: 'database.html',
      icon: '🗄️',
      text: 'Sinóptico de Base de Datos',
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
    {
      main: '#/settings',
      icon: '⚙️',
      text: 'Ajustes',
      actions: [],
      class: 'no-guest',
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
