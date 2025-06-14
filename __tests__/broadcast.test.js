require('fake-indexeddb/auto');
const Dexie = require('dexie');

class MockBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.listeners = {};
    this.messages = [];
    MockBroadcastChannel.instances.push(this);
  }
  postMessage(msg) {
    this.messages.push(msg);
    (this.listeners['message'] || []).forEach(fn => fn({ data: msg }));
  }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
}
MockBroadcastChannel.instances = [];

let service;
let originalNodeVersion;

describe('BroadcastChannel integration', () => {
  beforeEach(async () => {
    jest.resetModules();
    MockBroadcastChannel.instances = [];
    originalNodeVersion = process.versions.node;
    Object.defineProperty(process.versions, 'node', { value: undefined, configurable: true, writable: true });
    global.window = { document: { addEventListener: jest.fn(), dispatchEvent: jest.fn() } };
    global.document = global.window.document;
    global.BroadcastChannel = MockBroadcastChannel;
    global.Dexie = Dexie;
    service = require('../js/dataService.js');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await service.default.reset();
  });

  afterEach(() => {
    Object.defineProperty(process.versions, 'node', { value: originalNodeVersion, configurable: true });
    delete global.window;
    delete global.document;
    delete global.BroadcastChannel;
  });

  test('addNode broadcasts DATA_CHANGED and subscribers are notified', async () => {
    const handler = jest.fn();
    service.subscribeToChanges(handler);

    const channel = MockBroadcastChannel.instances.find(c => c.name === 'sinoptico-channel');
    expect(channel).toBeDefined();

    await service.addNode({ nombre: 'foo' });

    expect(channel.messages).toContainEqual({ type: service.DATA_CHANGED });
    expect(handler).toHaveBeenCalled();
  });
});
