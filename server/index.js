import express from 'express';
import SSE from 'express-sse';
import cors from 'cors';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

process.on('uncaughtException', err => {
  console.error(err.stack || err);
});

process.on('unhandledRejection', err => {
  console.error('Unhandled rejection:', err);
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = process.pkg ? dirname(process.execPath) : join(__dirname, '..');
const DATA_FILE = join(ROOT_DIR, 'data.json');

async function readData() {
  try {
    const text = await readFile(DATA_FILE, 'utf8');
    return JSON.parse(text);
  } catch {
    return { sinoptico: [], users: [] };
  }
}

async function ensureDefaultUsers() {
  const data = await readData();
  if (Array.isArray(data.users) && data.users.length === 0) {
    const defaults = [
      { name: 'admin', password: 'admin', role: 'admin' },
    ];
    defaults.forEach((u, i) => {
      u.id = Date.now().toString() + i;
      data.users.push(u);
    });
    await writeData(data);
  }
}

async function writeData(data) {
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

async function createApp() {
  const app = express();
  const sse = new SSE();
  const allowedOrigin = process.env.CORS_ORIGIN || '*';
  if (allowedOrigin === '*') {
    app.use(cors());
  } else {
    app.use(cors({ origin: allowedOrigin.split(',') }));
  }
  app.use(express.json());
  app.use(express.static(ROOT_DIR));

  await ensureDefaultUsers();

  app.get('/api/events', sse.init);

  // Sinoptico routes
  app.get('/api/sinoptico', async (req, res) => {
    const data = await readData();
    res.json(data.sinoptico);
  });

  app.post('/api/sinoptico', async (req, res) => {
    const data = await readData();
    const item = { ...req.body };
    if (!item.id) item.id = Date.now().toString();
    data.sinoptico.push(item);
    await writeData(data);
    sse.send({ type: 'update' });
    res.status(201).json(item);
  });

  app.put('/api/sinoptico/:id', async (req, res) => {
    const data = await readData();
    const idx = data.sinoptico.findIndex(x => String(x.id) === req.params.id);
    if (idx === -1) return res.status(404).end();
    data.sinoptico[idx] = { ...data.sinoptico[idx], ...req.body, id: data.sinoptico[idx].id };
    await writeData(data);
    sse.send({ type: 'update' });
    res.json(data.sinoptico[idx]);
  });

  app.delete('/api/sinoptico/:id', async (req, res) => {
    const data = await readData();
    const idx = data.sinoptico.findIndex(x => String(x.id) === req.params.id);
    if (idx === -1) return res.status(404).end();
    const removed = data.sinoptico.splice(idx, 1)[0];
    await writeData(data);
    sse.send({ type: 'update' });
    res.json(removed);
  });

  // User routes
  app.get('/api/users', async (req, res) => {
    const data = await readData();
    res.json(data.users);
  });

  app.post('/api/users', async (req, res) => {
    const data = await readData();
    const user = { ...req.body };
    if (!user.id) user.id = Date.now().toString();
    data.users.push(user);
    await writeData(data);
    sse.send({ type: 'update' });
    res.status(201).json(user);
  });

  app.put('/api/users/:id', async (req, res) => {
    const data = await readData();
    const idx = data.users.findIndex(x => String(x.id) === req.params.id);
    if (idx === -1) return res.status(404).end();
    data.users[idx] = { ...data.users[idx], ...req.body, id: data.users[idx].id };
    await writeData(data);
    sse.send({ type: 'update' });
    res.json(data.users[idx]);
  });

  app.delete('/api/users/:id', async (req, res) => {
    const data = await readData();
    const idx = data.users.findIndex(x => String(x.id) === req.params.id);
    if (idx === -1) return res.status(404).end();
    const removed = data.users.splice(idx, 1)[0];
    await writeData(data);
    sse.send({ type: 'update' });
    res.json(removed);
  });

  return app;
}

export async function startServer(port = process.env.PORT || 3000) {
  const app = await createApp();
  return new Promise(resolve => {
    const server = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
      resolve(server);
    });
  });
}

async function main() {
  try {
    await startServer();
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Press ENTER to exit', () => {
      rl.close();
      process.exit();
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export default createApp;
