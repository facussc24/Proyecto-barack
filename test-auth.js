const jsdom = require('jsdom-global');
jsdom('', { url: 'http://localhost' });

global.sessionStorage = window.sessionStorage;
global.localStorage = window.localStorage;

const auth = require('./auth.js');

// clear storage
localStorage.clear();
sessionStorage.clear();

auth.createUser('user1','pass1');
if (!auth.login('user1','pass1', true)) throw new Error('login failed');
if (sessionStorage.getItem('currentUser') !== 'user1') throw new Error('session not stored');
sessionStorage.clear();
if (!auth.restoreSession()) throw new Error('restore failed');
auth.logout();
auth.changePassword('user1','new');

if (!auth.login('user1','new')) throw new Error('password change failed');

console.log('auth tests passed');
