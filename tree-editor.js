'use strict';
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('isAdmin') !== 'true') {
    alert('Debe iniciar sesión para editar');
    location.href = 'login.html';
    return;
  }

  sessionStorage.setItem('sinopticoEdit', 'true');
  document.dispatchEvent(new Event('sinoptico-mode'));

  const crear = document.getElementById('menuCrear');
  if (crear) {
    crear.addEventListener('click', () => {
      location.href = 'sinoptico_crear.html';
    });
  }

  const eliminar = document.getElementById('menuEliminar');
  if (eliminar) {
    eliminar.addEventListener('click', () => {
      location.href = 'sinoptico_eliminar.html';
    });
  }

  const modificar = document.getElementById('menuModificar');
  if (modificar) {
    modificar.addEventListener('click', () => {
      location.href = 'sinoptico_modificar.html';
    });
  }
});
