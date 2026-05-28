// js/admin.js

const API_BASE_URL = window.API_BASE_URL || 'https://servi-a-c-pro.onrender.com';
const contentDiv = document.getElementById('dynamicContent');
let bsModal = null;
let categoriasCargadas = false;

const formatearFecha = (fechaString) => {
    const opciones = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-ES', opciones);
};

document.addEventListener('DOMContentLoaded', () => {
    bsModal = new bootstrap.Modal(document.getElementById('productoModal'));
    document.getElementById('productoForm').addEventListener('submit', guardarProducto);
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

function loadPage(page) {
    const titles = {
        dashboard: ['Dashboard', 'Visión general de métricas en tiempo real'],
        productos: ['Gestión de Productos', 'Administra el inventario, precios y detalles'],
        pedidos: ['Control de Pedidos', 'Seguimiento financiero y estados de venta'],
        categorias: ['Clasificación', 'Organiza el catálogo de productos'],
        usuarios: ['Directorio de Usuarios', 'Administración de accesos y roles'],
        solicitudes: ['Centro de Operaciones', 'Visitas técnicas y asignaciones']
    };
    document.getElementById('sectionTitle').textContent = titles[page][0];
    document.getElementById('sectionSubtitle').textContent = titles[page][1];

    if(page === 'dashboard') renderDashboard();
    if(page === 'productos') renderProductos();
    if(page === 'pedidos') renderPedidos();
    if(page === 'categorias') renderCategorias();
    if(page === 'usuarios') renderUsuarios();
    if(page === 'solicitudes') renderSolicitudes();
}

// ========== DASHBOARD ==========
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

// ========== PRODUCTOS ==========
async function renderProductos() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        const productosData = await API.Productos.listarActivos();
        contentDiv.innerHTML = `
            <div class="card border-0">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 class="fw-bold mb-0 text-dark"><i class="fas fa-box text-primary me-2"></i>Inventario de Equipos</h5>
                    <button class="btn btn-primary fw-bold shadow-sm" onclick="openProductoModal()"><i class="fas fa-plus me-2"></i>Nuevo Equipo</button>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="bg-light"><tr><th class="ps-4">Equipo y Detalles</th><th>Categoría</th><th>Precio Base</th><th>Disponibilidad</th><th class="text-end pe-4">Acciones</th></tr></thead>
                            <tbody>
                                ${productosData.map(p => `
                                    <tr>
                                        <td class="ps-4">
                                            <div class="d-flex align-items-center">
                                                <div class="avatar-circle bg-light text-primary border me-3"><i class="fas fa-fan"></i></div>
                                                <div><h6 class="mb-0 fw-bold text-dark">${p.nombre}</h6><small class="text-muted fw-semibold">ID: #${p.idProducto} | ${p.capacidadBTU} BTU</small></div>
                                            </div>
                                        </td>
                                        <td><span class="badge bg-secondary bg-opacity-10 text-secondary border px-3 py-2">${p.nombreCategoria}</span></td>
                                        <td class="fw-bold text-dark fs-5">$${p.precio.toFixed(2)}</td>
                                        <td><span class="badge ${p.stock > 5 ? 'bg-success' : (p.stock > 0 ? 'bg-warning' : 'bg-danger')} bg-opacity-10 text-${p.stock > 5 ? 'success' : (p.stock > 0 ? 'warning text-dark' : 'danger')} border-0 px-3 py-2"><i class="fas ${p.stock > 5 ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-1"></i> ${p.stock} unid.</span></td>
                                        <td class="text-end pe-4"><button class="btn btn-sm btn-light text-primary me-2 shadow-sm" onclick="editarProducto(${p.idProducto})" title="Editar"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-light text-danger shadow-sm" onclick="eliminarProducto(${p.idProducto})" title="Eliminar"><i class="fas fa-trash"></i></button></td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger m-4">Error: ${error.message}</div>`;
    }
}

async function openProductoModal(id = null) {
    document.getElementById('productoForm').reset();
    document.getElementById('productoId').value = '';
    document.getElementById('modalTitle').textContent = 'Agregar Equipo';
    if (!categoriasCargadas) await cargarCategoriasEnSelect();
    
    if (id) {
        try {
            const prod = await API.Productos.obtenerPorId(id);
            document.getElementById('prodNombre').value = prod.nombre;
            document.getElementById('prodPrecio').value = prod.precio;
            document.getElementById('prodBTU').value = prod.capacidadBTU;
            document.getElementById('prodStock').value = prod.stock;
            document.getElementById('prodCategoria').value = prod.idCategoria;
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
        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar el producto', 'error');
            return;
        }
    }
    bsModal.show();
}

async function cargarCategoriasEnSelect() {
    const select = document.getElementById('prodCategoria');
    select.innerHTML = '<option value="">Cargando...</option>';
    try {
        const categorias = await API.request('/categorias');
        select.innerHTML = '<option value="" disabled selected>Seleccione una categoría</option>';
        categorias.forEach(cat => select.innerHTML += `<option value="${cat.idCategoria}">${cat.nombre}</option>`);
        categoriasCargadas = true;
    } catch (error) {
        select.innerHTML = '<option value="">Error al cargar</option>';
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
    
    // Validar que la categoría sea válida
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
        capacidadBTU: parseInt(document.getElementById('prodBTU').value) || 0,
        stock: parseInt(document.getElementById('prodStock').value) || 0,
        idCategoria: categoriaId
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

    console.log("Payload a enviar:", JSON.stringify(payloadTexto));

    try {
        let response;
        if (idProducto) {
            response = await fetch(`${API_BASE_URL}/productos/${idProducto}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            response = await fetch(`${API_BASE_URL}/productos`, {
                method: 'POST',
                body: formData
            });
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response:", errorText);
            let errorMessage = 'Error al guardar';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        Swal.fire('Éxito', idProducto ? 'Equipo actualizado correctamente.' : 'Equipo registrado con éxito.', 'success');
        bsModal.hide();
        renderProductos();
    } catch (error) {
        console.error("Error en guardarProducto:", error);
        Swal.fire('Error', error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function editarProducto(id) { openProductoModal(id); }

async function eliminarProducto(id) {
    const result = await Swal.fire({ title: '¿Eliminar equipo?', text: "Esta acción lo borrará del catálogo permanentemente.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sí, eliminar' });
    if (result.isConfirmed) {
        try {
            await API.Productos.eliminar(id);
            renderProductos();
            Swal.fire('Eliminado', 'Equipo retirado del catálogo.', 'success');
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }
}

// ========== CATEGORÍAS ==========
async function renderCategorias() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        const categorias = await API.request('/categorias');
        contentDiv.innerHTML = `
            <div class="row g-4">
                <div class="col-lg-4">
                    <div class="card border-0 bg-gradient-primary text-white h-100 shadow-sm">
                        <div class="card-body p-4 p-xl-5 d-flex flex-column justify-content-center">
                            <h4 class="fw-bold mb-4 text-white"><i class="fas fa-folder-plus me-2"></i>Nueva Categoría</h4>
                            <form id="formNuevaCategoria" onsubmit="guardarCategoria(event)">
                                <div class="mb-4"><label class="form-label small text-white-50 fw-bold text-uppercase">Nombre</label><input type="text" id="nombreCategoria" class="form-control border-0 py-3 shadow-sm text-dark fw-bold" placeholder="Ej. Minisplit Inverter" required></div>
                                <button type="submit" class="btn btn-light text-primary fw-bold w-100 py-3 mt-2 shadow-sm fs-6">Crear Categoría</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-lg-8">
                    <div class="card border-0 h-100 shadow-sm">
                        <div class="card-header bg-white pt-4 px-4"><h5 class="fw-bold mb-0 text-dark"><i class="fas fa-tags text-primary me-2"></i>Clasificaciones Registradas</h5></div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="bg-light"><tr><th class="ps-4">ID</th><th>Nombre</th><th class="text-end pe-4">Acción</th></tr></thead>
                                    <tbody>
                                        ${categorias.map(c => `<tr><td class="ps-4 fw-bold text-muted">#${c.idCategoria}</td><td class="fw-bold text-dark fs-6">${c.nombre}</td><td class="text-end pe-4"><button class="btn btn-sm btn-light text-danger rounded-circle shadow-sm" onclick="eliminarCategoria(${c.idCategoria})" title="Eliminar"><i class="fas fa-trash"></i></button></td></tr>`).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger m-4">Error al cargar categorías: ${error.message}</div>`;
    }
}

async function guardarCategoria(event) {
    event.preventDefault();
    const nombre = document.getElementById('nombreCategoria').value;
    try {
        await API.request('/categorias', { method: 'POST', body: JSON.stringify({ nombre }) });
        categoriasCargadas = false;
        renderCategorias();
        Swal.fire({ icon: 'success', title: 'Agregada', text: 'Clasificación guardada con éxito.', toast: true, position: 'top-end', timer: 3000 });
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
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
            Swal.fire('Error', error.message, 'error');
        }
    }
}

// ========== PEDIDOS ==========
async function renderPedidos() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        const [pedidos, usuarios] = await Promise.all([API.Pedidos.listar(), API.Usuarios.listar()]);
        const mapUsuarios = {};
        usuarios.forEach(u => { mapUsuarios[u.idUsuario] = `${u.nombre} ${u.apellido || ''}`.trim(); });
        contentDiv.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white d-flex justify-content-between align-items-center pt-4 px-4">
                    <h5 class="fw-bold mb-0 text-dark"><i class="fas fa-file-invoice-dollar text-success me-2"></i>Historial de Transacciones</h5>
                    <button class="btn btn-outline-success fw-bold bg-success bg-opacity-10 border-0" onclick="exportarPedidos()"><i class="fas fa-file-excel me-2"></i>Exportar Excel</button>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="bg-light"><tr><th class="ps-4">Factura</th><th>Comprador</th><th>Fechas</th><th>Monto Total</th><th>Estado Actual</th><th class="text-end pe-4">Limpiar</th><tr></thead>
                            <tbody>
                                ${pedidos.map(p => {
                                    const selectClass = p.estado === 'Completado' ? 'text-success border-success bg-success bg-opacity-10' : (p.estado === 'Cancelado' ? 'text-danger border-danger bg-danger bg-opacity-10' : 'text-warning border-warning bg-warning bg-opacity-10');
                                    const nombreCliente = mapUsuarios[p.idUsuario] || 'Cliente Desconocido';
                                    return `<tr><td class="ps-4 fw-bold text-primary">#${p.idPedido}</td>
                                    <td><div class="d-flex align-items-center"><div class="avatar-circle bg-primary bg-opacity-10 text-primary me-3 border border-primary border-opacity-25" style="width: 38px; height: 38px; font-size: 0.9rem;"><i class="fas fa-user"></i></div><div><span class="fw-bold text-dark d-block">${nombreCliente}</span><small class="text-muted fw-semibold">ID: #${p.idUsuario}</small></div></div></td>
                                    <td class="text-muted fw-semibold small"><i class="far fa-calendar-check text-primary me-1"></i> ${formatearFecha(p.fechaPedido)}</td>
                                    <td class="fw-bold text-success fs-5">$${p.total.toFixed(2)}</td>
                                    <td><select class="form-select form-select-sm fw-bold shadow-sm ${selectClass}" style="width: 150px;" onchange="cambiarEstadoPedido(${p.idPedido}, this.value)"><option value="Pendiente" ${p.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option><option value="En Proceso" ${p.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option><option value="Completado" ${p.estado === 'Completado' ? 'selected' : ''}>Completado</option><option value="Cancelado" ${p.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option></select></td>
                                    <td class="text-end pe-4"><button class="btn btn-sm btn-light text-danger shadow-sm rounded-circle" onclick="eliminarPedido(${p.idPedido})"><i class="fas fa-trash"></i></button></td>
                                </tr>`}).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger m-4">Error: ${error.message}</div>`;
    }
}

window.cambiarEstadoPedido = async function(id, nuevoEstado) {
    try {
        await API.Pedidos.cambiarEstado(id, nuevoEstado);
        renderPedidos();
        Swal.fire({ icon: 'success', title: 'Actualizado', text: `Factura #${id} movida a ${nuevoEstado}`, toast: true, position: 'top-end', timer: 2000 });
        actualizarContadoresAdmin();
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
};

async function eliminarPedido(id) {
    const result = await Swal.fire({ title: '¿Anular registro de pedido?', text: "La factura y detalles desaparecerán del sistema.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sí, anular' });
    if (result.isConfirmed) {
        try {
            await API.request(`/api/pedidos/${id}`, { method: 'DELETE' });
            renderPedidos();
            Swal.fire('Eliminado', 'Registro anulado correctamente.', 'success');
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }
}

async function exportarPedidos() {
    try {
        Swal.fire({ title: 'Generando archivo...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
        const response = await fetch(`${API_BASE_URL}/api/pedidos/exportar/excel`);        
        if (!response.ok) throw new Error('Error al exportar');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'Reporte_Ventas_ClimaPro.xlsx';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        Swal.fire('Completado', 'Tu descarga ha iniciado.', 'success');
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
}

// ========== USUARIOS ==========
async function renderUsuarios() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        const usuarios = await API.Usuarios.listar();
        contentDiv.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white pt-4 px-4"><h5 class="fw-bold mb-0 text-dark"><i class="fas fa-users-cog text-primary me-2"></i>Directorio de Accesos</h5></div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="bg-light"><tr><th class="ps-4">Perfil</th><th>Contacto</th><th>Permisos</th><th>Estado Cuenta</th><th class="text-end pe-4">Bloqueo</th></tr></thead>
                            <tbody>
                                ${usuarios.map(u => {
                                    const rolBadge = u.rol === 'ADMIN' ? 'bg-danger' : (u.rol === 'TECNICO' ? 'bg-info' : 'bg-secondary');
                                    const statusBadge = u.activo ? 'bg-success text-success' : 'bg-secondary text-secondary';
                                    const initial = u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U';
                                    return `<tr><td class="ps-4"><div class="d-flex align-items-center"><div class="avatar-circle ${rolBadge} bg-opacity-10 text-dark me-3 fw-bold border border-2 border-opacity-25">${initial}</div><div><h6 class="mb-0 fw-bold text-dark">${u.nombre} ${u.apellido || ''}</h6><small class="text-muted fw-semibold">User ID: #${u.idUsuario}</small></div></div></td>
                                    <td><a href="mailto:${u.email}" class="text-decoration-none text-muted fw-semibold"><i class="fas fa-envelope text-primary me-1"></i> ${u.email}</a></td>
                                    <td><span class="badge ${rolBadge} text-white shadow-sm px-3 py-2">${u.rol}</span></td>
                                    <td><span class="badge ${statusBadge.split(' ')[0]} bg-opacity-10 ${statusBadge.split(' ')[1]} border-0 px-3 py-2"><i class="fas fa-circle me-1" style="font-size: 8px;"></i> ${u.activo ? 'Operativo' : 'Restringido'}</span></td>
                                    <td class="text-end pe-4"><button class="btn btn-sm ${u.activo ? 'btn-outline-danger' : 'btn-outline-success'} fw-bold px-3 shadow-sm" onclick="toggleUsuarioEstado(${u.idUsuario}, ${!u.activo})"><i class="fas ${u.activo ? 'fa-user-lock' : 'fa-user-check'} me-1"></i> ${u.activo ? 'Suspender' : 'Reactivar'}</button></td>
                                </tr>`}).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

window.toggleUsuarioEstado = async (id, nuevoEstado) => {
    const action = nuevoEstado ? 'Reactivar' : 'Suspender';
    const result = await Swal.fire({ title: `¿${action} usuario?`, text: `El acceso al sistema cambiará.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, proceder', confirmButtonColor: nuevoEstado ? '#198754' : '#dc3545' });
    if (result.isConfirmed) {
        try {
            await API.Usuarios.cambiarEstado(id, nuevoEstado);
            renderUsuarios();
            Swal.fire({ icon: 'success', title: 'Actualizado', text: `Usuario ${action.toLowerCase()}do con éxito.`, toast: true, position: 'top-end', timer: 2000 });
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }
};

// ========== SOLICITUDES ==========
async function renderSolicitudes() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        const solicitudes = await API.request('/api/solicitudes/pendientes');
        const todos = await API.Usuarios.listar();
        const tecnicos = todos.filter(u => u.rol === 'TECNICO' && u.activo);
        if (solicitudes.length === 0) {
            contentDiv.innerHTML = `<div class="card border-0 shadow-sm py-5 text-center"><div class="card-body"><div class="stat-icon bg-success bg-opacity-10 text-success mx-auto mb-3" style="width: 80px; height: 80px; font-size: 2.5rem;"><i class="fas fa-check-double"></i></div><h4 class="fw-bold text-dark">Todo al día</h4><p class="text-muted">No hay solicitudes técnicas pendientes de asignación.</p></div></div>`;
            return;
        }
        let html = `<div class="card border-0 shadow-sm"><div class="card-header bg-white pt-4 px-4"><h5 class="fw-bold mb-0 text-dark"><i class="fas fa-hard-hat text-warning me-2"></i>Centro de Asignación de Tareas</h5></div><div class="card-body p-0"><div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="bg-light"><tr><th class="ps-4">Ticket / Cliente</th><th>Labor Requerida</th><th style="min-width: 320px;">Despacho de Técnico</th><th class="text-end pe-4" style="width: 130px;">Decisión</th></tr></thead><tbody>`;
        for (const sol of solicitudes) {
            html += `<tr>
                <td class="ps-4"><h6 class="fw-bold text-dark mb-1">Ticket #${sol.idSolicitud}</h6><span class="text-primary fw-semibold"><i class="fas fa-user-circle me-1"></i> ${sol.nombreCliente}</span><small class="text-muted fw-bold d-block mt-2 bg-light p-1 rounded"><i class="far fa-calendar-alt text-warning me-1"></i> Preferencia: ${sol.fechaPreferida ? new Date(sol.fechaPreferida).toLocaleString() : 'Abierto a sugerencias'}</small></td>
                <td><span class="badge bg-gradient-warning shadow-sm mb-2 px-3 py-2">${sol.tipoServicio.replace('_', ' ')}</span><div class="bg-light p-2 rounded-3 border"><p class="small text-muted mb-0 fst-italic" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;" title="${sol.mensaje || 'Sin detalles extra'}"><i class="fas fa-quote-left text-primary opacity-50 me-1"></i> ${sol.mensaje || 'Cliente no proporcionó detalles extras.'}</p></div></td>
                <td><div class="bg-white p-3 rounded-4 border shadow-sm"><select id="tecnicoSelect_${sol.idSolicitud}" class="form-select mb-2 border-primary border-opacity-25 bg-light text-primary fw-bold"><option value="">👤 Asignar Profesional...</option>${tecnicos.map(t => `<option value="${t.idUsuario}">${t.nombre} ${t.apellido || ''}</option>`).join('')}</select><div class="d-flex gap-2"><div class="input-group input-group-sm w-50"><span class="input-group-text bg-success bg-opacity-10 border-0 text-success"><i class="fas fa-play"></i></span><input type="datetime-local" id="fechaInicio_${sol.idSolicitud}" class="form-control border-0 bg-light text-muted fw-semibold"></div><div class="input-group input-group-sm w-50"><span class="input-group-text bg-danger bg-opacity-10 border-0 text-danger"><i class="fas fa-stop"></i></span><input type="datetime-local" id="fechaFin_${sol.idSolicitud}" class="form-control border-0 bg-light text-muted fw-semibold"></div></div></div></td>
                <td class="text-end pe-4"><button class="btn btn-success fw-bold shadow-sm mb-2 w-100" onclick="asignarTecnico(${sol.idSolicitud})"><i class="fas fa-check me-1"></i> Asignar</button><button class="btn btn-light text-danger fw-bold border-danger border-opacity-25 w-100" onclick="rechazarSolicitud(${sol.idSolicitud})"><i class="fas fa-times me-1"></i> Descartar</button></td>
            </tr>`;
        }
        html += `</tbody></table></div></div></div>`;
        contentDiv.innerHTML = html;
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger shadow-sm rounded-4 m-3"><i class="fas fa-exclamation-circle me-2"></i> Error de conexión: ${error.message}</div>`;
    }
}

window.asignarTecnico = async function(idSolicitud) {
    const idTecnico = document.getElementById(`tecnicoSelect_${idSolicitud}`).value;
    const fechaInicio = document.getElementById(`fechaInicio_${idSolicitud}`).value;
    const fechaFin = document.getElementById(`fechaFin_${idSolicitud}`).value;
    if (!idTecnico || !fechaInicio || !fechaFin) {
        Swal.fire('Datos Incompletos', 'Asegúrate de seleccionar al técnico y ambos rangos de hora.', 'warning');
        return;
    }
    try {
        await API.request(`/api/solicitudes/${idSolicitud}/asignar`, { method: 'POST', body: JSON.stringify({ idTecnico, fechaInicio, fechaFin }) });
        Swal.fire('¡Misión Asignada!', 'El técnico ha recibido la programación en su agenda.', 'success');
        renderSolicitudes();
        actualizarContadoresAdmin();
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
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

// ========== CONTADORES ==========
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