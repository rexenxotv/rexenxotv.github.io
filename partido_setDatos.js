import { getPartido, getTorneo, getPista } from "./firebase-init.js";
import { actualizarTodasLasBarras } from "./partido_porcentajes_barras.js";
import { RawDataStatsTenistaPartido, StatsTenistaPartido, getRawData } from "./stats.js";

document.addEventListener('DOMContentLoaded', async() => {
    const parametros = new URLSearchParams(window.location.search);
    const ID_partido = parametros.get('id');

    if(!ID_partido) {
        console.error("No se encontró ningún ID.");
        return;
    }

    try {
        const p = await getPartido(ID_partido);
        //console.log("Datos del partido:", p); DEBUG
        if(!p) {
            console.error("No se encontró el partido con ID:", ID_partido);
            return;
        }

        // Actualizamos toda la información del partido, imágenes, etc.----------------------------
        // Recordatorio --> campos de un partido que pueden ser null: árbitro, data
        // (pista y fecha si es Withdraw)

        // Datos del torneo
        const t = await getTorneo(p.torneo);
        //console.log("Datos del torneo:", t); DEBUG
        if(!t) {
            // Si el torneo es null --> Partido amistoso
            document.querySelector('.torneo-nombre').textContent = "Amistoso";
        }
        else {
            document.querySelector('.torneo-nombre').textContent = `${t.serie} ${t.anho}`;
            let ronda = "?";
            switch(p.ronda) {
                case "F": ronda = "Final"; break;
                case "SF": ronda = "Semifinal"; break;
                case "QF": ronda = "Cuartos de final"; break;
                case "R16": ronda = "Octavos de final"; break;
                case "R32": ronda = "Ronda de 32"; break;
                case "R64": ronda = "Ronda de 64"; break;
                case "GS": ronda = "Fase de grupos"; break;
                case "Q": ronda = "Clasificatorios"; break;
                case "A": ronda = "Amistoso"; break;
                case "E": ronda = "Exibición"; break;
            }
            document.querySelector('.torneo-ronda').textContent = ronda;
        }

        // Info de los tenistas-------------------------------------------
        let ID_tenista1 = p.tenista1;
        let ID_tenista2 = p.tenista2;
        // Detallito de crack: actualizar el título de la página
        document.title = `${ID_tenista1} vs ${ID_tenista2} | ATP Rexenxo`;
        // Detallito de crack: actualizar el botón pa volver al H2H
        document.querySelector('.ir-al-h2h a').href = `h2h.html?j1=${ID_tenista1}&j2=${ID_tenista2}`;
        // Poner las fotos y linkearlas a los perfiles (el ganador tiene el borde amarillo)
        const imagen_t1 = document.getElementById("it1");
        imagen_t1.querySelector('img').src = `media/pfp/${ID_tenista1}.png`;
        imagen_t1.querySelector('a').href = `tenista.html?id=${ID_tenista1}`;
        if(p.ganador === ID_tenista1) imagen_t1.style.borderColor = 'yellow';
        const imagen_t2 = document.getElementById("it2");
        imagen_t2.querySelector('img').src = `media/pfp/${ID_tenista2}.png`;
        imagen_t2.querySelector('a').href = `tenista.html?id=${ID_tenista2}`;
        if(p.ganador === ID_tenista2) imagen_t2.style.borderColor = 'yellow';
        
        // ------------------------------------- MARCADOR ------------------------------------- //
        // Moito ollo: el marcador siempre está desde el punto de vista del ganador
        const marcador_ganador = document.querySelector('div[data-player="t1"]');
        const marcador_perdedor = document.querySelector('div[data-player="t2"]');
        let ganador, perdedor;
        if(p.ganador === ID_tenista1) {
            ganador = ID_tenista1;
            perdedor = ID_tenista2;
        }
        else {
            ganador = ID_tenista2;
            perdedor = ID_tenista1;
        }
        // Seeding

        // (si es WC, LL, PR, etc. se le baja la fuente) -> font-size: calc(var(--vw) * 2.6);

        // Nombres
        marcador_ganador.querySelector('.m-nombre a').textContent = ganador.toUpperCase();
        marcador_perdedor.querySelector('.m-nombre a').textContent = perdedor.toUpperCase();
        marcador_ganador.querySelector('.m-nombre a').href = `tenista.html?id=${ganador}`;
        marcador_perdedor.querySelector('.m-nombre a').href = `tenista.html?id=${perdedor}`;

        // Meu home: existen partidos 'nojugados' ---> Withdraws
        if(p.estado === "nojugado") {
            // Tocamos algunas cosas y ya
            marcador_ganador.querySelector('#set1').style.display = "none";
            marcador_perdedor.querySelector('#set1').style.display = "none";
            marcador_ganador.querySelector('.m-nombre').style.width = "70vw";
            marcador_perdedor.querySelector('.m-nombre').style.width = "70vw";
            document.querySelector('.final').textContent = `${ganador} avanza ya que ${perdedor} se retiró del torneo...`;
            return;
        }

        // Duración
        if(p.mins === 0) document.querySelector('.duracion').textContent = " ";
        else {
            document.querySelector('.duracion').textContent = `${Math.floor(p.mins/60)}h${p.mins%60}min`;
        }
        
        // RESULTADO: ojo con todos los casos posibles... (T.T)
        // Ejemplo: ["7-6(7-2) 4-1(RET)"] ---> ["7-6(7-2)", "4-1(RET)"]
        const info_marcador = p.marcador.trim().split(' ');
        const info_marcador_limpio = [];
        const info_marcador_extras = [];

        // Guardar el formato básico de los sets en un sitio y los extras en otro
        info_marcador.forEach(set => {
            const partes = set.split('(');
            info_marcador_limpio.push(partes[0]);
            
            if(partes[1]) {
                info_marcador_extras.push(partes[1].replace(')',''));
            }
            else {
                info_marcador_extras.push(null);
            }
        });
        
        // Variables
        let juegos_g, juegos_p;
        let libre = 39 + 8 + 8 + 7; // 8 por cada set a mayores del primero, 7 por los juegos actuales
        // EN EL MARCADOR EN DIRECTO TAMBIÉN HAY QUE QUITARLE POR EL ICONO DE QUIEN TIENE EL SERVICIO
        // El primer set (o 4juegos o lo que sea) siempre hace falta
        const set1_ganador = marcador_ganador.querySelector('#set1');
        const set1_perdedor = marcador_perdedor.querySelector('#set1');
        [juegos_g, juegos_p] = info_marcador_limpio[0].split('-');
        set1_ganador.textContent = juegos_g;
        set1_perdedor.textContent = juegos_p;
        // Colorear de amarillo si alguno ganó el set
        if( ["6-0","6-1","6-2","6-3","6-4","7-5","7-6"].includes(info_marcador_limpio[0]) ) {
            set1_ganador.style.color = "yellow";
        }
        else if(["0-6","1-6","2-6","3-6","4-6","5-7","6-7"].includes(info_marcador_limpio[0]) ) {
            set1_perdedor.style.color = "yellow";
        }
        
        // Resto de sets si es al mejor de 3 (de momento no está implementado al mejor de 5)
        if(p.formato === "3sets") {
            // Segundo set
            if( info_marcador_limpio[1] ) {
                const set2_ganador = marcador_ganador.querySelector('#set2');
                const set2_perdedor = marcador_perdedor.querySelector('#set2');
                [juegos_g, juegos_p] = info_marcador_limpio[1].split('-');
                set2_ganador.textContent = juegos_g;
                set2_perdedor.textContent = juegos_p;
                // Colorear de amarillo si alguno ganó el set
                if( ["6-0","6-1","6-2","6-3","6-4","7-5","7-6"].includes(info_marcador_limpio[1]) ) {
                    set2_ganador.style.color = "yellow";
                }
                else if(["0-6","1-6","2-6","3-6","4-6","5-7","6-7"].includes(info_marcador_limpio[1]) ) {
                    set2_perdedor.style.color = "yellow";
                }

                // Hacer que se vean y recortar espacio libre del nombre
                set2_ganador.style.display = "flex";
                set2_perdedor.style.display = "flex";
                libre -= 8;
            }

            // Tercer set
            if( info_marcador_limpio[2] ) {
                const set3_ganador = marcador_ganador.querySelector('#set3');
                const set3_perdedor = marcador_perdedor.querySelector('#set3');
                [juegos_g, juegos_p] = info_marcador_limpio[2].split('-');
                set3_ganador.textContent = juegos_g;
                set3_perdedor.textContent = juegos_p;
                // Colorear de amarillo si alguno ganó el set
                if( ["6-0","6-1","6-2","6-3","6-4","7-5","7-6"].includes(info_marcador_limpio[2]) ) {
                    set3_ganador.style.color = "yellow";
                }
                else if(["0-6","1-6","2-6","3-6","4-6","5-7","6-7"].includes(info_marcador_limpio[2]) ) {
                    set3_perdedor.style.color = "yellow";
                }

                // Hacer que se vean y recortar espacio libre del nombre
                set3_ganador.style.display = "flex";
                set3_perdedor.style.display = "flex";
                libre -= 8;
            }
        }

        // Pal futuro (en un marcador en directo que muestra el juego actual):
        // Si es AD se baja el tamaño de fuente -> font-size: calc(var(--vw) * 3.6);
        

        // Ajustamos el ancho del nombre en función del número de sets
        marcador_ganador.querySelector('.m-nombre').style.width = `${libre}vw`;
        marcador_perdedor.querySelector('.m-nombre').style.width = `${libre}vw`;

        console.log(p);
        // Mensaje final
        if(info_marcador_extras[info_marcador_extras.length - 1] === "RET") {
            document.querySelector('.final').textContent = `${perdedor} se ve forzado a retirarse... ${ganador} gana.`;
        }
        else if(p.marcador === "?") {
            document.querySelector('.final').textContent = `Juego, Set y Partido. ${p.ganador} gana.`;
        }
        else {
            document.querySelector('.final').textContent = `Juego, Set y Partido. ${p.ganador} gana ${p.marcador}.`;
        }

        // ----------------------------------- ESTADÍSTICAS ----------------------------------- //

        // Sólo si el partido las tiene claro!
        if( p.estado != "fulldata") return;

        let rawData_t1 = new RawDataStatsTenistaPartido();
        let rawData_t2 = new RawDataStatsTenistaPartido();

        try {
            [rawData_t1, rawData_t2] = getRawData(p);

            // DEBUG
            console.log(p.id + ": " + p.tenista1 + " vs " + p.tenista2);
            console.log("rawStats " + p.tenista1);
            console.log(rawData_t1);
            console.log("rawStats " + p.tenista2);
            console.log(rawData_t2);
        } catch (e) {
            console.warn(`No se pudieron obtener stats del partido ${p.id}`, e);
        }

        // Las transformamos a las stats que se muestran
        const stats_t1 = new StatsTenistaPartido(rawData_t1);
        const stats_t2 = new StatsTenistaPartido(rawData_t2);
        // Variable de control: número de decimales de los floats
        const nDecimales = 0;

        // Imos aló, primeiro as fáciles
        document.getElementById('aces').querySelector('.dato-t1').textContent = stats_t1.aces;
        document.getElementById('aces').querySelector('.dato-t2').textContent = stats_t2.aces;
        document.getElementById('doblesFaltas').querySelector('.dato-t1').textContent = stats_t1.doblesFaltas;
        document.getElementById('doblesFaltas').querySelector('.dato-t2').textContent = stats_t2.doblesFaltas;
        document.getElementById('tiebreaksGanados').querySelector('.dato-t1').textContent = stats_t1.tiebreaksGanados;
        document.getElementById('tiebreaksGanados').querySelector('.dato-t2').textContent = stats_t2.tiebreaksGanados;
        document.getElementById('juegosEnBlanco').querySelector('.dato-t1').textContent = stats_t1.juegosEnBlanco;
        document.getElementById('juegosEnBlanco').querySelector('.dato-t2').textContent = stats_t2.juegosEnBlanco;
        document.getElementById('MRPG').querySelector('.dato-t1').textContent = "0";
        document.getElementById('MRPG').querySelector('.dato-t2').textContent = "0";
        document.getElementById('MRJG').querySelector('.dato-t1').textContent = "0";
        document.getElementById('MRJG').querySelector('.dato-t2').textContent = "0";

        // Agora a putadinha: mostralas como % e x/y á vez
        // Moito ollo con .toFixed(n) que devolve un string!
        // SAQUE
        document.getElementById('p_primerSaque').querySelector('.dato-t1').innerHTML = `
            ${(stats_t1.p_primerSaque * 100).toFixed(nDecimales)}%
            <br>${rawData_t1.nPrimerSaque}/${rawData_t1.nSaques}
            `;
        document.getElementById('p_primerSaque').querySelector('.dato-t2').innerHTML = `
            ${(stats_t2.p_primerSaque * 100).toFixed(nDecimales)}%
            <br>${rawData_t2.nPrimerSaque}/${rawData_t2.nSaques}
            `;
        document.getElementById('p_PG_primerSaque').querySelector('.dato-t1').innerHTML = `
            ${(stats_t1.p_PG_primerSaque * 100).toFixed(nDecimales)}%
            <br>${rawData_t1.nPG_primerSaque}/${rawData_t1.nPrimerSaque}
            `;
        document.getElementById('p_PG_primerSaque').querySelector('.dato-t2').innerHTML = `
            ${(stats_t2.p_PG_primerSaque * 100).toFixed(nDecimales)}%
            <br>${rawData_t2.nPG_primerSaque}/${rawData_t2.nPrimerSaque}
            `;
        document.getElementById('p_PG_segundoSaque').querySelector('.dato-t1').innerHTML = `
            ${(stats_t1.p_PG_segundoSaque * 100).toFixed(nDecimales)}%
            <br>${rawData_t1.nPG_segundoSaque}/${rawData_t1.nSegundoSaque}
            `;
        document.getElementById('p_PG_segundoSaque').querySelector('.dato-t2').innerHTML = `
            ${(stats_t2.p_PG_segundoSaque * 100).toFixed(nDecimales)}%
            <br>${rawData_t2.nPG_segundoSaque}/${rawData_t2.nSegundoSaque}
            `;
        document.getElementById('p_breakpointsSalvados').querySelector('.dato-t1').innerHTML = `
            ${(stats_t1.p_breakpointsSalvados * 100).toFixed(nDecimales)}%
            <br>${rawData_t1.nBreakpointsSalvados}/${rawData_t1.nBreakpointsEnContra}
            `;
        document.getElementById('p_breakpointsSalvados').querySelector('.dato-t2').innerHTML = `
            ${(stats_t2.p_breakpointsSalvados * 100).toFixed(nDecimales)}%
            <br>${rawData_t2.nBreakpointsSalvados}/${rawData_t2.nBreakpointsEnContra}
            `;
        document.getElementById('p_JG_sacando').querySelector('.dato-t1').innerHTML = `
            ${(stats_t1.p_JG_sacando * 100).toFixed(nDecimales)}%
            <br>${rawData_t1.nJG_sacando}/${rawData_t1.nJuegosSacando}
            `;
        document.getElementById('p_JG_sacando').querySelector('.dato-t2').innerHTML = `
            ${(stats_t2.p_JG_sacando * 100).toFixed(nDecimales)}%
            <br>${rawData_t2.nJG_sacando}/${rawData_t2.nJuegosSacando}
            `;
        // RESTO
        document.getElementById('p_PG_restandoPrimerSaque').querySelector('.dato-t1').innerHTML = `
            ${(stats_t1.p_PG_restandoPrimerSaque * 100).toFixed(nDecimales)}%
            <br>${rawData_t1.nPG_restandoPrimerSaque}/${rawData_t1.nRestosPrimerSaque}
            `;
        document.getElementById('p_PG_restandoPrimerSaque').querySelector('.dato-t2').innerHTML = `
            ${(stats_t2.p_PG_restandoPrimerSaque * 100).toFixed(nDecimales)}%
            <br>${rawData_t2.nPG_restandoPrimerSaque}/${rawData_t2.nRestosPrimerSaque}
            `;
        document.getElementById('p_PG_restandoSegundoSaque').querySelector('.dato-t1').innerHTML = `
            ${(stats_t1.p_PG_restandoSegundoSaque * 100).toFixed(nDecimales)}%
            <br>${rawData_t1.nPG_restandoSegundoSaque}/${rawData_t1.nRestosSegundoSaque}
            `;
        document.getElementById('p_PG_restandoSegundoSaque').querySelector('.dato-t2').innerHTML = `
            ${(stats_t2.p_PG_restandoSegundoSaque * 100).toFixed(nDecimales)}%
            <br>${rawData_t2.nPG_restandoSegundoSaque}/${rawData_t2.nRestosSegundoSaque}
            `;
        document.getElementById('p_breakpointsConvertidos').querySelector('.dato-t1').innerHTML = `
            ${(stats_t1.p_breakpointsConvertidos * 100).toFixed(nDecimales)}%
            <br>${rawData_t1.nBreakpointsConvertidos}/${rawData_t1.nBreakpointsAFavor}
            `;
        document.getElementById('p_breakpointsConvertidos').querySelector('.dato-t2').innerHTML = `
            ${(stats_t2.p_breakpointsConvertidos * 100).toFixed(nDecimales)}%
            <br>${rawData_t2.nBreakpointsConvertidos}/${rawData_t2.nBreakpointsAFavor}
            `;
        document.getElementById('p_JG_restando').querySelector('.dato-t1').innerHTML = `
            ${(stats_t1.p_JG_restando * 100).toFixed(nDecimales)}%
            <br>${rawData_t1.nJG_restando}/${rawData_t1.nJuegosRestando}
            `;
        document.getElementById('p_JG_restando').querySelector('.dato-t2').innerHTML = `
            ${(stats_t2.p_JG_restando * 100).toFixed(nDecimales)}%
            <br>${rawData_t2.nJG_restando}/${rawData_t2.nJuegosRestando}
            `;
        // MOMENTOS CRÍTICOS
        document.getElementById('p_setpointsConvertidos').querySelector('.dato-t1').innerHTML = `
            ${(stats_t1.p_setpointsConvertidos * 100).toFixed(nDecimales)}%
            <br>${rawData_t1.nSetpointsConvertidos}/${rawData_t1.nSetpointsAFavor}
            `;
        document.getElementById('p_setpointsConvertidos').querySelector('.dato-t2').innerHTML = `
            ${(stats_t2.p_setpointsConvertidos * 100).toFixed(nDecimales)}%
            <br>${rawData_t2.nSetpointsConvertidos}/${rawData_t2.nSetpointsAFavor}
            `;
        document.getElementById('p_setpointsSalvados').querySelector('.dato-t1').innerHTML = `
            ${(stats_t1.p_setpointsSalvados * 100).toFixed(nDecimales)}%
            <br>${rawData_t1.nSetpointsSalvados}/${rawData_t1.nSetpointsEnContra}
            `;
        document.getElementById('p_setpointsSalvados').querySelector('.dato-t2').innerHTML = `
            ${(stats_t2.p_setpointsSalvados * 100).toFixed(nDecimales)}%
            <br>${rawData_t2.nSetpointsSalvados}/${rawData_t2.nSetpointsEnContra}
            `;
        document.getElementById('p_matchpointsConvertidos').querySelector('.dato-t1').innerHTML = `
            ${(stats_t1.p_matchpointsConvertidos * 100).toFixed(nDecimales)}%
            <br>${rawData_t1.nMatchpointsConvertidos}/${rawData_t1.nMatchpointsAFavor}
            `;
        document.getElementById('p_matchpointsConvertidos').querySelector('.dato-t2').innerHTML = `
            ${(stats_t2.p_matchpointsConvertidos * 100).toFixed(nDecimales)}%
            <br>${rawData_t2.nMatchpointsConvertidos}/${rawData_t2.nMatchpointsAFavor}
            `;
        document.getElementById('p_matchpointsSalvados').querySelector('.dato-t1').innerHTML = `
            ${(stats_t1.p_matchpointsSalvados * 100).toFixed(nDecimales)}%
            <br>${rawData_t1.nMatchpointsSalvados}/${rawData_t1.nMatchpointsEnContra}
            `;
        document.getElementById('p_matchpointsSalvados').querySelector('.dato-t2').innerHTML = `
            ${(stats_t2.p_matchpointsSalvados * 100).toFixed(nDecimales)}%
            <br>${rawData_t2.nMatchpointsSalvados}/${rawData_t2.nMatchpointsEnContra}
            `;

        // ----------------------------------- FICHA TÉCNICA ----------------------------------- //
            
        // Se hace al final para garantizar que la pista existe (no es Withdraw)
        const pista = await getPista(p.pista);
        if(!pista) {
            console.error("No se encontró la pista con ID:", p.pista);
        }
        
        // Ficha técnica
        document.getElementById("fecha").textContent = p.fecha || "?";
        document.getElementById("lugar").textContent = pista.lugar || "?";
        document.getElementById("pista").textContent = pista.nombre || "?";
        document.getElementById("superficie").textContent = pista.tipo || "?";
        document.getElementById("arbitro").textContent = p.arbitro || "?";

        // ------------------ Actualizar las barras y porcentajes visuales !! ------------------ //
        actualizarTodasLasBarras();
    }
    catch (error) {
        console.error("Error cargando el partido.", error);
    }
});