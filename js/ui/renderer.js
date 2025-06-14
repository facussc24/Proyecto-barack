'use strict';
const root = typeof global !== 'undefined' ? global : globalThis;

    document.addEventListener('DOMContentLoaded', () => {
      const dataService =
        root.dataService ||
        (typeof require === 'function' ? require('../dataService.js') : null);
      if (typeof root.requestAnimationFrame === 'undefined') {
        root.requestAnimationFrame = cb => setTimeout(cb, 0);
      }
      let fuseSinoptico = null;
      let sinopticoData = [];
      const sinopticoElem = document.getElementById('sinoptico');

      function generarDatosIniciales() {
        return [
          {
            ID: '1',
            ParentID: '',
            Tipo: 'Cliente',
            Secuencia: '',
            Descripción: 'Cliente demo',
            Cliente: 'Cliente demo',
            Vehículo: '',
            RefInterno: '',
            versión: '',
            Imagen: '',
            Consumo: '',
            Unidad: '',
            Sourcing: '',
            Código: ''
          },
          {
            ID: '2',
            ParentID: '1',
            Tipo: 'Pieza final',
            Secuencia: '',
            Descripción: 'Producto demo',
            Cliente: 'Cliente demo',
            Vehículo: 'Modelo X',
            RefInterno: 'REF1',
            versión: 'v1',
            Imagen: '',
            Consumo: '1',
            Unidad: 'pz',
            Sourcing: '',
            Código: 'P-1'
          }
        ];
      }
      const selectedItemsContainer = document.getElementById('selectedItems');
      const selectedItems = [];
      /* ==================================================
         1) Mostrar/Ocultar Columnas
      ================================================== */
      const toggles = document.querySelectorAll('.toggle-col');

      function applyColumnVisibility() {
        toggles.forEach(chk => {
          const colIndex = parseInt(chk.getAttribute('data-colindex'));
          const checked = chk.checked;
          const th = document.querySelector(`#sinoptico thead th:nth-child(${colIndex + 1})`);
          if (th) th.style.display = checked ? '' : 'none';
          document.querySelectorAll('#sinoptico tbody tr').forEach(tr => {
            const td = tr.querySelector(`td:nth-child(${colIndex + 1})`);
            if (td) td.style.display = checked ? '' : 'none';
          });
        });
      }

      toggles.forEach(chk => {
        chk.addEventListener('change', applyColumnVisibility);
      });

      /* ==================================================
         2) Funciones de alerta y filtrado
      ================================================== */
      function mostrarMensaje(texto, tipo = 'error') {
        const div = document.getElementById('appMessage');
        if (!div) return;
        const colores = {
          error: '#e74c3c',
          warning: '#f39c12',
          success: '#2ecc71'
        };
        div.textContent = texto;
        div.style.backgroundColor = colores[tipo] || colores.error;
        div.style.color = '#ffffff';
        div.style.display = 'block';
        requestAnimationFrame(() => {
          div.style.opacity = '1';
        });
        setTimeout(() => {
          div.style.opacity = '0';
          div.addEventListener(
            'transitionend',
            () => {
              div.style.display = 'none';
            },
            { once: true }
          );
        }, 2000);
      }
      window.mostrarMensaje = mostrarMensaje;

      if (typeof Fuse === 'undefined') {
        mostrarMensaje('Fuse.js no cargó – búsqueda deshabilitada', 'warning');
      }

      function aplicarFiltro() {
        const criterioElem = document.getElementById('filtroInsumo');
        const criterio = criterioElem ? criterioElem.value.trim().toLowerCase() : '';
        const incluirAncestrosElem = document.getElementById('chkIncluirAncestros');
        const incluirAncestros = incluirAncestrosElem ? incluirAncestrosElem.checked : true;
        const mostrar0Elem = document.getElementById('chkMostrarNivel0');
        const mostrar0 = mostrar0Elem ? mostrar0Elem.checked : true;
        const mostrar1Elem = document.getElementById('chkMostrarNivel1');
        const mostrar1 = mostrar1Elem ? mostrar1Elem.checked : true;
        const mostrar2Elem = document.getElementById('chkMostrarNivel2');
        const mostrar2 = mostrar2Elem ? mostrar2Elem.checked : true;
        const mostrar3Elem = document.getElementById('chkMostrarNivel3');
        const mostrar3 = mostrar3Elem ? mostrar3Elem.checked : true;

        const todasFilas = Array.from(document.querySelectorAll('#sinoptico tbody tr'));
        const mapIdToRow = {};
        todasFilas.forEach(tr => {
          const id = tr.getAttribute('data-id');
          if (id) mapIdToRow[id] = tr;
        });

        function mostrarAncestros(id) {
          if (!id) return;
          const fila = mapIdToRow[id];
          if (!fila) return;
          fila.style.display = '';
          const parentId = fila.getAttribute('data-parent');
          if (parentId) mostrarAncestros(parentId);
        }

        const keywords = [];
        if (criterio) {
          keywords.push(...criterio.split(/[\,\s]+/).filter(Boolean));
        }
        selectedItems.forEach(item => {
          if (item.code) keywords.push(item.code.toString().trim());
          if (item.text) keywords.push(item.text.toString().trim());
        });

        if (keywords.length === 0) {
          // Mostrar/ocultar según nivel, sin filtro de texto
          todasFilas.forEach(tr => {
            const nivel = tr.classList.contains('nivel-0')
              ? 0
              : tr.classList.contains('nivel-1')
              ? 1
              : tr.classList.contains('nivel-2')
              ? 2
              : 3;
            const mostrarEste =
              (nivel === 0 && mostrar0) ||
              (nivel === 1 && mostrar1) ||
              (nivel === 2 && mostrar2) ||
              (nivel === 3 && mostrar3);
            tr.style.display = mostrarEste ? '' : 'none';
          });
          return;
        }

        // Con texto o chips seleccionados: ocultar todo y luego mostrar coincidencias + ancestros
        todasFilas.forEach(tr => (tr.style.display = 'none'));
        if (fuseSinoptico) {
          const idSet = new Set();
          keywords.forEach(k => {
            fuseSinoptico.search(k).forEach(res => {
              if (res.item && res.item.ID)
                idSet.add(res.item.ID.toString().trim());
            });
          });
          todasFilas.forEach(tr => {
            const rowId = tr.getAttribute('data-id');
            if (!idSet.has(rowId)) return;
            const nivel = tr.classList.contains('nivel-0')
              ? 0
              : tr.classList.contains('nivel-1')
              ? 1
              : tr.classList.contains('nivel-2')
              ? 2
              : tr.classList.contains('nivel-3')
              ? 3
              : 4;
            const mostrarEste =
              (nivel === 0 && mostrar0) ||
              (nivel === 1 && mostrar1) ||
              (nivel === 2 && mostrar2) ||
              (nivel === 3 && mostrar3);
            if (mostrarEste) tr.style.display = '';
            if (incluirAncestros) {
              const parentId = tr.getAttribute('data-parent');
              mostrarAncestros(parentId);
            }
          });
        } else {
          todasFilas.forEach(tr => {
            const textoFila = tr.textContent.toLowerCase();
            if (keywords.some(k => textoFila.includes(k.toLowerCase()))) {
              const nivel = tr.classList.contains('nivel-0')
                ? 0
                : tr.classList.contains('nivel-1')
                ? 1
                : tr.classList.contains('nivel-2')
                ? 2
                : tr.classList.contains('nivel-3')
                ? 3
                : 4;
              const mostrarEste =
                (nivel === 0 && mostrar0) ||
                (nivel === 1 && mostrar1) ||
                (nivel === 2 && mostrar2) ||
                (nivel === 3 && mostrar3);
              if (mostrarEste) tr.style.display = '';
              if (incluirAncestros) {
                const parentId = tr.getAttribute('data-parent');
                mostrarAncestros(parentId);
              }
            }
          });
        }

        // Finalmente ocultar niveles no marcados
        todasFilas.forEach(tr => {
          const nivel = tr.classList.contains('nivel-0')
            ? 0
            : tr.classList.contains('nivel-1')
            ? 1
            : tr.classList.contains('nivel-2')
            ? 2
            : tr.classList.contains('nivel-3')
            ? 3
            : 4;
          const mostrarEste =
            (nivel === 0 && mostrar0) ||
            (nivel === 1 && mostrar1) ||
            (nivel === 2 && mostrar2) ||
            (nivel === 3 && mostrar3);
          if (!mostrarEste) tr.style.display = 'none';
        });
      }

      // Adjuntamos eventos a campos de filtro
      const filtroInputElem = document.getElementById('filtroInsumo');
      if (filtroInputElem) {
        filtroInputElem.addEventListener('input', () => {
          if (fuseSinoptico) {
            applyFuzzySearchSinoptico();
          }
          aplicarFiltro();
        });
      }
      const clearBtn = document.getElementById('clearSearch');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          const suggestionList = document.getElementById('sinopticoSuggestions');
          if (suggestionList) {
            suggestionList.style.display = 'none';
            suggestionList.innerHTML = '';
          }
          if (filtroInputElem) filtroInputElem.value = '';
          selectedItems.splice(0, selectedItems.length);
          renderSelectedChips();
          aplicarFiltro();
        });
      }
      const chkIncluir = document.getElementById('chkIncluirAncestros');
      if (chkIncluir) chkIncluir.addEventListener('change', aplicarFiltro);
      const chk0 = document.getElementById('chkMostrarNivel0');
      if (chk0) chk0.addEventListener('change', aplicarFiltro);
      const chk1 = document.getElementById('chkMostrarNivel1');
      if (chk1) chk1.addEventListener('change', aplicarFiltro);
      const chk2 = document.getElementById('chkMostrarNivel2');
      if (chk2) chk2.addEventListener('change', aplicarFiltro);
      const chk3 = document.getElementById('chkMostrarNivel3');
      if (chk3) chk3.addEventListener('change', aplicarFiltro);

      /* ==================================================
         3) Botones Expandir / Colapsar (nodos + recursivo)
      ================================================== */
      function showChildren(parentId) {
        const hijos = document.querySelectorAll(`#sinoptico tbody tr[data-parent="${parentId}"]`);
        hijos.forEach(hijo => {
          hijo.style.display = '';
          hijo.classList.add('fade-in');
          setTimeout(() => hijo.classList.remove('fade-in'), 300);
        });
      }

      function highlightRow(code, persistent) {
        const filas = Array.from(document.querySelectorAll('#sinoptico tbody tr'));
        const sel = (code || '').toString().trim().toLowerCase();
        const fila = filas.find(tr => {
          const td = tr.querySelector('td:last-child');
          if (!td) return false;
          const txt = td.textContent.trim().toLowerCase();
          return txt === sel;
        });
        if (fila) {
          let parentId = fila.getAttribute('data-parent');
          while (parentId) {
            showChildren(parentId);
            const b = document.querySelector(
              `#sinoptico tbody tr[data-id="${parentId}"] .toggle-btn`
            );
            if (b) {
              b.textContent = '–';
              b.setAttribute('data-expanded', 'true');
              b.setAttribute('aria-expanded', 'true');
            }
            const parentRow = document.querySelector(
              `#sinoptico tbody tr[data-id="${parentId}"]`
            );
            parentId = parentRow ? parentRow.getAttribute('data-parent') : null;
          }
          fila.classList.add('highlight');
          fila.scrollIntoView({ block: 'center' });
          if (!persistent) {
            setTimeout(() => fila.classList.remove('highlight'), 2000);
          }
        }
      }

      function findRowByCode(code) {
        const filas = Array.from(document.querySelectorAll('#sinoptico tbody tr'));
        const sel = (code || '').toString().trim().toLowerCase();
        return filas.find(tr => {
          const td = tr.querySelector('td:last-child');
          if (!td) return false;
          const txt = td.textContent.trim().toLowerCase();
          return txt === sel;
        });
      }

      function renderSelectedChips() {
        if (!selectedItemsContainer) return;
        selectedItemsContainer.innerHTML = '';
        selectedItems.forEach(item => {
          const chip = document.createElement('span');
          chip.className = 'chip';
          chip.textContent = item.text;
          const btn = document.createElement('button');
          btn.textContent = '×';
          btn.addEventListener('click', () => {
            removeSelectedItem(item.code);
          });
          chip.appendChild(btn);
          selectedItemsContainer.appendChild(chip);
        });
      }

      function removeSelectedItem(code) {
        const idx = selectedItems.findIndex(i => i.code === code);
        if (idx !== -1) {
          selectedItems.splice(idx, 1);
          const row = findRowByCode(code);
          if (row) row.classList.remove('highlight');
          renderSelectedChips();
          aplicarFiltro();
        }
      }

      function addSelectedItem(row) {
        if (!row || !row['Código']) return;
        const code = row['Código'].toString().trim();
        if (selectedItems.some(i => i.code === code)) return;
        selectedItems.push({ code, text: (row['Descripción'] || '').toString().trim() });
        renderSelectedChips();
        highlightRow(code, true);
      }

      function applyFuzzySearchSinoptico() {
        const input = document.getElementById('filtroInsumo');
        const suggestionList = document.getElementById('sinopticoSuggestions');
        if (!fuseSinoptico || !input || !suggestionList) return;
        suggestionList.innerHTML = '';
        const text = input.value.trim();
        if (!text) {
          suggestionList.style.display = 'none';
          return;
        }
        const results = fuseSinoptico.search(text).slice(0, 8);
        results.forEach(res => {
          const li = document.createElement('li');
          const row = res.item;
          li.textContent = `${row['Descripción']} - ${row['Código'] || ''}`.trim();
          li.addEventListener('click', () => {
            suggestionList.style.display = 'none';
            suggestionList.innerHTML = '';
            input.value = '';
            addSelectedItem(row);
            aplicarFiltro();
          });
          suggestionList.appendChild(li);
        });
        suggestionList.style.display = results.length ? 'block' : 'none';
      }
      function hideSubtree(parentId) {
        const hijos = document.querySelectorAll(`#sinoptico tbody tr[data-parent="${parentId}"]`);
        hijos.forEach(hijo => {
          hijo.style.display = 'none';
          const btn = hijo.querySelector('.toggle-btn');
          if (btn) {
            btn.textContent = '+';
            btn.setAttribute('data-expanded', 'false');
            btn.setAttribute('aria-expanded', 'false');
          }
          const idHijo = hijo.getAttribute('data-id');
          hideSubtree(idHijo);
        });
      }
      function toggleNodo(btn, parentId) {
        const expanded = btn.getAttribute('data-expanded') === 'true';
        btn.classList.add('scale');
        setTimeout(() => btn.classList.remove('scale'), 200);
        if (expanded) {
          // Colapsar
          btn.textContent = '+';
          btn.setAttribute('data-expanded', 'false');
          btn.setAttribute('aria-expanded', 'false');
          btn.setAttribute('aria-label', 'Expandir');
          hideSubtree(parentId);
        } else {
          // Expandir
          btn.textContent = '–';
          btn.setAttribute('data-expanded', 'true');
          btn.setAttribute('aria-expanded', 'true');
          btn.setAttribute('aria-label', 'Colapsar');
          showChildren(parentId);
        }
      }
      function colapsarTodo() {
        document.querySelectorAll('#sinoptico tbody tr').forEach(tr => {
          if (!tr.classList.contains('nivel-0')) {
            tr.style.display = 'none';
          }
        });
        document.querySelectorAll('.toggle-btn').forEach(btn => {
          if (!btn.classList.contains('hidden')) {
            btn.textContent = '+';
            btn.setAttribute('data-expanded', 'false');
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-label', 'Expandir');
          }
        });
      }
      function expandirTodo() {
        document.querySelectorAll('#sinoptico tbody tr').forEach(tr => {
          tr.style.display = '';
          tr.classList.add('fade-in');
          setTimeout(() => tr.classList.remove('fade-in'), 300);
        });
        document.querySelectorAll('.toggle-btn').forEach(btn => {
          if (!btn.classList.contains('hidden')) {
            btn.textContent = '–';
            btn.setAttribute('data-expanded', 'true');
            btn.setAttribute('aria-expanded', 'true');
            btn.setAttribute('aria-label', 'Colapsar');
          }
        });
      }
      const btnExp = document.getElementById('expandirTodo');
      if (btnExp) btnExp.addEventListener('click', expandirTodo);
      const btnCol = document.getElementById('colapsarTodo');
      if (btnCol) btnCol.addEventListener('click', colapsarTodo);
      const btnRef = document.getElementById('btnRefrescar');
      if (btnRef) btnRef.addEventListener('click', loadData);

      /* ==================================================
         4) Exportar a Excel (solo filas visibles)
      ================================================== */
      const btnExcel = document.getElementById('btnExcel');
      if (btnExcel) btnExcel.addEventListener('click', () => {
        if (typeof XLSX === 'undefined') {
          mostrarMensaje('SheetJS no cargó – exportar a Excel deshabilitado', 'warning');
          return;
        }
        const filasVisibles = [];
        const encabezados = Array.from(
          document.querySelectorAll('#sinoptico thead th')
        )
          .filter(th => th.style.display !== 'none')
          .map(th => th.textContent.trim());
        filasVisibles.push(encabezados);

        document.querySelectorAll('#sinoptico tbody tr').forEach(tr => {
          if (tr.style.display === '') {
            const celdas = Array.from(tr.querySelectorAll('td'))
              .filter((td, idx) => {
                const th = document.querySelector(
                  `#sinoptico thead th:nth-child(${idx + 1})`
                );
                return th && th.style.display !== 'none';
              })
              .map((td, idx) => {
                let text = td.textContent.trim();
                if (idx === 0) text = text.replace(/^[+-]\s*/, '');
                return text;
              });
            filasVisibles.push(celdas);
          }
        });

        const wb = XLSX.utils.book_new();
        const ws = {};
        XLSX.utils.sheet_add_aoa(ws, filasVisibles, { cellStyles: true });

        // Estilos para encabezados
        encabezados.forEach((_, idx) => {
          const addr = XLSX.utils.encode_cell({ r: 0, c: idx });
          if (ws[addr]) {
            ws[addr].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: 'D9D9D9' } }
            };
          }
        });

        // Ajustar ancho de columnas basado en contenido
        const colWidths = encabezados.map((header, cIdx) => {
          const maxLen = filasVisibles.reduce((max, row) => {
            const val = row[cIdx] || '';
            return Math.max(max, val.toString().length);
          }, header.length);
          return { wch: Math.min(Math.max(maxLen + 2, 10), 30) };
        });
        ws['!cols'] = colWidths;

        // Congelar fila de encabezado
        ws['!freeze'] = { ySplit: 1 };

        XLSX.utils.book_append_sheet(wb, ws, 'Sinoptico');
        XLSX.writeFile(wb, 'sinoptico.xlsx');
      });

      /* ==================================================
         5) Cargar CSV y construir la tabla jerárquica
         + Recarga automática cada 30 segundos
      ================================================== */
      function normalizarFila(fila) {
        if (fila['Descripcin']) fila['Descripción'] = fila['Descripcin'];
        if (fila['Vehculo']) fila['Vehículo'] = fila['Vehculo'];
        if (fila['versin']) fila['versión'] = fila['versin'];
        if (fila['Cdigo']) fila['Código'] = fila['Cdigo'];

        // Trim whitespace on common string fields to ensure
        // consistent matches when realizando búsquedas.
        [
          'Descripción',
          'Cliente',
          'Vehículo',
          'RefInterno',
          'versión',
          'Imagen',
          'Consumo',
          'Unidad',
          'Sourcing',
          'Código'
        ].forEach(campo => {
          if (fila[campo]) {
            fila[campo] = fila[campo].toString().trim();
          }
        });
      }

      function procesarDatos(datosOriginal, expandedIds) {
        if (!datosOriginal.length) {
          mostrarMensaje('El archivo de datos está vacío.');
          return;
        }
        const tbody = document.querySelector('#sinoptico tbody');
        tbody.textContent = '';

        // ===== Crear nodos de cliente y reestructurar jerarquía =====
        // 1) Mapear clientes existentes (Tipo === "Cliente")
        const clientes = {};
        datosOriginal.forEach(fila => {
          const tipo = (fila.Tipo || '').toString().trim().toLowerCase();
          if (tipo !== 'cliente') return;
          const nombre = (fila.Cliente || fila['Descripción'] || '').toString().trim();
          if (!nombre) return;
          if (!clientes[nombre]) {
            clientes[nombre] = { id: fila.ID, nombre, existente: true };
          }
        });

        // 2) Registrar clientes mencionados en otras filas
        let cliCounter = 1;
        datosOriginal.forEach(fila => {
          const cli = (fila.Cliente || '').toString().trim();
          if (!cli) return;
          if (!clientes[cli]) {
            clientes[cli] = { id: `cli-${cliCounter++}`, nombre: cli, existente: false };
          }
        });

        // 3) Crear filas virtuales para cada cliente detectado
        const filasClientes = Object.values(clientes)
          .filter(cli => !cli.existente)
          .map(cli => ({
            ID: cli.id,
            ParentID: '',
            Tipo: 'Cliente',
            Secuencia: '',
            Descripción: cli.nombre,
            Cliente: cli.nombre,
            Vehículo: '',
            RefInterno: '',
            versión: '',
            Imagen: '',
            Consumo: '',
            Unidad: '',
            Sourcing: '',
            Código: ''
          }));

        // 4) Reasignar las piezas finales para que cuelguen del cliente
        const datos = datosOriginal.map(row => {
          const r = { ...row };
          const cli = (r.Cliente || '').toString().trim();
          if (cli && clientes[cli] && !r.ParentID) {
            r.ParentID = clientes[cli].id;
          }
          return r;
        });

        // 5) Propagar cliente a los descendientes
        const mapId = {};
        [...filasClientes, ...datos].forEach(f => {
          mapId[f.ID] = f;
        });
        function propagateClient(fila) {
          if (fila.Cliente) return fila.Cliente;
          const padre = mapId[fila.ParentID];
          if (!padre) return '';
          const cli = propagateClient(padre);
          fila.Cliente = cli;
          return cli;
        }
        datos.forEach(propagateClient);

        const datosConClientes = [...filasClientes, ...datos];

        if (typeof Fuse !== 'undefined') {
          fuseSinoptico = new Fuse(datosConClientes, {
            keys: ['Descripción', 'Código', 'RefInterno'],
            threshold: 0.4
          });
        } else {
          fuseSinoptico = null;
          mostrarMensaje('Fuse.js no cargó – búsqueda deshabilitada', 'warning');
        }

        construirSinoptico(datosConClientes);
        const thAct = document.getElementById('thActions');
        if (thAct) thAct.style.display = sessionStorage.getItem('sinopticoEdit') === 'true' ? '' : 'none';
        // Colapsar todo para que la recarga no expanda la tabla por defecto
        if (sinopticoElem) colapsarTodo();
          setTimeout(() => {
            if (sinopticoElem) {
              ajustarIndentacion();
              applyColumnVisibility();
            }
            expandedIds.forEach(id => {
              showChildren(id);
              const btn = document.querySelector(`#sinoptico tbody tr[data-id="${id}"] .toggle-btn`);
              if (btn) {
                btn.textContent = '–';
                btn.setAttribute('data-expanded', 'true');
                btn.setAttribute('aria-expanded', 'true');
              }
            });
            if (sinopticoElem) aplicarFiltro();
            const sel = sessionStorage.getItem('maestroSelectedNumber');
            if (sel) {
              highlightRow(sel);
              sessionStorage.removeItem('maestroSelectedNumber');
            }
          }, 40);
      }


      async function loadData() {
        const expandedIds = sinopticoElem
          ? Array.from(
              document.querySelectorAll('#sinoptico tbody .toggle-btn[data-expanded="true"]')
            ).map(btn => btn.closest('tr').getAttribute('data-id'))
          : [];

        try {
          sinopticoData = await dataService.getAll();
        } catch (e) {
          console.error('Error loading data from Dexie', e);
          mostrarMensaje('No se pudo acceder a la base de datos');
          sinopticoData = [];
        }
        if (!Array.isArray(sinopticoData) || sinopticoData.length === 0) {
          sinopticoData = generarDatosIniciales();
        }

        if (sinopticoElem) {
          procesarDatos(sinopticoData, expandedIds);
        }
        Promise.resolve().then(() => {
          document.dispatchEvent(new CustomEvent('sinoptico-loaded'));
        });
      }

      // Llamo inmediatamente a loadData()
      loadData();
      // Deshabilitado el refresco automático para evitar que la tabla se colapse
      // setInterval(loadData, 30000);


      // Función recursiva para poblar la tabla desde datos con "ID" y "ParentID"
      function construirSinoptico(datos) {
        // a) Agrupar por ParentID
        const agrupadoPorPadre = {};
        datos.forEach(fila => {
          if (!fila.ID) return;
          const padre = (fila.ParentID || '').toString().trim();
          if (!agrupadoPorPadre[padre]) agrupadoPorPadre[padre] = [];
          agrupadoPorPadre[padre].push(fila);
        });
        // b) Ordenar cada grupo por Descripción (alfanumérico, sin distinguir mayúsculas)
        Object.keys(agrupadoPorPadre).forEach(key => {
          agrupadoPorPadre[key].sort((a, b) => {
            const da = (a['Descripción'] || '').toString().toLowerCase();
            const db = (b['Descripción'] || '').toString().toLowerCase();
            return da.localeCompare(db, undefined, { numeric: true, sensitivity: 'base' });
          });
        });

        // c) Dibujar filas recursivamente
        function dibujarNodos(parentID, nivel) {
          const isEditing = sessionStorage.getItem('sinopticoEdit') === 'true';
          const hijos = agrupadoPorPadre[parentID] || [];
          hijos.forEach(fila => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', fila.ID);
            tr.setAttribute('data-parent', (fila.ParentID || '').toString().trim());

            // Color según Tipo
            const tipoStr = (fila.Tipo || '').toString().trim().toLowerCase();
            if (tipoStr === 'cliente') tr.classList.add('fila-cliente');
            else if (tipoStr === 'pieza final') tr.classList.add('fila-pieza');
            else if (tipoStr === 'subensamble') tr.classList.add('fila-subens');
            else tr.classList.add('fila-oper');

            // Clase de nivel (0..6)
            tr.classList.add(`nivel-${nivel}`);

            // Celda “Item” con botón +/–, flecha y texto
            const tdItem = document.createElement('td');
            // Permitir que el texto se muestre completo
            tdItem.style.whiteSpace = 'normal';
            tdItem.style.overflow = 'visible';
            tdItem.style.textOverflow = 'unset';

            // ¿Tiene hijos este nodo?
            const tieneHijos =
              Array.isArray(agrupadoPorPadre[fila.ID]) &&
              agrupadoPorPadre[fila.ID].length > 0;
            const btnToggle = document.createElement('button');
            btnToggle.type = 'button';
            btnToggle.classList.add('toggle-btn');
            if (!tieneHijos) {
              btnToggle.classList.add('hidden');
            }
            btnToggle.textContent = '+'; // inicia colapsado
            btnToggle.setAttribute('data-expanded', 'false');
            btnToggle.setAttribute('aria-expanded', 'false');
            btnToggle.setAttribute('aria-label', 'Expandir');
            // Evento onclick
            btnToggle.addEventListener('click', () => {
              toggleNodo(btnToggle, fila.ID);
            });
            tdItem.appendChild(btnToggle);

            let nombreItem = (fila['Descripción'] || '').toString().trim();
            if (!nombreItem) {
              nombreItem = 'N/D';
            }

            if (nivel === 0) {
              // Nivel 0 (Cliente): texto en negrita, sin flecha
              const spanText = document.createElement('span');
              spanText.classList.add('item-text');
              const strong = document.createElement('strong');
              strong.textContent = nombreItem;
              spanText.appendChild(strong);
              tdItem.appendChild(spanText);
            } else {
              // Nivel ≥1: flecha + texto
              const spanArrow = document.createElement('span');
              spanArrow.classList.add(`arrow-nivel-${nivel}`);
              const spanText = document.createElement('span');
              spanText.classList.add('item-text');
              if (tipoStr === 'insumo') {
                const link = document.createElement('a');
                link.href = 'insumos.html';
                link.textContent = nombreItem;
                link.addEventListener('click', e => {
                  e.preventDefault();
                  sessionStorage.setItem('insumoQuery', nombreItem);
                  window.location.href = 'insumos.html';
                });
                spanText.appendChild(link);
              } else {
                spanText.textContent = nombreItem;
              }
              tdItem.appendChild(spanArrow);
              tdItem.appendChild(spanText);
            }
            tr.appendChild(tdItem);

            // Columnas fijas: Cliente, Vehículo, RefInterno, Versión
            ['Cliente', 'Vehículo', 'RefInterno', 'versión'].forEach(campo => {
              const td = document.createElement('td');
              td.textContent = fila[campo] ? fila[campo].toString().trim() : '';
              td.style.textAlign = 'center';
              tr.appendChild(td);
            });

            // Columna Imagen (miniatura)
            const tdImagen = document.createElement('td');
            const nombreImg = (fila['Imagen'] || '').toString().trim();
            if (nombreImg) {
              const img = document.createElement('img');
              img.src = `images/${nombreImg}`;
              img.alt = nombreItem;
              img.classList.add('img-product');
              tdImagen.appendChild(img);
            }
            tdImagen.style.textAlign = 'center';
            tr.appendChild(tdImagen);

            // Columnas: Consumo, Unidad, Sourcing, Código
            ['Consumo', 'Unidad', 'Sourcing', 'Código'].forEach(campo => {
              const td = document.createElement('td');
              td.textContent = fila[campo] ? fila[campo].toString().trim() : '';
              td.style.textAlign = 'center';
              tr.appendChild(td);
            });

            if (isEditing) {
              const tdAct = document.createElement('td');

              if (tipoStr === 'pieza final') {
                const addSub = document.createElement('button');
                addSub.textContent = '+ Subensamble';
                addSub.addEventListener('click', () => {
                  const count = sinopticoData.filter(r => r.ParentID === fila.ID && (r.Tipo||'').toLowerCase() === 'subensamble').length + 1;
                  const desc = `Subensamble ${count}`;
                  if (window.SinopticoEditor) window.SinopticoEditor.addNode({ ParentID: fila.ID, Tipo: 'Subensamble', Descripción: desc });
                });
                tdAct.appendChild(addSub);
              }

              if (tipoStr === 'subensamble') {
                const addIns = document.createElement('button');
                addIns.textContent = '+ Insumo';
                addIns.addEventListener('click', () => {
                  const nombre = prompt('Nombre del insumo');
                  if (!nombre) return;
                  const cant = prompt('Cantidad', '1');
                  if (window.SinopticoEditor) window.SinopticoEditor.addNode({ ParentID: fila.ID, Tipo: 'Insumo', Descripción: nombre, Consumo: cant });
                });
                tdAct.appendChild(addIns);
              }

              const editBtn = document.createElement('button');
              editBtn.textContent = 'Editar';
              editBtn.addEventListener('click', () => {
                const nuevo = prompt('Nueva descripción', fila['Descripción'] || '');
                if (nuevo !== null && window.SinopticoEditor) {
                  window.SinopticoEditor.updateNode(fila.ID, { Descripción: nuevo });
                }
              });
              tdAct.appendChild(editBtn);

              const del = document.createElement('button');
              del.textContent = 'Eliminar';
              del.addEventListener('click', () => {
                if (confirm(`¿Eliminar ${fila.Tipo} "${fila['Descripción']}" definitivamente?`)) {
                  if (window.SinopticoEditor) window.SinopticoEditor.deleteSubtree(fila.ID);
                }
              });
              tdAct.appendChild(del);

              tr.appendChild(tdAct);
            }

            document.querySelector('#sinoptico tbody').appendChild(tr);
            dibujarNodos(fila.ID.toString().trim(), nivel + 1);
          });
        }
        dibujarNodos('', 0);
      }

      /* ==================================================
         6) Ajustar indentación dinámica (nivel ≥ 1)
      ================================================== */
      function ajustarIndentacion() {
        const filas = Array.from(document.querySelectorAll('#sinoptico tbody tr'));

        // Almacenar anchos de cada fila (botón, flecha, texto)
        const widthMap = {};
        filas.forEach(tr => {
          const id = tr.getAttribute('data-id');
          if (!id) return;
          const td = tr.querySelector('td:first-child');
          let ancho = 0;
          const btn = td.querySelector('.toggle-btn:not(.hidden)');
          if (btn) ancho += btn.offsetWidth + parseInt(getComputedStyle(btn).marginRight);
          const arrow = td.querySelector('[class^="arrow-nivel-"]');
          if (arrow) ancho += arrow.offsetWidth + parseInt(getComputedStyle(arrow).marginRight);
          const text = td.querySelector('.item-text');
          if (text) ancho += text.offsetWidth;
          widthMap[id] = ancho + 12; // margen extra
        });

        // Calcular indentación de cada fila en un solo recorrido
        const indentMap = {};
        filas.forEach(tr => {
          const id = tr.getAttribute('data-id');
          const nivel = tr.classList.contains('nivel-0')
            ? 0
            : tr.classList.contains('nivel-1')
            ? 1
            : tr.classList.contains('nivel-2')
            ? 2
            : tr.classList.contains('nivel-3')
            ? 3
            : tr.classList.contains('nivel-4')
            ? 4
            : tr.classList.contains('nivel-5')
            ? 5
            : 6;

          const td = tr.querySelector('td:first-child');
          if (nivel === 0) {
            indentMap[id] = 8;
            td.style.paddingLeft = '8px';
            return;
          }

          const parentId = tr.getAttribute('data-parent');
          const indentParent = indentMap[parentId] || 8;
          const indent = indentParent + (widthMap[parentId] || 0);
          indentMap[id] = indent;
          td.style.paddingLeft = indent + 'px';
        });
      }

      function saveSinoptico() {
        if (typeof addHistoryEntry === 'function') {
          try { addHistoryEntry('sinopticoHistory', sinopticoData); } catch(e){}
        }
        if (typeof mostrarMensaje === 'function') {
          mostrarMensaje('Datos guardados', 'success');
        }
      }

      function generateId(){
        return Date.now().toString(36) + Math.random().toString(36).substr(2,5);
      }

      const createEditor =
        root.createSinopticoEditor ||
        (typeof require === 'function'
          ? require('../views/sinoptico.js').createSinopticoEditor
          : null);

      if (createEditor) {
        window.SinopticoEditor = createEditor({
          getData: () => sinopticoData,
          setData: d => { sinopticoData = d; },
          generateId,
          saveSinoptico,
          loadData,
          dataService,
        });
      }

      document.addEventListener('sinoptico-mode', () => {
        const thAct = document.getElementById('thActions');
        if (thAct) thAct.style.display = sessionStorage.getItem('sinopticoEdit') === 'true' ? '' : 'none';
        loadData();
      });

      if (dataService && dataService.subscribeToChanges) {
        dataService.subscribeToChanges(() => loadData());
      }

      root.renderSinoptico = datos => {
        sinopticoData = Array.isArray(datos) ? datos.slice() : [];
        procesarDatos(sinopticoData, []);
      };

      function renderSimpleTable(containerId, rows) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const old = container.querySelector('table');
        if (old) {
          if (root.animateRemove) {
            root.animateRemove(old, () => old.remove());
          } else {
            old.remove();
          }
        } else {
          container.textContent = '';
        }

        const table = document.createElement('table');
        table.id = containerId;
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        table.appendChild(thead);
        table.appendChild(tbody);
        container.appendChild(table);

        if (!Array.isArray(rows) || rows.length === 0) return;
        const cols = Object.keys(rows[0]);
        const headRow = document.createElement('tr');
        cols.forEach(c => {
          const th = document.createElement('th');
          th.textContent = c;
          headRow.appendChild(th);
        });
        thead.appendChild(headRow);

        rows.forEach(r => {
          const tr = document.createElement('tr');
          cols.forEach(c => {
            const td = document.createElement('td');
            td.textContent = r[c] == null ? '' : r[c];
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
          if (root.animateInsert) root.animateInsert(tr);
        });
      }

      root.renderAMFE = rows => {
        renderSimpleTable('amfe', Array.isArray(rows) ? rows : []);
      };

    }); // FIN DOMContentLoaded
