// Este js sirve para que el ratio siempre sea como si viera en un móvil también en ordenadores
function actualizarRatioPantalla() {
    const ladoCorto = Math.min(window.innerWidth, window.innerHeight);
    const vw = ladoCorto * 0.01;
    //console.log('setting --vw to:', `${vw}px`); DEBUG
    document.documentElement.style.setProperty('--vw', `${vw}px`);
}

// Hacer que sea una función global
window.actualizarRatioPantalla = actualizarRatioPantalla;

// Inicialización inicial
actualizarRatioPantalla();

// Hacer que se recalcule cuando cambia la orientación o el tamaño
window.addEventListener('resize', actualizarRatioPantalla);
window.addEventListener('orientationchange', actualizarRatioPantalla);