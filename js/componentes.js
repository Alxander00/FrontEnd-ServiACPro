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