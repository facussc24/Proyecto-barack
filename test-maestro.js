const jsdom = require('jsdom-global');
jsdom('', { url: 'http://localhost' });
global.sessionStorage = window.sessionStorage;
global.localStorage = window.localStorage;

// Minimal DOM structure expected by maestro.js
document.body.innerHTML = `
  <div id="maestro"></div>
  <select id="docName"></select>
  <input id="docNumber" />
  <input id="docDetail" />
  <button id="addDoc"></button>
  <input id="maestroFilter" />
  <div class="maestro-form"></div>
`;

require('./maestro.js');
document.dispatchEvent(new Event('DOMContentLoaded'));
