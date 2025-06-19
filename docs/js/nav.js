export async function loadNav() {
  const placeholder = document.getElementById('nav-placeholder');
  if (!placeholder) return;
  try {
    const html = await fetch('nav.html').then(r => r.text());
    placeholder.outerHTML = html;
    if (window.applyRoleRules) {
      window.applyRoleRules();
    }
  } catch (err) {
    console.error('Failed to load navigation', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadNav);
} else {
  loadNav();
}
