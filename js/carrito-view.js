// js/carrito-view.js

document.addEventListener('DOMContentLoaded', () => {
    const user = Auth.getUser();
    if (user && user.rol !== 'CLIENTE') {
            UI.error('Tu cuenta no tiene permisos para usar el carrito de compras.', 'Acceso denegado').then(() => {
            window.location.href = 'index.html';
        });
        return;
    }
    renderizarCarrito();
});

function renderizarCarrito() {
    const cart = Carrito.getCart();
    const container = document.getElementById('cart-container');
    const emptyMsg = document.getElementById('cart-empty');
    
    if (cart.length === 0) {
        container.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
    }
    emptyMsg.style.display = 'none';
    
    let htmlTabla = `
        <div class="col-lg-8">
            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr><th class="py-3 ps-4">Producto</th><th class="py-3 text-center">Precio</th><th class="py-3 text-center">Cantidad</th><th class="py-3 text-center">Total</th><th class="py-3 pe-4"></th></tr>
                        </thead>
                        <tbody>
    `;
    
    cart.forEach(item => {
        const precioUnitario = item.precio + (item.incluyeInstalacion ? 80 : 0);
        const subtotal = precioUnitario * item.cantidad;
        htmlTabla += `
            <tr>
                <td data-label="Producto" class="ps-4 py-3">
                    <div class="d-flex align-items-center gap-3">
                        <img src="${item.imagen}" alt="${item.nombre}" class="rounded" style="width: 60px; height: 60px; object-fit: contain; background-color: #f8fafc;">
                        <div>
                            <h6 class="mb-1 fw-bold text-dark">${item.nombre}</h6>
                            <span class="badge bg-${item.incluyeInstalacion ? 'info' : 'secondary'} text-${item.incluyeInstalacion ? 'dark' : 'light'}">
                                ${item.incluyeInstalacion ? 'Instalación Incluida (+$80)' : 'Solo Equipo'}
                            </span>
                        </div>
                    </div>
                </td>
                <td data-label="Precio" class="text-center py-3 fw-semibold text-secondary">$${precioUnitario.toFixed(2)}</td>
                <td data-label="Cantidad" class="text-center py-3">
                    <div class="d-inline-flex align-items-center bg-light rounded px-2 py-1 border">
                        <button class="btn btn-sm btn-link text-dark text-decoration-none px-2" onclick="cambiarCantidad(${item.id}, ${item.incluyeInstalacion}, -1)"><i class="fas fa-minus"></i></button>
                        <span class="fw-bold px-2" style="min-width: 25px;">${item.cantidad}</span>
                        <button class="btn btn-sm btn-link text-dark text-decoration-none px-2" onclick="cambiarCantidad(${item.id}, ${item.incluyeInstalacion}, 1)"><i class="fas fa-plus"></i></button>
                    </div>
                </td>
                <td data-label="Total" class="text-center py-3 fw-bold text-primary">$${subtotal.toFixed(2)}</td>
                <td data-label="" class="pe-4 py-3 text-end">
                    <button class="btn btn-outline-danger btn-sm" onclick="eliminarItem(${item.id}, ${item.incluyeInstalacion})" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
    });
    
    htmlTabla += `</tbody></table></div></div></div>`;
    const total = Carrito.getTotal();
    const htmlResumen = `
        <div class="col-lg-4 mt-4 mt-lg-0">
            <div class="card border-0 shadow-sm rounded-4 sticky-lg-top" style="top: 100px;">
                <div class="card-body p-4">
                    <h5 class="fw-bold text-dark border-bottom pb-3 mb-4">Resumen de Compra</h5>
                    <div class="d-flex justify-content-between mb-3"><span class="text-muted">Subtotal (${cart.reduce((acc, item) => acc + item.cantidad, 0)} items)</span><span class="fw-semibold">$${total.toFixed(2)}</span></div>
                    <div class="d-flex justify-content-between mb-4 border-bottom pb-4"><span class="text-muted">Envío</span><span class="text-success fw-bold">Por calcular</span></div>
                    <div class="d-flex justify-content-between align-items-center mb-4"><span class="fw-bold fs-5 text-dark">Total Estimado</span><span class="fw-bold fs-4 text-primary">$${total.toFixed(2)}</span></div>
                    <div class="d-grid gap-3">
                        <a href="checkout.html" class="btn btn-primary fw-bold py-3 fs-5 shadow-sm">Proceder al Pago</a>
                        <a href="catalogo.html" class="btn btn-outline-secondary">Seguir Comprando</a>
                    </div>
                </div>
            </div>
        </div>
    `;
    container.innerHTML = htmlTabla + htmlResumen;
}

function cambiarCantidad(id, incluyeInstalacion, delta) {
    const cart = Carrito.getCart();
    const item = cart.find(i => i.id === id && i.incluyeInstalacion === incluyeInstalacion);
    if (item) {
        const nuevaCantidad = item.cantidad + delta;
        if (nuevaCantidad >= 1) {
            Carrito.updateCantidad(id, incluyeInstalacion, nuevaCantidad);
            renderizarCarrito();
        } else {
            eliminarItem(id, incluyeInstalacion);
        }
    }
}

function eliminarItem(id, incluyeInstalacion) {
    UI.confirmar('¿Eliminar producto?', 'El producto se quitará del carrito', 'Sí, eliminar', '#dc3545').then((confirmado) => {
        if (confirmado) {
            Carrito.removeItem(id, incluyeInstalacion);
            renderizarCarrito();
            UI.exitoToast('Eliminado', 'Producto eliminado del carrito');
        }
    });
}