export function goBack() {
  const ref = document.referrer;
  if (ref) {
    window.location.href = ref;
  } else {
    window.history.back();
  }
}

if (typeof window !== 'undefined') {
  window.goBack = goBack;
}
