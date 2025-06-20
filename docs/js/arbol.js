import { getAll, addNode, ready } from './dataService.js';
import { animateInsert, animateRemove } from './ui/animations.js';

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
  const productPreview = document.getElementById('productPreview');
  const insumoDesc = document.getElementById('insumoDesc');
  const insumoCode = document.getElementById('insumoCode');
  const insumoUnidad = document.getElementById('insumoUnidad');
  const insumoProveedor = document.getElementById('insumoProveedor');
  const insumoMaterial = document.getElementById('insumoMaterial');
  const insumoOrigen = document.getElementById('insumoOrigen');
  const insumoObs = document.getElementById('insumoObs');
  const insumoParent = document.getElementById('insumoParent');
  const addInsumoBtn = document.getElementById('addInsumoBtn');
  const productLargo = document.getElementById('productLargo');
  const productAncho = document.getElementById('productAncho');
  const productAlto = document.getElementById('productAlto');
  const productPeso = document.getElementById('productPeso');

  await ready;
  const all = await getAll('sinoptico');
  const clientes = all.filter(n => n.Tipo === 'Cliente');
  if (clienteSel) {
    clienteSel.innerHTML = clientes
      .map(c => `<option value="${c.ID}">${c.Descripción}</option>`)
      .join('');
  }

  let subcomponents = [];
  let insumos = [];
  const levelMap = new Map();
  levelMap.set('root', 0);
  const domMap = new Map();
  domMap.set('root', subList);
  const liMap = new Map();
  let productData = null;

  function updateParentOptions() {
    if (!insumoParent) return;
    insumoParent.innerHTML = '<option value="root">(Producto principal)</option>';
    for (const sub of subcomponents) {
      const level = levelMap.get(sub.id) || 1;
      const opt = document.createElement('option');
      opt.value = sub.id;
      opt.textContent = `${'\u2014 '.repeat(level)}${sub.desc}`;
      insumoParent.appendChild(opt);
    }
  }

  function removeSubcomponent(id) {
    const stack = [id];
    const subsToRemove = [];
    while (stack.length) {
      const cur = stack.pop();
      subsToRemove.push(cur);
      subcomponents.forEach(sc => {
        if (sc.parentId === cur) stack.push(sc.id);
      });
    }
    const insIds = insumos.filter(i => subsToRemove.includes(i.parentId)).map(i => i.id);
    const allIds = subsToRemove.concat(insIds);
    subcomponents = subcomponents.filter(sc => !subsToRemove.includes(sc.id));
    insumos = insumos.filter(i => !insIds.includes(i.id));
    for (const rid of allIds) {
      subParent?.querySelector(`option[value='${rid}']`)?.remove();
      insumoParent?.querySelector(`option[value='${rid}']`)?.remove();
      levelMap.delete(rid);
      const li = liMap.get(rid);
      animateRemove(li, () => {
        li?.remove();
        liMap.delete(rid);
        domMap.delete(rid);
      });
    }
    updateParentOptions();
  }

  function removeInsumo(id) {
    insumos = insumos.filter(i => i.id !== id);
    const li = liMap.get(id);
    animateRemove(li, () => {
      li?.remove();
      liMap.delete(id);
    });
  }

  function buildProduct(desc, code, clienteId, largo, ancho, alto, peso) {
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
      Código: code || '',
      Largo: largo || '',
      Ancho: ancho || '',
      Alto: alto || '',
      Peso: peso || ''
    };
  }

  async function persist(product, subs, ins) {
    await addNode(product);
    const idMap = { root: product.ID };
    for (const sub of subs) {
      const parentId = idMap[sub.parentId] || product.ID;
      const node = {
        ID: Date.now().toString() + Math.random().toString(16).slice(2),
        ParentID: parentId,
        Tipo: 'Subproducto',
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
    for (const insumo of ins) {
      const parentId = idMap[insumo.parentId] || product.ID;
      const n = {
        ID: Date.now().toString() + Math.random().toString(16).slice(2),
        ParentID: parentId,
        Tipo: 'Insumo',
        Descripción: insumo.desc,
        Cliente: product.Cliente,
        Vehículo: '',
        RefInterno: '',
        versión: '',
        Imagen: '',
        Consumo: '',
        Unidad: insumo.unidad || '',
        Proveedor: insumo.proveedor || '',
        Material: insumo.material || '',
        Observaciones: insumo.observaciones || '',
        Sourcing: insumo.origen || '',
        Código: insumo.code || ''
      };
      await addNode(n);
    }
  }

  confirmBtn?.addEventListener('click', async () => {
    if (!confirm('¿Seguro que no deseas agregar subcomponentes?')) return;
    const cid = clienteSel.value;
    const desc = descInput.value.trim();
    if (!cid || !desc) return;
    const code = codeInput.value.trim();
    const product = buildProduct(
      desc,
      code,
      cid,
      productLargo.value.trim(),
      productAncho.value.trim(),
      productAlto.value.trim(),
      productPeso.value.trim()
    );
    await persist(product, [], []);
    if (window.mostrarMensaje) window.mostrarMensaje('Producto creado con éxito', 'success');
    window.location.href = 'sinoptico-editor.html';
  });

  continueBtn?.addEventListener('click', () => {
    const cid = clienteSel.value;
    const desc = descInput.value.trim();
    if (!cid || !desc) return;
    const code = codeInput.value.trim();
    productData = {
      cid,
      desc,
      code,
      largo: productLargo.value.trim(),
      ancho: productAncho.value.trim(),
      alto: productAlto.value.trim(),
      peso: productPeso.value.trim()
    };
    step1.style.display = 'none';
    step2.style.display = 'flex';
    if (productPreview) {
      productPreview.textContent = code ? `${desc} (${code})` : desc;
    }
    if (subParent) {
      subParent.innerHTML = '<option value="root">(Producto principal)</option>';
    }
    if (insumoParent) {
      insumoParent.innerHTML = '<option value="root">(Producto principal)</option>';
    }
    updateParentOptions();
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

    const parentList = domMap.get(parent) || subList;
    const li = document.createElement('li');
    li.dataset.id = id;
    const node = document.createElement('span');
    node.className = 'tree-node';
    node.textContent = c ? `${d} (${c})` : d;
    const delBtn = document.createElement('button');
    delBtn.className = 'remove-btn';
    delBtn.type = 'button';
    delBtn.textContent = '🗑';
    delBtn.addEventListener('click', () => removeSubcomponent(id));
    node.appendChild(delBtn);
    li.appendChild(node);
    const childUl = document.createElement('ul');
    li.appendChild(childUl);
    parentList.appendChild(li);
    animateInsert(li);
    domMap.set(id, childUl);
    liMap.set(id, li);

    if (subParent) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = `${'\u2014 '.repeat(level)}${d}`;
      subParent.appendChild(opt);
    }
    updateParentOptions();
    subDesc.value = '';
    subCode.value = '';
  });

  addInsumoBtn?.addEventListener('click', () => {
    const d = insumoDesc.value.trim();
    if (!d) return;
    const c = insumoCode.value.trim();
    const parent = insumoParent?.value || 'root';
    const id = Date.now().toString(16) + Math.random().toString(16).slice(2);
    const level = (levelMap.get(parent) || 0) + 1;
    insumos.push({
      id,
      parentId: parent,
      desc: d,
      code: c,
      unidad: insumoUnidad.value.trim(),
      proveedor: insumoProveedor.value.trim(),
      material: insumoMaterial.value.trim(),
      origen: insumoOrigen.value,
      observaciones: insumoObs.value.trim()
    });

    const parentList = domMap.get(parent) || subList;
    const li = document.createElement('li');
    li.dataset.id = id;
    const node = document.createElement('span');
    node.className = 'tree-node insumo-node';
    node.textContent = c ? `${d} (${c})` : d;
    const delBtn = document.createElement('button');
    delBtn.className = 'remove-btn';
    delBtn.type = 'button';
    delBtn.textContent = '🗑';
    delBtn.addEventListener('click', () => removeInsumo(id));
    node.appendChild(delBtn);
    li.appendChild(node);
    parentList.appendChild(li);
    animateInsert(li);
    liMap.set(id, li);

    insumoDesc.value = '';
    insumoCode.value = '';
    insumoUnidad.value = '';
    insumoProveedor.value = '';
    insumoMaterial.value = '';
    insumoObs.value = '';
  });

  finishBtn?.addEventListener('click', async () => {
    if (!productData) return;
    const product = buildProduct(
      productData.desc,
      productData.code,
      productData.cid,
      productData.largo,
      productData.ancho,
      productData.alto,
      productData.peso
    );
    await persist(product, subcomponents, insumos);
    if (window.mostrarMensaje) window.mostrarMensaje('Árbol creado con éxito', 'success');
    window.location.href = 'sinoptico-editor.html';
  });
});
