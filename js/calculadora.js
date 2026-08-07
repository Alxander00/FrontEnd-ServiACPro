function calcularBTU() {
    const largo = Math.abs(parseFloat(document.getElementById('largo').value));
    const ancho = Math.abs(parseFloat(document.getElementById('ancho').value));
    const alto = Math.abs(parseFloat(document.getElementById('alto').value));
    const personas = Math.max(1, parseInt(document.getElementById('personas').value) || 1);
    const inmuebles = Math.abs(parseInt(document.getElementById('inmuebles').value) || 0);
    
    const zonaClima = document.getElementById('zonaClima').value;
    const solDirecto = document.getElementById('solDirecto').value;

    if (largo > 0 && ancho > 0 && alto > 0) {
        const volumen = largo * ancho * alto;
        const factorZona = (zonaClima === 'calurosa') ? 230 : 200;
        let btuTotal = volumen * factorZona;
        
        btuTotal += (personas * 600);
        btuTotal += (inmuebles * 400);

        if (solDirecto === 'si') {
            btuTotal = btuTotal * 1.10;
        }

        let capacidadComercial = "";
        let recomendacion = "";
        let valorFiltro = "";

        if (btuTotal <= 10000) {
            capacidadComercial = "9,000"; 
            valorFiltro = "9000";
            recomendacion = "Ideal para habitaciones pequeñas o estudios. Eficiencia óptima garantizada.";
        } else if (btuTotal <= 14000) {
            capacidadComercial = "12,000"; 
            valorFiltro = "12000";
            recomendacion = "Estándar para dormitorios medianos o salas compactas. Compensa excelente la carga térmica.";
        } else if (btuTotal <= 20000) {
            capacidadComercial = "18,000"; 
            valorFiltro = "18000";
            recomendacion = "Potencia recomendada para salas de estar amplias o espacios con alta concurrencia.";
        } else if (btuTotal <= 28000) {
            capacidadComercial = "24,000"; 
            valorFiltro = "24000";
            recomendacion = "Excelente para áreas abiertas grandes o oficinas ejecutivas. Enfriamiento rápido.";
        } else {
            capacidadComercial = "36,000+"; 
            valorFiltro = "36000";
            recomendacion = "Carga térmica muy alta. Se recomienda evaluar equipos comerciales tipo cassette/paquete o múltiples unidades.";
        }

        // Actualizar la vista
        document.getElementById('btu-valor').innerText = capacidadComercial;
        document.getElementById('recomendacion-texto').innerText = recomendacion;
        
        const btnExplore = document.getElementById('btn-explore-dynamic');
        btnExplore.href = `catalogo.html?capacidad=${valorFiltro}`;

        const resultadoDiv = document.getElementById('resultado');
        resultadoDiv.style.display = "block";
        resultadoDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        if (typeof window.UI !== 'undefined' && window.UI.error) {
            window.UI.error('Por favor, ingresa dimensiones válidas (largo, ancho y alto).');
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Faltan datos',
                text: 'Por favor, ingresa las dimensiones (largo, ancho y alto).',
                confirmButtonColor: '#0d6efd'
            });
        }
    }
}