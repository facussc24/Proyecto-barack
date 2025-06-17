# Proyecto Barack

Versión actual: **363**

Esta es una pequeña SPA (Single Page Application) escrita en HTML, CSS y JavaScript.
Incluye un módulo llamado *Sinóptico* para gestionar jerarquías de productos.
Todo se ejecuta en el navegador y no requiere servidor.

## Control de versiones

Cada nueva versión debe incluir un número visible junto a la fecha y hora en la parte inferior derecha de la interfaz para confirmar que el cambio ha sido aplicado.
Todos los cambios en este repositorio incrementarán dicho número.

## Uso

1. Abre `static/login.html` en tu navegador.
2. Inicia sesión como **Admin** o pulsa *Ingresar como invitado*.
   El rol de invitado oculta las opciones de edición y solo permite consultar el
   Sinóptico.
3. Tras iniciar sesión se carga `index.html`, desde donde puedes navegar por las
   distintas páginas.
   Los administradores tienen acceso completo a "Base de Datos" y "Editar
   Sinóptico".
4. Los datos pueden guardarse localmente en el navegador o en el servidor.

Hay tres puntos de entrada al Sinóptico: la página standalone `static/sinoptico.html`, la vista SPA accesible desde `index.html` y el `static/sinoptico-editor.html` para modificaciones.
Por defecto se usa **Dexie/IndexedDB** para el almacenamiento local, pero `js/dataService.js` puede sincronizar los datos con un servidor.

### Exportar e importar datos

Todas las vistas utilizan la misma base de datos `ProyectoBarackDB` a través del
módulo `js/dataService.js`. A partir de la versión 358 puedes exportar e
importar la información desde la página de inicio mediante dos botones. El
archivo descargado se llama `base_datos.json` y puedes guardarlo en la carpeta
`BASE DE DATOS` incluida en este repositorio.

Para realizar copias de seguridad manuales desde la consola del navegador sigue
si lo prefieres este procedimiento:

```js
const json = await dataService.exportJSON();
// Guarda el contenido de `json` donde prefieras
await dataService.importJSON(json); // Restaura la copia
```


Si ya conoces estas páginas, puedes trabajar solo con `static/sinoptico-editor.html` y consultar los datos desde `static/sinoptico.html`. La SPA (`index.html`) queda como opción adicional.

### Crear un nuevo producto con `static/arbol.html`

- Selecciona el cliente, la descripción y el código del producto.
- Verás una vista previa del nodo seguido de sus subcomponentes e insumos.
- Con los botones 🗑 puedes eliminar entradas que no quieras conservar.
- Finalmente confirma para guardar todo el árbol.
## Sincronización de datos

Este proyecto incluye un pequeño servidor Flask (`server.py`) para almacenar la base de datos en `BASE DE DATOS/base_datos.json`.
A partir de esta versión el mismo script también sirve la interfaz web desde la carpeta `static`, de modo que todas las páginas quedan disponibles en `http://<IP>:5000/` (por ejemplo, `http://192.168.1.154:5000/`).
El servidor debe ejecutarse en un único equipo o servidor accesible por la red para que todos los usuarios compartan la misma información.

El archivo activo se guarda en `data/latest.json` y cada día se crea una copia automática en `data/backups/AAAA-MM-DD.json`. Los respaldos con más de seis meses se eliminan al iniciar el servidor.

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
