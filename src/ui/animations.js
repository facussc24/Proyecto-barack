'use strict';
// Add smooth page transitions
window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-loaded');
  document.querySelectorAll('a[href]').forEach(a => {
    const url = a.getAttribute('href');
    if (a.target === '_blank' || !url || url.startsWith('#') || url.startsWith('mailto:')) return;
    a.addEventListener('click', evt => {
      // only intercept left click without modifier keys
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
});
