import { showSaveStatus } from './utils/status.js';

document.addEventListener('DOMContentLoaded', () => {
    const App = {
        // --- ESTADO Y CONFIGURACIÓN ---
        state: {
            products: [],
            history: [],
            docKeys: [],
            dependencies: {}
        },
        currentUser: 'admin.user',

        // --- REFERENCIAS AL DOM ---
        dom: {
            tableBody: document.getElementById('maestro-table-body'),
            tableHead: document.querySelector('#main-table thead'),
            addProductBtn: document.getElementById('addProductBtn'),
            manageColsBtn: document.getElementById('manageColsBtn'),
            showHistoryBtn: document.getElementById('showHistoryBtn'),
            exportExcelBtn: document.getElementById('exportExcelBtn'),
            exportPdfBtn: document.getElementById('exportPdfBtn'),
            searchInput: document.getElementById('searchInput'),
            modalContainer: document.getElementById('modal-container'),
            toastContainer: document.getElementById('toast-container'),
            noResults: document.getElementById('no-results'),
            dependencyInfo: document.getElementById('dependency-info')
        },

        storage: {
            save() {
                localStorage.setItem('maestroState_v3.1', JSON.stringify(App.state));
            },
            load() {
                const storedState = localStorage.getItem('maestroState_v3.1');
                if (storedState) {
                    App.state = JSON.parse(storedState);
                    if (!App.state.dependencies) {
                        App.state.dependencies = { 'Flujograma': ['AMFE', 'Hoja de Operaciones'] };
                    }
                } else {
                    App.state.docKeys = ['Flujograma', 'AMFE', 'Hoja de Operaciones', 'Plano'];
                    App.state.dependencies = { 'Flujograma': ['AMFE', 'Hoja de Operaciones'] };
                    App.state.products = [
                        { id: 1, name: 'Producto A-100', notificado: true, data: { 'Flujograma': { rev: '05', link: 'ruta/a/flujo' }, 'AMFE': { rev: '03', link: 'ruta/a/amfe' }, 'Hoja de Operaciones': { rev: '09', link: 'ruta/a/ho' }, 'Plano': {rev: 'C', link: 'ruta/a/plano'}}},
                        { id: 2, name: 'Componente X-01', notificado: false, data: { 'Flujograma': { rev: '11', link: 'ruta/x/flujo' }, 'AMFE': { rev: '', link: '' }, 'Hoja de Operaciones': { rev: '', link: '' }, 'Plano': {rev: 'A', link: 'ruta/x/plano'}}}
                    ];
                }
            }
        },

        logic: {
            logHistory(productId, docKey, field, oldValue, newValue) {
                const productName = App.state.products.find(p => p.id === productId)?.name || 'N/A';
                App.state.history.unshift({
                    timestamp: new Date().toLocaleString('es-AR'),
                    usuario: App.currentUser,
                    producto: productName,
                    documento: `${docKey} (${field})`,
                    antes: oldValue,
                    despues: newValue
                });
            },

            checkAndResolveSemaphore(productId) {
                const product = App.state.products.find(p => p.id === productId);
                if (!product) return;
                product.notificado = App.state.docKeys.every(key => product.data[key] && product.data[key].rev);
            },

            addNewProduct(name) {
                showSaveStatus('Guardando...');
                const newId = App.state.products.length > 0 ? Math.max(...App.state.products.map(p => p.id)) + 1 : 1;
                const newProductData = {};
                App.state.docKeys.forEach(key => { newProductData[key] = { rev: '', link: '' }; });
                App.state.products.push({ id: newId, name: name.trim(), notificado: false, data: newProductData });
                this.logHistory(newId, 'Producto', 'creado', '', name.trim());
                App.storage.save();
                App.init();
                showSaveStatus('Guardado \u2713');
                App.ui.showToast('Producto añadido correctamente', 'success');
            },

            deleteProduct(productId) {
                const product = App.state.products.find(p => p.id === productId);
                if(product) {
                    showSaveStatus('Guardando...');
                    App.state.products = App.state.products.filter(p => p.id !== productId);
                    this.logHistory(productId, 'Producto', 'eliminado', product.name, 'N/A');
                    App.storage.save();
                    App.render.table();
                    showSaveStatus('Guardado \u2713');
                    App.ui.showToast('Producto eliminado', 'error');
                }
            },

            handleCellEdit(cell, productId, docKey, field) {
                const product = App.state.products.find(p => p.id === productId);
                if (!product) return;
                const oldValue = product.data[docKey][field];
                const newValue = cell.innerText.trim();
                if (oldValue !== newValue) {
                    showSaveStatus('Guardando...');
                    product.data[docKey][field] = newValue;
                    this.logHistory(productId, docKey, field, oldValue, newValue);
                    const dependents = App.state.dependencies[docKey];
                    if (dependents && field === 'rev') {
                        dependents.forEach(dependentKey => {
                            if (product.data[dependentKey]) {
                                const depOldRev = product.data[dependentKey].rev;
                                const depOldLink = product.data[dependentKey].link;
                                if(depOldRev) this.logHistory(productId, dependentKey, 'rev', depOldRev, '');
                                if(depOldLink) this.logHistory(productId, dependentKey, 'link', depOldLink, '');
                                product.data[dependentKey].rev = '';
                                product.data[dependentKey].link = '';
                            }
                        });
                    }
                    this.checkAndResolveSemaphore(productId);
                    App.storage.save();
                    App.render.table(App.dom.searchInput.value);
                    showSaveStatus('Guardado \u2713');
                }
            }
        },

        render: {
            table(filter = '') {
                this.headers();
                this.dependencyInfo();
                const filteredProducts = App.state.products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
                App.dom.tableBody.innerHTML = '';
                App.dom.noResults.classList.toggle('hidden', filteredProducts.length > 0);
                filteredProducts.forEach(product => {
                    const row = document.createElement('tr');
                    row.className = `transition-colors duration-300 ${product.notificado ? 'semaphore-green' : 'semaphore-red'}`;
                    let cells = `<td class="p-3 font-medium text-gray-900">${product.name}</td>`;
                    App.state.docKeys.forEach(key => {
                        const docData = product.data[key] || { rev: '', link: '' };
                        cells += `
                            <td class="p-1 text-center" data-product-id="${product.id}" data-doc-key="${key}" data-field="rev" contenteditable="true">${docData.rev}</td>
                            <td class="p-1 text-center" data-product-id="${product.id}" data-doc-key="${key}" data-field="link" contenteditable="true">${docData.link}</td>
                        `;
                    });
                    cells += `
                        <td class="p-3 text-center">
                            <button class="text-gray-400 hover:text-red-600 delete-btn" data-product-id="${product.id}"><i class="fas fa-trash-alt"></i></button>
                        </td>`;
                    row.innerHTML = cells;
                    App.dom.tableBody.appendChild(row);
                });
            },
            headers() {
                App.dom.tableHead.innerHTML = `
                    <tr>
                        <th rowspan="2" class="p-3 align-middle">Producto</th>
                        ${App.state.docKeys.map(key => `<th colspan="2" class="p-3 text-center border-l">${key}</th>`).join('')}
                        <th rowspan="2" class="p-3 align-middle text-center border-l">Acciones</th>
                    </tr>
                    <tr class="text-gray-400">
                        ${App.state.docKeys.map(() => `<th class="p-2 font-medium text-center border-l">Rev.</th><th class="p-2 font-medium text-center">Link</th>`).join('')}
                    </tr>
                `;
            },
            dependencyInfo() {
                let infoHtml = '<strong>Reglas de Dependencia Activas:</strong><ul class="list-disc list-inside mt-1">';
                const activeRules = Object.entries(App.state.dependencies).filter(([_, deps]) => deps.length > 0);
                if (activeRules.length === 0) {
                    infoHtml += '<li>No hay dependencias configuradas.</li>';
                } else {
                    activeRules.forEach(([trigger, dependents]) => {
                        infoHtml += `<li>Al cambiar la revisión de <strong>${trigger}</strong>, se requerirá actualizar: <strong>${dependents.join(', ')}</strong>.</li>`;
                    });
                }
                infoHtml += '</ul>';
                App.dom.dependencyInfo.innerHTML = infoHtml;
            }
        },

        ui: {
            showToast(message, type = 'info') {
                const colors = { info: 'bg-corporate', success: 'bg-green-600', error: 'bg-red-600' };
                const toast = document.createElement('div');
                toast.className = `toast text-white py-3 px-5 rounded-lg shadow-xl ${colors[type]}`;
                toast.textContent = message;
                App.dom.toastContainer.appendChild(toast);
                setTimeout(() => toast.remove(), 4000);
            },


            showModal(title, content, onConfirm, confirmText = 'Confirmar', maxWidth = 'max-w-md') {
                const modalId = `modal-${Date.now()}`;
                const modalHTML = `
                    <div id="${modalId}" class="modal-backdrop fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
                        <div class="modal-content bg-white rounded-lg shadow-xl w-full ${maxWidth} flex flex-col max-h-[90vh]">
                            <div class="p-5 border-b bg-gray-50 rounded-t-lg flex-shrink-0 flex justify-between items-center">
                                <h3 class="text-xl font-semibold text-corporate">${title}</h3>
                                <button class="close-modal-btn text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
                            </div>
                            <div class="p-5 flex-grow overflow-y-auto">${content}</div>
                            <div class="p-4 bg-gray-50 border-t flex-shrink-0 flex justify-end gap-3 rounded-b-lg">
                                <button class="cancel-modal-btn bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                                <button class="confirm-modal-btn bg-corporate hover:bg-corporate-dark text-white font-bold py-2 px-4 rounded-lg">${confirmText}</button>
                            </div>
                        </div>
                    </div>`;
                App.dom.modalContainer.innerHTML = modalHTML;
                const modal = document.getElementById(modalId);
                const form = modal.querySelector('form');
                const closeModal = () => modal.remove();
                modal.querySelector('.close-modal-btn').onclick = closeModal;
                modal.querySelector('.cancel-modal-btn').onclick = closeModal;
                modal.querySelector('.confirm-modal-btn').onclick = () => { if (onConfirm(modal)) closeModal(); };
                if (form) form.onsubmit = (e) => { e.preventDefault(); if (onConfirm(modal)) closeModal(); };
            }
        },

        init() {
            this.storage.load();
            this.render.table();
            this.dom.addProductBtn.onclick = () => {
                const content = `<form><label for="productName" class="block text-sm font-medium text-gray-700">Nombre del Producto</label><input type="text" id="productName" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-corporate" required autofocus></form>`;
                App.ui.showModal('Añadir Nuevo Producto', content, (modal) => {
                    const input = modal.querySelector('#productName');
                    if (input.value.trim()) { App.logic.addNewProduct(input.value); return true; }
                    return false;
                }, 'Añadir');
            };
            this.dom.manageColsBtn.onclick = () => {
                let content = '<div class="space-y-4">';
                content += '<div><h4 class="font-semibold mb-2">Columnas Actuales</h4><div id="cols-list" class="space-y-2">';
                App.state.docKeys.forEach(key => {
                    content += `<div class="flex items-center justify-between p-2 bg-gray-100 rounded-md"><span>${key}</span><button class="delete-col-btn text-red-500 hover:text-red-700 font-bold text-xl" data-key="${key}">&times;</button></div>`;
                });
                content += '</div></div>';
                content += '<div><h4 class="font-semibold mb-2">Reglas de Dependencia</h4><p class="text-xs text-gray-500 mb-2">Marca qué columnas se deben actualizar cuando cambia la revisión de una columna "disparadora".</p><div class="space-y-3">';
                App.state.docKeys.forEach(triggerKey => {
                    content += `<div class="p-3 border rounded-md"><strong class="font-medium">${triggerKey}</strong> <span class="text-gray-500 text-xs">(disparador)</span><div class="grid grid-cols-2 gap-2 mt-2">`;
                    App.state.docKeys.forEach(dependentKey => {
                        if (triggerKey !== dependentKey) {
                            const isChecked = App.state.dependencies[triggerKey]?.includes(dependentKey) || false;
                            content += `<div><label class="flex items-center text-sm"><input type="checkbox" class="dependency-cb form-checkbox rounded text-corporate" data-trigger="${triggerKey}" data-dependent="${dependentKey}" ${isChecked ? 'checked' : ''}> <span class="ml-2">${dependentKey}</span></label></div>`;
                        }
                    });
                    content += '</div></div>';
                });
                content += '</div></div>';
                content += `<form class="mt-4 flex gap-2"><input type="text" id="newColName" placeholder="Nombre nueva columna" class="flex-grow border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-corporate"><button type="submit" class="bg-corporate text-white px-4 rounded-md hover:bg-corporate-dark">Añadir</button></form>`;
                content += '</div>';
                App.ui.showModal('Gestionar Documentos y Reglas', content, () => { App.init(); return true; }, 'Cerrar y Guardar', 'max-w-2xl');
                const modal = App.dom.modalContainer.querySelector('.modal-backdrop');
                modal.querySelector('form').onsubmit = e => {
                    e.preventDefault();
                    const input = modal.querySelector('#newColName');
                    const newColName = input.value.trim();
                    if (newColName && !App.state.docKeys.includes(newColName)) {
                        App.state.docKeys.push(newColName);
                        App.state.dependencies[newColName] = [];
                        App.state.products.forEach(p => p.data[newColName] = { rev: '', link: '' });
                        input.value = '';
                        App.ui.showToast(`Columna "${newColName}" añadida`, 'success');
                        modal.querySelector('.close-modal-btn').click();
                        this.dom.manageColsBtn.click();
                    }
                };
                modal.querySelectorAll('.delete-col-btn').forEach(btn => {
                    btn.onclick = () => {
                        const keyToDelete = btn.dataset.key;
                        if (confirm(`¿Seguro que quieres eliminar la columna "${keyToDelete}" y todos sus datos?`)) {
                            App.state.docKeys = App.state.docKeys.filter(k => k !== keyToDelete);
                            delete App.state.dependencies[keyToDelete];
                            for (const key in App.state.dependencies) {
                                App.state.dependencies[key] = App.state.dependencies[key].filter(d => d !== keyToDelete);
                            }
                            App.state.products.forEach(p => delete p.data[keyToDelete]);
                            modal.querySelector('.close-modal-btn').click();
                            this.dom.manageColsBtn.click();
                        }
                    }
                });
                modal.querySelectorAll('.dependency-cb').forEach(cb => {
                    cb.onchange = () => {
                        const trigger = cb.dataset.trigger;
                        const dependent = cb.dataset.dependent;
                        if (!App.state.dependencies[trigger]) App.state.dependencies[trigger] = [];
                        if (cb.checked) {
                            if (!App.state.dependencies[trigger].includes(dependent)) {
                                App.state.dependencies[trigger].push(dependent);
                            }
                        } else {
                            App.state.dependencies[trigger] = App.state.dependencies[trigger].filter(d => d !== dependent);
                        }
                        App.storage.save();
                    };
                });
            };
            this.dom.showHistoryBtn.onclick = () => {
                let historyHtml = App.state.history.length ? App.state.history.map(h => `
                    <tr class="text-sm border-b border-gray-200">
                        <td class="p-3">${h.timestamp}</td>
                        <td class="p-3">${h.usuario}</td>
                        <td class="p-3 font-semibold">${h.producto}</td>
                        <td class="p-3">${h.documento}</td>
                        <td class="p-3 text-red-600">${h.antes}</td>
                        <td class="p-3 text-green-600">${h.despues}</td>
                    </tr>`).join('') : `<tr><td colspan="6" class="p-8 text-center text-gray-500">No hay historial.</td></tr>`;
                const content = `<div class="max-h-[60vh] overflow-y-auto"><table class="w-full text-left"><thead class="text-xs uppercase bg-gray-100"><tr class="border-b-2 border-gray-300"><th class="p-3">Fecha</th><th>Usuario</th><th>Producto</th><th>Documento</th><th>Valor Anterior</th><th>Valor Nuevo</th></tr></thead><tbody>${historyHtml}</tbody></table></div>`;
                App.ui.showModal('Historial de Cambios', content, () => true, 'Cerrar', 'max-w-4xl');
            };
            this.dom.tableBody.addEventListener('focusin', e => {
                const cell = e.target;
                if (cell.isContentEditable) {
                    cell.addEventListener('blur', () => { App.logic.handleCellEdit(cell, parseInt(cell.dataset.productId), cell.dataset.docKey, cell.dataset.field); }, { once: true });
                }
            });
            this.dom.tableBody.addEventListener('click', e => {
                const deleteBtn = e.target.closest('.delete-btn');
                if (deleteBtn) {
                    const productId = parseInt(deleteBtn.dataset.productId);
                    const productName = App.state.products.find(p => p.id === productId)?.name;
                    const content = `<p>¿Estás seguro de que quieres eliminar el producto <strong>"${productName}"</strong>? Esta acción no se puede deshacer.</p>`;
                    App.ui.showModal('Confirmar Eliminación', content, () => { App.logic.deleteProduct(productId); return true; }, 'Eliminar');
                }
            });
            this.dom.searchInput.onkeyup = e => this.render.table(e.target.value);
            this.dom.exportExcelBtn.onclick = () => App.export.toExcel();
            this.dom.exportPdfBtn.onclick = () => App.export.toPdf();
            App.export = {
                toExcel() {
                    const dataMaestro = App.state.products.map(p => {
                        const row = { Estado: p.notificado ? 'Al día' : 'Pendiente', Producto: p.name };
                        App.state.docKeys.forEach(key => {
                            row[`${key} Rev.`] = p.data[key]?.rev || '';
                            row[`${key} Link`] = p.data[key]?.link || '';
                        });
                        return row;
                    });
                    const wsMaestro = XLSX.utils.json_to_sheet(dataMaestro);
                    const wsHistory = XLSX.utils.json_to_sheet(App.state.history);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, wsMaestro, "Listado Maestro");
                    XLSX.utils.book_append_sheet(wb, wsHistory, "Historial");
                    XLSX.writeFile(wb, "ListadoMaestro.xlsx");
                    App.ui.showToast('Exportado a Excel', 'success');
                },
                toPdf() {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF({ orientation: 'landscape' });
                    const headStyles = { fillColor: [68, 84, 106] };
                    doc.text("Listado Maestro de Documentación", 14, 15);
                    doc.autoTable({ 
                        startY: 20,
                        head: [['Producto', ...App.state.docKeys.flatMap(k => [`${k} Rev.`, `${k} Link`])]],
                        body: App.state.products.map(p => [p.name, ...App.state.docKeys.flatMap(k => [p.data[k]?.rev || '', p.data[k]?.link || ''])]),
                        headStyles: headStyles
                    });
                    doc.addPage();
                    doc.text("Historial de Cambios", 14, 15);
                    doc.autoTable({
                        startY: 20,
                        head: [['Fecha', 'Usuario', 'Producto', 'Documento', 'Antes', 'Después']],
                        body: App.state.history.map(h => [h.timestamp, h.usuario, h.producto, h.documento, h.antes, h.despues]),
                        headStyles: headStyles
                    });
                    doc.save("ListadoMaestro.pdf");
                    App.ui.showToast('Exportado a PDF', 'success');
                }
            };
        }
    };
    App.init();
});
