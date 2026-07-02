// js/registro.js

document.addEventListener('DOMContentLoaded', () => {
    // ========== BLOQUEAR FECHAS FUTURAS ==========
    const fechaInput = document.getElementById('fecha_nacimiento');
    if (fechaInput) {
        const today = new Date().toISOString().split('T')[0];
        fechaInput.setAttribute('max', today);
    }

    // ========== VALIDACIÓN DUI ==========
    const duiInput = document.getElementById('dui');
    const regexDUI = /^[0-9]{8}-[0-9]$/;
    
    if (duiInput) {
        duiInput.addEventListener('input', function (e) {
            let valor = e.target.value.replace(/\D/g, '');
            if (valor.length > 8) valor = valor.substring(0, 8) + '-' + valor.substring(8, 9);
            e.target.value = valor;
            
            if (regexDUI.test(e.target.value)) {
                duiInput.classList.remove('is-invalid'); 
                duiInput.classList.add('is-valid');
            } else if (e.target.value.length === 10) {
                duiInput.classList.remove('is-valid'); 
                duiInput.classList.add('is-invalid');
            }
        });
    }

    // ========== VALIDACIÓN TELÉFONO ==========
    const telefonoInput = document.getElementById('telefono');
    const regexTel = /^\d{4}-\d{4}$/;

    if (telefonoInput) {
        telefonoInput.addEventListener('input', function (e) {
            let valorNumeros = e.target.value.replace(/\D/g, '');
            if (valorNumeros.length > 8) valorNumeros = valorNumeros.slice(0, 8);
            
            let formateado = valorNumeros;
            if (valorNumeros.length > 4) {
                formateado = valorNumeros.slice(0, 4) + '-' + valorNumeros.slice(4, 8);
            }
            e.target.value = formateado;
            
            if (regexTel.test(e.target.value)) {
                telefonoInput.classList.remove('is-invalid');
                telefonoInput.classList.add('is-valid');
            } else if (e.target.value.length === 9) { 
                telefonoInput.classList.remove('is-valid');
                telefonoInput.classList.add('is-invalid');
            } else {
                telefonoInput.classList.remove('is-valid', 'is-invalid');
            }
        });
    }

    function validarFechaNacimiento() {
        const fechaVal = fechaInput.value;
        if (!fechaVal) return true;
        const selectedDate = new Date(fechaVal);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate > today) {
            alert('La fecha de nacimiento no puede ser futura.');
            fechaInput.classList.add('is-invalid');
            return false;
        } else {
            fechaInput.classList.remove('is-invalid');
            return true;
        }
    }

    function validarTelefono() {
        const tel = telefonoInput.value;
        if (!regexTel.test(tel)) {
            telefonoInput.classList.add('is-invalid');
            return false;
        } else {
            telefonoInput.classList.remove('is-invalid');
            return true;
        }
    }

    // ========== ENVÍO DEL FORMULARIO ==========
    const formRegistro = document.getElementById('formRegistro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();
            let esValido = true;

            if (!regexDUI.test(duiInput.value)) {
                duiInput.classList.add('is-invalid');
                esValido = false;
            }

            if (!validarTelefono()) {
                esValido = false;
            }

            const pass1 = document.getElementById('pass1');
            const pass2 = document.getElementById('pass2');
            if (pass1.value !== pass2.value) {
                pass2.classList.add('is-invalid');
                esValido = false;
            } else {
                pass2.classList.remove('is-invalid');
            }

            if (!validarFechaNacimiento()) {
                esValido = false;
            }

            if (!esValido) return;

            const userData = {
                nombre: document.getElementById('nombres').value.trim(),
                apellido: document.getElementById('apellidos').value.trim(),
                email: document.getElementById('correo').value.trim(),
                telefono: telefonoInput.value.trim(),
                dui: duiInput.value.trim(),
                direccion: document.getElementById('direccion').value.trim(),
                password: pass1.value,
                fechaNacimiento: fechaInput.value || null,
                rol: 'CLIENTE'
            };

            try {
                await Auth.register(userData);
                Swal.fire({
                    icon: 'success',
                    title: '¡Cuenta creada!',
                    text: 'Tu registro ha sido exitoso. Por favor, inicia sesión.',
                    confirmButtonColor: '#0d6efd'
                }).then(() => {
                    window.location.href = 'login.html';
                });
            } catch (error) {
                console.error('Error en registro:', error);
                // Mostrar el mensaje de error que viene del backend
                Swal.fire('Error', error.message || 'Error al registrar. Intente de nuevo.', 'error');
            }
        });
    }

    // ========== GEOLOCALIZACIÓN ==========
    const btnUbicacion = document.getElementById('btnUbicacion');
    const direccionTextarea = document.getElementById('direccion');
    const estadoGeo = document.getElementById('estadoGeo');

    async function obtenerDireccionDesdeCoordenadas(lat, lon) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=es`);
            const data = await response.json();
            if (data.display_name) {
                return data.display_name;
            } else {
                throw new Error('No se pudo obtener la dirección');
            }
        } catch (error) {
            console.error('Error en reverse geocoding:', error);
            return null;
        }
    }

    if (btnUbicacion) {
        btnUbicacion.addEventListener('click', () => {
            estadoGeo.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Obteniendo ubicación...';
            
            if (!navigator.geolocation) {
                estadoGeo.innerHTML = '<span class="text-danger">Tu navegador no soporta geolocalización.</span>';
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    estadoGeo.innerHTML = `<i class="fas fa-map-marker-alt"></i> Ubicación obtenida (${lat.toFixed(4)}, ${lng.toFixed(4)}). Obteniendo dirección...`;
                    
                    const direccion = await obtenerDireccionDesdeCoordenadas(lat, lng);
                    if (direccion) {
                        direccionTextarea.value = direccion;
                        estadoGeo.innerHTML = '<span class="text-success"><i class="fas fa-check-circle"></i> Dirección cargada automáticamente. Verifica que sea correcta.</span>';
                    } else {
                        estadoGeo.innerHTML = '<span class="text-danger">No se pudo obtener la dirección. Intenta manualmente.</span>';
                    }
                },
                (error) => {
                    let mensaje = 'No se pudo acceder a tu ubicación. ';
                    if (error.code === 1) mensaje += 'Permiso denegado.';
                    else if (error.code === 2) mensaje += 'Ubicación no disponible.';
                    else if (error.code === 3) mensaje += 'Tiempo de espera agotado.';
                    estadoGeo.innerHTML = `<span class="text-danger">${mensaje}</span>`;
                }
            );
        });
    }
});