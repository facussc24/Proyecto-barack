// Toggle dark mode and remember choice
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('toggleTheme');
  if (!btn) return;
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }
  btn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const mode = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', mode);
  });
});
