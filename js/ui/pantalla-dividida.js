/* ============ pantalla-dividida.js — pantalla dividida estilo Nintendo DS (MOD nico) ============
 * Lote 5, petición de Nico (13-10-2026): «una opción para que los controles estén en una mitad de la pantalla,
 * mientras el juego está en la otra, estilo una DS. Siempre como opción, no obligatoria». Juega con un Honor Magic V6
 * plegable (interior de unos 724x784 px CSS; a medio plegar en modo mesa, dos mitades de 784x362).
 *
 * Ajustes > Controles > «Pantalla dividida» (G.Settings 'dividida' y 'divididaLado'; por defecto, la de
 * G.MODS.divididaPorDefecto, 'no'):
 *   'no'     desactivada: todo como siempre;
 *   'abajo'  juego arriba y mandos abajo;
 *   'lado'   juego a un lado y mandos al otro (a la derecha o a la izquierda);
 *   'auto'   sólo con el móvil plegado a medias en modo mesa (bisagra horizontal), si el navegador lo dice (Device
 *            Posture API: 'folded', y Viewport Segments: dos segmentos uno encima del otro). En modo libro (bisagra
 *            vertical) no divide: cada mitad sería una franja de 362x784 (criterio de la investigación de plegables);
 *            ahí vale «a un lado».
 * Con la bisagra conocida (Viewport Segments), la división cae justo en ella (con su máscara, si la tiene, fuera de las
 * dos mitades); sin ella, en la mitad exacta. Nada importante a menos de G.MODS.divididaMargenBisagra px de esa línea, y
 * si la bisagra cruza la mitad de los mandos (dividir de arriba abajo con el móvil en vertical), el panel la esquiva.
 *
 * Cómo: el lienzo del juego (#game) pasa a medir el rectángulo de juego (G.Encuadre.resolucion() lo coloca al
 * redimensionar, con o sin píxel nítido), así que el mundo, el clima, la viñeta, el fogonazo, el iris y el HUD se dibujan
 * ahí sin tocar nada más; y un segundo lienzo (#mandos) ocupa el rectángulo de los mandos con el panel. El HUD es el Dex
 * (también con Clásico: G.Estilo.hudDex()) con el marco de G.HudDex.ponerMarco(): sin ranuras, objeto, pausa ni ficha (no
 * se repiten en el panel) y lejos de la línea de la división.
 * Panel (estilo Dex): joystick grande (fijo si pones el dedo en su círculo; si lo pones en otra parte de su zona, aparece
 * ahí), los 4 ataques (con sus fusiones), el vínculo guardado, el objeto, la pausa, y tus PS, nivel y experiencia. Se
 * juega con el dedo y con el ratón, y el teclado sigue igual (G.Touch.vector() cede el paso a vector() de aquí).
 * Sólo en partida: en los menús, la pantalla entera. Cambiarlo en plena partida (desde la pausa) recoloca todo sin
 * reiniciar. Local de cada jugador: en grupo no viaja nada por la red.
 *
 * Ganchos «// MOD nico»: game.js resize() (vía G.Encuadre.resolucion) y render() (pintar), touch.js vector(),
 * settings-ui.js render() (ajustes) y estilo.js (hudDex).
 */
G.Dividida = (() => {
  const doc = typeof document !== 'undefined' ? document : null;
  const MODS = () => G.MODS || {};
  const MODOS = ['no', 'abajo', 'lado', 'auto'], LADOS = ['derecha', 'izquierda'];
  const TAU = Math.PI * 2;
  const mm = q => { try { return typeof matchMedia === 'function' ? matchMedia(q) : null; } catch (e) { return null; } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ===================================================================
  // 1. El ajuste
  // ===================================================================
  function modo() {
    const v = G.Settings && G.Settings.get ? G.Settings.get('dividida') : undefined;
    if (MODOS.includes(v)) return v;
    const d = MODS().divididaPorDefecto;
    return MODOS.includes(d) ? d : 'no';
  }
  function lado() { const v = G.Settings && G.Settings.get ? G.Settings.get('divididaLado') : undefined; return LADOS.includes(v) ? v : 'derecha'; }
  const margen = () => { const m = +MODS().divididaMargenBisagra; return m >= 0 && isFinite(m) ? m : 16; };

  // ===================================================================
  // 2. Postura y segmentos (investigación de plegables del 12-10-2026)
  // ===================================================================
  /** 'folded' | 'continuous' | null (el navegador no lo dice). */
  function postura() {
    try {
      const dp = typeof navigator !== 'undefined' && navigator.devicePosture;
      if (dp && (dp.type === 'folded' || dp.type === 'continuous')) return dp.type;
    } catch (e) { /* nada */ }
    const f = mm('(device-posture: folded)'), c = mm('(device-posture: continuous)');
    if (f && f.matches) return 'folded';
    if (c && c.matches) return 'continuous';
    return null;
  }
  /** ¿Informa el navegador de la postura? (No garantiza que el móvil informe de la bisagra.) */
  const hayPostura = () => postura() !== null;
  /** Segmentos de la ventana (px CSS), de arriba abajo y de izquierda a derecha; null sin la API. */
  function segmentos() {
    let s = null;
    try { s = typeof window !== 'undefined' && window.viewport && window.viewport.segments; } catch (e) { s = null; }
    if (!s || !s.length) return null;
    const o = [];
    for (let i = 0; i < s.length; i++) o.push({ x: s[i].x, y: s[i].y, w: s[i].width, h: s[i].height });
    return o.sort((a, b) => (a.y - b.y) || (a.x - b.x));
  }
  /** 'una' | 'apilados' (bisagra horizontal: modo mesa) | 'lado-a-lado' (bisagra vertical: libro) | 'otra'. */
  function disposicionSegs(g) {
    if (!g || g.length < 2) return 'una';
    const a = g[0], b = g[1];
    if (Math.abs(a.x - b.x) < 1 && b.y >= a.y + a.h - 1) return 'apilados';
    if (Math.abs(a.y - b.y) < 1 && b.x >= a.x + a.w - 1) return 'lado-a-lado';
    return 'otra';
  }

  // ===================================================================
  // 3. El reparto (puro)
  // ===================================================================
  /** Un px CSS entero cerca de v cuya posición en píxeles físicos también sea entera (con dpr 2,625, múltiplo de 8). */
  function ajustar(v, dpr) {
    const r = Math.round(v);
    if (!(dpr > 0) || Math.abs(dpr - Math.round(dpr)) < 1e-9) return r;
    for (let d = 0; d <= 4; d++) for (const c of [r - d, r + d]) if (Math.abs(c * dpr - Math.round(c * dpr)) < 1e-6) return c;
    return r;
  }
  /**
   * Cómo se parte una ventana de w×h px CSS (pura). md: 'no' | 'abajo' | 'lado' | 'auto'; ld: 'derecha' | 'izquierda'
   * (dónde van los mandos con 'lado'); op: { postura, segmentos, pliegue (el supuesto, de G.Estilo.plieguePantalla, si no
   * hay segmentos), dpr }. Devuelve null (pantalla entera) o
   *   { juego: {x,y,w,h}, controles: {x,y,w,h,lado}, costura: 'sup' | 'izq' | 'der' (el borde del panel que da a la
   *     división), bisagra: {x,y,w,h} | null (la máscara entre los dos segmentos), pliegue: {eje, pos, ancho} | null (una
   *     bisagra que CRUZA las dos mitades, en px de la ventana: el panel la esquiva), fuente: 'bisagra' | 'mitad' }.
   */
  function reparto(w, h, md, ld, op = {}) {
    if (!MODOS.includes(md) || md === 'no' || !(w > 0) || !(h > 0)) return null;
    const segs = op.segmentos && op.segmentos.length >= 2 ? op.segmentos : null, disp = disposicionSegs(segs);
    let dir = md;
    if (md === 'auto') { if (!(op.postura === 'folded' && disp === 'apilados')) return null; dir = 'abajo'; }
    let juego, controles, bisagra = null, pliegue = null, costura, fuente = 'mitad';
    if (dir === 'abajo') {
      if (disp === 'apilados') {
        const a = segs[0], b = segs[1], fin = Math.round(a.y + a.h), ini = Math.round(b.y);
        juego = { x: 0, y: 0, w, h: fin }; controles = { x: 0, y: ini, w, h: h - ini, lado: 'abajo' };
        bisagra = ini > fin ? { x: 0, y: fin, w, h: ini - fin } : null; fuente = 'bisagra';
      } else {
        const y = ajustar(h / 2, op.dpr);
        juego = { x: 0, y: 0, w, h: y }; controles = { x: 0, y, w, h: h - y, lado: 'abajo' };
      }
      costura = 'sup';
      if (disp === 'lado-a-lado') pliegue = { eje: 'x', pos: (segs[0].x + segs[0].w + segs[1].x) / 2, ancho: Math.max(0, segs[1].x - segs[0].x - segs[0].w) };
      else if (!segs && op.pliegue && op.pliegue.eje === 'x') pliegue = Object.assign({}, op.pliegue);
    } else {
      const izq = ld === 'izquierda';
      let A, B;
      if (disp === 'lado-a-lado') {
        const a = segs[0], b = segs[1], fin = Math.round(a.x + a.w), ini = Math.round(b.x);
        A = { x: 0, y: 0, w: fin, h }; B = { x: ini, y: 0, w: w - ini, h };
        bisagra = ini > fin ? { x: fin, y: 0, w: ini - fin, h } : null; fuente = 'bisagra';
      } else {
        const x = ajustar(w / 2, op.dpr);
        A = { x: 0, y: 0, w: x, h }; B = { x, y: 0, w: w - x, h };
      }
      juego = izq ? B : A; controles = Object.assign({}, izq ? A : B, { lado: izq ? 'izquierda' : 'derecha' });
      costura = izq ? 'der' : 'izq';
      if (disp === 'apilados') pliegue = { eje: 'y', pos: (segs[0].y + segs[0].h + segs[1].y) / 2, ancho: Math.max(0, segs[1].y - segs[0].y - segs[0].h) };
      else if (!segs && op.pliegue && op.pliegue.eje === 'y') pliegue = Object.assign({}, op.pliegue);
    }
    if (!(juego.w > 0 && juego.h > 0 && controles.w > 0 && controles.h > 0)) return null;
    return { juego, controles, costura, bisagra, pliegue, fuente, modo: md };
  }

  // ===================================================================
  // 4. El panel de mandos: dónde va cada cosa (puro)
  // ===================================================================
  /**
   * Panel de Kw×Kh px CSS (coordenadas del panel). op: { costura: 'sup' | 'izq' | 'der', seguras: {sup, der, inf, izq}
   * (las de los bordes del panel que dan al borde de la pantalla), pliegue: {eje, pos, ancho} en coordenadas del panel o
   * null, margen (px libres junto a la división y al pliegue), n (ataques, 1-4) }.
   * Apaisado: arriba, tus datos (izquierda) y el objeto y la pausa (derecha); debajo, el joystick a la izquierda y los
   * ataques a la derecha (los dos pulgares, como en una consola). Alto: arriba los datos, el objeto, la pausa y los
   * ataques; abajo, el joystick. Si un pliegue cruza el panel, la separación entre las dos partes cae en él.
   */
  function maquetarPanel(Kw, Kh, op = {}) {
    const sg = Object.assign({ sup: 0, der: 0, inf: 0, izq: 0 }, op.seguras || {}), mg = op.margen != null ? op.margen : margen();
    const m = clamp(Math.round(Math.min(Kw, Kh) * 0.035), 8, 16), g = Math.max(8, Math.round(m * 0.75));
    const borde = k => Math.max(m, sg[k] || 0, op.costura === k ? mg : 0);
    const A = { x: borde('izq'), y: borde('sup') };
    A.w = Math.max(0, Kw - A.x - borde('der')); A.h = Math.max(0, Kh - A.y - borde('inf'));
    const n = clamp(op.n || 4, 1, 4), pg = op.pliegue || null;
    const horizontal = A.w >= A.h * 1.15;
    const barra = clamp(Math.round(Math.min(Kw, Kh) * 0.13), 44, 56);
    let info, objeto, pausa, zonaStick, zonaBotones, corte = null;
    if (horizontal) {
      let xd = A.x + A.w * 0.5, hueco = g / 2;
      if (pg && pg.eje === 'x' && pg.pos > A.x + A.w * 0.25 && pg.pos < A.x + A.w * 0.75) { xd = pg.pos; hueco = (pg.ancho || 0) / 2 + mg; corte = { eje: 'x', a: xd - hueco, b: xd + hueco }; }
      const iz = { x: A.x, y: A.y, w: Math.floor(xd - hueco - A.x), h: A.h }, de = { x: Math.ceil(xd + hueco), y: A.y };
      de.w = A.x + A.w - de.x; de.h = A.h;
      info = { x: iz.x, y: iz.y, w: iz.w, h: barra };
      pausa = { x: de.x + de.w - barra, y: de.y, w: barra, h: barra };
      objeto = { x: pausa.x - g - barra, y: de.y, w: barra, h: barra };
      zonaStick = { x: iz.x, y: iz.y + barra + g, w: iz.w, h: iz.h - barra - g };
      zonaBotones = { x: de.x, y: de.y + barra + g, w: de.w, h: de.h - barra - g };
    } else {
      let yd = A.y + A.h * 0.5, hueco = g / 2;
      if (pg && pg.eje === 'y' && pg.pos > A.y + A.h * 0.25 && pg.pos < A.y + A.h * 0.75) { yd = pg.pos; hueco = (pg.ancho || 0) / 2 + mg; corte = { eje: 'y', a: yd - hueco, b: yd + hueco }; }
      const ar = { x: A.x, y: A.y, w: A.w, h: Math.floor(yd - hueco - A.y) }, ab = { x: A.x, y: Math.ceil(yd + hueco), w: A.w };
      ab.h = A.y + A.h - ab.y;
      pausa = { x: ar.x + ar.w - barra, y: ar.y, w: barra, h: barra };
      objeto = { x: pausa.x - g - barra, y: ar.y, w: barra, h: barra };
      info = { x: ar.x, y: ar.y, w: objeto.x - g - ar.x, h: barra };
      zonaBotones = { x: ar.x, y: ar.y + barra + g, w: ar.w, h: ar.h - barra - g };
      zonaStick = ab;
    }
    // Ataques: rejilla de 2×2 (con 3 o 4), 2×1 o uno, lo más grandes que quepan (56-112 px), centrados en su zona; el
    // vínculo guardado, una insignia en la esquina de arriba a la izquierda de la rejilla.
    const cols = n >= 2 ? 2 : 1, filas = n >= 3 ? 2 : 1;
    const S = clamp(Math.floor(Math.min((zonaBotones.w - (cols - 1) * g) / cols, (zonaBotones.h - (filas - 1) * g) / filas)), 44, 112);
    const tw = cols * S + (cols - 1) * g, th = filas * S + (filas - 1) * g;
    const x0 = Math.round(zonaBotones.x + (zonaBotones.w - tw) / 2), y0 = Math.round(zonaBotones.y + (zonaBotones.h - th) / 2);
    const ranuras = [];
    for (let i = 0; i < n; i++) ranuras.push({ x: x0 + (i % cols) * (S + g), y: y0 + Math.floor(i / cols) * (S + g), w: S, h: S });
    const vb = Math.max(24, Math.round(S * 0.3));
    const vinculo = { x: Math.max(zonaBotones.x, x0 - Math.round(vb * 0.35)), y: Math.max(zonaBotones.y, y0 - Math.round(vb * 0.35)), w: vb, h: vb };
    // Joystick: la base, centrada en su zona, con un radio del 38 % de su lado corto (44-110 px).
    const r = clamp(Math.round(Math.min(zonaStick.w, zonaStick.h) * 0.38), 44, 110);
    const stick = { cx: Math.round(zonaStick.x + zonaStick.w / 2), cy: Math.round(zonaStick.y + zonaStick.h / 2), r, zona: zonaStick };
    return { w: Kw, h: Kh, horizontal, area: A, info, objeto, pausa, ranuras, vinculo, stick, zonaBotones, lado: S, corte, margen: m };
  }

  // ===================================================================
  // 5. Estado: qué se aplica y cuándo
  // ===================================================================
  let aplicado = null, L = null, cv = null, cx = null, dprP = 1, pend = false, vigilando = false;
  const enPartida = () => !!(G.Game && G.Game.player && G.Game.state !== 'ui');
  /** El pliegue que se supone sin la postura (pantalla táctil casi cuadrada: G.Estilo.plieguePantalla). */
  function pliegueSupuesto(w, h) {
    if (!(G.Touch && G.Touch.active) || !G.Estilo || !G.Estilo.plieguePantalla) return null;
    const PG = (G.MARCA && G.MARCA.hud && G.MARCA.hud.compacto && G.MARCA.hud.compacto.pliegue) || { aspectoMax: 1.2, ladoMin: 600, ancho: 24 };
    return G.Estilo.plieguePantalla(w, h, G.Estilo.pantalla ? G.Estilo.pantalla(w, h) : null, PG);
  }
  /** El reparto que toca ahora en esta ventana (null fuera de partida o desactivado). */
  function calcular() {
    const md = modo();
    if (md === 'no' || !enPartida() || typeof innerWidth !== 'number') return null;
    const w = innerWidth, h = innerHeight;
    return reparto(w, h, md, lado(), { postura: postura(), segmentos: segmentos(), pliegue: pliegueSupuesto(w, h), dpr: typeof devicePixelRatio === 'number' ? devicePixelRatio : 1 });
  }
  const clave = R => (R ? JSON.stringify([R.juego, R.controles, R.pliegue, R.costura]) : '');
  function zonas() {
    const z = G.Estilo && G.Estilo.zonasSeguras ? G.Estilo.zonasSeguras() : null;
    return Object.assign({ sup: 0, der: 0, inf: 0, izq: 0 }, z || {});
  }
  /** Las zonas seguras de los bordes de `r` que dan al borde de la ventana; los que dan a la división, `mg`. */
  function segurasDe(r, R, mg) {
    const z = zonas(), W = innerWidth, H = innerHeight, s = {};
    s.sup = r.y <= 0 ? z.sup : mg; s.izq = r.x <= 0 ? z.izq : mg;
    s.inf = r.y + r.h >= H ? z.inf : mg; s.der = r.x + r.w >= W ? z.der : mg;
    return s;
  }
  /** El marco del HUD Dex en el lienzo del juego (que mide el rectángulo de juego): sin mandos y lejos de la división. */
  function marcoHud(w, h) {
    if (!aplicado) return null;
    const J = aplicado.juego;
    return { juego: { x: 0, y: 0, w, h }, controles: { x: 0, y: h + 8, w: 8, h: 8, lado: aplicado.controles.lado, aparte: true },
      seguras: segurasDe(J, aplicado, margen()) };
  }

  function lienzo() {
    if (cv || !doc || !doc.createElement) return cv;
    cv = doc.createElement('canvas');
    cv.id = 'mandos';
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;display:none;touch-action:none;image-rendering:auto';
    const juego = doc.getElementById('game');
    if (juego && juego.insertAdjacentElement) juego.insertAdjacentElement('afterend', cv); else if (doc.body) doc.body.appendChild(cv);
    cx = cv.getContext('2d');
    cv.addEventListener('pointerdown', abajo);
    cv.addEventListener('pointermove', mover);
    cv.addEventListener('pointerup', arriba);
    cv.addEventListener('pointercancel', arriba);
    cv.addEventListener('contextmenu', e => e.preventDefault());
    return cv;
  }

  function programar() {
    if (pend) return;
    pend = true;
    setTimeout(recolocar, 0);
  }
  /** Aplica el reparto que toca (si ha cambiado): los dos lienzos, el marco del HUD y el resize del juego. */
  function recolocar() {
    pend = false;
    const R = calcular();
    if (clave(R) === clave(aplicado)) { if (R) colocarPanel(); return; }
    aplicado = R;
    stick = null;
    const juego = doc && doc.getElementById('game'), raiz = doc && doc.documentElement;
    if (juego) juego.style.pointerEvents = R ? 'none' : '';
    // css/nico.css: los avisos de logro y el flotante, centrados en la mitad del juego.
    if (raiz && raiz.classList) { raiz.classList.toggle('pantalla-dividida', !!R); if (R && raiz.style) raiz.style.setProperty('--div-centro', Math.round(R.juego.x + R.juego.w / 2) + 'px'); }
    if (G.HudDex && G.HudDex.ponerMarco) G.HudDex.ponerMarco(R ? marcoHud : null);
    if (R && G.Estilo && G.Estilo.cargarFuentes) G.Estilo.cargarFuentes();   // el panel y el HUD Dex usan M PLUS (también en Clásico)
    colocarPanel();
    if (typeof dispatchEvent === 'function' && typeof Event === 'function') dispatchEvent(new Event('resize'));   // game.js: el lienzo, al rectángulo de juego
    if (R) vigilar();
  }
  function colocarPanel() {
    const c = lienzo();
    if (!c) return;
    if (!aplicado) { c.style.display = 'none'; L = null; return; }
    const K = aplicado.controles, d = Math.min(3, typeof devicePixelRatio === 'number' && devicePixelRatio > 0 ? devicePixelRatio : 1);
    const pg = aplicado.pliegue ? (aplicado.pliegue.eje === 'x' ? { eje: 'x', pos: aplicado.pliegue.pos - K.x, ancho: aplicado.pliegue.ancho }
      : { eje: 'y', pos: aplicado.pliegue.pos - K.y, ancho: aplicado.pliegue.ancho }) : null;
    // Siempre las 4 ranuras (las vacías, apagadas): así no se mueven al aprender ataques.
    L = maquetarPanel(K.w, K.h, { costura: aplicado.costura, seguras: segurasDe(K, aplicado, 0), pliegue: pg, n: 4 });
    Object.assign(c.style, { display: 'block', left: K.x + 'px', top: K.y + 'px', width: K.w + 'px', height: K.h + 'px' });
    const W = Math.round(K.w * d), H = Math.round(K.h * d);
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    dprP = d;
  }
  /** Fuera de partida, la pantalla entera: mientras está aplicado, se mira en cada fotograma. */
  function vigilar() {
    if (vigilando || typeof requestAnimationFrame !== 'function') return;
    vigilando = true;
    const paso = () => {
      if (!aplicado) { vigilando = false; return; }
      if (!enPartida()) programar();
      requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }
  /** ¿Pide dividir ahora? (Barato: se mira en cada fotograma de la partida.) */
  function quiere() {
    const md = modo();
    if (md === 'no') return false;
    if (md !== 'auto') return true;
    return postura() === 'folded' && disposicionSegs(segmentos()) === 'apilados';
  }

  // ===================================================================
  // 6. El joystick y los botones del panel
  // ===================================================================
  let stick = null;   // { id, ox, oy, x, y, fijo }
  function local(e) {
    const K = aplicado.controles;
    return { x: e.clientX - K.x, y: e.clientY - K.y };
  }
  /** Los botones del panel (coordenadas del panel), con su margen de toque. */
  function botones() {
    if (!L) return [];
    const pl = G.Game && G.Game.player, out = [];
    L.ranuras.forEach((r, i) => out.push({ r, pad: 4, fn: () => { if (pl && G.Game.state === 'playing' && pl.slots[i] && pl.active !== i) { pl.setActive(i); if (G.Audio) G.Audio.sfx('click'); } }, que: 'ataque' + (i + 1) }));
    out.push({ r: L.pausa, pad: 8, fn: () => G.Game.togglePause(), que: 'pausa' });
    // El objeto sólo se ve como icono: al tocarlo, su nombre y qué hace (el aviso flotante, en la mitad del juego).
    out.push({ r: L.objeto, pad: 4, que: 'objeto', fn: () => { const it = pl && pl.item && G.Items && G.Items.BY[pl.item]; if (it && G.UI && G.UI.toast) G.UI.toast(it.name + ': ' + it.desc); } });
    return out;
  }
  const dentro = (p, r, pad = 0) => p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;
  function abajo(e) {
    if (!aplicado || !L) return;
    const p = local(e);
    for (const b of botones()) if (dentro(p, b.r, b.pad)) { e.preventDefault(); b.fn(); return; }
    if (stick || !G.Game || G.Game.state !== 'playing' || !dentro(p, L.stick.zona)) return;
    e.preventDefault();
    const S = L.stick, Z = S.zona, fijo = Math.hypot(p.x - S.cx, p.y - S.cy) <= S.r * 1.15;
    const ox = fijo ? S.cx : clamp(p.x, Z.x + S.r * 0.6, Z.x + Z.w - S.r * 0.6), oy = fijo ? S.cy : clamp(p.y, Z.y + S.r * 0.6, Z.y + Z.h - S.r * 0.6);
    stick = { id: e.pointerId, ox, oy, x: p.x, y: p.y, fijo };
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
  }
  function mover(e) {
    if (!stick || e.pointerId !== stick.id || !aplicado) return;
    const p = local(e);
    stick.x = p.x; stick.y = p.y;
    if (stick.fijo) return;
    // Donde tocas: si el dedo se aleja más que el radio, la base le sigue (como el joystick de upstream).
    const r = L.stick.r, dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy);
    if (d > r) { stick.ox = stick.x - dx / d * r; stick.oy = stick.y - dy / d * r; }
  }
  function arriba(e) { if (stick && e.pointerId === stick.id) stick = null; }
  /** touch.js vector(): la dirección del joystick del panel (con fuerza 0..1) o null si no se usa. */
  function vector() {
    if (!stick || !aplicado || !L) return null;
    const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy), r = L.stick.r;
    if (d < 6) return [0, 0];
    const k = Math.min(1, (d - 6) / Math.max(1, r * 0.4 - 6));   // a toda velocidad desde el 40 % del radio
    return [dx / d * k, dy / d * k];
  }
  if (typeof addEventListener === 'function') {
    addEventListener('blur', () => { stick = null; });
    addEventListener('resize', programar);
  }
  if (doc && doc.addEventListener) doc.addEventListener('visibilitychange', () => { stick = null; });

  // ===================================================================
  // 7. Dibujo del panel (estilo Dex)
  // ===================================================================
  const COL = () => (G.MARCA && G.MARCA.color) || {};
  const fuente = (w, px) => (G.MARCA && G.MARCA.fuente ? G.MARCA.fuente(w, px) : `${w} ${px}px sans-serif`);
  function rr(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath();
    if (c.roundRect) { c.roundRect(x, y, w, h, r); return; }
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function panel(c, R, r, fondo) {
    const C = COL();
    rr(c, R.x, R.y, R.w, R.h, r); c.fillStyle = fondo || C.cristal || '#0F2630'; c.fill();
    c.lineWidth = 1; c.strokeStyle = C.trazoInterior || 'rgba(59,100,112,0.95)'; c.stroke();
  }
  function recortar(c, t, max) {
    t = String(t);
    if (c.measureText(t).width <= max) return t;
    while (t.length > 1 && c.measureText(t + '…').width > max) t = t.slice(0, -1);
    return t + '…';
  }
  function datos(c, R, pl) {
    const C = COL();
    panel(c, R, 12);
    const p = Math.round(R.h * 0.2), x0 = R.x + p, x1 = R.x + R.w - p;
    const t1 = R.h >= 52 ? 14 : 13, b1 = R.y + Math.round(R.h * 0.4);
    c.textBaseline = 'alphabetic';
    c.font = fuente(800, t1); c.textAlign = 'right'; c.fillStyle = C.tinta || '#EEF6F7';
    const nv = 'Nv. ' + pl.level, wNv = c.measureText(nv).width;
    c.fillText(nv, x1, b1);
    c.textAlign = 'left';
    c.fillText(recortar(c, pl.mon ? pl.mon.name : '', x1 - x0 - wNv - 8), x0, b1);
    // PS (o «Caído» en grupo) y experiencia.
    const f = pl.dead ? 0 : Math.max(0, Math.min(1, pl.hp / pl.maxHp)), yb = R.y + Math.round(R.h * 0.56), hb = Math.max(6, Math.round(R.h * 0.14));
    c.font = fuente(800, 11); c.fillStyle = C.oro || '#FFCB3D'; c.fillText('PS', x0, yb + hb);
    const cifras = pl.dead ? 'Caído' : Math.ceil(Math.max(0, pl.hp)) + '/' + Math.round(pl.maxHp);
    const wc = c.measureText(cifras).width, bx = x0 + c.measureText('PS').width + 6, bw = Math.max(10, x1 - wc - 8 - bx);
    rr(c, bx, yb, bw, hb, hb / 2); c.fillStyle = C.carril || 'rgba(2,8,11,0.6)'; c.fill();
    if (f > 0) { rr(c, bx, yb, bw * f, hb, hb / 2); c.fillStyle = f > 0.5 ? C.psAlto : f > 0.2 ? C.psMedio : C.psBajo; c.fill(); }
    c.textAlign = 'right'; c.fillStyle = pl.dead ? C.peligroTexto : C.tinta; c.fillText(cifras, x1, yb + hb);
    const ye = R.y + R.h - Math.max(5, Math.round(R.h * 0.12)), xf = Math.max(0, Math.min(1, pl.xp / pl.xpNext));
    rr(c, x0, ye, x1 - x0, 3, 1.5); c.fillStyle = 'rgba(169,195,201,0.16)'; c.fill();
    if (xf > 0) { rr(c, x0, ye, (x1 - x0) * xf, 3, 1.5); c.fillStyle = C.exp || '#3DB5F0'; c.fill(); }
  }
  function ranura(c, R, pl, i) {
    const C = COL(), g = pl.slots[i] || [], m = g[0], on = i === pl.active, fused = g.length > 1, S = R.w, rad = Math.round(S * 0.2);
    panel(c, R, rad, on ? 'rgba(23,54,64,0.98)' : null);
    const col = m && G.U && G.U.TYPE_COLOR ? G.U.TYPE_COLOR[m.type] : C.bisel;
    if (m && (on || fused || m.evolved)) { rr(c, R.x + 1.5, R.y + 1.5, S - 3, S - 3, rad); c.lineWidth = on ? 3 : 2; c.strokeStyle = fused ? C.vinculo : m.evolved && !on ? C.oro : col; c.stroke(); }
    if (!m) return;
    const cdOf = mv => (mv.kind === 'orbit' ? 0 : Math.max(0, Math.min(1, mv.t / (mv.cd * (pl.cdMul || 1)))));
    const nombre = S >= 84;
    if (fused) {
      const Cc = Math.round(S * 0.36), Pd = (S - Cc * 2) / 3;
      g.forEach((gm, j) => {
        const ix = Math.round(R.x + Pd + (j % 2) * (Cc + Pd)), iy = Math.round(R.y + Pd + Math.floor(j / 2) * (Cc + Pd) - (nombre ? S * 0.05 : 0));
        if (G.Icons) G.Icons.draw(c, 'move:' + gm.id, ix, iy, Cc);
        const f = cdOf(gm);
        if (f > 0) { c.fillStyle = 'rgba(4,12,16,0.6)'; c.fillRect(ix, iy, Cc, Cc * f); }
      });
    } else {
      const ic = Math.round(S * (nombre ? 0.5 : 0.56));
      if (G.Icons) G.Icons.draw(c, 'move:' + m.id, Math.round(R.x + (S - ic) / 2), Math.round(R.y + (S - ic) / 2 - S * (nombre ? 0.1 : 0.05)), ic);
      const f = cdOf(m);
      if (f > 0) { c.save(); rr(c, R.x, R.y, S, S, rad); c.clip(); c.fillStyle = 'rgba(4,12,16,0.62)'; c.fillRect(R.x, R.y, S, S * f); c.restore(); }
      const segs = (m.def && m.def.maxLvl) || 1, lados = Math.round(S * 0.14), sw = S - 2 * lados, swd = (sw - (segs - 1) * 2) / segs, sy = R.y + S - Math.round(S * 0.09) - 3;
      for (let d = 0; d < segs; d++) { c.fillStyle = d < m.lvl ? col : 'rgba(169,195,201,0.18)'; c.fillRect(Math.round(R.x + lados + d * (swd + 2)), sy, Math.round(swd), 3); }
    }
    c.textBaseline = 'alphabetic';
    if (nombre) {
      c.font = fuente(800, 11); c.textAlign = 'center'; c.fillStyle = on ? C.tinta : C.tinta2;
      c.fillText(recortar(c, fused ? m.name + ' +' + (g.length - 1) : m.name, S - 12), R.x + S / 2, R.y + S - Math.round(S * 0.17));
    }
    c.font = fuente(800, 12); c.textAlign = 'left'; c.fillStyle = C.tinta2;
    c.fillText(String(i + 1), R.x + Math.round(S * 0.1), R.y + Math.round(S * 0.2));
  }
  function objeto(c, R, pl) {
    const C = COL(), it = pl.item;
    panel(c, R, Math.round(R.w * 0.22), it ? 'rgba(40,32,12,0.94)' : 'rgba(15,38,48,0.55)');
    if (!it) return;
    rr(c, R.x + 1, R.y + 1, R.w - 2, R.h - 2, Math.round(R.w * 0.22)); c.lineWidth = 2; c.strokeStyle = C.oro; c.stroke();
    const ic = Math.round(R.w * 0.62);
    if (G.Icons) G.Icons.draw(c, it, Math.round(R.x + (R.w - ic) / 2), Math.round(R.y + (R.h - ic) / 2), ic);
  }
  function pausa(c, R) {
    const C = COL();
    panel(c, R, 12);
    const bw = Math.round(R.w * 0.11), bh = Math.round(R.h * 0.42), y = Math.round(R.y + (R.h - bh) / 2);
    c.fillStyle = C.tinta;
    c.fillRect(Math.round(R.x + R.w * 0.5 - bw - R.w * 0.05), y, bw, bh);
    c.fillRect(Math.round(R.x + R.w * 0.5 + R.w * 0.05), y, bw, bh);
  }
  function joystick(c, S) {
    const C = COL(), activo = !!stick;
    const ox = activo ? stick.ox : S.cx, oy = activo ? stick.oy : S.cy, r = S.r;
    let kx = ox, ky = oy;
    if (activo) { const dx = stick.x - ox, dy = stick.y - oy, d = Math.hypot(dx, dy); kx = ox + (d > r ? dx / d * r : dx); ky = oy + (d > r ? dy / d * r : dy); }
    c.beginPath(); c.arc(ox, oy, r, 0, TAU); c.fillStyle = 'rgba(15,38,48,0.85)'; c.fill();
    c.lineWidth = 2; c.strokeStyle = C.bisel || '#3B6470'; c.stroke();
    c.beginPath(); c.arc(ox, oy, r * 0.4, 0, TAU); c.lineWidth = 1; c.strokeStyle = 'rgba(59,100,112,0.6)'; c.stroke();
    c.beginPath(); c.arc(kx, ky, r * 0.42, 0, TAU); c.fillStyle = C.cristal3 || '#1E4450'; c.fill();
    c.lineWidth = 2; c.strokeStyle = activo ? C.pantalla : C.bordeControl; c.stroke();
  }
  /** game.js render(), última línea: pinta el panel (y, si hace falta, recoloca: al empezar o al acabar la partida, o al
   *  cambiar el ajuste o la postura). */
  function pintar(pl) {
    if (quiere() !== !!aplicado) programar();
    if (!aplicado || !L || !cx || !pl) return;
    const c = cx, C = COL();
    c.setTransform(dprP, 0, 0, dprP, 0, 0);
    c.clearRect(0, 0, L.w, L.h);
    c.fillStyle = C.fondo || '#050E12'; c.fillRect(0, 0, L.w, L.h);
    // El borde que da a la división: una línea fina (sin trazos fuertes).
    const cs = aplicado.costura;
    c.fillStyle = 'rgba(59,100,112,0.55)';
    if (cs === 'sup') c.fillRect(0, 0, L.w, 1); else if (cs === 'izq') c.fillRect(0, 0, 1, L.h); else c.fillRect(L.w - 1, 0, 1, L.h);
    datos(c, L.info, pl);
    objeto(c, L.objeto, pl);
    pausa(c, L.pausa);
    L.ranuras.forEach((R, i) => ranura(c, R, pl, i));
    if (pl.bonds > 0) {
      const V = L.vinculo;
      if (G.Icons) G.Icons.draw(c, 'bond', V.x, V.y, V.w);
      if (pl.bonds > 1) { c.font = fuente(800, 12); c.textAlign = 'left'; c.lineWidth = 3; c.strokeStyle = C.contorno; c.strokeText('×' + pl.bonds, V.x + V.w + 1, V.y + V.h - 2); c.fillStyle = C.vinculo; c.fillText('×' + pl.bonds, V.x + V.w + 1, V.y + V.h - 2); }
    }
    joystick(c, L.stick);
  }

  // ===================================================================
  // 8. Ajustes > Controles: «Pantalla dividida»
  // ===================================================================
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const TEXTO = 'El juego en una mitad de la pantalla y los mandos en la otra, como en una consola de dos pantallas: joystick grande, los cuatro ataques, el objeto, la pausa, tus PS y tu nivel. Se puede cambiar en plena partida desde la pausa.';
  const OPCIONES = [['no', 'Desactivada'], ['abajo', 'Juego arriba, mandos abajo'], ['lado', 'Juego a un lado'], ['auto', 'Automática al plegar']];
  const OPCIONES_LADO = [['derecha', 'Mandos a la derecha'], ['izquierda', 'Mandos a la izquierda']];
  function nota() {
    const md = modo();
    if (md === 'auto') {
      if (!hayPostura()) return 'Este navegador no informa de cómo está plegado el móvil, así que la automática no se activará: elige «Juego arriba, mandos abajo».';
      return 'Se divide al plegar el móvil a medias con la bisagra en horizontal, como un portátil (juego arriba, mandos abajo); abierto del todo, pantalla entera. Ahora: ' +
        (quiere() ? 'plegado.' : 'abierto.');
    }
    if (md === 'abajo' || md === 'lado') return 'En un plegable, la división cae en la bisagra si el navegador la conoce; si no, en la mitad exacta.';
    return '';
  }
  /** settings-ui.js, render(), antes de wire(box): la sección, al final de Controles (wire() conecta los data-k). */
  function ajustes(box, tab) {
    if (!box || tab !== 'ctl' || !box.insertAdjacentHTML) return;
    const md = modo(), ld = lado(), n = nota();
    const chips = (k, ops, cur, etq) => `<div class="chips set-chips" role="radiogroup" aria-label="${esc(etq)}">${ops.map(([v, l]) =>
      `<button class="chip ${v === cur ? 'on' : ''}" data-k="${k}" data-v="${v}" role="radio" aria-checked="${v === cur}">${esc(l)}</button>`).join('')}</div>`;
    box.insertAdjacentHTML('beforeend', `<h3 class="set-h">Pantalla dividida</h3><p class="sub">${esc(TEXTO)}</p>`
      + chips('dividida', OPCIONES, md, 'Pantalla dividida')
      + (md === 'lado' ? chips('divididaLado', OPCIONES_LADO, ld, 'Lado de los mandos') : '')
      + (n ? `<p class="note" id="set-dividida-nota">${esc(n)}</p>` : ''));
  }
  if (G.Settings && G.Settings.on) G.Settings.on(k => { if (k === 'dividida' || k === 'divididaLado') programar(); });
  // La postura y los segmentos cambian sin resize: se vuelve a mirar en el fotograma siguiente (el evento de la postura
  // llega antes de que cambien los segmentos).
  (function escuchar() {
    const otra = () => { if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => programar()); else programar(); };
    try { const dp = typeof navigator !== 'undefined' && navigator.devicePosture; if (dp && dp.addEventListener) dp.addEventListener('change', otra); } catch (e) { /* nada */ }
    for (const q of ['(vertical-viewport-segments: 2)', '(horizontal-viewport-segments: 2)', '(device-posture: folded)']) {
      const m = mm(q);
      if (m && m.addEventListener) m.addEventListener('change', otra);
    }
    try { if (typeof visualViewport !== 'undefined' && visualViewport && visualViewport.addEventListener) visualViewport.addEventListener('resize', programar); } catch (e) { /* nada */ }
  })();

  return {
    modo, lado, postura, hayPostura, segmentos, disposicionSegs, reparto, maquetarPanel, ajustar, vector, pintar, ajustes, nota, recolocar,
    /** El reparto aplicado ahora (o null): lo mira G.Estilo.hudDex(). */
    activa: () => aplicado,
    /** game.js resize() (vía G.Encuadre.resolucion): el rectángulo del lienzo del juego, o null (la pantalla entera). */
    rectJuego: () => (aplicado ? Object.assign({}, aplicado.juego) : null),
    /** Para las pruebas: el panel maquetado y sus botones en px de la ventana. */
    get panel() { return L ? JSON.parse(JSON.stringify(L)) : null; },
    botonesPantalla: () => (aplicado ? botones().map(b => ({ que: b.que, x: b.r.x + aplicado.controles.x, y: b.r.y + aplicado.controles.y, w: b.r.w, h: b.r.h })) : []),
    get stick() { return stick ? Object.assign({}, stick) : null; },
    TEXTO, OPCIONES, OPCIONES_LADO
  };
})();
