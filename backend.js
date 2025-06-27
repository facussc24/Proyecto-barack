const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const DATA_DIR = path.join(__dirname, 'datos');
const DB_FILE = path.join(DATA_DIR, 'base_de_datos.sqlite');

function initDb(db) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON');
      db.run(
        `CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL,
      updated_at TEXT NOT NULL
    )`,
        err => {
          if (err) return reject(err);
        }
      );
      db.run(
        `CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL UNIQUE CHECK(codigo != '' AND codigo NOT GLOB '*[^A-Z0-9-]*'),
      nombre TEXT NOT NULL,
      imagen_path TEXT,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1
    )`,
        err => {
          if (err) return reject(err);
        }
      );
      db.run(
        `CREATE TABLE IF NOT EXISTS history (
      ts TEXT NOT NULL,
      user TEXT,
      summary TEXT
    )`,
        err => {
          if (err) return reject(err);
          resolve(db);
        }
      );
    });
  });
}

function createServer() {
  const app = express();
  app.use(express.json());
  app.use('/docs', express.static(path.join(__dirname, 'docs')));

  const httpServer = http.createServer(app);
  const io = new Server(httpServer);

  const db = new sqlite3.Database(DB_FILE);
  const dbReady = initDb(db);
  let dbWatcher;

  dbReady
    .then(() => {
      try {
        dbWatcher = fs.watch(DB_FILE, () => {
          io.emit('data_updated');
        });
      } catch (err) {
        console.error('Failed to watch DB file', err);
      }
    })
    .catch(() => {});

  httpServer.on('close', () => {
    if (dbWatcher) dbWatcher.close();
    db.close();
  });

  function allAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  }

  function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  app.get('/api/items', (req, res) => {
    db.all('SELECT * FROM items', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.post('/api/items', (req, res) => {
    const { nombre, precio } = req.body;
    const updated = new Date().toISOString();
    db.run(
      'INSERT INTO items(nombre, precio, updated_at) VALUES (?,?,?)',
      [nombre, precio, updated],
      function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, nombre, precio, updated_at: updated });
      }
    );
  });

  app.patch('/api/items/:id', (req, res) => {
    const { nombre, precio } = req.body;
    const updated = new Date().toISOString();
    db.run(
      'UPDATE items SET nombre=?, precio=?, updated_at=? WHERE id=?',
      [nombre, precio, updated, req.params.id],
      function (err) {
        if (err) return res.status(400).json({ error: err.message });
        if (!this.changes) return res.status(404).json({ error: 'not found' });
        res.json({ id: req.params.id, nombre, precio, updated_at: updated });
      }
    );
  });

  app.delete('/api/items/:id', (req, res) => {
    db.run('DELETE FROM items WHERE id=?', req.params.id, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (!this.changes) return res.status(404).json({ error: 'not found' });
      res.json({ status: 'deleted' });
    });
  });

  /** Clients CRUD **/
  app.get('/api/clients', (req, res) => {
    db.all('SELECT * FROM clients', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.post('/api/clients', (req, res) => {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const codigo = Date.now().toString();
    const ts = new Date().toISOString();
    db.run(
      'INSERT INTO clients(codigo,nombre,updated_at,version) VALUES(?,?,?,1)',
      [codigo, name, ts],
      function (err) {
        if (err) return res.status(400).json({ error: err.message });
        io.emit('data_updated');
        res.json({ id: this.lastID, codigo, nombre: name, updated_at: ts, version: 1 });
      }
    );
  });

  app.patch('/api/clients/:id', (req, res) => {
    const id = req.params.id;
    const { codigo, nombre, imagen_path, version } = req.body || {};
    if (version === undefined) {
      return res.status(400).json({ success: false, error: 'version required' });
    }
    db.get('SELECT * FROM clients WHERE id=?', [id], (err, row) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!row) return res.status(404).json({ success: false, error: 'not found' });
      if (row.version !== version) return res.status(409).json({ success: false, error: 'conflict' });
      const newVer = version + 1;
      const ts = new Date().toISOString();
      db.run(
        'UPDATE clients SET codigo=?, nombre=?, imagen_path=?, updated_at=?, version=? WHERE id=?',
        [codigo ?? row.codigo, nombre ?? row.nombre, imagen_path ?? row.imagen_path, ts, newVer, id],
        function (err2) {
          if (err2) return res.status(400).json({ success: false, error: err2.message });
          db.get('SELECT * FROM clients WHERE id=?', [id], (err3, updated) => {
            if (err3) return res.status(500).json({ success: false, error: err3.message });
            res.json({ success: true, data: updated });
          });
        }
      );
    });
  });

  app.delete('/api/clients/:id', (req, res) => {
    db.run('DELETE FROM clients WHERE id=?', req.params.id, function (err) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!this.changes) return res.status(404).json({ success: false, error: 'not found' });
      res.json({ success: true });
    });
  });

  /** History **/
  app.get('/api/history', (req, res) => {
    db.all('SELECT * FROM history ORDER BY ts DESC', (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json(rows);
    });
  });

  app.post('/api/history', (req, res) => {
    const { user, summary } = req.body || {};
    if (!summary) {
      return res.status(400).json({ success: false, error: 'summary required' });
    }
    const ts = new Date().toISOString();
    db.run('INSERT INTO history(ts, user, summary) VALUES (?,?,?)', [ts, user || null, summary], function (err) {
      if (err) return res.status(400).json({ success: false, error: err.message });
      res.json({ success: true, data: { ts, user: user || null, summary } });
    });
  });

  /** Combined export/import */
  app.get('/api/data', async (req, res) => {
    try {
      const [items, clients, history] = await Promise.all([
        allAsync('SELECT * FROM items'),
        allAsync('SELECT * FROM clients'),
        allAsync('SELECT * FROM history ORDER BY ts DESC'),
      ]);
      res.json({ items, clients, history });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/data', async (req, res) => {
    const data = req.body || {};
    try {
      await runAsync('BEGIN');
      await runAsync('DELETE FROM items');
      for (const row of data.items || []) {
        await runAsync('INSERT INTO items(id,nombre,precio,updated_at) VALUES (?,?,?,?)', [row.id, row.nombre, row.precio, row.updated_at]);
      }
      await runAsync('DELETE FROM clients');
      for (const row of data.clients || []) {
        await runAsync('INSERT INTO clients(id,codigo,nombre,imagen_path,updated_at,version) VALUES (?,?,?,?,?,?)', [row.id, row.codigo, row.nombre, row.imagen_path, row.updated_at, row.version ?? 1]);
      }
      await runAsync('DELETE FROM history');
      for (const row of data.history || []) {
        await runAsync('INSERT INTO history(ts,user,summary) VALUES (?,?,?)', [row.ts, row.user, row.summary]);
      }
      await runAsync('COMMIT');
      io.emit('data_updated');
      res.json({ success: true });
    } catch (err) {
      try { await runAsync('ROLLBACK'); } catch (e) {}
      res.status(400).json({ error: err.message });
    }
  });

  return { app, httpServer, io, dbReady, db };
}

module.exports = createServer;
