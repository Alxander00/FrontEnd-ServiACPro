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
let categoriasCargadas = false;
let currentImageUrls = [];

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

    document.getElementById('productoForm').addEventListener('submit', guardarProducto);
    document.getElementById('categoriaForm').addEventListener('submit', guardarCategoriaEdicion);
    document.getElementById('repuestoForm').addEventListener('submit', guardarRepuesto);

    // Previsualización de imágenes seleccionadas
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

    // Limpiar previsualización al cerrar el modal
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
// PRODUCTOS
// ==========================================
async function renderProductos() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        const response = await API.Productos.listarActivos();
        const productos = response.content || response || [];
        if (!Array.isArray(productos)) throw new Error('La respuesta no contiene un arreglo de productos');

        contentDiv.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 class="fw-bold mb-0 text-dark"><i class="fas fa-box text-primary me-2"></i>Inventario de Equipos</h5>
                    <button class="btn btn-primary fw-bold shadow-sm" onclick="openProductoModal()"><i class="fas fa-plus me-2"></i>Nuevo Equipo</button>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="bg-light"><tr><th class="ps-4">Equipo y Detalles</th><th>Categoría</th><th>Precio Base</th><th>Disponibilidad</th><th class="text-end pe-4">Acciones</th></tr></thead>
                            <tbody>
                                ${productos.map(p => `
                                    <tr>
                                        <td class="ps-4">
                                            <div class="d-flex align-items-center">
                                                <div class="avatar-circle bg-light text-primary border me-3"><i class="fas fa-fan"></i></div>
                                                <div><h6 class="mb-0 fw-bold text-dark">${p.nombre}</h6><small class="text-muted fw-semibold">ID: #${p.idProducto} | ${p.capacidadBTU} BTU</small></div>
                                            </div>
                                        </td>
                                        <td><span class="badge bg-secondary bg-opacity-10 text-secondary border px-3 py-2">${p.nombreCategoria || 'Sin categoría'}</span></td>
                                        <td class="fw-bold text-dark fs-5">$${p.precio.toFixed(2)}</td>
                                        <td><span class="badge ${p.stock > 5 ? 'bg-success' : (p.stock > 0 ? 'bg-warning' : 'bg-danger')} bg-opacity-10 text-${p.stock > 5 ? 'success' : (p.stock > 0 ? 'warning text-dark' : 'danger')} border-0 px-3 py-2"><i class="fas ${p.stock > 5 ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-1"></i> ${p.stock} unid.</span></td>
                                        <td class="text-end pe-4">
                                            <button class="btn btn-sm btn-light text-primary me-2 shadow-sm" onclick="openProductoModal(${p.idProducto})" title="Editar"><i class="fas fa-edit"></i></button>
                                            <button class="btn btn-sm btn-light text-danger shadow-sm" onclick="eliminarProducto(${p.idProducto})" title="Eliminar"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error en renderProductos:', error);
        contentDiv.innerHTML = `<div class="alert alert-danger m-4">Error al cargar productos: ${error.message}</div>`;
    }
}

// ==========================================
// ABRIR MODAL PRODUCTO (CON IMÁGENES)
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

            // Guardar URLs actuales y mostrarlas
            currentImageUrls = prod.imagenesUrls || [];
            mostrarImagenesActuales(currentImageUrls);

        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar el producto', 'error');
            return;
        }
    }
    bsModalProducto.show();
}

// ==========================================
// MOSTRAR IMÁGENES ACTUALES CON BOTÓN ELIMINAR
// ==========================================
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

// ==========================================
// CARGAR CATEGORÍAS EN SELECT
// ==========================================
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

// ==========================================
// GUARDAR PRODUCTO (CON URLs Y NUEVAS IMÁGENES)
// ==========================================
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
        let response;
        if (idProducto) {
            response = await fetch(`${API_BASE_URL}/productos/${idProducto}`, { method: 'PUT', body: formData });
        } else {
            response = await fetch(`${API_BASE_URL}/productos`, { method: 'POST', body: formData });
        }
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Error al guardar';
            try { const errorData = JSON.parse(errorText); errorMessage = errorData.message || errorData.error || errorMessage; } catch(e) { errorMessage = errorText || errorMessage; }
            throw new Error(errorMessage);
        }
        Swal.fire('Éxito', idProducto ? 'Equipo actualizado correctamente.' : 'Equipo registrado con éxito.', 'success');
        bsModalProducto.hide();
        renderProductos();
    } catch (error) {
        console.error("Error en guardarProducto:", error);
        Swal.fire('Error', error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ==========================================
// ELIMINAR PRODUCTO
// ==========================================
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

// ==========================================
// CATEGORÍAS (con edición)
// ==========================================
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
                                    <thead class="bg-light"><tr><th class="ps-4">ID</th><th>Nombre</th><th class="text-end pe-4">Acciones</th></tr></thead>
                                    <tbody>
                                        ${categorias.map(c => `
                                            <tr>
                                                <td class="ps-4 fw-bold text-muted">#${c.idCategoria}</td>
                                                <td class="fw-bold text-dark fs-6">${c.nombre}</td>
                                                <td class="text-end pe-4">
                                                    <button class="btn btn-sm btn-light text-primary me-2 shadow-sm" onclick="editarCategoria(${c.idCategoria}, '${c.nombre}')" title="Editar"><i class="fas fa-edit"></i></button>
                                                    <button class="btn btn-sm btn-light text-danger rounded-circle shadow-sm" onclick="eliminarCategoria(${c.idCategoria})" title="Eliminar"><i class="fas fa-trash"></i></button>
                                                </td>
                                            </tr>`).join('')}
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

// ==========================================
// PEDIDOS
// ==========================================
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
                    <button class="btn btn-success fw-bold bg-success bg-opacity-10 border-0" onclick="abrirModalFiltrosExcel()">
                        <i class="fas fa-file-excel me-2"></i>Exportar Excel
                    </button>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="bg-light"><tr><th class="ps-4">Factura</th><th>Comprador</th><th>Fechas</th><th>Monto Total</th><th>Estado Actual</th><th class="text-end pe-4">Limpiar</th></tr></thead>
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

// ===== FUNCIONES PARA EXPORTAR EXCEL CON FILTROS =====
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
            text: 'Por favor espera mientras se procesa la información.',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const token = Auth.getToken();
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Error al generar el reporte');
        }

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
            text: 'La descarga ha comenzado.',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false
        });

        bootstrap.Modal.getInstance(document.getElementById('modalFiltrosExcel')).hide();

    } catch (error) {
        Swal.close();
        Swal.fire('Error', error.message, 'error');
    }
}

// ==========================================
// USUARIOS
// ==========================================
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

// ==========================================
// SOLICITUDES
// ==========================================
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

async function renderReportes() {
    contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        listaCitasGlobal = await API.Citas.listar();
        if (!listaCitasGlobal || listaCitasGlobal.length === 0) {
            contentDiv.innerHTML = `<div class="alert alert-info shadow-sm m-4">No hay historial de citas o reportes en el sistema.</div>`;
            return;
        }
        contentDiv.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white pt-4 px-4"><h5 class="fw-bold mb-0 text-dark"><i class="fas fa-clipboard-list text-primary me-2"></i>Historial de Trabajos</h5></div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="bg-light"><tr><th class="ps-4">Ticket</th><th>Cliente</th><th>Técnico</th><th>Fecha</th><th>Estado</th><th class="text-end pe-4">Evidencia</th></tr></thead>
                            <tbody>
                                ${listaCitasGlobal.map(cita => {
                                    const badgeClass = cita.estado === 'COMPLETADA' ? 'bg-success' : (cita.estado === 'CANCELADA' ? 'bg-danger' : 'bg-warning text-dark');
                                    const tieneEvidencia = cita.estado === 'COMPLETADA' && (cita.urlFirmaCliente || cita.urlsFotosAntes || cita.urlsFotosDespues);
                                    const btnEvidencia = tieneEvidencia ? `<button class="btn btn-sm btn-primary shadow-sm rounded-pill px-3 fw-bold" onclick="abrirVisorEvidencia(${cita.idCita})"><i class="fas fa-camera me-1"></i> Ver Reporte</button>` : `<span class="text-muted small">No disponible</span>`;
                                    return `<tr><td class="ps-4 fw-bold text-primary">#${cita.idCita}</td>
                                        <td><div class="fw-bold text-dark">${cita.nombreCliente}</div><small class="text-muted"><i class="fas fa-map-marker-alt text-danger me-1"></i>${cita.direccionCliente || 'Sin dirección'}</small></td>
                                        <td><span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 p-2"><i class="fas fa-hard-hat me-1"></i> ${cita.nombreTecnico}</span></td>
                                        <td class="small fw-semibold text-secondary">${formatearFecha(cita.fechaInicio)}</td>
                                        <td><span class="badge ${badgeClass} shadow-sm px-3 py-2">${cita.estado}</span></td>
                                        <td class="text-end pe-4">${btnEvidencia}</td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger shadow-sm m-4">Error al cargar reportes: ${error.message}</div>`;
    }
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
    Swal.fire({ title: 'Generando Documento...', text: 'Estructurando reporte profesional, por favor espera.', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
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
        Swal.fire({ icon: 'success', title: '¡Documento Generado!', text: 'El reporte profesional se descargó en tu equipo.', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } catch (error) {
        console.error('Error generando PDF:', error);
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
        listaInventarioGlobal = await API.Repuestos.listarActivos();
        dibujarTablaInventario(listaInventarioGlobal);
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger m-4">Error al cargar inventario: ${error.message}</div>`;
    }
}

function dibujarTablaInventario(repuestos) {
    const inversionTotal = repuestos.reduce((acc, rep) => acc + (rep.stockActual * rep.costoUnitario), 0);
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h5 class="fw-bold mb-0">Existencias Actuales</h5>
            <div class="d-flex gap-2 align-items-center">
                <div class="input-group input-group-sm shadow-sm rounded-pill overflow-hidden border bg-white">
                    <span class="input-group-text bg-white border-0 text-muted ps-3"><i class="fas fa-search"></i></span>
                    <input type="text" id="buscadorInventario" class="form-control border-0 bg-white" placeholder="Buscar material..." onkeyup="filtrarInventario()">
                </div>
                <button class="btn btn-primary fw-bold rounded-pill px-4 shadow-sm text-nowrap" onclick="abrirModalRepuesto()"><i class="fas fa-plus me-2"></i>Nuevo</button>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-4"><div class="card border-0 shadow-sm bg-primary text-white rounded-4"><div class="card-body p-4"><h6 class="opacity-75 mb-1">Inversión en Almacén</h6><h2 class="fw-bold mb-0">$${inversionTotal.toFixed(2)}</h2></div></div></div>
        </div>
        
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="bg-light"><tr><th class="ps-4">Material</th><th>Unidad</th><th>Costo Unit.</th><th>Stock</th><th class="text-end pe-4">Acciones</th></tr></thead>
                    <tbody>
    `;
    
    if (repuestos.length === 0) {
        html += `<tr><td colspan="5" class="text-center py-4 text-muted">No hay materiales registrados.</td></tr>`;
    } else {
        repuestos.forEach(rep => {
            const badgeStock = rep.stockActual <= 5 ? 'bg-danger' : 'bg-success';
            html += `
            <tr>
                <td class="ps-4 fw-bold text-dark">${rep.nombre}</td>
                <td><span class="badge bg-secondary bg-opacity-10 text-secondary border">${rep.unidadMedida}</span></td>
                <td>$${rep.costoUnitario.toFixed(2)}</td>
                <td><span class="badge ${badgeStock} px-3 py-2 fs-6">${rep.stockActual}</span></td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-light text-primary me-2 shadow-sm" onclick="editarRepuesto(${rep.idRepuesto})" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-light text-danger shadow-sm rounded-circle" onclick="eliminarRepuesto(${rep.idRepuesto})" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        });
    }
    html += `</tbody></table></div></div>`;
    contentDiv.innerHTML = html;
}

// Función del Buscador en tiempo real
window.filtrarInventario = function() {
    const texto = document.getElementById('buscadorInventario').value.toLowerCase();
    const filtrados = listaInventarioGlobal.filter(rep => rep.nombre.toLowerCase().includes(texto));
    dibujarTablaInventario(filtrados);
    // Para no perder lo que escribió el usuario al redibujar
    const inputBuscador = document.getElementById('buscadorInventario');
    if(inputBuscador) {
        inputBuscador.value = texto;
        inputBuscador.focus();
    }
};

window.abrirModalRepuesto = function(id = null) {
    const form = document.getElementById('repuestoForm');
    form.reset();
    // Reutilizamos el modal agregando un input oculto al vuelo si no existe
    if (!document.getElementById('repuestoIdActual')) {
        form.insertAdjacentHTML('afterbegin', '<input type="hidden" id="repuestoIdActual">');
    }
    
    const idInput = document.getElementById('repuestoIdActual');
    const title = document.querySelector('#repuestoModal .modal-title');
    
    if (id) {
        const rep = listaInventarioGlobal.find(r => r.idRepuesto === id);
        idInput.value = rep.idRepuesto;
        document.getElementById('repNombre').value = rep.nombre;
        document.getElementById('repUnidad').value = rep.unidadMedida;
        document.getElementById('repStock').value = rep.stockActual;
        document.getElementById('repCosto').value = rep.costoUnitario;
        title.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Material';
    } else {
        idInput.value = '';
        title.innerHTML = '<i class="fas fa-tools me-2"></i>Registrar Material';
    }
    
    new bootstrap.Modal(document.getElementById('repuestoModal')).show();
};

window.editarRepuesto = function(id) {
    abrirModalRepuesto(id);
};

window.eliminarRepuesto = async function(id) {
    const result = await Swal.fire({ title: '¿Eliminar material?', text: "Se borrará del inventario.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sí, eliminar' });
    if (result.isConfirmed) {
        try {
            await API.request(`/api/repuestos/${id}`, { method: 'DELETE' });
            Swal.fire('Eliminado', 'Material retirado del almacén.', 'success');
            renderInventario();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }
};

async function guardarRepuesto(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    
    const idInput = document.getElementById('repuestoIdActual');
    const idRepuesto = idInput ? idInput.value : '';
    
    const payload = {
        nombre: document.getElementById('repNombre').value,
        unidadMedida: document.getElementById('repUnidad').value,
        stockActual: parseInt(document.getElementById('repStock').value),
        costoUnitario: parseFloat(document.getElementById('repCosto').value)
    };
    
    try {
        if (idRepuesto) {
            await API.request(`/api/repuestos/${idRepuesto}`, { 
                method: 'PUT', 
                body: JSON.stringify(payload) 
            });
            Swal.fire({ icon: 'success', title: 'Actualizado', text: 'Material editado correctamente.', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
        } else {
            await API.Repuestos.crear(payload);
            Swal.fire({ icon: 'success', title: 'Registrado', text: 'Nuevo material en almacén.', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
        }
        
        bootstrap.Modal.getInstance(document.getElementById('repuestoModal')).hide();
        renderInventario();
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar en Almacén';
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
        const response = await API.Productos.listarActivos();
        productosCatalogoCotizador = response.content || response || [];
        itemsCotizacion = [];
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
                            <div class="mb-4"><label class="form-label small fw-bold text-primary">1. Seleccionar de Catálogo</label><select id="cotSelectorProducto" class="form-select bg-light border-0 mb-2"><option value="" selected disabled>Seleccionar equipo...</option>${productosCatalogoCotizador.map(p => `<option value="${p.idProducto}" data-precio="${p.precio}">${p.nombre} - $${p.precio.toFixed(2)}</option>`).join('')}</select><button class="btn btn-sm btn-outline-primary w-100 fw-bold" onclick="agregarItemCotizacion('producto')"><i class="fas fa-cart-plus me-1"></i> Agregar Equipo</button></div>
                            <hr class="opacity-25">
                            <div class="mb-2"><label class="form-label small fw-bold text-success">2. Concepto Libre (Ej. Mano de obra)</label><input type="text" id="cotConceptoExtra" class="form-control bg-light border-0 mb-2" placeholder="Descripción de mano de obra o material..."><div class="input-group input-group-sm mb-2"><span class="input-group-text bg-light border-0">$</span><input type="number" id="cotPrecioExtra" class="form-control bg-light border-0" placeholder="0.00" step="0.01"></div><button class="btn btn-sm btn-outline-success w-100 fw-bold" onclick="agregarItemCotizacion('extra')"><i class="fas fa-plus me-1"></i> Agregar Concepto</button></div>
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
        Swal.fire({ icon: 'warning', title: 'Falta el Cliente', text: 'El nombre del prospecto es obligatorio para emitir la cotización.', confirmButtonColor: '#0d6efd' }).then(() => { inputNombre.focus(); });
        return;
    }
    const validez = document.getElementById('cotValidez').value;
    if (itemsCotizacion.length === 0) {
        Swal.fire('Atención', 'Agrega al menos un concepto a la cotización.', 'warning');
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
        Swal.fire({ icon: 'success', title: '¡Presupuesto Generado!', text: 'El PDF se ha descargado en tu equipo.', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } catch (error) {
        Swal.close();
        Swal.fire('Error', 'No se pudo generar el presupuesto en PDF.', 'error');
    }
};

// ==========================================
// EXPORTAR EXCEL CON FILTROS
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
            text: 'Por favor espera mientras se procesa la información.',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const token = Auth.getToken();
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Error al generar el reporte');
        }

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
            text: 'La descarga ha comenzado.',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false
        });

        bootstrap.Modal.getInstance(document.getElementById('modalFiltrosExcel')).hide();

    } catch (error) {
        Swal.close();
        Swal.fire('Error', error.message, 'error');
    }
}