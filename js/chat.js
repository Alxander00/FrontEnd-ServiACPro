// js/chat.js

const Chat = (() => {
    let stompClient = null;
    let currentUser = null;
    let conversacionId = null;
    let chatContainer = null;
    let isInitialized = false;

    const init = (conversacionIdParam, containerId, nombreDestinatario = '') => {
        currentUser = Auth.getUser();
        if (!currentUser) {
            console.warn('Usuario no autenticado');
            return;
        }

        conversacionId = conversacionIdParam;
        chatContainer = document.getElementById(containerId);
        if (!chatContainer) {
            console.warn('Contenedor de chat no encontrado:', containerId);
            return;
        }

        chatContainer.innerHTML = '';
        isInitialized = false;

        const nombreDest = document.getElementById('chatNombreDestinatario');
        if (nombreDest && nombreDestinatario) {
            nombreDest.textContent = `- ${nombreDestinatario}`;
        }

        connectWebSocket();
        cargarHistorial();

        const sendBtn = document.getElementById('chatSendBtn');
        const input = document.getElementById('chatInput');
        if (sendBtn) {
            const newBtn = sendBtn.cloneNode(true);
            sendBtn.parentNode.replaceChild(newBtn, sendBtn);
            newBtn.addEventListener('click', () => enviarMensaje());
        }
        if (input) {
            input.value = '';
            input.focus();
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') enviarMensaje();
            });
        }

        isInitialized = true;
    };

    const connectWebSocket = () => {
    if (stompClient && stompClient.connected) {
        stompClient.disconnect();
    }

    const token = Auth.getToken();
    console.log('🔑 Token para WebSocket:', token ? 'Sí' : 'No');
    const socket = new SockJS(`${API_URL}/ws-chat?token=${token}`);
    stompClient = Stomp.over(socket);

    // ✅ Manejo de reconexión automática
    socket.onclose = function() {
        console.warn('⚠️ Conexión WebSocket cerrada, intentando reconectar en 5 segundos...');
        setTimeout(() => {
            if (!stompClient.connected) {
                connectWebSocket();
            }
        }, 5000);
    };

    stompClient.connect({ 'Authorization': `Bearer ${token}` }, (frame) => {
        console.log('🔗 Conectado al WebSocket de chat');

        // Suscripción genérica para recibir los mensajes enrutados por Spring Boot
        stompClient.subscribe(`/user/queue/messages`, (message) => {
            console.log('📩 Mensaje recibido:', message.body);
            const msg = JSON.parse(message.body);
            if (msg.conversacionId == conversacionId) {
                agregarMensajeDOM(msg, false);
            }
        });

        // Suscripción a las notificaciones
        stompClient.subscribe(`/user/queue/notifications`, (notification) => {
            const notif = JSON.parse(notification.body);
            mostrarNotificacion(notif);
            if (notif.idCita) {
                const badge = document.getElementById(`badge-chat-${notif.idCita}`);
                if (badge) {
                    badge.style.display = 'inline-block';
                }
            }
        });
    }, (error) => {
        console.error('❌ Error en WebSocket:', error);
        if (!stompClient.connected) {
            console.log('🔄 Intentando reconectar en 5 segundos...');
            setTimeout(() => {
                connectWebSocket();
            }, 5000);
        }
    });
};

    const cargarHistorial = async () => {
        try {
            console.log('📂 Cargando historial para conversación:', conversacionId);
            const response = await fetch(`${API_URL}/api/conversaciones/${conversacionId}/mensajes`, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            if (response.ok) {
                const mensajes = await response.json();
                console.log('📄 Historial cargado:', mensajes.length, 'mensajes');
                chatContainer.innerHTML = '';
                mensajes.forEach(msg => agregarMensajeDOM(msg, true));
                chatContainer.scrollTop = chatContainer.scrollHeight;
            } else {
                console.warn('Error cargando historial:', response.status);
            }
        } catch (error) {
            console.error('Error cargando historial:', error);
        }
    };

    const enviarMensaje = () => {
        const input = document.getElementById('chatInput');
        const contenido = input.value.trim();
        if (!contenido) {
            return;
        }

        if (!stompClient || !stompClient.connected) {
            console.warn('❌ No hay conexión WebSocket');
            Swal.fire('Error', 'No hay conexión con el servidor de chat. Intenta recargar.', 'warning');
            return;
        }

        console.log('📤 Enviando mensaje:', contenido);

        const payload = {
            conversacionId: conversacionId,
            contenido: contenido
        };
        stompClient.send('/app/chat.send', {}, JSON.stringify(payload));

        // Mostrar localmente (optimista)
        const payloadLocal = {
            conversacionId: conversacionId,
            contenido: contenido,
            idRemitente: currentUser.idUsuario,
            remitenteNombre: currentUser.nombre || 'Yo',
            fechaEnvio: new Date().toISOString()
        };
        agregarMensajeDOM(payloadLocal, false);

        input.value = '';
        input.focus();
    };

    const agregarMensajeDOM = (mensaje, esHistorial) => {
        const isCurrentUser = mensaje.idRemitente == currentUser.idUsuario;

        const div = document.createElement('div');
        div.className = `d-flex ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'} mb-2`;

        const bubble = document.createElement('div');
        bubble.className = `p-3 rounded-4 shadow-sm ${isCurrentUser ? 'bg-primary text-white' : 'bg-light text-dark'}`;
        bubble.style.maxWidth = '75%';

        if (!isCurrentUser) {
            const nombre = document.createElement('small');
            nombre.className = 'fw-bold d-block text-primary';
            nombre.textContent = mensaje.remitenteNombre || 'Usuario';
            bubble.appendChild(nombre);
        }

        const texto = document.createElement('p');
        texto.className = 'mb-0';
        texto.textContent = mensaje.contenido;
        bubble.appendChild(texto);

        const fecha = document.createElement('small');
        fecha.className = `d-block text-end ${isCurrentUser ? 'text-white-50' : 'text-muted'}`;
        fecha.style.fontSize = '0.65rem';
        fecha.textContent = mensaje.fechaEnvio ? new Date(mensaje.fechaEnvio).toLocaleTimeString() : '';
        bubble.appendChild(fecha);

        div.appendChild(bubble);
        chatContainer.appendChild(div);

        if (!esHistorial) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    };

    const mostrarNotificacion = (notif) => {
        Swal.fire({
            icon: 'info',
            title: 'Nuevo mensaje',
            text: notif.mensaje,
            toast: true,
            position: 'top-end',
            timer: 4000,
            showConfirmButton: false
        });
    };

    const destroy = () => {
        if (stompClient) {
            stompClient.disconnect();
            stompClient = null;
        }
        isInitialized = false;
    };

    return { init, destroy };
})();