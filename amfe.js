document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'amfeProcesoData';
  const fs = window.require ? window.require('fs') : null;
  const path = window.require ? window.require('path') : null;
  const jsonPath = fs && path ? path.join(__dirname, 'no-borrar', 'amfe_proceso.json') : null;

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
    if (fs && jsonPath && fs.existsSync(jsonPath)) {
      try {
        data = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) || [];
      } catch (e) {
        data = [];
      }
    } else {
      data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (fs && jsonPath) {
      try {
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      } catch (e) {
        console.error('Error writing AMFE JSON', e);
      }
    }
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
});
