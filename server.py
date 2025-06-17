import os
import json
import glob
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

DATA_DIR = 'data'
DATA_FILE = os.path.join(DATA_DIR, 'latest.json')

os.makedirs(DATA_DIR, exist_ok=True)
if os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        memory = json.load(f)
else:
    memory = {}

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)


@app.route('/api/data', methods=['GET', 'POST'])
def data():
    global memory
    if request.method == 'GET':
        return jsonify(memory)
    else:
        data = request.get_json(force=True, silent=True)
        if data is None:
            return jsonify({'error': 'Invalid JSON'}), 400
        memory = data
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(memory, f, ensure_ascii=False, indent=2)
        return jsonify({'status': 'ok'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
