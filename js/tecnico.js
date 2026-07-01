Auth.protectRoute(['TECNICO']);
let bsModalEstado = null;
let calendar = null;
let mapaActual = null;
let vistaActual = 'tarjetas';

// Variables para la firma
let canvas = null;
let ctx = null;
let isDrawing = false;

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

    document.getElementById('fechaActual').textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

    bsModalEstado = new bootstrap.Modal(document.getElementById('modalActualizarEstado'));
    document.getElementById('formEstadoCita').addEventListener('submit', guardarEstadoCita);

    // NUEVO: Mostrar/Ocultar evidencia al cambiar a "Completado"
    document.getElementById('nuevoEstado').addEventListener('change', function() {
        const seccionEvidencia = document.getElementById('seccionEvidencia');
        if (this.value === 'Completado') {
            seccionEvidencia.style.display = 'block';
            // Damos un pequeño retraso para que el modal termine de animarse y el canvas tome su ancho real
            setTimeout(initFirma, 200); 
        } else {
            seccionEvidencia.style.display = 'none';
        }
    });

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

// ========== MOTOR DE FIRMA DIGITAL ==========
function initFirma() {
    canvas = document.getElementById('firmaCanvas');
    if(!canvas) return;
    
    // Ajustar el ancho real del canvas al de su contenedor
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    
    ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0d6efd'; // Azul primario

    // Limpiar eventos previos si se abre el modal varias veces
    canvas.replaceWith(canvas.cloneNode(true));
    canvas = document.getElementById('firmaCanvas');
    ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0d6efd';

    // Eventos de Mouse (PC)
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Eventos Táctiles (Celular/Tablet)
    canvas.addEventListener('touchstart', handleTouchStart, {passive: false});
    canvas.addEventListener('touchmove', handleTouchMove, {passive: false});
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

// Transformar toques de pantalla en coordenadas
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

// Verifica si el canvas está vacío (el cliente no firmó)
function isCanvasEmpty(c) {
    const blank = document.createElement('canvas');
    blank.width = c.width;
    blank.height = c.height;
    return c.toDataURL() === blank.toDataURL();
}

// ========== LÓGICA DE CITAS Y MAPA ==========
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
                            Reportar / Actualizar
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
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
        buttonText: { today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' },
        height: 'auto',
        events: eventos,
        eventClick: (info) => {
            const cita = info.event;
            abrirModalEstado(cita.id, cita.extendedProps.estado);
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
    
    // Disparar manualmente el evento change para ocultar/mostrar evidencia
    document.getElementById('nuevoEstado').dispatchEvent(new Event('change'));
    
    // Limpiar file inputs
    if(document.getElementById('fotoAntes')) document.getElementById('fotoAntes').value = "";
    if(document.getElementById('fotoDespues')) document.getElementById('fotoDespues').value = "";
    
    bsModalEstado.show();
};

async function guardarEstadoCita(event) {
    event.preventDefault();
    const btn = document.getElementById('btnGuardarReporte');
    const txtOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Subiendo Evidencia... (Puede tardar)';

    const idCita = parseInt(document.getElementById('citaIdActual').value);
    let nuevoEstadoSelect = document.getElementById('nuevoEstado').value;
    let nuevoEstado = '';
    
    if (nuevoEstadoSelect === 'En Camino') nuevoEstado = 'EN_PROCESO';
    else if (nuevoEstadoSelect === 'En Proceso') nuevoEstado = 'EN_PROCESO';
    else if (nuevoEstadoSelect === 'Completado') nuevoEstado = 'COMPLETADA';
    else if (nuevoEstadoSelect === 'Reprogramado') nuevoEstado = 'CANCELADA';
    
    const notas = document.getElementById('notasTecnico').value;

    // Crear el paquete de datos (FormData)
    const formData = new FormData();
    formData.append('estado', nuevoEstado);
    formData.append('notas', notas);

    // Si está completado, empacamos las fotos, la firma y los REPUESTOS
    if (nuevoEstadoSelect === 'Completado') {
        const inputAntes = document.getElementById('fotoAntes');
        const inputDespues = document.getElementById('fotoDespues');
        
        if (isCanvasEmpty(canvas)) {
            Swal.fire('Firma Requerida', 'El cliente debe firmar la pantalla.', 'warning');
            btn.disabled = false; btn.innerHTML = txtOriginal; return;
        }
        if (inputDespues.files.length === 0) {
            Swal.fire('Evidencia Incompleta', 'Por favor sube al menos una foto de cómo quedó el trabajo.', 'warning');
            btn.disabled = false; btn.innerHTML = txtOriginal; return;
        }
        
        // Agregar múltiples fotos del "Antes"
        for (let i = 0; i < inputAntes.files.length; i++) {
            formData.append('fotosAntes', inputAntes.files[i]);
        }
        
        // Agregar múltiples fotos del "Después"
        for (let i = 0; i < inputDespues.files.length; i++) {
            formData.append('fotosDespues', inputDespues.files[i]);
        }
        
        // Transformar la firma a imagen base64 y agregarla
        const firmaBase64 = canvas.toDataURL('image/png');
        formData.append('firma', firmaBase64);

        const repuestosArray = [];
        document.querySelectorAll('.repuesto-item').forEach(fila => {
            const idReq = fila.querySelector('.select-repuesto').value;
            const cant = parseFloat(fila.querySelector('.input-cantidad').value);
            if (idReq && cant > 0) {
                repuestosArray.push({ idRepuesto: parseInt(idReq), cantidad: cant });
            }
        });
        
        // Empacar como JSON en el FormData
        if (repuestosArray.length > 0) {
            formData.append('repuestos', JSON.stringify(repuestosArray));
        }
    }

    try {
        // 1. Detectar si estamos en local o en producción
        const BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
            ? 'http://localhost:8080' 
            : 'https://servi-a-c-pro.onrender.com';

        // 2. Obtener el token de seguridad guardado en el navegador
        const token = Auth.getToken();

        // 3. Hacer la petición fetch incluyéndole el token en los Headers
        const response = await fetch(`${BASE_URL}/api/citas/${idCita}/reporte`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData || "Error al guardar el reporte");
        }
        
        Swal.fire({
            icon: 'success', 
            title: '¡Reporte Enviado!', 
            text: 'Las evidencias, materiales y el estado se han guardado exitosamente.',
            confirmButtonColor: '#0d6efd'
        });
        
        bsModalEstado.hide();
        await cargarCitas();
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = txtOriginal;
    }
}

window.mostrarMapa = async function(direccion, idCliente) {
    const modal = new bootstrap.Modal(document.getElementById('modalMapa'));
    modal.show();

    setTimeout(async () => {
        const mapDiv = document.getElementById('mapaCliente');
        if (mapaActual) { mapaActual.remove(); mapDiv.innerHTML = ''; }

        let lat = null, lng = null;
        try {
            const response = await fetch(`http://localhost:8080/clientes/${idCliente}/coordenadas`);
            if (response.ok) {
                const text = await response.text(); 
                if (text) { const data = JSON.parse(text); lat = data.lat; lng = data.lng; }
            }
        } catch (e) { console.warn("No se pudo obtener coordenadas directas", e); }

        if (!lat || !lng) {
            if (!direccion || direccion === 'Dirección no registrada') {
                mapDiv.innerHTML = '<div class="alert alert-warning m-3">El cliente no tiene dirección registrada.</div>';
                return;
            }
            try {
                const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}&limit=1`;
                const geoResp = await fetch(geocodeUrl);
                const geoData = await geoResp.json();
                
                if (geoData && geoData.length > 0) { lat = parseFloat(geoData[0].lat); lng = parseFloat(geoData[0].lon); } 
                else {
                    lat = 13.9778; lng = -89.5567;
                    Swal.fire({ icon: 'info', title: 'Dirección imprecisa', text: 'Mostrando ubicación aproximada. Revisa las notas del cliente.', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000 });
                }
            } catch (error) {
                mapDiv.innerHTML = '<div class="alert alert-danger m-3">Error al cargar el mapa.</div>';
                return;
            }
        }

        mapaActual = L.map(mapDiv).setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(mapaActual);
        L.marker([lat, lng]).addTo(mapaActual).bindPopup(`<b>Cliente</b><br>${direccion}`).openPopup();
        setTimeout(() => { mapaActual.invalidateSize(); }, 300);
    }, 100);
};

// ========== CONTROL DE INVENTARIO ==========
let catalogoRepuestos = [];

async function cargarCatalogoRepuestos() {
    try {
        catalogoRepuestos = await API.Repuestos.listarActivos();
    } catch (error) {
        console.error("Error al cargar repuestos:", error);
    }
}

// Llamar a esta función cuando cargue la página
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

function actualizarUnidad(idFila) {
    const fila = document.getElementById(idFila);
    const select = fila.querySelector('.select-repuesto');
    const unidadSpan = fila.querySelector('.span-unidad');
    const optionSeleccionada = select.options[select.selectedIndex];
    
    if (optionSeleccionada && optionSeleccionada.dataset.unidad) {
        // Mostrar solo las primeras 3 letras de la unidad (Ej: "Met" para Metros)
        unidadSpan.textContent = optionSeleccionada.dataset.unidad.substring(0, 3).toUpperCase();
    }
}