/* ============ mapas-sprites.js — objetos del escenario de los mapas propios (MOD nico) ============
 * Petición de Nico del 14-10-2026 («no deben parecerse a los mapas originales»), especificación «Valles y calzadas» §6.
 * Sustituye a G.Tiles.propSprite (tiles.js) sólo con G.MODS.mapasPropios (G.Mapas.activo): los mismos tipos, variantes y
 * anclas, dibujos nuevos. Lo que no reconoce (la grieta, 'rift', que pinta rift.js) va al de tiles.js.
 *
 *   tree      por el `prop` del bioma: álamo 14×38 (Vega del Alba: copa columnar estrecha, tapa poco), abeto 20×38
 *             (Vega Helada: 4 pisos con nieve), seta 22×32 (Vega Sulfúrea: sombrero petróleo con láminas y lunares). Y
 *             los de arena: columna 12×40 (fuste acanalado con los tonos de su pared y hiedra al pie), cristal 22×36
 *             (4 prismas) y seco 24×38 (tronco retorcido con 3 horquillas). El original medía hasta 30×40 (6 discos).
 *   rock      piedra erguida 14×17 (la original, un peñasco de 22×17): luz en las 2 columnas de la izquierda, sombra en
 *             las 2 de la derecha y casquete del `acento` del bioma (musgo, nieve, costra de azufre; en una arena, su
 *             hierba). Variante 1 (dañada): grieta en diagonal y la esquina NE desconchada.
 *   grass     12×16: espadañas con 2 espigas (Alba), hierba helada (Helada y las arenas sin estilo propio) o cañas
 *             muertas con 2 puntas lima (Sulfúrea). Variante 1 (mecida): el tercio de arriba, 1 px a la derecha.
 *   chest     16×14, cofre del tesoro: tapa en el rojo de Rotom que sobresale 1 px, junta, dos flejes dorados, madera
 *             y el cierre dorado con la lente cian.
 *   bigchest  24×20, el mismo cofre en grande y más rico: tapa roja abombada, flejes y zócalo dorados, y un candado de
 *             10×9 en el centro (arco de acero, cuerpo de oro con la lente cian y la cerradura).
 *   altar     18×27, tótem de piedra con tejadillo, el orbe de su poder arriba (centro en (9, 10), dentro del halo) y, en la
 *             hornacina, su glifo de 6×6: llama (Furia), rayo (Rayo), imán en U (Imán) y reloj de arena (Prisa). Piedra
 *             propia (se lee en los 21 suelos) con el `acento` del bioma en el zócalo. Variante = poder·2 + usado; los 4
 *             colores de interact.js (POWERS) en el orbe y, gastado, orbe y glifo grises.
 *   Los tres se dibujan con mapas de píxeles a mano (cada carácter, un papel de color de su paleta), no con fórmulas.
 *   spring    32×16, poza octogonal con brocal de 2 px de la roca del bioma; el agua curativa conserva su cian.
 *             Variante 1 = agotada (los mismos azules apagados que el original).
 *   trap      14×14, placa redonda (radio 6) con el aro de su color (veneno, pegajosa y explosiva, como el original) y su
 *             símbolo de 5×5. Variante = tipo de trampa.
 *
 * Mismo contrato que los PAINT de tiles.js: se pinta a resolución de arte en un ImageData (createImageData/putImageData),
 * con contorno de 1 px alrededor de todo lo opaco; ninguno mide más que el original de su tipo, y las anclas son las de
 * drawProp (world.js): la última fila de un objeto de pie es el contorno bajo sus pies (en p.y, que es TS − 4 en su
 * casilla), la de la hierba es la base de los tallos (+4) y los planos (manantial, trampa) van centrados en p.y − 8. El
 * orbe del altar queda dentro del halo que pinta drawProp alrededor de (ancho/2, 10) en px de arte, de radio 6,5 (el
 * original asomaba por encima); el color exacto de su poder sólo está en el orbe (el glifo va aclarado un 12 %).
 *
 * Los colores salen de G.Tiles.BIOMES[bi] al pintar (mapas.js ya los ha puesto: los 3 biomas de G.MapasDatos y las 18
 * arenas derivadas como arenaBiome), con caché propia por bioma, tipo y variante. Se vacía con G.Tiles.clearProps (que
 * se envuelve: lo llama entorno.js al cambiar de estilo). Todo es función pura de la paleta, el tipo y la variante:
 * G.U.hash para la textura y nada al azar: los dos jugadores ven el mismo dibujo.
 */
(() => {
  const M = G.Mapas;
  if (!M) return;                       // sin mapas.js no hay mapas propios: los objetos del proyecto base
  const TI = G.Tiles;
  const H = (x, y, s) => G.U.hash(x, y, s);

  // ---------------- píxeles (como tiles.js) ----------------
  function rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  /** Empaquetado ABGR (little-endian) para el Uint32Array del ImageData. */
  function pack(hex, a = 255) {
    const [r, g, b] = rgb(hex);
    return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  }
  const packs = lista => lista.map(h => pack(h));
  /** Mezcla dos colores hex y devuelve el empaquetado (mixPack de tiles.js). */
  function mezcla(h1, h2, t) {
    const a = rgb(h1), b = rgb(h2), c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return ((255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;
  }

  /** Lienzo de píxeles: set(x, y, color) (0 = transparente), get y canvas() al final. */
  function Pix(w, h) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    const img = c.createImageData(w, h);
    const buf = new Uint32Array(img.data.buffer);
    return {
      w, h,
      set(x, y, col) { if (x >= 0 && y >= 0 && x < w && y < h) buf[y * w + x] = col; },
      get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? buf[y * w + x] : 0; },
      canvas() { c.putImageData(img, 0, 0); return cv; }
    };
  }
  const opaco = (P, x, y) => (P.get(x, y) >>> 24) !== 0;

  /** Contorno de 1 px (vecindad de 4) alrededor de todo lo opaco, como outline() de tiles.js. */
  function contorno(P, col) {
    const marcas = [];
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
      if (opaco(P, x, y)) continue;
      if (opaco(P, x + 1, y) || opaco(P, x - 1, y) || opaco(P, x, y + 1) || opaco(P, x, y - 1)) marcas.push(x, y);
    }
    for (let i = 0; i < marcas.length; i += 2) P.set(marcas[i], marcas[i + 1], col);
  }

  /** Línea de (x0, y0) a (x1, y1), con un segundo píxel a la derecha si `col2` (rama gruesa). */
  function linea(P, x0, y0, x1, y1, col, col2) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
      P.set(x, y, col);
      if (col2 != null) P.set(x + 1, y, col2);
    }
  }

  // ---------------- estilos por bioma ----------------
  const ARBOLES = new Set(['alamo', 'abeto', 'seta', 'columna', 'cristal', 'seco']);
  const DEL_BASE = { tree: 'alamo', crystal: 'cristal', dead: 'seco' };   // con una paleta sin instalar, el más parecido
  const arbol = B => (ARBOLES.has(B.prop) ? B.prop : DEL_BASE[B.prop] || 'alamo');
  const HIERBA = { alamo: 'espadana', abeto: 'helada', seta: 'canas' };  // el resto de arenas: helada (tallos con punta clara)
  const acento = B => B.acento || B.grass[1];                           // casquete de la piedra; una arena no lleva acento: su hierba
  const LIMA = '#a4e04a';                                               // puntas de las cañas de la Vega Sulfúrea

  // ---------------- árboles ----------------
  const ARBOL = {
    /** Álamo (14×38): copa columnar (elipse de 6×15) con la luz a la izquierda y tronco de 2 px. */
    alamo(B) {
      const P = Pix(14, 38), L = packs(B.leaf), Tr = packs(B.trunk);
      for (let y = 30; y < 37; y++) for (let x = 6; x < 8; x++) P.set(x, y, Tr[x === 6 ? 1 : 0]);
      for (let y = 1; y < 32; y++) for (let x = 0; x < 14; x++) {
        const nx = (x - 6.5) / 6, ny = (y - 15) / 15;
        if (nx * nx + ny * ny > 1) continue;
        const luz = -nx * 0.75 - ny * 0.35 + (H(x >> 1, y >> 2, 41) - 0.5) * 0.5;
        P.set(x, y, L[luz > 0.45 ? 3 : luz > 0 ? 2 : luz > -0.45 ? 1 : 0]);
      }
      contorno(P, pack('#162012'));
      return P.canvas();
    },

    /** Abeto (20×38): 4 pisos que se ensanchan, con 1-2 px de nieve (leaf[3]) donde cada uno asoma bajo el de encima. */
    abeto(B) {
      const P = Pix(20, 38), L = packs(B.leaf), Tr = packs(B.trunk);
      for (let y = 32; y < 37; y++) for (let x = 9; x < 11; x++) P.set(x, y, Tr[x === 9 ? 1 : 0]);
      for (let k = 0; k < 4; k++) {
        const top = 2 + k * 7, alto = 11;
        for (let y = top; y < top + alto; y++) {
          const hw = Math.round(2 + (y - top) * (3 + k) / alto);
          for (let x = 10 - hw; x < 10 + hw; x++) P.set(x, y, L[(x < 10 ? 2 : 1) - (y === top + alto - 1 ? 1 : 0)]);
        }
        for (let x = 0; x < 20; x++) for (let y = top; y < top + alto; y++) {
          if (opaco(P, x, y) && !opaco(P, x, y - 1)) { P.set(x, y, L[3]); if (x < 10) P.set(x, y + 1, L[3]); break; }
        }
      }
      contorno(P, pack('#121a1e'));
      return P.canvas();
    },

    /** Seta (22×32): pie crema de 5 px y sombrero (color petróleo en la Sulfúrea) con láminas y 5 lunares. */
    seta(B) {
      const P = Pix(22, 32), L = packs(B.leaf), Tr = packs(B.trunk);
      for (let y = 15; y < 31; y++) for (let x = 8; x < 13; x++) P.set(x, y, y === 15 ? Tr[0] : Tr[x < 10 ? 1 : 0]);
      for (let y = 3; y < 15; y++) for (let x = 1; x < 21; x++) {
        const nx = (x - 10.5) / 9.6, ny = (y - 11) / 9;
        if (nx * nx + ny * ny > 1) continue;
        const luz = -nx * 0.6 - ny * 0.8;
        P.set(x, y, L[luz > 0.5 ? 2 : luz > -0.1 ? 1 : 0]);
      }
      for (let x = 1; x < 21; x++) if (opaco(P, x, 14)) P.set(x, 14, x % 2 ? Tr[0] : L[0]);   // láminas
      for (const [x, y] of [[6, 6], [12, 4], [15, 8], [8, 10], [17, 11]]) { P.set(x, y, L[3]); P.set(x + 1, y, L[3]); P.set(x, y + 1, L[3]); }
      contorno(P, pack('#140d16'));
      return P.canvas();
    },

    /** Columna (12×40, sólo de arena): ábaco, fuste acanalado con los tonos de la pared de la arena, basa y hiedra. */
    columna(B) {
      const P = Pix(12, 40), WT = packs(B.wallTop), WF = packs(B.wallFace), L = packs(B.leaf);
      const wl = pack(B.wallLight), wfd = pack(B.wallFaceDark);
      const FUSTE = [wl, WT[1], WF[0], WT[0], WF[0], WT[2], WF[1], wfd];             // x 2..9: luz, estrías y sombra
      for (let x = 1; x <= 10; x++) { P.set(x, 2, wl); P.set(x, 3, x === 10 ? WF[0] : WT[1]); }   // ábaco
      for (let x = 2; x <= 9; x++) { P.set(x, 4, WT[0]); P.set(x, 5, WF[0]); }      // equino y su sombra
      for (let y = 6; y <= 34; y++) for (let x = 2; x <= 9; x++) {
        let c = FUSTE[x - 2];
        if (y % 9 === 0 && x > 2 && x < 9) c = WF[1];                                // juntas de los tambores
        else if (H(x, y, 71) < 0.06) c = wfd;                                        // desgaste
        P.set(x, y, c);
      }
      for (let x = 2; x <= 9; x++) { P.set(x, 35, x < 4 ? wl : WT[2]); P.set(x, 36, WF[0]); }     // toro
      for (let x = 1; x <= 10; x++) { P.set(x, 37, x < 3 ? WT[1] : WT[0]); P.set(x, 38, wfd); }  // plinto
      for (let y = 22; y <= 36; y++) for (let x = 2; x <= 9; x++) {                  // hiedra que trepa desde el pie
        if (H(x, y, 73) < (y - 22) / 14 * 0.45) P.set(x, y, L[H(x, y, 74) < 0.5 ? 1 : 2]);
      }
      contorno(P, pack(B.wallEdge));
      return P.canvas();
    },

    /** Cristal (22×36, sólo de arena): 4 prismas de punta afilada sobre una base de roca. */
    cristal(B) {
      const P = Pix(22, 36), L = packs(B.leaf), Tr = packs(B.trunk);
      const prisma = (x0, w, top, bot) => {
        const c = x0 + (w - 1) / 2;
        for (let y = top; y <= bot; y++) for (let j = 0; j < w; j++) {
          const x = x0 + j;
          if (Math.abs(x - c) > (y - top) * 0.75 + 0.5) continue;                    // la punta
          const col = j === 0 ? L[3] : j === w - 1 ? L[0] : j < w / 2 ? L[2] : L[1];
          P.set(x, y, j === 1 && y - top < w + 3 && H(x, y, 75) < 0.5 ? L[3] : col);  // destello junto a la arista
        }
      };
      prisma(3, 5, 12, 33); prisma(14, 5, 8, 33); prisma(8, 6, 2, 33); prisma(11, 4, 19, 33);
      for (let y = 31; y <= 34; y++) {                                               // base
        const a = y === 31 ? 6 : y === 32 ? 4 : 3, b = y === 31 ? 15 : y === 32 ? 17 : 18;
        for (let x = a; x <= b; x++) P.set(x, y, y === 34 || H(x, y, 76) < 0.3 ? Tr[0] : Tr[1]);
      }
      contorno(P, pack('#14121e'));
      return P.canvas();
    },

    /** Árbol seco (24×38, sólo de arena): tronco retorcido con raíces, una horquilla arriba y dos en las puntas. */
    seco(B) {
      const P = Pix(24, 38), Tr = packs(B.trunk), L = packs(B.leaf);
      const off = y => (y >= 30 ? 0 : y >= 21 ? 1 : y >= 17 ? 0 : -1);                 // el tronco se tuerce
      for (let y = 14; y <= 33; y++) {
        const x0 = 10 + off(y), w = y >= 24 ? 4 : 3;
        for (let x = x0; x < x0 + w; x++) P.set(x, y, x === x0 || (x + y) % 5 === 0 ? Tr[1] : Tr[0]);   // vetas en espiral
      }
      for (const [y, a, b] of [[34, 9, 14], [35, 8, 15], [36, 7, 16]]) {             // raíces
        for (let x = a; x <= b; x++) if (y < 36 || x === a || x === b || (x > 8 && x < 15)) P.set(x, y, x < 11 ? Tr[1] : Tr[0]);
      }
      linea(P, 10, 14, 5, 5, Tr[1], Tr[0]);                                          // horquilla 1: el tronco se abre en dos
      linea(P, 12, 14, 17, 4, Tr[0], Tr[0]);
      linea(P, 5, 5, 2, 2, L[1]); linea(P, 5, 5, 7, 1, L[1]);                        // horquilla 2, en la rama izquierda
      linea(P, 17, 4, 19, 1, L[1]);
      linea(P, 13, 24, 19, 18, Tr[0]);                                               // rama de la derecha
      linea(P, 19, 18, 21, 13, L[1]); linea(P, 19, 18, 22, 19, L[1]);                // horquilla 3, en su punta
      for (const [x, y] of [[2, 2], [7, 1], [19, 1], [21, 13], [22, 19]]) P.set(x, y, L[2]);   // yemas
      contorno(P, pack('#120d0b'));
      return P.canvas();
    }
  };

  // ---------------- símbolos de las trampas (5×5, '#' = color) ----------------
  const dibujo = filas => filas.flatMap((f, y) => [...f].map((ch, x) => (ch === '#' ? [x, y] : null)).filter(Boolean));
  const SIMBOLOS = [                                 // trampas: veneno (calavera), pegajosa (gota) y explosiva (estallido)
    dibujo(['.###.', '#.#.#', '#####', '.###.', '.#.#.']),
    dibujo(['..#..', '.###.', '#####', '#####', '.###.']),
    dibujo(['#.#.#', '.###.', '#####', '.###.', '#.#.#'])
  ];
  // Orbe del altar por poder (los colores de interact.js, con su sombra y su brillo, como el original) y gastado.
  const ORBE = [['#ff5f6d', '#c23a4b', '#ffd3d8'], ['#5fd4ff', '#2a8fd0', '#d8f6ff'],
                ['#ff8ad8', '#b03d84', '#ffe0f4'], ['#ffd23f', '#c08a10', '#fff3b0']];
  const GASTADO = ['#6b7380', '#4a505c', '#9aa2ae'];
  const TRAMPA = [['#b45ec4', '#e6a3f0'], ['#8bd94a', '#d2ff9a'], ['#ff7b3d', '#ffd08a']];   // aro y símbolo

  // ---------------- cofres y tótem: mapas de píxeles a mano ----------------
  // Cada carácter es un papel de color de su paleta; '.' (y lo que no está en ella), transparente. El contorno va dibujado
  // en el mapa y no con contorno(), para ponerlo donde la silueta lo pide. Luz arriba a la izquierda y rampas de 3-4 tonos
  // por material, con las sombras hacia el frío y las luces hacia el cálido.
  /** Pinta en P un mapa de cadenas desde (x0, y0): cada carácter, una clave de `pal` (color empaquetado). */
  function mapa(P, filas, pal, x0 = 0, y0 = 0) {
    for (let y = 0; y < filas.length; y++) for (let x = 0; x < filas[y].length; x++) {
      const c = pal[filas[y][x]];
      if (c != null) P.set(x0 + x, y0 + y, c);
    }
  }
  /** { papel: '#hex' o empaquetado } → { papel: empaquetado }. */
  const paleta = obj => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? pack(v) : v]));

  // Cofre (16×14). Tapa roja (filas 1-5) que sobresale 1 px de la caja, junta oscura (6), caja de madera con dos flejes
  // dorados (columnas 3 y 12) y el cierre dorado que cuelga de la tapa (columnas 6-9, filas 5-8) con la lente cian de Rotom.
  const COFRE = [
    '..oooooooooooo..',
    '.oWGLLLLLLLLGRo.',
    'oLLGLLLLLRRRGRro',
    'oLRGRRRRRRRRGRro',
    'oRRGRRRRRRRRGrro',
    'orrgrrGYYGrrgrro',
    '.okdkkGECgkkdko.',
    '.oKGKKGCcgKKGBo.',
    '.oBGBBbgdbBBgbo.',
    '.obgbbbbbbbbgbo.',
    '.oBGBBBBBBBBgbo.',
    '.oBGBBBBBBBBgbo.',
    '.oGGdbbbbbbdGgo.',
    '..oooooooooooo..'
  ];
  const PAL_COFRE = paleta({
    o: '#071318',                                                        // contorno: el petróleo de Rotom
    W: '#ff9c86', L: '#ee4b52', R: '#D7263D', r: '#8C1328',              // laca roja: brillo, luz, rojo de Rotom y su canto
    Y: '#fff1a6', G: '#f2c443', g: '#b5832a', d: '#6e4612',              // oro
    K: '#9a5a30', B: '#7a4426', b: '#58301b', k: '#2e1810',              // madera y la junta bajo la tapa
    E: '#e4fffb', C: '#62E3DD', c: '#1d7f88'                             // lente: destello, cian del ojo de Rotom, sombra
  });

  // Cofre con candado (24×20): el cofre en grande y más rico, para que se vea que vale la pena quedarse a abrirlo. Tapa
  // roja abombada (filas 1-8) con dos flejes dorados (columnas 4-5 y 18-19), caja de madera con un zócalo dorado (fila 18)
  // y, en el centro, el candado: arco de acero (filas 3-7; 'q', la sombra bajo el arco) y cuerpo de oro de 10×9 (filas
  // 8-16) con la lente cian y la cerradura.
  const BAUL = [
    '.....oooooooooooooo.....',
    '...ooGWLLLLLLLRRRRgoo...',
    '..oLGgLLLLLLRRRRRRGgRo..',
    '.oLLGgLLLLTSSsLLRRGgRro.',
    'oLLRGgRRRTSSSSsRRRGgRrro',
    'oRRRGgRRRTSqqSsrRRGgRrro',
    'oRRRGgRRRTSRRSsrRRGgRrro',
    'oRRRGgRRRTSRRSsrRRGgRrro',
    'orrrGgroooooooooorGgrrro',
    'oGGGYGGoYYYYGGGgoGYGggdo',
    'okkkgdkoYGGECGGdokgdkkko',
    'oKKKGgKoGGGCcGgdoKGgKbbo',
    'oBBBGgBoGGgkkggdoBGgBbbo',
    'oBBBGgBoGggkkggdoBGgBbbo',
    'obbbGgbogggkggddobGgbbbo',
    'oKKKGgKBoggggddoBKGgKbbo',
    'oBBBGgBBBooooooBBBGgBbbo',
    'obbbGgbbbbbbbbbbbbGgbbko',
    'odGGGGGGGGGGGGGGGGGGGgdo',
    '.oooooooooooooooooooooo.'
  ];
  const PAL_BAUL = paleta({
    o: '#071318',
    W: '#ff9c86', L: '#ee4b52', R: '#D7263D', r: '#8C1328', q: '#4e0a1c',   // laca roja (la del cofre) y el hueco del arco
    Y: '#fff1a6', G: '#f2c443', g: '#b5832a', d: '#6e4612',
    K: '#8b4f2c', B: '#6b3721', b: '#4a2316', k: '#2a120c',              // madera, algo más oscura que la del cofre
    T: '#e2e8f0', S: '#9aa6b5', s: '#5d6773',                            // acero del arco
    E: '#e4fffb', C: '#62E3DD', c: '#1d7f88'
  });

  // Tótem de poder (18×27; las filas 0-4, vacías, dejan el orbe donde drawProp pinta el halo). Orbe ('1' sombra, '2' el
  // color de POWERS, '3' luz, 'w' destello) con centro en (9, 10) entre dos hombros, '4' su reflejo en el capitel, la
  // hornacina ('q', 'n' su sombra) con el glifo en las columnas 6-11 y filas 17-22, y el zócalo con el `acento` del bioma
  // ('A': musgo, nieve o azufre; en una arena, su hierba). Piedra propia, de 'a' (sombra) a 'e' (luz).
  const TOTEM = [
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '.......OOOO.......',
    '......O3322O......',
    '.....O3w3222O.....',
    '....O33222221O....',
    '...OO32222221OO...',
    '..OeO22222211ObO..',
    '..OdO22222111OaO..',
    '..OdcO222111ObaO..',
    '..OdcdO1111OcbaO..',
    '.Oedddc4444cbbbaO.',
    '.OcccbccbbccbbaaO.',
    '.OOObnnnnnnnnaOOO.',
    '...OdnqqqqqqcaO...',
    '...OdnqqqqqqcaO...',
    '...OdnqqqqqqcaO...',
    '...OdnqqqqqqcaO...',
    '...OdnqqqqqqcaO...',
    '...OdnqqqqqqcaO...',
    '..OOdddddddddaOO..',
    '.OAAeeddddddcAbbO.',
    '.OcccbccbbccbbaaO.',
    '..OOOOOOOOOOOOOO..'
  ];
  const PIEDRA_TOTEM = { O: '#1b1626', a: '#47425a', b: '#686274', c: '#8d8584', d: '#b4a895', e: '#d9caae', q: '#575066', n: '#2f2a3c' };
  // Glifos de 6×6 ('#' trazo, '+' su luz), en el orden de POWERS: Furia, Rayo, Imán y Prisa.
  const GLIFOS = [
    ['..#...', '..##..', '.####.', '.#++##', '##++##', '.####.'],   // llama
    ['...###', '..##..', '.#####', '...##.', '..##..', '.##...'],   // rayo
    ['++..++', '##..##', '##..##', '##..##', '######', '.####.'],   // imán en U con los polos claros
    ['######', '.#..#.', '..##..', '.#++#.', '#++++#', '######']    // reloj de arena con la arena abajo
  ];
  const GLIFO_GASTADO = paleta({ '#': '#767c88', '+': '#8d939e' });

  // ---------------- pintores por tipo ----------------
  const PINTA = {
    tree(B) { return ARBOL[arbol(B)](B); },

    /** Piedra erguida (14×17): losa de cima redonda, casquete del acento y, dañada, grieta y esquina NE desconchada. */
    rock(B, v) {
      const P = Pix(14, 17), R = packs(B.rock), ac = pack(acento(B));
      // Perfil [desde, hasta] de cada fila: cima redonda ladeada a la derecha y cuerpo que se ensancha hasta el pie (una
      // losa simétrica de cima en arco se leía como una lápida).
      const FILAS = [null, [7, 9], [5, 10], [4, 10], [3, 11], [3, 11], [3, 11], [2, 11], [2, 11], [2, 12], [2, 12], [2, 12], [2, 12], [1, 12], [1, 12], [1, 12]];
      for (let y = 1; y <= 15; y++) {
        const [a, b] = FILAS[y];
        for (let x = a; x <= b; x++) {
          let c = x <= a + 1 ? R[2] : x >= b - 1 ? R[0] : R[1];           // luz en 2 columnas a la izquierda, sombra en 2
          if (y === 15) c = R[0];                                        // contacto con el suelo
          else if (y === 10 && x > a + 1 && x < b - 1 && H(x, y, 64) < 0.6) c = R[0];   // una veta: piedra, no lápida
          else if (H(x, y, 61) < 0.08) c = x < 7 ? R[2] : R[0];          // textura
          P.set(x, y, c);
        }
      }
      for (let x = 1; x <= 12; x++) {                                    // casquete: 1 px en los bordes, 2-3 en medio
        let y = 1; while (!opaco(P, x, y)) y++;
        const n = x < 3 || x > 10 ? 1 : 2 + (H(x, 0, 62) < 0.3 ? 1 : 0);
        for (let i = 0; i < n; i++) P.set(x, y + i, ac);
      }
      if (v === 1) {
        // Esquina NE desconchada: se quita en escalón y lo que queda junto al hueco enseña la piedra clara de dentro.
        const hueco = (x, y) => x >= 8 && x <= 11 && y >= 1 && y <= 5 && (x - 8) + (5 - y) >= 2;
        for (let y = 1; y <= 5; y++) for (let x = 8; x <= 11; x++) if (hueco(x, y)) P.set(x, y, 0);
        for (let y = 1; y <= 6; y++) for (let x = 7; x <= 11; x++) {
          if (opaco(P, x, y) && (hueco(x + 1, y) || hueco(x, y - 1))) P.set(x, y, R[2]);
        }
        const oscura = pack('#1b1d22');                                   // grieta en diagonal
        for (const [x, y] of [[7, 5], [7, 6], [6, 7], [6, 8], [5, 9], [5, 10], [4, 11], [4, 12]]) P.set(x, y, oscura);
      }
      contorno(P, pack('#17191d'));
      return P.canvas();
    },

    /** Hierba (12×16): 6 tallos; espadañas, hierba helada o cañas muertas según el bioma. Variante 1: mecida. */
    grass(B, v, bi) {
      const P = Pix(12, 16), Gc = packs(B.grass), estilo = HIERBA[arbol(B)] || 'helada';
      const BASE = [2, 3, 5, 6, 7, 8], INCL = [-1, -1, 0, 0, 1, 1];
      const punta = estilo === 'canas' ? pack(bi < TI.NORMAL ? LIMA : B.flowers[1]) : null;
      for (let s = 0; s < 6; s++) {
        const espiga = estilo === 'espadana' && (s === 1 || s === 4);
        const alto = Math.max(espiga ? 11 : 8, 8 + Math.floor(H(s, bi, 52) * 6));   // 8-13 px
        let tx = BASE[s], ty = 15;
        for (let i = 0; i < alto; i++) {
          let x = BASE[s] + Math.round(INCL[s] * i / alto);
          if (v === 1 && i >= alto * 2 / 3) x += 1;                     // mecida: el tercio de arriba se mueve 1 px
          const y = 15 - i;
          let c = i > alto * 0.7 ? Gc[2] : i > alto * 0.3 ? Gc[1] : Gc[0];
          if (punta !== null && (s === 2 || s === 5) && i >= alto - 2) c = punta;
          P.set(x, y, c);
          tx = x; ty = y;
        }
        if (espiga) {                                                    // espiga de 2×4 bajo la punta del tallo
          const x0 = s === 1 ? tx - 1 : tx;
          for (let y = ty + 1; y <= ty + 4; y++) { P.set(x0, y, pack('#6b4a2e')); P.set(x0 + 1, y, pack('#55391f')); }
        }
      }
      contorno(P, pack('#121a0e'));
      return P.canvas();
    },

    /** Cofre del tesoro (16×14): el mapa COFRE, con colores fijos (se leen en todos los suelos). */
    chest() {
      const P = Pix(16, 14);
      mapa(P, COFRE, PAL_COFRE);
      return P.canvas();
    },

    /** Cofre con candado (24×20): el mapa BAUL. */
    bigchest() {
      const P = Pix(24, 20);
      mapa(P, BAUL, PAL_BAUL);
      return P.canvas();
    },

    /** Tótem de poder (18×27): el mapa TOTEM con el orbe de su poder (o gastado) y su glifo en la hornacina. */
    altar(B, v) {
      const P = Pix(18, 27), poder = Math.min(3, Math.max(0, v >> 1)), usado = v & 1;
      const O = usado ? GASTADO : ORBE[poder];
      const pal = paleta(Object.assign({}, PIEDRA_TOTEM, { 1: O[1], 2: O[0], 3: O[2], w: usado ? '#c4cad3' : '#ffffff', A: acento(B) }));
      pal[4] = mezcla(PIEDRA_TOTEM.a, O[1], 0.5);                        // el reflejo del orbe en el capitel
      mapa(P, TOTEM, pal);
      // Glifo aclarado un 12 % (con un 30 % la llama de Furia salía salmón y se confundía con Imán): el color exacto de
      // POWERS queda sólo en el orbe, dentro del halo. Gastado, gris.
      mapa(P, GLIFOS[poder], usado ? GLIFO_GASTADO : { '#': mezcla(O[0], '#ffffff', 0.12), '+': pack(O[2]) }, 6, 17);
      return P.canvas();
    },

    /** Poza octogonal (32×16) con brocal de 2 px; agua cian curativa y, agotada, apagada. */
    spring(B, v) {
      const P = Pix(32, 16), R = packs(B.rock);
      const W = packs(v ? ['#2f5f68', '#3a6f7a', '#4f8a92'] : ['#2ba8b8', '#5fe8d8', '#b8fff4']);
      for (let y = 1; y <= 14; y++) for (let x = 1; x <= 30; x++) {
        const ax = Math.abs(x - 15.5), ay = Math.abs(y - 7.5);
        if (ax > 14.5 || ay > 6.5 || ax + ay > 17) continue;
        if (ax > 12.5 || ay > 4.5 || ax + ay > 14.5) {                  // brocal: sillares de 4 px, luz al norte
          const junta = ax > 12.5 && ay <= 4.5 ? y % 3 === 0 : ((x + (y < 8 ? 0 : 2)) & 3) === 0;
          P.set(x, y, junta || y === 14 ? R[0] : y < 8 ? R[2] : R[1]);
          continue;
        }
        const q = ax * 0.45 + ay;                                        // ondas concéntricas
        let c = y <= 3 ? W[0] : W[1];                                    // el borde norte en sombra
        if (q < 1.2 || (q > 3.3 && q < 3.9)) c = W[2];
        P.set(x, y, c);
      }
      if (!v) for (const [x, y] of [[9, 5], [10, 4], [21, 9], [22, 8], [15, 10]]) P.set(x, y, pack('#ffffff'));
      contorno(P, pack('#14161c'));
      return P.canvas();
    },

    /** Placa de trampa (14×14): disco de radio 6, aro de su color, interior oscuro y su símbolo de 5×5. */
    trap(B, v) {
      const P = Pix(14, 14), k = Math.min(2, Math.max(0, v | 0));
      const aro = pack(TRAMPA[k][0]), luz = pack(TRAMPA[k][1]), base = pack('#2a2238'), baseL = pack('#3b3150');
      for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) {
        const dx = x - 6.5, dy = y - 6.5, d2 = dx * dx + dy * dy;
        if (d2 > 36) continue;
        P.set(x, y, d2 > 25 ? aro : d2 > 16 ? baseL : base);
      }
      for (const [x, y] of SIMBOLOS[k]) P.set(4 + x, 4 + y, luz);
      contorno(P, pack('#0c0812'));
      return P.canvas();
    }
  };

  // ---------------- caché e instalación ----------------
  const original = TI.propSprite, limpiarOriginal = TI.clearProps;
  const cache = new Map();                // "bioma/tipo/variante" -> canvas

  /** Sprite de un objeto del escenario; lo que no es de aquí ('rift'), el de tiles.js. */
  const PROPIOS = new Set(Object.keys(PINTA));
  function sprite(bi, type, variant = 0) {
    if (!PROPIOS.has(type)) return original(bi, type, variant);
    const k = bi + '/' + type + '/' + variant;
    let cv = cache.get(k);
    if (!cv) {
      const B = TI.BIOMES[bi] || TI.BIOMES[0];
      cv = PINTA[type](B, variant | 0, bi);
      cache.set(k, cv);
    }
    return cv;
  }
  M.sprite = sprite;

  if (M.activo) {
    TI.propSprite = sprite;
    TI.clearProps = function () { cache.clear(); return limpiarOriginal.apply(this, arguments); };
  }
})();
