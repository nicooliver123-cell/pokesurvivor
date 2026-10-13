/* ============ transicion.js — iris de las transiciones (MOD nico) ============
 * Lote 4 de la identidad «Dex de Expedición» (guía de marca §10.1 con la corrección de la revisión cruzada: el iris
 * no retrasa el juego). Sólo con el estilo Dex (en Clásico, el fogonazo de upstream tal cual). Ajuste en
 * js/core/mods.js (transiciones).
 *
 * Una máscara del color de fondo de la marca con un agujero redondo centrado en tu Pokémon (y un aro de 3 px):
 *   - al empezar la partida: se abre desde negro en 280 ms;
 *   - al entrar en la arena de la grieta: negro al instante (el tirón de la cámara no se ve) y se abre en 280 ms;
 *   - al salir: se cierra en 220 ms dentro de la espera de la vuelta (endT, que upstream ya tiene), negro como mínimo
 *     80 ms y se abre en 280 ms al volver. El invitado vuelve cuando se lo dice el anfitrión ('af'): si llega antes de
 *     cerrarse, negro al instante y se abre; si tarda, a los 0,6 s de negro se abre igual (nunca te deja a ciegas).
 *   - nunca en el cambio de bioma (te dejaría ciego en pleno combate) ni al volver de la pausa.
 * Con movimiento reducido o «Menos sacudidas», fundidos a negro de 150 ms en vez del círculo.
 * Se pinta en la última línea de render() (game.js), después del fogonazo morado de upstream, que queda visible sólo
 * dentro del círculo. Sólo lee el estado (G.Game, G.Rift, G.Camera): no cambia la partida ni manda nada por la red.
 */
G.Transicion = (() => {
  const T = { abrir: 0.28, cerrar: 0.22, negro: 0.08, fundido: 0.15, cerrarAntes: 0.3, negroMax: 0.6 };
  const MODS = () => G.MODS || {};
  const ahora = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
  let mq = null;
  function reducido() {
    if (G.Settings && G.Settings.get && G.Settings.get('calm')) return true;
    try { if (!mq && typeof matchMedia === 'function') mq = matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) { mq = null; }
    return !!(mq && mq.matches);
  }
  const activa = () => MODS().transiciones !== false && !!(G.Estilo && G.Estilo.dex);

  // fase: null | 'cerrando' | 'negro' | 'abriendo'; t0: cuándo empezó (s, performance.now)
  let fase = null, t0 = 0, plVisto = null, arenaVista = false, tiempoVisto = 0, cerrado = false;   // cerrado: ya se cerró para esta vuelta
  function poner(f, t) { fase = f; t0 = t; }

  /** Avanza la máquina con lo que ve en el juego (una vez por fotograma; t en s). */
  function actualizar(pl, t) {
    const st = G.Game && G.Game.st, tiempo = st ? st.time : 0;
    const enArena = !!(G.Rift && G.Rift.inArena), arena = G.Rift && G.Rift.arena;
    // Partida nueva (otro jugador, o el reloj ha vuelto a empezar): se abre desde negro.
    if (pl !== plVisto || tiempo < tiempoVisto - 1) { plVisto = pl; arenaVista = enArena; tiempoVisto = tiempo; cerrado = false; poner('abriendo', t); return; }
    tiempoVisto = tiempo;
    const jugando = !G.Game || G.Game.state === 'playing' || G.Game.state === 'held';
    if (enArena && !arenaVista) { cerrado = false; poner('abriendo', t); }   // el tirón de la entrada, ya en negro
    else if (!enArena && arenaVista) {
      // Vuelta: si se estaba cerrando, negro desde ya (80 ms como mínimo); si ya estaba en negro, sigue (y se abre en
      // cuanto lleve 80 ms); si no se había empezado a cerrar (el invitado volvió antes), negro ya y se abre.
      if (fase === 'cerrando') poner('negro', t);
      else if (fase !== 'negro') poner('abriendo', t);
      cerrado = false;
    }
    arenaVista = enArena;
    // Cierre antes de volver: dentro de la espera de la vuelta (endT) de la arena ganada o perdida, una vez y sólo
    // jugando (si sale un diálogo, como el de cambiar de objeto, la espera se para: no se cierra detrás de él).
    if (enArena && arena && arena.phase !== 'fight' && arena.endT <= T.cerrarAntes && !fase && !cerrado && jugando) { cerrado = true; poner('cerrando', t); }
    if (enArena && (fase === 'cerrando' || fase === 'negro') && !jugando) poner('abriendo', t);   // un diálogo: se ve el mundo detrás
    if (fase === 'cerrando' && t - t0 >= T.cerrar) poner('negro', t);
    if (fase === 'negro') {
      // Fuera ya de la arena: tras el mínimo de negro, se abre. Dentro (el invitado espera a 'af'): tras el máximo.
      if ((!enArena && t - t0 >= T.negro) || t - t0 >= T.negroMax) poner('abriendo', t);
    }
    if (fase === 'abriendo' && t - t0 >= (reducido() ? T.fundido : T.abrir)) fase = null;
  }

  /** Cuánto se ve, de 0 (negro) a 1 (todo), ahora. */
  function apertura(t) {
    if (!fase) return 1;
    const red = reducido();
    if (fase === 'negro') return 0;
    if (fase === 'cerrando') { const p = Math.min(1, (t - t0) / (red ? T.fundido : T.cerrar)); return 1 - (red ? p : p * p); }   // ease-in
    const p = Math.min(1, (t - t0) / (red ? T.fundido : T.abrir));
    return red ? p : 1 - (1 - p) * (1 - p);                                                                                 // ease-out
  }

  /** game.js render(), última línea (px CSS del lienzo). */
  function dibujar(ctx, w, h, pl) {
    if (!pl || !activa()) { fase = null; plVisto = pl; arenaVista = !!(G.Rift && G.Rift.inArena); tiempoVisto = G.Game && G.Game.st ? G.Game.st.time : 0; return; }
    const t = ahora();
    actualizar(pl, t);
    const a = apertura(t);
    if (a >= 1) return;
    const C = (G.MARCA && G.MARCA.color) || { fondo: '#050E12' };
    ctx.save();
    if (reducido()) {
      ctx.globalAlpha = 1 - a; ctx.fillStyle = C.fondo; ctx.fillRect(0, 0, w, h);
      ctx.restore();
      return;
    }
    // Tu Pokémon en la pantalla (como Camera.apply: (x − left + _sx) · escala), a media altura de su cuerpo.
    const cam = G.Camera, s = cam.scale || 1;
    const cx = (pl.x - cam.left() + (cam._sx || 0)) * s, cy = (pl.y - (pl.bodyH || 30) * 0.5 - cam.top() + (cam._sy || 0)) * s;
    const rmax = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 4, r = Math.max(0, rmax * a);
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    if (r > 0.5) ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
    ctx.fillStyle = C.fondo; ctx.fill('evenodd');
    if (r > 0.5) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(238,246,247,0.6)'; ctx.stroke(); }
    ctx.restore();
  }

  return { dibujar, apertura, reiniciar() { fase = null; plVisto = null; }, T,
    get fase() { return fase; }, get activa() { return activa(); } };
})();
