// js/auth.js
const Auth = (() => {
    const USER_KEY = 'climapro_user';
    // Se define la URL de Render aquí para que login y registro no busquen tu PC local
    // const BASE_URL = 'http://localhost:8080';
    const BASE_URL = 'https://servi-a-c-pro.onrender.com';
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
            const user = await response.json();
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            return user;
        } catch (error) {
            console.error(error);
            throw new Error('Credenciales inválidas o error de servidor.');
        }
    };

    const register = async (userData) => {
        try {
            const payload = {
                nombre: userData.nombre,
                apellido: userData.apellidos,
                dui: userData.dui,
                email: userData.email,
                telefono: userData.telefono,
                password: userData.password,
                fechaNacimiento: userData.fechaNacimiento,
                genero: userData.genero,
                direccion: userData.direccion,
                rol: 'CLIENTE',
                activo: true
            };
            const response = await fetch(`${BASE_URL}/usuarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error en registro');
            }
            const nuevoUsuario = await response.json();
            return nuevoUsuario;
        } catch (error) {
            throw new Error('No se pudo completar el registro: ' + error.message);
        }
    };

    const logout = () => {
        localStorage.removeItem(USER_KEY);
        window.location.href = 'login.html';
    };

    const getUser = () => {
        const userStr = localStorage.getItem(USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    };

    const isAuthenticated = () => !!localStorage.getItem(USER_KEY);

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
        isAuthenticated,
        requireAuth
    };
})();