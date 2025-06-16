import { ready, validateCredentials, ensureDefaultUsers } from './dataService.js';
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

form.addEventListener('submit', async ev => {
  ev.preventDefault();
  const name = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  await ready;
  await ensureDefaultUsers();
  const user = await validateCredentials(name, pass);
  if (user) {
    saveUser(user);
    location.href = 'index.html';
  } else {
    alert('Credenciales inválidas');
  }
});

guestBtn.addEventListener('click', async () => {
  await ensureDefaultUsers();
  saveUser({ name: 'Invitado', role: 'guest' });
  location.href = 'index.html';
});
