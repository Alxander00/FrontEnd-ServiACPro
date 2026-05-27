// js/api.js
const API_URL = 'http://localhost:8080';

const API = {
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        const config = { ...options, headers };
        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error de conexión');
            }
            if (response.status === 204) return null;
            return await response.json();
        } catch (error) {
            console.error(`Error en API (${endpoint}):`, error);
            throw error;
        }
    },

    Productos: {
        listarActivos: () => API.request('/productos'),
        obtenerPorId: (id) => API.request(`/productos/${id}`),
        crear: (data) => API.request('/productos', { method: 'POST', body: JSON.stringify(data) }),
        actualizar: (id, data) => API.request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        eliminar: (id) => API.request(`/productos/${id}`, { method: 'DELETE' }),
        listarPopulares: () => API.request('/productos/populares')
    },

    Usuarios: {
        registrar: (data) => API.request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
        obtenerPorEmail: (email) => API.request(`/usuarios/email/${email}`),
        actualizar: (id, data) => API.request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        listar: () => API.request('/usuarios'),
        cambiarEstado: (id, activo) => API.request(`/usuarios/${id}/estado?activo=${activo}`, { method: 'PATCH' })
    },

    Pedidos: {
        crear: (data) => API.request('/api/pedidos', { method: 'POST', body: JSON.stringify(data) }),
        listar: () => API.request('/api/pedidos'),
        listarPorUsuario: (idUsuario) => API.request(`/api/pedidos/usuario/${idUsuario}`),
        cambiarEstado: (id, estado) => API.request(`/api/pedidos/${id}/estado?estado=${estado}`, { method: 'PATCH' })
    },

    Citas: {
        listarPorTecnico: (idTecnico) => API.request(`/api/citas/tecnico/${idTecnico}`),
        crear: (data) => API.request('/api/citas', { method: 'POST', body: JSON.stringify(data) }),
        cambiarEstado: (id, estado) => API.request(`/api/citas/${id}/estado?estado=${estado}`, { method: 'PATCH' })
    },

    Estadisticas: {
        obtenerDashboard: () => API.request('/api/estadisticas/dashboard')
    },

    Auth: {
        forgotPassword: (email) => API.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
        resetPassword: (token, password) => API.request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) })
    },

    // RESEÑAS - ENVÍA AMBOS PARÁMETROS (productoId y usuarioId)
    Resenas: {
        listarPorProducto: (productoId) => API.request(`/api/resenas/producto/${productoId}`),
        obtenerEstadisticas: (productoId) => API.request(`/api/resenas/producto/${productoId}/estadisticas`),
        crear: (data) => API.request('/api/resenas', { method: 'POST', body: JSON.stringify(data) }),
        puedeResenar: (productoId, usuarioId) => API.request(`/api/resenas/puede-resenar?productoId=${productoId}&usuarioId=${usuarioId}`)
    }
};