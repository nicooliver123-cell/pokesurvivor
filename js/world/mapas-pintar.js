/* ============ mapas-pintar.js — pintado del suelo de los mapas propios (MOD nico) ============
 * Petición de Nico del 14-10-2026 («no deben parecerse a los mapas originales»), especificación «Valles y calzadas»
 * §5. Sustituye a G.Tiles.paintChunk sólo con G.MODS.mapasPropios (G.Mapas.activo); sin él, tiles.js pinta como
 * upstream. Mismo contrato que paintChunk: (cx, cy, n, at, dirtField, bi, seed) → lienzo de n·16 px de lado a
 * resolución de arte, escrito SÓLO en un Uint32Array ABGR sobre createImageData y volcado con putImageData (nada de
 * fillRect ni drawImage). Los códigos del terreno (kind | sub << 2) salen de G.Mapas.capa con 3 casillas de faldón:
 * hacen falta los vecinos de los vecinos para los triángulos de las orillas y la orientación de los puentes.
 * `dirtField` no se usa; `at` sólo se pasa a G.Entorno.gradar, que con Dex gradúa el suelo y con Clásico no hace nada.
 *
 *   suelo     campo suave (tono y manchas en las esquinas de cada casilla, interpolados cada 2×2 px) con tramado Bayer
 *             4×4, motas, un motivo por bioma (trébol, flor y guijarro; estrella y grieta de escarcha; barro, burbuja
 *             y azufre) y estacas de topógrafo con banderín cian. Subtipos: calzada, puente, vado, orilla, cauce,
 *             puerto, losas (con huecos en las ruinas), anillo, pretil y la plaza-mosaico de la salida.
 *   sombras   2 filas bajo una pared al norte y 2 columnas tramadas al este de una pared al oeste.
 *   orillas   triángulo de 5 px en la casilla de suelo donde el líquido dobla una esquina (la orilla en diagonal no es
 *             una escalera); el líquido de al lado lo cuenta al medir su distancia a la orilla, así que no hay costuras.
 *   paredes   esquinas escalonadas (3-2-1 arriba, 2-1 abajo; sobre la sombra, la fila de abajo es sombra), cara de
 *             8 px y bordes; materiales estratos (Alba), facetas (Helada), basalto (Sulfúrea), sillar (ruinas, columnas y
 *             arenas) y tablas.
 *   líquidos  esquinas cortadas en diagonal (no contra un vado o un puente: el río sigue por debajo); agua con estelas en
 *             el sentido de la corriente, ciénaga con lentejas, hielo agrietado y peligro (ácido, veneno, lava, chispa)
 *             con borde de aviso claro.
 *   máscara   de suelo por píxel (Pix.msk y Pix.suelo): la gradación de Dex no tiñe los triángulos de líquido ni el vacío
 *             y sí los recortes de suelo de las esquinas de paredes y líquidos.
 *   arenas    con bi ≥ G.Tiles.ARENA y la arena puesta: el vacío de la grieta desde (r+2)² y, dentro, el suelo y la
 *             pared del material de cada arena. Lo que las arenas no traen en su paleta (calzada, losas, puente...)
 *             sale de su suelo y de su pared.
 *
 * Determinista: cada píxel es función pura de (semilla, casilla, arena, bioma), en coordenadas globales (los motivos no
 * se cortan entre chunks); sólo G.U.hash y el vnoise de world.js (copiado; en el líquido, con las 4 esquinas guardadas,
 * mismos números), nada de Math.random, Date ni estado que dependa del orden en que se pinten los chunks. Los colores
 * son los de G.Tiles.BIOMES[bi], que pone mapas.js: las paletas son las mismas en Dex y en Clásico.
 */
(() => {
  if (!G.Mapas) return;                     // sin mapas.js, tiles.js sigue pintando como upstream
  const T = G.Tiles.T, ARENA = G.Tiles.ARENA;
  const hash = G.U.hash, H = (x, y, s) => hash(x, y, s);
  const md = (v, m) => { const r = v % m; return r < 0 ? r + m : r; };   // módulo sin signo (coordenadas negativas)
  const KIND = ['floor', 'wall', 'liquid'];

  // Subtipos (los de mapas.js; si faltara alguno, los de la especificación).
  const S = Object.assign({ LLANO: 0, VADO: 1, PUERTO: 2, LOSA: 3, CRESTA: 4, MURO: 5, RIO_H: 6, RIO_V: 7, RIO_D1: 8,
    RIO_D2: 9, ORILLA: 10, CAUCE: 11, CALZADA: 12, PUENTE: 13, ARCEN: 14, PRETIL: 15, PILA: 16, COLUMNA: 17, ANILLO: 18,
    APRON: 19, PLAZA: 20, A_BORDE: 21, A_VACIO: 22, A_MURO: 23, A_COLUMNA: 24, A_PUENTE: 25 }, G.Mapas.SUB || {});
  const tabla = subs => { const t = new Uint8Array(64); for (const s of subs) t[s] = 1; return t; };
  // Suelo que pinta los triángulos de las esquinas del líquido (no los cruces: puente, vado y calzada siguen rectos).
  const TRI = tabla([S.LLANO, S.ORILLA, S.CAUCE, S.ARCEN, S.APRON, S.PUERTO]);
  // Suelo que hace de agua para la grava de la orilla (el vado y el cauce seco también son río).
  const RIO_SECO = tabla([S.VADO, S.CAUCE]);
  // Junto a estos, la calzada no lleva bordillo.
  const SIN_BORDILLO = tabla([S.CALZADA, S.PUENTE, S.A_PUENTE, S.PLAZA]);
  // Cruces del río: el agua sigue por debajo (el líquido no corta sus esquinas contra ellos) y no reciben sombra.
  const CRUCE = tabla([S.VADO, S.PUENTE, S.A_PUENTE]);
  const FILAS = 64;                         // marca de fuente(): el puente del recorte lleva los tablones en filas

  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16 - 0.5);   // −0,47..0,47
  const BMAX = (15.5 / 16 - 0.5) * 0.09;    // lo más que el tramado (×0,09) mueve un campo: la anchura de la orla

  // ---------------- ruido (el de world.js, tal cual) ----------------
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = H(xi, yi, s), b = H(xi + 1, yi, s), c = H(xi, yi + 1, s), d = H(xi + 1, yi + 1, s);
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
  }
  /** vnoise con las 4 esquinas guardadas en `K` (al recorrer una fila sólo cambian cada pocos píxeles). Da los mismos
   *  números que vnoise en cualquier orden: lo guardado es un resultado puro. */
  const esquinas = () => ({ xi: NaN, yi: NaN, s: NaN, a: 0, b: 0, c: 0, d: 0 });
  function vnc(K, x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y);
    if (xi !== K.xi || yi !== K.yi || s !== K.s) {
      K.xi = xi; K.yi = yi; K.s = s;
      K.a = H(xi, yi, s); K.b = H(xi + 1, yi, s); K.c = H(xi, yi + 1, s); K.d = H(xi + 1, yi + 1, s);
    }
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return (K.a + (K.b - K.a) * u) * (1 - v) + (K.c + (K.d - K.c) * u) * v;
  }
  const kEst = esquinas(), kPel = esquinas(), kHi1 = esquinas(), kHi2 = esquinas();

  // ---------------- color y píxeles (como tiles.js) ----------------
  function rgb(hex) {
    const n = parseInt(String(hex).slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // Empaquetado ABGR (little-endian) para escribir de golpe en un Uint32Array.
  function pack(hex, a = 255) {
    const [r, g, b] = rgb(hex);
    return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  }
  /** Mezcla dos colores hex y devuelve el empaquetado. */
  function mixPack(h1, h2, t) {
    const a = rgb(h1), b = rgb(h2);
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return ((255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;
  }
  /** Luminancia aproximada (0..255) de un color hex. */
  const luz = hex => { const [r, g, b] = rgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b; };
  /** Aclara (k>0) u oscurece (k<0) un color, como shade() de tiles.js. */
  function shade(hex, k) {
    const c = rgb(hex).map(v => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  /** ¿El píxel (x, y) es suelo? Una sola función para todos los lienzos: gradar la llama por píxel. */
  function esSuelo(x, y) { return this.msk[y * this.w + x] === 1; }
  /** Lienzo de píxeles: el búfer a la vista (buf), get/set y suelo(x, y) (lo que espera G.Entorno.gradar, que sin
   *  suelo() mira el tipo de cada casilla), la máscara de suelo por píxel (msk, 1 = suelo) y canvas() al final. */
  function Pix(w, h) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    const img = c.createImageData(w, h);
    const b = new Uint32Array(img.data.buffer), m = new Uint8Array(w * h);
    return {
      w, h, buf: b, msk: m,
      set(x, y, col) { if (x >= 0 && y >= 0 && x < w && y < h) b[y * w + x] = col; },
      get(x, y) { return b[y * w + x]; },
      suelo: esSuelo,
      canvas() { c.putImageData(img, 0, 0); return cv; }
    };
  }

  // ---------------- paleta empaquetada de un bioma ----------------
  const MAT_PARED = { estratos: 0, facetas: 1, basalto: 2, sillar: 3, tablas: 4 };
  const MAT_SUELO = { pasto: 0, ceniza: 0, escarcha: 1, losas: 2, tatami: 3, chapa: 4, grava: 5, grietas: 6, adoquin: 7 };
  const LIQ = { water: 0, swamp: 1, ice: 2, poison: 3, lava: 4, spark: 5 };
  const MOTIVO = { alba: 1, helada: 2, sulfurea: 3 };
  const VACIO = ['#0d0a18', '#7b3cff', '#c9a6ff'].map(h => pack(h));
  const BLANCO = pack('#ffffff'), PALO = pack('#e8e4d8'), BANDERIN = pack('#62E3DD');

  /** Lo que la paleta del bioma no trae: en los 3 biomas, de mapas-datos.js; en las arenas, de su tema y de sus datos. */
  function extra(bi) {
    const D = G.MapasDatos;
    if (bi < ARENA) return (D && D.BIOMAS[bi]) || {};
    const tipo = G.Tiles.ARENA_TYPES[bi - ARENA];
    return Object.assign({}, (D && D.ARENAS[tipo]) || {}, G.Tiles.ARENA_THEMES[tipo] || {});
  }
  const cacheC = new Map();
  function colores(bi) {
    const B = G.Tiles.BIOMES[bi] || G.Tiles.BIOMES[0];
    const firma = B.name + B.floor[0] + B.wallTop[0] + B.liq + B.foam + B.liquid + (B.senda ? B.senda[0] : '');
    let C = cacheC.get(bi);
    if (C && C.firma === firma) return C;
    const X = extra(bi), get = k => (B[k] !== undefined ? B[k] : X[k]);
    const f = B.floor[0], wt = B.wallTop[0], tr = B.trunk || [shade(wt, -0.3), shade(wt, -0.1)];
    const paredMat = get('paredMat') || 'sillar', sueloMat = get('sueloMat') || 'pasto';
    const lista = (k, def) => (get(k) || def).map(h => pack(h));
    const acento = get('acento') || (paredMat === 'estratos' && B.leaf ? B.leaf[2] : B.flowers[0]);
    C = {
      firma,
      floor: lista('floor'), dirt: lista('dirt'), flowers: lista('flowers'), wallTop: lista('wallTop'),
      wallFace: lista('wallFace'), rock: lista('rock', [shade(wt, -0.2), wt, shade(wt, 0.22)]),
      // Las arenas no traen estos: salen de su suelo, de su pared y de su tronco.
      senda: lista('senda', [shade(f, 0.12), shade(f, 0.06), shade(f, -0.22)]),
      vado: lista('vado', [shade(f, -0.1), shade(f, 0.12), shade(f, 0.3)]),
      puente: lista('puente', [tr[1], tr[0], shade(tr[1], 0.2)]),
      cauce: lista('cauce', [shade(f, -0.1), shade(f, -0.25)]),
      losa: lista('losa', [shade(f, 0.12), shade(f, 0.05), shade(f, -0.22)]),
      ruina: lista('ruina', B.wallTop),
      speck: pack(B.speck), light: pack(B.light), wallLight: pack(B.wallLight), wallEdge: pack(B.wallEdge),
      wallFaceDark: pack(B.wallFaceDark), liq: pack(B.liq), liqDeep: pack(B.liqDeep), foam: pack(B.foam),
      shore: pack(B.shore), acento: pack(acento),
      liqLight: mixPack(B.liq, B.foam, 0.22), liqLine: mixPack(B.liqDeep, '#000000', 0.35),
      liquido: B.liquid in LIQ ? LIQ[B.liquid] : 0,
      pared: paredMat in MAT_PARED ? MAT_PARED[paredMat] : 3,
      suelo: sueloMat in MAT_SUELO ? MAT_SUELO[sueloMat] : 0,
      escarcha: sueloMat === 'escarcha', ajedrez: !!get('ajedrez'),
      // Ajedrez (la Corona Astral): losa clara del violeta del suelo, losa del violeta de la pared (ΔL* ≈ 7) y junta de
      // 1 px más oscura. El gris a dos tonos de antes (ΔL* 17, sin juntas) parecía el fondo transparente de un editor.
      ajz: get('ajedrez') ? [pack(shade(f, 0.03)), mixPack(f, B.wallTop[0], 0.5), pack(shade(f, -0.25))] : null,
      // Sombra de ventisquero sólo si la mancha es más clara que el suelo (nieve amontonada, como en la Vega Helada); en
      // el Lago de Seracs la mancha que deriva arenaBiome es más oscura y la sombra no tendría sentido.
      ventisquero: sueloMat === 'escarcha' && luz(get('dirt')[0]) > luz(f),
      // Musgo, nieve o azufre en las juntas de las losas: sólo en los 3 biomas, que traen su acento. En las arenas el
      // acento sale de sus flores y sólo va en el borde de las paredes (en las juntas, el suelo salía moteado).
      juntasAcento: bi < ARENA,
      motivo: bi < ARENA ? MOTIVO[get('motivo')] || 0 : 0
    };
    cacheC.set(bi, C);
    return C;
  }

  // ===================================================================
  // Estado del chunk que se está pintando (todo se pinta de una vez: nada de esto sobrevive entre chunks)
  // ===================================================================
  const R = 3;                              // faldón de casillas alrededor del chunk
  let GW = 0, cod = null, kin = null;       // códigos y clase de casilla (0 suelo, 1 pared, 2 líquido, 3 vacío) del chunk y su faldón
  let buf = null, msk = null, W = 0, W2 = 0, C = null, SEM = 0, UMB = 0.66, BIA = false, TABLAS_H = true;
  let CM = null, CP = null, FM = null, FP = null;
  const EST = new Int8Array(T);             // desplazamiento de los estratos por columna de una casilla de pared

  const kd = (i, j) => kin[(j + R) * GW + i + R];        // clase de la casilla (i, j) del chunk (−R..n+R−1)
  const sb = (i, j) => cod[(j + R) * GW + i + R] >> 2;   // su subtipo

  // ¿La capa de mapas.js está en filas (cod[j·16 + i])? Se mira una vez contra codigo(); si no, todo por codigo().
  let capaFiable = null;
  function comprobarCapa(cx, cy, seed, A) {
    const M = G.Mapas, c = M.capa(cx, cy, seed, A).cod;
    capaFiable = !!c && c.length === 256 &&
      [[1, 2], [5, 11], [14, 3], [9, 15]].every(([i, j]) => c[j * 16 + i] === M.codigo(cx * 16 + i, cy * 16 + j, seed, A));
  }

  /** Los códigos del chunk con R casillas de faldón (de las 9 capas de alrededor) y su clase, con el vacío de la arena. */
  function leerCodigos(cx, cy, n, seed, A, Av) {
    const gw = n + 2 * R, M = G.Mapas;
    if (gw !== GW) { GW = gw; cod = new Uint8Array(gw * gw); kin = new Uint8Array(gw * gw); }
    const tx0 = cx * n - R, ty0 = cy * n - R;
    if (n === 16 && typeof M.capa === 'function' && capaFiable === null && typeof M.codigo === 'function') comprobarCapa(cx, cy, seed, A);
    if (n === 16 && typeof M.capa === 'function' && capaFiable !== false) {
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
        const cc = M.capa(cx + a, cy + b, seed, A).cod;
        const l0 = a < 0 ? 16 - R : 0, l1 = a > 0 ? R : 16, m0 = b < 0 ? 16 - R : 0, m1 = b > 0 ? R : 16;
        for (let lj = m0; lj < m1; lj++) {
          const o = (b * 16 + lj + R) * gw + a * 16 + R;
          for (let li = l0; li < l1; li++) cod[o + li] = cc[lj * 16 + li];
        }
      }
    } else {
      for (let j = 0; j < gw; j++) for (let i = 0; i < gw; i++) cod[j * gw + i] = M.codigo(tx0 + i, ty0 + j, seed, A);
    }
    const VR = Av ? (M.P && M.P.arena ? M.P.arena.borde : Av.r + 2) : 0, VR2 = VR * VR;
    for (let j = 0, o = 0; j < gw; j++) for (let i = 0; i < gw; i++, o++) {
      const c = cod[o], k = c & 3;
      if (Av) {
        const dx = tx0 + i - Av.tx, dy = ty0 + j - Av.ty;
        if (dx * dx + dy * dy >= VR2 || (c >> 2) === S.A_VACIO) { kin[o] = 3; continue; }
      }
      kin[o] = k === 3 ? 1 : k;
    }
  }

  /** Campos suaves del suelo: tono M = vn(t/6) y manchas Pm = vn(t/4,5) en las esquinas de casilla (con una fila más
   *  por arriba, para la sombra de los ventisqueros), interpolados una vez cada 2×2 px (el tramado da el detalle). */
  function campos(tx0, ty0, n) {
    const NC = n + 1, NR = n + 2;
    if (!CM || CM.length !== NC * NR) { CM = new Float32Array(NC * NR); CP = new Float32Array(NC * NR); }
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) {
      const x = tx0 + i, y = ty0 + j - 1;
      CM[j * NC + i] = vnoise(x / 6, y / 6, SEM + 41);
      CP[j * NC + i] = vnoise(x / 4.5, y / 4.5, SEM + 42);
    }
    W2 = (n * T) >> 1;
    const filas = W2 + 1;
    if (!FM || FM.length !== W2 * filas) { FM = new Float32Array(W2 * filas); FP = new Float32Array(W2 * filas); }
    for (let r = 0; r < filas; r++) {      // fila r = bloque de 2 px r − 1 (la 0 es la de encima del chunk)
      const fy = (r * 2 - 1) / T + 1, jj = Math.floor(fy), v = fy - jj;
      for (let x2 = 0; x2 < W2; x2++) {
        const fx = (x2 * 2 + 1) / T, ii = Math.floor(fx), u = fx - ii, o = jj * NC + ii;
        FM[r * W2 + x2] = (CM[o] + (CM[o + 1] - CM[o]) * u) * (1 - v) + (CM[o + NC] + (CM[o + NC + 1] - CM[o + NC]) * u) * v;
        FP[r * W2 + x2] = (CP[o] + (CP[o + 1] - CP[o]) * u) * (1 - v) + (CP[o + NC] + (CP[o + NC + 1] - CP[o + NC]) * u) * v;
      }
    }
  }

  // ===================================================================
  // Píxeles sueltos (funciones de las coordenadas globales: se continúan de una casilla a otra y entre chunks)
  // ===================================================================
  /** Suelo base en (lx, ly) del chunk y (gx, gy) del mundo: tono, mancha, motas y, con escarcha, el ventisquero. */
  function basePx(lx, ly, gx, gy) {
    const b = BAYER[(gx & 3) | ((gy & 3) << 2)] * 0.09, o = ((ly >> 1) + 1) * W2 + (lx >> 1);
    const r = H(gx, gy, SEM + 13);
    if (r < 0.012) return C.speck;
    if (r > 0.994) return C.light;
    const m = FM[o] + b, p = FP[o] + b;
    if (p > UMB) return m < 0.40 ? C.dirt[2] : m > 0.62 ? C.dirt[1] : C.dirt[0];
    // Borde sur de un ventisquero: 1 px de sombra justo debajo de su orla tramada, donde el campo baja de UMB − BMAX
    // (por debajo ya ningún píxel es mancha). Mirar el píxel de encima con su tramado ponía sombra en toda la orla y
    // por los cuatro lados (un peine oscuro, visto a ×8).
    if (C.ventisquero && FP[o] <= UMB - BMAX && FP[(((ly - 1) >> 1) + 1) * W2 + (lx >> 1)] > UMB - BMAX) return C.speck;
    return m < 0.40 ? C.floor[2] : m > 0.62 ? C.floor[1] : C.floor[0];
  }
  /** Adoquín de 6×5 al tresbolillo (calzada y arena de adoquín). */
  function adoquinPx(gx, gy) {
    const row = Math.floor(gy / 5), sx = gx + (row & 1) * 3;
    if (md(sx, 6) === 0 || md(gy, 5) === 0) return C.senda[2];
    return C.senda[H(Math.floor(sx / 6), row, SEM + 81) < 0.5 ? 0 : 1];
  }
  /** Losa de k×k: junta losa[2] (el 35 % con acento); en la ruina, el 30 % falta y enseña la base con borde speck;
   *  con ajedrez (Corona Astral), a cuadros de dos matices con su junta (C.ajz). */
  function losaPx(lx, ly, gx, gy, k, ruina) {
    const sx = k === 8 ? gx >> 3 : Math.floor(gx / k), sy = k === 8 ? gy >> 3 : Math.floor(gy / k);
    const junta = k === 8 ? (gx & 7) === 0 || (gy & 7) === 0 : md(gx, k) === 0 || md(gy, k) === 0;
    if (ruina && H(sx, sy, SEM + 83) < 0.3) return junta ? C.speck : basePx(lx, ly, gx, gy);
    if (C.ajz) return junta ? C.ajz[2] : C.ajz[(sx + sy) & 1];
    if (junta) return C.juntasAcento && H(gx, gy, SEM + 82) < 0.35 ? C.acento : C.losa[2];
    return C.losa[H(sx, sy, SEM + 80) < 0.5 ? 0 : 1];
  }
  /** Grava de la orilla: 7 % vado[2], 13 % vado[0] y el resto shore. */
  function gravaPx(gx, gy) {
    const r = H(gx, gy, SEM + 71);
    return r < 0.07 ? C.vado[2] : r < 0.2 ? C.vado[0] : C.shore;
  }
  /** Barro cuarteado del cauce seco: grietas cada 8-9 px desplazadas por H y un 1,5 % de grava. */
  function caucePx(gx, gy) {
    if (md(gx + Math.floor(H(gy >> 3, gx >> 4, SEM + 85) * 6), 9) === 0 ||
        md(gy + Math.floor(H(gx >> 3, gy >> 4, SEM + 86) * 6), 8) === 0) return C.cauce[1];
    return H(gx, gy, SEM + 84) < 0.015 ? C.vado[2] : C.cauce[0];
  }
  /** Fondo del vado (sin las piedras, que son de su casilla): agua somera, con ondas de 4 px en el agua y la ciénaga. */
  const vadoPx = (gx, gy) => C.liquido <= 1 && H(gx >> 2, gy, SEM + 72) < 0.08 ? C.liqLight : C.vado[0];
  /** Tablones de 4 px del puente (sin las barandas): en filas (`hor`, se cruza de norte a sur) o en columnas. */
  function puentePx(gx, gy, hor) {
    const a = hor ? gy : gx, b = hor ? gx : gy, t = md(a, 4);
    if (t === 3) return C.puente[1];                                       // junta entre tablones
    if (md(b + Math.floor(H(a >> 2, 5, SEM + 78) * 16), 16) === 0) return C.puente[1];   // testas al tresbolillo
    return t === 1 && H(b >> 1, a, SEM + 77) < 0.3 ? C.puente[2] : C.puente[0];         // vetas
  }
  /** Paso de la cresta: la base con una huella tramada (cauce[0] donde Bayer < −0,2) y un 3,5 % de piedras. */
  function puertoPx(lx, ly, gx, gy) {
    const r = H(gx, gy, SEM + 83);
    return r < 0.025 ? C.rock[1] : r < 0.035 ? C.rock[0] : BAYER[(gx & 3) | ((gy & 3) << 2)] < -0.2 ? C.cauce[0] : basePx(lx, ly, gx, gy);
  }
  /** Vacío de la grieta: #0d0a18 con un 1 % de #7b3cff y un 0,3 % de #c9a6ff. */
  function vacioPx(gx, gy) {
    const r = H(gx, gy, SEM + 97);
    return r < 0.01 ? VACIO[1] : r < 0.013 ? VACIO[2] : VACIO[0];
  }
  /** Suelo de una arena según su material (tatami, chapa y grava; las losas, el adoquín y las grietas, aparte). */
  function arenaPx(lx, ly, gx, gy) {
    switch (C.suelo) {
      case 2: return losaPx(lx, ly, gx, gy, 8, false);                     // losas
      case 3: {                                                             // tatami de 16×8, la orientación alterna
        const hz = (((gx >> 4) + (gy >> 4)) & 1) === 0;
        const u = hz ? gx & 15 : gx & 7, v = hz ? gy & 7 : gy & 15;
        if (u === 0 || v === 0) return C.speck;
        return (hz ? u : v) % 3 === 0 ? C.floor[2] : C.floor[0];
      }
      case 4: {                                                             // chapa de 8×8 con remache
        const u = gx & 7, v = gy & 7;
        if (u === 0 || v === 0) return C.speck;
        if (u === 1 && v === 1) return C.light;
        return C.floor[H(gx >> 3, gy >> 3, SEM + 88) < 0.5 ? 0 : 1];
      }
      case 5:                                                               // grava: piedras de 2×2
        if (H(gx >> 1, gy >> 1, SEM + 89) < 0.06) return C.rock[2 - (gx & 1) - (gy & 1)];
        return basePx(lx, ly, gx, gy);
      case 6: return grietaPx(lx, ly, gx, gy, md(gx, 9), md(gy, 9));        // grietas
      case 7: return adoquinPx(gx, gy);                                     // adoquín
      default: return basePx(lx, ly, gx, gy);                               // pasto, ceniza y escarcha
    }
  }
  /** Grietas en una rejilla de 9: cada lado de cada celda, con un 35 % (con más, el suelo parecía un laberinto).
   *  (u, v) = (gx, gy) módulo 9. */
  function grietaPx(lx, ly, gx, gy, u, v) {
    if ((u === 0 && H((gx - u) / 9, Math.floor(gy / 9), SEM + 90) < 0.35) ||
        (v === 0 && H(Math.floor(gx / 9), (gy - v) / 9, SEM + 91) < 0.35)) return C.speck;
    return basePx(lx, ly, gx, gy);
  }
  /** Lo que enseña la esquina recortada de una pared o de un líquido: el vacío, o el suelo del vecino `f` (su
   *  subtipo, de fuente()) continuado, para que la esquina no corte su dibujo. `liq`: la esquina es de un líquido. */
  function cortePx(f, liq, lx, ly, gx, gy) {
    if (f < 0) return vacioPx(gx, gy);
    const p = f & (FILAS - 1);
    if (p === S.PUENTE || p === S.A_PUENTE) return puentePx(gx, gy, f >= FILAS);
    if (BIA) return arenaPx(lx, ly, gx, gy);
    if (f === S.LOSA || f === S.PRETIL) return losaPx(lx, ly, gx, gy, 8, false);
    if (f === S.ANILLO) return losaPx(lx, ly, gx, gy, 6, false);
    if (f === S.CALZADA) return adoquinPx(gx, gy);
    if (f === S.CAUCE) return caucePx(gx, gy);
    if (f === S.VADO) return vadoPx(gx, gy);
    if (f === S.PUERTO) return puertoPx(lx, ly, gx, gy);
    if (liq && f === S.ORILLA) return gravaPx(gx, gy);
    return basePx(lx, ly, gx, gy);
  }
  /** El vecino que manda en la esquina recortada de la casilla (i, j): −1 si uno de los dos es vacío; si no, el subtipo
   *  del primer suelo (llano si no hay). Un puente lleva además FILAS si sus tablones van en filas, mirado desde (i, j):
   *  a una casilla ve el mismo río, y su propio entorno de R casillas se saldría del faldón. */
  function fuente(i, j, a1, b1, a2, b2) {
    const k1 = kd(a1, b1), k2 = kd(a2, b2);
    if (k1 === 3 || k2 === 3) return -1;
    const f = k1 === 0 ? sb(a1, b1) : k2 === 0 ? sb(a2, b2) : S.LLANO;
    return (f === S.PUENTE || f === S.A_PUENTE) && tablasEnFilas(i, j) ? f | FILAS : f;
  }

  /** Color del líquido del bioma en (gx, gy), a distancia d de la orilla (en px), con el subtipo `sub` (las estelas). */
  function liqPx(gx, gy, d, sub) {
    const L = C.liquido;
    if (L === 2) {                                                          // hielo
      let col = d < 1 ? C.foam : d < 2 ? C.liqDeep : C.liq;
      if (d >= 2) {
        if ((gx + Math.floor(vnc(kHi1, gx / 9, gy / 9, SEM + 103) * 8)) % 11 === 0 ||
            (gy + Math.floor(vnc(kHi2, gy / 9, gx / 9, SEM + 104) * 8)) % 13 === 0) { if (H(gx, gy, SEM + 105) < 0.8) col = C.foam; }
        else if (H(gx, gy, SEM + 106) < 0.004) col = BLANCO;
      }
      return col;
    }
    if (L >= 3) {                                                           // peligro: ácido, veneno, lava y chispa
      if (d < 1) return C.foam;                                             // borde de aviso
      if (d < 2) return C.wallEdge;
      const v = vnc(kPel, gx / 6, gy / 6, SEM + 101);
      let col = L === 4 ? (Math.abs(v - 0.5) < 0.08 ? C.liq : C.liqDeep) : v > 0.56 ? C.liq : C.liqDeep;
      if (L === 5 && (gx + (gy >> 1)) % 7 === 0) col = C.foam;
      if (d >= 3 && H(gx, gy, SEM + 102) < 0.006) col = C.foam;            // burbujas
      return col;
    }
    let col = d < 1 ? C.liqLine : d < 3 ? C.liqLight : d >= 6 ? C.liqDeep : C.liq;
    if (d < 2) return col;
    if (L === 1) return H(gx >> 1, gy >> 1, SEM + 109) < 0.05 ? C.foam : col;   // ciénaga: lentejas
    // Agua del río: estelas en el sentido de la corriente (las franjas de r corren a lo largo de q).
    if (sub === S.RIO_H || sub === S.RIO_V) {
      const along = sub === S.RIO_H ? gx : gy, across = sub === S.RIO_H ? gy : gx;
      if ((along & 7) < 5 && H(across, along >> 3, SEM + 107) < 0.07) col = C.liqLight;
    } else if (sub === S.RIO_D1 || sub === S.RIO_D2) {
      // D1 (gx·gy < 0): corre hacia (1, 1); D2: hacia (1, −1). En diagonal, cada paso suma 2 a `along`.
      const along = sub === S.RIO_D1 ? gx + gy : gx - gy, across = sub === S.RIO_D1 ? gx - gy : gx + gy;
      if ((along & 15) < 10 && H(across, along >> 4, SEM + 107) < 0.07) col = C.liqLight;
    }
    if (H(gx, gy, SEM + 108) < 0.003) col = C.foam;
    return col;
  }

  // ===================================================================
  // Casillas de suelo
  // ===================================================================
  function tileBase(ox, oy, tx, ty) {
    const gx0 = tx * T, gy0 = ty * T;
    for (let y = 0; y < T; y++) {
      const ly = oy + y, gy = gy0 + y, f = ly * W + ox;
      for (let x = 0; x < T; x++) buf[f + x] = basePx(ox + x, ly, gx0 + x, gy);
    }
  }
  // Módulos de las columnas y las filas de una casilla, una vez por casilla (el `%` por píxel es lo que más cuesta).
  const MX = new Int32Array(T), MY = new Int32Array(T), M6 = new Int32Array(2 * T), C6 = new Int32Array(2 * T);
  function tileArena(ox, oy, tx, ty) {
    const gx0 = tx * T, gy0 = ty * T, m = C.suelo;
    if (m === 0 || m === 1) return tileBase(ox, oy, tx, ty);
    if (m === 7) return adoquines(ox, oy, tx, ty);
    if (m === 6) for (let k = 0; k < T; k++) { MX[k] = md(gx0 + k, 9); MY[k] = md(gy0 + k, 9); }
    for (let y = 0; y < T; y++) {
      const ly = oy + y, gy = gy0 + y, f = ly * W + ox;
      if (m === 6) for (let x = 0; x < T; x++) buf[f + x] = grietaPx(ox + x, ly, gx0 + x, gy, MX[x], MY[y]);
      else for (let x = 0; x < T; x++) buf[f + x] = arenaPx(ox + x, ly, gx0 + x, gy);
    }
  }
  /** Adoquines de una casilla (como adoquinPx, con los módulos de la casilla calculados una vez). */
  function adoquines(ox, oy, tx, ty) {
    const gx0 = tx * T, gy0 = ty * T;
    for (let p = 0; p < 2; p++) for (let x = 0; x < T; x++) { const sx = gx0 + x + p * 3; M6[p * T + x] = md(sx, 6); C6[p * T + x] = Math.floor(sx / 6); }
    for (let y = 0; y < T; y++) {
      const gy = gy0 + y, row = Math.floor(gy / 5), f = (oy + y) * W + ox, o = (row & 1) * T;
      if (gy - row * 5 === 0) { for (let x = 0; x < T; x++) buf[f + x] = C.senda[2]; continue; }
      for (let x = 0; x < T; x++) buf[f + x] = M6[o + x] === 0 ? C.senda[2] : C.senda[H(C6[o + x], row, SEM + 81) < 0.5 ? 0 : 1];
    }
  }

  /** Motivo del bioma en el 12 % de las casillas y, en el 0,3 % del llano, una estaca de topógrafo. Dentro de su casilla. */
  function motivo(ox, oy, tx, ty, sub) {
    if (!C.motivo) return;
    if (sub === S.LLANO && H(tx, ty, SEM + 19) < 0.003) {
      // Estaca: palo de 1×4 (claro y oscuro alternos) con banderín cian de 2×2; nunca rojo (no es un disparo).
      const x = ox + 5 + Math.floor(H(tx, ty, SEM + 20) * 5), y = oy + 4 + Math.floor(H(tx, ty, SEM + 21) * 6);
      for (let k = 0; k < 4; k++) buf[(y + k) * W + x] = k & 1 ? C.wallEdge : PALO;
      buf[y * W + x + 1] = buf[y * W + x + 2] = buf[(y + 1) * W + x + 1] = buf[(y + 1) * W + x + 2] = BANDERIN;
      buf[(y + 4) * W + x + 1] = C.speck;
      return;
    }
    const d = H(tx, ty, SEM + 14);
    if (d >= 0.12) return;
    const p = (oy + 4 + Math.floor(H(tx, ty, SEM + 16) * 9)) * W + ox + 3 + Math.floor(H(tx, ty, SEM + 15) * 10);
    if (C.motivo === 1) {                                                   // Alba
      if (d < 0.06) { buf[p] = buf[p - W - 1] = buf[p - W + 1] = C.acento; buf[p + W] = C.speck; }                 // trébol
      else if (d < 0.085) { buf[p] = buf[p + 1] = C.flowers[Math.floor(H(tx, ty, SEM + 17) * 3)]; buf[p + W] = C.speck; }   // flor
      else { buf[p] = C.rock[2]; buf[p + 1] = C.rock[1]; buf[p + W] = C.rock[0]; buf[p + W + 1] = C.speck; }     // guijarro
    } else if (C.motivo === 2) {                                            // Helada
      if (d < 0.07) { buf[p] = C.flowers[0]; buf[p - 1] = buf[p + 1] = buf[p - W] = buf[p + W] = C.light; }      // estrella de escarcha
      else for (let t = 0; t < 5; t++) buf[p - 2 + t + (t >> 1) * W] = C.speck;                               // grieta
    } else {                                                                // Sulfúrea
      if (d < 0.06) buf[p] = buf[p + 1] = buf[p - W + 2] = buf[p + W - 1] = buf[p + W + 1] = C.speck;             // barro cuarteado
      else if (d < 0.10) { buf[p] = buf[p + 1] = buf[p + W] = C.speck; buf[p + W + 1] = C.light; }              // burbuja
      else buf[p] = C.flowers[0];                                           // cristal de azufre
    }
  }

  function calzada(i, j, ox, oy, tx, ty) {
    adoquines(ox, oy, tx, ty);
    // Bordillo de 1 px donde linda con suelo que no es calzada, puente ni plaza.
    const borde = (a, b) => kd(a, b) === 0 && !SIN_BORDILLO[sb(a, b)];
    const BC = C.speck;
    if (borde(i - 1, j)) for (let y = 0; y < T; y++) buf[(oy + y) * W + ox] = BC;
    if (borde(i + 1, j)) for (let y = 0; y < T; y++) buf[(oy + y) * W + ox + T - 1] = BC;
    if (borde(i, j - 1)) for (let x = 0; x < T; x++) buf[oy * W + ox + x] = BC;
    if (borde(i, j + 1)) for (let x = 0; x < T; x++) buf[(oy + T - 1) * W + ox + x] = BC;
  }

  /** ¿Tablones en filas (el puente se cruza de norte a sur)? Lo dice el río que cruza: el subtipo del líquido a R casillas
   *  o menos (RIO_H corre en horizontal: se cruza de norte a sur, tablones en filas; RIO_V, en columnas). Todas las
   *  casillas de un puente ven el mismo río, así que van iguales (mirar sólo su fila y su columna mezclaba las dos
   *  orientaciones en los puentes en diagonal). Río en diagonal, o ninguno: según las calzadas de la partida. */
  function tablasEnFilas(i, j) {
    let h = 0, v = 0, dg = 0;
    for (let b = -R; b <= R; b++) for (let a = -R; a <= R; a++) {
      if (kd(i + a, j + b) !== 2) continue;
      const s = sb(i + a, j + b);
      if (s === S.RIO_H) h++; else if (s === S.RIO_V) v++; else if (s === S.RIO_D1 || s === S.RIO_D2) dg++;
    }
    if (h > v && h >= dg) return true;
    if (v > h && v >= dg) return false;
    if (dg || h || v) return TABLAS_H;
    // Sin río con dirección (el foso de una arena): como antes, por dónde está el líquido.
    let fila = false, columna = false;
    for (let a = 1; a <= R && !fila; a++) fila = kd(i - a, j) === 2 || kd(i + a, j) === 2;
    for (let b = 1; b <= R && !columna; b++) columna = kd(i, j - b) === 2 || kd(i, j + b) === 2;
    return fila !== columna ? fila : TABLAS_H;
  }
  function puente(i, j, ox, oy, tx, ty) {
    const hor = tablasEnFilas(i, j), gx0 = tx * T, gy0 = ty * T;
    for (let y = 0; y < T; y++) {
      const f = (oy + y) * W + ox;
      for (let x = 0; x < T; x++) buf[f + x] = puentePx(gx0 + x, gy0 + y, hor);
    }
    // Barandas (1 px wallEdge y 1 px puente[2]) en los lados que dan al líquido.
    const L = (a, b) => kd(a, b) === 2, E = C.wallEdge, P2 = C.puente[2];
    if (L(i - 1, j)) for (let y = 0; y < T; y++) { const f = (oy + y) * W + ox; buf[f] = E; buf[f + 1] = P2; }
    if (L(i + 1, j)) for (let y = 0; y < T; y++) { const f = (oy + y) * W + ox; buf[f + T - 1] = E; buf[f + T - 2] = P2; }
    if (L(i, j - 1)) for (let x = 0; x < T; x++) { buf[oy * W + ox + x] = E; buf[(oy + 1) * W + ox + x] = P2; }
    if (L(i, j + 1)) for (let x = 0; x < T; x++) { buf[(oy + T - 1) * W + ox + x] = E; buf[(oy + T - 2) * W + ox + x] = P2; }
  }

  function vado(ox, oy, tx, ty) {
    // Agua somera (vadoPx) y dos piedras pasaderas de 7×5, luz arriba y sombra abajo.
    const gx0 = tx * T, gy0 = ty * T;
    for (let y = 0; y < T; y++) {
      const f = (oy + y) * W + ox;
      for (let x = 0; x < T; x++) buf[f + x] = vadoPx(gx0 + x, gy0 + y);
    }
    for (let s = 0; s < 2; s++) {
      const cx = 4 + Math.floor(H(tx, ty, SEM + 73 + s) * 8), cy = 3 + s * 7 + Math.floor(H(tx, ty, SEM + 75 + s) * 3);
      for (let y = -2; y <= 2; y++) for (let x = -3; x <= 3; x++) {
        if (x * x * 4 + y * y * 9 > 36) continue;
        buf[(oy + cy + y) * W + ox + cx + x] = y <= -1 ? C.vado[2] : y >= 2 ? C.speck : C.vado[1];
      }
    }
  }

  function orilla(i, j, ox, oy, tx, ty) {
    // Grava en los 5 px que dan al río (líquido, vado o cauce), con el borde tramado.
    const A = (a, b) => { const k = kd(i + a, j + b); return k === 2 || (k === 0 && RIO_SECO[sb(i + a, j + b)] === 1); };
    const n = A(0, -1), s = A(0, 1), w = A(-1, 0), e = A(1, 0), nw = A(-1, -1), ne = A(1, -1), sw = A(-1, 1), se = A(1, 1);
    if (!(n || s || w || e || nw || ne || sw || se)) return;
    const gx0 = tx * T, gy0 = ty * T;
    for (let y = 0; y < T; y++) {
      const f = (oy + y) * W + ox, gy = gy0 + y, yb = 15 - y;
      for (let x = 0; x < T; x++) {
        const xb = 15 - x;
        let d = 99;
        if (n && y < d) d = y;
        if (s && yb < d) d = yb;
        if (w && x < d) d = x;
        if (e && xb < d) d = xb;
        if (nw) d = Math.min(d, Math.max(x, y));
        if (ne) d = Math.min(d, Math.max(xb, y));
        if (sw) d = Math.min(d, Math.max(x, yb));
        if (se) d = Math.min(d, Math.max(xb, yb));
        if (d >= 8) continue;
        const gx = gx0 + x;
        if (d < 5 + BAYER[(gx & 3) | ((gy & 3) << 2)] * 4) buf[f + x] = gravaPx(gx, gy);
      }
    }
  }

  function cauce(ox, oy, tx, ty) {
    const gx0 = tx * T, gy0 = ty * T;
    for (let y = 0; y < T; y++) { const f = (oy + y) * W + ox; for (let x = 0; x < T; x++) buf[f + x] = caucePx(gx0 + x, gy0 + y); }
  }

  function puerto(ox, oy, tx, ty) {
    const gx0 = tx * T, gy0 = ty * T;
    for (let y = 0; y < T; y++) {
      const ly = oy + y, f = ly * W + ox;
      for (let x = 0; x < T; x++) buf[f + x] = puertoPx(ox + x, ly, gx0 + x, gy0 + y);
    }
  }

  function losas(ox, oy, tx, ty, k, ruina) {
    const gx0 = tx * T, gy0 = ty * T;
    for (let y = 0; y < T; y++) {
      const ly = oy + y, f = ly * W + ox;
      for (let x = 0; x < T; x++) buf[f + x] = losaPx(ox + x, ly, gx0 + x, gy0 + y, k, ruina);
    }
  }
  const esRuina = (tx, ty) => { const st = typeof G.Mapas.sitio === 'function' && G.Mapas.sitio(tx, ty, SEM); return !!st && st.tipo === 'ruina'; };

  function pretil(i, j, ox, oy) {
    // Canto de 2 px hacia la pila: luz (losa[0]) por fuera y wallEdge junto al agua. En las esquinas, un 2×2.
    const L = (a, b) => kd(a, b) === 2, Lz = C.losa[0], E = C.wallEdge;
    const n = L(i, j - 1), s = L(i, j + 1), w = L(i - 1, j), e = L(i + 1, j);
    if (n) for (let x = 0; x < T; x++) { buf[oy * W + ox + x] = E; buf[(oy + 1) * W + ox + x] = Lz; }
    if (s) for (let x = 0; x < T; x++) { buf[(oy + T - 1) * W + ox + x] = E; buf[(oy + T - 2) * W + ox + x] = Lz; }
    if (w) for (let y = 0; y < T; y++) { const f = (oy + y) * W + ox; buf[f] = E; buf[f + 1] = Lz; }
    if (e) for (let y = 0; y < T; y++) { const f = (oy + y) * W + ox; buf[f + T - 1] = E; buf[f + T - 2] = Lz; }
    const esquina = (px, py, qx, qy) => { buf[(oy + qy) * W + ox + qx] = Lz; buf[(oy + py) * W + ox + qx] = Lz; buf[(oy + qy) * W + ox + px] = Lz; buf[(oy + py) * W + ox + px] = E; };
    if (!n && !w && L(i - 1, j - 1)) esquina(0, 0, 1, 1);
    if (!n && !e && L(i + 1, j - 1)) esquina(T - 1, 0, T - 2, 1);
    if (!s && !w && L(i - 1, j + 1)) esquina(0, T - 1, 1, T - 2);
    if (!s && !e && L(i + 1, j + 1)) esquina(T - 1, T - 1, T - 2, T - 2);
  }

  function plaza(ox, oy, tx, ty) {
    // Mosaico de la salida, centrado en la casilla (0, 0): anillos alternos por r² en bandas de 400 px², rosa de 8 rayos
    // y disco central.
    const gx0 = tx * T, gy0 = ty * T;
    for (let y = 0; y < T; y++) {
      const f = (oy + y) * W + ox, b = gy0 + y - 8;
      for (let x = 0; x < T; x++) {
        const a = gx0 + x - 8, r2 = a * a + b * b;
        buf[f + x] = r2 < 36 ? C.wallTop[1] : a === 0 || b === 0 || a === b || a === -b ? C.flowers[0]
          : (Math.floor(r2 / 400) & 1) ? C.losa[2] : C.losa[0];
      }
    }
  }

  /** Triángulo de 5 px del líquido en la esquina (fx, fy) de una casilla de suelo, con el color del líquido a su
   *  distancia de la orilla (la hipotenusa es el borde). */
  function triangulo(ox, oy, tx, ty, fx, fy) {
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5 - y; x++) {
      const px = fx ? T - 1 - x : x, py = fy ? T - 1 - y : y, o = (oy + py) * W + ox + px;
      buf[o] = liqPx(tx * T + px, ty * T + py, 4 - x - y, -1);
      msk[o] = 0;                                                           // líquido: Dex no lo gradúa como suelo
    }
  }
  function triangulos(i, j, ox, oy, tx, ty) {
    const n = kd(i, j - 1) === 2, s = kd(i, j + 1) === 2, w = kd(i - 1, j) === 2, e = kd(i + 1, j) === 2;
    if (n && w) triangulo(ox, oy, tx, ty, 0, 0);
    if (n && e) triangulo(ox, oy, tx, ty, 1, 0);
    if (s && w) triangulo(ox, oy, tx, ty, 0, 1);
    if (s && e) triangulo(ox, oy, tx, ty, 1, 1);
  }

  /** Sombra arrojada: 2 filas bajo una pared al norte y 2 columnas tramadas al este de una pared al oeste. */
  function sombra(i, j, ox, oy, tx, ty) {
    if (kd(i, j - 1) === 1) {
      const f = oy * W + ox;
      for (let x = 0; x < T; x++) { buf[f + x] = C.wallFaceDark; if (((tx * T + x) & 1) === 0) buf[f + W + x] = C.speck; }
    }
    if (kd(i - 1, j) === 1) {
      for (let y = 0; y < T; y++) { const f = (oy + y) * W + ox; buf[f] = C.speck; if (((ty * T + y) & 1) === 0) buf[f + 1] = C.speck; }
    }
  }

  function suelo(i, j, ox, oy, tx, ty, sub) {
    switch (sub) {
      case S.CALZADA: calzada(i, j, ox, oy, tx, ty); break;
      case S.PUENTE: case S.A_PUENTE: puente(i, j, ox, oy, tx, ty); break;
      case S.VADO: vado(ox, oy, tx, ty); break;
      case S.ORILLA: tileBase(ox, oy, tx, ty); orilla(i, j, ox, oy, tx, ty); break;
      case S.CAUCE: cauce(ox, oy, tx, ty); break;
      case S.PUERTO: puerto(ox, oy, tx, ty); break;
      case S.LOSA: losas(ox, oy, tx, ty, 8, esRuina(tx, ty)); break;
      case S.ANILLO: losas(ox, oy, tx, ty, 6, false); break;
      case S.PRETIL: losas(ox, oy, tx, ty, 8, false); pretil(i, j, ox, oy); break;
      case S.PLAZA: plaza(ox, oy, tx, ty); break;
      default:                                                              // llano, arcén y explanada (y el suelo de la arena)
        if (BIA) tileArena(ox, oy, tx, ty);
        else { tileBase(ox, oy, tx, ty); motivo(ox, oy, tx, ty, sub); }
    }
    if (TRI[sub]) triangulos(i, j, ox, oy, tx, ty);
    if (!CRUCE[sub]) sombra(i, j, ox, oy, tx, ty);
  }

  // ===================================================================
  // Paredes
  // ===================================================================
  function techoPx(mat, x, gx, gy) {
    switch (mat) {
      case 0: {                                                             // estratos: bandas de 3 px y un 4 % de luz
        if (H(gx, gy, SEM + 94) < 0.04) return C.wallLight;
        return C.wallTop[md(Math.floor((gy + EST[x]) / 3), 3)];
      }
      case 1:                                                               // facetas: bloques de 4×4 y diagonales de luz
        if (md(gx - gy, 13) === 0 && H(gx, gy, SEM + 98) < 0.75) return C.wallLight;
        return C.wallTop[Math.floor(H(gx >> 2, gy >> 2, SEM + 95) * 3)];
      case 2: {                                                             // basalto: panal de columnas de 5×5
        const ci = Math.floor(gx / 5), sy = gy + (ci & 1) * 2, u = md(gx, 5), v = md(sy, 5);
        if (u === 4 || v === 4) return C.wallFaceDark;
        if (u === 0 || v === 0) return C.wallLight;
        return C.wallTop[Math.floor(H(ci, Math.floor(sy / 5), SEM + 96) * 3)];
      }
      case 4: {                                                             // tablas verticales de 4 px
        const pl = Math.floor(gx / 4);
        if (md(gx, 4) === 0 || md(gy + Math.floor(H(pl, 0, SEM + 87) * 12), 12) === 0) return C.wallEdge;
        return C.wallTop[Math.floor(H(pl, 3, SEM + 86) * 3)];
      }
      default: {                                                            // sillar de 8×5 al tresbolillo
        const row = Math.floor(gy / 5), sx = gx + (row & 1) * 4;
        if (md(sx, 8) === 0 || md(gy, 5) === 0) return C.wallEdge;
        return C.ruina[Math.floor(H(Math.floor(sx / 8), row, SEM + 92) * 3)];
      }
    }
  }
  function caraPx(mat, gx, fy) {
    switch (mat) {
      case 0: return fy & 2 ? C.wallFace[1] : C.wallFace[0];                 // estratos: bandas de 2 px
      case 1: return md(gx, 3) === 0 ? C.wallFace[1] : C.wallFace[0];        // facetas: vetas cada 3 px
      case 2: return md(gx, 3) === 0 ? C.wallFaceDark : fy < 2 ? C.wallFace[0] : C.wallFace[1];   // basalto: columnas
      case 4: return md(gx, 4) === 0 ? C.wallFaceDark : C.wallFace[Math.floor(gx / 4) & 1];       // tablas
      default: {                                                            // sillar: hiladas de 4 px, juntas cada 8
        const hy = fy >> 2;
        if ((fy & 3) === 0 || md(gx + (hy & 1) * 4, 8) === 0) return C.wallFaceDark;
        return C.wallFace[(Math.floor(gx / 8) + hy) & 1];
      }
    }
  }
  /** Filas 1-2 del borde norte (sin pared al norte): musgo, nieve, costra de azufre o luz. */
  function bordeNorte(mat, gx, y, col) {
    switch (mat) {
      case 0: return H(gx, 1, SEM + 97) < 0.5 ? C.acento : C.wallLight;
      case 1: return C.acento;
      case 2: return H(gx, 2, SEM + 99) < 0.3 ? C.acento : C.wallLight;
      default: return y === 1 ? C.wallLight : col;
    }
  }
  function pared(i, j, ox, oy, tx, ty, sub) {
    const n = kd(i, j - 1) === 1, s = kd(i, j + 1) === 1, w = kd(i - 1, j) === 1, e = kd(i + 1, j) === 1;
    const top = s ? T : T - 8;                                              // cara de 8 px si al sur no hay pared
    const mat = !BIA && (sub === S.MURO || sub === S.COLUMNA) ? 3 : C.pared;
    // La cara lleva borde donde se acaba o donde el vecino no tiene cara (su sur es pared).
    const bW = !w || kd(i - 1, j + 1) === 1, bE = !e || kd(i + 1, j + 1) === 1;
    const cNW = !n && !w, cNE = !n && !e, cSW = !s && !w, cSE = !s && !e;
    const fNW = cNW ? fuente(i, j, i, j - 1, i - 1, j) : 0, fNE = cNE ? fuente(i, j, i, j - 1, i + 1, j) : 0;
    const fSW = cSW ? fuente(i, j, i, j + 1, i - 1, j) : 0, fSE = cSE ? fuente(i, j, i, j + 1, i + 1, j) : 0;
    // Abajo, con suelo con sombra debajo, la fila inferior del recorte es la de esa sombra (sombra(): wallFaceDark): si
    // no, quedaba una muesca clara entre la cara y la sombra.
    const somS = kd(i, j + 1) === 0 && !CRUCE[sb(i, j + 1)], sSW = somS && fSW >= 0, sSE = somS && fSE >= 0;
    const gx0 = tx * T, gy0 = ty * T;
    if (mat === 0) for (let x = 0; x < T; x++) EST[x] = Math.floor(vnc(kEst, (gx0 + x) / 7, 0.5, SEM + 93) * 4);
    for (let y = 0; y < T; y++) {
      const ly = oy + y, gy = gy0 + y, f = ly * W + ox;
      for (let x = 0; x < T; x++) {
        const gx = gx0 + x, lx = ox + x;
        // Esquinas exteriores escalonadas (3-2-1 arriba, 2-1 abajo): enseñan lo de al lado (en la máscara, suelo).
        if (cNW && y < 3 && x < 3 - y) { buf[f + x] = cortePx(fNW, false, lx, ly, gx, gy); msk[f + x] = fNW < 0 ? 0 : 1; continue; }
        if (cNE && y < 3 && x > 12 + y) { buf[f + x] = cortePx(fNE, false, lx, ly, gx, gy); msk[f + x] = fNE < 0 ? 0 : 1; continue; }
        if (cSW && y > 13 && x < y - 13) {
          buf[f + x] = sSW && y === T - 1 ? C.wallFaceDark : cortePx(fSW, false, lx, ly, gx, gy); msk[f + x] = fSW < 0 ? 0 : 1; continue;
        }
        if (cSE && y > 13 && x > 28 - y) {
          buf[f + x] = sSE && y === T - 1 ? C.wallFaceDark : cortePx(fSE, false, lx, ly, gx, gy); msk[f + x] = fSE < 0 ? 0 : 1; continue;
        }
        let col;
        if (y >= top) {                                                     // cara
          const fy = y - top;
          col = fy === 0 ? C.wallEdge : y === T - 1 ? (mat === 1 && md(gx, 3) === 1 ? C.acento : C.wallFaceDark) : caraPx(mat, gx, fy);
          if ((x === 0 && bW) || (x === T - 1 && bE)) col = C.wallEdge;
        } else {                                                            // techo
          col = techoPx(mat, x, gx, gy);
          if (!n && y < 3) col = y === 0 ? C.wallEdge : bordeNorte(mat, gx, y, col);
          if ((x === 0 && !w) || (x === T - 1 && !e)) col = C.wallEdge;
        }
        buf[f + x] = col;
      }
    }
  }

  // ===================================================================
  // Líquidos
  // ===================================================================
  function liquido(i, j, ox, oy, tx, ty, sub) {
    const L = (a, b) => kd(a, b) === 2;
    const n = L(i, j - 1), s = L(i, j + 1), w = L(i - 1, j), e = L(i + 1, j);
    const nw = L(i - 1, j - 1), ne = L(i + 1, j - 1), sw = L(i - 1, j + 1), se = L(i + 1, j + 1);
    const tri = (a, b) => kd(a, b) === 0 && TRI[sb(a, b)] === 1;           // ¿ese suelo pinta sus triángulos?
    // Orillas con el triángulo del vecino en un extremo: ahí la orilla va en diagonal (dentro del vecino).
    const tN = !n && tri(i, j - 1), tS = !s && tri(i, j + 1), tW = !w && tri(i - 1, j), tE = !e && tri(i + 1, j);
    const nTW = tN && nw, nTE = tN && ne, sTW = tS && sw, sTE = tS && se, wTN = tW && nw, wTS = tW && sw, eTN = tE && ne, eTS = tE && se;
    // Esquinas exteriores cortadas en diagonal (5 px), salvo en la pila de la fuente (cuadrada, con su pretil), si el
    // líquido sigue en diagonal o si a un lado hay un cruce (vado o puente): el río sigue por debajo y el recorte
    // enseñaba una cuña de hierba entre el agua y las piedras o los tablones.
    const pila = sub === S.PILA, cruce = (a, b) => kd(a, b) === 0 && CRUCE[sb(a, b)] === 1;
    const xN = cruce(i, j - 1), xS = cruce(i, j + 1), xW = cruce(i - 1, j), xE = cruce(i + 1, j);
    const cNW = !pila && !n && !w && !nw && !xN && !xW, cNE = !pila && !n && !e && !ne && !xN && !xE;
    const cSW = !pila && !s && !w && !sw && !xS && !xW, cSE = !pila && !s && !e && !se && !xS && !xE;
    // Esquinas interiores sin triángulo al otro lado (una pared, un vacío o un cruce en diagonal).
    const iNW = n && w && !nw && !tri(i - 1, j - 1), iNE = n && e && !ne && !tri(i + 1, j - 1);
    const iSW = s && w && !sw && !tri(i - 1, j + 1), iSE = s && e && !se && !tri(i + 1, j + 1);
    const fNW = cNW ? fuente(i, j, i, j - 1, i - 1, j) : 0, fNE = cNE ? fuente(i, j, i, j - 1, i + 1, j) : 0;
    const fSW = cSW ? fuente(i, j, i, j + 1, i - 1, j) : 0, fSE = cSE ? fuente(i, j, i, j + 1, i + 1, j) : 0;
    const mNW = fNW < 0 ? 0 : 1, mNE = fNE < 0 ? 0 : 1, mSW = fSW < 0 ? 0 : 1, mSE = fSE < 0 ? 0 : 1;   // máscara de suelo
    const gx0 = tx * T, gy0 = ty * T;
    for (let y = 0; y < T; y++) {
      const ly = oy + y, gy = gy0 + y, f = ly * W + ox, yb = 15 - y;
      for (let x = 0; x < T; x++) {
        const gx = gx0 + x, lx = ox + x, xb = 15 - x;
        if (cNW && x + y < 5) { buf[f + x] = cortePx(fNW, true, lx, ly, gx, gy); msk[f + x] = mNW; continue; }
        if (cNE && xb + y < 5) { buf[f + x] = cortePx(fNE, true, lx, ly, gx, gy); msk[f + x] = mNE; continue; }
        if (cSW && x + yb < 5) { buf[f + x] = cortePx(fSW, true, lx, ly, gx, gy); msk[f + x] = mSW; continue; }
        if (cSE && xb + yb < 5) { buf[f + x] = cortePx(fSE, true, lx, ly, gx, gy); msk[f + x] = mSE; continue; }
        // Distancia a la orilla (en px; 0 = el píxel que la toca), con los triángulos de los vecinos.
        let d = 99, t;
        if (!n) { t = y; if (nTW && 5 + y - x > t) t = 5 + y - x; if (nTE && x + y - 10 > t) t = x + y - 10; if (t < d) d = t; }
        if (!s) { t = yb; if (sTW && 20 - x - y > t) t = 20 - x - y; if (sTE && 5 + x - y > t) t = 5 + x - y; if (t < d) d = t; }
        if (!w) { t = x; if (wTN && 5 + x - y > t) t = 5 + x - y; if (wTS && x + y - 10 > t) t = x + y - 10; if (t < d) d = t; }
        if (!e) { t = xb; if (eTN && 20 - x - y > t) t = 20 - x - y; if (eTS && 5 - x + y > t) t = 5 - x + y; if (t < d) d = t; }
        if (cNW && x + y - 5 < d) d = x + y - 5;
        if (cNE && xb + y - 5 < d) d = xb + y - 5;
        if (cSW && x + yb - 5 < d) d = x + yb - 5;
        if (cSE && xb + yb - 5 < d) d = xb + yb - 5;
        if (iNW && x + y < d) d = x + y;
        if (iNE && xb + y < d) d = xb + y;
        if (iSW && x + yb < d) d = x + yb;
        if (iSE && xb + yb < d) d = xb + yb;
        buf[f + x] = liqPx(gx, gy, d, sub);
      }
    }
  }

  function vacio(ox, oy, tx, ty) {
    const gx0 = tx * T, gy0 = ty * T;
    for (let y = 0; y < T; y++) { const f = (oy + y) * W + ox; for (let x = 0; x < T; x++) buf[f + x] = vacioPx(gx0 + x, gy0 + y); }
  }

  // ===================================================================
  // El chunk
  // ===================================================================
  /**
   * Pinta el chunk (cx, cy) de n×n casillas del bioma `bi` con la semilla `seed`: el sustituto de G.Tiles.paintChunk.
   * Termina con la gradación de entorno.js (sólo con Dex y sólo en los píxeles de suelo de la máscara: las casillas de
   * suelo, sin los triángulos de líquido, más los recortes de las esquinas de las paredes y los líquidos) y devuelve el
   * lienzo.
   */
  function pintar(cx, cy, n, at, dirtField, bi, seed = 0) {
    const Px = Pix(n * T, n * T);
    buf = Px.buf; msk = Px.msk; W = n * T; SEM = +seed || 0;
    const m32 = new Uint32Array(msk.buffer);                               // la máscara de 4 en 4 px (T y ox, múltiplos de 4)
    C = colores(bi);
    BIA = bi >= ARENA;
    UMB = C.escarcha ? 0.71 : 0.66;
    // Tablones de los puentes que no ven su río: perpendiculares a las calzadas de la partida (DIRS[floor(H(S,7,3)·8)]
    // de mapas.js; las direcciones 0, 1 y 7 van casi en horizontal, así que el puente se cruza de este a oeste).
    const dir = Math.floor(hash(SEM, 7, 3) * 8);
    TABLAS_H = !(dir === 0 || dir === 1 || dir === 7);
    // La arena de world.js, que es la que recibe terrainRaw. arenaActual() de mapas.js es la última que le llegó: justo
    // tras reset() o setArena() puede ser la de antes hasta la primera consulta del terreno (sólo sin G.World).
    const A = G.World ? G.World.arena || null : typeof G.Mapas.arenaActual === 'function' ? G.Mapas.arenaActual() : null;
    leerCodigos(cx, cy, n, SEM, A, BIA && A ? A : null);
    const tx0 = cx * n, ty0 = cy * n;
    campos(tx0, ty0, n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const o = (j + R) * GW + i + R, k = kin[o], sub = cod[o] >> 2, ox = i * T, oy = j * T, tx = tx0 + i, ty = ty0 + j;
      if (k === 0) {                                                        // máscara: toda la casilla, antes de sus triángulos
        for (let y = 0, p = (oy * W + ox) >> 2; y < T; y++, p += W >> 2) for (let q = 0; q < T >> 2; q++) m32[p + q] = 0x01010101;
        suelo(i, j, ox, oy, tx, ty, sub);
      } else if (k === 1) pared(i, j, ox, oy, tx, ty, sub);
      else if (k === 2) liquido(i, j, ox, oy, tx, ty, sub);
      else vacio(ox, oy, tx, ty);
    }
    if (G.Entorno) G.Entorno.gradar(Px, cx, cy, n, typeof at === 'function' ? at : (x, y) => KIND[G.Mapas.codigo(x, y, SEM, A) & 3], bi);
    buf = msk = null;
    return Px.canvas();
  }

  G.Mapas.pintar = pintar;
  G.Mapas.paintChunkUpstream = G.Tiles.paintChunk;   // el de tiles.js, por si hay que compararlo en el mismo reino (coste, bytes)
  if (G.Mapas.activo) G.Tiles.paintChunk = pintar;
})();
