import { saveUser, getUser } from './session.js';

const current = getUser();
if (current) {
  location.href = 'index.html';
}

const adminBtn = document.getElementById('adminBtn');
const guestBtn = document.getElementById('guestBtn');

if (adminBtn) {
  adminBtn.addEventListener('click', () => {
    saveUser({ name: 'Administrador', role: 'admin' });
    location.href = 'index.html';
  });
}

if (guestBtn) {
  guestBtn.addEventListener('click', () => {
    saveUser({ name: 'Invitado', role: 'guest' });
    location.href = 'index.html';
  });
}
