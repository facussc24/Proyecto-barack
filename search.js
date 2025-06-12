// Utilidad para "debounce". Ejecuta fn 300ms luego del ultimo llamado
function debounce(fn, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Datos cargados desde data/sinoptico.csv
let data = [];

const state = {
  maestro: { query: '', filter: '' },
  sinoptico: { query: '', filter: '' }
};

const maestroInput = document.getElementById('maestro-input');
const maestroFilter = document.getElementById('maestro-filter');
const maestroChip = document.getElementById('maestro-chip');
const maestroLoader = document.getElementById('maestro-loader');

const sinInput = document.getElementById('sinoptico-input');
const sinFilter = document.getElementById('sinoptico-filter');
const sinChip = document.getElementById('sinoptico-chip');
const sinLoader = document.getElementById('sinoptico-loader');

const resultsEl = document.getElementById('results');

function renderChips() {
  maestroChip.innerHTML = '';
  sinChip.innerHTML = '';
  if (state.maestro.filter) {
    maestroChip.appendChild(createChip(state.maestro.filter, () => {
      maestroFilter.value = '';
      state.maestro.filter = '';
      updateResults();
    }));
  }
  if (state.sinoptico.filter) {
    sinChip.appendChild(createChip(state.sinoptico.filter, () => {
      sinFilter.value = '';
      state.sinoptico.filter = '';
      updateResults();
    }));
  }
}

function createChip(text, onRemove) {
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.textContent = text;
  const btn = document.createElement('button');
  btn.setAttribute('aria-label', 'Eliminar filtro');
  btn.innerHTML = '&times;';
  btn.addEventListener('click', onRemove);
  chip.appendChild(btn);
  return chip;
}

// Filtro de datos segun el estado
function filterData() {
  return data.filter(item => {
    const q1 = state.maestro.query.toLowerCase();
    const q2 = state.sinoptico.query.toLowerCase();
    const matchesMaestro = !q1 || item.nombre.toLowerCase().includes(q1);
    const matchesSin = !q2 || item.nombre.toLowerCase().includes(q2);
    const filterMaestro = !state.maestro.filter || item.tipoMaestro === state.maestro.filter;
    const filterSin = !state.sinoptico.filter || item.tipoSinoptico === state.sinoptico.filter;
    return matchesMaestro && matchesSin && filterMaestro && filterSin;
  });
}

function showLoader(module, show) {
  module.style.display = show ? 'block' : 'none';
}

function updateResults() {
  showLoader(maestroLoader, false);
  showLoader(sinLoader, false);
  renderChips();
  const results = filterData();
  resultsEl.innerHTML = '';
  if (!results.length) {
    resultsEl.innerHTML = '<div class="no-results">No se encontraron coincidencias.</div>';
    return;
  }
  results.forEach(r => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.textContent = r.nombre;
    resultsEl.appendChild(div);
  });
}

const processMaestro = debounce(() => {
  showLoader(maestroLoader, false);
  updateResults();
});

const processSin = debounce(() => {
  showLoader(sinLoader, false);
  updateResults();
});

maestroInput.addEventListener('input', () => {
  showLoader(maestroLoader, true);
  state.maestro.query = maestroInput.value;
  processMaestro();
});

sinInput.addEventListener('input', () => {
  showLoader(sinLoader, true);
  state.sinoptico.query = sinInput.value;
  processSin();
});

maestroFilter.addEventListener('change', () => {
  state.maestro.filter = maestroFilter.value;
  updateResults();
});

sinFilter.addEventListener('change', () => {
  state.sinoptico.filter = sinFilter.value;
  updateResults();
});

// Cerrar dropdowns al hacer click fuera
window.addEventListener('click', e => {
  document.querySelectorAll('.has-dropdown').forEach(d => {
    if (!d.contains(e.target)) {
      d.querySelectorAll('.dropdown').forEach(menu => {
        menu.style.display = '';
      });
      const link = d.querySelector('a');
      if (link) link.setAttribute('aria-expanded', 'false');
    }
  });
});

// Alternar menús desplegables en dispositivos táctiles
document.querySelectorAll('.has-dropdown > a').forEach(link => {
  link.addEventListener('click', e => {
    const submenu = link.nextElementSibling;
    if (!submenu) return;
    const expanded = link.getAttribute('aria-expanded') === 'true';
    e.preventDefault();
    link.setAttribute('aria-expanded', String(!expanded));
    submenu.style.display = expanded ? '' : 'block';
  });
});

function loadCsvData() {
  showLoader(maestroLoader, true);
  showLoader(sinLoader, true);
  fetch('data/sinoptico.csv')
    .then(resp => {
      if (!resp.ok) throw new Error('CSV no encontrado');
      return resp.text();
    })
    .then(text => {
      const parsed = Papa.parse(text, { header: true, delimiter: ';' });
      data = parsed.data.map(r => ({
        nombre: r['Descripción'] || '',
        tipoMaestro: (r['Tipo'] || '').toLowerCase(),
        // Use the "Tipo" column to build the sinoptico category dropdown
        tipoSinoptico: (r['Tipo'] || '').toLowerCase()
      }));
      updateResults();
    })
    .catch(err => {
      console.error(err);
      data = [];
      updateResults();
    });
}

// Inicial
loadCsvData();
