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
                await Auth.login(email, password);
                // Redirigir según el rol (esto ya lo maneja main.js al recargar)
                window.location.href = 'index.html';
            } catch (error) {
                UI.error(error.message || 'Error al iniciar sesión.', 'Acceso Denegado');
                
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
});