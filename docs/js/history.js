
'use strict';

const socket = io({ transports: ['websocket'], reconnection: true });


function toast(msg) {
  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.querySelector('#historyTable tbody');
  const pageInput = document.getElementById('pageFilter');
  const userInput = document.getElementById('userFilter');
  const startInput = document.getElementById('startDate');
  const endInput = document.getElementById('endDate');
  const applyBtn = document.getElementById('applyFilters');

  function showSpinner() {
    const el = document.getElementById('loading');
    if (el) el.style.display = 'flex';
  }

  function hideSpinner() {
    const el = document.getElementById('loading');
    if (el) el.style.display = 'none';
  }

  async function loadHistory() {
    showSpinner();
    try {
      const resp = await fetch('/api/history');
      if (!resp.ok) {
        if (resp.status === 409) alert('Conflicto al cargar historial');
        else toast('Error al cargar historial');
        return;
      }
      const data = await resp.json();
      const fmt = new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
      tbody.innerHTML = data
        .slice()
        .reverse()
        .map(entry => {
          const ts = entry.ts ? fmt.format(new Date(entry.ts)) : '';
          return `<tr><td>${ts}</td><td>${entry.summary || ''}</td></tr>`;
        })
        .join('');
    } catch (e) {
      console.error(e);
      tbody.innerHTML = '<tr><td colspan="2">Error al cargar historial</td></tr>';
      if (window.mostrarMensaje) window.mostrarMensaje('Error al cargar');
    } finally {
      hideSpinner();
      if (window.mostrarMensaje) window.mostrarMensaje('Guardado', 'success');
    }
  }



  applyBtn?.addEventListener('click', loadHistory);

  if (typeof window !== 'undefined') {
    window.loadHistory = loadHistory;
  }

  loadHistory();

  socket.on('data_updated', () => {
    loadClients();
    loadHistory();
  });
  socket.io.on('reconnect_error', () => toast('Sin conexión al servidor'));
});
