import { getPartido, getPartidosTenista, getTenista, getTorneo } from "./firebase-init.js";

export class RawDataStatsTenistaPartido {
    constructor() {
        // Generales
        this.nPuntos = 0;
        this.nPuntosGanados = 0;
        this.nTiebreaksGanados = 0;
        this.warnings = 0;
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
                this.t1.warnings++;
                break;
            case "W2": // W2 -> warning al que resta el punto CORREGIR EN EL JSON
                this.t2.warnings++;
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



// La GOAT de las funciones de esta web
/** Le pasas un json partido y te devuelve el RawData del tenista que empieza sacando y el otro [t1, t2] */
export function getRawData(partido) {
    if (!partido || partido.estado !== "fulldata") {
        throw new Error("El partido no tiene datos completos");
    }

    let rawData_t1 = new RawDataStatsTenistaPartido();
    let rawData_t2 = new RawDataStatsTenistaPartido();

    // (1) Obtenemos el marcador
    const marcadorSet = partido.marcador.trim().split(' ');
    const marcadorSet_limpio = [];
    const marcadorSet_extras = [];

    // Guardar el formato básico de los sets en un sitio y los extras en otro
    marcadorSet.forEach(set => {
        const partes = set.split('(');
        marcadorSet_limpio.push(partes[0]);
        marcadorSet_extras.push(partes[1] ? partes[1].replace(')','') : null);
    });

    // Calcular el número de juegos/tiebreaks que tuvo el partido
    let nJuegos = 0;
    for (let i = 0; i < marcadorSet_limpio.length; i++) {
        const [juegos_t1, juegos_t2] = marcadorSet_limpio[i].split('-').map(Number);
        nJuegos += juegos_t1 + juegos_t2;

        // Ya de paso obtenemos la primera estadística: el número de tiebreaks ganados
        if(juegos_t1 === 7) rawData_t1.nTiebreaksGanados++;
        else if(juegos_t2 === 7) rawData_t2.nTiebreaksGanados++;
    }

    if( nJuegos !== partido.data.length) {
        throw new Error("El número de juegos calculado con el marcador y el número de juegos en el json no coinciden!");
    }

    // Creamos un marcador en directo para saber los breakpoints, setpoints, etc.
    let estado = new EstadoPartido(rawData_t1, rawData_t2, "0-0", "0-0", "0-0");
    
    // Primera stat: +1 a juegos sacando t1 y +1 a juegos restando t2
    estado.sumarJuegosSaqueYResto();

    /**
     * NOTA IMPORTANTE SOBRE TIEBREAKS:
     * -> Empieza sacando el que le toca sacar como si fuera un juego
     * -> Saca 1 vez (desde la derecha) y a partir de ahí 2 veces cada uno (empezando por la izquierda cada vez)
     * -> Se cambia de lado cada 6 puntos
     * -> Después del tiebreak saca el siguiente juego el que restó el primer punto (como si hubiese sido un juego)
     * 
     * AHORA BIEN, en el partido 'pozadebar2025_qf_mateo_sweetelo' aplicamos la norma mal (sacó el q no debía, después lo arreglo)
     */

    // (2) Ahora que sabemos nJuegos recorremos la data de cada juego obteniendo el resto de estadísticas
    for (let i = 0; i < nJuegos; i++) {
        const rawDataJuegoActual = partido.data[i];
        const rawDataPuntos = rawDataJuegoActual.trim().split(' ');

        // A no ser que estemos en un tiebreak tenemos siempre el 'estado' correcto
        if(estado.setActualLive === "6-6") {
            // Es tiebreak !!
            for (let j = 0; j < rawDataPuntos.length; j++) {
                // Excepto el primero (0), cada 2 puntos se hace cambiarSacador();
                if(j%2 !== 0) {
                    estado.cambiarSacador();
                }
                estado.procesarPunto(rawDataPuntos[j]);
            }

            // Ajuste extra para aplicar bien la norma del tiebreak (PENSANDO EN EL INICIO DEL SIGUIENTE SET)
            if ((rawDataPuntos.length - 7) % 4 !== 0) {
                estado.cambiarSacador();
            }
        }
        else {
            rawDataPuntos.forEach(punto => {
                estado.procesarPunto(punto);
            });

            estado.nuevoJuego();
        }
    }

    // Aquí hay que devolverlo de una forma u otra en función del que empieza sacando el partido
    // estado.t1 == rawDataT1 tal...
    if(nJuegos%2 === 0) return [estado.t1, estado.t2];
    else return [estado.t2, estado.t1];
}

export async function getStatsPartido(ID_partido) {
    const p = await getPartido(ID_partido);

    const [rawData_t1, rawData_t2] = getRawData(p);

    console.log(rawData_t1);
    console.log(rawData_t2);

    return [new StatsTenistaPartido(rawData_t1), new StatsTenistaPartido(rawData_t2)];
}