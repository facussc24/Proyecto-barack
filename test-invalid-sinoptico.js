const jsdom = require('jsdom-global');
const Fuse = require('fuse.js');
jsdom('', { url: 'http://localhost' });

require('./history_utils.js');

global.sessionStorage = window.sessionStorage;
global.localStorage = window.localStorage;

// minimal globals for renderer.js
global.Papa = { parse: () => ({ data: [], errors: [] }) };
global.XLSX = {
  utils: { book_new(){}, aoa_to_sheet(){}, book_append_sheet(){} },
  writeFile(){},
  read(){ return { SheetNames:[], Sheets:{} }; }
};

document.body.innerHTML = `
  <div id="mensaje"></div>
  <table id="sinoptico"><thead><tr><th></th></tr></thead><tbody></tbody></table>
  <input id="filtroInsumo" />
  <button id="clearSearch"></button>
  <ul id="sinopticoSuggestions"></ul>
  <input type="checkbox" id="chkIncluirAncestros" />
  <input type="checkbox" id="chkMostrarNivel0" />
  <input type="checkbox" id="chkMostrarNivel1" />
  <input type="checkbox" id="chkMostrarNivel2" />
  <input type="checkbox" id="chkMostrarNivel3" />
  <button id="expandirTodo"></button>
  <button id="colapsarTodo"></button>
  <button id="btnRefrescar"></button>
  <button id="btnExcel"></button>
  <label class="toggle-col" data-colindex="0"></label>
`;

localStorage.clear();
localStorage.setItem('sinopticoData', '{');

global.Fuse = Fuse;
require('./renderer.js');

document.dispatchEvent(new Event('DOMContentLoaded'));

const nodes = window.SinopticoEditor.getNodes();
if (!Array.isArray(nodes) || nodes.length === 0) {
  throw new Error('renderer did not recover from invalid sinopticoData');
}
console.log('invalid sinoptico test passed');
