(function(global){
  const STORAGE_KEY = 'users';
  const sha256 = global.sha256 || (typeof require === 'function' ? require('./sha256.min.js') : undefined);

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
      list = [
        { username:'PAULO', hash: hash('1234'), role:'admin' },
        { username:'LEO', hash: hash('1234'), role:'admin' },
        { username:'FACUNDO', hash: hash('1234'), role:'admin' },
        { username:'PABLO', hash: hash('1234'), role:'admin' }
      ];
    } else {
      list = list.map(u => {
        if (!u.hash && u.password){
          u.hash = hash(u.password);
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
    const hashed = hash(password);
    const u = users.find(x => x.username === username && x.hash === hashed);
    if (u) {
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
    users.push({ username, hash: hash(password), role });
    saveUsers(users);
    return true;
  }

  function changePassword(username, newPass){
    const u = users.find(x => x.username === username);
    if (!u) return false;
    u.hash = hash(newPass);
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

  const api = { login, logout, createUser, changePassword, setRole, loadUsers, restoreSession, hash };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.auth = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
