export function showSaveStatus(text) {
  const el = document.getElementById('save-status');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('opacity-0');
  clearTimeout(el._hideTimeout);
  el._hideTimeout = setTimeout(() => el.classList.add('opacity-0'), 2000);
}
