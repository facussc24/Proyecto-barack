import importlib
from backend import main


def test_server_post_client_and_fetch_list():
    server = importlib.reload(importlib.import_module("server"))
    client = server.app.test_client()
    payload = {"codigo": "SC1", "nombre": "Nuevo"}
    resp = client.post("/api/clientes", json=payload)
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["codigo"] == "SC1"
    resp = client.get("/api/clientes")
    assert resp.status_code == 200
    items = resp.get_json()["data"]
    assert any(item["codigo"] == "SC1" for item in items)


def test_server_patch_conflict_on_version():
    db = main.get_db()
    db.execute("INSERT INTO Cliente(codigo,nombre,updated_at) VALUES('SC2','A','2024-01-01')")
    db.execute("INSERT INTO Producto(codigo,descripcion,cliente_id,peso,updated_at,version) VALUES('SP2','Prod',1,1,'2024-01-01',1)")
    db.commit()
    server = importlib.reload(importlib.import_module("server"))
    client = server.app.test_client()
    payload = {"updated_at": "wrong", "version": 2, "descripcion": "Cambio"}
    resp = client.patch("/api/productos_db/1", json=payload)
    assert resp.status_code == 409
