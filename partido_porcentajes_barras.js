async function actualizarTodasLasBarras() {
    /*Obtenemos todos los datos de todas las filas*/
    const datosFilas = document.querySelectorAll('.flex');

    /*Ahora sacamos de las filas que tienen barras (!) los datos que necesitamos*/
    datosFilas.forEach(item => {
        const dato_t1 = item.querySelector('.dato-t1');
        const barra_t1 = item.querySelector('.barra-t1');
        const barra_t2 = item.querySelector('.barra-t2');
        const dato_t2 = item.querySelector('.dato-t2');
        if( !dato_t1 || !barra_t1 || !barra_t2 || !dato_t2 ) return; // Check check check

        let contenido_dato_t1 = dato_t1.textContent.trim();
        let contenido_dato_t2 = dato_t2.textContent.trim();
        // Si es un porcentaje hay que hacer split('%')
        contenido_dato_t1 = Number(contenido_dato_t1.split('%')[0]);
        contenido_dato_t2 = Number(contenido_dato_t2.split('%')[0]);

        // Añadimos el relleno correspondiente
        const relleno_barra_t1 = item.querySelector('.relleno-barra-t1');
        const relleno_barra_t2 = item.querySelector('.relleno-barra-t2');
        if( !relleno_barra_t1 || !relleno_barra_t2 ) return; // Check check check

        // Si no es un porcentaje tenemos que convertirlo
        if(["aces", "doblesFaltas", "tiebreaksGanados", "juegosEnBlanco", "MRPG", "MRJG"].includes(item.id)) {
            const denominador = contenido_dato_t1 + contenido_dato_t2;
            if(denominador !== 0) {
                contenido_dato_t1 = contenido_dato_t1 / denominador;
                contenido_dato_t2 = contenido_dato_t2 / denominador;
            }
        }
        else {
            // Si es un porcentaje hay que dividirlo entre 100
            contenido_dato_t1 = contenido_dato_t1 / 100;
            contenido_dato_t2 = contenido_dato_t2 / 100;
        }

        // Establecemos el ancho correspondiente
        relleno_barra_t1.style.width = `${contenido_dato_t1 * 100}%`;
        relleno_barra_t2.style.width = `${contenido_dato_t2 * 100}%`;
    });
}

document.addEventListener('DOMContentLoaded', actualizarTodasLasBarras);

export { actualizarTodasLasBarras }