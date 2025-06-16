import express from 'express';
import SSE from 'express-sse';
import cors from 'cors';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, 'data.json');

async function readData() {
  try {
    const text = await readFile(DATA_FILE, 'utf8');
    return JSON.parse(text);
  } catch {
    return { sinoptico: [], users: [] };
  }
}

async function writeData(data) {
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

function createApp() {
  const app = express();
  const sse = new SSE();
  const allowedOrigin = process.env.CORS_ORIGIN || '*';
  if (allowedOrigin === '*') {
    app.use(cors());
  } else {
    app.use(cors({ origin: allowedOrigin.split(',') }));
  }
  app.use(express.json());

  app.get('/events', sse.init);

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
  const app = createApp();
  return new Promise(resolve => {
    const server = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
      resolve(server);
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}

export default createApp;
