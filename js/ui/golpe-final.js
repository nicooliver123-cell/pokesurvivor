/* ============ golpe-final.js — golpe final al derrotar a un jefe (MOD nico) ============
 * Lote 4 de la identidad «Dex de Expedición» (guía de marca §10.3 con la corrección de la revisión cruzada; aprobado:
 * «sólo en solitario, con jefes y legendarios»). En los dos estilos. Ajustes en js/core/mods.js (golpeFinalMs y
 * golpeFinalSacudida).
 *
 * Cuando, jugando SOLO, cae un jefe o el legendario de la grieta (no una copia de la red, no con tu Pokémon caído):
 *   1. el juego se queda quieto golpeFinalMs (140 ms, en tiempo real) y se sigue dibujando: update() de game.js no
 *      avanza (ni el reloj de la partida; G.Guard sólo vigila que el juego no vaya más rápido que el tiempo real);
 *   2. el derrotado sale blanco 2 fotogramas (su e.flash, que se sigue pintando en la animación Faint);
 *   3. después, una sacudida amortiguada A·e^(−t/τ)·sin(2π·f·t) (A = 4 px de mundo, f = 9 Hz, τ = 0,12 s, 0,4 s) en la
 *      dirección de tu Pokémon al derrotado, en vez del temblor al azar de Camera.kick (que se anula).
 * «Menos sacudidas y destellos»: ×0,25 y sin destello. Movimiento reducido (prefers-reduced-motion): sin sacudida.
 * En grupo, nada: congelaría a los demás (y el reloj lo lleva el anfitrión).
 *
 * Ganchos «// MOD nico» de una línea: enemy.js die() (derrotado), game.js update() (congelar) y camera.js follow()
 * (sacudida).
 */
G.GolpeFinal = (() => {
  const A = 4, F = 9, TAU = 0.12, DUR = 0.4, FOTOGRAMAS_BLANCO = 2;
  const MODS = () => G.MODS || {};
  const ahora = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  let mq = null;
  function reducido() {
    try { if (!mq && typeof matchMedia === 'function') mq = matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) { mq = null; }
    return !!(mq && mq.matches);
  }
  const calma = () => !!(G.Settings && G.Settings.get && G.Settings.get('calm'));

  let hielo = null;     // congelación: { hasta }
  let blanco = null;    // destello del derrotado: { e, vistos }
  let golpe = null;     // sacudida: { t (−1 hasta que acaba la congelación), dx, dy, a }

  /** ¿Tiene golpe final esta caída? Sólo en solitario, con un jefe o legendario propio y tu Pokémon en pie. */
  function toca(e) {
    if (!e || e.remote || !(e.boss || e.legend)) return false;
    if (G.Coop && G.Coop.active) return false;
    const pl = G.Game && G.Game.player;
    return !!pl && !pl.dead;
  }

  /** enemy.js die(), tras descartar las copias de la red: cae `e`. */
  function derrotado(e) {
    if (!toca(e)) return false;
    const ms = +MODS().golpeFinalMs;
    const pl = G.Game.player, dx = e.x - pl.x, dy = e.y - pl.y, d = Math.hypot(dx, dy) || 1;
    hielo = ms > 0 && isFinite(ms) ? { hasta: ahora() + ms } : null;
    if (!calma()) { e.flash = 1; blanco = { e, vistos: 0 }; }   // blanco; congelar() lo apaga a los 2 fotogramas
    golpe = MODS().golpeFinalSacudida !== false ? { t: -1, dx: dx / d, dy: dy / d, a: reducido() ? 0 : A * (calma() ? 0.25 : 1) } : null;
    return true;
  }

  /** game.js, primera línea de update(): true mientras dura la congelación (ese fotograma no avanza). */
  function congelar() {
    // El derrotado se pintó blanco en el fotograma en que cayó y en el siguiente: aquí empieza el tercero.
    if (blanco && ++blanco.vistos >= FOTOGRAMAS_BLANCO) { blanco.e.flash = 0; blanco = null; }
    if (!hielo) return false;
    if (G.Coop && G.Coop.active) { hielo = null; return false; }
    if (ahora() < hielo.hasta) return true;
    hielo = null;
    if (golpe) golpe.t = 0;                // la sacudida empieza al acabar la congelación
    return false;
  }

  /** camera.js follow(), tras el temblor de upstream: mientras dura, la sacudida amortiguada en su lugar. */
  function sacudida(cam, dt) {
    if (!golpe) return;
    if (golpe.t < 0) { if (!hielo) golpe.t = 0; else return; }
    golpe.t += Math.max(0, dt || 0);
    if (golpe.t >= DUR) { golpe = null; return; }
    const t = golpe.t, v = golpe.a * Math.exp(-t / TAU) * Math.sin(2 * Math.PI * F * t);
    cam.shake = 0;                         // sin el temblor al azar de kick()
    cam._sx = golpe.dx * v; cam._sy = golpe.dy * v;
  }

  function reiniciar() { hielo = null; blanco = null; golpe = null; }

  return { derrotado, congelar, sacudida, reiniciar, toca, A, F, TAU, DUR,
    get congelado() { return !!hielo; }, get activo() { return !!(hielo || golpe); } };
})();
