# Backend API and Deployment

This project serves the frontend from GitHub Pages or any static server while storing data through an external API. When the frontend is hosted on GitHub Pages, you must point the application to your own server running `backend/main.py`.

## Separation of concerns

- **GitHub Pages / `docs/`**: contains only static HTML, CSS and JavaScript. No server-side code runs here.
- **API server**: runs separately, stores data and broadcasts changes. It can be started with plain Python.

## API endpoints


- `GET /api/products` – list products stored in SQLite.
- `PATCH /api/products/<id>` – update a product; fails with 409 if timestamps differ.
- `GET /api/history` – filterable history (`product`, `user`, `from`).
- `GET /api/stream` – Server‑Sent Events with product updates.

## WebSocket events

- `product_updated` – emitted by `backend/main.py` after a product update.

## Environment variables

- `DATA_DIR` – directory where the server stores its data (`data` by default).
- `DB_PATH` – path to the SQLite file used by `backend/main.py` (`data/db.sqlite` by default).
- `ALLOWED_ORIGINS` – comma-separated list of origins allowed for CORS and
  WebSocket connections. Defaults to
  `http://desktop-14jg95b:8080,http://192.168.1.233:8080,http://localhost:8080`.

### Changing `ALLOWED_ORIGINS`

If the web interface is hosted under a different hostname or port, add that
origin to the `ALLOWED_ORIGINS` environment variable before starting the
backend. For example:

Set this variable before starting the backend if the web interface is served
from another host:

```bash
ALLOWED_ORIGINS=http://mi-host:8080 python backend/main.py
```

## Offline fallback

If the API server is unreachable, the frontend keeps working thanks to IndexedDB (via Dexie) and localStorage. Data modifications are saved locally and synchronized once the server becomes available again.

## Deployment steps

### Python

1. `pip install -r requirements.txt`
2. Run `python backend/main.py` to serve the API and static files on port 5000.

