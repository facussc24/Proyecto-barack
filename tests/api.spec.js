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
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
    serverObj = createServer();
    server = serverObj.httpServer.listen(0, done);
  });
  afterEach(function(done) {
    server.close(() => {
      if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
      done();
    });
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
});
