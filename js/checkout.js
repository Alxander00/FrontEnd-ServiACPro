// js/checkout.js

let mapCheckout = null;
let markerCheckout = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    const user = Auth.getUser();
    if (user.rol !== 'CLIENTE') {
        Swal.fire({
            icon: 'error',
            title: 'Acceso denegado',
            text: 'El área de pagos es exclusiva para clientes.'
        }).then(() => {
            window.location.href = 'index.html';
        });
        return;
    }
    const cart = Carrito.getCart();
    if (cart.length === 0) {
        window.location.href = 'carrito.html';
        return;
    }
    
    renderizarCheckout(cart);
    initMapa();
    
    document.getElementById('checkoutForm').addEventListener('submit', procesarPedido);
});

function initMapa() {
    // 1️⃣ Obtener usuario autenticado
    const user = Auth.getUser();

    // 2️⃣ Coordenadas por defecto (El Salvador)
    let coordsBase = [13.6929, -89.2182];

    // 3️⃣ Si el usuario tiene coordenadas guardadas, usarlas
    if (user && user.latitud && user.longitud) {
        coordsBase = [parseFloat(user.latitud), parseFloat(user.longitud)];
        console.log('📍 Mapa centrado en dirección guardada:', coordsBase);
    } else {
        console.log('📍 Mapa centrado en ubicación por defecto (El Salvador)');
    }

    // 4️⃣ Inicializar el mapa con las coordenadas elegidas
    mapCheckout = L.map('mapaCheckout').setView(coordsBase, 14); // Zoom más cercano si tiene coordenadas

    // 5️⃣ Capa de mapa (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapCheckout);

    // 6️⃣ Crear el marcador arrastrable en la posición actual
    markerCheckout = L.marker(coordsBase, { draggable: true }).addTo(mapCheckout);

    // 7️⃣ Evento: al arrastrar el marcador, obtener dirección
    markerCheckout.on('dragend', function (e) {
        const coords = e.target.getLatLng();
        obtenerDireccion(coords.lat, coords.lng);
    });

    // 8️⃣ Evento: al hacer clic en el mapa, mover el marcador y obtener dirección
    mapCheckout.on('click', function(e) {
        markerCheckout.setLatLng(e.latlng);
        obtenerDireccion(e.latlng.lat, e.latlng.lng);
    });

    // 9️⃣ Botón "Usar mi ubicación"
    document.getElementById('btnMiUbicacion').addEventListener('click', () => {
        const status = document.getElementById('geoStatus');
        
        if (!navigator.geolocation) {
            status.innerHTML = '<span class="text-danger"><i class="fas fa-exclamation-circle"></i> Tu navegador no soporta geolocalización.</span>';
            return;
        }
        
        status.innerHTML = '<span class="text-info"><i class="fas fa-spinner fa-spin"></i> Obteniendo tu ubicación...</span>';
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = [position.coords.latitude, position.coords.longitude];
                mapCheckout.setView(pos, 16);
                markerCheckout.setLatLng(pos);
                obtenerDireccion(pos[0], pos[1]);
                status.innerHTML = '<span class="text-success"><i class="fas fa-check-circle"></i> Ubicación encontrada.</span>';
                setTimeout(() => status.innerHTML = '', 3000);
            },
            () => { 
                status.innerHTML = '<span class="text-danger"><i class="fas fa-exclamation-triangle"></i> No pudimos acceder a tu ubicación. Mueve el pin manualmente.</span>';
            }
        );
    });

    // 🔟 (Opcional) Si el usuario tiene coordenadas, obtener dirección automáticamente al cargar
    if (user && user.latitud && user.longitud) {
        obtenerDireccion(parseFloat(user.latitud), parseFloat(user.longitud));
    }
    
    // 1️⃣1️⃣ Forzar redibujado del mapa en celulares para evitar bordes grises
    setTimeout(() => {
        mapCheckout.invalidateSize();
    }, 500);
}

// Función para transformar las coordenadas en una dirección en texto (Geocodificación Inversa)
async function obtenerDireccion(lat, lng) {
    const inputDireccion = document.getElementById('direccionInput');
    inputDireccion.placeholder = "Traduciendo coordenadas a dirección...";
    
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await response.json();
        
        if (data && data.display_name) {
            // Se llena el textarea para que el usuario pueda agregar detalles extra si gusta
            inputDireccion.value = data.display_name;
        }
    } catch (error) {
        console.error("Error al geocodificar", error);
        inputDireccion.placeholder = "No se pudo obtener la dirección automática. Por favor escríbela.";
    }
}

function renderizarCheckout(cart) {
    const user = Auth.getUser();
    document.getElementById('checkoutNombre').value = `${user.nombre} ${user.apellido || ''}`.trim();
    document.getElementById('checkoutEmail').value = user.email;
    
    // Si el usuario ya tiene una dirección en su perfil, la precargamos en el textarea
    if (user.direccion) {
        document.getElementById('direccionInput').value = user.direccion;
    }

    const summaryContainer = document.getElementById('checkoutSummaryItems');
    let htmlResumen = '';
    cart.forEach(item => {
        const precioUnitario = item.precio + (item.incluyeInstalacion ? 80 : 0);
        htmlResumen += `
            <div class="d-flex justify-content-between mb-3 border-bottom pb-3">
                <div>
                    <h6 class="mb-1 text-dark fw-semibold">${item.nombre} <span class="badge bg-primary ms-1 rounded-pill">x${item.cantidad}</span></h6>
                    <small class="text-muted"><i class="fas ${item.incluyeInstalacion ? 'fa-tools' : 'fa-box'} me-1"></i>${item.incluyeInstalacion ? 'Con Instalación' : 'Solo equipo'}</small>
                </div>
                <span class="fw-bold text-dark">$${(precioUnitario * item.cantidad).toFixed(2)}</span>
            </div>
        `;
    });
    summaryContainer.innerHTML = htmlResumen;
    const total = Carrito.getTotal();
    document.getElementById('checkoutTotal').textContent = `$${total.toFixed(2)}`;
}

async function procesarPedido(event) {
    event.preventDefault();
    const botonSubmit = event.target.querySelector('button[type="submit"]');
    
    if (botonSubmit) {
        botonSubmit.disabled = true;
        botonSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Procesando Transacción...';
    }
    
    try {
        const user = Auth.getUser();
        const cart = Carrito.getCart();
        const total = Carrito.getTotal();
        
        const itemsDto = cart.map(item => ({
            idProducto: item.id,
            cantidad: item.cantidad,
            precioUnitario: item.precio + (item.incluyeInstalacion ? 80 : 0)
        }));
        
        const requiereInstalacion = cart.some(item => item.incluyeInstalacion === true);
        const direccion = document.getElementById('direccionInput').value.trim();
        
        if (!direccion) throw new Error('La dirección de instalación es obligatoria');
        
        const idCliente = user.idUsuario || user.id;
        
        const payload = {
            idUsuario: parseInt(idCliente),
            total: total,
            incluyeInstalacion: requiereInstalacion,
            direccion: direccion,
            items: itemsDto
        };
        
        const response = await API.request('/api/pedidos', { method: 'POST', body: JSON.stringify(payload) });
        Carrito.clearCart();
        
        const numeroOrden = response.idPedido ? response.idPedido : 'Exitosa';
        
        Swal.fire({
            icon: 'success',
            title: '¡Pedido confirmado!',
            text: `Tu número de orden es #${numeroOrden}. Se ha enviado a tu perfil.`,
            confirmButtonColor: '#0d6efd'
        }).then(() => {
            window.location.href = 'perfil.html?pedido=confirmado';
        });
        
    } catch (error) {
        console.error(error);
        Swal.fire('Error', error.message || 'Hubo un problema al procesar tu pedido. Intenta nuevamente.', 'error');
        if (botonSubmit) {
            botonSubmit.disabled = false;
            botonSubmit.innerHTML = 'Confirmar Pedido <i class="fas fa-check-circle ms-2"></i>';
        }
    }
}