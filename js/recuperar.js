// js/recuperar.js

document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const btn = e.target.querySelector('button');
            
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
            
            try {
                const response = await API.request('/auth/forgot-password', {
                    method: 'POST',
                    body: JSON.stringify({ email })
                });
                
                Swal.fire({
                    icon: 'success',
                    title: 'Revisa tu correo',
                    text: response.message || 'Si el correo existe, recibirás un enlace de recuperación.',
                    confirmButtonColor: '#0d6efd'
                }).then(() => {
                    window.location.href = 'login.html';
                });
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
                btn.disabled = false;
                btn.innerHTML = 'Enviar enlace de recuperación';
            }
        });
    }
});