// js/index.js

document.addEventListener('DOMContentLoaded', async () => {
    await cargarProductosInicio();
});

async function cargarProductosInicio() {
    const contenedor = document.getElementById('contenedorDestacados');
    if (!contenedor) return;

    try {
        const productos = await API.Productos.listarActivos();
        
        if (productos.length === 0) {
            contenedor.innerHTML = '<div class="col-12"><p class="text-center text-muted">Aún no hay productos en el catálogo.</p></div>';
            return;
        }

        // Mezclamos aleatoriamente para que siempre cambien en la portada
        const mezclados = productos.sort(() => 0.5 - Math.random());
        // Tomamos los 3 primeros (o menos si no hay suficientes)
        const seleccionados = mezclados.slice(0, 3);

        contenedor.innerHTML = ''; 
        
    // Dentro de cargarProductosInicio(), reemplaza el bucle seleccionados.forEach por esto:

    seleccionados.forEach((prod) => {
        // Sin oferta fija
        let imgUrl = "./img/breezeless_ambiente.png";
        if (prod.imagenesUrls && prod.imagenesUrls.length > 0) {
            //imgUrl = 'https://localhost:8080' + prod.imagenesUrls[0];
            imgUrl = 'https://servi-a-c-pro.onrender.com' + prod.imagenesUrls[0];
        }

        const col = document.createElement('div');
        col.className = 'col-md-4';
        col.innerHTML = `
            <div class="card h-100 border-0 shadow-sm product-card">
                <div class="position-relative">
                    <img src="${imgUrl}" class="card-img-top p-3 bg-light" alt="${prod.nombre}" style="height: 250px; object-fit: contain;">
                    <span class="position-absolute top-0 end-0 m-3 badge bg-primary">${prod.capacidadBTU} BTU</span>
                </div>
                <div class="card-body d-flex flex-column text-center">
                    <span class="text-info fw-bold small text-uppercase">${prod.nombreCategoria || 'Equipo'}</span>
                    <h5 class="card-title fw-bold text-dark mt-2 mb-3">${prod.nombre}</h5>
                    <div class="mt-auto">
                        <h4 class="text-primary fw-bold mb-3">$${prod.precio.toFixed(2)}</h4>
                        <a href="catalogo.html" class="btn btn-info text-white w-100 fw-bold">Ver en Catálogo</a>
                    </div>
                </div>
            </div>
        `;
        contenedor.appendChild(col);
    });
    } catch (error) {
        console.error("Error al cargar productos de inicio:", error);
        contenedor.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error al cargar las ofertas. Asegúrate de que el servidor esté conectado.</p></div>';
    }
}