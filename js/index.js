document.addEventListener('DOMContentLoaded', async () => {
    await cargarProductosInicio();
});

async function cargarProductosInicio() {
    const contenedorPrincipal = document.getElementById('contenedorDestacados');
    if (!contenedorPrincipal) return;

    try {
        const response = await API.Productos.listarActivos();
        const productos = response.content || response || [];

        if (productos.length === 0) {
            contenedorPrincipal.innerHTML = '<p class="text-center text-muted">Aún no hay productos.</p>';
            return;
        }

        const seleccionados = productos.sort(() => 0.5 - Math.random()).slice(0, 6);

        contenedorPrincipal.className = 'position-relative w-100 mx-auto px-2 px-md-4'; 
        contenedorPrincipal.innerHTML = '';

        // 🚨 EL SECRETO: Agregamos la regla de ancho directamente al CSS
        const styleId = 'carrusel-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                #track-carrusel::-webkit-scrollbar { display: none !important; }
                .btn-flecha {
                    width: 45px; height: 45px;
                    background-color: #0d6efd; color: white;
                    border: none; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    cursor: pointer; z-index: 10;
                    transition: transform 0.2s, background-color 0.2s;
                }
                .btn-flecha:hover { transform: scale(1.1); background-color: #0b5ed7; }
                
                /* Clase para controlar el ancho perfecto en cualquier dispositivo */
                .tarjeta-carrusel-item {
                    width: 80%; /* 80% para que en celular asome la siguiente tarjeta */
                }
                @media (min-width: 768px) {
                    .tarjeta-carrusel-item {
                        width: 32%; /* 32% para mostrar 3 completas en PC */
                    }
                }
            `;
            document.head.appendChild(style);
        }

        const btnLeft = document.createElement('button');
        btnLeft.className = 'btn-flecha position-absolute start-0 top-50 translate-middle-y d-none d-md-flex';
        btnLeft.innerHTML = '<i class="fas fa-chevron-left fs-5"></i>';
        btnLeft.style.marginLeft = '-15px';

        const btnRight = document.createElement('button');
        btnRight.className = 'btn-flecha position-absolute end-0 top-50 translate-middle-y d-none d-md-flex';
        btnRight.innerHTML = '<i class="fas fa-chevron-right fs-5"></i>';
        btnRight.style.marginRight = '-15px';

        const track = document.createElement('div');
        track.id = 'track-carrusel';
        track.className = 'd-flex flex-nowrap align-items-stretch overflow-x-auto pb-3 pt-2';
        track.style.gap = '15px';
        track.style.WebkitOverflowScrolling = 'touch';
        track.style.scrollSnapType = 'x mandatory';
        track.style.scrollbarWidth = 'none'; 
        track.style.msOverflowStyle = 'none'; 

        btnLeft.onclick = () => track.scrollBy({ left: -320, behavior: 'smooth' });
        btnRight.onclick = () => track.scrollBy({ left: 320, behavior: 'smooth' });

        seleccionados.forEach((prod) => {
            let imgUrl = './img/breezeless_ambiente.png';
            if (prod.imagenesUrls && prod.imagenesUrls.length > 0) {
                imgUrl = prod.imagenesUrls[0];
            }

            const col = document.createElement('div');
            // 🚨 Asignamos la nueva clase CSS que creamos arriba
            col.className = 'tarjeta-carrusel-item flex-shrink-0 d-flex'; 
            col.style.scrollSnapAlign = 'center'; 
            
            col.innerHTML = `
                <div class="card w-100 bg-white border" style="border-color: #f1f3f5 !important; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; box-shadow: none; display: flex; flex-direction: column;" onclick="window.location.href='catalogo.html'" onmouseover="this.style.borderColor='#0d6efd' !important; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.08)';" onmouseout="this.style.borderColor='#f1f3f5' !important; this.style.boxShadow='none';">
                    
                    <span class="position-absolute top-0 start-0 m-2 badge bg-warning text-dark rounded-1 fw-bold px-2 py-1" style="font-size: 0.7rem; z-index: 2; letter-spacing: 0.5px; border: 1px solid #ffc107;">
                        ${prod.capacidadBTU} BTU
                    </span>
                    
                    <div class="p-3" style="height: 150px; display: flex; align-items: center; justify-content: center; background-color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                        <img src="${imgUrl}" alt="${prod.nombre}" style="max-height: 100%; max-width: 100%; object-fit: contain;">
                    </div>
                    
                    <div class="card-body d-flex flex-column text-center p-3 pt-2 bg-white flex-grow-1" style="border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                        
                        <span class="text-secondary fw-semibold text-uppercase mb-1" style="font-size: 0.65rem; letter-spacing: 1px;">
                            ${prod.nombreCategoria || 'Equipo'}
                        </span>
                        
                        <h6 class="fw-bold text-dark mb-2" style="font-size: 0.85rem; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.6em;">
                            ${prod.nombre}
                        </h6>
                        
                        <div class="mt-auto pt-2">
                            <h5 class="text-primary fw-bolder mb-3" style="font-size: 1.2rem;">$${prod.precio.toFixed(2)}</h5>
                            
                            <button class="btn btn-primary w-100 fw-bold rounded-1 text-uppercase shadow-none" style="font-size: 0.75rem; padding: 10px 0; letter-spacing: 0.5px;" onclick="event.stopPropagation(); window.location.href='catalogo.html'">
                                Ver detalles
                            </button>
                        </div>
                    </div>
                </div>
            `;
            track.appendChild(col);
        });

        const cardVerTodo = document.createElement('div');
        // 🚨 Asignamos la nueva clase CSS también a la tarjeta final
        cardVerTodo.className = 'tarjeta-carrusel-item flex-shrink-0 d-flex flex-column align-items-center justify-content-center';
        cardVerTodo.style.scrollSnapAlign = 'center';
        cardVerTodo.style.cursor = 'pointer';
        cardVerTodo.onclick = () => window.location.href = 'catalogo.html';
        cardVerTodo.innerHTML = `
            <div class="rounded-circle bg-light d-flex align-items-center justify-content-center mb-2 shadow-sm" style="width: 60px; height: 60px; border: 1px solid #dee2e6; transition: all 0.2s;" onmouseover="this.classList.replace('bg-light', 'bg-primary'); this.querySelector('i').classList.replace('text-primary', 'text-white');" onmouseout="this.classList.replace('bg-primary', 'bg-light'); this.querySelector('i').classList.replace('text-white', 'text-primary');">
                <i class="fas fa-arrow-right text-primary fs-4"></i>
            </div>
            <span class="text-primary fw-bold text-center" style="font-size: 0.85rem;">Ver todo el<br>Catálogo</span>
        `;
        track.appendChild(cardVerTodo);

        contenedorPrincipal.appendChild(btnLeft);
        contenedorPrincipal.appendChild(track);
        contenedorPrincipal.appendChild(btnRight);

    } catch (error) {
        console.error("Error al cargar productos de inicio:", error);
        if(contenedorPrincipal) contenedorPrincipal.innerHTML = '<p class="text-center text-danger">Error al cargar las ofertas.</p>';
    }
}