const jsdom = require('jsdom-global');
jsdom('', { url: 'http://localhost' });
require('./history_utils.js');

// expose storages
global.sessionStorage = window.sessionStorage;
global.localStorage = window.localStorage;

// minimal DOM elements expected by insumos.js
document.body.innerHTML = `
  <div id="insumos"></div>
  <input id="insumoSearch" />
  <button id="clearInsumoSearch"></button>
  <form id="insForm" class="insumos-form">
    <input id="inNombre" />
    <input id="inDescripcion" />
    <input id="inEspecificaciones" />
    <button id="saveItem" type="submit"></button>
  </form>
`;

sessionStorage.setItem('insumosAdmin','true');
sessionStorage.setItem('isAdmin','true');

require('./insumos.js');
document.dispatchEvent(new Event('DOMContentLoaded'));

window.InsumosEditor.createItem({ nombre: 'Test', descripcion: 'd', especificaciones: 'e' });

const arr = JSON.parse(localStorage.getItem('insumosData') || '[]');
if (!arr.find(i => i.nombre === 'Test')) throw new Error('item not persisted');

console.log('insumos test passed');
