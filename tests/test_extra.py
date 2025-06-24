import importlib
from pathlib import Path
from backend import main

def _load_server(monkeypatch, tmp_path):
    monkeypatch.setenv("BACKUP_DIR", str(tmp_path / "backups"))
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("DB_PATH", str(tmp_path / "data/db.sqlite"))
    return importlib.reload(importlib.import_module("server"))


def test_update_row_conflict():
    row, err = main.insert_row("Cliente", {"codigo": "X1", "nombre": "A"})
    assert err is None
    res, err, code = main.update_row(
        "Cliente", row["id"], {"updated_at": "bad", "version": row["version"], "nombre": "B"}
    )
    assert res is None
    assert err == "conflict"
    assert code == 409


def test_delete_row_not_found():
    res, err, code = main.delete_row("Cliente", 999)
    assert res is None
    assert err == "not found"
    assert code == 404


def test_export_products_excel(tmp_path, monkeypatch):
    db = main.get_db()
    db.execute("INSERT INTO products(name, price, updated_at) VALUES('A', 1.0, '2024-01-01')")
    db.commit()
    client = main.app.test_client()
    resp = client.get("/api/products/export")
    assert resp.status_code == 200
    assert resp.data.startswith(b"PK")


def test_server_validate_name(monkeypatch):
    server = _load_server(monkeypatch, Path("/tmp"))
    assert server._validate_backup_name("good.zip") == "good.zip"
    assert server._validate_backup_name("../bad.zip") is None


def test_server_export_history_pdf(tmp_path, monkeypatch):
    server = _load_server(monkeypatch, tmp_path)
    server.history.append({"a": 1})
    client = server.app.test_client()
    resp = client.get("/api/history/export?format=pdf")
    assert resp.status_code == 200
    assert resp.headers["Content-Type"].startswith("application/pdf")


def test_server_get_products_empty(tmp_path, monkeypatch):
    server = _load_server(monkeypatch, tmp_path)
    client = server.app.test_client()
    resp = client.get("/api/products")
    assert resp.status_code == 200
    assert resp.get_json() == []
