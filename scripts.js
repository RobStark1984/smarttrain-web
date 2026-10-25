const initialOperators = [
    { id: 1, nombre: "Carlos Mendoza Silva", area: "Ensamble A", turno: "Matutino", curso: "Seguridad en Línea y ESD", vencimiento: "2026-11-20" },
    { id: 2, nombre: "Ana Sofía Ramírez", area: "Pruebas Funcionales", turno: "Vespertino", curso: "Operación de Equipos ICT", vencimiento: "2026-10-28" },
    { id: 3, nombre: "Miguel Ángel Torres", area: "SMT / Tarjetas", turno: "Nocturno", curso: "Soldadura IPC-A-610", vencimiento: "2026-09-15" },
    { id: 4, nombre: "Laura Beatriz Gómez", area: "Moldeo e Inyección", turno: "Matutino", curso: "Manejo de Residuos Peligrosos", vencimiento: "2026-12-10" }
];

let catalog = [
    { id: "CUR-01", nombre: "Seguridad en Línea y ESD", area: "Ensamble A", vigencia: "12 meses" },
    { id: "CUR-02", nombre: "Operación de Equipos ICT", area: "Pruebas Funcionales", vigencia: "6 meses" },
    { id: "CUR-03", nombre: "Soldadura IPC-A-610", area: "SMT / Tarjetas", vigencia: "12 meses" },
    { id: "CUR-04", nombre: "Manejo de Residuos Peligrosos", area: "Moldeo e Inyección", vigencia: "24 meses" }
];

let operators = JSON.parse(localStorage.getItem('smarttrain_all_operators')) || initialOperators;

function saveToLocalStorage() {
    localStorage.setItem('smarttrain_all_operators', JSON.stringify(operators));
}

document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
    renderNotifications();
    renderCatalog();
    renderQRSelect();
    renderAnalytics();
});

// Navegación por pestañas
function switchTab(tabId) {
    const tabs = ['dashboard', 'notifications', 'reports', 'qr', 'catalog', 'analytics'];
    tabs.forEach(t => {
        document.getElementById(`section-${t}`).classList.add('hidden');
        document.getElementById(`tab-btn-${t}`).className = "px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors cursor-pointer";
    });
    document.getElementById(`section-${tabId}`).classList.remove('hidden');
    document.getElementById(`tab-btn-${tabId}`).className = "px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white transition-colors cursor-pointer";
}

// Renderizar Tablero principal (PBI-01, PBI-02, PBI-03)[cite: 1]
function renderDashboard(dataToRender = operators) {
    const tbody = document.getElementById('operators-table-body');
    tbody.innerHTML = '';

    let countGreen = 0, countYellow = 0, countRed = 0;

    dataToRender.forEach(op => {
        const statusInfo = calculateStatus(op.vencimiento);
        if (statusInfo.type === 'green') countGreen++;
        else if (statusInfo.type === 'yellow') countYellow++;
        else if (statusInfo.type === 'red') countRed++;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-700/30 transition-colors";
        tr.innerHTML = `
            <td class="py-3 px-3 font-medium text-white">${op.nombre}</td>
            <td class="py-3 px-3 text-slate-300">${op.area} <span class="text-xs text-indigo-400">(${op.turno || 'Matutino'})</span></td>
            <td class="py-3 px-3 text-slate-300">${op.curso}</td>
            <td class="py-3 px-3 text-slate-300 font-mono text-xs">${op.vencimiento}</td>
            <td class="py-3 px-3 text-center">
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.badgeClass}">
                    <span class="w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}"></span>
                    ${statusInfo.label} (${statusInfo.days})
                </span>
            </td>
            <td class="py-3 px-3 text-right space-x-2">
                <button onclick="editOperator(${op.id})" class="text-indigo-400 hover:text-indigo-300 p-1 cursor-pointer"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="deleteOperator(${op.id})" class="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('stat-total').innerText = operators.length;
    document.getElementById('stat-green').innerText = countGreen;
    document.getElementById('stat-yellow').innerText = countYellow;
    document.getElementById('stat-red').innerText = countRed;
}

// Cálculo de días y semáforo (PBI-03)[cite: 1]
function calculateStatus(vencimientoStr) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const expiryDate = new Date(vencimientoStr + 'T00:00:00');
    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { type: 'red', label: 'Vencido', days: Math.abs(diffDays) + 'd vdo', badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', dotClass: 'bg-rose-400' };
    } else if (diffDays <= 30) {
        return { type: 'yellow', label: 'Por Vencer', days: diffDays + 'd rest', badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', dotClass: 'bg-amber-400' };
    } else {
        return { type: 'green', label: 'Vigente', days: diffDays + 'd rest', badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dotClass: 'bg-emerald-400' };
    }
}

// Formulario de Registro / Edición (PBI-01)[cite: 1]
function handleFormSubmit(event) {
    event.preventDefault();
    const idInput = document.getElementById('operator-id').value;
    const nombre = document.getElementById('nombre').value.trim();
    const area = document.getElementById('area').value;
    const turno = document.getElementById('turno').value;
    const curso = document.getElementById('curso').value.trim();
    const vencimiento = document.getElementById('vencimiento').value;

    if (idInput) {
        operators = operators.map(op => op.id === parseInt(idInput) ? { id: parseInt(idInput), nombre, area, turno, curso, vencimiento } : op);
    } else {
        operators.push({ id: operators.length > 0 ? Math.max(...operators.map(o => o.id)) + 1 : 1, nombre, area, turno, curso, vencimiento });
    }
    saveToLocalStorage();
    resetForm();
    renderDashboard();
    renderNotifications();
    renderQRSelect();
    renderAnalytics();
}

function editOperator(id) {
    const op = operators.find(o => o.id === id);
    if (!op) return;
    document.getElementById('operator-id').value = op.id;
    document.getElementById('nombre').value = op.nombre;
    document.getElementById('area').value = op.area;
    document.getElementById('turno').value = op.turno || 'Matutino';
    document.getElementById('curso').value = op.curso;
    document.getElementById('vencimiento').value = op.vencimiento;
    document.getElementById('form-title').innerText = "Editar Operador";
    document.getElementById('btn-submit').innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Actualizar Operador`;
    document.getElementById('btn-cancel-edit').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteOperator(id) {
    if (confirm("¿Eliminar registro?")) {
        operators = operators.filter(o => o.id !== id);
        saveToLocalStorage();
        renderDashboard();
        renderNotifications();
        renderQRSelect();
        renderAnalytics();
    }
}

function resetForm() {
    document.getElementById('operator-form').reset();
    document.getElementById('operator-id').value = '';
    document.getElementById('form-title').innerText = "Registrar Operador";
    document.getElementById('btn-submit').innerHTML = `<i class="fa-solid fa-save"></i> Guardar Operador`;
    document.getElementById('btn-cancel-edit').classList.add('hidden');
}

function filterOperators() {
    const query = document.getElementById('search-input').value.toLowerCase();
    renderDashboard(operators.filter(op => op.nombre.toLowerCase().includes(query) || op.area.toLowerCase().includes(query)));
}

// Notificaciones por correo (PBI-04)[cite: 1]
function renderNotifications() {
    const container = document.getElementById('email-alerts-list');
    container.innerHTML = '';
    const urgent = operators.filter(op => {
        const diff = Math.ceil((new Date(op.vencimiento + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
        return diff <= 15;
    });

    if (urgent.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-sm">No hay alertas pendientes por enviar (todos los operadores tienen más de 15 días de vigencia).</p>`;
        return;
    }

    urgent.forEach(op => {
        container.innerHTML += `
            <div class="bg-slate-900 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                <div>
                    <h4 class="font-bold text-white text-sm">Alerta para Supervisor: Vencimiento Próximo</h4>
                    <p class="text-xs text-slate-300 mt-1">Operador: <strong class="text-indigo-400">${op.nombre}</strong> (${op.area}) | Curso: ${op.curso} | Vence: ${op.vencimiento}</p>
                </div>
                <span class="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs rounded-lg font-semibold">Correo Automatizado Listo</span>
            </div>
        `;
    });
}

// Reportes PDF y Excel (PBI-05)[cite: 1]
function exportPDF() {
    window.print();
}

function exportExcel() {
    let csv = "Operador,Area,Turno,Curso,Vencimiento\n";
    operators.forEach(op => csv += `"${op.nombre}","${op.area}","${op.turno || 'Matutino'}","${op.curso}","${op.vencimiento}"\n`);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Reporte_Certificaciones_SmartTrain.csv";
    link.click();
}

// Historial QR Móvil (PBI-06)[cite: 1]
function renderQRSelect() {
    const select = document.getElementById('qr-select-operator');
    select.innerHTML = '<option value="" disabled selected>Seleccione operador...</option>';
    operators.forEach(op => select.innerHTML += `<option value="${op.id}">${op.nombre} (${op.area})</option>`);
}

function loadOperatorQR() {
    const id = parseInt(document.getElementById('qr-select-operator').value);
    const op = operators.find(o => o.id === id);
    if (!op) return;

    document.getElementById('qr-result-card').classList.remove('hidden');
    document.getElementById('qr-op-name').innerText = op.nombre;
    document.getElementById('qr-op-details').innerText = `Área: ${op.area} | Turno: ${op.turno || 'Matutino'}`;
    document.getElementById('qr-op-history').innerHTML = `
        <p class="font-semibold text-slate-300 mt-2">Historial de Certificaciones:</p>
        <p>&bull; ${op.curso} - Vencimiento: ${op.vencimiento}</p>
        <p>&bull; Inducción y Seguridad General - Aprobado</p>
    `;
}

// Catálogo de Cursos (PBI-07)[cite: 1]
function renderCatalog() {
    const tbody = document.getElementById('catalog-table-body');
    tbody.innerHTML = '';
    catalog.forEach(c => {
        tbody.innerHTML += `
            <tr class="border-b border-slate-700/50">
                <td class="py-3 px-3 font-mono text-xs text-indigo-400">${c.id}</td>
                <td class="py-3 px-3 text-white font-medium">${c.nombre}</td>
                <td class="py-3 px-3 text-slate-300">${c.area}</td>
                <td class="py-3 px-3 text-slate-300">${c.vigencia}</td>
            </tr>
        `;
    });
}

function addCatalogCourse() {
    const nombre = prompt("Nombre del nuevo curso:");
    if (!nombre) return;
    const area = prompt("Área asociada:");
    const vigencia = prompt("Vigencia (ej. 12 meses):");
    catalog.push({ id: `CUR-0${catalog.length + 1}`, nombre, area: area || 'General', vigencia: vigencia || '12 meses' });
    renderCatalog();
}

// Dashboard Analítico por Turno (PBI-08)[cite: 1]
function renderAnalytics() {
    const grid = document.getElementById('turno-metrics-grid');
    grid.innerHTML = '';
    const turnos = ['Matutino', 'Vespertino', 'Nocturno'];

    turnos.forEach(t => {
        const opsTurno = operators.filter(o => (o.turno || 'Matutino') === t);
        const vigentes = opsTurno.filter(o => calculateStatus(o.vencimiento).type === 'green').length;
        const porcentaje = opsTurno.length > 0 ? Math.round((vigentes / opsTurno.length) * 100) : 100;

        grid.innerHTML += `
            <div class="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-3">
                <h3 class="font-bold text-white text-base">Turno ${t}</h3>
                <p class="text-xs text-slate-400">Total operadores: <strong class="text-white">${opsTurno.length}</strong></p>
                <div class="w-full bg-slate-800 rounded-full h-2.5">
                    <div class="bg-indigo-600 h-2.5 rounded-full" style="width: ${porcentaje}%"></div>
                </div>
                <p class="text-xs text-emerald-400 font-medium">Cumplimiento: ${porcentaje}%</p>
            </div>
        `;
    });
}