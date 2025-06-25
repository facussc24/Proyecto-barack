# Proyecto Barack

Versión actual: **407**

Esta es una pequeña SPA (Single Page Application) escrita en HTML, CSS y JavaScript.
Incluye un módulo llamado *Sinóptico* para gestionar jerarquías de productos.
La SPA utiliza un backend Flask, expuesto mediante Docker Compose o ejecutándolo directamente con Python.

## Inicio

El flujo recomendado para poner en marcha la aplicación es ejecutar desde PowerShell o la terminal:

```bash
docker compose up -d
```


## Control de versiones

Cada nueva versión debe incluir un número visible junto a la fecha y hora en la parte inferior derecha de la interfaz para confirmar que el cambio ha sido aplicado.
Todos los cambios en este repositorio incrementarán dicho número.

Para automatizar este proceso puedes usar `tools/bump_version.py`:

```bash
python tools/bump_version.py <nuevo-numero>
```

El script actualiza `package.json`, `package-lock.json`, `README.md` y
`docs/js/version.js` con la versión indicada.

## Uso

1. Abre `docs/login.html` en tu navegador.
2. Inicia sesión como **Admin** o pulsa *Ingresar como invitado*.
   El rol de invitado oculta las opciones de edición y solo permite consultar el
   Sinóptico.
3. Tras iniciar sesión se carga `index.html`, desde donde puedes navegar por las
   distintas páginas.
   Los administradores tienen acceso completo a "Registros" y "Editar
   Sinóptico".
   También encontrarás el enlace "Listado Maestro" que abre `maestro.html`.
4. Los datos pueden guardarse localmente en el navegador o en el servidor.
5. La página `history.html` está reservada para administradores.
   Los invitados son redirigidos automáticamente al abrirla.

Hay dos puntos de entrada al Sinóptico: la página standalone `docs/sinoptico.html` y la vista SPA accesible desde `index.html`.
Por defecto se usa **Dexie/IndexedDB** para el almacenamiento local, pero `js/dataService.js` puede sincronizar los datos con un servidor.

### Exportar e importar datos

Todas las vistas utilizan la misma base de datos `ProyectoBarackDB` a través del
módulo `js/dataService.js`. A partir de la versión 358 puedes exportar e
importar la información desde la página de inicio mediante dos botones. El
archivo descargado se guarda como `data/latest.json`. El registro de cambios se
almacena en `data/history.json` y las copias de seguridad se guardan en
`data/backups/`.

Para realizar copias de seguridad manuales desde la consola del navegador sigue
si lo prefieres este procedimiento:

```js
const json = await dataService.exportJSON();
// Guarda el contenido de `json` donde prefieras
await dataService.importJSON(json); // Restaura la copia
```



### Crear un nuevo producto con `docs/asistente.html`

- Selecciona el cliente, la descripción y el código del producto.
- Verás una vista previa del nodo seguido de sus subcomponentes e insumos.
- Con los botones 🗑 puedes eliminar entradas que no quieras conservar.
- Finalmente confirma para guardar todo el árbol.

## Sincronización de datos

Este proyecto incluye un pequeño servidor Flask (`server.py`) para almacenar la base de datos en `data/latest.json`.
A partir de esta versión el mismo script también sirve la interfaz web desde la carpeta `docs`, de modo que todas las páginas quedan disponibles en `http://<IP>:5000/` (por ejemplo, `http://localhost:5000/`).
El servidor debe ejecutarse en un único equipo o servidor accesible por la red para que todos los usuarios compartan la misma información.
Todos los navegadores deben por tanto utilizar la misma URL de la API para mantenerse sincronizados.

El archivo activo se guarda en `data/latest.json`.
Puedes generar copias manualmente con `POST /api/backups` o desde la página **Backups**.
Por defecto se programa una copia diaria en `data/backups/AAAA-MM-DD.json`. Si prefieres desactivar esta tarea define `DISABLE_AUTOBACKUP=1` antes de iniciar el servidor.
Los respaldos se guardan en la carpeta `data/backups/` y requieren que el servidor esté activo para poder generarse. Cada archivo incluye la base de datos, el historial, la base SQLite y las carpetas de imágenes para que puedas restaurar el estado completo de la aplicación. Si eliminas el repositorio también se borrará esta carpeta a menos que la conserves aparte.

Para revisar visualmente el contenido actual de la base de datos se incluye la página `docs/dbviewer.html`. Ábrela con el servidor en marcha para ver los datos en formato JSON.

El servidor también expone `GET /api/sinoptico/export` para descargar la tabla
de Sinóptico en Excel o PDF. Usa el parámetro `format=excel` o `format=pdf`
según prefieras.

Si quieres guardar la base de datos en otra ubicación puedes definir la variable de entorno `DATA_DIR` antes de iniciar el servidor y apuntar a la carpeta deseada.

El backend basado en SQLite (`backend/main.py`) lee la ruta del archivo desde `DB_PATH`. Si no se define, usará `data/db.sqlite`.


El servidor y la interfaz se ejecutan en un único contenedor. Para iniciarlo
ejecuta los siguientes comandos:

```bash
docker compose down
docker compose up --build -d
```

Tras iniciar los contenedores abre
`http://desktop-14jg95b:8080/index.html#/home` (reemplaza el hostname
según corresponda) para acceder a la aplicación. Desde la vista
**Historial** podrás administrar respaldos. Todos los usuarios deben utilizar
esta misma URL para que sus datos permanezcan sincronizados. Puedes verificar
que el backend esté activo visitando `http://localhost:5000/health`.

> **Nota:** Asegúrate de que las carpetas `./data` y `./backups` existan y
> cuenten con permisos de escritura antes de ejecutar `docker compose up`.
> Docker creará automáticamente `db.sqlite` dentro de `./data` la primera vez
> que se inicie el backend. Si cualquiera de estas rutas falta o es de solo
> lectura se producirá un `sqlite3.OperationalError` y Nginx mostrará
> “Bad Gateway”.

Todas las computadoras de la red deben abrir la URL
`http://desktop-14jg95b:8080/index.html#/home` o la equivalente con su
hostname. El backend permite solicitudes desde esta URL de forma predeterminada.
Si la interfaz se aloja en otro hostname, añade esa dirección en la variable de
entorno `ALLOWED_ORIGINS` dentro de `docker-compose.yml` o al ejecutar
`server.py` para evitar errores de CORS.

### Configurar `ALLOWED_ORIGINS`

Si no defines esta variable, `server.py` utilizará una lista de orígenes
permitidos que incluye `http://desktop-14jg95b:8080` y `http://localhost:8080`.
Modifica el valor únicamente cuando la interfaz se sirva desde otra URL.

Si la interfaz se sirve desde un nombre de host o puerto distinto al del backend,
debes añadir esa URL a la variable de entorno `ALLOWED_ORIGINS` para evitar
errores de CORS. Por ejemplo:

```bash
ALLOWED_ORIGINS=http://mi-host:5000 docker compose up -d

# O con el servidor en Python
ALLOWED_ORIGINS=http://mi-host:5000 python server.py
```

## API

La API expone rutas REST en `/api/<tabla>` para todas las entidades. Por ejemplo:

- `GET /api/clientes` – lista de clientes
- `POST /api/insumos` – crea un insumo
- `PATCH /api/productos_db/<id>` – actualiza un producto
- `DELETE /api/productos_db/<id>` – elimina un producto
- `GET /api/backups` – lista de respaldos
- `POST /api/backups` – crea un respaldo manual
- `POST /api/restore` – restaura la base de datos desde un archivo

Puedes probar estas rutas con `curl`:

curl http://localhost:5000/api/clientes
curl -X POST -H "Content-Type: application/json" \
  -d '{"codigo":"CL1","nombre":"Demo","updated_at":"2024-01-01"}' \
  http://localhost:5000/api/clientes
```

También puedes ejecutar el script `tools/backup_restore_script.py` para
probar la creación de clientes, generar un respaldo y restaurarlo mientras
escuchas el evento `data_updated` por WebSocket.

Para cargar datos de ejemplo ejecuta:

```bash
npm run seed:demo
```


### Pruebas sin conexión

Los módulos de exportación comprueban el valor de
`localStorage.getItem('useMock')`. Si guardas

`localStorage.setItem('useMock', 'true')` en la consola del navegador,
puedes interceptar las descargas y usar datos locales sin depender del
servidor. Vuelve al comportamiento normal eliminando esa clave o
estableciéndola en `'false'`.

### Imágenes del Sinóptico

Las fotografías de productos e insumos se guardan en la carpeta
`docs/imagenes_sinoptico`. Cada archivo debe llamarse igual que el
código del elemento pero eliminando cualquier carácter que no sea letra
o número y en minúsculas. Por ejemplo, si el código es `A-123 45`, el
archivo correspondiente será `a12345.jpg`.

Coloca aquí las imágenes con la extensión que prefieras (`.jpg`, `.png`,
etc.) para que puedan visualizarse desde la tabla.


## Desarrollo

El código fuente se encuentra en la carpeta `js/` y las hojas de estilo en
`assets/styles.css`. Para depurar o extender la funcionalidad del Sinóptico,
revisa especialmente `js/ui/renderer.js`.
El esquema relacional completo puede consultarse en `docs/er.svg`.

## Solución de problemas

Si los cambios realizados desde la vista **Registros** no se guardan,
verifica lo siguiente:

1. Asegúrate de usar un navegador moderno que permita cargar módulos y acceder
   a **IndexedDB**.
2. Revisa la consola de desarrollo en busca de errores de permisos o bloqueos.

Si al abrir `docs/maestro.html` directamente desde GitHub ves una pantalla en
blanco, es porque la cabecera *Content‑Security‑Policy* de GitHub impide ejecutar
los scripts. Sirve la carpeta `docs` con `python -m http.server` o habilita
GitHub Pages para que el Listado Maestro funcione correctamente.

Tras corregir cualquier problema relacionado con el almacenamiento, vuelve a
intentar la edición.

## Hospedaje local y GitHub Pages

### Servir la carpeta `docs` con Python

Para probar la interfaz sin depender de un servidor externo puedes iniciar un servidor HTTP simple:

```bash
cd docs
python -m http.server
```

Luego abre `http://localhost:8000/` y navega normalmente.

### Definir `API_URL` en `localStorage`

Por defecto la interfaz calcula la ruta de la API con
`location.origin + '/api/data'` y comprueba que esté disponible mediante
`/health`. Sólo es necesario establecer `apiUrl` cuando el servidor se
encuentra en otro host:

```js
localStorage.setItem('apiUrl', 'http://localhost:5000/api/data');
```

Si la URL almacenada no responde se descarta y se vuelve a usar la ruta
automática.

### Publicar en GitHub Pages

En la configuración del repositorio activa **GitHub Pages**. Puedes publicar desde la rama `gh-pages` o desde la carpeta `/docs` de `main`.
Una vez habilitado podrás acceder a `https://<usuario>.github.io/<repositorio>/` para ver el sitio desplegado.

## Detalles de la base de datos

El proyecto utiliza SQLite a través del módulo `sqlite3` en `backend/main.py`.
La ruta del archivo se define con la variable de entorno `DB_PATH` (por defecto
`data/db.sqlite`). Actualmente no se emplea un ORM ni un sistema de migraciones,
por lo que cualquier cambio en el esquema debe aplicarse manualmente.

El servidor `server.py` cuenta con una ruta `/api/backups` que vuelca el archivo
`latest.json` a la carpeta `./backups` y programa un respaldo diario. La base de
datos SQLite no posee un mecanismo similar; sería conveniente añadir un script
que copie periódicamente `db.sqlite` a ese mismo directorio.

### Próximos pasos sugeridos

1. Integrar `Flask-Migrate`/`Alembic` para gestionar las migraciones del esquema.
2. Evaluar migrar a PostgreSQL u otro motor en entornos productivos.
3. Automatizar el respaldo del archivo SQLite en `./backups`.

*Nota:* Para desarrollo avanzado también puedes iniciar el servidor directamente con Python.
