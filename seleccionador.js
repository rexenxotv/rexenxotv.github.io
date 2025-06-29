document.addEventListener("DOMContentLoaded", function () {
    const links = document.querySelectorAll('.seleccion-modo');
    const contents = document.querySelectorAll('.seleccion-contenido');

    links.forEach(link => {
        link.addEventListener("click", function (e) {
            // Ponemos el href=# por ciertos temas pero tenemos que
            // cancelar sus efectos ya que saltaría al inicio de la página
            e.preventDefault();

            // Desactivar todos los links
            links.forEach(l => l.classList.remove("seleccion-modo--activa"));
            // Activar el link pulsado
            this.classList.add("seleccion-modo--activa");

            // Ocultamos todo el contenido
            contents.forEach(c => c.classList.remove("seleccion-contenido--activa"));
            // Mostramos el contenido seleccionado
            const botonId = this.getAttribute("data-boton");
            const contenidoVisible = document.querySelector(`.seleccion-contenido[data-info="${botonId}"]`); // Masonería
            contenidoVisible.classList.add("seleccion-contenido--activa");
        });
    });
});