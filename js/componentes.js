document.addEventListener('DOMContentLoaded', () => {
    // Buscamos dónde inyectar el menú
    const navbarContainer = document.getElementById('navbar-container');
    
    if (navbarContainer) {
        navbarContainer.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
                <div class="container d-flex justify-content-between align-items-center">
                    
                    <a class="navbar-brand fw-bold fs-4 me-auto" href="index.html">ServiA<span class="text-primary">CPro</span></a>
                    
                    <div class="d-flex align-items-center flex-nowrap d-lg-none" style="gap: 15px;">
                        <button class="navbar-toggler border-0 p-1" type="button" data-bs-toggle="offcanvas" data-bs-target="#menuLateral">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                    </div>

                    <div class="offcanvas-lg offcanvas-start flex-grow-1" tabindex="-1" id="menuLateral">
                        <div class="offcanvas-header border-bottom d-lg-none">
                            <h5 class="offcanvas-title fw-bold text-uppercase text-primary" style="letter-spacing: 1px;">Opciones</h5>
                            <!-- 🚨 AQUÍ REPARAMOS LA X (agregamos data-bs-target) -->
                            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#menuLateral" aria-label="Cerrar"></button>
                        </div>
                        
                        <div class="offcanvas-body p-0 p-lg-2 d-flex flex-column flex-lg-row align-items-lg-center">
                            
                            <ul class="navbar-nav mx-auto d-none d-lg-flex">
                                <li class="nav-item"><a class="nav-link fw-semibold px-3" href="index.html">Inicio</a></li>
                                <li class="nav-item"><a class="nav-link fw-semibold px-3" href="catalogo.html">Catálogo</a></li>
                                <li class="nav-item"><a class="nav-link fw-semibold px-3" href="calculadora.html">Asistente Inteligente</a></li>
                                <li class="nav-item"><a class="nav-link fw-semibold px-3" href="nosotros.html">Nosotros</a></li>
                                <li class="nav-item"><a class="nav-link fw-semibold px-3" href="contacto.html">Contacto</a></li>
                            </ul>

                            <div class="d-lg-none w-100">
                                <div class="p-3 bg-light border-bottom text-muted fw-bold small text-uppercase" style="letter-spacing: 1px;">
                                    Soporte
                                </div>
                                <ul class="list-group list-group-flush border-bottom">
                                    <a href="#" class="list-group-item list-group-item-action border-0 py-3 d-flex justify-content-between align-items-center">
                                        <span><i class="fas fa-question-circle text-primary me-3"></i>Preguntas Frecuentes</span>
                                        <i class="fas fa-chevron-right text-muted small"></i>
                                    </a>
                                    <a href="#" class="list-group-item list-group-item-action border-0 py-3 d-flex justify-content-between align-items-center">
                                        <span><i class="fas fa-file-contract text-primary me-3"></i>Términos y Condiciones</span>
                                        <i class="fas fa-chevron-right text-muted small"></i>
                                    </a>
                                </ul>
                            </div>
                            
                            <div class="mt-auto mt-lg-0 p-4 p-lg-0 border-top border-lg-0 d-flex flex-column flex-lg-row align-items-lg-center gap-2 gap-lg-3" id="authButtons" style="background-color: transparent;">
                                <!-- El JS inyecta botones aquí -->
                            </div>
                            
                            <!-- Carrito PC -->
                            <a href="carrito.html" class="position-relative ms-lg-3 mt-3 mt-lg-0 text-dark text-decoration-none fs-5 d-none d-lg-inline-block" id="cartIconDesktop" style="display: none;">
                                <i class="fas fa-shopping-cart"></i>
                                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger cart-count" style="display: none; font-size: 0.65rem;">0</span>
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
        `;

        // 🚨 AQUÍ MANDAMOS A INYECTAR LA BARRA INFERIOR DE FORMA AUTOMÁTICA
        inyectarBottomNav();
        inyectarWhatsApp();

        if (typeof actualizarNavAuth === 'function') actualizarNavAuth();
        if (typeof Carrito !== 'undefined' && typeof Carrito.actualizarContadorCarrito === 'function') {
            Carrito.actualizarContadorCarrito();
        }
    }
});

// ==========================================
// FUNCIÓN PARA LA BARRA INFERIOR DINÁMICA
// ==========================================
function inyectarBottomNav() {
    const path = window.location.pathname;
    const isIndex = path.includes('index.html') || path.endsWith('/');
    const isCatalogo = path.includes('catalogo.html');
    const isCalculadora = path.includes('calculadora.html');
    const isCarrito = path.includes('carrito.html');
    
    const navHtml = `
        <div class="bottom-nav-movil d-flex d-md-none">
            <a href="index.html" class="bottom-nav-item ${isIndex ? 'active' : ''}">
                <i class="fas fa-home"></i>
                <span>Inicio</span>
            </a>
            <a href="catalogo.html" class="bottom-nav-item ${isCatalogo ? 'active' : ''}">
                <i class="fas fa-search"></i>
                <span>Catálogo</span>
            </a>
            <a href="calculadora.html" class="bottom-nav-item ${isCalculadora ? 'active' : ''}">
                <i class="fas fa-calculator"></i>
                <span>Asistente</span>
            </a>
            <a href="login.html" id="btnCuentaMovil" class="bottom-nav-item">
                <i class="fas fa-user"></i>
                <span>Cuenta</span>
            </a>
            <a href="carrito.html" class="bottom-nav-item position-relative ${isCarrito ? 'active' : ''}">
                <i class="fas fa-shopping-cart"></i>
                <span>Carrito</span>
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger cart-count" style="display: none; font-size: 0.55rem; padding: 0.25em 0.4em; margin-left: -12px;">0</span>
            </a>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', navHtml);
}

// ==========================================
// FUNCIÓN PARA EL BOTÓN FLOTANTE DE WHATSAPP
// ==========================================
function inyectarWhatsApp() {
    // Aquí puedes cambiar el número al tuyo real. Usa el código de país (503) sin el símbolo +
    const numeroWhatsApp = "50370000000"; 
    const mensajeAmigable = "¡Hola! Estoy interesado en los servicios de Servi A/C Pro. ¿Me pueden ayudar?";
    const urlWa = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensajeAmigable)}`;

    const btnWaHtml = `
        <a href="${urlWa}" target="_blank" class="btn-whatsapp-flotante" title="Habla con un asesor">
            <i class="fab fa-whatsapp"></i>
        </a>
    `;
    
    document.body.insertAdjacentHTML('beforeend', btnWaHtml);
}

// ==========================================
// INYECCIÓN DEL FOOTER (ESTILO PREMIUM OSCURO)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const footerContainer = document.getElementById('footer-container');
    
    if (footerContainer) {
        footerContainer.innerHTML = `
            <footer class="text-white pt-5 pb-4 mt-auto" style="background-color: #111827;">
                <div class="container text-center text-md-start">
                    <div class="row">
                        
                        <!-- Logo e Información de Contacto -->
                        <div class="col-md-4 col-lg-4 col-xl-3 mx-auto mb-4">
                            <h4 class="text-uppercase fw-bold mb-4 d-flex align-items-center justify-content-center justify-content-md-start">
                                <i class="fas fa-snowflake text-primary me-2"></i>ServiA/CPro
                            </h4>
                            <p class="text-white-50" style="font-size: 0.9rem;">
                                Somos una empresa joven especializada en climatización. Proveemos la infraestructura necesaria para transformar los entornos del hogar y el trabajo.
                            </p>
                            <div class="mt-4 text-start ms-4 ms-md-0">
                                <p><i class="fas fa-map-marker-alt me-3 text-primary"></i> San Salvador, El Salvador</p>
                                <p><i class="fas fa-phone me-3 text-primary"></i> +503 7000-0000</p>
                                <p><i class="fas fa-envelope me-3 text-primary"></i> soporte@serviacpro.com</p>
                            </div>
                        </div>

                        <!-- Categorías (Acordeón en móvil) -->
                        <div class="col-md-3 col-lg-2 col-xl-2 mx-auto mb-4">
                            <h6 class="text-uppercase fw-bold mb-3 border-bottom border-secondary pb-2 d-flex justify-content-between align-items-center" data-bs-toggle="collapse" data-bs-target="#footerCat" style="cursor: pointer;">
                                Categorías <i class="fas fa-plus d-md-none text-primary"></i>
                            </h6>
                            <div class="collapse d-md-block" id="footerCat">
                                <p class="mb-2"><a href="#" class="text-white-50 text-decoration-none" style="font-size: 0.9rem; transition: color 0.3s;" onmouseover="this.classList.replace('text-white-50', 'text-white')" onmouseout="this.classList.replace('text-white', 'text-white-50')">Residencial</a></p>
                                <p class="mb-2"><a href="#" class="text-white-50 text-decoration-none" style="font-size: 0.9rem; transition: color 0.3s;" onmouseover="this.classList.replace('text-white-50', 'text-white')" onmouseout="this.classList.replace('text-white', 'text-white-50')">Industrial</a></p>
                                <p class="mb-2"><a href="#" class="text-white-50 text-decoration-none" style="font-size: 0.9rem; transition: color 0.3s;" onmouseover="this.classList.replace('text-white-50', 'text-white')" onmouseout="this.classList.replace('text-white', 'text-white-50')">Repuestos</a></p>
                            </div>
                        </div>

                        <!-- Servicios (Acordeón en móvil) -->
                        <div class="col-md-3 col-lg-2 col-xl-2 mx-auto mb-4">
                            <h6 class="text-uppercase fw-bold mb-3 border-bottom border-secondary pb-2 d-flex justify-content-between align-items-center" data-bs-toggle="collapse" data-bs-target="#footerServ" style="cursor: pointer;">
                                Nuestros Servicios <i class="fas fa-plus d-md-none text-primary"></i>
                            </h6>
                            <div class="collapse d-md-block" id="footerServ">
                                <p class="mb-2"><a href="#" class="text-white-50 text-decoration-none" style="font-size: 0.9rem; transition: color 0.3s;" onmouseover="this.classList.replace('text-white-50', 'text-white')" onmouseout="this.classList.replace('text-white', 'text-white-50')">Instalación y Venta</a></p>
                                <p class="mb-2"><a href="#" class="text-white-50 text-decoration-none" style="font-size: 0.9rem; transition: color 0.3s;" onmouseover="this.classList.replace('text-white-50', 'text-white')" onmouseout="this.classList.replace('text-white', 'text-white-50')">Mantenimiento Preventivo</a></p>
                                <p class="mb-2"><a href="#" class="text-white-50 text-decoration-none" style="font-size: 0.9rem; transition: color 0.3s;" onmouseover="this.classList.replace('text-white-50', 'text-white')" onmouseout="this.classList.replace('text-white', 'text-white-50')">Asesoría Técnica</a></p>
                            </div>
                        </div>

                        <!-- Redes Sociales -->
                        <div class="col-12 text-center mt-3 pt-4 border-top border-secondary">
                            <a class="btn btn-outline-light btn-floating m-1 rounded-circle fs-5" style="border-color: rgba(255,255,255,0.2);" href="#!" role="button"><i class="fab fa-facebook-f"></i></a>
                            <a class="btn btn-outline-light btn-floating m-1 rounded-circle fs-5" style="border-color: rgba(255,255,255,0.2);" href="#!" role="button"><i class="fab fa-instagram"></i></a>
                            <a class="btn btn-outline-light btn-floating m-1 rounded-circle fs-5" style="border-color: rgba(255,255,255,0.2);" href="#!" role="button"><i class="fab fa-tiktok"></i></a>
                            <a class="btn btn-outline-light btn-floating m-1 rounded-circle fs-5" style="border-color: rgba(255,255,255,0.2);" href="#!" role="button"><i class="fab fa-youtube"></i></a>
                            
                            <div class="mt-4 text-white-50 small">
                                &copy; 2026 Servi A/C Pro. Todos los derechos reservados.
                            </div>
                        </div>
                        
                    </div>
                </div>
            </footer>
        `;
    }
});

// =========================================================
// CONTROLADOR GLOBAL DE ALERTAS Y MODALES (SWEETALERT2)
// =========================================================
window.UI = {
    cargando: (mensaje = 'Procesando...') => {
        Swal.fire({
            title: mensaje,
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
    },
    cerrar: () => {
        Swal.close();
    },
    exito: (titulo, mensaje) => {
        return Swal.fire({
            icon: 'success',
            title: titulo,
            text: mensaje,
            confirmButtonColor: '#0d6efd'
        });
    },
    exitoToast: (titulo, mensaje = '') => {
        return Swal.fire({
            icon: 'success',
            title: titulo,
            text: mensaje,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    },
    error: (mensaje, titulo = 'Error') => {
        return Swal.fire({
            icon: 'error',
            title: titulo,
            text: mensaje,
            confirmButtonColor: '#dc3545'
        });
    },
    confirmar: async (titulo, texto, txtConfirmar = 'Sí, continuar', colorBtn = '#0d6efd') => {
        const result = await Swal.fire({
            title: titulo,
            text: texto,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: colorBtn,
            cancelButtonColor: '#6c757d',
            confirmButtonText: txtConfirmar,
            cancelButtonText: 'Cancelar'
        });
        return result.isConfirmed;
    }
};

// =========================================================
// INYECCIÓN DINÁMICA DEL MODAL DE CHAT
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    if (user && (user.rol === 'CLIENTE' || user.rol === 'TECNICO')) {
        const chatHtml = `
        <div class="modal fade" id="modalChat" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header bg-primary text-white border-0">
                        <h5 class="modal-title fw-bold">
                            <i class="fas fa-comment-dots me-2"></i>Chat
                            <span id="chatNombreDestinatario" class="ms-2 small text-white-50"></span>
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-0">
                        <div id="chatContainer" style="height: 400px; overflow-y: auto; padding: 1rem 1.5rem; background: #f8faff;"></div>
                        <div class="p-3 bg-white border-top d-flex gap-2">
                            <input type="text" id="chatInput" class="form-control rounded-pill border-0 bg-light" placeholder="Escribe un mensaje..." autocomplete="off">
                            <button id="chatSendBtn" class="btn btn-primary rounded-pill px-4">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', chatHtml);
    }
});