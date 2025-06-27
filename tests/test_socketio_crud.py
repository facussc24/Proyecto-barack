import importlib
import os
from pathlib import Path


def test_socketio_events_on_crud(tmp_path, monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "datos"))
    monkeypatch.setenv("BACKUP_DIR", str(tmp_path / "backups"))
    monkeypatch.setenv("DB_PATH", str(tmp_path / "datos/base_de_datos.sqlite"))
    server = importlib.reload(importlib.import_module("server"))

    client = server.app.test_client()
    sio = server.socketio.test_client(server.app)

    resp = client.post("/api/clientes", json={"codigo": "C", "nombre": "N"})
    assert resp.status_code == 200
    assert any(e["name"] == "data_updated" for e in sio.get_received())
    data = resp.get_json()["data"]

    payload = {
        "nombre": "N2",
        "updated_at": data["updated_at"],
        "version": data["version"],
    }
    resp = client.patch(f"/api/clientes/{data['id']}", json=payload)
    assert resp.status_code == 200
    assert any(e["name"] == "data_updated" for e in sio.get_received())

    resp = client.delete(f"/api/clientes/{data['id']}")
    assert resp.status_code == 200
    assert any(e["name"] == "data_updated" for e in sio.get_received())
    sio.disconnect()
