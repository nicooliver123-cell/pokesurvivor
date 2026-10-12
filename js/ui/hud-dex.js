/* ============ hud-dex.js — HUD «Dex de Expedición» en el lienzo (MOD nico) ============
 * Identidad visual elegida por Nico el 12-10-2026 (guía de marca, plan técnico y revisión cruzada; lote 2).
 * Sólo con el estilo Dex: G.Estilo.hud() lo llama desde la primera línea de G.HUD.draw (js/ui/hud.js) y, si
 * algo falla aquí dentro, ese fotograma lo pinta el HUD de upstream. Con Clásico no se usa nada de esto.
 * Sólo dibuja y lee el estado del juego: no cambia la partida ni manda nada por la red.
 *
 * Piezas (cifras en G.MARCA.hud, más finas que las de la guía, como pidió Nico):
 *   - ficha: carcasa roja con la lente y tu Pokémon dentro, nombre, nivel, PS y EXP;
 *   - contador: reloj con cifras de ancho fijo, derrotados y monedas;
 *   - módulo Rotom: bioma y sensor del clima (con su efecto en los tipos); sus ojos miran al jefe, a la grieta
 *     o al shiny;
 *   - entrada del jefe: lengüeta roja con el N.º, nombre, tipos, porcentaje y barra RIVAL en violeta #9B6BFF
 *     con marcas al 25, 50 y 75 % y estela (nunca los colores de tus PS);
 *   - ranura única de avisos con cola (ver Avisos);
 *   - chips: mejoras, poder del altar y el evento en curso (horda, hora dorada);
 *   - ranuras de ataque con su tira de nivel y la píldora del tipo; objeto y vínculo; botón de pausa táctil;
 *   - flechas de borde comunes (jefe, grieta, shiny, compañeros, ladrón y Pokémon perdido), sujetas a la zona
 *     libre: salen si el objetivo está fuera de la pantalla o detrás de un panel del HUD;
 *   - cooperativo: compañeros con su barra o «Caído», sus flechas y «Has caído…» con la barra de levantar.
 *
 * Variantes (G.Estilo.disposicion): escritorio (×escala, de 1 a 1,25) con la pila en el centro de arriba y las
 * ranuras en fila abajo; compacta (móvil en horizontal, y también un plegable abierto o una ventana estrecha)
 * con dos filas arriba (≤ 20 % del alto en un móvil), las ranuras en COLUMNA A LA DERECHA (decisión de Nico) y
 * los compañeros y los chips en una columna a la izquierda.
 *
 * Interfaz para la pantalla dividida estilo Nintendo DS (opcional, lote posterior): todo el HUD se maqueta
 * contra un RECTÁNGULO DE JUEGO (donde se ve el mundo y van los datos) y un RECTÁNGULO DE CONTROLES opcional
 * (ranuras y pausa). Por defecto, juego = la pantalla entera (menos las zonas seguras) y controles = null.
 *   G.HudDex.ponerMarco((w, h) => ({ juego: {x, y, w, h}, controles: {x, y, w, h, lado} | null }))
 * cambia esos rectángulos (null vuelve al de por defecto); G.Estilo.disposicion(w, h, { dividida }) ya sabe
 * partir la pantalla. G.HudDex.bandas() da lo que el HUD reserva en el último fotograma
 * ({sup, inf, izq, der, zona, juego, controles, variante, piezas, flechas, pildora, pliegue}): la zona libre para el
 * encuadre (lote 4) y para las flechas. G.HudDex.columna() dice si las ranuras van en columna (el texto de Ajustes >
 * Controles) y G.HudDex.bandaSup(), hasta dónde llega el HUD por arriba (el aviso de logro va debajo).
 *
 * Plegable abierto (táctil, casi cuadrado, lado corto ≥ 600: el Magic V6), sin saber si está plano o a medio plegar:
 * en compacto, el contador, el jefe y el aviso se apartan del pliegue vertical, y las ranuras, el objeto, los
 * compañeros y los chips del horizontal (G.Estilo.disposicion da `pliegue`). Un aviso que no cabe entero a un lado
 * lo cruza (antes eso que recortarlo). Con la postura de verdad (Viewport Segments), en el lote de la pantalla dividida.
 */
G.HudDex = (() => {
  const TAU = Math.PI * 2;
  const MA = () => G.MARCA;
  const COL = () => G.MARCA.color;
  /** Las fuentes y los datos de upstream que lee este fichero (tools/nico/check.js lo compara con lo que lee
   *  js/ui/hud.js: si upstream añade algo al HUD, la prueba lo dice). */
  const CUBRE = {
    pl: ['xp', 'xpNext', 'mon', 'level', 'hp', 'maxHp', 'buffs', 'power', 'slots', 'active', 'cdMul', 'setActive', 'bonds', 'item',
      'x', 'y', 'dead', 'reviveT', 'kills', 'coins', 'dex', 'anim'],
    st: ['time'],
    G: ['U.clamp', 'U.mmss', 'U.dist', 'U.TYPE_COLOR', 'U.TYPE_NAME', 'World.biomeName', 'Weather.current', 'EnemyMgr.all', 'EnemyMgr.shinies',
      'Camera.left', 'Camera.top', 'Camera.scale', 'Icons.draw', 'Coop.active', 'Coop.mates', 'Coop.players', 'Rift.rift', 'Rift.inArena',
      'Rift.timeLeft', 'Events.drawHud', 'Spawner.banner', 'Touch.clearButtons', 'Touch.active', 'Touch.addButton', 'Game.state',
      'Game.togglePause', 'Audio.sfx', 'Items.BY', 'Player.REVIVE_TIME']
  };

  // ===================================================================
  // 1. Utilidades de dibujo
  // ===================================================================
  const fuentes = new Map();
  /** Fuente del HUD: M PLUS Rounded 1c 800/500 (G.MARCA.fuente), con caché por peso y tamaño. */
  function F(peso, px) {
    const k = peso + '|' + px;
    let f = fuentes.get(k);
    if (!f) { f = MA().fuente(peso, px); fuentes.set(k, f); }
    return f;
  }
  // Pila de ctx.save() propia: si algo falla a mitad, draw() deja el contexto como estaba (ver draw()).
  let pila = 0;
  const S = ctx => { ctx.save(); pila++; };
  const R = ctx => { ctx.restore(); pila--; fuenteActual = null; };
  // Letra y anchos con caché: poner ctx.font y medir texto es de lo que más cuesta del HUD (perfil del 12-10-2026).
  let fuenteActual = null;
  function letra(ctx, peso, px) { const f = F(peso, px); if (fuenteActual !== f) { ctx.font = f; fuenteActual = f; } }
  const anchos = new Map();
  function ancho(ctx, t) {
    const k = fuenteActual + '|' + t;
    let v = anchos.get(k);
    if (v === undefined) { v = ctx.measureText(t).width; if (anchos.size > 1500) anchos.clear(); anchos.set(k, v); }
    return v;
  }
  // La caché de anchos se vacía cuando termina de cargar una fuente: M PLUS Rounded 1c llega con font-display: swap
  // y, si el HUD se pinta antes, los anchos apuntados son los de la letra de reserva (textos que se recortaban o
  // piezas que no encajaban hasta la siguiente vez que cambiara el texto).
  (function vaciarAlCargarFuentes() {
    const f = typeof document !== 'undefined' && document && document.fonts;
    if (!f) return;
    const vaciar = () => anchos.clear();
    try { if (typeof f.addEventListener === 'function') f.addEventListener('loadingdone', vaciar); } catch (e) { /* sin eventos */ }
    try { if (f.ready && typeof f.ready.then === 'function') f.ready.then(vaciar, () => {}); } catch (e) { /* sin ready */ }
  })();
  /** Rectángulo redondeado (radio o [sup-izq, sup-der, inf-der, inf-izq]); sólo el camino. */
  function rr(ctx, x, y, w, h, r) {
    const q = Array.isArray(r) ? r : [r, r, r, r];
    const m = Math.max(0, Math.min(w, h) / 2), a = Math.max(0, Math.min(q[0], m)), b = Math.max(0, Math.min(q[1], m)), c = Math.max(0, Math.min(q[2], m)), d = Math.max(0, Math.min(q[3], m));
    ctx.beginPath();
    // Con roundRect nativo (Chrome 99+, Safari 16+, Firefox 112+), un solo camino en vez de moveTo + 4 arcTo.
    if (ctx.roundRect && w >= 0 && h >= 0) { ctx.roundRect(x, y, w, h, [a, b, c, d]); return; }
    ctx.moveTo(x + a, y);
    ctx.arcTo(x + w, y, x + w, y + h, b);
    ctx.arcTo(x + w, y + h, x, y + h, c);
    ctx.arcTo(x, y + h, x, y, d);
    ctx.arcTo(x, y, x + w, y, a);
    ctx.closePath();
  }
  /** Panel de cristal: relleno al 92 %, trazo oscuro de 1 px y bisel interior de 1 px (sin desenfoques). */
  function panel(ctx, x, y, w, h, r, fondo) {
    const C = COL();
    rr(ctx, x, y, w, h, r);
    ctx.fillStyle = fondo || C.cristalHUD; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = C.trazoExterior; ctx.stroke();
    if (w > 4 && h > 4) {
      rr(ctx, x + 1, y + 1, w - 2, h - 2, Array.isArray(r) ? r.map(v => Math.max(0, v - 1)) : Math.max(0, r - 1));
      ctx.strokeStyle = C.trazoInterior; ctx.stroke();
    }
  }
  /** Barra con carril, relleno y brillo arriba (35 % del alto). op: { marcas: true, estela: fracción }. */
  function barra(ctx, x, y, w, h, f, col, op = {}) {
    const C = COL();
    f = Math.max(0, Math.min(1, f || 0));
    rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = C.carril; ctx.fill();
    S(ctx);
    rr(ctx, x, y, w, h, h / 2); ctx.clip();
    if (op.estela > f) { ctx.fillStyle = C.rivalEstela; ctx.fillRect(x + w * f, y, w * (Math.min(1, op.estela) - f), h); }
    if (f > 0) {
      ctx.fillStyle = col; ctx.fillRect(x, y, w * f, h);
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x, y, w * f, Math.max(1, Math.round(h * 0.35)));
    }
    if (op.marcas) {
      ctx.fillStyle = 'rgba(15,38,48,0.7)';
      for (const k of [0.25, 0.5, 0.75]) ctx.fillRect(Math.round(x + w * k), y, Math.max(1, op.marcas), h);
    }
    R(ctx);
  }
  /** Texto suelto sobre el mundo: siempre con contorno (3 px si es pequeño, 4 si es grande), trazado antes. */
  function contorno(ctx, t, x, y, col, lw = 3) {
    ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = COL().contorno; ctx.strokeText(t, x, y);
    ctx.fillStyle = col; ctx.fillText(t, x, y);
  }
  /** Recorta con «…» al ancho dado (con la fuente ya puesta). */
  function recortar(ctx, t, max) {
    t = String(t);
    if (max <= 0) return '';
    if (ancho(ctx, t) <= max) return t;
    while (t.length > 1 && ancho(ctx, t + '…') > max) t = t.slice(0, -1);
    return t + '…';
  }
  /** Pone la letra más grande de `tams` con la que `t` cabe en `max` y devuelve `t`; si no cabe con ninguna, la última
   *  y `t` recortado con «…». */
  function encajar(ctx, peso, tams, t, max) {
    for (const px of tams) { letra(ctx, peso, px); if (ancho(ctx, t) <= max) return t; }
    return recortar(ctx, t, max);
  }
  /** Parte un texto en dos líneas por el espacio que deja la más larga más corta (con la fuente ya puesta). */
  function partir(ctx, t) {
    let mejor = [t, ''], peor = Infinity;
    for (let i = t.indexOf(' '); i > 0; i = t.indexOf(' ', i + 1)) {
      const a = t.slice(0, i), b = t.slice(i + 1), m = Math.max(ancho(ctx, a), ancho(ctx, b));
      if (m < peor) { peor = m; mejor = [a, b]; }
    }
    return mejor;
  }
  const ingles = () => !!(G.I18n && G.I18n.lang === 'en');
  /** «1.204» (en inglés, «1,204»). */
  const milesCache = new Map();
  const miles = n => {
    n = Math.floor(Math.max(0, n || 0));
    let v = milesCache.get(n);
    if (v === undefined) { v = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ingles() ? ',' : '.'); if (milesCache.size > 300) milesCache.clear(); milesCache.set(n, v); }
    return v;
  };
  /** «1,5» (en inglés, «1.5»). */
  const decimal = v => { const s = String(Math.round(v * 100) / 100); return ingles() ? s : s.replace('.', ','); };
  const hexRgb = h => { const n = parseInt(String(h).slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  /** Tinta oscura o blanca sobre un color: la que más contraste da. */
  const tintaSobre = hex => { const c = hexRgb(hex), C = COL(); return contraste(c, hexRgb(C.tintaOscura)) >= contraste(c, [255, 255, 255]) ? C.tintaOscura : '#FFFFFF'; };
  const psColor = f => { const C = COL(); return f > 0.5 ? C.psAlto : f > 0.2 ? C.psMedio : C.psBajo; };
  let mqReducido = null, RED = null;
  /** «Menos sacudidas y destellos» o prefers-reduced-motion: sin parpadeos, pulsos, botes, estela ni deslizamientos
   *  (una vez por fotograma: draw() lo fija en RED). */
  function reducido() { return RED !== null ? RED : calcularReducido(); }
  function calcularReducido() {
    if (G.Settings && G.Settings.get && G.Settings.get('calm')) return true;
    try { if (!mqReducido && typeof matchMedia === 'function') mqReducido = matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) { mqReducido = null; }
    return !!(mqReducido && mqReducido.matches);
  }

  // ===================================================================
  // 2. Marco: rectángulo de juego y de controles (interfaz de la pantalla dividida)
  // ===================================================================
  let marcoFn = null;
  /** {juego, controles} para una pantalla de w×h px CSS: el de ponerMarco() o, por defecto, la pantalla entera. */
  function marco(w, h) {
    let m = null;
    if (marcoFn) { try { m = marcoFn(w, h); } catch (e) { m = null; } }
    const ok = r => r && [r.x, r.y, r.w, r.h].every(v => typeof v === 'number' && isFinite(v)) && r.w > 0 && r.h > 0;
    if (!m || !ok(m.juego)) return { juego: { x: 0, y: 0, w, h }, controles: null };
    return { juego: m.juego, controles: ok(m.controles) ? m.controles : null };
  }
  function ponerMarco(fn) { marcoFn = typeof fn === 'function' ? fn : null; ultimo = null; }

  // ===================================================================
  // 3. Maquetador (puro): dónde va cada pieza
  // ===================================================================
  /**
   * c: { tactil, jefe, aviso: {texto, sub, tipo} | null, chips: [{texto, corto}], companeros: n, clima, ranuras: n,
   *      objeto, vinculo }
   * op: { seguras, marco: {juego, controles}, medir(texto, peso, px) -> ancho }
   * Devuelve { variante, escala, kc, juego, controles, piezas, bandas, libre, columna, medidas }.
   */
  function maquetar(w, h, c, op = {}) {
    const mc = op.marco || marco(w, h);
    const seguras = op.seguras || (G.Estilo.zonasSeguras ? G.Estilo.zonasSeguras() : undefined);
    const d = G.Estilo.disposicion(w, h, { seguras, juego: mc.juego, controles: mc.controles, tactil: !!c.tactil });
    const medir = op.medir || ((t, peso, px) => String(t).length * px * (peso >= 650 ? 0.62 : 0.56));
    const L = d.variante === 'compacto' ? compacto(d, c, medir) : escritorio(d, c, medir);
    if (d.controles) controles(d, c, L);
    const J = d.juego, P = L.piezas;
    // Bandas: lo reservado arriba (filas o pila central, con jefe y aviso), abajo (la fila de ranuras con su
    // píldora) y a los lados (columnas), dentro del rectángulo de juego.
    const bandas = { sup: d.bandas.sup, inf: d.bandas.inf, izq: L.izq || 0, der: L.der || 0 };
    const libre = { x: J.x + bandas.izq, y: J.y + bandas.sup, w: Math.max(0, J.w - bandas.izq - bandas.der), h: Math.max(0, J.h - bandas.sup - bandas.inf) };
    return { variante: d.variante, escala: d.escala, kc: d.kc, juego: J, controles: d.controles, bordes: d.bordes, piezas: P, bandas, libre,
      columna: d.ranuras === 'columna', ranurasModo: d.ranuras, m: L.m, filas: d.filas, pliegue: d.pliegue };
  }

  /** ¿Pisa el rectángulo r la franja del pliegue? (con el pliegue en el eje 'x', una línea vertical en x = pos). */
  function pisaPliegue(r, pg) {
    if (!pg || !r) return false;
    const a = pg.pos - pg.ancho / 2, b = pg.pos + pg.ancho / 2;
    return pg.eje === 'x' ? r.x < b && r.x + r.w > a : r.y < b && r.y + r.h > a;
  }
  /** Aparta una pila vertical de piezas de la franja de un pliegue horizontal: la parte en dos por el hueco que pide
   *  menos desplazamiento (las de arriba suben y las de abajo bajan) sin salir de [arriba, abajo]; si no se puede,
   *  la deja como está. No separa una pieza montada sobre la anterior (la insignia del vínculo sobre el objeto). */
  function apartarPila(lista, pg, arriba, abajo) {
    const L = lista.filter(Boolean);
    if (!pg || pg.eje !== 'y' || !L.some(r => pisaPliegue(r, pg))) return;
    const pa = pg.pos - pg.ancho / 2, pb = pg.pos + pg.ancho / 2;
    L.sort((a, b) => a.y - b.y);
    const top = L[0].y, bot = Math.max(...L.map(r => r.y + r.h));
    let mejor = null;
    for (let k = 0; k <= L.length; k++) {
      if (k > 0 && k < L.length && L[k].y < L[k - 1].y + L[k - 1].h) continue;
      const finA = k ? Math.max(...L.slice(0, k).map(r => r.y + r.h)) : -Infinity;
      const iniB = k < L.length ? Math.min(...L.slice(k).map(r => r.y)) : Infinity;
      const sube = Math.max(0, Math.ceil(finA - pa)), baja = Math.max(0, Math.ceil(pb - iniB));
      if ((k && top - sube < arriba) || (k < L.length && bot + baja > abajo)) continue;
      if (!mejor || sube + baja < mejor.c) mejor = { k, sube, baja, c: sube + baja };
    }
    if (mejor) L.forEach((r, i) => { r.y += i < mejor.k ? -mejor.sube : mejor.baja; });
  }

  /** Los textos posibles de un aviso, del más largo al más corto (en compacto, la grieta va en una línea corta). */
  function variantesAviso(a, comp) {
    if (comp && a.tipo === 'grieta' && a.corto) return [a.corto];
    return a.variantes && a.variantes.length ? a.variantes : [a.texto];
  }
  /** Ancho del primer texto del aviso que cabe en `max` (si no cabe ninguno, el del más corto, que irá con «…»). */
  function anchoAviso(a, comp, peso, tam, max, medir) {
    let w = 0;
    for (const v of variantesAviso(a, comp)) { w = medir(v, peso, tam); if (w <= max) return w; }
    return w;
  }

  /** Variante compacta (px ×kc). */
  function compacto(d, c, medir) {
    const K = MA().hud.compacto, kc = d.kc, r = v => Math.round(v * kc);
    const J = d.juego, b = d.bordes, fl = d.filas, f1 = fl.f1, f2 = fl.f2;
    const L0 = J.x + Math.max(fl.margenLados, b.izq), R0 = J.x + J.w - Math.max(fl.margenLados, b.der);
    const T0 = J.y + Math.max(fl.margen, b.sup), B0 = J.y + J.h - Math.max(fl.margenLados, b.inf);
    const g = r(K.separacion), P = {};
    const enJuego = !d.controles;
    // ---- fila 1: ficha | contador (centrado si cabe) | Rotom | pausa ----
    const pz = Math.max(44, r(K.pausa));
    P.pausa = c.tactil && enJuego ? { x: R0 - pz, y: T0, w: pz, h: pz } : null;
    const der1 = P.pausa ? P.pausa.x - g : R0;
    const solape = r(K.ficha.solape);
    let wp = r(K.ficha.pantalla), wr = r(K.rotom.w), modoRotom = 'completo', wct = r(K.contador.w), mini = false;
    const fichaD = () => L0 + f1 - solape + wp;
    const rotomI = () => der1 - (modoRotom === 'cara' ? f1 : wr);
    const centro = J.x + J.w / 2;
    const colocar = centrado => {
      const a = fichaD() + g, z = rotomI() - g;
      if (z - a < wct - 0.01) return null;
      const x = centro - wct / 2;
      if (x >= a - 0.01 && x + wct <= z + 0.01) return x;
      return centrado ? null : Math.max(a, Math.min(x, z - wct));
    };
    let cx = colocar(true);
    if (cx === null) {                                      // Rotom más estrecho, con el contador centrado
      const hueco = der1 - (centro + wct / 2 + g);
      if (hueco >= r(K.rotom.min)) { wr = Math.min(wr, Math.floor(hueco)); cx = colocar(true); }
    }
    if (cx === null) { wr = Math.max(r(K.rotom.min), Math.min(wr, Math.floor(der1 - fichaD() - 2 * g - wct))); cx = colocar(false); }
    if (cx === null) { modoRotom = 'cara'; cx = colocar(true); if (cx === null) cx = colocar(false); }
    if (cx === null) { wp = Math.max(r(K.ficha.pantallaMin), Math.floor(rotomI() - 2 * g - wct - (L0 + f1 - solape))); cx = colocar(false); }
    if (cx === null) { wct = r(K.contador.mini); mini = true; cx = colocar(true); if (cx === null) cx = colocar(false); }
    if (cx === null) cx = Math.round(centro - wct / 2);   // degradación declarada (menos de ~340 px de ancho)
    // Plegable abierto en vertical (pliegue vertical): el contador, a un lado del pliegue si cabe entre la ficha y Rotom.
    const pg = d.pliegue, pa = pg ? pg.pos - pg.ancho / 2 : 0, pb = pg ? pg.pos + pg.ancho / 2 : 0;
    if (pg && pg.eje === 'x' && pisaPliegue({ x: cx, y: T0, w: wct, h: f1 }, pg)) {
      const a = fichaD() + g, z = rotomI() - g;
      if (pa - wct >= a) cx = Math.floor(pa - wct);
      else if (pb + wct <= z) cx = Math.ceil(pb);
    }
    P.ficha = { x: L0, y: T0, w: f1 - solape + wp, h: f1, lado: f1, pantalla: wp };
    P.contador = { x: Math.round(cx), y: T0, w: wct, h: f1, mini };
    P.rotom = { x: rotomI(), y: T0, w: modoRotom === 'cara' ? f1 : wr, h: f1, modo: modoRotom };
    // ---- fila 2: jefe a la izquierda y aviso a la derecha (sin jefe, el aviso centrado) ----
    const y2 = T0 + f1 + fl.hueco;
    const R2 = P.pausa && P.pausa.y + P.pausa.h > y2 ? P.pausa.x - g : R0;
    const U = R2 - L0;
    if (c.jefe) P.jefe = { x: L0, y: y2, w: Math.min(r(K.jefe.anchoMax), c.aviso ? Math.floor((U - g) / 2) : U), h: f2 };
    if (c.aviso) {
      const pista = c.aviso.tipo === 'pista', tam = r(12), peso = pista ? 500 : 800;
      const max = c.jefe ? Math.min(r(K.aviso.anchoMaxConJefe), Math.floor((U - g) / 2)) : Math.min(r(K.aviso.anchoMaxSolo), U);
      const extra = (pista ? 0 : r(K.aviso.lengueta)) + r(K.aviso.padding);
      const aw = Math.min(max, Math.ceil(anchoAviso(c.aviso, true, peso, tam, max - extra, medir) + extra));
      const ax = c.jefe ? R2 - aw : Math.max(L0, Math.min(R2 - aw, Math.round(centro - aw / 2)));
      P.aviso = { x: ax, y: y2, w: aw, h: f2 };
    }
    if (pg && pg.eje === 'x') {
      // El jefe acaba antes del pliegue (si no queda en menos de 200 px) y el aviso empieza después si cabe entero.
      if (P.jefe && pisaPliegue(P.jefe, pg) && pa - L0 >= r(200)) P.jefe.w = Math.floor(pa - L0);
      if (P.aviso && !c.jefe && pisaPliegue(P.aviso, pg) && R2 - pb >= P.aviso.w) P.aviso.x = Math.ceil(pb);
    }
    const sup = y2 + f2;
    // ---- columna derecha: objeto, vínculo y ranuras (si los mandos no van aparte) ----
    let der = 0, colX = R0;
    P.ranuras = []; P.objeto = null; P.vinculo = null;
    if (enJuego) {
      const RK = K.ranuras, apretado = J.h < 360, justo = J.h < 376;
      const Sl = apretado ? RK.apretado.lado : r(RK.lado), gs = justo ? RK.apretado.separacion : r(RK.separacion);
      const O = apretado ? RK.apretado.objeto : r(RK.objeto), gO = gs + (justo ? 2 : r(4)), V = r(RK.vinculo);
      const n = Math.max(1, c.ranuras || 1);
      colX = R0 - Sl;
      const arriba = sup + g, abajo = B0, disp = abajo - arriba;
      const alto = (o, v) => (o ? O + gO : 0) + (v ? V + gO : 0) + n * Sl + (n - 1) * gs;
      let conVinculo = !!c.vinculo, insignia = false;
      if (alto(c.objeto, conVinculo) > disp && c.objeto && conVinculo) { conVinculo = false; insignia = true; }
      let y = Math.round(arriba + Math.max(0, (disp - alto(c.objeto, conVinculo)) / 2));
      if (c.objeto) { P.objeto = { x: R0 - Sl + Math.round((Sl - O) / 2), y, w: O, h: O }; y += O + gO; }
      if (c.vinculo) {
        if (conVinculo) { P.vinculo = { x: colX, y, w: Sl, h: V, fila: true }; y += V + gO; }
        else if (insignia || !c.objeto) P.vinculo = P.objeto ? { x: colX, y: P.objeto.y + O - Math.round(V * 0.55), w: V, h: V, insignia: true }
          : { x: colX, y: Math.max(arriba, y - V - gO), w: Sl, h: V, fila: true };
      }
      for (let i = 0; i < n; i++) { P.ranuras.push({ x: colX, y, w: Sl, h: Sl }); y += Sl + gs; }
      P.lado = Sl; P.desplazamiento = r(RK.desplazamientoActiva);
      der = J.x + J.w - colX + gs;
      // Plegable abierto en horizontal (pliegue horizontal): ninguna ranura ni el objeto encima del pliegue.
      apartarPila([P.objeto, P.vinculo, ...P.ranuras], pg, arriba, abajo);
    }
    // ---- columna izquierda: compañeros y chips (con las dos columnas, ≤ 22 % del ancho sin muesca) ----
    const CI = K.columnaIzq, nC = c.companeros || 0, chips = c.chips || [];
    P.companeros = []; P.chips = [];
    let izq = 0;
    if (nC || chips.length) {
      const presupuesto = Math.floor(CI.lateralesMax * J.w - der - (L0 - J.x) - g);
      const wi = Math.max(r(CI.anchoMin), Math.min(r(CI.anchoMax), presupuesto));
      let y = sup + g;
      const salta = alto => { if (pg && pg.eje === 'y' && y < pb && y + alto > pa) y = Math.ceil(pb); };   // por debajo del pliegue
      for (let i = 0; i < nC; i++) { salta(r(CI.carta)); if (y + r(CI.carta) > B0) break; P.companeros.push({ x: L0, y, w: wi, h: r(CI.carta) }); y += r(CI.pasoCarta); }
      for (let i = 0; i < chips.length; i++) { salta(r(CI.chip)); if (y + r(CI.chip) > B0) break; P.chips.push({ x: L0, y, w: wi, h: r(CI.chip) }); y += r(CI.pasoChip); }
      izq = L0 - J.x + wi + g;
    }
    return { piezas: P, izq, der, m: { L0, R0, T0, B0, g, colX } };
  }

  /** Variante de escritorio (u ×escala). */
  function escritorio(d, c, medir) {
    const E = MA().hud.escritorio, s = d.escala, u = v => Math.round(v * s);
    const J = d.juego, b = d.bordes, P = {};
    const L0 = J.x + Math.max(u(E.margen), b.izq), R0 = J.x + J.w - Math.max(u(E.margen), b.der);
    const T0 = J.y + Math.max(u(E.margen), b.sup), B0 = J.y + J.h - Math.max(u(E.margenAbajo), b.inf);
    const enJuego = !d.controles, centro = J.x + J.w / 2;
    // ---- arriba: ficha (y debajo, chips y compañeros) | contador, jefe y aviso en el centro | Rotom | pausa ----
    const pz = Math.max(44, u(40));
    P.pausa = c.tactil && enJuego ? { x: R0 - pz, y: T0, w: pz, h: pz } : null;
    const fw = u(E.ficha.lado) - u(E.ficha.pantalla.solape) + u(E.ficha.pantalla.w);
    P.ficha = { x: L0, y: T0, w: fw, h: u(E.ficha.lado), lado: u(E.ficha.lado), pantalla: u(E.ficha.pantalla.w) };
    P.contador = { x: Math.round(centro - u(E.contador.w) / 2), y: T0, w: u(E.contador.w), h: u(E.contador.h), mini: false };
    const wr = u(E.rotom.w);
    P.rotom = { x: (P.pausa ? P.pausa.x - u(E.rotom.separacionPausa) : R0) - wr, y: T0, w: wr, h: c.clima ? u(E.rotom.hClima) : u(E.rotom.h), modo: 'completo' };
    const pasillo = J.w - 2 * (L0 - J.x + fw + u(E.separacion));   // entre la columna de la ficha y la de Rotom
    const jy = P.contador.y + P.contador.h + u(E.jefe.separacion);
    if (c.jefe) {
      const jw = Math.max(u(E.jefe.anchoMin), Math.min(u(E.jefe.anchoMax), pasillo));
      P.jefe = { x: Math.round(centro - jw / 2), y: jy, w: jw, h: u(E.jefe.h) };
    }
    if (c.aviso) {
      const A = E.aviso, grieta = c.aviso.tipo === 'grieta', pista = c.aviso.tipo === 'pista';
      const tope = Math.min(u(A.anchoMax), Math.max(u(160), pasillo)), extra = (pista ? 0 : u(A.lengueta)) + 2 * u(A.padding);
      // Si el texto no cabe (la pista de controles a 1024 de ancho), su versión más corta.
      const tw = grieta ? Math.max(medir(c.aviso.texto, 800, u(A.grieta.titulo)), medir(c.aviso.sub || '', 500, u(A.grieta.sub)))
        : anchoAviso(c.aviso, false, pista ? 500 : 800, pista ? u(13) : u(A.tam), tope - extra, medir);
      const aw = Math.min(tope, Math.ceil(tw + extra));
      const ay = (c.jefe ? jy + u(E.jefe.h) : P.contador.y + P.contador.h) + u(A.separacion);
      P.aviso = { x: Math.round(centro - aw / 2), y: ay, w: aw, h: grieta ? u(A.grieta.h) : u(A.h) };
    }
    // Chips y compañeros, bajo la ficha (se envuelven en filas dentro de su ancho).
    const CH = E.chips;
    let y = P.ficha.y + P.ficha.h + u(CH.separacion), x = L0;
    P.chips = [];
    for (const ch of c.chips || []) {
      const cw = Math.min(fw, Math.ceil(medir(ch.texto, 800, u(CH.tam)) + u(CH.padding) + u(17)));
      if (x > L0 && x + cw > L0 + fw) { x = L0; y += u(CH.fila); }
      P.chips.push({ x, y, w: cw, h: u(CH.h) });
      x += cw + u(CH.entre);
    }
    if (P.chips.length) y += u(CH.fila);
    const CO = E.companeros;
    P.companeros = [];
    if (c.companeros) {
      P.grupo = { x: L0, y, w: fw, h: 2 * u(CO.padding) + c.companeros * u(CO.fila) };
      for (let i = 0; i < c.companeros; i++) P.companeros.push({ x: L0, y: y + u(CO.padding) + i * u(CO.fila), w: fw, h: u(CO.fila) });
      y = P.grupo.y + P.grupo.h;
    }
    // ---- abajo: objeto | ranuras en fila (la activa sube) | vínculo ----
    P.ranuras = []; P.objeto = null; P.vinculo = null;
    const RN = E.ranuras;
    if (enJuego) {
      const n = Math.max(1, c.ranuras || 1), Sl = u(RN.lado), gs = u(RN.separacion), total = n * Sl + (n - 1) * gs;
      const x0 = Math.round(centro - total / 2), sy = B0 - Sl;
      for (let i = 0; i < n; i++) P.ranuras.push({ x: x0 + i * (Sl + gs), y: sy, w: Sl, h: Sl });
      P.objeto = { x: x0 - u(RN.objeto.separacion) - Sl, y: sy, w: Sl, h: Sl, vacio: !c.objeto };
      if (c.vinculo) { const vi = u(RN.vinculo.icono); P.vinculo = { x: x0 + total + u(RN.vinculo.separacion), y: Math.round(sy + Sl / 2 - vi / 2), w: vi, h: vi }; }
      P.lado = Sl; P.elevacion = u(RN.elevacion);
    }
    // Banda izquierda: la columna de la ficha sólo cuenta si baja más que la pila central.
    const izq = y - J.y > d.bandas.sup + u(4) ? L0 - J.x + fw + u(E.separacion) : 0;
    return { piezas: P, izq, der: 0, m: { L0, R0, T0, B0, g: u(E.separacion) } };
  }

  /** Pantalla dividida: ranuras en fila y pausa dentro del rectángulo de controles. */
  function controles(d, c, L) {
    const K = d.controles, P = L.piezas, n = Math.max(1, c.ranuras || 1);
    const m = Math.max(8, Math.round(Math.min(K.w, K.h) * 0.04));
    const Sl = Math.max(48, Math.min(72, Math.floor(Math.min(K.h * 0.38, (K.w - 2 * m - 2 * 64) / (n + 0.6)))));
    const gs = Math.round(Sl * 0.16), total = n * Sl + (n - 1) * gs;
    const x0 = Math.round(K.x + K.w / 2 - total / 2), y0 = Math.round(K.y + K.h / 2 - Sl / 2);
    P.ranuras = [];
    for (let i = 0; i < n; i++) P.ranuras.push({ x: x0 + i * (Sl + gs), y: y0, w: Sl, h: Sl });
    P.objeto = { x: x0 - gs * 2 - Sl, y: y0, w: Sl, h: Sl, vacio: !c.objeto };
    P.vinculo = c.vinculo ? { x: x0 + total + gs * 2, y: Math.round(y0 + Sl / 2 - 12), w: 24, h: 24 } : null;
    const pz = 44;
    P.pausa = c.tactil ? { x: K.x + K.w - m - pz, y: K.y + m, w: pz, h: pz } : null;
    P.lado = Sl; P.elevacion = d.variante === 'escritorio' ? Math.round(6 * d.escala) : 0; P.desplazamiento = 0;
  }

  // ===================================================================
  // 4. Avisos: una sola ranura con cola
  // ===================================================================
  /**
   * Todo aviso del lienzo pasa por aquí: el texto de G.Spawner.say (aparición del jefe, clima, «— Bioma —»,
   * «Has entrado en la grieta…», «Pausa: … elige fusión…» y los demás), la grieta abierta y la pista de
   * controles. Se lee G.Spawner.banner() en cada fotograma (sin ganchos): un texto nuevo, o el mismo dicho otra
   * vez, entra en la cola.
   *   - Prioridad: grieta > jefe > zona > clima > resto; la pista sólo sale con la ranura libre.
   *   - Uno visible y como mucho 2 en espera (se pierde el de menos prioridad); nunca el mismo texto dos veces.
   *   - Cada uno dura lo que dice su origen, con un mínimo de 1,6 s; uno de más prioridad lo releva pasado ese
   *     mínimo. Los persistentes (más de 30 s: la pausa por fusión) siguen mientras el origen los mantenga.
   *   - «— Bosque Umbrío —» y «Has entrado en la grieta…» se convierten en el rótulo de zona (una vez).
   */
  const Avisos = (() => {
    const PRIO = { grieta: 5, jefe: 4, zona: 3, clima: 2, resto: 1, pista: 0 };
    const MIN = 1.6, ENTRADA = 0.18, SALIDA = 0.4, ESPERA = 2;
    // La pista de controles, de la más larga a la más corta: sale la primera que cabe entera (a 1024 de ancho, la del
    // medio; con el jefe al lado en un móvil pequeño, la última).
    const PISTA_TECLADO = ['WASD moverse  ·  1-4 / Q / E o clic en un ataque para cambiarlo  ·  Esc pausa',
      'WASD moverse  ·  1-4, Q, E o clic: cambiar ataque  ·  Esc pausa', 'WASD  ·  1-4 / Q / E  ·  Esc pausa'];
    const PISTA_TACTIL = ['Arrastra el dedo para moverte  ·  toca un ataque para cambiarlo',
      'Arrastra para moverte  ·  toca un ataque para cambiarlo', 'Arrastra  ·  toca un ataque'];
    let vis = null, cola = [], visto = null, grietaVista = null, tPrevio = -1;
    function clasificar(texto, secs) {
      const a = { tipo: 'resto', texto, origen: texto, dur: secs, persistente: secs >= 30, icono: 'rayo' };
      let m;
      if ((m = /^— (.+) —$/.exec(texto))) { a.tipo = 'zona'; a.texto = m[1]; a.icono = 'lente'; }
      else if (texto === 'Has entrado en la grieta…') { a.tipo = 'zona'; a.texto = G.World.biomeName(); a.icono = 'lente'; }
      else if (/salvaje apareció!$/.test(texto)) a.tipo = 'jefe';
      else {
        const K = (G.Weather && G.Weather.KINDS) || {};
        for (const k in K) if (K[k].name && texto.startsWith(K[k].name + ':')) { a.tipo = 'clima'; a.icono = K[k].icon; break; }
      }
      return a;
    }
    function meter(a, t) {
      if (vis && !vis.saliendo && vis.texto === a.texto) { vis.fin = Math.max(vis.fin, t + Math.max(a.dur, MIN)); vis.persistente = a.persistente; vis.origen = a.origen; return; }
      if (cola.some(x => x.texto === a.texto)) return;
      let i = cola.findIndex(x => PRIO[x.tipo] < PRIO[a.tipo]);
      if (i < 0) i = cola.length;
      cola.splice(i, 0, a);
      if (cola.length > ESPERA) cola.length = ESPERA;
    }
    function reiniciar() { vis = null; cola = []; visto = null; grietaVista = null; }
    /** Una vez por fotograma. t en segundos (performance.now). */
    function actualizar(t, st, tactil) {
      if (st.time < tPrevio - 1) reiniciar();                 // partida nueva
      tPrevio = st.time;
      const ban = G.Spawner.banner();
      if (ban && ban.text && (!visto || ban.text !== visto.text || ban.t > visto.t + 0.05)) meter(clasificar(ban.text, ban.t), t);
      visto = ban ? { text: ban.text, t: ban.t } : null;
      const rf = G.Rift && G.Rift.rift;
      if (rf && rf !== grietaVista && rf.t < 4.5) {
        grietaVista = rf;
        meter({ tipo: 'grieta', texto: '¡Se ha abierto una grieta!', corto: '¡Grieta abierta! Sigue la flecha morada',
          sub: 'Sigue la flecha morada: dentro te espera un legendario', dur: Math.max(MIN, 4.5 - rf.t), icono: 'grieta' }, t);
      }
      if (!rf) grietaVista = null;
      if (vis && !vis.saliendo) {
        const visto2 = t - vis.t0;
        let sigue;
        if (vis.tipo === 'pista') sigue = st.time < 14 && !cola.length;
        else if (vis.persistente) sigue = !!(ban && ban.text === vis.origen);
        else sigue = t < vis.fin - SALIDA;
        const relevo = cola.length && !vis.persistente && PRIO[cola[0].tipo] > PRIO[vis.tipo] && visto2 >= MIN;
        if (!sigue || relevo) { vis.saliendo = true; vis.ts = t; }
      }
      if (vis && vis.saliendo && t - vis.ts >= (reducido() ? 0.15 : SALIDA)) vis = null;
      if (!vis && cola.length) { vis = cola.shift(); vis.t0 = t; vis.fin = t + Math.max(vis.dur, MIN); vis.saliendo = false; }
      if (!vis && st.time < 14) {
        const vs = tactil ? PISTA_TACTIL : PISTA_TECLADO;
        vis = { tipo: 'pista', t0: t, fin: Infinity, dur: Infinity, icono: null, texto: vs[0], variantes: vs };
      }
      return vis;
    }
    /** Opacidad y desplazamiento de entrada del visible (0..1, px en u). */
    function animacion(t) {
      if (!vis) return { a: 0, dy: 0 };
      const red = reducido(), ent = red ? 0.15 : ENTRADA, sal = red ? 0.15 : SALIDA;
      const a = vis.saliendo ? Math.max(0, 1 - (t - vis.ts) / sal) : Math.min(1, (t - vis.t0) / ent);
      const dy = red || vis.saliendo ? 0 : -8 * (1 - Math.min(1, (t - vis.t0) / ENTRADA));
      return { a, dy };
    }
    return { actualizar, animacion, reiniciar, PRIO, get visible() { return vis; }, get cola() { return cola.slice(); } };
  })();

  // ===================================================================
  // 5. Lo que se enseña (datos del juego)
  // ===================================================================
  const BUFF = { atk: ['Ataque', 'Atq'], spd: ['Velocidad', 'Vel'], def: ['Defensa', 'Def'], regen: ['Regenera', 'Reg'] };
  const BUFF_COL = { atk: '#FF7A5C', spd: '#7FE0FF', def: '#C3CCD6' };
  /** El jefe que se enseña (el de menos vida) y cuántos más hay. Una vez por fotograma (con cientos de enemigos, cada
   *  vuelta a la lista cuenta): draw() lo guarda en jefeFotograma. */
  let jefeFotograma;
  function jefeActual() {
    if (jefeFotograma !== undefined) return jefeFotograma;
    let b = null, n = 0;
    for (const e of G.EnemyMgr.all()) {
      if (!e.boss || e.dead) continue;
      n++;
      if (!b || e.hp / e.maxHp < b.hp / b.maxHp) b = e;
    }
    return b ? { e: b, mas: n - 1 } : null;
  }
  function estadoEvento() { return G.Events && G.Events.estado ? G.Events.estado : null; }
  function contenido(pl, st, aviso) {
    const C = COL(), chips = [];
    for (const k in pl.buffs) {
      const b = pl.buffs[k];
      if (!b || b.n <= 0) continue;
      const [l, cto] = BUFF[k] || [k, k];
      chips.push({ texto: l + ' ×' + b.n, corto: cto + ' ×' + b.n, color: BUFF_COL[k] || C.psAlto });
    }
    if (pl.power) chips.push({ texto: pl.power.def.name + ' ' + Math.ceil(pl.power.t) + ' s', color: pl.power.def.color });
    const ev = estadoEvento();
    if (ev && ev.id === 'horde' && ev.tipo) chips.push({ texto: 'Horda ' + (G.U.TYPE_NAME[ev.tipo] || ev.tipo) + ' · ' + Math.ceil(ev.quedan) + ' s', corto: (G.U.TYPE_NAME[ev.tipo] || ev.tipo) + ' ' + Math.ceil(ev.quedan) + ' s', color: G.U.TYPE_COLOR[ev.tipo] || C.oro });
    else if (ev && ev.id === 'gold') chips.push({ texto: 'Hora dorada · ' + Math.ceil(ev.quedan) + ' s', corto: Math.ceil(ev.quedan) + ' s', color: C.oro });
    const jefe = jefeActual();
    if (G.Rift.inArena && !jefe) chips.push({ texto: 'Grieta ' + G.U.mmss(G.Rift.timeLeft), color: C.grieta });
    const mates = G.Coop.active ? G.Coop.mates.filter(m => m.connected) : [];
    return {
      tactil: !!G.Touch.active, jefe, aviso, chips, mates, companeros: mates.length, clima: G.Weather.current,
      ranuras: Math.max(1, pl.slots.length), objeto: !!pl.item, vinculo: pl.bonds > 0
    };
  }

  // ===================================================================
  // 6. Piezas
  // ===================================================================
  let lente = null, ojos = [0, 0], parpadeo = 3, tPrev = 0, cambioRanura = { i: -1, t: 0 };
  const estelas = new Map();       // id del jefe -> { f, estela, t }
  const lentesJefe = new Map();    // dex -> Animator

  function dibujarLente(ctx, pl, cx, cy, r, dt) {
    const C = COL();
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
    g.addColorStop(0, C.lenteClara); g.addColorStop(0.55, C.lente); g.addColorStop(1, C.lenteOscura);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
    const dex = pl.dex || (pl.mon && pl.mon.dex), shiny = !!(pl.anim && pl.anim.shiny);
    if (!lente || lente.dex !== dex || lente.shiny !== shiny || lente.r !== r) {
      const m = G.Sprites.animMeta(dex, 'Idle', shiny);
      const k = Math.max(1, Math.round((1.5 * r) / ((m && m.ay) || 24)));
      lente = { dex, shiny, r, anim: new G.Sprites.Animator(dex, k / G.Sprites.PX, shiny) };
      lente.anim.dir = 0; lente.anim.loop('Idle');
    }
    if (!reducido()) lente.anim.update(dt);
    S(ctx);
    ctx.beginPath(); ctx.arc(cx, cy, r - 1, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(2,8,11,0.28)';
    ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.72, r * 0.5, r * 0.16, 0, 0, TAU); ctx.fill();
    lente.anim.draw(ctx, Math.round(cx), Math.round(cy + r * 0.74));
    R(ctx);
    ctx.lineWidth = Math.max(2, r * 0.13); ctx.strokeStyle = C.aroLente;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(207,232,255,0.75)';
    ctx.beginPath(); ctx.ellipse(cx - r * 0.42, cy - r * 0.46, r * 0.18, r * 0.11, -0.6, 0, TAU); ctx.fill();
  }

  /** Ficha: carcasa roja con la lente, y la pantalla con nombre, nivel, PS y EXP. */
  function ficha(ctx, Rc, pl, L, dt, t) {
    const C = COL(), comp = L.variante === 'compacto';
    const k = comp ? L.kc : L.escala, u = v => Math.round(v * k);
    const lado = Rc.lado, E = MA().hud.escritorio.ficha;
    const solape = comp ? u(MA().hud.compacto.ficha.solape) : u(E.pantalla.solape);
    const py = comp ? Rc.y + 1 : Rc.y + u(E.pantalla.y), ph = comp ? lado - 2 : lado - 2 * u(E.pantalla.y);
    const px = Rc.x + lado - solape, pw = Rc.pantalla;
    panel(ctx, px, py, pw, ph, comp ? Math.min(10, Math.round(ph / 3)) : u(E.pantalla.r));
    const rad = comp ? [Math.round(lado * 0.3), 5, 5, Math.round(lado * 0.3)] : E.radios.map(u);
    rr(ctx, Rc.x, Rc.y, lado, lado, rad);
    ctx.fillStyle = C.rojo; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = C.rojoBorde; ctx.stroke();
    if (!comp) { ctx.fillStyle = C.rojoOscuro; ctx.fillRect(Rc.x + u(4), Rc.y + lado - u(6), lado - u(9), u(E.base)); }
    dibujarLente(ctx, pl, Rc.x + lado / 2 - (comp ? 0 : u(1)), Rc.y + lado / 2 - (comp ? 0 : u(1)), comp ? Math.round(lado * 0.34) : u(E.lente.r), dt);
    // Texto
    const tx = Rc.x + lado + (comp ? Math.max(5, u(5)) : u(6)), tr = px + pw - (comp ? u(7) : u(E.texto.der));
    const fN = comp ? (lado >= u(36) ? u(13) : u(12)) : u(E.nombre.tam), fE = comp ? u(11) : u(E.nivelEtiqueta);
    const fV = comp ? (lado >= u(36) ? u(13) : u(12)) : u(16);
    const bN = comp ? py - 1 + Math.round(lado * 0.4) : py + u(E.nombre.base);
    ctx.textBaseline = 'alphabetic';
    letra(ctx, 800, fV); const nv = String(pl.level), wNv = ancho(ctx, nv);
    letra(ctx, 800, fE); const wE = ancho(ctx, 'Nv. ');
    letra(ctx, 800, fN); ctx.textAlign = 'left'; ctx.fillStyle = C.tinta;
    ctx.fillText(recortar(ctx, pl.mon.name, tr - tx - wNv - wE - (comp ? 6 : u(10))), tx, bN);
    letra(ctx, 800, fV); ctx.textAlign = 'right'; ctx.fillText(nv, tr, bN);
    letra(ctx, 800, fE); ctx.fillStyle = C.tinta2; ctx.fillText('Nv. ', tr - wNv, bN);
    // PS
    const f = pl.dead ? 0 : Math.max(0, pl.hp / pl.maxHp);
    const bP = comp ? py - 1 + lado - Math.round(lado * 0.2) : py + u(E.ps.base);
    const hB = comp ? (lado >= u(36) ? 6 : 5) : u(E.ps.barra.h);
    const yB = comp ? bP - hB - 1 : py + u(E.ps.barra.y);
    ctx.textAlign = 'left'; letra(ctx, 800, comp ? u(11) : u(E.ps.tam)); ctx.fillStyle = C.oro;
    ctx.fillText('PS', tx, bP);
    const wPS = ancho(ctx, 'PS');
    letra(ctx, 800, comp ? u(11) : u(E.ps.cifras));
    const cifras = Math.ceil(Math.max(0, pl.hp)) + '/' + Math.round(pl.maxHp), wc = ancho(ctx, cifras);
    const bx = tx + wPS + (comp ? 5 : u(6)), bw = Math.max(8, tr - wc - (comp ? 6 : u(E.ps.hueco)) - bx);
    const destello = f <= 0.2 && f > 0 && !reducido() && Math.floor(t * 1000 / 375) % 2 === 1;
    barra(ctx, bx, yB, bw, hB, f, destello ? C.psBajoDestello : psColor(f));
    ctx.textAlign = 'right'; ctx.fillStyle = pl.dead ? C.peligroTexto : C.tinta; ctx.fillText(cifras, tr, bP);
    // EXP
    const ey = comp ? py + ph - 4 : py + u(E.exp.y), eh = comp ? 2 : u(E.exp.h);
    rr(ctx, tx, ey, tr - tx, eh, eh / 2); ctx.fillStyle = 'rgba(169,195,201,0.16)'; ctx.fill();
    const xf = Math.max(0, Math.min(1, pl.xp / pl.xpNext));
    if (xf > 0) { rr(ctx, tx, ey, (tr - tx) * xf, eh, eh / 2); ctx.fillStyle = C.exp; ctx.fill(); }
  }

  /** Contador: reloj con cifras de ancho fijo y, debajo, derrotados y monedas con su icono. */
  function contador(ctx, Rc, pl, st, L) {
    const C = COL(), comp = L.variante === 'compacto', k = comp ? L.kc : L.escala, u = v => Math.round(v * k), E = MA().hud.escritorio.contador;
    panel(ctx, Rc.x, Rc.y, Rc.w, Rc.h, comp ? Math.min(u(12), Math.round(Rc.h / 3)) : u(14));
    const txt = G.U.mmss(st.time);
    const tamR = comp ? (Rc.mini ? Math.round(Rc.h * 0.5) : Math.round(Rc.h * 0.5)) : u(E.reloj.tam);
    letra(ctx, 800, tamR); ctx.fillStyle = C.tinta; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    // Las cifras de M PLUS Rounded 1c ya son de ancho fijo (630 u en 500 y 650 u en 800): el reloj no baila.
    const base = comp ? (Rc.mini ? Rc.y + Math.round(Rc.h * 0.66) : Rc.y + Math.round(Rc.h * 0.52)) : Rc.y + u(E.reloj.base);
    ctx.fillText(txt, Rc.x + Rc.w / 2, base);
    if (Rc.mini) return;
    const tam = comp ? u(11) : u(E.datos.tam), ic = comp ? u(11) : u(E.datos.icono), gap = comp ? 3 : u(E.datos.hueco), sep = comp ? u(10) : u(E.datos.separador);
    letra(ctx, 800, tam);
    const kt = miles(pl.kills), mt = miles(pl.coins), wk = ancho(ctx, kt), wm = ancho(ctx, mt);
    const seg1 = ic + gap + wk, seg2 = ic + gap + wm;
    let lx = Rc.x + Rc.w / 2 - (seg1 + sep + seg2) / 2;
    const ly = comp ? Rc.y + Rc.h - Math.max(4, Math.round(Rc.h * 0.14)) : Rc.y + u(E.datos.base);
    G.Icons.draw(ctx, 'fist', Math.round(lx), Math.round(ly - ic + 1), ic);
    ctx.textAlign = 'left'; ctx.fillStyle = C.tinta; ctx.fillText(kt, lx + ic + gap, ly);
    lx += seg1 + sep;
    ctx.fillStyle = 'rgba(169,195,201,0.35)'; ctx.fillRect(Math.round(lx - sep / 2), Math.round(ly - tam + 1), 1, tam);
    G.Icons.draw(ctx, 'coin', Math.round(lx), Math.round(ly - ic + 1), ic);
    ctx.fillStyle = C.tinta; ctx.fillText(mt, lx + ic + gap, ly);
  }

  /** Lo que mira Rotom: jefe > grieta > shiny (en coordenadas de pantalla). */
  function objetivo() {
    const cam = G.Camera, toS = (x, y) => [(x - cam.left()) * cam.scale, (y - cam.top()) * cam.scale];
    const j = jefeActual();
    if (j) return toS(j.e.x, j.e.y - (j.e.bodyH || 40) * 0.5);
    if (G.Rift.rift) return toS(G.Rift.rift.x, G.Rift.rift.y - 40);
    for (const e of G.EnemyMgr.shinies()) return toS(e.x, e.y);
    return null;
  }

  /** Módulo Rotom: cara con ojos que miran a la amenaza, y el sensor (bioma, clima y su efecto en los tipos). */
  function rotom(ctx, Rc, L, dt, t) {
    const C = COL(), comp = L.variante === 'compacto', k = comp ? L.kc : L.escala, u = v => Math.round(v * k), E = MA().hud.escritorio.rotom;
    panel(ctx, Rc.x, Rc.y, Rc.w, Rc.h, comp ? Math.min(u(12), Math.round(Rc.h / 3)) : u(E.r));
    const lado = comp ? Rc.h - 8 : u(E.cara.lado), fx = Rc.x + (comp ? 4 : u(E.cara.x)), fy = Rc.y + (comp ? 4 : u(E.cara.y)), q = lado / 44;
    rr(ctx, fx, fy, lado, lado, Math.round(11 * q)); ctx.fillStyle = C.rojo; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = C.rojoBorde; ctx.stroke();
    rr(ctx, fx + 5 * q, fy + 6 * q, lado - 10 * q, lado - 14 * q, 7 * q); ctx.fillStyle = '#0A2A33'; ctx.fill();
    ctx.fillStyle = C.rojo;
    ctx.beginPath(); ctx.moveTo(fx + 8 * q, fy + 1); ctx.lineTo(fx + 3 * q, fy - 4 * q); ctx.lineTo(fx + 13 * q, fy + 1); ctx.fill();
    ctx.beginPath(); ctx.moveTo(fx + lado - 8 * q, fy + 1); ctx.lineTo(fx + lado - 3 * q, fy - 4 * q); ctx.lineTo(fx + lado - 13 * q, fy + 1); ctx.fill();
    // Ojos: dos cápsulas que se desplazan juntas hacia el objetivo (sin él, deriva lenta).
    const ecx = fx + lado / 2, ecy = fy + 6 * q + (lado - 14 * q) / 2, red = reducido();
    const tg = objetivo();
    let dx = red ? 0 : Math.sin(t * 0.7) * 0.35, dy = red ? 0 : Math.sin(t * 0.43) * 0.2;
    if (tg) { const a = Math.atan2(tg[1] - ecy, tg[0] - ecx); dx = Math.cos(a); dy = Math.sin(a); }
    if (red) ojos = [dx, dy];
    else { ojos[0] += (dx - ojos[0]) * Math.min(1, dt * 8); ojos[1] += (dy - ojos[1]) * Math.min(1, dt * 8); }
    if (!red) { parpadeo -= dt; if (parpadeo < -0.12) parpadeo = 3 + Math.random() * 2.5; }
    const cerrado = !red && parpadeo < 0;
    const ox = ojos[0] * 5 * q, oy = ojos[1] * 3.2 * q;
    for (const sgn of [-1, 1]) {
      const ex = ecx + sgn * 7 * q + ox, ey = ecy + oy;
      ctx.fillStyle = C.pantalla;
      if (cerrado) { rr(ctx, ex - 3.5 * q, ey - 1 * q, 7 * q, 2.4 * q, 1.2 * q); ctx.fill(); continue; }
      rr(ctx, ex - 3.4 * q, ey - 7 * q, 6.8 * q, 14 * q, 3.4 * q); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; rr(ctx, ex - 1.8 * q, ey - 5.2 * q, 2.2 * q, 3.6 * q, 1.1 * q); ctx.fill();
    }
    if (Rc.modo === 'cara') return;
    // Sensor
    const wx = G.Weather.current, tx = fx + lado + (comp ? 6 : u(E.texto.x) - u(E.cara.x) - lado), tmax = Rc.x + Rc.w - tx - (comp ? 6 : u(E.texto.der));
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const b1 = comp ? Rc.y + Math.round(Rc.h * 0.42) : Rc.y + u(E.texto.l1.base);
    const b2 = comp ? Rc.y + Rc.h - Math.max(5, Math.round(Rc.h * 0.16)) : Rc.y + u(E.texto.l2.base);
    const t1 = comp ? u(12) : u(E.texto.l1.tam), t2 = comp ? u(11) : u(E.texto.l2.tam), t1b = comp ? u(11) : u(E.texto.l1.tam - 1);
    // En la arena, sin «Grieta · » (la entrada del jefe, o su chip, ya dicen «Grieta 0:45»): el nombre entero.
    const bioma = String(G.World.biomeName()).replace(/^Grieta · /, '');
    if (!wx) {
      ctx.fillStyle = C.tinta;
      const linea = encajar(ctx, 800, [t1, t1b], bioma, tmax);
      if (linea === bioma || bioma.indexOf(' ') < 0) {
        ctx.fillText(linea, tx, b1);
        letra(ctx, 500, t2); ctx.fillStyle = C.tinta2; ctx.fillText(recortar(ctx, 'Despejado', tmax), tx, b2);
        return;
      }
      // Sin sitio (Rotom estrecho en un móvil pequeño): el nombre en dos líneas, sin «Despejado» (en inglés, se parte
      // el nombre ya traducido: cada mitad suelta no tendría traducción).
      const [a, b] = partir(ctx, G.T ? G.T(bioma) : bioma);
      ctx.fillText(recortar(ctx, a, tmax), tx, b1);
      ctx.fillText(recortar(ctx, b, tmax), tx, b2);
      return;
    }
    const ic = comp ? u(12) : u(E.texto.l2.icono);
    let yEf = b2;
    if (comp) {
      G.Icons.draw(ctx, wx.icon, Math.round(tx), Math.round(b1 - ic + 1), ic);
      letra(ctx, 800, t1); ctx.fillStyle = C.tinta;
      ctx.fillText(recortar(ctx, wx.name + ' · ' + Math.ceil(wx.left) + ' s', tmax - ic - 3), tx + ic + 3, b1);
    } else {
      ctx.fillStyle = C.tinta; ctx.fillText(encajar(ctx, 800, [t1, t1b], bioma, tmax), tx, b1);
      G.Icons.draw(ctx, wx.icon, Math.round(tx), Math.round(b2 - ic + 2), ic);
      letra(ctx, 800, t2); ctx.fillStyle = C.tinta; ctx.fillText(recortar(ctx, wx.name + ' · ' + Math.ceil(wx.left) + ' s', tmax - ic - u(4)), tx + ic + u(4), b2);
      yEf = Rc.y + u(E.texto.l3.base);
    }
    // Efecto en los tipos, agrupado por multiplicador (si no caben, sólo los ≠ 1, de más a menos, y «…»).
    const grupos = {};
    for (const [tp, m] of Object.entries(wx.mult || {})) (grupos[m] = grupos[m] || []).push(tp);
    const orden = Object.keys(grupos).sort((a, b) => Math.abs(b - 1) - Math.abs(a - 1));
    letra(ctx, 800, t2);
    let lx = tx;
    const lim = Rc.x + Rc.w - (comp ? 6 : u(E.texto.der));
    for (const m of orden) {
      const lab = '×' + decimal(+m), need = grupos[m].length * (ic + 2) + ancho(ctx, lab);
      if (lx + need > lim) { if (lx + ancho(ctx, '…') <= lim) { ctx.fillStyle = C.tinta2; ctx.fillText('…', lx, yEf); } break; }
      for (const tp of grupos[m]) { G.Icons.draw(ctx, 'type:' + tp, Math.round(lx), Math.round(yEf - ic + 2), ic); lx += ic + 2; }
      ctx.fillStyle = +m >= 1 ? C.tinta : C.tinta2; ctx.fillText(lab, lx, yEf); lx += ancho(ctx, lab) + (comp ? 6 : u(9));
    }
  }

  /** Entrada del jefe: lengüeta roja con N.º, nombre, tipos, porcentaje (o el tiempo de la arena) y barra rival. */
  function jefe(ctx, Rc, j, L, t) {
    const C = COL(), comp = L.variante === 'compacto', k = comp ? L.kc : L.escala, u = v => Math.round(v * k), E = MA().hud.escritorio.jefe;
    const b = j.e, f = Math.max(0, Math.min(1, b.hp / b.maxHp));
    panel(ctx, Rc.x, Rc.y, Rc.w, Rc.h, comp ? Math.min(u(10), Math.round(Rc.h / 3)) : u(E.r));
    const tab = comp ? u(MA().hud.compacto.jefe.lengueta) : u(E.lengueta), rad = comp ? Math.min(u(10), Math.round(Rc.h / 3)) : u(E.r);
    rr(ctx, Rc.x, Rc.y, tab, Rc.h, [rad, 0, 0, rad]); ctx.fillStyle = C.rojo; ctx.fill();
    const num = String(b.dex).padStart(3, '0');
    ctx.textAlign = 'center'; ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'alphabetic';
    if (comp) {
      letra(ctx, 800, u(11)); ctx.fillText(recortar(ctx, num, tab - 4), Rc.x + tab / 2, Rc.y + Rc.h / 2 + u(4));
    } else {
      letra(ctx, 800, u(E.etiqueta.tam)); ctx.fillText('N.º', Rc.x + tab / 2, Rc.y + u(E.etiqueta.base));
      letra(ctx, 800, u(E.numero.tam)); ctx.fillText(num, Rc.x + tab / 2, Rc.y + u(E.numero.base));
    }
    if (j.mas > 0) {
      letra(ctx, 800, u(11)); ctx.textAlign = 'right'; ctx.fillStyle = '#FFFFFF';
      ctx.fillText('+' + j.mas, Rc.x + tab - u(3), comp ? Rc.y + u(11) : Rc.y + Rc.h - u(4));
    }
    // Barra rival (violeta, más gruesa que tus PS) y estela.
    const barH = comp ? (Rc.h >= u(25) ? 8 : 7) : u(E.barra.h);
    const pad = comp ? 3 : 0;
    const nx = Rc.x + tab + (comp ? u(6) : u(E.nombre.x) - u(E.lengueta));
    const derX = Rc.x + Rc.w - (comp ? u(7) : u(E.barra.der));
    const by = comp ? Rc.y + Rc.h - pad - barH : Rc.y + u(E.barra.y);
    let es = estelas.get(b.id);
    if (!es || es.f < f - 0.001) es = { f, estela: f, t };
    if (f < es.f - 0.0005) { es.estela = Math.max(es.estela, es.f); es.t = t; es.f = f; }
    const red = reducido();
    let est = f;
    if (!red && es.estela > f) {
      const pasado = t - es.t;
      if (pasado < 0.4) est = es.estela;
      else if (pasado < 0.9) { const q = (pasado - 0.4) / 0.5, e2 = 1 - Math.pow(1 - q, 3); est = es.estela - (es.estela - f) * e2; }
      else es.estela = f;
    }
    estelas.set(b.id, es);
    if (estelas.size > 8) for (const id of estelas.keys()) { if (id !== b.id) { estelas.delete(id); break; } }
    barra(ctx, nx, by, derX - nx, barH, f, C.rival, { marcas: Math.max(1, Math.round(k)), estela: est });
    // Nombre, tipos y porcentaje (o «Grieta 0:45» en la arena).
    const fN = comp ? (Rc.h >= u(25) ? u(12) : u(11)) : u(E.nombre.tam);
    const bN = comp ? by - 3 : Rc.y + u(E.nombre.base);
    const pct = G.Rift.inArena ? 'Grieta ' + G.U.mmss(G.Rift.timeLeft) : Math.ceil(f * 100) + ' %';
    letra(ctx, 800, u(11)); const wp = ancho(ctx, pct);
    ctx.textAlign = 'right'; ctx.fillStyle = G.Rift.inArena ? C.grietaClaro : C.tinta2; ctx.fillText(pct, derX, bN);
    letra(ctx, 800, fN); ctx.textAlign = 'left'; ctx.fillStyle = C.tinta;
    const libreN = derX - wp - (comp ? 6 : u(8)) - nx;
    const nombre = recortar(ctx, b.name, libreN);
    ctx.fillText(nombre, nx, bN);
    let cx = nx + ancho(ctx, nombre) + (comp ? 4 : u(6));
    if (b.shiny) { const si = comp ? u(11) : u(12); G.Icons.draw(ctx, 'shiny', Math.round(cx), Math.round(bN - si + 1), si); cx += si + 3; }
    // Chips de tipo (si caben)
    const ch = E.chip, chH = comp ? Math.min(u(14), by - Rc.y - 3) : u(ch.h);
    if (chH >= 12) {
      letra(ctx, 800, u(ch.tam));
      for (const tp of (b.types || []).slice(0, 2)) {
        const lab = G.U.TYPE_NAME[tp] || tp, tw = ancho(ctx, lab) + 2 * u(ch.padding);
        if (cx + tw > nx + libreN) break;
        const pd = (MA().tipoPildora[tp] || [G.U.TYPE_COLOR[tp] || '#888888', C.tintaOscura]);
        const cy = comp ? Rc.y + 2 : Rc.y + u(ch.y);
        rr(ctx, cx, cy, tw, chH, u(ch.r)); ctx.fillStyle = pd[0]; ctx.fill();
        ctx.fillStyle = pd[1]; ctx.fillText(lab, cx + u(ch.padding), cy + chH - Math.max(3, Math.round(chH * 0.25)));
        cx += tw + u(ch.entre);
      }
    }
  }

  // Icono de la lengüeta del aviso.
  function iconoAviso(ctx, tipo, icono, cx, cy, s) {
    ctx.fillStyle = '#FFFFFF';
    if (icono === 'lente') {
      ctx.beginPath(); ctx.arc(cx, cy, s * 0.42, 0, TAU); ctx.fillStyle = COL().lente; ctx.fill();
      ctx.lineWidth = Math.max(1.5, s * 0.12); ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
      return;
    }
    if (icono && icono !== 'rayo' && icono !== 'grieta') { G.Icons.draw(ctx, icono, Math.round(cx - s / 2), Math.round(cy - s / 2), Math.round(s)); return; }
    const k = s / 20;
    ctx.beginPath(); ctx.moveTo(cx + 2 * k, cy - 10 * k); ctx.lineTo(cx - 5 * k, cy + 1 * k); ctx.lineTo(cx, cy + 1 * k);
    ctx.lineTo(cx - 2 * k, cy + 10 * k); ctx.lineTo(cx + 5 * k, cy - 2 * k); ctx.lineTo(cx, cy - 2 * k); ctx.closePath(); ctx.fill();
  }

  /** La ranura de avisos (caja de cristal con lengüeta roja; la grieta, en violeta). */
  function aviso(ctx, Rc, a, L, t) {
    const C = COL(), comp = L.variante === 'compacto', k = comp ? L.kc : L.escala, u = v => Math.round(v * k), E = MA().hud.escritorio.aviso;
    const an = Avisos.animacion(t);
    if (an.a <= 0) return;
    S(ctx);
    ctx.globalAlpha = an.a;
    ctx.translate(0, Math.round(an.dy * k));
    const grieta = a.tipo === 'grieta', pista = a.tipo === 'pista';
    const r = comp ? Math.min(u(10), Math.round(Rc.h / 3)) : u(E.r);
    panel(ctx, Rc.x, Rc.y, Rc.w, Rc.h, r, grieta ? C.grietaFondo : null);
    if (grieta) { rr(ctx, Rc.x, Rc.y, Rc.w, Rc.h, r); ctx.lineWidth = 2; ctx.strokeStyle = C.grieta; ctx.stroke(); }
    let x0 = Rc.x;
    if (!pista) {
      const tab = comp ? u(MA().hud.compacto.aviso.lengueta) : u(E.lengueta);
      rr(ctx, Rc.x, Rc.y, tab, Rc.h, [r, 0, 0, r]); ctx.fillStyle = grieta ? C.grietaMedio : C.rojo; ctx.fill();
      iconoAviso(ctx, a.tipo, a.icono, Rc.x + tab / 2, Rc.y + Rc.h / 2, comp ? u(MA().hud.compacto.aviso.icono) : u(E.icono));
      x0 = Rc.x + tab;
    }
    const cxT = x0 + (Rc.x + Rc.w - x0) / 2, maxT = Rc.x + Rc.w - x0 - (comp ? u(10) : u(E.padding));
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    if (grieta && !comp) {
      letra(ctx, 800, u(E.grieta.titulo)); ctx.fillStyle = C.grietaTitulo; ctx.fillText(recortar(ctx, a.texto, maxT), cxT, Rc.y + u(22));
      letra(ctx, 500, u(E.grieta.sub)); ctx.fillStyle = C.grietaTexto; ctx.fillText(recortar(ctx, a.sub, maxT), cxT, Rc.y + u(41));
    } else {
      const tam = comp ? u(12) : pista ? u(13) : u(E.tam);
      letra(ctx, pista ? 500 : 800, tam); ctx.fillStyle = pista ? C.tinta2 : grieta ? C.grietaTitulo : C.tinta;
      // El primer texto que cabe entero (la pista tiene versiones más cortas); si ninguno, el más corto con «…».
      const vs = variantesAviso(a, comp);
      const txt = vs.find(v => ancho(ctx, v) <= maxT) || recortar(ctx, vs[vs.length - 1], maxT);
      ctx.fillText(txt, cxT, Rc.y + Rc.h / 2 + Math.round(tam * 0.36));
    }
    R(ctx);
  }

  /** Chips de estado (mejoras, poder, evento). */
  function chip(ctx, Rc, ch, L) {
    const C = COL(), comp = L.variante === 'compacto', k = comp ? L.kc : L.escala, u = v => Math.round(v * k), E = MA().hud.escritorio.chips;
    panel(ctx, Rc.x, Rc.y, Rc.w, Rc.h, Rc.h / 2);
    const pr = comp ? Math.max(3, u(3)) : u(E.punto), px = Rc.x + (comp ? Math.max(7, Math.round(Rc.h * 0.38)) : Rc.h / 2);
    ctx.fillStyle = ch.color || C.psAlto; ctx.beginPath(); ctx.arc(px, Rc.y + Rc.h / 2, pr, 0, TAU); ctx.fill();
    letra(ctx, 800, comp ? u(11) : u(E.tam)); ctx.textAlign = 'left'; ctx.fillStyle = C.tinta; ctx.textBaseline = 'alphabetic';
    const tx = px + pr + (comp ? 3 : u(5)), max = Rc.x + Rc.w - tx - (comp ? 4 : u(8));
    let txt = ch.texto;
    if (ancho(ctx, txt) > max && ch.corto) txt = ch.corto;
    ctx.fillText(recortar(ctx, txt, max), tx, Rc.y + Rc.h / 2 + Math.round((comp ? u(11) : u(E.tam)) * 0.36));
  }

  /** Insignia de un jugador: círculo de su color con la inicial. */
  function insignia(ctx, x, y, r, m, tam) {
    ctx.fillStyle = m.color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = COL().trazoExterior; ctx.stroke();
    letra(ctx, 800, tam); ctx.textAlign = 'center'; ctx.fillStyle = tintaSobre(m.color);
    ctx.fillText((m.name || '?').charAt(0).toUpperCase(), x, y + Math.round(tam * 0.36));
  }
  const parpadea = t => !reducido() && Math.sin(t * TAU * 4) < 0;   // 4 Hz

  /** Compañeros: en escritorio, filas bajo los chips; en compacto, tarjetas en la columna izquierda. */
  function companeros(ctx, L, mates, t) {
    const C = COL(), P = L.piezas, comp = L.variante === 'compacto', k = comp ? L.kc : L.escala, u = v => Math.round(v * k), E = MA().hud.escritorio.companeros;
    if (!comp && P.grupo) panel(ctx, P.grupo.x, P.grupo.y, P.grupo.w, P.grupo.h, u(10));
    P.companeros.forEach((Rc, i) => {
      const m = mates[i];
      if (!m) return;
      const o = m.pl, f = o.dead ? 0 : Math.max(0, o.hp / o.maxHp);
      if (comp) panel(ctx, Rc.x, Rc.y, Rc.w, Rc.h, Math.round(Rc.h / 2));
      const ir = comp ? Math.round(Rc.h * 0.36) : u(E.insignia), ix = Rc.x + (comp ? Math.round(Rc.h / 2) : u(6) + ir), iy = Rc.y + Rc.h / 2;
      insignia(ctx, ix, iy, ir, m, comp ? u(11) : u(11));
      let bx;
      if (comp) bx = ix + ir + 5;
      else {
        letra(ctx, 800, u(E.nombre.tam)); ctx.textAlign = 'left'; ctx.fillStyle = C.tinta;
        ctx.fillText(recortar(ctx, m.name, u(E.nombre.anchoMax)), Rc.x + u(E.nombre.x), iy + Math.round(u(E.nombre.tam) * 0.36));
        bx = Rc.x + u(E.barra.x);
      }
      const bxr = Rc.x + Rc.w - (comp ? 7 : u(E.barra.der));
      if (o.dead) {
        letra(ctx, 800, u(11)); ctx.textAlign = 'left';
        const col = parpadea(t) ? C.tinta : C.peligroTexto;
        if (ancho(ctx, 'Caído') <= bxr - bx) { ctx.fillStyle = col; ctx.fillText('Caído', bx, iy + Math.round(u(11) * 0.36)); }
        else {
          // Columna estrecha (con muesca): una cruz y la barra vacía, en vez de «Ca…».
          const s = Math.max(6, Math.min(u(9), Rc.h - 10));
          S(ctx);
          ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = col;
          ctx.beginPath(); ctx.moveTo(bx, iy - s / 2); ctx.lineTo(bx + s, iy + s / 2); ctx.moveTo(bx + s, iy - s / 2); ctx.lineTo(bx, iy + s / 2); ctx.stroke();
          R(ctx);
          if (bxr - bx - s - 4 >= 6) barra(ctx, bx + s + 4, Math.round(iy - 2.5), bxr - bx - s - 4, 5, 0, C.psBajo);
        }
      } else barra(ctx, bx, Math.round(iy - u(E.barra.h) / 2), Math.max(6, bxr - bx), comp ? 5 : u(E.barra.h), f, psColor(f));
    });
  }

  /** La píldora con el nombre del ataque activo (con un vínculo, «Ascuas +2»): en compacto, a la izquierda de su
   *  ranura y 1,5 s tras cambiar de ataque; en fila, encima. Dónde va y con qué opacidad, o null si no se ve. */
  function pildora(ctx, L, pl, t) {
    const C = COL(), P = L.piezas, i = pl.active, base = P.ranuras[i], g = pl.slots[i] || [], m = g[0];
    if (!base || !m) return null;
    const comp = L.variante === 'compacto' && L.columna, k = L.variante === 'compacto' ? L.kc : L.escala, u = v => Math.round(v * k);
    const E = MA().hud.escritorio.ranuras, Kc = MA().hud.compacto.ranuras, Sl = P.lado;
    let alfa = 1;
    if (comp) {
      const pasado = t - cambioRanura.t, vis = MA().tiempo.pildoraVisible / 1000;
      alfa = pasado < vis ? 1 : Math.max(0, 1 - (pasado - vis) / 0.2);
      if (G.Game && G.Game.st && G.Game.st.time < 1.5) alfa = 1;
    }
    if (alfa <= 0) return null;
    const fused = g.length > 1, col = G.U.TYPE_COLOR[m.type];
    const lab = fused ? m.name + ' +' + (g.length - 1) : m.name, lc = fused ? C.vinculo : col;
    const pd = fused ? [C.vinculo, C.tintaOscura] : (MA().tipoPildora[m.type] || [lc, tintaSobre(lc)]);
    const tam = comp ? u(Kc.pildora.tam) : u(E.pildora.tam), ph = comp ? u(Kc.pildora.h) : u(E.pildora.h);
    letra(ctx, 800, tam);
    const lw = ancho(ctx, lab) + 2 * (comp ? u(8) : u(E.pildora.padding));
    const x = comp ? base.x - (P.desplazamiento || 0) : base.x, y = !comp ? base.y - (P.elevacion || 0) : base.y;
    const px = comp ? x - u(Kc.pildora.separacion) - lw : Math.round(x + Sl / 2 - lw / 2);
    const py = comp ? Math.round(y + Sl / 2 - ph / 2) : y - u(E.pildora.sobre) - ph;
    return { x: px, y: py, w: lw, h: ph, alfa, lab, pd, tam };
  }

  /** Ranuras de ataque, objeto, vínculo y la píldora del tipo del activo; registra los toques donde se pintan. */
  function ranuras(ctx, L, pl, t, pil) {
    const C = COL(), P = L.piezas, comp = L.variante === 'compacto' && L.columna;
    const k = L.variante === 'compacto' ? L.kc : L.escala, u = v => Math.round(v * k);
    const E = MA().hud.escritorio.ranuras, Kc = MA().hud.compacto.ranuras;
    const Sl = P.lado, enControles = L.ranurasModo === 'controles';
    const cdOf = m => m.kind === 'orbit' ? 0 : G.U.clamp(m.t / (m.cd * pl.cdMul), 0, 1);
    const rad = Math.round(Sl * (comp ? 0.21 : 0.23));
    const n = P.ranuras.length, gs = n > 1 ? P.ranuras[1].y - P.ranuras[0].y - Sl : 0;
    P.ranuras.forEach((base, i) => {
      const g = pl.slots[i] || [], m = g[0], fused = g.length > 1, on = i === pl.active;
      const x = comp && on ? base.x - (P.desplazamiento || 0) : base.x;
      const y = !comp && on ? base.y - (P.elevacion || 0) : base.y;
      if (m) G.Touch.addButton(x, y, Sl, Sl, () => { if (G.Game.state === 'playing' && pl.active !== i) { pl.setActive(i); G.Audio.sfx('click'); } }, comp ? Math.max(2, Math.round((gs || 6) / 2)) : Math.round(u(E.separacion) / 2));
      const col = m ? G.U.TYPE_COLOR[m.type] : C.bisel;
      panel(ctx, x, y, Sl, Sl, rad, on ? 'rgba(23,54,64,0.96)' : null);
      if (on || fused || (m && m.evolved)) {
        rr(ctx, x, y, Sl, Sl, rad); ctx.lineWidth = comp ? 2.5 : u(E.borde);
        ctx.strokeStyle = fused ? C.vinculo : m && m.evolved ? C.oro : col; ctx.stroke();
      }
      if (!m) return;
      if (fused) {
        const Cc = Math.round(Sl * (comp ? Kc.iconoFusion / Kc.lado : E.iconoFusion / E.lado)), Pd = (Sl - Cc * 2) / 3;
        g.forEach((gm, j) => {
          const cx = Math.round(x + Pd + (j % 2) * (Cc + Pd)), cy = Math.round(y + Pd + Math.floor(j / 2) * (Cc + Pd));
          G.Icons.draw(ctx, 'move:' + gm.id, cx, cy, Cc);
          const f = cdOf(gm);
          if (f > 0) { ctx.fillStyle = 'rgba(4,12,16,0.6)'; ctx.fillRect(cx, cy, Cc, Cc * f); }
          const fl = 1 - (performance.now() - (gm.castAt || 0)) / 180;
          if (fl > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (fl * 0.55).toFixed(2) + ')'; ctx.fillRect(cx, cy, Cc, Cc); }
        });
      } else {
        const ic = Math.round(Sl * (comp ? Kc.icono / Kc.lado : E.icono / E.lado));
        G.Icons.draw(ctx, 'move:' + m.id, Math.round(x + (Sl - ic) / 2), Math.round(y + (Sl - ic) / 2 - Sl * 0.06), ic);
        const cdF = cdOf(m);
        if (cdF > 0) { S(ctx); rr(ctx, x, y, Sl, Sl, rad); ctx.clip(); ctx.fillStyle = 'rgba(4,12,16,0.62)'; ctx.fillRect(x, y, Sl, Sl * cdF); R(ctx); }
        const segs = m.def.maxLvl || 1, lados = Math.round(Sl * 0.14), sg = 2, sw = Sl - 2 * lados, swd = (sw - (segs - 1) * sg) / segs;
        const sh = comp ? 3 : u(E.nivel.h), sy = y + Sl - (comp ? 7 : u(E.nivel.abajo)) - sh / 2;
        // Segmentos rectos (con 3-4 px de alto, el radio de 1,5 no se aprecia y cada camino cuesta).
        ctx.fillStyle = col;
        for (let d = 0; d < Math.min(segs, m.lvl); d++) ctx.fillRect(Math.round(x + lados + d * (swd + sg)), Math.round(sy), Math.round(swd), sh);
        ctx.fillStyle = 'rgba(169,195,201,0.18)';
        for (let d = m.lvl; d < segs; d++) ctx.fillRect(Math.round(x + lados + d * (swd + sg)), Math.round(sy), Math.round(swd), sh);
      }
      letra(ctx, 800, u(11)); ctx.textAlign = 'left'; ctx.fillStyle = C.tinta2;
      ctx.fillText(String(i + 1), x + Math.round(Sl * 0.1), y + Math.round(Sl * 0.23));
    });
    // Píldora con el nombre del ataque activo (dónde va, de pildora(): las flechas la esquivan).
    if (pil) {
      S(ctx); ctx.globalAlpha *= pil.alfa;
      rr(ctx, pil.x, pil.y, pil.w, pil.h, pil.h / 2); ctx.fillStyle = pil.pd[0]; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(2,8,11,0.6)'; ctx.stroke();
      letra(ctx, 800, pil.tam); ctx.textAlign = 'center'; ctx.fillStyle = pil.pd[1];
      ctx.fillText(pil.lab, pil.x + pil.w / 2, pil.y + pil.h / 2 + Math.round(pil.tam * 0.36));
      R(ctx);
    }
    // Objeto equipado
    if (P.objeto && (!P.objeto.vacio || !comp)) {
      const O = P.objeto, ro = Math.round(O.w * 0.23);
      panel(ctx, O.x, O.y, O.w, O.h, ro, pl.item ? 'rgba(40,32,12,0.94)' : 'rgba(15,38,48,0.7)');
      if (pl.item) {
        rr(ctx, O.x, O.y, O.w, O.h, ro); ctx.lineWidth = comp ? 2 : u(2); ctx.strokeStyle = C.oro; ctx.stroke();
        const ic = Math.round(O.w * 0.64);
        G.Icons.draw(ctx, pl.item, Math.round(O.x + (O.w - ic) / 2), Math.round(O.y + (O.h - ic) / 2), ic);
        if (!comp && !enControles && G.Items.BY[pl.item]) {
          letra(ctx, 800, u(11)); ctx.textAlign = 'center';
          contorno(ctx, G.Items.BY[pl.item].name, O.x + O.w / 2, O.y - u(7), C.oro, 3);
        }
      }
    }
    // Vínculo guardado
    if (P.vinculo && pl.bonds > 0) {
      const V = P.vinculo, ic = Math.min(V.h, Math.round(V.w));
      const vx = V.fila ? Math.round(V.x + V.w / 2 - (pl.bonds > 1 ? ic * 0.8 : ic / 2)) : V.x;
      G.Icons.draw(ctx, 'bond', vx, V.y, ic);
      if (pl.bonds > 1) { letra(ctx, 800, u(11)); ctx.textAlign = 'left'; contorno(ctx, '×' + pl.bonds, vx + ic + 1, V.y + ic - 2, C.vinculo, 3); }
    }
  }

  /** Botón de pausa táctil (≥ 44 px, con 8 px más de toque). */
  function pausa(ctx, Rc) {
    const C = COL();
    panel(ctx, Rc.x, Rc.y, Rc.w, Rc.h, 10);
    const bw = Math.round(Rc.w * 0.11), bh = Math.round(Rc.h * 0.45), y = Math.round(Rc.y + (Rc.h - bh) / 2);
    ctx.fillStyle = C.tinta;
    ctx.fillRect(Math.round(Rc.x + Rc.w * 0.5 - bw - Rc.w * 0.05), y, bw, bh);
    ctx.fillRect(Math.round(Rc.x + Rc.w * 0.5 + Rc.w * 0.05), y, bw, bh);
    G.Touch.addButton(Rc.x, Rc.y, Rc.w, Rc.h, () => G.Game.togglePause(), 8);
  }

  // ===================================================================
  // 7. Flechas de borde
  // ===================================================================
  const PRIO_FLECHA = { jefe: 6, caido: 5, grieta: 4, companero: 3, evento: 2, shiny: 1 };
  /**
   * Las flechas de este fotograma: dónde apuntan y dónde se colocan (dentro de la zona libre). Pura salvo G.
   * op: { evitar: [rectángulos que su cuerpo y su etiqueta no pueden pisar (la píldora del ataque, que en compacto
   *       cae dentro de la zona libre)], medir(texto, peso, px) -> ancho de la etiqueta }
   */
  function flechas(L, pl, mates, op = {}) {
    const cam = G.Camera, P = L.piezas, comp = L.variante === 'compacto', k = comp ? L.kc : L.escala, u = v => Math.round(v * k);
    const M = Math.round((comp ? MA().hud.compacto.flechas.margen : MA().hud.escritorio.flechas.margen) * k);
    const tamE = comp ? u(MA().hud.compacto.flechas.etiqueta) : u(MA().hud.escritorio.flechas.etiqueta);
    const medir = op.medir || ((t, peso, px) => String(t).length * px * 0.62);
    const evitar = (op.evitar || []).filter(Boolean);
    const Z = L.libre, W = L.juego;
    const toS = (x, y) => [(x - cam.left()) * cam.scale, (y - cam.top()) * cam.scale];
    const paneles = [];
    for (const key in P) {
      const v = P[key];
      if (Array.isArray(v)) v.forEach(r => r && r.w && paneles.push(r));
      else if (v && typeof v === 'object' && v.w && v.h) paneles.push(v);
    }
    const tapado = (sx, sy) => paneles.some(r => sx >= r.x - 4 && sx <= r.x + r.w + 4 && sy >= r.y - 4 && sy <= r.y + r.h + 4);
    const fuera = (sx, sy) => sx < W.x || sx > W.x + W.w || sy < W.y || sy > W.y + W.h;
    const out = [];
    const add = (tipo, wx, wy, extra) => {
      const [sx, sy] = toS(wx, wy);
      if (!fuera(sx, sy) && !tapado(sx, sy)) return;
      out.push(Object.assign({ tipo, sx, sy, prio: PRIO_FLECHA[tipo] }, extra));
    };
    const j = jefeActual();
    if (j) add('jefe', j.e.x, j.e.y - (j.e.bodyH || 40) * 0.5, { e: j.e, metros: Math.round(G.U.dist(pl.x, pl.y, j.e.x, j.e.y) / 32) });
    const rf = G.Rift.rift;
    if (rf) {
      const [sx, sy] = toS(rf.x, rf.y - 40);
      const vis = !fuera(sx, sy) && !tapado(sx, sy);
      if (vis) out.push({ tipo: 'grietaVisible', sx, sy, prio: PRIO_FLECHA.grieta, rf });
      else out.push({ tipo: 'grieta', sx, sy, prio: PRIO_FLECHA.grieta, rf, metros: Math.round(G.U.dist(pl.x, pl.y, rf.x, rf.y) / 32) });
    }
    mates.forEach(m => { const o = m.pl; add(o.dead ? 'caido' : 'companero', o.x, o.y - (o.bodyH || 30) * 0.5, { m, metros: Math.round(G.U.dist(pl.x, pl.y, o.x, o.y) / 32) }); });
    const ev = estadoEvento();
    if (ev && ev.perdido) {
      const p = ev.perdido, esp = p.espera, x = esp ? p.x : p.tx, y = esp ? p.y - 10 : p.ty;
      add('evento', x, y, { color: COL().perdido, texto: (esp ? p.nombre : 'Marca') + ' · ' + Math.round(G.U.dist(pl.x, pl.y, x, y) / 32) + ' m' });
    }
    for (const e of G.EnemyMgr.all()) if (e.behavior === 'thief' && !e.dead) add('evento', e.x, e.y - 10, { color: COL().oro, texto: e.name });
    for (const e of G.EnemyMgr.shinies()) add('shiny', e.x, e.y);
    // Cuerpo (radio con la punta) y etiqueta de cada una: lo que dibuja dibujarFlechas().
    for (const f of out) {
      if (f.tipo === 'jefe') {
        f.r = comp ? u(MA().hud.compacto.flechas.lente) : u(MA().hud.escritorio.flechas.lente);
        f.alcance = f.r + u(12); f.dist = f.r + u(8); f.lab = f.e.name + ' · ' + f.metros + ' m';
      } else if (f.tipo === 'grieta') {
        const q = k * (comp ? 0.8 : 1);
        f.alcance = 40 * q * 1.12; f.dist = 34 * q; f.lab = 'Grieta · ' + f.metros + ' m · ' + Math.ceil(f.rf.ttl) + ' s';
      } else if (f.tipo === 'companero' || f.tipo === 'caido') {
        f.r = comp ? u(14) : u(17);
        f.alcance = f.r + u(11); f.dist = f.r + u(8);
        f.lab = (f.tipo === 'caido' ? '¡' + f.m.name + ' necesita ayuda! ' : f.m.name + ' ') + '· ' + f.metros + ' m';
      } else if (f.tipo === 'evento') { f.alcance = 30 * k * 0.9; f.dist = u(24); f.lab = f.texto; }
      else if (f.tipo === 'shiny') f.alcance = 24 * k;
      f.tam = tamE;
      f.anchoLab = f.lab ? medir(f.lab, 800, tamE) : 0;
    }
    // Las etiquetas, dentro de la zona libre (si no, se recortaban en el borde de la pantalla o quedaban debajo de un
    // panel: la del caído en una esquina); si la zona libre no da para una, dentro del rectángulo de juego.
    const Lz = Z.w >= 40 && Z.h >= 30 ? Z : W;
    const LX0 = Lz.x + 2, LX1 = Lz.x + Lz.w - 2, LY0 = Lz.y + 2, LY1 = Lz.y + Lz.h - 2;
    /**
     * Lo que ocupa una flecha puesta en (ex, ey): su cuerpo y su etiqueta. La etiqueta va al lado contrario de la punta
     * y, si se saldría de la zona libre (una flecha en una esquina), se corre hacia dentro. dibujarFlechas() la pinta
     * donde dice aquí: lx (izquierda del texto) y lb (línea base).
     */
    const huella = (f, ex, ey) => {
      const R = f.alcance || 0, cajas = [{ x: ex - R, y: ey - R, w: 2 * R, h: 2 * R }];
      let lx = null, lb = null;
      if (f.lab) {
        const a = Math.atan2(f.sy - ey, f.sx - ex), ca = Math.cos(a), sa = Math.sin(a), w = f.anchoLab;
        const ax = ex - ca * f.dist, asc = Math.round(f.tam * 0.8) + 2, desc = Math.round(f.tam * 0.2) + 2;
        lx = Math.round(Math.max(LX0 + 2, Math.min(LX1 - 2 - w, ca > 0.3 ? ax - w : ca < -0.3 ? ax : ax - w / 2)));
        lb = Math.round(Math.max(LY0 + asc, Math.min(LY1 - desc, ey - sa * f.dist + Math.round(f.tam * 0.36))));
        cajas.push({ x: lx - 2, y: lb - asc, w: w + 4, h: asc + desc, etiqueta: true });
      }
      return { cajas, lx, lb };
    };
    const cruza = (c, o) => c.x < o.x + o.w + 3 && o.x - 3 < c.x + c.w && c.y < o.y + o.h + 3 && o.y - 3 < c.y + c.h;
    const puestas = [];
    /** Lo malo de un sitio: pisar otra flecha o su etiqueta (se leían una encima de otra), pisar la píldora del ataque y,
     *  menos, una etiqueta bajo un panel del HUD. 0 = libre. */
    const coste = H => {
      let c = 0;
      for (const b of H.cajas) {
        if (puestas.some(p => p.some(o => cruza(b, o)))) c += 4;
        if (evitar.some(o => cruza(b, o))) c += 3;
        if (b.etiqueta && paneles.some(o => cruza(b, o))) c += 1;
      }
      return c;
    };
    // El rótulo «Grieta · 30 s» de la grieta a la vista también cuenta (las demás etiquetas no lo pisan).
    for (const f of out) {
      if (f.tipo !== 'grietaVisible') continue;
      // Como lo pinta dibujarFlechas(): la flecha que bota entre 46 y 56 px por encima y el rótulo 18 px más arriba.
      const tw = medir('Grieta · ' + Math.ceil(f.rf.ttl) + ' s', 800, tamE) + 8;
      puestas.push([{ x: f.sx - tw / 2, y: f.sy - 74 - tamE, w: tw, h: tamE + 12 }, { x: f.sx - 17, y: f.sy - 70, w: 34, h: 34 }]);
    }
    // Colocación: en el borde de la zona libre menos el margen, donde toca por la dirección del objetivo; si ahí pisa
    // algo (otra flecha o su etiqueta, la píldora), se recorre ese borde, y si hace falta los de al lado, a pasos y a
    // los dos lados a la vez, hasta el primer sitio libre: las flechas del mismo cuadrante (cooperativo con 3-4
    // jugadores, jefe y compañero) se separan o se apilan con sus etiquetas, por prioridad (jefe > caído > grieta >
    // compañero > evento > shiny). Sin sitio libre, el menos malo de los probados (el más cercano, a igual coste).
    let x0 = Z.x + M, x1 = Z.x + Z.w - M, y0 = Z.y + M, y1 = Z.y + Z.h - M;
    if (x1 < x0) x0 = x1 = Z.x + Z.w / 2;
    if (y1 < y0) y0 = y1 = Z.y + Z.h / 2;
    const Wr = x1 - x0, Hr = y1 - y0, per = 2 * (Wr + Hr);
    /** Punto del borde a una distancia s (en el sentido de las agujas del reloj desde la esquina de arriba a la izquierda). */
    const enBorde = s => {
      s = ((s % per) + per) % per;
      if (s <= Wr) return [x0 + s, y0];
      if ((s -= Wr) <= Hr) return [x1, y0 + s];
      if ((s -= Hr) <= Wr) return [x1 - s, y1];
      return [x0, y1 - (s - Wr)];
    };
    /** Distancia por el borde del punto del borde más cercano a (x, y). */
    const sobreBorde = (x, y) => {
      const d = [y - y0, x1 - x, y1 - y, x - x0], m = Math.min(...d);
      return m === d[0] ? x - x0 : m === d[1] ? Wr + (y - y0) : m === d[2] ? Wr + Hr + (x1 - x) : 2 * Wr + Hr + (y1 - y);
    };
    const paso = Math.max(6, Math.round(8 * k));
    out.sort((a, b) => b.prio - a.prio);
    for (const f of out) {
      if (f.tipo === 'grietaVisible') continue;
      let mejor = null;
      const prueba = (ex, ey) => {
        ex = Math.round(ex); ey = Math.round(ey);
        const H = huella(f, ex, ey), c = coste(H);
        if (!mejor || c < mejor.c) mejor = { ex, ey, H, c };
        return c === 0;
      };
      const bx = Math.max(x0, Math.min(x1, f.sx)), by = Math.max(y0, Math.min(y1, f.sy));
      if (!prueba(bx, by) && per > 0) {
        const s0 = sobreBorde(bx, by);
        busca: for (let d = paso; d <= per / 2; d += paso) {
          for (const sg of [1, -1]) { const [ex, ey] = enBorde(s0 + sg * d); if (prueba(ex, ey)) break busca; }
        }
      }
      f.ex = mejor.ex; f.ey = mejor.ey; f.a = Math.atan2(f.sy - f.ey, f.sx - f.ex);
      f.cajas = mejor.H.cajas; f.lx = mejor.H.lx; f.lb = mejor.H.lb;
      puestas.push(f.cajas);
    }
    return { lista: out, margen: M };
  }

  function lenteJefe(ctx, e, r, dt) {
    let an = lentesJefe.get(e.dex);
    if (!an || an.r !== r) {
      const m = G.Sprites.animMeta(e.dex, 'Idle');
      const k = Math.max(1, Math.round((1.4 * r) / ((m && m.ay) || 24)));
      an = { r, anim: new G.Sprites.Animator(e.dex, k / G.Sprites.PX, !!e.shiny) };
      an.anim.dir = 0; an.anim.loop('Idle');
      lentesJefe.set(e.dex, an);
      if (lentesJefe.size > 6) lentesJefe.delete(lentesJefe.keys().next().value);
    }
    if (!reducido()) an.anim.update(dt);
    S(ctx);
    ctx.beginPath(); ctx.arc(0, 0, r - 1, 0, TAU); ctx.clip();
    an.anim.draw(ctx, 0, Math.round(r * 0.7));
    R(ctx);
  }

  function dibujarFlechas(ctx, L, fl, dt, t) {
    const C = COL(), comp = L.variante === 'compacto', k = comp ? L.kc : L.escala, u = v => Math.round(v * k), red = reducido();
    const tamE = comp ? u(MA().hud.compacto.flechas.etiqueta) : u(MA().hud.escritorio.flechas.etiqueta);
    const latido = red ? 0.5 : 0.5 + Math.sin(t * 7) * 0.5, pulso = red ? 1 : 0.65 + Math.sin(t * 1000 / 160) * 0.35;
    // La etiqueta, donde la colocó flechas() (lx, lb: dentro de la zona libre y sin pisar otra flecha).
    const etiqueta = (f, col, lw = 3) => {
      if (f.lx === null || f.lx === undefined) return;
      letra(ctx, 800, tamE); ctx.textAlign = 'left';
      contorno(ctx, f.lab, f.lx - Math.round(f.ex), f.lb - Math.round(f.ey), col, lw);
    };
    const punta = (a, rIn, rOut, ab, col, borde) => {
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rOut, Math.sin(a) * rOut);
      ctx.lineTo(Math.cos(a + ab) * rIn, Math.sin(a + ab) * rIn);
      ctx.lineTo(Math.cos(a - ab) * rIn, Math.sin(a - ab) * rIn);
      ctx.closePath();
      if (borde) { ctx.lineWidth = 3; ctx.strokeStyle = borde; ctx.stroke(); }
      ctx.fillStyle = col; ctx.fill();
    };
    for (const f of fl.lista) {
      if (f.tipo === 'grietaVisible') {
        // Encima de la grieta: flecha hacia abajo que bota.
        const by = f.sy - 46 - (red ? 5 : Math.abs(Math.sin(t * 4)) * 10);
        S(ctx); ctx.translate(f.sx, by);
        ctx.beginPath(); ctx.moveTo(-15, -12); ctx.lineTo(15, -12); ctx.lineTo(0, 8); ctx.closePath();
        ctx.lineWidth = 4; ctx.strokeStyle = C.grietaOscuro; ctx.stroke(); ctx.fillStyle = latido > 0.5 ? C.grietaClaro : C.grietaMedio; ctx.fill();
        letra(ctx, 800, tamE); ctx.textAlign = 'center';
        contorno(ctx, 'Grieta · ' + Math.ceil(f.rf.ttl) + ' s', 0, -18, C.grietaClaro, 4);
        R(ctx);
        continue;
      }
      if (f.ex === undefined) continue;
      S(ctx); ctx.translate(Math.round(f.ex), Math.round(f.ey));
      const a = f.a;
      if (f.tipo === 'jefe') {
        const r = f.r;
        punta(a, r * 0.85, r + u(12), 0.62, C.rival, C.grietaOscuro);
        const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
        g.addColorStop(0, C.lenteClara); g.addColorStop(0.55, C.lente); g.addColorStop(1, C.lenteOscura);
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
        lenteJefe(ctx, f.e, r, dt);
        ctx.lineWidth = u(3); ctx.strokeStyle = C.rival; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
        etiqueta(f, C.tinta);
      } else if (f.tipo === 'grieta') {
        const q = k * (comp ? 0.8 : 1);
        ctx.globalAlpha = red ? 0.3 : 0.18 + latido * 0.22; ctx.fillStyle = C.grieta;
        ctx.beginPath(); ctx.arc(0, 0, (30 + latido * 8) * q, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
        punta(a, 20 * q * 1.12, 40 * q * 1.12, 2.45, C.grietaOscuro);
        punta(a, 20 * q, 40 * q, 2.45, latido > 0.5 ? C.grietaClaro : C.grietaMedio);
        etiqueta(f, C.grietaClaro, 4);
      } else if (f.tipo === 'companero' || f.tipo === 'caido') {
        const caido = f.tipo === 'caido', r = f.r;
        const col = caido ? (parpadea(t) ? C.tinta : C.peligroTexto) : f.m.color;
        punta(a, r * 0.8, r + u(11), 0.75, col, C.contorno);
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = C.cristalHUD; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = C.trazoInterior; ctx.stroke();
        letra(ctx, 800, comp ? u(12) : u(13)); ctx.textAlign = 'center'; ctx.fillStyle = caido ? C.peligroTexto : f.m.color;
        ctx.fillText((f.m.name || '?').charAt(0).toUpperCase(), 0, Math.round((comp ? u(12) : u(13)) * 0.36));
        etiqueta(f, caido ? C.peligroTexto : C.tinta);
      } else if (f.tipo === 'evento') {
        ctx.globalAlpha = red ? 1 : pulso;
        punta(a, 15 * k * 0.9, 30 * k * 0.9, 2.45, f.color, C.contorno);
        ctx.globalAlpha = 1;
        etiqueta(f, f.color);
      } else if (f.tipo === 'shiny') {
        ctx.globalAlpha = red ? 1 : pulso;
        punta(a, 12 * k, 24 * k, 2.5, C.pantalla);
        ctx.globalAlpha = 1;
        const s = Math.round(20 * k);
        G.Icons.draw(ctx, 'shiny', -Math.round(s / 2), -Math.round(s / 2), s);
      }
      R(ctx);
    }
  }

  /** Tú, caído (cooperativo): aviso y barra de «te están levantando». */
  function caido(ctx, L, pl) {
    const C = COL(), comp = L.variante === 'compacto', k = comp ? L.kc : L.escala, u = v => Math.round(v * k);
    const E = comp ? MA().hud.compacto.caido : MA().hud.escritorio.caido;
    const msg = G.Coop.players().every(p => p.dead) ? 'Habéis caído todos…' : 'Has caído: un compañero puede levantarte';
    const tam = u(E.tam);
    letra(ctx, 800, tam);
    const Z = L.libre, bw = Math.min(Z.w - 16, Math.ceil(ancho(ctx, msg)) + u(32)), bh = u(E.h);
    const x = Math.round(Z.x + Z.w / 2 - bw / 2), y = Math.round(Math.max(Z.y + 8, Math.min(Z.y + Z.h - bh - 8, L.juego.y + L.juego.h * 0.62 - bh / 2)));
    panel(ctx, x, y, bw, bh, u(12));
    rr(ctx, x, y, bw, bh, u(12)); ctx.lineWidth = 2; ctx.strokeStyle = C.psBajo; ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = C.peligroTexto;
    ctx.fillText(recortar(ctx, msg, bw - u(16)), x + bw / 2, y + Math.round(bh * 0.46));
    const f = Math.max(0, Math.min(1, (pl.reviveT || 0) / G.Player.REVIVE_TIME));
    const rw = Math.min(bw - u(24), u(E.barra.w)), rh = u(E.barra.h);
    barra(ctx, Math.round(x + bw / 2 - rw / 2), y + bh - rh - u(6), rw, rh, f, C.psAlto);
  }

  // ===================================================================
  // 8. El HUD entero
  // ===================================================================
  let ultimo = null;
  /** Pinta el HUD Dex. Lo llama G.Estilo.hud() (con su try/catch: si algo falla, pinta upstream). */
  function draw(ctx, w, h, pl, st) {
    const ahora = performance.now(), t = ahora / 1000, dt = tPrev ? Math.min(0.05, Math.max(0, (ahora - tPrev) / 1000)) : 0;
    tPrev = ahora;
    const pila0 = pila;
    S(ctx);
    fuenteActual = null;
    RED = calcularReducido();
    jefeFotograma = undefined;
    jefeFotograma = jefeActual();
    try {
      ctx.textBaseline = 'alphabetic';
      G.Touch.clearButtons();
      const tactil = !!G.Touch.active;
      const av = Avisos.actualizar(t, st, tactil);
      const c = contenido(pl, st, av);
      const medir = (txt, peso, px) => { letra(ctx, peso, px); return ancho(ctx, txt); };
      const L = maquetar(w, h, c, { medir });
      ultimo = L;
      const P = L.piezas;
      if (pl.active !== cambioRanura.i) cambioRanura = { i: pl.active, t };
      const pil = pildora(ctx, L, pl, t);
      const fl = flechas(L, pl, c.mates, { evitar: [pil], medir });
      ultimo.flechas = fl.lista.filter(f => f.ex !== undefined).map(f => ({ tipo: f.tipo, x: f.ex, y: f.ey, cajas: f.cajas }));
      ultimo.pildora = pil ? { x: pil.x, y: pil.y, w: pil.w, h: pil.h } : null;
      dibujarFlechas(ctx, L, fl, dt, t);
      ficha(ctx, P.ficha, pl, L, dt, t);
      P.chips.forEach((Rc, i) => chip(ctx, Rc, c.chips[i], L));
      if (c.mates.length) companeros(ctx, L, c.mates, t);
      contador(ctx, P.contador, pl, st, L);
      rotom(ctx, P.rotom, L, dt, t);
      if (P.jefe && c.jefe) jefe(ctx, P.jefe, c.jefe, L, t);
      if (P.aviso && av) aviso(ctx, P.aviso, av, L, t);
      ranuras(ctx, L, pl, t, pil);
      if (P.pausa) pausa(ctx, P.pausa);
      if (G.Coop.active && pl.dead) caido(ctx, L, pl);
    } finally {
      while (pila > pila0 + 1) R(ctx);
      R(ctx);
      RED = null;
      jefeFotograma = undefined;
    }
  }

  /** Lo que reserva el HUD en el último fotograma (o, si aún no se ha pintado, el de esta pantalla). */
  function bandas() {
    let L = ultimo;
    if (!L) {
      const w = typeof innerWidth === 'number' ? innerWidth : 1440, h = typeof innerHeight === 'number' ? innerHeight : 900;
      L = maquetar(w, h, { tactil: !!(G.Touch && G.Touch.active), chips: [], companeros: 0, ranuras: 4 });
    }
    return { sup: L.bandas.sup, inf: L.bandas.inf, izq: L.bandas.izq, der: L.bandas.der, zona: Object.assign({}, L.libre),
      juego: Object.assign({}, L.juego), controles: L.controles ? Object.assign({}, L.controles) : null, variante: L.variante,
      escala: L.variante === 'compacto' ? L.kc : L.escala, columna: L.columna, piezas: L.piezas, flechas: L.flechas || [],
      pildora: L.pildora || null, pliegue: L.pliegue ? Object.assign({}, L.pliegue) : null };
  }
  /** Hasta dónde llega por arriba el HUD (px desde el borde de la pantalla) en el último fotograma; sin pintar aún, el
   *  de esta pantalla. Sin crear objetos: se mira en cada fotograma (G.Estilo.colocarLogro). */
  function bandaSup() { return ultimo ? ultimo.juego.y + ultimo.bandas.sup : bandas().sup; }
  /** ¿Van las ranuras en columna a la derecha en esta pantalla? (Ajustes > Controles: «de la derecha»). */
  function columna() {
    const w = typeof innerWidth === 'number' ? innerWidth : 1440, h = typeof innerHeight === 'number' ? innerHeight : 900;
    const mc = marco(w, h);
    return G.Estilo.disposicion(w, h, { juego: mc.juego, controles: mc.controles }).ranuras === 'columna';
  }

  return { draw, maquetar, bandas, bandaSup, columna, marco, ponerMarco, flechas, contenido, Avisos, CUBRE,
    util: { contraste, hexRgb, tintaSobre, psColor, miles, decimal } };
})();
