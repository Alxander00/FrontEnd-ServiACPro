// ==========================================
// js/perfil.js - Versión con detalles y selección múltiple
// ==========================================

Auth.protectRoute(['CLIENTE']);

// Caché para los datos de detalles
window._detallesData = {
    pedidos: [],
    citas: [],
    solicitudes: []
};

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    cargarDatosLateral();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pedido') === 'confirmado') {
        Swal.fire({
            icon: 'success',
            title: '¡Pedido confirmado!',
            text: 'Gracias por tu compra.',
            toast: true,
            position: 'top-end',
            timer: 4000,
            showConfirmButton: false,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    mostrarSeccion('dashboard');
    actualizarContadoresCliente();

    document.querySelectorAll('.nav-pills-custom .nav-link').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-pills-custom .nav-link').forEach((el) => el.classList.remove('active'));
            btn.classList.add('active');
            await mostrarSeccion(btn.dataset.seccion);
        });
    });
});

// ==========================================
// FUNCIONES DE APOYO
// ==========================================

window.ocultarItem = function (tipo, id) {
    Swal.fire({
        title: '¿Archivar registro?',
        text: 'Desaparecerá de tu historial principal para mantenerlo limpio.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#6c757d',
        confirmButtonText: 'Sí, archivar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            let ocultos = JSON.parse(localStorage.getItem('climapro_archivados') || '{}');
            if (!ocultos[tipo]) ocultos[tipo] = [];
            ocultos[tipo].push(id);
            localStorage.setItem('climapro_archivados', JSON.stringify(ocultos));
            Swal.fire({
                icon: 'success',
                title: 'Archivado',
                toast: true,
                position: 'top-end',
                timer: 2000,
                showConfirmButton: false,
            });
            mostrarSeccion(tipo);
            actualizarContadoresCliente();
        }
    });
};

function archivarMultiples(tipo, ids) {
    if (!ids || ids.length === 0) return;
    let ocultos = JSON.parse(localStorage.getItem('climapro_archivados') || '{}');
    if (!ocultos[tipo]) ocultos[tipo] = [];
    ids.forEach(id => {
        if (!ocultos[tipo].includes(id)) {
            ocultos[tipo].push(id);
        }
    });
    localStorage.setItem('climapro_archivados', JSON.stringify(ocultos));
    Swal.fire({
        icon: 'success',
        title: `Se archivaron ${ids.length} elementos`,
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false,
    });
    mostrarSeccion(tipo);
    actualizarContadoresCliente();
}

function obtenerArchivados(tipo) {
    const ocultos = JSON.parse(localStorage.getItem('climapro_archivados') || '{}');
    return ocultos[tipo] || [];
}

const formatearFecha = (fechaString) => {
    const opciones = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-ES', opciones);
};

// ==========================================
// VER DETALLE
// ==========================================
window.verDetalle = function(tipo, id) {
    const data = window._detallesData[tipo] || [];
    const item = data.find(el => {
        if (tipo === 'pedidos') return el.idPedido === id;
        if (tipo === 'citas') return el.idCita === id;
        if (tipo === 'solicitudes') return el.idSolicitud === id;
        return false;
    });

    if (!item) {
        Swal.fire('Error', 'No se encontraron detalles para este registro.', 'error');
        return;
    }

    let titulo = '';
    let contenido = '';

    if (tipo === 'pedidos') {
        titulo = `Detalles del Pedido #${item.idPedido}`;
        const badgeClass = item.estado === 'Completado' ? 'success' :
                          item.estado === 'Cancelado' ? 'danger' : 'warning';
        let productosHtml = '';
        if (item.detalles && item.detalles.length > 0) {
            productosHtml = `
                <div style="margin-top: 15px;">
                    <strong style="color:#1e293b;">Productos:</strong>
                    <table class="productos-table">
                        <thead>
                            <tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr>
                        </thead>
                        <tbody>
                            ${item.detalles.map(d => `
                                <tr>
                                    <td>${d.nombreProducto || d.producto || 'Producto'}</td>
                                    <td>${d.cantidad || 1}</td>
                                    <td>$${(d.precioUnitario || 0).toFixed(2)}</td>
                                    <td>$${(d.subtotal || 0).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        contenido = `
            <div class="detalle-modal">
                <div class="row"><span class="label">Estado:</span> <span class="value"><span class="badge-status bg-${badgeClass}">${item.estado}</span></span></div>
                <div class="row"><span class="label">Fecha:</span> <span class="value">${formatearFecha(item.fechaPedido)}</span></div>
                <div class="row"><span class="label">Total:</span> <span class="value text-success" style="font-weight:700; font-size:1.2rem;">$${item.total.toFixed(2)}</span></div>
                <div class="row"><span class="label">Dirección de instalación:</span> <span class="value">${item.direccion_instalacion || 'No especificada'}</span></div>
                ${item.metodoPago ? `<div class="row"><span class="label">Método de pago:</span> <span class="value">${item.metodoPago}</span></div>` : ''}
                ${productosHtml}
            </div>
        `;
    } else if (tipo === 'citas') {
        titulo = `Detalles de la Cita #${item.idCita}`;
        let badgeClass = '';
        if (item.estado === 'PROGRAMADA') badgeClass = 'primary';
        else if (item.estado === 'EN_PROCESO') badgeClass = 'warning';
        else if (item.estado === 'COMPLETADA') badgeClass = 'success';
        else badgeClass = 'danger';
        contenido = `
            <div class="detalle-modal">
                <div class="row"><span class="label">Estado:</span> <span class="value"><span class="badge-status bg-${badgeClass}">${item.estado}</span></span></div>
                <div class="row"><span class="label">Técnico asignado:</span> <span class="value">${item.nombreTecnico || 'No asignado'}</span></div>
                <div class="row"><span class="label">Fecha de inicio:</span> <span class="value">${formatearFecha(item.fechaInicio)}</span></div>
                <div class="row"><span class="label">Dirección:</span> <span class="value">${item.direccionCliente || 'No especificada'}</span></div>
                ${item.notas ? `<div class="row"><span class="label">Notas:</span> <span class="value">${item.notas}</span></div>` : ''}
                ${item.telefonoCliente ? `<div class="row"><span class="label">Teléfono:</span> <span class="value">${item.telefonoCliente}</span></div>` : ''}
            </div>
        `;
    } else if (tipo === 'solicitudes') {
        titulo = `Detalles de la Solicitud #${item.idSolicitud}`;
        const badgeClass = item.estado === 'PENDIENTE' ? 'warning' :
                          item.estado === 'ASIGNADA' ? 'success' : 'danger';
        contenido = `
            <div class="detalle-modal">
                <div class="row"><span class="label">Estado:</span> <span class="value"><span class="badge-status bg-${badgeClass}">${item.estado}</span></span></div>
                <div class="row"><span class="label">Tipo de servicio:</span> <span class="value">${item.tipoServicio ? item.tipoServicio.replace('_', ' ') : 'No especificado'}</span></div>
                <div class="row"><span class="label">Mensaje:</span> <span class="value">${item.mensaje || 'Sin mensaje'}</span></div>
                <div class="row"><span class="label">Fecha preferida:</span> <span class="value">${item.fechaPreferida ? new Date(item.fechaPreferida).toLocaleDateString() : 'Cualquier fecha'}</span></div>
                <div class="row"><span class="label">Fecha de creación:</span> <span class="value">${formatearFecha(item.fechaCreacion || item.createdAt || new Date())}</span></div>
                ${item.respuesta ? `<div class="row"><span class="label">Respuesta del soporte:</span> <span class="value">${item.respuesta}</span></div>` : ''}
            </div>
        `;
    }

    Swal.fire({
        title: titulo,
        html: contenido,
        icon: 'info',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#0d6efd',
        width: 700,
        customClass: {
            popup: 'swal2-popup',
            htmlContainer: 'swal2-html-container'
        },
        showCloseButton: true,
        focusConfirm: true,
    });
};

// ==========================================
// CARGAR DATOS DEL USUARIO EN EL LATERAL
// ==========================================
async function cargarDatosLateral() {
    const user = Auth.getUser();
    if (!user) return;

    document.getElementById('lblNombreLateral').innerText = user.nombre || 'Usuario';
    document.getElementById('lblEmailLateral').innerText = user.email || '';

    const avatarImg = document.getElementById('profileAvatarImg');
    if (user.fotoUrl) {
        avatarImg.src = user.fotoUrl;
    } else {
        const nombre = encodeURIComponent(user.nombre || 'Usuario');
        avatarImg.src = `https://ui-avatars.com/api/?name=${nombre}&background=0d6efd&color=fff&size=150&font-size=0.4&bold=true`;
    }
}

// ==========================================
// SUBIR AVATAR
// ==========================================
window.subirAvatar = async function (input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
        Swal.fire('Imagen muy grande', 'El tamaño máximo permitido es de 2MB.', 'warning');
        input.value = '';
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    Swal.fire({
        title: 'Subiendo foto...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const token = Auth.getToken();
        const res = await fetch(`${API_URL}/usuarios/actualizar-avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!res.ok) {
            const errorData = await res.text();
            throw new Error(errorData || "Error al subir la foto");
        }

        const usuarioActualizado = await res.json();
        const user = Auth.getUser();
        const updatedUser = { ...user, fotoUrl: usuarioActualizado.fotoUrl };
        localStorage.setItem('climapro_user', JSON.stringify(updatedUser));

        Swal.close();
        await Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Foto actualizada',
            showConfirmButton: false,
            timer: 2000
        });

        await cargarDatosLateral();
        const seccionActiva = document.querySelector('.nav-pills-custom .nav-link.active');
        if (seccionActiva) await mostrarSeccion(seccionActiva.dataset.seccion);

    } catch (e) {
        Swal.close();
        console.error(e);
        Swal.fire('Error', e.message || 'Fallo de conexión al subir la imagen.', 'error');
    } finally {
        input.value = '';
    }
};

// ==========================================
// CARGAR ESTADÍSTICAS DEL CLIENTE (sin gráficos)
// ==========================================
async function cargarEstadisticasCliente() {
    const user = Auth.getUser();
    if (!user) return;

    try {
        const response = await fetch(`${API_URL}/api/estadisticas/cliente/${user.idUsuario}`, {
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        const data = await response.json();

        // Actualizar contadores
        const totalPedidos = document.getElementById('totalPedidosCliente');
        const totalGastado = document.getElementById('totalGastadoCliente');
        const totalProductos = document.getElementById('totalProductosComprados');
        if (totalPedidos) totalPedidos.textContent = data.totalPedidos || 0;
        if (totalGastado) totalGastado.textContent = `$${(data.totalGastado || 0).toFixed(2)}`;
        if (totalProductos) {
            const count = data.productosMasComprados.reduce((acc, p) => acc + p.comprados, 0);
            totalProductos.textContent = count || 0;
        }

        // Productos más comprados
        const container = document.getElementById('productosMasComprados');
        if (data.productosMasComprados && data.productosMasComprados.length > 0) {
            container.innerHTML = data.productosMasComprados.map(p => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${p.nombre}
                    <span class="badge bg-primary rounded-pill">${p.comprados} uds.</span>
                </li>
            `).join('');
        } else {
            container.innerHTML = '<li class="list-group-item text-muted">Aún no has comprado productos.</li>';
        }
    } catch (error) {
        console.error('Error cargando estadísticas del cliente:', error);
    }
}

// ==========================================
// MOSTRAR SECCIÓN
// ==========================================
async function mostrarSeccion(seccion) {
    const user = Auth.getUser();
    const content = document.getElementById('perfilContent');
    content.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';

    // ============================
    // DASHBOARD (sin gráficos)
    // ============================
    if (seccion === 'dashboard') {
        const iniciales = user.nombre.charAt(0) + (user.apellido ? user.apellido.charAt(0) : '');
        content.innerHTML = `
            <div class="d-flex align-items-center mb-5 pb-4 border-bottom">
                <div class="avatar-lg me-4">${iniciales}</div>
                <div>
                    <h2 class="fw-bold text-dark mb-1">¡Hola, ${user.nombre}!</h2>
                    <p class="text-muted mb-0"><i class="fas fa-envelope me-2 text-primary"></i>${user.email}</p>
                </div>
            </div>

            <!-- Estadísticas rápidas -->
            <div class="row g-4 mb-4">
                <div class="col-md-4">
                    <div class="stat-card d-flex align-items-center gap-3">
                        <div class="stat-icon bg-primary bg-opacity-10 text-primary">
                            <i class="fas fa-shopping-bag"></i>
                        </div>
                        <div>
                            <div class="stat-number" id="totalPedidosCliente">0</div>
                            <div class="stat-label">Pedidos completados</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card d-flex align-items-center gap-3">
                        <div class="stat-icon bg-success bg-opacity-10 text-success">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div>
                            <div class="stat-number" id="totalGastadoCliente">$0.00</div>
                            <div class="stat-label">Total gastado</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card d-flex align-items-center gap-3">
                        <div class="stat-icon bg-warning bg-opacity-10 text-warning">
                            <i class="fas fa-tag"></i>
                        </div>
                        <div>
                            <div class="stat-number" id="totalProductosComprados">0</div>
                            <div class="stat-label">Productos comprados</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Productos más comprados -->
            <h5 class="fw-bold text-dark mb-3"><i class="fas fa-star text-warning me-2"></i>Productos más comprados</h5>
            <ul class="list-group list-group-flush" id="productosMasComprados">
                <li class="list-group-item text-muted">Cargando...</li>
            </ul>

            <!-- Botón de acción -->
            <div class="mt-4">
                <a href="catalogo.html" class="btn btn-primary rounded-pill px-4 fw-bold">
                    <i class="fas fa-store me-2"></i>Seguir comprando
                </a>
            </div>
        `;

        // Cargar estadísticas después de renderizar
        setTimeout(() => {
            cargarEstadisticasCliente();
        }, 100);
    }

    // ============================
    // PEDIDOS
    // ============================
    else if (seccion === 'pedidos') {
        try {
            const todosLosPedidos = await API.Pedidos.listarPorUsuario(user.idUsuario);
            const archivados = obtenerArchivados('pedidos');
            const pedidosVisibles = todosLosPedidos.filter((p) => !archivados.includes(p.idPedido));

            window._detallesData.pedidos = pedidosVisibles;

            if (pedidosVisibles.length === 0) {
                content.innerHTML = `
                    <div class="section-header"><h4><i class="fas fa-box-open me-2"></i>Mis Pedidos</h4></div>
                    <div class="empty-state text-center">
                        <i class="fas fa-shopping-basket"></i>
                        <h5 class="fw-bold text-dark mt-3">Historial vacío</h5>
                        <p class="text-muted">No tienes pedidos activos en tu historial.</p>
                        <a href="catalogo.html" class="btn btn-primary rounded-pill px-4 mt-2 fw-bold">Explorar Catálogo</a>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="section-header">
                    <h4><i class="fas fa-box-open me-2"></i>Mis Pedidos</h4>
                    <div class="btn-group">
                        <button class="btn btn-accion btn-accion-outline-secondary" onclick="toggleSeleccionarTodos('pedidos')"><i class="fas fa-check-double me-1"></i>Seleccionar todo</button>
                        <button class="btn btn-accion btn-accion-outline-danger" onclick="eliminarSeleccionados('pedidos')"><i class="fas fa-trash-alt me-1"></i>Eliminar selec.</button>
                        <button class="btn btn-accion btn-accion-danger" onclick="eliminarTodos('pedidos')"><i class="fas fa-trash-alt me-1"></i>Eliminar todos</button>
                    </div>
                </div>
                <div class="grid-cards" id="grid-pedidos">
            `;

            pedidosVisibles.forEach((pedido) => {
                const esFinalizado = (pedido.estado === 'Completado' || pedido.estado === 'Cancelado');
                const badgeClass = 
                    pedido.estado === 'Completado' ? 'success' :
                    pedido.estado === 'Cancelado' ? 'danger' : 'warning';
                const btnArchivar = esFinalizado
                    ? `<button class="btn-archive-individual" onclick="ocultarItem('pedidos', ${pedido.idPedido})" title="Archivar individual"><i class="fas fa-archive"></i></button>`
                    : '';

                html += `
                    <div class="list-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="form-check">
                                    <input class="form-check-input select-item" type="checkbox" value="${pedido.idPedido}" data-tipo="pedidos" id="pedido_${pedido.idPedido}" ${!esFinalizado ? 'disabled' : ''}>
                                    <label class="form-check-label" for="pedido_${pedido.idPedido}">Pedido #${pedido.idPedido}</label>
                                </div>
                                <span class="badge-status bg-${badgeClass}">${pedido.estado}</span>
                            </div>
                            <div class="card-info-line">
                                <i class="fas fa-calendar-alt text-primary"></i>
                                <span>${formatearFecha(pedido.fechaPedido)}</span>
                            </div>
                            <div class="card-info-line">
                                <i class="fas fa-dollar-sign text-success"></i>
                                <strong class="text-success">$${pedido.total.toFixed(2)}</strong>
                            </div>
                            <div class="card-info-line">
                                <i class="fas fa-map-marker-alt text-danger"></i>
                                <span>${pedido.direccion_instalacion || 'Solo entrega'}</span>
                            </div>
                            <div class="d-flex justify-content-end mt-2 gap-1">
                                <button class="btn-detalle" onclick="verDetalle('pedidos', ${pedido.idPedido})" title="Ver detalles"><i class="fas fa-eye"></i></button>
                                ${btnArchivar}
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
            content.innerHTML = html;
        } catch (error) {
            content.innerHTML = `<div class="alert alert-danger m-3">Error al cargar pedidos: ${error.message}</div>`;
        }
    }

    // ============================
    // CITAS
    // ============================
    else if (seccion === 'citas') {
        try {
            const todasLasCitas = await API.request(`/api/citas/cliente/${user.idUsuario}`);
            const archivados = obtenerArchivados('citas');
            const citasVisibles = todasLasCitas.filter((c) => !archivados.includes(c.idCita));

            window._detallesData.citas = citasVisibles;

            if (citasVisibles.length === 0) {
                content.innerHTML = `
                    <div class="section-header"><h4><i class="fas fa-calendar-check me-2"></i>Visitas Técnicas</h4></div>
                    <div class="empty-state text-center">
                        <i class="fas fa-tools"></i>
                        <h5 class="fw-bold text-dark mt-3">No hay citas</h5>
                        <p class="text-muted">No tienes visitas técnicas programadas.</p>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="section-header">
                    <h4><i class="fas fa-calendar-check me-2"></i>Visitas Técnicas</h4>
                    <div class="btn-group">
                        <button class="btn btn-accion btn-accion-outline-secondary" onclick="toggleSeleccionarTodos('citas')"><i class="fas fa-check-double me-1"></i>Seleccionar todo</button>
                        <button class="btn btn-accion btn-accion-outline-danger" onclick="eliminarSeleccionados('citas')"><i class="fas fa-trash-alt me-1"></i>Eliminar selec.</button>
                        <button class="btn btn-accion btn-accion-danger" onclick="eliminarTodos('citas')"><i class="fas fa-trash-alt me-1"></i>Eliminar todos</button>
                    </div>
                </div>
                <div class="grid-cards" id="grid-citas">
            `;

            citasVisibles.forEach((cita) => {
                const esFinalizado = (cita.estado === 'COMPLETADA' || cita.estado === 'CANCELADA');
                let badgeClass = '';
                if (cita.estado === 'PROGRAMADA') badgeClass = 'primary';
                else if (cita.estado === 'EN_PROCESO') badgeClass = 'warning';
                else if (cita.estado === 'COMPLETADA') badgeClass = 'success';
                else badgeClass = 'danger';

                // 1. Declaramos el botón de archivar (que se había borrado)
                const btnArchivar = esFinalizado
                    ? `<button class="btn-archive-individual" onclick="ocultarItem('citas', ${cita.idCita})" title="Archivar individual"><i class="fas fa-archive"></i></button>`
                    : '';

                // 1. Rediseñamos el botón de Chat para incluir la burbuja de notificación roja (oculta por defecto)
                const btnChat = (!esFinalizado && cita.idTecnico)
                    ? `<button class="btn btn-outline-primary btn-sm position-relative fw-bold rounded-pill px-3" 
                            onclick="abrirChatConTecnico(${cita.idTecnico}, '${cita.nombreTecnico}', ${cita.idCita})">
                        <i class="fas fa-comment-dots me-1"></i> Chat
                        <span class="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-light rounded-circle" 
                                id="badge-chat-${cita.idCita}" style="display: none;">
                            <span class="visually-hidden">Mensajes nuevos</span>
                        </span>
                    </button>`
                    : '';

                // 2. Nuevo diseño de la tarjeta (Más espacio, mejor jerarquía)
                html += `
                    <div class="card border-0 shadow-sm mb-3 cita-card-premium transition-hover">
                        <div class="card-header bg-white border-bottom-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center gap-2">
                                <div class="bg-light rounded-circle p-2 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                    <i class="fas fa-tools text-primary"></i>
                                </div>
                                <div>
                                    <h6 class="mb-0 fw-bold text-dark">Cita #${cita.idCita}</h6>
                                    <small class="text-muted">${formatearFecha(cita.fechaInicio)}</small>
                                </div>
                            </div>
                            <span class="badge bg-${badgeClass} bg-opacity-10 text-${badgeClass} px-3 py-2 rounded-pill fw-bold border border-${badgeClass} border-opacity-25">
                                ${cita.estado}
                            </span>
                        </div>
                        
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="d-flex align-items-start gap-2">
                                        <i class="fas fa-user-cog text-info mt-1"></i>
                                        <div>
                                            <small class="d-block text-muted text-uppercase fw-bold" style="font-size: 0.7rem;">Técnico Asignado</small>
                                            <span class="fw-semibold text-dark">${cita.nombreTecnico || 'Pendiente de asignación'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="d-flex align-items-start gap-2">
                                        <i class="fas fa-map-marker-alt text-danger mt-1"></i>
                                        <div>
                                            <small class="d-block text-muted text-uppercase fw-bold" style="font-size: 0.7rem;">Ubicación</small>
                                            <span class="text-dark small">${cita.direccionCliente || 'No especificada'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card-footer bg-white border-top-0 pb-3 pt-0 d-flex justify-content-between align-items-center">
                            <div class="form-check">
                                <input class="form-check-input select-item" type="checkbox" value="${cita.idCita}" data-tipo="citas" id="cita_${cita.idCita}" ${!esFinalizado ? 'disabled' : ''}>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-light btn-sm text-secondary rounded-pill px-3 fw-bold border" onclick="verDetalle('citas', ${cita.idCita})" title="Ver detalles completos">
                                    <i class="fas fa-eye me-1"></i> Detalles
                                </button>
                                ${btnChat}
                                ${btnArchivar}
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
            content.innerHTML = html;
        } catch (error) {
            content.innerHTML = `<div class="alert alert-danger m-3">Error al cargar citas.</div>`;
        }
    }

    // ============================
    // SOLICITUDES
    // ============================
    else if (seccion === 'solicitudes') {
        try {
            const todasLasSol = await API.request(`/api/solicitudes/cliente/${user.idUsuario}`);
            const archivados = obtenerArchivados('solicitudes');
            const solVisibles = todasLasSol.filter((s) => !archivados.includes(s.idSolicitud));

            window._detallesData.solicitudes = solVisibles;

            if (solVisibles.length === 0) {
                content.innerHTML = `
                    <div class="section-header"><h4><i class="fas fa-headset me-2"></i>Mis Solicitudes</h4></div>
                    <div class="empty-state text-center">
                        <i class="fas fa-inbox"></i>
                        <h5 class="fw-bold text-dark mt-3">Bandeja limpia</h5>
                        <p class="text-muted">No has enviado solicitudes de soporte.</p>
                        <a href="contacto.html" class="btn btn-outline-primary rounded-pill px-4 mt-2 fw-bold">Crear Solicitud</a>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="section-header">
                    <h4><i class="fas fa-headset me-2"></i>Mis Solicitudes</h4>
                    <div class="btn-group">
                        <button class="btn btn-accion btn-accion-outline-secondary" onclick="toggleSeleccionarTodos('solicitudes')"><i class="fas fa-check-double me-1"></i>Seleccionar todo</button>
                        <button class="btn btn-accion btn-accion-outline-danger" onclick="eliminarSeleccionados('solicitudes')"><i class="fas fa-trash-alt me-1"></i>Eliminar selec.</button>
                        <button class="btn btn-accion btn-accion-danger" onclick="eliminarTodos('solicitudes')"><i class="fas fa-trash-alt me-1"></i>Eliminar todos</button>
                    </div>
                </div>
                <div class="grid-cards" id="grid-solicitudes">
            `;

            solVisibles.forEach((sol) => {
                const esFinalizado = (sol.estado === 'ASIGNADA' || sol.estado === 'RECHAZADA');
                const badgeClass =
                    sol.estado === 'PENDIENTE' ? 'warning' :
                    sol.estado === 'ASIGNADA' ? 'success' : 'danger';

                const btnArchivar = esFinalizado
                    ? `<button class="btn-archive-individual" onclick="ocultarItem('solicitudes', ${sol.idSolicitud})" title="Archivar individual"><i class="fas fa-archive"></i></button>`
                    : '';

                html += `
                    <div class="list-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="form-check">
                                    <input class="form-check-input select-item" type="checkbox" value="${sol.idSolicitud}" data-tipo="solicitudes" id="sol_${sol.idSolicitud}" ${!esFinalizado ? 'disabled' : ''}>
                                    <label class="form-check-label" for="sol_${sol.idSolicitud}">Ticket #${sol.idSolicitud}</label>
                                </div>
                                <span class="badge-status bg-${badgeClass}">${sol.estado}</span>
                            </div>
                            <div class="card-info-line">
                                <i class="fas fa-tag text-primary"></i>
                                <span><strong>${sol.tipoServicio.replace('_', ' ')}</strong></span>
                            </div>
                            <div class="card-info-line">
                                <i class="fas fa-comment text-muted"></i>
                                <span>${sol.mensaje || 'Sin mensaje'}</span>
                            </div>
                            <div class="card-info-line">
                                <i class="fas fa-calendar-alt text-muted"></i>
                                <span>Preferencia: ${sol.fechaPreferida ? new Date(sol.fechaPreferida).toLocaleDateString() : 'Cualquier fecha'}</span>
                            </div>
                            <div class="d-flex justify-content-end mt-2 gap-1">
                                <button class="btn-detalle" onclick="verDetalle('solicitudes', ${sol.idSolicitud})" title="Ver detalles"><i class="fas fa-eye"></i></button>
                                ${btnArchivar}
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
            content.innerHTML = html;
        } catch (error) {
            content.innerHTML = `<div class="alert alert-danger m-3">Error al cargar solicitudes.</div>`;
        }
    }

    // ============================
    // DATOS PERSONALES
    // ============================
    else if (seccion === 'datos') {
        content.innerHTML = `
            <div class="section-header">
                <h4><i class="fas fa-user-edit me-2"></i>Datos Personales</h4>
            </div>
            <form id="formDatosPersonales" onsubmit="actualizarDatos(event)">
                <div class="row g-4 mb-4">
                    <div class="col-md-6">
                        <label class="form-label fw-bold text-secondary small text-uppercase">Nombre Completo</label>
                        <input type="text" class="form-control form-control-premium" name="nombres" value="${user.nombre}" required />
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold text-secondary small text-uppercase">Apellidos</label>
                        <input type="text" class="form-control form-control-premium" name="apellidos" value="${user.apellido || ''}" />
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold text-secondary small text-uppercase">
                            Correo Electrónico <i class="fas fa-lock text-muted ms-1" title="Dato no modificable"></i>
                        </label>
                        <input type="email" class="form-control form-control-premium" name="email" value="${user.email}" readonly />
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold text-secondary small text-uppercase">Teléfono / WhatsApp</label>
                        <input type="tel" class="form-control form-control-premium" name="telefono" value="${user.telefono || ''}" />
                    </div>
                    <div class="col-12">
                        <label class="form-label fw-bold text-secondary small text-uppercase">Dirección Base</label>
                        <div class="input-group shadow-sm rounded-4 overflow-hidden border-0">
                            <textarea class="form-control form-control-premium" name="direccion" id="direccionTextarea" rows="2" placeholder="Ingresa tu dirección principal...">${user.direccion || ''}</textarea>
                            <button type="button" class="btn btn-primary px-4 fw-bold" id="btnGeolocalizar">
                                <i class="fas fa-location-crosshairs me-1"></i> Ubicar
                            </button>
                        </div>
                        <div id="geolocStatus" class="small mt-2 fw-semibold"></div>
                    </div>
                </div>

                <div class="mt-5 pt-3 border-top">
                    <h5 class="fw-bold text-dark mb-3"><i class="fas fa-shield-alt text-primary me-2"></i>Cambiar Contraseña</h5>
                    <div class="row g-4">
                        <div class="col-md-6">
                            <label class="form-label fw-bold text-secondary small text-uppercase">Nueva Contraseña</label>
                            <input type="password" id="perfilPassword" class="form-control form-control-premium" placeholder="Mínimo 6 caracteres" />
                            <div class="password-meter">
                                <div id="meterFill" class="password-meter-fill bg-danger"></div>
                            </div>
                            <small id="meterText" class="text-muted" style="font-size: 0.75rem;">Mínimo 6 caracteres recomendados.</small>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold text-secondary small text-uppercase">Confirmar Contraseña</label>
                            <input type="password" id="perfilConfirmPassword" class="form-control form-control-premium" placeholder="Repite la clave exacta" />
                        </div>
                    </div>
                </div>

                <div class="mt-5 text-end pt-3">
                    <button type="submit" class="btn btn-premium">
                        <i class="fas fa-save me-2"></i>Guardar Cambios
                    </button>
                </div>
            </form>
        `;

        // Medidor de fuerza de contraseña
        const passInput = document.getElementById('perfilPassword');
        const meterFill = document.getElementById('meterFill');
        const meterText = document.getElementById('meterText');
        if (passInput) {
            passInput.addEventListener('input', function () {
                const valor = this.value;
                if (valor.length === 0) {
                    meterFill.style.width = '0%';
                    meterText.innerText = 'Mínimo 6 caracteres recomendados.';
                    return;
                }
                let fuerza = 0;
                if (valor.length >= 6) fuerza += 33;
                if (valor.match(/[A-Z]/) || valor.match(/[0-9]/)) fuerza += 33;
                if (valor.length >= 8 && valor.match(/[^A-Za-z0-9]/)) fuerza += 34;
                meterFill.style.width = fuerza + '%';
                if (fuerza <= 33) {
                    meterFill.className = 'password-meter-fill bg-danger';
                    meterText.innerText = 'Fuerza: Débil';
                } else if (fuerza <= 66) {
                    meterFill.className = 'password-meter-fill bg-warning';
                    meterText.innerText = 'Fuerza: Media';
                } else {
                    meterFill.className = 'password-meter-fill bg-success';
                    meterText.innerText = 'Fuerza: Fuerte';
                }
            });
        }

        // Geolocalización
        const btnGeo = document.getElementById('btnGeolocalizar');
        const statusDiv = document.getElementById('geolocStatus');
        const textarea = document.getElementById('direccionTextarea');
        btnGeo.addEventListener('click', () => {
            if (!navigator.geolocation) {
                statusDiv.innerHTML = '<span class="text-danger"><i class="fas fa-exclamation-circle"></i> Tu navegador no soporta geolocalización.</span>';
                return;
            }
            statusDiv.innerHTML = '<span class="text-info"><i class="fas fa-spinner fa-spin"></i> Conectando al satélite...</span>';
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    statusDiv.innerHTML = '<span class="text-info"><i class="fas fa-spinner fa-spin"></i> Obteniendo dirección física...</span>';
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                        const data = await response.json();
                        if (data && data.display_name) {
                            textarea.value = data.display_name;
                            statusDiv.innerHTML = '<span class="text-success"><i class="fas fa-check-circle"></i> Dirección cargada con éxito.</span>';
                            setTimeout(() => statusDiv.innerHTML = '', 3000);
                        } else {
                            statusDiv.innerHTML = '<span class="text-warning">No se pudo traducir la ubicación. Ingresa manualmente.</span>';
                        }
                    } catch (error) {
                        statusDiv.innerHTML = '<span class="text-danger">Error de red. Intenta de nuevo.</span>';
                    }
                },
                (error) => {
                    let msg = 'Error de ubicación.';
                    if (error.code === error.PERMISSION_DENIED) msg = 'Debes permitir el acceso a la ubicación en tu navegador.';
                    statusDiv.innerHTML = `<span class="text-danger"><i class="fas fa-times-circle"></i> ${msg}</span>`;
                }
            );
        });
    }

    // ============================
    // EQUIPOS
    // ============================
    else if (seccion === 'equipos') {
        try {
            const equipos = await API.Equipos.listarPorCliente(user.idUsuario);

            if (!equipos || equipos.length === 0) {
                content.innerHTML = `
                    <div class="section-header"><h4><i class="fas fa-snowflake me-2"></i>Mis Equipos Instalados</h4></div>
                    <div class="empty-state text-center">
                        <i class="fas fa-box-open"></i>
                        <h5 class="fw-bold text-dark mt-3">Aún no tienes equipos registrados</h5>
                        <p class="text-muted">Cuando realices una compra con instalación, tus equipos aparecerán aquí.</p>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="section-header"><h4><i class="fas fa-snowflake me-2"></i>Mis Equipos Instalados</h4></div>
                <div class="grid-cards">
            `;

            const hoy = new Date();
            let equiposNecesitanMantenimiento = 0;

            equipos.forEach((equipo) => {
                let fechaBase = equipo.fechaUltimoMantenimiento
                    ? new Date(equipo.fechaUltimoMantenimiento)
                    : new Date(equipo.fechaInstalacion);
                let proximaFecha = new Date(fechaBase);
                proximaFecha.setMonth(proximaFecha.getMonth() + 6);

                const diffTime = proximaFecha - hoy;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let alertaHtml = '';
                let borderClass = 'equipo-ok';
                let btnAgenda = '';

                if (diffDays <= 0) {
                    equiposNecesitanMantenimiento++;
                    borderClass = 'equipo-urgente';
                    alertaHtml = `
                        <div class="alert alert-danger p-2 small fw-bold mb-2">
                            <i class="fas fa-exclamation-triangle me-2"></i>¡Urgente! (Venció el ${proximaFecha.toLocaleDateString()})
                        </div>
                    `;
                    btnAgenda = `<a href="contacto.html" class="btn btn-danger btn-sm w-100 fw-bold mt-2"><i class="fas fa-calendar-plus me-1"></i> Agendar</a>`;
                } else if (diffDays <= 30) {
                    equiposNecesitanMantenimiento++;
                    borderClass = 'equipo-alerta';
                    alertaHtml = `
                        <div class="alert alert-warning p-2 small fw-bold mb-2">
                            <i class="fas fa-bell me-2"></i>Próximo en ${diffDays} días.
                        </div>
                    `;
                    btnAgenda = `<a href="contacto.html" class="btn btn-warning btn-sm w-100 fw-bold mt-2 text-dark"><i class="fas fa-calendar-plus me-1"></i> Prevenir</a>`;
                } else {
                    alertaHtml = `
                        <div class="alert alert-success p-2 small fw-bold mb-2">
                            <i class="fas fa-check-circle me-2"></i>Óptimo. Servicio en ${diffDays} días.
                        </div>
                    `;
                }

                html += `
                    <div class="list-card ${borderClass}">
                        <div class="card-body">
                            ${alertaHtml}
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <h5 class="fw-bold text-dark mb-0">${equipo.marca} ${equipo.modelo || ''}</h5>
                                <span class="badge bg-primary rounded-pill">${equipo.capacidadBtu} BTU</span>
                            </div>
                            <div class="card-info-line">
                                <i class="fas fa-map-marker-alt text-primary"></i>
                                <span>${equipo.ubicacionEnCasa || 'No especificada'}</span>
                            </div>
                            <div class="card-info-line">
                                <i class="fas fa-calendar-alt text-primary"></i>
                                <span>Instalación: ${formatearFecha(equipo.fechaInstalacion)}</span>
                            </div>
                            <div class="card-info-line">
                                <i class="fas fa-tools text-info"></i>
                                <span>Último servicio: ${equipo.fechaUltimoMantenimiento ? formatearFecha(equipo.fechaUltimoMantenimiento) : 'Ninguno'}</span>
                            </div>
                            ${btnAgenda}
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
            content.innerHTML = html;

            const badgeEquipos = document.getElementById('badgeEquiposCliente');
            if (badgeEquipos && equiposNecesitanMantenimiento > 0) {
                badgeEquipos.textContent = equiposNecesitanMantenimiento;
                badgeEquipos.style.display = 'inline-block';
                badgeEquipos.classList.remove('bg-warning');
                badgeEquipos.classList.add('bg-danger');
            } else if (badgeEquipos) {
                badgeEquipos.style.display = 'none';
            }
        } catch (error) {
            content.innerHTML = `<div class="alert alert-danger m-3">Error al cargar tus equipos: ${error.message}</div>`;
        }
    }
}

// ==========================================
// FUNCIONES DE SELECCIÓN Y ELIMINACIÓN
// ==========================================

window.toggleSeleccionarTodos = function(tipo) {
    const gridId = `grid-${tipo}`;
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const checkboxes = grid.querySelectorAll('.select-item:not(:disabled)');
    const todosMarcados = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !todosMarcados);
};

window.eliminarSeleccionados = function(tipo) {
    const gridId = `grid-${tipo}`;
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const checkboxes = grid.querySelectorAll('.select-item:checked');
    if (checkboxes.length === 0) {
        Swal.fire('Atención', 'No has seleccionado ningún elemento finalizado.', 'info');
        return;
    }
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
    Swal.fire({
        title: `¿Archivar ${ids.length} elementos?`,
        text: 'Desaparecerán de tu historial principal.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sí, archivar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            archivarMultiples(tipo, ids);
        }
    });
};

window.eliminarTodos = function(tipo) {
    const gridId = `grid-${tipo}`;
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const checkboxes = grid.querySelectorAll('.select-item:not(:disabled)');
    if (checkboxes.length === 0) {
        Swal.fire('Atención', 'No hay elementos finalizados para archivar.', 'info');
        return;
    }
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
    Swal.fire({
        title: `¿Archivar todos (${ids.length})?`,
        text: 'Esta acción eliminará todos los registros finalizados visibles de esta sección.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sí, eliminar todos',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            archivarMultiples(tipo, ids);
        }
    });
};

// ==========================================
// ACTUALIZAR DATOS
// ==========================================
window.actualizarDatos = async function (event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const user = Auth.getUser();
    const btnSubmit = event.target.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

    const password = document.getElementById('perfilPassword')?.value || '';
    const confirmPassword = document.getElementById('perfilConfirmPassword')?.value || '';

    if (password || confirmPassword) {
        if (password.length < 6) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios';
            return Swal.fire('Seguridad', 'La nueva contraseña debe tener al menos 6 caracteres.', 'warning');
        }
        if (password !== confirmPassword) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios';
            return Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
        }
    }

    const updatedUser = {
        ...user,
        nombre: formData.get('nombres'),
        apellido: formData.get('apellidos'),
        telefono: formData.get('telefono'),
        direccion: formData.get('direccion'),
        password: password || null,
    };

    try {
        await API.Usuarios.actualizar(user.idUsuario, {
            nombre: updatedUser.nombre,
            apellido: updatedUser.apellido,
            email: user.email,
            dui: user.dui,
            telefono: updatedUser.telefono,
            direccion: updatedUser.direccion,
            rol: user.rol,
            activo: user.activo,
            password: updatedUser.password,
        });
        localStorage.setItem('climapro_user', JSON.stringify(updatedUser));
        if (typeof actualizarNavAuth === 'function') actualizarNavAuth();
        await cargarDatosLateral();
        Swal.fire({
            icon: 'success',
            title: 'Perfil actualizado',
            text: 'Tus datos se guardaron correctamente.',
            confirmButtonColor: '#0d6efd',
        });
        await mostrarSeccion('dashboard');
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios';
    }
};

// ==========================================
// ABRIR CHAT CON TÉCNICO (desde perfil) - VERSIÓN CON ID CITA
// ==========================================
window.abrirChatConTecnico = async function(idTecnico, nombreTecnico, idCita) {
    const user = Auth.getUser();
    if (!user) {
        Swal.fire('Error', 'Debes iniciar sesión.', 'error');
        return;
    }

    try {
        // 1. Obtener o crear la conversación con idCita
        const response = await fetch(`${API_URL}/api/conversaciones/iniciar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({
                idCliente: user.idUsuario,
                idTecnico: idTecnico,
                idCita: idCita  // AHORA ENVÍA EL ID DE LA CITA
            })
        });

        if (!response.ok) {
            throw new Error('Error al iniciar conversación');
        }

        const conversacion = await response.json();
        const conversacionId = conversacion.id;

        // 2. Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalChat'));
        modal.show();

        // 3. Inicializar chat
        modal._element.addEventListener('shown.bs.modal', function onShown() {
            modal._element.removeEventListener('shown.bs.modal', onShown);
            Chat.init(conversacionId, 'chatContainer', nombreTecnico || 'Técnico');
        });

        // 4. Limpiar al cerrar
        modal._element.addEventListener('hidden.bs.modal', function onHidden() {
            modal._element.removeEventListener('hidden.bs.modal', onHidden);
            Chat.destroy();
            document.getElementById('chatContainer').innerHTML = '';
            document.getElementById('chatNombreDestinatario').textContent = '';
        });

    } catch (error) {
        console.error('Error al abrir chat:', error);
        Swal.fire('Error', 'No se pudo iniciar la conversación.', 'error');
    }
};

// ==========================================
// CONTADORES
// ==========================================
async function actualizarContadoresCliente() {
    const user = Auth.getUser();
    if (!user) return;
    try {
        const pedidosPendientes = await API.request(`/api/pedidos/conteos/pendientes/cliente/${user.idUsuario}`);
        const badgePedidos = document.getElementById('badgePedidosCliente');
        if (pedidosPendientes > 0) {
            badgePedidos.textContent = pedidosPendientes;
            badgePedidos.style.display = 'inline-block';
        } else {
            badgePedidos.style.display = 'none';
        }

        const citasPendientes = await API.request(`/api/citas/conteos/pendientes/cliente/${user.idUsuario}`);
        const badgeCitas = document.getElementById('badgeCitasCliente');
        if (citasPendientes > 0) {
            badgeCitas.textContent = citasPendientes;
            badgeCitas.style.display = 'inline-block';
        } else {
            badgeCitas.style.display = 'none';
        }

        const solicitudesPendientes = await API.request(`/api/solicitudes/conteos/pendientes/cliente/${user.idUsuario}`);
        const badgeSolicitudes = document.getElementById('badgeSolicitudesCliente');
        if (solicitudesPendientes > 0) {
            badgeSolicitudes.textContent = solicitudesPendientes;
            badgeSolicitudes.style.display = 'inline-block';
        } else {
            badgeSolicitudes.style.display = 'none';
        }
    } catch (error) {
        console.error('Error cargando contadores cliente:', error);
    }
}