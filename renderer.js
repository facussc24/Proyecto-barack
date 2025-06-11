    document.addEventListener('DOMContentLoaded', () => {
      const fs = window.require ? window.require("fs") : null;
      const pathModule = window.require ? window.require("path") : null;
      const csvFile = pathModule ? pathModule.join(__dirname, "data", "sinoptico.csv") : "data/sinoptico.csv";
      let fuseSinoptico = null;
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
        const div = document.getElementById('mensaje');
        div.textContent = texto;
        div.style.display = 'block';
        div.style.backgroundColor = tipo === 'error' ? '#e74c3c' : '#f39c12';
        div.style.color = '#ffffff';
      }

      function aplicarFiltro() {
        const criterio = document.getElementById('filtroInsumo').value.trim().toLowerCase();
        const incluirAncestros = document.getElementById('chkIncluirAncestros').checked;
        const mostrar0 = document.getElementById('chkMostrarNivel0').checked;
        const mostrar1 = document.getElementById('chkMostrarNivel1').checked;
        const mostrar2 = document.getElementById('chkMostrarNivel2').checked;
        const mostrar3 = document.getElementById('chkMostrarNivel3').checked;

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

        if (!criterio) {
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

        // Con texto: ocultar todo y luego mostrar coincidencias + ancestros
        todasFilas.forEach(tr => (tr.style.display = 'none'));
        todasFilas.forEach(tr => {
          const textoFila = tr.textContent.toLowerCase();
          if (textoFila.includes(criterio)) {
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
          } else {
            aplicarFiltro();
          }
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
          aplicarFiltro();
        });
      }
      document.getElementById('chkIncluirAncestros').addEventListener('change', aplicarFiltro);
      document.getElementById('chkMostrarNivel0').addEventListener('change', aplicarFiltro);
      document.getElementById('chkMostrarNivel1').addEventListener('change', aplicarFiltro);
      document.getElementById('chkMostrarNivel2').addEventListener('change', aplicarFiltro);
      document.getElementById('chkMostrarNivel3').addEventListener('change', aplicarFiltro);

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
            input.value = row['Descripción'];
            suggestionList.style.display = 'none';
            suggestionList.innerHTML = '';
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
      document.getElementById('expandirTodo').addEventListener('click', expandirTodo);
      document.getElementById('colapsarTodo').addEventListener('click', colapsarTodo);
      document.getElementById('btnRefrescar').addEventListener('click', loadData);

      /* ==================================================
         4) Exportar a Excel (solo filas visibles)
      ================================================== */
      document.getElementById('btnExcel').addEventListener('click', () => {
        const filasVisibles = [];
        // Encabezados (solo los <th> visibles)
        const encabezados = Array.from(
          document.querySelectorAll('#sinoptico thead th')
        )
          .filter(th => th.style.display !== 'none')
          .map(th => th.textContent.trim());
        filasVisibles.push(encabezados);

        // Filas visibles
        document.querySelectorAll('#sinoptico tbody tr').forEach(tr => {
          if (tr.style.display === '') {
            // Solo las celdas <td> que correspondan a encabezados visibles
            const celdas = Array.from(tr.querySelectorAll('td'))
              .filter((td, idx) => {
                const th = document.querySelector(`#sinoptico thead th:nth-child(${idx + 1})`);
                return th && th.style.display !== 'none';
              })
              .map(td => td.textContent.trim());
            filasVisibles.push(celdas);
          }
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(filasVisibles);
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
      }

      function procesarDatos(datosOriginal, expandedIds) {
        if (!datosOriginal.length) {
          mostrarMensaje('sinoptico.csv se cargó, pero está vacío.');
          return;
        }
        const tbody = document.querySelector('#sinoptico tbody');
        tbody.textContent = '';

        // ===== Crear nodos de cliente y reestructurar jerarquía =====
        // 1) Encontrar clientes únicos a partir de la columna "Cliente"
        const clientes = {};
        datosOriginal.forEach(fila => {
          const cli = (fila.Cliente || '').toString().trim();
          if (cli && !clientes[cli]) {
            const id = `cli-${Object.keys(clientes).length + 1}`;
            clientes[cli] = { id, nombre: cli };
          }
        });

        // 2) Crear filas virtuales para cada cliente detectado
        const filasClientes = Object.values(clientes).map(cli => ({
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

        // 3) Reasignar las piezas finales para que cuelguen del cliente
        const datos = datosOriginal.map(row => {
          const r = { ...row };
          const cli = (r.Cliente || '').toString().trim();
          if (cli && clientes[cli] && !r.ParentID) {
            r.ParentID = clientes[cli].id;
          }
          return r;
        });

        // 4) Propagar cliente a los descendientes
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
        }

        construirSinoptico(datosConClientes);
        // Colapsar todo para que la recarga no expanda la tabla por defecto
        colapsarTodo();
          setTimeout(() => {
            ajustarIndentacion();
            applyColumnVisibility();
            expandedIds.forEach(id => {
              showChildren(id);
              const btn = document.querySelector(`#sinoptico tbody tr[data-id="${id}"] .toggle-btn`);
              if (btn) {
                btn.textContent = '–';
                btn.setAttribute('data-expanded', 'true');
                btn.setAttribute('aria-expanded', 'true');
              }
            });
            aplicarFiltro();
            const sel = sessionStorage.getItem('maestroSelectedNumber');
            if (sel) {
              const filas = Array.from(
                document.querySelectorAll('#sinoptico tbody tr')
              );
              const fila = filas.find(tr =>
                tr.textContent.toLowerCase().includes(sel.toLowerCase())
              );
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
                setTimeout(() => fila.classList.remove('highlight'), 2000);
              }
              sessionStorage.removeItem('maestroSelectedNumber');
            }
          }, 40);
      }

      function loadDataFromCSV(expandedIds) {
        const noCacheUrl = `data/sinoptico.csv?v=${Date.now()}`;
        Papa.parse(noCacheUrl, {
          download: true,
          header: true,
          skipEmptyLines: true,
          delimiter: ';',
          complete(results) {
            if (results.errors.length) {
              console.error('Errores al parsear CSV:', results.errors);
              tryLoadXlsx(expandedIds);
              return;
            }
            const datosOriginal = results.data;
            datosOriginal.forEach(normalizarFila);
            procesarDatos(datosOriginal, expandedIds);
          },
          error() {
            tryLoadXlsx(expandedIds);
          }
        });
      }

      function tryLoadXlsx(expandedIds) {
        fetch('data/sinoptico.xlsx')
          .then(resp => {
            if (!resp.ok) throw new Error('No xlsx');
            return resp.arrayBuffer();
          })
          .then(buffer => {
            const wb = XLSX.read(buffer, { type: 'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const datosOriginal = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            datosOriginal.forEach(normalizarFila);
            procesarDatos(datosOriginal, expandedIds);
          })
          .catch(err => {
            console.error('Error al leer sinoptico.xlsx:', err);
            mostrarMensaje('No se pudo cargar sinoptico.csv ni sinoptico.xlsx.');
          });
      }

      function loadData() {
        // Guardar IDs de filas actualmente expandidas antes de limpiar
        const expandedIds = Array.from(
          document.querySelectorAll('#sinoptico tbody .toggle-btn[data-expanded="true"]')
        ).map(btn => btn.closest('tr').getAttribute('data-id'));

        if (fs) {
          try {
            const csvText = fs.readFileSync(csvFile, { encoding: 'latin1' });
            const results = Papa.parse(csvText, {
              header: true,
              skipEmptyLines: true,
              delimiter: ';'
            });
            if (results.errors.length) {
              throw new Error('CSV parse error');
            }
            const datosOriginal = results.data;
            datosOriginal.forEach(normalizarFila);
            procesarDatos(datosOriginal, expandedIds);
            return;
          } catch (err) {
            console.error('Error al leer sinoptico.csv:', err);
            try {
              const xlsxBuffer = fs.readFileSync(
                pathModule.join(__dirname, 'data', 'sinoptico.xlsx')
              );
              const wb = XLSX.read(xlsxBuffer, { type: 'buffer' });
              const sheet = wb.Sheets[wb.SheetNames[0]];
              const datosOriginal = XLSX.utils.sheet_to_json(sheet, { defval: '' });
              datosOriginal.forEach(normalizarFila);
              procesarDatos(datosOriginal, expandedIds);
              return;
            } catch (e2) {
              console.error('Error al leer sinoptico.xlsx:', e2);
              mostrarMensaje('No se pudo cargar sinoptico.csv ni sinoptico.xlsx.');
              return;
            }
          }
        }

        loadDataFromCSV(expandedIds);
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
        // b) Ordenar cada grupo según Secuencia
        Object.keys(agrupadoPorPadre).forEach(key => {
          agrupadoPorPadre[key].sort((a, b) => {
            const sa = parseInt(a.Secuencia) || 0;
            const sb = parseInt(b.Secuencia) || 0;
            return sa - sb;
          });
        });

        // c) Dibujar filas recursivamente
        function dibujarNodos(parentID, nivel) {
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
              spanText.textContent = nombreItem;
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
        const todasFilas = Array.from(document.querySelectorAll('#sinoptico tbody tr'));
        const mapIdToRow = {};
        todasFilas.forEach(tr => {
          const id = tr.getAttribute('data-id');
          if (id) mapIdToRow[id] = tr;
        });

        // Cache de indentaciones
        const indentCache = {};

        function obtenerIndent(tr) {
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
          if (nivel === 0) {
            return 8; // padding-left fijo para nivel 0
          }
          const id = tr.getAttribute('data-id');
          if (indentCache[id] !== undefined) {
            return indentCache[id];
          }
          // Obtener fila padre
          const parentId = tr.getAttribute('data-parent');
          const filaPadre = mapIdToRow[parentId];
          if (!filaPadre) {
            indentCache[id] = 8;
            return 8;
          }
          // Indent del padre
          const indentPadre = obtenerIndent(filaPadre);
          // Medir anchos: botón toggle + flecha + texto del padre
          const tdPadre = filaPadre.querySelector('td:first-child');
          let anchoToggle = 0,
            anchoArrow = 0,
            anchoText = 0;
          const spanToggle = tdPadre.querySelector('.toggle-btn:not(.hidden)');
          if (spanToggle)
            anchoToggle =
              spanToggle.offsetWidth + parseInt(getComputedStyle(spanToggle).marginRight);
          const spanArrowPadre = tdPadre.querySelector(`[class^="arrow-nivel-"]`);
          if (spanArrowPadre)
            anchoArrow =
              spanArrowPadre.offsetWidth +
              parseInt(getComputedStyle(spanArrowPadre).marginRight);
          const spanTextPadre = tdPadre.querySelector('.item-text');
          if (spanTextPadre) anchoText = spanTextPadre.offsetWidth;

          const margenExtra = 4; // sólo 4px en lugar de 8px
          const indentActual = indentPadre + anchoToggle + anchoArrow + anchoText + margenExtra;
          indentCache[id] = indentActual;
          return indentActual;
        }

        todasFilas.forEach(tr => {
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
          if (nivel === 0) return;
          const indent = obtenerIndent(tr);
          const tdHijo = tr.querySelector('td:first-child');
          tdHijo.style.paddingLeft = indent + 'px';
        });
      }

    }); // FIN DOMContentLoaded
