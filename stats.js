import { getPartido, getPartidosTenista, getTenista, getTorneo } from "./firebase-init.js";

export class RawDataStatsTenistaPartido {
    constructor() {
        // Generales
        this.nPuntos = 0;
        this.nPuntosGanados = 0;
        this.nTiebreaksGanados = 0;
        this.nWarnings = 0;
        // Saque
        this.nAces = 0;
        this.nSaques = 0;
        this.nPrimerSaque = 0;
        this.nSegundoSaque = 0;
        this.nDoblesFaltas = 0;
        this.nPG_saque = 0;
        this.nPG_primerSaque = 0;
        this.nPG_segundoSaque = 0;
        this.nJuegosSacando = 0;
        this.nJG_sacando = 0;
        // Resto
        this.nRestos = 0;
        this.nRestosPrimerSaque = 0;
        this.nRestosSegundoSaque = 0;
        this.nPG_restando = 0;
        this.nPG_restandoPrimerSaque = 0;
        this.nPG_restandoSegundoSaque = 0;
        this.nJuegosRestando = 0;
        this.nJG_restando = 0;
        // Breakpoints
        this.nBreakpointsAFavor = 0;
        this.nBreakpointsConvertidos = 0;
        this.nBreakpointsEnContra = 0;
        this.nBreakpointsSalvados = 0;
        // Setpoints
        this.nSetpointsAFavor = 0;
        this.nSetpointsConvertidos = 0;
        this.nSetpointsEnContra = 0;
        this.nSetpointsSalvados = 0;
        // Matchpoints
        this.nMatchpointsAFavor = 0;
        this.nMatchpointsConvertidos = 0;
        this.nMatchpointsEnContra = 0;
        this.nMatchpointsSalvados = 0;
        // Tundas
        this.nDonuts = 0;
        this.nDonutsEnContra = 0;
        this.nJuegosEnBlanco = 0;
        this.nJuegosEnBlancoEnContra = 0;
        // Rachas
        this.mejorRachaPuntosGanados = 0;
        this.rachaPG_abierta = false;
        this.mejorRachaJuegosGanados = 0;
        this.rachaJG_abierta = false;
    }

    juntarCon(otra) {
        if (!(otra instanceof RawDataStatsTenistaPartido)) {
            throw new Error("Error: no es instancia de RawDataStatsTenistaPartido");
        }

        for (const key of Object.keys(this)) {
            if (typeof this[key] === 'number' && typeof otra[key] === 'number') {
                this[key] += otra[key];
            }
            // ignoramos los booleanos o strings si hubiera
        }
    }
}

export class StatsTenistaPartido {
    constructor(rawData) {
        if (!rawData || typeof rawData !== 'object') {
            throw new Error("rawData inválido");
        }

        //Saque
        this.aces = rawData.nAces;
        this.p_primerSaque = rawData.nSaques ? rawData.nPrimerSaque / rawData.nSaques : 0;
        this.p_PG_primerSaque = rawData.nPrimerSaque ? rawData.nPG_primerSaque / rawData.nPrimerSaque : 0;
        this.p_PG_segundoSaque = rawData.nSegundoSaque ? rawData.nPG_segundoSaque / rawData.nSegundoSaque : 0;
        this.doblesFaltas = rawData.nDoblesFaltas;
        this.p_breakpointsSalvados = rawData.nBreakpointsEnContra ? rawData.nBreakpointsSalvados / rawData.nBreakpointsEnContra : 0;
        this.p_JG_sacando = rawData.nJuegosSacando ? rawData.nJG_sacando / rawData.nJuegosSacando : 0;
        // Resto
        this.p_PG_restandoPrimerSaque = rawData.nRestosPrimerSaque ? rawData.nPG_restandoPrimerSaque / rawData.nRestosPrimerSaque : 0;
        this.p_PG_restandoSegundoSaque = rawData.nRestosSegundoSaque ? rawData.nPG_restandoSegundoSaque / rawData.nRestosSegundoSaque : 0;
        this.p_breakpointsConvertidos = rawData.nBreakpointsAFavor ? rawData.nBreakpointsConvertidos / rawData.nBreakpointsAFavor : 0;
        this.p_JG_restando = rawData.nJuegosRestando ? rawData.nJG_restando / rawData.nJuegosRestando : 0;
        // Momentos críticos
        this.tiebreaksGanados = rawData.nTiebreaksGanados;
        this.p_setpointsConvertidos = rawData.nSetpointsAFavor ? rawData.nSetpointsConvertidos / rawData.nSetpointsAFavor : 0;
        this.p_setpointsSalvados = rawData.nSetpointsEnContra ? rawData.nSetpointsSalvados / rawData.nSetpointsEnContra : 0;
        this.p_matchpointsConvertidos = rawData.nMatchpointsAFavor ? rawData.nMatchpointsConvertidos / rawData.nMatchpointsAFavor : 0;
        this.p_matchpointsSalvados = rawData.nMatchpointsEnContra ? rawData.nMatchpointsSalvados / rawData.nMatchpointsEnContra : 0;
        // Tundas
        this.donuts = rawData.nDonuts;
        this.donutsEnContra = rawData.nDonutsEnContra;
        this.juegosEnBlanco = rawData.nJuegosEnBlanco;
        this.juegosEnBlancoEnContra = rawData.nJuegosEnBlancoEnContra;
        // Rachas
        this.mejorRachaPuntosGanados = rawData.mejorRachaPuntosGanados;
        this.rachaPG_abierta = rawData.rachaPG_abierta;
        this.mejorRachaJuegosGanados = rawData.mejorRachaJuegosGanados;
        this.rachaJG_abierta = rawData.rachaJG_abierta;
    }
}

// ----------------------------------- FUNCIONES BOOLEANAS ----------------------------------- //

// TODO TO-DO PAFACER: añadir la lógica de los tiebreaks (tiebreakLive etc)
function esPuntoDeTiebreakPalQueSaca(tiebreakLive) {
    // Formato del marcador del tiebreak: S-R
    // S son los puntos del que empieza sacando el tiebreak
    // R son los puntos del que empieza restando el tiebreak
    const [pt1, pt2] = tiebreakLive.trim().split('-').map(Number);
    if(pt1 > 5 && pt1 > pt2) return true;
    else return false;
}

function esSetGanadoPorElQueSaca(set) {
    const valoresValidos = ["6-0","6-1","6-2","6-3","6-4","7-5","7-6"];
    return valoresValidos.includes(set);
}

function esSetGanadoPorElQueResta(set) {
    const valoresValidos = ["0-6","1-6","2-6","3-6","4-6","5-7","6-7"];
    return valoresValidos.includes(set);
}

function esSetpointPalQueSaca(set) {
    const valoresValidos = ["5-0","5-1","5-2","5-3","5-4","6-5","6-6"];
    return valoresValidos.includes(set);
}

function esSetpointPalQueResta(set) {
    const valoresValidos = ["0-5","1-5","2-5","3-5","4-5","5-6","6-6"];
    return valoresValidos.includes(set);
}

/**Prerrequisitos:
 * -> Es al mejor de 3 sets
 * -> Sabemos que es setpoint
 */
function esMatchpointPalQueSaca(marcadorLive) {
    const setsFulldata = marcadorLive.trim().split(' ');
    const sets = [];
    setsFulldata.forEach(set => sets.push(set.split('(')[0]) );

    //  Ver si el que saca ya ganó uno de los 2 posibles sets
    let gano1set = false;
    if(sets.length > 1 && esSetGanadoPorElQueSaca(sets[0])) {
        gano1set = true;
    }
    if(sets.length > 2 && esSetGanadoPorElQueSaca(sets[1])) {
        gano1set = true;
    }
    
    return gano1set;
}

/**Prerrequisitos:
 * -> Es al mejor de 3 sets
 * -> Sabemos que es setpoint
 */
function esMatchpointPalQueResta(marcadorLive) {
    const setsFulldata = marcadorLive.trim().split(' ');
    const sets = [];
    setsFulldata.forEach(set => sets.push(set.split('(')[0]) );

    //  Ver si el que saca ya ganó uno de los 2 posibles sets
    let gano1set = false;
    if(sets.length > 1 && esSetGanadoPorElQueResta(sets[0])) {
        gano1set = true;
    }
    if(sets.length > 2 && esSetGanadoPorElQueResta(sets[1])) {
        gano1set = true;
    }
    
    return gano1set;
}

/** A lo largo de esta clase el t1 del constructor será el tenista que saca en el juego */
export class EstadoPartido {
    constructor(t1, t2, juegoActualLive, setActualLive, marcadorLive) {
        this.t1 = t1;
        this.t2 = t2;
        this.juegoActualLive = juegoActualLive;
        this.setActualLive = setActualLive;
        this.marcadorLive = marcadorLive;
        this.finalizado = false;
    }

    cambiarSacador() {
        let temp = this.t1;
        this.t1 = this.t2;
        this.t2 = temp;
    }

    // Método para que el marcador siempre esté del lado del que saca
    intercambiarMarcador() {
        const sets = this.marcadorLive.trim().split(' ');

        const marcadorInvertido = [];

        sets.forEach(set => {
            const tieneTiebreak = set.includes('(');
            let marcadorBase, tiebreak;

            if (tieneTiebreak) {
                const [base, extra] = set.split('(');
                marcadorBase = base.trim();
                tiebreak = extra.replace(')', '');
            } else {
                marcadorBase = set;
                tiebreak = null;
            }

            const [a, b] = marcadorBase.split('-').map(Number);
            let nuevoSet = `${b}-${a}`;
            if (tiebreak !== null) {
                nuevoSet += `(${tiebreak})`;
            }

            marcadorInvertido.push(nuevoSet);
        });

        this.marcadorLive = marcadorInvertido.join(' ');
    }

    // ----------------------------------- FUNCIONES BOOLEANAS ----------------------------------- //

    // TODO TO-DO PAFACER: añadir la lógica de los tiebreaks (tiebreakLive etc)
    esPuntoDeTiebreakPalQueSaca() {
         return esPuntoDeTiebreakPalQueSaca(this.tiebreakLive);
    }

    /**Prerrequisitos:
     * -> Es al mejor de 3 sets
     * -> Sabemos que es setpoint
     */
    esMatchpointPalQueSaca() {
        return esMatchpointPalQueSaca(this.marcadorLive);
    }

    /**Prerrequisitos:
     * -> Es al mejor de 3 sets
     * -> Sabemos que es setpoint
     */
    esMatchpointPalQueResta() {
        return esMatchpointPalQueResta(this.marcadorLive);
    }

    // -------------------------------- AÑADIR PUNTOS, SETS, ETC. -------------------------------- //
    
    /** Prerrequisito: el último set del marcador ha finalizado */
    nuevoSet() {
        this.setActualLive = "0-0";
        this.juegoActualLive = "0-0";
        this.marcadorLive += " 0-0";
    }

    // Auxiliar
    sumarJuegosSaqueYResto() {
        this.t1.nJuegosSacando++;
        this.t1.nJuegosRestando++;
    }

    nuevoJuego() {
        this.cambiarSacador();
        this.sumarJuegosSaqueYResto();
    }

    /** Prerrequisito: el marcador completo tiene sentido como partido finalizado + " 0-0" */
    finalizarPartido() {
        // Chapuzinha: como viene de nuevoSet le sobra un " 0-0" a marcadorLive
        // slice(inicio, fin): devuelve una cadena desde 0 hasta fin-4 caracteres
        this.marcadorLive = this.marcadorLive.slice(0, -4);
        this.finalizado = true;
    }

    sumarJuegoAlQueSaca() {
        this.juegoActualLive = "0-0";

        // Actualizar setActualLive
        let [juegosT1, juegosT2] = this.setActualLive.trim().split('-').map(Number);
        juegosT1++;
        this.setActualLive = `${juegosT1}-${juegosT2}`;

        // Actualizar el marcadorLive
        const sets = this.marcadorLive.trim().split(' ');
        sets[sets.length - 1] = this.setActualLive;
        this.marcadorLive = sets.join(' ');
    }

    sumarJuegoAlQueResta() {
        this.juegoActualLive = "0-0";

        // Actualizar setActualLive
        let [juegosT1, juegosT2] = this.setActualLive.trim().split('-').map(Number);
        juegosT2++;
        this.setActualLive = `${juegosT1}-${juegosT2}`;

        // Actualizar el marcadorLive
        const sets = this.marcadorLive.trim().split(' ');
        sets[sets.length - 1] = this.setActualLive;
        this.marcadorLive = sets.join(' ');
    }

    sumarPuntoT1() {
        // Terroristada hacerlo con un switch pero estoy harto
        switch(this.juegoActualLive) {
            case "0-0":
                this.juegoActualLive = "15-0";
                break;
            case "15-0":
                this.juegoActualLive = "30-0";
                break;
            case "30-0":
                this.juegoActualLive = "40-0";
                // Ver si es setpoint o matchpoint a favor
                if(esSetpointPalQueSaca(this.setActualLive))  {
                    this.t1.nSetpointsAFavor++;
                    this.t2.nSetpointsEnContra++;

                    if(this.esMatchpointPalQueSaca()) {
                        this.t1.nMatchpointsAFavor++;
                        this.t2.nMatchpointsEnContra++;
                    }
                }
                break;
            case "40-0":
                // Actualizar stats (juego en blanco)
                this.t1.nJG_sacando++;
                this.t1.juegosEnBlanco++;
                this.t2.juegosEnBlancoEnContra++;
                // Actualizar marcador
                this.sumarJuegoAlQueSaca();
                // Ver si es setpoint o matchpoint a favor
                if(esSetpointPalQueSaca(this.setActualLive))  {
                    this.t1.nSetpointsConvertidos++;
                    this.nuevoSet();

                    if(this.esMatchpointPalQueSaca()) {
                        this.t1.nMatchpointsConvertidos++;
                        this.finalizarPartido();
                    }
                }
                break;
            case "0-15":
                this.juegoActualLive = "15-15";
                break;
            case "15-15":
                this.juegoActualLive = "30-15";
                break;
            case "30-15":
                this.juegoActualLive = "40-15";
                // Ver si es setpoint o matchpoint a favor
                if(esSetpointPalQueSaca(this.setActualLive))  {
                    this.t1.nSetpointsAFavor++;
                    this.t2.nSetpointsEnContra++;

                    if(this.esMatchpointPalQueSaca()) {
                        this.t1.nMatchpointsAFavor++;
                        this.t2.nMatchpointsEnContra++;
                    }
                }
                break;
            case "0-30":
                this.juegoActualLive = "15-30";
                break;
            case "15-30":
                this.juegoActualLive = "30-30";
                break;
            case "30-30":
                this.juegoActualLive = "40-30";
                // Ver si es setpoint o matchpoint a favor
                if(esSetpointPalQueSaca(this.setActualLive))  {
                    this.t1.nSetpointsAFavor++;
                    this.t2.nSetpointsEnContra++;

                    if(this.esMatchpointPalQueSaca()) {
                        this.t1.nMatchpointsAFavor++;
                        this.t2.nMatchpointsEnContra++;
                    }
                }
                break;
            case "0-40":
                this.juegoActualLive = "15-40";
                // Actualizar breakpoints
                this.t1.nBreakpointsSalvados++;
                // Ver si es setpoint o matchpoint en contra
                if(esSetpointPalQueResta(this.setActualLive))  {
                    this.t1.nSetpointsSalvados++;

                    if(this.esMatchpointPalQueResta()) {
                        this.t1.nMatchpointsSalvados++;
                    }
                }
                break;
            case "15-40":
                this.juegoActualLive = "30-40";
                // Actualizar breakpoints
                this.t1.nBreakpointsSalvados++;
                // Ver si es setpoint o matchpoint en contra
                if(esSetpointPalQueResta(this.setActualLive))  {
                    this.t1.nSetpointsSalvados++;

                    if(this.esMatchpointPalQueResta()) {
                        this.t1.nMatchpointsSalvados++;
                    }
                }
                break;
            case "30-40":
            case "40-VEN":
                this.juegoActualLive = "40-40";
                // Actualizar breakpoints
                this.t1.nBreakpointsSalvados++;
                // Ver si es setpoint o matchpoint en contra
                if(esSetpointPalQueResta(this.setActualLive))  {
                    this.t1.nSetpointsSalvados++;

                    if(this.esMatchpointPalQueResta()) {
                        this.t1.nMatchpointsSalvados++;
                    }
                }
                break;
            case "40-40":
                this.juegoActualLive = "VEN-40";
                // Ver si es setpoint o matchpoint a favor
                if(esSetpointPalQueSaca(this.setActualLive))  {
                    this.t1.nSetpointsAFavor++;
                    this.t2.nSetpointsEnContra++;

                    if(this.esMatchpointPalQueSaca()) {
                        this.t1.nMatchpointsAFavor++;
                        this.t2.nMatchpointsEnContra++;
                    }
                }
                break;
            case "40-15":
            case "40-30":
            case "VEN-40":
                // Sumar juego t1
                this.t1.nJG_sacando++;
                // Actualizar marcador
                this.sumarJuegoAlQueSaca();
                // Ver si es setpoint o matchpoint a favor
                if(esSetpointPalQueSaca(this.setActualLive))  {
                    this.t1.nSetpointsConvertidos++;
                    this.nuevoSet();
                    
                    if(this.esMatchpointPalQueSaca()) {
                        this.t1.nMatchpointsConvertidos++;
                        this.finalizarPartido();
                    }
                }
                break;
            default:
                throw new Error("Error de formato en el marcador: " + this.juegoActualLive);
        }
    }

    sumarPuntoT2() {
        // Terroristada hacerlo con un switch pero estoy harto
        switch(this.juegoActualLive) {
            case "0-0":
                this.juegoActualLive = "0-15";
                break;
            case "0-15":
                this.juegoActualLive = "0-30";
                break;
            case "0-30":
                this.juegoActualLive = "0-40";
                // Actualizar breakpoints
                this.t2.nBreakpointsAFavor++;
                this.t1.nBreakpointsEnContra++;
                // Ver si es setpoint o matchpoint a favor
                if(esSetpointPalQueResta(this.setActualLive))  {
                    this.t2.nSetpointsAFavor++;
                    this.t1.nSetpointsEnContra++;

                    if(this.esMatchpointPalQueResta()) {
                        this.t2.nMatchpointsAFavor++;
                        this.t1.nMatchpointsEnContra++;
                    }
                }
                break;
            case "0-40":
                // Actualizar stats (juego en blanco)
                this.t2.nJG_restando++;
                this.t2.juegosEnBlanco++;
                this.t1.juegosEnBlancoEnContra++;
                // Actualizar breakpoints
                this.t2.nBreakpointsConvertidos++;
                // Actualizar marcador
                this.sumarJuegoAlQueResta();
                // Ver si es setpoint o matchpoint a favor
                if(esSetpointPalQueResta(this.setActualLive))  {
                    this.t2.nSetpointsConvertidos++;
                    this.nuevoSet();

                    if(this.esMatchpointPalQueResta()) {
                        this.t2.nMatchpointsConvertidos++;
                        this.finalizarPartido();
                    }
                }
                break;
            case "15-0":
                this.juegoActualLive = "15-15";
                break;
            case "15-15":
                this.juegoActualLive = "15-30";
                break;
            case "15-30":
                this.juegoActualLive = "15-40";
                // Actualizar breakpoints
                this.t2.nBreakpointsAFavor++;
                this.t1.nBreakpointsEnContra++;
                // Ver si es setpoint o matchpoint a favor
                if(esSetpointPalQueResta(this.setActualLive))  {
                    this.t2.nSetpointsAFavor++;
                    this.t1.nSetpointsEnContra++;

                    if(this.esMatchpointPalQueResta()) {
                        this.t2.nMatchpointsAFavor++;
                        this.t1.nMatchpointsEnContra++;
                    }
                }
                break;
            case "15-40":
            case "30-40":
            case "40-VEN":
                // Actualizar stats
                this.t2.nJG_restando++;
                // Actualizar breakpoints
                this.t2.nBreakpointsConvertidos++;
                // Actualizar marcador
                this.sumarJuegoAlQueResta();
                // Ver si es setpoint o matchpoint a favor
                if(esSetpointPalQueResta(this.setActualLive))  {
                    this.t2.nSetpointsConvertidos++;
                    this.nuevoSet();

                    if(this.esMatchpointPalQueResta()) {
                        this.t2.nMatchpointsConvertidos++;
                        this.finalizarPartido();
                    }
                }
                break;
            case "30-0":
                this.juegoActualLive = "30-15";
                break;
            case "30-15":
                this.juegoActualLive = "30-30";
                break;
            case "30-30":
                this.juegoActualLive = "30-40";
                // Actualizar breakpoints
                this.t2.nBreakpointsAFavor++;
                this.t1.nBreakpointsEnContra++;
                // Ver si es setpoint o matchpoint a favor
                if(esSetpointPalQueResta(this.setActualLive))  {
                    this.t2.nSetpointsAFavor++;
                    this.t1.nSetpointsEnContra++;

                    if(this.esMatchpointPalQueResta()) {
                        this.t2.nMatchpointsAFavor++;
                        this.t1.nMatchpointsEnContra++;
                    }
                }
                break;
            case "40-0":
                this.juegoActualLive = "40-15";
                // Ver si es setpoint o matchpoint en contra
                if(esSetpointPalQueSaca(this.setActualLive))  {
                    this.t2.nSetpointsSalvados++;

                    if(this.esMatchpointPalQueSaca()) {
                        this.t2.nMatchpointsSalvados++;
                    }
                }
                break;
            case "40-15":
                this.juegoActualLive = "40-30";
                // Ver si es setpoint o matchpoint en contra
                if(esSetpointPalQueSaca(this.setActualLive))  {
                    this.t2.nSetpointsSalvados++;

                    if(this.esMatchpointPalQueSaca()) {
                        this.t2.nMatchpointsSalvados++;
                    }
                }
                break;
            case "40-30":
            case "VEN-40":
                this.juegoActualLive = "40-40";
                // Ver si es setpoint o matchpoint en contra
                if(esSetpointPalQueSaca(this.setActualLive))  {
                    this.t2.nSetpointsSalvados++;

                    if(esMatchpointPalQueSaca()) {
                        this.t2.nMatchpointsSalvados++;
                    }
                }
                break;
            case "40-40":
                this.juegoActualLive = "40-VEN";
                // Actualizar breakpoints
                this.t2.nBreakpointsAFavor++;
                this.t1.nBreakpointsEnContra++;
                // Ver si es setpoint o matchpoint a favor
                if(esSetpointPalQueResta(this.setActualLive))  {
                    this.t2.nSetpointsAFavor++;
                    this.t1.nSetpointsEnContra++;

                    if(this.esMatchpointPalQueResta()) {
                        this.t2.nMatchpointsAFavor++;
                        this.t1.nMatchpointsEnContra++;
                    }
                }
                break;
            default:
                throw new Error("Error de formato en el marcador: " + this.juegoActualLive);
        }
    }

    //** T1 es el que está sacando dentro del juego, no el T1 del partido (el que empieza sacando) */
    procesarPunto(punto) {
        
        switch(punto) {
            case "1":
                this.sumarPuntoT1();
                
                this.t1.nSaques++;
                this.t1.nPrimerSaque++;
                this.t1.nPuntosGanados++;
                this.t1.nPG_saque++;
                this.t1.nPG_primerSaque++;

                this.t2.nRestos++;
                break;
            case "1A":
                this.sumarPuntoT1();

                this.t1.nAces++;
                //this.t1.nAcesPrimerSaque++;
                this.t1.nSaques++;
                this.t1.nPrimerSaque++;
                this.t1.nPuntosGanados++;
                this.t1.nPG_saque++;
                this.t1.nPG_primerSaque++;

                this.t2.nRestos++;
                break;
            case "1U":
                this.sumarPuntoT1();
                //this.t1.nUnderarms++;
                //this.t1.nPG_conUnderarm++;

                this.t1.nSaques++;
                this.t1.nPrimerSaque++;
                this.t1.nPuntosGanados++;
                this.t1.nPG_saque++;
                this.t1.nPG_primerSaque++;

                this.t2.nRestos++;
                break;
            case "2":
                this.sumarPuntoT1();

                this.t1.nSaques++;
                this.t1.nSegundoSaque++;
                this.t1.nPuntosGanados++;
                this.t1.nPG_saque++;
                this.t1.nPG_segundoSaque++;

                this.t2.nRestos++;
                break;
            case "2A":
                this.sumarPuntoT1();

                this.t1.nAces++;
                //this.t1.nAcesSegundoSaque++;
                this.t1.nSaques++;
                this.t1.nSegundoSaque++;
                this.t1.nPuntosGanados++;
                this.t1.nPG_saque++;
                this.t1.nPG_segundoSaque++;

                this.t2.nRestos++;
                break;
            case "2U":
                this.sumarPuntoT1();
                //this.t1.nUnderarms++;
                //this.t1.nPG_conUnderarm++;

                this.t1.nSaques++;
                this.t1.nSegundoSaque++;
                this.t1.nPuntosGanados++;
                this.t1.nPG_saque++;
                this.t1.nPG_segundoSaque++;

                this.t2.nRestos++;
                break;
            case "3":
                this.sumarPuntoT2();

                this.t1.nSaques++;
                this.t1.nDoblesFaltas++;

                this.t2.nRestos++;
                this.t2.nPG_restando++;
                break;
            case "1P":
                this.sumarPuntoT2();

                this.t1.nSaques++;
                this.t1.nPrimerSaque++;

                this.t2.nRestos++;
                this.t2.nPuntosGanados++;
                this.t2.nPG_restando++;
                this.t2.nPG_restandoPrimerSaque++;
                break;
            case "2P":
                this.sumarPuntoT2();
                
                this.t1.nSaques++;
                this.t1.nSegundoSaque++;

                this.t2.nRestos++;
                this.t2.nPuntosGanados++;
                this.t2.nPG_restando++;
                this.t2.nPG_restandoSegundoSaque++;
                break;
            case "1PU":
                this.sumarPuntoT2();
                //this.t1.nUnderarms++;

                this.t1.nSaques++;
                this.t1.nPrimerSaque++;

                this.t2.nRestos++;
                this.t2.nPuntosGanados++;
                this.t2.nPG_restando++;
                this.t2.nPG_restandoPrimerSaque++;
                break;
            case "2PU":
                this.sumarPuntoT2();
                //this.t1.nUnderarms++;
                
                this.t1.nSaques++;
                this.t1.nSegundoSaque++;

                this.t2.nRestos++;
                this.t2.nPuntosGanados++;
                this.t2.nPG_restando++;
                this.t2.nPG_restandoSegundoSaque++;
                break;
            
            // TODO TO-DO: perfilar estas bullshits
            case "W1": // W1 -> warning al que saca el punto CORREGIR EN EL JSON
                this.t1.nWarnings++;
                break;
            case "W2": // W2 -> warning al que resta el punto CORREGIR EN EL JSON
                this.t2.nWarnings++;
                break;
            case "RET1": // RET1 -> se retira el que saca el punto CORREGIR EN EL JSON
                this.finalizarPartido();
                break;
            case "RET2": // RET2 -> se retira el que resta el punto CORREGIR EN EL JSON
                this.finalizarPartido();
                break;
            default:
                throw new Error("Error de formato en el siguiente punto: " + punto);
        }
    }
}

// La GOAT de las funciones de esta web (Versión 2)
/** Le pasas un json partido y te devuelve el RawData del tenista que empieza sacando y el otro: [t1, t2] */
export function getRawData(partido) {
    if (!partido || partido.estado !== "fulldata") {
        throw new Error("El partido no tiene datos completos");
    }
    
    let rawData_t1 = new RawDataStatsTenistaPartido();
    let rawData_t2 = new RawDataStatsTenistaPartido();

    // Ver si el que empezó sacando es el que ganó el partido
    let ganoT1 = false;
    if (partido.tenista1 == partido.ganador) ganoT1 = true;

    // (1) Obtenemos el marcador
    const marcadorSets = partido.marcador.trim().split(' ');
    const marcadorSets_limpio = [];
    const marcadorSets_extras = [];
    // Guardar el formato básico de los sets en un sitio y los extras en otro
    marcadorSets.forEach(set => {
        const partes = set.split('(');
        marcadorSets_limpio.push(partes[0]);
        marcadorSets_extras.push(partes[1] ? partes[1].replace(')','') : null);
    });

    // Calcular el número de juegos/tiebreaks que tuvo el partido
    let nJuegos = 0;
    let indicesTiebreak = []; // Índices de los juegos que son tiebreaks (si los hay)
    for (let i = 0; i < marcadorSets_limpio.length; i++) {
        const [juegosGanador, juegosPerdedor] = marcadorSets_limpio[i].split('-').map(Number);

        // Ordenamos en función de quién ganó el partido (el marcador está en función de esa persona)
        let juegosT1, juegosT2;
        if(partido.ganador === partido.tenista1) {
            juegosT1 = juegosGanador;
            juegosT2 = juegosPerdedor;
        }
        else {
            juegosT2 = juegosGanador;
            juegosT1 = juegosPerdedor;
        }

        // Stats que se obtienen con el marcador:
        // Donuts
        if(juegosT1===6 && juegosT2===0) {
            rawData_t1.nDonuts++;
            rawData_t2.nDonutsEnContra++;
        }
        else if(juegosT1===0 && juegosT2===6) {
            rawData_t1.nDonutsEnContra++;
            rawData_t2.nDonuts++;
        }
        // Tiebreaks
        if(juegosT1 === 7 && juegosT2===6) {
            rawData_t1.nTiebreaksGanados++;
            indicesTiebreak.push(nJuegos + 12);
        }
        else if(juegosT1 === 6 && juegosT2===7) {
            rawData_t2.nTiebreaksGanados++;
            indicesTiebreak.push(nJuegos + 12);
        }

        // Actualizamos el número de juegos
        nJuegos += juegosGanador + juegosPerdedor;
    }

    if( nJuegos !== partido.data.length) {
        if(partido.retirada === false) {
            throw new Error("El número de juegos del marcador y del json no coinciden!");
        }
        else {
            nJuegos++; // Debió empezarse un set que no dio tiempo a acabar
        }
    }

    // Variables auxiliares pa contar las veces que sale cada tipopunto o mensaje
    // Básicas
    let n1 = 0;
    let n2 = 0;
    let n3 = 0;
    let n1P = 0;
    let n2P = 0;
    let n1A = 0;
    let n2A = 0;
    // Underarms (DE MOMENTO NO SE TIENEN EN CUENTA!)
    let n1U = 0;
    let n2U = 0;
    let n1PU = 0;
    let n2PU = 0;
    // Mensajes
    let nWarningsT1 = 0;
    let nWarningsT2 = 0;
    let RET1 = false;
    let RET2 = false;
    /** 
     * Detallito sobre el .match() pal futuro. Ejemplo; .match(/\bTAL\b/g)
     * -> lo que va entre // es lo que queremos buscar
     * -> la g después de // indica 'global', es decir, que se busquen todas
     * -> los delimitadores \b\b aseguran que no haya letras o números justo antes o después
     */
    let dataJuego;
    function contarVeces(codificacionPunto) {
        const regex = new RegExp(`\\b${codificacionPunto}\\b`, 'g');
        return (dataJuego.match(regex) || []).length;
    }

    // (2) Procesar la info de los juegos en los que saca T1 (los tiebreaks van a parte)
    for(let sacaT1 = 0; sacaT1 < nJuegos; sacaT1+=2) {
        // Saltar los tiebreaks
        if(indicesTiebreak.includes(sacaT1)) continue;

        dataJuego = partido.data[sacaT1];

        // NOTA: DE MOMENTO NO TENEMOS EN CUENTA LOS UNDERARMS !!!!!!!!!!!!!!!
        // (2.A) Contar cada tipopunto/mensaje
        // 1 ---> puntos ganados con primer saque
        n1 = contarVeces("1") + contarVeces("1U");
        // 2 ---> puntos ganados con segundo saque
        n2 = contarVeces("2") + contarVeces("2U");
        // 3 ---> dobles faltas
        n3 = contarVeces("3");
        // 1A ---> puntos ganados con ace en primer saque
        n1A = contarVeces("1A") + contarVeces("1AU");
        // 2A ---> puntos ganados con ace en segundo saque
        n2A = contarVeces("2A") + contarVeces("2AU");
        // 1P ---> puntos perdidos con primer saque
        n1P = contarVeces("1P") + contarVeces("1PU");
        // 2P ---> puntos perdidos con segundo saque
        n2P = contarVeces("2P") + contarVeces("2PU");

        // Warnings
        nWarningsT1 = contarVeces("W1");
        nWarningsT2 = contarVeces("W2");

        // (2.B) Transformar las veces que sale cada tipopunto a rawData
        rawData_t1.nWarnings += nWarningsT1;
        rawData_t2.nWarnings += nWarningsT2;
        // SAQUES (T1)
        rawData_t1.nAces += n1A + n2A;
        rawData_t1.nPrimerSaque += n1 + n1A + n1P;
        rawData_t1.nSegundoSaque += n2 + n2A + n2P;
        rawData_t1.nSaques += (n1 + n1A + n1P) + (n2 + n2A + n2P) + n3;
        rawData_t1.nDoblesFaltas += n3;
        rawData_t1.nPG_primerSaque += n1 + n1A;
        rawData_t1.nPG_segundoSaque += n2 + n2A;
        rawData_t1.nPG_saque += n1 + n1A + n2 + n2A;
        rawData_t1.nJuegosSacando++;
        // RESTOS (T2)
        rawData_t2.nRestos += (n1 + n1A + n1P) + (n2 + n2A + n2P);
        rawData_t2.nRestosPrimerSaque += n1 + n1A + n1P;
        rawData_t2.nRestosSegundoSaque += n2 + n2A + n2P;
        rawData_t2.nPG_restando += n1P + n2P + n3;
        rawData_t2.nPG_restandoPrimerSaque += n1P;
        rawData_t2.nPG_restandoSegundoSaque += n2P;
        rawData_t2.nJuegosRestando++;

        // (2.C) Quién ganó el juego y si fue juego en blanco
        // TODO TO-DO PAFACER: gestionar RET1 RET2

        // Ver de qué tipo es el último punto para saber quién ganó el juego
        const nPuntosJuego = dataJuego.trim().split(" ").length;

        // *
        // 100% tengo que quitar el W1 W2 y meter PPR PPS pa chekear juegos en blanco fácil
        const puntosJuegoSinWarnings = dataJuego.trim().split(" ").filter(p => p !== "W1" && p !== "W2");
        const esJuegoEnBlanco = puntosJuegoSinWarnings.length === 4 ? true : false;
        // *

        let ultimoPuntoJuego = puntosJuegoSinWarnings[nPuntosJuego - 1];

        if(["1", "2", "1A", "2A", "1U", "2U", "PPR"].includes(ultimoPuntoJuego)) {
            rawData_t1.nJG_sacando++;
            if(esJuegoEnBlanco) {
                rawData_t1.nJuegosEnBlanco++;
                rawData_t2.nJuegosEnBlancoEnContra++;
            }
        }
        else if(["1P", "2P", "3", "1PU", "2PU", "PPS"].includes(ultimoPuntoJuego)) {
            rawData_t2.nJG_restando++;
            if(esJuegoEnBlanco) {
                rawData_t2.nJuegosEnBlanco++;
                rawData_t1.nJuegosEnBlancoEnContra++;
            }
        }

        let pts_t1 = 0;
        let pts_t2 = 0;
        // (2.D.) Breakpoints, Setpoints, Matchpoints
        for(const punto of puntosJuegoSinWarnings) {
            // Obtenemos los booleanos que necesitamos
            const esPuntoGanadoPalQueSaca = ["1", "2", "1A", "2A", "1U", "2U", "PPR"].includes(punto);
            const esPuntoGanadoPalQueResta = ["1P", "2P", "3", "1PU", "2PU", "PPS"].includes(punto);
            const esBreakPoint = (pts_t1 < pts_t2 && pts_t2 >= 3);

            if(esBreakPoint) {
                rawData_t1.nBreakpointsEnContra++;
                rawData_t2.nBreakpointsAFavor++;
                console.log("rawData_t1.nBreakpointsEnContra: " + rawData_t1.nBreakpointsEnContra);
                console.log("rawData_t2.nBreakpointsAFavor: " + rawData_t2.nBreakpointsAFavor);
            }

            if(esPuntoGanadoPalQueSaca) {
                if(esBreakPoint) {
                    rawData_t1.nBreakpointsSalvados++;
                    console.log("rawData_t1.nBreakpointsSalvados: " + rawData_t1.nBreakpointsSalvados);
                    // AÑADIR LÓGICA PARA SETPOINTS Y MATCHPOINTS
                }
                pts_t1++;
            }
            else if(esPuntoGanadoPalQueResta) {
                if(esBreakPoint) {
                    rawData_t2.nBreakpointsConvertidos++;
                    console.log("rawData_t2.nBreakpointsConvertidos: " + rawData_t2.nBreakpointsConvertidos);
                    // AÑADIR LÓGICA PARA SETPOINTS Y MATCHPOINTS
                }
                pts_t2++;
            }
        }
    }

    // (3) Procesar la info de los juegos en los que saca T2 (los tiebreaks van a parte)
    for(let sacaT2 = 1; sacaT2 < nJuegos; sacaT2+=2) {
        // Saltar los tiebreaks
        if(indicesTiebreak.includes(sacaT2)) continue;

        dataJuego = partido.data[sacaT2];

        // (3.A) Contar cada tipopunto/mensaje
        // TODO TO-DO PAFACER: CREAR UNA FUNCIÓN CONTARVECES(PUNTO) PA MODULARIZAR N SHIT
        // 1 ---> puntos ganados con primer saque
        n1 = contarVeces("1") + contarVeces("1U");
        // 2 ---> puntos ganados con segundo saque
        n2 = contarVeces("2") + contarVeces("2U");
        // 3 ---> dobles faltas
        n3 = contarVeces("3");
        // 1A ---> puntos ganados con ace en primer saque
        n1A = contarVeces("1A");
        // 2A ---> puntos ganados con ace en segundo saque
        n2A = contarVeces("2A");
        // 1P ---> puntos perdidos con primer saque
        n1P = contarVeces("1P") + contarVeces("1PU");
        // 2P ---> puntos perdidos con segundo saque
        n2P = contarVeces("2P") + contarVeces("2PU");

        // Warnings T2
        nWarningsT1 = contarVeces("W1");
        nWarningsT2 = contarVeces("W2");

        // (3.B) Transformar las veces que sale cada tipopunto a rawData
        rawData_t1.nWarnings += nWarningsT1;
        rawData_t2.nWarnings += nWarningsT2;
        // SAQUES (T1)
        rawData_t2.nAces += n1A + n2A;
        rawData_t2.nPrimerSaque += n1 + n1A + n1P;
        rawData_t2.nSegundoSaque += n2 + n2A + n2P;
        rawData_t2.nSaques += (n1 + n1A + n1P) + (n2 + n2A + n2P) + n3;
        rawData_t2.nDoblesFaltas += n3;
        rawData_t2.nPG_primerSaque += n1 + n1A;
        rawData_t2.nPG_segundoSaque += n2 + n2A;
        rawData_t2.nPG_saque += n1 + n1A + n2 + n2A;
        rawData_t2.nJuegosSacando++;
        // RESTOS (T2)
        rawData_t1.nRestos += (n1 + n1A + n1P) + (n2 + n2A + n2P);
        rawData_t1.nRestosPrimerSaque += n1 + n1A + n1P;
        rawData_t1.nRestosSegundoSaque += n2 + n2A + n2P;
        rawData_t1.nPG_restando += n1P + n2P + n3;
        rawData_t1.nPG_restandoPrimerSaque += n1P;
        rawData_t1.nPG_restandoSegundoSaque += n2P;
        rawData_t1.nJuegosRestando++;

        // (3.C) Quién ganó el juego y si fue juego en blanco

        // TODO TO-DO PAFACER: gestionar RET1 RET2

        // Ver de qué tipo es el último punto para saber quién ganó el juego
        const nPuntosJuego = dataJuego.trim().split(" ").length;

        // *
        // 100% tengo que quitar el W1 W2 y meter PPR PPS pa chekear juegos en blanco fácil
        const puntosJuegoSinWarnings = dataJuego.trim().split(" ").filter(p => p !== "W1" && p !== "W2");
        const esJuegoEnBlanco = puntosJuegoSinWarnings.length === 4 ? true : false;
        // *

        let ultimoPuntoJuego = puntosJuegoSinWarnings[nPuntosJuego - 1];

        if(["1", "2", "1A", "2A", "1U", "2U", "PPR"].includes(ultimoPuntoJuego)) {
            rawData_t2.nJG_sacando++;
            if(esJuegoEnBlanco) {
                rawData_t2.nJuegosEnBlanco++;
                rawData_t1.nJuegosEnBlancoEnContra++;
            }
        }
        else if(["1P", "2P", "3", "1PU", "2PU", "PPS"].includes(ultimoPuntoJuego)) {
            rawData_t1.nJG_restando++;
            if(esJuegoEnBlanco) {
                rawData_t1.nJuegosEnBlanco++;
                rawData_t2.nJuegosEnBlancoEnContra++;
            }
        }

        let pts_t1 = 0;
        let pts_t2 = 0;
        // (3.D.) Breakpoints, Setpoints, Matchpoints
        for(const punto of puntosJuegoSinWarnings) {
            // Obtenemos los booleanos que necesitamos
            const esPuntoGanadoPalQueSaca = ["1", "2", "1A", "2A", "1U", "2U", "PPR"].includes(punto);
            const esPuntoGanadoPalQueResta = ["1P", "2P", "3", "1PU", "2PU", "PPS"].includes(punto);
            const esBreakPoint = (pts_t2 < pts_t1 && pts_t1 >= 3);

            // Comprobar si es breakpoint
            if(esBreakPoint) {
                rawData_t2.nBreakpointsEnContra++;
                rawData_t1.nBreakpointsAFavor++;
            }

            if(esPuntoGanadoPalQueSaca) {
                if(esBreakPoint) {
                    rawData_t2.nBreakpointsSalvados++;
                    // AÑADIR LÓGICA PARA SETPOINTS Y MATCHPOINTS
                }
                pts_t2++;
            }
            else if(esPuntoGanadoPalQueResta) {
                if(esBreakPoint) {
                    rawData_t1.nBreakpointsConvertidos++;
                    // AÑADIR LÓGICA PARA SETPOINTS Y MATCHPOINTS
                }
                pts_t1++;
            }
        }
    }

    // (4) Procesar la info de los tiebreaks (se viene terroristada)
    for(const indice of indicesTiebreak) {
        const dataTiebreak = partido.data[indice];
        const puntosTiebreak = dataTiebreak.trim().split(" "); // Pasamos el string a array

        // (4.A) Separar los puntos en los que sacó cada uno
        const puntosTiebreakSacaT1 = [puntosTiebreak[0]];
        const puntosTiebreakSacaT2 = [];
        let sacaT1 = true;
        // Supusimos que empieza sacando t1, corregimos si no es cierto
        if( indice % 2 !== 0 ) {
            sacaT1 = false;
            puntosTiebreakSacaT1.pop();
            puntosTiebreakSacaT2.push(puntosTiebreak[0]);
        }
        // Vamos añadiendo 2 puntos a cada uno (el primero ya se procesó)
        let esSegundoPuntoSacando = false;
        sacaT1 = !sacaT1; // Cambiamos el tenista que saca después del primer punto :P
        for (let i = 1; i < puntosTiebreak.length; i++) {
            if (sacaT1) puntosTiebreakSacaT1.push(puntosTiebreak[i]);
            else puntosTiebreakSacaT2.push(puntosTiebreak[i]);
            // Actualizamos quién tiene el turno ahora
            if(esSegundoPuntoSacando) {
                sacaT1 = !sacaT1;
            }
            esSegundoPuntoSacando = !esSegundoPuntoSacando;
        }

        // (4.B) Contar cada tipopunto/mensaje de T1 ------------------------------------------- //
        dataJuego = puntosTiebreakSacaT1.join(" ");
        console.log(dataJuego);
        // TODO TO-DO PAFACER: CREAR UNA FUNCIÓN CONTARVECES(PUNTO) PA MODULARIZAR N SHIT
        // 1 ---> puntos ganados con primer saque
        n1 = contarVeces("1") + contarVeces("1U");
        // 2 ---> puntos ganados con segundo saque
        n2 = contarVeces("2") + contarVeces("2U");
        // 3 ---> dobles faltas
        n3 = contarVeces("3");
        // 1A ---> puntos ganados con ace en primer saque
        n1A = contarVeces("1A") + contarVeces("1AU");
        // 2A ---> puntos ganados con ace en segundo saque
        n2A = contarVeces("2A") + contarVeces("2AU");
        // 1P ---> puntos perdidos con primer saque
        n1P = contarVeces("1P") + contarVeces("1PU");
        // 2P ---> puntos perdidos con segundo saque
        n2P = contarVeces("2P") + contarVeces("2PU");

        // Warnings
        nWarningsT1 = contarVeces("W1");
        nWarningsT2 = contarVeces("W2");

        // Transformar las veces que sale cada tipopunto a rawData
        rawData_t1.nWarnings += nWarningsT1;
        rawData_t2.nWarnings += nWarningsT2;
        // SAQUES (T1)
        rawData_t1.nAces += n1A + n2A;
        rawData_t1.nPrimerSaque += n1 + n1A + n1P;
        rawData_t1.nSegundoSaque += n2 + n2A + n2P;
        rawData_t1.nSaques += (n1 + n1A + n1P) + (n2 + n2A + n2P) + n3;
        rawData_t1.nDoblesFaltas += n3;
        rawData_t1.nPG_primerSaque += n1 + n1A;
        rawData_t1.nPG_segundoSaque += n2 + n2A;
        rawData_t1.nPG_saque += n1 + n1A + n2 + n2A;
        // RESTOS (T2)
        rawData_t2.nRestos += (n1 + n1A + n1P) + (n2 + n2A + n2P);
        rawData_t2.nRestosPrimerSaque += n1 + n1A + n1P;
        rawData_t2.nRestosSegundoSaque += n2 + n2A + n2P;
        rawData_t2.nPG_restando += n1P + n2P + n3;
        rawData_t2.nPG_restandoPrimerSaque += n1P;
        rawData_t2.nPG_restandoSegundoSaque += n2P;

        // (4.C) Contar cada tipopunto/mensaje de T2 ------------------------------------------- //
        dataJuego = puntosTiebreakSacaT2.join(" ");
        console.log(dataJuego);
        // TODO TO-DO PAFACER: CREAR UNA FUNCIÓN CONTARVECES(PUNTO) PA MODULARIZAR N SHIT
        // 1 ---> puntos ganados con primer saque
        n1 = contarVeces("1") + contarVeces("1U");
        // 2 ---> puntos ganados con segundo saque
        n2 = contarVeces("2") + contarVeces("2U");
        // 3 ---> dobles faltas
        n3 = contarVeces("3");
        // 1A ---> puntos ganados con ace en primer saque
        n1A = contarVeces("1A");
        // 2A ---> puntos ganados con ace en segundo saque
        n2A = contarVeces("2A");
        // 1P ---> puntos perdidos con primer saque
        n1P = contarVeces("1P") + contarVeces("1PU");
        // 2P ---> puntos perdidos con segundo saque
        n2P = contarVeces("2P") + contarVeces("2PU");

        // Warnings T2
        nWarningsT1 = contarVeces("W1");
        nWarningsT2 = contarVeces("W2");

        // Transformar las veces que sale cada tipopunto a rawData
        rawData_t1.nWarnings += nWarningsT1;
        rawData_t2.nWarnings += nWarningsT2;
        // SAQUES (T1)
        rawData_t2.nAces += n1A + n2A;
        rawData_t2.nPrimerSaque += n1 + n1A + n1P;
        rawData_t2.nSegundoSaque += n2 + n2A + n2P;
        rawData_t2.nSaques += (n1 + n1A + n1P) + (n2 + n2A + n2P) + n3;
        rawData_t2.nDoblesFaltas += n3;
        rawData_t2.nPG_primerSaque += n1 + n1A;
        rawData_t2.nPG_segundoSaque += n2 + n2A;
        rawData_t2.nPG_saque += n1 + n1A + n2 + n2A;
        // RESTOS (T2)
        rawData_t1.nRestos += (n1 + n1A + n1P) + (n2 + n2A + n2P);
        rawData_t1.nRestosPrimerSaque += n1 + n1A + n1P;
        rawData_t1.nRestosSegundoSaque += n2 + n2A + n2P;
        rawData_t1.nPG_restando += n1P + n2P + n3;
        rawData_t1.nPG_restandoPrimerSaque += n1P;
        rawData_t1.nPG_restandoSegundoSaque += n2P;

    }

    return [rawData_t1, rawData_t2];
}

export async function getStatsPartido(ID_partido) {
    const p = await getPartido(ID_partido);

    const [rawData_t1, rawData_t2] = getRawData(p);

    console.log(rawData_t1);
    console.log(rawData_t2);

    return [new StatsTenistaPartido(rawData_t1), new StatsTenistaPartido(rawData_t2)];
}