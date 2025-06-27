import { getTenista, getPartidosTenista, getRankingsTenista } from "./firebase-init.js";

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
            console.error("No se encontró al tenista con ID:", ID_partido);
            return;
        }

        // Actualizamos toda la información del tenista, imágenes, etc.----------------------------
        // Título de la página
        document.title = `${ID_tenista} | ATP Rexenxo`;
        // ------------------------ DATOS DEL TENISTA ------------------------
        document.querySelector('.tenista-info-nombre').textContent = ID_tenista.toUpperCase();
        document.querySelector('.tenista-info-imagen img').src = `media/silueta/${ID_tenista}.png`;
        // Chekear el último club del historial (si hay alguno claro) y si aún está en él
        let club = "Sin club";
        if (Array.isArray(t.historialClubes) && t.historialClubes.length > 0) {
            const ultimoClub = t.historialClubes[t.historialClubes.length - 1];
            if (ultimoClub && ultimoClub.fechaFin == null) club = ultimoClub.club;
        }
        document.querySelector('.tenista-info-club').textContent = club;

        // ------------------------ PARTIDOS (Y STATS DERIVADAS) ------------------------
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
        
    }
    catch (error) {
        console.error("Error cargando los datos del tenista.", error);
    }

});