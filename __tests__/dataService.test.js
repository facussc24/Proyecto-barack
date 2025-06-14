require('fake-indexeddb/auto');

// Prevent js/dataService.js from loading Dexie so the fallback
// persistence that writes to localStorage is exercised.
jest.mock('dexie', () => {
  throw new Error('Dexie not available');
});

let service;
let originalDexie;
let originalProcess;
let originalWindow;
let originalLocalStorage;

function createStorageMock() {
  let store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
    key: (i) => Object.keys(store)[i] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

beforeAll(() => {
  originalDexie = global.Dexie;
  originalProcess = global.process;
  originalWindow = global.window;
  originalLocalStorage = global.localStorage;
  originalDocument = global.document;
  originalEvent = global.Event;

  // Simulate a browser environment without Dexie installed
  global.Dexie = undefined;
  global.process = undefined;
  global.window = {
    document: { dispatchEvent: () => {} },
    localStorage: createStorageMock(),
  };
  global.document = global.window.document;
  global.localStorage = global.window.localStorage;
  global.Event = function Event(type) { this.type = type; };

  jest.spyOn(console, 'error').mockImplementation(() => {});

  service = require('../js/dataService.js');

  // Restore process after module initialization
  global.process = originalProcess;
});

afterAll(() => {
  global.Dexie = originalDexie;
  global.process = originalProcess;
  global.window = originalWindow;
  global.localStorage = originalLocalStorage;
  global.document = originalDocument;
  global.Event = originalEvent;
});

beforeEach(async () => {
  await service.default.reset();
});

test('addNode stores node and returns id', async () => {
  const id = await service.addNode({ nombre: 'test' });
  const stored = JSON.parse(localStorage.getItem('sinopticoData'));
  const found = stored.find((n) => n.id === id);
  expect(found).toBeDefined();
  expect(found.nombre).toBe('test');
});

test('updateNode modifies existing node', async () => {
  const id = await service.addNode({ nombre: 'initial' });
  await service.updateNode(id, { nombre: 'updated' });
  const stored = JSON.parse(localStorage.getItem('sinopticoData'));
  const found = stored.find((n) => n.id === id);
  expect(found.nombre).toBe('updated');
});

test('deleteNode removes the node', async () => {
  const id = await service.addNode({ nombre: 'todelete' });
  await service.deleteNode(id);
  const stored = JSON.parse(localStorage.getItem('sinopticoData'));
  expect(stored.find((n) => n.id === id)).toBeUndefined();
});

describe('when Dexie fails to open', () => {
  let failingService;
  let store;

  beforeAll(() => {
    jest.resetModules();

    store = createStorageMock();

    global.Dexie = undefined;
    global.process = undefined;
    global.window = {
      document: { dispatchEvent: () => {} },
      localStorage: store,
    };
    global.document = global.window.document;
    global.localStorage = store;
    global.Event = function Event(type) { this.type = type; };

    jest.doMock('dexie', () => {
      return class DexieMock {
        constructor() {
          this.sinoptico = {
            toArray: jest.fn().mockResolvedValue([]),
            add: jest.fn().mockRejectedValue(new Error('fail')),
            update: jest.fn().mockRejectedValue(new Error('fail')),
            delete: jest.fn().mockRejectedValue(new Error('fail')),
            clear: jest.fn().mockResolvedValue(),
            bulkAdd: jest.fn().mockResolvedValue(),
          };
        }
        version() { return { stores: () => {} }; }
        open() { return Promise.reject(new Error('open fail')); }
        delete() { return Promise.resolve(); }
        transaction(_, __, fn) { return fn(); }
      };
    });

    jest.spyOn(console, 'error').mockImplementation(() => {});

    failingService = require('../js/dataService.js');

    global.process = originalProcess;
  });

  afterAll(() => {
    jest.dontMock('dexie');
    jest.resetModules();

    global.Dexie = originalDexie;
    global.process = originalProcess;
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
    global.document = originalDocument;
    global.Event = originalEvent;
  });

  beforeEach(async () => {
    await failingService.default.reset();
  });

  test('addNode persists via fallback storage', async () => {
    const id = await failingService.addNode({ nombre: 'fallback' });
    const stored = JSON.parse(localStorage.getItem('sinopticoData'));
    const found = stored.find((n) => n.id === id);
    expect(found).toBeDefined();
    expect(found.nombre).toBe('fallback');
    const all = await failingService.getAll();
    expect(all.find((n) => n.id === id)).toBeDefined();
  });
});
