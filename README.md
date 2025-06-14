# Proyecto Barack

Esta es una pequeña SPA (Single Page Application) escrita en HTML, CSS y JavaScript.
Incluye un módulo llamado *Sinóptico* para gestionar jerarquías de productos.

## Uso

1. Abre `index.html` en tu navegador.
2. Navega a "Sinóptico" para visualizar la tabla con filtros.
3. Puedes crear clientes desde cualquier vista con el botón "Nuevo cliente".
4. Desde "Editar Sinóptico" puedes modificar los datos almacenados en el
   navegador.

Hay tres puntos de entrada al Sinóptico: la página standalone `sinoptico.html`, la vista SPA accesible desde `index.html` y el `sinoptico-editor.html` para modificaciones.
Los datos se guardan localmente mediante **Dexie/IndexedDB**.

## Desarrollo

El código fuente se encuentra en la carpeta `js/` y las hojas de estilo en
`assets/styles.css`. Para depurar o extender la funcionalidad del Sinóptico,
revisa especialmente `js/ui/renderer.js`.
