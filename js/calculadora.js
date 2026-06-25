function calcularBTU() {
    const largo = Math.abs(parseFloat(document.getElementById('largo').value));
    const ancho = Math.abs(parseFloat(document.getElementById('ancho').value));
    const alto = Math.abs(parseFloat(document.getElementById('alto').value));
    const personas = Math.max(1, parseInt(document.getElementById('personas').value) || 1);
    const inmuebles = Math.abs(parseInt(document.getElementById('inmuebles').value) || 0);
    
    // Nuevos factores
    const zonaClima = document.getElementById('zonaClima').value;
    const solDirecto = document.getElementById('solDirecto').value;

    if (largo > 0 && ancho > 0 && alto > 0) {
        // Cálculo base de Metros Cúbicos
        const volumen = largo * ancho * alto;
        
        // Multiplicador según zona (200 templada, 230 costa/calor)
        const factorZona = (zonaClima === 'calurosa') ? 230 : 200;
        let btuTotal = volumen * factorZona;
        
        // Carga extra por personas y equipos
        btuTotal += (personas * 600);
        btuTotal += (inmuebles * 400);

        // Penalización del 10% si le pega el sol de la tarde
        if (solDirecto === 'si') {
            btuTotal = btuTotal * 1.10;
        }

        let capacidadComercial = "";
        let recomendacion = "";
        let valorFiltro = "";

        // Ajustamos los rangos a capacidades comerciales reales estándar
        if (btuTotal <= 10000) {
            capacidadComercial = "9,000"; 
            valorFiltro = "9000";
            recomendacion = "Ideal para habitaciones pequeñas. Eficiencia óptima calculada.";
        } else if (btuTotal <= 14000) {
            capacidadComercial = "12,000"; 
            valorFiltro = "12000";
            recomendacion = "Estándar para dormitorios medianos o salas pequeñas. Compensa bien la carga térmica.";
        } else if (btuTotal <= 20000) {
            capacidadComercial = "18,000"; 
            valorFiltro = "18000";
            recomendacion = "Potencia recomendada para salas de estar amplias o espacios con varios equipos y personas.";
        } else if (btuTotal <= 28000) {
            capacidadComercial = "24,000"; 
            valorFiltro = "24000";
            recomendacion = "Excelente para espacios abiertos grandes. Gran capacidad de enfriamiento rápido.";
        } else {
            capacidadComercial = "36,000+"; 
            valorFiltro = "36000";
            recomendacion = "Carga térmica muy alta. Necesitas un equipo tipo paquete/cassette industrial o instalar múltiples unidades residenciales.";
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
        Swal.fire('Faltan datos', 'Por favor, ingresa las dimensiones (largo, ancho y alto).', 'warning');
    }
}