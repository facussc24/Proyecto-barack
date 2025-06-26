
'use strict';

const socket = (typeof io !== 'undefined')
  ? io({ transports: ['websocket'], reconnection: true })
  : (alert('Socket.IO no disponible'), null);


function showToast(msg) {
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

  async function loadHistory() {
    try {
      const resp = await fetch('/api/history');
      if (!resp.ok) {
        if (resp.status === 409) alert('Conflicto al cargar historial');
        else showToast('Error al cargar historial');
        return;
      }
      const data = await resp.json();
      tbody.innerHTML = '';
      const fmt = new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
      data.slice().reverse().forEach(entry => {
        const tr = document.createElement('tr');
        const ts = entry.ts ? fmt.format(new Date(entry.ts)) : '';
        tr.innerHTML =
          `<td>${ts}</td>` +
          `<td>${entry.summary || ''}</td>`;
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.error(e);
      tbody.innerHTML = '<tr><td colspan="2">Error al cargar historial</td></tr>';
    }
  }



  applyBtn?.addEventListener('click', loadHistory);

  loadHistory();

  if (socket) {
    socket.on('data_updated', () => {
      loadHistory();
      if (typeof loadClients === 'function') loadClients();
    });

    socket.on('reconnect', () => {
      if (typeof loadClients === 'function') loadClients();
      loadHistory();
    });

    socket.on('connect_error', e => console.error('WS error', e));
  }
});
