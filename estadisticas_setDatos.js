import { getTenista, getLiveRankings, getIDsTenistas, getPartidosTenista } from "./firebase-init.js";
import { RawDataStatsTenistaPartido, StatsTenistaPartido, getRawData } from "./stats.js";

document.addEventListener('DOMContentLoaded', async() => {
    
    // ------------------------------ OPCIONES DE STATS ------------------------------ //

    const botonTipoStat = document.querySelector('.tipo-stat');
    const listaStats = document.getElementById('listaStats');
    const tablaStats = document.getElementById('tabla-stats');

    // Hardcodeada temporal con los tipos de estadísticas entre los que se deja elegir
    const dataStats = [
        {texto: "Aces", valor: "aces"},
        {texto: "%primer saque", valor: "p_primerSaque"},
        {texto: "%puntos ganados 1er saque", valor: "p_PG_primerSaque"},
        {texto: "%puntos ganados 2do saque", valor: "p_PG_segundoSaque"},
        {texto: "Dobles faltas", valor: "doblesFaltas"},
        {texto: "%breakpoints salvados", valor: "p_breakpointsSalvados"},
        {texto: "%breakpoints convertidos", valor: "p_breakpointsConvertidos"},
        {texto: "%juegos ganados sacando", valor: "p_JG_sacando"},
        {texto: "%juegos ganados restando", valor: "p_JG_restando"},
        {texto: "%puntos ganados restando 1er saque", valor: "p_PG_restandoPrimerSaque"},
        {texto: "%puntos ganados restando 2do saque", valor: "p_PG_restandoSegundoSaque"},
        {texto: "Tiebreaks ganados", valor: "tiebreaksGanados"},
        {texto: "Donuts", valor: "donuts"},
        {texto: "Donuts (en contra)", valor: "donutsEnContra"},
        {texto: "Juegos en blanco", valor: "juegosEnBlanco"},
        {texto: "Juegos en blanco (en contra)", valor: "juegosEnBlancoEnContra"}
    ];

    // Crear el html de la lista
    dataStats.forEach(stat => {
        const li = document.createElement('li');
        li.textContent = stat.texto;

        li.addEventListener('click', (e) => {
            // Precauçao
            e.stopPropagation();

            // Cambiar el texto del botón y actualizar el data-stat
            botonTipoStat.querySelector('button').textContent = stat.texto;
            botonTipoStat.dataset.stat = stat.valor;

            // ---------- SE PUEDE HACER FUNCIÓN ---------- //
            // Actualizar la tabla (ocultar todo y luego mostrar las columnas que corresponden)
            tablaStats.querySelectorAll("[data-stat]").forEach(celda => {
                celda.style.display = "none";
            });
            tablaStats.querySelectorAll(`[data-stat="${stat.valor}"]`).forEach(celda => {
                celda.style.display = "table-cell";
            });
            // -------------------------------------------- //

            // Reordenar la tabla ---
            const tbody = tablaStats.querySelector("tbody");
            // Hacemos un array de las filas de la tabla
            const filas = Array.from(tbody.querySelectorAll("tr"));
            filas.sort((a, b) => {
                const valorA = parseFloat(a.querySelector(`[data-stat="${stat.valor}"]`).textContent);
                const valorB = parseFloat(b.querySelector(`[data-stat="${stat.valor}"]`).textContent);
                return valorB - valorA;
            });
            // Recolocar las filas ordenadas en la tabla
            filas.forEach(fila => tbody.appendChild(fila));

            // Ocultar la lista de opciones
            listaStats.style.display = 'none';
        });

        listaStats.appendChild(li);
    });

    // Mostrar/ocultar las opciones al pulsar el botón
    botonTipoStat.addEventListener('click', (e) => {
        e.stopPropagation();
        listaStats.style.display =
        listaStats.style.display === 'none' ? 'block' : 'none';
    });
    
    // ------------------------------ + BOTONES ------------------------------ //

    const botonClasificacionSaque = document.getElementById('clasificacionSaque');
    const botonClasificacionResto = document.getElementById('clasificacionResto');
    const clasificacionSaque = document.getElementById('lideres-saque');
    const clasificacionResto = document.getElementById('lideres-resto');

    botonClasificacionSaque.addEventListener('click', async () => {
        botonClasificacionResto.classList.remove('activo');
        clasificacionResto.classList.remove('activo');
        botonClasificacionSaque.classList.add('activo');
        clasificacionSaque.classList.add('activo');
    });

    botonClasificacionResto.addEventListener('click', async () => {
        botonClasificacionSaque.classList.remove('activo');
        clasificacionSaque.classList.remove('activo');
        botonClasificacionResto.classList.add('activo');
        clasificacionResto.classList.add('activo');
    });


    // ------------------------------ SETDATOS ------------------------------ //

    // Obtenemos todos los rankings oficiales que hubo (rollito caché)
    const liverankings = await getLiveRankings();
    if(!liverankings) {
        console.error("Error al cargar los liverankings...");
        return [];
    }

    // Obtenemos los IDs de todos los tenistas
    const lista_tenistas = await getIDsTenistas();

    // Config: cuántos decimales mostrar en floats
    let nDecimales = 1;

    // El primero siempre debe ser el "live", se podría comprobar con el atributo de todos modos
    // Live ranking actual por defecto (se puede cambiar a uno anterior)
    const stats_tenistas = [];
    const sin_stats = [];
    for(const ID_tenista of lista_tenistas) {
        // Chekear el último club del historial (si hay alguno claro) y si aún está en él
        const t = await getTenista(ID_tenista);
        let club = " ";
        if (Array.isArray(t.historialClubes) && t.historialClubes.length > 0) {
            const ultimoClub = t.historialClubes[t.historialClubes.length - 1];
            if (ultimoClub && ultimoClub.fechaFin == null) club = ultimoClub.club;
        }

        // Cargamos las stats también (lo siento por la pantalla de carga)
        const partidos = await getPartidosTenista(ID_tenista);
        if(!partidos) {
            console.error("Este tenista aún no jugó ningún partido:", ID_tenista);
            return;
        }
        let statsTotales = new RawDataStatsTenistaPartido();
        let nPartidosConStats = 0;

        for(const p of partidos) {
            // Si no es estado fulldata ignorar
            if( p.estado != "fulldata") continue;

            nPartidosConStats++;

            try {
                const [stats_t1, stats_t2] = getRawData(p);
                if(p.tenista1 === ID_tenista) statsTotales.juntarCon(stats_t1);
                else statsTotales.juntarCon(stats_t2);

                // DEBUG
                console.log(p.id + ": " + p.tenista1 + " vs " + p.tenista2);
                console.log("stats " + p.tenista1);
                console.log(stats_t1);
                console.log("stats " + p.tenista2);
                console.log(stats_t2);
                console.log("stats acumuladas " + ID_tenista);
                console.log(statsTotales);
            } catch (e) {
                console.warn(`No se pudieron obtener stats del partido ${p.id}`, e);
            }
        }

        if(nPartidosConStats !== 0) {
            const stats = new StatsTenistaPartido(statsTotales);
            console.log(ID_tenista);
            console.log(stats.p_primerSaque);
            console.log(stats.p_PG_primerSaque);
            console.log(stats.p_PG_segundoSaque);
            console.log(stats.p_JG_sacando);
            console.log(stats.aces / nPartidosConStats);
            console.log(stats.doblesFaltas / nPartidosConStats);
            const puntuacionSaque = (stats.p_primerSaque + stats.p_PG_primerSaque + stats.p_PG_segundoSaque 
            + stats.p_JG_sacando) * 100 + stats.aces / nPartidosConStats - stats.doblesFaltas / nPartidosConStats;
            const puntuacionResto = (stats.p_PG_restandoPrimerSaque + stats.p_PG_restandoSegundoSaque 
            + stats.p_breakpointsConvertidos + stats.p_JG_restando) * 100;

            console.log(puntuacionSaque);
            console.log(puntuacionResto);

            stats_tenistas.push({
                tenista: ID_tenista,
                stats: stats,
                puntuacionSaque: puntuacionSaque,
                puntuacionResto: puntuacionResto,
                club: club
            });
        }
        // Si entra por aquí es que el tenista no jugó partidos desde que se cuentan las stats
        else {
            sin_stats.push(ID_tenista);
        }
    }

    // LÍDERES AL SAQUE
    stats_tenistas.sort((a, b) => b.puntuacionSaque - a.puntuacionSaque);
    const lideresSaque = document.getElementById('lideres-saque');
    // Primero metemos los datos del número 1 de la clasificación
    const liderSaque = lideresSaque.querySelector('.clasificacion-lider');
    liderSaque.innerHTML = `
        <div class="lider-nombre">
            <a href="/tenista.html?id=${stats_tenistas[0].tenista}">
                #1<br>${stats_tenistas[0].tenista.toUpperCase()}
                <div style="font-weight: bold;">${stats_tenistas[0].puntuacionSaque.toFixed(nDecimales)}</div>
            </a>
        </div>
        <div class="tenista-imagen">
            <a href="/tenista.html?id=${stats_tenistas[0].tenista}">
                <img src="media/pfp/${stats_tenistas[0].tenista}.png" loading="lazy">
            </a>
        </div>
    `;
    // Ahora todos los demás
    const ulSaque = lideresSaque.querySelector('.clasificacion-resto');
    for(let i = 1; i < stats_tenistas.length; i++) {
        const liTenista = document.createElement('li');

        liTenista.innerHTML = `
            <div class="cr-pos">#${i+1}</div>
            <div class="cr-nombre">
                <a href="/tenista.html?id=${stats_tenistas[i].tenista}">
                    ${stats_tenistas[i].tenista.toUpperCase()}
                </a>
            </div>
            <div class="cr-puntos"><strong>${stats_tenistas[i].puntuacionSaque.toFixed(nDecimales)}</strong></div>
        `;

        if(i % 2 === 0) {
            liTenista.style.backgroundColor = "rgb(16, 32, 64)";
        }

        ulSaque.appendChild(liTenista);
    }
    
    // LÍDERES AL RESTO
    stats_tenistas.sort((a, b) => b.puntuacionResto - a.puntuacionResto);
    const lideresResto = document.getElementById('lideres-resto');
    // Primero metemos los datos del número 1 de la clasificación
    const liderResto = lideresResto.querySelector('.clasificacion-lider');
    liderResto.innerHTML = `
        <div class="lider-nombre">
            <a href="/tenista.html?id=${stats_tenistas[0].tenista}">
                #1<br>${stats_tenistas[0].tenista.toUpperCase()}
                <div style="font-weight: bold;">${stats_tenistas[0].puntuacionResto.toFixed(nDecimales)}</div>
            </a>
        </div>
        <div class="tenista-imagen">
            <a href="/tenista.html?id=${stats_tenistas[0].tenista}">
                <img src="media/pfp/${stats_tenistas[0].tenista}.png" loading="lazy">
            </a>
        </div>
    `;
    // Ahora todos los demás
    const ulResto = lideresResto.querySelector('.clasificacion-resto');
    for(let i = 1; i < stats_tenistas.length; i++) {
        const liTenista = document.createElement('li');

        liTenista.innerHTML = `
            <div class="cr-pos">#${i+1}</div>
            <div class="cr-nombre">
                <a href="/tenista.html?id=${stats_tenistas[i].tenista}">
                    ${stats_tenistas[i].tenista.toUpperCase()}
                </a>
            </div>
            <div class="cr-puntos"><strong>${stats_tenistas[i].puntuacionResto.toFixed(nDecimales)}</strong></div>
            
        `;

        if(i % 2 === 0) {
            liTenista.style.backgroundColor = "rgb(16, 32, 64)";
        }

        ulResto.appendChild(liTenista);
    }

    // (TABLA) STATS INDIVIDUALES
    // Orden por defecto: aces
    stats_tenistas.sort((a, b) => b.stats.aces - a.stats.aces);
    // Limpiar el tbody por si aca
    tablaStats.tBodies[0].innerHTML = "";
    // Añadir TODAS las filas de la tabla
    stats_tenistas.forEach( tenista => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${tenista.tenista}</td>
            <td data-stat="aces">${tenista.stats.aces.toFixed(0)}</td>
            <td data-stat="aces">${tenista.stats.aces.toFixed(0)}</td>
            <td data-stat="p_primerSaque">${(tenista.stats.p_primerSaque * 100).toFixed(nDecimales)}</td>
            <td data-stat="p_PG_primerSaque">${(tenista.stats.p_PG_primerSaque * 100).toFixed(nDecimales)}</td>
            <td data-stat="p_PG_segundoSaque">${(tenista.stats.p_PG_segundoSaque * 100).toFixed(nDecimales)}</td>
            <td data-stat="doblesFaltas">${tenista.stats.doblesFaltas.toFixed(0)}</td>
            <td data-stat="p_breakpointsSalvados">${(tenista.stats.p_breakpointsSalvados * 100).toFixed(nDecimales)}</td>
            <td data-stat="p_JG_sacando">${(tenista.stats.p_JG_sacando * 100).toFixed(nDecimales)}</td>
            <td data-stat="p_PG_restandoPrimerSaque">${(tenista.stats.p_PG_restandoPrimerSaque * 100).toFixed(nDecimales)}</td>
            <td data-stat="p_PG_restandoSegundoSaque">${(tenista.stats.p_PG_restandoSegundoSaque * 100).toFixed(nDecimales)}</td>
            <td data-stat="p_breakpointsConvertidos">${(tenista.stats.p_breakpointsConvertidos * 100).toFixed(nDecimales)}</td>
            <td data-stat="p_JG_restando">${(tenista.stats.p_JG_restando * 100).toFixed(nDecimales)}</td>
            <td data-stat="tiebreaksGanados">${tenista.stats.tiebreaksGanados.toFixed(0)}</td>
            <td data-stat="p_setpointsConvertidos">${(tenista.stats.p_setpointsConvertidos * 100).toFixed(nDecimales)}</td>
            <td data-stat="p_setpointsSalvados">${(tenista.stats.p_setpointsSalvados * 100).toFixed(nDecimales)}</td>
            <td data-stat="p_matchpointsConvertidos">${(tenista.stats.p_matchpointsConvertidos * 100).toFixed(nDecimales)}</td>
            <td data-stat="p_matchpointsSalvados">${(tenista.stats.p_matchpointsSalvados * 100).toFixed(nDecimales)}</td>
            <td data-stat="donuts">${tenista.stats.donuts.toFixed(0)}</td>
            <td data-stat="donutsEnContra">${tenista.stats.donutsEnContra.toFixed(0)}</td>
            <td data-stat="juegosEnBlanco">${tenista.stats.juegosEnBlanco.toFixed(0)}</td>
            <td data-stat="juegosEnBlancoEnContra">${tenista.stats.juegosEnBlancoEnContra.toFixed(0)}</td>
        `;

        // Añadir a la tabla
        tablaStats.tBodies[0].appendChild(fila);
    });

    // Quitamos el cargando...
    document.getElementById("cargando").style.display = "none";
});

/** CÓDIGO PARA MOSTRAR LAS OPCIONES PARA CAMBIAR DE TENISTA */
/** t1_pulsado es booleano */
function opcionesStats(botonClikado, elOtroBoton, lista, listaTenistas, t1_pulsado) {
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