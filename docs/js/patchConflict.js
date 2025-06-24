(function(){
  const origFetch = window.fetch;
  window.fetch = async function(input, init = {}) {
    const method = (init.method || 'GET').toUpperCase();
    const resp = await origFetch(input, init);
    if (method === 'PATCH' && resp.status === 409) {
      if (window.mostrarMensaje) {
        window.mostrarMensaje('Conflicto: otro usuario guard\u00f3 cambios antes');
      }
      try {
        const getResp = await origFetch(input, {method: 'GET'});
        if (getResp.ok) {
          const data = await getResp.json();
          window.dispatchEvent(new CustomEvent('patch-conflict', {detail:{url: input, data}}));
          const form = document.querySelector(`form[data-record-id="${data.id}"]`);
          if (form) {
            for (const [k, v] of Object.entries(data)) {
              const inp = form.querySelector(`[name="${k}"]`);
              if (inp) inp.value = v;
            }
          }
        }
      } catch (e) {
        console.error('Error fetching updated record', e);
      }
    }
    return resp;
  };
})();
