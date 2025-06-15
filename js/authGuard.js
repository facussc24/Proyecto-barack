import { getUser, logout, isAdmin, isGuest } from './session.js';

const user = getUser();
if (!user) {
  location.href = 'login.html';
}

function applyRoleRules() {
  if (isGuest()) {
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyRoleRules);
} else {
  applyRoleRules();
}
