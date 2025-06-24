import os
import json
import glob
import shutil
from datetime import datetime, timedelta
from threading import Lock
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from io import BytesIO
import xlsxwriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from zipfile import ZipFile, ZIP_DEFLATED

DATA_DIR = os.getenv("DATA_DIR", "data")
DATA_FILE = os.path.join(DATA_DIR, "latest.json")
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")
BACKUP_DIR = os.getenv("BACKUP_DIR", "/app/backups")
DB_PATH = os.getenv("DB_PATH", os.path.join("data", "db.sqlite"))
METADATA_FILE = os.path.join(BACKUP_DIR, "metadata.json")
write_lock = Lock()
data_cache = None

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(BACKUP_DIR, exist_ok=True)
if os.path.exists(DATA_FILE):
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        memory = json.load(f)
    data_cache = json.dumps(memory, ensure_ascii=False)
else:
    memory = {}

if os.path.exists(HISTORY_FILE):
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        history = json.load(f)
else:
    history = []

app = Flask(__name__, static_folder="docs", static_url_path="")
IMAGES_DIR = os.path.join(app.static_folder, "imagenes_sinoptico")
ASSET_DIRS = ["imagenes_sinoptico", "images"]
from flask_socketio import SocketIO

# Permit requests from the development front-end by default. Comma separated
# values in ``ALLOWED_ORIGINS`` override this list.
origins_env = os.getenv(
    "ALLOWED_ORIGINS",
    "http://192.168.1.233:8080,http://localhost:8080",
)
allowed = [o.strip() for o in origins_env.split(",") if o.strip()]
socketio = SocketIO(app, async_mode="eventlet", cors_allowed_origins=allowed)
clients = {}
CORS(app, resources={r"/api/*": {"origins": allowed}})


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


def backup_latest():
    if os.path.exists(DATA_FILE):
        today = datetime.utcnow().strftime("%Y-%m-%d")
        dest = os.path.join(BACKUP_DIR, f"{today}.zip")
        with ZipFile(dest, "w", compression=ZIP_DEFLATED) as zf:
            zf.write(DATA_FILE, arcname="latest.json")


def manual_backup(name=None, description=None):
    if not os.path.exists(DATA_FILE):
        return None

    base = name or "backup"
    base = "".join(c for c in base if c.isalnum() or c in "-_").strip("-_") or "backup"
    ts = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"{base}_{ts}.zip"
    safe = _validate_backup_name(filename)
    if not safe:
        safe = _validate_backup_name(f"backup_{ts}.zip")
    dest = os.path.join(BACKUP_DIR, safe)
    with ZipFile(dest, "w", compression=ZIP_DEFLATED) as zf:
        zf.write(DATA_FILE, arcname="latest.json")
        if os.path.exists(HISTORY_FILE):
            zf.write(HISTORY_FILE, arcname="history.json")
        if os.path.exists(DB_PATH):
            zf.write(DB_PATH, arcname="db.sqlite")
        for directory in ASSET_DIRS:
            folder = os.path.join(app.static_folder, directory)
            if os.path.isdir(folder):
                for root_dir, _, files in os.walk(folder):
                    for f in files:
                        fp = os.path.join(root_dir, f)
                        arc = os.path.relpath(fp, start=app.static_folder)
                        zf.write(fp, arcname=arc)

    meta = {}
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            meta = json.load(f)
    meta[os.path.basename(dest)] = description or ""
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    return dest


def _validate_backup_name(name: str) -> str | None:
    """Return the sanitized backup name if valid, otherwise None."""
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


def cleanup_backups():
    cutoff = datetime.utcnow() - timedelta(days=180)
    for path in glob.glob(os.path.join(BACKUP_DIR, "*.zip")):
        try:
            date = datetime.strptime(os.path.basename(path)[:-4], "%Y-%m-%d")
        except ValueError:
            continue
        if date < cutoff:
            os.remove(path)


@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def static_proxy(path):
    file_path = os.path.join(app.static_folder, path)
    if not os.path.splitext(path)[1] and not os.path.exists(file_path):
        alt = file_path + ".html"
        if os.path.exists(alt):
            path += ".html"
    return send_from_directory(app.static_folder, path)


@app.route("/api/data", methods=["GET", "POST"])
def data():
    global memory, history, data_cache
    if request.method == "GET":
        if data_cache is None:
            data_cache = json.dumps(memory, ensure_ascii=False)
        resp = app.response_class(data_cache, mimetype="application/json")
        resp.headers["Cache-Control"] = "no-store"
        return resp

    data = request.get_json(force=True, silent=True)
    if data is None:
        return jsonify({"error": "Invalid JSON"}), 400

    with write_lock:
        memory = data
        data_cache = None  # clear cache since data has changed
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(memory, f, ensure_ascii=False, indent=2)

        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "ip": request.remote_addr,
            "host": data.get("host") or request.headers.get("X-Host") or request.host,
            "changes": data,
        }
        history.append(entry)
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, ensure_ascii=False, indent=2)

    socketio.emit("data_updated")
    return jsonify({"status": "ok"})


@app.route("/api/history", methods=["GET"])
def get_history():
    page = request.args.get("page")
    user = request.args.get("user")
    from_ts = request.args.get("from")
    to_ts = request.args.get("to")

    result = history
    if page:
        result = [h for h in result if page in str(h.get("host", ""))]
    if user:
        result = [h for h in result if user in str(h.get("user", ""))]
    if from_ts:
        result = [h for h in result if h.get("timestamp", "") >= from_ts]
    if to_ts:
        result = [h for h in result if h.get("timestamp", "") <= to_ts]

    return jsonify(result)


@app.route("/api/server-info", methods=["GET"])
def server_info():
    info = {
        "server_time": datetime.utcnow().isoformat() + "Z",
        "connected_clients": len(clients),
        "history_entries": len(history),
        "data_keys": list(memory.keys()),
        "backup_count": len(glob.glob(os.path.join(BACKUP_DIR, "*.zip"))),
    }
    return jsonify(info)


@app.get("/api/products")
def get_products():
    """Return the list of products stored in memory if present."""
    products = memory.get("productos_db") or memory.get("products") or []
    return jsonify(products)


@app.get("/api/<module>/export")
def export_module(module):
    fmt = request.args.get("format", "excel")
    if module == "data":
        rows = [memory]
    elif module == "history":
        rows = history
    elif module == "sinoptico":
        rows = memory.get("sinoptico", [])
    elif module == "maestro":
        rows = memory.get("maestro", [])
    elif module == "amfe":
        rows = memory.get("amfe", [])
    else:
        return jsonify({"error": "module not found", "module": module}), 404

    if fmt == "pdf":
        output = BytesIO()
        c = canvas.Canvas(output, pagesize=letter)
        text = c.beginText(40, 750)
        for row in rows:
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
    if rows and isinstance(rows[0], dict):
        headers = list(rows[0].keys())
        for col, header in enumerate(headers):
            ws.write(0, col, header)
        for r, item in enumerate(rows, start=1):
            for c, header in enumerate(headers):
                ws.write(r, c, item.get(header))
    else:
        for idx, item in enumerate(rows):
            ws.write(idx, 0, json.dumps(item, ensure_ascii=False))
    wb.close()
    output.seek(0)
    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=f"{module}.xlsx",
    )


@socketio.on("connect")
def handle_connect():
    clients[request.sid] = request.remote_addr


@socketio.on("disconnect")
def handle_disconnect():
    clients.pop(request.sid, None)


@app.get("/api/backups")
def list_backups():
    files = sorted(
        os.path.basename(f) for f in glob.glob(os.path.join(BACKUP_DIR, "*.zip"))
    )
    meta = {}
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            meta = json.load(f)
    result = [{"name": f, "description": meta.get(f, "")} for f in files]
    return jsonify(result)


@app.post("/api/backups")
def create_backup_route():
    data = request.get_json(force=True, silent=True) or {}
    desc = data.get("description")
    name = data.get("name")
    path = manual_backup(name=name, description=desc)
    if not path:
        return jsonify({"error": "no data to backup"}), 400
    final = os.path.basename(path)
    return jsonify({"name": final, "description": desc or ""})


@app.delete("/api/backups/<name>")
def delete_backup(name):
    safe = _validate_backup_name(name)
    if not safe:
        return jsonify({"error": "invalid name"}), 400
    path = os.path.join(BACKUP_DIR, safe)
    if not os.path.exists(path):
        return jsonify({"error": "backup not found", "name": safe}), 404
    os.remove(path)
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            meta = json.load(f)
        if meta.pop(safe, None) is not None:
            with open(METADATA_FILE, "w", encoding="utf-8") as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)
    return jsonify({"status": "deleted"})


@app.post("/api/restore")
def restore_backup():
    global memory, history, data_cache
    data = request.get_json(force=True, silent=True) or {}
    name = data.get("name")
    if not name:
        return jsonify({"error": "missing name"}), 400
    safe = _validate_backup_name(name)
    if not safe:
        return jsonify({"error": "invalid name"}), 400
    path = os.path.join(BACKUP_DIR, safe)
    if not os.path.exists(path):
        return jsonify({"error": "backup not found", "name": safe}), 404
    with ZipFile(path) as zf:
        with zf.open("latest.json") as f:
            new_data = json.load(f)
        if "history.json" in zf.namelist():
            zf.extract("history.json", DATA_DIR)
            with open(HISTORY_FILE, "r", encoding="utf-8") as h:
                history[:] = json.load(h)
        if "db.sqlite" in zf.namelist():
            zf.extract("db.sqlite", os.path.dirname(DB_PATH))
        for item in zf.namelist():
            if any(item.startswith(f"{d}/") for d in ASSET_DIRS):
                zf.extract(item, app.static_folder)

    with write_lock:
        memory = new_data
        data_cache = None  # clear cache so GET /api/data returns restored content
        with open(DATA_FILE, "w", encoding="utf-8") as out:
            json.dump(memory, out, ensure_ascii=False, indent=2)
        with open(DATA_FILE, "r", encoding="utf-8") as out:
            memory = json.load(out)
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "ip": request.remote_addr,
            "host": request.headers.get("X-Host") or request.host,
            "restore": safe,
        }
        history.append(entry)
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, ensure_ascii=False, indent=2)

    socketio.emit("data_updated")
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    cleanup_backups()
    if os.getenv("DISABLE_AUTOBACKUP") != "1":
        scheduler = BackgroundScheduler(daemon=True)
        scheduler.add_job(backup_latest, "interval", days=1)
        scheduler.start()

    socketio.run(app, host="0.0.0.0", port=5000)
