// js/checkout.js

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
    document.getElementById('checkoutForm').addEventListener('submit', procesarPedido);
});

function renderizarCheckout(cart) {
    const user = Auth.getUser();
    document.getElementById('checkoutNombre').value = `${user.nombre} ${user.apellido || ''}`.trim();
    document.getElementById('checkoutEmail').value = user.email;
    const summaryContainer = document.getElementById('checkoutSummaryItems');
    let htmlResumen = '';
    cart.forEach(item => {
        const precioUnitario = item.precio + (item.incluyeInstalacion ? 80 : 0);
        htmlResumen += `
            <div class="d-flex justify-content-between mb-3 border-bottom pb-3">
                <div><h6 class="mb-1 text-dark fw-semibold">${item.nombre} <span class="badge bg-secondary ms-1">x${item.cantidad}</span></h6>
                <small class="text-muted"><i class="fas fa-info-circle me-1"></i>${item.incluyeInstalacion ? 'Con Instalación' : 'Solo equipo'}</small></div>
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
        botonSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Procesando...';
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
        const direccion = document.querySelector('textarea[name="direccion"]').value;
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
            text: `Tu número de orden es #${numeroOrden}`,
            confirmButtonColor: '#0d6efd'
        }).then(() => {
            window.location.href = 'index.html';
        });
    } catch (error) {
        console.error(error);
        Swal.fire('Error', error.message || 'Hubo un problema al procesar tu pedido', 'error');
        if (botonSubmit) {
            botonSubmit.disabled = false;
            botonSubmit.innerHTML = 'Confirmar Pedido <i class="fas fa-check-circle ms-2"></i>';
        }
    }
}