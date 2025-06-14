require('fake-indexeddb/auto');
const Dexie = require('dexie');

let service;

beforeAll(() => {
  global.Dexie = Dexie;
  service = require('../js/dataService.js');
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(async () => {
  await service.default.reset();
});

test('addNode stores node and returns id', async () => {
  const id = await service.addNode({ nombre: 'test' });
  const all = await service.getAll();
  const found = all.find(n => n.id === id);
  expect(found).toBeDefined();
  expect(found.nombre).toBe('test');
});

test('updateNode modifies existing node', async () => {
  const id = await service.addNode({ nombre: 'initial' });
  await service.updateNode(id, { nombre: 'updated' });
  const all = await service.getAll();
  const found = all.find(n => n.id === id);
  expect(found.nombre).toBe('updated');
});

test('deleteNode removes the node', async () => {
  const id = await service.addNode({ nombre: 'todelete' });
  await service.deleteNode(id);
  const all = await service.getAll();
  expect(all.find(n => n.id === id)).toBeUndefined();
});
