// Base de datos inicial con registros de prueba orientados a producción
const initialOperators = [
    {
        id: 1,
        nombre: "Carlos Mendoza Silva",
        area: "Ensamble A",
        curso: "Seguridad en Línea y ESD",
        vencimiento: "2026-11-20" // Vigente (Verde)
    },
    {
        id: 2,
        nombre: "Ana Sofía Ramírez",
        area: "Pruebas Funcionales",
        curso: "Operación de Equipos ICT",
        vencimiento: "2026-10-20" // Por vencer (Amarillo - menos de 30 días)
    },
    {
        id: 3,
        nombre: "Miguel Ángel Torres",
        area: "SMT / Tarjetas",
        curso: "Soldadura IPC-A-610",
        vencimiento: "2026-09-15" // Vencido (Rojo)
    },
    {
        id: 4,
        nombre: "Laura Beatriz Gómez",
        area: "Moldeo e Inyección",
        curso: "Manejo de Residuos Peligrosos",
        vencimiento: "2026-12-10" // Vigente (Verde)
    }
];

// Cargar operadores desde localStorage o usar los iniciales si no existen
let operators = JSON.parse(localStorage.getItem('smarttrain_operators')) || initialOperators;

// Función para guardar en localStorage
function saveToLocalStorage() {
    localStorage.setItem('smarttrain_operators', JSON.stringify(operators));
}

// Inicializar la aplicación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
});

// Función principal para renderizar la tabla y métricas
function renderDashboard(dataToRender = operators) {
    const tbody = document.getElementById('operators-table-body');
    const emptyState = document.getElementById('empty-state');
    tbody.innerHTML = '';

    if (dataToRender.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }

    let countGreen = 0;
    let countYellow = 0;
    let countRed = 0;

    dataToRender.forEach(op => {
        const statusInfo = calculateStatus(op.vencimiento);
        
        // Conteo para KPIs
        if (statusInfo.type === 'green') countGreen++;
        else if (statusInfo.type === 'yellow') countYellow++;
        else if (statusInfo.type === 'red') countRed++;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-700/30 transition-colors";
        tr.innerHTML = `
            <td class="py-3 px-4 font-medium text-white">${op.nombre}</td>
            <td class="py-3 px-4 text-slate-300">${op.area}</td>
            <td class="py-3 px-4 text-slate-300">${op.curso}</td>
            <td class="py-3 px-4 text-slate-300 font-mono text-xs">${op.vencimiento}</td>
            <td class="py-3 px-4 text-center">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.badgeClass}">
                    <span class="w-2 h-2 rounded-full ${statusInfo.dotClass}"></span>
                    ${statusInfo.label} (${statusInfo.days} días)
                </span>
            </td>
            <td class="py-3 px-4 text-right space-x-2">
                <button onclick="editOperator(${op.id})" title="Editar" class="text-indigo-400 hover:text-indigo-300 p-1.5 transition-colors cursor-pointer">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button onclick="deleteOperator(${op.id})" title="Eliminar" class="text-rose-400 hover:text-rose-300 p-1.5 transition-colors cursor-pointer">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Actualizar tarjetas de KPI
    document.getElementById('stat-total').innerText = operators.length;
    document.getElementById('stat-green').innerText = countGreen;
    document.getElementById('stat-yellow').innerText = countYellow;
    document.getElementById('stat-red').innerText = countRed;
}

// Algoritmo de cálculo de días restantes y semaforización dinámica (PBI-02 y PBI-03)
function calculateStatus(vencimientoStr) {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const expiryDate = new Date(vencimientoStr + 'T00:00:00');
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return {
            type: 'red',
            label: 'Vencido',
            days: Math.abs(diffDays) + ' días vencido',
            badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
            dotClass: 'bg-rose-400'
        };
    } else if (diffDays <= 30) {
        return {
            type: 'yellow',
            label: 'Por Vencer',
            days: diffDays + ' días restantes',
            badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
            dotClass: 'bg-amber-400'
        };
    } else {
        return {
            type: 'green',
            label: 'Vigente',
            days: diffDays + ' días restantes',
            badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
            dotClass: 'bg-emerald-400'
        };
    }
}

// Manejar el envío del formulario (Crear o Editar operador - PBI-01)
function handleFormSubmit(event) {
    event.preventDefault();
    
    const idInput = document.getElementById('operator-id').value;
    const nombre = document.getElementById('nombre').value.trim();
    const area = document.getElementById('area').value;
    const curso = document.getElementById('curso').value.trim();
    const vencimiento = document.getElementById('vencimiento').value;

    if (idInput) {
        // Editar registro existente
        const id = parseInt(idInput);
        operators = operators.map(op => {
            if (op.id === id) {
                return { id, nombre, area, curso, vencimiento };
            }
            return op;
        });
    } else {
        // Crear nuevo registro
        const newOp = {
            id: operators.length > 0 ? Math.max(...operators.map(o => o.id)) + 1 : 1,
            nombre,
            area,
            curso,
            vencimiento
        };
        operators.push(newOp);
    }

    saveToLocalStorage(); // Guardar cambios en el almacenamiento local
    resetForm();
    renderDashboard();
}

// Cargar datos en el formulario para edición
function editOperator(id) {
    const op = operators.find(o => o.id === id);
    if (!op) return;

    document.getElementById('operator-id').value = op.id;
    document.getElementById('nombre').value = op.nombre;
    document.getElementById('area').value = op.area;
    document.getElementById('curso').value = op.curso;
    document.getElementById('vencimiento').value = op.vencimiento;

    document.getElementById('form-title').innerText = "Editar Operador";
    document.getElementById('btn-submit').innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Actualizar Operador`;
    document.getElementById('btn-cancel-edit').classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Eliminar operador
function deleteOperator(id) {
    if (confirm("¿Está seguro de eliminar el registro de este operador?")) {
        operators = operators.filter(o => o.id !== id);
        saveToLocalStorage(); // Guardar cambios en el almacenamiento local
        renderDashboard();
    }
}

// Restablecer formulario al estado inicial
function resetForm() {
    document.getElementById('operator-form').reset();
    document.getElementById('operator-id').value = '';
    document.getElementById('form-title').innerText = "Registrar Operador";
    document.getElementById('btn-submit').innerHTML = `<i class="fa-solid fa-save"></i> Guardar Operador`;
    document.getElementById('btn-cancel-edit').classList.add('hidden');
}

// Filtrar operadores en tiempo real desde la barra de búsqueda
function filterOperators() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filtered = operators.filter(op => 
        op.nombre.toLowerCase().includes(query) || 
        op.area.toLowerCase().includes(query) ||
        op.curso.toLowerCase().includes(query)
    );
    renderDashboard(filtered);
}