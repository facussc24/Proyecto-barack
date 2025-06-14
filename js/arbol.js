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
  const subParent = document.getElementById('subParent');
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
  const levelMap = new Map();
  levelMap.set('root', 0);
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
    const idMap = { root: product.ID };
    for (const sub of subs) {
      const parentId = idMap[sub.parentId] || product.ID;
      const node = {
        ID: Date.now().toString() + Math.random().toString(16).slice(2),
        ParentID: parentId,
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
      };
      await addNode(node);
      idMap[sub.id] = node.ID;
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
    if (subParent) {
      subParent.innerHTML = '<option value="root">(Producto principal)</option>';
    }
  });

  addSubBtn?.addEventListener('click', () => {
    const d = subDesc.value.trim();
    if (!d) return;
    const c = subCode.value.trim();
    const parent = subParent?.value || 'root';
    const id = Date.now().toString(16) + Math.random().toString(16).slice(2);
    const level = parent === 'root' ? 1 : (levelMap.get(parent) || 0) + 1;
    subcomponents.push({ id, parentId: parent, desc: d, code: c });
    levelMap.set(id, level);
    const li = document.createElement('li');
    li.style.paddingLeft = `${level * 20}px`;
    li.textContent = c ? `${d} (${c})` : d;
    subList.appendChild(li);
    if (subParent) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = `${'\u2014 '.repeat(level)}${d}`;
      subParent.appendChild(opt);
    }
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
