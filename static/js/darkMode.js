document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('toggleDarkMode');
  if (!btn) return;
  const apply = state => {
    document.body.classList.toggle('dark-mode', state);
    document.documentElement.classList.toggle('dark-mode', state);
  };
  const stored = localStorage.getItem('darkMode');
  apply(stored === 'true');
  btn.addEventListener('click', () => {
    const active = document.body.classList.contains('dark-mode');
    apply(!active);
    localStorage.setItem('darkMode', !active);
  });
});
