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
        <input type="checkbox" id="toggleEditMode">
        Activar edición de Sinóptico
      </label>
    </section>`;

  await ready;
  const data = await getAll('sinoptico');
  const p = document.createElement('p');
  p.textContent = `Registros en sinóptico: ${data.length}`;
  container.appendChild(p);

  const range = container.querySelector('#brightnessRange');
  const valueLabel = container.querySelector('#brightnessValue');
  const versionChk = container.querySelector('#toggleVersionOverlay');
  const gridChk = container.querySelector('#toggleGridOverlay');
  const editChk = container.querySelector('#toggleEditMode');

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

  const editState = localStorage.getItem('defaultEditMode') === 'true';
  editChk.checked = editState;
  if (editState) sessionStorage.setItem('sinopticoEdit', 'true');
  editChk.addEventListener('change', ev => {
    const val = ev.target.checked;
    sessionStorage.setItem('sinopticoEdit', val.toString());
    localStorage.setItem('defaultEditMode', val.toString());
    document.dispatchEvent(new Event('sinoptico-mode'));
  });
}
