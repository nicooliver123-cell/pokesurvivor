/* ============ mapas.js — mapas propios: biomas, terreno, objetos y arenas (MOD nico) ============
 * Petición de Nico del 14-10-2026 («quiero que cambies los mapas. no deben parecerse a los mapas originales»),
 * especificación «Valles y calzadas» (§3 terreno, §4 sitios, §6 objetos, §7 arenas, §8 menú y §9 contrato). Sólo con
 * G.MODS.mapasPropios (se lee al cargar); con false no toca nada y el mundo es byte a byte el del proyecto base.
 *
 *   instalar   al cargar: los 3 biomas que se turnan (G.Tiles.BIOMES[0..2]) pasan a ser «la misma vega en tres
 *              momentos» (Alba, Helada y Sulfúrea), cada G.Tiles.ARENA_THEMES[tipo] toma los colores, el nombre y el
 *              trazado de su arena nueva (mismas 18 claves y en el mismo orden) y BIOMES[3..20] se rehacen con una copia
 *              de arenaBiome() de tiles.js. Todo en su sitio: nadie pierde la referencia. En G.MARCA, las 3 entradas de
 *              biomas pasan a { nombre, _g } (sin colores: entorno.js no recolorea y sigue gradando) y se añaden las
 *              motas escarcha y esporas. Los datos son de mapas-datos.js (G.MapasDatos).
 *   terreno    world.js, primera línea de terrainRaw: 0 suelo, 1 pared, 2 líquido. Por debajo hay un código más rico,
 *              kind | sub << 2 (SUB: vado, puerto, calzada, puente, orilla, cauce, losas de un sitio...), que lee el
 *              pintor (mapas-pintar.js) con codigo(). Una vega cruzada por franjas: ríos con vados y tramos secos,
 *              crestas con puertos, calzadas rectas con puentes y, encima, sitios (ruina, crómlech, fuente, columnata).
 *   capa       los códigos de un chunk (Uint8Array de 16×16), con memoria LRU de 600. El plano deformado se evalúa una
 *              vez por centro de casilla en una rejilla de 18×18 y las pendientes salen por diferencias de esa rejilla:
 *              los mismos números que evaluarlo 5 veces por casilla, con un cuarto del coste.
 *   props      world.js, primera línea de placeProps: los objetos del escenario del chunk (uno por casilla, como
 *              upstream: la casilla es su identidad en la red), con los sólidos separados entre sí (supresión por
 *              prioridad en la 8-vecindad y a 2 en línea recta), sin los rotos (broken).
 *   arenas     las 18 arenas de la grieta, por familias (octógono, plataforma, isla, laguna, anillo, corona, claro,
 *              jardín, cañón e hileras), con r = 11: todo lo transitable a q < 121 (keepInside de rift.js no cambia), el
 *              pasillo de entrada siempre libre y pared desde el borde de la forma hasta q < 36², para que en ninguna
 *              pantalla se vea terreno normal. Sin interactivos y sin objetos a q < 51² salvo los fijos de su trazado.
 *   climaAlAzar  weather.js, primera línea de pick: el clima al azar del bioma (pesos de G.MapasDatos.CLIMA). Es el
 *              ÚNICO sitio de este fichero con azar: sólo lo llama quien manda y el clima viaja con 'wx'.
 *   huella     resumen de los códigos y los objetos de una zona de chunks, para comparar dos clientes.
 *
 * Determinismo: el terreno, los objetos y lo que lee el pintor son función pura de (semilla, casilla, arena), en
 * cualquier orden de generación, porque cada cliente genera los chunks según su cámara y la caché los expulsa y los
 * regenera. Sólo + − × ÷, floor, abs, min, max, G.U.hash y el vnoise de world.js copiado tal cual; nada de
 * funciones trigonométricas, raíces ni potencias de Math (las direcciones son una tabla literal), ni azar, ni el reloj.
 * Las memorias (dirección y q0 por semilla, sitios por celda, capas LRU) guardan resultados puros: no cambian nada.
 *
 * Ganchos «// MOD nico» de una línea (ya puestos): world.js (terrainRaw y placeProps), weather.js (pick) y game.js
 * (init y restore: el fondo de los menús con SEMILLA_MENU). dev.html lo carga tras mapas-datos.js y antes de
 * mapas-pintar.js, mapas-sprites.js, world.js y entorno.js. Si falta mapas-datos.js, activo = false.
 */
G.Mapas = (() => {
  const D = G.MapasDatos || null;
  const activo = !!(G.MODS && G.MODS.mapasPropios && D);
  const FLOOR = 0, WALL = 1, LIQUID = 2;
  const N = 16;                                    // casillas por chunk (world.js)

  // Subtipo de cada casilla (código = kind | sub << 2). Los de la arena empiezan por A_.
  const SUB = Object.freeze({
    LLANO: 0, VADO: 1, PUERTO: 2, LOSA: 3, CRESTA: 4, MURO: 5, RIO_H: 6, RIO_V: 7, RIO_D1: 8, RIO_D2: 9,
    ORILLA: 10, CAUCE: 11, CALZADA: 12, PUENTE: 13, ARCEN: 14, PRETIL: 15, PILA: 16, COLUMNA: 17, ANILLO: 18,
    APRON: 19, PLAZA: 20, A_BORDE: 21, A_VACIO: 22, A_MURO: 23, A_COLUMNA: 24, A_PUENTE: 25
  });

  // Parámetros (los medidos en el prototipo de la especificación; si cambia uno, se vuelve a buscar SEMILLA_MENU).
  const P = (function congelar(o) { Object.freeze(o); for (const k of Object.keys(o)) if (o[k] && typeof o[k] === 'object') congelar(o[k]); return o; })({
    claro2: 81, rampa: [81, 289], sinPared2: 196,              // claro del principio, río seco junto al campamento, sin crestas
    valle: { lambda: 30, modA: 0.45, modS: 160, Ab: 45, sb: 240, A1: 3.5, s1: 24, rioP: 0.70, crestaP: 0.70 },
    rio: { semi: 2.15, orillaExtra: 0.65, secoEsc: 40, seco: 0.30, lagEsc: 19, lagU: 0.72, lagR: 0.12, lagK: 0.5 },
    vado: { tramo: 14, ancho: 3 },
    cresta: { semi: 2.8, jitter: 1.0, tramo: 22, ancho: 5, mascaraEsc: 17, mascara: 0.25 },
    llano: { esc: 46, umbral: 0.64 },
    calzada: { cada: 64, semi: 1.5, arcen: 3.2 },
    sitio: { celda: 26, prob: 0.45 },
    objetos: { inter: 0.0032, trampaPaso: 0.006, alameda: 0.45, soto: 0.09, bosquete: 0.19, suelto: 0.007,
               rocaPie: 0.08, rocaLosa: 0.07, roca: 0.010, cofre: 0.24, hierbaU: 0.66, hierba: 0.56, hierbaOrilla: 0.30 },
    // En casillas: forma, borde, fin de la pared, objetos. La pared llega a 36: con el jugador en el límite de keepInside
    // (rift.js), la cámara del móvil con el encuadre Dex ve hasta √1250 ≈ 35,4 casillas del centro (estilo-e2e.js §17).
    arena: { r: 11, borde: 13, pared: 36, sinObjetos: 51 }
  });
  const V_ = P.valle, R_ = P.rio, CR = P.cresta, OB = P.objetos;
  const AB2 = V_.Ab * 2, A12 = V_.A1 * 2;
  const ARENA_PARED2 = P.arena.pared * P.arena.pared, ARENA_BORDE2 = P.arena.borde * P.arena.borde;
  const SIN_OBJETOS = P.arena.sinObjetos, SIN_OBJETOS2 = SIN_OBJETOS * SIN_OBJETOS;
  const ARENA_CERCA = 44;          // chunk con su centro a menos de esto (en los dos ejes) de la arena: la arena entra en su clave

  // Códigos ya montados.
  const cod = (k, s) => k | (s << 2);
  const C_LLANO = cod(FLOOR, SUB.LLANO), C_PLAZA = cod(FLOOR, SUB.PLAZA), C_CALZADA = cod(FLOOR, SUB.CALZADA),
        C_CAUCE = cod(FLOOR, SUB.CAUCE), C_PUENTE = cod(FLOOR, SUB.PUENTE), C_VADO = cod(FLOOR, SUB.VADO),
        C_ORILLA = cod(FLOOR, SUB.ORILLA), C_PUERTO = cod(FLOOR, SUB.PUERTO), C_CRESTA = cod(WALL, SUB.CRESTA),
        C_ARCEN = cod(FLOOR, SUB.ARCEN), C_APRON = cod(FLOOR, SUB.APRON), C_LOSA = cod(FLOOR, SUB.LOSA),
        C_MURO = cod(WALL, SUB.MURO), C_ANILLO = cod(FLOOR, SUB.ANILLO), C_PILA = cod(LIQUID, SUB.PILA),
        C_PRETIL = cod(FLOOR, SUB.PRETIL), C_COLUMNA = cod(WALL, SUB.COLUMNA),
        C_A_BORDE = cod(WALL, SUB.A_BORDE), C_A_VACIO = cod(WALL, SUB.A_VACIO), C_A_MURO = cod(WALL, SUB.A_MURO),
        C_A_COLUMNA = cod(WALL, SUB.A_COLUMNA), C_A_PUENTE = cod(FLOOR, SUB.A_PUENTE), C_A_LIQ = cod(LIQUID, SUB.LLANO);
  const C_RIO = [cod(LIQUID, SUB.RIO_H), cod(LIQUID, SUB.RIO_V), cod(LIQUID, SUB.RIO_D1), cod(LIQUID, SUB.RIO_D2)];

  // ---------------- ruido (el de world.js, tal cual) ----------------

  const H = (x, y, s) => G.U.hash(x, y, s);
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = H(xi, yi, s), b = H(xi + 1, yi, s), c = H(xi, yi + 1, s), d = H(xi + 1, yi + 1, s);
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
  }
  const vn = vnoise;
  const abs = v => (v < 0 ? -v : v);

  // ===================================================================
  // 1. El plano deformado: r (a través de las franjas) y q (a lo largo)
  // ===================================================================
  // 8 direcciones (una por partida): tabla literal, sin trigonometría.
  const DIRS = [[1, 0], [0.9238795, 0.3826834], [0.7071068, 0.7071068], [0.3826834, 0.9238795],
                [0, 1], [-0.3826834, 0.9238795], [-0.7071068, 0.7071068], [-0.9238795, 0.3826834]];

  // Memoria de la semilla en curso: dirección, q0 (la calzada que pasa por el campamento) y los sitios por celda.
  let semMemo = null, dirC = 1, dirS = 0, q0 = 0;
  const sitios = new Map();
  function preparar(S) {
    if (S === semMemo) return;
    semMemo = S;
    const d = DIRS[Math.floor(H(S, 7, 3) * 8)];
    dirC = d[0]; dirS = d[1];
    sitios.clear();
    plano(S, 0.5, 0.5);                            // q de la casilla (0, 0)
    q0 = _q;
  }

  /** Plano deformado en (x, y) (en casillas, centros en .5): deja r y q en _r y _q. r tiene la separación modulada y
   *  monótona (|modA·1,5/modS| = 0,0042 < 1/λ = 0,033): ni r ni q tienen extremos, así que no hay curvas cerradas. */
  let _r = 0, _q = 0;
  function plano(S, x, y) {
    const wx = x + AB2 * (vn(x / V_.sb, y / V_.sb, S + 11) - 0.5) + A12 * (vn(x / V_.s1, y / V_.s1, S + 12) - 0.5);
    const wy = y + AB2 * (vn(x / V_.sb + 77.7, y / V_.sb - 33.3, S + 13) - 0.5) + A12 * (vn(x / V_.s1 + 41.1, y / V_.s1 + 19.9, S + 14) - 0.5);
    const p = wx * dirC + wy * dirS;
    _r = p / V_.lambda + V_.modA * (vn(p / V_.modS, 0.5, S + 19) - 0.5);
    _q = wy * dirC - wx * dirS;
  }

  /** valle de una casilla suelta (los sitios lo miran en su centro): r, q, pendientes por diferencias centrales y qg.
   *  Son los mismos números que salen de la rejilla de la capa: (tx + .5) ± 1 es exacto en coma flotante. */
  const VT = { r: 0, q: 0, gx: 0, gy: 0, qg: 0 };
  function valle(S, tx, ty) {
    const x = tx + 0.5, y = ty + 0.5;
    plano(S, x + 1, y); const ar = _r, aq = _q;
    plano(S, x - 1, y); const br = _r, bq = _q;
    plano(S, x, y + 1); const cr = _r, cq = _q;
    plano(S, x, y - 1); const dr = _r, dq = _q;
    plano(S, x, y);
    VT.r = _r; VT.q = _q;
    VT.gx = (ar - br) * 0.5; VT.gy = (cr - dr) * 0.5;
    VT.qg = Math.max(0.3, Math.abs((aq - bq) * 0.5), Math.abs((cq - dq) * 0.5));
    return VT;
  }

  /** Distancia a lo largo hasta la calzada más cercana (una cada 64, la primera por el campamento). */
  function lCalzada(q) {
    const C = P.calzada.cada, u = q - q0 + C / 2;
    return u - Math.floor(u / C) * C - C / 2;
  }
  // Nunca dos franjas seguidas sin río ni dos bordes seguidos sin cresta.
  const hayRio = (S, k) => H(k, 3, S + 63) < V_.rioP || H(k - 1, 3, S + 63) >= V_.rioP;
  const hayCresta = (S, k) => H(k, 5, S + 64) < V_.crestaP || H(k - 1, 5, S + 64) >= V_.crestaP;
  /** ¿Laguna en la franja kr a la altura Q? 0..1. */
  const lagEn = (S, kr, Q) => Math.min(1, Math.max(0, (vn(Q / R_.lagEsc, kr * 4.7 + 1.3, S + 66) - R_.lagU) / R_.lagR));
  /** ¿Hueco (vado o puerto) en la línea k? Uno de `ancho` casillas (a lo largo) por tramo de `tramo`, en sitio al azar. */
  function hueco(S, q, qg, k, tramo, ancho, sem) {
    const u = q + H(k, 0, S + sem) * tramo, m = Math.floor(u / tramo);
    const o = 3 + H(k, m, S + sem + 1) * (tramo - ancho - 6);
    const l = u - m * tramo - o;
    return l >= 0 && l < ancho * qg;
  }
  /** ¿Tramo seco del río kr a la altura q? Por bloques de 4 a lo largo (nunca una casilla seca suelta) y nunca en una
   *  laguna (ni en la del bloque siguiente). */
  function secoEn(S, kr, q) {
    const qb = Math.floor(q / 4) * 4;
    return lagEn(S, kr, qb) === 0 && lagEn(S, kr, qb + 4) === 0 && vn(qb / R_.secoEsc, kr * 6.1 + 2.3, S + 61) < R_.seco;
  }
  const vadoEn = (S, kr, q, qg) => hueco(S, q, qg, kr, P.vado.tramo, P.vado.ancho, 15);
  /** ¿Puente en el cruce de la calzada (centrada en qc = q − l) con el río kr? Se decide para el cruce entero, en la
   *  calzada y una casilla más a cada lado (|s − qc| ≤ semi·qg + qg; qg es lo que cambia q de una casilla a la
   *  siguiente): puente si ahí hay agua y ningún tramo seco. Así el puente siempre tiene agua al lado (sus barandas),
   *  nunca queda una tira de tablones entre el adoquín del tramo seco y el agua, y todas las casillas del cruce dicen lo
   *  mismo (las 9 muestras van cada 0,6 casillas: no se salta ningún tramo seco, de 4, ni ningún vado, de 3·qg). */
  function puenteEn(S, kr, qc, qg) {
    const w = P.calzada.semi * qg + qg;
    let agua = false;
    for (let i = 0; i <= 8; i++) {
      const s = qc - w + w * i / 4;
      if (secoEn(S, kr, s)) return false;
      if (!agua && !vadoEn(S, kr, s, qg)) agua = true;
    }
    return agua;
  }

  // ===================================================================
  // 2. Sitios: uno por celda de 26 como mucho (§4)
  // ===================================================================
  const EXT = { cromlech: 4, fuente: 3, columnata: 4 };      // h de los que no son ruina (la ruina, 3 o 4)
  /** El sitio de la celda (i, j) o null. Se descarta junto al campamento, junto a un río y junto a una calzada. */
  function sitioCelda(S, i, j) {
    const k = i + ',' + j;
    let st = sitios.get(k);
    if (st !== undefined) return st;
    st = null;
    const C = P.sitio.celda;
    if (H(i, j, S + 41) < P.sitio.prob) {
      const kk = H(i, j, S + 46);
      const tipo = kk < 0.40 ? 'ruina' : kk < 0.68 ? 'cromlech' : kk < 0.84 ? 'fuente' : 'columnata';
      const h = tipo === 'ruina' ? 3 + Math.floor(H(i, j, S + 42) * 2) : EXT[tipo];
      const cx = i * C + 8 + Math.floor(H(i, j, S + 43) * 10), cy = j * C + 8 + Math.floor(H(i, j, S + 44) * 10);
      let ok = cx * cx + cy * cy >= 22 * 22;
      if (ok) {
        const V = valle(S, cx, cy);
        const f = V.r - Math.floor(V.r), g2 = V.gx * V.gx + V.gy * V.gy, dR = f - 0.5, lim = h + 8;
        if (hayRio(S, Math.floor(V.r)) && dR * dR < lim * lim * g2) ok = false;
        const l = lCalzada(V.q);
        if (l * l < (h + 4) * (h + 4) * V.qg * V.qg) ok = false;
      }
      if (ok) {
        const brecha = [];
        for (let b = 0; b < 8; b++) brecha.push(H(i * 8 + b, j, S + 70) < 0.25);   // b = lado·2 + mitad
        st = { tipo, h, cx, cy, o: H(i, j, S + 47) < 0.5 ? 'h' : 'v', brecha, i, j };
      }
    }
    if (sitios.size > 8192) sitios.clear();
    sitios.set(k, st);
    return st;
  }
  /** El sitio que ocupa la casilla (con su explanada, hasta h + 4) o null; deja lx, ly y m en _lx, _ly y _m. Un sitio
   *  cabe entero en su celda (centro a ≥ 8 de su borde y h + 4 ≤ 8), así que basta con mirar la de la casilla. */
  let _lx = 0, _ly = 0, _m = 0;
  function sitioDe(S, tx, ty) {
    const C = P.sitio.celda, st = sitioCelda(S, Math.floor(tx / C), Math.floor(ty / C));
    if (!st) return null;
    const lx = tx - st.cx, ly = ty - st.cy, m = Math.max(abs(lx), abs(ly));
    if (m > st.h + 4) return null;
    _lx = lx; _ly = ly; _m = m;
    return st;
  }
  /** Código de la casilla dentro de un sitio, o -1 si el sitio no la toca. */
  function codigoSitio(S, tx, ty) {
    const st = sitioDe(S, tx, ty);
    if (!st) return -1;
    const lx = _lx, ly = _ly, m = _m, ax = abs(lx), ay = abs(ly), h = st.h;
    if (m > h + 1) return C_APRON;                               // explanada: aparta las crestas
    switch (st.tipo) {
      case 'ruina': {
        if (m === h + 1 || m < h) return C_LOSA;
        if (ax === h && ay === h) return C_MURO;                  // esquinas, siempre
        const t = ax === h ? ly : lx, lado = ax === h ? (lx > 0 ? 0 : 1) : (ly > 0 ? 2 : 3);
        if (t >= -1 && t <= 1) return C_LOSA;                     // puertas de 3
        if (st.brecha[lado * 2 + (t > 0 ? 1 : 0)]) return C_LOSA; // brecha: el tramo entero entre esquina y puerta
        return C_MURO;
      }
      case 'cromlech': {
        const d2 = lx * lx + ly * ly;
        if (d2 >= 12 && d2 <= 20) return C_ANILLO;
        if (d2 <= 2) return C_LOSA;
        return C_APRON;
      }
      case 'fuente':                                              // pila de 3×3 con el líquido del bioma
        if (m <= 1) return C_PILA;
        if (m === 2) return C_PRETIL;
        return C_LOSA;
      case 'columnata': {                                         // 2 filas de 3 columnas con su calzada
        const u = st.o === 'h' ? lx : ly, v = st.o === 'h' ? ly : lx, au = abs(u), av = abs(v);
        if (av === 2 && au <= 3 && (u + 3) % 3 === 0) return C_COLUMNA;
        if (av <= 1 && au <= 4) return C_CALZADA;
        return C_APRON;
      }
    }
    return C_LLANO;
  }

  // ===================================================================
  // 3. Terreno normal (§3)
  // ===================================================================
  /** Código de una casilla fuera de la arena, con su valle (r, q, pendientes gx y gy de r, y qg). */
  function codigoNormal(S, tx, ty, r, q, gx, gy, qg) {
    const d2 = tx * tx + ty * ty;
    const l = lCalzada(q), cz = l * l < P.calzada.semi * P.calzada.semi * qg * qg;
    if (d2 < P.claro2) return d2 < 13 ? C_PLAZA : cz ? C_CALZADA : C_LLANO;       // plaza de salida y su calzada
    const f = r - Math.floor(r), g2 = gx * gx + gy * gy, dR = f - 0.5;
    // Todo lo del río depende de q (a lo largo) y de su número: es igual en toda la anchura del cauce (sin islotes).
    const kr = Math.floor(r), rio = hayRio(S, kr);
    let rw = 0;
    if (rio) {
      rw = R_.semi * (0.75 + 0.5 * vn(q / 50, kr * 3.3 + 0.7, S + 62)) * (1 + R_.lagK * lagEn(S, kr, q));
      if (dR * dR < rw * rw * g2) {
        if (d2 < P.rampa[1]) return cz ? C_CALZADA : C_CAUCE;                    // seco junto al campamento
        // El puente sólo se tiende sobre agua (sin ella era un parche de tablones sin barandas): sobre el tramo seco la
        // calzada sigue de adoquín, y un cruce sin agua o que linda con el tramo seco (puenteEn) no lleva puente: queda
        // de adoquín o entra en el vado. Si lo lleva, cubre también su parte de vado, como siempre. El tramo seco y el
        // vado abarcan todo el ancho del cauce.
        if (secoEn(S, kr, q)) return cz ? C_CALZADA : C_CAUCE;
        const vado = vadoEn(S, kr, q, qg);
        if (cz) return puenteEn(S, kr, q - l, qg) ? C_PUENTE : vado ? C_VADO : C_CALZADA;
        if (vado) return C_VADO;
        const ax = abs(gx), ay = abs(gy);
        return C_RIO[ay > 2.4 * ax ? 0 : ax > 2.4 * ay ? 1 : gx * gy > 0 ? 3 : 2];   // sentido de la corriente
      }
    }
    if (cz) return C_CALZADA;
    if (rio) { const ow = rw + R_.orillaExtra; if (dR * dR < ow * ow * g2) return C_ORILLA; }
    if (d2 < P.sinPared2) return C_LLANO;
    const cs = codigoSitio(S, tx, ty);                            // los sitios apartan las crestas
    if (cs >= 0) return cs;
    // Cresta en el borde entre franjas; máscaras A LO LARGO (q por bloques de 4 y su número): cortan la banda entera,
    // nunca dejan un hueco dentro, y los cortes miden 4 o más.
    const kc = Math.floor(r + 0.5);
    if (hayCresta(S, kc)) {
      const dC = f < 0.5 ? f : f - 1, cw = CR.semi + CR.jitter * (vn(q / 4.5, kc * 7.3, S + 22) - 0.5);
      if (dC * dC < cw * cw * g2) {
        const qc = Math.floor(q / 4) * 4;
        if (vn(qc / CR.mascaraEsc, kc * 7.3 + 3.1, S + 21) > CR.mascara && vn(qc / P.llano.esc, kc * 5.1 + 1.7, S + 31) < P.llano.umbral)
          return hueco(S, q, qg, kc, CR.tramo, CR.ancho, 17) ? C_PUERTO : C_CRESTA;
      }
    }
    if (l * l < P.calzada.arcen * P.calzada.arcen * qg * qg) return C_ARCEN;
    return C_LLANO;
  }

  // ===================================================================
  // 4. Arenas de la grieta (§7)
  // ===================================================================
  const NORMAL_A = { familia: 'octogono', variante: 'columnas' };
  /** Familia y variante de la arena `A` ({ tx, ty, r, type }): las de su tipo o, si no la hay, la de normal. */
  const famDe = A => (D && (D.ARENAS[A.type] || D.ARENAS.normal)) || NORMAL_A;
  const pasillo = (lx, ly) => (abs(lx) <= 2 && ly >= -6 && ly <= 5) || lx * lx + ly * ly < 6.25;
  const PANAL = [[6, 0], [-7, 0], [4, 5], [-5, 5], [4, -6], [-5, -6]];   // esquina (arriba a la izquierda) de cada celda 2×2
  /** Código de la casilla (tx, ty) de la arena, a (lx, ly) de su centro y con lx² + ly² < 32². */
  function codigoArena(S, tx, ty, lx, ly, fam, v) {
    const d2 = lx * lx + ly * ly, ax = abs(lx), ay = abs(ly);
    let dentro;
    if (fam === 'octogono') dentro = ax <= 9 && ay <= 9 && ax + ay <= 13;
    else if (fam === 'canon') dentro = ax <= 7 && d2 < 121;
    else if (fam === 'plataforma' || fam === 'claro') {            // borde irregular hacia dentro (hasta 1,2)
      const rr = 11 - vn(tx / 3, ty / 3, S + 51) * 1.2;
      dentro = d2 < rr * rr;
    } else dentro = d2 < 121;
    if (!dentro) return d2 < ARENA_BORDE2 ? C_A_BORDE : C_A_VACIO;
    if (pasillo(lx, ly)) return fam === 'isla' && d2 >= 42.25 && d2 < 64 ? C_A_PUENTE : C_LLANO;
    switch (fam) {
      case 'octogono':
        if (v === 'columnas' && ax >= 5 && ax <= 6 && ay >= 5 && ay <= 6) return C_A_COLUMNA;
        if (v === 'bastiones' && ax >= 6 && ax <= 7 && ay >= 2 && ay <= 3) return C_A_MURO;
        return C_LLANO;
      case 'plataforma':                                          // 4 menhires de 1×1 a 7 casillas
        if ((ax === 7 && ly === 0) || (ay === 7 && lx === 0)) return C_A_COLUMNA;
        return C_LLANO;
      case 'isla':                                                // foso de lava con 4 puentes de 3
        if (d2 >= 42.25 && d2 < 64) return ax <= 1 || ay <= 1 ? C_A_PUENTE : C_A_LIQ;
        return C_LLANO;
      case 'laguna':                                              // 4 lagunas en las esquinas de fuera
        if (d2 >= 85 && ax >= 4 && ay >= 4) return C_A_LIQ;
        if (v === 'seracs' && ax >= 5 && ax <= 6 && ly === 0) return C_A_COLUMNA;
        return C_LLANO;
      case 'anillo':                                              // claustro con 4 puertas; charcos en la pista de fuera
        if (d2 >= 20.25 && d2 < 30.25 && ax > 2 && ay > 1) return C_A_MURO;
        if (v === 'charcos' && ax >= 6 && ax <= 7 && ay >= 4 && ay <= 5) return C_A_LIQ;
        return C_LLANO;
      case 'corona':                                              // 4 arcos de muro; con lava, en las esquinas de fuera
        if (d2 >= 30 && d2 <= 42 && ax > 2 && ay > 2) return C_A_MURO;
        if (v === 'lava' && d2 >= 90 && ax >= 4 && ay >= 4) return C_A_LIQ;
        return C_LLANO;
      case 'claro':
        if (v === 'panal') {
          for (const [px, py] of PANAL) if (lx >= px && lx <= px + 1 && ly >= py && ly <= py + 1) return C_A_COLUMNA;
          return C_LLANO;
        }
        if (d2 >= 12 && d2 < 40 && ax > 3 && vn(tx / 2.2, ty / 2.2, S + 53) > (v === 'corro' ? 0.68 : 0.60)) return C_A_LIQ;
        return C_LLANO;
      case 'jardin':                                              // charcas de 2×2
        if (ax >= 5 && ax <= 6 && ay >= 5 && ay <= 6) return C_A_LIQ;
        if (ax >= 7 && ax <= 8 && (ly === 0 || ly === 1)) return C_A_LIQ;
        return C_LLANO;
      case 'canon':
        if (v === 'costillas' && ax >= 6 && ax <= 7 && (ly === -6 || ly === -2 || ly === 2 || ly === 6)) return C_A_MURO;
        if (v === 'barro' && ax >= 4 && ax <= 6 && ay >= 4 && ay <= 8 && vn(tx / 2, ty / 2, S + 54) > 0.45) return C_A_LIQ;
        return C_LLANO;
      case 'hileras':
        if (v === 'lapidas' && (ax === 4 || ax === 7) && (ly === -6 || ly === -3 || ly === 0 || ly === 3 || ly === 6) && d2 < 90) return C_A_COLUMNA;
        if (v === 'callejon' && ax === 5 && ay >= 2 && ay <= 7) return C_A_MURO;
        return C_LLANO;
    }
    return C_LLANO;
  }

  // ===================================================================
  // 5. Capas: los códigos de un chunk, con rejilla de centros y memoria LRU
  // ===================================================================
  const NG = N + 2, LRU_MAX = 600;
  const lru = new Map();                                          // clave -> capa
  const gR = new Float64Array(NG * NG), gQ = new Float64Array(NG * NG);
  let ultimaCapa = null;                                          // atajo: world.js pide las 256 casillas seguidas
  const cercaArena = (cx, cy, A) => !!A && abs(cx * N + N / 2 - A.tx) < ARENA_CERCA && abs(cy * N + N / 2 - A.ty) < ARENA_CERCA;

  function calcular(S, cx, cy, A) {
    preparar(S);
    const out = new Uint8Array(N * N), x0 = cx * N, y0 = cy * N;
    let fam = null, v = null, todo = false;
    if (A) {
      const a = famDe(A);
      fam = a.familia; v = a.variante;
      const dx = Math.max(abs(x0 - A.tx), abs(x0 + N - 1 - A.tx)), dy = Math.max(abs(y0 - A.ty), abs(y0 + N - 1 - A.ty));
      todo = dx * dx + dy * dy < ARENA_PARED2;                    // el chunk entero es arena: sin plano
    }
    if (!todo) {
      // El plano, una vez por centro de casilla en (N+2)², con una de margen para las diferencias centrales.
      for (let j = 0, o = 0; j < NG; j++) for (let i = 0; i < NG; i++, o++) {
        plano(S, x0 - 1 + i + 0.5, y0 - 1 + j + 0.5);
        gR[o] = _r; gQ[o] = _q;
      }
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const tx = x0 + i, ty = y0 + j;
      if (A) {
        const lx = tx - A.tx, ly = ty - A.ty;
        if (lx * lx + ly * ly < ARENA_PARED2) { out[j * N + i] = codigoArena(S, tx, ty, lx, ly, fam, v); continue; }
      }
      const o = (j + 1) * NG + i + 1;
      const qg = Math.max(0.3, Math.abs((gQ[o + 1] - gQ[o - 1]) * 0.5), Math.abs((gQ[o + NG] - gQ[o - NG]) * 0.5));
      out[j * N + i] = codigoNormal(S, tx, ty, gR[o], gQ[o], (gR[o + 1] - gR[o - 1]) * 0.5, (gR[o + NG] - gR[o - NG]) * 0.5, qg);
    }
    return { cod: out, S, cx, cy, atx: A ? A.tx : null, aty: A ? A.ty : null, atipo: A ? A.type : null };
  }

  /** La capa del chunk (cx, cy): { cod: Uint8Array(256) } (no se muta). La arena sólo entra si está cerca. */
  function capaDe(S, cx, cy, A) {
    const conA = cercaArena(cx, cy, A), u = ultimaCapa;
    if (u && u.S === S && u.cx === cx && u.cy === cy &&
        (conA ? u.atx === A.tx && u.aty === A.ty && u.atipo === A.type : u.atx === null)) return u;
    const k = S + '|' + cx + ',' + cy + (conA ? '|' + A.tx + ',' + A.ty + ',' + A.type : '');
    let c = lru.get(k);
    if (c) { lru.delete(k); lru.set(k, c); }
    else {
      c = calcular(S, cx, cy, conA ? A : null);
      lru.set(k, c);
      if (lru.size > LRU_MAX) lru.delete(lru.keys().next().value);
    }
    ultimaCapa = c;
    return c;
  }

  // La arena en curso, para el pintor, que no la recibe (world.js no llama nunca a setArena(null) al volver: conserva la
  // última hasta reset()). Es la última recibida por terreno, codigo o props, salvo que la de world.js haya cambiado
  // desde entonces (setArena o reset sin ninguna consulta de terreno por medio: el chunk se pinta antes de que world.js
  // pida sus datos): entonces, la de world.js. Así sirve igual a world.js y a quien llama aquí con su propia arena.
  let ultima = null, delMundo;
  function recibida(A) { ultima = A; if (G.World) delMundo = G.World.arena; }
  function arenaActual() {
    if (G.World) { const a = G.World.arena; if (a !== delMundo) { delMundo = a; ultima = a; } }
    return ultima;
  }
  /** Código (kind | sub << 2) de la casilla. Sin `arena` (undefined), la arena en curso. */
  function codigo(tx, ty, S, A) {
    if (A === undefined) A = arenaActual(); else recibida(A);
    const cx = Math.floor(tx / N), cy = Math.floor(ty / N);
    return capaDe(S, cx, cy, A).cod[(ty - cy * N) * N + (tx - cx * N)];
  }
  const terreno = (tx, ty, S, A) => codigo(tx, ty, S, A) & 3;
  function capa(cx, cy, S, A) { return capaDe(S, cx, cy, A === undefined ? arenaActual() : A); }

  // ===================================================================
  // 6. Objetos del escenario (§6)
  // ===================================================================
  const TIPOS = ['tree', 'rock', 'chest', 'grass', 'altar', 'spring', 'bigchest', 'trap'];
  const T_TREE = 0, T_ROCK = 1, T_CHEST = 2, T_GRASS = 3, T_ALTAR = 4, T_SPRING = 5, T_BIGCHEST = 6, T_TRAP = 7;
  const ES_SOLIDO = [1, 1, 1, 0, 1, 0, 1, 0];
  const esCruce = s => s === SUB.VADO || s === SUB.PUENTE || s === SUB.PUERTO || s === SUB.CALZADA;
  const PIEDRAS = [[4, 0], [-4, 0], [0, 4], [0, -4], [3, 3], [-3, 3], [3, -3], [-3, -3]];   // las del crómlech
  // Lo que tapa a un sólido: otro de más prioridad en su 8-vecindad o a 2 en línea recta.
  const VEC = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [-2, 0], [2, 0], [0, -2], [0, 2]];
  // Objetos fijos de las arenas (en (lx, ly) desde su centro).
  const FIJOS = {
    claro: [[7, 0], [-7, 0], [5, 6], [-5, 6], [6, -5], [-6, -5]],
    corro: [[6, 1], [-6, 1], [5, -3], [-5, -3], [3, 6], [-3, 6], [4, -6], [-4, -6]],
    canon: [[4, -4], [-4, 1], [5, 4], [-5, -7]],
    plataforma: [[4, -6], [-4, 6]],
    callejon: [[7, -4], [-7, 4], [3, 7], [-3, -7]]
  };
  const en = (L, lx, ly) => { for (const [a, b] of L) if (a === lx && b === ly) return true; return false; };

  // Búferes reutilizados (sin basura por chunk): la ventana de códigos y los candidatos.
  const MV = 5;                    // margen de la ventana: 2 de candidatos alrededor del chunk + 3 de su entorno de 7×7
  let vent = null, cT = null, cK = null, cP = null;
  /** Los códigos de [wx0, wx0 + W) × [wy0, wy0 + W), copiados de las capas de los chunks que toca. */
  function ventana(S, A, wx0, wy0, W) {
    if (!vent || vent.length !== W * W) vent = new Uint8Array(W * W);
    const c0x = Math.floor(wx0 / N), c1x = Math.floor((wx0 + W - 1) / N);
    const c0y = Math.floor(wy0 / N), c1y = Math.floor((wy0 + W - 1) / N);
    for (let cy = c0y; cy <= c1y; cy++) for (let cx = c0x; cx <= c1x; cx++) {
      const cd = capaDe(S, cx, cy, A).cod;
      const xa = Math.max(wx0, cx * N), xb = Math.min(wx0 + W, cx * N + N);
      const ya = Math.max(wy0, cy * N), yb = Math.min(wy0 + W, cy * N + N);
      for (let ty = ya; ty < yb; ty++) {
        const fo = (ty - cy * N) * N - cx * N, vo = (ty - wy0) * W - wx0;
        for (let tx = xa; tx < xb; tx++) vent[vo + tx] = cd[fo + tx];
      }
    }
    return vent;
  }

  /** Candidato de la casilla (tx, ty) (su código en win[wo], ventana de ancho W): tipo, kind y prioridad en cT/cK/cP[o].
   *  Sólo mira su 7×7 y el sitio de su celda: es puro. */
  function candidato(S, tx, ty, win, W, wo, o) {
    const c = win[wo];
    if ((c & 3) !== FLOOR) return;
    const sub = c >> 2, d2 = tx * tx + ty * ty;
    if (d2 < 49 || esCruce(sub) || sub === SUB.PRETIL || sub === SUB.PLAZA) return;
    let open = true, wall5 = false, wall7 = false, cruce1 = false, cruce2 = false, agua2 = false, losa1 = false;
    for (let b = -3; b <= 3; b++) for (let a = -3; a <= 3; a++) {
      const cc = win[wo + b * W + a], k = cc & 3, s = cc >> 2;
      const n1 = a >= -1 && a <= 1 && b >= -1 && b <= 1, n2 = a >= -2 && a <= 2 && b >= -2 && b <= 2;
      if (n1 && k !== FLOOR) open = false;
      if (k === WALL) { if (n2) wall5 = true; wall7 = true; }
      if (n2 && k === FLOOR && esCruce(s)) { cruce2 = true; if (n1) cruce1 = true; }
      if (n2 && (k === LIQUID || s === SUB.ORILLA)) agua2 = true;
      if (n1 && s === SUB.LOSA) losa1 = true;
    }
    let t = -1, kind = 0, rango = 0;
    // 1) Interactivos: la tirada de upstream (misma economía), lejos del claro y nunca junto a un cruce.
    const hs = H(tx, ty, S + 909);
    if (open && !cruce1 && d2 > 144 && hs < OB.inter) {
      t = hs < 0.0004 ? T_ALTAR : hs < 0.0008 ? T_SPRING : hs < 0.0011 ? T_BIGCHEST : T_TRAP;
      kind = Math.floor(H(tx, ty, S + 910) * (t === T_ALTAR ? 4 : 3)); rango = 4;
    }
    // 1b) Trampas de paso: a 2 casillas de un vado, puente, puerto o calzada (nunca encima): la horda se embuda.
    else if (open && cruce2 && !cruce1 && d2 > 144 && H(tx, ty, S + 912) < OB.trampaPaso) {
      t = T_TRAP; kind = Math.floor(H(tx, ty, S + 910) * 3); rango = 4;
    } else {
      // 2) Sitios: piedras y centro del crómlech, cofre de la ruina y manantial de la fuente.
      const st = sitioDe(S, tx, ty);
      if (st) {
        const lx = _lx, ly = _ly, hc = H(st.i, st.j, S + 80);
        if (st.tipo === 'cromlech') {
          if (open && en(PIEDRAS, lx, ly) && H(tx, ty, S + 81) < 0.85) { t = T_ROCK; rango = 3; }
          else if (lx === 0 && ly === 0 && open && d2 > 144) {
            if (hc < 0.30) { t = T_ALTAR; kind = Math.floor(H(st.i, st.j, S + 86) * 4); rango = 4; }
            else if (hc < 0.42) { t = T_SPRING; rango = 4; }
          }
        } else if (st.tipo === 'ruina') {
          if (lx === 0 && ly === 0 && open && hc < 0.5) { t = T_CHEST; rango = 3; }
        } else if (st.tipo === 'fuente') {
          if (lx === 0 && ly === 3 && hc < 0.25 && d2 > 144) { t = T_SPRING; rango = 4; }
        }
      }
      // 3) Sólidos naturales: 3×3 de suelo, sin pared en 5×5 y sin cruce al lado.
      if (t < 0 && open && !wall5 && !cruce1) {
        const h1 = H(tx, ty, S + 404);
        let pt = OB.suelto;
        if (sub === SUB.ARCEN && vn(tx / 30, ty / 30, S + 507) > 0.45) pt = OB.alameda;   // alameda en el arcén
        else if (agua2 && vn(tx / 9, ty / 9, S + 506) > 0.45) pt = OB.soto;              // soto junto al agua
        else if (vn(tx / 10, ty / 10, S + 505) > 0.70) pt = OB.bosquete;
        if (h1 < pt) { t = T_TREE; rango = 2; }
        else if (h1 > 1 - (wall7 ? OB.rocaPie : losa1 ? OB.rocaLosa : OB.roca)) { t = T_ROCK; rango = 1; }
        else if (h1 > 0.985 && h1 <= 0.992 && H(tx, ty, S + 606) < OB.cofre) { t = T_CHEST; rango = 0; }
      }
    }
    if (t < 0) return;
    cT[o] = t; cK[o] = kind; cP[o] = rango + H(tx, ty, S + 405);
  }

  /** Objeto fijo de la arena en (lx, ly) (tipo o -1): fuera del pasillo, dentro (q < 121) y con 3×3 de suelo. */
  function fijoArena(S, A, lx, ly, win, W, wo) {
    const d2 = lx * lx + ly * ly;
    if (d2 >= 121 || pasillo(lx, ly)) return -1;
    for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) if ((win[wo + b * W + a] & 3) !== FLOOR) return -1;
    const a = famDe(A), fam = a.familia, v = a.variante;
    if (fam === 'claro') {
      if (en(v === 'corro' ? FIJOS.corro : FIJOS.claro, lx, ly)) return T_TREE;
      return d2 > 49 && H(lx + A.tx, ly, S + 55) < 0.18 ? T_GRASS : -1;
    }
    if (fam === 'canon') return en(FIJOS.canon, lx, ly) ? T_ROCK : -1;
    if (fam === 'plataforma') return en(FIJOS.plataforma, lx, ly) ? T_ROCK : -1;
    if (fam === 'hileras' && v === 'callejon') return en(FIJOS.callejon, lx, ly) ? T_ROCK : -1;
    return -1;
  }

  /** Los objetos de [x0, x0 + n)², por filas: poner(tipo, tx, ty, kind). Puro: candidatos del chunk con 2 de margen,
   *  supresión de sólidos y, en lo que queda libre, hierba. Cerca de la arena, sólo sus objetos fijos. */
  function colocar(S, A, x0, y0, n, poner) {
    preparar(S);
    const W = n + 2 * MV, CW = n + 4, win = ventana(S, A, x0 - MV, y0 - MV, W);
    if (!cT || cT.length !== CW * CW) { cT = new Int8Array(CW * CW); cK = new Uint8Array(CW * CW); cP = new Float64Array(CW * CW); }
    cT.fill(-1);
    const conA = !!A && abs(x0 + n / 2 - A.tx) < SIN_OBJETOS + n / 2 + 2 && abs(y0 + n / 2 - A.ty) < SIN_OBJETOS + n / 2 + 2;
    for (let j = 0; j < CW; j++) for (let i = 0; i < CW; i++) {
      const tx = x0 - 2 + i, ty = y0 - 2 + j;
      if (conA) { const lx = tx - A.tx, ly = ty - A.ty; if (lx * lx + ly * ly < SIN_OBJETOS2) continue; }
      candidato(S, tx, ty, win, W, (j + MV - 2) * W + i + MV - 2, j * CW + i);
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const tx = x0 + i, ty = y0 + j, o = (j + 2) * CW + i + 2, wo = (j + MV) * W + i + MV;
      if (conA) {
        const lx = tx - A.tx, ly = ty - A.ty;
        if (lx * lx + ly * ly < SIN_OBJETOS2) { const f = fijoArena(S, A, lx, ly, win, W, wo); if (f >= 0) poner(TIPOS[f], tx, ty, 0); continue; }
      }
      let t = cT[o], kind = cK[o];
      if (t >= 0 && ES_SOLIDO[t]) {
        const p = cP[o];
        for (const [a, b] of VEC) { const oo = o + b * CW + a, u = cT[oo]; if (u >= 0 && ES_SOLIDO[u] && cP[oo] > p) { t = -1; break; } }
      }
      if (t < 0) {
        // Hierba alta (no es sólida): en la orilla y en prados; nunca en cruces, pretil, losas, anillo ni plaza.
        const c = win[wo], sub = c >> 2;
        kind = 0;
        if ((c & 3) === FLOOR && tx * tx + ty * ty >= 49 && !esCruce(sub) && sub !== SUB.PRETIL && sub !== SUB.LOSA &&
            sub !== SUB.ANILLO && sub !== SUB.PLAZA) {
          const hg = H(tx, ty, S + 808);
          if (sub === SUB.ORILLA ? hg < OB.hierbaOrilla : vn(tx / 6, ty / 6, S + 707) > OB.hierbaU && hg < OB.hierba) t = T_GRASS;
        }
      }
      if (t >= 0) poner(TIPOS[t], tx, ty, kind);
    }
  }

  /** world.js, placeProps: mete los objetos del chunk `c` en c.props (y los sólidos en c.propAt), sin los rotos. */
  function props(c, n, S, A, broken, makeProp) {
    if (A === undefined) A = arenaActual(); else recibida(A);
    colocar(S, A, c.cx * n, c.cy * n, n, (type, tx, ty, kind) => {
      const k = tx + ',' + ty;
      if (broken && broken.has(k)) return;
      const p = makeProp(type, tx, ty, kind);
      c.props.push(p);
      if (p.solid) c.propAt.set(k, p);
    });
  }

  /** El sitio que ocupa la casilla (con su explanada) o null: { tipo, h, cx, cy, o, lx, ly, m, i, j, brecha }. */
  function sitio(tx, ty, S) {
    preparar(S);
    const st = sitioDe(S, tx, ty);
    return st ? { tipo: st.tipo, h: st.h, cx: st.cx, cy: st.cy, o: st.o, lx: _lx, ly: _ly, m: _m, i: st.i, j: st.j, brecha: st.brecha.slice() } : null;
  }

  // ===================================================================
  // 7. Clima, huella e instalación
  // ===================================================================
  /** Clima al azar del bioma, con los pesos de G.MapasDatos.CLIMA (como pick() de weather.js). */
  function climaAlAzar(biome) {
    const C = D.CLIMA, w = C[(((biome | 0) % C.length) + C.length) % C.length], ks = Object.keys(w);
    let tot = 0;
    for (const k of ks) tot += w[k];
    let r = Math.random() * tot;
    for (const k of ks) { r -= w[k]; if (r <= 0) return k; }
    return ks[ks.length - 1];
  }

  /** Resumen de los códigos y los objetos de w×h chunks desde (cx0, cy0), con la arena `A` (o ninguna): dos clientes
   *  con la misma versión dan la misma cadena. No toca la última arena recibida. */
  function huella(S, cx0, cy0, w, h, A) {
    if (A === undefined) A = null;
    let a = 0x811c9dc5 | 0, b = 17, n = 0;
    const mezcla = x => { a = Math.imul(a ^ (x | 0), 16777619); b = (Math.imul(b, 31) + (x | 0)) | 0; };
    for (let cy = cy0; cy < cy0 + h; cy++) for (let cx = cx0; cx < cx0 + w; cx++) {
      const cd = capaDe(S, cx, cy, A).cod;
      for (let k = 0; k < cd.length; k++) mezcla(cd[k]);
      colocar(S, A, cx * N, cy * N, N, (type, tx, ty, kind) => { mezcla(TIPOS.indexOf(type) + 1); mezcla(tx); mezcla(ty); mezcla(kind); n++; });
    }
    const hex = x => (x >>> 0).toString(16).padStart(8, '0');
    return w * h + ':' + hex(a) + hex(b) + ':' + n;
  }

  /** world.js setArena (gancho): olvida los chunks de datos y de imagen que la arena nueva cambia. Upstream sólo olvida
   *  los que tienen el centro a menos de r + 9 + N casillas (36), pero aquí la arena cambia el terreno hasta ARENA_CERCA y
   *  quita objetos hasta SIN_OBJETOS más la ventana de colocar(): un chunk de esa franja generado antes de abrirse la
   *  grieta (dos grietas cerca en la misma partida) se quedaba como estaba, y el anfitrión y el invitado, con cachés
   *  distintas, veían otra cosa. También olvida la zona de la arena anterior, que world.js deja con su anillo. */
  let olvidada = null;
  function olvidarArena(a, datos, imagenes, n) {
    const R = Math.max(ARENA_CERCA, SIN_OBJETOS + n / 2 + 2), zonas = olvidada ? [a, olvidada] : [a];
    for (const k of [...datos.keys(), ...imagenes.keys()]) {
      const i = k.indexOf(','), cx = +k.slice(0, i) * n + n / 2, cy = +k.slice(i + 1) * n + n / 2;
      if (zonas.some(z => abs(cx - z.tx) < R && abs(cy - z.ty) < R)) { datos.delete(k); imagenes.delete(k); }
    }
    olvidada = { tx: a.tx, ty: a.ty };
  }

  // Copia de shade() y arenaBiome() de tiles.js (mismos números): las arenas nuevas se derivan igual que las de upstream.
  function rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function shade(hex, k) {
    const c = rgb(hex).map(v => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  /** Paleta completa de una arena (la de tiles.js) más su trazado y sus materiales, que lee el pintor. */
  function arenaBiome(th) {
    const f = th.floor, w = th.wall, L = th.liq;
    return {
      name: 'Grieta · ' + th.name, liquid: th.liquid,
      floor: [f, shade(f, 0.05), shade(f, -0.06)], dirt: [shade(f, -0.16), shade(f, -0.12), shade(f, -0.2)],
      speck: shade(f, -0.25), light: shade(f, 0.22), flowers: th.flowers,
      wallTop: [w, shade(w, 0.07), shade(w, -0.07)], wallLight: shade(w, 0.32), wallEdge: shade(w, -0.7),
      wallFace: [shade(w, -0.3), shade(w, -0.38)], wallFaceDark: shade(w, -0.55),
      liq: L, liqDeep: shade(L, -0.22), foam: th.foam || shade(L, 0.55), shore: shade(f, -0.32),
      prop: th.prop, leaf: [shade(th.leaf, -0.35), shade(th.leaf, -0.15), th.leaf, shade(th.leaf, 0.3)],
      trunk: [shade(th.trunk, -0.2), th.trunk],
      rock: [shade(th.rock, -0.2), th.rock, shade(th.rock, 0.22)],
      grass: [shade(th.grass, -0.28), th.grass, shade(th.grass, 0.28)],
      familia: th.familia, variante: th.variante, sueloMat: th.sueloMat, paredMat: th.paredMat, ajedrez: !!th.ajedrez
    };
  }
  const copia = v => (Array.isArray(v) ? v.slice() : v);
  /** Pone los campos de `nuevo` en el objeto `viejo`, en su sitio, y quita los que no tiene. */
  function sustituir(viejo, nuevo) {
    for (const k of Object.keys(viejo)) if (!(k in nuevo)) delete viejo[k];
    for (const k of Object.keys(nuevo)) viejo[k] = copia(nuevo[k]);
  }
  // Lo que se copia de cada arena de mapas-datos.js a su ARENA_THEMES (pools, pillars y props se quedan: sólo los lee el
  // camino de upstream de world.js, que no corre con los mapas propios). foam y ajedrez, aparte.
  const CAMPOS_TEMA = ['name', 'floor', 'wall', 'liquid', 'liq', 'prop', 'leaf', 'trunk', 'flowers', 'grass', 'rock', 'weather',
                       'familia', 'variante', 'sueloMat', 'paredMat'];
  function instalar() {
    const T = G.Tiles, B = T.BIOMES;
    // Los 3 biomas que se turnan (en su sitio: world.js, entorno.js y claridad.js los leen por índice).
    for (let i = 0; i < T.NORMAL && i < D.BIOMAS.length; i++) sustituir(B[i], D.BIOMAS[i]);
    // Las 18 arenas: mismas claves y en el mismo orden (rift.js y la partida guardada cuentan con ellas).
    for (const tipo of T.ARENA_TYPES) {
      const th = T.ARENA_THEMES[tipo], a = D.ARENAS[tipo];
      if (!th || !a) continue;
      for (const k of CAMPOS_TEMA) if (k in a) th[k] = copia(a[k]);
      if (a.foam && a.foam !== 'auto') th.foam = a.foam; else delete th.foam;   // 'auto': sin espuma propia, como upstream
      if (a.ajedrez) th.ajedrez = true; else delete th.ajedrez;
    }
    T.ARENA_TYPES.forEach((tipo, i) => {
      const nb = arenaBiome(T.ARENA_THEMES[tipo]), b = B[T.ARENA + i];
      if (b) sustituir(b, nb); else B[T.ARENA + i] = nb;
    });
    // Estilo Dex: sin campos de color (entorno.js no recolorea) y con la gradación de cada momento de la vega.
    const M = G.MARCA;
    if (M && Array.isArray(M.biomas))
      for (let i = 0; i < D.BIOMAS.length && i < M.biomas.length; i++) M.biomas[i] = { nombre: D.BIOMAS[i].name, _g: D.MARCA_G[D.BIOMAS[i].motivo] };
    if (M && M.motas && typeof M.motas === 'object') for (const k of Object.keys(D.MOTAS)) M.motas[k] = D.MOTAS[k];
  }
  if (activo) instalar();

  return {
    activo, SEMILLA_MENU: D ? D.SEMILLA_MENU : 4242, P, SUB,
    terreno, codigo, capa, sitio, props, climaAlAzar, huella, olvidarArena,
    /** La arena en curso (la de world.js; el pintor no la recibe): ver recibida(). */
    arenaActual
  };
})();
