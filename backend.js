const express = require('express');
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
    db.run(`CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL,
      updated_at TEXT NOT NULL
    )`);
  });
  return db;
}

function createServer() {
  const app = express();
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

  return app;
}

module.exports = createServer;
