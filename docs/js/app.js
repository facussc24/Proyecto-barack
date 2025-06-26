import { logout } from './session.js';
window.logout = logout;

// Derive API base automatically when running outside GitHub Pages
const API_BASE = window.location.hostname.includes('github.io')
  ? null
  : window.location.origin;

// Expose the value for other modules if not already defined
if (!window.API_BASE) {
  window.API_BASE = API_BASE;
}

// Toggle tema
const btnTheme = document.querySelector('.theme-toggle');
if (btnTheme) {
  btnTheme.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    btnTheme.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
    localStorage.theme = document.body.classList.contains('dark') ? 'dark' : 'light';
  });
}

// Dropdown de usuario
function setupUserMenu() {
  const um = document.querySelector('.user-menu');
  if (!um) return;
  um.querySelector('.avatar').addEventListener('click', () => {
    um.classList.toggle('open');
  });
  window.addEventListener('click', e => {
    if (!um.contains(e.target)) um.classList.remove('open');
  });
}
setupUserMenu();
document.addEventListener('navLoaded', setupUserMenu);

function setupDarkMode() {
  const btn = document.getElementById('toggleDarkMode');
  if (!btn) return;
  const apply = state => {
    document.body.classList.toggle('dark', state);
    document.documentElement.classList.toggle('dark', state);
    btn.textContent = state ? '☀️' : '🌙';
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
