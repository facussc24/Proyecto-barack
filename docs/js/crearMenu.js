export function initCrearMenu() {
  const menuBtn = document.getElementById('btnMenuCrear');
  const dropdown = menuBtn?.nextElementSibling;
  if (!menuBtn || !dropdown) return;
  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.parentElement.classList.toggle('open');
  });
  window.addEventListener('click', e => {
    if (!dropdown.parentElement.contains(e.target)) {
      dropdown.parentElement.classList.remove('open');
    }
  });
}

if (typeof window !== 'undefined') {
  window.initCrearMenu = initCrearMenu;
  document.addEventListener('DOMContentLoaded', initCrearMenu);
}
