export const DATA_CHANGED = 'data-changed';
const STORAGE_KEY = 'sinopticoData';

export function getAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

export function setAll(arr) {
  if (!Array.isArray(arr)) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    document.dispatchEvent(new Event(DATA_CHANGED));
  } catch (e) {
    console.error('Failed to store data', e);
  }
}
