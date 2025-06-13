const jsdom = require('jsdom-global');
const fs = require('fs');
const html = fs.readFileSync('amfe_proceso_ultra.html', 'utf8');
jsdom(html, { url: 'http://localhost' });

// expose storages
global.sessionStorage = window.sessionStorage;
global.localStorage = window.localStorage;

// enable admin mode
sessionStorage.setItem('isAdmin', 'true');

require('./amfe_proceso_ultra.js');

document.dispatchEvent(new Event('DOMContentLoaded'));

document.getElementById('addProcess').click();

const funcSpan = document.querySelector('.process-section .process-fields span:nth-child(3)');
funcSpan.textContent = 'Test funcion';
funcSpan.dispatchEvent(new Event('blur'));

const stored = JSON.parse(localStorage.getItem('amfeUltraData') || '{}');
if (!stored.processes || stored.processes[0].funcion !== 'Test funcion') {
  throw new Error('changes not persisted');
}

console.log('amfe ultra test passed');
