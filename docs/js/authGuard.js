import { logout, isAdmin, isGuest } from './session.js';

// guests shouldn't access certain pages directly
const guestOnlyPages = ['database.html', 'asistente.html', 'history.html'];
if (isGuest() && guestOnlyPages.some(p => location.pathname.endsWith(p))) {
  location.href = 'sinoptico.html';
}

function applyRoleRules() {
  if (isGuest()) {
    sessionStorage.setItem('sinopticoEdit', 'false');
    document.querySelectorAll('.no-guest').forEach(el => el.style.display = 'none');
  }
  if (!isAdmin()) {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }
  document.querySelectorAll('.logout-link').forEach(btn => {
    btn.addEventListener('click', () => {
      logout();
      location.href = 'login.html';
    });
  });
}

if (typeof window !== 'undefined') {
  window.applyRoleRules = applyRoleRules;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyRoleRules);
} else {
  applyRoleRules();
}
