const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'datos');
const DB_FILE = path.join(DATA_DIR, 'base_de_datos.sqlite');

function initDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new sqlite3.Database(DB_FILE);
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');
    db.run(`CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL,
      updated_at TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL UNIQUE CHECK(codigo != '' AND codigo NOT GLOB '*[^A-Z0-9-]*'),
      nombre TEXT NOT NULL,
      imagen_path TEXT,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS history (
      ts TEXT NOT NULL,
      user TEXT,
      summary TEXT
    )`);
  });
  return db;
}

function createServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer);
  app.use(express.json());
  app.use('/docs', express.static(path.join(__dirname, 'docs')));

  const db = initDb();

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
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    });
  });

  app.post('/api/clients', (req, res) => {
    const { codigo, nombre, imagen_path } = req.body || {};
    if (!codigo || !nombre) {
      return res.status(400).json({ success: false, error: 'codigo and nombre required' });
    }
    const ts = new Date().toISOString();
    db.run(
      `INSERT INTO clients(codigo,nombre,imagen_path,updated_at,version) VALUES (?,?,?,?,1)`,
      [codigo, nombre, imagen_path || null, ts],
      function (err) {
        if (err) return res.status(400).json({ success: false, error: err.message });
        res.json({ success: true, data: { id: this.lastID, codigo, nombre, imagen_path: imagen_path || null, updated_at: ts, version: 1 } });
        io.emit('data_updated');
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

  return httpServer;
}

module.exports = createServer;
