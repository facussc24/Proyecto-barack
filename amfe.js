document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'amfeProcesoData';

  const fields = [
    'codigo',
    'descripcion',
    'materiales',
    'modo',
    'efecto',
    'causas',
    's',
    'o',
    'd',
    'acciones',
    'responsable',
    'fecha',
    'estado',
    'obs'
  ];

  let data = [];

  function load() {
    data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  const tableElem = $('#amfeTable');

  function render() {
    if ($.fn.DataTable.isDataTable('#amfeTable')) {
      tableElem.DataTable().destroy();
    }
    const tbody = tableElem.find('tbody');
    tbody.empty();
    data.forEach((row, idx) => {
      const tr = $('<tr>');
      fields.forEach(f => {
        const td = $('<td contenteditable="true">').text(row[f] || '');
        td.on('focus', () => td.data('orig', td.text()));
        td.on('keydown', e => {
          if (e.key === 'Escape') {
            td.text(td.data('orig') || '');
            td.blur();
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            td.blur();
          }
        });
        td.on('blur', () => {
          row[f] = td.text().trim();
          save();
        });
        tr.append(td);
      });
      const delTd = $('<td>');
      const delBtn = $('<button aria-label="Eliminar fila">🗑</button>');
      delBtn.on('click', () => {
        data.splice(idx, 1);
        save();
        render();
      });
      delTd.append(delBtn);
      tr.append(delTd);
      tbody.append(tr);
    });

    const dt = tableElem.DataTable({
      paging: false,
      ordering: true,
      info: false,
      searching: true,
      scrollX: true,
      dom: 'Bfrtip',
      buttons: [
        { extend: 'excelHtml5', text: 'Exportar Excel', title: 'AMFE' }
      ]
    });
    dt.buttons().container().appendTo('#toolbar .dt-buttons');
  }

  document.getElementById('addRow').addEventListener('click', () => {
    const row = {};
    fields.forEach(f => (row[f] = ''));
    data.push(row);
    save();
    render();
  });

  const newBtn = document.getElementById('newDoc');
  if (newBtn) {
    newBtn.addEventListener('click', () => {
      if (confirm('¿Borrar todas las filas del AMFE?')) {
        data = [];
        save();
        render();
      }
    });
  }

  const cfgBtn = document.getElementById('configBtn');
  if (cfgBtn) {
    cfgBtn.addEventListener('click', () => {
      alert('Función de configuración pendiente');
    });
  }

  load();
  render();

  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) {
      load();
      render();
    }
  });
});
