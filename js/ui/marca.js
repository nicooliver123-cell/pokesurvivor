/* ============ marca.js — identidad «Dex de Expedición» (MOD nico) ============
 * G.MARCA: las MISMAS cifras que css/tokens-dex.css, para lo que se dibuja en el lienzo
 * (HUD, flechas, avisos, mundo). Sólo datos y dos ayudantes puros: no dibuja nada ni toca el
 * juego. tools/nico/check.js comprueba que las cifras compartidas coinciden con el CSS.
 * Guía de marca del 12-10-2026 con las correcciones de la revisión cruzada: los ajustes de
 * comportamiento (el horno, el iris, el golpe final y la tabla de Calidad) irán en
 * js/core/mods.js, no aquí.
 *
 * Se carga justo después de js/core/mods.js (dev.html). Lo consumen js/ui/estilo.js y, en los
 * lotes siguientes, el HUD Dex y los entornos.
 *
 * Unidades:
 *   - HUD de escritorio: «u» = px CSS a escala 1. Se multiplican por escalaHUD(w, h) (1 a 1,25,
 *     tope que pidió Nico: «a veces creo que ocupa demasiado») y se redondean a px enteros.
 *   - HUD compacto (alto < 520 px CSS): px CSS tal cual, sin escala (filas adaptables al alto, como
 *     mucho un 20 % del alto entre las dos; también por Nico).
 *   - Mundo: px de mundo (G.Sprites.PX = 2 px de mundo por píxel de arte).
 */
window.G = window.G || {};
G.MARCA = (() => {
  /* ------------------------------------------------------------------ color */
  const color = {
    // Carcasa de la Pokédex: sólo lengüetas, logo, N.º del jefe y acción principal.
    rojo: '#D7263D', rojoPulsado: '#BE1D33', rojoOscuro: '#8C1328', rojoBorde: '#5A0B19',
    // Pantallas de cristal (interfaz).
    fondo: '#050E12', cristal: '#0F2630', cristal2: '#173640', cristal3: '#1E4450',
    cristalHUD: 'rgba(15,38,48,0.92)',              // paneles del lienzo, sobre el mundo
    trazoExterior: 'rgba(2,8,11,0.75)', trazoInterior: 'rgba(59,100,112,0.95)',
    bisel: '#3B6470',                               // borde decorativo de paneles
    bordeControl: '#5A8A96',                        // borde de botones y campos (≥3:1)
    pantalla: '#62E3DD',                            // sensor: foco, selección, Rotom
    tinta: '#EEF6F7', tinta2: '#A9C3C9', tintaOscura: '#0B1A20',
    lente: '#2F7FE0', lenteOscura: '#1B4FA0', lenteClara: '#5AA8FF', lenteBrillo: '#CFE8FF', aroLente: '#F4F8FA',
    // Datos de los juegos.
    psAlto: '#58D873', psMedio: '#FFCB3D', psBajo: '#F2493B', psBajoDestello: '#FF8A80',
    exp: '#3DB5F0',
    rival: '#9B6BFF',                               // PS del jefe y del legendario: NUNCA verde/amarillo/rojo
    rivalEstela: 'rgba(226,208,255,0.7)',
    carril: 'rgba(2,8,11,0.6)',                     // fondo de toda barra
    // Semántica.
    oro: '#FFCB3D',                                 // tú (tanda 1), evolución, objeto
    grieta: '#B48AFF', grietaMedio: '#A06BFF', grietaClaro: '#E2D0FF', grietaOscuro: '#1A0B33',
    grietaFondo: 'rgba(26,11,51,0.94)', grietaTitulo: '#F1E8FF', grietaTexto: '#D9C8FF',
    vinculo: '#FF8AD8',
    peligro: '#FF2440',                             // contorno de lo hostil (tanda 1): no usar en la interfaz
    peligroTexto: '#FF8A80',                        // texto de «Caído», errores
    escudo: '#9FD8FF', superEficaz: '#FFE14D',      // números (tanda 1)
    perdido: '#7DFFB0',                             // flecha del Pokémon perdido (evento)
    contorno: 'rgba(4,12,16,0.9)',                  // contorno del texto suelto sobre el mundo
    // Cooperativo: colores de jugador de js/net/coop.js (no cambian) y aro de compañero (tanda 1).
    jugadores: ['#FFCB3D', '#5FC8FF', '#7EE07A', '#FF8AD8'], aroCompanero: '#CFE8FF'
  };

  /* --------------------------------------------- tipos (datos: G.U.TYPE_COLOR) */
  // Fondo de píldora y tinta ya resueltos para ≥4,5:1 (texto 11-13 px, peso 800).
  // Sólo Fantasma necesita oscurecerse (#7A6BC4 da 4,44:1 con blanco → #7164B6, 5,0:1).
  const tipoPildora = {
    normal: ['#B0A99F', '#0B1A20'], fire: ['#FF7B3D', '#0B1A20'], water: ['#4B9BFF', '#0B1A20'],
    grass: ['#5FCB6A', '#0B1A20'], electric: ['#FFD33D', '#0B1A20'], ice: ['#7FE0E0', '#0B1A20'],
    fighting: ['#E0533D', '#0B1A20'], poison: ['#B45EC4', '#0B1A20'], ground: ['#D6B25C', '#0B1A20'],
    flying: ['#9BB8FF', '#0B1A20'], psychic: ['#FF5F9E', '#0B1A20'], bug: ['#A3C43D', '#0B1A20'],
    rock: ['#BFA96B', '#0B1A20'], ghost: ['#7164B6', '#FFFFFF'], dragon: ['#6B58FF', '#FFFFFF'],
    dark: ['#6B5C52', '#FFFFFF'], steel: ['#A8B8C4', '#0B1A20'], fairy: ['#FF9ED8', '#0B1A20']
  };
  // Tipos cuya franja/borde no llega a 3:1 contra el cristal: llevan filo claro de 1 px.
  const tipoConFilo = ['ghost', 'dragon', 'dark'];
  const filoTipo = 'rgba(238,246,247,0.35)';

  /* ------------------------------------------------------------ tipografía */
  const familia = '"M PLUS Rounded 1c","Segoe UI",system-ui,sans-serif';
  const familiaLogo = '"Pixelify","M PLUS Rounded 1c",sans-serif';   // sólo el logotipo
  const peso = { normal: 500, fuerte: 800 };       // los dos únicos pesos
  // Escala única, razón ≈1,2: 11 · 13 · 16 · 18 · 22 · 28 · 40.
  // HUD del lienzo: 11/13/16/18/28 (×escala). DOM: 13/16/18/22/28/40 (16 = cuerpo).
  const escalaTipo = { xs: 11, sm: 13, md: 16, lg: 18, xl: 22, x2: 28, x3: 40 };
  /** '800 13px "M PLUS Rounded 1c",…' con el tamaño redondeado a px entero. */
  const fuente = (w, px) => `${w >= 650 ? 800 : 500} ${Math.round(px)}px ${familia}`;

  /* -------------------------------------------------- espacio, radio, tiempo */
  const espacio = [0, 4, 8, 12, 16, 24, 32, 48];   // --space-0 … --space-7
  const radio = { r0: 4, r1: 6, r2: 10, r3: 14, pildora: 999 };
  const tiempo = {
    micro: 150, entrada: 180, salidaAviso: 400, avisoMin: 1600, avisoMax: 3000,
    pildoraVisible: 1500,                           // nombre del ataque en compacto
    destelloPSBajo: 750,                            // periodo del parpadeo ≤20 % PS
    estelaEspera: 400, estelaCae: 500               // barra del jefe
  };

  /* --------------------------------------------------------------- HUD */
  /** Escala del HUD de escritorio: 1 hasta 1152×720 y 1,25 desde 1440×900 (la guía llegaba a 1,5 en
   *  1728×1080; Nico pidió un HUD más compacto, revisión cruzada: tope de 1,25). */
  const ESCALA_HUD_MAX = 1.25;
  const escalaHUD = (w, h) => Math.max(1, Math.min(ESCALA_HUD_MAX, w / 1152, h / 720));
  const ALTO_COMPACTO = 520;                        // alto CSS por debajo del cual va el HUD compacto

  const hud = {
    textoContorno: { sm: 3, lg: 4 },                // px ×escala: <18 px usa 3, ≥18 px usa 4
    // ---------- escritorio (u; ×escalaHUD) ----------
    escritorio: {
      margen: 12, separacion: 8,
      ficha: {
        carcasa: { x: 0, y: 0, w: 60, h: 60, r: [14, 6, 6, 14], base: { x: 4, y: 54, w: 50, h: 3 } },
        lente: { cx: 29, cy: 29, r: 21, aro: 0.13 },             // aro = r×0,13 (mín. 2 px)
        pantalla: { x: 52, y: 3, w: 236, h: 54, r: 10 },          // relativo a la carcasa
        texto: { izq: 20, der: 230 },                              // relativo a la pantalla
        nombre: { tam: 16, base: 19 }, nivelEtiqueta: { tam: 11 }, nivel: { tam: 16, base: 19 },
        ps: { etiqueta: { tam: 11, base: 34 }, barra: { x: 40, y: 27, h: 8 }, cifras: { tam: 13, base: 35 }, hueco: 10 },
        exp: { x: 20, y: 45, w: 210, h: 3 }
      },
      chips: { y: 68, h: 20, tam: 11, punto: 3.5, padding: 11, separacion: 5, fila: 26, anchoMax: 288 },
      contador: { w: 168, h: 60, reloj: { tam: 28, base: 31 }, datos: { tam: 13, base: 49, icono: 14, hueco: 5, separador: 22 } },
      rotom: {
        w: 214, h: 58, hClima: 76, r: 14, separacionPausa: 52,
        cara: { x: 7, y: 7, lado: 44, r: 12, pantalla: { x: 5, y: 6, w: 34, h: 30, r: 7 } },
        ojos: { separacion: 7, w: 6.8, h: 14, brilloW: 2.2, brilloH: 3.6, mirarX: 5, mirarY: 3.2, parpadeoMs: 120, cadaS: [3, 5.5] },
        texto: { x: 61, bioma: { tam: 13, base: 24 }, clima: { tam: 11, base: 43, icono: 15 }, efectos: { tam: 11, base: 62, icono: 15 } }
      },
      jefe: {
        anchoMax: 470, margenLados: 20, h: 44, r: 10, y: 'contador+8',
        lengueta: { w: 66, etiqueta: { tam: 11, base: 17 }, numero: { tam: 16, base: 34 } },
        nombre: { x: 76, tam: 16, base: 18 }, chipTipo: { h: 14, r: 4, tam: 11, padding: 6, separacion: 4, y: 6 },
        porcentaje: { tam: 11, base: 18, der: 10 },
        barra: { x: 76, y: 26, h: 10, der: 10, marcasCada: 0.25 }
      },
      aviso: { h: 40, r: 14, lengueta: 30, tam: 18, separacion: 12, anchoMax: 640, margenLados: 20, grieta: { h: 58, titulo: 18, sub: 13 } },
      ranuras: {
        lado: 58, r: 14, separacion: 9, margenAbajo: 16, elevacionActiva: 6, bordeActiva: 2.5,
        icono: 34, iconoFusion: 22, numero: { tam: 11, x: 6, base: 13 },
        nivel: { h: 4, r: 1.5, lados: 8, abajo: 9, separacion: 2 },
        pildora: { tam: 13, h: 18, padding: 8, sobre: 24, base: 11 },
        objeto: { separacion: 18, icono: 36, borde: 2 }, vinculo: { separacion: 12, icono: 24 }
      },
      companeros: { fila: 22, padding: 6, insignia: 8, nombre: { x: 24, tam: 13, anchoMax: 100 }, barra: { x: 130, w: 152, h: 6 } },
      pausaTactil: { lado: 44 },
      flechas: { margen: 40, lente: 18, punta: 30, base: 16, mediaBase: 10, etiqueta: 13, separacionMin: 44 }
    },
    // ---------- compacto (px CSS, sin escala; móvil en horizontal) ----------
    compacto: {
      margen: 6, fila1: { y: 6, h: 40 }, fila2: { y: 50, h: 26 }, bandaSuperiorMax: 76,
      // Filas adaptables al alto (revisión cruzada, con el criterio de Nico: como mucho un 20 % del alto, objetivo
      // 18-20 %): fila = clamp(round(k·alto), min, max); hueco menor por debajo de altoApretado. Dan 74 px a 390
      // de alto (19,0 %), 69 a 360 (19,2 %), 65 a 340 (19,1 %) y 63 a 320 (19,7 %).
      // Las piezas de la guía que van en esas filas (ficha, contador y Rotom de 44 px, jefe y aviso de 30) son
      // más altas que las filas: el HUD Dex del lote 2 tiene que afinarlas para que quepan (PLAN.md).
      adaptable: { fila1: [0.1, 32, 40], fila2: [0.064, 22, 26], margen: [6, 6], hueco: [3, 4], altoApretado: 360, ranuraApretada: 44 },
      ficha: {
        carcasa: { w: 44, h: 44, r: [12, 5, 5, 12] }, lente: { r: 15, aro: 2 },
        pantalla: { x: 38, y: 2, w: 168, h: 40, r: 10 }, texto: { izq: 14, der: 162 },
        nombre: { tam: 13, base: 16 }, nivel: { tam: 13 }, nivelEtiqueta: { tam: 11 },
        ps: { etiqueta: { tam: 11, base: 31 }, barra: { x: 34, y: 25, h: 6 }, cifras: { tam: 11, base: 31 }, hueco: 6 },
        exp: { x: 14, y: 36, w: 148, h: 2 }
      },
      contador: { w: 96, h: 44, reloj: { tam: 22, base: 25 }, datos: { tam: 11, base: 39, icono: 12 } },
      rotom: { w: 204, h: 44, cara: { x: 6, y: 6, lado: 32, r: 10 }, texto: { x: 46, der: 8, linea1: { tam: 13, base: 19 }, linea2: { tam: 11, base: 36, icono: 12, hueco: 2, separacion: 6 } } },
      pausa: { lado: 44 },
      jefe: { anchoMax: 340, h: 30, r: 10, lengueta: { w: 40, etiqueta: { tam: 11, base: 12 }, numero: { tam: 13, base: 26 } },
              nombre: { x: 48, tam: 13, base: 14 }, chipTipo: { h: 14, tam: 11, y: 3 }, porcentaje: { tam: 11 }, barra: { x: 48, y: 19, h: 6, der: 8 } },
      aviso: { h: 30, r: 10, lengueta: 24, icono: 14, tam: 13, anchoMaxConJefe: 340, anchoMaxSolo: 520 },
      columnaIzq: { y: 96, w: 104, anchoMax: 112, fila: 30, chip: { h: 22, fila: 26 } },          // compañeros y chips de estado
      ranuras: { lado: 48, r: 10, separacion: 6, icono: 30, iconoFusion: 18, desplazamientoActiva: 6,
                 nivel: { h: 3, abajo: 7 }, pildora: { tam: 13, h: 22, separacion: 6 }, objeto: { lado: 40, separacion: 12 },
                 apretado: { separacion: 4, objeto: 6 } },          // si la columna no cabe (alto < 376)
      flechas: { margen: 30, lente: 14, etiqueta: 11 },
      camara: { suavizadoMs: 400 }                                     // encuadre al centro de la zona libre
    }
  };

  /* ---------------------------------------------------------- mundo (Gremio) */
  // Suelo y tierra = los del original (no se tocan). Se recolorean paredes, agua,
  // flores, hojas, troncos, rocas y hierba. «_g» = gradación y luz del bioma.
  const biomas = [
    { nombre: 'Bosque Umbrío',
      flowers: ['#d4b45c', '#c49088', '#d6cdb2'],
      wallTop: ['#77704f', '#807856', '#6e6849'], wallLight: '#9a916c', wallEdge: '#2b2219',
      wallFace: ['#544834', '#4a3f2e'], wallFaceDark: '#2b2219',
      liq: '#3b86b0', liqDeep: '#2c6894', foam: '#d8eef4', shore: '#33532f',
      leaf: ['#2f4d25', '#3f632c', '#577d36', '#7c9e48'], trunk: ['#4a3020', '#694530'],
      rock: ['#736a5c', '#928877', '#b4a891'], grass: ['#41602c', '#5f803a', '#8aa854'],
      _g: { sombra: '#10230f', luz: '#f2d68c', humedo: '#224a2a', brillo: null, farol: 0.26,
            motas: { tipo: 'polen', cols: ['#efe08a', '#c8dc78'], n: 26 } } },
    { nombre: 'Cueva Cristal',
      light: '#626e98', flowers: ['#7ccbd6', '#a894dc', '#cdc4ea'],
      wallTop: ['#66584f', '#6e6056', '#5e5148'], wallLight: '#8a7a6d', wallEdge: '#1e1712',
      wallFace: ['#43382f', '#3b3129'], wallFaceDark: '#1e1712',
      liq: '#2f9aa8', liqDeep: '#22788a', foam: '#c4f2f2', shore: '#2f3552',
      leaf: ['#4fb8c8', '#86d8e4', '#c4f0f4', '#f4ffff'], trunk: ['#4a3a5c', '#62507c'],
      rock: ['#6a5d54', '#877a6f', '#a6998c'], grass: ['#3c5e5e', '#55807c', '#7ea8a0'],
      _g: { sombra: '#0d0f1c', luz: '#ffc272', humedo: '#262c48', brillo: null, farol: 0.40,
            motas: { tipo: 'polvo', cols: ['#f2e2c0', '#bfe8ee'], n: 22 } } },
    { nombre: 'Volcán Ceniza',
      light: '#7a5e4c', flowers: ['#d8763a', '#e0a24a', '#b0583a'],
      wallTop: ['#3b3331', '#433a37', '#352e2c'], wallLight: '#5f534d', wallEdge: '#150f0d',
      wallFace: ['#2b2422', '#251f1d'], wallFaceDark: '#150f0d',
      liq: '#e8641e', liqDeep: '#bf461a', foam: '#ffd06a', shore: '#3a2620',
      leaf: ['#4a3a30', '#5e4a3c', '#6f5a49', '#806a58'], trunk: ['#3a2e27', '#52423a'],
      rock: ['#4f4541', '#6b5f59', '#897b73'], grass: ['#6a4a2a', '#94693a', '#c4914e'],
      _g: { sombra: '#160c09', luz: '#ff9e52', humedo: null, brillo: '#ff8a3a', farol: 0.34,
            motas: { tipo: 'brasas', cols: ['#ffb04a', '#ff7a2a', '#ffe08a'], n: 30 } } }
  ];
  // Arenas de la grieta: conservan su paleta; la gradación se deriva de su suelo
  // (sombra = suelo oscurecido 80 %, húmedo = 45 %; brillo = su líquido si es lava,
  // veneno o chispa), farol 0,30, luz '#ffd9a0'. Motas: brasas [foam, liq] ×20 si
  // el líquido quema; si no, polvo ['#f2e2c0'] ×14.
  const arena = { luz: '#ffd9a0', farol: 0.30, sombraK: -0.8, humedoK: -0.45, motasCalientes: 20, motasFrias: 14, polvo: '#f2e2c0' };

  const gradacion = {                              // horneada una vez por chunk; 0 coste por fotograma
    ruido: { escalas: [6.5, 2.7], pesos: [0.7, 0.3], semillas: [4471, 4473], ganancia: 2.2 },
    luzMax: 0.10, sombraMax: 0.18, oclusion: { k: 0.6, max: 0.42 },
    humedo: { k: 0.6, max: 0.40 }, brillo: { k: 0.42, max: 0.30 }, margenTiles: 3, desenfoques: 2
  };
  const farol = { r0: 0.36, r1: 0.56, paradaMedia: { en: 0.55, alfa: 0.4 } }; // r0 ×min(w,h); r1 ×hypot(w,h) (vista de mundo)
  const vineta = { r0: 0.46, r1: 0.8, color: 'rgba(24,12,5,0.26)' };          // encima de los sprites, suave
  const halos = {                                   // SÓLO sobre el suelo, pixelados (caché a resolución de arte)
    grieta: { radio: 90, alfa: 0.18, pulso: 0.04, hz: 1 },
    jefe: { radioK: 2.2, alfa: 0.12 },              // color = su primer tipo
    disparo: { radio: 10, alfa: 0.10, max: 24 },    // sólo aliados, con su tipo (los hostiles ya llevan el contorno rojo de la tanda 1)
    lava: 'horneado'                                // ya va en la gradación («brillo»)
  };
  const motas = {                                   // sobre el suelo, 1 píxel de arte, pegadas a la rejilla de arte
    polen: { vx: [6, 12], vy: [2, 6], alfa: 0.7, vida: [7, 12] },
    polvo: { vx: [-2, 2], vy: [-4, -1], alfa: 0.55, vida: [8, 14] },
    brasas: { vx: [-5, 5], vy: [-36, -14], alfa: 0.85, vida: [5, 9], parpadeo: 9 },
    vaiven: { hz: 1.7, amplitud: 6 }, entrada: 0.8, salida: 1.2
  };
  const clima = {                                   // pantalla, encima del mundo y debajo del HUD (Rotom)
    tinteMax: 0.16, tinteK: 1.6, rampa: 3,          // s de entrada y salida
    densidad: { rain: 120, snow: 70, sand: 60, sun: 22 },   // ×(ancho/1280)
    pixel: w => Math.max(2, Math.round(w / 640)),
    rain: { v: [-140, 760], borde: ['#1d4a78', 0.55], nucleo: ['#e6f2ff', 0.85], segmentos: 5 },
    snow: { borde: ['#2a4a6a', 0.45], nucleo: ['#ffffff', 0.9] },
    sand: { borde: ['#7a5a2a', 0.4], nucleo: ['#f0d698', 0.6] },
    sun: { nucleo: ['#fff1b0', 0.6] }
  };

  /* ------------------------------------------------ transiciones y momentos */
  const rotulo = { entradaMs: 180, visibleMs: 1600, salidaMs: 400, desplazamiento: 8, tamTitulo: 22, tamSub: 13 };

  return Object.freeze({
    color, tipoPildora, tipoConFilo, filoTipo, familia, familiaLogo, peso, escalaTipo, fuente,
    espacio, radio, tiempo, escalaHUD, ESCALA_HUD_MAX, ALTO_COMPACTO, hud,
    biomas, arena, gradacion, farol, vineta, halos, motas, clima, rotulo
  });
})();
