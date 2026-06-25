// js/perfil.js

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pedido') === 'confirmado') {
        Swal.fire({ icon: 'success', title: '¡Pedido confirmado!', text: 'Gracias por tu compra.', toast: true, position: 'top-end', timer: 4000 });
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    mostrarSeccion('dashboard');
    actualizarContadoresCliente();

    document.querySelectorAll('#perfilMenu a[data-seccion]').forEach(enlace => {
        enlace.addEventListener('click', async (e) => {
            e.preventDefault();
            document.querySelectorAll('#perfilMenu a').forEach(el => el.classList.remove('active'));
            const target = e.target.closest('a');
            target.classList.add('active');
            await mostrarSeccion(target.dataset.seccion);
        });
    });
});

window.ocultarItem = function(tipo, id) {
    Swal.fire({
        title: '¿Archivar registro?',
        text: "Desaparecerá de tu historial principal para mantenerlo limpio.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#6c757d',
        confirmButtonText: 'Sí, archivar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            let ocultos = JSON.parse(localStorage.getItem('climapro_archivados') || '{}');
            if(!ocultos[tipo]) ocultos[tipo] = [];
            ocultos[tipo].push(id);
            localStorage.setItem('climapro_archivados', JSON.stringify(ocultos));
            Swal.fire({icon: 'success', title: 'Archivado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false});
            mostrarSeccion(tipo);
            actualizarContadoresCliente();
        }
    });
};

function obtenerArchivados(tipo) {
    const ocultos = JSON.parse(localStorage.getItem('climapro_archivados') || '{}');
    return ocultos[tipo] || [];
}

const formatearFecha = (fechaString) => {
    const opciones = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-ES', opciones);
};

async function mostrarSeccion(seccion) {
    const user = Auth.getUser();
    const content = document.getElementById('perfilContent');
    content.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';

    if (seccion === 'dashboard') {
        const iniciales = user.nombre.charAt(0) + (user.apellido ? user.apellido.charAt(0) : '');
        content.innerHTML = `
            <div class="d-flex align-items-center mb-5 border-bottom pb-4">
                <div class="avatar-lg bg-primary bg-opacity-10 text-primary rounded-circle fw-bold me-4 border border-primary border-opacity-25">${iniciales}</div>
                <div><h2 class="fw-bold text-dark mb-1">¡Hola, ${user.nombre}!</h2><p class="text-muted mb-0"><i class="fas fa-envelope me-2 text-info"></i>${user.email}</p></div>
            </div>
            <h5 class="fw-bold text-dark mb-3">Resumen de Actividad</h5>
            <div class="row g-4">
                <div class="col-md-6"><div class="card stat-card bg-light border-0 h-100 p-4"><div class="d-flex justify-content-between align-items-start"><div><h3 class="fw-bold text-dark mb-1">Accesos</h3><p class="text-muted mb-3">Revisa tus compras recientes</p><button class="btn btn-primary btn-sm rounded-pill px-3 fw-bold" onclick="document.querySelector('[data-seccion=pedidos]').click()">Ir a Pedidos</button></div><div class="text-white p-3 rounded-circle fs-3 shadow-sm" style="background-color: #0d6efd;"><i class="fas fa-box-open"></i></div></div></div></div>
                <div class="col-md-6"><div class="card stat-card bg-light border-0 h-100 p-4"><div class="d-flex justify-content-between align-items-start"><div><h3 class="fw-bold text-dark mb-1">Soporte</h3><p class="text-muted mb-3">Agenda una visita técnica</p><a href="contacto.html" class="btn btn-info text-white btn-sm rounded-pill px-3 fw-bold">Contactar</a></div><div class="text-white p-3 rounded-circle fs-3 shadow-sm" style="background-color: #00d4ff;"><i class="fas fa-tools"></i></div></div></div></div>
            </div>
        `;
    } 
    else if (seccion === 'pedidos') {
        try {
            const todosLosPedidos = await API.Pedidos.listarPorUsuario(user.idUsuario);
            const archivados = obtenerArchivados('pedidos');
            const pedidosVisibles = todosLosPedidos.filter(p => !archivados.includes(p.idPedido));
            if (pedidosVisibles.length === 0) {
                content.innerHTML = `<h4 class="fw-bold text-dark border-bottom pb-3 mb-4"><i class="fas fa-box-open text-primary me-2"></i>Mis Pedidos</h4><div class="text-center py-5"><div class="bg-light rounded-circle d-inline-flex p-4 mb-3"><i class="fas fa-shopping-basket fa-3x text-muted"></i></div><h5 class="fw-bold text-dark">Historial vacío</h5><p class="text-muted">No tienes pedidos activos en tu historial.</p><a href="catalogo.html" class="btn btn-primary rounded-pill px-4 mt-2 fw-bold">Explorar Catálogo</a></div>`;
                return;
            }
            let html = `<h4 class="fw-bold text-dark border-bottom pb-3 mb-4"><i class="fas fa-box-open text-primary me-2"></i>Mis Pedidos</h4><div class="d-flex flex-column gap-3">`;
            pedidosVisibles.forEach(pedido => {
                const isCompletado = pedido.estado === 'Completado' || pedido.estado === 'Cancelado';
                const bgBadge = pedido.estado === 'Completado' ? 'success' : (pedido.estado === 'Cancelado' ? 'danger' : 'warning text-dark');
                const btnArchivar = isCompletado ? `<button class="btn btn-sm btn-outline-secondary rounded-circle" onclick="ocultarItem('pedidos', ${pedido.idPedido})" title="Archivar pedido"><i class="fas fa-archive"></i></button>` : '';
                html += `
                    <div class="card border border-light shadow-sm rounded-4">
                        <div class="card-header bg-white border-bottom-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                            <div><span class="fw-bold fs-5 text-dark">Pedido #${pedido.idPedido}</span><span class="badge bg-${bgBadge} bg-opacity-10 text-${bgBadge.split(' ')[0]} border ms-2 px-3 py-2 rounded-pill">${pedido.estado}</span></div>
                            ${btnArchivar}
                        </div>
                        <div class="card-body px-4 pb-4 pt-2">
                            <div class="row g-3 mb-3 bg-light rounded-3 p-3">
                                <div class="col-sm-6 d-flex align-items-center"><i class="far fa-calendar-alt text-primary fs-5 me-3"></i><div><small class="text-muted d-block lh-1">Fecha</small><span class="fw-bold text-dark">${formatearFecha(pedido.fechaPedido)}</span></div></div>
                                <div class="col-sm-6 d-flex align-items-center"><i class="fas fa-dollar-sign text-success fs-5 me-3"></i><div><small class="text-muted d-block lh-1">Total Pagado</small><span class="fw-bold text-success fs-5">$${pedido.total.toFixed(2)}</span></div></div>
                            </div>
                            <p class="mb-0 text-muted small"><i class="fas fa-map-marker-alt text-danger me-2"></i><strong>Instalación:</strong> ${pedido.direccion_instalacion || 'Solo entrega de equipo'}</p>
                        </div>
                    </div>`;
            });
            html += `</div>`;
            content.innerHTML = html;
        } catch (error) {
            content.innerHTML = `<div class="alert alert-danger m-3">Error al cargar pedidos: ${error.message}</div>`;
        }
    }
    else if (seccion === 'citas') {
        try {
            const todasLasCitas = await API.request(`/api/citas/cliente/${user.idUsuario}`);
            const archivados = obtenerArchivados('citas');
            const citasVisibles = todasLasCitas.filter(c => !archivados.includes(c.idCita));
            if (citasVisibles.length === 0) {
                content.innerHTML = `<h4 class="fw-bold text-dark border-bottom pb-3 mb-4"><i class="fas fa-calendar-check text-primary me-2"></i>Visitas Técnicas</h4><div class="text-center py-5"><div class="bg-light rounded-circle d-inline-flex p-4 mb-3"><i class="fas fa-tools fa-3x text-muted"></i></div><h5 class="fw-bold text-dark">No hay citas</h5><p class="text-muted">No tienes visitas técnicas programadas en este momento.</p></div>`;
                return;
            }
            let html = `<h4 class="fw-bold text-dark border-bottom pb-3 mb-4"><i class="fas fa-calendar-check text-primary me-2"></i>Visitas Técnicas</h4><div class="row g-3">`;
            citasVisibles.forEach(cita => {
                let bgBadge = '';
                if (cita.estado === 'PROGRAMADA') bgBadge = 'primary';
                else if (cita.estado === 'EN_PROCESO') bgBadge = 'warning text-dark';
                else if (cita.estado === 'COMPLETADA') bgBadge = 'success';
                else bgBadge = 'danger';
                const isCompletado = cita.estado === 'COMPLETADA' || cita.estado === 'CANCELADA';
                const btnArchivar = isCompletado ? `<button class="btn btn-sm btn-outline-secondary rounded-circle ms-2" onclick="ocultarItem('citas', ${cita.idCita})" title="Archivar"><i class="fas fa-archive"></i></button>` : '';
                html += `
                    <div class="col-md-6">
                        <div class="card border border-light shadow-sm rounded-4 h-100">
                            <div class="card-body p-4 position-relative">
                                <div class="d-flex justify-content-between align-items-start mb-3"><span class="badge bg-${bgBadge} bg-opacity-10 text-${bgBadge.split(' ')[0]} border px-3 py-1 rounded-pill">${cita.estado}</span>${btnArchivar}</div>
                                <h6 class="fw-bold text-dark mb-2"><i class="fas fa-hard-hat text-info me-2"></i>Técnico: ${cita.nombreTecnico}</h6>
                                <p class="small text-muted mb-2"><i class="far fa-clock text-primary me-2"></i>Inicio: ${formatearFecha(cita.fechaInicio)}</p>
                                <hr class="my-2 opacity-10">
                                <p class="small text-muted mb-0 lh-sm mt-2"><i class="fas fa-map-marker-alt text-danger me-2"></i>${cita.direccionCliente || 'No especificada'}</p>
                            </div>
                        </div>
                    </div>`;
            });
            html += `</div>`;
            content.innerHTML = html;
        } catch (error) {
            content.innerHTML = `<div class="alert alert-danger m-3">Error al cargar citas.</div>`;
        }
    }
    else if (seccion === 'solicitudes') {
        try {
            const todasLasSol = await API.request(`/api/solicitudes/cliente/${user.idUsuario}`);
            const archivados = obtenerArchivados('solicitudes');
            const solVisibles = todasLasSol.filter(s => !archivados.includes(s.idSolicitud));
            if (solVisibles.length === 0) {
                content.innerHTML = `<h4 class="fw-bold text-dark border-bottom pb-3 mb-4"><i class="fas fa-headset text-primary me-2"></i>Mis Solicitudes</h4><div class="text-center py-5"><div class="bg-light rounded-circle d-inline-flex p-4 mb-3"><i class="fas fa-inbox fa-3x text-muted"></i></div><h5 class="fw-bold text-dark">Bandeja limpia</h5><p class="text-muted">No has enviado solicitudes de soporte recientemente.</p><a href="contacto.html" class="btn btn-outline-primary rounded-pill px-4 mt-2 fw-bold">Crear Solicitud</a></div>`;
                return;
            }
            let html = `<h4 class="fw-bold text-dark border-bottom pb-3 mb-4"><i class="fas fa-headset text-primary me-2"></i>Mis Solicitudes</h4><div class="d-flex flex-column gap-3">`;
            solVisibles.forEach(sol => {
                let bgBadge = sol.estado === 'PENDIENTE' ? 'warning text-dark' : (sol.estado === 'ASIGNADA' ? 'success' : 'danger');
                const isTerminado = sol.estado === 'ASIGNADA' || sol.estado === 'RECHAZADA';
                const btnArchivar = isTerminado ? `<button class="btn btn-sm btn-outline-secondary rounded-circle mt-2" onclick="ocultarItem('solicitudes', ${sol.idSolicitud})" title="Archivar"><i class="fas fa-archive"></i></button>` : '';
                html += `
                    <div class="card border border-light shadow-sm rounded-4">
                        <div class="card-body p-4 d-flex justify-content-between align-items-center">
                            <div>
                                <div class="d-flex align-items-center mb-2"><h6 class="fw-bold text-dark mb-0 me-3">Ticket #${sol.idSolicitud}</h6><span class="badge bg-${bgBadge} bg-opacity-10 text-${bgBadge.split(' ')[0]} border px-2 rounded-pill">${sol.estado}</span></div>
                                <p class="text-primary fw-bold small mb-1"><i class="fas fa-tag me-1"></i> ${sol.tipoServicio.replace('_', ' ')}</p>
                                <p class="text-muted small mb-0"><i class="far fa-comment-dots me-1"></i> ${sol.mensaje || 'Sin mensaje detallado'}</p>
                            </div>
                            <div class="text-end">
                                <small class="text-muted d-block mb-1">Preferencia:</small>
                                <span class="badge bg-light text-dark border">${sol.fechaPreferida ? new Date(sol.fechaPreferida).toLocaleDateString() : 'Cualquier fecha'}</span>
                                <div class="d-block">${btnArchivar}</div>
                            </div>
                        </div>
                    </div>`;
            });
            html += `</div>`;
            content.innerHTML = html;
        } catch (error) {
            content.innerHTML = `<div class="alert alert-danger m-3">Error al cargar solicitudes.</div>`;
        }
    }
    else if (seccion === 'datos') {
        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4"><h4 class="fw-bold text-dark mb-0"><i class="fas fa-user-edit text-primary me-2"></i>Datos Personales</h4></div>
            <form id="formDatosPersonales" onsubmit="actualizarDatos(event)">
                <div class="row g-4 mb-4">
                    <div class="col-md-6"><label class="form-label fw-bold text-secondary small text-uppercase">Nombres</label><input type="text" class="form-control bg-light border-0 py-2 fw-semibold" name="nombres" value="${user.nombre}" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold text-secondary small text-uppercase">Apellidos</label><input type="text" class="form-control bg-light border-0 py-2 fw-semibold" name="apellidos" value="${user.apellido || ''}"></div>
                    <div class="col-md-6"><label class="form-label fw-bold text-secondary small text-uppercase">Correo Electrónico <i class="fas fa-lock text-muted ms-1" title="Dato no modificable"></i></label><input type="email" class="form-control bg-white border py-2 text-muted" name="email" value="${user.email}" readonly></div>
                    <div class="col-md-6"><label class="form-label fw-bold text-secondary small text-uppercase">Teléfono Móvil</label><input type="tel" class="form-control bg-light border-0 py-2 fw-semibold" name="telefono" value="${user.telefono || ''}"></div>
                    <div class="col-12"><label class="form-label fw-bold text-secondary small text-uppercase">Dirección Base (Hogar / Empresa)</label><div class="input-group shadow-sm rounded-3 overflow-hidden border"><textarea class="form-control border-0 bg-light fw-semibold" name="direccion" id="direccionTextarea" rows="2" placeholder="Ingresa tu dirección principal...">${user.direccion || ''}</textarea><button type="button" class="btn btn-primary px-4 fw-bold" id="btnGeolocalizar"><i class="fas fa-location-crosshairs me-1"></i> Ubicar</button></div><div id="geolocStatus" class="small mt-2 fw-semibold"></div></div>
                </div>
                <div class="d-flex justify-content-end pt-3"><button type="submit" class="btn btn-primary fw-bold px-5 py-3 shadow-sm rounded-pill"><i class="fas fa-save me-2"></i>Guardar Cambios</button></div>
            </form>
        `;
        const btnGeo = document.getElementById('btnGeolocalizar');
        const statusDiv = document.getElementById('geolocStatus');
        const textarea = document.getElementById('direccionTextarea');
        btnGeo.addEventListener('click', () => {
            if (!navigator.geolocation) { statusDiv.innerHTML = '<span class="text-danger"><i class="fas fa-exclamation-circle"></i> Tu navegador no soporta geolocalización.</span>'; return; }
            statusDiv.innerHTML = '<span class="text-info"><i class="fas fa-spinner fa-spin"></i> Conectando al satélite...</span>';
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                statusDiv.innerHTML = '<span class="text-info"><i class="fas fa-spinner fa-spin"></i> Obteniendo dirección física...</span>';
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                    const data = await response.json();
                    if (data && data.display_name) { textarea.value = data.display_name; statusDiv.innerHTML = '<span class="text-success"><i class="fas fa-check-circle"></i> Dirección cargada con éxito.</span>'; setTimeout(() => statusDiv.innerHTML = '', 3000); }
                    else statusDiv.innerHTML = '<span class="text-warning">No se pudo traducir la ubicación. Ingresa manualmente.</span>';
                } catch (error) { statusDiv.innerHTML = '<span class="text-danger">Error de red. Intenta de nuevo.</span>'; }
            }, (error) => {
                let msg = 'Error de ubicación.';
                if(error.code === error.PERMISSION_DENIED) msg = 'Debes permitir el acceso a la ubicación en tu navegador.';
                statusDiv.innerHTML = `<span class="text-danger"><i class="fas fa-times-circle"></i> ${msg}</span>`;
            });
        });
    }
    else if (seccion === 'equipos') {
        try {
            const equipos = await API.Equipos.listarPorCliente(user.idUsuario);
            
            if (!equipos || equipos.length === 0) {
                content.innerHTML = `
                    <h4 class="fw-bold text-dark border-bottom pb-3 mb-4"><i class="fas fa-snowflake text-info me-2"></i>Mis Equipos Instalados</h4>
                    <div class="text-center py-5">
                        <div class="bg-light rounded-circle d-inline-flex p-4 mb-3"><i class="fas fa-box-open fa-3x text-muted"></i></div>
                        <h5 class="fw-bold text-dark">Aún no tienes equipos registrados</h5>
                        <p class="text-muted">Cuando realices una compra con instalación, tus equipos aparecerán aquí.</p>
                    </div>`;
                return;
            }

            let html = `<h4 class="fw-bold text-dark border-bottom pb-3 mb-4"><i class="fas fa-snowflake text-info me-2"></i>Mis Equipos Instalados</h4><div class="row g-4">`;
            
            const hoy = new Date();
            let equiposNecesitanMantenimiento = 0;

            equipos.forEach(equipo => {
                // Calcular fecha de mantenimiento
                let fechaBase = equipo.fechaUltimoMantenimiento ? new Date(equipo.fechaUltimoMantenimiento) : new Date(equipo.fechaInstalacion);
                
                // Mantenimiento cada 6 meses
                let proximaFecha = new Date(fechaBase);
                proximaFecha.setMonth(proximaFecha.getMonth() + 6);
                
                // Calcular días faltantes
                const diffTime = proximaFecha - hoy;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let alertaHtml = '';
                let borderClass = 'border-light';
                let btnAgenda = '';

                if (diffDays <= 0) {
                    equiposNecesitanMantenimiento++;
                    borderClass = 'border-danger border-2';
                    alertaHtml = `<div class="alert alert-danger p-2 small fw-bold mb-3"><i class="fas fa-exclamation-triangle me-2"></i>¡Requiere Mantenimiento Urgente! (Venció el ${proximaFecha.toLocaleDateString()})</div>`;
                    btnAgenda = `<a href="contacto.html" class="btn btn-danger btn-sm w-100 fw-bold mt-2"><i class="fas fa-calendar-plus me-1"></i> Agendar Servicio Ahora</a>`;
                } else if (diffDays <= 30) {
                    equiposNecesitanMantenimiento++;
                    borderClass = 'border-warning border-2';
                    alertaHtml = `<div class="alert alert-warning p-2 small fw-bold mb-3"><i class="fas fa-bell me-2"></i>Mantenimiento próximo en ${diffDays} días.</div>`;
                    btnAgenda = `<a href="contacto.html" class="btn btn-warning btn-sm w-100 fw-bold mt-2 text-dark"><i class="fas fa-calendar-plus me-1"></i> Agendar Prevención</a>`;
                } else {
                    alertaHtml = `<div class="alert alert-success p-2 small fw-bold mb-3"><i class="fas fa-check-circle me-2"></i>Equipo en óptimas condiciones. Próx. servicio en ${diffDays} días.</div>`;
                }

                html += `
                    <div class="col-md-6">
                        <div class="card shadow-sm rounded-4 h-100 ${borderClass}">
                            <div class="card-body p-4">
                                ${alertaHtml}
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h5 class="fw-bold text-dark mb-0">${equipo.marca} ${equipo.modelo || ''}</h5>
                                    <span class="badge bg-primary rounded-pill">${equipo.capacidadBtu} BTU</span>
                                </div>
                                <p class="text-muted small mb-3"><i class="fas fa-map-marker-alt text-info me-1"></i> Ubicación: <strong>${equipo.ubicacionEnCasa || 'No especificada'}</strong></p>
                                
                                <ul class="list-unstyled small text-muted mb-0">
                                    <li class="mb-1"><i class="far fa-calendar-alt me-2"></i>Instalación: ${formatearFecha(equipo.fechaInstalacion)}</li>
                                    <li><i class="fas fa-tools me-2"></i>Último Servicio: ${equipo.fechaUltimoMantenimiento ? formatearFecha(equipo.fechaUltimoMantenimiento) : 'Ninguno registrado'}</li>
                                </ul>
                                ${btnAgenda}
                            </div>
                        </div>
                    </div>`;
            });
            html += `</div>`;
            content.innerHTML = html;

            // Actualizar badge
            const badgeEquipos = document.getElementById('badgeEquiposCliente');
            if (badgeEquipos && equiposNecesitanMantenimiento > 0) {
                badgeEquipos.textContent = equiposNecesitanMantenimiento;
                badgeEquipos.style.display = 'inline-block';
                badgeEquipos.classList.replace('bg-info', 'bg-danger'); // Cambiar color si hay alertas
            }

        } catch (error) {
            content.innerHTML = `<div class="alert alert-danger m-3">Error al cargar tus equipos: ${error.message}</div>`;
        }
    }
}

window.actualizarDatos = async function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const user = Auth.getUser();
    const btnSubmit = event.target.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
    const updatedUser = { ...user, nombre: formData.get('nombres'), apellido: formData.get('apellidos'), telefono: formData.get('telefono'), direccion: formData.get('direccion') };
    try {
        await API.Usuarios.actualizar(user.idUsuario, { nombre: updatedUser.nombre, apellido: updatedUser.apellido, email: user.email, dui: user.dui, telefono: updatedUser.telefono, direccion: updatedUser.direccion, rol: user.rol, activo: user.activo });
        localStorage.setItem('climapro_user', JSON.stringify(updatedUser));
        if (typeof actualizarNavAuth === 'function') actualizarNavAuth();
        Swal.fire({icon: 'success', title: 'Perfil actualizado', text: 'Tus datos se guardaron correctamente.', confirmButtonColor: '#0d6efd'});
        await mostrarSeccion('dashboard');
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios';
    }
};

async function actualizarContadoresCliente() {
    const user = Auth.getUser();
    if (!user) return;
    try {
        const pedidosPendientes = await API.request(`/api/pedidos/conteos/pendientes/cliente/${user.idUsuario}`);
        const badgePedidos = document.getElementById('badgePedidosCliente');
        if (pedidosPendientes > 0) { badgePedidos.textContent = pedidosPendientes; badgePedidos.style.display = 'inline-block'; }
        else badgePedidos.style.display = 'none';
        
        const citasPendientes = await API.request(`/api/citas/conteos/pendientes/cliente/${user.idUsuario}`);
        const badgeCitas = document.getElementById('badgeCitasCliente');
        if (citasPendientes > 0) { badgeCitas.textContent = citasPendientes; badgeCitas.style.display = 'inline-block'; }
        else badgeCitas.style.display = 'none';
        
        const solicitudesPendientes = await API.request(`/api/solicitudes/conteos/pendientes/cliente/${user.idUsuario}`);
        const badgeSolicitudes = document.getElementById('badgeSolicitudesCliente');
        if (solicitudesPendientes > 0) { badgeSolicitudes.textContent = solicitudesPendientes; badgeSolicitudes.style.display = 'inline-block'; }
        else badgeSolicitudes.style.display = 'none';
    } catch (error) {
        console.error('Error cargando contadores cliente:', error);
    }
}