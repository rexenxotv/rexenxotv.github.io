import { getTenista, getRankingsTenista, getLiveRankings, getRankingCompletoTenista, getTodosLosTenistas } from "./firebase-init.js";
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
                ppj: data.puntosPorJuegos
            });
        }
        // Si entra por aquí es que el tenista no jugó ningún torneo en ese periodo
        else {
            unrankeds.push(ID_tenista);
        }
    }

    // Ordenamos liveranking_ordenado ;)
    liveranking_ordenado.sort((a, b) => a.ranking - b.ranking);

    // Ahora tenemos el liveranking ordenado y en unrankeds los que no jugaron
    const ulLiveRanking = document.getElementById('live-ranking-actual');
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
                <div class="lr-pps">${posicion.pps}</div>
                <div class="lr-ppj">${posicion.ppj}</div>
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
            divDif.textContent = `+${Math.abs(diferenciaRanking)}`;
            divDif.style.color = 'lime';
        }
        else {
            divDif.textContent = `−${diferenciaRanking}`;
            divDif.style.color = 'red';
        }

        // Lo añadimos a la lista
        ulLiveRanking.appendChild(li);
    }

    // Quitamos el cargando...
    document.getElementById("cargando").style.display = "none";
});