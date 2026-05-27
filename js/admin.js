// js/admin.js

const contentDiv = document.getElementById('dynamicContent');
let bsModal = null;
let categoriasCargadas = false;

const formatearFecha = (fechaString) => {
    const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-ES', opciones);
};

document.addEventListener('DOMContentLoaded', () => {
    bsModal = new bootstrap.Modal(document.getElementById('productoModal'));
    document.getElementById('productoForm').addEventListener('submit', guardarProducto);
    loadPage('dashboard');

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
        dashboard: ['Dashboard', 'Resumen general del sistema'],
        productos: ['Gestión de Productos', 'Administra el catálogo de equipos'],
        pedidos: ['Gestión de Pedidos', 'Visualiza y actualiza el estado de los pedidos'],
        categorias: ['Gestión de Categorías', 'Organiza el catálogo'],
        usuarios: ['Gestión de Usuarios', 'Administra clientes y roles'],
        solicitudes: ['Solicitudes de Servicio', 'Gestiona peticiones de los clientes']
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

async function renderDashboard() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Cargando estadísticas...</p></div>';
    try {
        const stats = await API.Estadisticas.obtenerDashboard();
        
        contentDiv.innerHTML = `
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm rounded-3 h-100">
                        <div class="card-body py-3 px-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div><h6 class="text-muted mb-1 small">Ventas Totales</h6><h3 class="fw-bold mb-0 fs-2">$${stats.ventasTotales.toFixed(2)}</h3></div>
                                <div class="bg-primary bg-opacity-10 rounded-circle p-2"><i class="fas fa-dollar-sign text-primary fs-5"></i></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm rounded-3 h-100">
                        <div class="card-body py-3 px-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div><h6 class="text-muted mb-1 small">Pedidos</h6><h3 class="fw-bold mb-0 fs-2">${stats.totalPedidos}</h3></div>
                                <div class="bg-success bg-opacity-10 rounded-circle p-2"><i class="fas fa-shopping-cart text-success fs-5"></i></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm rounded-3 h-100">
                        <div class="card-body py-3 px-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div><h6 class="text-muted mb-1 small">Productos</h6><h3 class="fw-bold mb-0 fs-2">${stats.totalProductos}</h3></div>
                                <div class="bg-info bg-opacity-10 rounded-circle p-2"><i class="fas fa-boxes text-info fs-5"></i></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm rounded-3 h-100">
                        <div class="card-body py-3 px-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div><h6 class="text-muted mb-1 small">Clientes</h6><h3 class="fw-bold mb-0 fs-2">${stats.totalClientes}</h3></div>
                                <div class="bg-warning bg-opacity-10 rounded-circle p-2"><i class="fas fa-users text-warning fs-5"></i></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="card border-0 shadow-sm rounded-3 h-100">
                        <div class="card-header bg-transparent border-0 pt-3 pb-0 px-3"><h6 class="fw-bold mb-0"><i class="fas fa-chart-line me-2 text-primary"></i>Ventas por Mes</h6></div>
                        <div class="card-body p-3"><canvas id="ventasChart" height="200" style="max-height: 200px;"></canvas></div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-0 shadow-sm rounded-3 h-100">
                        <div class="card-header bg-transparent border-0 pt-3 pb-0 px-3"><h6 class="fw-bold mb-0"><i class="fas fa-chart-bar me-2 text-success"></i>Productos Más Vendidos</h6></div>
                        <div class="card-body p-3"><canvas id="productosChart" height="200" style="max-height: 200px;"></canvas></div>
                    </div>
                </div>
                <div class="col-md-6 offset-md-3">
                    <div class="card border-0 shadow-sm rounded-3">
                        <div class="card-header bg-transparent border-0 pt-3 pb-0 px-3"><h6 class="fw-bold mb-0"><i class="fas fa-chart-pie me-2 text-info"></i>Pedidos por Estado</h6></div>
                        <div class="card-body p-3"><canvas id="estadosChart" height="200" style="max-height: 200px;"></canvas></div>
                    </div>
                </div>
            </div>
        `;

        const ctxVentas = document.getElementById('ventasChart').getContext('2d');
        new Chart(ctxVentas, {
            type: 'line',
            data: { labels: stats.ventasPorMes.map(v => v.mes), datasets: [{ label: 'Ventas ($)', data: stats.ventasPorMes.map(v => v.total), borderColor: '#0d6efd', tension: 0.2, fill: false, pointRadius: 3 }] },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 11 } } } } }
        });

        const ctxProductos = document.getElementById('productosChart').getContext('2d');
        new Chart(ctxProductos, {
            type: 'bar',
            data: { labels: stats.productosMasVendidos.map(p => p.nombre.length > 15 ? p.nombre.substring(0,12)+'…' : p.nombre), datasets: [{ label: 'Unidades vendidas', data: stats.productosMasVendidos.map(p => p.vendidos), backgroundColor: '#20c997', borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 11 } } } } }
        });

        const ctxEstados = document.getElementById('estadosChart').getContext('2d');
        new Chart(ctxEstados, {
            type: 'doughnut',
            data: { labels: Object.keys(stats.pedidosPorEstado), datasets: [{ data: Object.values(stats.pedidosPorEstado), backgroundColor: ['#ffc107', '#0dcaf0', '#198754', '#dc3545'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } } } }
        });
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger m-3">Error al cargar estadísticas: ${error.message}</div>`;
    }
}

// ========== PRODUCTOS ==========
async function renderProductos() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Cargando productos...</p></div>';
    try {
        const productosData = await API.Productos.listarActivos();
        contentDiv.innerHTML = `
            <div class="card border-0 shadow-sm rounded-4">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h5 class="fw-bold mb-0">Catálogo de Equipos</h5>
                        <button class="btn btn-primary fw-bold" onclick="openProductoModal()"><i class="fas fa-plus me-2"></i>Nuevo Producto</button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead class="table-light"><tr><th>ID</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead>
                            <tbody>
                                ${productosData.map(p => `
                                    <tr>
                                        <td>${p.idProducto}</td>
                                        <td class="fw-semibold text-dark">${p.nombre}</td>
                                        <td><span class="badge bg-info text-dark">${p.nombreCategoria}</span></td>
                                        <td class="fw-bold text-primary">$${p.precio.toFixed(2)}</td>
                                        <td>${p.stock}</td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary" onclick="editarProducto(${p.idProducto})"><i class="fas fa-edit"></i></button>
                                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${p.idProducto})"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
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
    document.getElementById('modalTitle').textContent = 'Agregar Producto';
    if (!categoriasCargadas) await cargarCategoriasEnSelect();
    if (id) {
        try {
            const prod = await API.Productos.obtenerPorId(id);
            document.getElementById('prodNombre').value = prod.nombre;
            document.getElementById('prodDescripcion').value = prod.descripcion;
            document.getElementById('prodPrecio').value = prod.precio;
            document.getElementById('prodBTU').value = prod.capacidadBTU;
            document.getElementById('prodStock').value = prod.stock;
            document.getElementById('prodCategoria').value = prod.idCategoria;
            const marcaMatch = prod.descripcion?.match(/Marca: ([^-]+)/);
            if (marcaMatch) document.getElementById('prodMarca').value = marcaMatch[1].trim();
            document.getElementById('productoId').value = prod.idProducto;
            document.getElementById('modalTitle').textContent = 'Editar Producto';
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
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

    const idProducto = document.getElementById('productoId').value;
    const payloadTexto = {
        nombre: document.getElementById('prodNombre').value,
        descripcion: document.getElementById('prodDescripcion').value,
        precio: parseFloat(document.getElementById('prodPrecio').value),
        capacidadBtu: parseInt(document.getElementById('prodBTU').value) || 0,
        stock: parseInt(document.getElementById('prodStock').value) || 0,
        idCategoria: parseInt(document.getElementById('prodCategoria').value)
    };
    const marca = document.getElementById('prodMarca').value;
    payloadTexto.descripcion = `Marca: ${marca} - ${payloadTexto.descripcion}`;

    try {
        if (idProducto) {
            await API.Productos.actualizar(idProducto, payloadTexto);
            Swal.fire('Éxito', 'Producto actualizado correctamente.', 'success');
        } else {
            const formData = new FormData();
            const productoBlob = new Blob([JSON.stringify(payloadTexto)], { type: 'application/json' });
            formData.append('producto', productoBlob);
            const fileInput = document.getElementById('prodImagenes');
            if (fileInput.files.length) {
                for (let i = 0; i < fileInput.files.length; i++) formData.append('imagenes', fileInput.files[i]);
            }
            const resp = await fetch('http://localhost:8080/productos', { method: 'POST', body: formData });
            if (!resp.ok) throw new Error((await resp.json()).message || 'Error');
            Swal.fire('Éxito', 'Producto creado correctamente.', 'success');
        }
        bsModal.hide();
        renderProductos();
        document.getElementById('productoForm').reset();
        document.getElementById('productoId').value = '';
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function editarProducto(id) { openProductoModal(id); }

async function eliminarProducto(id) {
    const result = await Swal.fire({ title: '¿Eliminar producto?', text: "Esta acción no se puede deshacer", icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sí, eliminar' });
    if (result.isConfirmed) {
        try {
            await API.Productos.eliminar(id);
            renderProductos();
            Swal.fire('Eliminado', 'Producto eliminado correctamente', 'success');
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }
}

// ========== CATEGORÍAS ==========
async function renderCategorias() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Cargando categorías...</p></div>';
    try {
        const categorias = await API.request('/categorias');
        contentDiv.innerHTML = `
            <div class="card border-0 shadow-sm rounded-4 mb-4">
                <div class="card-body p-4">
                    <h5 class="fw-bold border-bottom pb-3 mb-4 text-primary">Añadir Nueva Categoría</h5>
                    <form id="formNuevaCategoria" class="d-flex gap-3 align-items-center" onsubmit="guardarCategoria(event)">
                        <div class="flex-grow-1"><input type="text" id="nombreCategoria" class="form-control bg-light border-0 py-2" placeholder="Ej. Minisplit Inverter" required></div>
                        <button type="submit" class="btn btn-primary fw-bold px-4 py-2 text-nowrap"><i class="fas fa-plus me-2"></i>Guardar</button>
                    </form>
                </div>
            </div>
            <div class="card border-0 shadow-sm rounded-4">
                <div class="card-body p-4">
                    <h5 class="fw-bold mb-4">Categorías Registradas</h5>
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead class="table-light"><tr><th class="ps-3">ID</th><th>Nombre</th><th class="text-end pe-3">Acciones</th></tr></thead>
                            <tbody>
                                ${categorias.map(c => `<tr><td class="ps-3 fw-bold text-muted">#${c.idCategoria}</td><td class="fw-semibold text-dark">${c.nombre}</td><td class="text-end pe-3"><button class="btn btn-sm btn-outline-danger" onclick="eliminarCategoria(${c.idCategoria})"><i class="fas fa-trash"></i></button></td></tr>`).join('')}
                            </tbody>
                        </table>
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
        Swal.fire('Éxito', 'Categoría creada correctamente', 'success');
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
}

async function eliminarCategoria(id) {
    const result = await Swal.fire({ title: '¿Eliminar categoría?', text: "Los productos asociados quedarán sin categoría", icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sí, eliminar' });
    if (result.isConfirmed) {
        try {
            await API.request(`/categorias/${id}`, { method: 'DELETE' });
            renderCategorias();
            Swal.fire('Eliminada', 'Categoría eliminada', 'success');
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }
}

// ========== PEDIDOS ==========
async function renderPedidos() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Cargando pedidos...</p></div>';
    try {
        const pedidos = await API.Pedidos.listar();
        contentDiv.innerHTML = `
            <div class="card border-0 shadow-sm rounded-4">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4"><h5 class="fw-bold mb-0">Gestión de Pedidos</h5><button class="btn btn-outline-secondary btn-sm" onclick="exportarPedidos()"><i class="fas fa-download me-2"></i>Exportar Reporte</button></div>
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead class="table-light"><tr><th>ID</th><th>Cliente ID</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
                            <tbody>
                                ${pedidos.map(p => `
                                    <tr>
                                        <td class="fw-bold">#${p.idPedido}</td>
                                        <td>${p.idUsuario}</td>
                                        <td>${formatearFecha(p.fechaPedido)}</td>
                                        <td>$${p.total.toFixed(2)}</td>
                                        <td><select class="form-select form-select-sm" onchange="cambiarEstadoPedido(${p.idPedido}, this.value)">
                                                <option value="Pendiente" ${p.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                                                <option value="En Proceso" ${p.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                                                <option value="Completado" ${p.estado === 'Completado' ? 'selected' : ''}>Completado</option>
                                                <option value="Cancelado" ${p.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                                            </select>
                                        </td>
                                        <td><button class="btn btn-sm btn-outline-danger" onclick="eliminarPedido(${p.idPedido})"><i class="fas fa-trash"></i></button></td>
                                    </tr>
                                `).join('')}
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

window.cambiarEstadoPedido = async function(id, nuevoEstado) {
    try {
        await API.Pedidos.cambiarEstado(id, nuevoEstado);
        renderPedidos();
        Swal.fire('Actualizado', `Pedido #${id} cambiado a ${nuevoEstado}`, 'success');
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
};

async function eliminarPedido(id) {
    const result = await Swal.fire({ title: '¿Eliminar pedido?', text: "Esta acción no se puede deshacer", icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sí, eliminar' });
    if (result.isConfirmed) {
        try {
            await API.request(`/api/pedidos/${id}`, { method: 'DELETE' });
            renderPedidos();
            Swal.fire('Eliminado', 'Pedido eliminado', 'success');
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }
}

async function exportarPedidos() {
    try {
        const response = await fetch('http://localhost:8080/api/pedidos/exportar/excel');
        if (!response.ok) throw new Error('Error al exportar');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'pedidos.xlsx';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        Swal.fire('Éxito', 'Pedidos exportados correctamente.', 'success');
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
}

// ========== USUARIOS ==========
async function renderUsuarios() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Cargando usuarios...</p></div>';
    try {
        const usuarios = await API.Usuarios.listar();
        contentDiv.innerHTML = `
            <div class="card border-0 shadow-sm rounded-4">
                <div class="card-body p-4">
                    <h5 class="fw-bold mb-4">Usuarios del Sistema</h5>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="table-light"><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
                            <tbody>
                                ${usuarios.map(u => `<tr><td>${u.idUsuario}</td><td>${u.nombre} ${u.apellido || ''}</td><td>${u.email}</td><td>${u.rol}</td><td>${u.activo ? 'Activo' : 'Inactivo'}</td><td><button class="btn btn-sm btn-outline-warning" onclick="toggleUsuarioEstado(${u.idUsuario}, ${!u.activo})">${u.activo ? 'Desactivar' : 'Activar'}</button></td></tr>`).join('')}
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
    const action = nuevoEstado ? 'activar' : 'desactivar';
    const result = await Swal.fire({ title: `¿${action === 'activar' ? 'Activar' : 'Desactivar'} usuario?`, text: `El usuario quedará ${action === 'activar' ? 'activo' : 'inactivo'}`, icon: 'question', showCancelButton: true, confirmButtonText: 'Confirmar' });
    if (result.isConfirmed) {
        try {
            await API.Usuarios.cambiarEstado(id, nuevoEstado);
            renderUsuarios();
            Swal.fire('Actualizado', `Usuario ${action === 'activar' ? 'activado' : 'desactivado'}`, 'success');
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }
};

// ========== SOLICITUDES DE SERVICIO ==========
async function renderSolicitudes() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Cargando solicitudes...</p></div>';
    try {
        const solicitudes = await API.request('/api/solicitudes/pendientes');
        const todos = await API.Usuarios.listar();
        const tecnicos = todos.filter(u => u.rol === 'TECNICO');
        if (solicitudes.length === 0) {
            contentDiv.innerHTML = '<div class="alert alert-info">No hay solicitudes pendientes.</div>';
            return;
        }
        let html = `<div class="card border-0 shadow-sm rounded-4"><div class="card-body p-4"><h5 class="fw-bold mb-4">Solicitudes de Servicio</h5><div class="table-responsive"><table class="table table-hover"><thead class="table-light"><tr><th>ID</th><th>Cliente</th><th>Tipo</th><th>Fecha Preferida</th><th>Mensaje</th><th>Asignar Técnico</th><th>Acciones</th></tr></thead><tbody>`;
        for (const sol of solicitudes) {
            html += `<tr>
                <td class="fw-bold">#${sol.idSolicitud}</td>
                <td>${sol.nombreCliente}</td>
                <td><span class="badge bg-info">${sol.tipoServicio}</span></td>
                <td>${sol.fechaPreferida ? new Date(sol.fechaPreferida).toLocaleString() : 'No especificada'}</td>
                <td>${sol.mensaje || ''}</td>
                <td style="min-width: 220px;">
                    <div class="mb-2"><label class="form-label small fw-semibold mb-0">Técnico</label><select id="tecnicoSelect_${sol.idSolicitud}" class="form-select form-select-sm"><option value="">Seleccionar técnico</option>${tecnicos.map(t => `<option value="${t.idUsuario}">${t.nombre} ${t.apellido}</option>`).join('')}</select></div>
                    <div class="mb-2"><label class="form-label small fw-semibold mb-0">Inicio</label><input type="datetime-local" id="fechaInicio_${sol.idSolicitud}" class="form-control form-control-sm"></div>
                    <div class="mb-2"><label class="form-label small fw-semibold mb-0">Fin</label><input type="datetime-local" id="fechaFin_${sol.idSolicitud}" class="form-control form-control-sm"></div>
                </td>
                <td><button class="btn btn-sm btn-success w-100 mb-1" onclick="asignarTecnico(${sol.idSolicitud})">Asignar</button><button class="btn btn-sm btn-danger w-100" onclick="rechazarSolicitud(${sol.idSolicitud})">Rechazar</button></td>
            </tr>`;
        }
        html += `</tbody></table></div></div></div>`;
        contentDiv.innerHTML = html;
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger">Error al cargar solicitudes: ${error.message}</div>`;
    }
}

window.asignarTecnico = async function(idSolicitud) {
    const idTecnico = document.getElementById(`tecnicoSelect_${idSolicitud}`).value;
    const fechaInicio = document.getElementById(`fechaInicio_${idSolicitud}`).value;
    const fechaFin = document.getElementById(`fechaFin_${idSolicitud}`).value;
    if (!idTecnico || !fechaInicio || !fechaFin) {
        Swal.fire('Error', 'Debe seleccionar técnico, fecha/hora de inicio y fin.', 'error');
        return;
    }
    try {
        await API.request(`/api/solicitudes/${idSolicitud}/asignar`, { method: 'POST', body: JSON.stringify({ idTecnico, fechaInicio, fechaFin }) });
        Swal.fire('Asignada', 'Cita creada y técnico notificado.', 'success');
        renderSolicitudes();
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
};

window.rechazarSolicitud = async function(idSolicitud) {
    const confirm = await Swal.fire({ title: '¿Rechazar solicitud?', text: 'No podrás deshacer esta acción.', icon: 'warning', showCancelButton: true });
    if (confirm.isConfirmed) {
        await API.request(`/api/solicitudes/${idSolicitud}/rechazar`, { method: 'POST' });
        Swal.fire('Rechazada', 'La solicitud ha sido rechazada.', 'success');
        renderSolicitudes();
    }
};