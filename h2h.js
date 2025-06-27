
import { getTodosLosTenistas } from './firebase-init.js';
import { setDatosH2H } from './h2h_setDatos.js';

document.addEventListener('DOMContentLoaded', () => {
    const boton1 = document.getElementById('botonBuscarTenista1');
    const boton2 = document.getElementById('botonBuscarTenista2');
    const lista1 = document.getElementById('opciones1');
    const lista2 = document.getElementById('opciones2');
    
    // Ojo el detalle: cacheamos para no pedir a Firebase los datos constantemente (cacheman)
    let cacheTenistas = [];

    boton1.addEventListener('click', async () => {
        // Si ya le diste pa q se muestre y le vuelves a dar se oculta
        if (lista1.style.display === 'block') {
            lista1.style.display = 'none';
            return;
        }

        // Si el otro botón está mostrando las opciones, ocultar
        if (lista2.style.display === 'block') {
            lista2.style.display = 'none';
        }

        if(cacheTenistas.length === 0) {
            cacheTenistas = await getTodosLosTenistas();
        }
        mostrarOpciones(boton1, boton2, lista1, cacheTenistas, true);
        
    });

    boton2.addEventListener('click', async () => {
        // Si ya le diste pa q se muestre y le vuelves a dar se oculta
        if (lista2.style.display === 'block') {
            lista2.style.display = 'none';
            return;
        }

        // Si el otro botón está mostrando las opciones, ocultar
        if (lista1.style.display === 'block') {
            lista1.style.display = 'none';
        }

        if(cacheTenistas.length === 0) {
            cacheTenistas = await getTodosLosTenistas();
        }
        mostrarOpciones(boton2, boton1, lista2, cacheTenistas, false);
    });

    // VALORES POR DEFECTO AL CARGAR LA PÁGINA
    const parametros = new URLSearchParams(window.location.search);
    const j1 = parametros.get('j1');
    const j2 = parametros.get('j2');
    // Si tiene ?j1=tal&?j2=cual...
    if(j1 && j2) {
        boton1.textContent = j1;
        boton2.textContent = j2;
        setDatosH2H(j1, j2);
    } else {
        setDatosH2H('SweetElo','Mateo');
    }
});

/** CÓDIGO PARA MOSTRAR LAS OPCIONES PARA CAMBIAR DE TENISTA */
/** t1_pulsado es booleano */
function mostrarOpciones(botonClikado, elOtroBoton, lista, listaTenistas, t1_pulsado) {
    // Obtenemos los nombres actualmente mostrados en ambos botones
    const tenistaActual = botonClikado.textContent;
    const elOtroTenista = elOtroBoton.textContent;

    // Eliminar en la lista de todos los tenistas que se le pasa los que ya se muestran
    const listaSinEstosDos = listaTenistas.filter(
        id => id !== tenistaActual && id !== elOtroTenista
    );

    // Mostrar la lista (html fino)
    lista.innerHTML = ''; // Limpiamos las opciones anteriores
    listaSinEstosDos.forEach(id => {
        const li = document.createElement('li');
        li.textContent = id;
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            botonClikado.textContent = id;
            lista.style.display = 'none';

            // Actualizar los datos que se muestran automáticamente
            if (t1_pulsado) setDatosH2H(id, elOtroTenista);
            else setDatosH2H(elOtroTenista, id);
        });
        lista.appendChild(li);
    });

    lista.style.display = 'block';
}