// js/auth.js
const Auth = (() => {
    const USER_KEY = 'climapro_user';
    const TOKEN_KEY = 'climapro_token';
    const REFRESH_TOKEN_KEY = 'climapro_refresh_token';

    const getBaseUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8080';
        }
        return 'https://servi-a-c-pro.onrender.com';
    };

    const BASE_URL = getBaseUrl();

    const login = async (email, password) => {
        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error de autenticación');
            }
            const data = await response.json();
            
            // Guardar access token y refresh token
            localStorage.setItem(TOKEN_KEY, data.accessToken);
            localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            return data.user;
        } catch (error) {
            console.error(error);
            throw new Error('Credenciales inválidas o error de servidor.');
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al registrar usuario');
            }

            return data;
        } catch (error) {
            console.error('Error en registro:', error);
            throw new Error(error.message || 'Error de registro. Por favor, intenta de nuevo.');
        }
    };

    const logout = () => {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.location.href = 'login.html';
    };

    const getUser = () => {
        const userStr = localStorage.getItem(USER_KEY);
        if (!userStr || userStr === 'undefined' || userStr === 'null') return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('Error al parsear usuario:', e);
            return null;
        }
    };

    const getToken = () => localStorage.getItem(TOKEN_KEY);
    const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

    const isAuthenticated = () => {
        const token = getToken();
        return !!token && token !== 'undefined' && token !== 'null';
    };

    const protectRoute = (rolesPermitidos) => {
        if (!isAuthenticated()) {
            window.location.replace('login.html');
            return false;
        }
        const user = getUser();
        if (rolesPermitidos && (!user || !rolesPermitidos.includes(user.rol))) {
            window.location.replace('index.html');
            return false;
        }
        return true;
    };

    const requireAuth = (redirectUrl = 'login.html') => {
        if (!isAuthenticated()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    };

    // Renovar Access Token usando Refresh Token
    const refreshAccessToken = async () => {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error('No hay refresh token disponible');

        try {
            const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Refresh token inválido');
            }

            const data = await response.json();
            localStorage.setItem(TOKEN_KEY, data.accessToken);
            return data.accessToken;
        } catch (error) {
            // Si falla, cerrar sesión
            logout();
            throw error;
        }
    };

    return {
        login,
        register,
        logout,
        getUser,
        getToken,
        getRefreshToken,
        refreshAccessToken,
        isAuthenticated,
        requireAuth,
        protectRoute
    };
})();