(function(global){
  const STORAGE_KEY = 'users';
  let fs = null, path = null, jsonPath = null;
  if (typeof window !== 'undefined' && window.require) {
    try {
      fs = window.require('fs');
      path = window.require('path');
      jsonPath = path.join(__dirname, 'no-borrar', 'users.json');
    } catch(e) { fs = null; }
  } else if (typeof require === 'function') {
    try {
      fs = require('fs');
      path = require('path');
      jsonPath = path.join(__dirname, 'no-borrar', 'users.json');
    } catch(e){ fs = null; }
  }

  function loadUsers(){
    let list = [];
    if (fs && jsonPath && fs.existsSync(jsonPath)) {
      try { list = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) || []; } catch(e){ list = []; }
    } else if (typeof localStorage !== 'undefined') {
      try { list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch(e){ list = []; }
    }
    if (!Array.isArray(list) || list.length === 0) {
      list = [
        { username:'PAULO', password:'1234' },
        { username:'LEO', password:'1234' },
        { username:'FACUNDO', password:'1234' },
        { username:'PABLO', password:'1234' }
      ];
      saveUsers(list);
    }
    return list;
  }

  function saveUsers(list){
    if (fs && jsonPath) {
      try { fs.writeFileSync(jsonPath, JSON.stringify(list, null, 2), 'utf8'); } catch(e) {}
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  }

  let users = loadUsers();

  function login(username, password){
    const u = users.find(x => x.username === username && x.password === password);
    if (u) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('isAdmin', 'true');
        sessionStorage.setItem('currentUser', username);
      }
      return true;
    }
    return false;
  }

  function logout(){
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('isAdmin');
      sessionStorage.removeItem('currentUser');
    }
  }

  function createUser(username, password){
    if (users.some(u => u.username === username)) return false;
    users.push({ username, password });
    saveUsers(users);
    return true;
  }

  function changePassword(username, newPass){
    const u = users.find(x => x.username === username);
    if (!u) return false;
    u.password = newPass;
    saveUsers(users);
    return true;
  }

  const api = { login, logout, createUser, changePassword, loadUsers };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.auth = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
