// js/api.js

const getApiUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8080';
    }
    return 'https://servi-a-c-pro.onrender.com';
};

const API_URL = getApiUrl();
console.log('🌐 API_URL:', API_URL);

const API = {
    getToken() {
        return localStorage.getItem('climapro_token');
    },

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = { ...options, headers };

        try {
            let response = await fetch(`${API_URL}${endpoint}`, config);

            if (response.status === 401) {
                try {
                    const newToken = await Auth.refreshAccessToken();
                    headers['Authorization'] = `Bearer ${newToken}`;
                    config.headers = headers;
                    response = await fetch(`${API_URL}${endpoint}`, config);
                } catch (refreshError) {
                    localStorage.removeItem('climapro_user');
                    localStorage.removeItem('climapro_token');
                    localStorage.removeItem('climapro_refresh_token');
                    if (!window.location.pathname.includes('login.html')) {
                        window.location.href = 'login.html';
                    }
                    throw new Error('Sesión expirada. Inicia sesión nuevamente.');
                }
            }

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
        listarActivos() { return API.request('/productos'); },
        obtenerPorId(id) { return API.request(`/productos/${id}`); },
        crear(data) { return API.request('/productos', { method: 'POST', body: JSON.stringify(data) }); },
        actualizar(id, data) { return API.request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
        eliminar(id) { return API.request(`/productos/${id}`, { method: 'DELETE' }); },
        listarPopulares() { return API.request('/productos/populares'); },
        stockDisponible(id) { return API.request(`/productos/${id}/stock`); }
    },

    Usuarios: {
        registrar(data) { return API.request('/usuarios', { method: 'POST', body: JSON.stringify(data) }); },
        obtenerPorEmail(email) { return API.request(`/usuarios/email/${email}`); },
        actualizar(id, data) { return API.request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
        listar() { return API.request('/usuarios'); },
        cambiarEstado(id, activo) { return API.request(`/usuarios/${id}/estado?activo=${activo}`, { method: 'PATCH' }); }
    },

    Pedidos: {
        crear(data) { return API.request('/api/pedidos', { method: 'POST', body: JSON.stringify(data) }); },
        listar() { return API.request('/api/pedidos'); },
        listarPorUsuario(idUsuario) { return API.request(`/api/pedidos/usuario/${idUsuario}`); },
        listarPorUsuarioPaginado(idUsuario, page = 0, size = 6) {
            return API.request(`/api/pedidos/usuario/${idUsuario}/paginado?page=${page}&size=${size}`);
        },
        cambiarEstado(id, estado) { return API.request(`/api/pedidos/${id}/estado?estado=${estado}`, { method: 'PATCH' }); }
    },

    Citas: {
        listar() { return API.request('/api/citas'); },
        listarPorTecnico(idTecnico, page = 0, size = 10) {
            return API.request(`/api/citas/tecnico/${idTecnico}?page=${page}&size=${size}`);
        },
        listarPorCliente(idCliente) { return API.request(`/api/citas/cliente/${idCliente}`); },
        listarPorClientePaginado(idCliente, page = 0, size = 6) {
            return API.request(`/api/citas/cliente/${idCliente}/paginado?page=${page}&size=${size}`);
        },
        crear(data) { return API.request('/api/citas', { method: 'POST', body: JSON.stringify(data) }); },
        cambiarEstado(id, estado) { return API.request(`/api/citas/${id}/estado?estado=${estado}`, { method: 'PATCH' }); }
    },

    Solicitudes: {
        crear(data) { return API.request('/api/solicitudes', { method: 'POST', body: JSON.stringify(data) }); },
        listarPendientes() { return API.request('/api/solicitudes/pendientes'); },
        listarPorCliente(idCliente) { return API.request(`/api/solicitudes/cliente/${idCliente}`); },
        listarPorClientePaginado(idCliente, page = 0, size = 6) {
            return API.request(`/api/solicitudes/cliente/${idCliente}/paginado?page=${page}&size=${size}`);
        },
        asignarTecnico(id, data) { return API.request(`/api/solicitudes/${id}/asignar`, { method: 'POST', body: JSON.stringify(data) }); },
        rechazar(id) { return API.request(`/api/solicitudes/${id}/rechazar`, { method: 'POST' }); }
    },

    Estadisticas: {
        obtenerDashboard() { return API.request('/api/estadisticas/dashboard'); }
    },

    Auth: {
        forgotPassword(email) { return API.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); },
        resetPassword(token, password) { return API.request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }); }
    },

    Resenas: {
        listarPorProducto(productoId) { return API.request(`/api/resenas/producto/${productoId}`); },
        obtenerEstadisticas(productoId) { return API.request(`/api/resenas/producto/${productoId}/estadisticas`); },
        crear(data) { return API.request('/api/resenas', { method: 'POST', body: JSON.stringify(data) }); },
        puedeResenar(productoId, usuarioId) { return API.request(`/api/resenas/puede-resenar?productoId=${productoId}&usuarioId=${usuarioId}`); }
    },

    Equipos: {
        listarPorCliente(idCliente) { return API.request(`/api/equipos-cliente/cliente/${idCliente}`); },
        listarPorClientePaginado(idCliente, page = 0, size = 6) {
            return API.request(`/api/equipos-cliente/cliente/${idCliente}/paginado?page=${page}&size=${size}`);
        },
        crear(data) { return API.request('/api/equipos-cliente', { method: 'POST', body: JSON.stringify(data) }); }
    },

    Repuestos: {
        listarActivos() { return API.request('/api/repuestos'); },
        crear(data) { return API.request('/api/repuestos', { method: 'POST', body: JSON.stringify(data) }); }
    },
};