# Tareas pendientes

## Verificar pantalla en blanco en maestro.html
1. Reproducir el problema abriendo `docs/maestro.html` directamente desde `github.com` o `raw.githubusercontent.com`.
2. Revisar con las herramientas de desarrollo (F12) que se bloquean los scripts por la cabecera `Content-Security-Policy`.
3. Probar la misma página sirviéndola con `python -m http.server` o habilitando GitHub Pages.
4. Confirmar que en ese entorno la página se carga normalmente.
5. Si persisten errores, revisar otros scripts (por ejemplo `xlsx`) y evaluar reemplazar la librería.
6. Implementar una versión de la librería `xlsx` sin `eval` (`xlsx.full.noeval.js`) y cargarla desde `docs/lib/` para cumplir con la CSP.

## Verificar funciones principales
- Confirmar que el selector de la barra lateral carga cada conjunto de datos correctamente.
- Abrir el menú "Crear" para asegurarse de que se despliegan todos los diálogos correspondientes.
- Tras crear un registro, comprobar que la nueva entrada aparece en la tabla.
- Activar el modo oscuro y verificar que se aplica sin problemas.
