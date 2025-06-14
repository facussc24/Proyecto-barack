require('fake-indexeddb/auto');

jest.mock('dexie', () => {
  return class {
    constructor() {}
    version() {
      return { stores: () => {} };
    }
    open() {
      return Promise.reject(new Error('open failed'));
    }
    delete() {
      return Promise.resolve();
    }
  };
});

function createStorageMock() {
  let store = {};
  return {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: k => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
    key: i => Object.keys(store)[i] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe('Dexie open failure fallback', () => {
  let service;
  let originalProcess;
  let originalWindow;
  let originalLocalStorage;
  let originalDocument;
  let originalDexie;
  let originalEvent;

  beforeEach(async () => {
    jest.resetModules();
    originalProcess = global.process;
    originalWindow = global.window;
    originalLocalStorage = global.localStorage;
    originalDocument = global.document;
    originalDexie = global.Dexie;
    originalEvent = global.Event;

    global.process = undefined;
    global.window = { document: { dispatchEvent: () => {} }, localStorage: createStorageMock() };
    global.document = global.window.document;
    global.localStorage = global.window.localStorage;
    global.BroadcastChannel = undefined;
    global.Dexie = undefined;
    global.Event = function Event(type) { this.type = type; };

    jest.spyOn(console, 'error').mockImplementation(() => {});

    service = require('../js/dataService.js');
    await new Promise(r => setImmediate(r));
    await service.default.reset();

    global.process = originalProcess;
  });

  afterEach(() => {
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
    global.document = originalDocument;
    global.Dexie = originalDexie;
    global.BroadcastChannel = undefined;
    global.Event = originalEvent;
  });

  test('fallback persists data when Dexie.open rejects', async () => {
    const id = await service.addNode({ nombre: 'fallback' });
    const stored = JSON.parse(global.localStorage.getItem('sinopticoData'));
    const found = stored.find(n => n.id === id);
    expect(found).toBeDefined();
    expect(found.nombre).toBe('fallback');
  });
});

