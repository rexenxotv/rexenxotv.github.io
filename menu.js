document.addEventListener('DOMContentLoaded', () => {
    // Cómo están los máquinas lo primero de todo
    window.actualizarRatioPantalla();

    fetch("menu.html").then(res => res.text()).then(html => {
        const menu = document.getElementById("menu");
        menu.innerHTML = html;
        
        // Linkear botones pa ver y quitar el menú lateral
        // Se hace aquí dentro porque tiene que ya estar insertado el html plas
        const botonVerMas = document.querySelector(".boton-ver-apartados");
        const menuLateral = document.getElementById("menu-lateral");

        botonVerMas.addEventListener("click", () => {
            menuLateral.classList.toggle("activo");
        });
        
        const botonVerMenos = document.querySelector(".boton-ver-menos");

        botonVerMenos.addEventListener("click", () => {
            menuLateral.classList.remove("activo");
        });

        // queda pal futuro
        // Añadir torneos al submenú de torneos
        /* 
        const IDsTorneos = getIDsTorneos();
        const listaTorneos = document.getElementById("lista-torneos");

        IDsTorneos.forEach(nombre => {
            const li = document.createElement("li");
            li.innerHTML = `<a href="torneo.html?id=${nombre}">${nombre}</a>`;
            listaTorneos.appendChild(li);
        });*/
    });
});