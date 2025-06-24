'use strict';

export function showImageModal(src) {
  let dialog = document.getElementById('imgModal');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'imgModal';
    dialog.className = 'modal image-modal';
    dialog.innerHTML = '<button class="close-dialog">✖</button><div class="img-wrapper"></div>';
    dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', ev => { if (ev.target === dialog) dialog.close(); });
    document.body.appendChild(dialog);
  }
  const wrapper = dialog.querySelector('.img-wrapper');
  if (src) {
    const alt = src.split('/').pop().replace(/\.[^.]+$/, '');
    wrapper.innerHTML = `<img src="${src}" alt="${alt}">`;
    const img = wrapper.querySelector('img');
    img.addEventListener('error', () => {
      wrapper.innerHTML = '<p>Sin imagen</p>';
    }, { once: true });
  } else {
    wrapper.innerHTML = '<p>Sin imagen</p>';
  }
  dialog.showModal();
}

if (typeof window !== 'undefined') {
  window.showImageModal = showImageModal;
  document.addEventListener('DOMContentLoaded', () => {});
}
