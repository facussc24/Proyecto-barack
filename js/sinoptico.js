import { getAll, subscribeToChanges } from './dataService.js';
import '../renderer.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('▶ renderSinoptico arrancó');
  sessionStorage.setItem('sinopticoEdit', 'false');
  const nodes = await getAll();
  console.log('▷ nodos obtenidos', nodes);
  if (typeof renderSinoptico === 'function') {
    renderSinoptico(nodes);
  }
  const loader = document.getElementById('loading');
  if (loader) loader.style.display = 'none';
  console.log('▶ spinner oculto');

  subscribeToChanges(async () => {
    const updated = await getAll();
    if (typeof renderSinoptico === 'function') {
      renderSinoptico(updated);
    }
  });
});
