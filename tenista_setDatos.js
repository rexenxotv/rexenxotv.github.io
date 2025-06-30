import { getTenista, getPartidosTenista, getRankingsTenista, getTorneo, getResultados, getLiveRankings, calcularRanking } from "./firebase-init.js";
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

        // --------------------------------------- PARTIDOS --------------------------------------- //
        const ul = document.getElementById('partidos-tenista');
        ul.innerHTML = ''; // Limpiamos antes de añadir nada

        const partidosTenista = partidos.filter(p =>
            p.tenista1 === ID_tenista || p.tenista2 === ID_tenista
        );
        
        // Si no ha jugado ningún partido todavía (debe ser un error)
        if(partidosTenista.length === 0) {
            ul.innerHTML = '<li>Vaya, no hemos encontrado ningún partido...</li>';
            return;
        }

        // Si hay partidos, los agrupamos por torneo (*-*)
        // partidosPorTorneo es un array con objetos con id el del torneo y sus correspondientes partidos
        const partidosPorTorneo = [];
        for (const partido of partidosTenista) {
            const ID_torneo = partido.torneo;

            // Si es el primer partido de un torneo en concreto creamos
            let partidosTorneo = partidosPorTorneo.find(g => g.id === ID_torneo);
            if (!partidosTorneo) {
                partidosTorneo = { id: ID_torneo, partidos: [] };
                partidosPorTorneo.push(partidosTorneo);
            }

            partidosTorneo.partidos.push(partido);
        }

        // Ahora para cada torneo creamos la caja con su lista de partidos
        // const torneo = { id: ID_torneo, partidos: [] }
            // Se recorren al revés por eso .reverse(),
            // .slice() para que no cambie el orden del array original)
        for(const torneo of partidosPorTorneo.slice().reverse()) {
            const li = document.createElement('li');
            li.classList.add('caja-partidos-torneo');

            // Datos del torneo
            const datosTorneo = document.createElement('div');
            datosTorneo.classList.add('datos-torneo');
            const objetoTorneo = await getTorneo(torneo.id);

            // Nombre, año, lugar, superficie...
            const infoTorneo = document.createElement('div');
            infoTorneo.classList.add('info-torneo');
            const nombreTorneo = document.createElement('div');
            nombreTorneo.classList.add('info-torneo-nombre');
            nombreTorneo.textContent = `${objetoTorneo.serie} ${objetoTorneo.anho}`;
            const infoTorneoOtros = document.createElement('div');
            infoTorneoOtros.classList.add('info-torneo-otros');
            let fechas = `${objetoTorneo.fechaInicio} - LIVE`;
            if(objetoTorneo.fechaFin) {
                if(objetoTorneo.fechaInicio === objetoTorneo.fechaFin) {
                    fechas = `${objetoTorneo.fechaInicio}`;
                }
                else {
                    fechas = `${objetoTorneo.fechaInicio} - ${objetoTorneo.fechaFin}`;
                }
            }
            infoTorneoOtros.innerHTML = `${fechas}<br>${objetoTorneo.ubicacion} | ${objetoTorneo.superficie}`;
            infoTorneo.appendChild(nombreTorneo);
            infoTorneo.appendChild(infoTorneoOtros);

            // Categoría del torneo
            const categoriaTorneo = document.createElement("div");
            categoriaTorneo.classList.add('categoria-torneo');

            if(objetoTorneo.categoria != null) {
                const categoriaTorneoIMG = document.createElement("img");
                let archivo_logo;
                switch(objetoTorneo.categoria) {
                    case "ATPR 250":
                        archivo_logo = "logo-atpr250";
                        break;
                    case "ATPR 500":
                        archivo_logo = "logo-atpr500";
                        break;
                    case "Masters 1000":
                        archivo_logo = "logo-masters1000";
                        break;
                    case "Challenger 125":
                    case "Challenger 100":
                    case "Challenger 75":
                    case "Challenger 50":
                        archivo_logo = "logo-challenger";
                        break;
                }
                categoriaTorneoIMG.src = `media/logo/${archivo_logo}.png`;
                categoriaTorneo.appendChild(categoriaTorneoIMG);
            }

            // Montamos la jerarquía
            datosTorneo.appendChild(categoriaTorneo);
            datosTorneo.appendChild(infoTorneo);
            li.appendChild(datosTorneo);

            // Lista de partidos
            const ulPartidos = document.createElement('ul');
            ulPartidos.classList.add('partidos-torneo');
            // Leyenda
            const liLeyendas = document.createElement('li');
            liLeyendas.classList.add('fila-info-partido');
            // RONDA
            const ronda = document.createElement('div');
            ronda.classList.add('columna-lista-partidos', 'leyenda', 'clp-ronda');
            ronda.textContent = "Ronda";
            liLeyendas.appendChild(ronda);
            // RIVAL
            const rival = document.createElement('div');
            rival.classList.add('columna-lista-partidos', 'leyenda', 'clp-rival');
            rival.textContent = "Rival";
            liLeyendas.appendChild(rival);
            // Hueco en donde va la X o ✓
            const hueco = document.createElement('div');
            hueco.classList.add('columna-lista-partidos', 'leyenda', 'w-l');
            liLeyendas.appendChild(hueco);
            // MARCADOR
            const marcador = document.createElement('div');
            marcador.classList.add('columna-lista-partidos', 'leyenda', 'clp-marcador');
            marcador.textContent = "Marcador";
            liLeyendas.appendChild(marcador);
            ulPartidos.appendChild(liLeyendas);

            // Se recorren al revés por eso .reverse(),
            // .slice() para que no cambie el orden del array original)
            for(const p of torneo.partidos.slice().reverse()) {
                const liPartido = document.createElement('li');
                liPartido.classList.add('fila-info-partido');

                // RONDA
                const ronda = document.createElement('div');
                ronda.classList.add('columna-lista-partidos', 'clp-ronda');
                ronda.textContent = p.ronda || 'N/A';
                liPartido.appendChild(ronda);

                // GANADOR (NOMBRE)
                const ganador = document.createElement('div');
                ganador.classList.add('columna-lista-partidos', 'clp-rival');
                // Barbarie: que sea clickable y te lleve al perfil del tenista
                const linkGanador = document.createElement('a');
                let rival = p.tenista1;
                if(p.tenista1 === ID_tenista) {
                    rival = p.tenista2;
                }
                linkGanador.href = `/tenista.html?id=${rival}`;
                linkGanador.textContent = rival || 'N/A';
                ganador.appendChild(linkGanador);
                liPartido.appendChild(ganador);

                // ¿Gana o pierde? ✓ vs X
                const wl = document.createElement('div');
                wl.classList.add('columna-lista-partidos', 'w-l');
                if (p.ganador === ID_tenista) {
                    wl.textContent = '✓';
                    wl.style.color = 'lime';
                }
                else {
                    wl.textContent = 'X';
                    wl.style.color = 'red';
                }
                liPartido.appendChild(wl);

                const marcador = document.createElement('div');
                marcador.classList.add('columna-lista-partidos', 'clp-marcador');
                // Barbarie: que sea clickable y te lleve AL PARTIDO
                const linkMarcador = document.createElement('a');
                linkMarcador.href = `/partido.html?id=${p.id}`;
                linkMarcador.textContent = p.marcador || 'N/A';
                marcador.appendChild(linkMarcador);
                liPartido.appendChild(marcador);

                // Lo añadimos a la lista de partidos
                ulPartidos.appendChild(liPartido);
            }

            // Añadir la lista de partidos a la caja del torneo
            li.appendChild(ulPartidos);

            // Espacio entre cajas y pequeños datos
            const resultadosEnTorneo = document.createElement('div');
            resultadosEnTorneo.classList.add('resultados-del-torneo');
            // Resultados del tenista en el torneo
            let resultadosTorneo = [];
            try {
                resultadosTorneo = await getResultados(torneo.id) || [];
            }
            catch (error) {
                console.warn(`El torneo ${torneo.id} no asignó puntos.`, error);
            }
            const resultadosTenista = resultadosTorneo.find(r => r.tenista === ID_tenista);
            // Ranking del tenista después del torneo
            const liverankings = await getLiveRankings();
            console.log(`Liverankings`, liverankings);
            if(!liverankings) {
                console.error("Error al cargar los liverankings...");
                liverankings = [];
            }
            let liveranking;
            if(objetoTorneo.fechaFin == null) {
                liveranking = liverankings.find(lr => lr.fecha === "live");
                console.log("if(objetoTorneo.fechaFin === null)");
            }
            else {
                liveranking = liverankings.find(lr => lr.fecha === objetoTorneo.fechaFin);
                console.log("ELSE");
            }
            console.log(`Ranking correspondiente a la fecha ${objetoTorneo.fechaFin || "live"}:`, liveranking);
            // Añadir esa info
            if(resultadosTenista && liveranking) {
                const rankingDespuesDelTorneo = await calcularRanking(liveranking, ID_tenista);
                console.log(`rankingDespuesDelTorneo: ${rankingDespuesDelTorneo}`);
                resultadosEnTorneo.textContent = `Puntos obtenidos: ${resultadosTenista.puntos}; Ranking después del torneo: ${rankingDespuesDelTorneo}`;
            }
            else resultadosEnTorneo.textContent = ' ';

            // Añadimos la caja de los resultados del torneo al ul y luego los resultados
            ul.appendChild(li);
            ul.appendChild(resultadosEnTorneo);
        }
        
    }
    catch (error) {
        console.error("Error cargando los datos del tenista.", error);
    }

});