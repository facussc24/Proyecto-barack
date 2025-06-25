'use strict';
// js/dataService.js

export const DATA_CHANGED = 'DATA_CHANGED';
const STORAGE_KEY = 'genericData';
// Base URL for the backend API (without trailing slash or '/api')
const API_BASE =
  typeof globalThis !== 'undefined' && globalThis.API_BASE
    ? globalThis.API_BASE
    : typeof process !== 'undefined' && process.env
      ? process.env.API_BASE || process.env.apiBase
      : null;
// URL of the backend API used to store and retrieve data
const DEFAULT_API_URL = API_BASE != null
  ? `${API_BASE.replace(/\/$/, '')}/api/data`
  : typeof location !== 'undefined' && location.origin
    ? `${location.origin}/api/data`
    : '/api/data';
let API_URL = DEFAULT_API_URL;

// Prefer value from localStorage
let _healthCheck = Promise.resolve();
if (typeof localStorage !== 'undefined') {
  try {
    const stored = localStorage.getItem('apiUrl');
    if (stored) {
      API_URL = stored;
      if (typeof fetch === 'function') {
        const base = stored.replace(/\/api\/data$/, '');
        _healthCheck = fetch(`${base}/health`).then(r => {
          if (!r.ok) throw new Error('health check failed');
        }).catch(() => {
          try { localStorage.removeItem('apiUrl'); } catch {}
          API_URL = DEFAULT_API_URL;
        });
      }
    }
  } catch {
    // ignore
  }
}

// Fallback to environment variable when running under Node
if (API_URL === DEFAULT_API_URL && typeof process !== 'undefined' && process.env) {
  const envUrl = process.env.API_URL || process.env.apiUrl;
  if (envUrl) API_URL = envUrl;
}

const SOCKET_URL = API_URL ? API_URL.replace(/\/api\/data$/, '') : null;

const docMap = {
  'Flujograma': 'flujograma',
  Flujograma: 'flujograma',
  AMFE: 'amfe',
  'Hoja de Operaciones': 'hojaOp',
  Mylar: 'mylar',
  Planos: 'planos',
  ULM: 'ulm',
  'Ficha de Embalaje': 'fichaEmb',
  Tizada: 'tizada'
};

function transformOldMaestro(arr = []) {
  const map = {};
  for (const r of arr) {
    const code = r.codigo_producto || r.id;
    if (!code) continue;
    if (!map[code]) {
      map[code] = {
        id: String(code),
        flujograma: '',
        amfe: '',
        hojaOp: '',
        mylar: '',
        planos: '',
        ulm: '',
        fichaEmb: '',
        tizada: '',
        notificado: true
      };
    }
    const key = docMap[r.tipo];
    if (key) map[code][key] = r.revision || '';
    if (r.notificado === false) map[code].notificado = false;
  }
  return Object.values(map);
}

async function applyServerData(data) {
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
  for (const key of Object.keys(memory)) delete memory[key];
  for (const key in data) {
    if (Array.isArray(data[key])) memory[key] = [...data[key]];
  }
  if (
    Array.isArray(memory.maestro) &&
    memory.maestro[0] &&
    memory.maestro[0].tipo
  ) {
    memory.maestro = transformOldMaestro(memory.maestro);
  }
  _fallbackPersist();
  notifyChange();
}

function applyProductUpdate(row) {
  if (!row || typeof row !== 'object') return;
  const store = 'products';
  if (db && db[store]) {
    db[store].put(row).catch(e => console.error(e));
  }
  if (!Array.isArray(memory[store])) memory[store] = [];
  const idx = memory[store].findIndex(r => String(r.id) === String(row.id));
  if (idx >= 0) memory[store][idx] = row;
  else memory[store].push(row);
  _fallbackPersist();
  notifyChange();
}

async function persistCurrentState() {
  if (!API_URL) return;
  try {
    const json = await exportJSON(true);
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
    });
  } catch (e) {
    console.error('Failed to sync data with server', e);
  }
}

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
// timestamp of the last successful fetch from the server
let lastFetch = 0;
if (hasWindow) {
  try {
    lastFetch = parseInt(localStorage.getItem('lastServerFetch'), 10) || 0;
  } catch {
    // ignore
  }
}

function markFetchSuccess() {
  lastFetch = Date.now();
  if (hasWindow) {
    try {
      localStorage.setItem('lastServerFetch', String(lastFetch));
    } catch {
      // ignore
    }
  }
}
// promise that resolves once IndexedDB is ready (or failed)
let readyResolve;
const ready = new Promise((res) => {
  readyResolve = res;
});

const initialized = ready
  .then(() => _healthCheck)
  .then(() => initFromServer());

async function syncNow() {
  await ready;
  return initFromServer(true);
}

let socket;
let sse;
if (hasWindow && SOCKET_URL && typeof io !== 'undefined') {
  socket = io(SOCKET_URL);
  socket.on('data_updated', async () => {
    if (!API_URL) return;
    try {
      const resp = await fetch(API_URL);
      if (resp.ok) {
        const serverData = await resp.json();
        await applyServerData(serverData);
        markFetchSuccess();
      }
    } catch (e) {
      console.error('Failed to refresh data from server', e);
    }
  });
  socket.on('product_updated', row => {
    applyProductUpdate(row);
  });
}

if (hasWindow && SOCKET_URL && typeof EventSource !== 'undefined') {
  try {
    sse = new EventSource(SOCKET_URL + '/api/stream');
    sse.addEventListener('message', ev => {
      try {
        const row = JSON.parse(ev.data);
        applyProductUpdate(row);
      } catch (e) {
        console.error('Failed to parse SSE data', e);
      }
    });
  } catch {
    // ignore
  }
}

function hydrateFromStorage() {
  if (!hasWindow) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    if (obj && typeof obj === 'object') {
      Object.assign(memory, obj);
      if (
        Array.isArray(memory.maestro) &&
        memory.maestro[0] &&
        memory.maestro[0].tipo
      ) {
        memory.maestro = transformOldMaestro(memory.maestro);
        _fallbackPersist();
      }
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
    sinoptico: 'id,parentId,nombre,orden'
  });
  db.version(3).stores({
    maestro: 'id',
    maestroHist: 'hist_id,elemento_id'
  });
  db.version(4).stores({
    maestro: 'id',
    maestroHist: 'hist_id,elemento_id',
    sinoptico: 'id,parentId,nombre,orden'
  }).upgrade(async tx => {
    const oldRows = await tx.table('maestro').toArray();
    if (oldRows.length && oldRows[0].tipo) {
      const transformed = transformOldMaestro(oldRows);
      await tx.table('maestro').clear();
      if (transformed.length) await tx.table('maestro').bulkAdd(transformed);
    }
  });
  db.version(5).stores({
    maestro: 'id',
    maestroHist: 'hist_id,elemento_id',
    sinoptico: 'id,parentId,nombre,orden',
    products: 'id'
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
  if (!hasWindow) return;
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

async function initFromServer(force = false) {
  if (!API_URL) return false;
  const freshness = Date.now() - lastFetch;
  // avoid redundant requests shortly after a previous fetch
  if (!force && freshness < 5 * 60 * 1000) return false;
  try {
    const resp = await fetch(API_URL);
    if (resp.ok) {
      const serverData = await resp.json();
      await applyServerData(serverData);
      markFetchSuccess();
      return true;
    }
  } catch (e) {
    console.error('Failed to initialize data from server', e);
  }
  return false;
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
      await persistCurrentState();
      return item.id;
    } catch (e) {
      console.error(e);
    }
  }
  if (!memory[name]) memory[name] = [];
  memory[name].push(item);
  _fallbackPersist();
  notifyChange();
  await persistCurrentState();
  return item.id;
}

async function update(store = 'sinoptico', id, changes) {
  const name = String(store);
  const key = String(id);
  if (db && db[name]) {
    try {
      let result = await db[name].update(key, changes);
      if (!result && !isNaN(key)) {
        result = await db[name].update(Number(key), changes);
      }
      if (result) {
        notifyChange();
        await persistCurrentState();
      }
      return result;
    } catch (e) {
      console.error(e);
    }
  }
  const arr = memory[name] || [];
  const item = arr.find(x => String(x.id) === key || x.id === Number(key));
  if (item) {
    Object.assign(item, changes);
    _fallbackPersist();
    notifyChange();
    await persistCurrentState();
    return true;
  }
  return false;
}

async function remove(store = 'sinoptico', id) {
  const name = String(store);
  const key = String(id);
  if (db && db[name]) {
    try {
      let result;
      try {
        result = await db[name].delete(key);
      } catch {
        if (!isNaN(key)) result = await db[name].delete(Number(key));
      }
      if (result !== undefined) {
        notifyChange();
        await persistCurrentState();
      }
      return result;
    } catch (e) {
      console.error(e);
    }
  }
  const arr = memory[name] || [];
  const idx = arr.findIndex(x => String(x.id) === key || x.id === Number(key));
  if (idx >= 0) {
    arr.splice(idx, 1);
    _fallbackPersist();
    notifyChange();
    await persistCurrentState();
    return true;
  }
  return false;
}

async function exportJSON(preferLocal = false) {
  // Try to fetch the data from the server first unless we prefer local data
  if (!preferLocal && API_URL) {
    try {
      const resp = await fetch(API_URL);
      if (resp.ok) {
        const serverData = await resp.json();
        return JSON.stringify(serverData);
      }
    } catch (e) {
      console.error('Failed to fetch data from server', e);
    }
  }

  // Fallback to local storage/IndexedDB when offline
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

  // Attempt to persist the data on the server first
  if (API_URL) {
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error('Failed to send data to server', e);
    }
  }

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
  if (
    Array.isArray(memory.maestro) &&
    memory.maestro[0] &&
    memory.maestro[0].tipo
  ) {
    memory.maestro = transformOldMaestro(memory.maestro);
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
  replaceAll,
  add,
  update,
  remove,
  exportJSON,
  importJSON,
  ready,
  initialized,
  async reset() {
    if (db) {
      await db.delete();
      db = new Dexie('ProyectoBarackDB');
      db.version(1).stores({ sinoptico: 'id,parentId,nombre,orden' });
      db.version(2).stores({
        sinoptico: 'id,parentId,nombre,orden'
      });
      db.version(3).stores({
        maestro: 'id',
        maestroHist: 'hist_id,elemento_id'
      });
      db.version(4).stores({
        maestro: 'id',
        maestroHist: 'hist_id,elemento_id',
        sinoptico: 'id,parentId,nombre,orden'
      });
      db.version(5).stores({
        maestro: 'id',
        maestroHist: 'hist_id,elemento_id',
        sinoptico: 'id,parentId,nombre,orden',
        products: 'id'
      });
    }
    for (const key of Object.keys(memory)) delete memory[key];
    _fallbackPersist();
    notifyChange();
  },
  subscribeToChanges,
  subscribeSinopticoChanges,
  syncNow,
};

if (hasWindow) {
  window.dataService = api;
}

export default api;

export { getAll, add, update, remove, exportJSON, importJSON, ready, initialized, syncNow };
