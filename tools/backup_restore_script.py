import os
import time
import requests
import socketio

BASE_URL = os.environ.get('API_URL', 'http://localhost:5000')

sio = socketio.Client()
received_events = []

@sio.event
def connect():
    print('WebSocket connected')

@sio.on('data_updated')
def on_data_updated(data=None):
    print('data_updated event received')
    received_events.append('data_updated')

sio.connect(BASE_URL)

print('Initial clients:')
resp = requests.get(f'{BASE_URL}/api/clientes')
print(resp.json())

payload = {'codigo': 'WEB1', 'nombre': 'Web Test'}
resp = requests.post(f'{BASE_URL}/api/clientes', json=payload)
resp.raise_for_status()
client_id = resp.json()['data']['id']

print('After creation:')
print(requests.get(f'{BASE_URL}/api/clientes').json())

resp = requests.post(f'{BASE_URL}/api/backups')
resp.raise_for_status()
backup_name = resp.json()['path'].split('/')[-1]
print('Backup created:', backup_name)

requests.delete(f'{BASE_URL}/api/clientes/{client_id}')
print('After deletion:')
print(requests.get(f'{BASE_URL}/api/clientes').json())

requests.post(f'{BASE_URL}/api/restore', json={'name': backup_name})

# wait for restore event
for _ in range(10):
    if 'data_updated' in received_events:
        break
    time.sleep(0.5)

print('After restore:')
print(requests.get(f'{BASE_URL}/api/clientes').json())

requests.delete(f'{BASE_URL}/api/backups/{backup_name}')
print('Backup removed')

sio.disconnect()
