export function showDeleteDialog() {
  let dlg = document.getElementById('dlgConfirmDelete');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'dlgConfirmDelete';
    dlg.className = 'modal';
    dlg.innerHTML = `
      <form method="dialog">
        <p>¿Eliminar fila?</p>
        <div class="form-actions">
          <button type="button" id="cancelDelRow">Cancelar</button>
          <button id="confirmDelRow" value="confirm">Eliminar</button>
        </div>
      </form>`;
    document.body.appendChild(dlg);
  }
  return new Promise(resolve => {
    const cancelBtn = dlg.querySelector('#cancelDelRow');
    const confirmBtn = dlg.querySelector('#confirmDelRow');
    const close = res => {
      dlg.close();
      resolve(res);
    };
    cancelBtn.onclick = () => close(false);
    confirmBtn.onclick = ev => {
      ev.preventDefault();
      close(true);
    };
    dlg.showModal();
  });
}
