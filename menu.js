document.addEventListener('DOMContentLoaded', () => {
    // Cómo están los máquinas lo primero de todo
    window.actualizarRatioPantalla();

    fetch("menu.html").then(res => 
        res.text()).then(html => {
            const menu = document.getElementById("menu");
            menu.innerHTML = html;
        });
});