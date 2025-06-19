import os
import sqlite3
import queue
import json
from datetime import datetime
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_socketio import SocketIO

DB_PATH = os.getenv("DB_PATH", os.path.join("data", "db.sqlite"))
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, async_mode="eventlet", cors_allowed_origins="*")
sse_clients = []


def publish_update(row):
    socketio.emit("product_updated", row)
    for q in list(sse_clients):
        q.put(json.dumps(row))


@app.get("/api/stream")
def stream():
    def gen():
        q = queue.Queue()
        sse_clients.append(q)
        try:
            while True:
                data = q.get()
                yield f"data: {data}\n\n"
        finally:
            sse_clients.remove(q)

    return Response(gen(), mimetype="text/event-stream")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL,
            updated_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            user TEXT,
            action TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY(product_id) REFERENCES products(id)
        )
        """
    )
    conn.commit()
    conn.close()


@app.before_first_request
def setup():
    init_db()


@app.get("/api/products")
def get_products():
    conn = get_db()
    rows = conn.execute("SELECT * FROM products").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.patch("/api/products/<int:prod_id>")
def update_product(prod_id):
    data = request.get_json(force=True, silent=True) or {}
    updated_at = data.get("updated_at")
    if updated_at is None:
        return jsonify({"error": "updated_at required"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products WHERE id = ?", (prod_id,))
    row = cur.fetchone()
    if row is None:
        conn.close()
        return jsonify({"error": "not found"}), 404

    if row["updated_at"] != updated_at:
        conn.close()
        return jsonify({"error": "conflict"}), 409

    new_updated = datetime.utcnow().isoformat() + "Z"
    fields = []
    values = []
    for key in ["name", "price"]:
        if key in data:
            fields.append(f"{key} = ?")
            values.append(data[key])
    fields.append("updated_at = ?")
    values.append(new_updated)
    values.append(prod_id)
    cur.execute(f"UPDATE products SET {', '.join(fields)} WHERE id = ?", values)

    user = data.get("user") or request.headers.get("X-User")
    cur.execute(
        "INSERT INTO history(product_id, user, action, timestamp) VALUES (?,?,?,?)",
        (prod_id, user, "update", new_updated),
    )
    conn.commit()

    cur.execute("SELECT * FROM products WHERE id = ?", (prod_id,))
    updated = cur.fetchone()
    conn.close()

    result = dict(updated)
    publish_update(result)
    return jsonify(result)


@app.get("/api/history")
def get_history():
    product = request.args.get("product")
    user = request.args.get("user")
    from_ts = request.args.get("from")

    query = "SELECT * FROM history WHERE 1=1"
    params = []
    if product:
        query += " AND product_id = ?"
        params.append(product)
    if user:
        query += " AND user = ?"
        params.append(user)
    if from_ts:
        query += " AND timestamp >= ?"
        params.append(from_ts)

    conn = get_db()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=8000)
