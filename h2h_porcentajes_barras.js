function calcularPorcentajes_VictoriasDerrotas(texto) {
    const [v, d] = texto.split('/').map(Number);
    if(v==0) return 0;
    if(d==0) return 1;
    return (v / (v+d));
}

function calcularProporcion(n1, n2) {
    if (n2 !== 0) {
        if (n1 === 0) return 1;
        return n2 / (n1 + n2);
    }
    return 0;
}

async function actualizarTodasLasBarras() {
    /*Obtenemos todos los datos de todas las filas*/
    const datosFilas = document.querySelectorAll('.h2h-info-tabla-doblefila');

    /*Ahora sacamos de las filas que tienen barras (!) los datos que necesitamos*/
    datosFilas.forEach(item => {
        const fila = item.querySelector('.h2h-info-tabla-fila');
        const barra = item.querySelector('.barra-porcentaje-tenista2');
        if( !fila || !barra ) return; // Check check check

        const dato_t1 = fila.querySelector('.h2h-info-tabla-izq strong')?.textContent.trim();
        const dato_t2 = fila.querySelector('.h2h-info-tabla-der strong')?.textContent.trim();
        const tipoDato = fila.querySelector('.h2h-info-tabla-cen')?.textContent.trim();

        // Una miqueta de programasió defensiva
        if( !dato_t1 || !dato_t2 || !tipoDato ) return;

        let ancho = 0; // Por defecto se muestra toda azul la barra

        // Ahora calculamos qué parte de la barra hay que pintar de amarillo
        if( tipoDato.startsWith('Victorias/Derrotas') ) {
            // sólo para datos que se muestran en formato "A/B"
            ancho = calcularProporcion(
                calcularPorcentajes_VictoriasDerrotas(dato_t1),
                calcularPorcentajes_VictoriasDerrotas(dato_t2)
            );
        }
        else if( tipoDato.startsWith('%') ) {
            // Porcentajes: al ser valores entre 0 y 1 no se notan tanto las diferencias
            // Elevamos al cuadrado para que se noten más las diferencias en valores altos
            ancho = calcularProporcion(Math.pow(Number(dato_t1),2), Math.pow(Number(dato_t2),2));
        }
        else {
            ancho = calcularProporcion(Number(dato_t1), Number(dato_t2));
        }

        barra.style.width = `${ancho * 100}%`;
    });
}

document.addEventListener('DOMContentLoaded', actualizarTodasLasBarras);

export { actualizarTodasLasBarras }