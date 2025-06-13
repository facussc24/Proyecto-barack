document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('isAdmin') !== 'true') {
    alert('Debe iniciar sesión para editar');
    location.href = 'login.html';
    return;
  }

  const tbody = document.querySelector('#modTable tbody');

  function render() {
    tbody.innerHTML = '';
    const nodes = window.SinopticoEditor.getNodes();
    nodes.forEach(n => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${n.ID}</td><td>${n.Tipo}</td><td>${n['Descripción'] || ''}</td><td>${n.Código || ''}</td>`;
      const td = document.createElement('td');
      const btn = document.createElement('button');
      btn.textContent = 'Editar';
      btn.addEventListener('click', () => {
        const desc = prompt('Nueva descripción', n['Descripción'] || '');
        if (desc !== null) {
          window.SinopticoEditor.updateNode(n.ID, { Descripción: desc });
          render();
        }
      });
      td.appendChild(btn);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
  }

  document.addEventListener('sinoptico-mode', render);
  setTimeout(render, 300);
});
