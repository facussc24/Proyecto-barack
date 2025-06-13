const jsdom = require('jsdom-global');
jsdom('', { url: 'http://localhost' });

global.sessionStorage = window.sessionStorage;
global.localStorage = window.localStorage;

const auth = require('./auth.js');

localStorage.clear();
sessionStorage.clear();

auth.createUser('user1','pass1');
auth.setRole('user1','admin');
if (!auth.login('user1','pass1', true)) throw new Error('login failed');
if (sessionStorage.getItem('isAdmin') !== 'true') throw new Error('role not applied');

sessionStorage.clear();
if (!auth.restoreSession() || sessionStorage.getItem('isAdmin') !== 'true') throw new Error('restore failed');

auth.logout();
auth.changePassword('user1','new');
if (!auth.login('user1','new')) throw new Error('password change failed');

console.log('auth tests passed');
