import { getPartidosTenista, getTenista, getTorneo, getLiveRankings, calcularRanking } from "./firebase-init.js";
import { actualizarTodasLasBarras } from "./h2h_porcentajes_barras.js";
import { actualizarCircunferenciaVS } from "./h2h_porcentajes_vs.js";
import { RawDataStatsTenistaPartido, StatsTenistaPartido, getRawData } from "./stats.js";

async function setDatosH2H(ID_tenista1, ID_tenista2) {
    try {
        // Obtenemos los tenistas y sus listas de partidos (los objetos)
        const [t1, t2] = await Promise.all([
            getTenista(ID_tenista1), getTenista(ID_tenista2)
        ]);
        //if (!t1 || !t2) throw new Error("Tenistas no encontrado"); DEBUGd
        const partidos_t1 = await getPartidosTenista(ID_tenista1);
        //if (!partidos_t1) throw new Error("partidos_t1 no encontrado"); DEBUG
        const partidos_t2 = await getPartidosTenista(ID_tenista2);
        //if (!partidos_t2) throw new Error("partidos_t2 no encontrado"); DEBUG

        // Imagen y links
        document.querySelector('.tenista1-imagen img').src = `media/pfp/${ID_tenista1}.png`;
        document.querySelector('.tenista2-imagen img').src = `media/pfp/${ID_tenista2}.png`;
        document.querySelector('.tenista1-imagen a').href = `tenista.html?id=${ID_tenista1}`;
        document.querySelector('.tenista2-imagen a').href = `tenista.html?id=${ID_tenista2}`;
        // Nombre (x2)
        document.querySelector('.tenista1-nombre a').innerHTML = `${t1.nombre}<br><strong>${t1.apellido}</strong>`;
        document.querySelector('.tenista2-nombre a').innerHTML = `${t2.nombre}<br><strong>${t2.apellido}</strong>`;
        document.querySelector('.tenista1-nombre a').href = `tenista.html?id=${ID_tenista1}`;
        document.querySelector('.tenista2-nombre a').href = `tenista.html?id=${ID_tenista2}`;
        document.querySelector("#botonBuscarTenista1").textContent = `${ID_tenista1}`;
        document.querySelector("#botonBuscarTenista2").textContent = `${ID_tenista2}`;
        // VS Victorias
        const nEnfrentamientos = partidos_t1.filter(p =>
            (p.tenista1 === ID_tenista2 || p.tenista2 === ID_tenista2) && p.marcador!== "Withdraw"
        ).length;
        const t1_gana_a_t2 = partidos_t1.filter(p =>
            (p.tenista1 === ID_tenista2 || p.tenista2 === ID_tenista2) && (p.ganador === ID_tenista1 && p.marcador!== "Withdraw")
        ).length;
        document.querySelector('.victorias-tenista1 strong').textContent = t1_gana_a_t2;
        document.querySelector('.victorias-tenista2 strong').textContent = nEnfrentamientos-t1_gana_a_t2;
        

        // --------------------------------- ESTADÍSTICAS BÁSICAS --------------------------------- //

        // Ranking de cada tenista ---------------------------------------------------------------- //
        // Cálculo
        const liverankings = await getLiveRankings();
        if(!liverankings) {
            console.error("Error al cargar los liverankings...");
            return [];
        }
        const ranking_t1 = await calcularRanking(liverankings[0], ID_tenista1);
        //if (!ranking_t1) throw new Error("Error al calcular ranking_t1"); DEBUG
        const ranking_t2 = await calcularRanking(liverankings[0], ID_tenista2);
        //if (!ranking_t2) throw new Error("Error al calcular ranking_t2"); DEBUG
        // Actualización
        document.getElementById('ranking').querySelector('.h2h-info-tabla-izq strong').textContent = ranking_t1;
        document.getElementById('ranking').querySelector('.h2h-info-tabla-der strong').textContent = ranking_t2;

        // Mano dominante ------------------------------------------------------------------------- //
        document.getElementById('mano-dominante').querySelector('.h2h-info-tabla-izq strong').textContent = t1.diestro ? 'Diestra': 'Zurda';
        document.getElementById('mano-dominante').querySelector('.h2h-info-tabla-der strong').textContent = t2.diestro ? 'Diestra': 'Zurda';
        
        // Año debut ------------------------------------------------------------------------------ //
        document.getElementById('debut').querySelector('.h2h-info-tabla-izq strong').textContent = t1.debut ?? 'N/A';
        document.getElementById('debut').querySelector('.h2h-info-tabla-der strong').textContent = t2.debut ?? 'N/A';
        
        // Victorias y derrotas ------------------------------------------------------------------- //
        // Cálculo
        const victorias_t1 = partidos_t1.filter(p => p.ganador === ID_tenista1 && p.marcador!== "Withdraw").length;
        const derrotas_t1 = partidos_t1.filter(p => p.ganador !== ID_tenista1 && p.marcador!== "Withdraw").length;
        const victorias_t2 = partidos_t2.filter(p => p.ganador === ID_tenista2 && p.marcador!== "Withdraw").length;
        const derrotas_t2 = partidos_t2.filter(p => p.ganador !== ID_tenista2 && p.marcador!== "Withdraw").length;
        // Actualización
        document.getElementById('victorias-derrotas').querySelector('.h2h-info-tabla-izq strong').textContent = `${victorias_t1}/${derrotas_t1}`;
        document.getElementById('victorias-derrotas').querySelector('.h2h-info-tabla-der strong').textContent = `${victorias_t2}/${derrotas_t2}`;
        
        // Títulos -------------------------------------------------------------------------------- //
        const titulos_t1 = partidos_t1.filter(p => p.ronda === 'F' && p.ganador === ID_tenista1).length;
        const titulos_t2 = partidos_t2.filter(p => p.ronda === 'F' && p.ganador === ID_tenista2).length;
        document.getElementById('nTitulos').querySelector('.h2h-info-tabla-izq strong').textContent = titulos_t1;
        document.getElementById('nTitulos').querySelector('.h2h-info-tabla-der strong').textContent = titulos_t2;

        // Número de torneos en los que participó ------------------------------------------------- //
        const torneos_t1 = new Set(partidos_t1.map(p => p.torneo)).size;
        const torneos_t2 = new Set(partidos_t2.map(p => p.torneo)).size;
        document.getElementById('nTorneos').querySelector('.h2h-info-tabla-izq strong').textContent = torneos_t1;
        document.getElementById('nTorneos').querySelector('.h2h-info-tabla-der strong').textContent = torneos_t2;

        // Origen --------------------------------------------------------------------------------- //
        document.getElementById('origen').querySelector('.h2h-info-tabla-izq strong').textContent = t1.origen ?? 'N/A';
        document.getElementById('origen').querySelector('.h2h-info-tabla-der strong').textContent = t2.origen ?? 'N/A';

        // -------------------------------- ESTADÍSTICAS AVANZADAS -------------------------------- //

        // Primero obtenemos las stats de cada tenista para todos sus partidos
        let statsTotalesT1 = new RawDataStatsTenistaPartido();
        let statsTotalesT2 = new RawDataStatsTenistaPartido();
        let nPartidosConStatsT1 = 0;
        let nPartidosConStatsT2 = 0;

        for(const p of partidos_t1) {
            // Si no es estado fulldata ignorar
            if( p.estado != "fulldata") continue;

            nPartidosConStatsT1++;

            try {
                const [stats_t1, stats_t2] = getRawData(p);
                if(p.tenista1 === ID_tenista1) statsTotalesT1.juntarCon(stats_t1);
                else statsTotalesT1.juntarCon(stats_t2);

                // DEBUG
                console.log(p.id + ": " + p.tenista1 + " vs " + p.tenista2);
                console.log("stats " + p.tenista1);
                console.log(stats_t1);
                console.log("stats " + p.tenista2);
                console.log(stats_t2);
                console.log("stats acumuladas " + ID_tenista1);
                console.log(statsTotalesT1);
            } catch (e) {
                console.warn(`No se pudieron obtener stats del partido ${p.id}`, e);
            }
        }

        for(const p of partidos_t2) {
            // Si no es estado fulldata ignorar
            if( p.estado != "fulldata") continue;

            nPartidosConStatsT2++;

            try {
                const [stats_t1, stats_t2] = getRawData(p);
                if(p.tenista1 === ID_tenista2) statsTotalesT2.juntarCon(stats_t1);
                else statsTotalesT2.juntarCon(stats_t2);

                // DEBUG
                console.log(ID_tenista2);
                console.log(statsTotalesT2);
            } catch (e) {
                console.warn(`No se pudieron obtener stats del partido ${p.id}`, e);
            }
        }

        const stats1 = new StatsTenistaPartido(statsTotalesT1);
        const stats2 = new StatsTenistaPartido(statsTotalesT2);

        /** 
        TODO TO-DO PAFACER
        // Rachas
        this.mejorRachaPuntosGanados = rawData.mejorRachaPuntosGanados;
        this.rachaPG_abierta = rawData.rachaPG_abierta;
        this.mejorRachaJuegosGanados = rawData.mejorRachaJuegosGanados;
        this.rachaJG_abierta = rawData.rachaJG_abierta;*/
        
        // Número de partidos que se tuvieron en cuenta para las stats
        document.getElementById('nPartidos').querySelector('.h2h-info-tabla-izq strong').textContent = nPartidosConStatsT1;
        document.getElementById('nPartidos').querySelector('.h2h-info-tabla-der strong').textContent = nPartidosConStatsT2;

        // Variable de control: número de decimales de los floats
        const nDecimales = 2;

        // Aces ----------------------------------------------------------------------------------- //
        document.getElementById('aces').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.aces;
        document.getElementById('aces').querySelector('.h2h-info-tabla-der strong').textContent = stats2.aces;
        // %primer saque -------------------------------------------------------------------------- //
        document.getElementById('p_primerSaque').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.p_primerSaque.toFixed(nDecimales);
        document.getElementById('p_primerSaque').querySelector('.h2h-info-tabla-der strong').textContent = stats2.p_primerSaque.toFixed(nDecimales);
        // %puntos ganados con primer saque ------------------------------------------------------- //
        document.getElementById('p_PG_primerSaque').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.p_PG_primerSaque.toFixed(nDecimales);
        document.getElementById('p_PG_primerSaque').querySelector('.h2h-info-tabla-der strong').textContent = stats2.p_PG_primerSaque.toFixed(nDecimales);
        // %puntos ganados con segundo saque ------------------------------------------------------ //
        document.getElementById('p_PG_segundoSaque').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.p_PG_segundoSaque.toFixed(nDecimales);
        document.getElementById('p_PG_segundoSaque').querySelector('.h2h-info-tabla-der strong').textContent = stats2.p_PG_segundoSaque.toFixed(nDecimales);
        // Dobles faltas -------------------------------------------------------------------------- //
        document.getElementById('doblesFaltas').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.doblesFaltas;
        document.getElementById('doblesFaltas').querySelector('.h2h-info-tabla-der strong').textContent = stats2.doblesFaltas;
        // %breakpoints salvados ------------------------------------------------------------------ //
        document.getElementById('p_breakpointsSalvados').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.p_breakpointsSalvados.toFixed(nDecimales);
        document.getElementById('p_breakpointsSalvados').querySelector('.h2h-info-tabla-der strong').textContent = stats2.p_breakpointsSalvados.toFixed(nDecimales);
        // %juegos ganados sacando ---------------------------------------------------------------- //
        document.getElementById('p_JG_sacando').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.p_JG_sacando.toFixed(nDecimales);
        document.getElementById('p_JG_sacando').querySelector('.h2h-info-tabla-der strong').textContent = stats2.p_JG_sacando.toFixed(nDecimales);

        // %puntos ganados restando primer saque -------------------------------------------------- //
        document.getElementById('p_PG_restandoPrimerSaque').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.p_PG_restandoPrimerSaque.toFixed(nDecimales);
        document.getElementById('p_PG_restandoPrimerSaque').querySelector('.h2h-info-tabla-der strong').textContent = stats2.p_PG_restandoPrimerSaque.toFixed(nDecimales);
        // %puntos ganados restando segundo saque ------------------------------------------------- //
        document.getElementById('p_PG_restandoSegundoSaque').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.p_PG_restandoSegundoSaque.toFixed(nDecimales);
        document.getElementById('p_PG_restandoSegundoSaque').querySelector('.h2h-info-tabla-der strong').textContent = stats2.p_PG_restandoSegundoSaque.toFixed(nDecimales);
        // %breakpoints convertidos --------------------------------------------------------------- //
        document.getElementById('p_breakpointsConvertidos').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.p_breakpointsConvertidos.toFixed(nDecimales);
        document.getElementById('p_breakpointsConvertidos').querySelector('.h2h-info-tabla-der strong').textContent = stats2.p_breakpointsConvertidos.toFixed(nDecimales);
        // %juegos ganados restando --------------------------------------------------------------- //
        document.getElementById('p_JG_restando').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.p_JG_restando.toFixed(nDecimales);
        document.getElementById('p_JG_restando').querySelector('.h2h-info-tabla-der strong').textContent = stats2.p_JG_restando.toFixed(nDecimales);

        // Tiebreaks ganados ---------------------------------------------------------------------- //
        document.getElementById('tiebreaksGanados').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.tiebreaksGanados;
        document.getElementById('tiebreaksGanados').querySelector('.h2h-info-tabla-der strong').textContent = stats2.tiebreaksGanados;
        // %setpoints convertidos ----------------------------------------------------------------- //
        document.getElementById('p_setpointsConvertidos').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.p_setpointsConvertidos.toFixed(nDecimales);
        document.getElementById('p_setpointsConvertidos').querySelector('.h2h-info-tabla-der strong').textContent = stats2.p_setpointsConvertidos.toFixed(nDecimales);
        // %setpoints salvados -------------------------------------------------------------------- //
        document.getElementById('p_setpointsSalvados').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.p_setpointsSalvados.toFixed(nDecimales);
        document.getElementById('p_setpointsSalvados').querySelector('.h2h-info-tabla-der strong').textContent = stats2.p_setpointsSalvados.toFixed(nDecimales);
        // %matchpoints convertidos --------------------------------------------------------------- //
        document.getElementById('p_matchpointsConvertidos').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.p_matchpointsConvertidos.toFixed(nDecimales);
        document.getElementById('p_matchpointsConvertidos').querySelector('.h2h-info-tabla-der strong').textContent = stats2.p_matchpointsConvertidos.toFixed(nDecimales);
        // %matchpoints salvados ------------------------------------------------------------------ //
        document.getElementById('p_matchpointsSalvados').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.p_matchpointsSalvados.toFixed(nDecimales);
        document.getElementById('p_matchpointsSalvados').querySelector('.h2h-info-tabla-der strong').textContent = stats2.p_matchpointsSalvados.toFixed(nDecimales);

        // Donuts --------------------------------------------------------------------------------- //
        document.getElementById('donuts').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.donuts;
        document.getElementById('donuts').querySelector('.h2h-info-tabla-der strong').textContent = stats2.donuts;
        // Donuts (en contra ) -------------------------------------------------------------------- //
        document.getElementById('donutsEnContra').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.donutsEnContra;
        document.getElementById('donutsEnContra').querySelector('.h2h-info-tabla-der strong').textContent = stats2.donutsEnContra;
        // Juegos en blanco ----------------------------------------------------------------------- //
        document.getElementById('juegosEnBlanco').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.juegosEnBlanco;
        document.getElementById('juegosEnBlanco').querySelector('.h2h-info-tabla-der strong').textContent = stats2.juegosEnBlanco;
        // Juegos en blanco (en contra) ----------------------------------------------------------- //
        document.getElementById('juegosEnBlancoEnContra').querySelector('.h2h-info-tabla-izq strong').textContent = stats1.juegosEnBlancoEnContra;
        document.getElementById('juegosEnBlancoEnContra').querySelector('.h2h-info-tabla-der strong').textContent = stats2.juegosEnBlancoEnContra;

        // Mejor racha de puntos ganados ---------------------------------------------------------- //
        // Mejor racha de juegos ganados ---------------------------------------------------------- //
        // Mejor racha de sets ganados ------------------------------------------------------------ //
        // Mejor racha de partidos ganados -------------------------------------------------------- //

        // Actualizar las barras y porcentajes visuales !! ---------------------------------------- //
        actualizarTodasLasBarras();
        actualizarCircunferenciaVS();

        
        // --------------------------------------- PARTIDOS --------------------------------------- //
        const ul = document.getElementById('partidos-h2h');
        ul.innerHTML = ''; // Limpiamos antes de añadir nada

        const partidosH2H = partidos_t1.filter(p =>
            (p.tenista1 === ID_tenista2 || p.tenista2 === ID_tenista2) && p.marcador!== "Withdraw"
        );

        // Si no han jugado ningún partido todavía
        if(partidosH2H.length === 0) {
            ul.innerHTML = '<li>¡Estos dos cracks aún no se han enfrentado!</li>';
            return;
        }

        // Si hay partidos: creamos los elementos <li> para cada partido
        for (let i = partidosH2H.length - 1; i >= 0; i--) {
            const p = partidosH2H[i]; // FOR invertido (crazy shi)

            const objetoTorneo = await getTorneo(p.torneo);

            const li = document.createElement('li');
            li.classList.add('fila-info-partido');

            // v2: innerHTML (más conciso)
            li.innerHTML = `
                <div class="columna-lista-partidos clp-anho">${p.fecha?.split('.')[2] || 'N/A'}</div>
                <div class="columna-lista-partidos circulito-ganador"></div>
                <div class="columna-lista-partidos clp-ganador">
                    <a href="/tenista.html?id=${p.ganador}">${p.ganador || 'N/A'}</a>
                </div>
                <div class="columna-lista-partidos clp-torneo">
                    <a href="/torneos/${objetoTorneo?.serie || ''}">${objetoTorneo?.serie || 'N/A'}</a>
                </div>
                <div class="columna-lista-partidos clp-ronda">
                    <a href="/partido.html?id=${p.id}">${p.ronda || 'N/A'}</a>
                </div>
                <div class="columna-lista-partidos clp-marcador">
                    <a href="/partido.html?id=${p.id}">${p.marcador || 'N/A'}</a>
                </div>
            `;

            // GANADOR (CÍRCULO porque es demasiado chikito pa la imagen)
            const circulo = li.querySelector('.circulito-ganador');
            if (p.ganador === ID_tenista1) circulo.style.background = 'blue';
            else if (p.ganador === ID_tenista2) circulo.style.background = 'yellow';
            else circulo.style.background = 'grey';

            ul.appendChild(li);
        };
    }
    catch (err) {
        console.error('Error al cargar los datos de los jugadores', err);
    }
}

export { setDatosH2H }