import { getPartido, getTorneo, getPista } from "./firebase-init.js";

document.addEventListener('DOMContentLoaded', async() => {
    const parametros = new URLSearchParams(window.location.search);
    const ID_partido = parametros.get('id');

    if(!ID_partido) {
        console.error("No se encontró ningún ID.");
        return;
    }

    try {
        const p = await getPartido(ID_partido);
        console.log("Datos del partido:", p);
        if(!p) {
            console.error("No se encontró el partido con ID:", ID_partido);
            return;
        }

        // Actualizamos toda la información del partido, imágenes, etc.----------------------------

        // Datos del torneo
        const t = await getTorneo(p.torneo);
        console.log("Datos del torneo:", t);
        if(!t) {
            // Si el torneo es null --> Partido amistoso
            document.querySelector('.info-torneo-nombre').textContent = "Amistoso";
            // Como no hay torneo se obtiene la ubicación y el tipo de pista del ID_pista
            const pista = await getPista(p.pista);
        console.log("Datos de la pista:", p);
            document.querySelector('.info-torneo-otros').textContent = pista ? `${pista.lugar} (${pista.tipo})` : "N/A";
            // Sin imagen
            document.querySelector('.info-torneo img').src = "";
        }
        else {
            document.querySelector('.info-torneo-nombre').textContent = `${t.serie} ${t.anho}`;
            document.querySelector('.info-torneo-otros').textContent = `${t.ubicacion} (${t.superficie})`;
            // Escoger el logo correspondiente a la categoría
            let archivo_logo;
            switch(t.categoria) {
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
            document.querySelector('.info-torneo img').src = `media/logo/${archivo_logo}.png`;
        }

        // Recordatorio --> campos de un partido que pueden ser null:
        //                  tenista1, tenista2, ganador, marcador, data
        // Info de los tenistas-------------------------------------------
        // Moito ollo: el marcador siempre está desde el punto de vista del ganador
        let ID_tenista1 = p.tenista1;
        let ID_tenista2 = p.tenista2;
        // Último detallito de crack: actualizar el botón pa volver al H2H
        document.querySelector('.ir-al-h2h a').href = `h2h.html?j1=${ID_tenista1}&j2=${ID_tenista2}`;
        // intercambiar tenistas para que el ganador siempre sea el tenista1
        if(p.tenista1 !== p.ganador && p.estado !== "nojugado") {
            [ID_tenista1, ID_tenista2] = [ID_tenista2, ID_tenista1]; // Amo JavaScript
        }
        document.querySelector('.tenista1-imagen img').src = `media/pfp/${ID_tenista1}.png`;
        document.querySelector('.tenista2-imagen img').src = `media/pfp/${ID_tenista2}.png`;
        document.querySelector('.mf-nombre1').textContent = ID_tenista1?.toUpperCase();
        document.querySelector('.mf-nombre2').textContent = ID_tenista2?.toUpperCase();
        
        // Meu home: existen partidos 'nojugados'
        if(p.estado === "nojugado") return;

        // Fecha y duración
        document.querySelector('.info-partido-fecha').textContent = p.fecha;
        if(p.mins === 0) {
            document.querySelector('.info-partido-duracion').textContent = " ";
        }
        else {
            document.querySelector('.info-partido-duracion').textContent = `${Math.floor(p.mins/60)}h${p.mins%60}min`;
        }

        // MARCADOR: ojo con todos los casos posibles... (T.T)
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

        const marcador_t1 = document.querySelector('.marcador-fila[data-player="t1"]');
        const marcador_t2 = document.querySelector('.marcador-fila[data-player="t2"]');
        const celda_set1_T1 = marcador_t1.querySelector('.mf-set1');
        const celda_set2_T1 = marcador_t1.querySelector('.mf-set2');
        const celda_set3_T1 = marcador_t1.querySelector('.mf-set3');
        const celda_set1_T2 = marcador_t2.querySelector('.mf-set1');
        const celda_set2_T2 = marcador_t2.querySelector('.mf-set2');
        const celda_set3_T2 = marcador_t2.querySelector('.mf-set3');
        celda_set1_T1.textContent = '';
        celda_set2_T1.textContent = '';
        celda_set3_T1.textContent = '';
        celda_set1_T2.textContent = '';
        celda_set2_T2.textContent = '';
        celda_set3_T2.textContent = '';

        // Les get this bread
        let juegos_t1, juegos_t2
        let libre = 50;

        // Poner los datos en los mf-sets en función del formato del partido
        [juegos_t1, juegos_t2] = info_marcador_limpio[0].split('-');
        celda_set1_T1.textContent = juegos_t1;
        celda_set1_T2.textContent = juegos_t2;
        celda_set2_T1.style.display = "none";
        celda_set2_T2.style.display = "none";
        celda_set3_T1.style.display = "none";
        celda_set3_T2.style.display = "none";
        switch(p.formato) {
            case "4juegos":
            case "1set":
                break;
            case "3sets":
                if(info_marcador_limpio[1]) {
                    [juegos_t1, juegos_t2] = info_marcador_limpio[1].split('-');
                    celda_set2_T1.textContent = juegos_t1;
                    celda_set2_T2.textContent = juegos_t2;
                    celda_set2_T1.style.display = "flex";
                    celda_set2_T2.style.display = "flex";
                    libre -= 8;
                }
                if(info_marcador_limpio[2]) {
                    [juegos_t1, juegos_t2] = info_marcador_limpio[2].split('-');
                    celda_set3_T1.textContent = juegos_t1;
                    celda_set3_T2.textContent = juegos_t2;
                    celda_set3_T1.style.display = "flex";
                    celda_set3_T2.style.display = "flex";
                    libre -= 8;
                }
                break;
        }

        document.querySelector('.mf-nombre1').style.width = `${libre}vw`;
        document.querySelector('.mf-nombre2').style.width = `${libre}vw`;

    }
    catch (error) {
        console.error("Error cargando el partido.", error)
    }
});