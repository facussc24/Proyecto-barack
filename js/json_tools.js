import { getAll, replaceAll } from './dataService.js';

document.addEventListener('DOMContentLoaded', () => {
  const tools = document.getElementById('jsonTools');
  if (!tools) return;
  const exportBtn = document.getElementById('exportJsonBtn');
  const importInput = document.getElementById('importJsonInput');

  const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
  tools.style.display = isAdmin ? 'block' : 'none';
  if (!isAdmin) return;

  exportBtn.addEventListener('click', async () => {
    try {
      const data = await getAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'sinoptico.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
      console.error('Error al exportar JSON', e);
      alert('No se pudo exportar los datos');
    }
  });

  importInput.addEventListener('change', async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error('Formato inválido');
      await replaceAll(arr);
      alert('Datos importados correctamente');
    } catch (err) {
      console.error('Error al importar JSON', err);
      alert('No se pudo importar el archivo');
    } finally {
      ev.target.value = '';
    }
  });
});
