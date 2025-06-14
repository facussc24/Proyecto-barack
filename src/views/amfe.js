import { getAll } from '../dataService.js';

export async function render(container) {
  container.innerHTML = `
    <h1>AMFE</h1>
    <div id="amfe"></div>
  `;

  const data = await getAll('amfe');
  if (typeof window.renderAMFE === 'function') {
    window.renderAMFE(data);
  }
}
