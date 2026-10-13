/* ============ horno.js — horneado escalonado del suelo (MOD nico) ============
 * Lote 3 de la identidad «Dex de Expedición» (guía §11.8 y plan U8, con las correcciones de la revisión cruzada).
 * Upstream hornea cada chunk de suelo (512×512 px de mundo, 256×256 de arte) la primera vez que se ve, en el mismo
 * fotograma. Al cambiar de bioma (cada 4 min y cada 30 s en el fondo de los menús) se rehorneaban de golpe todos los
 * visibles: un tirón de 20-45 ms (más con la gradación del Gremio, 3,3-3,7 ms por chunk, que no se puede partir).
 *
 * Reglas (en los dos estilos: es rendimiento, no estética; el chunk horneado no cambia):
 *   - como mucho UN chunk por fotograma, y sólo si en ese fotograma no se ha horneado ya otro; con un chunk más caro que
 *     el presupuesto (G.MODS.hornoMsFotograma, 4 ms; un móvil lento), uno cada ceil(coste / presupuesto) fotogramas;
 *   - precalentado: desde G.MODS.hornoAnticipoS (3 s) antes de cada cambio de bioma (t % 240 ≥ 237, nunca en la arena),
 *     se hornean en un mapa propio los chunks visibles y un anillo de 1 chunk con la paleta siguiente, un chunk cada 2
 *     fotogramas, primero el más cercano a tu Pokémon. Al cambiar, pasan al mapa nuevo (alCambiar): 0 chunks horneados en
 *     el fotograma del cambio. En el fondo de los menús se precalienta siempre el bioma siguiente, porque cambia cada 30 s;
 *   - red de seguridad (si el precalentado no llegó: cámara rápida, un salto de reloj, o al cambiar de estilo): mientras
 *     se funde el bioma (o justo después de cambiar de estilo), un chunk que falta y del que hay imagen vieja se sigue
 *     viendo con la vieja (aplazar), sin guardarla en el mapa nuevo, y el horno lo hace después, del más cercano al más
 *     lejano: el bioma nuevo se extiende desde tu Pokémon en unos pocos fotogramas;
 *   - con margen libre, el anillo de 1 chunk del bioma actual, para no hornear de golpe al cruzar una esquina.
 * Lo precalentado se descarta si cambia el mundo (otra semilla), se abre una arena o cambia el estilo.
 *
 * Ganchos «// MOD nico» en world.js: chunkImage (aplazar), setBiome (alCambiar), su return (chunkImage, la semilla y
 * rehornear) y tick() lo llama G.Entorno.suelo en cada fotograma (también en el fondo de los menús). Si falta este
 * fichero o algún gancho, todo hornea como upstream.
 */
G.Horno = (() => {
  const ahora = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const presupuesto = () => { const v = +(G.MODS && G.MODS.hornoMsFotograma); return v > 0 ? v : 4; };
  const anticipo = () => { const v = +(G.MODS && G.MODS.hornoAnticipoS); return v >= 0 && isFinite(v) ? v : 3; };
  const PERIODO = 240;                 // s entre cambios de bioma en partida (game.js, update: Math.floor(time / 240))

  /** Contadores (para las pruebas y el informe de rendimiento). */
  const stats = { horneados: 0, forzados: 0, propios: 0, precalentados: 0, aplazados: 0, cambios: 0,
                  maxPorFotograma: 0, msMax: 0, msMedio: 0, ultimoCambio: null };

  let pre = null;                      // { bioma, clave, mapa: Map } con el bioma siguiente
  let viejas = null, viejasDe = null;  // imágenes de antes de cambiar de estilo (red de seguridad) y su mundo
  const pendientes = new Map();        // chunks aplazados en este fotograma: "cx,cy" -> [cx, cy]
  let propio = false, fallo = false;   // horneando el horno (no se aplaza) / ¿hubo que hornear?
  let forzado = null;                  // inicio de un horneado de drawGround que no se pudo aplazar
  let fotograma = { n: 0, ms: 0 };     // lo horneado en el fotograma en curso
  let turno = 0, ultimoPropio = -99, cambioPendiente = false;
  let conGancho = false;               // ¿world.js llama a aplazar()? Sin ese gancho, el horno no hornea el anillo

  function cerrarForzado() { if (forzado !== null) { fotograma.ms += ahora() - forzado; forzado = null; } }
  function apuntar(ms) {
    stats.horneados++;
    stats.msMedio = stats.msMedio ? stats.msMedio * 0.8 + ms * 0.2 : ms;
  }
  /** La clave de lo que hace válida una imagen: el mundo (semilla), la arena abierta y el estilo. */
  function clave() { return [G.World.semilla, G.World.arena, G.Estilo ? G.Estilo.actual : '']; }
  const misma = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i]);
  function validar() {
    if (pre && !misma(pre.clave, clave())) pre = null;
    if (viejas && (viejasDe[0] !== G.World.semilla || viejasDe[1] !== G.World.arena)) viejas = null;   // otro mundo u otra arena
  }

  /** Chunks de la vista (con `margen` chunks alrededor), del más cercano a (x, y) al más lejano. */
  function chunks(cam, margen, x, y) {
    const CW = G.World.CW, out = [];
    const x0 = Math.floor(cam.left() / CW) - margen, x1 = Math.floor((cam.left() + cam.w) / CW) + margen;
    const y0 = Math.floor(cam.top() / CW) - margen, y1 = Math.floor((cam.top() + cam.h) / CW) + margen;
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) out.push([cx, cy, Math.hypot((cx + 0.5) * CW - x, (cy + 0.5) * CW - y)]);
    return out.sort((a, b) => a[2] - b[2]);
  }
  function centro(cam) {
    const p = G.Game && G.Game.player;
    return p && G.Game.state !== 'ui' ? [p.x, p.y] : [cam.x, cam.y];
  }

  /** El bioma que viene, si toca precalentarlo: en el fondo de los menús, siempre el siguiente (cambia cada 30 s);
   *  en partida, desde `hornoAnticipoS` antes de cada cambio (nunca en la arena). Si no, null. */
  function siguiente() {
    const n = G.Tiles.NORMAL, b = G.World.biome;
    if (!G.Game) return null;
    if (G.Game.state === 'ui') return b < n ? (b + 1) % n : null;
    if (G.Rift && G.Rift.inArena) return null;
    const t = G.Game.st ? +G.Game.st.time : NaN;
    if (!isFinite(t) || t % PERIODO < PERIODO - anticipo()) return null;
    const i = Math.floor(t / PERIODO) + 1;
    let s = G.MODS && G.MODS.biomaNormal ? G.MODS.biomaNormal(i) : i;
    if (s < G.Tiles.ARENA) s = ((s % n) + n) % n;                  // como setBiome
    return s === b ? null : s;
  }

  /** ¿Puede hornear el horno en este fotograma? Nada horneado aún en él y la cadencia (cada `cada` fotogramas, o más
   *  si un chunk cuesta más que el presupuesto). */
  function puede(cada) {
    return fotograma.n === 0 && turno - ultimoPropio >= Math.max(cada, Math.ceil(stats.msMedio / presupuesto()) || 1);
  }
  /** Hornea (cx, cy) en `mapa` (o en el mapa del bioma actual) y lo apunta. Devuelve true si ha hecho falta hornear. */
  function hornear(cx, cy, bioma, mapa) {
    const t0 = ahora();
    propio = true; fallo = false;
    try {
      if (mapa) { if (!mapa.has(cx + ',' + cy)) { fallo = true; G.World.chunkImage(cx, cy, bioma, mapa); } }
      else G.World.chunkImage(cx, cy);
    } finally { propio = false; }
    if (!fallo) return false;
    const ms = ahora() - t0;
    fotograma.n++; fotograma.ms += ms; ultimoPropio = turno;
    stats.propios++; apuntar(ms);
    if (mapa) stats.precalentados++;
    return true;
  }

  /**
   * world.js, chunkImage, tras no encontrar el chunk "cx,cy" (`fade`: el fundido de bioma en curso, o null; `actual`: si es
   * el mapa del bioma actual). En el mapa actual, si hay una imagen vieja de ese chunk (la del bioma anterior durante el
   * fundido, o la de antes de cambiar de estilo), la devuelve para pintarla en su lugar (world.js no la guarda) y el horno
   * lo hará después. Si no la hay, o es el mapa del bioma anterior (un chunk que no se había visto), null: world.js lo
   * hornea ya, como upstream, y se apunta como horneado de este fotograma (ese fotograma el horno no hornea nada más).
   */
  function aplazar(k, fade, actual = true) {
    cerrarForzado();
    conGancho = true;
    if (propio) { fallo = true; return null; }
    if (viejas) validar();
    // Sin tick() (sin entorno.js) nadie lo hornearía después: no se aplaza nada.
    const viejo = actual && turno > 0 ? (fade && fade.images && fade.images.get(k)) || (viejas && viejas.get(k)) || null : null;
    if (viejo) {
      const [cx, cy] = k.split(',').map(Number);
      pendientes.set(k, [cx, cy]);
      stats.aplazados++;
      return viejo;
    }
    forzado = ahora();
    fotograma.n++; stats.forzados++; stats.horneados++;
    return null;
  }

  /** world.js, setBiome, con el mapa nuevo (vacío): le pasa lo precalentado de ese bioma, si es válido. */
  function alCambiar(b, mapa) {
    validar();
    let n = 0;
    if (pre && pre.bioma === b && mapa) for (const [k, img] of pre.mapa) if (!mapa.has(k)) { mapa.set(k, img); n++; }
    pre = null;
    stats.cambios++;
    stats.ultimoCambio = { bioma: b, precalentados: n, horneados: null, ms: null };
    cambioPendiente = true;
  }

  /** Al cambiar de estilo (entorno.js): el suelo se rehornea poco a poco; mientras, cada chunk se ve con su imagen vieja. */
  function rehornear() {
    pre = null;
    if (!G.World.rehornear) return;
    validar();
    const v = G.World.rehornear(), antes = viejas;
    viejas = v && v.size ? v : null;
    viejasDe = [G.World.semilla, G.World.arena];
    if (antes) { viejas = viejas || new Map(); for (const [k, img] of antes) if (!viejas.has(k)) viejas.set(k, img); }
  }

  /**
   * Una vez por fotograma, después de pintar el terreno (G.Entorno.suelo; también en el fondo de los menús): hornea como
   * mucho un chunk, por este orden: el aplazado más cercano a tu Pokémon, el bioma siguiente si toca precalentarlo (uno
   * cada 2 fotogramas) y el anillo del bioma actual (uno cada 2 fotogramas). Nada en el fotograma de un cambio de bioma.
   * Cierra las cuentas del fotograma.
   */
  function tick(cam) {
    cerrarForzado();
    turno++;
    validar();
    const [x, y] = centro(cam), libre = !cambioPendiente;
    let hecho = false;
    if (pendientes.size) {
      if (libre && puede(1)) {
        let mejor = null, dm = Infinity;
        for (const [cx, cy] of pendientes.values()) { const d = Math.hypot((cx + 0.5) * G.World.CW - x, (cy + 0.5) * G.World.CW - y); if (d < dm) { dm = d; mejor = [cx, cy]; } }
        hecho = hornear(mejor[0], mejor[1], null, null);
      }
    } else if (viejas) viejas = null;                                // ya está todo lo visible: fuera las viejas
    if (libre && !hecho && !pendientes.size && puede(2)) {
      const s = siguiente();
      if (s !== null) {
        if (!pre || pre.bioma !== s) pre = { bioma: s, clave: clave(), mapa: new Map() };
        for (const [cx, cy] of chunks(cam, 1, x, y)) if (!pre.mapa.has(cx + ',' + cy)) { hecho = hornear(cx, cy, s, pre.mapa); break; }
      }
      if (!hecho && conGancho) for (const [cx, cy] of chunks(cam, 1, x, y)) if (hornear(cx, cy, null, null)) { hecho = true; break; }
    }
    if (cambioPendiente && stats.ultimoCambio) { stats.ultimoCambio.horneados = fotograma.n; stats.ultimoCambio.ms = +fotograma.ms.toFixed(2); cambioPendiente = false; }
    stats.maxPorFotograma = Math.max(stats.maxPorFotograma, fotograma.n);
    stats.msMax = Math.max(stats.msMax, fotograma.ms);
    fotograma = { n: 0, ms: 0 };
    pendientes.clear();
  }

  return {
    tick, aplazar, alCambiar, rehornear, siguiente, stats,
    get precalentado() { return pre ? { bioma: pre.bioma, n: pre.mapa.size } : null; },
    get conViejas() { return !!viejas; }
  };
})();
