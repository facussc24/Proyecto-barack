(function(global){
  const STORAGE_KEY = 'users';
  const sha256 = global.sha256 || (typeof require === 'function' ? require('./sha256.min.js') : undefined);

  function randomSalt(){
    if (typeof global.crypto !== 'undefined' && crypto.getRandomValues){
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      return Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
    }
    if (typeof require === 'function'){
      try{ return require('crypto').randomBytes(16).toString('hex'); }catch(e){}
    }
    return Math.random().toString(16).slice(2,18);
  }

  function hash(text){
    if (sha256) return sha256(text);
    if (typeof require === 'function'){
      try{ return require('crypto').createHash('sha256').update(text).digest('hex'); }catch(e){}
    }
    return text;
  }

  function loadUsers(){
    let list = [];
    if (typeof localStorage !== 'undefined') {
      try { list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch(e){ list = []; }
    }
    if (!Array.isArray(list) || list.length === 0) {
      const defaultPass = '1234';
      list = ['PAULO','LEO','FACUNDO','PABLO'].map(name => {
        const salt = randomSalt();
        return { username: name, salt, hash: hash(salt + defaultPass), role: 'admin' };
      });
    } else {
      list = list.map(u => {
        if (!u.salt) u.salt = '';
        if (!u.hash && u.password){
          u.salt = randomSalt();
          u.hash = hash(u.salt + u.password);
          delete u.password;
        }
        if (!u.role) u.role = 'admin';
        return u;
      });
    }
    saveUsers(list);
    return list;
  }

  function saveUsers(list){
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  }

  let users = loadUsers();

  function login(username, password, remember){
    const u = users.find(x => x.username === username);
    if (u && u.hash === hash((u.salt || '') + password)) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('isAdmin', u.role === 'admin' ? 'true' : 'false');
        sessionStorage.setItem('currentUser', username);
      }
      if (remember && typeof localStorage !== 'undefined') {
        localStorage.setItem('rememberUser', username);
      }
      return true;
    }
    return false;
  }

  function logout(){
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('isAdmin');
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('sinopticoEdit');
      sessionStorage.removeItem('maestroAdmin');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('rememberUser');
    }
  }

  function restoreSession(){
    if (typeof localStorage !== 'undefined') {
      const uName = localStorage.getItem('rememberUser');
      if (uName && typeof sessionStorage !== 'undefined') {
        const u = users.find(x => x.username === uName);
        sessionStorage.setItem('isAdmin', u && u.role === 'admin' ? 'true' : 'false');
        sessionStorage.setItem('currentUser', uName);
        return true;
      }
    }
    return false;
  }

  function createUser(username, password, role='user'){
    if (users.some(u => u.username === username)) return false;
    const salt = randomSalt();
    users.push({ username, salt, hash: hash(salt + password), role });
    saveUsers(users);
    return true;
  }

  function changePassword(username, newPass){
    const u = users.find(x => x.username === username);
    if (!u) return false;
    u.salt = randomSalt();
    u.hash = hash(u.salt + newPass);
    saveUsers(users);
    return true;
  }

  function setRole(username, role){
    const u = users.find(x => x.username === username);
    if (!u) return false;
    u.role = role;
    saveUsers(users);
    return true;
  }

  function deleteUser(username){
    const idx = users.findIndex(u => u.username === username);
    if (idx === -1) return false;
    users.splice(idx, 1);
    saveUsers(users);
    return true;
  }

  const api = { login, logout, createUser, changePassword, setRole, deleteUser, loadUsers, restoreSession, hash };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.auth = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
