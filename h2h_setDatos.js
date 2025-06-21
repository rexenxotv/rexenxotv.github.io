import { getPartidosTenista, getTenista, getTorneo, getLiveRankings, calcularRanking } from "./firebase-init.js";
import { actualizarTodasLasBarras } from "./h2h_porcentajes_barras.js";
import { actualizarCircunferenciaVS } from "./h2h_porcentajes_vs.js";

function calcularBagels(ID_tenista, partidos) {
    let bagels = 0;

    // Crazy for sintaxis en javascript
    for(const partido of partidos) {
        const esGanador = (partido.ganador === ID_tenista);
        if (!partido.marcador) continue; // Para los marcadores null o undefined
        const sets = partido.marcador.split(' ');

        for(const set of sets) {
            // Ojo con el formato, algunos sets son del estilo 7-6(7-0)
            const setSinTiebreak = set.split('(')[0];
            const [juegos_t1, juegos_t2] = setSinTiebreak.split('-').map(Number);
            // Programasió defensiva Joan
            if (isNaN(juegos_t1) || isNaN(juegos_t2)) continue;

            if(esGanador && juegos_t1 === 6 && juegos_t2 === 0) bagels++;
            if(!esGanador && juegos_t1 === 0 && juegos_t2 === 6) bagels++;
        }
    }

    return bagels;
}

async function setDatosH2H(ID_tenista1, ID_tenista2) {
    try {
        // Obtenemos los tenistas y sus listas de partidos (los objetos)
        const [t1, t2] = await Promise.all([
            getTenista(ID_tenista1), getTenista(ID_tenista2)
        ]);
        const partidos_t1 = await getPartidosTenista(t1);
        const partidos_t2 = await getPartidosTenista(t2);

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
            p.tenista1 === ID_tenista2 || p.tenista2 === ID_tenista2
        ).length;
        const t1_gana_a_t2 = partidos_t1.filter(p =>
            (p.tenista1 === ID_tenista2 || p.tenista2 === ID_tenista2) && p.ganador === ID_tenista1
        ).length;
        document.querySelector('.victorias-tenista1 strong').textContent = t1_gana_a_t2;
        document.querySelector('.victorias-tenista2 strong').textContent = nEnfrentamientos-t1_gana_a_t2;
        

        // ------------------ESTADÍSTICAS-----------------
        // (1) CALCULARLAS
        // Ranking de cada tenista
        const liverankings = await getLiveRankings();
        if(!liverankings) {
            console.error("Error al cargar los liverankings...");
            return [];
        }
        const ranking_t1 = await calcularRanking(liverankings[0], ID_tenista1);
        const ranking_t2 = await calcularRanking(liverankings[0], ID_tenista2);
        // Victorias y derrotas de cada tenista
        const victorias_t1 = partidos_t1.filter(p => p.ganador === ID_tenista1).length;
        const derrotas_t1 = partidos_t1.filter(p => p.ganador !== ID_tenista1 && p.ganador != null).length;
        const victorias_t2 = partidos_t2.filter(p => p.ganador === ID_tenista2).length;
        const derrotas_t2 = partidos_t2.filter(p => p.ganador !== ID_tenista2 && p.ganador != null).length;
        // Títulos de cada tenista
        const titulos_t1 = partidos_t1.filter(p => p.ronda === 'F' && p.ganador === ID_tenista1).length;
        const titulos_t2 = partidos_t2.filter(p => p.ronda === 'F' && p.ganador === ID_tenista2).length;
        // Bagels de cada tenista
        const bagels_t1 = calcularBagels(ID_tenista1, partidos_t1);
        const bagels_t2 = calcularBagels(ID_tenista2, partidos_t2);
        // (2) ACTUALIZAR LOS DATOS
        document.querySelectorAll('.h2h-info-tabla-fila').forEach(fila => {
            const tipo = fila.querySelector('.h2h-info-tabla-cen')?.textContent;

            switch(tipo) {
                // ?? 'N/A' al final de algunos datos por si acaso (null, undefined...)
                case 'Ranking':
                    // Datos calculados
                    fila.querySelector('.h2h-info-tabla-izq strong').textContent = ranking_t1;
                    fila.querySelector('.h2h-info-tabla-der strong').textContent = ranking_t2;
                    break;
                case 'Mano dominante':
                    fila.querySelector('.h2h-info-tabla-izq strong').textContent = t1.diestro ? 'Diestro': 'Zurdo';
                    fila.querySelector('.h2h-info-tabla-der strong').textContent = t2.diestro ? 'Diestro': 'Zurdo';
                    break;
                case 'Debut':
                    fila.querySelector('.h2h-info-tabla-izq strong').textContent = t1.debut ?? 'N/A';
                    fila.querySelector('.h2h-info-tabla-der strong').textContent = t2.debut ?? 'N/A';
                    break;
                case 'Victorias/Derrotas':
                    // Datos calculados
                    fila.querySelector('.h2h-info-tabla-izq strong').textContent = `${victorias_t1}/${derrotas_t1}`;
                    fila.querySelector('.h2h-info-tabla-der strong').textContent = `${victorias_t2}/${derrotas_t2}`;
                    break;
                case 'Títulos':
                    // Datos calculados
                    fila.querySelector('.h2h-info-tabla-izq strong').textContent = titulos_t1;
                    fila.querySelector('.h2h-info-tabla-der strong').textContent = titulos_t2;
                    break;
                case 'Bagels':
                    // Datos calculados
                    fila.querySelector('.h2h-info-tabla-izq strong').textContent = bagels_t1;
                    fila.querySelector('.h2h-info-tabla-der strong').textContent = bagels_t2;
                    break;
                case 'Origen':
                    fila.querySelector('.h2h-info-tabla-izq strong').textContent = t1.origen ?? 'N/A';
                    fila.querySelector('.h2h-info-tabla-der strong').textContent = t2.origen ?? 'N/A';
                    break;
            }
        });

        // (3) Actualizar las barras y porcentajes visuales
        actualizarTodasLasBarras();
        actualizarCircunferenciaVS();

        // ------------------PARTIDOS----------------------
        const ul = document.getElementById('partidos-h2h');
        ul.innerHTML = ''; // Limpiamos antes de añadir nada

        const partidosH2H = partidos_t1.filter(p =>
            p.tenista1 === ID_tenista2 || p.tenista2 === ID_tenista2
        );

        // Si no han jugado ningún partido todavía
        if(partidosH2H.length === 0) {
            ul.innerHTML = '<li>¡Estos dos cracks aún no se han enfrentado!</li>';
            return;
        }

        // Si hay partidos: creamos los elementos <li> para cada partido
        for (let i = partidosH2H.length - 1; i >= 0; i--) {
            const p = partidosH2H[i]; // FOR invertido (crazy shi)

            const li = document.createElement('li');
            li.classList.add('fila-info-partido');

            // AÑO
            const anho = document.createElement('div');
            anho.textContent = p.fecha.split('.')[2] || 'N/A';
            anho.classList.add('columna-lista-partidos', 'clp-anho');
            li.appendChild(anho);

            // GANADOR (CÍRCULO porque es demasiado chikito pa la imagen)
            const circulo = document.createElement('div');
            circulo.classList.add('columna-lista-partidos', 'circulito-ganador');
            if (p.ganador === ID_tenista1) circulo.style.background = 'blue';
            else if (p.ganador === ID_tenista2) circulo.style.background = 'yellow';
            else circulo.style.background = 'grey';
            li.appendChild(circulo);

            // GANADOR (NOMBRE)
            const ganador = document.createElement('div');
            ganador.classList.add('columna-lista-partidos', 'clp-ganador');
            // Barbarie: que sea clickable y te lleve al perfil del tenista
            const linkGanador = document.createElement('a');
            linkGanador.href = `/tenistas/${p.ganador}`;
            linkGanador.textContent = p.ganador || 'N/A';
            ganador.appendChild(linkGanador);
            li.appendChild(ganador);

            const torneo = document.createElement('div');
            torneo.classList.add('columna-lista-partidos', 'clp-torneo');
            // Barbarie: que sea clickable y te lleve al perfil del torneo
            const linkTorneo = document.createElement('a');
            const objetoTorneo = await getTorneo(p.torneo);
            linkTorneo.href = `/torneos/${objetoTorneo.serie}`;
            linkTorneo.textContent = objetoTorneo.serie || 'N/A';
            torneo.appendChild(linkTorneo);
            li.appendChild(torneo);
            
            const ronda = document.createElement('div');
            ronda.classList.add('columna-lista-partidos', 'clp-ronda');
            // Barbarie: que sea clickable y te lleve AL PARTIDO
            const linkRonda = document.createElement('a');
            linkRonda.href = `/partido.html?id=${p.id}`;
            linkRonda.textContent = p.ronda || 'N/A';
            ronda.appendChild(linkRonda);
            li.appendChild(ronda);

            const marcador = document.createElement('div');
            marcador.classList.add('columna-lista-partidos', 'clp-marcador');
            // Barbarie: que sea clickable y te lleve AL PARTIDO
            const linkMarcador = document.createElement('a');
            linkMarcador.href = `/partido.html?id=${p.id}`;
            linkMarcador.textContent = p.marcador || 'N/A';
            marcador.appendChild(linkMarcador);
            li.appendChild(marcador);

            ul.appendChild(li);
        };
    }
    catch (err) {
        console.error('Error al cargar los datos de los jugadores', err);
    }
}

export { setDatosH2H }