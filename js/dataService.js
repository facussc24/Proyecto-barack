'use strict';
// js/dataService.js

export const DATA_CHANGED = 'DATA_CHANGED';
const STORAGE_KEY = 'genericData';

// Dexie may be loaded via a script tag in the browser. Grab the global instance
// if present. When running under Node we fallback to requiring the package so
// the same file can be used in tests or server side scripts.
let Dexie = typeof globalThis !== 'undefined' ? globalThis.Dexie : undefined;
if (!Dexie && typeof require === 'function') {
  try {
    Dexie = require('dexie');
  } catch {
    // ignore, fallback storage will be used
  }
}

const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;
const hasWindow = !isNode && typeof window !== 'undefined' && window.document;

let db = null;
// in-memory fallback per store
const memory = {};
// promise that resolves once IndexedDB is ready (or failed)
let readyResolve;
const ready = new Promise((res) => {
  readyResolve = res;
});

function hydrateFromStorage() {
  if (!hasWindow) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    if (obj && typeof obj === 'object') {
      Object.assign(memory, obj);
    }
  } catch (e) {
    console.error('Failed to load fallback storage', e);
  }
}

// initialize IndexedDB if Dexie is available
if (Dexie) {
  db = new Dexie('ProyectoBarackDB');
  db.version(1).stores({
    sinoptico: 'id,parentId,nombre,orden',
  });
  db.version(2).stores({
    sinoptico: 'id,parentId,nombre,orden',
    users: 'id,name,role',
  });
  // migrate existing records that used numeric primary keys
  db.open()
    .then(async () => {
      const all = await db.sinoptico.toArray();
      const needsFix = all.filter(
        r => typeof r.id !== 'string' || r.id !== r.ID || !r.ID
      );
      if (needsFix.length) {
        await db.transaction('rw', db.sinoptico, async () => {
          for (const rec of needsFix) {
            await db.sinoptico.delete(rec.id);
            const fixedId = String(rec.ID || rec.id);
            const newRec = { ...rec, id: fixedId, ID: fixedId };
            await db.sinoptico.add(newRec);
          }
        });
      }
    })
    .catch(() => {
      db = null;
      hydrateFromStorage();
    })
    .finally(() => {
      if (readyResolve) readyResolve();
    });
} else if (hasWindow) {
  hydrateFromStorage();
  if (readyResolve) readyResolve();
} else {
  if (readyResolve) readyResolve();
}

// setup cross-tab/channel notifications
const channelName = 'sinoptico-channel';
const channel =
  hasWindow && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(channelName)
    : null;
// secondary channel used by the simplified API
const simpleChannel =
  hasWindow && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('sinoptico')
    : null;

function _fallbackPersist() {
  // sync in-memory object to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch (e) {
    console.error('Failed to persist fallback storage', e);
  }
}

function notifyChange() {
  if (channel && channel.postMessage) {
    channel.postMessage({ type: DATA_CHANGED });
  }
  if (simpleChannel && simpleChannel.postMessage) {
    simpleChannel.postMessage('changed');
  }
  if (hasWindow) {
    // dispatch a DOM event for same-page listeners
    document.dispatchEvent(new Event(DATA_CHANGED));
    document.dispatchEvent(new Event('sinopticoUpdated'));
  }
}

async function getAll(store = 'sinoptico') {
  const name = String(store);
  if (db && db[name]) {
    try {
      return await db[name].toArray();
    } catch (e) {
      console.error(e);
      return [];
    }
  }
  const arr = Array.isArray(memory[name]) ? memory[name] : [];
  return arr.slice();
}

async function add(store = 'sinoptico', obj) {
  const name = String(store);
  const item = { ...obj };
  if (!item.id) item.id = Date.now().toString();
  if (db && db[name]) {
    try {
      await db[name].add(item);
      notifyChange();
      return item.id;
    } catch (e) {
      console.error(e);
    }
  }
  if (!memory[name]) memory[name] = [];
  memory[name].push(item);
  _fallbackPersist();
  notifyChange();
  return item.id;
}

async function update(store = 'sinoptico', id, changes) {
  const name = String(store);
  const key = String(id);
  if (db && db[name]) {
    try {
      await db[name].update(key, changes);
      notifyChange();
      return;
    } catch (e) {
      console.error(e);
    }
  }
  const arr = memory[name] || [];
  const item = arr.find(x => String(x.id) === key);
  if (item) {
    Object.assign(item, changes);
    _fallbackPersist();
    notifyChange();
  }
}

async function remove(store = 'sinoptico', id) {
  const name = String(store);
  const key = String(id);
  if (db && db[name]) {
    try {
      await db[name].delete(key);
      notifyChange();
      return;
    } catch (e) {
      console.error(e);
    }
  }
  const arr = memory[name] || [];
  const idx = arr.findIndex(x => String(x.id) === key);
  if (idx >= 0) {
    arr.splice(idx, 1);
    _fallbackPersist();
    notifyChange();
  }
}

async function exportJSON() {
  const result = {};
  if (db) {
    for (const table of db.tables) {
      try {
        result[table.name] = await table.toArray();
      } catch (e) {
        console.error(e);
        result[table.name] = [];
      }
    }
  } else {
    Object.assign(result, memory);
  }
  return JSON.stringify(result);
}

async function importJSON(json) {
  let data;
  try {
    data = typeof json === 'string' ? JSON.parse(json) : json;
  } catch (e) {
    console.error('Invalid JSON provided to import', e);
    return;
  }
  if (!data || typeof data !== 'object') return;
  if (db) {
    try {
      await db.transaction('rw', db.tables, async () => {
        for (const table of db.tables) {
          const arr = Array.isArray(data[table.name]) ? data[table.name] : [];
          await table.clear();
          if (arr.length) await table.bulkAdd(arr);
        }
      });
    } catch (e) {
      console.error(e);
    }
  }
  // replace memory
  for (const key of Object.keys(memory)) delete memory[key];
  for (const key in data) {
    if (Array.isArray(data[key])) memory[key] = [...data[key]];
  }
  _fallbackPersist();
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

export async function replaceAll(arr) {
  if (!Array.isArray(arr)) return;
  const normalized = arr.map(item => {
    const obj = { ...item };
    const fixedId = String(obj.ID || obj.id || Date.now().toString());
    if (!obj.id) obj.id = fixedId;
    if (!obj.ID) obj.ID = fixedId;
    return obj;
  });
  if (db) {
    try {
      await db.transaction('rw', db.sinoptico, async () => {
        await db.sinoptico.clear();
        if (normalized.length) await db.sinoptico.bulkAdd(normalized);
      });
      notifyChange();
    } catch (e) {
      console.error(e);
    }
  } else {
    memory.sinoptico = [...normalized];
    _fallbackPersist();
    notifyChange();
  }
}

export function subscribeToChanges(handler) {
  if (channel) {
    channel.addEventListener('message', (ev) => {
      if (ev.data && ev.data.type === DATA_CHANGED) {
        handler();
      }
    });
  }
  if (hasWindow) {
    document.addEventListener(DATA_CHANGED, handler);
  }
}

// simplified API used by sinoptico.html
export async function getAllSinoptico() {
  if (db) {
    try {
      return await db.sinoptico.toArray();
    } catch (e) {
      console.error(e);
      return [];
    }
  }
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function subscribeSinopticoChanges(handler) {
  if (simpleChannel) {
    simpleChannel.addEventListener('message', () => handler());
  }
  if (hasWindow) {
    document.addEventListener('sinopticoUpdated', handler);
  }
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
  async reset() {
    if (db) {
      await db.delete();
      db = new Dexie('ProyectoBarackDB');
      db.version(1).stores({ sinoptico: 'id,parentId,nombre,orden' });
      db.version(2).stores({
        sinoptico: 'id,parentId,nombre,orden',
        users: 'id,name,role',
      });
    }
    for (const key of Object.keys(memory)) delete memory[key];
    _fallbackPersist();
    notifyChange();
  },
  subscribeToChanges,
  subscribeSinopticoChanges,
};

if (hasWindow) {
  window.dataService = api;
}

export default api;

export { getAll, add, update, remove, exportJSON, importJSON, ready };
