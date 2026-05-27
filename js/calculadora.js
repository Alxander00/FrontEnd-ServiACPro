// js/calculadora.js

function calcularBTU() {
    const largo = Math.abs(parseFloat(document.getElementById('largo').value));
    const ancho = Math.abs(parseFloat(document.getElementById('ancho').value));
    const alto = Math.abs(parseFloat(document.getElementById('alto').value));
    const personas = Math.max(1, parseInt(document.getElementById('personas').value) || 1);
    const inmuebles = Math.abs(parseInt(document.getElementById('inmuebles').value) || 0);

    if (largo > 0 && ancho > 0 && alto > 0) {
        // Cálculo base: Volumen x 200 (Factor promedio de enfriamiento)
        let btuTotal = largo * ancho * alto * 200;
        
        // Factores adicionales por carga térmica
        btuTotal += (personas * 600);
        btuTotal += (inmuebles * 400);

        let capacidadComercial = "";
        let recomendacion = "";
        let valorFiltro = "";

        if (btuTotal <= 9000) {
            capacidadComercial = "9,000"; 
            valorFiltro = "9000";
            recomendacion = "Ideal para habitaciones pequeñas u oficinas con poca carga térmica.";
        } else if (btuTotal <= 12500) {
            capacidadComercial = "12,000"; 
            valorFiltro = "12000";
            recomendacion = "Es el estándar para dormitorios medianos. Compensa bien el calor de electrodomésticos y ocupantes.";
        } else if (btuTotal <= 18500) {
            capacidadComercial = "18,000"; 
            valorFiltro = "18000";
            recomendacion = "Potencia recomendada para salas de estar, espacios compartidos o con varios equipos eléctricos.";
        } else if (btuTotal <= 24500) {
            capacidadComercial = "24,000"; 
            valorFiltro = "24000";
            recomendacion = "Excelente para espacios abiertos amplios o con alta concurrencia de personas.";
        } else {
            capacidadComercial = "36,000+"; 
            valorFiltro = "36000";
            recomendacion = "La carga térmica es alta. Necesitas un equipo industrial de alta potencia o instalar múltiples unidades residenciales.";
        }

        // Actualizar la vista
        document.getElementById('btu-valor').innerText = capacidadComercial;
        document.getElementById('recomendacion-texto').innerText = recomendacion;
        
        // Preparar el enlace al catálogo con el filtro pre-cargado
        const btnExplore = document.getElementById('btn-explore-dynamic');
        btnExplore.href = `catalogo.html?capacidad=${valorFiltro}`;

        // Mostrar caja de resultados con una pequeña animación (usando fade in de Bootstrap o CSS si está definido)
        const resultadoDiv = document.getElementById('resultado');
        resultadoDiv.style.display = "block";
        
        // Hacer scroll suave hacia el resultado en móviles
        resultadoDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        alert("Por favor, ingresa las dimensiones (largo, ancho y alto) correctamente para realizar el cálculo.");
    }
}