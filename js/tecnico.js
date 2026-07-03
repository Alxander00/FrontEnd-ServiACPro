// ==========================================
// tecnico.js - Panel Técnico con paginación
// ==========================================

Auth.protectRoute(['TECNICO']);

let bsModalEstado = null;
let bsModalDetalles = null;
let calendar = null;
let mapaActual = null;
let vistaActual = 'tarjetas';
let todasLasCitas = [];
let citasFiltradas = [];

// ==========================================
// PAGINACIÓN
// ==========================================
let currentPage = 0;
const pageSize = 10;
let totalPages = 1;
let totalElements = 0;

// Variables para la firma
let canvas = null;
let ctx = null;
let isDrawing = false;

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const user = Auth.getUser();
    if (user.rol !== 'TECNICO') {
        Swal.fire('Acceso denegado', 'No tienes permisos de técnico.', 'error');
        window.location.href = 'index.html';
        return;
    }

    // Fecha actual
    const hoy = new Date();
    document.getElementById('fechaActual').textContent = 
        hoy.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

    // Modales
    bsModalEstado = new bootstrap.Modal(document.getElementById('modalActualizarEstado'));
    bsModalDetalles = new bootstrap.Modal(document.getElementById('modalDetallesCita'));

    document.getElementById('formEstadoCita').addEventListener('submit', guardarEstadoCita);

    // Mostrar/Ocultar evidencia al cambiar el estado
    document.getElementById('nuevoEstado').addEventListener('change', function() {
        const seccionEvidencia = document.getElementById('seccionEvidencia');
        if (this.value === 'Completado') {
            seccionEvidencia.style.display = 'block';
            setTimeout(initFirma, 200);
        } else {
            seccionEvidencia.style.display = 'none';
        }
    });

    // Botones de cambio de vista
    const btnTarjetas = document.getElementById('btnVistaTarjetas');
    const btnCalendario = document.getElementById('btnVistaCalendario');
    const divTarjetas = document.getElementById('vistaTarjetas');
    const divCalendario = document.getElementById('vistaCalendario');

    btnTarjetas.addEventListener('click', () => {
        vistaActual = 'tarjetas';
        btnTarjetas.className = 'btn btn-primary btn-sm rounded-pill px-3';
        btnCalendario.className = 'btn btn-outline-secondary btn-sm rounded-pill px-3';
        divTarjetas.style.display = 'block';
        divCalendario.style.display = 'none';
        renderizarTarjetas(citasFiltradas);
    });

    btnCalendario.addEventListener('click', () => {
        vistaActual = 'calendario';
        btnCalendario.className = 'btn btn-primary btn-sm rounded-pill px-3';
        btnTarjetas.className = 'btn btn-outline-secondary btn-sm rounded-pill px-3';
        divTarjetas.style.display = 'none';
        divCalendario.style.display = 'block';
        renderizarCalendario(citasFiltradas);
    });

    // FILTROS EN TIEMPO REAL
    document.getElementById('buscarCita').addEventListener('input', aplicarFiltros);
    document.getElementById('filtroEstado').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroOrden').addEventListener('change', aplicarFiltros);

    // ✅ EVENTOS DE PAGINACIÓN
    document.getElementById('btnAnterior')?.addEventListener('click', () => cambiarPagina(-1));
    document.getElementById('btnSiguiente')?.addEventListener('click', () => cambiarPagina(1));

    // Cargar citas
    await cargarCitas(0);

    // Notificación desde URL (si viene de una notificación)
    const urlParams = new URLSearchParams(window.location.search);
    const idCitaNotificada = urlParams.get('cita');
    if (idCitaNotificada) {
        const citaEncontrada = todasLasCitas.find(c => c.idCita == parseInt(idCitaNotificada));
        if (citaEncontrada) {
            abrirModalEstado(citaEncontrada.idCita, citaEncontrada.estado);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
});

// ==========================================
// CARGAR CITAS (CON PAGINACIÓN)
// ==========================================
async function cargarCitas(page = 0) {
    const user = Auth.getUser();
    if (!user) return;

    try {
        document.getElementById('agendaContainer').innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2 text-muted">Cargando citas...</p>
            </div>
        `;

        const response = await API.Citas.listarPorTecnico(user.idUsuario, page, pageSize);

        todasLasCitas = response.content || [];
        totalPages = response.totalPages || 1;
        totalElements = response.totalElements || 0;
        currentPage = response.number || 0;

        citasFiltradas = [...todasLasCitas];
        actualizarEstadisticas(citasFiltradas);
        renderizarTarjetas(citasFiltradas);
        renderizarCalendario(citasFiltradas);
        actualizarPaginacion();

    } catch (error) {
        console.error(error);
        document.getElementById('agendaContainer').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">Error al cargar citas: ${error.message}</div>
            </div>
        `;
    }
}

// ==========================================
// ACTUALIZAR PAGINACIÓN (UI)
// ==========================================
function actualizarPaginacion() {
    const container = document.getElementById('paginacionContainer');
    if (!container) return;

    const total = document.getElementById('totalPaginas');
    const actual = document.getElementById('paginaActual');
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const infoTotal = document.getElementById('infoTotalCitas');

    if (total) total.textContent = totalPages;
    if (actual) actual.textContent = currentPage + 1;
    if (btnAnterior) btnAnterior.disabled = currentPage === 0;
    if (btnSiguiente) btnSiguiente.disabled = currentPage >= totalPages - 1;
    if (infoTotal) infoTotal.textContent = totalElements;
}

// ==========================================
// CAMBIAR PÁGINA
// ==========================================
function cambiarPagina(delta) {
    const nuevaPagina = currentPage + delta;
    if (nuevaPagina >= 0 && nuevaPagina < totalPages) {
        cargarCitas(nuevaPagina);
    }
}

// ==========================================
// ACTUALIZAR ESTADÍSTICAS
// ==========================================
function actualizarEstadisticas(citas) {
    const hoy = new Date().toDateString();
    const citasHoy = citas.filter(c => new Date(c.fechaInicio).toDateString() === hoy);
    const pendientes = citas.filter(c => c.estado === 'PROGRAMADA' || c.estado === 'EN_PROCESO');
    const completadas = citas.filter(c => c.estado === 'COMPLETADA');

    document.getElementById('statHoy').textContent = citasHoy.length;
    document.getElementById('statPendientes').textContent = pendientes.length;
    document.getElementById('statCompletadas').textContent = completadas.length;
    document.getElementById('statTotal').textContent = citas.length;
}

// ==========================================
// APLICAR FILTROS (EN TIEMPO REAL)
// ==========================================
function aplicarFiltros() {
    const estado = document.getElementById('filtroEstado').value;
    const busqueda = document.getElementById('buscarCita').value.toLowerCase().trim();
    const orden = document.getElementById('filtroOrden').value;

    citasFiltradas = todasLasCitas.filter(cita => {
        if (estado !== 'todos' && cita.estado !== estado) return false;
        if (busqueda) {
            const nombre = (cita.nombreCliente || '').toLowerCase();
            const direccion = (cita.direccionCliente || '').toLowerCase();
            if (!nombre.includes(busqueda) && !direccion.includes(busqueda)) return false;
        }
        return true;
    });

    if (orden === 'fecha') {
        citasFiltradas.sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));
    } else if (orden === 'cliente') {
        citasFiltradas.sort((a, b) => (a.nombreCliente || '').localeCompare(b.nombreCliente || ''));
    }

    actualizarEstadisticas(citasFiltradas);
    renderizarTarjetas(citasFiltradas);
    renderizarCalendario(citasFiltradas);
}

// ==========================================
// RENDERIZAR TARJETAS (con chat y detalles)
// ==========================================
function renderizarTarjetas(citas) {
    const container = document.getElementById('agendaContainer');
    container.innerHTML = '';

    if (citas.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="fas fa-calendar-check"></i>
                    <h5>No hay citas que mostrar</h5>
                    <p>No se encontraron citas con los filtros seleccionados.</p>
                </div>
            </div>
        `;
        return;
    }

    citas.forEach(cita => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-xl-4';

        const fechaInicio = new Date(cita.fechaInicio);
        const ahora = new Date();
        const diffMs = fechaInicio - ahora;
        const diffMin = Math.floor(diffMs / (1000 * 60));
        const esUrgente = diffMin > 0 && diffMin < 120 && cita.estado === 'PROGRAMADA';

        let badgeClass = 'programada';
        let estadoLabel = 'Programada';
        let estadoIcon = 'fa-circle';
        if (cita.estado === 'EN_PROCESO') { badgeClass = 'en-proceso'; estadoLabel = 'En Proceso'; estadoIcon = 'fa-clock'; }
        else if (cita.estado === 'COMPLETADA') { badgeClass = 'completada'; estadoLabel = 'Completada'; estadoIcon = 'fa-check-circle'; }
        else if (cita.estado === 'CANCELADA') { badgeClass = 'cancelada'; estadoLabel = 'Cancelada'; estadoIcon = 'fa-times-circle'; }

        const horaFormateada = fechaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const fechaFormateada = fechaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

        const badgeUrgencia = esUrgente 
            ? `<span class="cita-urgente-badge ms-2"><i class="fas fa-clock me-1"></i>Próxima</span>` 
            : '';

        const esCompletada = cita.estado === 'COMPLETADA';
        const btnEliminar = esCompletada ? `
            <button class="btn btn-outline-danger btn-sm rounded-pill fw-bold" onclick="event.stopPropagation(); eliminarCita(${cita.idCita})" title="Eliminar cita completada">
                <i class="fas fa-trash-alt"></i>
            </button>
        ` : '';

        const tipoServicio = cita.tipoServicio || 'No especificado';
        const mensajeCliente = cita.mensajeCliente || 'Sin mensaje adicional';

        // Botón de chat (con idCita)
        const btnChat = `
            <button class="btn btn-outline-primary btn-sm rounded-pill fw-bold" 
                    onclick="event.stopPropagation(); abrirChatConCliente(${cita.idCliente}, '${cita.nombreCliente}', ${cita.idCita})">
                <i class="fas fa-comment-dots me-1"></i> Chat
            </button>
        `;

        col.innerHTML = `
            <div class="cita-card ${esUrgente ? 'urgente' : ''}" style="cursor: pointer;">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span class="cita-id">#${cita.idCita}</span>
                        <span class="badge-estado ${badgeClass} ms-2">
                            <i class="fas ${estadoIcon}"></i>
                            ${estadoLabel}
                        </span>
                        ${badgeUrgencia}
                    </div>
                    <span class="cita-hora">${horaFormateada}</span>
                </div>

                <h6 class="cita-cliente mb-1">
                    <i class="fas fa-user-circle me-1"></i><strong>${cita.nombreCliente}</strong>
                </h6>

                <p class="cita-direccion mb-2">
                    <i class="fas fa-map-marker-alt text-danger me-1"></i>
                    ${cita.direccionCliente || 'Sin dirección registrada'}
                </p>

                <div class="mb-2 d-flex flex-wrap gap-1">
                    <span class="badge bg-info text-dark px-3 py-2 rounded-pill" style="font-size: 0.75rem;">
                        <i class="fas fa-tag me-1"></i> ${tipoServicio.replace('_', ' ')}
                    </span>
                    <span class="badge bg-secondary text-white px-3 py-2 rounded-pill" style="font-size: 0.75rem;">
                        <i class="fas fa-comment me-1"></i> ${mensajeCliente.length > 40 ? mensajeCliente.substring(0, 40) + '...' : mensajeCliente}
                    </span>
                </div>

                <div class="d-flex justify-content-between align-items-center mt-2">
                    <div>
                        <span class="text-muted small"><i class="fas fa-hand-pointer me-1"></i>Click para ver detalles</span>
                        ${btnChat}
                    </div>
                    ${btnEliminar}
                </div>
            </div>
        `;

        col.addEventListener('click', function(e) {
            if (e.target.closest('button')) return;
            abrirDetallesCita(cita);
        });

        container.appendChild(col);
    });
}

// ==========================================
// RENDERIZAR CALENDARIO
// ==========================================
function renderizarCalendario(citas) {
    if (calendar) calendar.destroy();
    const calendarEl = document.getElementById('calendar');

    const eventos = citas.map(cita => {
        let color = '#0d6efd';
        if (cita.estado === 'EN_PROCESO') color = '#f57c00';
        else if (cita.estado === 'COMPLETADA') color = '#2e7d32';
        else if (cita.estado === 'CANCELADA') color = '#c62828';

        return {
            id: cita.idCita,
            title: `${cita.nombreCliente} - ${cita.estado}`,
            start: cita.fechaInicio,
            end: cita.fechaFin,
            color: color,
            extendedProps: {
                direccion: cita.direccionCliente || 'Sin dirección',
                idCliente: cita.idCliente,
                estado: cita.estado,
                notas: cita.notas || ''
            }
        };
    });

    calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'es',
        initialView: 'timeGridWeek',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
        },
        height: 'auto',
        events: eventos,
        eventClick: (info) => {
            const cita = info.event;
            const citaCompleta = todasLasCitas.find(c => c.idCita === cita.id);
            if (citaCompleta) abrirDetallesCita(citaCompleta);
        }
    });
    calendar.render();
}

// ==========================================
// ABRIR DETALLES DE CITA (MODAL) CON CHAT
// ==========================================
let citaActualDetalles = null;

function abrirDetallesCita(cita) {
    citaActualDetalles = cita;
    const body = document.getElementById('detallesCitaBody');

    const fechaInicio = new Date(cita.fechaInicio);
    const fechaFin = new Date(cita.fechaFin);

    const estadoBadge = cita.estado === 'PROGRAMADA' ? 'programada' :
                        cita.estado === 'EN_PROCESO' ? 'en-proceso' :
                        cita.estado === 'COMPLETADA' ? 'completada' : 'cancelada';

    body.innerHTML = `
        <div class="row g-3">
            <div class="col-md-6">
                <div class="bg-light p-3 rounded-4 h-100">
                    <h6 class="fw-bold text-primary mb-2"><i class="fas fa-user me-2"></i>Cliente</h6>
                    <p class="mb-1"><strong>${cita.nombreCliente}</strong></p>
                    <p class="mb-0 text-muted small"><i class="fas fa-phone me-1"></i> ${cita.telefonoCliente || 'No disponible'}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="bg-light p-3 rounded-4 h-100">
                    <h6 class="fw-bold text-primary mb-2"><i class="fas fa-map-marker-alt me-2"></i>Dirección</h6>
                    <p class="mb-0">${cita.direccionCliente || 'Sin dirección registrada'}</p>
                </div>
            </div>
            <div class="col-12">
                <div class="bg-light p-3 rounded-4">
                    <h6 class="fw-bold text-primary mb-2"><i class="fas fa-tag me-2"></i>Tipo de Servicio</h6>
                    <p class="mb-0"><span class="badge bg-info text-dark">${cita.tipoServicio ? cita.tipoServicio.replace('_', ' ') : 'No especificado'}</span></p>
                </div>
            </div>
            <div class="col-12">
                <div class="bg-light p-3 rounded-4">
                    <h6 class="fw-bold text-primary mb-2"><i class="fas fa-comment me-2"></i>Mensaje del Cliente</h6>
                    <p class="mb-0">${cita.mensajeCliente || 'Sin mensaje adicional'}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="bg-light p-3 rounded-4">
                    <h6 class="fw-bold text-primary mb-2"><i class="fas fa-clock me-2"></i>Fecha y Hora</h6>
                    <p class="mb-1"><strong>Inicio:</strong> ${fechaInicio.toLocaleString()}</p>
                    <p class="mb-0"><strong>Fin:</strong> ${fechaFin.toLocaleString()}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="bg-light p-3 rounded-4">
                    <h6 class="fw-bold text-primary mb-2"><i class="fas fa-info-circle me-2"></i>Estado</h6>
                    <p class="mb-0"><span class="badge-estado ${estadoBadge}">${cita.estado}</span></p>
                </div>
            </div>
        </div>
    `;

    // Botones del footer
    document.getElementById('btnReportarDesdeDetalles').onclick = function() {
        bsModalDetalles.hide();
        abrirModalEstado(cita.idCita, cita.estado);
    };
    document.getElementById('btnMapaDesdeDetalles').onclick = function() {
        bsModalDetalles.hide();
        mostrarMapa(cita.direccionCliente, cita.idCliente);
    };

    // Botón de chat en el footer (CON idCita)
    const btnChatFooter = document.createElement('button');
    btnChatFooter.className = 'btn btn-outline-primary fw-bold rounded-pill';
    btnChatFooter.innerHTML = '<i class="fas fa-comment-dots me-1"></i> Chat';
    btnChatFooter.onclick = function() {
        bsModalDetalles.hide();
        abrirChatConCliente(cita.idCliente, cita.nombreCliente, cita.idCita);
    };

    const footer = document.querySelector('#modalDetallesCita .modal-footer');
    const existingBtn = footer.querySelector('.btn-chat-detalle');
    if (existingBtn) existingBtn.remove();
    btnChatFooter.classList.add('btn-chat-detalle');
    footer.insertBefore(btnChatFooter, footer.querySelector('.btn-secondary'));

    bsModalDetalles.show();
}

// ==========================================
// ABRIR CHAT CON CLIENTE (desde técnico) - VERSIÓN CON ID CITA
// ==========================================
window.abrirChatConCliente = async function(idCliente, nombreCliente, idCita) {
    const user = Auth.getUser();
    if (!user) {
        Swal.fire('Error', 'Debes iniciar sesión.', 'error');
        return;
    }

    if (!idCita) {
        console.error('❌ idCita es nulo o indefinido');
        Swal.fire('Error', 'No se pudo identificar la cita para el chat.', 'error');
        return;
    }

    try {
        console.log('📦 Payload a enviar (tecnico):', { idCliente, idTecnico: user.idUsuario, idCita });

        const response = await fetch(`${API_URL}/api/conversaciones/iniciar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({
                idCliente: idCliente,
                idTecnico: user.idUsuario,
                idCita: idCita
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Respuesta del servidor (error):', errorText);
            throw new Error(`Error al iniciar conversación: ${response.status} - ${errorText}`);
        }

        const conversacion = await response.json();
        const conversacionId = conversacion.id;

        const modal = new bootstrap.Modal(document.getElementById('modalChat'));
        modal.show();

        modal._element.addEventListener('shown.bs.modal', function onShown() {
            modal._element.removeEventListener('shown.bs.modal', onShown);
            Chat.init(conversacionId, 'chatContainer', nombreCliente || 'Cliente');
        });

        modal._element.addEventListener('hidden.bs.modal', function onHidden() {
            modal._element.removeEventListener('hidden.bs.modal', onHidden);
            Chat.destroy();
            document.getElementById('chatContainer').innerHTML = '';
            document.getElementById('chatNombreDestinatario').textContent = '';
        });

    } catch (error) {
        console.error('❌ Error al abrir chat:', error);
        Swal.fire('Error', 'No se pudo iniciar la conversación.', 'error');
    }
};

// ==========================================
// ABRIR MODAL ESTADO
// ==========================================
window.abrirModalEstado = function(idCita, estadoActual) {
    document.getElementById('citaIdActual').value = idCita;

    let valorSelect = 'En Proceso';
    if (estadoActual === 'PROGRAMADA') valorSelect = 'En Camino';
    else if (estadoActual === 'EN_PROCESO') valorSelect = 'En Proceso';
    else if (estadoActual === 'COMPLETADA') valorSelect = 'Completado';
    else if (estadoActual === 'CANCELADA') valorSelect = 'Reprogramado';

    document.getElementById('nuevoEstado').value = valorSelect;
    document.getElementById('notasTecnico').value = '';

    document.getElementById('nuevoEstado').dispatchEvent(new Event('change'));

    document.getElementById('fotoAntes').value = '';
    document.getElementById('fotoDespues').value = '';

    bsModalEstado.show();
};

// ==========================================
// GUARDAR ESTADO CITA
// ==========================================
async function guardarEstadoCita(event) {
    event.preventDefault();
    const btn = document.getElementById('btnGuardarReporte');
    const txtOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Subiendo...';

    const idCita = parseInt(document.getElementById('citaIdActual').value);
    let nuevoEstadoSelect = document.getElementById('nuevoEstado').value;
    let nuevoEstado = '';

    if (nuevoEstadoSelect === 'En Camino') nuevoEstado = 'EN_PROCESO';
    else if (nuevoEstadoSelect === 'En Proceso') nuevoEstado = 'EN_PROCESO';
    else if (nuevoEstadoSelect === 'Completado') nuevoEstado = 'COMPLETADA';
    else if (nuevoEstadoSelect === 'Reprogramado') nuevoEstado = 'CANCELADA';

    const notas = document.getElementById('notasTecnico').value;

    const formData = new FormData();
    formData.append('estado', nuevoEstado);
    formData.append('notas', notas);

    if (nuevoEstadoSelect === 'Completado') {
        const inputAntes = document.getElementById('fotoAntes');
        const inputDespues = document.getElementById('fotoDespues');

        if (isCanvasEmpty(canvas)) {
            Swal.fire('Firma Requerida', 'El cliente debe firmar la pantalla.', 'warning');
            btn.disabled = false;
            btn.innerHTML = txtOriginal;
            return;
        }

        if (inputDespues.files.length === 0) {
            Swal.fire('Evidencia Incompleta', 'Sube al menos una foto de cómo quedó el trabajo.', 'warning');
            btn.disabled = false;
            btn.innerHTML = txtOriginal;
            return;
        }

        const firmaBase64 = canvas.toDataURL('image/png');
        const firmaSizeBytes = Math.round((firmaBase64.length * 3) / 4);
        if (firmaSizeBytes > 1024 * 1024) {
            Swal.fire('Firma demasiado grande', 'La firma pesa más de 1MB. Intenta con trazos más finos.', 'warning');
            btn.disabled = false;
            btn.innerHTML = txtOriginal;
            return;
        }

        const maxFotoSize = 5 * 1024 * 1024;
        for (let i = 0; i < inputDespues.files.length; i++) {
            if (inputDespues.files[i].size > maxFotoSize) {
                Swal.fire('Foto demasiado grande', `"${inputDespues.files[i].name}" supera los 5MB.`, 'warning');
                btn.disabled = false;
                btn.innerHTML = txtOriginal;
                return;
            }
        }

        for (let i = 0; i < inputAntes.files.length; i++) {
            if (inputAntes.files[i].size > maxFotoSize) {
                Swal.fire('Foto demasiado grande', `"${inputAntes.files[i].name}" supera los 5MB.`, 'warning');
                btn.disabled = false;
                btn.innerHTML = txtOriginal;
                return;
            }
        }

        for (let i = 0; i < inputAntes.files.length; i++) {
            formData.append('fotosAntes', inputAntes.files[i]);
        }

        for (let i = 0; i < inputDespues.files.length; i++) {
            formData.append('fotosDespues', inputDespues.files[i]);
        }

        formData.append('firma', firmaBase64);

        const repuestosArray = [];
        document.querySelectorAll('.repuesto-item').forEach(fila => {
            const idReq = fila.querySelector('.select-repuesto').value;
            const cant = parseFloat(fila.querySelector('.input-cantidad').value);
            if (idReq && cant > 0) {
                repuestosArray.push({ idRepuesto: parseInt(idReq), cantidad: cant });
            }
        });

        if (repuestosArray.length > 0) {
            formData.append('repuestos', JSON.stringify(repuestosArray));
        }
    }

    try {
        const BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:8080'
            : 'https://servi-a-c-pro.onrender.com';

        const token = Auth.getToken();

        const response = await fetch(`${BASE_URL}/api/citas/${idCita}/reporte`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData || 'Error al guardar el reporte');
        }

        Swal.fire({
            icon: 'success',
            title: '¡Reporte Guardado!',
            text: 'Las evidencias y el estado se han guardado exitosamente.',
            confirmButtonColor: '#0d6efd'
        });

        bsModalEstado.hide();
        await cargarCitas(currentPage);
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = txtOriginal;
    }
}

// ==========================================
// FIRMA DIGITAL
// ==========================================
function initFirma() {
    canvas = document.getElementById('firmaCanvas');
    if (!canvas) return;

    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;

    ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0d6efd';

    canvas.replaceWith(canvas.cloneNode(true));
    canvas = document.getElementById('firmaCanvas');
    ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0d6efd';

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    document.getElementById('btnLimpiarFirma').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
}

function startDrawing(e) { isDrawing = true; draw(e); }
function stopDrawing() { isDrawing = false; ctx.beginPath(); }

function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousedown", { clientX: touch.clientX, clientY: touch.clientY });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousemove", { clientX: touch.clientX, clientY: touch.clientY });
    canvas.dispatchEvent(mouseEvent);
}

function isCanvasEmpty(c) {
    const blank = document.createElement('canvas');
    blank.width = c.width;
    blank.height = c.height;
    return c.toDataURL() === blank.toDataURL();
}

// ==========================================
// MAPA CON GOOGLE MAPS
// ==========================================
window.mostrarMapa = async function(direccion, idCliente) {
    const modal = new bootstrap.Modal(document.getElementById('modalMapa'));
    modal.show();

    setTimeout(async () => {
        const mapDiv = document.getElementById('mapaCliente');
        if (mapaActual) { mapaActual.remove(); mapDiv.innerHTML = ''; }

        let lat = null, lng = null;
        let direccionCompleta = direccion;

        if (!direccion || direccion === 'Sin dirección registrada') {
            mapDiv.innerHTML = '<div class="alert alert-warning m-3">El cliente no tiene dirección registrada.</div>';
            document.getElementById('btnAbrirGoogleMaps').style.display = 'none';
            return;
        }

        try {
            const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion + ', El Salvador')}&limit=1`;
            const geoResp = await fetch(geocodeUrl);
            const geoData = await geoResp.json();

            if (geoData && geoData.length > 0) {
                lat = parseFloat(geoData[0].lat);
                lng = parseFloat(geoData[0].lon);
                direccionCompleta = geoData[0].display_name || direccion;
            } else {
                lat = 13.9778;
                lng = -89.5567;
                Swal.fire({
                    icon: 'info',
                    title: 'Ubicación aproximada',
                    text: 'No se encontró la dirección exacta. Mostrando ubicación aproximada en El Salvador.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 4000
                });
            }
        } catch (error) {
            mapDiv.innerHTML = '<div class="alert alert-danger m-3">Error al cargar el mapa.</div>';
            document.getElementById('btnAbrirGoogleMaps').style.display = 'none';
            return;
        }

        const btnGoogle = document.getElementById('btnAbrirGoogleMaps');
        btnGoogle.style.display = 'inline-block';
        btnGoogle.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

        mapaActual = L.map(mapDiv).setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapaActual);

        L.marker([lat, lng]).addTo(mapaActual)
            .bindPopup(`<b>${direccionCompleta}</b>`)
            .openPopup();

        setTimeout(() => { mapaActual.invalidateSize(); }, 300);
    }, 100);
};

// ==========================================
// REPUESTOS
// ==========================================
let catalogoRepuestos = [];

async function cargarCatalogoRepuestos() {
    try {
        catalogoRepuestos = await API.Repuestos.listarActivos();
    } catch (error) {
        console.error("Error al cargar repuestos:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogoRepuestos();
});

function agregarFilaRepuesto() {
    const contenedor = document.getElementById('contenedorRepuestos');
    const idFila = `repuesto_row_${Date.now()}`;

    let opcionesHTML = '<option value="" disabled selected>Selecciona un material...</option>';
    catalogoRepuestos.forEach(rep => {
        opcionesHTML += `<option value="${rep.idRepuesto}" data-unidad="${rep.unidadMedida}">
            ${rep.nombre} (Stock: ${rep.stockActual} ${rep.unidadMedida})
        </option>`;
    });

    const html = `
        <div class="row g-2 mb-2 align-items-center repuesto-item" id="${idFila}">
            <div class="col-7">
                <select class="form-select form-select-sm border-primary select-repuesto" onchange="actualizarUnidad('${idFila}')">
                    ${opcionesHTML}
                </select>
            </div>
            <div class="col-3">
                <div class="input-group input-group-sm">
                    <input type="number" class="form-control input-cantidad" placeholder="0.0" step="0.1" min="0.1">
                    <span class="input-group-text bg-light text-muted span-unidad" style="font-size: 0.7rem;">U.</span>
                </div>
            </div>
            <div class="col-2 text-end">
                <button type="button" class="btn btn-sm btn-light text-danger rounded-circle shadow-sm" onclick="document.getElementById('${idFila}').remove()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    contenedor.insertAdjacentHTML('beforeend', html);
}

// ==========================================
// ELIMINAR CITA (completada)
// ==========================================
window.eliminarCita = async function(idCita) {
    const confirm = await Swal.fire({
        title: '¿Eliminar esta cita?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;

    try {
        const token = Auth.getToken();
        const BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:8080'
            : 'https://servi-a-c-pro.onrender.com';

        const response = await fetch(`${BASE_URL}/api/citas/${idCita}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Error al eliminar la cita');
        }

        Swal.fire({
            icon: 'success',
            title: 'Cita eliminada',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
        await cargarCitas(currentPage);
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
};

function actualizarUnidad(idFila) {
    const fila = document.getElementById(idFila);
    const select = fila.querySelector('.select-repuesto');
    const unidadSpan = fila.querySelector('.span-unidad');
    const optionSeleccionada = select.options[select.selectedIndex];

    if (optionSeleccionada && optionSeleccionada.dataset.unidad) {
        unidadSpan.textContent = optionSeleccionada.dataset.unidad.substring(0, 3).toUpperCase();
    }
}