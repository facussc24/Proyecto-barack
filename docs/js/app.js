const API_BASE = window.location.hostname.includes('github.io')
  ? null
  : 'http://TU_IP:5000';

function setupDarkMode() {
  const btn = document.getElementById('toggleDarkMode');
  if (!btn) return;
  const apply = state => {
    document.body.classList.toggle('dark', state);
    document.documentElement.classList.toggle('dark', state);
  };
  const stored = localStorage.getItem('darkMode');
  apply(stored === 'true');
  btn.addEventListener('click', () => {
    const active = document.body.classList.contains('dark');
    apply(!active);
    localStorage.setItem('darkMode', !active);
  });
}

document.addEventListener('navLoaded', setupDarkMode);
