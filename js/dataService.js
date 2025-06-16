'use strict';

// Simple data service that communicates only with the REST API
// and keeps a small in-memory cache per store.

export const DATA_CHANGED = 'DATA_CHANGED';
const DISABLE_DEFAULT_USER_KEY = 'disableDefaultUser';

// Base URL for the REST API
export const API_URL =
  (typeof window !== 'undefined' &&
    (window.API_URL || (window.localStorage && localStorage.getItem('API_URL')))) ||
  (typeof process !== 'undefined' && process.env.API_URL) ||
  '';

async function httpGet(path) {
  const res = await fetch(API_URL + path);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

async function httpPost(path, data) {
  const res = await fetch(API_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

async function httpPut(path, data) {
  const res = await fetch(API_URL + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

async function httpDelete(path) {
  const res = await fetch(API_URL + path, { method: 'DELETE' });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;
const hasWindow = !isNode && typeof window !== 'undefined' && window.document;

// in-memory cache per store
const cache = {};

// ready resolves immediately now that there is no IndexedDB setup
export const ready = Promise.resolve();

// setup cross-tab/channel notifications
const channelName = 'sinoptico-channel';
const channel =
  hasWindow && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(channelName)
    : null;
const simpleChannel =
  hasWindow && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('sinoptico')
    : null;

function notifyChange() {
  if (channel && channel.postMessage) {
    channel.postMessage({ type: DATA_CHANGED });
  }
  if (simpleChannel && simpleChannel.postMessage) {
    simpleChannel.postMessage('changed');
  }
  if (hasWindow) {
    document.dispatchEvent(new Event(DATA_CHANGED));
    document.dispatchEvent(new Event('sinopticoUpdated'));
  }
}

// connect to server-sent events for live updates
const eventSource =
  hasWindow && typeof EventSource !== 'undefined'
    ? new EventSource(API_URL + '/events')
    : null;
if (eventSource) {
  eventSource.addEventListener('message', () => notifyChange());
}

async function loadStore(store = 'sinoptico') {
  try {
    const data = await httpGet(`/${store}`);
    cache[store] = Array.isArray(data) ? [...data] : [];
  } catch (e) {
    console.error(e);
    cache[store] = [];
  }
  return cache[store].slice();
}

export async function getAll(store = 'sinoptico') {
  if (!cache[store]) {
    return loadStore(store);
  }
  return cache[store].slice();
}

export async function add(store = 'sinoptico', obj) {
  const item = { ...obj };
  if (!item.id) item.id = Date.now().toString();
  try {
    const saved = await httpPost(`/${store}`, item);
    cache[store] = cache[store] || [];
    cache[store].push(saved);
    notifyChange();
    return saved.id;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function update(store = 'sinoptico', id, changes) {
  const key = String(id);
  try {
    const updated = await httpPut(`/${store}/${key}`, changes);
    if (cache[store]) {
      const idx = cache[store].findIndex(x => String(x.id) === key);
      if (idx >= 0) cache[store][idx] = { ...cache[store][idx], ...updated };
    }
    notifyChange();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function remove(store = 'sinoptico', id) {
  const key = String(id);
  try {
    await httpDelete(`/${store}/${key}`);
    if (cache[store]) {
      const idx = cache[store].findIndex(x => String(x.id) === key);
      if (idx >= 0) cache[store].splice(idx, 1);
    }
    notifyChange();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function exportJSON() {
  const sinoptico = await getAll('sinoptico');
  const users = await getAll('users');
  return JSON.stringify({ sinoptico, users });
}

export async function importJSON(json) {
  let data;
  try {
    data = typeof json === 'string' ? JSON.parse(json) : json;
  } catch (e) {
    console.error('Invalid JSON provided to import', e);
    return;
  }
  if (!data || typeof data !== 'object') return;

  const currentSinoptico = await getAll('sinoptico');
  for (const item of currentSinoptico) {
    await remove('sinoptico', item.id);
  }
  const currentUsers = await getAll('users');
  for (const u of currentUsers) {
    await remove('users', u.id);
  }
  if (Array.isArray(data.sinoptico)) {
    for (const n of data.sinoptico) {
      await add('sinoptico', n);
    }
  }
  if (Array.isArray(data.users)) {
    for (const u of data.users) {
      await add('users', u);
    }
  }
  notifyChange();
}

export async function addNode(node) {
  const n = { ...node };
  if (n.ID && !n.id) {
    n.id = String(n.ID);
  }
  if (n.id && !n.ID) {
    n.ID = String(n.id);
  }
  if (n.Desactivado === undefined) {
    n.Desactivado = false;
  }
  return add('sinoptico', n);
}

export async function updateNode(id, changes) {
  return update('sinoptico', id, changes);
}

export async function deleteNode(id) {
  return remove('sinoptico', id);
}

export async function getAllUsers() {
  return getAll('users');
}

export async function addUser(user) {
  return add('users', user);
}

export async function updateUser(id, changes) {
  return update('users', id, changes);
}

export async function deleteUser(id) {
  return remove('users', id);
}

export async function validateCredentials(name, password) {
  const users = await getAll('users');
  const normalized = String(name || '').trim().toLowerCase();
  return users.find(
    u => u.name && u.name.toLowerCase() === normalized && u.password === password
  );
}

export async function ensureDefaultUsers() {
  await ready;
  const users = await getAll('users');
  const disableFlag = hasWindow && localStorage.getItem(DISABLE_DEFAULT_USER_KEY);
  if (!users.length && !disableFlag) {
    const defaults = [
      { name: 'admin', password: 'admin', role: 'admin' },
    ];
    for (const u of defaults) await addUser(u);
    if (hasWindow) localStorage.setItem('defaultUserInit', '1');
  }
}

export async function replaceAll(arr) {
  if (!Array.isArray(arr)) return;
  const current = await getAll('sinoptico');
  for (const item of current) {
    await deleteNode(item.id);
  }
  for (const item of arr) {
    await addNode(item);
  }
}

export function subscribeToChanges(handler) {
  if (channel) {
    channel.addEventListener('message', ev => {
      if (ev.data && ev.data.type === DATA_CHANGED) handler();
    });
  }
  if (hasWindow) {
    document.addEventListener(DATA_CHANGED, handler);
  }
}

// simplified API used by sinoptico.html
export async function getAllSinoptico() {
  return getAll('sinoptico');
}

export function subscribeSinopticoChanges(handler) {
  if (simpleChannel) {
    simpleChannel.addEventListener('message', () => handler());
  }
  if (hasWindow) {
    document.addEventListener('sinopticoUpdated', handler);
  }
}

export async function reset() {
  const sinoptico = await getAll('sinoptico');
  for (const n of sinoptico) await deleteNode(n.id);
  const users = await getAll('users');
  for (const u of users) await deleteUser(u.id);
  Object.keys(cache).forEach(k => delete cache[k]);
  if (hasWindow) {
    localStorage.removeItem('defaultUserInit');
    localStorage.removeItem(DISABLE_DEFAULT_USER_KEY);
  }
  notifyChange();
}

const api = {
  getAll,
  getAllSinoptico,
  addNode,
  updateNode,
  deleteNode,
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
  replaceAll,
  add,
  update,
  remove,
  exportJSON,
  importJSON,
  ready,
  reset,
  subscribeToChanges,
  subscribeSinopticoChanges,
};

if (hasWindow) {
  window.dataService = api;
}

ensureDefaultUsers();

export default api;


