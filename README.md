# Proyecto Barack

Versión actual: **380**

Esta es una pequeña SPA (Single Page Application) escrita en HTML, CSS y JavaScript.
Incluye un módulo llamado *Sinóptico* para gestionar jerarquías de productos.

## Control de versiones

Cada nueva versión debe incluir un número visible junto a la fecha y hora en la parte inferior derecha de la interfaz para confirmar que el cambio ha sido aplicado.
Todos los cambios en este repositorio incrementarán dicho número.

Recuerda actualizar el valor en `js/version.js` y esta documentación cada vez
que realices un cambio.
A partir de ahora este README se mantendrá actualizado con cada versión para
reflejar el funcionamiento más reciente de la aplicación.

La aplicación comprueba cada minuto si el archivo `js/version.js` ha
cambiado. Si detecta una nueva versión se recarga automáticamente,
siempre y cuando no se esté ejecutando desde `file://`.

## Uso

1. Inicia la API ejecutando `npm start` (por defecto escuchará en
   `http://localhost:3000/api`).
2. En otra terminal ejecuta un servidor estático, por ejemplo con
   `python -m http.server`, y abre `http://localhost:8000/index.html` en tu
  navegador. Verás la pantalla de inicio de sesión donde puedes ingresar con el
  usuario predeterminado **admin** y contraseña **admin**, o pulsar el botón
   "Ingresar como invitado". Este usuario inicial se puede modificar o eliminar
   desde la sección "Usuarios". El ingreso no distingue mayúsculas o minúsculas en
   el nombre de usuario.
3. Comprueba en la sección **Ajustes** que el campo "URL de la API" apunte a
   `http://localhost:3000/api`. Si el servidor se ejecuta en otra dirección,
   actualiza ese valor y recarga la página.
4. Navega a "Sinóptico" para visualizar la tabla con filtros. Los productos
   añadidos quedan sangrados a la derecha de su cliente y muestran una flecha que
   indica la relación jerárquica.
5. Puedes crear clientes desde cualquier vista con el botón "Nuevo cliente".
6. Desde "Editar Sinóptico" puedes modificar los datos almacenados en el servidor.

Hay dos puntos de entrada al Sinóptico: la vista SPA accesible desde `index.html` y el `sinoptico-editor.html` para modificaciones. El archivo `sinoptico.html` solo redirige a `index.html#/sinoptico`.
Los datos se guardan ahora de forma centralizada en el servidor mediante una API REST.

### Exportar e importar datos

Todas las vistas utilizan la misma base de datos `ProyectoBarackDB` a través del
módulo `js/dataService.js`. Para realizar copias de seguridad manuales puedes
ejecutar en la consola del navegador (o desde Node) lo siguiente:

```js
const json = await dataService.exportJSON();
// Guarda el contenido de `json` donde prefieras
await dataService.importJSON(json); // Restaura la copia
```


Puedes trabajar directamente con `sinoptico-editor.html` para editar y consultar los datos desde `index.html#/sinoptico` (o la redirección `sinoptico.html`).

### Crear un nuevo producto con `arbol.html`

- Selecciona el cliente, la descripción y el código del producto.
- Verás una vista previa del nodo seguido de sus subcomponentes e insumos.
- Con los botones 🗑 puedes eliminar entradas que no quieras conservar.
- Finalmente confirma para guardar todo el árbol.

## Desarrollo

El código fuente se encuentra en la carpeta `js/` y las hojas de estilo en
`assets/styles.css`. Para depurar o extender la funcionalidad del Sinóptico,
revisa especialmente `js/ui/renderer.js`.

## Solución de problemas

Si los cambios realizados desde la vista **Base de Datos** no se guardan,
verifica lo siguiente:

1. Asegúrate de abrir el proyecto mediante un servidor local (por ejemplo
   ejecutando `npx serve`) en lugar de abrir los archivos directamente con
   `file://`.
2. Comprueba que el navegador pueda conectarse con el servidor y que la URL de la API sea correcta.
3. Revisa la consola de desarrollo del navegador en busca de errores de
   permisos o bloqueos.

   > **Nota:** abrir los HTML directamente desde _GitHub_ (por ejemplo
   utilizando la vista **Raw**) tampoco permitirá ejecutar los scripts debido a
   la política de seguridad que aplica ese servicio. No es un problema de tu
   navegador: para que funcionen las páginas debes usar un servidor local o
   publicarlas mediante **GitHub Pages**.

4. Si el sinóptico aparece vacío, es probable que la base de datos aún no
   contenga registros. Use `sinoptico-editor.html` o la sección Base de Datos
   para crearlos o importe un respaldo.

Tras corregir cualquier problema de conexión con el servidor, vuelve a
intentar la edición.

### Servidor Express

Para exponer los datos mediante una API REST se añadió un pequeño servidor basado en **Express**.

1. Ejecuta `npm install` para descargar las dependencias.
2. Inicia el servidor con `npm start` (puedes definir el puerto usando la variable `PORT`).
3. Puedes controlar los orígenes permitidos con la variable `CORS_ORIGIN` (por defecto `*`).
4. Los datos se guardan en `server/data.json`.
5. Están disponibles las rutas `/api/sinoptico` y `/api/users` para operaciones CRUD.

### Configurar API_URL

Puedes indicar la URL base de la API para que el frontend se conecte al servidor.

1. Define `window.API_URL` antes de cargar los scripts de la aplicación.
2. O bien guarda el valor en `localStorage` bajo la clave `API_URL`.


La sección **Ajustes** incluye un campo para modificar este valor. Al cambiarlo
se recargará la página y `dataService` usará la nueva dirección.

## Pruebas

Para ejecutar las pruebas debes asegurarte de que la API está en
funcionamiento y que la variable `API_URL` apunta a dicha dirección
(por ejemplo `http://localhost:3000/api`). Con el servidor en marcha,
ejecuta:

```bash
npm test
```

## Despliegue

Sigue estos pasos para poner en producción la aplicación:

1. Inicia la API con `npm start` o `node server/index.js`. Este proceso
   almacena los datos en `server/data.json` y, por defecto, escucha en
   `http://localhost:3000/api`.
2. Sirve los archivos estáticos (HTML, CSS y JS) desde cualquier servidor. Si
   utilizas **GitHub Pages** tendrás que ejecutar la API en otro lugar y
   apuntar `window.API_URL` o `localStorage['API_URL']` a dicha dirección.
3. Ten presente que las cuentas predeterminadas, como **admin**, utilizan la
   contraseña **admin**.

### Ejecutable con pkg

Este proyecto incluye un script que genera un binario auto‑contenible para Windows, macOS y Linux. Tras instalar las dependencias ejecuta:

```bash
npm run build-exe
```

Obtendrás tres archivos en la carpeta `dist/`. En macOS y Linux puedes iniciar el servidor con `./dist/proyecto-barack-macos` o `./dist/proyecto-barack-linux`. En Windows basta con abrir `proyecto-barack-win.exe` o ejecutarlo desde la terminal. El binario sirve la aplicación en `http://localhost:3000/`.

