// js/catalogo.js

let productosData = []; 
let productosFiltrados = [];
let bsModalDetalle = null;
let productoActual = null;
let calificacionSeleccionada = 0;

// Variables de paginación
let currentPage = 0;
const pageSize = 6;
let totalPages = 1;

const container = document.getElementById('productosContainer');
const resultadosSpan = document.querySelector('#resultadosCount span');
const busquedaInput = document.getElementById('busquedaInput');

let timeoutBusqueda = null;

document.addEventListener('DOMContentLoaded', async () => {
    bsModalDetalle = new bootstrap.Modal(document.getElementById('modalDetalle'));

    // Eventos de filtros, orden, WhatsApp, etc.
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
    document.getElementById('limpiarFiltros').addEventListener('click', limpiarFiltros);
    document.getElementById('ordenarSelect').addEventListener('change', () => {
        if (document.getElementById('ordenarSelect').value === 'popularidad') {
            cargarProductosPorPopularidad();
        } else {
            ordenarProductos();
        }
    });

    // Rango de precio: actualizar valor mostrado
    const precioRango = document.getElementById('precioMaxRango');
    if (precioRango) {
        precioRango.addEventListener('input', () => {
            document.getElementById('valPrecioMax').textContent = precioRango.value;
            document.getElementById('precioMax').value = precioRango.value;
        });
    }

    // Botón WhatsApp
    document.getElementById('btnWhatsApp')?.addEventListener('click', () => {
        if (!productoActual) return;
        const numeroWhatsApp = "50371584643";
        const mensaje = `Hola Servi A/C Pro, estoy interesado en el equipo *${productoActual.nombre}* (${productoActual.capacidadBTU} BTU) que está en su catálogo a $${productoActual.precio.toFixed(2)}. ¿Me podrían dar más información?`;
        const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    });

    // 🔍 CAPTURA INTELIGENTE DE LA URL
    const urlParams = new URLSearchParams(window.location.search);
    const capacidadUrl = urlParams.get('capacidad');

    if (capacidadUrl) {
        const capacidadNum = parseInt(capacidadUrl);
        if (!isNaN(capacidadNum)) {
            const rango = 2000;
            const min = Math.max(0, capacidadNum - rango);
            const max = capacidadNum + rango;

            const btuMinRango = document.getElementById('btuMinRango');
            const btuMaxRango = document.getElementById('btuMaxRango');
            const btuMinVal = document.getElementById('btuMinVal');
            const btuMaxVal = document.getElementById('btuMaxVal');

            if (btuMinRango && btuMaxRango) {
                btuMinRango.value = min;
                btuMaxRango.value = max;
                if (btuMinVal) btuMinVal.textContent = min;
                if (btuMaxVal) btuMaxVal.textContent = max;
            }

            await cargarProductos(0, false, {
                btuMin: min,
                btuMax: max
            });
        } else {
            await cargarProductos(0, false, {});
        }
    } else {
        await cargarProductos(0, false, {});
    }

    // Cargar categorías dinámicamente
    await cargarCategorias();
});

async function cargarProductos(page = 0, esCambioDePagina = false, filtros = {}) {
    try {
        container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Cargando catálogo...</p></div>';

        const params = new URLSearchParams();
        params.append('page', page);
        params.append('size', pageSize);

        // Filtros (sin marca)
        if (filtros.categoria && filtros.categoria !== 'todas') params.append('categoria', filtros.categoria);
        if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
        if (filtros.precioMin !== undefined) params.append('precioMin', filtros.precioMin);
        if (filtros.precioMax !== undefined) params.append('precioMax', filtros.precioMax);
        if (filtros.btuMin !== undefined) params.append('btuMin', filtros.btuMin);
        if (filtros.btuMax !== undefined) params.append('btuMax', filtros.btuMax);

        // Manejo de orden y dirección
        let orden = filtros.orden || 'idProducto';
        let direccion = 'ASC';
        
        // Mapear 'relevancia' a 'idProducto' (más recientes)
        if (orden === 'relevancia' || orden === 'idProducto') {
            orden = 'idProducto';
            direccion = 'DESC'; // Los más recientes primero (ID más alto)
        } else if (orden === 'precioAsc') { 
            orden = 'precio'; 
            direccion = 'ASC'; 
        } else if (orden === 'precioDesc') { 
            orden = 'precio'; 
            direccion = 'DESC'; 
        } else if (orden === 'popularidad') {
            // Si es popularidad, usamos el endpoint separado y salimos
            await cargarProductosPorPopularidad();
            return;
        }
        // Para cualquier otro caso, usamos idProducto por defecto
        
        params.append('orden', orden);
        params.append('direccion', direccion);

        // console.log('🔍 URL:', `/productos?${params.toString()}`); // Para depurar

        const response = await API.request(`/productos?${params.toString()}`);

        if (response && response.content) {
            productosData = response.content;
            currentPage = response.number;
            totalPages = response.totalPages;
        } else {
            productosData = response || [];
            currentPage = 0;
            totalPages = 1;
        }

        productosFiltrados = [...productosData];
        renderizarProductos();
        actualizarPaginacion();

        if (esCambioDePagina) {
            setTimeout(() => {
                const elementoDestino = document.getElementById("productosContainer") || container;
                if (elementoDestino) {
                    const offsetTop = elementoDestino.offsetTop - 120;
                    window.scrollTo({ top: offsetTop > 0 ? offsetTop : 0, behavior: "smooth" });
                }
            }, 60);
        }
    } catch (error) {
        console.error("Error al cargar productos:", error);
        container.innerHTML = `
            <div class="col-12 text-center py-5 bg-white rounded-4 shadow-sm">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h4 class="text-dark">Error de conexión</h4>
                <p class="text-muted">No pudimos conectar con la base de datos. Verifica que el servidor esté encendido.</p>
            </div>
        `;
    }
}

function actualizarPaginacion() {
    const pagContainer = document.getElementById('paginacionContainer');
    if (!pagContainer) return;
    
    pagContainer.style.display = 'flex';
    
    document.getElementById('paginaActual').textContent = currentPage + 1;
    document.getElementById('totalPaginas').textContent = totalPages === 0 ? 1 : totalPages;
    
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');

    if (btnAnterior) {
        btnAnterior.disabled = (currentPage === 0);
        // Clonamos el botón para matar cualquier evento duplicado anterior y asegurar clics infinitos
        const nuevoBtnAnterior = btnAnterior.cloneNode(true);
        btnAnterior.parentNode.replaceChild(nuevoBtnAnterior, btnAnterior);
        
        nuevoBtnAnterior.addEventListener('click', () => {
            if (currentPage > 0) {
                cargarProductos(currentPage - 1, true);
            }
        });
    }

    if (btnSiguiente) {
        btnSiguiente.disabled = (currentPage >= totalPages - 1);
        // Clonamos el botón para matar duplicados y garantizar fluidez total
        const nuevoBtnSiguiente = btnSiguiente.cloneNode(true);
        btnSiguiente.parentNode.replaceChild(nuevoBtnSiguiente, btnSiguiente);
        
        nuevoBtnSiguiente.addEventListener('click', () => {
            if (currentPage < totalPages - 1) {
                cargarProductos(currentPage + 1, true);
            }
        });
    }
}

// NUEVO: Función para actualizar los botones de paginación de forma infalible
function actualizarPaginacion() {
    const pagContainer = document.getElementById('paginacionContainer');
    if (!pagContainer) return;
    
    pagContainer.style.display = 'flex';
    
    const spanPaginaActual = document.getElementById('paginaActual');
    const spanTotalPaginas = document.getElementById('totalPaginas');
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');

    if (spanPaginaActual) spanPaginaActual.textContent = currentPage + 1;
    if (spanTotalPaginas) spanTotalPaginas.textContent = totalPages === 0 ? 1 : totalPages;
    
    if (btnAnterior) btnAnterior.disabled = (currentPage === 0);
    if (btnSiguiente) btnSiguiente.disabled = (currentPage >= totalPages - 1);
}

document.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const obtenerFiltrosActuales = () => {
        const cat = document.getElementById('filtroCategoria').value;
        const busqueda = busquedaInput.value.trim().toLowerCase();
        const precioMin = parseFloat(document.getElementById('precioMin')?.value) || 0;
        const precioMax = parseFloat(document.getElementById('precioMax')?.value) || 999999;
        const btuMinVal = parseInt(document.getElementById('btuMinRango')?.value) || 0;
        const btuMaxVal = parseInt(document.getElementById('btuMaxRango')?.value) || 50000;
        const orden = document.getElementById('ordenarSelect').value;
        return {
            categoria: cat,
            busqueda: busqueda,
            precioMin: precioMin,
            precioMax: precioMax,
            btuMin: btuMinVal,
            btuMax: btuMaxVal,
            orden: orden === 'popularidad' ? 'popularidad' : undefined
        };
    };

    if (target.id === 'btnSiguiente' && !target.disabled) {
        if (currentPage < totalPages - 1) {
            const filtros = obtenerFiltrosActuales();
            cargarProductos(currentPage + 1, true, filtros);
        }
    }
    if (target.id === 'btnAnterior' && !target.disabled) {
        if (currentPage > 0) {
            const filtros = obtenerFiltrosActuales();
            cargarProductos(currentPage - 1, true, filtros);
        }
    }
});

async function cargarProductosPorPopularidad() {
    try {
        container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Cargando productos más vendidos...</p></div>';
        const response = await API.Productos.listarPopulares();
        productosData = response || [];
        productosFiltrados = [...productosData];
        renderizarProductos();
        
        // Ocultar paginación en populares ya que es una query estática de top 5
        const pagContainer = document.getElementById('paginacionContainer');
        if (pagContainer) pagContainer.style.display = 'none';

    } catch (error) {
        console.error("Error al cargar populares:", error);
        await cargarProductos(0);
    }
}

function renderizarProductos() {
    container.innerHTML = '';
    
    // Pantalla limpia si no hay resultados
    if (productosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5 bg-white rounded-4 shadow-sm border border-light">
                <i class="fas fa-box-open fa-3x text-muted mb-3 opacity-50"></i>
                <h4 class="text-dark fw-bold">No se encontraron equipos</h4>
                <p class="text-muted">Intenta ajustando los filtros de búsqueda.</p>
            </div>
        `;
        if (resultadosSpan) resultadosSpan.textContent = '0';
        return;
    }

    const user = Auth.getUser();
    const esClienteOInvitado = !user || user.rol === 'CLIENTE';

    productosFiltrados.forEach(prod => {
        // Lógica inteligente para limpiar marca y extraer la descripción
        const datosProcesados = procesarDatosProducto(prod);

        const col = document.createElement('div');
        // Cuadrícula perfecta: 1 celular, 2 tablet, 3 PC
        col.className = 'col-12 col-md-6 col-xl-4 mb-4 d-flex';
        
        let imgUrl = "./img/breezeless_ambiente.png";
        if (prod.imagenesUrls && prod.imagenesUrls.length > 0) {
            imgUrl = prod.imagenesUrls[0];
        }

        const badgeVendido = (prod.totalVendido && prod.totalVendido > 0) ? 
            `<span class="badge bg-danger text-white position-absolute top-0 start-0 m-3 px-3 py-2 rounded-pill shadow-sm" style="font-size: 0.75rem; z-index: 10;">🔥 Más vendido</span>` : '';

        const badgeStock = prod.stock <= 0 
            ? `<span class="badge bg-secondary position-absolute top-0 start-0 m-3 px-3 py-2 rounded-pill shadow-sm" style="font-size: 0.75rem; z-index: 10; ${prod.totalVendido > 0 ? 'margin-top: 3rem !important;' : ''}">Agotado</span>` 
            : '';

        // Botón con tamaño ajustado
        const botonCarritoHTML = esClienteOInvitado 
            ? `<button class="btn ${prod.stock <= 0 ? 'btn-secondary' : 'btn-primary'} w-100 rounded-pill fw-bold shadow-sm" 
                style="padding: 10px 0; font-size: 0.95rem; transition: transform 0.2s;" 
                ${prod.stock <= 0 ? 'disabled' : ''} 
                onclick="event.stopPropagation(); agregarAlCarrito(${prod.idProducto})">
                <i class="fas ${prod.stock <= 0 ? 'fa-times-circle' : 'fa-shopping-cart'} me-2"></i> ${prod.stock <= 0 ? 'AGOTADO' : 'Agregar al carrito'}
               </button>`
            : '';

        // Chips
        const chipBTU = prod.capacidadBTU ? `<span class="badge rounded-pill bg-light text-dark border px-2 py-1">${prod.capacidadBTU} BTU</span>` : '';
        const chipCategoria = prod.nombreCategoria ? `<span class="badge rounded-pill bg-light text-dark border px-2 py-1">${prod.nombreCategoria}</span>` : '';

        col.innerHTML = `
            <div class="card w-100 border-0 shadow-sm rounded-4 d-flex flex-column" 
                 style="background: white; overflow: hidden; transition: all 0.25s ease; cursor: pointer;" 
                 onclick="verDetalles(${prod.idProducto})" 
                 onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 15px 40px rgba(0,0,0,0.15)';" 
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)';">
                
                <div class="position-relative d-flex justify-content-center align-items-center" style="height: 200px; background: #f8f9fa;">
                    ${badgeVendido}
                    ${badgeStock}
                    <img src="${imgUrl}" class="img-fluid p-3" alt="${prod.nombre}" style="max-height: 100%; object-fit: contain; transition: transform 0.4s ease;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'">
                </div>
                
                <div class="card-body d-flex flex-column p-3">
                    <small class="text-muted text-uppercase fw-bold mb-1" style="font-size: 0.7rem; letter-spacing: 1px;">
                        ${datosProcesados.marca}
                    </small>
                    
                    <h5 class="text-dark fw-bold mb-1" 
                        style="font-size: 1.1rem; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.6em; line-height: 1.3;">
                        ${prod.nombre}
                    </h5>

                    <p class="text-secondary mb-2 mt-1" style="display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 0.85rem; line-height: 1.4;">
                        ${datosProcesados.descripcion}
                    </p>
                    
                    <div class="d-flex flex-wrap gap-2 mb-3 mt-1">
                        ${chipBTU}
                        ${chipCategoria}
                    </div>
                    
                    <div class="mt-auto pt-1">
                        <div class="mb-2">
                            <span class="text-dark" style="font-size: 1.8rem; font-weight: 900; letter-spacing: -1px;">
                                $${prod.precio.toFixed(2)}
                            </span>
                        </div>
                        
                        ${botonCarritoHTML}
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });

    if (resultadosSpan) resultadosSpan.textContent = productosFiltrados.length;
}

window.verDetalles = async function(id) {
    const prod = productosData.find(p => p.idProducto === id);
    if (!prod) return;
    productoActual = prod;

    // ===== 1. CARGAR IMÁGENES EN EL CARRUSEL =====
    const carouselInner = document.getElementById('modalCarouselInner');
    carouselInner.innerHTML = '';
    
    if (prod.imagenesUrls && prod.imagenesUrls.length > 0) {
        prod.imagenesUrls.forEach((url, index) => {
            const isActive = index === 0 ? 'active' : '';
            const div = document.createElement('div');
            div.className = `carousel-item ${isActive}`;
            div.innerHTML = `<img src="${url}" class="d-block w-100" alt="${prod.nombre}" loading="lazy">`;
            carouselInner.appendChild(div);
        });
    } else {
        carouselInner.innerHTML = `
            <div class="carousel-item active">
                <img src="./img/breezeless_ambiente.png" class="d-block w-100" alt="${prod.nombre}" loading="lazy">
            </div>
        `;
    }
    
    // Reiniciar carrusel
    const carouselElement = document.getElementById('productoCarousel');
    if (carouselElement) {
        const bsCarousel = bootstrap.Carousel.getInstance(carouselElement);
        if (bsCarousel) bsCarousel.dispose();
        new bootstrap.Carousel(carouselElement);
    }

// ===== 2. DATOS BÁSICOS =====
    // 🚨 LIMPIAMOS LOS DATOS ANTES DE MOSTRARLOS
    const datosProcesados = procesarDatosProducto(prod);

    document.getElementById('modalCategoria').textContent = prod.nombreCategoria || 'Equipo';
    document.getElementById('modalTitulo').textContent = prod.nombre;
    
    // Aquí inyectamos la descripción y marca ya separadas
    document.getElementById('modalDescripcion').textContent = datosProcesados.descripcion;
    document.getElementById('modalMarca').textContent = datosProcesados.marca;
    
    document.getElementById('modalPrecio').textContent = `$${prod.precio.toFixed(2)}`;
    document.getElementById('modalBTU').textContent = `${prod.capacidadBTU} BTU`;
    document.getElementById('modalGarantia').textContent = "1 año";

    // ===== 3. STOCK (EN IMAGEN + EN INFORMACIÓN) =====
    // Elementos en la imagen (barra inferior)
    const stockEl = document.getElementById('modalStockImagen');
    const stockBadgeImagen = document.getElementById('modalStockBadgeImagen');
    
    // Elementos en la sección de información
    const stockBadgeInfo = document.getElementById('modalStockBadgeInfo');
    const stockCantidadInfo = document.getElementById('modalStockCantidadInfo');

    if (prod.stock > 0) {
        // === IMAGEN ===
        stockEl.textContent = `${prod.stock} unidades disponibles`;
        stockEl.style.color = '#198754';
        stockBadgeImagen.className = 'badge bg-success px-4 py-2 rounded-pill fs-6';
        stockBadgeImagen.innerHTML = `<i class="fas fa-check-circle me-1"></i> En stock`;
        
        // === INFORMACIÓN ===
        stockBadgeInfo.className = 'badge bg-success px-4 py-2 rounded-pill fs-6';
        stockBadgeInfo.innerHTML = `<i class="fas fa-check-circle me-1"></i> En stock`;
        stockCantidadInfo.textContent = `(${prod.stock} unidades)`;
        stockCantidadInfo.style.color = '#198754';
    } else {
        // === IMAGEN ===
        stockEl.textContent = 'Sin stock disponible';
        stockEl.style.color = '#dc3545';
        stockBadgeImagen.className = 'badge bg-danger px-4 py-2 rounded-pill fs-6';
        stockBadgeImagen.innerHTML = `<i class="fas fa-times-circle me-1"></i> Agotado`;
        
        // === INFORMACIÓN ===
        stockBadgeInfo.className = 'badge bg-danger px-4 py-2 rounded-pill fs-6';
        stockBadgeInfo.innerHTML = `<i class="fas fa-times-circle me-1"></i> Agotado`;
        stockCantidadInfo.textContent = '(0 unidades)';
        stockCantidadInfo.style.color = '#dc3545';
    }

    // ===== 4. BOTÓN AÑADIR AL CARRITO =====
    const btnAddCart = document.getElementById('modalAddCart');
    if (prod.stock <= 0) {
        btnAddCart.disabled = true;
        btnAddCart.innerHTML = '<i class="fas fa-times-circle me-2"></i>Agotado';
        btnAddCart.className = 'btn btn-secondary fw-bold py-3 rounded-pill shadow-sm';
    } else {
        btnAddCart.disabled = false;
        btnAddCart.innerHTML = '<i class="fas fa-cart-plus me-2"></i>Añadir al Carrito';
        btnAddCart.className = 'btn btn-primary fw-bold py-3 rounded-pill shadow-sm';
    }

    // ===== 5. RESETEAR CHECKBOX DE INSTALACIÓN =====
    const chk = document.getElementById('checkboxInstalacion');
    if (chk) chk.checked = false;

    // ===== 6. CARGAR RESEÑAS =====
    const resenasContainer = document.getElementById('resenasContainer');
    resenasContainer.innerHTML = '<div class="text-center py-2"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>';
    document.getElementById('formResenaSection').style.display = 'none';
    document.getElementById('avisoResena').innerHTML = '';
    calificacionSeleccionada = 0;

    await cargarResenas(prod.idProducto);

    // ===== 7. MOSTRAR MODAL =====
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

        const textoPromedio = `${starsHtml} <span class="text-muted small">(${total} valoraciones)</span>`;
        document.getElementById('promedioResenas').innerHTML = textoPromedio;
        document.getElementById('promedioResenasDetalle').innerHTML = textoPromedio;

        const container = document.getElementById('resenasContainer');
        if (!listaResenas || listaResenas.length === 0) {
            container.innerHTML = `
                <div class="text-center py-3 text-muted">
                    <i class="fas fa-comment-slash fa-2x mb-2 opacity-25"></i>
                    <p class="small mb-0">No hay reseñas aún.<br>Sé el primero en opinar.</p>
                </div>
            `;
        } else {
            container.innerHTML = listaResenas.map(r => `
                <div class="d-flex align-items-start gap-2 border-bottom pb-2 mb-2">
                    <div class="bg-primary bg-opacity-10 rounded-circle p-2" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <span class="fw-bold text-primary small">${(r.nombreUsuario || 'U').charAt(0).toUpperCase()}</span>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center">
                            <strong class="small">${r.nombreUsuario || 'Usuario'}</strong>
                            <small class="text-muted" style="font-size: 0.65rem;">${new Date(r.fecha).toLocaleDateString()}</small>
                        </div>
                        <div class="small">${generarEstrellas(r.calificacion)}</div>
                        <p class="small text-muted mt-1 mb-0">${r.comentario || 'Sin comentario.'}</p>
                    </div>
                </div>
            `).join('');
        }

        // Verificar si el usuario puede reseñar
        const user = Auth.getUser();
        if (user && user.rol === 'CLIENTE') {
            try {
                const puede = await API.Resenas.puedeResenar(productoId, user.idUsuario);
                if (puede) {
                    const yaResenado = listaResenas.some(r => r.idUsuario === user.idUsuario);
                    if (!yaResenado) {
                        document.getElementById('formResenaSection').style.display = 'block';
                        initStarSelector();
                        document.getElementById('avisoResena').innerHTML = '';
                    } else {
                        document.getElementById('avisoResena').innerHTML = '✅ Ya has valorado este producto. ¡Gracias!';
                    }
                } else {
                    document.getElementById('avisoResena').innerHTML = '🔒 Debes comprar este producto para opinar.';
                }
            } catch (error) {
                console.error('Error al verificar permiso para reseñar:', error);
                document.getElementById('avisoResena').innerHTML = '⚠️ Error al verificar permisos.';
            }
        }
    } catch (error) {
        console.error('Error al cargar reseñas:', error);
        document.getElementById('resenasContainer').innerHTML = `
            <div class="text-center py-3 text-danger">
                <i class="fas fa-exclamation-circle fa-2x mb-2"></i>
                <p class="small mb-0">Error al cargar las valoraciones</p>
            </div>
        `;
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
        UI.error(error.message);
    }
});

document.getElementById('modalAddCart').addEventListener('click', () => {
    if (productoActual) {
        const incluyeInstalacion = document.getElementById('checkboxInstalacion').checked;
        agregarAlCarrito(productoActual.idProducto, incluyeInstalacion);
    }
});

window.agregarAlCarrito = async function(id, incluyeInstalacion = false) {
    // 1. Verificar autenticación
    if (!Auth.requireAuth('login.html')) return;
    const user = Auth.getUser();
    if (user && user.rol !== 'CLIENTE') {
        Swal.fire({ icon: 'error', title: 'Acción denegada', text: 'Tu cuenta no puede realizar compras.', confirmButtonColor: '#dc3545' });
        return;
    }

    // 2. ✅ Consultar stock disponible
    try {
        const stock = await API.Productos.stockDisponible(id);
        if (stock <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Producto agotado',
                text: 'Lo sentimos, este producto no tiene stock disponible.',
                confirmButtonColor: '#dc3545'
            });
            return;
        }
    } catch (error) {
        console.error('Error al consultar stock:', error);
        Swal.fire({
            icon: 'warning',
            title: 'Error de conexión',
            text: 'No pudimos verificar el stock. Intenta de nuevo.',
            confirmButtonColor: '#0d6efd'
        });
        return;
    }

    // 3. Buscar el producto y agregar al carrito
    const prod = productosData.find(p => p.idProducto === id);
    if (!prod) return;
    
    let imgUrl = "./img/breezeless_ambiente.png";
    if (prod.imagenesUrls && prod.imagenesUrls.length > 0) imgUrl = prod.imagenesUrls[0];
    
    Carrito.addItem({ 
        id: prod.idProducto, 
        nombre: prod.nombre, 
        precio: prod.precio, 
        imagen: imgUrl, 
        incluyeInstalacion 
    });
    
    Swal.fire({
        icon: 'success',
        title: '¡Agregado!',
        text: `"${prod.nombre}" ${incluyeInstalacion ? 'con instalación' : 'solo equipo'} añadido.`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
    });
    bsModalDetalle.hide();
};

function aplicarFiltros() {
    const selectCat = document.getElementById('filtroCategoria');
    const inputBusqueda = document.getElementById('busquedaInput');
    const selectOrden = document.getElementById('ordenarSelect');

    const cat = selectCat ? selectCat.value : 'todas';
    const busqueda = inputBusqueda ? inputBusqueda.value.trim().toLowerCase() : '';

    const inputPrecioMin = document.getElementById('precioMin');
    const inputPrecioMax = document.getElementById('precioMax');
    const precioMin = inputPrecioMin ? parseFloat(inputPrecioMin.value) || 0 : 0;
    const precioMax = inputPrecioMax ? parseFloat(inputPrecioMax.value) || 999999 : 999999;

    const inputBtuMin = document.getElementById('btuMinRango');
    const inputBtuMax = document.getElementById('btuMaxRango');
    const btuMinVal = inputBtuMin ? parseInt(inputBtuMin.value) || 0 : 0;
    const btuMaxVal = inputBtuMax ? parseInt(inputBtuMax.value) || 50000 : 50000;

    const orden = selectOrden ? selectOrden.value : 'relevancia';

    const filtros = {
        categoria: cat,
        busqueda: busqueda,
        precioMin: precioMin,
        precioMax: precioMax,
        btuMin: btuMinVal,
        btuMax: btuMaxVal,
        orden: orden === 'relevancia' ? undefined : orden  // No enviar 'relevancia'
    };

    cargarProductos(0, false, filtros);
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
    document.getElementById('btuMinRango').value = 0;
    document.getElementById('btuMaxRango').value = 50000;
    document.getElementById('btuMinVal').textContent = '0';
    document.getElementById('btuMaxVal').textContent = '50000';
    document.getElementById('precioMin').value = '0';
    document.getElementById('precioMax').value = '3000';
    document.getElementById('precioMaxRango').value = '3000';
    document.getElementById('valPrecioMax').textContent = '3000';
    busquedaInput.value = '';
    document.getElementById('ordenarSelect').value = 'relevancia';

    cargarProductos(0, false, {});
}

// ==========================================
// FUNCIÓN PARA SEPARAR MARCA Y DESCRIPCIÓN
// ==========================================
function procesarDatosProducto(prod) {
    let marca = prod.marca;
    let descripcion = prod.descripcion || "Sin descripción disponible.";

    // Si no hay marca, pero la descripción dice "Marca: [Algo] - [Algo]"
    if (!marca && prod.descripcion && prod.descripcion.toLowerCase().includes("marca:")) {
        // Cortamos el texto por el guion "-"
        let partes = prod.descripcion.split("-");
        
        if (partes.length > 1) {
            // Limpiamos la primera parte para quitarle la palabra "Marca:" y dejar solo "LG"
            marca = partes[0].replace(/Marca:/i, '').trim();
            // Juntamos el resto por si la descripción original tenía más guiones
            descripcion = partes.slice(1).join("-").trim(); 
        }
    }

    return {
        marca: marca || "Genérica", // Si de plano no hay nada, dirá "Genérica"
        descripcion: descripcion
    };
}

// ==========================================
// EXPORTACIÓN A PDF: MODO "TABLA PROFESIONAL BLINDADA"
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const btnDescargarPDF = document.getElementById('btnDescargarPDF');
    
    if(btnDescargarPDF) {
        btnDescargarPDF.addEventListener('click', async function() {
            const textoOriginal = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Generando PDF Profesional...';
            this.disabled = true;

            try {
                const response = await API.request('/productos?page=0&size=100');
                const catalogoCompleto = response.content || response || [];

                if (catalogoCompleto.length === 0) {
                    Swal.fire('Catálogo vacío', 'No hay productos disponibles para exportar.', 'info');
                    this.innerHTML = textoOriginal;
                    this.disabled = false;
                    return;
                }

                const pdfContainer = document.createElement('div');
                pdfContainer.style.width = '750px'; // Ancho fijo seguro para formato carta
                pdfContainer.style.margin = '0 auto';
                pdfContainer.style.padding = '20px';
                pdfContainer.style.background = '#ffffff';
                pdfContainer.style.fontFamily = "'Montserrat', sans-serif";
                pdfContainer.style.boxSizing = 'border-box';
                pdfContainer.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');
                pdfContainer.style.setProperty('print-color-adjust', 'exact', 'important');

                // ENCABEZADO VIBRANTE
                const fechaActual = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                pdfContainer.innerHTML = `
                    <div style="background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%); color: white; padding: 25px 20px; text-align: center; border-radius: 12px; margin-bottom: 25px;">
                        <h1 style="margin: 0; font-size: 2.5rem; font-weight: 900; letter-spacing: -1px;">Servi A/C Pro</h1>
                        <h4 style="margin: 8px 0 0 0; font-weight: 600; font-size: 1.1rem; opacity: 0.95; letter-spacing: 1px; text-transform: uppercase;">Catálogo Oficial de Equipos</h4>
                        <div style="margin-top: 12px; display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 5px 18px; border-radius: 50px; font-size: 0.8rem; font-weight: bold; border: 1px solid rgba(255,255,255,0.3);">
                            Edición Especial: ${fechaActual}
                        </div>
                    </div>
                `;

                // CONSTRUCCIÓN USANDO TABLA (Garantiza 3 columnas simétricas sin que se rompa el diseño)
                const tabla = document.createElement('table');
                tabla.style.width = '100%';
                tabla.style.borderCollapse = 'separate';
                tabla.style.borderSpacing = '12px'; // Espacio limpio entre tarjetas

                let tbody = document.createElement('tbody');
                let filaActual = document.createElement('tr');
                let contadorCol = 0;

                catalogoCompleto.forEach((prod, index) => {
                    const datosProcesados = procesarDatosProducto(prod);
                    let imgUrl = (prod.imagenesUrls && prod.imagenesUrls.length > 0) ? prod.imagenesUrls[0] : "./img/breezeless_ambiente.png";

                    const celda = document.createElement('td');
                    celda.style.width = '33.33%';
                    celda.style.verticalAlign = 'top';
                    celda.style.background = '#ffffff';
                    celda.style.border = '1px solid #e2e8f0';
                    celda.style.borderRadius = '12px';
                    celda.style.overflow = 'hidden';
                    celda.style.padding = '0';
                    celda.style.boxSizing = 'border-box';
                    celda.style.pageBreakInside = 'avoid';
                    celda.style.breakInside = 'avoid';

                    celda.innerHTML = `
                        <div style="height: 150px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; padding: 10px; box-sizing: border-box;">
                            <img src="${imgUrl}" style="max-height: 130px; max-width: 100%; object-fit: contain;">
                        </div>
                        <div style="padding: 15px; text-align: left; box-sizing: border-box;">
                            <div style="margin-bottom: 6px;">
                                <span style="background: #e0f2fe; color: #0369a1; font-size: 0.6rem; font-weight: 800; padding: 3px 6px; border-radius: 4px; text-transform: uppercase;">${prod.capacidadBTU ? prod.capacidadBTU + ' BTU' : 'Inverter'}</span>
                            </div>
                            <small style="color: #64748b; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">${datosProcesados.marca}</small>
                            <h5 style="color: #0f172a; font-size: 0.9rem; font-weight: 800; margin: 0 0 6px 0; height: 2.4em; overflow: hidden; line-height: 1.2;">${prod.nombre}</h5>
                            <p style="color: #475569; font-size: 0.7rem; height: 2.6em; overflow: hidden; margin: 0 0 10px 0; line-height: 1.3;">${datosProcesados.descripcion}</p>
                            
                            <div style="border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 8px;">
                                <span style="color: #0d6efd; font-size: 1.3rem; font-weight: 900; display: block;">$${prod.precio.toFixed(2)}</span>
                            </div>
                        </div>
                    `;

                    filaActual.appendChild(celda);
                    contadorCol++;

                    // Cada 3 productos, cerramos la fila y abrimos otra nueva
                    if (contadorCol === 3) {
                        tbody.appendChild(filaActual);
                        filaActual = document.createElement('tr');
                        contadorCol = 0;
                    }
                });

                // Si quedan productos sobrantes en la última fila, rellenamos con celdas vacías para mantener estructura
                if (contadorCol > 0) {
                    while (contadorCol < 3) {
                        const celdaVacia = document.createElement('td');
                        celdaVacia.style.width = '33.33%';
                        filaActual.appendChild(celdaVacia);
                        contadorCol++;
                    }
                    tbody.appendChild(filaActual);
                }

                tabla.appendChild(tbody);
                pdfContainer.appendChild(tabla);

                // PIE DE PÁGINA ELEGANTE
                const footerPDF = document.createElement('div');
                footerPDF.innerHTML = `
                    <div style="margin-top: 25px; padding-top: 15px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 0.75rem; font-weight: 600;">
                        <span style="color: #0d6efd;">Servi A/C Pro</span> • La mejor tecnología en climatización • WhatsApp: +503 7158-4643
                    </div>
                `;
                pdfContainer.appendChild(footerPDF);

                // Configuración de Alta Definición para Impresión
                const opcionesPDF = {
                    margin:       [0.3, 0.3, 0.3, 0.3],
                    filename:     'Catalogo_Premium_ServiACPro.pdf',
                    image:        { type: 'jpeg', quality: 1 },
                    html2canvas:  { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff', scrollY: 0 },
                    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
                };

                await html2pdf().set(opcionesPDF).from(pdfContainer).save();

                this.innerHTML = textoOriginal;
                this.disabled = false;
                
                Swal.fire({
                    icon: 'success',
                    title: '¡Catálogo Generado!',
                    text: 'El documento se ha descargado con éxito.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });

            } catch (err) {
                console.error('Error al generar PDF:', err);
                this.innerHTML = textoOriginal;
                this.disabled = false;
                Swal.fire('Error', 'No se pudo generar el documento.', 'error');
            }
        });
    }
});

async function cargarCategorias() {
  try {
    const response = await API.request('/categorias');
    const select = document.getElementById('filtroCategoria');
    select.innerHTML = '<option value="todas">Todas</option>';
    if (Array.isArray(response)) {
      response.forEach(cat => {
        const option = document.createElement('option');
        // Si tu backend devuelve el nombre en 'nombre' y el id en 'idCategoria'
        option.value = cat.nombre; // o cat.idCategoria según cómo lo manejes
        option.textContent = cat.nombre;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error cargando categorías:', error);
    // Fallback: opciones por defecto si falla la carga
    const select = document.getElementById('filtroCategoria');
    select.innerHTML = `
      <option value="todas">Todas</option>
      <option value="Inverter">Inverter</option>
      <option value="Ventana">Ventana</option>
      <option value="Portátil">Portátil</option>
    `;
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