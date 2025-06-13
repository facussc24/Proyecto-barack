'use strict';
// Toggle dark mode and remember choice
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('toggleTheme');
  if (!btn) return;
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark-mode');
  }
  btn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const mode = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', mode);
  });
});
