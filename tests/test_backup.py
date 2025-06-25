import os
import json
import importlib
import shutil
from pathlib import Path


def test_manual_backup_metadata(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKUP_DIR", str(tmp_path / "backups"))
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("DB_PATH", str(tmp_path / "data/db.sqlite"))

    data_dir = Path(os.environ["DATA_DIR"])
    data_dir.mkdir(parents=True)
    with open(data_dir / "latest.json", "w") as f:
        json.dump({"a": 1}, f)
    with open(Path(os.environ["DB_PATH"]), "w") as f:
        f.write("db")

    server = importlib.import_module("server")
    importlib.reload(server)

    path = server.manual_backup("desc")
    assert path is not None
    meta_file = Path(os.environ["BACKUP_DIR"]) / "metadata.json"
    assert meta_file.exists()
    meta = json.load(meta_file.open())
    assert os.path.basename(path) in meta
    entry = meta[os.path.basename(path)]
    assert entry["description"] == "desc"
    assert "last_updated" in entry
    with server.ZipFile(path) as zf:
        assert "db.sqlite" in zf.namelist()
        assert "latest.json" in zf.namelist()


def _load_server(monkeypatch, tmp_path):
    monkeypatch.setenv("BACKUP_DIR", str(tmp_path / "backups"))
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    return importlib.reload(importlib.import_module("server"))


def test_restore_and_delete_invalid_names(tmp_path, monkeypatch):
    server = _load_server(monkeypatch, tmp_path)
    client = server.app.test_client()

    resp = client.post("/api/restore", json={"name": "../bad.zip"})
    assert resp.status_code == 400

    resp = client.post("/api/restore", json={"name": "bad.tar"})
    assert resp.status_code == 400

    resp = client.delete("/api/backups/bad.tar")
    assert resp.status_code == 400


def test_backup_and_restore_assets(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKUP_DIR", str(tmp_path / "backups"))
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("DB_PATH", str(tmp_path / "data/db.sqlite"))

    docs = tmp_path / "docs"
    img_dir = docs / "imagenes_sinoptico"
    other_dir = docs / "images"
    img_dir.mkdir(parents=True)
    other_dir.mkdir(parents=True)
    (img_dir / "foo.jpg").write_text("img")
    (other_dir / "bar.png").write_text("img")

    data_dir = Path(os.environ["DATA_DIR"])
    data_dir.mkdir(parents=True)
    with open(data_dir / "latest.json", "w") as f:
        json.dump({"a": 1}, f)
    with open(Path(os.environ["DB_PATH"]), "w") as f:
        f.write("db")

    server = importlib.import_module("server")
    importlib.reload(server)
    server.app.static_folder = str(docs)
    server.IMAGES_DIR = os.path.join(server.app.static_folder, "imagenes_sinoptico")
    server.ASSET_DIRS = ["imagenes_sinoptico", "images"]

    path = server.manual_backup()
    assert path is not None
    with server.ZipFile(path) as zf:
        names = zf.namelist()
        assert "imagenes_sinoptico/foo.jpg" in names
        assert "images/bar.png" in names

    shutil.rmtree(docs)
    docs.mkdir()

    client = server.app.test_client()
    resp = client.post("/api/restore", json={"name": os.path.basename(path)})
    assert resp.status_code == 200
    assert (img_dir / "foo.jpg").exists()
    assert (other_dir / "bar.png").exists()


def test_create_backup_requires_description(tmp_path, monkeypatch):
    server = _load_server(monkeypatch, tmp_path)
    Path(os.environ["DB_PATH"]).touch()
    client = server.app.test_client()
    resp = client.post("/api/backups", json={"description": ""})
    assert resp.status_code == 400
    resp = client.post("/api/backups", json={})
    assert resp.status_code == 400


def test_backend_create_backup_requires_description(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKUP_DIR", str(tmp_path / "backups"))
    Path(os.environ["DB_PATH"]).touch()
    backend = importlib.reload(importlib.import_module("backend.main"))
    client = backend.app.test_client()
    resp = client.post("/api/backups", json={"description": ""})
    assert resp.status_code == 400
    resp = client.post("/api/backups", json={})
    assert resp.status_code == 400


def test_active_flag_on_backup_and_restore(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKUP_DIR", str(tmp_path / "backups"))
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("DB_PATH", str(tmp_path / "data/db.sqlite"))

    data_dir = Path(os.environ["DATA_DIR"])
    data_dir.mkdir(parents=True)
    with open(data_dir / "latest.json", "w") as f:
        json.dump({"a": 1}, f)
    with open(Path(os.environ["DB_PATH"]), "w") as f:
        f.write("db")

    server = importlib.reload(importlib.import_module("server"))
    b1 = os.path.basename(server.manual_backup("one"))
    import time
    time.sleep(1)
    b2 = os.path.basename(server.manual_backup("two", activate=True))
    client = server.app.test_client()
    resp = client.get("/api/backups")
    assert resp.status_code == 200
    data = {item["name"]: item for item in resp.get_json()}
    assert data[b1]["active"] is False
    assert data[b2]["active"] is True

    resp = client.post("/api/restore", json={"name": b1})
    assert resp.status_code == 200
    resp = client.get("/api/backups")
    data = {item["name"]: item for item in resp.get_json()}
    assert data[b1]["active"] is True
    assert sum(1 for item in data.values() if item["active"]) == 1


def test_last_updated_updates_on_change(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKUP_DIR", str(tmp_path / "backups"))
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("DB_PATH", str(tmp_path / "data/db.sqlite"))

    data_dir = Path(os.environ["DATA_DIR"])
    data_dir.mkdir(parents=True)
    with open(data_dir / "latest.json", "w") as f:
        json.dump({}, f)

    with open(Path(os.environ["DB_PATH"]), "w") as f:
        f.write("db")

    server = importlib.reload(importlib.import_module("server"))
    name = os.path.basename(server.manual_backup("init", activate=True))
    meta_file = Path(os.environ["BACKUP_DIR"]) / "metadata.json"
    meta = json.load(meta_file.open())
    initial = meta[name]["last_updated"]

    client = server.app.test_client()
    resp = client.post("/api/data", json={"changed": True})
    assert resp.status_code == 200

    meta = json.load(meta_file.open())
    assert meta[name]["last_updated"] != initial


def test_create_backup_route_without_description_fails(tmp_path, monkeypatch):
    server = _load_server(monkeypatch, tmp_path)
    Path(os.environ["DB_PATH"]).touch()
    client = server.app.test_client()
    for payload in [{}, {"description": ""}, {"description": "   "}]:
        resp = client.post("/api/backups", json=payload)
        assert resp.status_code == 400


def test_restore_updates_last_updated(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKUP_DIR", str(tmp_path / "backups"))
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("DB_PATH", str(tmp_path / "data/db.sqlite"))

    data_dir = Path(os.environ["DATA_DIR"])
    data_dir.mkdir(parents=True)
    with open(data_dir / "latest.json", "w") as f:
        json.dump({"a": 1}, f)
    with open(Path(os.environ["DB_PATH"]), "w") as f:
        f.write("db")

    server = importlib.reload(importlib.import_module("server"))
    name = os.path.basename(server.manual_backup("one"))
    meta_file = Path(os.environ["BACKUP_DIR"]) / "metadata.json"
    meta = json.load(meta_file.open())
    before = meta[name]["last_updated"]

    import time
    time.sleep(1)

    client = server.app.test_client()
    resp = client.post("/api/restore", json={"name": name})
    assert resp.status_code == 200

    meta = json.load(meta_file.open())
    assert meta[name]["last_updated"] != before


def test_server_info_reports_active_backup(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKUP_DIR", str(tmp_path / "backups"))
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("DB_PATH", str(tmp_path / "data/db.sqlite"))

    data_dir = Path(os.environ["DATA_DIR"])
    data_dir.mkdir(parents=True)
    with open(data_dir / "latest.json", "w") as f:
        json.dump({}, f)
    with open(Path(os.environ["DB_PATH"]), "w") as f:
        f.write("db")

    server = importlib.reload(importlib.import_module("server"))
    name = os.path.basename(server.manual_backup("info", activate=True))

    client = server.app.test_client()
    resp = client.get("/api/server-info")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["active_backup"] == name

