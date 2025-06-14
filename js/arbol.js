import { getAll, addNode, ready } from './dataService.js';

function getClienteNombre(clientes, id) {
  const c = clientes.find(x => String(x.ID) === String(id));
  return c ? c.Descripción : '';
}

document.addEventListener('DOMContentLoaded', async () => {
  const clienteSel = document.getElementById('productCliente');
  const descInput = document.getElementById('productDesc');
  const codeInput = document.getElementById('productCode');
  const continueBtn = document.getElementById('continueBtn');
  const confirmBtn = document.getElementById('confirmBtn');
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');

  const subDesc = document.getElementById('subDesc');
  const subCode = document.getElementById('subCode');
  const addSubBtn = document.getElementById('addSubBtn');
  const subList = document.getElementById('subList');
  const finishBtn = document.getElementById('finishBtn');

  await ready;
  const all = await getAll('sinoptico');
  const clientes = all.filter(n => n.Tipo === 'Cliente');
  if (clienteSel) {
    clienteSel.innerHTML = clientes
      .map(c => `<option value="${c.ID}">${c.Descripción}</option>`)
      .join('');
  }

  const subcomponents = [];
  let productData = null;

  function buildProduct(desc, code, clienteId) {
    return {
      ID: Date.now().toString(),
      ParentID: clienteId,
      Tipo: 'Producto',
      Descripción: desc,
      Cliente: getClienteNombre(clientes, clienteId),
      Vehículo: '',
      RefInterno: '',
      versión: '',
      Imagen: '',
      Consumo: '',
      Unidad: '',
      Sourcing: '',
      Código: code || ''
    };
  }

  async function persist(product, subs) {
    await addNode(product);
    for (const sub of subs) {
      await addNode({
        ID: Date.now().toString() + Math.random().toString(16).slice(2),
        ParentID: product.ID,
        Tipo: 'Subcomponente',
        Descripción: sub.desc,
        Cliente: product.Cliente,
        Vehículo: '',
        RefInterno: '',
        versión: '',
        Imagen: '',
        Consumo: '',
        Unidad: '',
        Sourcing: '',
        Código: sub.code || ''
      });
    }
  }

  confirmBtn?.addEventListener('click', async () => {
    if (!confirm('¿Seguro que no deseas agregar subcomponentes?')) return;
    const cid = clienteSel.value;
    const desc = descInput.value.trim();
    if (!cid || !desc) return;
    const code = codeInput.value.trim();
    const product = buildProduct(desc, code, cid);
    await persist(product, []);
    if (window.mostrarMensaje) window.mostrarMensaje('Producto creado con éxito', 'success');
    window.location.href = 'sinoptico-editor.html';
  });

  continueBtn?.addEventListener('click', () => {
    const cid = clienteSel.value;
    const desc = descInput.value.trim();
    if (!cid || !desc) return;
    const code = codeInput.value.trim();
    productData = { cid, desc, code };
    step1.style.display = 'none';
    step2.style.display = 'flex';
  });

  addSubBtn?.addEventListener('click', () => {
    const d = subDesc.value.trim();
    if (!d) return;
    const c = subCode.value.trim();
    subcomponents.push({ desc: d, code: c });
    const li = document.createElement('li');
    li.textContent = c ? `${d} (${c})` : d;
    subList.appendChild(li);
    subDesc.value = '';
    subCode.value = '';
  });

  finishBtn?.addEventListener('click', async () => {
    if (!productData) return;
    const product = buildProduct(productData.desc, productData.code, productData.cid);
    await persist(product, subcomponents);
    if (window.mostrarMensaje) window.mostrarMensaje('Árbol creado con éxito', 'success');
    window.location.href = 'sinoptico-editor.html';
  });
});
