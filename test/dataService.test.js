import 'fake-indexeddb/auto';
import dataService from '../src/dataService.js';

function createLocalStorage() {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

global.localStorage = createLocalStorage();

describe('dataService CRUD and import/export', () => {
  beforeEach(async () => {
    await dataService.reset();
    global.localStorage.clear();
  });

  test('should add, update, delete and handle export/import', async () => {
    const obj = { parentId: '0', nombre: 'one', orden: 1 };
    const id = await dataService.addNode(obj);
    let rows = await dataService.getAll('sinoptico');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ ...obj, id });

    await dataService.updateNode(id, { nombre: 'two' });
    rows = await dataService.getAll('sinoptico');
    expect(rows[0].nombre).toBe('two');

    await dataService.deleteNode(id);
    rows = await dataService.getAll('sinoptico');
    expect(rows).toEqual([]);

    await dataService.addNode({ parentId: '0', nombre: 'a', orden: 1 });
    await dataService.addNode({ parentId: '0', nombre: 'b', orden: 2 });
    const backup = await dataService.exportJSON();

    await dataService.reset();
    await dataService.importJSON(backup);
    rows = await dataService.getAll('sinoptico');
    expect(rows.map((r) => r.nombre).sort()).toEqual(['a', 'b']);
  });
});
