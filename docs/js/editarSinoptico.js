import { getAll } from './dataService.js';
import { isAdmin } from './session.js';

if (!isAdmin()) {
  location.href = 'index.html';
}

const selector = document.getElementById('productSelector');
const stepsContainer = document.getElementById('stepsContainer');
const addBtn = document.getElementById('addStep');
const saveBtn = document.getElementById('saveBtn');

let currentId = '';
let currentSteps = [];

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('sinopticoPasos') || '{}');
  } catch {
    return {};
  }
}

function saveToStorage(obj) {
  localStorage.setItem('sinopticoPasos', JSON.stringify(obj));
}

function fetchSinoptico(productoId) {
  const all = loadFromStorage();
  return Array.isArray(all[productoId]) ? all[productoId] : [];
}

function saveSinoptico(productoId, data) {
  const all = loadFromStorage();
  all[productoId] = Array.isArray(data) ? data : [];
  saveToStorage(all);
}

function registrarHistorial(entry) {
  const hist = JSON.parse(localStorage.getItem('sinopticoHist') || '[]');
  hist.push({ ...entry, timestamp: new Date().toISOString() });
  localStorage.setItem('sinopticoHist', JSON.stringify(hist));
}

function renderSteps() {
  stepsContainer.innerHTML = '';
  currentSteps
    .sort((a, b) => a.orden - b.orden)
    .forEach((step, idx) => {
      const row = document.createElement('div');
      row.className = 'step-row';
      row.innerHTML = `
        <input type="number" class="orden" value="${step.orden}" />
        <input type="text" class="nombre" placeholder="Nombre" value="${
          step.nombre || ''
        }">
        <input type="text" class="descripcion" placeholder="Descripción" value="${
          step.descripcion || ''
        }">
        <input type="text" class="tipo" placeholder="Tipo" value="${
          step.tipo || ''
        }">
        <input type="text" class="link" placeholder="Link" value="${
          step.link || ''
        }">
        <button class="up" type="button">↑</button>
        <button class="down" type="button">↓</button>
        <button class="del" type="button">🗑</button>
      `;
      stepsContainer.appendChild(row);
      row.querySelector('.up').addEventListener('click', () => {
        if (idx === 0) return;
        [currentSteps[idx - 1], currentSteps[idx]] = [
          currentSteps[idx],
          currentSteps[idx - 1],
        ];
        renderSteps();
      });
      row.querySelector('.down').addEventListener('click', () => {
        if (idx === currentSteps.length - 1) return;
        [currentSteps[idx + 1], currentSteps[idx]] = [
          currentSteps[idx],
          currentSteps[idx + 1],
        ];
        renderSteps();
      });
      row.querySelector('.del').addEventListener('click', () => {
        currentSteps.splice(idx, 1);
        renderSteps();
      });
    });
}

addBtn.addEventListener('click', () => {
  const next = currentSteps.length + 1;
  currentSteps.push({
    orden: next,
    nombre: '',
    descripcion: '',
    tipo: '',
    link: '',
  });
  renderSteps();
});

selector.addEventListener('change', async () => {
  currentId = selector.value;
  currentSteps = fetchSinoptico(currentId).slice();
  renderSteps();
});

saveBtn.addEventListener('click', () => {
  currentSteps = Array.from(stepsContainer.children).map((row, i) => ({
    orden: parseInt(row.querySelector('.orden').value, 10) || i + 1,
    nombre: row.querySelector('.nombre').value,
    descripcion: row.querySelector('.descripcion').value,
    tipo: row.querySelector('.tipo').value,
    link: row.querySelector('.link').value,
  }));
  saveSinoptico(currentId, currentSteps);
  registrarHistorial({ productoId: currentId });
  alert('Sinóptico guardado');
});

(async function loadProducts() {
  const data = await getAll('sinoptico');
  const productos = Array.isArray(data)
    ? data.filter(n => n.Tipo === 'Pieza final' || n.Tipo === 'Producto')
    : [];
  selector.innerHTML =
    '<option value="">Seleccione…</option>' +
    productos
      .map(p => `<option value="${p.ID}">${p.Descripcion || p.Descripción}</option>`)
      .join('');
})();
