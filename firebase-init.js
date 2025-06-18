// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, child, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
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

/** OJO: ESTA FUNCIÓN SOPORTA TANTO IDs COMO EL PROPIO OBJETO TENISTA */
export async function getPartidosTenista(ID_o_tenista) {
    let tenista;

    // Si el argumento es un string, es un ID
    if(typeof ID_o_tenista === 'string') {
        const snapshot_tenista = await get(child(ref(db), `tenistas/${ID_o_tenista}`));
        if (!snapshot_tenista.exists()) throw new Error(`No se encontró el jugador: ${ID_o_tenista}`);
        tenista = snapshot_tenista.val();
    }
    else if (typeof ID_o_tenista === 'object' && ID_o_tenista !== null) {
        tenista = ID_o_tenista;
    }
    else {
        throw new Error('Entrada inválida para la función getPartidosTenista.');
    }
    
    // Al final es como todo
    const partidos = Array.isArray(tenista.partidos)
        ? tenista.partidos
        : Object.values(tenista.partidos || {}); // Convierte un objeto tipo {0: "id1" ...} a Array 
    
    // Recorremos la lista de partidos obteniendo cada uno
    //console.log('Partidos del tenista:', partidos); DEBUG
    const snapshot_partidos = await Promise.all(
        partidos.map(async (ID_partido) => {
            const snapshot = await get(child(ref(db), `partidos/${ID_partido}`));
            if (!snapshot.exists()) throw new Error(`No se encontró el partido: ${ID_partido}`);
            return snapshot.val();
        })
    );

    // Filtrar los partidos que no existan y devolver el resto
    return snapshot_partidos.filter(p => p!== null);
}

export async function getTodosLosTenistas() {
    const snapshot = await get(ref(db, 'tenistas'));
    if(!snapshot.exists()) return []; // Si hubiera un error devuelve una lista vacía

    const data = snapshot.val();// Objeto de IDs
    return Object.keys(data);   // Devuelve el listado de IDs
}