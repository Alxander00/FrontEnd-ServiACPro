// ==========================================
// admin.js - Panel Administrativo Mejorado
// ==========================================

Auth.protectRoute(['ADMIN']);

const getBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8080';
    }
    return 'https://servi-a-c-pro.onrender.com';
};
const API_BASE_URL = getBaseUrl();
const contentDiv = document.getElementById('dynamicContent');

let bsModalProducto = null;
let bsModalCategoria = null;
let bsModalRepuesto = null;
let categoriasCargadas = false;
let currentImageUrls = [];
let usuariosCache = [];
let categoriasCache = [];

// ==========================================
// VARIABLES GLOBALES EXTRA Y FILAS (UI PREMIUM)
// ==========================================
let tecnicosGlobal = []; // Caché para no recargar técnicos al buscar solicitudes

// 1. Generadores de Filas Individuales
function generarFilaUsuario(u) {
    const statusBadge = u.activo ? 'bg-success text-success' : 'bg-secondary text-secondary';
    const avatar = getAvatarUrl(u);
    return `<tr>
        <td data-label="Perfil" class="ps-4">
            <div class="d-flex align-items-center">
                <img src="${avatar}" class="rounded-circle me-3 border shadow-sm" style="width: 45px; height: 45px; object-fit: cover;">
                <div>
                    <h6 class="mb-0 fw-bold text-dark">${u.nombre || u.nombres || 'Usuario'} ${u.apellido || u.apellidos || ''}</h6>
                    <small class="text-muted fw-semibold">ID: #${u.idUsuario}</small>
                </div>
            </div>
        </td>
        <td data-label="Contacto"><a href="mailto:${u.email}" class="text-decoration-none text-muted fw-semibold"><i class="fas fa-envelope text-primary me-1"></i> ${u.email}</a></td>
        <td data-label="Permisos">
            <select class="form-select form-select-sm bg-light border-0 w-auto" style="min-width: 100px;" onchange="cambiarRolUsuario(${u.idUsuario}, this.value)">
                ${['CLIENTE', 'TECNICO', 'ADMIN'].map(r => `<option value="${r}" ${u.rol === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
        </td>
        <td data-label="Estado"><span class="badge ${statusBadge.split(' ')[0]} bg-opacity-10 ${statusBadge.split(' ')[1]} border-0 px-3 py-2"><i class="fas fa-circle me-1" style="font-size: 8px;"></i> ${u.activo ? 'Operativo' : 'Restringido'}</span></td>
        <td data-label="Acción" class="text-end pe-4"><button class="btn btn-sm ${u.activo ? 'btn-outline-danger' : 'btn-outline-success'} fw-bold px-3 shadow-sm" onclick="toggleUsuarioEstado(${u.idUsuario}, ${!u.activo})"><i class="fas ${u.activo ? 'fa-user-lock' : 'fa-user-check'} me-1"></i> ${u.activo ? 'Suspender' : 'Reactivar'}</button></td>
    </tr>`;
}

function generarFilaPedido(p) {
    const selectClass = p.estado === 'Completado' ? 'text-success border-success bg-success bg-opacity-10' : (p.estado === 'Cancelado' ? 'text-danger border-danger bg-danger bg-opacity-10' : 'text-warning border-warning bg-warning bg-opacity-10');
    const avatar = getAvatarUrl({ nombre: p.nombreCliente, fotoUrl: p.fotoUrl });
    const btnArchivar = (p.estado === 'Completado' || p.estado === 'Cancelado') ? `<button class="btn btn-sm btn-light text-secondary shadow-sm rounded-circle" onclick="archivarPedido(${p.idPedido})" title="Archivar"><i class="fas fa-archive"></i></button>` : `<span class="text-muted small">-</span>`;
    const telefono = p.telefono || '';
    // Limpiar número: eliminar espacios, guiones, paréntesis
    const numeroWhatsApp = telefono.replace(/[\s\-\(\)]/g, '');
    // Si tiene teléfono, mostrar botón de WhatsApp con código de país 503
    const btnWhatsApp = telefono ? `<a href="https://wa.me/503${numeroWhatsApp}?text=Hola%20${encodeURIComponent(p.nombreCliente)}%2C%20soy%20de%20Servi%20A%2FC%20Pro.%20He%20recibido%20tu%20pedido%20%23${p.idPedido}%20y%20necesito%20confirmar%20la%20direcci%C3%B3n%20y%20fecha%20de%20instalaci%C3%B3n." target="_blank" class="btn btn-sm btn-success rounded-circle me-1" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>` : '';
    // Botón "Ver en mapa" si hay dirección
    const direccionMaps = p.direccion ? encodeURIComponent(p.direccion) : '';
    const btnMaps = direccionMaps ? `<a href="https://www.google.com/maps/search/?api=1&query=${direccionMaps}" target="_blank" class="btn btn-sm btn-outline-info rounded-circle me-1" title="Ver en mapa"><i class="fas fa-map-marker-alt"></i></a>` : '';

    return `<tr>
        <td class="ps-4 fw-bold text-primary">#${p.idPedido}</td>
        <td>
            <div class="d-flex align-items-center">
                <img src="${avatar}" class="rounded-circle me-3 border shadow-sm" style="width: 40px; height: 40px; object-fit: cover;">
                <div>
                    <span class="fw-bold text-dark d-block">${p.nombreCliente || 'Cliente'}</span>
                    <small class="text-muted fw-semibold">ID: #${p.idUsuario}</small>
                    ${telefono ? `<div class="text-muted small"><i class="fas fa-phone text-success me-1"></i> ${telefono}</div>` : ''}
                </div>
            </div>
        </td>
        <td class="text-muted fw-semibold small"><i class="far fa-calendar-check text-primary me-1"></i> ${formatearFecha(p.fechaPedido)}</td>
        <td class="fw-bold text-success fs-5">$${p.total.toFixed(2)}</td>
        <td>
            <select class="form-select form-select-sm fw-bold shadow-sm ${selectClass}" style="width: 150px;" onchange="cambiarEstadoPedido(${p.idPedido}, this.value)">
                ${['Pendiente', 'En Proceso', 'Completado', 'Cancelado'].map(e => `<option value="${e}" ${p.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
            </select>
        </td>
        <td class="text-end pe-4">
            ${btnWhatsApp}
            ${btnMaps}
            <button class="btn btn-sm btn-info text-white me-1" onclick="verProductosPedido(${p.idPedido})" title="Ver productos"><i class="fas fa-boxes"></i></button>
            ${btnArchivar}
        </td>
    </tr>`;
}

function generarFilaCategoria(c) {
    return `<tr>
        <td data-label="ID" class="ps-4 fw-bold text-muted">#${c.idCategoria}</td>
        <td data-label="Nombre" class="fw-bold text-dark fs-6">${c.nombre}</td>
        <td data-label="Acciones" class="text-end pe-4">
            <button class="btn btn-sm btn-light text-primary me-2 shadow-sm" onclick="editarCategoria(${c.idCategoria}, '${c.nombre}')"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-light text-danger rounded-circle shadow-sm" onclick="eliminarCategoria(${c.idCategoria})"><i class="fas fa-trash"></i></button>
        </td>
    </tr>`;
}

function generarFilaInventario(rep) {
    const badgeStock = rep.stockActual <= 5 ? 'bg-danger' : 'bg-success';
    return `<tr>
        <td data-label="Material" class="ps-4 fw-bold text-dark">${rep.nombre}</td>
        <td data-label="Unidad"><span class="badge bg-secondary bg-opacity-10 text-secondary border">${rep.unidadMedida}</span></td>
        <td data-label="Costo Unit.">$${rep.costoUnitario.toFixed(2)}</td>
        <td data-label="Stock"><span class="badge ${badgeStock} px-3 py-2 fs-6">${rep.stockActual % 1 === 0 ? rep.stockActual : rep.stockActual.toFixed(2)}</span></td>
        <td data-label="Acciones" class="text-end pe-4">
            <button class="btn btn-sm btn-light text-primary me-2 shadow-sm" onclick="editarRepuesto(${rep.idRepuesto})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-light text-danger shadow-sm rounded-circle" onclick="eliminarRepuesto(${rep.idRepuesto})"><i class="fas fa-trash"></i></button>
        </td>
    </tr>`;
}

function generarFilaSolicitud(sol) {
    const esPendiente = sol.estado === 'PENDIENTE';
    const preferencia = sol.fechaPreferida ? new Date(sol.fechaPreferida).toLocaleString() : 'Abierto a sugerencias';
    return `<tr>
        <td data-label="Ticket / Cliente" class="ps-4">
            <h6 class="fw-bold text-dark mb-1">Ticket #${sol.idSolicitud}</h6>
            <span class="text-primary fw-semibold"><i class="fas fa-user-circle me-1"></i> ${sol.nombreCliente}</span>
            <small class="text-muted fw-bold d-block mt-2 bg-light p-1 rounded">
                <i class="far fa-calendar-alt text-warning me-1"></i> Preferencia: ${preferencia}
            </small>
        </td>
        <td data-label="Labor Requerida"><span class="badge bg-gradient-warning shadow-sm mb-2 px-3 py-2">${sol.tipoServicio.replace('_', ' ')}</span><div class="bg-light p-2 rounded-3 border"><p class="small text-muted mb-0 fst-italic" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;"><i class="fas fa-quote-left text-primary opacity-50 me-1"></i> ${sol.mensaje || 'Sin detalles'}</p></div></td>
        <td data-label="Despacho de Técnico">
            ${esPendiente ? `
            <div class="bg-white p-3 rounded-4 border shadow-sm">
                <select id="tecnicoSelect_${sol.idSolicitud}" class="form-select mb-2 border-primary border-opacity-25 bg-light text-primary fw-bold">
                    <option value="">👤 Asignar Profesional...</option>
                    ${tecnicosGlobal.map(t => `<option value="${t.idUsuario}">${t.nombre || t.nombres} ${t.apellido || t.apellidos || ''}</option>`).join('')}
                </select>
                <div class="d-flex gap-2">
                    <div class="input-group input-group-sm w-50"><span class="input-group-text bg-success bg-opacity-10 border-0 text-success"><i class="fas fa-play"></i></span><input type="datetime-local" id="fechaInicio_${sol.idSolicitud}" class="form-control border-0 bg-light text-muted fw-semibold"></div>
                    <div class="input-group input-group-sm w-50"><span class="input-group-text bg-danger bg-opacity-10 border-0 text-danger"><i class="fas fa-stop"></i></span><input type="datetime-local" id="fechaFin_${sol.idSolicitud}" class="form-control border-0 bg-light text-muted fw-semibold"></div>
                </div>
            </div>
            ` : `<span class="badge ${sol.estado === 'ASIGNADA' ? 'bg-success' : 'bg-danger'}">${sol.estado}</span>`}
        </td>
        <td data-label="Decisión" class="text-end pe-4">
            ${esPendiente ? `<button class="btn btn-success fw-bold shadow-sm mb-2 w-100" onclick="asignarTecnico(${sol.idSolicitud})"><i class="fas fa-check me-1"></i> Asignar</button><button class="btn btn-light text-danger fw-bold border-danger border-opacity-25 w-100" onclick="rechazarSolicitud(${sol.idSolicitud})"><i class="fas fa-times me-1"></i> Descartar</button>` : `<span class="text-muted small">Procesada</span>`}
        </td>
    </tr>`;
}

function generarFilaReporte(cita) {
    const badgeClass = cita.estado === 'COMPLETADA' ? 'bg-success' : (cita.estado === 'CANCELADA' ? 'bg-danger' : 'bg-warning text-dark');
    const tieneEvidencia = cita.estado === 'COMPLETADA' && (cita.urlFirmaCliente || cita.urlsFotosAntes || cita.urlsFotosDespues);
    const btnEvidencia = tieneEvidencia ? `<button class="btn btn-sm btn-primary shadow-sm rounded-pill px-3 fw-bold" onclick="abrirVisorEvidencia(${cita.idCita})"><i class="fas fa-camera me-1"></i> Ver Reporte</button>` : `<span class="text-muted small">No disponible</span>`;
    const btnArchivar = (cita.estado === 'COMPLETADA' || cita.estado === 'CANCELADA') ? `<button class="btn btn-sm btn-light text-secondary shadow-sm rounded-circle" onclick="archivarReporte(${cita.idCita})" title="Archivar"><i class="fas fa-archive"></i></button>` : `<span class="text-muted small">-</span>`;
    return `<tr>
        <td data-label="Ticket" class="ps-4 fw-bold text-primary">#${cita.idCita}</td>
        <td data-label="Cliente"><div class="fw-bold text-dark">${cita.nombreCliente}</div><small class="text-muted"><i class="fas fa-map-marker-alt text-danger me-1"></i>${cita.direccionCliente || 'Sin dirección'}</small></td>
        <td data-label="Técnico"><span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 p-2"><i class="fas fa-hard-hat me-1"></i> ${cita.nombreTecnico}</span></td>
        <td data-label="Fecha" class="small fw-semibold text-secondary">${formatearFecha(cita.fechaInicio)}</td>
        <td data-label="Estado"><span class="badge ${badgeClass} shadow-sm px-3 py-2">${cita.estado}</span></td>
        <td data-label="Acciones" class="text-end pe-4"><div class="d-flex gap-1 justify-content-end flex-wrap">${btnEvidencia}${btnArchivar}</div></td>
    </tr>`;
}

// 2. MOTOR DE BÚSQUEDA SILENCIOSA UNIVERSAL
window.filtrarSilencioso = async function(modulo, valor) {
    if (debounceTimers[modulo]) clearTimeout(debounceTimers[modulo]);
    adminState[modulo].search = valor;
    adminState[modulo].page = 0; // Al buscar, regresamos a la pag 1

    const icon = document.getElementById(`searchIcon_${modulo}`);
    const tbody = document.getElementById(`tabla_${modulo}_body`);
    const pagContainer = document.getElementById(`paginacion_${modulo}_container`);

    // Feedback visual al instante (sin recargar pantalla)
    if (icon) icon.innerHTML = '<i class="fas fa-spinner fa-spin text-primary"></i>';
    if (tbody) tbody.style.opacity = '0.5';

    debounceTimers[modulo] = setTimeout(async () => {
        try {
            let htmlFilas = '';
            let totalPages = 1;
            const { page, size, search } = adminState[modulo];

            if (modulo === 'usuarios') {
                const response = await API.request(`/usuarios/paginado?page=${page}&size=${size}&search=${encodeURIComponent(search)}&rol=${adminState.usuarios.rol}`);
                usuariosCache = response.content || [];
                totalPages = response.totalPages || 1;
                htmlFilas = usuariosCache.length === 0 ? '<tr><td colspan="5" class="text-center py-4 text-muted">No se encontraron usuarios.</td></tr>' : usuariosCache.map(u => generarFilaUsuario(u)).join('');
            } 
            else if (modulo === 'pedidos') {
                const response = await API.request(`/api/pedidos/paginado?page=${page}&size=${size}&search=${encodeURIComponent(search)}&estado=${adminState.pedidos.estado}`);
                const archivados = obtenerArchivados();
                let pedidos = (response.content || []).filter(p => !archivados.includes(p.idPedido));
                totalPages = response.totalPages || 1;
                htmlFilas = pedidos.length === 0 ? '<tr><td colspan="6" class="text-center py-4 text-muted">No se encontraron pedidos.</td></tr>' : pedidos.map(p => generarFilaPedido(p)).join('');
            }
            else if (modulo === 'categorias') {
                const categorias = await API.request('/categorias');
                let filtradas = search ? categorias.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase())) : categorias;
                const paginadas = filtradas.slice(page * size, (page * size) + size);
                totalPages = Math.ceil(filtradas.length / size) || 1;
                htmlFilas = paginadas.length === 0 ? '<tr><td colspan="3" class="text-center py-4 text-muted">No se encontraron categorías.</td></tr>' : paginadas.map(c => generarFilaCategoria(c)).join('');
            }
            else if (modulo === 'inventario') {
                let repuestos = await API.Repuestos.listarActivos();
                if (search) repuestos = repuestos.filter(r => r.nombre.toLowerCase().includes(search.toLowerCase()));
                if (adminState.inventario.unidad) repuestos = repuestos.filter(r => r.unidadMedida === adminState.inventario.unidad);
                const paginados = repuestos.slice(page * size, (page * size) + size);
                totalPages = Math.ceil(repuestos.length / size) || 1;
                htmlFilas = paginados.length === 0 ? '<tr><td colspan="5" class="text-center py-4 text-muted">No hay repuestos.</td></tr>' : paginados.map(r => generarFilaInventario(r)).join('');
                
                // Actualizar números de las Cards silenciosamente
                const inversionTotal = repuestos.reduce((acc, rep) => acc + (rep.stockActual * rep.costoUnitario), 0);
                const cardInversion = document.getElementById('card-inversion-total');
                const cardMateriales = document.getElementById('card-materiales-total');
                if (cardInversion) cardInversion.textContent = `$${inversionTotal.toFixed(2)}`;
                if (cardMateriales) cardMateriales.textContent = repuestos.length;
            }
            else if (modulo === 'solicitudes') {
                let solicitudes = await API.Solicitudes.listarPendientes();
                if (search) solicitudes = solicitudes.filter(s => s.nombreCliente.toLowerCase().includes(search.toLowerCase()));
                if (adminState.solicitudes.estado) solicitudes = solicitudes.filter(s => s.estado === adminState.solicitudes.estado);
                const paginadas = solicitudes.slice(page * size, (page * size) + size);
                totalPages = Math.ceil(solicitudes.length / size) || 1;
                htmlFilas = paginadas.length === 0 ? '<tr><td colspan="4" class="text-center py-4 text-muted">No hay solicitudes.</td></tr>' : paginadas.map(s => generarFilaSolicitud(s)).join('');
            }
            else if (modulo === 'reportes') {
                let citas = listaCitasGlobal; // Usamos la caché de reportes
                if (search) citas = citas.filter(c => c.nombreCliente.toLowerCase().includes(search.toLowerCase()));
                if (adminState.reportes.estado) citas = citas.filter(c => c.estado === adminState.reportes.estado);
                const archivados = obtenerReportesArchivados();
                citas = citas.filter(c => !archivados.includes(Number(c.idCita)));
                const paginadas = citas.slice(page * size, (page * size) + size);
                totalPages = Math.ceil(citas.length / size) || 1;
                htmlFilas = paginadas.length === 0 ? '<tr><td colspan="6" class="text-center py-4 text-muted">No hay reportes.</td></tr>' : paginadas.map(c => generarFilaReporte(c)).join('');
            }

            // Inyectar datos en silencio
            if (tbody) { tbody.innerHTML = htmlFilas; tbody.style.opacity = '1'; }
            if (pagContainer) pagContainer.innerHTML = renderPagination(totalPages, page, modulo);
            if (icon) icon.innerHTML = '<i class="fas fa-search text-muted"></i>';

        } catch (error) {
            console.error(`Error en búsqueda de ${modulo}:`, error);
            if (icon) icon.innerHTML = '<i class="fas fa-exclamation-triangle text-danger"></i>';
            if (tbody) tbody.style.opacity = '1';
        }
    }, 400); // 400ms de espera
};

// ==========================================
// ARCHIVADO DE PEDIDOS (LOCALSTORAGE)
// ==========================================
function obtenerArchivados() {
    const archivados = JSON.parse(localStorage.getItem('pedidos_archivados') || '[]');
    return archivados;
}

// ==========================================
// ARCHIVADO DE PEDIDOS (LOCALSTORAGE) - FUNCIONES FALTANTES
// ==========================================

// 1. Función para guardar un ID en localStorage (archivar)
window.archivarPedidoLocal = function(id) {
    let archivados = obtenerArchivados();
    if (!archivados.includes(id)) {
        archivados.push(id);
        localStorage.setItem('pedidos_archivados', JSON.stringify(archivados));
        console.log('✅ Pedido archivado localmente:', id);
    }
};

// 2. Función para eliminar un ID de localStorage (desarchivar)
window.desarchivarPedido = function(id) {
    // Asegurar que el ID sea número para comparación
    const idNum = Number(id);
    let archivados = obtenerArchivados();
    const originalLength = archivados.length;
    archivados = archivados.filter(pid => Number(pid) !== idNum);
    
    if (archivados.length < originalLength) {
        localStorage.setItem('pedidos_archivados', JSON.stringify(archivados));
        console.log('✅ Pedido desarchivado:', idNum);
        console.log('📦 Archivados actuales:', archivados);
    } else {
        console.warn('⚠️ El ID', idNum, 'no estaba en la lista de archivados');
    }
    
    // Cerrar el modal actual (si está abierto)
    Swal.close();
    
    // Reiniciar la página a 0 y recargar la tabla principal
    adminState.pedidos.page = 0;
    renderPedidos();
    
    // Reabrir el modal de archivados actualizado
    setTimeout(() => {
        mostrarArchivados();
    }, 300);
    
    Swal.fire({
        icon: 'success',
        title: 'Pedido restaurado',
        text: `El pedido #${idNum} ya no está archivado.`,
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false
    });
};

window.archivarPedido = async function(id) {
    const confirm = await Swal.fire({
        title: '¿Archivar pedido?',
        text: 'El pedido desaparecerá de tu lista principal pero seguirá contando en las estadísticas.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#6c757d',
        confirmButtonText: 'Sí, archivar',
        cancelButtonText: 'Cancelar'
    });
    if (confirm.isConfirmed) {
        window.archivarPedidoLocal(id);
        Swal.fire({
            icon: 'success',
            title: 'Pedido archivado',
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false
        });
        adminState.pedidos.page = 0;
        renderPedidos();
    }
};
window.archivarTodosCompletados = async function() {
    // Obtener los pedidos de la página actual
    const { page, size, search, estado } = adminState.pedidos;
    const response = await API.request(`/api/pedidos/paginado?page=${page}&size=${size}&search=${encodeURIComponent(search)}&estado=${estado}`);
    let pedidos = response.content || [];
    const archivados = obtenerArchivados();
    // Filtrar los que NO están archivados y que están Completados o Cancelados
    const completadosCancelados = pedidos.filter(p => 
        !archivados.includes(p.idPedido) && 
        (p.estado === 'Completado' || p.estado === 'Cancelado')
    );

    if (completadosCancelados.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Sin pedidos',
            text: 'No hay pedidos completados o cancelados para archivar.',
            confirmButtonColor: '#0d6efd'
        });
        return;
    }

    const confirmado = await UI.confirmar(`Archivar ${completadosCancelados.length} pedidos`, 'Estos pedidos desaparecerán de tu lista principal pero seguirán contando en las estadísticas.', 'Sí, archivar todos', '#6c757d');

    if (confirmado) {
        let ids = completadosCancelados.map(p => p.idPedido);
        let archivadosActuales = obtenerArchivados();
        let nuevosArchivados = [...new Set([...archivadosActuales, ...ids])];
        localStorage.setItem('pedidos_archivados', JSON.stringify(nuevosArchivados));
        Swal.fire({
            icon: 'success',
            title: `${ids.length} pedidos archivados`,
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false
        });
        renderPedidos();
    }
};

// ==========================================
// ARCHIVADO DE REPORTES (CITAS)
// ==========================================
function obtenerReportesArchivados() {
    return JSON.parse(localStorage.getItem('reportes_archivados') || '[]');
}

function archivarReporte(id) {
    let archivados = obtenerReportesArchivados();
    if (!archivados.includes(id)) {
        archivados.push(id);
        localStorage.setItem('reportes_archivados', JSON.stringify(archivados));
    }
}

function desarchivarReporte(id) {
    let archivados = obtenerReportesArchivados();
    archivados = archivados.filter(pid => pid !== id);
    localStorage.setItem('reportes_archivados', JSON.stringify(archivados));
}

// ==========================================
// ESTADO GLOBAL DE PAGINACIÓN Y FILTROS
// ==========================================
const adminState = {
    productos: { page: 0, size: 8, search: '', categoria: '' },
    pedidos: { page: 0, size: 8, search: '', estado: '' },
    usuarios: { page: 0, size: 8, search: '', rol: '' },
    inventario: { page: 0, size: 8, search: '', unidad: '' },
    solicitudes: { page: 0, size: 8, search: '', estado: '' },
    reportes: { page: 0, size: 8, search: '' },
    cotizador: { page: 0, size: 8, search: '' },
    categorias: { page: 0, size: 5, search: '' }
};

// ==========================================
// DEBOUNCE POR MÓDULO (SIN SPINNER VISUAL)
// ==========================================
const debounceTimers = {};

// Generador del Avatar
const getAvatarUrl = (usuario) => {
    if (usuario && usuario.fotoUrl) return usuario.fotoUrl;
    const nombre = usuario && (usuario.nombres || usuario.nombre) ? (usuario.nombres || usuario.nombre) : 'Usuario';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=0d6efd&color=fff&bold=true`;
};

// Generador Visual de Paginación
function renderPagination(totalPages, currentPage, modulo) {
    if (totalPages <= 1) return '';
    let html = '<nav class="mt-4"><ul class="pagination justify-content-center shadow-sm">';
    
    html += `<li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
                <button class="page-link border-0" onclick="cambiarPagina('${modulo}', ${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>
             </li>`;
             
    for (let i = 0; i < totalPages; i++) {
        if (i === 0 || i === totalPages - 1 || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<li class="page-item ${currentPage === i ? 'active' : ''}">
                        <button class="page-link border-0 ${currentPage === i ? 'fw-bold' : ''}" onclick="cambiarPagina('${modulo}', ${i})">${i + 1}</button>
                     </li>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<li class="page-item disabled"><span class="page-link border-0">...</span></li>`;
        }
    }
    
    html += `<li class="page-item ${currentPage === totalPages - 1 ? 'disabled' : ''}">
                <button class="page-link border-0" onclick="cambiarPagina('${modulo}', ${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>
             </li>`;
             
    html += '</ul></nav>';
    return html;
}

window.cambiarPagina = function(modulo, nuevaPagina) {
    adminState[modulo].page = nuevaPagina;
    if (modulo === 'usuarios') renderUsuarios();
    if (modulo === 'pedidos') renderPedidos();
    if (modulo === 'productos') renderProductos();
    if (modulo === 'inventario') renderInventario();
    if (modulo === 'solicitudes') renderSolicitudes();
    if (modulo === 'reportes') renderReportes();
    if (modulo === 'cotizador') renderCotizador();
    if (modulo === 'categorias') renderCategorias();
};

window.aplicarFiltro = function(modulo) {
    adminState[modulo].page = 0;
    if (modulo === 'usuarios') {
        adminState.usuarios.search = document.getElementById('searchUsuarios').value;
        adminState.usuarios.rol = document.getElementById('filterRolUsuarios').value;
        renderUsuarios();
    }
    if (modulo === 'pedidos') {
        adminState.pedidos.search = document.getElementById('searchPedidos').value;
        adminState.pedidos.estado = document.getElementById('filterEstadoPedidos').value;
        renderPedidos();
    }
    if (modulo === 'productos') {
        adminState.productos.search = document.getElementById('searchProductos').value;
        adminState.productos.categoria = document.getElementById('filterCategoriaProductos').value;
        renderProductos();
    }
    if (modulo === 'solicitudes') {
        adminState.solicitudes.search = document.getElementById('filtroSolCliente').value;
        adminState.solicitudes.estado = document.getElementById('filtroSolEstado').value;
        renderSolicitudes();
    }
    if (modulo === 'reportes') {
        adminState.reportes.search = document.getElementById('filtroRepCliente').value;
        adminState.reportes.estado = document.getElementById('filtroRepEstado').value;
        // No necesita fechas porque las pasa desde renderReportes
        renderReportes();
    }
    if (modulo === 'inventario') {
        adminState.inventario.search = document.getElementById('buscadorInventario')?.value || '';
        adminState.inventario.unidad = document.getElementById('filtroUnidadInventario')?.value || '';
        renderInventario();
    }
    if (modulo === 'cotizador') {
        adminState.cotizador.search = document.getElementById('cotSearchProducto').value;
        renderCotizador();
    }
};

window.filtrarEnTiempoReal = function(modulo, valor) {
    if (debounceTimers[modulo]) {
        clearTimeout(debounceTimers[modulo]);
    }
    adminState[modulo].search = valor;
    adminState[modulo].page = 0;
    if (valor === '') {
        if (modulo === 'productos') renderProductos();
        if (modulo === 'pedidos') renderPedidos();
        if (modulo === 'usuarios') renderUsuarios();
        if (modulo === 'inventario') renderInventario();
        if (modulo === 'solicitudes') renderSolicitudes();
        if (modulo === 'reportes') renderReportes();
        return;
    }
    debounceTimers[modulo] = setTimeout(() => {
        if (modulo === 'productos') renderProductos();
        if (modulo === 'pedidos') renderPedidos();
        if (modulo === 'usuarios') renderUsuarios();
        if (modulo === 'inventario') renderInventario();
        if (modulo === 'solicitudes') renderSolicitudes();
        if (modulo === 'reportes') renderReportes();
    }, 300);
};

window.mostrarArchivados = async function() {
    const archivados = obtenerArchivados();
    if (archivados.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Sin archivados',
            text: 'No hay pedidos archivados.',
            confirmButtonColor: '#0d6efd'
        });
        return;
    }

    try {
        const response = await API.request(`/api/pedidos/paginado?page=0&size=1000&search=&estado=`);
        const allPedidos = response.content || [];
        const archivadosPedidos = allPedidos.filter(p => archivados.includes(p.idPedido));

        if (archivadosPedidos.length === 0) {
            Swal.fire('Sin resultados', 'Los IDs archivados no coinciden con ningún pedido actual.', 'info');
            return;
        }

        archivadosPedidos.sort((a, b) => a.idPedido - b.idPedido);

        let tableRows = '';
        archivadosPedidos.forEach(p => {
            const avatar = getAvatarUrl({ nombre: p.nombreCliente, fotoUrl: p.fotoUrl });
            const badgeClass = p.estado === 'Completado' ? 'bg-success' : 'bg-secondary';
            tableRows += `
                <tr>
                    <td class="ps-4 fw-bold text-primary">#${p.idPedido}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${avatar}" class="rounded-circle me-3 border shadow-sm" style="width: 35px; height: 35px; object-fit: cover;">
                            <span class="fw-bold text-dark d-block">${p.nombreCliente || 'Cliente'}</span>
                        </div>
                    </td>
                    <td>${formatearFecha(p.fechaPedido)}</td>
                    <td class="fw-bold text-success">$${p.total.toFixed(2)}</td>
                    <td><span class="badge ${badgeClass}">${p.estado}</span></td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-outline-primary rounded-circle" onclick="desarchivarPedido(${p.idPedido})" title="Restaurar (quitar de archivados)">
                            <i class="fas fa-undo"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        Swal.fire({
            title: '📦 Pedidos Archivados',
            html: `
                <div style="max-height: 400px; overflow-y: auto;">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="bg-light">
                            <tr>
                                <th class="ps-4">Factura</th>
                                <th>Cliente</th>
                                <th>Fecha</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th class="text-end pe-4">Acción</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
                <small class="text-muted d-block mt-2">Total: ${archivadosPedidos.length} pedidos archivados.</small>
            `,
            icon: 'info',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#0d6efd',
            width: 900,
            customClass: {
                popup: 'swal2-popup',
                htmlContainer: 'swal2-html-container'
            }
        });

    } catch (error) {
        Swal.fire('Error', 'No se pudieron cargar los pedidos archivados.', 'error');
    }
};

window.archivarPedidoLocal = function(id) {
    let archivados = obtenerArchivados();
    if (!archivados.includes(id)) {
        archivados.push(id);
        localStorage.setItem('pedidos_archivados', JSON.stringify(archivados));
    }
};

const formatearFecha = (fechaString) => {
    const opciones = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-ES', opciones);
};

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    bsModalProducto = new bootstrap.Modal(document.getElementById('productoModal'));
    bsModalCategoria = new bootstrap.Modal(document.getElementById('categoriaModal'));
    bsModalRepuesto = new bootstrap.Modal(document.getElementById('repuestoModal'));

    document.getElementById('productoForm').addEventListener('submit', guardarProducto);
    document.getElementById('categoriaForm').addEventListener('submit', guardarCategoriaEdicion);
    document.getElementById('repuestoForm').addEventListener('submit', guardarRepuesto);

    document.getElementById('prodImagenes').addEventListener('change', function(e) {
        const previewContainer = document.getElementById('nuevasImagenesPreview');
        previewContainer.innerHTML = '';
        const files = this.files;
        if (files.length === 0) {
            previewContainer.style.display = 'none';
            return;
        }
        previewContainer.style.display = 'flex';
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = function(ev) {
                const div = document.createElement('div');
                div.className = 'position-relative';
                div.style.width = '100px';
                div.style.height = '100px';
                div.style.borderRadius = '8px';
                div.style.overflow = 'hidden';
                div.style.border = '1px solid #e9edf4';
                div.innerHTML = `
                    <img src="${ev.target.result}" class="w-100 h-100" style="object-fit: cover;" alt="Vista previa">
                    <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle" 
                            style="width: 22px; height: 22px; padding: 0; font-size: 12px; line-height: 1;" 
                            onclick="eliminarImagenSeleccionada(this, ${i})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewContainer.appendChild(div);
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('productoModal').addEventListener('hidden.bs.modal', function () {
        document.getElementById('prodImagenes').value = '';
        document.getElementById('nuevasImagenesPreview').innerHTML = '';
        document.getElementById('nuevasImagenesPreview').style.display = 'none';
    });

    loadPage('dashboard');
    actualizarContadoresAdmin();

    document.querySelectorAll('.nav-link[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            loadPage(item.dataset.page);
        });
    });
});

// ===== ELIMINAR UNA IMAGEN DE LA SELECCIÓN (nuevas) =====
window.eliminarImagenSeleccionada = function(btn, index) {
    const input = document.getElementById('prodImagenes');
    const dt = new DataTransfer();
    const files = input.files;
    for (let i = 0; i < files.length; i++) {
        if (i !== index) dt.items.add(files[i]);
    }
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
};

// ===== ELIMINAR UNA IMAGEN EXISTENTE (de las que tiene el producto) =====
window.eliminarImagenExistente = function(index) {
    currentImageUrls.splice(index, 1);
    mostrarImagenesActuales(currentImageUrls);
    if (currentImageUrls.length === 0) {
        document.getElementById('currentImagesContainer').style.display = 'none';
    }
};

function loadPage(page) {
    const titles = {
        dashboard: ['Dashboard', 'Visión general de métricas en tiempo real'],
        productos: ['Gestión de Productos', 'Administra el inventario, precios y detalles'],
        pedidos: ['Control de Pedidos', 'Seguimiento financiero y estados de venta'],
        categorias: ['Clasificación', 'Organiza el catálogo de productos'],
        usuarios: ['Directorio de Usuarios', 'Administración de accesos y roles'],
        inventario: ['Inventario Técnico', 'Control de existencias y costos de materiales'],
        cotizador: ['Cotizador Rápido', 'Genera presupuestos formales en PDF para clientes'],
        solicitudes: ['Centro de Operaciones', 'Visitas técnicas y asignaciones'],
        reportes: ['Reportes Técnicos', 'Evidencias, firmas y estados de servicio']
    };
    document.getElementById('sectionTitle').textContent = titles[page][0];
    document.getElementById('sectionSubtitle').textContent = titles[page][1];

    switch(page) {
        case 'dashboard': renderDashboard(); break;
        case 'productos': renderProductos(); break;
        case 'pedidos': renderPedidos(); break;
        case 'categorias': renderCategorias(); break;
        case 'usuarios': renderUsuarios(); break;
        case 'solicitudes': renderSolicitudes(); break;
        case 'reportes': renderReportes(); break;
        case 'inventario': renderInventario(); break;
        case 'cotizador': renderCotizador(); break;
        default: renderDashboard();
    }
}

// ==========================================
// DASHBOARD
// ==========================================
async function renderDashboard() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div><h5 class="mt-3 text-muted">Analizando datos...</h5></div>';
    try {
        const stats = await API.Estadisticas.obtenerDashboard();
        contentDiv.innerHTML = `
            <div class="row g-4 mb-4">
                <div class="col-xl-3 col-md-6"><div class="card h-100"><div class="card-body p-4 d-flex justify-content-between align-items-center"><div><h6 class="text-muted fw-bold mb-2 text-uppercase">Ingresos Totales</h6><h2 class="fw-bold mb-0 text-dark">$${stats.ventasTotales.toFixed(2)}</h2></div><div class="stat-icon bg-gradient-primary text-white"><i class="fas fa-wallet"></i></div></div></div></div>
                <div class="col-xl-3 col-md-6"><div class="card h-100"><div class="card-body p-4 d-flex justify-content-between align-items-center"><div><h6 class="text-muted fw-bold mb-2 text-uppercase">Pedidos Exitosos</h6><h2 class="fw-bold mb-0 text-dark">${stats.totalPedidos}</h2></div><div class="stat-icon bg-gradient-success text-white"><i class="fas fa-shopping-bag"></i></div></div></div></div>
                <div class="col-xl-3 col-md-6"><div class="card h-100"><div class="card-body p-4 d-flex justify-content-between align-items-center"><div><h6 class="text-muted fw-bold mb-2 text-uppercase">En Inventario</h6><h2 class="fw-bold mb-0 text-dark">${stats.totalProductos}</h2></div><div class="stat-icon bg-gradient-info text-white"><i class="fas fa-box-open"></i></div></div></div></div>
                <div class="col-xl-3 col-md-6"><div class="card h-100"><div class="card-body p-4 d-flex justify-content-between align-items-center"><div><h6 class="text-muted fw-bold mb-2 text-uppercase">Clientes Activos</h6><h2 class="fw-bold mb-0 text-dark">${stats.totalClientes}</h2></div><div class="stat-icon bg-gradient-warning text-white"><i class="fas fa-users"></i></div></div></div></div>
            </div>
            <div class="row g-4">
                <div class="col-lg-7"><div class="card h-100"><div class="card-header bg-white pt-4 px-4"><h5 class="fw-bold mb-0 text-dark"><i class="fas fa-chart-line text-primary me-2"></i>Fluctuación de Ingresos</h5></div><div class="card-body p-4"><canvas id="ventasChart" height="220"></canvas></div></div></div>
                <div class="col-lg-5"><div class="card h-100"><div class="card-header bg-white pt-4 px-4"><h5 class="fw-bold mb-0 text-dark"><i class="fas fa-fire text-danger me-2"></i>Equipos Más Vendidos</h5></div><div class="card-body p-4"><canvas id="productosChart" height="260"></canvas></div></div></div>
            </div>
        `;
        const ctxVentas = document.getElementById('ventasChart').getContext('2d');
        new Chart(ctxVentas, { type: 'line', data: { labels: stats.ventasPorMes.map(v => v.mes), datasets: [{ label: 'Ventas ($)', data: stats.ventasPorMes.map(v => v.total), borderColor: '#0d6efd', backgroundColor: 'rgba(13,110,253,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#0d6efd', pointRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
        const ctxProductos = document.getElementById('productosChart').getContext('2d');
        new Chart(ctxProductos, { type: 'bar', data: { labels: stats.productosMasVendidos.map(p => p.nombre.substring(0,12)+'…'), datasets: [{ label: 'Unidades', data: stats.productosMasVendidos.map(p => p.vendidos), backgroundColor: ['#0d6efd', '#20c997', '#ffc107', '#dc3545', '#0dcaf0'], borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger shadow-sm m-3 rounded-4"><i class="fas fa-exclamation-triangle me-2"></i> Error al cargar estadísticas: ${error.message}</div>`;
    }
}

// ==========================================
// PRODUCTOS (BÚSQUEDA SILENCIOSA Y FLUIDA)
// ==========================================

// 1. Función auxiliar para dibujar una sola fila
function generarFilaProducto(p) {
    const avatar = (p.imagenesUrls && p.imagenesUrls.length > 0) ? p.imagenesUrls[0] : 'https://via.placeholder.com/45?text=A/C';
    return `
    <tr>
        <td data-label="Equipo y Detalles" class="ps-4">
            <div class="d-flex align-items-center">
                <img src="${avatar}" class="rounded me-3 border shadow-sm" style="width: 45px; height: 45px; object-fit: cover;">
                <div>
                    <h6 class="mb-0 fw-bold text-dark">${p.nombre}</h6>
                    <small class="text-muted fw-semibold">ID: #${p.idProducto} | ${p.capacidadBTU} BTU</small>
                </div>
            </div>
        </td>
        <td data-label="Categoría"><span class="badge bg-secondary bg-opacity-10 text-secondary border px-3 py-2">${p.nombreCategoria || 'Sin categoría'}</span></td>
        <td data-label="Precio Base" class="fw-bold text-dark fs-5">$${p.precio.toFixed(2)}</td>
        <td data-label="Disponibilidad"><span class="badge ${p.stock > 5 ? 'bg-success' : (p.stock > 0 ? 'bg-warning' : 'bg-danger')} bg-opacity-10 text-${p.stock > 5 ? 'success' : (p.stock > 0 ? 'warning text-dark' : 'danger')} border-0 px-3 py-2"><i class="fas ${p.stock > 5 ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-1"></i> ${p.stock} unid.</span></td>
        <td data-label="Acciones" class="text-end pe-4">
            <button class="btn btn-sm btn-light text-primary me-2 shadow-sm" onclick="openProductoModal(${p.idProducto})" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-light text-danger shadow-sm rounded-circle" onclick="eliminarProducto(${p.idProducto})" title="Eliminar"><i class="fas fa-trash"></i></button>
        </td>
    </tr>`;
}

// ==========================================
// PRODUCTOS
// ==========================================
async function renderProductos() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        const { page, size, search, categoria } = adminState.productos;
        const response = await API.request(`/productos/paginado?page=${page}&size=${size}&search=${encodeURIComponent(search)}&categoria=${categoria}`);
        const productos = response.content || [];
        const totalPages = response.totalPages || 1;

        let opcionesCategoria = '<option value="">Todas las Categorías</option>';
        try {
            const categorias = await API.request('/categorias');
            categorias.forEach(c => {
                opcionesCategoria += `<option value="${c.idCategoria}" ${parseInt(categoria) === c.idCategoria ? 'selected' : ''}>${c.nombre}</option>`;
            });
        } catch (e) {}

        const currentSearchValue = search;

        contentDiv.innerHTML = `
            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div class="card-header bg-white pt-4 px-4 border-0">
                    <div class="row align-items-center g-3">
                        <div class="col-md-4">
                            <h5 class="fw-bold mb-0 text-dark"><i class="fas fa-box text-primary me-2"></i>Inventario de Equipos</h5>
                        </div>
                        <div class="col-md-8">
                            <div class="d-flex gap-2 justify-content-md-end">
                                <select id="filterCategoriaProductos" class="form-select bg-light border-0 w-auto" onchange="aplicarFiltro('productos')">
                                    ${opcionesCategoria}
                                </select>
                                <div class="input-group w-50">
                                    <span class="input-group-text bg-light border-0" id="searchIconProductos"><i class="fas fa-search text-muted"></i></span>
                                    <input type="text" 
                                        id="searchProductos" 
                                        class="form-control bg-light border-0" 
                                        placeholder="Buscar equipo..." 
                                        value="${currentSearchValue}" 
                                        oninput="filtrarProductosSilencioso(this.value)"> </div>
                                <button class="btn btn-primary fw-bold shadow-sm ms-2 text-nowrap" onclick="openProductoModal()">
                                    <i class="fas fa-plus"></i> Nuevo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0 mt-3">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="bg-light">
                                <tr>
                                    <th class="ps-4">Equipo y Detalles</th>
                                    <th>Categoría</th>
                                    <th>Precio Base</th>
                                    <th>Disponibilidad</th>
                                    <th class="text-end pe-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="tablaProductosBody" style="transition: opacity 0.3s ease;">
                                ${productos.length === 0 ? '<tr><td colspan="5" class="text-center py-4 text-muted">No se encontraron productos.</td></tr>' : ''}
                                ${productos.map(p => generarFilaProducto(p)).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div id="paginacionProductosContainer">
                        ${renderPagination(totalPages, page, 'productos')}
                    </div>
                </div>
            </div>
        `;

        // Mantener el foco solo si recargamos la página entera por usar la paginación o el filtro de categorías
        const newInput = document.getElementById('searchProductos');
        if (newInput && document.activeElement.id === 'searchProductos') {
            newInput.focus();
            const length = newInput.value.length;
            newInput.setSelectionRange(length, length);
        }

    } catch (error) {
        console.error('Error en renderProductos:', error);
        contentDiv.innerHTML = `<div class="alert alert-danger m-4">Error al cargar productos: ${error.message}</div>`;
    }
}

// 3. La nueva función de búsqueda silenciosa
window.filtrarProductosSilencioso = async function(valor) {
    if (debounceTimers['productos']) {
        clearTimeout(debounceTimers['productos']);
    }

    adminState.productos.search = valor;
    adminState.productos.page = 0; // Al buscar, regresamos a la página 1

    const icon = document.getElementById('searchIconProductos');
    const tbody = document.getElementById('tablaProductosBody');

    // 1. Feedback visual INMEDIATO: Ponemos el spinner y atenuamos la tabla
    if (icon) icon.innerHTML = '<i class="fas fa-spinner fa-spin text-primary"></i>';
    if (tbody) tbody.style.opacity = '0.5'; 

    debounceTimers['productos'] = setTimeout(async () => {
        try {
            const { page, size, search, categoria } = adminState.productos;
            
            // Hacemos la consulta al backend
            const response = await API.request(`/productos/paginado?page=${page}&size=${size}&search=${encodeURIComponent(search)}&categoria=${categoria}`);
            const productos = response.content || [];
            const totalPages = response.totalPages || 1;

            // 2. Actualizamos SOLO el cuerpo de la tabla (sin recargar la pantalla entera)
            if (tbody) {
                tbody.innerHTML = productos.length === 0
                    ? '<tr><td colspan="5" class="text-center py-4 text-muted">No se encontraron equipos que coincidan con tu búsqueda.</td></tr>'
                    : productos.map(p => generarFilaProducto(p)).join('');
                tbody.style.opacity = '1'; // Restaurar el color normal
            }

            // 3. Actualizamos los botones de paginación
            const pagContainer = document.getElementById('paginacionProductosContainer');
            if (pagContainer) {
                pagContainer.innerHTML = renderPagination(totalPages, page, 'productos');
            }

            // 4. Devolvemos el ícono de la lupa a la normalidad
            if (icon) icon.innerHTML = '<i class="fas fa-search text-muted"></i>';

        } catch (error) {
            console.error("Error al buscar productos:", error);
            if (icon) icon.innerHTML = '<i class="fas fa-exclamation-triangle text-danger" title="Error de conexión"></i>';
            if (tbody) tbody.style.opacity = '1';
        }
    }, 400); // 400ms de espera mientras teclea
};

// ==========================================
// ABRIR MODAL PRODUCTO
// ==========================================
async function openProductoModal(id = null) {
    document.getElementById('productoForm').reset();
    document.getElementById('productoId').value = '';
    document.getElementById('modalTitle').textContent = 'Agregar Equipo';
    document.getElementById('currentImagesContainer').style.display = 'none';
    document.getElementById('prodImagenes').value = '';
    document.getElementById('nuevasImagenesPreview').innerHTML = '';
    document.getElementById('nuevasImagenesPreview').style.display = 'none';
    currentImageUrls = [];

    if (!categoriasCargadas) await cargarCategoriasEnSelect();

    if (id) {
        try {
            const prod = await API.Productos.obtenerPorId(id);
            document.getElementById('prodNombre').value = prod.nombre || '';
            document.getElementById('prodPrecio').value = prod.precio || '';
            document.getElementById('prodBTU').value = prod.capacidadBTU || '';
            document.getElementById('prodStock').value = prod.stock || 0;
            document.getElementById('prodCategoria').value = prod.idCategoria || '';
            const desc = prod.descripcion || '';
            const marcaMatch = desc.match(/Marca: ([^-]+)-(.*)/);
            if (marcaMatch) {
                document.getElementById('prodMarca').value = marcaMatch[1].trim();
                document.getElementById('prodDescripcion').value = marcaMatch[2].trim();
            } else {
                document.getElementById('prodMarca').value = prod.marca || '';
                document.getElementById('prodDescripcion').value = desc;
            }
            document.getElementById('productoId').value = prod.idProducto;
            document.getElementById('modalTitle').textContent = 'Modificar Equipo';
            currentImageUrls = prod.imagenesUrls || [];
            mostrarImagenesActuales(currentImageUrls);
        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar el producto', 'error');
            return;
        }
    }
    bsModalProducto.show();
}

function mostrarImagenesActuales(imagenes) {
    const container = document.getElementById('currentImagesContainer');
    const list = document.getElementById('currentImagesList');
    if (!imagenes || imagenes.length === 0) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'block';
    list.innerHTML = imagenes.map((url, index) => `
        <div style="width: 100px; height: 100px; border-radius: 8px; overflow: hidden; border: 1px solid #e9edf4; flex-shrink: 0; position: relative;">
            <img src="${url}" class="w-100 h-100" style="object-fit: cover;" alt="Imagen del producto">
            <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle" 
                    style="width: 22px; height: 22px; padding: 0; font-size: 12px; line-height: 1;" 
                    onclick="eliminarImagenExistente(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

async function cargarCategoriasEnSelect() {
    const select = document.getElementById('prodCategoria');
    
    // Si ya tenemos caché, usarla
    if (categoriasCache.length > 0) {
        select.innerHTML = '<option value="" disabled selected>Seleccione una categoría</option>';
        categoriasCache.forEach(cat => {
            select.innerHTML += `<option value="${cat.idCategoria}">${cat.nombre}</option>`;
        });
        return;
    }

    select.innerHTML = '<option value="">Cargando...</option>';
    try {
        const categorias = await API.request('/categorias');
        categoriasCache = categorias; // guardamos en caché
        select.innerHTML = '<option value="" disabled selected>Seleccione una categoría</option>';
        categorias.forEach(cat => {
            select.innerHTML += `<option value="${cat.idCategoria}">${cat.nombre}</option>`;
        });
        categoriasCargadas = true;
    } catch (error) {
        select.innerHTML = '<option value="">Error al cargar</option>';
        console.error('Error cargando categorías:', error);
    }
}

async function guardarProducto(event) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

    const idProducto = document.getElementById('productoId').value;
    const marca = document.getElementById('prodMarca').value;
    const descPura = document.getElementById('prodDescripcion').value;
    const categoriaId = parseInt(document.getElementById('prodCategoria').value);
    if (isNaN(categoriaId) || categoriaId <= 0) {
        Swal.fire('Error', 'Selecciona una categoría válida', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
    }

    const payloadTexto = {
        nombre: document.getElementById('prodNombre').value,
        descripcion: `Marca: ${marca} - ${descPura}`,
        precio: parseFloat(document.getElementById('prodPrecio').value),
        capacidadBtu: parseInt(document.getElementById('prodBTU').value) || 0,
        stock: parseInt(document.getElementById('prodStock').value) || 0,
        idCategoria: categoriaId,
        imagenesUrls: currentImageUrls
    };

    const fileInput = document.getElementById('prodImagenes');
    const formData = new FormData();
    const productoBlob = new Blob([JSON.stringify(payloadTexto)], { type: 'application/json' });
    formData.append('producto', productoBlob);

    if (fileInput.files.length > 0) {
        for (let i = 0; i < fileInput.files.length; i++) {
            formData.append('imagenes', fileInput.files[i]);
        }
    }

    try {
        const url = idProducto 
            ? `${API_URL}/productos/${idProducto}` 
            : `${API_URL}/productos`;
        const method = idProducto ? 'PUT' : 'POST';

        const response = await fetchWithAuth(url, {
            method: method,
            body: formData
            // No pongas 'Content-Type', fetch lo pondrá automáticamente
        });

        if (!response.ok) {
            let errorMessage = 'Error al guardar';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch(e) {
                errorMessage = await response.text() || errorMessage;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        Swal.fire('Éxito', idProducto ? 'Equipo actualizado correctamente.' : 'Equipo registrado con éxito.', 'success');
        bsModalProducto.hide();
        renderProductos();
    } catch (error) {
        console.error("Error en guardarProducto:", error);
        if (error.message.includes('403')) {
            Swal.fire('Error de permisos', 'No tienes permisos para realizar esta acción. Verifica tu rol.', 'error');
        } else {
            UI.error(error.message);
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Función auxiliar para peticiones con FormData y refresh automático
async function fetchWithAuth(url, options) {
    let token = Auth.getToken();
    if (!token) throw new Error('No autenticado');

    const makeRequest = async (token) => {
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            }
        });
    };

    let response = await makeRequest(token);

    if (response.status === 401) {
        try {
            const newToken = await Auth.refreshAccessToken();
            token = newToken;
            response = await makeRequest(token);
        } catch (refreshError) {
            Auth.logout();
            throw new Error('Sesión expirada. Inicia sesión nuevamente.');
        }
    }

    if (response.status === 403) {
        throw new Error('403: No tienes permisos suficientes');
    }

    return response;
}

async function eliminarProducto(id) {
    const result = await Swal.fire({ title: '¿Eliminar equipo?', text: "Esta acción lo borrará del catálogo permanentemente.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sí, eliminar' });
    if (result.isConfirmed) {
        try {
            await API.Productos.eliminar(id);
            renderProductos();
            Swal.fire('Eliminado', 'Equipo retirado del catálogo.', 'success');
        } catch (error) {
            UI.error(error.message);
        }
    }
}

// ==========================================
// CATEGORÍAS
// ==========================================
async function renderCategorias() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        const categorias = await API.request('/categorias');
        const { search, page, size } = adminState.categorias;
        const filtradas = search ? categorias.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase())) : categorias;
        const paginadas = filtradas.slice(page * size, (page * size) + size);
        const totalPages = Math.ceil(filtradas.length / size) || 1;
        contentDiv.innerHTML = `
            <div class="row g-4">
                <div class="col-lg-4"><div class="card border-0 bg-gradient-primary text-white h-100 shadow-sm"><div class="card-body p-4 p-xl-5"><h4 class="fw-bold mb-4 text-white"><i class="fas fa-folder-plus me-2"></i>Nueva Categoría</h4><form id="formNuevaCategoria" onsubmit="guardarCategoria(event)"><input type="text" id="nombreCategoria" class="form-control border-0 py-3 shadow-sm text-dark fw-bold mb-3" placeholder="Nombre..." required><button type="submit" class="btn btn-light text-primary fw-bold w-100 py-3 shadow-sm">Crear Categoría</button></form></div></div></div>
                <div class="col-lg-8">
                    <div class="card border-0 h-100 shadow-sm">
                        <div class="card-header bg-white pt-4 px-4 border-0 d-flex justify-content-between align-items-center">
                            <h5 class="fw-bold mb-0 text-dark"><i class="fas fa-tags text-primary me-2"></i>Clasificaciones</h5>
                            <div class="input-group input-group-sm" style="max-width: 250px;">
                                <span class="input-group-text bg-light border-0" id="searchIcon_categorias"><i class="fas fa-search text-muted"></i></span>
                                <input type="text" id="searchCategorias" class="form-control bg-light border-0" placeholder="Buscar categoría..." value="${search}" oninput="filtrarSilencioso('categorias', this.value)">
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="bg-light"><tr><th class="ps-4">ID</th><th>Nombre</th><th class="text-end pe-4">Acciones</th></tr></thead>
                                <tbody id="tabla_categorias_body" style="transition: opacity 0.3s ease;">
                                    ${paginadas.length === 0 ? '<tr><td colspan="3" class="text-center py-4 text-muted">No se encontraron.</td></tr>' : paginadas.map(c => generarFilaCategoria(c)).join('')}
                                </tbody>
                            </table></div>
                            <div id="paginacion_categorias_container">${renderPagination(totalPages, page, 'categorias')}</div>
                        </div>
                    </div>
                </div>
            </div>`;
    } catch (error) { contentDiv.innerHTML = `<div class="alert alert-danger m-4">Error: ${error.message}</div>`; }
}

window.filtrarCategorias = function() {
    const input = document.getElementById('searchCategorias');
    if (!input) return;
    const valor = input.value;
    adminState.categorias.search = valor;
    adminState.categorias.page = 0;
    renderCategorias();
};

async function guardarCategoria(event) {
    event.preventDefault();
    const nombre = document.getElementById('nombreCategoria').value;
    try {
        await API.request('/categorias', { method: 'POST', body: JSON.stringify({ nombre }) });
        categoriasCargadas = false;
        renderCategorias();
        Swal.fire({ icon: 'success', title: 'Agregada', text: 'Clasificación guardada con éxito.', toast: true, position: 'top-end', timer: 3000 });
    } catch (error) {
        UI.error(error.message);
    }
}

function editarCategoria(id, nombre) {
    document.getElementById('categoriaId').value = id;
    document.getElementById('categoriaNombre').value = nombre;
    bsModalCategoria.show();
}

async function guardarCategoriaEdicion(event) {
    event.preventDefault();
    const id = document.getElementById('categoriaId').value;
    const nombre = document.getElementById('categoriaNombre').value;
    try {
        await API.request(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) });
        bsModalCategoria.hide();
        renderCategorias();
        Swal.fire({ icon: 'success', title: 'Actualizada', text: 'La categoría se modificó correctamente.', toast: true, position: 'top-end', timer: 3000 });
    } catch (error) {
        UI.error(error.message);
    }
}

async function eliminarCategoria(id) {
    const result = await Swal.fire({ title: '¿Borrar categoría?', text: "Los equipos dentro de esta categoría quedarán huérfanos.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sí, borrar' });
    if (result.isConfirmed) {
        try {
            await API.request(`/categorias/${id}`, { method: 'DELETE' });
            renderCategorias();
            Swal.fire('Eliminada', 'La categoría ha sido removida.', 'success');
        } catch (error) {
            UI.error(error.message);
        }
    }
}

// ==========================================
// PEDIDOS
// ==========================================
async function renderPedidos() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        const { page, size, search, estado } = adminState.pedidos;
        const response = await API.request(`/api/pedidos/paginado?page=${page}&size=${size}&search=${encodeURIComponent(search)}&estado=${estado}`);
        const archivados = obtenerArchivados();
        const pedidos = (response.content || []).filter(p => !archivados.includes(p.idPedido));
        const totalPages = response.totalPages || 1;
        contentDiv.innerHTML = `
            <div class="card border-0 shadow-sm rounded-4">
                <div class="card-header bg-white pt-4 px-4 border-0">
                    <div class="row align-items-center mb-3"><div class="col-md-6"><h5 class="fw-bold mb-0 text-dark"><i class="fas fa-file-invoice-dollar text-success me-2"></i>Historial de Transacciones</h5></div><div class="col-md-6 text-md-end"><button class="btn btn-outline-success btn-sm" onclick="abrirModalFiltrosExcel()"><i class="fas fa-file-excel me-1"></i> Exportar</button></div></div>
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex gap-2 flex-wrap">
                                <select id="filterEstadoPedidos" class="form-select form-select-sm bg-light border-0 w-auto" onchange="aplicarFiltro('pedidos')">
                                    <option value="" ${adminState.pedidos.estado === '' ? 'selected' : ''}>Todos</option>
                                    <option value="Pendiente" ${adminState.pedidos.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                                    <option value="En Proceso" ${adminState.pedidos.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                                    <option value="Completado" ${adminState.pedidos.estado === 'Completado' ? 'selected' : ''}>Completado</option>
                                    <option value="Cancelado" ${adminState.pedidos.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                                </select>
                                <div class="input-group" style="max-width: 280px;">
                                    <span class="input-group-text bg-light border-0" id="searchIcon_pedidos"><i class="fas fa-search text-muted"></i></span>
                                    <input type="text" id="searchPedidos" class="form-control form-control-sm bg-light border-0" placeholder="Buscar ID o Cliente..." value="${search}" oninput="filtrarSilencioso('pedidos', this.value)">
                                </div>
                                <button class="btn btn-outline-secondary btn-sm" onclick="mostrarArchivados()"><i class="fas fa-archive me-1"></i> Archivados</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0 mt-3">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0"><thead class="bg-light"><tr><th class="ps-4">Factura</th><th>Comprador</th><th>Fecha</th><th>Monto Total</th><th>Estado Actual</th><th class="text-end pe-4">Acciones</th></tr></thead>
                            <tbody id="tabla_pedidos_body" style="transition: opacity 0.3s ease;">
                                ${pedidos.length === 0 ? '<tr><td colspan="6" class="text-center py-4 text-muted">No se encontraron pedidos.</td></tr>' : pedidos.map(p => generarFilaPedido(p)).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div id="paginacion_pedidos_container">${renderPagination(totalPages, page, 'pedidos')}</div>
                </div>
            </div>`;
    } catch (error) { contentDiv.innerHTML = `<div class="alert alert-danger m-4">Error: ${error.message}</div>`; }
}

// ==========================================
// VER PRODUCTOS DE UN PEDIDO (ADMIN)
// ==========================================
window.verProductosPedido = async function(idPedido) {
    try {
        Swal.fire({
            title: 'Cargando detalles...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const pedido = await API.request(`/api/pedidos/${idPedido}`);

        if (!pedido.detalles || pedido.detalles.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Sin productos',
                text: 'Este pedido no tiene productos asociados.',
                confirmButtonColor: '#0d6efd'
            });
            return;
        }

        let detallesHtml = '';
        pedido.detalles.forEach(d => {
            let miniaturasHtml = '';
            if (d.imagenesUrls && d.imagenesUrls.length > 0) {
                miniaturasHtml = d.imagenesUrls.map(url => 
                    `<img src="${url}" class="rounded border shadow-sm mt-2 me-1" 
                          style="width: 40px; height: 40px; object-fit: cover; cursor: pointer; transition: transform 0.2s;" 
                          onmouseover="this.style.transform='scale(1.1)'" 
                          onmouseout="this.style.transform='scale(1)'"
                          onclick="window.open('${url}', '_blank')" 
                          title="Ver imagen completa">`
                ).join('');
            }

            const imagenPrincipal = (d.imagenesUrls && d.imagenesUrls.length > 0) 
                ? `<img src="${d.imagenesUrls[0]}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px;" class="shadow-sm border">`
                : `<div style="width: 70px; height: 70px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #adb5bd;" class="border shadow-sm"><i class="fas fa-image fs-4"></i></div>`;

            const subtotal = (d.cantidad || 0) * d.precioUnitario;

            detallesHtml += `
                <div class="d-flex justify-content-between align-items-start border-bottom py-3 last-border-0">
                    <div class="d-flex gap-3 w-75">
                        ${imagenPrincipal}
                        <div>
                            <h6 class="fw-bold mb-1 text-dark text-start" style="line-height: 1.2;">${d.nombreProducto}</h6>
                            <div class="text-muted small text-start mb-1"><i class="fas fa-snowflake text-info me-1"></i>${d.capacidadBtu || 0} BTU</div>
                            <div class="d-flex flex-wrap">${miniaturasHtml}</div>
                        </div>
                    </div>
                    <div class="text-end w-25">
                        <div class="text-muted small mb-1">${d.cantidad} x $${d.precioUnitario.toFixed(2)}</div>
                        <div class="fw-bold text-primary fs-5">$${subtotal.toFixed(2)}</div>
                    </div>
                </div>
            `;
        });

        const avatarCliente = pedido.fotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(pedido.nombreCliente || 'Cliente')}&background=0d6efd&color=fff&bold=true`;
        const telefono = pedido.telefono || '';
        const numeroWhatsApp = telefono.replace(/[\s\-\(\)]/g, '');
        const btnWhatsApp = telefono ? `<a href="https://wa.me/503${numeroWhatsApp}?text=Hola%20${encodeURIComponent(pedido.nombreCliente)}%2C%20soy%20de%20Servi%20A%2FC%20Pro.%20He%20recibido%20tu%20pedido%20%23${pedido.idPedido}%20y%20necesito%20confirmar%20la%20direcci%C3%B3n%20y%20fecha%20de%20instalaci%C3%B3n." target="_blank" class="btn btn-success btn-sm fw-bold rounded-pill"><i class="fab fa-whatsapp me-1"></i> Contactar</a>` : '';

        const html = `
            <div class="text-start font-sans">
                <div class="bg-light p-3 rounded-4 mb-4 border shadow-sm d-flex flex-column gap-2">
                    <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-1">
                        <div class="d-flex align-items-center gap-3">
                            <img src="${avatarCliente}" class="rounded-circle border shadow-sm" style="width: 45px; height: 45px; object-fit: cover;">
                            <div>
                                <small class="text-muted text-uppercase fw-bold d-block" style="font-size: 0.65rem;">Comprador</small>
                                <span class="fw-bold text-dark fs-6">${pedido.nombreCliente || 'No registrado'}</span>
                                ${telefono ? `<div class="text-muted small"><i class="fas fa-phone text-success me-1"></i> ${telefono}</div>` : ''}
                            </div>
                        </div>
                        <div class="text-end">
                            ${btnWhatsApp}
                            ${pedido.direccion ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.direccion)}" target="_blank" class="btn btn-outline-primary btn-sm fw-bold rounded-pill ms-2"><i class="fas fa-map-marked-alt me-1"></i> Ver en mapa</a>` : ''}
                            <div>
                                <small class="text-muted text-uppercase fw-bold d-block" style="font-size: 0.65rem;">Fecha de Compra</small>
                                <span class="text-dark fw-semibold"><i class="far fa-calendar-alt text-primary me-1"></i> ${new Date(pedido.fechaPedido).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <small class="text-muted text-uppercase fw-bold d-block" style="font-size: 0.65rem;">Dirección de Instalación / Envío</small>
                        <span class="text-dark small"><i class="fas fa-map-marker-alt text-danger me-1"></i> ${pedido.direccion || 'Sin dirección registrada'}</span>
                    </div>
                    <div class="mt-2">
                        <span class="badge ${pedido.incluyeInstalacion ? 'bg-success' : 'bg-secondary'} bg-opacity-10 text-${pedido.incluyeInstalacion ? 'success' : 'secondary'} border border-${pedido.incluyeInstalacion ? 'success' : 'secondary'} border-opacity-25 px-2 py-1">
                            <i class="fas ${pedido.incluyeInstalacion ? 'fa-tools' : 'fa-box'} me-1"></i> ${pedido.incluyeInstalacion ? 'Requiere Instalación Técnica' : 'Solo Entrega de Equipo'}
                        </span>
                    </div>
                </div>

                <h6 class="fw-bold text-dark mb-2 ms-1"><i class="fas fa-boxes text-secondary me-2"></i>Artículos Adquiridos</h6>
                <div class="border rounded-4 px-3 bg-white mb-3 shadow-sm" style="max-height: 380px; overflow-y: auto;">
                    ${detallesHtml}
                </div>

                <div class="d-flex justify-content-between align-items-center bg-gradient-primary text-white p-3 rounded-4 shadow">
                    <span class="fw-bold text-uppercase" style="letter-spacing: 1px;">Total Pagado</span>
                    <span class="fw-bold fs-2">$${pedido.total.toFixed(2)}</span>
                </div>
            </div>
        `;

        Swal.fire({
            title: `<div class="d-flex align-items-center gap-2"><i class="fas fa-file-invoice-dollar text-primary"></i> <span class="fw-bold text-dark">Detalle de Orden #${pedido.idPedido}</span></div>`,
            html: html,
            showConfirmButton: true,
            confirmButtonText: '<i class="fas fa-check me-2"></i>Entendido',
            confirmButtonColor: '#0d6efd',
            width: 750,
            customClass: {
                popup: 'rounded-4 shadow-lg',
                title: 'border-bottom pb-3 mb-0 text-start',
                htmlContainer: 'mt-3'
            }
        });

    } catch (error) {
        console.error('Error al cargar productos del pedido:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: 'No se pudieron cargar los detalles del pedido.',
            confirmButtonColor: '#dc3545'
        });
    }
};

window.cambiarEstadoPedido = async function(id, nuevoEstado) {
    try {
        await API.Pedidos.cambiarEstado(id, nuevoEstado);
        Swal.fire({
            icon: 'success',
            title: 'Estado actualizado',
            text: `Pedido #${id} → "${nuevoEstado}"`,
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false
        });
        renderPedidos();
    } catch (error) {
        UI.error(error.message);
    }
};


// ==========================================
// EXPORTAR EXCEL
// ==========================================
function abrirModalFiltrosExcel() {
    document.getElementById('formFiltrosExcel').reset();
    const modal = new bootstrap.Modal(document.getElementById('modalFiltrosExcel'));
    modal.show();
}

async function exportarPedidosConFiltros() {
    const fechaInicio = document.getElementById('filtroFechaInicio').value;
    const fechaFin = document.getElementById('filtroFechaFin').value;
    const estado = document.getElementById('filtroEstado').value;
    const idCliente = document.getElementById('filtroIdCliente').value;
    const emailCliente = document.getElementById('filtroEmailCliente').value.trim();

    let url = `${API_BASE_URL}/api/pedidos/exportar/excel?`;
    const params = [];
    if (fechaInicio) params.push(`fechaInicio=${encodeURIComponent(fechaInicio)}`);
    if (fechaFin) params.push(`fechaFin=${encodeURIComponent(fechaFin)}`);
    if (estado) params.push(`estado=${encodeURIComponent(estado)}`);
    if (idCliente) params.push(`idCliente=${encodeURIComponent(idCliente)}`);
    if (emailCliente) params.push(`emailCliente=${encodeURIComponent(emailCliente)}`);
    url += params.join('&');

    try {
        Swal.fire({
            title: 'Generando reporte...',
            text: 'Por favor espera.',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
        const token = Auth.getToken();
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Error al generar el reporte');
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'Reporte_Pedidos_Filtrado.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        Swal.close();
        Swal.fire({
            icon: 'success',
            title: 'Reporte generado',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false
        });
        bootstrap.Modal.getInstance(document.getElementById('modalFiltrosExcel')).hide();
    } catch (error) {
        Swal.close();
        UI.error(error.message);
    }
}

// ==========================================
// USUARIOS
// ==========================================
async function renderUsuarios() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        const { page, size, search, rol } = adminState.usuarios;
        const response = await API.request(`/usuarios/paginado?page=${page}&size=${size}&search=${encodeURIComponent(search)}&rol=${rol}`);
        usuariosCache = response.content || [];
        const totalPages = response.totalPages || 1;
        contentDiv.innerHTML = `
            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div class="card-header bg-white pt-4 px-4 border-0">
                    <div class="row align-items-center g-3">
                        <div class="col-md-4"><h5 class="fw-bold mb-0 text-dark"><i class="fas fa-users-cog text-primary me-2"></i>Directorio de Accesos</h5></div>
                        <div class="col-md-8">
                            <div class="d-flex gap-2 justify-content-md-end flex-wrap">
                                <select id="filterRolUsuarios" class="form-select bg-light border-0 w-auto" onchange="aplicarFiltro('usuarios')">
                                    <option value="" ${rol === '' ? 'selected' : ''}>Todos</option><option value="ADMIN" ${rol === 'ADMIN' ? 'selected' : ''}>Admins</option><option value="TECNICO" ${rol === 'TECNICO' ? 'selected' : ''}>Técnicos</option><option value="CLIENTE" ${rol === 'CLIENTE' ? 'selected' : ''}>Clientes</option>
                                </select>
                                <div class="input-group w-50">
                                    <span class="input-group-text bg-light border-0" id="searchIcon_usuarios"><i class="fas fa-search text-muted"></i></span>
                                    <input type="text" id="searchUsuarios" class="form-control bg-light border-0" placeholder="Buscar..." value="${search}" oninput="filtrarSilencioso('usuarios', this.value)">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0 mt-3">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0"><thead class="bg-light"><tr><th class="ps-4">Perfil</th><th>Contacto</th><th>Permisos</th><th>Estado</th><th class="text-end pe-4">Acción</th></tr></thead>
                            <tbody id="tabla_usuarios_body" style="transition: opacity 0.3s ease;">
                                ${usuariosCache.length === 0 ? '<tr><td colspan="5" class="text-center py-4 text-muted">No se encontraron usuarios.</td></tr>' : usuariosCache.map(u => generarFilaUsuario(u)).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div id="paginacion_usuarios_container">${renderPagination(totalPages, page, 'usuarios')}</div>
                </div>
            </div>`;
    } catch (error) { contentDiv.innerHTML = `<div class="alert alert-danger m-4">Error: ${error.message}</div>`; }
}

window.cambiarRolUsuario = async function(idUsuario, nuevoRol) {
    // 1. Buscar el usuario en la caché
    const usuario = usuariosCache.find(u => u.idUsuario === idUsuario);
    if (!usuario) {
        Swal.fire('Error', 'Usuario no encontrado.', 'error');
        return;
    }

    // 2. Validar que no se esté cambiando a sí mismo
    const user = Auth.getUser();
    if (user && user.idUsuario === idUsuario) {
        Swal.fire({
            icon: 'warning',
            title: 'Acción no permitida',
            text: 'No puedes cambiar tu propio rol.',
            confirmButtonColor: '#d33'
        });
        renderUsuarios();
        return;
    }

    // 3. Confirmar el cambio
    const confirmado = await UI.confirmar('Cambiar rol', `¿Estás seguro de cambiar el rol de "${usuario.nombre || usuario.nombres || 'Usuario'}" de "${usuario.rol}" a "${nuevoRol}"?`, 'Sí, cambiar', '#0d6efd');

    if (!confirmado) {
        renderUsuarios(); // Resetear el select
        return;
    }

    try {
        // 4. Construir el payload
        const payload = {
            nombre: usuario.nombre || usuario.nombres || '',
            apellido: usuario.apellido || '',
            email: usuario.email,
            dui: usuario.dui || '',
            telefono: usuario.telefono || '',
            direccion: usuario.direccion || '',
            rol: nuevoRol,
            activo: usuario.activo,
            password: null
        };

        await API.Usuarios.actualizar(idUsuario, payload);

        Swal.fire({
            icon: 'success',
            title: 'Rol actualizado',
            text: `El usuario ahora es "${nuevoRol}".`,
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false
        });
        renderUsuarios();
    } catch (error) {
        UI.error(error.message);
        renderUsuarios();
    }
};

window.toggleUsuarioEstado = async (id, nuevoEstado) => {
    const action = nuevoEstado ? 'Reactivar' : 'Suspender';
    const result = await Swal.fire({ title: `¿${action} usuario?`, text: `El acceso al sistema cambiará.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, proceder', confirmButtonColor: nuevoEstado ? '#198754' : '#dc3545' });
    if (result.isConfirmed) {
        try {
            await API.Usuarios.cambiarEstado(id, nuevoEstado);
            renderUsuarios();
            Swal.fire({ icon: 'success', title: 'Actualizado', text: `Usuario ${action.toLowerCase()}do con éxito.`, toast: true, position: 'top-end', timer: 2000 });
        } catch (error) {
            UI.error(error.message);
        }
    }
};

// ==========================================
// SOLICITUDES
// ==========================================
async function renderSolicitudes() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        const todos = await API.Usuarios.listar();
        tecnicosGlobal = todos.filter(u => u.rol === 'TECNICO' && u.activo); // Cachear técnicos
        let solicitudes = await API.Solicitudes.listarPendientes();
        const { page, size, search, estado } = adminState.solicitudes;
        if (search) solicitudes = solicitudes.filter(s => s.nombreCliente.toLowerCase().includes(search.toLowerCase()));
        if (estado) solicitudes = solicitudes.filter(s => s.estado === estado);
        const paginadas = solicitudes.slice(page * size, (page * size) + size);
        const totalPages = Math.ceil(solicitudes.length / size) || 1;
        contentDiv.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 class="fw-bold mb-0 text-dark"><i class="fas fa-hard-hat text-warning me-2"></i>Centro de Asignación de Tareas</h5>
                </div>
                <div class="card-body">
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label fw-bold small text-secondary">Buscar cliente</label>
                            <div class="input-group input-group-sm">
                                <span class="input-group-text bg-light border-0" id="searchIcon_solicitudes"><i class="fas fa-search text-muted"></i></span>
                                <input type="text" class="form-control bg-light border-0" id="filtroSolCliente" placeholder="Nombre..." value="${search}" oninput="filtrarSilencioso('solicitudes', this.value)">
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label fw-bold small text-secondary">Estado</label>
                            <select class="form-select form-select-sm bg-light" id="filtroSolEstado" onchange="aplicarFiltro('solicitudes')"><option value="">Todos</option><option value="PENDIENTE" ${estado === 'PENDIENTE' ? 'selected' : ''}>Pendiente</option></select>
                        </div>
                    </div>
                    <div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="bg-light"><tr><th class="ps-4">Ticket / Cliente</th><th>Labor Requerida</th><th style="min-width: 320px;">Despacho de Técnico</th><th class="text-end pe-4" style="width: 130px;">Decisión</th></tr></thead>
                        <tbody id="tabla_solicitudes_body" style="transition: opacity 0.3s ease;">
                            ${paginadas.length === 0 ? '<tr><td colspan="4" class="text-center py-4 text-muted">No hay solicitudes.</td></tr>' : paginadas.map(s => generarFilaSolicitud(s)).join('')}
                        </tbody>
                    </table></div>
                    <div id="paginacion_solicitudes_container">${renderPagination(totalPages, page, 'solicitudes')}</div>
                </div>
            </div>`;
    } catch (error) { contentDiv.innerHTML = `<div class="alert alert-danger shadow-sm m-3">Error: ${error.message}</div>`; }
}

// Función auxiliar para limpiar filtros de solicitudes
function limpiarFiltrosSolicitudes() {
    document.getElementById('filtroSolCliente').value = '';
    document.getElementById('filtroSolEstado').value = '';
    document.getElementById('filtroSolFechaInicio').value = '';
    document.getElementById('filtroSolFechaFin').value = '';
    adminState.solicitudes.search = '';
    adminState.solicitudes.estado = '';
    adminState.solicitudes.page = 0;
    renderSolicitudes();
}

window.asignarTecnico = async function(idSolicitud) {
    const idTecnico = document.getElementById(`tecnicoSelect_${idSolicitud}`).value;
    const fechaInicio = document.getElementById(`fechaInicio_${idSolicitud}`).value;
    const fechaFin = document.getElementById(`fechaFin_${idSolicitud}`).value;
    if (!idTecnico || !fechaInicio || !fechaFin) {
        Swal.fire('Datos Incompletos', 'Selecciona técnico y ambos rangos de hora.', 'warning');
        return;
    }
    try {
        await API.request(`/api/solicitudes/${idSolicitud}/asignar`, { method: 'POST', body: JSON.stringify({ idTecnico, fechaInicio, fechaFin }) });
        Swal.fire('¡Misión Asignada!', 'El técnico ha recibido la programación.', 'success');
        renderSolicitudes();
        actualizarContadoresAdmin();
    } catch (error) {
        UI.error(error.message);
    }
};

window.rechazarSolicitud = async function(idSolicitud) {
    const confirm = await Swal.fire({ title: '¿Archivar solicitud?', text: 'El ticket se cerrará sin asignar técnico.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sí, descartar' });
    if (confirm.isConfirmed) {
        await API.request(`/api/solicitudes/${idSolicitud}/rechazar`, { method: 'POST' });
        Swal.fire('Descartada', 'La solicitud se removió de la cola.', 'info');
        renderSolicitudes();
        actualizarContadoresAdmin();
    }
};

// ==========================================
// CONTADORES ADMIN
// ==========================================
async function actualizarContadoresAdmin() {
    try {
        const pedidosPendientes = await API.request('/api/pedidos/conteos/pendientes/admin');
        const badgePedidos = document.getElementById('badgePedidosAdmin');
        if (pedidosPendientes > 0) {
            badgePedidos.textContent = pedidosPendientes;
            badgePedidos.style.display = 'inline-block';
        } else badgePedidos.style.display = 'none';
        
        const solicitudesPendientes = await API.request('/api/solicitudes/conteos/pendientes');
        const badgeSolicitudes = document.getElementById('badgeSolicitudesAdmin');
        if (solicitudesPendientes > 0) {
            badgeSolicitudes.textContent = solicitudesPendientes;
            badgeSolicitudes.style.display = 'inline-block';
        } else badgeSolicitudes.style.display = 'none';
    } catch (error) {
        console.error('Error al cargar contadores admin:', error);
    }
}

// ==========================================
// REPORTES Y EVIDENCIAS
// ==========================================
let listaCitasGlobal = [];

window.mostrarArchivadosReportes = async function() {
    const archivados = obtenerReportesArchivados();
    if (archivados.length === 0) {
        Swal.fire({ icon: 'info', title: 'Sin archivados', text: 'No hay reportes archivados.', confirmButtonColor: '#0d6efd' });
        return;
    }

    try {
        const todas = await API.Citas.listar();
        const citasArchivadas = todas.filter(c => archivados.includes(c.idCita));

        if (citasArchivadas.length === 0) {
            Swal.fire('Sin resultados', 'Los IDs archivados no coinciden con ninguna cita actual.', 'info');
            return;
        }

        citasArchivadas.sort((a, b) => a.idCita - b.idCita);

        let tableRows = '';
        citasArchivadas.forEach(c => {
            const badgeClass = c.estado === 'COMPLETADA' ? 'bg-success' : 'bg-danger';
            tableRows += `
                <tr>
                    <td class="ps-4 fw-bold text-primary">#${c.idCita}</td>
                    <td><span class="fw-bold text-dark">${c.nombreCliente}</span></td>
                    <td>${c.nombreTecnico || 'N/A'}</td>
                    <td>${formatearFecha(c.fechaInicio)}</td>
                    <td><span class="badge ${badgeClass}">${c.estado}</span></td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-outline-primary rounded-circle" onclick="desarchivarReporte(${c.idCita})" title="Restaurar">
                            <i class="fas fa-undo"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        Swal.fire({
            title: '📦 Reportes Archivados',
            html: `
                <div style="max-height: 400px; overflow-y: auto;">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="bg-light">
                            <tr><th class="ps-4">Ticket</th><th>Cliente</th><th>Técnico</th><th>Fecha</th><th>Estado</th><th class="text-end pe-4">Acción</th></tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
                <small class="text-muted d-block mt-2">Total: ${citasArchivadas.length} reportes archivados.</small>
            `,
            icon: 'info',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#0d6efd',
            width: 900,
        });
    } catch (error) {
        Swal.fire('Error', 'No se pudieron cargar los reportes archivados.', 'error');
    }
};

// ===== DESARCHIVAR UN REPORTE =====
window.desarchivarReporte = function(id) {
    // 1. Quitar de localStorage
    let archivados = obtenerReportesArchivados();
    archivados = archivados.filter(pid => pid !== id);
    localStorage.setItem('reportes_archivados', JSON.stringify(archivados));
    console.log('🔄 Desarchivar ID:', id);
    console.log('🔄 Archivados actuales:', obtenerReportesArchivados());

    // 2. REINICIAR PAGINACIÓN
    adminState.reportes.page = 0;

    // 3. CERRAR MODAL Y RECARGAR
    Swal.close();
    renderReportes();

    // 4. Si el modal de archivados estaba abierto, actualizarlo
    setTimeout(() => {
        mostrarArchivadosReportes();
    }, 300);

    Swal.fire({
        icon: 'success',
        title: 'Reporte restaurado',
        text: `El reporte #${id} ya no está archivado.`,
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false
    });
};

// ===== DESARCHIVAR TODOS LOS REPORTES =====
window.desarchivarTodosReportes = async function() {
    const archivados = obtenerReportesArchivados();
    if (archivados.length === 0) {
        Swal.fire({ icon: 'info', title: 'Sin archivados', text: 'No hay reportes archivados.' });
        return;
    }

    const confirm = await Swal.fire({
        title: `Restaurar ${archivados.length} reportes`,
        text: 'Todos los reportes archivados volverán a aparecer en la lista principal.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        confirmButtonText: 'Sí, restaurar todos',
        cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
        localStorage.setItem('reportes_archivados', JSON.stringify([]));
        console.log('🔄 Restaurar todos los reportes');
        adminState.reportes.page = 0;
        renderReportes();

        Swal.fire({
            icon: 'success',
            title: '¡Restaurados!',
            text: `${archivados.length} reportes restaurados.`,
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false
        });
    }
};

// ===== ARCHIVAR UN REPORTE (desde la tabla) =====
window.archivarReporte = async function(id) {
    const confirm = await Swal.fire({
        title: '¿Archivar reporte?',
        text: 'El reporte desaparecerá de la lista principal pero seguirá existiendo en el sistema.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#6c757d',
        confirmButtonText: 'Sí, archivar',
        cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
        // 1. Obtener la lista actual, agregar el ID y guardar en localStorage
        let archivados = obtenerReportesArchivados();
        if (!archivados.includes(id)) {
            archivados.push(id);
            localStorage.setItem('reportes_archivados', JSON.stringify(archivados));
        }

        // 2. Reiniciar paginación a la página 1
        adminState.reportes.page = 0;

        Swal.fire({
            icon: 'success',
            title: 'Reporte archivado',
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false
        });

        // 3. Forzar el recargado de la tabla DESPUÉS de guardar
        setTimeout(() => {
            renderReportes();
        }, 100); 
    }
};

async function renderReportes() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        let citas = await API.Citas.listar();
        listaCitasGlobal = citas; 
        const { page, size, search, estado } = adminState.reportes;
        if (search) citas = citas.filter(c => c.nombreCliente.toLowerCase().includes(search.toLowerCase()));
        if (estado) citas = citas.filter(c => c.estado === estado);
        const archivados = obtenerReportesArchivados();
        citas = citas.filter(c => !archivados.includes(Number(c.idCita)));
        const paginadas = citas.slice(page * size, (page * size) + size);
        const totalPages = Math.ceil(citas.length / size) || 1;
        contentDiv.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 class="fw-bold mb-0 text-dark"><i class="fas fa-clipboard-list text-primary me-2"></i>Historial de Trabajos</h5>
                    <button class="btn btn-outline-secondary btn-sm" onclick="mostrarArchivadosReportes()"><i class="fas fa-archive me-1"></i> Archivados</button>
                </div>
                <div class="card-body">
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-2">
                            <label class="form-label fw-bold small text-secondary text-uppercase">Estado</label>
                            <select class="form-select form-select-sm bg-light" id="filtroRepEstado" onchange="aplicarFiltro('reportes')"><option value="">Todos</option><option value="PROGRAMADA" ${estado === 'PROGRAMADA' ? 'selected' : ''}>Programada</option><option value="COMPLETADA" ${estado === 'COMPLETADA' ? 'selected' : ''}>Completada</option></select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label fw-bold small text-secondary text-uppercase">Buscar Cliente</label>
                            <div class="input-group input-group-sm">
                                <span class="input-group-text bg-light border-0" id="searchIcon_reportes"><i class="fas fa-search text-muted"></i></span>
                                <input type="text" class="form-control bg-light border-0" id="filtroRepCliente" placeholder="Nombre..." value="${search}" oninput="filtrarSilencioso('reportes', this.value)">
                            </div>
                        </div>
                    </div>
                    <div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="bg-light"><tr><th class="ps-4">Ticket</th><th>Cliente</th><th>Técnico</th><th>Fecha</th><th>Estado</th><th class="text-end pe-4">Acciones</th></tr></thead>
                        <tbody id="tabla_reportes_body" style="transition: opacity 0.3s ease;">
                            ${paginadas.length === 0 ? '<tr><td colspan="6" class="text-center py-4 text-muted">No hay reportes.</td></tr>' : paginadas.map(c => generarFilaReporte(c)).join('')}
                        </tbody>
                    </table></div>
                    <div id="paginacion_reportes_container">${renderPagination(totalPages, page, 'reportes')}</div>
                </div>
            </div>`;
    } catch (error) { contentDiv.innerHTML = `<div class="alert alert-danger shadow-sm m-4">Error: ${error.message}</div>`; }
}

function limpiarFiltrosReportes() {
    document.getElementById('filtroRepEstado').value = '';
    document.getElementById('filtroRepCliente').value = '';
    document.getElementById('filtroRepTecnico').value = '';
    document.getElementById('filtroRepFechaInicio').value = '';
    document.getElementById('filtroRepFechaFin').value = '';
    adminState.reportes.search = '';
    adminState.reportes.estado = '';
    adminState.reportes.page = 0;
    renderReportes();
}

window.abrirVisorEvidencia = function(idCita) {
    const cita = listaCitasGlobal.find(c => c.idCita === idCita);
    if (!cita) return;
    window.citaActualParaPDF = cita;
    const contenedor = document.getElementById('contenidoEvidencia');
    const fotosAntes = cita.urlsFotosAntes ? cita.urlsFotosAntes.split(',') : [];
    const fotosDespues = cita.urlsFotosDespues ? cita.urlsFotosDespues.split(',') : [];
    let html = `
        <div class="row g-4">
            <div class="col-12"><h6 class="fw-bold text-dark text-uppercase border-bottom pb-2">Diagnóstico del Técnico</h6><div class="bg-white p-3 rounded border shadow-sm text-muted fst-italic"><i class="fas fa-quote-left text-primary opacity-50 me-2"></i>${cita.notas || 'El técnico no dejó observaciones escritas.'}</div></div>`;
    if (fotosAntes.length > 0) {
        html += `<div class="col-md-6"><h6 class="fw-bold text-danger text-center"><i class="fas fa-times-circle me-1"></i> ANTES</h6><div class="d-flex flex-wrap gap-2 justify-content-center">`;
        fotosAntes.forEach(url => html += `<img src="${url}" class="img-thumbnail shadow-sm" style="max-height: 150px; cursor: pointer;" onclick="window.open('${url}', '_blank')">`);
        html += `</div></div>`;
    }
    if (fotosDespues.length > 0) {
        html += `<div class="col-md-6"><h6 class="fw-bold text-success text-center"><i class="fas fa-check-circle me-1"></i> DESPUÉS</h6><div class="d-flex flex-wrap gap-2 justify-content-center">`;
        fotosDespues.forEach(url => html += `<img src="${url}" class="img-thumbnail shadow-sm border-success" style="max-height: 150px; cursor: pointer;" onclick="window.open('${url}', '_blank')">`);
        html += `</div></div>`;
    }
    if (cita.urlFirmaCliente) {
        html += `<div class="col-12 mt-4 text-center"><h6 class="fw-bold text-dark border-bottom pb-2 mb-3">Conformidad del Cliente</h6><div class="d-inline-block bg-white p-3 rounded border shadow-sm"><img src="${cita.urlFirmaCliente}" style="max-height: 120px; filter: contrast(1.2);"><div class="text-muted small mt-2 border-top pt-2">Firma digital de <strong>${cita.nombreCliente}</strong></div></div></div>`;
    }
    html += `</div>`;
    contenedor.innerHTML = html;
    const modal = new bootstrap.Modal(document.getElementById('evidenciaModal'));
    modal.show();
};

window.descargarReportePDF = async function() {
    const cita = window.citaActualParaPDF;
    if (!cita) { Swal.fire('Error', 'No hay datos de reporte seleccionados.', 'error'); return; }
    Swal.fire({ title: 'Generando Documento...', text: 'Por favor espera.', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    const fotosAntes = cita.urlsFotosAntes ? cita.urlsFotosAntes.split(',') : [];
    const fotosDespues = cita.urlsFotosDespues ? cita.urlsFotosDespues.split(',') : [];
    const divTemporal = document.createElement('div');
    divTemporal.style.padding = '40px';
    divTemporal.style.backgroundColor = '#ffffff';
    divTemporal.style.color = '#333333';
    divTemporal.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
    divTemporal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0dcaf0; padding-bottom: 20px; margin-bottom: 30px;">
            <div><h1 style="color: #212529; font-weight: bold; margin: 0; font-size: 28px;">ServiA<span style="color: #0dcaf0;">CPro</span></h1><p style="margin: 5px 0 0; color: #6c757d; font-size: 14px;">Soluciones en Climatización Profesional</p></div>
            <div style="text-align: right;"><h2 style="color: #0dcaf0; font-weight: bold; margin: 0; font-size: 22px;">REPORTE TÉCNICO</h2><p style="margin: 5px 0 0; font-weight: bold; font-size: 16px;">TICKET #${cita.idCita.toString().padStart(5, '0')}</p><p style="margin: 0; color: #6c757d; font-size: 14px;">Fecha: ${new Date(cita.fechaInicio).toLocaleDateString('es-ES')}</p></div>
        </div>
        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
            <div style="flex: 1; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;"><h4 style="margin-top: 0; color: #212529; font-size: 16px; font-weight: bold; border-bottom: 1px solid #dee2e6; padding-bottom: 5px;">Datos del Cliente</h4><p style="margin: 8px 0 4px; font-size: 14px;"><strong>Nombre:</strong> ${cita.nombreCliente}</p><p style="margin: 4px 0; font-size: 14px;"><strong>Dirección:</strong> ${cita.direccionCliente || 'No especificada'}</p></div>
            <div style="flex: 1; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;"><h4 style="margin-top: 0; color: #212529; font-size: 16px; font-weight: bold; border-bottom: 1px solid #dee2e6; padding-bottom: 5px;">Detalles Operativos</h4><p style="margin: 8px 0 4px; font-size: 14px;"><strong>Técnico Asignado:</strong> ${cita.nombreTecnico}</p><p style="margin: 4px 0; font-size: 14px;"><strong>Estado del Servicio:</strong> <span style="color: #198754; font-weight: bold;">${cita.estado}</span></p></div>
        </div>
        <div style="margin-bottom: 30px;"><h4 style="color: #212529; font-size: 16px; font-weight: bold; border-bottom: 2px solid #dee2e6; padding-bottom: 5px; margin-bottom: 15px;">Diagnóstico y Observaciones</h4><div style="padding: 15px; border-left: 4px solid #0dcaf0; background-color: #f8f9fa; font-size: 14px; line-height: 1.5;">${cita.notas ? cita.notas.replace(/\n/g, '<br>') : 'El técnico no reportó observaciones adicionales.'}</div></div>
        ${(fotosAntes.length > 0 || fotosDespues.length > 0) ? `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
            <h4 style="color: #212529; font-size: 16px; font-weight: bold; border-bottom: 2px solid #dee2e6; padding-bottom: 5px; margin-bottom: 15px;">Evidencia Fotográfica</h4>
            <div style="display: flex; gap: 20px;">
                ${fotosAntes.length > 0 ? `<div style="flex: 1; text-align: center;"><div style="background-color: #dc3545; color: white; padding: 5px; font-weight: bold; border-radius: 4px 4px 0 0; font-size: 14px;">ANTES DEL SERVICIO</div><div style="border: 1px solid #dee2e6; border-top: none; padding: 10px; background-color: #ffffff; border-radius: 0 0 4px 4px;"><img src="${fotosAntes[0]}" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px;"></div></div>` : ''}
                ${fotosDespues.length > 0 ? `<div style="flex: 1; text-align: center;"><div style="background-color: #198754; color: white; padding: 5px; font-weight: bold; border-radius: 4px 4px 0 0; font-size: 14px;">DESPUÉS DEL SERVICIO</div><div style="border: 1px solid #dee2e6; border-top: none; padding: 10px; background-color: #ffffff; border-radius: 0 0 4px 4px;"><img src="${fotosDespues[0]}" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px;"></div></div>` : ''}
            </div>
        </div>` : ''}
        <div style="margin-top: 50px; display: flex; justify-content: space-around; page-break-inside: avoid;">
            <div style="text-align: center; width: 40%;"><div style="height: 100px; border-bottom: 1px solid #212529; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 10px;">${cita.urlFirmaCliente ? `<img src="${cita.urlFirmaCliente}" style="max-height: 80px; filter: contrast(1.5);">` : '<span style="color: #adb5bd;">Sin firma</span>'}</div><p style="margin: 10px 0 0; font-weight: bold; font-size: 14px;">Firma de Conformidad</p><p style="margin: 0; font-size: 12px; color: #6c757d;">${cita.nombreCliente}</p></div>
            <div style="text-align: center; width: 40%;"><div style="height: 100px; border-bottom: 1px solid #212529; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 10px;"></div><p style="margin: 10px 0 0; font-weight: bold; font-size: 14px;">Técnico Responsable</p><p style="margin: 0; font-size: 12px; color: #6c757d;">${cita.nombreTecnico}</p></div>
        </div>
        <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #adb5bd; border-top: 1px solid #e9ecef; padding-top: 15px;">Este documento certifica la realización del servicio técnico detallado. Servi A/C Pro garantiza la calidad de la mano de obra. <br> Para dudas o reclamaciones, consérvese este comprobante.</div>
    `;
    const opciones = { margin: 0.3, filename: `Reporte_Tecnico_Ticket_${cita.idCita}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    try {
        await html2pdf().set(opciones).from(divTemporal).save();
        Swal.close();
        Swal.fire({ icon: 'success', title: '¡Documento Generado!', text: 'El reporte profesional se descargó.', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } catch (error) {
        Swal.close();
        Swal.fire('Error', 'No se pudo generar el documento PDF.', 'error');
    }
};

// ==========================================
// INVENTARIO
// ==========================================
let listaInventarioGlobal = [];

async function renderInventario() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        let repuestos = await API.Repuestos.listarActivos();
        listaInventarioGlobal = repuestos;
        const { page, size, search, unidad } = adminState.inventario;
        if (search) repuestos = repuestos.filter(r => r.nombre.toLowerCase().includes(search.toLowerCase()));
        if (unidad) repuestos = repuestos.filter(r => r.unidadMedida === unidad);
        const paginados = repuestos.slice(page * size, (page * size) + size);
        const totalPages = Math.ceil(repuestos.length / size) || 1;

        // Calculamos la inversión inicial para las cards
        const inversionTotal = repuestos.reduce((acc, rep) => acc + (rep.stockActual * rep.costoUnitario), 0);

        contentDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <h5 class="fw-bold mb-0">Existencias Actuales</h5>
                <div class="d-flex gap-2 align-items-center flex-wrap">
                    <div class="input-group input-group-sm shadow-sm rounded-pill overflow-hidden border bg-white" style="max-width: 200px;">
                        <span class="input-group-text bg-white border-0 text-muted ps-3" id="searchIcon_inventario"><i class="fas fa-search"></i></span>
                        <input type="text" id="buscadorInventario" class="form-control border-0 bg-white" placeholder="Buscar material..." value="${search}" oninput="filtrarSilencioso('inventario', this.value)">
                    </div>
                    <select id="filtroUnidadInventario" 
                            class="form-select form-select-sm bg-white border shadow-sm rounded-pill px-3 fw-semibold text-secondary form-select-no-arrow" 
                            style="width: 180px; appearance: menulist-button !important;" 
                            onchange="aplicarFiltro('inventario')">
                        <option value="">Todas las unidades</option>
                        <option value="Unidades" ${unidad === 'Unidades' ? 'selected' : ''}>Unidades (Pzas)</option>
                        <option value="Libras" ${unidad === 'Libras' ? 'selected' : ''}>Libras (lbs)</option>
                        <option value="Metros" ${unidad === 'Metros' ? 'selected' : ''}>Metros (m)</option>
                    </select>
                    <button class="btn btn-primary btn-sm fw-bold rounded-pill px-4 shadow-sm" style="height: 31px;" onclick="abrirModalRepuesto()"><i class="fas fa-plus me-2"></i>Nuevo</button>
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card border-0 shadow-sm bg-primary text-white rounded-4">
                        <div class="card-body p-4">
                            <h6 class="opacity-75 mb-1">Inversión en Almacén (filtrado)</h6>
                            <h2 class="fw-bold mb-0" id="card-inversion-total">$${inversionTotal.toFixed(2)}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 shadow-sm bg-info text-white rounded-4">
                        <div class="card-body p-4">
                            <h6 class="opacity-75 mb-1">Total de materiales</h6>
                            <h2 class="fw-bold mb-0" id="card-materiales-total">${repuestos.length}</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="bg-light"><tr><th class="ps-4">Material</th><th>Unidad</th><th>Costo Unit.</th><th>Stock</th><th class="text-end pe-4">Acciones</th></tr></thead>
                    <tbody id="tabla_inventario_body" style="transition: opacity 0.3s ease;">
                        ${paginados.length === 0 ? '<tr><td colspan="5" class="text-center py-4 text-muted">No hay repuestos.</td></tr>' : paginados.map(r => generarFilaInventario(r)).join('')}
                    </tbody>
                </table></div>
                <div id="paginacion_inventario_container">${renderPagination(totalPages, page, 'inventario')}</div>
            </div>`;
    } catch (error) { contentDiv.innerHTML = `<div class="alert alert-danger m-4">Error: ${error.message}</div>`; }
}

window.filtrarInventario = function() {
    const search = document.getElementById('buscadorInventario').value || '';
    const unidad = document.getElementById('filtroUnidadInventario').value || '';

    adminState.inventario.search = search;
    adminState.inventario.unidad = unidad;
    adminState.inventario.page = 0;

    renderInventario();
};

// ==========================================
// ABRIR MODAL REPUESTO (CREAR O EDITAR) - CORREGIDA
// ==========================================
window.abrirModalRepuesto = function(id = null) {
    const form = document.getElementById('repuestoForm');
    form.reset();
    
    // Asegurar que el campo oculto exista
    let idInput = document.getElementById('repuestoIdActual');
    if (!idInput) {
        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.id = 'repuestoIdActual';
        form.insertAdjacentHTML('afterbegin', '<input type="hidden" id="repuestoIdActual">');
        idInput = document.getElementById('repuestoIdActual');
    }
    
    const title = document.querySelector('#repuestoModal .modal-title');
    
    if (id) {
        // Buscar el repuesto en la lista global
        const rep = listaInventarioGlobal.find(r => r.idRepuesto === id);
        if (rep) {
            idInput.value = rep.idRepuesto;
            document.getElementById('repNombre').value = rep.nombre;
            document.getElementById('repUnidad').value = rep.unidadMedida;
            document.getElementById('repStock').value = rep.stockActual;
            document.getElementById('repCosto').value = rep.costoUnitario;
            title.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Material';
        } else {
            // Si no se encuentra, recargar la lista y reintentar
            (async () => {
                try {
                    const repuestos = await API.Repuestos.listarActivos();
                    listaInventarioGlobal = repuestos;
                    const repFound = repuestos.find(r => r.idRepuesto === id);
                    if (repFound) {
                        idInput.value = repFound.idRepuesto;
                        document.getElementById('repNombre').value = repFound.nombre;
                        document.getElementById('repUnidad').value = repFound.unidadMedida;
                        document.getElementById('repStock').value = repFound.stockActual;
                        document.getElementById('repCosto').value = repFound.costoUnitario;
                        title.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Material';
                    } else {
                        Swal.fire('Error', 'No se encontró el material.', 'error');
                        return;
                    }
                } catch (error) {
                    UI.error(error.message);
                }
            })();
            return;
        }
    } else {
        idInput.value = '';
        title.innerHTML = '<i class="fas fa-tools me-2"></i>Registrar Material';
    }
    
    cambiarStepStock(); // Ajustar step según unidad
    bsModalRepuesto.show();
};

window.editarRepuesto = function(id) {
    abrirModalRepuesto(id);
};

window.eliminarRepuesto = async function(id) {
    const result = await Swal.fire({ title: '¿Eliminar material?', text: "Se borrará del inventario.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sí, eliminar' });
    if (result.isConfirmed) {
        try {
            await API.request(`/api/repuestos/${id}`, { method: 'DELETE' });
            Swal.fire('Eliminado', 'Material retirado.', 'success');
            renderInventario();
        } catch (error) {
            UI.error(error.message);
        }
    }
};

// ==========================================
// GUARDAR REPUESTO (CREAR O ACTUALIZAR) - CORREGIDA
// ==========================================
async function guardarRepuesto(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    
    const idInput = document.getElementById('repuestoIdActual');
    const idRepuesto = idInput ? idInput.value : '';
    
    // Validar que el stock no sea negativo
    const stock = parseFloat(document.getElementById('repStock').value) || 0;
    if (stock < 0) {
        Swal.fire('Error', 'El stock no puede ser negativo.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar en Almacén';
        return;
    }
    
    const payload = {
        nombre: document.getElementById('repNombre').value,
        unidadMedida: document.getElementById('repUnidad').value,
        stockActual: stock,
        costoUnitario: parseFloat(document.getElementById('repCosto').value) || 0
    };
    
    try {
        if (idRepuesto) {
            await API.request(`/api/repuestos/${idRepuesto}`, { 
                method: 'PUT', 
                body: JSON.stringify(payload) 
            });
            Swal.fire({ 
                icon: 'success', 
                title: 'Actualizado', 
                toast: true, 
                position: 'top-end', 
                timer: 3000,
                showConfirmButton: false
            });
        } else {
            await API.Repuestos.crear(payload);
            Swal.fire({ 
                icon: 'success', 
                title: 'Registrado', 
                toast: true, 
                position: 'top-end', 
                timer: 3000,
                showConfirmButton: false
            });
        }
        bsModalRepuesto.hide();
        renderInventario();
    } catch (error) {
        UI.error(error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar en Almacén';
    }
}

// ==========================================
// CAMBIAR STEP DEL STOCK SEGÚN UNIDAD - CORREGIDA
// ==========================================
function cambiarStepStock() {
    const unidad = document.getElementById('repUnidad').value;
    const stockInput = document.getElementById('repStock');
    if (unidad === 'Unidades') {
        stockInput.step = '1';
        stockInput.placeholder = 'Ej. 5';
        stockInput.min = '0';
    } else {
        stockInput.step = 'any';
        stockInput.placeholder = 'Ej. 3.5';
        stockInput.min = '0';
    }
}

// ==========================================
// COTIZADOR
// ==========================================
let itemsCotizacion = [];
let productosCatalogoCotizador = [];

async function renderCotizador() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        const { page, size, search } = adminState.cotizador;
        // Usamos API.request con el endpoint de productos paginado
        const response = await API.request(`/productos/paginado?page=${page}&size=${size}&search=${encodeURIComponent(search)}&categoria=`);
        const productos = response.content || [];
        const totalPages = response.totalPages || 1;
        productosCatalogoCotizador = productos;
        itemsCotizacion = [];

        const currentSearchValue = search;

        contentDiv.innerHTML = `
            <div class="row g-4">
                <div class="col-lg-4">
                    <div class="card border-0 shadow-sm rounded-4 mb-4">
                        <div class="card-header bg-white pt-4 px-4 border-0"><h6 class="fw-bold text-dark mb-0"><i class="fas fa-user-tag text-primary me-2"></i>Datos del Prospecto</h6></div>
                        <div class="card-body p-4">
                            <div class="mb-3"><label class="form-label small fw-bold text-muted">Nombre del Cliente <span class="text-danger">*</span></label><input type="text" id="cotNombreCliente" class="form-control bg-light border-0" placeholder="Obligatorio para el PDF"></div>
                            <div class="mb-3"><label class="form-label small fw-bold text-muted">Validez de la Oferta</label><select id="cotValidez" class="form-select bg-light border-0"><option value="15 Días">15 Días</option><option value="30 Días" selected>30 Días</option></select></div>
                        </div>
                    </div>
                    <div class="card border-0 shadow-sm rounded-4">
                        <div class="card-header bg-white pt-4 px-4 border-0"><h6 class="fw-bold text-dark mb-0"><i class="fas fa-plus-circle text-success me-2"></i>Agregar Conceptos</h6></div>
                        <div class="card-body p-4">
                            <div class="mb-3">
                                <label class="form-label small fw-bold text-primary">1. Buscar producto</label>
                                <input type="text" id="cotSearchProducto" class="form-control form-control-sm bg-light border-0 mb-2" placeholder="Buscar equipo..." value="${currentSearchValue}" oninput="filtrarCotizadorProductos(this.value)">
                            </div>
                            <div class="mb-4">
                                <label class="form-label small fw-bold text-primary">Seleccionar de Catálogo</label>
                                <select id="cotSelectorProducto" class="form-select bg-light border-0 mb-2">
                                    <option value="" selected disabled>Seleccionar equipo...</option>
                                    ${productos.map(p => `<option value="${p.idProducto}" data-precio="${p.precio}">${p.nombre} - $${p.precio.toFixed(2)}</option>`).join('')}
                                </select>
                                <button class="btn btn-sm btn-outline-primary w-100 fw-bold" onclick="agregarItemCotizacion('producto')"><i class="fas fa-cart-plus me-1"></i> Agregar Equipo</button>
                            </div>
                            <hr class="opacity-25">
                            <div class="mb-2">
                                <label class="form-label small fw-bold text-success">2. Concepto Libre (Ej. Mano de obra)</label>
                                <input type="text" id="cotConceptoExtra" class="form-control bg-light border-0 mb-2" placeholder="Descripción...">
                                <div class="input-group input-group-sm mb-2">
                                    <span class="input-group-text bg-light border-0">$</span>
                                    <input type="number" id="cotPrecioExtra" class="form-control bg-light border-0" placeholder="0.00" step="0.01">
                                </div>
                                <button class="btn btn-sm btn-outline-success w-100 fw-bold" onclick="agregarItemCotizacion('extra')"><i class="fas fa-plus me-1"></i> Agregar Concepto</button>
                            </div>
                            ${renderPagination(totalPages, page, 'cotizador')}
                        </div>
                    </div>
                </div>
                <div class="col-lg-8">
                    <div class="card border-0 shadow-sm rounded-4 h-100">
                        <div class="card-header bg-white pt-4 px-4 d-flex justify-content-between align-items-center"><h5 class="fw-bold text-dark mb-0"><i class="fas fa-list-alt text-info me-2"></i>Detalle del Presupuesto</h5><button class="btn btn-danger fw-bold rounded-pill px-4 shadow-sm" onclick="generarPDFCotizacion()"><i class="fas fa-file-pdf me-2"></i>Generar PDF</button></div>
                        <div class="card-body p-0">
                            <div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="bg-light"><tr><th class="ps-4">Descripción</th><th>Cantidad</th><th>P. Unitario</th><th class="text-end">Importe</th><th class="text-end pe-4">Quitar</th></tr></thead><tbody id="tablaCotizacionBody"></tbody></table></div>
                            <div class="p-4 bg-light mt-auto border-top" id="totalesCotizacion"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        actualizarTablaCotizacion();
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger m-4">Error al cargar el cotizador: ${error.message}</div>`;
    }
}

// Función para filtrar productos en el cotizador (tiempo real)
window.filtrarCotizadorProductos = async function(valor) {
    if (debounceTimers['cotizador']) {
        clearTimeout(debounceTimers['cotizador']);
    }
    
    adminState.cotizador.search = valor;
    
    const select = document.getElementById('cotSelectorProducto');
    
    // 1. Dar feedback visual INMEDIATO de que el sistema está trabajando
    if (select) {
        select.innerHTML = `<option value="" selected disabled>Buscando...</option>`;
    }
    
    debounceTimers['cotizador'] = setTimeout(async () => {
        try {
            // Hacemos la petición silenciosa al backend
            const response = await API.request(`/productos/paginado?page=0&size=50&search=${encodeURIComponent(valor)}&categoria=`);
            const productos = response.content || [];
            
            // Actualizamos la variable global
            productosCatalogoCotizador = productos;
            
            // 2. Mostrar el resultado de forma clara
            if (select) {
                if (productos.length === 0) {
                    select.innerHTML = `<option value="" selected disabled>❌ No se encontró "${valor}"</option>`;
                } else {
                    const textoAyuda = valor.trim() === '' 
                        ? 'Seleccionar equipo...' 
                        : `👇 Elija entre ${productos.length} resultados...`;
                        
                    select.innerHTML = `
                        <option value="" selected disabled>${textoAyuda}</option>
                        ${productos.map(p => `<option value="${p.idProducto}" data-precio="${p.precio}">${p.nombre} - $${p.precio.toFixed(2)}</option>`).join('')}
                    `;
                }
                
                // 3. Pequeño efecto visual (destello) para que el ojo del usuario sepa que la lista cambió
                select.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
                select.style.boxShadow = '0 0 0 0.25rem rgba(13, 110, 253, 0.25)';
                select.style.borderColor = '#0d6efd';
                
                setTimeout(() => {
                    select.style.boxShadow = 'none';
                    select.style.borderColor = ''; // Vuelve a la normalidad
                }, 800);
            }
        } catch (error) {
            console.error("Error al buscar productos para cotizar:", error);
            if (select) select.innerHTML = `<option value="" selected disabled>Error de conexión</option>`;
        }
    }, 400);
};
function actualizarTablaCotizacion() {
    const tbody = document.getElementById('tablaCotizacionBody');
    const divTotales = document.getElementById('totalesCotizacion');
    if (!tbody || !divTotales) return;
    let subtotal = 0;
    let htmlFilas = '';
    if (itemsCotizacion.length === 0) {
        htmlFilas = `<tr><td colspan="5" class="text-center text-muted py-4">No hay conceptos agregados a la cotización.</td></tr>`;
    } else {
        htmlFilas = itemsCotizacion.map((item, index) => {
            const importe = item.cantidad * item.precio;
            subtotal += importe;
            return `<tr><td class="ps-4 fw-bold text-dark">${item.descripcion}</td><td><input type="number" class="form-control form-control-sm text-center bg-light border-0" style="width: 60px;" value="${item.cantidad}" min="1" onchange="actualizarCantidadCotizacion(${index}, this.value)"></td><td>$${item.precio.toFixed(2)}</td><td class="text-end fw-bold text-primary">$${importe.toFixed(2)}</td><td class="text-end pe-4"><button class="btn btn-sm btn-light text-danger rounded-circle shadow-sm" onclick="eliminarItemCotizacion(${index})"><i class="fas fa-times"></i></button></td></tr>`;
        }).join('');
    }
    tbody.innerHTML = htmlFilas;
    divTotales.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2"><span class="fw-bold text-muted">Subtotal:</span><span class="fw-bold text-dark fs-5">$${subtotal.toFixed(2)}</span></div>
        <hr class="opacity-25 my-2">
        <div class="d-flex justify-content-between align-items-center"><span class="fw-bold text-dark fs-4">TOTAL:</span><span class="fw-bold text-success fs-2">$${subtotal.toFixed(2)}</span></div>
    `;
}

window.agregarItemCotizacion = function(tipo) {
    if (tipo === 'producto') {
        const select = document.getElementById('cotSelectorProducto');
        const idProd = select.value;
        if (!idProd) { Swal.fire('Atención', 'Selecciona un equipo del catálogo primero.', 'info'); return; }
        const producto = productosCatalogoCotizador.find(p => p.idProducto == idProd);
        itemsCotizacion.push({ descripcion: producto.nombre, cantidad: 1, precio: producto.precio });
        select.value = '';
    } else if (tipo === 'extra') {
        const descInput = document.getElementById('cotConceptoExtra');
        const precioInput = document.getElementById('cotPrecioExtra');
        const desc = descInput.value.trim();
        const precio = parseFloat(precioInput.value);
        if (!desc || isNaN(precio) || precio <= 0) {
            Swal.fire('Error', 'Ingresa una descripción y un precio mayor a cero.', 'warning');
            return;
        }
        itemsCotizacion.push({ descripcion: desc, cantidad: 1, precio: precio });
        descInput.value = '';
        precioInput.value = '';
    }
    actualizarTablaCotizacion();
};

window.eliminarItemCotizacion = function(index) {
    itemsCotizacion.splice(index, 1);
    actualizarTablaCotizacion();
};

window.actualizarCantidadCotizacion = function(index, nuevaCantidad) {
    const cant = parseInt(nuevaCantidad);
    if (cant > 0) itemsCotizacion[index].cantidad = cant;
    actualizarTablaCotizacion();
};

window.generarPDFCotizacion = async function() {
    const inputNombre = document.getElementById('cotNombreCliente');
    const nombreCliente = inputNombre.value.trim();
    if (!nombreCliente) {
        Swal.fire({ icon: 'warning', title: 'Falta el Cliente', text: 'El nombre del prospecto es obligatorio.', confirmButtonColor: '#0d6efd' }).then(() => { inputNombre.focus(); });
        return;
    }
    const validez = document.getElementById('cotValidez').value;
    if (itemsCotizacion.length === 0) {
        Swal.fire('Atención', 'Agrega al menos un concepto.', 'warning');
        return;
    }
    Swal.fire({ title: 'Generando Presupuesto...', text: 'Estructurando documento formal.', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    let totalGlobal = 0;
    let filasItemsHTML = '';
    itemsCotizacion.forEach(item => {
        const importe = item.cantidad * item.precio;
        totalGlobal += importe;
        filasItemsHTML += `<tr style="border-bottom: 1px solid #dee2e6;"><td style="padding: 12px 8px; color: #212529;">${item.descripcion}</td><td style="padding: 12px 8px; text-align: center;">${item.cantidad}</td><td style="padding: 12px 8px; text-align: right;">$${item.precio.toFixed(2)}</td><td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #0d6efd;">$${importe.toFixed(2)}</td></tr>`;
    });
    const divTemporal = document.createElement('div');
    divTemporal.style.padding = '40px';
    divTemporal.style.backgroundColor = '#ffffff';
    divTemporal.style.color = '#333333';
    divTemporal.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
    const fechaHoy = new Date().toLocaleDateString('es-ES');
    const folioCotizacion = 'COT-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    divTemporal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0dcaf0; padding-bottom: 20px; margin-bottom: 30px;">
            <div><h1 style="color: #212529; font-weight: bold; margin: 0; font-size: 28px;">ServiA<span style="color: #0dcaf0;">CPro</span></h1><p style="margin: 5px 0 0; color: #6c757d; font-size: 14px;">Climatización Profesional e Instalaciones</p></div>
            <div style="text-align: right;"><h2 style="color: #212529; font-weight: bold; margin: 0; font-size: 24px; text-transform: uppercase;">Presupuesto</h2><p style="margin: 5px 0 0; font-weight: bold; font-size: 16px; color: #0dcaf0;">Folio: ${folioCotizacion}</p><p style="margin: 0; color: #6c757d; font-size: 14px;">Fecha: ${fechaHoy}</p></div>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e9ecef;">
            <p style="margin: 0 0 5px; font-size: 14px; color: #6c757d;">Preparado exclusivamente para:</p>
            <h3 style="margin: 0 0 10px; color: #212529; font-size: 18px; font-weight: bold;">${nombreCliente}</h3>
            <p style="margin: 0; font-size: 14px; color: #198754; font-weight: bold;"><i class="fas fa-clock"></i> Oferta válida por: ${validez}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
            <thead><tr style="background-color: #212529; color: white;"><th style="padding: 12px 8px; text-align: left; border-radius: 4px 0 0 4px;">Concepto / Descripción</th><th style="padding: 12px 8px; text-align: center;">Cant.</th><th style="padding: 12px 8px; text-align: right;">Precio Unit.</th><th style="padding: 12px 8px; text-align: right; border-radius: 0 4px 4px 0;">Importe Total</th></tr></thead>
            <tbody>${filasItemsHTML}</tbody>
        </table>
        <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
            <div style="width: 300px; background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><span style="font-weight: bold; color: #6c757d;">Subtotal:</span><span style="font-weight: bold; color: #212529;">$${totalGlobal.toFixed(2)}</span></div>
                <div style="border-top: 2px solid #dee2e6; margin: 10px 0;"></div>
                <div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-weight: bold; color: #212529; font-size: 18px;">TOTAL:</span><span style="font-weight: bold; color: #198754; font-size: 22px;">$${totalGlobal.toFixed(2)}</span></div>
            </div>
        </div>
        <div style="text-align: center; font-size: 11px; color: #adb5bd; border-top: 1px solid #e9ecef; padding-top: 15px; margin-top: auto;">
            El presente documento es un presupuesto estimado. Los precios pueden variar si se requieren materiales adicionales durante la instalación que no pudieron ser previstos en la inspección inicial.<br>
            Gracias por confiar en Servi A/C Pro.
        </div>
    `;
    const opciones = { margin: 0.4, filename: `Cotizacion_${nombreCliente.replace(/\s+/g, '_')}_${folioCotizacion}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    try {
        await html2pdf().set(opciones).from(divTemporal).save();
        Swal.close();
        Swal.fire({ icon: 'success', title: '¡Presupuesto Generado!', text: 'El PDF se ha descargado.', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } catch (error) {
        Swal.close();
        Swal.fire('Error', 'No se pudo generar el presupuesto.', 'error');
    }
};

// ==========================================
// LIMPIEZA DE TIMERS
// ==========================================
window.addEventListener('beforeunload', function() {
    Object.keys(debounceTimers).forEach(key => {
        clearTimeout(debounceTimers[key]);
    });
});

// ==========================================
// MEJORA SIDEBAR EN MÓVILES (admin)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Al hacer clic en un enlace del sidebar en móviles, cerrar el offcanvas
    const sidebarLinks = document.querySelectorAll('#sidebarAdmin .nav-link');
    const offcanvasInstance = bootstrap.Offcanvas.getInstance(document.getElementById('sidebarAdmin'));
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth < 992 && offcanvasInstance) {
                offcanvasInstance.hide();
            }
        });
    });
});