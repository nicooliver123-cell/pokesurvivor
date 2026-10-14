/* ============ luz.js — búfer de luz a resolución de píxel de arte (MOD nico) ============
 * PLAN.md, punto 10 (valoración del 14-10-2026; aprobado por Nico el mismo día, «luz sólo en Dex»: va con el mundo Dex,
 * G.MODS.mundoDex, así que con los dos estilos de interfaz). Fuentes: tus ataques de fuego y eléctricos (los disparos,
 * los orbes y los campos: charcos, minas, torretas y meteoros), el ácido y la lava (cada casilla de líquido de peligro),
 * los orbes de los tótems sin usar y la grieta abierta. Con la luz, entorno.js no pinta los halos de la grieta ni los
 * de esos disparos (la luz los sustituye).
 * Cada fotograma, en un lienzo de un píxel por píxel de arte (G.Sprites.PX px de mundo) alineado con la rejilla del
 * mundo: la luz ambiente del bioma (G.MODS.luzAmbiente, con un tinte por bioma), las luces sumadas encima ('lighter',
 * discos con el alfa en escalones de 0,05, como los halos de entorno.js) y, a 1 (blanco), las zonas de los avisos del
 * suelo (G.Hazards, con 2 píxeles de margen). Se multiplica sobre la escena (game.js, render(): después de drawScene y
 * de G.Claridad.encima, antes de los disparos y los efectos), así que nunca oscurece un disparo enemigo ni un aviso, y
 * después las mismas luces suman un brillo flojo encima. Al ser un píxel de arte por píxel, con el píxel nítido cada
 * uno mide un número entero de píxeles físicos, como los sprites; con la pantalla dividida el lienzo del juego ya es
 * sólo su mitad (la cámara también). «Menos sacudidas y destellos» o prefers-reduced-motion: sin parpadeo ni pulso y el
 * brillo a la mitad. Sólo con Calidad Alta (G.Settings.fx = 2; ver activo()). Sólo dibuja: nada viaja por la red.
 */
G.Luz = (() => {
  const PX = G.Sprites.PX, TS = G.Tiles.T * PX, N = 16, CW = N * TS;
  const BRILLO = 0.28;                      // lo que suman las luces encima de la escena (× su intensidad)
  // Tinte de la luz ambiente por bioma (× luzAmbiente, por canal): el alba casi de día, la helada azulada, la sulfúrea
  // más apagada y verdosa (donde más se ven el ácido y los ataques) y las arenas de la grieta, lila y en penumbra.
  const TINTE = [[1.03, 1.01, 1.05], [0.97, 1, 1.07], [0.93, 0.97, 0.85]], TINTE_ARENA = [0.92, 0.88, 1];
  const COLOR = { fire: '#ffae3a', electric: '#fff06a' };
  const ORBE = ['#ff5f6d', '#5fd4ff', '#ff8ad8', '#ffd23f'];   // los poderes del altar (world.js, drawProp)
  const PELIGRO = { lava: '#ff8a2a', poison: '#a8f060', spark: '#ffe45a' };
  const GRIETA = (G.MARCA && G.MARCA.color && G.MARCA.color.grieta) || '#B48AFF';
  let cv = null, lc = null;

  let mq = null;
  function reducido() {
    if (G.Settings && G.Settings.get && G.Settings.get('calm')) return true;
    try { if (!mq && typeof matchMedia === 'function') mq = matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) { mq = null; }
    return !!(mq && mq.matches);
  }
  /** Sólo con Calidad Alta (como los halos del jefe y de tus disparos): con la GPU no se nota (medido en Chromium a
   *  1440x900: 16,7 ms por fotograma con y sin luz), pero sin ella (Chromium sin aceleración) sube el fotograma de 20,5 a
   *  27 ms, y así la Calidad automática baja a Media, sin luz, y ahí se queda. */
  function activo() {
    if (!G.MODS || !G.MODS.luz) return false;
    if (typeof G.MODS.mundoConDex === 'function' && !G.MODS.mundoConDex()) return false;   // va con el mundo Dex (G.MODS.mundoDex)
    const fx = G.Settings && typeof G.Settings.fx === 'number' ? G.Settings.fx : 2;
    return fx >= 2;
  }
  function ambiente() {
    const k = Math.max(0.3, Math.min(1, +(G.MODS && G.MODS.luzAmbiente) || 0.88)), bi = G.World.biome;
    const t = bi < G.Tiles.ARENA ? TINTE[bi] || TINTE[0] : TINTE_ARENA;
    return 'rgb(' + t.map(v => Math.min(255, Math.round(255 * k * v))).join(',') + ')';
  }

  // Disco de luz de radio r píxeles de arte, del color dado, con el alfa en escalones de 0,05 (sin bordes duros).
  const discos = new Map();
  function disco(col, r) {
    const k = col + '/' + r;
    let d = discos.get(k);
    if (d) return d;
    const n = 2 * r + 1, [R, Gg, B] = [1, 3, 5].map(i => parseInt(col.slice(i, i + 2), 16));
    d = document.createElement('canvas'); d.width = d.height = n;
    const c = d.getContext('2d'), img = c.createImageData(n, n), px = img.data;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const t = Math.hypot(x - r, y - r) / (r + 0.5);
      if (t >= 1) continue;
      const o = (y * n + x) * 4;
      px[o] = R; px[o + 1] = Gg; px[o + 2] = B; px[o + 3] = Math.round(Math.round((1 - t) * (1 - t) * 20) / 20 * 255);
    }
    c.putImageData(img, 0, 0);
    if (discos.size > 96) discos.clear();
    discos.set(k, d);
    return d;
  }

  // Casillas de líquido de peligro de cada chunk (el terreno no cambia con el bioma; sí con la semilla y la arena).
  let firma = '';
  const liquidos = new Map();
  function liquidosDe(cx, cy) {
    const k = cx + ',' + cy;
    let l = liquidos.get(k);
    if (l) return l;
    l = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = (cx * N + i) * TS + TS / 2, y = (cy * N + j) * TS + TS / 2;
      if (G.World.isLiquid(x, y)) l.push(x, y);
    }
    if (liquidos.size > 64) liquidos.delete(liquidos.keys().next().value);
    liquidos.set(k, l);
    return l;
  }

  /** Las luces de este fotograma: { x, y, r (px de mundo), col, a, solo (sólo en el búfer, sin brillo encima) }. */
  function luces(cam, t, red) {
    const out = [];
    // 1. Tus ataques de fuego y eléctricos (disparos y orbes; los enemigos no alumbran: ya llevan su aro rojo).
    let n = 0;
    for (const p of G.Projectiles.all()) {
      if (n >= 40) break;
      const tipo = p.friendly && p.vis && p.vis.pal;
      if (tipo !== 'fire' && tipo !== 'electric') continue;
      if (!cam.sees(p.x, p.y, 60)) continue;
      const parpadeo = red ? 0 : tipo === 'electric' ? (Math.random() - 0.5) * 0.3 : Math.sin(t * 17 + p.x * 0.05) * 0.08;
      out.push({ x: p.x, y: p.y - G.LIFT * 0.5, r: p.r >= 8 ? 56 : 44, col: COLOR[tipo], a: 0.62 + parpadeo });
      n++;
    }
    // 2. El ácido y la lava (y el veneno y la chispa de las arenas): cada casilla, una luz floja que respira.
    const liq = G.World.liquidKind(), col = PELIGRO[liq];
    if (col) {
      const x0 = Math.floor(cam.left() / CW), x1 = Math.floor((cam.left() + cam.w) / CW);
      const y0 = Math.floor(cam.top() / CW), y1 = Math.floor((cam.top() + cam.h) / CW);
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
        const l = liquidosDe(cx, cy);
        for (let i = 0; i < l.length; i += 2) {
          const x = l[i], y = l[i + 1];
          if (!cam.sees(x, y, TS)) continue;
          const ph = G.U.hash(Math.floor(x / TS), Math.floor(y / TS), 77) * 6.28;
          out.push({ x, y, r: 46, col, a: 0.42 + (red ? 0 : Math.sin(t * 1.8 + ph) * 0.06), solo: true });   // sin brillo encima: son muchas
        }
      }
    }
    // 2b. Los campos de tus ataques de fuego y eléctricos: charcos, minas, torretas y meteoros (mientras caen).
    for (const f of (G.Combat && G.Combat.campos) || []) {
      const tipo = (f.m && f.m.type) || (f.vis && f.vis.pal);
      if (f.gone || (tipo !== 'fire' && tipo !== 'electric') || !cam.sees(f.x, f.y, 80)) continue;
      const vivo = f.life ? Math.max(0, Math.min(1, (f.life - f.t) * 2, f.t * 6)) : 1;
      if (f.kind === 'patch') out.push({ x: f.x, y: f.y, r: Math.max(36, (f.r || 30) * 1.15), col: COLOR[tipo], a: 0.5 * vivo });
      else if (f.kind === 'meteor') { if (f.t >= 0 && f.t < f.fall) out.push({ x: f.x, y: f.y, r: 40 + 30 * (f.t / f.fall), col: COLOR[tipo], a: 0.6 }); }
      else out.push({ x: f.x, y: f.y - (f.kind === 'turret' ? 16 : 0), r: 34, col: COLOR[tipo], a: 0.5 * vivo });
    }
    // 3. Los orbes de los tótems sin usar (donde los pinta drawProp: 11 píxeles de arte desde arriba del sprite).
    for (const p of G.World.visibleProps(cam)) {
      if (p.type !== 'altar' || p.used) continue;
      const img = G.Tiles.propSprite(G.World.biome, 'altar', p.kind * 2);
      const h = img ? img.height * PX : 54;
      out.push({ x: p.x, y: p.y - h + 11 * PX, r: 60, col: ORBE[p.kind] || ORBE[0], a: 0.7 + (red ? 0 : Math.sin(t * 3 + p.wiggle) * 0.1) });
    }
    // 4. La grieta abierta: su violeta, latiendo (quieta con «Menos sacudidas»), entra y sale con su vida.
    const rf = G.Rift && G.Rift.rift;
    if (rf && cam.sees(rf.x, rf.y, 120)) {
      const f = Math.max(0, Math.min(1, rf.t * 2, rf.ttl / 1.5));
      out.push({ x: rf.x, y: rf.y - 20, r: 110, col: GRIETA, a: (0.75 + (red ? 0 : Math.sin(t * 6.2832) * 0.08)) * f });
    }
    return out;
  }

  /** Las zonas de los avisos del suelo, a 1 en el búfer (en px de arte, desde el origen del búfer). */
  function sinOscurecer(c, ox, oy) {
    c.fillStyle = '#fff';
    for (const h of G.Hazards.all) {
      if (h.hit) continue;
      c.save();
      c.translate((h.x - ox) / PX, (h.y - oy) / PX);
      c.beginPath();
      if (h.kind === 'zone') c.ellipse(0, 0, h.r / PX + 2, h.r * 0.75 / PX + 2, 0, 0, 6.2832);
      else { c.rotate(h.angle); c.rect(-2, -h.w / 2 / PX - 2, h.len / PX + 4, h.w / PX + 4); }
      c.fill();
      c.restore();
    }
  }

  /**
   * game.js, render(): después de drawScene y G.Claridad.encima, antes de los disparos (coordenadas de mundo, con la
   * cámara). Multiplica el búfer de luz sobre lo pintado y suma el brillo de las luces.
   */
  function pintar(ctx, cam) {
    if (!activo() || !G.World || !cam) return;
    const a = G.World.arena;
    const f = G.World.semilla + '|' + (a ? a.tx + ',' + a.ty + ',' + a.type : '-');
    if (f !== firma) { firma = f; liquidos.clear(); }
    const W = Math.ceil(cam.w / PX) + 2, H = Math.ceil(cam.h / PX) + 2;
    if (!cv) { cv = document.createElement('canvas'); lc = cv.getContext('2d'); }
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const ox = Math.floor(cam.left() / PX) * PX, oy = Math.floor(cam.top() / PX) * PX;
    const t = performance.now() / 1000, red = reducido(), L = luces(cam, t, red);
    lc.globalCompositeOperation = 'source-over';
    lc.globalAlpha = 1;
    lc.fillStyle = ambiente();
    lc.fillRect(0, 0, W, H);
    lc.globalCompositeOperation = 'lighter';
    for (const l of L) {
      const r = Math.max(2, Math.round(l.r / PX)), d = disco(l.col, r);
      lc.globalAlpha = Math.max(0, Math.min(1, l.a));
      lc.drawImage(d, Math.round((l.x - ox) / PX) - r, Math.round((l.y - oy) / PX) - r);
    }
    lc.globalAlpha = 1;
    lc.globalCompositeOperation = 'source-over';
    sinOscurecer(lc, ox, oy);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(cv, 0, 0, W, H, ox, oy, W * PX, H * PX);
    ctx.globalCompositeOperation = 'lighter';
    const k = BRILLO * (red ? 0.5 : 1);
    for (const l of L) {
      if (l.solo) continue;
      const r = Math.max(2, Math.round(l.r / PX)), d = disco(l.col, r);
      ctx.globalAlpha = Math.max(0, Math.min(1, l.a * k));
      ctx.drawImage(d, (Math.round(l.x / PX) - r) * PX, (Math.round(l.y / PX) - r) * PX, d.width * PX, d.height * PX);
    }
    ctx.restore();
  }

  return { pintar, activo, luces, alumbra: tipo => tipo === 'fire' || tipo === 'electric', get lienzo() { return cv; } };
})();
