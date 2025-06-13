const jsdom = require('jsdom-global');
jsdom('', { url: 'http://localhost' });

global.sessionStorage = window.sessionStorage;
global.localStorage = window.localStorage;

const fs = require('fs');
const path = require('path');
const userFile = path.join(__dirname, 'no-borrar', 'users.json');

// load the users file once and work on a memory copy
let memoryUsers = [];
if (fs.existsSync(userFile)) {
  try {
    memoryUsers = JSON.parse(fs.readFileSync(userFile, 'utf8'));
  } catch (e) {
    memoryUsers = [];
  }
}
memoryUsers = memoryUsers.filter(u => u.username !== 'user1');
localStorage.setItem('users', JSON.stringify(memoryUsers));

// intercept reads/writes so auth.js doesn't touch the real file
const originalRead = fs.readFileSync;
const originalWrite = fs.writeFileSync;
fs.readFileSync = function (p, enc) {
  if (path.resolve(p) === path.resolve(userFile)) {
    return JSON.stringify(memoryUsers, null, 2);
  }
  return originalRead.call(fs, p, enc);
};
fs.writeFileSync = function (p, data) {
  if (path.resolve(p) === path.resolve(userFile)) {
    try {
      memoryUsers = JSON.parse(data);
    } catch (e) {}
    localStorage.setItem('users', JSON.stringify(memoryUsers));
    return;
  }
  return originalWrite.call(fs, p, data);
};

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

// restore fs operations
fs.readFileSync = originalRead;
fs.writeFileSync = originalWrite;

console.log('auth tests passed');
