const assert = require('assert');
const request = require('supertest');
const ioClient = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const createServer = require('../backend');

const DB_FILE = path.join(__dirname, '..', 'datos', 'base_de_datos.sqlite');

describe('API', function() {
  let serverObj;
  let server;
  beforeEach(function(done) {
    serverObj = createServer();
    serverObj.dbReady
      .then(() => {
        serverObj.db.exec('DELETE FROM items;DELETE FROM clients;DELETE FROM history;DELETE FROM amfe;', () => {
          server = serverObj.httpServer.listen(0, done);
        });
      })
      .catch(done);
  });
  afterEach(function(done) {
    server.close(done);
  });

  it('POST /api/clients increases the list', async function() {
    const agent = request(serverObj.app);
    const initial = await agent.get('/api/clients');
    const count = initial.body.length;
    await agent.post('/api/clients').send({ name: 'Mocha' });
    const after = await agent.get('/api/clients');
    assert.strictEqual(after.body.length, count + 1);
  });

  it('socket receives data_updated after POST', function(done) {
    const port = server.address().port;
    const client = ioClient(`http://localhost:${port}`, { transports:['websocket'] });
    client.on('connect', async () => {
      await request(serverObj.app).post('/api/clients').send({ name: 'Sock' });
    });
    client.on('data_updated', () => {
      client.close();
      done();
    });
  });

  it('GET /api/history returns elements', async function() {
    await request(serverObj.app).post('/api/history').send({ summary: 'test' });
    const resp = await request(serverObj.app).get('/api/history');
    assert.ok(Array.isArray(resp.body));
    assert.ok(resp.body.length > 0);
    assert.ok(resp.body[0].summary);
  });

  it('handles request immediately after startup', function(done) {
    request(serverObj.app)
      .get('/api/clients')
      .expect(200, done);
  });

  it('GET /api/data returns all tables', async function() {
    await request(serverObj.app).post('/api/clients').send({ name: 'Data' });
    const resp = await request(serverObj.app).get('/api/data');
    assert.ok(Array.isArray(resp.body.items));
    assert.ok(Array.isArray(resp.body.clients));
    assert.ok(Array.isArray(resp.body.history));
    assert.ok(resp.body.clients.find(c => c.nombre === 'Data'));
  });

  it('POST /api/data replaces tables', async function() {
    const agent = request(serverObj.app);
    await agent.post('/api/items').send({ nombre: 'Old', precio: 1 });
    const now = new Date().toISOString();
    const payload = { items: [{ id: 1, nombre: 'New', precio: 2, updated_at: now }], clients: [], history: [] };
    await agent.post('/api/data').send(payload);
    const items = await agent.get('/api/items');
    assert.strictEqual(items.body.length, 1);
    assert.strictEqual(items.body[0].nombre, 'New');
  });
});
