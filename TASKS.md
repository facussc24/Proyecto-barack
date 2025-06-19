# Tareas pendientes

## Verificar pantalla en blanco en maestro.html
1. Reproducir el problema abriendo `docs/maestro.html` directamente desde `github.com` o `raw.githubusercontent.com`.
2. Revisar con las herramientas de desarrollo (F12) que se bloquean los scripts por la cabecera `Content-Security-Policy`.
3. Probar la misma página sirviéndola con `python -m http.server` o habilitando GitHub Pages.
4. Confirmar que en ese entorno la página se carga normalmente.
5. Si persisten errores, utiliza la copia local `docs/lib/xlsx.full.min.js` en lugar del script remoto.
6. Para actualizar este archivo ejecuta `npm install xlsx` y copia `node_modules/xlsx/dist/xlsx.full.min.js` a `docs/lib/`.
