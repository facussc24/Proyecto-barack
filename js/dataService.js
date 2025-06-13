// js/dataService.js

export const DATA_CHANGED = 'DATA_CHANGED';
const STORAGE_KEY = 'sinopticoData';

import Dexie from 'dexie';

const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;
const hasWindow = !isNode && typeof window !== 'undefined' && window.document;

let db = null;
// in-memory fallback
const memory = [];

// initialize IndexedDB if Dexie is available
if (Dexie) {
  db = new Dexie('ProyectoBarackDB');
  db.version(1).stores({
    sinoptico: '++id,parentId,nombre,orden',
  });
} else if (hasWindow) {
  // hydrate in-memory storage from localStorage
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

// setup cross-tab/channel notifications
const channelName = 'sinoptico-channel';
const channel =
  hasWindow && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(channelName)
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
  if (hasWindow) {
    // dispatch a DOM event for same-page listeners
    document.dispatchEvent(new Event(DATA_CHANGED));
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
  if (db) {
    try {
      const id = await db.sinoptico.add(node);
      notifyChange();
      return id;
    } catch (e) {
      console.error(e);
    }
  } else {
    // ensure unique id
    const id = node.id ?? Date.now();
    const newNode = { ...node, id };
    memory.push(newNode);
    _fallbackPersist();
    notifyChange();
    return id;
  }
}

export async function updateNode(id, changes) {
  if (db) {
    try {
      await db.sinoptico.update(id, changes);
      notifyChange();
      return;
    } catch (e) {
      console.error(e);
    }
  } else {
    const item = memory.find((x) => x.id === id);
    if (item) {
      Object.assign(item, changes);
      _fallbackPersist();
      notifyChange();
    }
  }
}

export async function deleteNode(id) {
  if (db) {
    try {
      await db.sinoptico.delete(id);
      notifyChange();
      return;
    } catch (e) {
      console.error(e);
    }
  } else {
    const idx = memory.findIndex((x) => x.id === id);
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

const api = {
  getAll,
  addNode,
  updateNode,
  deleteNode,
  replaceAll,
  subscribeToChanges,
};

if (hasWindow) {
  window.dataService = api;
}

export default api;
