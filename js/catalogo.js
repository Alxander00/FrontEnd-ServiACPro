// js/catalogo.js

let productosData = []; 
let productosFiltrados = [];
let bsModalDetalle = null;
let productoActual = null;

const container = document.getElementById('productosContainer');
const resultadosSpan = document.querySelector('#resultadosCount span');
const busquedaInput = document.getElementById('busquedaInput');

// Elementos de filtros avanzados
const btuMin = document.getElementById('btuMin');
const btuMax = document.getElementById('btuMax');
const btuMinValue = document.getElementById('btuMinValue');
const btuMaxValue = document.getElementById('btuMaxValue');

let timeoutBusqueda = null;  // para debounce

document.addEventListener('DOMContentLoaded', async () => {
    bsModalDetalle = new bootstrap.Modal(document.getElementById('modalDetalle'));
    
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
    document.getElementById('limpiarFiltros').addEventListener('click', limpiarFiltros);
    document.getElementById('ordenarSelect').addEventListener('change', () => {
        if (document.getElementById('ordenarSelect').value === 'popularidad') {
            cargarProductosPorPopularidad();
        } else {
            ordenarProductos();
        }
    });
    
    busquedaInput.addEventListener('input', () => {
        if (timeoutBusqueda) clearTimeout(timeoutBusqueda);
        timeoutBusqueda = setTimeout(() => {
            aplicarFiltros();
        }, 300);
    });

    if (btuMin && btuMax) {
        btuMin.addEventListener('input', () => {
            let min = parseInt(btuMin.value);
            let max = parseInt(btuMax.value);
            if (min > max) btuMin.value = max;
            btuMinValue.textContent = btuMin.value;
            aplicarFiltros();
        });
        btuMax.addEventListener('input', () => {
            let min = parseInt(btuMin.value);
            let max = parseInt(btuMax.value);
            if (max < min) btuMax.value = min;
            btuMaxValue.textContent = btuMax.value;
            aplicarFiltros();
        });
    }

    const ordenInicial = document.getElementById('ordenarSelect').value;
    if (ordenInicial === 'popularidad') {
        await cargarProductosPorPopularidad();
    } else {
        await cargarProductos();
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('capacidad')) {
        const capacidad = parseInt(urlParams.get('capacidad'));
        if (btuMin && btuMax) {
            btuMin.value = capacidad;
            btuMax.value = capacidad;
            btuMinValue.textContent = capacidad;
            btuMaxValue.textContent = capacidad;
        }
        aplicarFiltros();
    }
});

async function cargarProductos() {
    try {
        container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Cargando catálogo...</p></div>';
        productosData = await API.Productos.listarActivos();
        productosFiltrados = [...productosData];
        renderizarProductos();
    } catch (error) {
        container.innerHTML = `
            <div class="col-12 text-center py-5 bg-white rounded-4 shadow-sm">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h4 class="text-dark">Error de conexión</h4>
                <p class="text-muted">No pudimos conectar con la base de datos. Verifica que el servidor esté encendido.</p>
            </div>
        `;
    }
}

async function cargarProductosPorPopularidad() {
    try {
        container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Cargando productos más vendidos...</p></div>';
        productosData = await API.Productos.listarPopulares();
        productosFiltrados = [...productosData];
        renderizarProductos();
    } catch (error) {
        console.error("Error al cargar populares:", error);
        await cargarProductos();
    }
}

function renderizarProductos() {
    container.innerHTML = '';
    if (productosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5 bg-white rounded-4 shadow-sm">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h4 class="text-dark">No se encontraron productos</h4>
            </div>
        `;
        resultadosSpan.textContent = '0';
        return;
    }

    const user = Auth.getUser();
    const esClienteOInvitado = !user || user.rol === 'CLIENTE';

    productosFiltrados.forEach(prod => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-xl-4';
        
        let imgUrl = "./img/breezeless_ambiente.png"; 
        if (prod.imagenesUrls && prod.imagenesUrls.length > 0) {
            imgUrl = 'http://localhost:8080' + prod.imagenesUrls[0]; 
        }

        const badgeVendido = (prod.totalVendido && prod.totalVendido > 0) ? 
            `<span class="position-absolute top-0 start-0 m-2 badge bg-success">⭐ Más vendido</span>` : '';

        const botonCarritoHTML = esClienteOInvitado 
            ? `<button class="btn btn-primary" onclick="verDetalles(${prod.idProducto})"><i class="fas fa-cart-plus"></i></button>`
            : '';

        col.innerHTML = `
            <div class="card h-100 border-0 shadow-sm product-card">
                <div class="position-relative">
                    ${badgeVendido}
                    <img src="${imgUrl}" class="card-img-top p-3 bg-light" alt="${prod.nombre}" style="height: 200px; object-fit: contain;">
                    <span class="position-absolute top-0 end-0 m-3 badge bg-primary">${prod.capacidadBTU} BTU</span>
                </div>
                <div class="card-body d-flex flex-column">
                    <span class="text-info fw-bold small text-uppercase">${prod.nombreCategoria || 'Equipo'}</span>
                    <h5 class="card-title fw-bold text-dark mb-2">${prod.nombre}</h5>
                    <h4 class="text-primary fw-bold mb-3">$${prod.precio.toFixed(2)}</h4>
                    <div class="mt-auto d-flex gap-2">
                        <button class="btn btn-outline-primary w-100" onclick="verDetalles(${prod.idProducto})">Detalles</button>
                        ${botonCarritoHTML}
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
    resultadosSpan.textContent = productosFiltrados.length;
}

window.verDetalles = async function(id) {
    const prod = productosData.find(p => p.idProducto === id);
    if (!prod) return;
    productoActual = prod;

    const carouselInner = document.getElementById('modalCarouselInner');
    carouselInner.innerHTML = '';
    if (prod.imagenesUrls && prod.imagenesUrls.length > 0) {
        prod.imagenesUrls.forEach((url, index) => {
            const isActive = index === 0 ? 'active' : '';
            const div = document.createElement('div');
            div.className = `carousel-item ${isActive}`;
            div.innerHTML = `<img src="http://localhost:8080${url}" class="d-block w-100" style="height: 250px; object-fit: contain;">`;
            carouselInner.appendChild(div);
        });
    } else {
        carouselInner.innerHTML = `<div class="carousel-item active"><img src="./img/breezeless_ambiente.png" class="d-block w-100" style="height: 250px; object-fit: contain;"></div>`;
    }
    const carouselElement = document.getElementById('productoCarousel');
    if (carouselElement) new bootstrap.Carousel(carouselElement);

    document.getElementById('modalCategoria').textContent = prod.nombreCategoria;
    document.getElementById('modalTitulo').textContent = prod.nombre;
    document.getElementById('modalDescripcion').textContent = prod.descripcion || "Sin descripción disponible.";
    document.getElementById('modalPrecio').textContent = `$${prod.precio.toFixed(2)}`;
    document.getElementById('modalBTU').textContent = `${prod.capacidadBTU} BTU`;
    
    // Eliminamos la línea de modalEficiencia porque lo reemplazamos por el Stock
    
    document.getElementById('modalMarca').textContent = prod.marca || "ClimaPro";
    document.getElementById('modalGarantia').textContent = "1 año";
    
    // Lógica del stock añadida
    document.getElementById('modalStock').textContent = prod.stock > 0 ? `${prod.stock} unidades` : 'Agotado';
    document.getElementById('modalStock').className = prod.stock > 0 ? 'text-success fw-bold' : 'text-danger fw-bold';

    const chk = document.getElementById('checkboxInstalacion');
    if (chk) chk.checked = false;

    const resenasContainer = document.getElementById('resenasContainer');
    resenasContainer.innerHTML = '<p class="text-muted">Cargando valoraciones...</p>';
    document.getElementById('formResenaSection').style.display = 'none';
    document.getElementById('avisoResena').innerHTML = '';
    calificacionSeleccionada = 0;

    await cargarResenas(prod.idProducto);
    
    // Ahora sí llegará hasta aquí y mostrará el modal
    bsModalDetalle.show();
};

async function cargarResenas(productoId) {
    try {
        const [estadisticas, listaResenas] = await Promise.all([
            API.Resenas.obtenerEstadisticas(productoId),
            API.Resenas.listarPorProducto(productoId)
        ]);
        const promedio = estadisticas.promedio || 0;
        const total = estadisticas.total || 0;
        const starsHtml = generarEstrellas(promedio);
        document.getElementById('promedioResenas').innerHTML = `${starsHtml} <span class="small text-muted">(${total} valoraciones)</span>`;

        const container = document.getElementById('resenasContainer');
        if (!listaResenas.length) {
            container.innerHTML = '<p class="text-muted">No hay reseñas aún. Sé el primero en opinar.</p>';
        } else {
            container.innerHTML = listaResenas.map(r => `
                <div class="border-bottom pb-2 mb-2">
                    <div class="d-flex justify-content-between">
                        <strong>${r.nombreUsuario}</strong>
                        <small class="text-muted">${new Date(r.fecha).toLocaleDateString()}</small>
                    </div>
                    <div>${generarEstrellas(r.calificacion)}</div>
                    <p class="small mt-1">${r.comentario}</p>
                </div>
            `).join('');
        }

        const user = Auth.getUser();
        if (user && user.rol === 'CLIENTE') {
            const puede = await API.Resenas.puedeResenar(productoId, user.idUsuario);
            if (puede) {
                const yaResenado = listaResenas.some(r => r.idUsuario === user.idUsuario);
                if (!yaResenado) {
                    document.getElementById('formResenaSection').style.display = 'block';
                    initStarSelector();
                } else {
                    document.getElementById('avisoResena').innerHTML = 'Ya has valorado este producto. ¡Gracias por tu opinión!';
                }
            } else {
                document.getElementById('avisoResena').innerHTML = 'Para opinar debes haber comprado y recibido este producto.';
            }
        }
    } catch (error) {
        console.error('Error al cargar reseñas:', error);
        document.getElementById('resenasContainer').innerHTML = '<p class="text-danger">Error al cargar las valoraciones</p>';
    }
}

function generarEstrellas(calificacion) {
    let full = Math.floor(calificacion);
    let half = calificacion % 1 >= 0.5;
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= full) stars += '<i class="fas fa-star text-warning"></i>';
        else if (i === full+1 && half) stars += '<i class="fas fa-star-half-alt text-warning"></i>';
        else stars += '<i class="far fa-star text-warning"></i>';
    }
    return stars;
}

function initStarSelector() {
    const container = document.getElementById('ratingStars');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.className = 'far fa-star text-warning fs-5 me-1';
        star.style.cursor = 'pointer';
        star.dataset.valor = i;
        star.addEventListener('click', () => {
            calificacionSeleccionada = i;
            document.querySelectorAll('#ratingStars i').forEach(s => {
                s.className = (parseInt(s.dataset.valor) <= calificacionSeleccionada) 
                    ? 'fas fa-star text-warning fs-5 me-1' 
                    : 'far fa-star text-warning fs-5 me-1';
            });
        });
        container.appendChild(star);
    }
}

document.getElementById('btnEnviarResena')?.addEventListener('click', async () => {
    if (!calificacionSeleccionada) {
        Swal.fire('Error', 'Selecciona una calificación', 'error');
        return;
    }
    const comentario = document.getElementById('comentarioResena').value.trim();
    if (!comentario) {
        Swal.fire('Error', 'Escribe un comentario', 'error');
        return;
    }
    const user = Auth.getUser();
    if (!user) {
        Swal.fire('Error', 'Debes iniciar sesión para reseñar', 'error');
        return;
    }
    const payload = {
        idProducto: productoActual.idProducto,
        idUsuario: user.idUsuario,
        calificacion: calificacionSeleccionada,
        comentario: comentario
    };
    try {
        await API.Resenas.crear(payload);
        Swal.fire('Gracias', 'Tu reseña ha sido publicada', 'success');
        await cargarResenas(productoActual.idProducto);
        document.getElementById('formResenaSection').style.display = 'none';
        document.getElementById('comentarioResena').value = '';
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
});

document.getElementById('modalAddCart').addEventListener('click', () => {
    if (productoActual) {
        const incluyeInstalacion = document.getElementById('checkboxInstalacion').checked;
        agregarAlCarrito(productoActual.idProducto, incluyeInstalacion);
    }
});

window.agregarAlCarrito = function(id, incluyeInstalacion = false) {
    if (!Auth.requireAuth('login.html')) return;
    const user = Auth.getUser();
    if (user && user.rol !== 'CLIENTE') {
        Swal.fire({ icon: 'error', title: 'Acción denegada', text: 'Tu cuenta no puede realizar compras.', confirmButtonColor: '#dc3545' });
        return;
    }
    const prod = productosData.find(p => p.idProducto === id);
    if (!prod) return;
    let imgUrl = "./img/breezeless_ambiente.png";
    if (prod.imagenesUrls && prod.imagenesUrls.length > 0) imgUrl = 'http://localhost:8080' + prod.imagenesUrls[0];
    Carrito.addItem({ id: prod.idProducto, nombre: prod.nombre, precio: prod.precio, imagen: imgUrl, incluyeInstalacion });
    Swal.fire({ icon: 'success', title: '¡Agregado!', text: `"${prod.nombre}" ${incluyeInstalacion ? 'con instalación' : 'solo equipo'} añadido.`, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
    bsModalDetalle.hide();
};

function aplicarFiltros() {
    const cat = document.getElementById('filtroCategoria').value;
    const marca = document.getElementById('filtroMarca').value;
    const btuMinVal = parseInt(document.getElementById('btuMin')?.value) || 0;
    const btuMaxVal = parseInt(document.getElementById('btuMax')?.value) || 999999;
    const minPrecio = parseFloat(document.getElementById('precioMin').value) || 0;
    const maxPrecio = parseFloat(document.getElementById('precioMax').value) || 999999;
    const busqueda = busquedaInput.value.trim().toLowerCase();

    productosFiltrados = productosData.filter(p => {
        if (cat !== 'todas' && p.nombreCategoria !== cat) return false;
        if (marca !== 'todas' && p.marca !== marca) return false;
        if (p.capacidadBTU < btuMinVal || p.capacidadBTU > btuMaxVal) return false;
        if (p.precio < minPrecio || p.precio > maxPrecio) return false;
        if (busqueda && !p.nombre.toLowerCase().includes(busqueda)) return false;
        return true;
    });
    ordenarProductos();
}

function ordenarProductos() {
    const orden = document.getElementById('ordenarSelect').value;
    if (orden === 'precioAsc') productosFiltrados.sort((a, b) => a.precio - b.precio);
    else if (orden === 'precioDesc') productosFiltrados.sort((a, b) => b.precio - a.precio);
    else if (orden === 'popularidad') productosFiltrados.sort((a, b) => (b.totalVendido || 0) - (a.totalVendido || 0));
    renderizarProductos();
}

function limpiarFiltros() {
    document.getElementById('filtroCategoria').value = 'todas';
    document.getElementById('filtroMarca').value = 'todas';
    if (btuMin) btuMin.value = 0;
    if (btuMax) btuMax.value = 50000;
    if (btuMinValue) btuMinValue.textContent = '0';
    if (btuMaxValue) btuMaxValue.textContent = '50000';
    document.getElementById('precioMin').value = '0';
    document.getElementById('precioMax').value = '3000';
    busquedaInput.value = '';
    document.getElementById('ordenarSelect').value = 'relevancia';
    if (document.getElementById('ordenarSelect').value === 'popularidad') {
        cargarProductosPorPopularidad();
    } else {
        productosFiltrados = [...productosData];
        renderizarProductos();
    }
}

// ========== HISTORIAL DE PRECIOS ==========
let historialChart = null;

document.getElementById('btnVerHistorialPrecios')?.addEventListener('click', async () => {
    if (!productoActual) return;
    const productoId = productoActual.idProducto;
    
    try {
        const historial = await API.request(`/productos/${productoId}/historial-precios`);
        const modal = new bootstrap.Modal(document.getElementById('modalHistorialPrecios'));
        modal.show();
        
        setTimeout(() => {
            const ctx = document.getElementById('historialChart').getContext('2d');
            if (historialChart) historialChart.destroy();
            
            if (!historial || historial.length === 0) {
                document.getElementById('historialEmptyMsg').classList.remove('d-none');
                document.getElementById('historialChart').style.display = 'none';
                return;
            }
            document.getElementById('historialEmptyMsg').classList.add('d-none');
            document.getElementById('historialChart').style.display = 'block';
            
            const fechas = historial.map(h => new Date(h.fechaCambio).toLocaleDateString());
            const precios = historial.map(h => h.precio);
            
            historialChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: fechas,
                    datasets: [{
                        label: 'Precio ($)',
                        data: precios,
                        borderColor: '#0d6efd',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        fill: true,
                        tension: 0.1,
                        pointRadius: 4,
                        pointBackgroundColor: '#0d6efd'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `$${ctx.raw.toFixed(2)}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: (value) => '$' + value.toFixed(2)
                            }
                        }
                    }
                }
            });
        }, 100);
    } catch (error) {
        Swal.fire('Error', 'No se pudo cargar el historial de precios.', 'error');
    }
});