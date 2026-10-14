/* ============ evo-partida.js — tu Pokémon evoluciona dentro de la partida (MOD nico) ============
 * Decisión de Nico (14-10-2026): al subir de nivel, si tu Pokémon ya puede evolucionar, entre las cartas sale
 * «Evolucionar en X». Si la eliges, hasta el final de ESA partida eres X: su sprite, su tamaño, su vida, su ataque y su
 * velocidad, y sus tipos (debilidades, clima, agua). Conservas los movimientos, el nivel, las cartas cogidas y las
 * mejoras de la pantalla Mejoras (las de tu Pokémon de siempre). Al acabar vuelves a empezar con el de siempre.
 *
 * Nivel de la partida al que sale la carta: el real de los juegos × G.MODS.evoNivelFactor (0,5), redondeado hacia
 * arriba (Charmander 16 -> 8, Charmeleon 36 -> 18, Dragonite 55 -> 28); las que no son por nivel (piedra, intercambio,
 * amistad...: Pikachu, Eevee, Kadabra) a G.MODS.evoNivelSinNivel (20). Los niveles reales están en G.EVO_NIVEL
 * (js/data/evolutions.js, generado con PokeAPI). Con varias ramas (Eevee, Gloom...) salen como mucho
 * G.MODS.evoCartasMax (2) al azar; las otras cartas siguen saliendo para que puedas no evolucionar. Si no la eliges,
 * vuelve a salir en la siguiente subida de nivel.
 *
 * Cooperativo: cada uno arma sus cartas (como siempre) y, al evolucionar, avisa con ['evo', uid, dex, shiny]: el
 * invitado al anfitrión y el anfitrión a todos, para que te vean cambiar. La vida de los compañeros sigue llegando por
 * la red. Mi criterio: en el ranking cuenta el Pokémon con el que acabas (el evolucionado).
 *
 * Ganchos de una línea: levelup.js (offer, cartas), run-ui.js (renderCards, pintarCarta) y coop.js (los dos
 * sentidos, deRed). Sin este fichero o con G.MODS.evoEnPartida = false, como antes.
 */
G.EvoPartida = (() => {
  const M = () => G.MODS || {};
  const activa = () => !!M().evoEnPartida && !!G.EVO;

  /** Nivel de la partida desde el que `hijo` puede salir como carta. */
  function nivelDe(hijo) {
    const real = G.EVO_NIVEL && G.EVO_NIVEL[hijo];
    const f = +M().evoNivelFactor || 0.5;
    return real ? Math.max(1, Math.ceil(real * f)) : (M().evoNivelSinNivel | 0 || 20);
  }

  /** Las evoluciones que `pl` puede elegir ya (a su nivel). */
  function disponibles(pl) {
    if (!activa() || !pl || pl.remote) return [];
    return (G.EVO[pl.dex] || []).filter(h => G.DEX_BY[h] && pl.level >= nivelDe(h));
  }

  const fmt = n => { const s = (Math.round(n * 100) / 100).toString(); return G.I18n && G.I18n.lang === 'en' ? s : s.replace('.', ','); };

  /** Gancho de levelup.js (offer): pone delante las cartas de evolución; `picked` se queda en `n` cartas. */
  function cartas(pl, picked, n) {
    const opciones = disponibles(pl);
    if (!opciones.length) return picked;
    const max = Math.max(1, Math.min(n - 1, M().evoCartasMax | 0 || 2));
    const elegidas = G.U.pickN(opciones, Math.min(max, opciones.length));
    const viejo = pl.mon;
    G.Sprites.preload(elegidas, 8000, pl.shiny);
    const nuevas = elegidas.map(h => {
      const m = G.DEX_BY[h];
      return {
        w: 0, type: 'evo', key: 'evopoke:' + h, evoDex: h,
        icon: 'up', color: '#ffd23f', tag: 'EVOLUCIÓN',
        title: 'Evolucionar en ' + m.name,
        desc: `Hasta el final de la partida. Vida ${viejo.hp} → ${m.hp}, ataque ×${fmt(viejo.atk)} → ×${fmt(m.atk)}, velocidad ${viejo.spd} → ${m.spd}.`,
        apply: p => evolucionar(p, h)
      };
    });
    picked.unshift(...nuevas);
    picked.length = Math.min(picked.length, n);
    return picked;
  }

  /** Cambia el Pokémon de `pl` por `dex` (el tuyo o la copia de un compañero si `deRed`). */
  function evolucionar(pl, dex, deRed = false) {
    const mon = G.DEX_BY[dex];
    if (!pl || !mon) return false;
    const viejo = pl.mon;
    const shiny = !!pl.shiny && G.Sprites.hasShiny(dex);
    pl.mon = mon;
    pl.dex = dex;
    pl.shiny = shiny;
    pl.scale = G.MODS && G.MODS.escalaJugador ? G.MODS.escalaJugador(dex) : 1;
    pl.anim = new G.Sprites.Animator(dex, pl.scale, shiny);
    pl.r = G.Sprites.bodyRadius(dex, pl.scale);
    pl.bodyH = G.Sprites.bodyHeight(dex, pl.scale);
    pl.baseSpd = mon.spd;
    pl.baseAtk = mon.atk;
    const d = mon.hp - viejo.hp;
    pl.maxHp = Math.max(1, pl.maxHp + d);
    if (!pl.remote) pl.hp = Math.min(pl.maxHp, Math.max(1, pl.hp + Math.max(0, d)));
    pl.evolucionesPartida = (pl.evolucionesPartida || 0) + 1;
    G.Sprites.preload([dex], 8000, shiny);
    // Efecto: el de la evolución de un movimiento, en grande.
    G.FX.ring(pl.x, pl.y, 8, 140, '#ffd23f', 0.8, 6);
    G.FX.burst(pl.x, pl.y - pl.bodyH * 0.5, '#ffe14d', 50, 260);
    if (G.Camera.sees(pl.x, pl.y, 60)) G.Audio.sfx('legend');
    G.Spawner.say(`¡${viejo.name} ha evolucionado en ${mon.name}!`, 3, true);
    if (!deRed && G.Coop.active) {
      const ev = ['evo', pl.uid, dex, shiny ? 1 : 0];
      if (G.Coop.isHost) G.Coop.broadcast(ev); else G.Coop.toHost(ev);
    }
    return true;
  }

  /** Gancho de coop.js: ['evo', uid, dex, shiny]. En el anfitrión (`desde` = quien lo manda) también lo reenvía. */
  function deRed(ev, desde) {
    if (!Array.isArray(ev) || !G.DEX_BY[ev[2]]) return;
    const uid = ev[1];
    if (desde && desde !== uid) return;                       // sólo cada uno avisa de lo suyo
    if (desde && G.Coop.isHost) G.Coop.broadcast(ev);         // a los demás invitados
    if (G.Coop.local && uid === G.Coop.local.uid) return;     // el eco de lo tuyo
    const m = G.Coop.mate(uid);
    if (m && m.pl && m.pl.dex !== ev[2]) evolucionar(m.pl, ev[2], true);
  }

  /** Gancho de run-ui.js (renderCards): en la carta de evolución, el sprite del Pokémon en vez del icono. */
  function pintarCarta(el, c) {
    if (!el || !c || !c.evoDex) return;
    const ico = el.querySelector('.ico');
    if (!ico) return;
    ico.innerHTML = '';
    const cv = G.UI.spriteCanvas(c.evoDex, 48, 44, { scale: 1, lively: true, shiny: !!(G.Game.player && G.Game.player.shiny) });
    cv.style.width = '40px'; cv.style.height = 'auto'; cv.style.imageRendering = 'pixelated';
    ico.appendChild(cv);
  }

  return { nivelDe, disponibles, cartas, evolucionar, deRed, pintarCarta };
})();
