import { getAll, add, update, remove, ready } from '../dataService.js';

export async function render(container) {
  container.innerHTML = `
    <h1>Usuarios</h1>
    <table class="users-table">
      <thead>
        <tr><th>Nombre</th><th>Rol</th><th>Acciones</th></tr>
      </thead>
      <tbody></tbody>
    </table>
    <button id="addUserBtn">Añadir usuario</button>
  `;

  const tbody = container.querySelector('tbody');

  async function load() {
    await ready;
    const users = await getAll('users');
    tbody.innerHTML = '';
    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.dataset.id = u.id;
      tr.innerHTML = `
        <td>${u.name || ''}</td>
        <td>${u.role || ''}</td>
        <td>
          <button class="edit">Editar</button>
          <button class="delete">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  await load();

  container.querySelector('#addUserBtn').addEventListener('click', () => {
    showEditor();
  });

  tbody.addEventListener('click', async ev => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const row = btn.closest('tr');
    const id = row.dataset.id;
    if (btn.classList.contains('delete')) {
      if (confirm('¿Eliminar usuario?')) {
        await remove('users', id);
        await load();
      }
    } else if (btn.classList.contains('edit')) {
      await ready;
      const users = await getAll('users');
      const user = users.find(u => u.id === id);
      showEditor(user, row);
    }
  });

  function showEditor(user = {}, refRow) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" value="${user.name || ''}" /></td>
      <td>
        <select>
          <option value="admin"${user.role === 'admin' ? ' selected' : ''}>Admin</option>
          <option value="user"${user.role === 'user' ? ' selected' : ''}>User</option>
        </select>
        <input type="password" placeholder="Contraseña" />
      </td>
      <td>
        <button class="save">Guardar</button>
        <button class="cancel">Cancelar</button>
      </td>`;
    if (refRow) {
      tbody.replaceChild(tr, refRow);
    } else {
      tbody.appendChild(tr);
    }

    const nameInput = tr.querySelector('input[type="text"]');
    const roleSelect = tr.querySelector('select');
    const passwordInput = tr.querySelector('input[type="password"]');

    tr.querySelector('.save').addEventListener('click', async () => {
      const data = { name: nameInput.value.trim(), role: roleSelect.value };
      if (passwordInput.value) data.password = passwordInput.value;
      if (!data.name) return;
      if (user.id) {
        await update('users', user.id, data);
      } else {
        await add('users', data);
      }
      await load();
    });

    tr.querySelector('.cancel').addEventListener('click', load);
  }
}
