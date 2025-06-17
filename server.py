import os
import json
import glob
from datetime import datetime
from threading import Lock
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

DATA_DIR = 'data'
DATA_FILE = os.path.join(DATA_DIR, 'latest.json')
HISTORY_FILE = os.path.join(DATA_DIR, 'history.json')
write_lock = Lock()

os.makedirs(DATA_DIR, exist_ok=True)
if os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        memory = json.load(f)
else:
    memory = {}

if os.path.exists(HISTORY_FILE):
    with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
        history = json.load(f)
else:
    history = []

app = Flask(__name__, static_folder='static', static_url_path='')
from flask_socketio import SocketIO
socketio = SocketIO(app, async_mode='eventlet')
CORS(app)

@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)


@app.route('/api/data', methods=['GET', 'POST'])
def data():
    global memory, history
    if request.method == 'GET':
        return jsonify(memory)

    data = request.get_json(force=True, silent=True)
    if data is None:
        return jsonify({'error': 'Invalid JSON'}), 400

    with write_lock:
        memory = data
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(memory, f, ensure_ascii=False, indent=2)

        entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'ip': request.remote_addr,
            'host': data.get('host') or request.headers.get('X-Host') or request.host,
            'changes': data
        }
        history.append(entry)
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)

    socketio.emit('data_updated')
    return jsonify({'status': 'ok'})


@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify(history)


if __name__ == '__main__':
    # Usa socketio.run para incluir WebSocket y hot-reload
    socketio.run(app,
                 host='0.0.0.0',
                 port=5000,
                 debug=True)
