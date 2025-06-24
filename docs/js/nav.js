export async function loadNav() {
  const placeholder = document.getElementById('nav-placeholder');
  if (!placeholder) return;
  try {
    const html = await fetch('nav.html').then(r => r.text());
    placeholder.outerHTML = html;
    document.dispatchEvent(new Event('navLoaded'));
    setupDropdowns();
    if (window.applyRoleRules) {
      window.applyRoleRules();
    }
  } catch (err) {
    console.error('Failed to load navigation', err);
  }
}

function setupDropdowns() {
  const items = document.querySelectorAll('.nav-item.dropdown > a');
  items.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const item = link.parentElement;
      item.classList.toggle('open');
    });
  });
  window.addEventListener('click', e => {
    document.querySelectorAll('.nav-item.dropdown.open').forEach(item => {
      if (!item.contains(e.target)) item.classList.remove('open');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadNav);
} else {
  loadNav();
}
