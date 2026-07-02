// js/auth.js
const Auth = (() => {
    const USER_KEY = 'climapro_user';
    const TOKEN_KEY = 'climapro_token';

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
            localStorage.setItem(TOKEN_KEY, data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            return data.user;
        } catch (error) {
            console.error(error);
            throw new Error('Credenciales inválidas o error de servidor.');
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch(`${BASE_URL}/usuarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            // Si la respuesta no es OK, intentamos obtener el mensaje de error
            if (!response.ok) {
                let errorMessage = 'Error al registrar usuario';
                try {
                    const errorData = await response.json();
                    // El backend devuelve { message: "..." }
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Si no se puede parsear JSON, usamos el texto de la respuesta
                    errorMessage = await response.text() || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            // ✅ Registro exitoso
            return await response.json();
        } catch (error) {
            console.error('Error en registro:', error);
            throw new Error(error.message || 'Error de registro. Por favor, intenta de nuevo.');
        }
    };

    const logout = () => {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
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

    return {
        login,
        register,
        logout,
        getUser,
        getToken,
        isAuthenticated,
        requireAuth,
        protectRoute
    };
})();