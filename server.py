import os
import json
import glob
import shutil
from datetime import datetime, timedelta
from threading import Lock
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler

DATA_DIR = os.getenv("DATA_DIR", "data")
DATA_FILE = os.path.join(DATA_DIR, "latest.json")
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")
BACKUP_DIR = os.path.join(DATA_DIR, "backups")
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

socketio = SocketIO(app, async_mode="eventlet")
clients = {}
CORS(app)


def backup_latest():
    if os.path.exists(DATA_FILE):
        today = datetime.utcnow().strftime("%Y-%m-%d")
        dest = os.path.join(BACKUP_DIR, f"{today}.json")
        shutil.copy2(DATA_FILE, dest)


def cleanup_backups():
    cutoff = datetime.utcnow() - timedelta(days=180)
    for path in glob.glob(os.path.join(BACKUP_DIR, "*.json")):
        try:
            date = datetime.strptime(os.path.basename(path)[:-5], "%Y-%m-%d")
        except ValueError:
            continue
        if date < cutoff:
            os.remove(path)


@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def static_proxy(path):
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
    return jsonify(history)


@app.route("/api/server-info", methods=["GET"])
def server_info():
    info = {
        "server_time": datetime.utcnow().isoformat() + "Z",
        "connected_clients": len(clients),
        "history_entries": len(history),
        "data_keys": list(memory.keys()),
    }
    return jsonify(info)


@socketio.on("connect")
def handle_connect():
    clients[request.sid] = request.remote_addr


@socketio.on("disconnect")
def handle_disconnect():
    clients.pop(request.sid, None)


if __name__ == "__main__":
    cleanup_backups()
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
