// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, child, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app-check.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCaTyO_NglYsB_YNjyX4XoUU23ZWD5z_4I",
    authDomain: "rexenxotv.firebaseapp.com",
    databaseURL: "https://rexenxotv-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "rexenxotv",
    storageBucket: "rexenxotv.firebasestorage.app",
    messagingSenderId: "187368465261",
    appId: "1:187368465261:web:e31c061eceab49de007064"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
// APPCheck
initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider("6LendWYrAAAAAHQAHxggGQuexs0rPae54uHXteFU"),
    isTokenAutoRefreshEnabled: true,
});

/** 
// DEBUG APPCheck
const appCheck = getAppCheck(app);
appCheck.getToken().then(tokenResult => {
  console.log('AppCheck token:', tokenResult.token);
}).catch(e => {
  console.error('Error obteniendo token AppCheck:', e);
});*/

// Exportamos la base datos para poder importarla en otro archivo
export { db };

// GETTERS-------------------------------------------------------------------------------
export async function getTenista(id) {
    const snapshot = await get(child(ref(db), `tenistas/${id}`));
    if (!snapshot.exists()) throw new Error(`No se encontró el jugador: ${id}`);
    return snapshot.val();
}

export async function getPartido(id) {
    const snapshot = await get(child(ref(db), `partidos/${id}`));
    if (!snapshot.exists()) throw new Error(`No se encontró el partido: ${id}`);
    return snapshot.val();
}

export async function getTorneo(id) {
    const snapshot = await get(child(ref(db), `torneos/${id}`));
    if (!snapshot.exists()) throw new Error(`No se encontró el torneo: ${id}`);
    return snapshot.val();
}

export async function getPista(id) {
    const snapshot = await get(child(ref(db), `pistas/${id}`));
    if (!snapshot.exists()) throw new Error(`No se encontró la pista: ${id}`);
    return snapshot.val();
}

export async function getResultados(id_torneo) {
    const snapshot = await get(child(ref(db), `resultados/${id_torneo}`));
    if (!snapshot.exists()) throw new Error(`No se encontraron resultados del torneo: ${id_torneo}`);
    return snapshot.val();
}

export async function getLiveRankings() {
    const snapshot = await get(child(ref(db), `const/liveranking`));
    if (!snapshot.exists()) throw new Error(`No existe el elemento liveranking`);
    return snapshot.val();
}

export async function getIDsPartidosTenista(ID_tenista) {
    const snapshot_tenista = await get(child(ref(db), `tenistas/${ID_tenista}`));
    if (!snapshot_tenista.exists()) throw new Error(`No se encontró el jugador: ${ID_tenista}`);

    // Obtener el objeto tenista
    const tenista = snapshot_tenista.val();
    
    // Array con los IDs de los partidos
    const partidosIDs = tenista.partidos || [];
    
    return partidosIDs;
}

export async function getPartidosTenista(ID_tenista) {
    const snapshot_tenista = await get(child(ref(db), `tenistas/${ID_tenista}`));
    if (!snapshot_tenista.exists()) throw new Error(`No se encontró el jugador: ${ID_tenista}`);

    // Obtener el objeto tenista
    const tenista = snapshot_tenista.val();
    
    // Array con los IDs de los partidos
    const partidosIDs = tenista.partidos || [];

    // Array de objetos de tipo 'partido'
    const partidos = [];

    for (const ID_partido of partidosIDs) {
        partidos.push(await getPartido(ID_partido));
    }

    return partidos;
}

export async function getTodosLosTenistas() {
    const snapshot = await get(ref(db, 'tenistas'));
    if(!snapshot.exists()) return []; // Si hubiera un error devuelve una lista vacía

    const data = snapshot.val();// Objeto de IDs
    return Object.keys(data);   // Devuelve el listado de IDs
}



/* FUNCIÓN MONSTRUOSA QUE DEVUELVE: ranking actual, ranking anterior, mejor ranking */
export async function getRankingsTenista(ID_tenista) {
    const liverankings = await getLiveRankings();
    if(!liverankings) {
        console.error("Error al cargar los liverankings...");
        return [];
    }

    /**
     * DOCUMENTAÇAO
     * 
     * (1) Se da por hecho que liverankings hay como mínimo 2
     * (2) liverankings[0] es el verdadero ranking live (del torneo que se está jugando ahora mismo)
     * (3) a partir de liveranking[1] parriba son los anteriores en orden cronológico (desde el primero)
     */

    // Tenemos que recorrer cada liveranking para ver cuál fue su mejor
    // Por el camino obtenemos el actual y el anterior
    const rankingActual = await calcularRanking(liverankings[0], ID_tenista);
    let mejorRanking = rankingActual;
    let fechaMR = liverankings[0].fecha;
    // Banderinha para asegurarse de que el tenista tuvo ranking en algún momento
    let tuvoRanking = mejorRanking != null;
    // Recorremos todos los liverankings entre el primero y el último
    for(let i=1; i < liverankings.length - 1; i++) {
        const r = await calcularRanking(liverankings[i], ID_tenista);
        if(r != null) tuvoRanking = true; 
        // slice(1) ==> dame todo lo que hay a partir del elemento 1
        const rFecha = liverankings[i].fecha.split('.').slice(1).join('.');
        [mejorRanking, fechaMR] = actualizarMejorRanking(r, rFecha, mejorRanking, fechaMR);
    }
    const rankingAnterior = await calcularRanking(liverankings[liverankings.length - 1], ID_tenista);
    if(rankingAnterior != null) tuvoRanking = true; 
    const raFecha = liverankings[liverankings.length - 1].fecha.split('.').slice(1).join('.');
    [mejorRanking, fechaMR] = actualizarMejorRanking(rankingAnterior, raFecha, mejorRanking, fechaMR);

    // Si nunca tuvo ranking hacemos este apaño
    if(!tuvoRanking) fechaMR = "live";

    return [rankingActual, rankingAnterior, mejorRanking, fechaMR];
}

// Función auxiliar de la anterior
export async function calcularRanking(liveranking, ID_tenista) {
    const torneos = liveranking.torneos;

    // Wizard shit imos traballar cun mapa
    const resultadosPorJugador = new Map();

    // Cargamos los resultados de cada torneo
    const resultadosPorTorneo = await Promise.all(
        torneos.map(ID_torneo => getResultados(ID_torneo))
    );

    for(const resultados of resultadosPorTorneo) {
        for(const { tenista, puntos, puntosPorSets, puntosPorJuegos } of resultados) {
            // Si es la primera vez que un tenista suma resultados, se crea
            if(!resultadosPorJugador.has(tenista)) {
                resultadosPorJugador.set(tenista, 
                    { puntos: 0, puntosPorSets: 0, puntosPorJuegos: 0 });
            }
            const j = resultadosPorJugador.get(tenista);
            j.puntos += puntos;
            j.puntosPorSets += puntosPorSets;
            j.puntosPorJuegos += puntosPorJuegos;
            resultadosPorJugador.set(tenista, j);
        }
    }

    // Una vez hemos sumado los puntos que le corresponden a cada tenista transformamos el mapa en array
    let ranking = Array.from(resultadosPorJugador.entries());
    // ORDENAMOS (quizás axudou o xefe con isto...)
    ranking.sort((aResultados, bResultados) => {
        const a = aResultados[1];
        const b = bResultados[1];

        /**
         * Explicación de la fokin resta: siendo (b − a) la resta, .sort() espera:
         * un número negativo si a debe ir antes de b
         * un número positivo si a debe ir después de b
         * cero si son iguales
         */

        // (1) Por puntos obtenidos (10, 40, 90...)
        if( a.puntos !== b.puntos ) return b.puntos - a.puntos;
        // (2) Por puntos por sets obtenidos
        if( a.puntosPorSets !== b.puntosPorSets ) return b.puntosPorSets - a.puntosPorSets;
        // (3) Por puntos por juegos obtenidos
        return b.puntosPorJuegos - a.puntosPorJuegos;
    });

    // DEBUG
    console.log(ranking);

    // Buscamos el ranking del tenista ahora que está ordenado
    for(let nranking = 0; nranking < ranking.length; nranking++) {
        // Extraemos el nombre de cada tenista y comprobamos si es el que buscamos
        const [nombretenista, puntostenista] = ranking[nranking];
        // Recuerda sumar 1 taraaao que aquí vamos de 0 a N−1
        if(nombretenista === ID_tenista) return nranking +1;
    }

    // Si no se encuentra al tenista (me cago en la puta) digo se devuelve null
    return null;
}

// Función auxiliar de la anterior
function actualizarMejorRanking(r, rFecha, mejorRanking, fechaMR) {
    if(r > mejorRanking) {
        return [ mejorRanking, fechaMR ];
    }
    else if(r == mejorRanking) {
        if (cualFueAntes(rFecha, fechaMR)===rFecha) {
            return [ r, rFecha ];
        }
        else return [ mejorRanking, fechaMR ];
    }
    else return [ r, rFecha ];
}

// Outra función auxiliar cagonodemo
function cualFueAntes(fecha1, fecha2) {
    // Moito ollo que podría entrar una fecha "live"
    if(fecha1 === "live") return fecha2;
    if(fecha2 === "live") return fecha1;

    const [mes1, ano1] = fecha1.split('.').map(Number);
    const [mes2, ano2] = fecha2.split('.').map(Number);

    // Comprobamos el año
    if (ano1 < ano2) return fecha1;
    if (ano1 > ano2) return fecha2;
    // Mismo año, comprobamos el mes
    if (mes1 < mes2) return fecha1;
    if (mes1 > mes2) return fecha2;
}