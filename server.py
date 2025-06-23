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
write_lock = Lock()

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(BACKUP_DIR, exist_ok=True)
if os.path.exists(DATA_FILE):
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        memory = json.load(f)
else:
    memory = {}

if os.path.exists(HISTORY_FILE):
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        history = json.load(f)
else:
    history = []

app = Flask(__name__, static_folder="docs", static_url_path="")
from flask_socketio import SocketIO

# Permit requests from the development front-end and the local API consumer
allowed = ["http://192.168.1.154:8080", "http://localhost:8080"]
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


def manual_backup():
    if os.path.exists(DATA_FILE):
        ts = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S")
        dest = os.path.join(BACKUP_DIR, f"{ts}.zip")
        with ZipFile(dest, "w", compression=ZIP_DEFLATED) as zf:
            zf.write(DATA_FILE, arcname="latest.json")
        return dest
    return None


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
    global memory, history
    if request.method == "GET":
        return jsonify(memory)

    data = request.get_json(force=True, silent=True)
    if data is None:
        return jsonify({"error": "Invalid JSON"}), 400

    with write_lock:
        memory = data
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


@app.get("/api/<module>/export")
def export_module(module):
    fmt = request.args.get("format", "excel")
    if module == "data":
        rows = [memory]
    elif module == "history":
        rows = history
    elif module == "sinoptico":
        rows = memory.get("sinoptico", [])
    else:
        return jsonify({"error": "not found"}), 404

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
    return jsonify(files)


@app.post("/api/backups")
def create_backup_route():
    path = manual_backup()
    return jsonify({"path": path})


@app.post("/api/restore")
def restore_backup():
    global memory, history
    data = request.get_json(force=True, silent=True) or {}
    name = data.get("name")
    if not name:
        return jsonify({"error": "missing name"}), 400
    path = os.path.join(BACKUP_DIR, name)
    if not os.path.exists(path):
        return jsonify({"error": "not found"}), 404
    with ZipFile(path) as zf:
        with zf.open("latest.json") as f:
            new_data = json.load(f)

    with write_lock:
        memory = new_data
        with open(DATA_FILE, "w", encoding="utf-8") as out:
            json.dump(memory, out, ensure_ascii=False, indent=2)
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "ip": request.remote_addr,
            "host": request.headers.get("X-Host") or request.host,
            "restore": name,
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

    # Usa socketio.run para incluir WebSocket y hot-reload
    run_args = {"host": "0.0.0.0", "port": 5000, "debug": True}
    cert = os.getenv("SSL_CERT")
    key = os.getenv("SSL_KEY")
    if cert and key:
        run_args["certfile"] = cert
        run_args["keyfile"] = key

    socketio.run(app, **run_args)
