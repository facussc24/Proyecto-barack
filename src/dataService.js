'use strict';
// js/dataService.js

export const DATA_CHANGED = 'DATA_CHANGED';
const STORAGE_KEY = 'sinopticoData';

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
// in-memory fallback
const memory = [];

function hydrateFromStorage() {
  if (!hasWindow) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) {
      memory.push(...arr);
    }
  } catch (e) {
    console.error('Failed to load fallback storage', e);
  }
}

// initialize IndexedDB if Dexie is available
if (Dexie) {
  db = new Dexie('ProyectoBarackDB');
  db.version(1).stores({
    // use string "id" as primary key
    sinoptico: 'id,parentId,nombre,orden',
  });
  // migrate existing records that used numeric primary keys
  db.open().then(async () => {
    const all = await db.sinoptico.toArray();
    const needsFix = all.filter(r => typeof r.id !== 'string' || r.id !== r.ID);
    if (needsFix.length) {
      await db.transaction('rw', db.sinoptico, async () => {
        for (const rec of needsFix) {
          await db.sinoptico.delete(rec.id);
          const newRec = { ...rec, id: String(rec.ID || rec.id) };
          await db.sinoptico.add(newRec);
        }
      });
    }
  }).catch(() => {
    db = null;
    hydrateFromStorage();
  });
} else if (hasWindow) {
  hydrateFromStorage();
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
  // sync in-memory array to localStorage
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

export async function getAll() {
  if (db) {
    try {
      return await db.sinoptico.toArray();
    } catch (e) {
      console.error(e);
      return [];
    }
  } else {
    return memory.slice();
  }
}

export async function addNode(node) {
  const newNode = { ...node };
  if (!newNode.id) {
    newNode.id = Date.now().toString();
  }
  if (db) {
    try {
      await db.sinoptico.add(newNode);
      notifyChange();
      return newNode.id;
    } catch (e) {
      console.error(e);
    }
  } else {
    // ensure unique id in memory fallback
    memory.push(newNode);
    _fallbackPersist();
    notifyChange();
    return newNode.id;
  }
}

export async function updateNode(id, changes) {
  const key = String(id);
  if (db) {
    try {
      await db.sinoptico.update(key, changes);
      notifyChange();
      return;
    } catch (e) {
      console.error(e);
    }
  } else {
    const item = memory.find((x) => String(x.id) === key);
    if (item) {
      Object.assign(item, changes);
      _fallbackPersist();
      notifyChange();
    }
  }
}

export async function deleteNode(id) {
  const key = String(id);
  if (db) {
    try {
      await db.sinoptico.delete(key);
      notifyChange();
      return;
    } catch (e) {
      console.error(e);
    }
  } else {
    const idx = memory.findIndex((x) => String(x.id) === key);
    if (idx >= 0) {
      memory.splice(idx, 1);
      _fallbackPersist();
      notifyChange();
    }
  }
}

export async function replaceAll(arr) {
  if (!Array.isArray(arr)) return;
  if (db) {
    try {
      await db.transaction('rw', db.sinoptico, async () => {
        await db.sinoptico.clear();
        if (arr.length) await db.sinoptico.bulkAdd(arr);
      });
      notifyChange();
    } catch (e) {
      console.error(e);
    }
  } else {
    memory.length = 0;
    memory.push(...arr);
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
  replaceAll,
  async reset() {
    if (db) {
      await db.delete();
      db = new Dexie('ProyectoBarackDB');
      db.version(1).stores({ sinoptico: 'id,parentId,nombre,orden' });
    }
    memory.length = 0;
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
