// js/notificaciones.js

// Usar la API_URL ya definida en api.js (global)
// Si no existe, definirla localmente
const NOTIFICACIONES_API_URL = (typeof API_URL !== 'undefined') ? API_URL : (() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8080';
    }
    return 'https://servi-a-c-pro.onrender.com';
})();

const Notificaciones = (() => {
    let contador = 0;
    let notificaciones = [];
    let intervalo = null;
    let inicializado = false;

    const init = () => {
        console.log('🔔 Notificaciones.init() llamado');
        if (inicializado) {
            console.log('⚠️ Ya inicializado, ignorando.');
            return;
        }

        const user = Auth.getUser();
        console.log('👤 Usuario:', user);
        if (!user || user.rol !== 'TECNICO') {
            console.warn('❌ No es técnico o no hay usuario');
            return;
        }

        const container = document.getElementById('notificacionesContainer');
        console.log('📦 Container:', container);
        if (!container) {
            console.warn('⏳ Contenedor aún no creado, reintentando en 300ms...');
            setTimeout(() => {
                init();
            }, 300);
            return;
        }

        const notifHtml = `
            <div class="dropdown" id="notificacionesDropdown">
                <button class="btn btn-light rounded-pill position-relative shadow-sm border-0" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="padding: 5px 12px;">
                    <i class="fas fa-bell fs-5"></i>
                    <span id="notifBadge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="display: none; font-size: 0.65rem;">0</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-2" style="min-width: 320px; max-height: 400px; overflow-y: auto;" id="notifList">
                    <li><span class="dropdown-item-text text-muted small">Cargando notificaciones...</span></li>
                </ul>
            </div>
        `;

        container.innerHTML = notifHtml;
        console.log('✅ Campana insertada');

        cargarNotificaciones();
        actualizarContador();

        if (intervalo) clearInterval(intervalo);
        intervalo = setInterval(() => {
            cargarNotificaciones();
            actualizarContador();
        }, 30000);

        inicializado = true;
    };

    const cargarNotificaciones = async () => {
        try {
            const token = Auth.getToken();
            if (!token) {
                console.warn('⚠️ No hay token');
                return;
            }
            const response = await fetch(`${NOTIFICACIONES_API_URL}/api/notificaciones/no-leidas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                notificaciones = await response.json();
                console.log(`📩 Notificaciones cargadas: ${notificaciones.length}`);
                renderLista();
            } else {
                console.error('❌ Error cargando notificaciones:', response.status);
            }
        } catch (error) {
            console.error('❌ Error cargando notificaciones:', error);
        }
    };

    const actualizarContador = async () => {
        try {
            const token = Auth.getToken();
            if (!token) return;
            const response = await fetch(`${NOTIFICACIONES_API_URL}/api/notificaciones/contador`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const count = await response.json();
                contador = count;
                const badge = document.getElementById('notifBadge');
                if (badge) {
                    if (contador > 0) {
                        badge.textContent = contador;
                        badge.style.display = 'inline-block';
                    } else {
                        badge.style.display = 'none';
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error actualizando contador:', error);
        }
    };

    const renderLista = () => {
        const list = document.getElementById('notifList');
        if (!list) return;

        if (notificaciones.length === 0) {
            list.innerHTML = `
                <li><span class="dropdown-item-text text-muted text-center d-block py-3">
                    <i class="fas fa-check-circle me-2"></i>Todo al día
                </span></li>
            `;
            return;
        }

        list.innerHTML = notificaciones.map(n => `
            <li>
                <a href="#" class="dropdown-item d-flex align-items-start gap-2 py-2 border-bottom" 
                   onclick="marcarComoLeida(${n.id}, '${n.enlace || '#'}')">
                    <span class="text-primary"><i class="fas fa-circle" style="font-size: 8px;"></i></span>
                    <div>
                        <p class="mb-0 small fw-semibold">${n.mensaje}</p>
                        <small class="text-muted" style="font-size: 0.7rem;">${new Date(n.fechaCreacion).toLocaleString()}</small>
                    </div>
                </a>
            </li>
        `).join('');
    };

    window.marcarComoLeida = async (id, enlace) => {
        try {
            const token = Auth.getToken();
            if (!token) return;
            
            // 1. Marcar como leída en el backend
            await fetch(`${NOTIFICACIONES_API_URL}/api/notificaciones/${id}/leida`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // 2. Actualizar la lista en el frontend
            notificaciones = notificaciones.filter(n => n.id !== id);
            renderLista();
            actualizarContador();

            // 3. Redirección inteligente (Aquí está la clave)
            if (enlace && enlace !== '#') {
                // Si el enlace es 'tecnico.html?cita=X', esto redirigirá
                window.location.href = enlace;
            }
        } catch (error) {
            console.error('❌ Error marcando como leída:', error);
        }
    };

    const destroy = () => {
        if (intervalo) clearInterval(intervalo);
        inicializado = false;
    };

    return { init, destroy };
})();

// ===== INICIALIZACIÓN AUTOMÁTICA =====
// Esperar a que el DOM esté listo y main.js haya creado el contenedor
document.addEventListener('DOMContentLoaded', () => {
    // Pequeño retraso para asegurar que main.js haya ejecutado actualizarNavAuth
    setTimeout(() => {
        if (Auth.isAuthenticated()) {
            const user = Auth.getUser();
            if (user && user.rol === 'TECNICO') {
                Notificaciones.init();
            }
        }
    }, 400);
});