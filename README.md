# Proyecto Barack

Versión actual: **333**

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

> **Importante:** si abres estos archivos directamente con `file://` cada página se considera un origen distinto en el navegador, por lo que la base de datos no será compartida y verás nuevamente los datos de demostración al recargar. Para que todas las vistas utilicen la misma base de datos, sirve el proyecto desde un servidor local (por ejemplo con `python3 -m http.server` en la raíz del repositorio) y accede mediante `http://localhost`.

## Desarrollo

El código fuente se encuentra en la carpeta `js/` y las hojas de estilo en
`assets/styles.css`. Para depurar o extender la funcionalidad del Sinóptico,
revisa especialmente `js/ui/renderer.js`.
