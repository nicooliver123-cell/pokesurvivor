/* ============ relieve.js — 2.5D falsa: paredes y crestas con altura (MOD nico) ============
 * PLAN.md, punto 10 (valoración del 14-10-2026; aprobado por Nico con las capturas el mismo día, con altura 8).
 * Con G.MODS.relieveAltura > 0 y los mapas propios, cada pared se levanta H px de arte: su techo sube H y su cara pasa
 * de 8 a 8 + H (lo pinta G.Mapas.pintarRelieve, con los materiales de mapas-pintar.js, en un lienzo aparte por chunk).
 * Cada fila de paredes seguidas es un objeto más de la escena de drawScene (game.js), ordenado por Y con el borde norte
 * de su casilla: lo que está al norte de una cresta, con los pies en los H px que cubre el techo subido, queda detrás;
 * lo que está a su lado o delante, delante. El chunk del suelo no cambia: debajo sigue la pared plana, que el
 * relieve tapa entera salvo las esquinas recortadas (ahí el chunk ya enseña lo de al lado), así que un chunk cuyo
 * relieve aún no está hecho se ve como hasta ahora durante ese fotograma.
 * Sólo dibuja: la colisión, la cámara, la red y la lógica no cambian (cada cliente lo pinta con su mundo, que es el
 * mismo). Lo que vuela por encima de una pared (voladores, fantasmas y jefes ignoran el terreno) se pinta encima de esa
 * cresta: su orden pasa al pie de la última pared que tiene debajo hacia el sur. G.Claridad cuenta cada tramo como un
 * árbol (ent.caja, el rectángulo del tramo): si tapa el 20 % o más de tu Pokémon, lo repinta encima.
 * Va con el mundo Dex (G.MODS.mundoDex: en los dos estilos). Gancho de una línea en game.js (drawScene, antes de
 * ordenar) y getter `fundido` en world.js (el fundido de bioma).
 */
G.Relieve = (() => {
  const PX = G.Sprites.PX, T = G.Tiles.T, N = 16, TS = T * PX, CW = N * TS;
  const MAX = 64;                          // lienzos guardados (por bioma y chunk)
  let firma = '';
  const geo = new Map();                   // "cx,cy" -> tramos del chunk (el terreno no depende del bioma)
  const lienzos = new Map();               // "bi|cx,cy" -> lienzo del relieve de ese bioma (o null si no hay pared)
  const ultimo = new Map();                // "cx,cy" -> el último lienzo hecho de ese chunk, de cualquier bioma
  let biAhora = 0, fundido = null;         // el bioma y el fundido de este fotograma (los usa draw de cada tramo)

  /** La altura en px de arte (0 = sin relieve: sin el ajuste, sin los mapas propios o sin el pintor). */
  function altura() {
    const h = G.MODS && +G.MODS.relieveAltura;
    if (!(h > 0) || !G.Mapas || !G.Mapas.activo || typeof G.Mapas.pintarRelieve !== 'function') return 0;
    if (typeof G.MODS.mundoConDex === 'function' && !G.MODS.mundoConDex()) return 0;   // va con el mundo Dex (G.MODS.mundoDex)
    return Math.min(16, Math.round(h));
  }
  /** Lo que cambia el terreno: la semilla, la arena de la grieta y la altura. Si cambia, se olvida todo. */
  function firmaMundo(H) {
    const a = G.World.arena;
    return G.World.semilla + '|' + (a ? a.tx + ',' + a.ty + ',' + a.type : '-') + '|' + H;
  }

  /** Pinta el relieve del chunk en el bioma `bi`; la primera vez, también apunta sus tramos. */
  function hornear(cx, cy, bi, H) {
    const k = cx + ',' + cy, r = G.Mapas.pintarRelieve(cx, cy, N, bi, G.World.semilla, H);
    if (!geo.has(k)) geo.set(k, r.tramos.map(t => tramo(t, cx, cy, H)));
    if (lienzos.size >= MAX) lienzos.delete(lienzos.keys().next().value);
    lienzos.set(bi + '|' + k, r.cv);
    if (r.cv) ultimo.set(k, r.cv);
    if (ultimo.size > MAX) ultimo.delete(ultimo.keys().next().value);
    return r.cv;
  }
  function lienzo(bi, cx, cy) { return lienzos.get(bi + '|' + cx + ',' + cy); }

  /** El objeto de la escena de un tramo: { y: su pie, ent: { draw, caja } }. */
  function tramo(t, cx, cy, H) {
    const sx = t.i0 * T, sy = t.j * T, sw = (t.i1 - t.i0 + 1) * T, sh = T + (t.cara ? H : 0);
    const x = cx * CW + sx * PX, y = cy * CW + (sy - H) * PX, w = sw * PX, h = sh * PX;
    const ent = {
      relieve: true,
      caja: [x, y, x + w, y + h],
      draw(ctx) {
        // Si el de este bioma aún no está hecho (como mucho un fotograma o dos), el de otro: la forma es la misma.
        const cv = lienzo(biAhora, cx, cy) || ultimo.get(cx + ',' + cy);
        if (!cv) return;
        // +1 de solape (como los chunks del suelo): con escalas no enteras, sin juntas entre tramos y filas.
        if (fundido && fundido.k < 1) {
          const viejo = lienzo(fundido.from, cx, cy);
          if (viejo) {
            ctx.drawImage(viejo, sx, sy, sw, sh, x, y, w + 1, h + (t.cara ? 0 : 1));
            ctx.globalAlpha = fundido.k;
          }
        }
        ctx.drawImage(cv, sx, sy, sw, sh, x, y, w + 1, h + (t.cara ? 0 : 1));
        ctx.globalAlpha = 1;
      }
    };
    // Orden: el borde norte de su casilla. Lo que tiene los pies al norte (también en los H px que tapa el techo subido)
    // va detrás; lo que está al lado de la pared, a su altura, y lo de delante, delante (con el borde sur, lo de al lado
    // quedaba detrás de la cara, recortado por la pared que tiene al lado).
    return { y: cy * CW + t.j * TS, ent };
  }

  /** Bajo una pared, ¿hasta dónde sigue hacia el sur? El pie de la última (para pintar encima lo que vuela). */
  function pieBajo(x, y) {
    const tx = Math.floor(x / TS);
    let ty = Math.floor(y / TS);
    for (let n = 0; n < 64 && G.World.isWall(tx * TS + 1, (ty + 1) * TS + 1); n++) ty++;
    return (ty + 1) * TS + 0.01;
  }

  /**
   * game.js, drawScene, antes de ordenar la escena: los tramos de pared visibles, como objetos con pies, y lo que
   * vuela por encima de una pared, detrás de su último tramo. Coordenadas de mundo.
   */
  function escena(items, cam) {
    const H = altura();
    if (!H || !G.World) return;
    const f = firmaMundo(H);
    if (f !== firma) { firma = f; geo.clear(); lienzos.clear(); ultimo.clear(); }
    biAhora = G.World.biome;
    fundido = typeof G.World.fundido === 'function' ? G.World.fundido() : null;
    const L = cam.left(), Tp = cam.top(), R = L + cam.w, B = Tp + cam.h;
    // Lienzos nuevos: como mucho uno por fotograma, salvo el de un chunk que aún no tiene ninguno (sin él, sus paredes
    // salen planas; entonces hasta dos). Con lo que sobra, el del bioma del fundido y, desde G.Horno.siguiente() (3 s
    // antes de cada cambio de bioma; en el fondo de los menús, siempre), el del bioma que viene: al cambiar, ninguno.
    let nuevos = 1, extra = 1;
    const sig = G.Horno && typeof G.Horno.siguiente === 'function' ? G.Horno.siguiente() : null;
    // El techo de una fila sube H: la fila de chunks de debajo de la vista también puede asomar.
    const x0 = Math.floor(L / CW), x1 = Math.floor(R / CW), y0 = Math.floor(Tp / CW), y1 = Math.floor((B + H * PX) / CW);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const k = cx + ',' + cy;
      if (lienzo(biAhora, cx, cy) === undefined) {
        if (nuevos > 0) { nuevos--; hornear(cx, cy, biAhora, H); } else if (!geo.has(k) && extra > 0) { extra--; hornear(cx, cy, biAhora, H); }
      }
      for (const it of geo.get(k) || []) {
        const c = it.ent.caja;
        if (c[2] > L && c[0] < R && c[3] > Tp && c[1] < B) items.push(it);
      }
    }
    for (const b of [fundido && fundido.k < 1 ? fundido.from : null, sig]) {
      if (b == null || b === biAhora || nuevos <= 0) continue;
      for (let cy = y0; cy <= y1 && nuevos > 0; cy++) for (let cx = x0; cx <= x1 && nuevos > 0; cx++) {
        if (lienzo(b, cx, cy) === undefined) { nuevos--; hornear(cx, cy, b, H); }
      }
    }
    for (const it of items) {
      const e = it.ent;
      if (!e || e.relieve || it.prop || typeof e.x !== 'number' || typeof e.y !== 'number') continue;
      if (G.World.isWall(e.x, e.y)) it.y = Math.max(it.y, pieBajo(e.x, e.y));
    }
  }

  return { escena, altura, get cache() { return { geo: geo.size, lienzos: lienzos.size }; } };
})();
