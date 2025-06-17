import { saveUser, getUser } from './session.js';

const current = getUser();
if (current) {
  location.href = 'index.html';
}

const form = document.getElementById('loginForm');
const guestBtn = document.getElementById('guestBtn');
const toggleBtn = document.getElementById('togglePass');
const passInput = document.getElementById('loginPass');

if (toggleBtn && passInput) {
  toggleBtn.addEventListener('click', () => {
    const isHidden = passInput.type === 'password';
    passInput.type = isHidden ? 'text' : 'password';
    toggleBtn.textContent = isHidden ? '🙈' : '👁️';
  });
}

form.addEventListener('submit', ev => {
  ev.preventDefault();
  const name = document.getElementById('loginUser').value.trim();
  saveUser({ name, role: 'admin' });
  location.href = 'index.html';
});

guestBtn.addEventListener('click', () => {
  saveUser({ name: 'Invitado', role: 'guest' });
  location.href = 'index.html';
});
