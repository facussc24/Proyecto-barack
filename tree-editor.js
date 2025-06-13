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
});
