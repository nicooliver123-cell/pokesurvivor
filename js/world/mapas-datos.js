/* ============ mapas-datos.js — datos de los mapas propios (MOD nico) ============
 * Petición de Nico del 14-10-2026 («no deben parecerse a los mapas originales»), especificación «Valles y calzadas».
 * Sólo datos (y dos funciones puras de color: shade y espuma). Quien los instala es mapas.js (G.Mapas), y sólo con
 * G.MODS.mapasPropios: este fichero no toca G.Tiles, G.MARCA ni G.Weather. Va congelado entero; nadie muta en su
 * sitio las listas de G.Tiles.BIOMES ni las de G.MARCA (entorno.js las sustituye enteras), así que se pueden compartir
 * sin copiarlas.
 *
 *   BIOMAS        los 3 biomas que se turnan (índices 0-2 de G.Tiles.BIOMES): «la misma vega en tres momentos». El río
 *                 corre al alba (agua), se hiela de noche (hielo) y se vuelve ácido al ocaso (veneno). Llevan todos los
 *                 campos que leen tiles.js, world.js (drawGround, drawLiquid, liquidKind, biomeName) y entorno.js, más
 *                 los del pintor nuevo (senda, vado, puente, cauce, losa, ruina, acento) y sus materiales: sueloMat,
 *                 paredMat y motivo (mapas-pintar.js), y prop, el árbol (mapas-sprites.js). Los colores están medidos:
 *                 L* del suelo de 37,9 a 55,4, ≥ 2,54:1 frente a #181818 y a ΔE00 ≥ 28 del rojo de los disparos. El
 *                 cauce seco es barro cuarteado más oscuro que la calzada (pardo al alba y de noche, herrumbre al ocaso):
 *                 entre las medias pintadas de cauce y calzada, ΔE00 10,6 / 11,0 / 12,7 (≥ 8; antes 2,1 / 3,5 / 1,7, se
 *                 leía como otra calzada). La calzada de la Sulfúrea es de piedra gris, a 8,5 del llano (antes 2,8).
 *   ARENAS        las 18 arenas de la grieta, con las MISMAS claves y en el MISMO orden que ARENA_THEMES de tiles.js
 *                 (G.Tiles.arenaBiome, que usa rift.js, da el bioma por ese índice). Colores base, como ARENA_THEMES:
 *                 las listas (hojas, tronco, roca, hierba, suelo y pared) se derivan con shade() como hace arenaBiome.
 *                 familia y variante son el trazado (mapas.js); liquid y weather, los del proyecto base, para no tocar
 *                 el equilibrio.
 *                 foam: 'auto' = sin espuma propia, shade(liq, 0,55) (espuma()); al copiarlo a ARENA_THEMES va sin el
 *                 campo, como las arenas del proyecto base que no lo llevan. ajedrez (sólo psychic): losas a cuadros.
 *                 No van pools, pillars ni props: sólo los lee el camino del proyecto base de world.js (terrainRaw y
 *                 placeProps), que no corre con los mapas propios; mapas.js no los toca y siguen en ARENA_THEMES.
 *   TIPOS         las claves de ARENAS, en orden.
 *   MARCA_G       gradación y luz del estilo Dex de cada bioma (el `_g` de G.MARCA.biomas), por su `motivo`: la
 *                 entrada i de G.MARCA.biomas pasa a ser { nombre: BIOMAS[i].name, _g: MARCA_G[BIOMAS[i].motivo] }.
 *   MOTAS         las dos motas nuevas de G.MARCA.motas: escarcha (cae despacio) y esporas (suben). Sin parpadeo.
 *   CLIMA         pesos del clima al azar de cada bioma, por índice (como BIOME_W de weather.js); claves de KINDS.
 *   SEMILLA_MENU  semilla del fondo de los menús (game.js, init y restore). Cumple, en la ventana que recorre la cámara
 *                 (±21 × ±16 casillas), río con agua, puente o vado, cresta con puerto y un sitio, 5-12 % de líquido y
 *                 3-9 % de pared. La alternativa medida es 124. Si cambia el generador, se vuelve a buscar.
 *   NOMBRES_EN    los 21 nombres en inglés. Son los mismos que añade lang-en-mod.js, que carga antes que este fichero y
 *                 por eso los repite: si se cambia un nombre, en los dos sitios.
 */
G.MapasDatos = (() => {
  // ---------------- biomas que se turnan (0-4, 4-8 y 8-12 min, y vuelta a empezar) ----------------
  const BIOMAS = [
    { name: 'Vega del Alba', liquid: 'water', prop: 'alamo', sueloMat: 'pasto', paredMat: 'estratos', motivo: 'alba',
      floor: ['#787445', '#7f7b4b', '#706c40'], dirt: ['#646a40', '#6a7044', '#5e643c'], speck: '#5a5838', light: '#9a9462',
      flowers: ['#efe08a', '#f2ecd8', '#c8a0d0'],
      wallTop: ['#9a8466', '#a58f70', '#8c775b'], wallLight: '#c0aa88', wallEdge: '#3a2e23',
      wallFace: ['#6e5a45', '#62503d'], wallFaceDark: '#3a2e23',
      liq: '#3d7f95', liqDeep: '#2d6376', foam: '#a9d6de', shore: '#857c62',
      leaf: ['#2e4729', '#3e6032', '#557e3e', '#78a052'], trunk: ['#5a4a3a', '#8c7c64'],
      rock: ['#6e6c62', '#8b8a7e', '#aaa99b'], grass: ['#4a5a2c', '#7a8a3c', '#b8b060'],
      senda: ['#8a7e5c', '#827656', '#6a6048'], vado: ['#857c62', '#a49d84', '#c6c0a6'], puente: ['#7a5b3b', '#5d452d', '#9a7a52'],
      cauce: ['#70604e', '#4c3d2e'], losa: ['#86826e', '#7a7664', '#5e5a48'], ruina: ['#8a877a', '#9a978a', '#7a776b'],
      acento: '#6f8a44' },                                   // musgo en el borde de las crestas y en juntas
    { name: 'Vega Helada', liquid: 'ice', prop: 'abeto', sueloMat: 'escarcha', paredMat: 'facetas', motivo: 'helada',
      floor: ['#5e6a6c', '#657173', '#566264'], dirt: ['#6f7b88', '#76828f', '#68747f'], speck: '#49545d', light: '#8a98a4',
      flowers: ['#bde3ef', '#9cc5dd', '#dde9f2'],
      wallTop: ['#6d7c95', '#7888a1', '#64728a'], wallLight: '#a3b3cb', wallEdge: '#222937',
      wallFace: ['#4a5569', '#424c5f'], wallFaceDark: '#252c3a',
      liq: '#5d8fa3', liqDeep: '#4a7a8f', foam: '#e6f4fa', shore: '#6a747c',
      leaf: ['#1e3836', '#2a4d47', '#3a685a', '#d3e2ea'], trunk: ['#3c332f', '#574940'],
      rock: ['#5b6471', '#79838f', '#99a3af'], grass: ['#55594d', '#87876b', '#c8c6a8'],
      senda: ['#6c747c', '#666e76', '#535a62'], vado: ['#66717a', '#8a95a0', '#b6c1cb'], puente: ['#6b5340', '#50402f', '#8a6f52'],
      cauce: ['#6a635a', '#47403a'], losa: ['#717a84', '#677079', '#4e565f'], ruina: ['#7d8590', '#8b939e', '#6f7782'],
      acento: '#d6e0ea' },                                   // nieve en el borde de las crestas y carámbanos
    { name: 'Vega Sulfúrea', liquid: 'poison', prop: 'seta', sueloMat: 'ceniza', paredMat: 'basalto', motivo: 'sulfurea',
      floor: ['#6c6650', '#736d56', '#645e49'], dirt: ['#655f4b', '#6b6550', '#5f5946'], speck: '#55503e', light: '#8a8266',
      flowers: ['#d8c84a', '#9bd14a', '#e0a070'],
      wallTop: ['#403d48', '#48444f', '#38363f'], wallLight: '#625e6c', wallEdge: '#141218',
      wallFace: ['#2b2831', '#25222b'], wallFaceDark: '#141218',
      liq: '#7d8c26', liqDeep: '#5c6a1e', foam: '#e2ef6a', shore: '#6a6452',     // ácido verde-amarillo, borde de aviso claro
      leaf: ['#2f5a58', '#3f7470', '#5a9690', '#bfe0d4'], trunk: ['#9c907a', '#c4b89e'],   // setas color petróleo, no moradas
      rock: ['#4a4550', '#65606d', '#837c8b'], grass: ['#4a4530', '#6e6646', '#9a8e62'],
      senda: ['#89847d', '#7e7972', '#59544e'], vado: ['#6c6556', '#8f8776', '#b0a895'], puente: ['#5c4632', '#433325', '#7c6146'],
      cauce: ['#7c6246', '#58422a'], losa: ['#827a68', '#777060', '#524c40'], ruina: ['#6a6670', '#78747e', '#5d5a63'],
      acento: '#cbbf4a' }                                    // costra de azufre
  ];

  // ---------------- arenas de la grieta (mismo orden que ARENA_THEMES de tiles.js) ----------------
  /*
   * familia · variante (el trazado lo decide mapas.js; r = 11, el pasillo de entrada siempre es suelo):
   *   octogono   columnas · abierto · bastiones          plataforma  menhires (borde irregular)
   *   isla       foso (de lava, con 4 puentes)            laguna      agua · seracs
   *   anillo     charcos (claustro con 4 puertas)        corona      lisa · lava (arcos de muro)
   *   claro      charcas · panal · corro                 jardin      charcas (2×2)
   *   canon      barro · costillas                       hileras     lapidas · callejon
   * sueloMat: pasto, losas, tatami, chapa, grava, grietas, adoquin o escarcha. paredMat: sillar, tablas, estratos,
   * facetas o basalto. prop (árbol): columna, cristal y seco (sólo de arena) o alamo, abeto y seta (los de los biomas).
   * Cada suelo y cada pared queda a ΔE00 ≥ 16 de los de su arena del proyecto base; los líquidos, a ≥ 31,8 del disparo
   * (la lava de fire pasa a #f0901e para no confundirse con él).
   */
  const ARENAS = {
    normal:   { name: 'Plaza del Eco', familia: 'octogono', variante: 'columnas', floor: '#7a7262', wall: '#beb39d',
                liquid: 'water', liq: '#4a7f9a', foam: 'auto', sueloMat: 'losas', paredMat: 'sillar',
                prop: 'columna', leaf: '#7a9a5a', trunk: '#6a5a48', grass: '#8a8a5a', rock: '#a09682',
                flowers: ['#e8d070', '#f0ece0', '#c8a0d0'], weather: null },
    fire:     { name: 'Caldera Rúnica', familia: 'isla', variante: 'foso', floor: '#70655f', wall: '#52465f',
                liquid: 'lava', liq: '#f0901e', foam: '#ffd27a', sueloMat: 'grietas', paredMat: 'basalto',
                prop: 'seco', leaf: '#5a4a40', trunk: '#3a3030', grass: '#8a6a4a', rock: '#7a6a64',
                flowers: ['#f0a040', '#f0d070', '#d86a3a'], weather: 'sun' },
    water:    { name: 'Atolón Hundido', familia: 'laguna', variante: 'agua', floor: '#6f7c72', wall: '#775952',
                liquid: 'water', liq: '#107ea7', foam: '#bfe8f4', sueloMat: 'grava', paredMat: 'estratos',
                prop: 'cristal', leaf: '#4a9a9a', trunk: '#6a5a50', grass: '#5a9a8a', rock: '#8a7a70',
                flowers: ['#f0a0b8', '#a0f0e0', '#f0f0f0'], weather: 'rain' },
    grass:    { name: 'Jardín Colgante', familia: 'claro', variante: 'charcas', floor: '#5e6d5d', wall: '#594e30',
                liquid: 'swamp', liq: '#6d682a', foam: '#b8c070', sueloMat: 'pasto', paredMat: 'estratos',
                prop: 'alamo', leaf: '#5a8a40', trunk: '#5a4a32', grass: '#6a8a40', rock: '#8a8a70',
                flowers: ['#f0d060', '#f0a0c0', '#f0f0f0'], weather: null },
    electric: { name: 'Bobina Tormenta', familia: 'anillo', variante: 'charcos', floor: '#6f7464', wall: '#775034',
                liquid: 'spark', liq: '#eea927', foam: '#fff2b8', sueloMat: 'chapa', paredMat: 'sillar',
                prop: 'cristal', leaf: '#e0c040', trunk: '#6a5030', grass: '#9a9a50', rock: '#8a8a80',
                flowers: ['#f0e050', '#f0f0f0', '#80c8f0'], weather: 'rain' },
    ice:      { name: 'Lago de Seracs', familia: 'laguna', variante: 'seracs', floor: '#6e8494', wall: '#4a6278',
                liquid: 'ice', liq: '#3ca2b5', foam: '#eaf8fc', sueloMat: 'escarcha', paredMat: 'facetas',
                prop: 'abeto', leaf: '#3a6a6a', trunk: '#4a4040', grass: '#8aa0a8', rock: '#7a90a0',
                flowers: ['#e0f0f8', '#a0d0e8', '#f0f0f0'], weather: 'snow' },
    fighting: { name: 'Tatami Sagrado', familia: 'octogono', variante: 'abierto', floor: '#81835b', wall: '#c8b48c',
                liquid: 'water', liq: '#4a7f9a', foam: 'auto', sueloMat: 'tatami', paredMat: 'tablas',
                prop: 'seco', leaf: '#6a8a4a', trunk: '#5a4030', grass: '#8a8a50', rock: '#9a8a70',
                flowers: ['#e86a5a', '#f0d070', '#f0ece0'], weather: null },
    poison:   { name: 'Pozas de Ponzoña', familia: 'jardin', variante: 'charcas', floor: '#726677', wall: '#743c5f',
                liquid: 'poison', liq: '#b26ed0', foam: '#efc4ff', sueloMat: 'grava', paredMat: 'basalto',
                prop: 'seta', leaf: '#9a60b0', trunk: '#c0b0a0', grass: '#7a6a80', rock: '#8a7a90',
                flowers: ['#c070e0', '#a0d050', '#e0a0f0'], weather: null },
    ground:   { name: 'Cañada Seca', familia: 'canon', variante: 'barro', floor: '#7e6544', wall: '#523926',
                liquid: 'swamp', liq: '#9a8a6a', foam: '#d2c4a0', sueloMat: 'grietas', paredMat: 'estratos',
                prop: 'seco', leaf: '#8a7048', trunk: '#5a4028', grass: '#a08a5a', rock: '#9a8060',
                flowers: ['#e0a050', '#f0d080', '#f0f0f0'], weather: 'sand' },
    flying:   { name: 'Mirador Nuboso', familia: 'plataforma', variante: 'menhires', floor: '#6f8296', wall: '#c8b8cd',
                liquid: 'water', liq: '#6aa6d0', foam: 'auto', sueloMat: 'pasto', paredMat: 'facetas',
                prop: 'alamo', leaf: '#a8c0d8', trunk: '#8a8a9a', grass: '#90a8b8', rock: '#b8b0c8',
                flowers: ['#f0f0f8', '#f0e070', '#b8d0f0'], weather: null },
    psychic:  { name: 'Corona Astral', familia: 'corona', variante: 'lisa', floor: '#75708b', wall: '#784b66',
                liquid: 'water', liq: '#7a6ac0', foam: 'auto', sueloMat: 'losas', ajedrez: true, paredMat: 'sillar',
                prop: 'cristal', leaf: '#e090c8', trunk: '#6a4a7a', grass: '#9a7aa8', rock: '#9a8aa8',
                flowers: ['#f0a0d8', '#c8b0f0', '#f0f0f0'], weather: null },
    bug:      { name: 'Celdas de Ámbar', familia: 'claro', variante: 'panal', floor: '#837050', wall: '#b68b33',
                liquid: 'swamp', liq: '#6a6a30', foam: 'auto', sueloMat: 'pasto', paredMat: 'basalto',
                prop: 'seco', leaf: '#8a8a3a', trunk: '#5a4a2a', grass: '#9a9040', rock: '#9a8060',
                flowers: ['#f0c040', '#f0f0d0', '#c0d050'], weather: null },
    rock:     { name: 'Cantil Fósil', familia: 'canon', variante: 'costillas', floor: '#717b80', wall: '#b49660',
                liquid: 'water', liq: '#4a7f9a', foam: 'auto', sueloMat: 'grava', paredMat: 'estratos',
                prop: 'columna', leaf: '#8a8a7a', trunk: '#5a5048', grass: '#9a9070', rock: '#a8a090',
                flowers: ['#d0c0a0', '#f0f0f0', '#b0a080'], weather: 'sand' },
    ghost:    { name: 'Osario Velado', familia: 'hileras', variante: 'lapidas', floor: '#66627b', wall: '#918999',
                liquid: 'water', liq: '#3e4a66', foam: 'auto', sueloMat: 'losas', paredMat: 'sillar',
                prop: 'seco', leaf: '#5a5a70', trunk: '#3a3848', grass: '#6a6a80', rock: '#a8a0b0',
                flowers: ['#a090e0', '#70e0c8', '#d0d0e0'], weather: 'fog' },
    dragon:   { name: 'Nido Escamado', familia: 'corona', variante: 'lava', floor: '#67667e', wall: '#2e4a46',
                liquid: 'lava', liq: '#ae5fe2', foam: '#e8c8ff', sueloMat: 'grietas', paredMat: 'basalto',
                prop: 'cristal', leaf: '#9a70e0', trunk: '#3a4a48', grass: '#6a6a90', rock: '#7a7890',
                flowers: ['#b080f0', '#f0c040', '#f0f0f0'], weather: null },
    dark:     { name: 'Arrabal Sin Luna', familia: 'hileras', variante: 'callejon', floor: '#615c67', wall: '#4e3930',
                liquid: 'water', liq: '#2e3442', foam: 'auto', sueloMat: 'adoquin', paredMat: 'sillar',
                prop: 'seco', leaf: '#4a4450', trunk: '#2e2a32', grass: '#5a5460', rock: '#7a7078',
                flowers: ['#e05a6a', '#8a7a6a', '#a89aa8'], weather: null },
    steel:    { name: 'Forja Sellada', familia: 'octogono', variante: 'bastiones', floor: '#4d645f', wall: '#8a949e',
                liquid: 'water', liq: '#4a7f9a', foam: 'auto', sueloMat: 'chapa', paredMat: 'sillar',
                prop: 'columna', leaf: '#8aa0a8', trunk: '#5a646c', grass: '#7a8a8a', rock: '#9aa4ac',
                flowers: ['#c8d4dc', '#f0c040', '#f0f0f0'], weather: null },
    fairy:    { name: 'Corro de Hadas', familia: 'claro', variante: 'corro', floor: '#7a6670', wall: '#b08aa8',
                liquid: 'water', liq: '#8ab9c9', foam: '#ffe6f4', sueloMat: 'pasto', paredMat: 'sillar',
                prop: 'seta', leaf: '#d890b8', trunk: '#e0d0c0', grass: '#b090b0', rock: '#a890a0',
                flowers: ['#f0a0d0', '#f0f0f0', '#c8a8f0'], weather: null }
  };

  // ---------------- estilo Dex: gradación, farol y motas de cada bioma (entorno.js) ----------------
  const MARCA_G = {
    alba:     { sombra: '#1e2412', luz: '#ffe0a0', humedo: '#3a4a30', brillo: null, farol: 0.24,
                motas: { tipo: 'polen', cols: ['#efe08a', '#e6efbd'], n: 26 } },
    helada:   { sombra: '#121823', luz: '#e4eeff', humedo: '#3a4a58', brillo: null, farol: 0.30,
                motas: { tipo: 'escarcha', cols: ['#eef6fb', '#c7dcea'], n: 24 } },
    sulfurea: { sombra: '#17140c', luz: '#ffd890', humedo: null, brillo: '#a8c040', farol: 0.34,   // brillo junto al ácido
                motas: { tipo: 'esporas', cols: ['#d8e070', '#a0d0a0'], n: 22 } }
  };
  // Mismos campos que las de G.MARCA.motas (px de mundo por segundo, alfa y vida en s).
  const MOTAS = {
    escarcha: { vx: [-3, 3], vy: [3, 8], alfa: 0.6, vida: [8, 14] },
    esporas:  { vx: [-2, 2], vy: [-10, -4], alfa: 0.7, vida: [6, 10] }
  };

  // ---------------- clima al azar (lo tira quien manda; viaja con 'wx') ----------------
  const CLIMA = [
    { rain: 3, sun: 2, fog: 1.5, sand: 0.5 },               // Vega del Alba
    { snow: 3.5, fog: 2, rain: 0.5 },                        // Vega Helada
    { fog: 3, sun: 1.5, sand: 1, rain: 0.5 }                 // Vega Sulfúrea
  ];

  const SEMILLA_MENU = 2750;

  const NOMBRES_EN = {
    'Vega del Alba': 'Dawn Vale', 'Vega Helada': 'Frozen Vale', 'Vega Sulfúrea': 'Sulfur Vale',
    'Plaza del Eco': 'Echo Plaza', 'Caldera Rúnica': 'Rune Caldera', 'Atolón Hundido': 'Sunken Atoll',
    'Jardín Colgante': 'Hanging Garden', 'Bobina Tormenta': 'Storm Coil', 'Lago de Seracs': 'Serac Lake',
    'Tatami Sagrado': 'Sacred Tatami', 'Pozas de Ponzoña': 'Venom Pools', 'Cañada Seca': 'Dry Gulch',
    'Mirador Nuboso': 'Cloud Lookout', 'Corona Astral': 'Astral Crown', 'Celdas de Ámbar': 'Amber Cells',
    'Cantil Fósil': 'Fossil Cliff', 'Osario Velado': 'Veiled Ossuary', 'Nido Escamado': 'Scaled Nest',
    'Arrabal Sin Luna': 'Moonless Quarter', 'Forja Sellada': 'Sealed Forge', 'Corro de Hadas': 'Fairy Ring'
  };

  // ---------------- color (copia de tiles.js: mismos números que arenaBiome) ----------------
  function rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  /** Aclara (k>0) u oscurece (k<0) un color, exactamente como shade() de tiles.js. */
  function shade(hex, k) {
    const c = rgb(hex).map(v => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  /** Espuma de una arena: la suya o, con 'auto', la de arenaBiome (su líquido aclarado un 55 %). */
  const espuma = a => (a.foam && a.foam !== 'auto' ? a.foam : shade(a.liq, 0.55));

  /** Congela objetos y listas en profundidad (los datos no cambian nunca). */
  function congelar(o) {
    if (o && typeof o === 'object' && !Object.isFrozen(o)) {
      Object.freeze(o);
      for (const k of Object.keys(o)) congelar(o[k]);
    }
    return o;
  }

  return congelar({ BIOMAS, ARENAS, TIPOS: Object.keys(ARENAS), MARCA_G, MOTAS, CLIMA, SEMILLA_MENU, NOMBRES_EN, shade, espuma });
})();
