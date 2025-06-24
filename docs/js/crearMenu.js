export function initCrearMenu() {
  const menuBtn = document.getElementById('btnMenuCrear');
  const dropdown = menuBtn?.closest('.dropdown');
  if (!menuBtn || !dropdown) return;
  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });
  window.addEventListener('click', e => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}

if (typeof window !== 'undefined') {
  window.initCrearMenu = initCrearMenu;
  document.addEventListener('DOMContentLoaded', initCrearMenu);
}
