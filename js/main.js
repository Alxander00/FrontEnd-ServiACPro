// js/main.js

// ========== MODO OSCURO ==========
function initDarkMode() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    const btn = document.getElementById('darkModeToggle');
    if (btn) {
        btn.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        btn.title = darkMode ? 'Modo claro' : 'Modo oscuro';
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    const btn = document.getElementById('darkModeToggle');
    if (btn) {
        btn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        btn.title = isDark ? 'Modo claro' : 'Modo oscuro';
    }
}

function crearBotonDarkMode() {
    if (document.getElementById('darkModeToggle')) return;
    const btn = document.createElement('button');
    btn.id = 'darkModeToggle';
    btn.className = 'btn btn-sm btn-outline-secondary rounded-circle me-2';
    btn.style.width = '36px';
    btn.style.height = '36px';
    btn.addEventListener('click', toggleDarkMode);
    
    const cartLink = document.querySelector('a[href="carrito.html"]');
    if (cartLink && cartLink.parentNode) {
        cartLink.parentNode.insertBefore(btn, cartLink);
    } else {
        console.warn('No se pudo encontrar el carrito para el botón de modo oscuro');
    }
}

// ========== NAVBAR Y AUTENTICACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    crearBotonDarkMode();
    initDarkMode();
    actualizarNavAuth();
    
    if (typeof Carrito !== 'undefined') {
        Carrito.actualizarContadorCarrito();
    }
});

function actualizarNavAuth() {
    const authContainer = document.getElementById('authButtons');
    const cartIcon = document.querySelector('a[href="carrito.html"]');
    
    // Si no existe el contenedor, salimos
    if (!authContainer) return;
    
    // Verificar autenticación
    if (Auth.isAuthenticated()) {
        const user = Auth.getUser();
        if (!user) {
            authContainer.innerHTML = '';
            return;
        }
        
        if (cartIcon) {
            cartIcon.style.display = (user.rol === 'ADMIN' || user.rol === 'TECNICO') ? 'none' : 'inline-block';
        }
        
        let colorRol = '';
        let destino = '';
        let iconoMenu = '';
        
        if (user.rol === 'ADMIN') {
            colorRol = 'danger';
            destino = 'admin.html';
            iconoMenu = '<i class="fas fa-chart-line me-2"></i>';
        } else if (user.rol === 'TECNICO') {
            colorRol = 'info';
            destino = 'tecnico.html';
            iconoMenu = '<i class="fas fa-tools me-2"></i>';
        } else {
            colorRol = 'primary';
            destino = 'perfil.html';
            iconoMenu = '<i class="fas fa-user me-2"></i>';
        }
        
        const iniciales = (user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U') + 
                         (user.apellido ? user.apellido.charAt(0).toUpperCase() : '');
        
        authContainer.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-light rounded-pill dropdown-toggle d-flex align-items-center gap-2 shadow-sm border-0" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="background: white; padding: 5px 12px;">
                    <div class="rounded-circle bg-${colorRol} bg-opacity-10 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                        <span class="fw-bold text-${colorRol}" style="font-size: 0.85rem;">${iniciales}</span>
                    </div>
                    <span class="fw-semibold small text-${colorRol}">${user.nombre}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-2" style="min-width: 200px;">
                    <li><span class="dropdown-item-text text-muted small"><i class="fas fa-envelope me-2"></i>${user.email}</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="${destino}">${iconoMenu} Mi ${user.rol === 'ADMIN' ? 'Dashboard' : (user.rol === 'TECNICO' ? 'Agenda' : 'Perfil')}</a></li>
                    <li><a class="dropdown-item" href="catalogo.html"><i class="fas fa-store me-2"></i> Tienda</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger fw-bold" href="#" onclick="Auth.logout()"><i class="fas fa-sign-out-alt me-2"></i> Cerrar Sesión</a></li>
                </ul>
            </div>
        `;
    } else {
        // No autenticado: mostrar botones de login/registro
        if (cartIcon) cartIcon.style.display = 'inline-block';
        authContainer.innerHTML = `
            <a href="login.html" class="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold">Iniciar Sesión</a>
            <a href="registro.html" class="btn btn-primary btn-sm rounded-pill px-3 fw-semibold">Registrarse</a>
        `;
    }
}