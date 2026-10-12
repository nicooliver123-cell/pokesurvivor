/* ============ mods.js — ajustes de nuestra versión (MOD nico) ============
 * Todo lo que esta versión modificada cambia del juego original se controla
 * aquí. En el código de upstream sólo hay ganchos de una o dos líneas marcados
 * con el comentario "// MOD nico" (búscalos con: git grep -n "MOD nico").
 *
 * Se carga justo después de util.js (dev.html), antes de cualquiera que lo use.
 * Si tras un merge faltara este fichero, los ganchos se comportan de forma
 * segura: los enemigos siguen sin curarse, el tamaño queda como el original,
 * no hay grieta garantizada y los tickets y el gacha son los del original.
 *
 * COOPERATIVO: los dos jugadores tienen que usar la MISMA versión (mismos
 * valores). El anfitrión decide los enemigos (curación) y cada cliente calcula
 * el tamaño de todos los jugadores a partir de su Pokémon, sin mandarlo por red.
 *
 * Tras cambiar un valor: `node tools/build.js --privado` (index.html usa el
 * paquete js/app.min.js) y, si quieres comprobarlo, el arnés de tools/nico/.
 */
G.MODS = {
  /* Curación de los enemigos.
   *   false (por defecto): NINGÚN enemigo recupera vida.
   *     - Las 14 especies curanderas del original (Clefairy, Chansey, Blissey,
   *       Audino, Sylveon, Hatterene...) dejan de curar y pelean con el
   *       comportamiento que les toca por su tipo, como cualquier otra.
   *     - El hueco de "apoyo" de cada tramo sale escudo o invocador.
   *     - Red de seguridad: aunque llegue un curandero por otra vía, no cura.
   *     - Los escudos (burbuja azul) se mantienen: no curan, absorben daño un rato.
   *   true: como el original (cada curandero devuelve un 7 % de la vida máxima a
   *     los enemigos de alrededor cada 3,5 s, jefes incluidos). */
  curacionEnemiga: false,

  /* Cooperativo: lo que VE el invitado de la vida de los enemigos (con
   * curacionEnemiga=false; con true, todo como el original).
   * El anfitrión decide la vida real. El invitado resta su golpe en pantalla al
   * momento (predicción) y después recibe la vida del anfitrión unas 15 veces por
   * segundo. Con latencia, ese dato puede salir del anfitrión ANTES de que le
   * llegue el golpe, y la barra subía: parecía que el enemigo se curaba.
   *   - Durante esta ventana tras tu último golpe predicho a un enemigo, el
   *     invitado no acepta del anfitrión una vida MAYOR que la que enseña.
   *     Pasada la ventana acepta la del anfitrión, para no desincronizarse (por
   *     si el golpe no llegó a contar).
   *   - Con escudo activo (bit de estado que manda el anfitrión) no se predice:
   *     el escudo absorbe el golpe y la barra no debe bajar.
   * Milisegundos. Directo (WebRTC, ~15 mensajes/s): 600 de sobra. Por el relé de
   * la Realtime Database van 3 mensajes/s y la ida y vuelta puede pasar de 1 s:
   * 1500. 0 = sin ventana (como el original). */
  ventanaVidaMs: 600,
  ventanaVidaReleMs: 1500,

  /* Ancho máximo del Pokémon que CONTROLAS, en píxeles de arte del fotograma
   * Idle (los sprites de los Pokémon normales miden 24-40). Si tu Pokémon es más
   * ancho, se encoge todo su cuerpo en la misma proporción: sprite, sombra,
   * hitbox (círculo de choque con disparos, enemigos, zonas y paredes) y altura
   * del nombre y los números. Los que no pasan del límite quedan intactos.
   *   56 (por defecto): se reducen 38 de 966 (Guzzlord ×0,47, Eternatus ×0,54,
   *      Onix ×0,58, Articuno ×0,64, Rayquaza ×0,70, Lugia y Gyarados ×0,78,
   *      Kyogre y Groudon ×0,88...). Hitbox máxima 24,6, la de Zacian; Pikachu 17,6.
   *   64: más suave (26 reducidos, hitbox máxima 28,2).
   *   48: más fuerte (61 reducidos, hitbox máxima 21,1).
   *   0: desactivado (tamaño original).
   * NO cambia el alcance de los ataques (salen de los pies con el radio de cada
   * movimiento) ni el tamaño de los enemigos, los jefes o los menús. */
  anchoMaxJugador: 56,

  /* Grieta garantizada: en cada partida se abre UNA grieta (la del vínculo, para
   * fusionar movimientos) antes de este segundo de juego. La hora se elige al
   * azar entre 45 y 10 s antes del límite (con 120: entre 75 y 110 s; el reloj
   * de juego se para en las cartas, en la pausa en solitario y al elegir fusión).
   *   - Sólo si en la partida aún no ha habido ninguna (natural o ésta): si la
   *     tirada normal de rift.js ya abrió una, no se fuerza otra.
   *   - Una por partida: si no entráis antes de que se cierre, NO se reabre.
   *   - No con un jefe vivo (espera a que caiga, hasta el límite) y, si no hay
   *     sitio libre cerca, lo vuelve a intentar cada segundo.
   *   - La decide quien manda en rift.js: el jugador en solitario, el anfitrión
   *     en grupo (el invitado la recibe como cualquier otra).
   *   - Las grietas naturales siguen igual (después de ésta, la tirada de cada
   *     30 s vuelve a empezar cuando se cierra).
   * 0 = desactivado (como el original). */
  grietaGarantizadaAntesDe: 120,

  /* Vida del legendario de ESA grieta (la garantizada), sobre la normal: 0,6 =
   * el 60 %. A los 110 s son unos 2.500 en solitario y 4.600 en dúo (sin rebaja,
   * 4.200 y 7.600). Las grietas naturales no cambian. En grupo lo decide el
   * anfitrión y el invitado recibe su vida. 1 = sin rebaja. */
  grietaGarantizadaVida: 0.6,

  /* Tickets del gacha GANADOS (decisión de Nico): cada uno cuenta por ticketsMult.
   *   - En partida: los objetos ticket y ticket ×10 que se recogen. El contador de la
   *     partida (pl.t1/pl.t10, lo que viaja por la red) sigue contando 1 por objeto; al
   *     apuntarlos en tu partida guardada (game.js, bankTickets) se multiplican. En grupo,
   *     cada jugador multiplica con SU ajuste los del equipo.
   *   - Fuera de partida: los premios de misiones y logros (progress.js, grant). Las
   *     Pokémonedas de esos premios no cambian.
   *   - No es ganar (no cambia): gastarlos en el gacha, traer la partida oficial (suma lo
   *     que tenía allí, una vez) ni juntar partidas de la nube.
   * Entero. 1 = como el original. */
  ticketsMult: 2,

  /* Probabilidad de shiny (decisión de Nico): ×shinyMult en los sitios donde se sortea:
   * salvajes y jefes (1/4096), el legendario de la grieta (1/512) y el gacha (1/100, que
   * pasa a 1,5 %; el cartel de probabilidades del gacha lo dice). En grupo, los salvajes y
   * la grieta los sortea el anfitrión; el gacha, cada uno el suyo. 1 = como el original. */
  shinyMult: 1.5,

  /** spawner.js, rift.js y gacha.js: la probabilidad de shiny `p` con el ajuste (como mucho 1). */
  probShiny(p) {
    const k = +this.shinyMult;
    return k > 0 && isFinite(k) ? Math.min(1, p * k) : p;
  },

  /** gacha-ui.js, refresh(): el cartel de probabilidades (su HTML ya pintado) con el % de shiny
   *  del ajuste. Si upstream cambia ese texto, no toca nada (tools/nico/check.js lo vigila). */
  notasGacha(html) {
    if (typeof html !== 'string' || !G.Gacha) return html;
    const pct = +(this.probShiny(G.Gacha.SHINY_RATE) * 100).toFixed(2) + '%';
    return html.replace('<span>1%</span>', '<span>' + pct + '</span>');
  },

  /** Multiplicador de tickets saneado: entero ≥ 1 (cualquier otro valor, 1). */
  multTickets() {
    const m = Math.floor(+this.ticketsMult);
    return m >= 1 && isFinite(m) ? m : 1;
  },

  /** game.js, bankTickets() y pantalla final: `n` tickets de la partida -> los que van a tu partida guardada. */
  tickets(n) { return n * this.multTickets(); },

  /** progress.js, grant() y rewardText(): el premio de una misión o un logro con sus tickets
   *  multiplicados. Devuelve una COPIA (no toca G.MissionDefs ni G.AchDefs); las monedas, igual. */
  premio(r) {
    const m = this.multTickets();
    if (!r || typeof r !== 'object' || m === 1) return r;
    const c = Object.assign({}, r);
    if (c.t1) c.t1 *= m;
    if (c.t10) c.t10 *= m;
    return c;
  },

  /** game.js, onCollect(): el texto que flota al coger un ticket (con 1, el del original). */
  textoTicket(kind) {
    const m = this.multTickets();
    if (kind === 'ticket') return m === 1 ? '+1 ticket' : '+' + m + ' tickets';
    return m === 1 ? '¡Ticket ×10!' : '¡' + m + ' tickets ×10!';
  },

  /** Estado de la grieta garantizada de cada partida. La clave es el jugador local,
   *  que es nuevo en cada startRun: { hora, hecha, intentoT, grieta, usada, cierreT }. */
  _grietas: new WeakMap(),

  /** rift.js, update(), en cada fotograma: ¿hay que abrir ya la grieta garantizada?
   *  `hayGrieta`: hay una grieta o una arena; `manda`: este cliente decide las grietas. */
  grietaGarantizada(pl, time, hayGrieta, manda) {
    const lim = +this.grietaGarantizadaAntesDe;
    if (!(lim > 0) || !isFinite(lim) || !pl || typeof pl !== 'object') return false;
    let st = this._grietas.get(pl);
    if (!st) {
      const a = Math.max(0, lim - 45), b = Math.max(a, lim - 10);
      st = { hora: a + Math.random() * (b - a), hecha: false, intentoT: -Infinity, grieta: null, usada: false, cierreT: 0 };
      this._grietas.set(pl, st);
    }
    if (hayGrieta) { st.hecha = true; return false; }   // ya hay (o hubo) una: natural o ésta
    if (st.hecha || !manda || !(time >= st.hora) || !(time < lim)) return false;
    if (G.EnemyMgr && G.EnemyMgr.bossAlive && G.EnemyMgr.bossAlive()) return false;
    if (time - st.intentoT < 1) return false;           // open() no encontró sitio: otra vez en 1 s
    st.intentoT = time;
    return true;
  },

  /** Hora elegida para la grieta garantizada de esta partida (null si aún no hay). Para pruebas. */
  grietaGarantizadaHora(pl) {
    const st = pl && typeof pl === 'object' ? this._grietas.get(pl) : null;
    return st ? st.hora : null;
  },

  /** rift.js, update(): se acaba de abrir la grieta garantizada (`rift`, con su ttl). */
  grietaAbierta(pl, rift, time) {
    const st = pl && typeof pl === 'object' ? this._grietas.get(pl) : null;
    if (!st || !rift) return;
    st.grieta = rift; st.usada = false; st.cierreT = time + (+rift.ttl || 0);
  },

  /** rift.js, start(), en quien manda: 1 si la arena que empieza es la de la grieta
   *  garantizada (la marca se gasta: una sola arena) y 0 si es otra. Se reconoce por la
   *  propia grieta; si aquí ya se cerró (el invitado entró en sus últimos instantes y su
   *  reloj va algo por detrás), hasta 5 s después. Una grieta natural no puede abrirse
   *  hasta 30 s después de que se cierre ésta. */
  arenaGarantizada(pl, rift, time) {
    const st = pl && typeof pl === 'object' ? this._grietas.get(pl) : null;
    if (!st || !st.grieta || st.usada) return 0;
    if (rift ? rift !== st.grieta : !(time <= st.cierreT + 5)) return 0;
    st.usada = true;
    return 1;
  },

  /** rift.js, spawnLegend(), antes de añadirlo: el legendario de la arena de la grieta
   *  garantizada (arena.forzada) sale con grietaGarantizadaVida de su vida. Es al crearlo,
   *  no una curación (tools/nico/check.js la tiene revisada). */
  vidaLegendario(e, arena) {
    const f = +this.grietaGarantizadaVida;
    if (!e || !arena || !arena.forzada || !(f > 0) || !isFinite(f) || f === 1) return;
    e.maxHp = e.hp = Math.max(1, Math.round(e.maxHp * f));
  },

  /** Escala del Pokémon de un jugador (1 = tamaño original). Usa la geometría
   *  normal (nunca la shiny) para que todos los clientes calculen lo mismo. */
  escalaJugador(dex) {
    const max = +this.anchoMaxJugador;
    if (!(max > 0) || !isFinite(max)) return 1;
    const m = G.Sprites && G.Sprites.animMeta(dex, 'Idle');
    return Math.min(1, max / (m ? m.w : 32));
  },

  /** Ventana del invitado según el camino hasta el anfitrión (directo o relé). */
  ventanaVida() {
    const rele = !!(G.Net && G.Net.hostUid && G.Net.slow(G.Net.hostUid));
    const ms = +(rele ? this.ventanaVidaReleMs : this.ventanaVidaMs);
    return ms > 0 && isFinite(ms) ? ms : 0;
  },

  /** Invitado, copia de un enemigo (enemy.js, hurt): ¿se resta ya en pantalla tu
   *  golpe? No si el anfitrión dice que tiene escudo (bit 4 de su estado). */
  predecirGolpe(e) {
    if (!this.curacionEnemiga && e.net && (e.net.st & 4)) return false;
    e.golpePredichoT = performance.now();   // también con true, por si se cambia en plena partida
    return true;
  },

  /** Invitado (coop.js, onHostFrame): vida que se enseña al llegar `hp` del
   *  anfitrión. Dentro de la ventana tras tu último golpe predicho no sube. */
  vidaDelAnfitrion(e, hp) {
    const v = Math.min(e.maxHp, hp);
    if (this.curacionEnemiga || !(v > e.hp) || !e.golpePredichoT) return v;
    return performance.now() - e.golpePredichoT < this.ventanaVida() ? e.hp : v;
  }
};
