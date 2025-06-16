'use strict';

export function animateInsert(el) {
  if (!el) return;
  el.classList.add('fade-in');
  el.addEventListener('animationend', () => el.classList.remove('fade-in'), {
    once: true,
  });
}

export function animateRemove(el, cb) {
  if (!el) {
    if (typeof cb === 'function') cb();
    return;
  }
  el.classList.add('fade-out');
  el.addEventListener(
    'animationend',
    () => {
      el.classList.remove('fade-out');
      if (typeof cb === 'function') cb();
    },
    { once: true },
  );
}

// Add smooth page transitions
window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-loaded');
  document.addEventListener('click', evt => {
    const a = evt.target.closest('a[href]');
    if (!a) return;
    const url = a.getAttribute('href');
    if (
      a.target === '_blank' ||
      !url ||
      url.startsWith('#') ||
      url.startsWith('mailto:') ||
      new URL(a.href, location.href).origin !== location.origin
    ) {
      return;
    }
    if (evt.button !== 0 || evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey) return;
    evt.preventDefault();
    document.body.classList.add('fade-out');
    document.body.classList.remove('page-loaded');
    const href = a.href;
    setTimeout(() => {
      window.location.href = href;
    }, 100);
  });
});

const root = typeof global !== 'undefined' ? global : globalThis;
root.animateInsert = animateInsert;
root.animateRemove = animateRemove;
