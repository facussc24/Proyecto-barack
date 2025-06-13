document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('isAdmin') !== 'true') {
    alert('Debe iniciar sesión para editar');
    location.href = 'login.html';
    return;
  }

  sessionStorage.setItem('sinopticoEdit', 'true');
  document.dispatchEvent(new Event('sinoptico-mode'));

  const mainMenu = document.getElementById('mainMenu');
  const crearMenu = document.getElementById('crearMenu');
  const clientForm = document.getElementById('clientForm');
  const productForm = document.getElementById('productForm');
  const productStep = document.getElementById('productStep');
  const prodClient = document.getElementById('prodClient');

  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }

  function backToMain() {
    hide(crearMenu); hide(clientForm); hide(productForm); hide(productStep);
    show(mainMenu);
  }

  document.getElementById('menuCrear').addEventListener('click', () => {
    fillOptions();
    hide(mainMenu);
    show(crearMenu);
  });
  document.getElementById('volverMenu').addEventListener('click', backToMain);

  document.getElementById('btnAddClient').addEventListener('click', () => {
    hide(productStep); hide(productForm); show(clientForm);
  });

  document.getElementById('btnAddProduct').addEventListener('click', () => {
    hide(clientForm); hide(productForm); show(productStep);
  });

  document.getElementById('addProductBtn').addEventListener('click', () => {
    if (confirm('¿Vas a agregar insumos, subproductos o subensamble a este producto?')) {
      hide(productStep);
      show(productForm);
    } else {
      backToMain();
    }
  });

  clientForm.addEventListener('submit', e => {
    e.preventDefault();
    const desc = document.getElementById('clientDesc').value.trim();
    if (!desc) return;
    SinopticoEditor.addNode({ Tipo: 'Cliente', Descripción: desc, Cliente: desc });
    clientForm.reset();
    backToMain();
  });

  productForm.addEventListener('submit', e => {
    e.preventDefault();
    const parent = prodClient.value;
    const desc = document.getElementById('prodDesc').value.trim();
    if (!desc) return;
    SinopticoEditor.addNode({ ParentID: parent, Tipo: 'Pieza final', Descripción: desc });
    productForm.reset();
    backToMain();
  });

  function fillOptions() {
    if (!window.SinopticoEditor || !SinopticoEditor.getNodes) return;
    const nodes = SinopticoEditor.getNodes();
    const clients = nodes.filter(n => (n.Tipo || '').toLowerCase() === 'cliente');
    prodClient.innerHTML = '';
    clients.forEach(n => {
      const opt = document.createElement('option');
      opt.value = n.ID;
      opt.textContent = n['Descripción'] || '';
      prodClient.appendChild(opt);
    });
  }

  document.addEventListener('sinoptico-mode', fillOptions);
  setTimeout(fillOptions, 300);
});
