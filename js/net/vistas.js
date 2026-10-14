/* ============ vistas.js — la vista de cada jugador en el cooperativo (MOD nico) ============
 * Upstream hace aparecer a los enemigos justo fuera de la vista y saca por delante a los rezagados que nadie ve, pero
 * en grupo lo mide para todos con la vista del ANFITRIÓN (G.Camera, la suya): el anillo de js/systems/spawner.js, su
 * «¿lo ve alguien?» (un círculo del radio del anfitrión alrededor de cada jugador) y los rezagados de
 * js/entities/enemy.js. Desde el píxel nítido (lote 4 de la identidad) un móvil ve mucho más mundo que un PC (a
 * 844x390@3, 1266x585 px de mundo; un PC a 1440x900, 720x450), así que un invitado con el móvil veía nacer enemigos
 * dentro de su pantalla, por los lados, y desaparecer rezagados que estaba viendo (tools/nico/coop-e2e.js, «Apariciones»).
 *
 * Con G.MODS.aparicionVistas, cada invitado le dice al anfitrión qué mide su vista (px de mundo) y cuánto la tiene corrida
 * respecto a su Pokémon (el encuadre del HUD Dex compacto o del pliegue, js/ui/encuadre.js), con ['vista', w, h, ox, oy]
 * al empezar, al cambiar y cada 2 s. Y el anfitrión, en grupo:
 *   - radio(): el anillo de aparición alrededor de un jugador empieza en el círculo de SU vista (la fórmula de
 *     G.Camera.outerRadius() con su vista, más lo que la tenga corrida) y, en cada dirección, se aleja justo lo necesario
 *     para no pisar la vista de nadie (con aparicionMargen): el PC que juega con un móvil al lado sigue viéndolos nacer a su
 *     distancia de siempre por arriba y por abajo, y más lejos sólo por los lados, donde el móvil ve más;
 *   - vistoPorAlguien(): descarta los puntos que caen dentro del rectángulo de la vista de alguien, con aparicionMargen;
 *     también los del jefe, que upstream no miraba;
 *   - fueraDeTodas(): un rezagado sólo está fuera de la vista si está más lejos que el radio de la vista de cada uno
 *     (upstream: el radio de la del anfitrión, contra el jugador vivo más cercano).
 * Con G.MODS.bombaVistas (el invitado también manda su vista con este ajuste), la bomba que coge un compañero daña a los
 * enemigos del rectángulo de SU vista (bombaEnSuVista() y enSuVista(), en onCollect() de js/game.js), como la tuya con
 * G.Camera.sees(x, y, 0); upstream usa un círculo del radio de la vista del anfitrión alrededor de él.
 * Sin datos de un invitado (otra versión, o aún no han llegado), su vista es la del anfitrión, como en upstream (la bomba,
 * con el círculo de upstream). En solitario, en el invitado, con el ajuste apagado o sin este fichero, los ganchos hacen
 * lo de upstream. Sólo lee el juego; lo único que viaja por la red es ese evento, del invitado al anfitrión.
 */
G.Vistas = (() => {
  const otras = new Map();             // en el anfitrión: uid -> { w, h, ox, oy } de cada invitado
  let partida = null, enviada = null, desde = 0;

  const ajuste = () => !!(G.MODS && G.MODS.aparicionVistas);
  const bomba = () => !!(G.MODS && G.MODS.bombaVistas);
  const margen = () => { const m = G.MODS ? +G.MODS.aparicionMargen : NaN; return m >= 0 ? m : 40; };

  /** Otra partida (otro Player local): lo de la anterior ya no vale. */
  function alDia() {
    const l = G.Coop.local;
    if (l !== partida) { partida = l; otras.clear(); enviada = null; desde = 0; }
  }

  /** ¿Cuentan las vistas de cada uno? Sólo quien manda en un grupo (el anfitrión) y con el ajuste. */
  function activo(players) {
    return ajuste() && !!G.Coop.isHost && !!players && players.length > 1;
  }

  /** La vista de un jugador: centro, ancho y alto en px de mundo, y cuánto está corrida respecto a su Pokémon. */
  function de(p) {
    const c = G.Camera;
    if (!p.remote) return { x: c.x, y: c.y, w: c.w, h: c.h, corrida: 0 };
    alDia();
    const v = otras.get(p.uid);
    if (!v) return { x: p.x, y: p.y, w: c.w, h: c.h, corrida: 0 };   // sin datos: la del anfitrión (upstream)
    return { x: p.x + v.ox, y: p.y + v.oy, w: v.w, h: v.h, corrida: Math.hypot(v.ox, v.oy) };
  }

  /** Radio del círculo que envuelve la vista de p alrededor de su Pokémon (la tuya: G.Camera.outerRadius()). */
  function radioDe(p) {
    if (!p.remote) return G.Camera.outerRadius();
    const v = de(p);
    return Math.hypot(v.w, v.h) / 2 + 40 + v.corrida;
  }

  /** Tramo [entra, sale] del rayo (x0, y0) + d·(ux, uy), d ≥ 0, que cae dentro de la caja de centro (cx, cy) y medios
   *  lados hx, hy; null si no la cruza. */
  function tramo(x0, y0, ux, uy, cx, cy, hx, hy) {
    let a = 0, b = Infinity;
    for (let k = 0; k < 2; k++) {
      const p = k ? y0 : x0, u = k ? uy : ux, c = k ? cy : cx, h = k ? hy : hx;
      if (Math.abs(u) < 1e-9) { if (Math.abs(p - c) >= h) return null; continue; }
      const t1 = (c - h - p) / u, t2 = (c + h - p) / u;
      a = Math.max(a, Math.min(t1, t2)); b = Math.min(b, Math.max(t1, t2));
      if (a >= b) return null;
    }
    return [a, b];
  }

  /** spawner.js, ringPoint(pl, angle): a qué distancia de pl, en esa dirección, empieza el anillo (al que ringPoint suma
   *  10-70). Sin grupo, la de upstream (G.Camera.outerRadius()). En grupo, la del círculo de la vista del propio pl y, si
   *  el tramo del anillo en esa dirección (el rayo de ringPoint, con su y × 0,9) pisaría la vista de alguien con el margen,
   *  justo más allá de ella: el PC que juega con un móvil al lado sigue viéndolos nacer a su distancia de siempre por
   *  arriba y por abajo (el móvil ve poco en vertical), y más lejos sólo por los lados, donde el móvil ve más. */
  function radio(players, pl, angle) {
    if (!activo(players) || !pl) return G.Camera.outerRadius();
    let d = radioDe(pl);
    const ux = Math.cos(angle), uy = Math.sin(angle) * 0.9, m = margen();
    for (let vuelta = 0; vuelta < 4; vuelta++) {           // con 3 o 4 jugadores, salir de una vista puede meterlo en otra
      let mas = false;
      for (const q of players) {
        const v = de(q), t = tramo(pl.x, pl.y, ux, uy, v.x, v.y, v.w / 2 + m, v.h / 2 + m);
        if (t && t[1] > d + 10 && t[0] < d + 70) { d = t[1] - 9; mas = true; }   // d + 10 queda 1 px más allá de su vista
      }
      if (!mas) break;
    }
    return d;
  }

  /** spawner.js, seenByAnyone(): ¿cae (x, y) dentro de la vista de alguien, con el margen? */
  function vistoPorAlguien(players, x, y) {
    const m = margen();
    for (const p of players) {
      const v = de(p);
      if (Math.abs(x - v.x) < v.w / 2 + m && Math.abs(y - v.y) < v.h / 2 + m) return true;
    }
    return false;
  }

  /** enemy.js, rezagados: ¿está (x, y) más lejos que el radio de la vista de cada uno, más `extra`? */
  function fueraDeTodas(players, x, y, extra) {
    for (const p of players) {
      const r = radioDe(p) + extra;
      if (G.U.dist2(p.x, p.y, x, y) <= r * r) return false;
    }
    return true;
  }

  /** game.js, onCollect(), la bomba: ¿la que ha cogido p daña a los enemigos de SU vista? Sólo en el anfitrión, con
   *  bombaVistas, si la ha cogido un compañero y éste ha mandado su vista; si no, la de upstream (el círculo). */
  function bombaEnSuVista(p, mine) {
    if (mine || !p || !p.remote || !bomba() || !G.Coop.isHost) return false;
    alDia();
    return otras.has(p.uid);
  }

  /** ¿Cae (x, y) dentro de la vista de p, sin margen? (la tuya: G.Camera.sees(x, y, 0)) */
  function enSuVista(p, x, y) {
    const v = de(p);
    return Math.abs(x - v.x) < v.w / 2 && Math.abs(y - v.y) < v.h / 2;
  }

  /** coop.js, tick(): el invitado avisa de su vista al empezar, al cambiar (como mucho 2 veces por segundo) y cada 2 s.
   *  Lo corrida que está es la del encuadre (G.Encuadre: el HUD Dex compacto y el pliegue), no la de la cámara menos su
   *  Pokémon: ésa lleva además el retraso de la cámara al moverse (unos 13 px a toda velocidad), que cambia de signo con
   *  cada giro y que la copia de su Pokémon en el anfitrión ya lleva parecido (llega con su latencia). */
  function tick(dt, host) {
    alDia();
    if (host || !(ajuste() || bomba())) return;
    const c = G.Camera, l = G.Coop.local;
    if (!l || !(c.w > 0) || !(c.h > 0)) return;
    desde += dt;
    const o = G.Encuadre && G.Encuadre.desplazamiento ? G.Encuadre.desplazamiento(0) : null;   // con dt 0 no avanza nada
    const v = [Math.round(c.w), Math.round(c.h), Math.round(o ? o[0] : 0), Math.round(o ? o[1] : 0)];
    const e = enviada;
    const cambio = !e || Math.abs(v[0] - e[0]) > 2 || Math.abs(v[1] - e[1]) > 2 || Math.abs(v[2] - e[2]) > 12 || Math.abs(v[3] - e[3]) > 12;
    if (e && (cambio ? desde < 0.5 : desde < 2)) return;
    enviada = v; desde = 0;
    G.Coop.toHost(['vista', v[0], v[1], v[2], v[3]]);
  }

  /** coop.js, en el anfitrión: la vista que manda un invitado (con topes: no puede alejar las apariciones sin fin). */
  function deRed(uid, ev) {
    alDia();
    const w = +ev[1], h = +ev[2], ox = +ev[3] || 0, oy = +ev[4] || 0;
    if (!(w >= 100 && w <= 3000 && h >= 100 && h <= 3000)) return;
    otras.set(uid, { w, h, ox: G.U.clamp(ox, -400, 400), oy: G.U.clamp(oy, -400, 400) });
  }

  return { activo, de, radio, radioDe, vistoPorAlguien, fueraDeTodas, bombaEnSuVista, enSuVista, tick, deRed, vista: uid => otras.get(uid) || null };
})();
