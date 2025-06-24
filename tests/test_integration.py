from backend import main
from flask import json


def test_delete_product_blocked_by_relations():
    client = main.app.test_client()
    db = main.get_db()
    db.execute("INSERT INTO Cliente(codigo,nombre,updated_at) VALUES('C1','A','2024-01-01')")
    db.execute("INSERT INTO Producto(codigo,descripcion,cliente_id,peso,updated_at) VALUES('P1','Prod',1,1,'2024-01-01')")
    db.execute("INSERT INTO Subproducto(producto_id,codigo,peso,updated_at) VALUES(1,'S1',1,'2024-01-01')")
    db.commit()
    resp = client.delete('/api/productos_db/1')
    assert resp.status_code == 400
    assert b'FOREIGN KEY constraint failed' in resp.data
    db.execute("DELETE FROM Subproducto WHERE id=1")
    db.commit()
    resp = client.delete('/api/productos_db/1')
    assert resp.status_code == 200

def test_product_activation_cycle():
    client = main.app.test_client()
    db = main.get_db()
    db.execute("INSERT INTO Cliente(codigo,nombre,updated_at) VALUES('C2','A','2024-01-01')")
    db.execute("INSERT INTO Producto(codigo,descripcion,cliente_id,peso,updated_at,version) VALUES('P2','Prod',1,1,'2024-01-01',1)")
    db.commit()
    payload = {"updated_at": "2024-01-01", "version": 1, "descripcion": "Activo"}
    resp = client.patch('/api/productos_db/1', json=payload)
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    payload2 = {"updated_at": data["updated_at"], "version": data["version"], "descripcion": "Inactivo"}
    resp = client.patch('/api/productos_db/1', json=payload2)
    assert resp.status_code == 200


def test_post_client_and_fetch_list():
    client = main.app.test_client()
    payload = {"codigo": "CNEW", "nombre": "Nuevo"}
    resp = client.post('/api/clientes', json=payload)
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["codigo"] == "CNEW"

    resp = client.get('/api/clientes')
    assert resp.status_code == 200
    items = resp.get_json()["data"]
    assert any(item["codigo"] == "CNEW" for item in items)
