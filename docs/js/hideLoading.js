document.addEventListener('DOMContentLoaded', async () => {
  const loader = document.getElementById('loading');
  if (!loader) return;

  try {
    const { initialized } = await import('./dataService.js');
    await initialized;
  } catch (e) {
    console.error('Error loading dataService', e);
    if (window.mostrarMensaje) {
      window.mostrarMensaje('Error al inicializar la aplicación');
    }
  } finally {
    loader.style.display = 'none';
  }
});
