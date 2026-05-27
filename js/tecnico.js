// js/tecnico.js
let bsModalEstado = null;
let calendar = null;
let mapaActual = null;
let vistaActual = 'tarjetas';

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

    // El navbar ya se actualiza con main.js, pero podemos mostrar el nombre en algún lado si queremos
    document.getElementById('fechaActual').textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

    bsModalEstado = new bootstrap.Modal(document.getElementById('modalActualizarEstado'));
    document.getElementById('formEstadoCita').addEventListener('submit', guardarEstadoCita);

    // Configurar botones de cambio de vista
    const btnTarjetas = document.getElementById('btnVistaTarjetas');
    const btnCalendario = document.getElementById('btnVistaCalendario');
    const divTarjetas = document.getElementById('vistaTarjetas');
    const divCalendario = document.getElementById('vistaCalendario');

    const vistaGuardada = localStorage.getItem('tecnico_vista');
    if (vistaGuardada === 'calendario') {
        vistaActual = 'calendario';
        btnTarjetas.classList.remove('active');
        btnCalendario.classList.add('active');
        divTarjetas.style.display = 'none';
        divCalendario.style.display = 'block';
    } else {
        vistaActual = 'tarjetas';
        btnTarjetas.classList.add('active');
        btnCalendario.classList.remove('active');
        divTarjetas.style.display = 'block';
        divCalendario.style.display = 'none';
    }

    btnTarjetas.addEventListener('click', () => {
        vistaActual = 'tarjetas';
        localStorage.setItem('tecnico_vista', 'tarjetas');
        btnTarjetas.classList.add('active');
        btnCalendario.classList.remove('active');
        divTarjetas.style.display = 'block';
        divCalendario.style.display = 'none';
        cargarCitas();
    });

    btnCalendario.addEventListener('click', () => {
        vistaActual = 'calendario';
        localStorage.setItem('tecnico_vista', 'calendario');
        btnCalendario.classList.add('active');
        btnTarjetas.classList.remove('active');
        divTarjetas.style.display = 'none';
        divCalendario.style.display = 'block';
        cargarCitas();
    });

    await cargarCitas();
});

async function cargarCitas() {
    const user = Auth.getUser();
    try {
        const citas = await API.Citas.listarPorTecnico(user.idUsuario);
        if (vistaActual === 'tarjetas') {
            renderizarTarjetas(citas);
        } else {
            renderizarCalendario(citas);
        }
    } catch (error) {
        console.error(error);
        document.getElementById('agendaContainer').innerHTML = '<div class="col-12 alert alert-danger">Error al cargar citas</div>';
        document.getElementById('calendar').innerHTML = '<div class="alert alert-danger">Error al cargar citas</div>';
    }
}

function renderizarTarjetas(citas) {
    const container = document.getElementById('agendaContainer');
    container.innerHTML = '';
    if (citas.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5"><i class="fas fa-glass-cheers fa-3x text-muted mb-3"></i><h5 class="text-muted">No tienes citas asignadas.</h5></div>`;
        return;
    }

    citas.forEach(cita => {
        let badgeColor = 'secondary';
        let estadoMostrar = cita.estado;
        if (cita.estado === 'PROGRAMADA') { badgeColor = 'primary'; estadoMostrar = 'Programada'; }
        else if (cita.estado === 'EN_PROCESO') { badgeColor = 'warning text-dark'; estadoMostrar = 'En Proceso'; }
        else if (cita.estado === 'COMPLETADA') { badgeColor = 'success'; estadoMostrar = 'Completada'; }
        else if (cita.estado === 'CANCELADA') { badgeColor = 'danger'; estadoMostrar = 'Cancelada'; }

        const fechaInicio = new Date(cita.fechaInicio);
        const fechaFormateada = fechaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        const horaFormateada = fechaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
            <div class="card border-0 shadow-sm rounded-4 h-100 border-start border-4 border-${badgeColor.split(' ')[0]}">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="badge bg-${badgeColor} rounded-pill">${estadoMostrar}</span>
                        <span class="fw-bold text-dark"><i class="far fa-clock text-muted me-1"></i> ${horaFormateada} - ${fechaFormateada}</span>
                    </div>
                    <h5 class="fw-bold text-dark mb-1">${cita.nombreCliente}</h5>
                    <p class="text-primary fw-semibold small mb-2">Cita ID: ${cita.idCita}</p>
                    <div class="d-flex align-items-start mb-2">
                        <i class="fas fa-map-marker-alt text-muted mt-1 me-2"></i>
                        <p class="text-muted small mb-0 lh-sm">${cita.direccionCliente || 'Dirección no registrada'}</p>
                    </div>
                    <div class="d-flex gap-2 mt-2">
                        <button class="btn btn-outline-primary w-100 fw-bold" onclick="abrirModalEstado(${cita.idCita}, '${cita.estado}')">
                            Actualizar Estado
                        </button>
                        <button class="btn btn-outline-info w-100 fw-bold" onclick="mostrarMapa('${cita.direccionCliente ? cita.direccionCliente.replace(/'/g, "\\'") : ''}', ${cita.idCliente})">
                            <i class="fas fa-map-marked-alt me-1"></i> Mapa
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

function renderizarCalendario(citas) {
    if (calendar) calendar.destroy();

    const calendarEl = document.getElementById('calendar');
    // Limpiar contenido previo del div
    calendarEl.innerHTML = '';

    const eventos = citas.map(cita => {
        let color = '#0d6efd';
        if (cita.estado === 'EN_PROCESO') color = '#ffc107';
        else if (cita.estado === 'COMPLETADA') color = '#198754';
        else if (cita.estado === 'CANCELADA') color = '#dc3545';
        
        return {
            id: cita.idCita,
            title: `${cita.nombreCliente} - ${cita.estado}`,
            start: cita.fechaInicio,
            end: cita.fechaFin,
            color: color,
            extendedProps: {
                direccion: cita.direccionCliente || 'Dirección no registrada',
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
        contentHeight: 'auto',
        events: eventos,
        eventClick: (info) => {
            const cita = info.event;
            const idCita = cita.id;
            const estadoActual = cita.extendedProps.estado;
            const direccion = cita.extendedProps.direccion;
            const idCliente = cita.extendedProps.idCliente;
            
            document.getElementById('citaIdActual').value = idCita;
            let valorSelect = 'En Proceso';
            if (estadoActual === 'PROGRAMADA') valorSelect = 'En Camino';
            else if (estadoActual === 'EN_PROCESO') valorSelect = 'En Proceso';
            else if (estadoActual === 'COMPLETADA') valorSelect = 'Completado';
            else if (estadoActual === 'CANCELADA') valorSelect = 'Reprogramado';
            document.getElementById('nuevoEstado').value = valorSelect;
            document.getElementById('notasTecnico').value = cita.extendedProps.notas || '';
            
            Swal.fire({
                title: cita.title,
                html: `<p><strong>Cliente:</strong> ${cita.title.split(' - ')[0]}</p>
                       <p><strong>Dirección:</strong> ${direccion}</p>
                       <p><strong>Notas:</strong> ${cita.extendedProps.notas || 'Sin notas'}</p>`,
                showCancelButton: true,
                confirmButtonText: 'Actualizar estado',
                cancelButtonText: 'Ver mapa',
                confirmButtonColor: '#0d6efd'
            }).then((result) => {
                if (result.isConfirmed) {
                    bsModalEstado.show();
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    mostrarMapa(direccion, idCliente);
                }
            });
        }
    });
    calendar.render();
}

window.abrirModalEstado = function(idCita, estadoActual) {
    document.getElementById('citaIdActual').value = idCita;
    let valorSelect = 'En Proceso';
    if (estadoActual === 'PROGRAMADA') valorSelect = 'En Camino';
    else if (estadoActual === 'EN_PROCESO') valorSelect = 'En Proceso';
    else if (estadoActual === 'COMPLETADA') valorSelect = 'Completado';
    else if (estadoActual === 'CANCELADA') valorSelect = 'Reprogramado';
    document.getElementById('nuevoEstado').value = valorSelect;
    document.getElementById('notasTecnico').value = '';
    bsModalEstado.show();
};

async function guardarEstadoCita(event) {
    event.preventDefault();
    const idCita = parseInt(document.getElementById('citaIdActual').value);
    let nuevoEstadoSelect = document.getElementById('nuevoEstado').value;
    let nuevoEstado = '';
    if (nuevoEstadoSelect === 'En Camino') nuevoEstado = 'EN_PROCESO';
    else if (nuevoEstadoSelect === 'En Proceso') nuevoEstado = 'EN_PROCESO';
    else if (nuevoEstadoSelect === 'Completado') nuevoEstado = 'COMPLETADA';
    else if (nuevoEstadoSelect === 'Reprogramado') nuevoEstado = 'CANCELADA';
    const notas = document.getElementById('notasTecnico').value;

    try {
        await API.Citas.cambiarEstado(idCita, nuevoEstado);
        Swal.fire('Actualizado', 'El estado de la cita se ha actualizado.', 'success');
        bsModalEstado.hide();
        await cargarCitas();
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
}

window.mostrarMapa = async function(direccion, idCliente) {
    const modal = new bootstrap.Modal(document.getElementById('modalMapa'));
    modal.show();

    setTimeout(async () => {
        const mapDiv = document.getElementById('mapaCliente');
        if (mapaActual) {
            mapaActual.remove();
            mapDiv.innerHTML = '';
        }

        let lat = null, lng = null;
        try {
            const response = await fetch(`http://localhost:8080/clientes/${idCliente}/coordenadas`);
            if (response.ok) {
                const data = await response.json();
                lat = data.lat;
                lng = data.lng;
            }
        } catch (e) { console.warn(e); }

        if (!lat || !lng) {
            if (!direccion || direccion === 'Dirección no registrada') {
                mapDiv.innerHTML = '<div class="alert alert-warning m-3">El cliente no tiene dirección registrada.</div>';
                return;
            }
            try {
                const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}&limit=1`;
                const geoResp = await fetch(geocodeUrl);
                const geoData = await geoResp.json();
                if (geoData && geoData.length > 0) {
                    lat = parseFloat(geoData[0].lat);
                    lng = parseFloat(geoData[0].lon);
                } else {
                    mapDiv.innerHTML = '<div class="alert alert-warning m-3">No se pudo localizar la dirección.</div>';
                    return;
                }
            } catch (error) {
                mapDiv.innerHTML = '<div class="alert alert-danger m-3">Error al geocodificar la dirección.</div>';
                return;
            }
        }

        mapaActual = L.map(mapDiv).setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapaActual);
        L.marker([lat, lng]).addTo(mapaActual)
            .bindPopup(`<b>Cliente</b><br>${direccion}`)
            .openPopup();
    }, 100);
};