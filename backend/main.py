import os
import sqlite3
import queue
import json
import glob
import shutil
from datetime import datetime
from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
from flask_socketio import SocketIO
from io import BytesIO
import xlsxwriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from zipfile import ZipFile, ZIP_DEFLATED

DB_PATH = os.getenv("DB_PATH", os.path.join("data", "db.sqlite"))
BACKUP_DIR = os.getenv("BACKUP_DIR", "/app/backups")
META_FILE = os.path.join(BACKUP_DIR, "metadata.json")
ACTIVE_KEY = "_active"
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
os.makedirs(BACKUP_DIR, exist_ok=True)

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, async_mode="eventlet", cors_allowed_origins="*")
sse_clients = []


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


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
    conn.execute("PRAGMA foreign_keys = ON")
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

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS history_log(
            ts TEXT NOT NULL,
            user TEXT,
            summary TEXT
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Cliente (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT NOT NULL UNIQUE CHECK(codigo != '' AND codigo NOT GLOB '*[^A-Z0-9-]*'),
            nombre TEXT NOT NULL,
            imagen_path TEXT,
            updated_at TEXT NOT NULL,
            version INTEGER NOT NULL DEFAULT 1
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Proveedor (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT NOT NULL UNIQUE CHECK(codigo != '' AND codigo NOT GLOB '*[^A-Z0-9-]*'),
            nombre TEXT NOT NULL,
            imagen_path TEXT,
            updated_at TEXT NOT NULL,
            version INTEGER NOT NULL DEFAULT 1
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS UnidadMedida (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT NOT NULL UNIQUE CHECK(codigo != '' AND codigo NOT GLOB '*[^A-Z0-9-]*'),
            descripcion TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            version INTEGER NOT NULL DEFAULT 1
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Insumo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT NOT NULL UNIQUE CHECK(codigo != '' AND codigo NOT GLOB '*[^A-Z0-9-]*'),
            nombre TEXT NOT NULL,
            unidad_id INTEGER NOT NULL,
            peso REAL CHECK(peso > 0),
            imagen_path TEXT,
            updated_at TEXT NOT NULL,
            version INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY(unidad_id) REFERENCES UnidadMedida(id) ON DELETE RESTRICT
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Producto (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT NOT NULL UNIQUE CHECK(codigo != '' AND codigo NOT GLOB '*[^A-Z0-9-]*'),
            descripcion TEXT NOT NULL,
            cliente_id INTEGER NOT NULL,
            peso REAL CHECK(peso > 0),
            imagen_path TEXT,
            updated_at TEXT NOT NULL,
            version INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY(cliente_id) REFERENCES Cliente(id) ON DELETE RESTRICT
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Subproducto (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            producto_id INTEGER NOT NULL,
            codigo TEXT NOT NULL UNIQUE CHECK(codigo != '' AND codigo NOT GLOB '*[^A-Z0-9-]*'),
            descripcion TEXT,
            peso REAL CHECK(peso > 0),
            imagen_path TEXT,
            updated_at TEXT NOT NULL,
            version INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY(producto_id) REFERENCES Producto(id) ON DELETE RESTRICT
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS ProductoInsumo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            producto_id INTEGER NOT NULL,
            insumo_id INTEGER NOT NULL,
            cantidad REAL NOT NULL CHECK(cantidad > 0),
            updated_at TEXT NOT NULL,
            version INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY(producto_id) REFERENCES Producto(id) ON DELETE RESTRICT,
            FOREIGN KEY(insumo_id) REFERENCES Insumo(id) ON DELETE RESTRICT,
            UNIQUE(producto_id, insumo_id)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS AuditLog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            row_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            snapshot TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
        """
    )

    # create audit triggers
    tables = [
        "Cliente",
        "Proveedor",
        "UnidadMedida",
        "Insumo",
        "Producto",
        "Subproducto",
        "ProductoInsumo",
    ]

    for tbl in tables:
        cols = [r[1] for r in cur.execute(f"PRAGMA table_info({tbl})").fetchall()]
        new_cols = ", ".join([f"'{c}', NEW.{c}" for c in cols])
        old_cols = ", ".join([f"'{c}', OLD.{c}" for c in cols])
        cur.executescript(
            f"""
            CREATE TRIGGER IF NOT EXISTS {tbl}_ai AFTER INSERT ON {tbl}
            BEGIN
                INSERT INTO AuditLog(table_name,row_id,action,snapshot,timestamp)
                VALUES ('{tbl}', NEW.id, 'insert', json_object({new_cols}), CURRENT_TIMESTAMP);
            END;
            CREATE TRIGGER IF NOT EXISTS {tbl}_au AFTER UPDATE ON {tbl}
            BEGIN
                INSERT INTO AuditLog(table_name,row_id,action,snapshot,timestamp)
                VALUES ('{tbl}', NEW.id, 'update', json_object({new_cols}), CURRENT_TIMESTAMP);
            END;
            CREATE TRIGGER IF NOT EXISTS {tbl}_ad AFTER DELETE ON {tbl}
            BEGIN
                INSERT INTO AuditLog(table_name,row_id,action,snapshot,timestamp)
                VALUES ('{tbl}', OLD.id, 'delete', json_object({old_cols}), CURRENT_TIMESTAMP);
            END;
            """
        )

    conn.commit()
    conn.close()


init_db()


def log_event(user: str | None, summary: str) -> None:
    conn = get_db()
    conn.execute(
        "INSERT INTO history_log(ts, user, summary) VALUES (?,?,?)",
        (datetime.utcnow().isoformat() + "Z", user, summary),
    )
    conn.commit()
    conn.close()


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
    _touch_last_updated()

    cur.execute("SELECT * FROM products WHERE id = ?", (prod_id,))
    updated = cur.fetchone()
    conn.close()

    result = dict(updated)
    publish_update(result)
    return jsonify(result)


@app.get("/api/history")
def get_history():
    conn = get_db()
    rows = conn.execute(
        "SELECT ts, summary FROM history_log ORDER BY ts DESC"
    ).fetchall()
    conn.close()
    return jsonify([{"ts": r["ts"], "summary": r["summary"]} for r in rows])


TABLE_MAP = {
    "clientes": "Cliente",
    "proveedores": "Proveedor",
    "unidades": "UnidadMedida",
    "insumos": "Insumo",
    "productos_db": "Producto",
    "subproductos": "Subproducto",
    "producto_insumos": "ProductoInsumo",
    "auditlog": "AuditLog",
}


def select_all(table):
    conn = get_db()
    rows = conn.execute(f"SELECT * FROM {table}").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def select_one(table, item_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM {table} WHERE id = ?", (item_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def insert_row(table, data):
    now = datetime.utcnow().isoformat() + "Z"
    data.setdefault("updated_at", now)
    data.setdefault("version", 1)
    keys = ", ".join(data.keys())
    placeholders = ", ".join(["?" for _ in data])
    values = list(data.values())
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            f"INSERT INTO {table} ({keys}) VALUES ({placeholders})",
            values,
        )
        item_id = cur.lastrowid
        conn.commit()
        cur.execute(f"SELECT * FROM {table} WHERE id = ?", (item_id,))
        row = cur.fetchone()
        result = dict(row)
    except sqlite3.IntegrityError as e:
        conn.rollback()
        conn.close()
        return None, str(e)
    conn.close()
    _touch_last_updated()
    return result, None


def update_row(table, item_id, data):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM {table} WHERE id = ?", (item_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return None, "not found", 404
    if row["version"] != data.get("version"):
        conn.close()
        return None, "conflict", 409
    new_version = row["version"] + 1
    new_updated = datetime.utcnow().isoformat() + "Z"
    fields = []
    values = []
    for k, v in data.items():
        if k in ("id", "updated_at", "version"):
            continue
        fields.append(f"{k} = ?")
        values.append(v)
    fields.append("updated_at = ?")
    values.append(new_updated)
    fields.append("version = ?")
    values.append(new_version)
    values.append(item_id)
    try:
        cur.execute(f"UPDATE {table} SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()
        cur.execute(f"SELECT * FROM {table} WHERE id = ?", (item_id,))
        updated = cur.fetchone()
        result = dict(updated)
    except sqlite3.IntegrityError as e:
        conn.rollback()
        conn.close()
        return None, str(e), 400
    conn.close()
    _touch_last_updated()
    return result, None, 200


def delete_row(table, item_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM {table} WHERE id = ?", (item_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return None, "not found", 404
    try:
        cur.execute(f"DELETE FROM {table} WHERE id = ?", (item_id,))
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.rollback()
        conn.close()
        return None, str(e), 400
    conn.close()
    _touch_last_updated()
    return dict(row), None, 200


@app.route("/api/<table>", methods=["GET", "POST"])
@app.route("/api/<table>/<int:item_id>", methods=["GET", "PATCH", "DELETE"])
def generic_crud(table, item_id=None):
    if table not in TABLE_MAP:
        return jsonify({"success": False, "errors": "not found"}), 404

    db_table = TABLE_MAP[table]

    if request.method == "GET" and item_id is None:
        data = select_all(db_table)
        return jsonify({"success": True, "data": data})

    if request.method == "GET" and item_id is not None:
        row = select_one(db_table, item_id)
        if row is None:
            return jsonify({"success": False, "errors": "not found"}), 404
        return jsonify({"success": True, "data": row})

    if request.method == "POST":
        payload = request.get_json(force=True, silent=True) or {}
        row, err = insert_row(db_table, payload)
        if err:
            return jsonify({"success": False, "errors": err}), 400
        user = payload.get("user") or request.headers.get("X-User")
        name = row.get("nombre") or row.get("descripcion") or row.get("codigo") or ""
        summary = f"Cre\u00f3 {db_table.lower()} {name} (id {row['id']})"
        log_event(user, summary)
        socketio.emit("data_updated")
        return jsonify({"success": True, "data": row})

    if request.method == "PATCH":
        payload = request.get_json(force=True, silent=True) or {}
        res, err, code = update_row(db_table, item_id, payload)
        if err:
            return jsonify({"success": False, "errors": err}), code
        user = payload.get("user") or request.headers.get("X-User")
        name = res.get("nombre") or res.get("descripcion") or res.get("codigo") or ""
        summary = f"Actualiz\u00f3 {db_table.lower()} {name} (id {res['id']})"
        log_event(user, summary)
        socketio.emit("data_updated")
        return jsonify({"success": True, "data": res})

    if request.method == "DELETE":
        res, err, code = delete_row(db_table, item_id)
        if err:
            return jsonify({"success": False, "errors": err}), code
        user = request.headers.get("X-User")
        name = res.get("nombre") or res.get("descripcion") or res.get("codigo") or ""
        summary = f"Elimin\u00f3 {db_table.lower()} {name} (id {res['id']})"
        log_event(user, summary)
        socketio.emit("data_updated")
        return jsonify({"success": True, "data": res})

    return jsonify({"success": False, "errors": "method not allowed"}), 405


def manual_backup(description=None, activate=False):
    if not os.path.exists(DB_PATH):
        return None
    ts = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S")
    dest = os.path.join(BACKUP_DIR, f"{ts}.zip")
    with ZipFile(dest, "w", compression=ZIP_DEFLATED) as zf:
        zf.write(DB_PATH, arcname="db.sqlite")
    conn = get_db()
    tables = [
        "Cliente",
        "Proveedor",
        "UnidadMedida",
        "Insumo",
        "Producto",
        "Subproducto",
        "ProductoInsumo",
    ]
    stats = {
        tbl: conn.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0] for tbl in tables
    }
    conn.close()

    meta = {}
    if os.path.exists(META_FILE):
        with open(META_FILE, "r", encoding="utf-8") as f:
            meta = json.load(f)
    ts_iso = datetime.utcnow().isoformat() + "Z"
    meta[os.path.basename(dest)] = {
        "description": description or "",
        "stats": stats,
        "last_updated": ts_iso,
    }
    if activate:
        meta[ACTIVE_KEY] = {
            "name": os.path.basename(dest),
            "timestamp": ts_iso,
        }
    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    return dest


def simple_backup() -> str | None:
    """Create a plain SQLite copy under BACKUP_DIR/backup_<timestamp>.db."""
    if not os.path.exists(DB_PATH):
        return None
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    dest = os.path.join(BACKUP_DIR, f"backup_{ts}.db")
    shutil.copy2(DB_PATH, dest)
    return dest


def _validate_simple_name(name: str) -> str | None:
    if not name or "/" in name or "\\" in name or name in {".", ".."}:
        return None
    base = os.path.basename(name)
    if base != name or not base.endswith(".db"):
        return None
    full = os.path.abspath(os.path.join(BACKUP_DIR, base))
    if os.path.commonpath([full, os.path.abspath(BACKUP_DIR)]) != os.path.abspath(
        BACKUP_DIR
    ):
        return None
    return base


def _validate_backup_name(name: str) -> str | None:
    if not name or "/" in name or "\\" in name:
        return None
    if name in {".", ".."}:
        return None
    base = os.path.basename(name)
    if base != name or not base.endswith(".zip"):
        return None
    full = os.path.abspath(os.path.join(BACKUP_DIR, base))
    if os.path.commonpath([full, os.path.abspath(BACKUP_DIR)]) != os.path.abspath(
        BACKUP_DIR
    ):
        return None
    return base


def _touch_last_updated() -> None:
    if not os.path.exists(META_FILE):
        return
    with open(META_FILE, "r", encoding="utf-8") as f:
        meta = json.load(f)
    active = meta.get(ACTIVE_KEY, {}).get("name")
    if not active:
        return
    entry = meta.get(active, {})
    if isinstance(entry, str):
        entry = {"description": entry}
    if not isinstance(entry, dict):
        entry = {}
    entry["last_updated"] = datetime.utcnow().isoformat() + "Z"
    meta[active] = entry
    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


@app.get("/api/backups")
def list_backups():
    files = sorted(
        os.path.basename(f) for f in glob.glob(os.path.join(BACKUP_DIR, "*.zip"))
    )
    meta = {}
    if os.path.exists(META_FILE):
        with open(META_FILE, "r", encoding="utf-8") as f:
            meta = json.load(f)
    active = meta.get(ACTIVE_KEY, {}).get("name") if meta else None
    result = []
    for f in files:
        info = meta.get(f, {})
        if isinstance(info, str):
            info = {"description": info}
        result.append(
            {
                "name": f,
                "description": info.get("description", ""),
                "stats": info.get("stats", {}),
                "last_updated": info.get("last_updated"),
                "active": f == active,
            }
        )
    return jsonify(result)


@app.post("/api/backups")
def create_backup_route():
    data = request.get_json(force=True, silent=True) or {}
    desc = data.get("description")
    if not desc or not str(desc).strip():
        return jsonify({"error": "missing description"}), 400
    activate = bool(data.get("activate"))
    path = manual_backup(desc, activate)
    if not path:
        return jsonify({"error": "no data"}), 404
    name = os.path.basename(path)
    info = {}
    if os.path.exists(META_FILE):
        with open(META_FILE, "r", encoding="utf-8") as f:
            info = json.load(f).get(name, {})
    return jsonify(
        {
            "path": f"backups/{name}",
            "description": desc or "",
            "stats": info.get("stats", {}),
            "last_updated": info.get("last_updated"),
        }
    )


@app.delete("/api/backups/<name>")
def delete_backup(name):
    safe = _validate_backup_name(name)
    if not safe:
        return jsonify({"error": "invalid name"}), 400
    path = os.path.join(BACKUP_DIR, safe)
    if not os.path.exists(path):
        return jsonify({"error": "not found"}), 404
    os.remove(path)
    if os.path.exists(META_FILE):
        with open(META_FILE, "r", encoding="utf-8") as f:
            meta = json.load(f)
        if meta.pop(safe, None) is not None:
            with open(META_FILE, "w", encoding="utf-8") as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)
    return jsonify({"status": "deleted"})


@app.post("/api/restore")
def restore_backup():
    data = request.get_json(force=True, silent=True) or {}
    name = data.get("name")
    if not name:
        return jsonify({"error": "missing name"}), 400
    safe = _validate_backup_name(name)
    if not safe:
        return jsonify({"error": "invalid name"}), 400
    path = os.path.join(BACKUP_DIR, safe)
    if not os.path.exists(path):
        return jsonify({"error": "not found"}), 404
    with ZipFile(path) as zf:
        zf.extract("db.sqlite", os.path.dirname(DB_PATH))
    meta = {}
    if os.path.exists(META_FILE):
        with open(META_FILE, "r", encoding="utf-8") as f:
            meta = json.load(f)
    ts_iso = datetime.utcnow().isoformat() + "Z"
    entry = meta.get(safe, {})
    if isinstance(entry, str):
        entry = {"description": entry}
    if not isinstance(entry, dict):
        entry = {}
    entry["last_updated"] = ts_iso
    meta[safe] = entry
    meta[ACTIVE_KEY] = {"name": safe, "timestamp": ts_iso}
    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    socketio.emit("data_updated")
    return jsonify({"status": "ok"})


@app.post("/api/simple-backup")
def create_simple_backup_route():
    path = simple_backup()
    if not path:
        return jsonify({"error": "no data"}), 404
    return jsonify({"name": os.path.basename(path)})


@app.get("/api/simple-backups")
def list_simple_backups_route():
    files = sorted(
        os.path.basename(f) for f in glob.glob(os.path.join(BACKUP_DIR, "backup_*.db"))
    )
    return jsonify(files)


@app.post("/api/simple-restore")
def simple_restore_route():
    data = request.get_json(force=True, silent=True) or {}
    name = data.get("name")
    if not name:
        return jsonify({"error": "missing name"}), 400
    safe = _validate_simple_name(name)
    if not safe:
        return jsonify({"error": "invalid name"}), 400
    src = os.path.join(BACKUP_DIR, safe)
    if not os.path.exists(src):
        return jsonify({"error": "not found"}), 404
    shutil.copy2(src, DB_PATH)
    return jsonify({"status": "ok"})


@app.get("/api/db-stats")
def db_stats():
    conn = get_db()
    tables = [
        "Cliente",
        "Proveedor",
        "UnidadMedida",
        "Insumo",
        "Producto",
        "Subproducto",
        "ProductoInsumo",
    ]
    stats = {
        tbl: conn.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0] for tbl in tables
    }
    conn.close()
    stats["backups"] = len(glob.glob(os.path.join(BACKUP_DIR, "*.zip")))
    return jsonify(stats)


@app.get("/api/<module>/export")
def export_module(module):
    fmt = request.args.get("format", "excel")

    if module == "products":
        conn = get_db()
        rows = conn.execute("SELECT * FROM products").fetchall()
        conn.close()
        data = [dict(r) for r in rows]
    elif module == "history":
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
        data = [dict(r) for r in rows]
    else:
        return jsonify({"error": "not found"}), 404

    if fmt == "pdf":
        output = BytesIO()
        c = canvas.Canvas(output, pagesize=letter)
        text = c.beginText(40, 750)
        for row in data:
            text.textLine(json.dumps(row, ensure_ascii=False))
        c.drawText(text)
        c.showPage()
        c.save()
        output.seek(0)
        return send_file(
            output,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"{module}.pdf",
        )

    output = BytesIO()
    wb = xlsxwriter.Workbook(output, {"in_memory": True})
    ws = wb.add_worksheet()
    if data:
        headers = list(data[0].keys())
        for col, header in enumerate(headers):
            ws.write(0, col, header)
        for r, item in enumerate(data, start=1):
            for c, header in enumerate(headers):
                ws.write(r, c, item.get(header))
    wb.close()
    output.seek(0)
    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=f"{module}.xlsx",
    )


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)
