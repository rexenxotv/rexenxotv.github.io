import { getTenista, getPartido, getLiveRankings, getRankingCompletoTenista, getTodosLosTenistas, getTorneo, getPartidosTenista } from "./firebase-init.js";
import { RawDataStatsTenistaPartido, StatsTenistaPartido, getRawData } from "./stats.js";

document.addEventListener('DOMContentLoaded', async() => {
    // Obtenemos todos los rankings oficiales que hubo (rollito caché)
    const liverankings = await getLiveRankings();
    if(!liverankings) {
        console.error("Error al cargar los liverankings...");
        return [];
    }

    // Obtenemos los IDs de todos los tenistas
    const lista_tenistas = await getTodosLosTenistas();

    // El primero siempre debe ser el "live", se podría comprobar con el atributo de todos modos
    // Live ranking actual por defecto (se puede cambiar a uno anterior)
    const liveranking_ordenado = [];
    const unrankeds = [];
    for(const ID_tenista of lista_tenistas) {
        // Función que devuelve un objeto con el nº de ranking, puntos, PPS, PPJ
        const data = await getRankingCompletoTenista(ID_tenista);

        // Chekear el último club del historial (si hay alguno claro) y si aún está en él
        const t = await getTenista(ID_tenista);
        let club = " ";
        if (Array.isArray(t.historialClubes) && t.historialClubes.length > 0) {
            const ultimoClub = t.historialClubes[t.historialClubes.length - 1];
            if (ultimoClub && ultimoClub.fechaFin == null) club = ultimoClub.club;
        }

        // Chekear el último partido del historial (siempre hay al menos uno) para saber el último torneo
        const ultimo_partido = await getPartido(t.partidos[t.partidos.length - 1]);
        const ultimo_torneo = await getTorneo(ultimo_partido.torneo);
        let archivo_logo = "vacio";
        if(ultimo_torneo.categoria != null) {
            switch(ultimo_torneo.categoria) {
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
        }

        // Cargamos las stats también (lo siento por la pantalla de carga)
        // NA TARDA DEMASIADO TIENE QUE SER SU PROPIA PÁGINA LAS STATS
        /**
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
        const stats = new StatsTenistaPartido(statsTotales); */

        console.log(ID_tenista);
        console.log(data);

        if(data !== null) {
            liveranking_ordenado.push({
                tenista: ID_tenista,
                club: club,
                ranking: data.ranking,
                rankingAnterior: data.rankingAnterior,
                puntos: data.puntos,
                pps: data.puntosPorSets,
                ppj: data.puntosPorJuegos,
                ultimo_torneo: ultimo_torneo.serie + " " + ultimo_torneo.anho,
                archivo_logo: archivo_logo
            });
        }
        // Si entra por aquí es que el tenista no jugó ningún torneo en ese periodo
        else {
            unrankeds.push(ID_tenista);
        }
    }

    // Ahora tenemos el liveranking ordenado y en unrankeds los que no jugaron
    liveranking_ordenado.sort((a, b) => a.ranking - b.ranking);

    // Creamos los ul
    const ulLiveRanking = document.getElementById('live-ranking-actual');
    const ulStats = document.getElementById('all-stats');
    // UTF: ⇧ ⇩ ↺ ⯆▼▾▽ ⯅▲▴△ ⭡⭣

    // Listado de tenistas
    for(const posicion of liveranking_ordenado) {
        if(!posicion) continue; // Miqueta de progamasió defensiva Joan

        const li = document.createElement('li');

        console.log("posicione")
        console.log(posicion.tenista);
        console.log(posicion);

        // Meu rei todo de una joder
        li.innerHTML = `
            <div>
                <div class="lr-ranking">${posicion.ranking}</div>
                <div class="lr-diff"></div>
            </div>
            <div class="lr-foto"><a href="tenista.html?id=${posicion.tenista}">
                <img src="media/pfp/${posicion.tenista}.png">
            </a></div>
            <div>
                <div class="lr-nombre">
                    <a href="tenista.html?id=${posicion.tenista}">${posicion.tenista}</a>
                </div>
                <div class="lr-club">
                    <a href="">${posicion.club}</a>
                </div>
            </div>
            <div>
                <div class="lr-puntos">${posicion.puntos}</div>
                <div class="lr-pps">PPS: ${posicion.pps}</div>
                <div class="lr-ppj">PPJ: ${posicion.ppj}</div>
            </div>
            <div class="categoria-torneo">
                ${posicion.ultimo_torneo}
                <img src="media/logo/${posicion.archivo_logo}.png">
            </div>
        `;

        // Estilos sobre diff. de ranking
        const diferenciaRanking = posicion.ranking - posicion.rankingAnterior;
        const divDif = li.querySelector('.lr-diff');
        if (posicion.rankingAnterior == null && posicion.ranking != null) {
            divDif.textContent = 'NEW!';
            divDif.style.color = 'gold';
            divDif.style.fontWeight = 500;
        }
        else if (diferenciaRanking == 0) {
            divDif.textContent = ``;
            divDif.style.color = 'lightslategray';
        }
        else if (diferenciaRanking < 0) {
            divDif.textContent = `⭡${Math.abs(diferenciaRanking)}`;
            divDif.style.color = 'lime';
        }
        else {
            divDif.textContent = `⭣${diferenciaRanking}`;
            divDif.style.color = 'red';
        }

        // Lo añadimos a la lista
        ulLiveRanking.appendChild(li);
    }

    // Quitamos el cargando...
    document.getElementById("cargando").style.display = "none";
});