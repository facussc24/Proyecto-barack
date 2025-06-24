from backend import main
import sqlite3
import pytest


def test_unique_codigo_cliente():
    db = main.get_db()
    db.execute("INSERT INTO Cliente(codigo,nombre,updated_at) VALUES('C1','A', '2024-01-01')")
    db.commit()
    with pytest.raises(sqlite3.IntegrityError):
        db.execute("INSERT INTO Cliente(codigo,nombre,updated_at) VALUES('C1','B','2024-01-01')")
        db.commit()
    db.close()


def test_codigo_check_constraint():
    db = main.get_db()
    with pytest.raises(sqlite3.IntegrityError):
        db.execute("INSERT INTO Proveedor(codigo,nombre,updated_at) VALUES('@@@','B','2024-01-01')")
        db.commit()
    db.close()


def test_insumo_peso_positive():
    db = main.get_db()
    db.execute("INSERT INTO UnidadMedida(codigo,descripcion,updated_at) VALUES('KG','kilo','2024-01-01')")
    with pytest.raises(sqlite3.IntegrityError):
        db.execute("INSERT INTO Insumo(codigo,nombre,unidad_id,peso,updated_at) VALUES('I1','Insumo',1,-2,'2024-01-01')")
        db.commit()
    db.close()
