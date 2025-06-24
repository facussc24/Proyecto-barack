from backend import main


def test_row_locking_conflict_and_release():
    client = main.app.test_client()
    db = main.get_db()
    db.execute(
        "INSERT INTO Cliente(codigo,nombre,updated_at,version) VALUES('L1','A','2024-01-01',1)"
    )
    db.commit()

    resp = client.post('/api/locks/clientes/1', json={'user': 'alice'})
    assert resp.status_code == 200

    resp = client.post('/api/locks/clientes/1', json={'user': 'bob'})
    assert resp.status_code == 409

    payload = {'updated_at': '2024-01-01', 'version': 1, 'nombre': 'B', 'user': 'bob'}
    resp = client.patch('/api/clientes/1', json=payload)
    assert resp.status_code == 409

    resp = client.delete('/api/locks/clientes/1?user=alice')
    assert resp.status_code == 200

    resp = client.patch('/api/clientes/1', json=payload)
    assert resp.status_code == 200
