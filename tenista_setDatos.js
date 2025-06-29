import { getTenista, getPartidosTenista, getRankingsTenista } from "./firebase-init.js";
import { actualizarTodasLasBarras } from "./tenista_porcentajes_barras.js";
import { RawDataStatsTenistaPartido, StatsTenistaPartido, getRawData, getStatsPartido } from "./stats.js";

document.addEventListener('DOMContentLoaded', async() => {
    const parametros = new URLSearchParams(window.location.search);
    let ID_tenista = parametros.get('id');

    if(!ID_tenista) {
        console.error("No se encontró ningún ID.");
        // Tenista por defecto
        ID_tenista = "VitiBou";
    }

    try {
        const t = await getTenista(ID_tenista);
        //console.log("Datos del partido:", p); DEBUG
        if(!t) {
            console.error("No se encontró al tenista con ID:", ID_tenista);
            return;
        }

        // Actualizamos toda la información del tenista, imágenes, etc. --------------------------- //
        // Título de la página
        document.title = `${ID_tenista} | ATP Rexenxo`;
        
        // ---------------------------------- DATOS DEL TENISTA ----------------------------------- //
        document.querySelector('.tenista-info-nombre').textContent = ID_tenista.toUpperCase();
        document.querySelector('.tenista-info-imagen img').src = `media/silueta/${ID_tenista}.png`;
        // Chekear el último club del historial (si hay alguno claro) y si aún está en él
        let club = "Sin club";
        if (Array.isArray(t.historialClubes) && t.historialClubes.length > 0) {
            const ultimoClub = t.historialClubes[t.historialClubes.length - 1];
            if (ultimoClub && ultimoClub.fechaFin == null) club = ultimoClub.club;
        }
        document.querySelector('.tenista-info-club').textContent = club;

        // ----------------------------- PARTIDOS (Y STATS DERIVADAS) ----------------------------- //
        const partidos = await getPartidosTenista(ID_tenista);
        if(!partidos) {
            console.error("Este tenista aún no jugó ningún partido:", ID_tenista);
            return;
        }

        // Datos calculados (stats)
        const titulos = partidos.filter(p => p.ronda === 'F' && p.ganador === ID_tenista).length;
        const victorias = partidos.filter(p => p.ganador === ID_tenista).length;
        const derrotas = partidos.filter(p => p.ganador !== ID_tenista && p.ganador != null).length;
        const [rankingActual, rankingAnterior, mejorRanking, fechaMR] = await getRankingsTenista(ID_tenista);
        const diferenciaRanking = rankingActual - rankingAnterior;
        // Actualizamos estos datos obtenidos en el html
        document.getElementById('-w-l').textContent = `${victorias}-${derrotas}`;
        document.getElementById('-titulos').textContent = titulos;
        document.getElementById('-ranking').textContent = rankingActual;
        document.getElementById('-mejor-ranking').textContent = mejorRanking;
        document.querySelector('.tenista-info-mejorranking').textContent = 
            fechaMR === "live" ? "Mejor Ranking" : `Mejor Ranking (${fechaMR})`;
        // Ollo coa diferencia de ranking: se é negativa significa que mellorou!
        const spanDif = document.getElementById('-dif-ranking');
        // Si no tenía rankingAnterior y ashora sí es que "debuta" en el ranking
        if (rankingAnterior == null && rankingActual != null) {
            spanDif.textContent = 'NEW!';
            spanDif.style.color = 'gold';
            // Solución chapuzeira
            document.getElementById('-mejor-ranking').textContent = rankingActual;
            document.querySelector('.tenista-info-mejorranking').textContent = "Mejor Ranking";
        }
        else if (diferenciaRanking == 0) {
            spanDif.textContent = `=`;
            spanDif.style.color = 'lightslategray';
        }
        else if (diferenciaRanking < 0) {
            spanDif.textContent = `+${Math.abs(diferenciaRanking)}`;
            spanDif.style.color = 'lime';
        }
        else {
            spanDif.textContent = `−${diferenciaRanking}`;
            spanDif.style.color = 'red';
        }

        // -------------------------------- ESTADÍSTICAS AVANZADAS -------------------------------- //

        // Primero obtenemos las stats
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

        const stats = new StatsTenistaPartido(statsTotales);

        /** 
        TODO TO-DO PAFACER
        // Rachas
        this.mejorRachaPuntosGanados = rawData.mejorRachaPuntosGanados;
        this.rachaPG_abierta = rawData.rachaPG_abierta;
        this.mejorRachaJuegosGanados = rawData.mejorRachaJuegosGanados;
        this.rachaJG_abierta = rawData.rachaJG_abierta;*/

        // Número de partidos que se tuvieron en cuenta para las stats
        document.getElementById('nPartidos').querySelector('.ts-tabla-der strong').textContent = nPartidosConStats;

        // Variable de control: número de decimales de los floats
        const nDecimales = 2;

        // Aces ----------------------------------------------------------------------------------- //
        document.getElementById('aces').querySelector('.ts-tabla-der strong').textContent = stats.aces;
        // %primer saque -------------------------------------------------------------------------- //
        document.getElementById('p_primerSaque').querySelector('.ts-tabla-der strong').textContent = stats.p_primerSaque.toFixed(nDecimales);
        // %puntos ganados con primer saque ------------------------------------------------------- //
        document.getElementById('p_PG_primerSaque').querySelector('.ts-tabla-der strong').textContent = stats.p_PG_primerSaque.toFixed(nDecimales);
        // %puntos ganados con segundo saque ------------------------------------------------------ //
        document.getElementById('p_PG_segundoSaque').querySelector('.ts-tabla-der strong').textContent = stats.p_PG_segundoSaque.toFixed(nDecimales);
        // Dobles faltas -------------------------------------------------------------------------- //
        document.getElementById('doblesFaltas').querySelector('.ts-tabla-der strong').textContent = stats.doblesFaltas;
        // %breakpoints salvados ------------------------------------------------------------------ //
        document.getElementById('p_breakpointsSalvados').querySelector('.ts-tabla-der strong').textContent = stats.p_breakpointsSalvados.toFixed(nDecimales);
        // %juegos ganados sacando ---------------------------------------------------------------- //
        document.getElementById('p_JG_sacando').querySelector('.ts-tabla-der strong').textContent = stats.p_JG_sacando.toFixed(nDecimales);

        // %puntos ganados restando primer saque -------------------------------------------------- //
        document.getElementById('p_PG_restandoPrimerSaque').querySelector('.ts-tabla-der strong').textContent = stats.p_PG_restandoPrimerSaque.toFixed(nDecimales);
        // %puntos ganados restando segundo saque ------------------------------------------------- //
        document.getElementById('p_PG_restandoSegundoSaque').querySelector('.ts-tabla-der strong').textContent = stats.p_PG_restandoSegundoSaque.toFixed(nDecimales);
        // %breakpoints convertidos --------------------------------------------------------------- //
        document.getElementById('p_breakpointsConvertidos').querySelector('.ts-tabla-der strong').textContent = stats.p_breakpointsConvertidos.toFixed(nDecimales);
        // %juegos ganados restando --------------------------------------------------------------- //
        document.getElementById('p_JG_restando').querySelector('.ts-tabla-der strong').textContent = stats.p_JG_restando.toFixed(nDecimales);

        // Tiebreaks ganados ---------------------------------------------------------------------- //
        document.getElementById('tiebreaksGanados').querySelector('.ts-tabla-der strong').textContent = stats.tiebreaksGanados;
        // %setpoints convertidos ----------------------------------------------------------------- //
        document.getElementById('p_setpointsConvertidos').querySelector('.ts-tabla-der strong').textContent = stats.p_setpointsConvertidos.toFixed(nDecimales);
        // %setpoints salvados -------------------------------------------------------------------- //
        document.getElementById('p_setpointsSalvados').querySelector('.ts-tabla-der strong').textContent = stats.p_setpointsSalvados.toFixed(nDecimales);
        // %matchpoints convertidos --------------------------------------------------------------- //
        document.getElementById('p_matchpointsConvertidos').querySelector('.ts-tabla-der strong').textContent = stats.p_matchpointsConvertidos.toFixed(nDecimales);
        // %matchpoints salvados ------------------------------------------------------------------ //
        document.getElementById('p_matchpointsSalvados').querySelector('.ts-tabla-der strong').textContent = stats.p_matchpointsSalvados.toFixed(nDecimales);

        // Donuts --------------------------------------------------------------------------------- //
        document.getElementById('donuts').querySelector('.ts-tabla-der strong').textContent = stats.donuts;
        // Donuts (en contra ) -------------------------------------------------------------------- //
        document.getElementById('donutsEnContra').querySelector('.ts-tabla-der strong').textContent = stats.donutsEnContra;
        // Juegos en blanco ----------------------------------------------------------------------- //
        document.getElementById('juegosEnBlanco').querySelector('.ts-tabla-der strong').textContent = stats.juegosEnBlanco;
        // Juegos en blanco (en contra) ----------------------------------------------------------- //
        document.getElementById('juegosEnBlancoEnContra').querySelector('.ts-tabla-der strong').textContent = stats.juegosEnBlancoEnContra;

        // Mejor racha de puntos ganados ---------------------------------------------------------- //
        // Mejor racha de juegos ganados ---------------------------------------------------------- //
        // Mejor racha de sets ganados ------------------------------------------------------------ //
        // Mejor racha de partidos ganados -------------------------------------------------------- //

        // Actualizar las barras y porcentajes visuales !! ---------------------------------------- //
        actualizarTodasLasBarras();
        
    }
    catch (error) {
        console.error("Error cargando los datos del tenista.", error);
    }

});