# Proyecto Barack

Versión actual: **407**

Esta es una pequeña SPA (Single Page Application) escrita en HTML, CSS y JavaScript.
Incluye un módulo llamado *Sinóptico* para gestionar jerarquías de productos.
La SPA utiliza un pequeño backend que se ejecuta localmente para almacenar la información.

## Inicio

Para iniciar el proyecto clona el repositorio, instala las dependencias y ejecuta:

```bash
npm install
npm start
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
módulo `js/dataService.js`. Desde la página de inicio puedes exportar e importar
la información mediante dos botones. El registro de cambios se almacena en
`data/history.json`.

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

El backend incluido (`backend/main.py`) sirve la API y la interfaz desde `http://localhost:5000/`.
Ejecuta `python backend/main.py` si deseas utilizar la aplicación desde un navegador sin Electron.
Todos los usuarios deben apuntar al mismo servidor para compartir la información.

Para revisar visualmente el contenido actual de la base de datos se incluye la página `docs/dbviewer.html`. Ábrela con el servidor en marcha para ver los datos en formato JSON.

Si quieres guardar la base de datos en otra ubicación puedes definir la variable de entorno `DATA_DIR` antes de iniciar el servidor y apuntar a la carpeta deseada.

El backend basado en SQLite (`backend/main.py`) lee la ruta del archivo desde `DB_PATH`. Si no se define, usará `data/db.sqlite`.

El backend permite solicitudes desde la misma URL donde se abrió la interfaz. Si
la interfaz se aloja en otra dirección puedes establecer la variable de entorno
`ALLOWED_ORIGINS` para autorizarla. Por ejemplo:

```bash
ALLOWED_ORIGINS=http://mi-host:5000 python backend/main.py
```

## API

La API expone rutas REST en `/api/<tabla>` para todas las entidades. Por ejemplo:

- `GET /api/clientes` – lista de clientes
- `POST /api/insumos` – crea un insumo
- `PATCH /api/productos_db/<id>` – actualiza un producto
- `DELETE /api/productos_db/<id>` – elimina un producto

Puedes probar estas rutas con `curl`:

curl http://localhost:5000/api/clientes
curl -X POST -H "Content-Type: application/json" \
  -d '{"codigo":"CL1","nombre":"Demo","updated_at":"2024-01-01"}' \
  http://localhost:5000/api/clientes
```


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

Si una página no carga correctamente desde el modo escritorio o al acceder
mediante un navegador, prueba estas acciones:

1. Vacía la memoria caché del navegador y recarga con **Ctrl+F5** para evitar
   archivos antiguos.
2. Comprueba en la consola que el backend responda a las solicitudes. Un error
   404 puede indicar que `server.exe` no está en ejecución.
3. Si la interfaz se aloja en un dominio distinto al servidor, asegúrate de
   habilitar **CORS** en el backend o definir la variable `ALLOWED_ORIGINS`.
4. Verifica que la carpeta `datos` sea accesible y que la base de datos no esté
   bloqueada por otra aplicación.

## Hospedaje local y GitHub Pages

### Servir la carpeta `docs` con Python

Para probar la interfaz sin depender de un servidor externo puedes iniciar un servidor HTTP simple:

```bash
cd docs
python -m http.server
```

Luego abre `http://localhost:8000/` y navega normalmente.

### Publicar en GitHub Pages
En la configuración del repositorio activa **GitHub Pages**. Puedes publicar desde la rama `gh-pages` o desde la carpeta `/docs` de `main`.
Una vez habilitado podrás acceder a `https://<usuario>.github.io/<repositorio>/` para ver el sitio desplegado.

## Detalles de la base de datos

El proyecto utiliza SQLite a través del módulo `sqlite3` en `backend/main.py`.
La ruta del archivo se define con la variable de entorno `DB_PATH` (por defecto
`data/db.sqlite`). Actualmente no se emplea un ORM ni un sistema de migraciones,
por lo que cualquier cambio en el esquema debe aplicarse manualmente.

La base funciona en modo *WAL*, por lo que la primera conexión ejecuta
`PRAGMA journal_mode=WAL` al crear el esquema. Asegúrate de que el archivo
permita dicho modo para habilitar el acceso concurrente.


### Próximos pasos sugeridos

1. Integrar `Flask-Migrate`/`Alembic` para gestionar las migraciones del esquema.
2. Evaluar migrar a PostgreSQL u otro motor en entornos productivos.

*Nota:* Para desarrollo avanzado también puedes iniciar el servidor directamente con Python.

## Actualizacion de la aplicacion

Para actualizar la version de escritorio simplemente reemplaza los archivos de la aplicacion por los nuevos. Mantén la carpeta `datos` sin borrar para conservar la base `base_de_datos.sqlite`.

Consulta [docs/electron.md](docs/electron.md) para detalles sobre la construcción
del modo escritorio con Electron y las recomendaciones sobre CommonJS.

## Compartir la carpeta `datos` en red

Si varias computadoras necesitan acceder a la misma base de datos, crea una
carpeta compartida y reemplaza el directorio `datos` local por un enlace
simbólico hacia esa ruta. En Windows puedes usar:

```cmd
mklink /D datos \\servidor\ruta\datos
```

De esta forma todas las instalaciones leerán y escribirán el mismo archivo
`base_de_datos.sqlite`, por lo que los cambios se propagan automáticamente.

## Pruebas locales

Para comprobar el funcionamiento sin contenedores ejecuta:

```bash
npm start
```

Se abrirá la versión de escritorio basada en Electron y un servidor en
`http://localhost:5000`. También puedes abrir `docs/index.html` manualmente y
verificar que el CRUD y las actualizaciones por WebSocket funcionen correctamente.


## Running Tests

Antes de ejecutar la suite de pruebas instala las dependencias necesarias.

Para las bibliotecas de Node.js ejecuta:

```bash
npm install
```

Para las dependencias de Python utiliza:

```bash
pip install flask flask-cors flask-socketio xlsxwriter reportlab eventlet pytest
```

Luego ejecuta los tests de JavaScript con:

```bash
npm test
```

Y las pruebas de Python con:

```bash
pytest
```
