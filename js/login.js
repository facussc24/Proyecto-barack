import { ready, validateCredentials } from './dataService.js';
import { saveUser, getUser } from './session.js';

const current = getUser();
if (current) {
  location.href = 'index.html';
}

const form = document.getElementById('loginForm');
const guestBtn = document.getElementById('guestBtn');

form.addEventListener('submit', async ev => {
  ev.preventDefault();
  const name = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  await ready;
  const user = await validateCredentials(name, pass);
  if (user) {
    saveUser(user);
    location.href = 'index.html';
  } else {
    alert('Credenciales inválidas');
  }
});

guestBtn.addEventListener('click', () => {
  saveUser({ name: 'Invitado', role: 'guest' });
  location.href = 'index.html';
});
