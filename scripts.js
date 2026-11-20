const initialOperators = [
    { id: 1, nombre: "Carlos Mendoza Silva", area: "Ensamble A", turno: "Matutino", curso: "Seguridad en Línea y ESD", vencimiento: "2026-11-28" },
    { id: 2, nombre: "Ana Sofía Ramírez", area: "Pruebas Funcionales", turno: "Vespertino", curso: "Operación de Equipos ICT", vencimiento: "2026-10-28" },
    { id: 3, nombre: "Miguel Ángel Torres", area: "SMT / Tarjetas", turno: "Nocturno", curso: "Soldadura IPC-A-610", vencimiento: "2026-09-15" },
    { id: 4, nombre: "Laura Beatriz Gómez", area: "Moldeo e Inyección", turno: "Matutino", curso: "Manejo de Residuos Peligrosos", vencimiento: "2027-03-10" },
    { id: 5, nombre: "Roberto Díaz López", area: "Ensamble A", turno: "Vespertino", curso: "Control de Calidad Visual", vencimiento: "2027-02-15" }
];

let catalog = [
    { id: "CUR-01", nombre: "Seguridad en Línea y ESD", area: "Ensamble A", vigencia: "12 meses" },
    { id: "CUR-02", nombre: "Operación de Equipos ICT", area: "Pruebas Funcionales", vigencia: "6 meses" },
    { id: "CUR-03", nombre: "Soldadura IPC-A-610", area: "SMT / Tarjetas", vigencia: "12 meses" },
    { id: "CUR-04", nombre: "Manejo de Residuos Peligrosos", area: "Moldeo e Inyección", vigencia: "24 meses" }
];

let operators = JSON.parse(localStorage.getItem('smarttrain_all_operators')) || initialOperators;
let supportConfig = JSON.parse(localStorage.getItem('smarttrain_support_config')) || {
    email: "soporte.capacitacion@empresa.com",
    autoSend: true
};
let emailLogs = JSON.parse(localStorage.getItem('smarttrain_email_logs')) || [];

// Instancias globales de Chart.js
let turnosChartInstance = null;
let globalChartInstance = null;

function saveToLocalStorage() {
    localStorage.setItem('smarttrain_all_operators', JSON.stringify(operators));
}

document.addEventListener('DOMContentLoaded', () => {
    // Cargar configuración guardada de soporte
    document.getElementById('support-email-input').value = supportConfig.email;
    document.getElementById('auto-send-toggle').checked = supportConfig.autoSend;

    renderDashboard();
    renderNotifications();
    renderEmailLogs();
    renderCatalog();
    renderQRSelect();
    renderAnalytics();

    // Disparar revisión automática al iniciar
    if (supportConfig.autoSend) {
        triggerAutoEmailSupport(false);
    }
});

// Navegación por pestañas
function switchTab(tabId) {
    const tabs = ['dashboard', 'analytics', 'notifications', 'reports', 'qr', 'catalog'];
    tabs.forEach(t => {
        document.getElementById(`section-${t}`).classList.add('hidden');
        const btn = document.getElementById(`tab-btn-${t}`);
        if (btn) {
            btn.className = "px-3 py-2 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors cursor-pointer flex items-center gap-1.5";
        }
    });
    document.getElementById(`section-${tabId}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`tab-btn-${tabId}`);
    if (activeBtn) {
        activeBtn.className = "px-3 py-2 rounded-lg text-xs font-medium bg-indigo-600 text-white transition-colors cursor-pointer flex items-center gap-1.5";
    }

    // Re-renderizar gráficas al abrir la pestaña para ajustar tamaño responsivo
    if (tabId === 'analytics') {
        renderAnalytics();
    }
}

// Renderizar Tablero Principal (Desktop Tabla + Mobile Cards)
function renderDashboard(dataToRender = operators) {
    const tbody = document.getElementById('operators-table-body');
    const mobileContainer = document.getElementById('operators-mobile-cards');
    tbody.innerHTML = '';
    mobileContainer.innerHTML = '';

    let countGreen = 0, countYellow = 0, countRed = 0;

    dataToRender.forEach(op => {
        const statusInfo = calculateStatus(op.vencimiento);
        if (statusInfo.type === 'green') countGreen++;
        else if (statusInfo.type === 'yellow') countYellow++;
        else if (statusInfo.type === 'red') countRed++;

        // Fila para escritorio/tablet
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
                <button onclick="editOperator(${op.id})" class="text-indigo-400 hover:text-indigo-300 p-1 cursor-pointer" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="deleteOperator(${op.id})" class="text-rose-400 hover:text-rose-300 p-1 cursor-pointer" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tbody.appendChild(tr);

        // Tarjeta optimizada para móvil
        const card = document.createElement('div');
        card.className = "bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2.5";
        card.innerHTML = `
            <div class="flex justify-between items-start gap-2">
                <div>
                    <h4 class="font-bold text-white text-sm">${op.nombre}</h4>
                    <p class="text-xs text-slate-400">${op.area} &bull; <span class="text-indigo-400">${op.turno || 'Matutino'}</span></p>
                </div>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${statusInfo.badgeClass}">
                    <span class="w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}"></span>
                    ${statusInfo.label}
                </span>
            </div>
            <div class="text-xs text-slate-300 bg-slate-800/70 p-2.5 rounded-lg">
                <p class="font-medium text-slate-200">${op.curso}</p>
                <p class="text-slate-400 mt-1 font-mono">Vence: ${op.vencimiento} (${statusInfo.days})</p>
            </div>
            <div class="flex justify-end gap-3 pt-1">
                <button onclick="editOperator(${op.id})" class="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 py-1 px-2 rounded bg-slate-800">
                    <i class="fa-solid fa-pen-to-square"></i> Editar
                </button>
                <button onclick="deleteOperator(${op.id})" class="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 py-1 px-2 rounded bg-slate-800">
                    <i class="fa-solid fa-trash-can"></i> Eliminar
                </button>
            </div>
        `;
        mobileContainer.appendChild(card);
    });

    document.getElementById('stat-total').innerText = operators.length;
    document.getElementById('stat-green').innerText = countGreen;
    document.getElementById('stat-yellow').innerText = countYellow;
    document.getElementById('stat-red').innerText = countRed;
}

// Cálculo de días y semáforo (PBI-03)
function calculateStatus(vencimientoStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(vencimientoStr + 'T00:00:00');
    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { type: 'red', label: 'Vencido', days: Math.abs(diffDays) + 'd vdo', diffDays, badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', dotClass: 'bg-rose-400' };
    } else if (diffDays <= 30) {
        return { type: 'yellow', label: 'Por Vencer', days: diffDays + 'd rest', diffDays, badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', dotClass: 'bg-amber-400' };
    } else {
        return { type: 'green', label: 'Vigente', days: diffDays + 'd rest', diffDays, badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dotClass: 'bg-emerald-400' };
    }
}

// Formulario de Registro / Edición (PBI-01)
function handleFormSubmit(event) {
    event.preventDefault();
    const idInput = document.getElementById('operator-id').value;
    const nombre = document.getElementById('nombre').value.trim();
    const area = document.getElementById('area').value;
    const turno = document.getElementById('turno').value;
    const curso = document.getElementById('curso').value.trim();
    const vencimiento = document.getElementById('vencimiento').value;

    const opObj = {
        id: idInput ? parseInt(idInput) : (operators.length > 0 ? Math.max(...operators.map(o => o.id)) + 1 : 1),
        nombre, area, turno, curso, vencimiento
    };

    if (idInput) {
        operators = operators.map(op => op.id === parseInt(idInput) ? opObj : op);
    } else {
        operators.push(opObj);
    }

    saveToLocalStorage();
    resetForm();
    renderDashboard();
    renderNotifications();
    renderQRSelect();
    renderAnalytics();

    // Verificar si requiere envío automático de alerta a soporte
    const status = calculateStatus(vencimiento);
    if (supportConfig.autoSend && status.diffDays <= 15) {
        sendSingleSupportAlert(opObj, true);
    }
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

// =========================================================================
// PBI-04: ALERTAS AUTOMÁTICAS POR CORREO A SOPORTE
// =========================================================================

function saveSupportConfig() {
    const email = document.getElementById('support-email-input').value.trim();
    const autoSend = document.getElementById('auto-send-toggle').checked;
    if (!email) {
        alert("Por favor ingrese un correo válido para soporte.");
        return;
    }
    supportConfig = { email, autoSend };
    localStorage.setItem('smarttrain_support_config', JSON.stringify(supportConfig));
    showToast(`Configuración guardada. Soporte: ${email}`);
}

function renderNotifications() {
    const container = document.getElementById('email-alerts-list');
    container.innerHTML = '';

    const urgent = operators.filter(op => calculateStatus(op.vencimiento).diffDays <= 15);

    // Actualizar contadores de notificación en header (móvil y escritorio)
    const navBadge = document.getElementById('nav-alert-badge');
    const mobBadge = document.getElementById('mobile-alert-badge');
    if (urgent.length > 0) {
        navBadge.innerText = urgent.length;
        navBadge.classList.remove('hidden');
        mobBadge.innerText = urgent.length;
        mobBadge.classList.remove('hidden');
    } else {
        navBadge.classList.add('hidden');
        mobBadge.classList.add('hidden');
    }

    if (urgent.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-sm">No hay alertas pendientes por enviar (todos los operadores tienen más de 15 días de vigencia).</p>`;
        return;
    }

    urgent.forEach(op => {
        const status = calculateStatus(op.vencimiento);
        const isExpired = status.diffDays < 0;
        const mailtoLink = buildMailtoLink([op]);

        container.innerHTML += `
            <div class="bg-slate-900 border ${isExpired ? 'border-rose-500/40' : 'border-amber-500/40'} rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded ${isExpired ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}">
                            ${isExpired ? 'Vencido' : 'Urgente <= 15d'}
                        </span>
                        <h4 class="font-bold text-white text-sm">${op.nombre}</h4>
                    </div>
                    <p class="text-xs text-slate-300 mt-1">Área: ${op.area} (${op.turno}) | Curso: <strong>${op.curso}</strong> | Vence: ${op.vencimiento}</p>
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button onclick="sendSingleSupportAlertById(${op.id})" class="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer">
                        <i class="fa-solid fa-bolt mr-1"></i> Despachar Auto
                    </button>
                    <a href="${mailtoLink}" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        <i class="fa-solid fa-up-right-from-square mr-1"></i> Abrir Correo
                    </a>
                </div>
            </div>
        `;
    });
}

function sendSingleSupportAlertById(id) {
    const op = operators.find(o => o.id === id);
    if (op) sendSingleSupportAlert(op, false);
}

function sendSingleSupportAlert(op, isAuto = true) {
    const targetEmail = supportConfig.email || "soporte.capacitacion@empresa.com";
    const timestamp = new Date().toLocaleString('es-MX', { hour12: true });
    const logEntry = {
        time: timestamp,
        to: targetEmail,
        subject: `[SmartTrain Alerta] Certificación ${op.curso} - ${op.nombre}`,
        mode: isAuto ? "Automático" : "Manual"
    };

    emailLogs.unshift(logEntry);
    if (emailLogs.length > 20) emailLogs.pop();
    localStorage.setItem('smarttrain_email_logs', JSON.stringify(emailLogs));
    renderEmailLogs();

    showToast(`Alerta enviada (${logEntry.mode}) a ${targetEmail} sobre ${op.nombre}`);
}

function triggerAutoEmailSupport(openClient = false) {
    const urgent = operators.filter(op => calculateStatus(op.vencimiento).diffDays <= 15);
    if (urgent.length === 0) {
        if (openClient) showToast("No hay alertas críticas pendientes para enviar.");
        return;
    }

    const targetEmail = supportConfig.email || "soporte.capacitacion@empresa.com";
    const timestamp = new Date().toLocaleString('es-MX', { hour12: true });

    // Evitar duplicados automáticos en la misma sesión si ya se notificó hace segundos
    const lastLog = emailLogs[0];
    if (!openClient && lastLog && lastLog.subject.includes(`${urgent.length} operador(es)`)) {
        return;
    }

    emailLogs.unshift({
        time: timestamp,
        to: targetEmail,
        subject: `[SmartTrain Resumen Crítico] ${urgent.length} operador(es) requieren atención inmediata`,
        mode: openClient ? "Envío Masivo" : "Automático Sistema"
    });
    localStorage.setItem('smarttrain_email_logs', JSON.stringify(emailLogs));
    renderEmailLogs();

    showToast(`Se enviaron ${urgent.length} alertas a ${targetEmail}`);

    if (openClient) {
        window.location.href = buildMailtoLink(urgent);
    }
}

function buildMailtoLink(opsList) {
    const to = encodeURIComponent(supportConfig.email || "soporte.capacitacion@empresa.com");
    const subject = encodeURIComponent(`[SmartTrain Alertas] Reporte de Certificaciones por Vencer / Vencidas (${opsList.length})`);
    let bodyText = "Estimado equipo de Soporte / Supervisión,\n\nSe reportan las siguientes alertas críticas de capacitación en SmartTrain Web:\n\n";
    opsList.forEach(op => {
        bodyText += `- Operador: ${op.nombre} | Área: ${op.area} (${op.turno}) | Curso: ${op.curso} | Vencimiento: ${op.vencimiento}\n`;
    });
    bodyText += "\nFavor de gestionar la recertificación correspondiente.\nAtentamente,\nSistema SmartTrain Web";
    return `mailto:${to}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
}

function renderEmailLogs() {
    const container = document.getElementById('email-logs-list');
    if (!container) return;
    if (emailLogs.length === 0) {
        container.innerHTML = `<p class="text-slate-500">Aún no se han registrado envíos en esta sesión.</p>`;
        return;
    }
    container.innerHTML = emailLogs.map(log => `
        <div class="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
            <div>
                <span class="text-emerald-400 font-semibold">[${log.mode}]</span>
                <span class="text-slate-200">${log.subject}</span>
                <span class="text-slate-400 block sm:inline sm:ml-2">&rarr; ${log.to}</span>
            </div>
            <span class="text-[11px] text-slate-500 font-mono">${log.time}</span>
        </div>
    `).join('');
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = "bg-slate-800 border border-indigo-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs pointer-events-auto transition-all";
    toast.innerHTML = `
        <i class="fa-solid fa-circle-check text-emerald-400 text-base"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// =========================================================================
// PBI-05, PBI-06, PBI-07
// =========================================================================

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

// =========================================================================
// PBI-08: DASHBOARD ANALÍTICO CON GRÁFICAS (TAREA 8.1 Y TAREA 8.2)
// =========================================================================

function renderAnalytics() {
    const grid = document.getElementById('turno-metrics-grid');
    grid.innerHTML = '';
    const turnos = ['Matutino', 'Vespertino', 'Nocturno'];
    const porcentajesPorTurno = [];

    let totalVigentes = 0;
    let totalPorVencer = 0;
    let totalVencidos = 0;

    operators.forEach(op => {
        const st = calculateStatus(op.vencimiento).type;
        if (st === 'green') totalVigentes++;
        else if (st === 'yellow') totalPorVencer++;
        else totalVencidos++;
    });

    turnos.forEach(t => {
        const opsTurno = operators.filter(o => (o.turno || 'Matutino') === t);
        const vigentes = opsTurno.filter(o => calculateStatus(o.vencimiento).type === 'green').length;
        const porcentaje = opsTurno.length > 0 ? Math.round((vigentes / opsTurno.length) * 100) : 0;
        porcentajesPorTurno.push(porcentaje);

        grid.innerHTML += `
            <div class="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2.5">
                <div class="flex justify-between items-center">
                    <h3 class="font-bold text-white text-sm">Turno ${t}</h3>
                    <span class="text-xs font-bold text-indigo-400">${porcentaje}%</span>
                </div>
                <p class="text-xs text-slate-400">Operadores vigentes: <strong class="text-white">${vigentes} / ${opsTurno.length}</strong></p>
                <div class="w-full bg-slate-800 rounded-full h-2">
                    <div class="bg-indigo-600 h-2 rounded-full transition-all duration-500" style="width: ${porcentaje}%"></div>
                </div>
            </div>
        `;
    });

    // Renderizar Gráfica Tarea 8.1: Cumplimiento por Turno (Barras)
    const ctxTurnos = document.getElementById('chart-turnos');
    if (ctxTurnos) {
        if (turnosChartInstance) turnosChartInstance.destroy();
        turnosChartInstance = new Chart(ctxTurnos, {
            type: 'bar',
            data: {
                labels: turnos,
                datasets: [{
                    label: '% Cumplimiento Vigente',
                    data: porcentajesPorTurno,
                    backgroundColor: ['#6366f1', '#10b981', '#f59e0b'],
                    borderRadius: 8,
                    maxBarThickness: 48
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: '#94a3b8', callback: value => value + '%' },
                        grid: { color: '#1e293b' }
                    },
                    x: {
                        ticks: { color: '#cbd5e1' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // Renderizar Gráfica Tarea 8.2: Métricas Globales del Sistema (Dona)
    const ctxGlobal = document.getElementById('chart-global');
    if (ctxGlobal) {
        if (globalChartInstance) globalChartInstance.destroy();
        globalChartInstance = new Chart(ctxGlobal, {
            type: 'doughnut',
            data: {
                labels: ['Vigentes', 'Por Vencer (<=30d)', 'Vencidos'],
                datasets: [{
                    data: [totalVigentes, totalPorVencer, totalVencidos],
                    backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
                    borderColor: '#0f172a',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#cbd5e1', padding: 16, font: { size: 12 } }
                    }
                }
            }
        });
    }
}