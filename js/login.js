// js/login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            let email = document.getElementById('email').value.trim();
            let password = document.getElementById('password').value.trim();
            
            const btn = e.target.querySelector('button');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Ingresando...';

            try {
                // Ahora capturamos los datos del usuario al iniciar sesión
                const user = await Auth.login(email, password);
                
                // 🚀 MAGIA DE REDIRECCIÓN: Según el rol, lo mandamos a su área
                if (user.rol === 'TECNICO') {
                    window.location.replace('tecnico.html');
                } else if (user.rol === 'ADMIN') {
                    window.location.replace('admin.html');
                } else {
                    window.location.replace('index.html'); // Cliente normal
                }
                
            } catch (error) {
                UI.error(error.message || 'Error al iniciar sesión.', 'Acceso Denegado');
                
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
});