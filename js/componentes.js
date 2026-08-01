document.addEventListener('DOMContentLoaded', () => {
    // Buscamos dónde inyectar el menú
    const navbarContainer = document.getElementById('navbar-container');
    
    if (navbarContainer) {
        navbarContainer.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
                <div class="container d-flex justify-content-between align-items-center">
                    
                    <a class="navbar-brand fw-bold fs-4 me-auto" href="index.html">ServiA<span class="text-info">CPro</span></a>
                    
                    <div class="d-flex align-items-center flex-nowrap d-lg-none" style="gap: 15px;">
                        <a href="carrito.html" class="position-relative text-dark text-decoration-none fs-5" id="cartIconMobile" style="display: none;">
                            <i class="fas fa-shopping-cart"></i>
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-info cart-count" style="display: none; font-size: 0.65rem;">0</span>
                        </a>
                        <button class="navbar-toggler border-0 p-1" type="button" data-bs-toggle="offcanvas" data-bs-target="#menuLateral">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                    </div>

                    <div class="offcanvas-lg offcanvas-start flex-grow-1" tabindex="-1" id="menuLateral">
                        <div class="offcanvas-header border-bottom d-lg-none">
                            <h5 class="offcanvas-title fw-bold text-uppercase" style="letter-spacing: 1px;">Menú</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
                        </div>
                        
                        <div class="offcanvas-body p-0 p-lg-2 align-items-center">
                            <ul class="navbar-nav mx-auto menu-movil-lista">
                                <li class="nav-item border-bottom border-lg-0">
                                    <a class="nav-link d-flex justify-content-between align-items-center p-3 p-lg-2" href="index.html">
                                        <span><i class="fas fa-home text-muted me-3 d-lg-none"></i>Inicio</span>
                                        <i class="fas fa-chevron-right text-muted small d-lg-none"></i>
                                    </a>
                                </li>
                                <li class="nav-item border-bottom border-lg-0">
                                    <a class="nav-link d-flex justify-content-between align-items-center p-3 p-lg-2" href="nosotros.html">
                                        <span><i class="fas fa-users text-muted me-3 d-lg-none"></i>Nosotros</span>
                                        <i class="fas fa-chevron-right text-muted small d-lg-none"></i>
                                    </a>
                                </li>
                                <li class="nav-item border-bottom border-lg-0">
                                    <a class="nav-link d-flex justify-content-between align-items-center p-3 p-lg-2" href="catalogo.html">
                                        <span><i class="fas fa-store text-muted me-3 d-lg-none"></i>Catálogo</span>
                                        <i class="fas fa-chevron-right text-muted small d-lg-none"></i>
                                    </a>
                                </li>
                                <li class="nav-item border-bottom border-lg-0">
                                    <a class="nav-link d-flex justify-content-between align-items-center p-3 p-lg-2" href="calculadora.html">
                                        <span><i class="fas fa-calculator text-muted me-3 d-lg-none"></i>Asistente Inteligente</span>
                                        <i class="fas fa-chevron-right text-muted small d-lg-none"></i>
                                    </a>
                                </li>
                                <li class="nav-item border-bottom border-lg-0">
                                    <a class="nav-link d-flex justify-content-between align-items-center p-3 p-lg-2" href="contacto.html">
                                        <span><i class="fas fa-envelope text-muted me-3 d-lg-none"></i>Contacto</span>
                                        <i class="fas fa-chevron-right text-muted small d-lg-none"></i>
                                    </a>
                                </li>
                            </ul>
                            
                            <div class="mt-auto mt-lg-0 p-3 p-lg-0 bg-light bg-transparent border-top border-lg-0 d-flex align-items-center gap-3 justify-content-center" id="authButtons">
                                </div>
                            
                            <a href="carrito.html" class="position-relative ms-lg-3 mt-3 mt-lg-0 text-dark text-decoration-none fs-5 d-none d-lg-inline-block" id="cartIconDesktop" style="display: none;">
                                <i class="fas fa-shopping-cart"></i>
                                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-info cart-count" style="display: none; font-size: 0.65rem;">0</span>
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
        `;

        // Le avisamos a los otros scripts que el menú ya está listo
        if (typeof actualizarNavAuth === 'function') actualizarNavAuth();
        if (typeof crearBotonDarkMode === 'function') {
            crearBotonDarkMode();
            initDarkMode();
        }
        if (typeof Carrito !== 'undefined' && typeof Carrito.actualizarContadorCarrito === 'function') {
            Carrito.actualizarContadorCarrito();
        }
    }
});

// ==========================================
// INYECCIÓN DEL FOOTER (PIE DE PÁGINA)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const footerContainer = document.getElementById('footer-container');
    
    if (footerContainer) {
        footerContainer.innerHTML = `
            <footer class="footer-premium bg-dark text-white pt-5 pb-3 mt-auto">
                <div class="container">
                    <div class="row g-4 mb-4">
                        
                        <div class="col-lg-4 col-md-6 text-center text-md-start">
                            <h3 class="fw-bold mb-3">ServiA<span class="text-info">CPro</span></h3>
                            <p class="text-secondary small mb-4">Expertos en soluciones de climatización residencial e industrial. Diseñamos experiencias de bienestar y confort para tu espacio.</p>
                            <div class="d-flex justify-content-center justify-content-md-start gap-3 social-icons">
                                <a href="#" class="btn btn-outline-light rounded-circle"><i class="fab fa-facebook-f"></i></a>
                                <a href="#" class="btn btn-outline-light rounded-circle"><i class="fab fa-instagram"></i></a>
                                <a href="https://wa.me/50370000000" target="_blank" class="btn btn-success rounded-circle border-0 shadow-sm" style="background-color: #25D366;"><i class="fab fa-whatsapp fs-5"></i></a>
                            </div>
                        </div>

                        <div class="col-lg-4 col-md-6 text-center text-md-start footer-links">
                            <h5 class="text-white fw-bold mb-3">Navegación</h5>
                            <ul class="list-unstyled d-flex flex-column gap-2">
                                <li><a href="index.html" class="text-secondary text-decoration-none footer-link"><i class="fas fa-chevron-right text-info small me-2"></i>Inicio</a></li>
                                <li><a href="nosotros.html" class="text-secondary text-decoration-none footer-link"><i class="fas fa-chevron-right text-info small me-2"></i>Nosotros</a></li>
                                <li><a href="catalogo.html" class="text-secondary text-decoration-none footer-link"><i class="fas fa-chevron-right text-info small me-2"></i>Catálogo de Equipos</a></li>
                                <li><a href="calculadora.html" class="text-secondary text-decoration-none footer-link"><i class="fas fa-chevron-right text-info small me-2"></i>Asistente Inteligente</a></li>
                            </ul>
                        </div>

                        <div class="col-lg-4 col-md-12 text-center text-md-start footer-info">
                            <h5 class="text-white fw-bold mb-3">Contacto Directo</h5>
                            <ul class="list-unstyled d-flex flex-column gap-3">
                                <li class="d-flex align-items-center justify-content-center justify-content-md-start gap-3 text-secondary">
                                    <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                                        <i class="fas fa-map-marker-alt"></i>
                                    </div>
                                    <span class="small text-start">San Salvador, El Salvador</span>
                                </li>
                                <li class="d-flex align-items-center justify-content-center justify-content-md-start gap-3 text-secondary">
                                    <div class="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                                        <i class="fas fa-phone-alt"></i>
                                    </div>
                                    <span class="small text-start">+503 7000-0000</span>
                                </li>
                                <li class="d-flex align-items-center justify-content-center justify-content-md-start gap-3 text-secondary">
                                    <div class="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                                        <i class="fas fa-envelope"></i>
                                    </div>
                                    <span class="small text-start">soporte@serviacpro.com</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="border-top border-secondary border-opacity-50 pt-4 mt-2 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                        <small class="text-secondary text-center text-md-start">
                            &copy; ${new Date().getFullYear()} Servi A/C Pro. Todos los derechos reservados.
                        </small>
                        <div class="d-flex gap-3 small text-secondary">
                            <a href="#" class="text-secondary text-decoration-none footer-link">Términos y Condiciones</a>
                            <span>|</span>
                            <a href="#" class="text-secondary text-decoration-none footer-link">Privacidad</a>
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
    // 1. Modal de "Cargando..."
    cargando: (mensaje = 'Procesando...') => {
        Swal.fire({
            title: mensaje,
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
    },

    // 2. Cerrar cualquier modal abierto
    cerrar: () => {
        Swal.close();
    },

    // 3. Modal de Éxito (Centro de la pantalla)
    exito: (titulo, mensaje) => {
        return Swal.fire({
            icon: 'success',
            title: titulo,
            text: mensaje,
            confirmButtonColor: '#0d6efd'
        });
    },

    // 4. Modal de Éxito tipo "Toast" (Notificación pequeña arriba a la derecha)
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

    // 5. Modal de Error
    error: (mensaje, titulo = 'Error') => {
        return Swal.fire({
            icon: 'error',
            title: titulo,
            text: mensaje,
            confirmButtonColor: '#dc3545'
        });
    },

    // 6. Modal de Confirmación (Pregunta Sí/No)
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
        return result.isConfirmed; // Devuelve true o false
    }
};

// =========================================================
// INYECCIÓN DINÁMICA DEL MODAL DE CHAT
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    // Solo inyectar el chat si el usuario está logueado y es Cliente o Técnico
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