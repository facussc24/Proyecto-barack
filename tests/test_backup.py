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
    assert meta[os.path.basename(path)] == "desc"
    with server.ZipFile(path) as zf:
        assert "db.sqlite" in zf.namelist()
        assert "latest.json" in zf.namelist()


def _load_server(monkeypatch, tmp_path):
    monkeypatch.setenv("BACKUP_DIR", str(tmp_path / "backups"))
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("DB_PATH", str(tmp_path / "data/db.sqlite"))
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
