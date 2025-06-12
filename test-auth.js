const jsdom = require('jsdom-global');
jsdom('', { url: 'http://localhost' });

global.sessionStorage = window.sessionStorage;
global.localStorage = window.localStorage;

const fs = require('fs');
const path = require('path');
const userFile = path.join(__dirname, 'no-borrar', 'users.json');
if (fs.existsSync(userFile)) {
  try {
    const existing = JSON.parse(fs.readFileSync(userFile, 'utf8'));
    const filtered = existing.filter(u => u.username !== 'user1');
    if (filtered.length !== existing.length)
      fs.writeFileSync(userFile, JSON.stringify(filtered, null, 2));
    localStorage.setItem('users', JSON.stringify(filtered));
  } catch (e) {}
}

const auth = require('./auth.js');

// clear storage
localStorage.clear();
sessionStorage.clear();

auth.createUser('user1','pass1');
if (!auth.login('user1','pass1')) throw new Error('login failed');
if (sessionStorage.getItem('currentUser') !== 'user1') throw new Error('session not stored');
auth.logout();
if (sessionStorage.getItem('currentUser')) throw new Error('logout failed');
auth.changePassword('user1','new');
if (!auth.login('user1','new')) throw new Error('password change failed');

// cleanup the test user so repeated runs remain idempotent
const users = JSON.parse(fs.readFileSync(userFile, 'utf8'));
const remaining = users.filter(u => u.username !== 'user1');
fs.writeFileSync(userFile, JSON.stringify(remaining, null, 2));
localStorage.setItem('users', JSON.stringify(remaining));

console.log('auth tests passed');
