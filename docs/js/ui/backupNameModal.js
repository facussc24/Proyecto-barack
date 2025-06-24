'use strict';

export function askBackupName() {
  return new Promise(resolve => {
    let dialog = document.getElementById('dlgBackupName');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'dlgBackupName';
      dialog.className = 'modal';
      dialog.innerHTML = `
        <form method="dialog">
          <label for="backupNameInput">Nombre del backup:</label>
          <input id="backupNameInput" type="text" required>
          <div class="form-actions">
            <button type="submit">Aceptar</button>
            <button type="button">Cancelar</button>
          </div>
        </form>
      `;
      document.body.appendChild(dialog);
      dialog.querySelector('button[type="button"]').addEventListener('click', () => {
        dialog.close();
        resolve(null);
      });
    }
    const form = dialog.querySelector('form');
    const input = dialog.querySelector('#backupNameInput');
    input.value = '';
    function submit(ev) {
      ev.preventDefault();
      const name = input.value.trim();
      if (!name) return;
      dialog.close();
      resolve(name);
    }
    form.addEventListener('submit', submit, { once: true });
    dialog.addEventListener('close', () => {
      form.removeEventListener('submit', submit);
    }, { once: true });
    dialog.showModal();
    input.focus();
  });
}

if (typeof window !== 'undefined') {
  window.askBackupName = askBackupName;
}
