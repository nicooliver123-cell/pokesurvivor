/* ============ claridad.js — leer la partida de un vistazo (MOD nico) ============
 * Mejoras de claridad aprobadas por Nico en la revisión con maquetas del 12-10-2026.
 * Cada una tiene su ajuste en js/core/mods.js (G.MODS) y se apaga por separado:
 *   jugadorVisible, jugadorChevron   tu Pokémon siempre visible
 *   numerosAgrupados, numerosPausa   un número de daño por enemigo mientras vive
 *   contornoDisparos                 disparos enemigos con contorno rojo
 *   barrasTrasGolpe                  barras de vida sólo tras un golpe reciente
 *   vinetaDanio                      borde rojo al recibir daño y con poca vida
 *
 * Sólo DIBUJA: no cambia el juego ni manda nada por la red. En grupo cada cliente lo
 * pinta con lo que ya tiene (las copias de los enemigos del anfitrión, su vida por red,
 * los disparos que anuncia con 'es'), así que el invitado lo ve igual.
 *
 * Ganchos de una línea "// MOD nico" en el código de upstream:
 *   game.js       drawScene (la escena ordenada), render (encima de la escena, chevrón
 *                 después de los números, viñeta antes del HUD)
 *   fx.js         dmgText (6.º y 7.º argumentos: el enemigo y si es su escudo), update, draw
 *   enemy.js      showHurt y el escudo pasan el enemigo a dmgText; draw pregunta por la barra
 *   player.js     draw (el aro a los pies) y hurt (el golpe, para la viñeta)
 *   projectile.js draw (los disparos enemigos, con su contorno)
 */
G.Claridad = (() => {
  const PX = G.Sprites.PX;
  const M = () => G.MODS || {};
  const TAU = 6.2832;
  const ORO = '#ffcb3d', FRIO = '#cfe8ff', BLANCO = '#ffffff', ROJO = '#ff2440', AZUL = '#9fd8ff', SUPER = '#ffe14d';
  const APOYOS = { shielder: 1, summoner: 1, healer: 1 };
  const ahora = () => performance.now();
  const juego = () => G.Game || {};

  // =====================================================================
  // 1. Tu Pokémon siempre visible
  // =====================================================================

  /* Caja ajustada de una celda de una hoja (sin el margen transparente del fotograma),
   * en píxeles de arte: [x0, y0, x1, y1], null si la celda está vacía y undefined si la
   * imagen no se puede leer (juego abierto con file://: entonces vale la del cuerpo).
   * Se calcula la primera vez que hace falta y se guarda por imagen y celda. */
  const cajas = new WeakMap();
  let lienzo = null, lctx = null;
  function cajaCelda(img, sx, sy, w, h) {
    let m = cajas.get(img);
    if (m === false) return undefined;
    if (!m) { m = new Map(); cajas.set(img, m); }
    const k = sy * 65536 + sx;
    if (m.has(k)) return m.get(k);
    let caja = null;
    try {
      if (!lienzo) { lienzo = document.createElement('canvas'); lienzo.width = 128; lienzo.height = 128; lctx = lienzo.getContext('2d', { willReadFrequently: true }); }
      if (lienzo.width < w || lienzo.height < h) { lienzo.width = Math.max(lienzo.width, w); lienzo.height = Math.max(lienzo.height, h); }
      lctx.clearRect(0, 0, w, h);
      lctx.drawImage(img, sx, sy, w, h, 0, 0, w, h);
      const d = lctx.getImageData(0, 0, w, h).data;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) {
        for (let x = 0, o = y * w * 4 + 3; x < w; x++, o += 4) {
          if (d[o] < 40) continue;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          y1 = y;
        }
      }
      caja = x1 < 0 ? null : [x0, y0, x1 + 1, y1 + 1];
    } catch (e) { cajas.set(img, false); return undefined; }
    m.set(k, caja);
    return caja;
  }

  /** La celda que pinta ahora un Animator (la misma elección que Animator.draw). */
  function celda(a) {
    const S = G.Sprites;
    if (!a || !S.animMeta) return null;
    let m = S.animMeta(a.dex, a.cur, a.shiny), s = S.sheet(a.dex, a.cur, a.shiny);
    const propia = s;
    if (s && !s.ready) {
      const idle = S.sheet(a.dex, 'Idle', a.shiny);
      if (idle && idle.ready) { s = idle; m = S.animMeta(a.dex, 'Idle', a.shiny); }
    }
    if (!m || !s || !s.ready) return null;
    const frame = s === propia ? a.frame : 0;
    return { m, s, sx: Math.min(frame, m.n - 1) * m.w, sy: Math.min(a.dir, m.r - 1) * m.h };
  }

  /** Caja en el mundo del sprite de `ent` (con su Animator) con los pies en (x, y). */
  function rectSprite(ent, x, y) {
    const a = ent.anim, c = celda(a);
    if (!c) return null;
    const k = PX * (a.scale || 1);
    const dx = Math.round(x - c.m.ax * k), dy = Math.round(y - c.m.ay * k);
    const b = cajaCelda(c.s.img, c.sx, c.sy, c.m.w, c.m.h);
    if (b === null) return null;
    if (b === undefined) {
      // Sin poder leer la imagen: el cuerpo (radio y alto del Pokémon) o, si no, el fotograma.
      if (ent.r > 0 && ent.bodyH > 0) return [x - ent.r * 1.2, y - ent.bodyH, x + ent.r * 1.2, y + 2];
      return [dx, dy, dx + c.m.w * k, dy + c.m.h * k];
    }
    return [dx + b[0] * k, dy + b[1] * k, dx + b[2] * k, dy + b[3] * k];
  }

  /** Caja en el mundo de un objeto del mapa (árbol, roca, cristal, hierba alta...), como drawProp. */
  function rectProp(p) {
    if (p.flat || !G.Tiles || !G.Tiles.propSprite) return null;
    const img = G.Tiles.propSprite(G.World.biome, p.type, 0);
    if (!img || !img.width) return null;
    const w = img.width * PX, h = img.height * PX;
    const x0 = Math.round(p.x - w / 2), y0 = Math.round(p.y - h + (p.type === 'grass' ? 4 : 2));
    const b = cajaCelda(img, 0, 0, img.width, img.height);
    if (b === null) return null;
    if (b === undefined) return [x0, y0, x0 + w, y0 + h];
    return [x0 + b[0] * PX, y0 + b[1] * PX, x0 + b[2] * PX, y0 + b[3] * PX];
  }

  /** Parte de la caja del jugador que tienen que tapar los sprites de delante. */
  const UMBRAL = 0.2;
  let escena = null;              // la lista ordenada por Y de drawScene, en este fotograma
  const tapados = new Set();      // jugadores tapados en este fotograma (para el chevrón)

  /** game.js, drawScene(): la escena ya ordenada (lo que se pinta después de alguien, lo tapa). */
  function escenaOrdenada(items) { escena = items; }

  /* Lo más que puede asomar desde los pies el sprite de una entidad, en cualquier animación,
   * dirección y fotograma, contando también la caja del cuerpo (la de respaldo de rectSprite):
   * [izquierda, arriba, derecha, abajo] en px de mundo. Con la tabla de su especie (G.Sprites.meta)
   * se calcula una vez por Animator (en él no cambian especie, escala ni shiny); sin ella, con las
   * dos animaciones que puede pintar ahora (la suya y Idle, como celda()). */
  function alcance(ent) {
    const a = ent.anim;
    let x = a.__alcance;
    if (!x) {
      const S = G.Sprites, k = PX * (a.scale || 1), tabla = S.meta && S.meta(a.dex);
      const metas = tabla && tabla.a ? Object.values(tabla.a).concat(Object.values(tabla.sa || {}))
        : [S.animMeta(a.dex, a.cur, a.shiny), S.animMeta(a.dex, 'Idle', a.shiny)];
      x = [0, 0, 0, 0];
      for (const m of metas) {
        if (!m) continue;
        x[0] = Math.max(x[0], m.ax * k); x[1] = Math.max(x[1], m.ay * k);
        x[2] = Math.max(x[2], (m.w - m.ax) * k); x[3] = Math.max(x[3], (m.h - m.ay) * k);
      }
      if (tabla && tabla.a) a.__alcance = x;
    }
    if (ent.r > 0 && ent.bodyH > 0) {
      const ex = ent.r * 1.2;
      if (ex > x[0] || ex > x[2] || ent.bodyH > x[1] || x[3] < 2) x = [Math.max(x[0], ex), Math.max(x[1], ent.bodyH), Math.max(x[2], ex), Math.max(x[3], 2)];
    }
    return x;
  }

  /** ¿Lo tapa algo de lo que se pinta después que él? (cajas de los sprites de encima)
   *  Se mira TODO lo que va detrás en la escena, sin corte por Y: lo alto (un jefe, un Pokémon
   *  grande, un árbol) tapa con los pies muy por debajo. Lo que no puede llegar ni con su
   *  fotograma más grande se descarta sin mirar su fotograma (alcance). */
  function tapado(p, items = escena) {
    if (!items || !p || !p.anim) return false;
    let i = -1;
    for (let j = 0; j < items.length; j++) if (items[j].ent === p) { i = j; break; }
    if (i < 0) return false;
    const r = rectSprite(p, p.x, p.y);
    if (!r) return false;
    const area = (r[2] - r[0]) * (r[3] - r[1]);
    if (!(area > 0)) return false;
    let cubierto = 0;
    for (let j = i + 1; j < items.length; j++) {
      const it = items[j];
      let q = null;
      if (it.prop) q = rectProp(it.prop);
      else {
        const e = it.ent;
        if (!e || e === p || e.dead || !e.anim || typeof e.x !== 'number') continue;
        const x = alcance(e);   // +1: el redondeo de Animator.draw
        if (e.x - x[0] - 1 >= r[2] || e.x + x[2] + 1 <= r[0] || e.y - x[1] - 1 >= r[3] || e.y + x[3] + 1 <= r[1]) continue;
        q = rectSprite(e, e.x, e.y);
      }
      if (!q) continue;
      const ox = Math.min(r[2], q[2]) - Math.max(r[0], q[0]), oy = Math.min(r[3], q[3]) - Math.max(r[1], q[1]);
      if (ox > 0 && oy > 0 && (cubierto += ox * oy) >= area * UMBRAL) return true;
    }
    return false;
  }

  /** Sprite teñido de un color (el blanco, el de upstream: G.Sprites.white). */
  const tintes = new WeakMap();
  function tinte(img, col) {
    if (col === BLANCO && G.Sprites.white) return G.Sprites.white(img);
    let m = tintes.get(img);
    if (!m) tintes.set(img, m = {});
    if (m[col]) return m[col];
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = col;
    x.fillRect(0, 0, c.width, c.height);
    return (m[col] = c);
  }

  function aroDe(ctx, p, col, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.65, p.r * 0.66, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  const esLocal = p => p === juego().player;

  /** player.js, draw(): el aro a los pies, debajo del sprite (dorado el tuyo, blanco frío los demás). */
  function aro(ctx, p) {
    if (!M().jugadorVisible || !p || p.dead || !juego().player) return;
    aroDe(ctx, p, esLocal(p) ? ORO : FRIO, 0.9);
  }

  /** Vuelve a pintar al jugador encima de lo que lo tapa: aro, contorno de 1 píxel de arte y sprite. */
  function repintar(ctx, p) {
    const local = esLocal(p);
    if (!p.dead) aroDe(ctx, p, local ? ORO : FRIO, 0.95);
    const a = p.anim, c = celda(a);
    if (!c) return;
    const k = PX * (a.scale || 1), o = Math.max(1, k);   // 1 píxel de ARTE de su sprite (a escala si se encoge)
    const dx = Math.round(p.x - c.m.ax * k), dy = Math.round(p.y - c.m.ay * k), W = c.m.w * k, H = c.m.h * k;
    const alpha = p.invuln > 0 && !p.dead ? (Math.floor(p.invuln * 18) % 2 ? 0.45 : 1) : 1;   // el parpadeo de player.js
    const t = tinte(c.s.img, local ? BLANCO : FRIO);
    ctx.save();
    ctx.globalAlpha = alpha;
    for (const [ox, oy] of [[-o, 0], [o, 0], [0, -o], [0, o]]) ctx.drawImage(t, c.sx, c.sy, c.m.w, c.m.h, dx + ox, dy + oy, W, H);
    ctx.restore();
    a.draw(ctx, p.x, p.y, { flash: p.flash > 0, softFlash: true, alpha });
  }

  function jugadores() {
    const pl = juego().player;
    if (!pl) return [];
    return G.Coop && G.Coop.active ? [pl, ...G.Coop.puppets()] : [pl];
  }

  /** game.js, render(), justo después de drawScene: los jugadores tapados, encima de la escena. */
  function encima(ctx) {
    tapados.clear();
    const items = escena;
    escena = null;
    if (!M().jugadorVisible || !items) return;
    for (const p of jugadores()) if (tapado(p, items)) { tapados.add(p); repintar(ctx, p); }
  }

  /** game.js, render(), después de G.FX.draw: el chevrón sobre tu Pokémon (que no lo tapen los números). */
  function chevron(ctx) {
    const pl = juego().player, modo = M().jugadorChevron;
    if (!M().jugadorVisible || !pl || pl.dead || modo === 'nunca') return;
    if (modo !== 'siempre' && !tapados.has(pl)) return;
    const y = Math.round(pl.y - pl.bodyH - 6);
    ctx.save();
    ctx.fillStyle = ORO; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pl.x - 5, y - 6); ctx.lineTo(pl.x + 5, y - 6); ctx.lineTo(pl.x, y); ctx.closePath();
    ctx.stroke(); ctx.fill();
    ctx.restore();
  }

  // =====================================================================
  // 2. Números de daño: uno por enemigo mientras vive
  // =====================================================================

  const CAP = [25, 45, 70];       // los mismos topes que fx.js (Ajustes > Gráficos)
  const grupos = [];              // { clave, e, escudo, suma, color, big, quieto, suelto, t, vida, vy, pop, golpes, x, y }
  let plNumeros = null;

  /** Partida nueva (otro jugador local): fuera los números de la anterior. */
  function partidaNueva() {
    const pl = juego().player;
    if (pl !== plNumeros) { plNumeros = pl; grupos.length = 0; }
  }

  /** Encima de la cabeza del enemigo (por encima de su barra y, en los apoyos, de su icono). */
  function ancla(g) {
    const e = g.e;
    g.x = e.x + (g.escudo ? Math.max(14, (e.r || 0) + 4) : 0);
    g.y = e.y - (e.bodyH || 0) - 12 - (APOYOS[e.behavior] ? 16 : 0);
  }

  /** fx.js, dmgText(): golpe de `value` al enemigo `e` (`escudo`: lo absorbió su escudo).
   *  true = lo lleva este módulo (sumado a su número, u oculto por Ajustes). */
  function sumar(e, value, color, big, escudo) {
    if (!M().numerosAgrupados || !e || typeof e !== 'object' || typeof value !== 'number' || !isFinite(value)) return false;
    if (!(G.Settings && G.Settings.get('dmgNumbers'))) return true;
    partidaNueva();
    const clave = escudo ? e.id + ':e' : e.id;
    let g = null;
    for (const q of grupos) if (!q.suelto && q.e === e && q.clave === clave) { g = q; break; }
    if (g) {
      g.suma += value; g.quieto = 0; g.pop = 1; g.golpes++;
      if (big) g.big = true;
      if (color === SUPER && !escudo) g.color = SUPER;     // un «muy eficaz» tiñe el número
    } else {
      const cap = CAP[G.Settings.fx | 0] || CAP[1];
      if (grupos.length >= cap) {
        let i = grupos.findIndex(q => q.suelto);
        if (i < 0) i = grupos.findIndex(q => !q.big);
        if (i < 0 && !big) return true;
        grupos.splice(Math.max(0, i), 1);
      }
      g = { clave, e, escudo: !!escudo, suma: value, color: escudo ? AZUL : color || BLANCO, big: !!big,
            quieto: 0, suelto: false, t: 0, vida: 0, vy: 0, pop: 1, golpes: 1, x: 0, y: 0 };
      ancla(g);
      grupos.push(g);
    }
    return true;
  }

  /** fx.js, update(): suben y se desvanecen al caer el enemigo o tras numerosPausa s sin golpes. */
  function actualizar(dt) {
    partidaNueva();
    const pausa = +M().numerosPausa > 0 ? +M().numerosPausa : 1;
    for (let i = grupos.length - 1; i >= 0; i--) {
      const g = grupos[i];
      g.pop = Math.max(0, g.pop - dt * 6);
      if (!g.suelto) {
        g.quieto += dt;
        const vivo = !g.e.dead && (!G.EnemyMgr || !G.EnemyMgr.get || G.EnemyMgr.get(g.e.id) === g.e);
        if (vivo) ancla(g);
        if (!vivo || g.quieto >= pausa) { g.suelto = true; g.t = 0; g.vida = g.big ? 0.95 : 0.62; g.vy = -46; }
        continue;
      }
      g.t += dt;
      if (g.t >= g.vida) { grupos.splice(i, 1); continue; }
      g.y += g.vy * dt;
      g.vy *= Math.pow(0.94, dt * 60);   // el frenado de fx.js, sin depender de los FPS
    }
  }

  /** fx.js, draw(): los números (tamaño 11, los grandes 16; contorno de 2). */
  function dibujarNumeros(ctx) {
    if (!grupos.length || !(G.Settings && G.Settings.get('dmgNumbers'))) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,.8)';
    for (const g of grupos) {
      const k = g.suelto ? 1 - g.t / g.vida : 1;
      ctx.globalAlpha = Math.min(1, k * 2.2);
      ctx.font = '700 ' + Math.round((g.big ? 16 : 11) * (1 + 0.35 * g.pop)) + 'px Pixelify,"Segoe UI",sans-serif';
      const s = String(Math.round(g.suma));
      ctx.strokeText(s, g.x, g.y);
      ctx.fillStyle = g.color;
      ctx.fillText(s, g.x, g.y);
    }
    ctx.restore();
  }

  // =====================================================================
  // 3. Disparos enemigos con contorno rojo
  // =====================================================================

  /* Copia del sprite de G.VFX con un contorno de 1 píxel de arte alrededor, hecha una vez por
   * sprite (G.VFX guarda sus lienzos, así que la clave es el propio lienzo). */
  const contornos = new WeakMap();
  function conContorno(cv) {
    let c = contornos.get(cv);
    if (c !== undefined) return c;
    try {
      const w = cv.width, h = cv.height;
      const d = cv.getContext('2d').getImageData(0, 0, w, h).data;
      const lleno = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
      c = document.createElement('canvas');
      c.width = w + 2; c.height = h + 2;
      const x2 = c.getContext('2d');
      x2.fillStyle = ROJO;
      for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
        if (!lleno(x, y) && (lleno(x - 1, y) || lleno(x + 1, y) || lleno(x, y - 1) || lleno(x, y + 1))) x2.fillRect(x + 1, y + 1, 1, 1);
      }
      x2.drawImage(cv, 1, 1);
    } catch (e) { c = null; }
    contornos.set(cv, c);
    return c;
  }

  /** projectile.js, draw(): un disparo enemigo (como G.VFX.draw, con el sprite contorneado).
   *  false = que lo pinte G.VFX como siempre. */
  function disparoHostil(ctx, shape, pal, x, y, angle, alpha, scale, frame) {
    if (!M().contornoDisparos || !G.VFX || !G.VFX.sprite) return false;
    const S = G.VFX.SHAPES[shape] || G.VFX.SHAPES.ball;
    const cv = conContorno(G.VFX.sprite(shape, pal, frame || 0));
    if (!cv || !S) return false;
    const k = PX * (scale || 1), w = (S.w + 2) * k, h = (S.h + 2) * k;
    ctx.save();
    if (alpha != null && alpha < 1) ctx.globalAlpha *= alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x), Math.round(y));
    let a = angle || 0;
    if (a) { a = Math.round(a / (Math.PI / 8)) * (Math.PI / 8); ctx.rotate(a); }
    ctx.drawImage(cv, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }

  // =====================================================================
  // 4. Barras de vida enemigas sólo tras un golpe reciente
  // =====================================================================

  /** enemy.js, draw(): ¿se pinta su barra? (ya herido: la regla del original va antes, así que
   *  esto no se pregunta mientras está entero). Mira si su vida ha cambiado desde la última vez
   *  que se pintó: vale igual en el invitado, que la recibe por red. */
  function barra(e) {
    const s = +M().barrasTrasGolpe;
    if (!(s > 0) || !isFinite(s) || !e) return true;
    if (e.boss || e.legend || e.shiny || e.behavior === 'thief' || APOYOS[e.behavior]) return true;
    const t = ahora();
    if (e.__barraVida === undefined) e.__barraVida = e.maxHp;   // la primera vez: estaba entero (si ya no, es un golpe reciente)
    if (e.__barraVida !== e.hp) { e.__barraVida = e.hp; e.__barraT = t; }
    return e.__barraT !== undefined && t - e.__barraT < s * 1000;
  }

  // =====================================================================
  // 5. Golpe recibido y vida baja, en el borde de la pantalla
  // =====================================================================

  const DUR_GOLPE = 0.35;
  let golpeT = -1e9, golpeA = 0, plVineta = null;

  /** player.js, hurt(): has recibido `d` de daño (sólo cuenta tu propio Pokémon). */
  function golpe(p, d) {
    if (!p || !esLocal(p) || !(d > 0)) return;
    const f = Math.min(1, d / Math.max(1, p.maxHp) / 0.25);   // un cuarto de tu vida o más: el máximo
    golpeA = 0.2 + 0.25 * f;
    golpeT = ahora();
  }

  /** Alfa del borde ahora mismo (0 = nada). */
  function alfaVineta(pl, t = ahora()) {
    const calm = !!(G.Settings && G.Settings.get('calm'));
    let a = 0;
    const dg = (t - golpeT) / 1000;
    if (dg >= 0 && dg < DUR_GOLPE) a = golpeA * (1 - dg / DUR_GOLPE);
    const f = pl.maxHp > 0 ? pl.hp / pl.maxHp : 1;
    if (!pl.dead && f < 0.3) {
      const hondo = (0.3 - f) / 0.3;                                         // 0 al 30 % .. 1 sin vida
      const latido = 0.5 + 0.5 * Math.sin(t / 1000 * TAU / (calm ? 2.4 : 1.6));
      a = Math.max(a, (0.2 + 0.2 * hondo) * (0.55 + 0.45 * latido));       // como mucho 0,4: por debajo del golpe más fuerte
    }
    return calm ? a * 0.5 : a;
  }

  /** game.js, render(), antes del HUD: el borde rojo. */
  function vineta(ctx, w, h, pl) {
    if (!M().vinetaDanio || !pl) return;
    if (pl !== plVineta) { plVineta = pl; golpeT = -1e9; }
    const a = alfaVineta(pl);
    if (a < 0.01) return;
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, 'rgba(220,20,40,0)');
    g.addColorStop(1, 'rgba(220,20,40,' + a.toFixed(3) + ')');
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  return {
    escenaOrdenada, encima, chevron, aro, tapado, rectSprite, rectProp,
    sumar, actualizar, dibujarNumeros, disparoHostil, conContorno, barra, golpe, vineta, alfaVineta,
    /** Para pruebas: los números de daño vivos y los jugadores tapados en el último fotograma. */
    get numeros() { return grupos.map(g => ({ clave: g.clave, id: g.e.id, suma: g.suma, golpes: g.golpes, color: g.color, big: g.big, suelto: g.suelto, escudo: g.escudo, x: g.x, y: g.y })); },
    get tapados() { return [...tapados]; },
    COLORES: { ORO, FRIO, ROJO, AZUL }
  };
})();
