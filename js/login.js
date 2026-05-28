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
                window.location.href = 'index.html';
            } catch (error) {
                // Reemplazamos el alert() viejo por Swal.fire
                Swal.fire({
                    icon: 'error',
                    title: 'Acceso Denegado',
                    text: 'Error al iniciar sesión. Verifica tus credenciales.',
                    confirmButtonColor: '#dc3545'
                });
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
});