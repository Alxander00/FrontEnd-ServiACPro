// js/auth.js
const Auth = (() => {
    const USER_KEY = 'climapro_user';
    const TOKEN_KEY = 'climapro_token';

    // ==========================================
    // DETECCIÓN AUTOMÁTICA DEL ENTORNO
    // ==========================================
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
            // Guardar token y usuario
            localStorage.setItem(TOKEN_KEY, data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            return data.user;
        } catch (error) {
            console.error(error);
            throw new Error('Credenciales inválidas o error de servidor.');
        }
    };

    const logout = () => {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = 'login.html';
    };

    const getUser = () => {
        const userStr = localStorage.getItem(USER_KEY);
        // Si es null, undefined o la cadena "undefined", devolvemos null
        if (!userStr || userStr === 'undefined' || userStr === 'null') {
            return null;
        }
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
        // 1. Verificar si NO hay sesión activa en el navegador
        if (!isAuthenticated()) {
            window.location.replace('login.html'); // Usamos replace() para borrar el historial
            return false;
        }

        // 2. Verificar si el usuario tiene el rol correcto para esta página
        const user = getUser();
        if (rolesPermitidos && (!user || !rolesPermitidos.includes(user.rol))) {
            // Si intenta entrar a una vista que no le corresponde
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

    // 👇 EL RETORNO QUE HACE PÚBLICA LA FUNCIÓN 👇
    return {
        login,
        logout,
        getUser,
        getToken,
        isAuthenticated,
        requireAuth,
        protectRoute
    };
})();