// js/reset-password.js

document.addEventListener('DOMContentLoaded', () => {
    // Obtener el token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'Enlace inválido',
            text: 'No se encontró un token de recuperación válido.',
            confirmButtonColor: '#dc3545'
        }).then(() => {
            window.location.href = 'login.html';
        });
    }

    const resetPasswordForm = document.getElementById('resetPasswordForm');
    
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirmPassword').value;
            
            if (password !== confirm) {
                Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
                return;
            }
            
            if (password.length < 6) {
                Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }
            
            const btn = e.target.querySelector('button');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Restableciendo...';
            
            try {
                const response = await API.request('/auth/reset-password', {
                    method: 'POST',
                    body: JSON.stringify({ token, password })
                });
                
                Swal.fire({
                    icon: 'success',
                    title: '¡Contraseña cambiada!',
                    text: 'Ahora puedes iniciar sesión con tu nueva contraseña.',
                    confirmButtonColor: '#0d6efd'
                }).then(() => {
                    window.location.href = 'login.html';
                });
            } catch (error) {
                UI.error(error.message);
                btn.disabled = false;
                btn.innerHTML = 'Restablecer contraseña';
            }
        });
    }
});