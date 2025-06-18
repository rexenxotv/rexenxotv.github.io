function actualizarCircunferenciaVS() {
    const victorias_t1 = document.querySelector('.victorias-tenista1 strong');
    const victorias_t2 = document.querySelector('.victorias-tenista2 strong');

    // Extraemos los valores
    const v1 = Number(victorias_t1.textContent.trim());
    const v2 = Number(victorias_t2.textContent.trim());
    const total = v1 + v2;

    let ratioTenista2 = 0;
    if(total!=0) ratioTenista2 = v2 / total;

    calcularCirculoVS(ratioTenista2);
}

/*Función a la cual le pasas el porcentaje del tenista2 y te corrige el estilo del círculo*/
function calcularCirculoVS(ratioTenista2) {
    const circulo = document.querySelector('.circunferencia-porcentajes');
    const grados = ratioTenista2 * 360;

    circulo.style.background = `conic-gradient(
        yellow 0deg ${grados}deg,
        blue ${grados}deg 360deg
    )`;
}

document.addEventListener('DOMContentLoaded', actualizarCircunferenciaVS);

export { actualizarCircunferenciaVS }