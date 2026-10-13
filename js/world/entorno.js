/* ============ entorno.js — entornos del Gremio y clima de dos tonos (estilo Dex) (MOD nico) ============
 * Lote 3 de la identidad «Dex de Expedición» (guía de marca §11 y plan U7, U9 y U10, con las correcciones de
 * la revisión cruzada, que mandan). Sólo con Dex; con Clásico, el mundo, la viñeta y el clima son los de
 * upstream y el chunk horneado es byte a byte el de upstream.
 *
 *   paletas    los colores del Gremio (G.MARCA.biomas) sobre G.Tiles.BIOMES de los 3 biomas que se turnan:
 *              paredes, agua, orilla, flores, hojas, troncos, rocas y hierba (y `light` en cueva y volcán). El
 *              suelo (floor, dirt, speck) conserva su tono. ORIG guarda lo de upstream para volver a Clásico. Al
 *              cambiar de estilo se rehacen los objetos del escenario y el suelo se rehornea poco a poco (horno.js).
 *   gradar     dentro del horneado de cada chunk (tiles.js, paintChunk): luz y sombra amplias de baja frecuencia,
 *              oclusión al pie de las paredes, tierra mojada junto al agua y resplandor junto a la lava. SÓLO
 *              píxeles de suelo y sin trazos (lo que rechazó Nico). Se hornea una vez: no cuesta por fotograma,
 *              y no depende de la Calidad (cambiarla obligaría a rehornear).
 *   suelo      capa del suelo, después del terreno y antes de avisos, objetos y Pokémon (game.js, drawScene):
 *              farol, halos y motas por bioma según la Calidad (G.MODS.calidadEntorno) y las salpicaduras de la
 *              lluvia. La luz nunca tiñe un sprite. También llama al horno (G.Horno.tick), en los dos estilos.
 *   vineta     viñeta cálida y suave (world.js, drawVignette), en vez de la negra de upstream: el 46 % central,
 *              intacto.
 *   clima      lluvia de dos tonos (borde oscuro y núcleo claro: se ve sobre suelo claro y oscuro), nieve y
 *              arena igual, motas de sol y un tinte con tope (weather.js, draw).
 *
 * Ganchos «// MOD nico» de una línea: tiles.js (paintChunk, antes de devolver el lienzo), game.js (drawScene, tras
 * drawLiquid), world.js (primera línea de drawVignette) y weather.js (primera línea de draw). Si falta este fichero,
 * todo queda como upstream. Sólo dibuja: no cambia la partida ni manda nada por la red, así que en grupo cada uno
 * ve su estilo.
 */
G.Entorno = (() => {
  const MARCA = () => G.MARCA || null;
  const B = G.Tiles.BIOMES, NORMAL = G.Tiles.NORMAL, T = G.Tiles.T;
  const H = (x, y, s) => G.U.hash(x, y, s);
  const conDex = () => !!(G.Estilo && G.Estilo.dex && MARCA());

  // ===================================================================
  // 1. Paletas del Gremio (con copia de upstream para volver a Clásico)
  // ===================================================================
  const PAL = MARCA() ? MARCA().biomas : [];
  const CAMPOS = [...new Set(PAL.flatMap(p => Object.keys(p)))].filter(k => k !== 'nombre' && k[0] !== '_');
  const copia = v => (Array.isArray(v) ? v.slice() : v);
  const ORIG = B.slice(0, NORMAL).map(b => { const o = {}; for (const k of CAMPOS) o[k] = copia(b[k]); return o; });
  let aplicada = 'clasico';

  /** Pone las paletas del estilo (true = Dex). Devuelve true si ha cambiado algo. */
  function paletas(dex) {
    const v = dex && PAL.length ? 'dex' : 'clasico';
    if (v === aplicada) return false;
    for (let i = 0; i < ORIG.length; i++) {
      const p = v === 'dex' ? PAL[i] || {} : {};
      for (const k of CAMPOS) B[i][k] = copia(k in p ? p[k] : ORIG[i][k]);
    }
    aplicada = v;
    return true;
  }

  // ===================================================================
  // 2. Gradación horneada (sin trazos), parámetros por bioma
  // ===================================================================
  function rgb(hex) { const n = parseInt(String(hex).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function shade(hex, k) {
    const c = rgb(hex).map(v => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)))));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  const rgba = (hex, a) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; };
  const caliente = liq => /lava|poison|spark/.test(liq || '');

  /** Gradación, farol y motas del bioma `bi`: los del Gremio en los 3 normales; en las arenas, derivados de su suelo. */
  const gCache = new Map();
  function grad(bi) {
    const M = MARCA();
    if (bi < NORMAL && PAL[bi] && PAL[bi]._g) return PAL[bi]._g;
    let g = gCache.get(bi);
    if (g) return g;
    const b = B[bi] || B[0], A = M.arena, hot = caliente(b.liquid);
    g = { sombra: shade(b.floor[0], A.sombraK), luz: A.luz, humedo: hot ? null : shade(b.floor[0], A.humedoK), brillo: hot ? b.liq : null,
          farol: A.farol, motas: hot ? { tipo: 'brasas', cols: [b.foam, b.liq], n: A.motasCalientes } : { tipo: 'polvo', cols: [A.polvo], n: A.motasFrias } };
    gCache.set(bi, g);
    return g;
  }

  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = H(xi, yi, s), b = H(xi + 1, yi, s), c = H(xi, yi + 1, s), d = H(xi + 1, yi + 1, s);
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
  }
  /** Desenfoque 3×3 (caja) de un campo S×S, en su sitio (`t`: un búfer del mismo tamaño). */
  function blur(F, S, t) {
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      let s = 0, n = 0;
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
        const x = i + a, y = j + b;
        if (x >= 0 && y >= 0 && x < S && y < S) { s += F[y * S + x]; n++; }
      }
      t[j * S + i] = s / n;
    }
    F.set(t);
  }

  /**
   * tiles.js, paintChunk, antes de devolver el lienzo. Con Dex, gradúa los píxeles de SUELO del chunk (cx, cy) de
   * n×n tiles del bioma `bi` en su búfer (P.get/P.set, empaquetado ABGR como tiles.js): ruido de baja frecuencia
   * (hasta un 10 % hacia `luz` y un 18 % hacia `sombra`), oclusión al pie de las paredes (hasta un 42 %), tierra
   * mojada alrededor del agua (40 %) y resplandor alrededor de la lava (30 %). Los campos se calculan por tile con
   * 3 tiles de margen, se desenfocan dos veces y se interpolan por píxel: nada de bordes ni trazos. Determinista.
   * Con Clásico no hace nada (el chunk es el de upstream).
   */
  let buf = null;                      // campos y tablas de gradar(), reutilizados (sin basura por chunk)
  function bufs(S, W) {
    if (buf && buf.S === S && buf.W === W) { buf.pared.fill(0); buf.liq.fill(0); buf.tipo.fill(0); return buf; }
    return (buf = { S, W, pared: new Float32Array(S * S), liq: new Float32Array(S * S), tipo: new Uint8Array(S * S), ruido: new Float32Array(S * S),
      tmp: new Float32Array(S * S), cA: new Float32Array(S), cL: new Float32Array(S), cR: new Float32Array(S), I0: new Int32Array(W), FU: new Float32Array(W), TX: new Int32Array(W) });
  }
  function gradar(P, cx, cy, n, at, bi) {
    if (aplicada !== 'dex' || !conDex()) return;
    const g = grad(bi), GR = MARCA().gradacion, RU = GR.ruido;
    const W = n * T, Mg = GR.margenTiles, S = n + 2 * Mg;
    const tx0 = cx * n - Mg, ty0 = cy * n - Mg;
    const Bf = bufs(S, W), { pared, liq, tipo, ruido, tmp } = Bf;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const k = at(tx0 + i, ty0 + j), o = j * S + i;
      if (k === 'wall') { pared[o] = 1; tipo[o] = 1; } else if (k === 'liquid') { liq[o] = 1; tipo[o] = 2; }
      ruido[o] = vnoise((tx0 + i) / RU.escalas[0], (ty0 + j) / RU.escalas[0], RU.semillas[0]) * RU.pesos[0] +
                 vnoise((tx0 + i) / RU.escalas[1], (ty0 + j) / RU.escalas[1], RU.semillas[1]) * RU.pesos[1];
    }
    for (let k = 0; k < GR.desenfoques; k++) { blur(pared, S, tmp); blur(liq, S, tmp); }
    const [sr, sg, sb] = rgb(g.sombra), [lr, lg, lb] = rgb(g.luz);
    const X = g.brillo ? rgb(g.brillo) : g.humedo ? rgb(g.humedo) : null, XK = g.brillo ? GR.brillo : GR.humedo;
    const OCK = GR.oclusion.k, OCM = GR.oclusion.max, XKk = XK.k, XKm = XK.max, LM = GR.luzMax, SM = GR.sombraMax, GAN = RU.ganancia;
    // Coordenadas de cada columna en la rejilla de tiles (iguales en todas las filas).
    const { I0, FU, TX, cA, cL, cR } = Bf;
    for (let px = 0; px < W; px++) { const u = (px + 0.5) / T + Mg - 0.5; I0[px] = Math.floor(u); FU[px] = u - I0[px]; TX[px] = Math.floor(px / T); }
    // Interpolación bilineal en dos pasos: en vertical, una vez por fila y columna de la rejilla; en horizontal, por píxel.
    for (let py = 0; py < W; py++) {
      const v = (py + 0.5) / T + Mg - 0.5, j0 = Math.floor(v), fv = v - j0, gv = 1 - fv;
      const fila = (Math.floor(py / T) + Mg) * S + Mg;
      for (let i = 0, o = j0 * S; i < S; i++, o++) {
        cA[i] = pared[o] * gv + pared[o + S] * fv; cL[i] = liq[o] * gv + liq[o + S] * fv; cR[i] = ruido[o] * gv + ruido[o + S] * fv;
      }
      for (let px = 0; px < W; px++) {
        if (tipo[fila + TX[px]] !== 0) continue;                       // sólo el suelo
        const i = I0[px], fu = FU[px];
        const ao = cA[i] + (cA[i + 1] - cA[i]) * fu, lq = cL[i] + (cL[i + 1] - cL[i]) * fu;
        const k = (cR[i] + (cR[i + 1] - cR[i]) * fu - 0.5) * GAN;
        const c = P.get(px, py);
        let r = c & 255, gg = (c >>> 8) & 255, b = (c >>> 16) & 255, t;
        if (k > 0) { t = k < 1 ? k * LM : LM; r += (lr - r) * t; gg += (lg - gg) * t; b += (lb - b) * t; }
        else { t = -k < 1 ? -k * SM : SM; r += (sr - r) * t; gg += (sg - gg) * t; b += (sb - b) * t; }
        if (ao > 0.01) { t = ao * OCK < OCM ? ao * OCK : OCM; r += (sr - r) * t; gg += (sg - gg) * t; b += (sb - b) * t; }
        if (lq > 0.01 && X) { t = lq * XKk < XKm ? lq * XKk : XKm; r += (X[0] - r) * t; gg += (X[1] - gg) * t; b += (X[2] - b) * t; }
        P.set(px, py, ((c & 0xff000000) | (((b + 0.5) | 0) << 16) | (((gg + 0.5) | 0) << 8) | ((r + 0.5) | 0)) >>> 0);
      }
    }
  }

  // ===================================================================
  // 3. Capa del suelo: farol, halos, motas y salpicaduras (según la Calidad)
  // ===================================================================
  const PX = G.Sprites.PX;
  const CALIDAD = [
    { farol: false, halos: [], motas: 0, clima: 0.5, salpicaduras: false },
    { farol: true, halos: ['grieta'], motas: 0.7, clima: 1, salpicaduras: true },
    { farol: true, halos: ['grieta', 'jefe', 'disparos'], motas: 1, clima: 1, salpicaduras: true }
  ];
  /** La fila de la tabla de Calidad (G.MODS.calidadEntorno) del nivel efectivo de G.Settings.fx (0 a 2, con «Auto»). */
  function calidad() {
    const tabla = G.MODS && Array.isArray(G.MODS.calidadEntorno) && G.MODS.calidadEntorno.length === 3 ? G.MODS.calidadEntorno : CALIDAD;
    const n = G.Settings && typeof G.Settings.fx === 'number' ? G.Settings.fx : 2;
    return tabla[Math.max(0, Math.min(2, n | 0))];
  }
  let mq = null;
  /** «Menos sacudidas y destellos» o prefers-reduced-motion: sin pulsos ni parpadeos. */
  function reducido() {
    if (G.Settings && G.Settings.get && G.Settings.get('calm')) return true;
    try { if (!mq && typeof matchMedia === 'function') mq = matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) { mq = null; }
    return !!(mq && mq.matches);
  }
  /** ¿Se mueve el mundo? En partida (o en el fondo de los menús); en la pausa y con las cartas, quieto. */
  const enMarcha = () => !G.Game || G.Game.state === 'playing' || G.Game.state === 'ui';
  /** Centro de la luz: tu Pokémon, 12 px por encima de los pies; en los menús, el centro de la cámara. */
  function centroLuz(cam) {
    const p = G.Game && G.Game.player;
    if (p && G.Game.state !== 'ui') return [p.x, p.y - 12];
    return [cam.left() + cam.w / 2, cam.top() + cam.h / 2];
  }

  function farol(ctx, cam, g) {
    const F = MARCA().farol, [x, y] = centroLuz(cam);
    const R0 = Math.min(cam.w, cam.h) * F.r0, R1 = Math.hypot(cam.w, cam.h) * F.r1;
    const gr = ctx.createRadialGradient(x, y, R0, x, y, R1);
    gr.addColorStop(0, rgba(g.sombra, 0));
    gr.addColorStop(F.paradaMedia.en, rgba(g.sombra, g.farol * F.paradaMedia.alfa));
    gr.addColorStop(1, rgba(g.sombra, g.farol));
    ctx.fillStyle = gr;
    ctx.fillRect(cam.left() - 4, cam.top() - 4, cam.w + 8, cam.h + 8);
  }

  /** Halo pixelado: un círculo de radio `r` píxeles de arte con el alfa en escalones de 0,05 (relativo al máximo),
   *  guardado por color y radio y pintado ×PX sin suavizado. Sin bordes duros. */
  const halosCache = new Map();
  function haloSprite(col, r) {
    const k = col + '/' + r;
    let cv = halosCache.get(k);
    if (cv) return cv;
    const n = 2 * r + 1;
    cv = document.createElement('canvas'); cv.width = cv.height = n;
    const c = cv.getContext('2d'), img = c.createImageData(n, n), d = img.data, [R, Gg, Bb] = rgb(col);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const t = Math.hypot(x - r, y - r) / (r + 0.5);
      if (t >= 1) continue;
      const a = Math.round((1 - t) * (1 - t) * 20) / 20;           // escalones de 0,05
      const o = (y * n + x) * 4;
      d[o] = R; d[o + 1] = Gg; d[o + 2] = Bb; d[o + 3] = Math.round(a * 255);
    }
    c.putImageData(img, 0, 0);
    if (halosCache.size > 80) halosCache.clear();
    halosCache.set(k, cv);
    return cv;
  }
  function halo(ctx, col, x, y, rMundo, alfa) {
    if (!(alfa > 0) || !/^#[0-9a-f]{6}$/i.test(col)) return;
    const r = Math.max(2, Math.round(rMundo / PX)), cv = haloSprite(col, r);
    ctx.globalAlpha = Math.min(1, alfa);
    ctx.drawImage(cv, Math.round(x / PX) * PX - r * PX, Math.round(y / PX) * PX - r * PX, cv.width * PX, cv.height * PX);
  }
  function halos(ctx, cam, q, t) {
    if (!q.halos.length) return;
    const HL = MARCA().halos, C = MARCA().color;
    ctx.imageSmoothingEnabled = false;
    if (q.halos.includes('grieta') && G.Rift && G.Rift.rift) {
      const r = G.Rift.rift, f = Math.min(1, r.t * 2, r.ttl / 1.5);
      const pulso = reducido() ? 0 : Math.sin(t * 6.2832 * HL.grieta.hz) * HL.grieta.pulso;
      if (cam.sees(r.x, r.y, HL.grieta.radio)) halo(ctx, C.grieta, r.x, r.y, HL.grieta.radio, (HL.grieta.alfa + pulso) * f);
    }
    if (q.halos.includes('jefe') && G.EnemyMgr) {
      for (const e of G.EnemyMgr.all()) {
        if (!e.boss || e.dead || !cam.sees(e.x, e.y, e.r * HL.jefe.radioK)) continue;
        halo(ctx, G.U.TYPE_COLOR[(e.types || [])[0]] || C.grieta, e.x, e.y, e.r * HL.jefe.radioK, HL.jefe.alfa);
      }
    }
    if (q.halos.includes('disparos') && G.Projectiles) {
      const hostiles = !!(G.MODS && G.MODS.halosDisparosHostiles);
      let n = 0;
      for (const p of G.Projectiles.all()) {
        if (n >= HL.disparo.max) break;
        if (!p.friendly && !hostiles) continue;                       // los hostiles ya llevan el contorno rojo
        if (!cam.sees(p.x, p.y, 20)) continue;
        halo(ctx, p.friendly ? String(p.color || '') : C.peligro, p.x, p.y, HL.disparo.radio, HL.disparo.alfa);
        n++;
      }
    }
    ctx.globalAlpha = 1;
  }

  // Motas de ambiente: polen, polvo o brasas, de 1 píxel de arte, sobre el suelo. Al cambiar de bioma, las viejas se
  // apagan en 1 s mientras entran las nuevas.
  let motas = [], saliendo = [], motasBi = -1;
  function nuevaMota(cam, m, cualquiera) {
    const MT = MARCA().motas, tp = m.tipo, P = MT[tp] || MT.polvo, R = Math.random;
    const x = cam.left() + R() * cam.w;
    const y = cualquiera ? cam.top() + R() * cam.h : (tp === 'brasas' ? cam.top() + cam.h + 6 : cam.top() + R() * cam.h);
    const entre = ([a, b]) => a + R() * (b - a);
    return { x, y, vx: entre(P.vx), vy: entre(P.vy), col: m.cols[Math.floor(R() * m.cols.length)], a: P.alfa, t: 0, vida: entre(P.vida), ph: R() * 6.2832, tipo: tp };
  }
  function pintarMota(ctx, o, f, red) {
    const MT = MARCA().motas;
    ctx.globalAlpha = o.a * f * (o.tipo === 'brasas' && !red ? 0.7 + 0.3 * Math.sin(o.t * MT.brasas.parpadeo + o.ph) : 1);
    ctx.fillStyle = o.col;
    ctx.fillRect(Math.round(o.x / PX) * PX, Math.round(o.y / PX) * PX, PX, PX);
  }
  function dibujarMotas(ctx, cam, g, factor, dt) {
    const MT = MARCA().motas, bi = G.World.biome, red = reducido();
    if (bi !== motasBi) { if (motasBi >= 0) for (const o of motas) { o.fuera = 0; saliendo.push(o); } motas = []; motasBi = bi; }
    const want = Math.round(g.motas.n * factor * (cam.w * cam.h) / (768 * 432));
    while (motas.length < want) motas.push(nuevaMota(cam, g.motas, true));
    if (motas.length > want) motas.length = want;
    const mover = o => { o.t += dt; o.x += (o.vx + Math.sin(o.t * MT.vaiven.hz + o.ph) * MT.vaiven.amplitud) * dt; o.y += o.vy * dt; };
    for (let i = 0; i < motas.length; i++) {
      const o = motas[i];
      mover(o);
      if (o.t > o.vida || !cam.sees(o.x, o.y, 40)) { motas[i] = nuevaMota(cam, g.motas, false); continue; }
      pintarMota(ctx, o, Math.max(0, Math.min(1, o.t / MT.entrada, (o.vida - o.t) / MT.salida)), red);
    }
    for (let i = saliendo.length - 1; i >= 0; i--) {
      const o = saliendo[i];
      mover(o); o.fuera += dt;
      if (o.fuera >= 1) { saliendo.splice(i, 1); continue; }
      pintarMota(ctx, o, Math.max(0, Math.min(1, o.t / MT.entrada, (o.vida - o.t) / MT.salida)) * (1 - o.fuera), red);
    }
    ctx.globalAlpha = 1;
  }

  // Salpicaduras de la lluvia: sobre el suelo y debajo de los Pokémon, de 1 píxel de arte (sin anillos ni trazos):
  // un punto claro con su borde oscuro debajo y, enseguida, dos gotitas que saltan a los lados.
  let salp = [];
  const VIDA_SALP = 0.28, CAMBIO_SALP = 0.09;
  function salpicaduras(ctx, cam, nivel, dt) {
    const CL = MARCA().clima.rain, R = Math.random;
    const ritmo = 60 * nivel * (cam.w * cam.h) / (768 * 432);       // salpicaduras por segundo
    let nuevas = ritmo * dt;
    while (nuevas > 0 && (nuevas >= 1 || R() < nuevas)) {
      nuevas -= 1;
      salp.push({ x: Math.round((cam.left() + R() * cam.w) / PX) * PX, y: Math.round((cam.top() + R() * cam.h) / PX) * PX, t: 0 });
    }
    for (let i = salp.length - 1; i >= 0; i--) {
      const s = salp[i];
      s.t += dt;
      if (s.t >= VIDA_SALP) { salp.splice(i, 1); continue; }
      const f = nivel * (1 - s.t / VIDA_SALP);
      if (s.t < CAMBIO_SALP) {
        ctx.globalAlpha = CL.borde[1] * f; ctx.fillStyle = CL.borde[0]; ctx.fillRect(s.x, s.y + PX, PX, PX);
        ctx.globalAlpha = CL.nucleo[1] * f; ctx.fillStyle = CL.nucleo[0]; ctx.fillRect(s.x, s.y, PX, PX);
      } else {
        ctx.globalAlpha = CL.nucleo[1] * f; ctx.fillStyle = CL.nucleo[0];
        ctx.fillRect(s.x - PX, s.y - PX, PX, PX); ctx.fillRect(s.x + PX, s.y - PX, PX, PX);
      }
    }
    ctx.globalAlpha = 1;
  }

  let ultimo = 0;
  /**
   * game.js, drawScene, tras G.World.drawLiquid (en partida y en el fondo de los menús): el horno escalonado (en los dos
   * estilos) y, con Dex, la capa del suelo según la Calidad. Coordenadas de mundo (ya con la cámara).
   */
  function suelo(ctx, cam, t) {
    if (G.Horno) G.Horno.tick(cam);
    const ahora = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const dt = enMarcha() ? Math.min(0.05, Math.max(0, (ahora - ultimo) / 1000)) : 0;
    ultimo = ahora;
    if (!conDex() || aplicada !== 'dex') { motas.length = 0; saliendo.length = 0; salp.length = 0; motasBi = -1; return; }
    const q = calidad(), g = grad(G.World.biome);
    ctx.save();
    if (q.farol) farol(ctx, cam, g);
    halos(ctx, cam, q, t);
    if (q.motas > 0) dibujarMotas(ctx, cam, g, q.motas, dt); else { motas.length = 0; saliendo.length = 0; }
    const wx = q.salpicaduras && G.Weather && G.Weather.current;
    if (wx && wx.kind === 'rain') salpicaduras(ctx, cam, Math.max(0, Math.min(1, wx.t / 3, (wx.dur - wx.t) / 3)), dt);
    else salp.length = 0;
    ctx.restore();
  }

  // ===================================================================
  // 4. Viñeta cálida
  // ===================================================================
  /** world.js, primera línea de drawVignette: con Dex, la viñeta cálida (rgba(24,12,5,.26) en las esquinas, desde el
   *  46 % del lado menor) y true (upstream no pinta la suya, negra al 0,5); con Clásico, false. */
  function vineta(ctx, w, h) {
    if (!conDex()) return false;
    const V = MARCA().vineta;
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * V.r0, w / 2, h / 2, Math.max(w, h) * V.r1);
    g.addColorStop(0, V.color.replace(/[\d.]+\)$/, '0)'));
    g.addColorStop(1, V.color);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    return true;
  }

  // ===================================================================
  // 5. Clima de dos tonos
  // ===================================================================
  let gotas = [];
  function nuevaGota(kind, w, h, cualquiera) {
    const y = cualquiera ? Math.random() * h : -10, R = Math.random;
    if (kind === 'rain') { const v = MARCA().clima.rain.v; return { x: R() * (w + 200), y, vx: v[0], vy: v[1], vida: 9, t: 0 }; }
    if (kind === 'snow') return { x: R() * w, y, vx: -20 + R() * 40, vy: 40 + R() * 40, vida: 20, t: 0 };
    if (kind === 'sand') return { x: cualquiera ? R() * w : w + 20, y: R() * h, vx: -380 - R() * 140, vy: 20 + R() * 40, vida: 9, t: 0 };
    return { x: R() * w, y: cualquiera ? R() * h : h + 5, vx: -8 + R() * 16, vy: -15 - R() * 15, vida: 12, t: 0 };
  }
  /**
   * weather.js, primera línea de draw: con Dex pinta el clima `kind` con intensidad `nivel` (0..1, entra y sale en 3 s) y
   * devuelve true (upstream no pinta el suyo); con Clásico, false. Tinte con tope (como mucho 0,16) y partículas de dos
   * tonos, con píxeles enteros. La densidad sigue al nivel y a la Calidad (Baja: la mitad). Con niebla, sólo el tinte.
   */
  function clima(ctx, w, h, dt, kind, nivel) {
    if (!conDex()) return false;
    const CL = MARCA().clima, d = kind && G.Weather && G.Weather.KINDS[kind];
    if (!d || !(nivel > 0)) { gotas.length = 0; return true; }
    const [r, g, b, a] = d.tint;
    ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(CL.tinteMax, a * CL.tinteK) * nivel})`;
    ctx.fillRect(0, 0, w, h);
    if (!CL.densidad[kind]) { gotas.length = 0; return true; }
    const want = CL.densidad[kind] * nivel * (w / 1280) * calidad().clima;
    while (gotas.length < want) gotas.push(nuevaGota(kind, w, h, true));
    if (gotas.length > want + 4) gotas.length = Math.ceil(want);
    const p = CL.pixel(w), m = Math.max(1, Math.round(p / 2));
    const dib = (col, al, x, y, ww, hh) => { ctx.globalAlpha = al; ctx.fillStyle = col; ctx.fillRect(x, y, ww, hh); };
    for (let i = gotas.length - 1; i >= 0; i--) {
      const o = gotas[i];
      o.x += o.vx * dt; o.y += o.vy * dt; o.t += dt;
      if (o.y > h + 20 || o.x < -40 || o.x > w + 40 || o.t > o.vida) { gotas[i] = nuevaGota(kind, w, h, false); continue; }
      const x = Math.round(o.x), y = Math.round(o.y);
      if (kind === 'rain') {
        const R = CL.rain, sh = Math.round(p * 1.6), inc = -R.v[0] / R.v[1] * sh;
        for (let j = 0; j < R.segmentos; j++) dib(R.borde[0], R.borde[1] * nivel, x - Math.round(j * inc) + m, y - j * sh, m, sh);
        for (let j = 0; j < R.segmentos; j++) dib(R.nucleo[0], R.nucleo[1] * nivel, x - Math.round(j * inc), y - j * sh, m, sh);
      } else if (kind === 'snow') {
        dib(CL.snow.borde[0], CL.snow.borde[1] * nivel, x + m, y + m, p, p);
        dib(CL.snow.nucleo[0], CL.snow.nucleo[1] * nivel, x, y, p, p);
      } else if (kind === 'sand') {
        dib(CL.sand.borde[0], CL.sand.borde[1] * nivel, x, y + m, p * 3, m);
        dib(CL.sand.nucleo[0], CL.sand.nucleo[1] * nivel, x, y, p * 3, m);
      } else dib(CL.sun.nucleo[0], CL.sun.nucleo[1] * nivel, x, y, p, p);
    }
    ctx.globalAlpha = 1;
    return true;
  }

  // ===================================================================
  // Arranque y cambio de estilo
  // ===================================================================
  /** Al cambiar de estilo: las paletas, los objetos del escenario y el suelo (rehorneado escalonado: horno.js). */
  function alCambiarEstilo() {
    if (!paletas(conDex())) return;
    gCache.clear();
    G.Tiles.clearProps();
    if (G.Horno) G.Horno.rehornear();
    else if (G.World && G.World.rehornear) G.World.rehornear();
  }
  paletas(conDex());
  if (G.Estilo && G.Estilo.on) G.Estilo.on(alCambiarEstilo);

  return {
    paletas, gradar, grad, suelo, vineta, clima, calidad, ORIG, CAMPOS,
    get aplicada() { return aplicada; }
  };
})();
