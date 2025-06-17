export function saveUser(user) {
  sessionStorage.setItem('currentUser', JSON.stringify(user));
}

export function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  } catch {
    return null;
  }
}

export function logout() {
  sessionStorage.removeItem('currentUser');
}

export function isAdmin() {
  const u = getUser();
  return u && u.role === 'admin';
}

export function isGuest() {
  const u = getUser();
  return !u || u.role === 'guest';
}
