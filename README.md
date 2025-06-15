# Proyecto Barack

Versión actual: **363**

Esta es una pequeña SPA (Single Page Application) escrita en HTML, CSS y JavaScript.
Incluye un módulo llamado *Sinóptico* para gestionar jerarquías de productos.

## Control de versiones

Cada nueva versión debe incluir un número visible junto a la fecha y hora en la parte inferior derecha de la interfaz para confirmar que el cambio ha sido aplicado.
Todos los cambios en este repositorio incrementarán dicho número.

La aplicación comprueba cada minuto si el archivo `js/version.js` ha
cambiado. Si detecta una nueva versión se recarga automáticamente,
siempre y cuando no se esté ejecutando desde `file://`.

## Uso

1. Ejecuta un servidor local desde la carpeta del proyecto, por ejemplo
   con `python -m http.server`, y abre `http://localhost:8000/index.html` en
   tu navegador. Verás la pantalla de inicio de sesión donde puedes ingresar
   con el usuario **facundo** (contraseña `1234`) o pulsar el botón "Ingresar
   como invitado". Este usuario inicial se puede modificar o eliminar
   desde la sección "Usuarios".
2. Navega a "Sinóptico" para visualizar la tabla con filtros.
   Los productos añadidos quedan sangrados a la derecha de su cliente y
   muestran una flecha que indica la relación jerárquica.
3. Puedes crear clientes desde cualquier vista con el botón "Nuevo cliente".
4. Desde "Editar Sinóptico" puedes modificar los datos almacenados en el
   navegador.

Hay tres puntos de entrada al Sinóptico: la página standalone `sinoptico.html`, la vista SPA accesible desde `index.html` y el `sinoptico-editor.html` para modificaciones.
Los datos se guardan localmente mediante **Dexie/IndexedDB**.

### Exportar e importar datos

Todas las vistas utilizan la misma base de datos `ProyectoBarackDB` a través del
módulo `js/dataService.js`. Para realizar copias de seguridad manuales puedes
ejecutar en la consola del navegador (o desde Node) lo siguiente:

```js
const json = await dataService.exportJSON();
// Guarda el contenido de `json` donde prefieras
await dataService.importJSON(json); // Restaura la copia
```


Si ya conoces estas páginas, puedes trabajar solo con `sinoptico-editor.html` y consultar los datos desde `sinoptico.html`. La SPA (`index.html`) queda como opción adicional.

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
2. Comprueba que el navegador no tenga deshabilitado **IndexedDB** o el
   almacenamiento local.
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

Tras corregir cualquier problema relacionado con el almacenamiento, vuelve a
intentar la edición.
