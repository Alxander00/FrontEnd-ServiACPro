// js/carrito.js

const Carrito = (() => {
    const CART_KEY_PREFIX = 'climapro_cart_';

    const getCartKey = () => {
        const user = Auth.getUser();
        const userId = user?.idUsuario || 'invitado';
        return CART_KEY_PREFIX + userId;
    };

    const getCart = () => {
        const cart = localStorage.getItem(getCartKey());
        return cart ? JSON.parse(cart) : [];
    };

    const saveCart = (cart) => {
        localStorage.setItem(getCartKey(), JSON.stringify(cart));
        actualizarContadorCarrito();
    };

    const addItem = (producto) => {
        const cart = getCart();
        const existing = cart.find(item => item.id === producto.id && item.incluyeInstalacion === producto.incluyeInstalacion);
        if (existing) {
            existing.cantidad += producto.cantidad || 1;
            // Actualizar stock por si cambió
            if (producto.stock !== undefined) existing.stock = producto.stock;
        } else {
            cart.push({ ...producto, cantidad: producto.cantidad || 1 });
        }
        saveCart(cart);
    };

    const removeItem = (id, incluyeInstalacion) => {
        let cart = getCart();
        cart = cart.filter(item => !(item.id === id && item.incluyeInstalacion === incluyeInstalacion));
        saveCart(cart);
    };

    const updateCantidad = (id, incluyeInstalacion, cantidad) => {
        const cart = getCart();
        const item = cart.find(item => item.id === id && item.incluyeInstalacion === incluyeInstalacion);
        if (item) {
            item.cantidad = Math.max(1, cantidad);
            saveCart(cart);
        }
    };

    // Nuevo método para actualizar el stock de un item específico
    const updateItemStock = (id, incluyeInstalacion, nuevoStock) => {
        const cart = getCart();
        const item = cart.find(item => item.id === id && item.incluyeInstalacion === incluyeInstalacion);
        if (item) {
            item.stock = nuevoStock;
            saveCart(cart);
        }
    };

    const clearCart = () => {
        localStorage.removeItem(getCartKey());
        actualizarContadorCarrito();
    };

    const getTotal = () => {
        return getCart().reduce((total, item) => {
            const precioBase = item.precio;
            const precioInstalacion = item.incluyeInstalacion ? 80 : 0;
            return total + ((precioBase + precioInstalacion) * item.cantidad);
        }, 0);
    };

    const actualizarContadorCarrito = () => {
        const cart = getCart();
        const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);
        const contadores = document.querySelectorAll('.cart-count');
        contadores.forEach(el => {
            el.textContent = totalItems;
            el.style.display = totalItems > 0 ? 'inline-block' : 'none';
        });
    };

    // Exponemos saveCart y updateItemStock
    return { 
        getCart, 
        addItem, 
        removeItem, 
        updateCantidad, 
        clearCart, 
        getTotal, 
        actualizarContadorCarrito,
        saveCart,
        updateItemStock
    };
})();