import { exportJSON, importJSON } from '../dataService.js';

export function render(container) {
  container.innerHTML = `
    <section class="hero">
      <h1>Ingeniería Barack</h1>
      <p class="tagline">Soluciones modernas para tu negocio</p>
      <div class="import-export">
        <button id="saveJSON">Guardar JSON</button>
        <input id="jsonFile" type="file" accept="application/json" hidden>
        <button id="loadJSON">Cargar JSON</button>
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

  container.querySelector('#saveJSON').addEventListener('click', async () => {
    const json = await exportJSON();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = 'sinoptico.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const fileInput = container.querySelector('#jsonFile');
  container.querySelector('#loadJSON').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async ev => {
    const file = ev.target.files[0];
    if (!file) return;
    const text = await file.text();
    await importJSON(text);
  });
}
