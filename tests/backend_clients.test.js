const fs = require('fs');
const path = require('path');
const request = require('supertest');
const createServer = require('../backend');

const DB_FILE = path.join(__dirname, '..', 'datos', 'base_de_datos.sqlite');

describe('POST /api/clients with name only', () => {
  beforeEach(() => {
    // clear existing data
    if (fs.existsSync(DB_FILE)) {
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database(DB_FILE);
      db.exec('DELETE FROM items;DELETE FROM clients;DELETE FROM history;DELETE FROM amfe;', () => db.close());
    }
  });


    test('creates client', async () => {
      const { app, dbReady } = createServer();
      await dbReady;
      const resp = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client' });
      expect(resp.status).toBe(200);
      expect(resp.body.nombre).toBe('Test Client');
      expect(resp.body.codigo).toBeDefined();
  });
});
