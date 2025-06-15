# Proyecto Barack

Versión actual: **351**

Esta es una pequeña SPA (Single Page Application) escrita en HTML, CSS y JavaScript.
Incluye un módulo llamado *Sinóptico* para gestionar jerarquías de productos.

## Control de versiones

Cada nueva versión debe incluir un número visible junto a la fecha y hora en la parte inferior derecha de la interfaz para confirmar que el cambio ha sido aplicado.
Todos los cambios en este repositorio incrementarán dicho número.

## Uso

1. Abre `index.html` en tu navegador.
2. Navega a "Sinóptico" para visualizar la tabla con filtros.
   Los productos añadidos quedan sangrados a la derecha de su cliente y
   muestran una flecha que indica la relación jerárquica.
3. Puedes crear clientes desde cualquier vista con el botón "Nuevo cliente".
4. Desde "Editar Sinóptico" puedes modificar los datos almacenados en el
   navegador.

Hay tres puntos de entrada al Sinóptico: la página standalone `sinoptico.html`, la vista SPA accesible desde `index.html` y el `sinoptico-editor.html` para modificaciones.
Los datos se guardan localmente mediante **Dexie/IndexedDB**.


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

Tras corregir cualquier problema relacionado con el almacenamiento, vuelve a
intentar la edición.
