/* ============ sombras.js — sombras con un sol fijo (MOD nico) ============
 * PLAN.md, punto 10 (2.5D falsa, aprobada por Nico el 14-10-2026). El sol está fijo arriba a la izquierda (al noroeste):
 * cada cosa con altura deja su sombra en el suelo hacia el sureste, SOL.x px a la derecha y SOL.y px hacia abajo por
 * cada píxel de arte de alto. Va con el mundo Dex (G.MODS.mundoConDex) y con G.MODS.sombras.
 *
 *   paredes   horneada en el chunk (entorno.js, gradar, una línea al final): un píxel de SUELO (la máscara del pintor)
 *             está a la sombra si, remontando el rayo del sol desde él, entra en una pared antes de su altura (la cara,
 *             8 px, más el relieve, G.Relieve.altura()). Sólo se miran las casillas de suelo con una pared al oeste, al
 *             noroeste o al norte (la sombra no llega más lejos de una casilla). Los dos últimos píxeles del rayo, a la
 *             mitad (penumbra). Determinista: función del terreno y de las coordenadas globales.
 *   objetos   árboles, rocas, cofres, tótems, columnas y cristales (no la hierba ni los planos): la silueta del sprite,
 *             inclinada y aplastada hacia el sureste (cada píxel a z de alto cae en (x + z·SOL.x, pie + z·SOL.y)),
 *             hecha una vez por sprite y pintada en la capa del suelo (entorno.js, suelo, una línea): debajo de todo lo
 *             que tiene pies. Por fotograma, porque los objetos se rompen; cuesta un drawImage por objeto a la vista.
 * Sólo dibuja: nada viaja por la red y la partida no cambia.
 */
G.Sombras = (() => {
  const PX = G.Sprites.PX, T = G.Tiles.T;
  const SOL = { x: 0.55, y: 0.3 };          // desplazamiento de la sombra por píxel de arte de alto
  const FUERZA = 0.36, PENUMBRA = 0.18;     // cuánto se acerca el suelo a su color de sombra (y en la penumbra)
  const ALFA_OBJETO = 0.26;                 // la sombra de los objetos (negra)

  function activas() {
    const M = G.MODS || {};
    return M.sombras !== false && (typeof M.mundoConDex !== 'function' || M.mundoConDex());
  }
  /** La altura de una pared en px de arte: la cara (8) más el relieve. */
  function alturaPared() { return 8 + (G.Relieve && typeof G.Relieve.altura === 'function' ? G.Relieve.altura() : 0); }

  // ---------------- paredes (horneadas) ----------------
  let rej = null, rejS = 0;
  /**
   * entorno.js, al final de gradar(): oscurece hacia `sombra` (hex, el color de sombra del suelo de ese bioma) los
   * píxeles de suelo del chunk (cx, cy) de n×n casillas que caen en la sombra de una pared. P: get/set/suelo de gradar.
   */
  function paredes(P, cx, cy, n, at, sombra) {
    if (!activas() || !/^#[0-9a-f]{6}$/i.test(sombra || '')) return;
    const h = alturaPared(), S = n + 2, tx0 = cx * n - 1, ty0 = cy * n - 1;
    if (!rej || rejS !== S) { rej = new Uint8Array(S * S); rejS = S; }
    let alguna = false;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const w = at(tx0 + i, ty0 + j) === 'wall' ? 1 : 0; rej[j * S + i] = w; if (w) alguna = true; }
    if (!alguna) return;
    const v = parseInt(sombra.slice(1), 16), sr = (v >> 16) & 255, sg = (v >> 8) & 255, sb = v & 255;
    const gx0 = cx * n * T, gy0 = cy * n * T;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const o = (j + 1) * S + i + 1;
      if (rej[o] || !(rej[o - 1] || rej[o - S - 1] || rej[o - S])) continue;   // suelo con pared al oeste, noroeste o norte
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        const px = i * T + x, py = j * T + y;
        if (P.suelo && !P.suelo(px, py)) continue;
        // Remonta el rayo: el primer z (1..h) en que el punto (gx − z·SOL.x, gy − z·SOL.y) cae en una pared.
        const gx = gx0 + px + 0.5, gy = gy0 + py + 0.5;
        let z = 0;
        for (let k = 1; k <= h; k++) {
          const tx = Math.floor((gx - k * SOL.x) / T) - tx0, ty = Math.floor((gy - k * SOL.y) / T) - ty0;
          if (tx >= 0 && ty >= 0 && tx < S && ty < S && rej[ty * S + tx]) { z = k; break; }
        }
        if (!z) continue;
        const t = z > h - 2 ? PENUMBRA : FUERZA, c = P.get(px, py);
        const r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
        P.set(px, py, ((c & 0xff000000) | (((b + (sb - b) * t + 0.5) | 0) << 16) | (((g + (sg - g) * t + 0.5) | 0) << 8) | ((r + (sr - r) * t + 0.5) | 0)) >>> 0);
      }
    }
  }

  // ---------------- objetos (por fotograma) ----------------
  const siluetas = new WeakMap();
  /** La sombra de un sprite (a resolución de arte): { cv, dx } con cv la silueta inclinada; su fila 0 es la del pie. */
  function silueta(img) {
    let s = siluetas.get(img);
    if (s !== undefined) return s;
    s = null;
    try {
      const w = img.width, hh = img.height, c0 = document.createElement('canvas');
      c0.width = w; c0.height = hh;
      const x0 = c0.getContext('2d');
      x0.drawImage(img, 0, 0);
      const d = x0.getImageData(0, 0, w, hh).data;
      const W = w + Math.ceil(hh * SOL.x) + 1, H = Math.ceil(hh * SOL.y) + 2, pie = hh - 1;
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const c = cv.getContext('2d'), out = c.createImageData(W, H), o = out.data;
      for (let v = 0; v < hh; v++) for (let u = 0; u < w; u++) {
        if (d[(v * w + u) * 4 + 3] < 128) continue;
        const z = pie - v, x = Math.round(u + z * SOL.x), y = Math.round(z * SOL.y);
        if (x < 0 || x >= W || y >= H) continue;
        o[(y * W + x) * 4 + 3] = 255;
      }
      c.putImageData(out, 0, 0);
      s = { cv };
    } catch (e) { s = null; }            // sin poder leer la imagen (file://): sin sombra
    siluetas.set(img, s);
    return s;
  }

  /** entorno.js, capa del suelo (coordenadas de mundo): la sombra de cada objeto a la vista, debajo de todo. */
  function objetos(ctx, cam) {
    if (!activas() || !G.World || !G.Tiles.propSprite) return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = ALFA_OBJETO;
    for (const p of G.World.visibleProps(cam)) {
      if (p.flat || p.type === 'grass') continue;
      const img = G.Tiles.propSprite(G.World.biome, p.type, p.type === 'altar' ? p.kind * 2 + (p.used ? 1 : 0) : 0);
      if (!img || !img.width) continue;
      const s = silueta(img);
      if (!s) continue;
      const x = Math.round(p.x - img.width * PX / 2), y = Math.round(p.y - img.height * PX + 2) + (img.height - 1) * PX;
      ctx.drawImage(s.cv, x, y, s.cv.width * PX, s.cv.height * PX);
    }
    ctx.restore();
  }

  return { paredes, objetos, silueta, activas, alturaPared, SOL };
})();
