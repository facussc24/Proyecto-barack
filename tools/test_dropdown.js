import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';

async function test(htmlPath) {
  const dom = await JSDOM.fromFile(htmlPath, { runScripts: "outside-only" });
  const { window } = dom;
  const scriptSrc = readFileSync('docs/js/crearMenu.js', 'utf8');
  const script = scriptSrc.replace('export function', 'function');
  window.eval(script);
  window.initCrearMenu();
  const btn = window.document.getElementById('btnMenuCrear');
  if (!btn) {
    console.log(`button not found in ${htmlPath}`);
    return;
  }
  const dropdown = btn.closest('.dropdown');
  btn.dispatchEvent(new window.Event('click', { bubbles: true }));
  const opened = dropdown.classList.contains('open');
  window.document.body.dispatchEvent(new window.Event('click', { bubbles: true }));
  const closed = !dropdown.classList.contains('open');
  console.log(`${htmlPath}: opened=${opened} closed=${closed}`);
}

await test('docs/registros.html');
await test('docs/sinoptico.html');
