Import conflict markers fixed and routes adjusted to remove the nonexistent `home` view and properly include `users`:

```diff
-import { render as renderSinoptico } from './views/sinoptico.js';
-import { render as renderAmfe }      from './views/amfe.js';
-import { render as renderSettings }  from './views/settings.js';
-<<<<<<< codex/crear-vista-de-usuarios-con-crud
-import { render as renderUsers }     from './views/users.js';
-=======
->>>>>>> main
+import { render as renderSinoptico } from './views/sinoptico.js';
+import { render as renderAmfe }      from './views/amfe.js';
+import { render as renderSettings }  from './views/settings.js';
+import { render as renderUsers }     from './views/users.js';

 function renderNotFound(container) {
   container.textContent = 'Página no encontrada';
 }

 const routes = {
-  '#/home': renderHome,
   '#/sinoptico': renderSinoptico,
   '#/amfe':      renderAmfe,
   '#/settings':  renderSettings,
   '#/users':     renderUsers,
   '#/404':       renderNotFound,
 };

 export function router() {
   const hash = location.hash || '#/sinoptico';
   const view = routes[hash];
   const container = document.getElementById('app');
   if (!container) return;
   container.innerHTML = '';
-  document.body.classList.toggle('home', hash === '#/home');
+  document.body.classList.toggle('sinoptico', hash === '#/sinoptico');
   if (view) {
     view(container);
   } else {
     if (hash === '#/404') {
       renderNotFound(container);
     } else {
-      location.hash = '#/home';
+      location.hash = '#/sinoptico';
     }
   }
 }

 window.addEventListener('hashchange', router);
 window.addEventListener('DOMContentLoaded', router);
