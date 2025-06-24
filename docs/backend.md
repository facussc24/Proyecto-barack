# Backend API and Deployment

This project serves the frontend from GitHub Pages or any static server while storing data through an external API. When the frontend is hosted on GitHub Pages, you must point the application to your own server running `server.py` or `backend/main.py`.

## Separation of concerns

- **GitHub Pages / `docs/`**: contains only static HTML, CSS and JavaScript. No server-side code runs here.
- **API server**: runs separately, stores data and broadcasts changes. It can be started with plain Python or via Docker Compose.

The frontend reads the server URL from `localStorage` (`apiUrl`) or from the `API_URL` environment variable at build time. If none is provided it defaults to `http://localhost:5000/api/data`.

## API endpoints

### `server.py`

- `GET /api/data` – returns the current JSON database.
- `POST /api/data` – replaces the database and appends an entry to `history.json`.
- `GET /api/history` – entire history of updates.
- `GET /api/server-info` – basic statistics about the running server.

### `backend/main.py`

- `GET /api/products` – list products stored in SQLite.
- `PATCH /api/products/<id>` – update a product; fails with 409 if timestamps differ.
- `GET /api/history` – filterable history (`product`, `user`, `from`).
- `GET /api/stream` – Server‑Sent Events with product updates.

## WebSocket events

- `data_updated` – emitted by `server.py` whenever `/api/data` receives new data.
- `product_updated` – emitted by `backend/main.py` after a product update.

## Environment variables

- `API_URL` – URL used by the frontend to access `/api/data`.
- `DATA_DIR` – directory where `server.py` stores `latest.json` and backups (`data` by default).
  Backups generated with `/api/backups` also include `history.json`, the SQLite
  database and any image folders under `docs` so restoring a ZIP reinstates the
  full application state.
- `SSL_CERT` / `SSL_KEY` – optional certificate paths for HTTPS when running `server.py`.
- `DB_PATH` – path to the SQLite file used by `backend/main.py` (`data/db.sqlite` by default).
- `ALLOWED_ORIGINS` – comma-separated list of origins allowed by CORS. Defaults
  to `http://192.168.1.233:8080,http://localhost:8080`.

## Offline fallback

If the API server is unreachable, the frontend keeps working thanks to IndexedDB (via Dexie) and localStorage. Data modifications are saved locally and synchronized once the server becomes available again.

## Deployment steps

### Python

1. `pip install -r requirements.txt`
2. Run `python server.py` to serve the frontend and JSON API on port 5000.
   Set `API_URL` in the browser (or as an environment variable) if the server is on another machine.
3. Alternatively run `python backend/main.py` for the SQLite API on port 5000.

### Docker Compose

1. Ensure Docker and Docker Compose are installed.
2. Build the image the first time with `docker-compose build`.
3. Run `docker-compose up` from the project root.
4. Nginx will serve the `docs/` folder on port 8080 and the API from `backend/main.py` on port 5000.
5. Point the frontend to `http://<host>:5000/api` as needed.
6. The Compose file mounts `./data` and `./backups` so database files and backups persist across container restarts.

