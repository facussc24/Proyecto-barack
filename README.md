# Proyecto Barack

Versión actual: **367**

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

### Crear un nuevo producto con `docs/arbol.html`

- Selecciona el cliente, la descripción y el código del producto.
- Verás una vista previa del nodo seguido de sus subcomponentes e insumos.
- Con los botones 🗑 puedes eliminar entradas que no quieras conservar.
- Finalmente confirma para guardar todo el árbol.

## Listado Maestro

El Listado Maestro ofrece una vista consolidada de los documentos de cada
producto. Puedes acceder a esta sección desde la SPA (`index.html`) mediante la
opción **Listado Maestro** del menú principal.

1. Haz doble clic en una celda para editarla en línea.
2. Pulsa **Historial** para ver quién modificó cada campo y cuándo lo hizo.
3. Con **Exportar Excel** obtendrás un archivo `ListadoMaestro.xlsx` con los
   datos actuales y el historial.

El sistema de semáforo marca con 🟢 los productos notificados y con 🔴 aquellos
pendientes de revisión. Cuando se actualiza un documento se limpian las
revisiones dependientes siguiendo estas reglas:

- `flujograma` afecta a `amfe` y `hojaOp`.
- `amfe` afecta a `hojaOp`.
- `hojaOp` limpia `mylar`, `planos`, `ulm`, `fichaEmb` y `tizada`.
- `mylar` depende de `planos`.

## Sincronización de datos

Este proyecto incluye un pequeño servidor Flask (`server.py`) para almacenar la base de datos en `data/latest.json`.
A partir de esta versión el mismo script también sirve la interfaz web desde la carpeta `docs`, de modo que todas las páginas quedan disponibles en `http://<IP>:5000/` (por ejemplo, `http://192.168.1.154:5000/`).
El servidor debe ejecutarse en un único equipo o servidor accesible por la red para que todos los usuarios compartan la misma información.

El archivo activo se guarda en `data/latest.json` y cada día se crea una copia automática en `data/backups/AAAA-MM-DD.json`. Los respaldos con más de seis meses se eliminan al iniciar el servidor.
Los respaldos se encuentran en la carpeta `data/backups/`. Si eliminas el repositorio también se borrará esta carpeta a menos que la conserves aparte.

Si quieres guardar la base de datos en otra ubicación puedes definir la variable de entorno `DATA_DIR` antes de iniciar el servidor y apuntar a la carpeta deseada.

Para iniciar el servicio ejecuta:

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

GitHub Pages solo aloja archivos estáticos y no puede ejecutar este servidor.
Cuando uses varias PC debes indicar la URL del servidor. Puedes hacerlo con:

1. Guardar la dirección en `localStorage` usando `localStorage.setItem('apiUrl', 'http://<IP>:5000/api/data')` desde la consola del navegador.
2. O bien establecer la variable de entorno `API_URL` antes de iniciar la aplicación.

Si no se define ningún valor se usará `http://localhost:5000/api/data` por defecto.


## Desarrollo

El código fuente se encuentra en la carpeta `js/` y las hojas de estilo en
`assets/styles.css`. Para depurar o extender la funcionalidad del Sinóptico,
revisa especialmente `js/ui/renderer.js`.

## Solución de problemas

Si los cambios realizados desde la vista **Base de Datos** no se guardan,
verifica lo siguiente:

1. Asegúrate de usar un navegador moderno que permita cargar módulos y acceder
   a **IndexedDB**.
2. Revisa la consola de desarrollo en busca de errores de permisos o bloqueos.

Tras corregir cualquier problema relacionado con el almacenamiento, vuelve a
intentar la edición.
