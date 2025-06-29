async function actualizarTodasLasBarras() {
    /*Obtenemos todos los datos de todas las filas*/
    const datosFilas = document.querySelectorAll('.ts-tabla-doblefila');

    /*Ahora sacamos de las filas que tienen barras (!) los datos que necesitamos*/
    datosFilas.forEach(item => {
        const fila = item.querySelector('.ts-tabla-fila');
        const barra = item.querySelector('.barra-porcentaje');
        if( !fila || !barra ) return; // Check check check

        const tipoDato = fila.querySelector('.ts-tabla-izq')?.textContent.trim();
        const dato = fila.querySelector('.ts-tabla-der strong')?.textContent.trim();

        // Una miqueta de programasió defensiva
        if( !dato || !tipoDato ) return;

        let ancho = 0; // Por defecto se muestra toda gris la barra

        // Si se trata de un porcentaje calculamos qué parte de la barra hay que pintar de azul
        if( tipoDato.startsWith('%') ) {
            ancho = Number(dato);
        }

        barra.style.width = `${ancho * 100}%`;
    });
}

document.addEventListener('DOMContentLoaded', actualizarTodasLasBarras);

export { actualizarTodasLasBarras }