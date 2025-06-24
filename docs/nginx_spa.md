# Nginx y SPA

Este documento analiza el problema al acceder a la SPA desde `/` o `/index.html` y la forma correcta de configurarlo.

## Diagnóstico

- La configuración actual contiene `try_files $uri $uri/ =404;`.
- Cuando se accede a `/` Nginx intenta servir primero el directorio `/` y luego `/index.html/` (que no existe) y termina devolviendo *404*.
- Como la aplicación usa rutas con hash (`#/admin`), la parte después del `#` nunca se envía al servidor, por lo que Nginx no sabe que debe cargar `index.html`.

## Causa raíz

`try_files` con `=404` impide que Nginx busque `index.html` si el recurso solicitado no existe de forma literal. Por eso `/` y cualquier ruta interna de la SPA provocan un error.

## Solución

Hacer que todas las rutas caigan en `index.html` cuando no exista un archivo real. Opcionalmente se puede redirigir `/` a `#/admin` si se desea que la SPA abra esa vista por defecto.

### Configuración propuesta (`nginx.conf`)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:5000/api/;
    }

    # Sirve index.html para cualquier ruta que no exista
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Descomenta lo siguiente si quieres ir directo a #/admin
    #location = / {
    #    return 302 /index.html#/admin;
    #}
}
```
