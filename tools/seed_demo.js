const sqlite3 = require('sqlite3').verbose();
const path = process.env.DB_PATH || 'datos/base_de_datos.sqlite';
const db = new sqlite3.Database(path);

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
  db.run('DELETE FROM ProductoInsumo');
  db.run('DELETE FROM Subproducto');
  db.run('DELETE FROM Producto');
  db.run('DELETE FROM Insumo');
  db.run('DELETE FROM UnidadMedida');
  db.run('DELETE FROM Proveedor');
  db.run('DELETE FROM Cliente');

  db.run("INSERT INTO Cliente(codigo,nombre,updated_at) VALUES('CLI1','Cliente demo',datetime('now'))");
  db.run("INSERT INTO Proveedor(codigo,nombre,updated_at) VALUES('PROV1','Proveedor demo',datetime('now'))");
  db.run("INSERT INTO UnidadMedida(codigo,descripcion,updated_at) VALUES('KG','Kilogramo',datetime('now'))");
  db.run("INSERT INTO Insumo(codigo,nombre,unidad_id,peso,updated_at) VALUES('INS1','Insumo demo',1,1.5,datetime('now'))");
  db.run("INSERT INTO Producto(codigo,descripcion,cliente_id,peso,updated_at) VALUES('PROD1','Producto demo',1,1.2,datetime('now'))");
  db.run("INSERT INTO Subproducto(producto_id,codigo,peso,updated_at) VALUES(1,'SUBP1',0.5,datetime('now'))");
  db.run("INSERT INTO ProductoInsumo(producto_id,insumo_id,cantidad,updated_at) VALUES(1,1,1,datetime('now'))");
});

db.close();
