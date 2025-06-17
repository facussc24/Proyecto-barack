# Proyecto Barack

Versión actual: **361**

Esta es una pequeña SPA (Single Page Application) escrita en HTML, CSS y JavaScript.
Incluye un módulo llamado *Sinóptico* para gestionar jerarquías de productos.
Todo se ejecuta en el navegador y no requiere servidor.

## Control de versiones

Cada nueva versión debe incluir un número visible junto a la fecha y hora en la parte inferior derecha de la interfaz para confirmar que el cambio ha sido aplicado.
Todos los cambios en este repositorio incrementarán dicho número.

## Uso

1. Abre `login.html` en tu navegador.
2. Inicia sesión como **Admin** o pulsa *Ingresar como invitado*.
   El rol de invitado oculta las opciones de edición y solo permite consultar el
   Sinóptico.
3. Tras iniciar sesión se carga `index.html`, desde donde puedes navegar por las
   distintas páginas.
   Los administradores tienen acceso completo a "Base de Datos" y "Editar
   Sinóptico".
4. Los datos se guardan localmente en el navegador.

Hay tres puntos de entrada al Sinóptico: la página standalone `sinoptico.html`, la vista SPA accesible desde `index.html` y el `sinoptico-editor.html` para modificaciones.
Los datos se guardan localmente mediante **Dexie/IndexedDB**.

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

1. Asegúrate de usar un navegador moderno que permita cargar módulos y acceder
   a **IndexedDB**.
2. Revisa la consola de desarrollo en busca de errores de permisos o bloqueos.

Tras corregir cualquier problema relacionado con el almacenamiento, vuelve a
intentar la edición.
