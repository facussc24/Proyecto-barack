import { getAll, ready } from '../dataService.js';

export async function render(container) {
  container.innerHTML = `
    <h1>Ajustes de la aplicación</h1>
    <section class="dev-options">
      <label>
        Brillo de la página:
        <input id="brightnessRange" type="range" min="50" max="150" step="10">
        <span id="brightnessValue"></span>
      </label>
      <label>
        <input type="checkbox" id="toggleVersionOverlay">
        Mostrar versión en pantalla
      </label>
      <label>
        <input type="checkbox" id="toggleGridOverlay">
        Mostrar cuadrícula
      </label>
      <label>
        URL de la API:
        <input id="apiUrlInput" type="text">
      </label>
    </section>
    <p id="apiUrlDisplay"></p>`;

  await ready;
  const data = await getAll('sinoptico');
  const p = document.createElement('p');
  p.textContent = `Registros en sinóptico: ${data.length}`;
  container.appendChild(p);

  const range = container.querySelector('#brightnessRange');
  const valueLabel = container.querySelector('#brightnessValue');
  const versionChk = container.querySelector('#toggleVersionOverlay');
  const gridChk = container.querySelector('#toggleGridOverlay');
  const apiInput = container.querySelector('#apiUrlInput');
  const apiDisplay = container.querySelector('#apiUrlDisplay');

  const currentApi =
    localStorage.getItem('API_URL') || (typeof window !== 'undefined' && window.API_URL) || '';
  apiInput.value = currentApi;
  apiDisplay.textContent = 'URL actual: ' + (currentApi || '(vacía)');
  apiInput.addEventListener('change', ev => {
    localStorage.setItem('API_URL', ev.target.value.trim());
    location.reload();
  });

  const storedBrightness = localStorage.getItem('pageBrightness') || '100';
  range.value = storedBrightness;
  valueLabel.textContent = storedBrightness + '%';

  range.addEventListener('input', ev => {
    const val = ev.target.value;
    document.documentElement.style.setProperty('--page-brightness', val + '%');
    valueLabel.textContent = val + '%';
  });
  range.addEventListener('change', ev => {
    localStorage.setItem('pageBrightness', ev.target.value);
  });

  const overlay = document.querySelector('.version-info');
  const showVersion = localStorage.getItem('showVersion');
  const show = showVersion !== 'false';
  versionChk.checked = show;
  if (overlay) overlay.style.display = show ? 'block' : 'none';

  versionChk.addEventListener('change', ev => {
    const state = ev.target.checked;
    if (overlay) overlay.style.display = state ? 'block' : 'none';
    localStorage.setItem('showVersion', state);
  });

  const gridState = localStorage.getItem('showGrid') === 'true';
  gridChk.checked = gridState;
  document.body.classList.toggle('grid-overlay', gridState);
  gridChk.addEventListener('change', ev => {
    const val = ev.target.checked;
    document.body.classList.toggle('grid-overlay', val);
    localStorage.setItem('showGrid', val);
  });

}
