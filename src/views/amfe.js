import { getAll } from '../dataService.js';

export async function render(container) {
  container.innerHTML = `
    <h1>AMFE</h1>
    <pre id="amfe-list"></pre>
  `;

  const data = await getAll('amfe');
  const pre = container.querySelector('#amfe-list');
  pre.textContent = JSON.stringify(data, null, 2);
}
