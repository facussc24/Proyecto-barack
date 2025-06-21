# Proyecto Barack

Versión actual: **398**

Esta es una pequeña SPA (Single Page Application) escrita en HTML, CSS y JavaScript.
Incluye un módulo llamado *Sinóptico* para gestionar jerarquías de productos.
Todo se ejecuta en el navegador y no requiere servidor.

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
   Los administradores tienen acceso completo a "Base de Datos" y "Editar
   Sinóptico".
   También encontrarás el enlace "Listado Maestro" que abre `maestro.html`.
4. Los datos pueden guardarse localmente en el navegador o en el servidor.
5. La página `history.html` está reservada para administradores.
   Los invitados son redirigidos automáticamente al abrirla.

Hay tres puntos de entrada al Sinóptico: la página standalone `docs/sinoptico.html`, la vista SPA accesible desde `index.html` y el `docs/sinoptico-editor.html` para modificaciones.
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


Si ya conoces estas páginas, puedes trabajar solo con `docs/sinoptico-editor.html` y consultar los datos desde `docs/sinoptico.html`. La SPA (`index.html`) queda como opción adicional.

### Crear un nuevo producto con `docs/asistente.html`

- Selecciona el cliente, la descripción y el código del producto.
- Verás una vista previa del nodo seguido de sus subcomponentes e insumos.
- Con los botones 🗑 puedes eliminar entradas que no quieras conservar.
- Finalmente confirma para guardar todo el árbol.

## Sincronización de datos

Este proyecto incluye un pequeño servidor Flask (`server.py`) para almacenar la base de datos en `data/latest.json`.
A partir de esta versión el mismo script también sirve la interfaz web desde la carpeta `docs`, de modo que todas las páginas quedan disponibles en `http://<IP>:5000/` (por ejemplo, `http://192.168.1.154:5000/`).
El servidor debe ejecutarse en un único equipo o servidor accesible por la red para que todos los usuarios compartan la misma información.

El archivo activo se guarda en `data/latest.json` y cada día se crea una copia automática en `data/backups/AAAA-MM-DD.json`. Los respaldos con más de seis meses se eliminan al iniciar el servidor.
Los respaldos se encuentran en la carpeta `data/backups/`. Si eliminas el repositorio también se borrará esta carpeta a menos que la conserves aparte.

El servidor también expone `GET /api/sinoptico/export` para descargar la tabla
de Sinóptico en Excel o PDF. Usa el parámetro `format=excel` o `format=pdf`
según prefieras.

Si quieres guardar la base de datos en otra ubicación puedes definir la variable de entorno `DATA_DIR` antes de iniciar el servidor y apuntar a la carpeta deseada.

El backend basado en SQLite (`backend/main.py`) lee la ruta del archivo desde `DB_PATH`. Si no se define, usará `data/db.sqlite`.

Para iniciar solo este backend ejecuta:

```bash
python backend/main.py
```

Para levantar el servidor que también hospeda la carpeta `docs` ejecuta:

```bash
pip install -r requirements.txt
python server.py
```

En Windows puedes ejecutar los siguientes comandos:

```bash
cd "C:\\Users\\FacundoS-PC\\Documents\\Proyecto-barack-main (11)\\Proyecto-barack-main"
py -3 -m pip install -r requirements.txt
py -3 server.py
```

Para habilitar HTTPS puedes crear un certificado autofirmado con:

```bash
openssl req -x509 -newkey rsa:4096 -nodes -keyout key.pem -out cert.pem -days 365
```

Luego inicia el servidor indicando las rutas en `SSL_CERT` y `SSL_KEY`:

```bash
SSL_CERT=cert.pem SSL_KEY=key.pem python server.py
```

Si tienes Docker instalado puedes iniciar todo con Docker Compose. La primera vez construye la imagen definida en `backend/Dockerfile`:

```bash
docker-compose build
```

Luego levanta los servicios:

```bash
docker-compose up
```

Estos contenedores exponen la API en `http://localhost:5000` y Nginx para la carpeta `docs` en `http://localhost:8080`.
Los datos se guardan en `./data/db.sqlite` gracias al volumen compartido.

GitHub Pages solo aloja archivos estáticos y no puede ejecutar este servidor.
Cuando uses varias PC debes indicar la URL del servidor. Puedes hacerlo con:

1. Guardar la dirección en `localStorage` usando `localStorage.setItem('apiUrl', 'http://<IP>:5000/api/data')` desde la consola del navegador.
2. O bien establecer la variable de entorno `API_URL` antes de iniciar la aplicación.

Si no se define ningún valor se usará `http://localhost:5000/api/data` por defecto.
Para mas detalles consulta `docs/backend.md`.

## API

La API expone rutas REST en `/api/<tabla>` para todas las entidades. Por ejemplo:

- `GET /api/clientes` – lista de clientes
- `POST /api/insumos` – crea un insumo
- `PATCH /api/productos_db/<id>` – actualiza un producto
- `DELETE /api/productos_db/<id>` – elimina un producto

Puedes probar estas rutas con `curl`:

```bash
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

Si los cambios realizados desde la vista **Base de Datos** no se guardan,
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

Si la API se ejecuta en otra máquina guarda su URL con:

```js
localStorage.setItem('apiUrl', 'http://<IP>:5000/api/data');
```

La aplicación usará esa dirección al recargarse.

### Publicar en GitHub Pages

En la configuración del repositorio activa **GitHub Pages**. Puedes publicar desde la rama `gh-pages` o desde la carpeta `/docs` de `main`.
Una vez habilitado podrás acceder a `https://<usuario>.github.io/<repositorio>/` para ver el sitio desplegado.
