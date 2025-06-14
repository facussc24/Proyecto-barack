import { getAll, ready } from '../dataService.js';

export async function render(container) {
  container.innerHTML = '<h1>Ajustes de la aplicación</h1>';
  // Muestra el número de elementos cargados en sinoptico
  await ready;
  const data = await getAll('sinoptico');
  const p = document.createElement('p');
  p.textContent = `Registros en sinóptico: ${data.length}`;
  container.appendChild(p);
}
