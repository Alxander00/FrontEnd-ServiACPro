// js/perfil.js

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pedido') === 'confirmado') {
        Swal.fire({
            icon: 'success',
            title: '¡Pedido confirmado!',
            text: 'Gracias por tu compra.',
            toast: true,
            position: 'top-end',
            timer: 3000
        });
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    mostrarSeccion('dashboard');
    document.querySelectorAll('#perfilMenu a[data-seccion]').forEach(enlace => {
        enlace.addEventListener('click', async (e) => {
            e.preventDefault();
            document.querySelectorAll('#perfilMenu a').forEach(el => el.classList.remove('active', 'bg-primary', 'text-white'));
            e.target.closest('a').classList.add('active', 'bg-primary', 'text-white');
            await mostrarSeccion(e.target.closest('a').dataset.seccion);
        });
    });
});

async function cargarPedidosReales() {
    const user = Auth.getUser();
    if (!user || !user.idUsuario) return [];
    try {
        return await API.Pedidos.listarPorUsuario(user.idUsuario);
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        return [];
    }
}

const formatearFecha = (fechaString) => {
    const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-ES', opciones);
};

async function mostrarSeccion(seccion) {
    const user = Auth.getUser();
    const content = document.getElementById('perfilContent');
    const historial = JSON.parse(localStorage.getItem('climapro_historial') || '[]');

    if (seccion === 'dashboard') {
        content.innerHTML = `
            <h3 class="fw-bold text-dark mb-2">Bienvenido, ${user.nombre}</h3>
            <p class="text-muted mb-4">Desde aquí puedes gestionar tus pedidos y tu información personal.</p>
            <div class="row g-4 mt-2">
                <div class="col-md-6"><div class="p-4 bg-light rounded-4 border"><div class="text-primary fs-1 mb-2"><i class="fas fa-shopping-bag"></i></div><h4 class="fw-bold">${historial.length}</h4><p class="text-muted mb-0">Pedidos realizados</p></div></div>
                <div class="col-md-6"><div class="p-4 bg-light rounded-4 border"><div class="text-info fs-1 mb-2"><i class="fas fa-headset"></i></div><h4 class="fw-bold">Soporte</h4><p class="text-muted mb-0"><a href="contacto.html" class="text-decoration-none">Contáctanos</a></p></div></div>
            </div>
        `;
    } 
    else if (seccion === 'pedidos') {
        const pedidos = await cargarPedidosReales();
        if (pedidos.length === 0) {
            content.innerHTML = `<h3 class="fw-bold text-dark border-bottom pb-3 mb-4">Mis Pedidos</h3><div class="text-center py-5"><i class="fas fa-box-open fa-3x text-muted mb-3"></i><h5>Aún no has realizado pedidos.</h5><a href="catalogo.html" class="btn btn-outline-primary mt-3">Ir al Catálogo</a></div>`;
            return;
        }
        let html = `<h3 class="fw-bold text-dark border-bottom pb-3 mb-4">Mis Pedidos</h3><div class="d-flex flex-column gap-3">`;
        pedidos.forEach(pedido => {
            const bgBadge = pedido.estado === 'Completado' ? 'success' : (pedido.estado === 'Cancelado' ? 'danger' : 'warning text-dark');
            html += `
                <div class="card border shadow-sm rounded-4">
                    <div class="card-header bg-light border-bottom-0 pt-3 pb-2 px-4 d-flex justify-content-between align-items-center rounded-top-4">
                        <span class="fw-bold text-primary">Pedido #${pedido.idPedido}</span>
                        <span class="badge bg-${bgBadge} rounded-pill px-3">${pedido.estado}</span>
                    </div>
                    <div class="card-body px-4 pb-4 pt-2">
                        <div class="row text-muted small mb-3">
                            <div class="col-sm-6"><i class="far fa-calendar-alt me-1"></i> ${formatearFecha(pedido.fechaPedido)}</div>
                            <div class="col-sm-6 text-sm-end"><i class="fas fa-credit-card me-1"></i> Total: $${pedido.total}</div>
                        </div>
                        <p class="mb-1"><i class="fas fa-map-marker-alt text-secondary me-2"></i> ${pedido.direccion_instalacion || 'No especificada'}</p>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        content.innerHTML = html;
    }
    else if (seccion === 'citas') {
        try {
            const citas = await API.request(`/api/citas/cliente/${user.idUsuario}`);
            if (citas.length === 0) {
                content.innerHTML = `<h3 class="fw-bold text-dark border-bottom pb-3 mb-4">Mis Citas</h3><div class="text-center py-5"><i class="fas fa-calendar-times fa-3x text-muted mb-3"></i><h5>No tienes citas programadas.</h5></div>`;
                return;
            }
            let html = `<h3 class="fw-bold text-dark border-bottom pb-3 mb-4">Mis Citas</h3><div class="list-group">`;
            citas.forEach(cita => {
                let estadoBadge = '';
                if (cita.estado === 'PROGRAMADA') estadoBadge = 'bg-primary';
                else if (cita.estado === 'EN_PROCESO') estadoBadge = 'bg-warning text-dark';
                else if (cita.estado === 'COMPLETADA') estadoBadge = 'bg-success';
                else estadoBadge = 'bg-danger';
                html += `
                    <div class="list-group-item list-group-item-action flex-column align-items-start rounded-3 mb-2 shadow-sm">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1"><i class="fas fa-tools me-2 text-info"></i>${cita.nombreTecnico}</h6>
                            <span class="badge ${estadoBadge} rounded-pill">${cita.estado}</span>
                        </div>
                        <p class="mb-1 small"><i class="far fa-calendar-alt me-2"></i>${new Date(cita.fechaInicio).toLocaleString()} - ${new Date(cita.fechaFin).toLocaleString()}</p>
                        <small class="text-muted">Dirección: ${cita.direccionCliente || 'No especificada'}</small>
                    </div>
                `;
            });
            html += `</div>`;
            content.innerHTML = html;
        } catch (error) {
            content.innerHTML = `<div class="alert alert-danger">Error al cargar citas: ${error.message}</div>`;
        }
    }
    else if (seccion === 'solicitudes') {
        try {
            const solicitudes = await API.request(`/api/solicitudes/cliente/${user.idUsuario}`);
            if (solicitudes.length === 0) {
                content.innerHTML = `<h3 class="fw-bold text-dark border-bottom pb-3 mb-4">Mis Solicitudes</h3><div class="text-center py-5"><i class="fas fa-inbox fa-3x text-muted mb-3"></i><h5>No has enviado solicitudes.</h5></div>`;
                return;
            }
            let html = `<h3 class="fw-bold text-dark border-bottom pb-3 mb-4">Mis Solicitudes</h3><div class="list-group">`;
            solicitudes.forEach(sol => {
                let estadoBadge = '';
                if (sol.estado === 'PENDIENTE') estadoBadge = 'bg-warning text-dark';
                else if (sol.estado === 'ASIGNADA') estadoBadge = 'bg-success';
                else estadoBadge = 'bg-danger';
                html += `
                    <div class="list-group-item list-group-item-action flex-column align-items-start rounded-3 mb-2 shadow-sm">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1"><i class="fas fa-tag me-2 text-info"></i>${sol.tipoServicio}</h6>
                            <span class="badge ${estadoBadge} rounded-pill">${sol.estado}</span>
                        </div>
                        <p class="mb-1 small"><i class="far fa-calendar-alt me-2"></i>${sol.fechaPreferida ? new Date(sol.fechaPreferida).toLocaleString() : 'Sin fecha preferida'}</p>
                        <small class="text-muted">Mensaje: ${sol.mensaje || 'Sin mensaje'}</small>
                    </div>
                `;
            });
            html += `</div>`;
            content.innerHTML = html;
        } catch (error) {
            content.innerHTML = `<div class="alert alert-danger">Error al cargar solicitudes: ${error.message}</div>`;
        }
    }
    else if (seccion === 'datos') {
        content.innerHTML = `
            <h3 class="fw-bold text-dark border-bottom pb-3 mb-4">Datos Personales</h3>
            <form id="formDatosPersonales" onsubmit="actualizarDatos(event)">
                <div class="row g-3 mb-4">
                    <div class="col-md-6"><label class="form-label fw-semibold">Nombres</label><input type="text" class="form-control" name="nombres" value="${user.nombre}" required></div>
                    <div class="col-md-6"><label class="form-label fw-semibold">Apellidos</label><input type="text" class="form-control" name="apellidos" value="${user.apellido || ''}"></div>
                </div>
                <div class="row g-3 mb-4">
                    <div class="col-md-6"><label class="form-label fw-semibold">Correo Electrónico</label><input type="email" class="form-control text-muted bg-light" name="email" value="${user.email}" readonly></div>
                    <div class="col-md-6"><label class="form-label fw-semibold">Teléfono</label><input type="tel" class="form-control" name="telefono" value="${user.telefono || ''}"></div>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Dirección completa</label>
                    <div class="input-group">
                        <textarea class="form-control" name="direccion" id="direccionTextarea" rows="2">${user.direccion || ''}</textarea>
                        <button type="button" class="btn btn-outline-secondary" id="btnGeolocalizar" style="white-space: nowrap;">
                            <i class="fas fa-location-dot me-1"></i> Usar mi ubicación
                        </button>
                    </div>
                    <div id="geolocStatus" class="small text-muted mt-1"></div>
                </div>
                <div class="d-flex justify-content-end border-top pt-4"><button type="submit" class="btn btn-primary fw-bold px-4">Guardar Cambios</button></div>
            </form>
        `;

        // Agregar evento para el botón de geolocalización
        const btnGeo = document.getElementById('btnGeolocalizar');
        const statusDiv = document.getElementById('geolocStatus');
        const textarea = document.getElementById('direccionTextarea');

        btnGeo.addEventListener('click', () => {
            if (!navigator.geolocation) {
                statusDiv.innerHTML = '<span class="text-danger">Tu navegador no soporta geolocalización.</span>';
                return;
            }
            statusDiv.innerHTML = '<span class="text-info"><i class="fas fa-spinner fa-spin"></i> Obteniendo ubicación...</span>';
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                statusDiv.innerHTML = '<span class="text-info"><i class="fas fa-spinner fa-spin"></i> Obteniendo dirección...</span>';
                try {
                    // Reverse geocoding con Nominatim (OpenStreetMap)
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                    const data = await response.json();
                    if (data && data.display_name) {
                        textarea.value = data.display_name;
                        statusDiv.innerHTML = '<span class="text-success"><i class="fas fa-check-circle"></i> Dirección cargada correctamente.</span>';
                        setTimeout(() => { statusDiv.innerHTML = ''; }, 3000);
                    } else {
                        statusDiv.innerHTML = '<span class="text-danger">No se pudo obtener la dirección. Ingresa manualmente.</span>';
                    }
                } catch (error) {
                    console.error(error);
                    statusDiv.innerHTML = '<span class="text-danger">Error al obtener la dirección. Intenta de nuevo.</span>';
                }
            }, (error) => {
                let msg = '';
                switch(error.code) {
                    case error.PERMISSION_DENIED: msg = 'Permiso denegado. Activa la ubicación en tu navegador.'; break;
                    case error.POSITION_UNAVAILABLE: msg = 'Ubicación no disponible.'; break;
                    case error.TIMEOUT: msg = 'Tiempo de espera agotado.'; break;
                    default: msg = 'Error desconocido.';
                }
                statusDiv.innerHTML = `<span class="text-danger">${msg}</span>`;
            });
        });
    }
}

window.actualizarDatos = async function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const user = Auth.getUser();
    const updatedUser = {
        ...user,
        nombre: formData.get('nombres'),
        apellido: formData.get('apellidos'),
        telefono: formData.get('telefono'),
        direccion: formData.get('direccion')
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
            activo: user.activo
        });
        localStorage.setItem('climapro_user', JSON.stringify(updatedUser));
        if (typeof actualizarNavAuth === 'function') actualizarNavAuth();
        Swal.fire('Éxito', 'Datos personales actualizados correctamente.', 'success');
        await mostrarSeccion('dashboard');
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
};