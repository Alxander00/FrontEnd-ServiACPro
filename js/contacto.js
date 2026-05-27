// js/contacto.js
document.addEventListener('DOMContentLoaded', () => {
    const tipoServicio = document.getElementById("tipoServicio");
    const formAgenda = document.getElementById("formAgenda");

    if (tipoServicio) {
        tipoServicio.addEventListener('change', gestionarCalendario);
    }
    if (formAgenda) {
        formAgenda.addEventListener('submit', enviarSolicitud);
    }
});

function gestionarCalendario() {
    const servicio = document.getElementById("tipoServicio").value;
    const calendario = document.getElementById("grupoCalendario");
    const fechaCita = document.getElementById("fechaCita");
    if (servicio !== "VENTA") {
        calendario.style.display = "block";
        fechaCita.required = true;
    } else {
        calendario.style.display = "none";
        fechaCita.required = false;
        fechaCita.value = "";
    }
}

// contacto.js
async function enviarSolicitud(e) {
    e.preventDefault();
    if (!Auth.isAuthenticated()) {
        Swal.fire('Debes iniciar sesión', 'Para agendar un servicio, inicia sesión primero.', 'warning');
        window.location.href = 'login.html';
        return;
    }
    const user = Auth.getUser();
    if (user.rol !== 'CLIENTE') {
        Swal.fire('Acceso denegado', 'Solo los clientes pueden enviar solicitudes de servicio.', 'error');
        return;
    }

    const tipoServicio = document.getElementById("tipoServicio").value;
    const fechaHora = document.getElementById("fechaCita").value;
    if (tipoServicio !== "VENTA" && !fechaHora) {
        Swal.fire('Error', 'Selecciona una fecha y hora para la visita técnica.', 'error');
        return;
    }
    let fechaPreferida = null;
    if (fechaHora) fechaPreferida = new Date(fechaHora).toISOString();

    const payload = {
        idCliente: user.idUsuario,
        tipoServicio: tipoServicio,
        fechaPreferida: fechaPreferida,
        mensaje: document.querySelector('textarea[name="mensaje"]').value
    };

    try {
        await API.request('/api/solicitudes', { method: 'POST', body: JSON.stringify(payload) });
        Swal.fire('Solicitud enviada', 'El administrador revisará tu solicitud y se pondrá en contacto.', 'success');
        e.target.reset();
        gestionarCalendario();
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
}