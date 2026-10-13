/* ============ encuadre.js — píxel nítido y encuadre (MOD nico) ============
 * Lote 4 de la identidad «Dex de Expedición» (guía de marca §7.4 y §10.4, con las correcciones de la revisión
 * cruzada del 12-10-2026, que mandan). Ajustes en js/core/mods.js.
 *
 * PÍXEL NÍTIDO (Ajustes > Gráficos > Pantalla, en los dos estilos, activado por defecto): un píxel de arte (PX = 2
 * px de mundo) mide un número ENTERO de píxeles físicos. Antes medía 3,75 a 1440x900 y 5,57 en un móvil a dpr 3,
 * así que unas columnas de cada sprite salían más anchas que otras.
 *   - Resolución interna del lienzo: con un devicePixelRatio de hasta 1,5, el real; con más, dpr / ceil(dpr / 1,5)
 *     (2 -> 1, 2,625 -> 1,3125, 3 -> 1,5): el navegador amplía el lienzo por un entero k (con image-rendering:
 *     pixelated) y nunca se pintan más píxeles que en upstream (que usaba min(1,5, dpr)). El tamaño CSS del lienzo
 *     se ajusta a sus píxeles / resolución, para que la ampliación sea exactamente ×k (con 844 px a 2,625 el lienzo
 *     mide 1108 px y en CSS 844,19: si midiera 844, una columna saldría de 1 px en vez de 2).
 *   - Escala de la cámara: el píxel de arte mide m píxeles del lienzo (m entero, k·m físicos), el entero más cercano
 *     (empate hacia arriba) salvo si así se dejara de ver más de G.MODS.pixelNitidoPerdidaMax (7 %) del mundo a lo
 *     ancho y a lo alto: entonces hacia abajo (se ve algo más). Redondeando siempre al más cercano, a 1366x768 se
 *     perdía un 11 %.
 *   Ganchos: game.js resize() (la resolución, y el lienzo en el rectángulo de juego de la pantalla dividida) y
 *   camera.js resize() (la escala). Apagado, todo como upstream.
 *
 * ENCUADRE (sólo con el HUD Dex en compacto y en partida): la cámara se corre para que tu Pokémon quede en el centro
 * de la zona libre (G.HudDex.bandas().zona: sin las filas de arriba ni la columna de los ataques), suavizado en unos
 * 400 ms. 0 en los menús y con el HUD de escritorio. Gancho en camera.js follow(). No viaja por la red.
 */
G.Encuadre = (() => {
  const MODS = () => G.MODS || {};
  const PX = () => (G.Sprites && G.Sprites.PX) || 2;
  const VISTA = () => [(G.Camera && G.Camera.VIEW_W) || 768, (G.Camera && G.Camera.MIN_VIEW_H) || 420];

  // ===================================================================
  // 1. Píxel nítido
  // ===================================================================
  /** ¿Píxel nítido? Lo elegido en Ajustes (G.Settings 'pixelNitido') o, si no se ha tocado, G.MODS.pixelNitidoPorDefecto
   *  (si falta, apagado: como upstream). */
  function nitido() {
    const v = G.Settings && G.Settings.get ? G.Settings.get('pixelNitido') : undefined;
    if (v === true || v === false) return v;
    return MODS().pixelNitidoPorDefecto === true;
  }
  const tope = () => { const t = +MODS().pixelNitidoPerdidaMax; return t >= 0 && isFinite(t) ? t : 0.07; };

  /** Resolución interna para un devicePixelRatio real (pura): hasta 1,5, el real; con más, real / ceil(real / 1,5). */
  function dprInterno(real) {
    real = real > 0 && isFinite(real) ? real : 1;
    return real <= 1.5 ? real : real / Math.ceil(real / 1.5 - 1e-9);
  }

  /** Escala de la cámara con píxel nítido (pura): el píxel de arte, PX px de mundo, mide m píxeles del lienzo (m entero,
   *  ≥ 1): el entero más cercano a PX·s0·dprInt, con el empate hacia arriba, salvo si al subir se pierde más de `max` del
   *  mundo (1 − s0/s): entonces hacia abajo. */
  function escalaNitida(s0, dprInt, px = 2, max = 0.07) {
    const m0 = px * s0 * dprInt;
    if (!(m0 > 0) || !isFinite(m0)) return s0;
    const arriba = Math.max(1, Math.ceil(m0 - 1e-9)), abajo = Math.max(1, Math.floor(m0 + 1e-9));
    let m = m0 - abajo >= arriba - m0 ? arriba : abajo;
    if (m > m0 + 1e-9 && 1 - m0 / m > max + 1e-9) m = abajo;
    return m / (px * dprInt);
  }

  /** Todo el cálculo para una ventana de w×h px CSS y un devicePixelRatio real (pura; check.js y estilo-e2e):
   *  { dprInt, k (ampliación del navegador), s0 (escala de upstream), escala, m (px del lienzo por píxel de arte),
   *    fisicos (px físicos por píxel de arte), antes (los de upstream), perdida (fracción del mundo que deja de verse,
   *    negativa si se ve más) }. Con op.nitido === false, upstream. */
  function calcular(w, h, real, op = {}) {
    const [VW, VH] = VISTA(), px = op.px || PX();
    const s0 = Math.min(w / VW, h / VH), up = Math.min(1.5, real || 1);
    const antes = px * s0 * real;
    if (op.nitido === false) return { dprInt: up, k: real / up, s0, escala: s0, m: px * s0 * up, fisicos: antes, antes, perdida: 0 };
    const d = dprInterno(real), s = escalaNitida(s0, d, px, op.tope !== undefined ? op.tope : tope());
    return { dprInt: d, k: real / d, s0, escala: s, m: Math.round(px * s * d), fisicos: px * s * real, antes, perdida: 1 - s0 / s };
  }

  let actual = { nitido: false, real: 1 };
  /**
   * game.js resize(), antes de medir el lienzo: lo coloca (la pantalla entera o, con la pantalla dividida, el rectángulo
   * de juego de G.Dividida) y devuelve la resolución interna. Con píxel nítido, su tamaño CSS queda en
   * round(W·d) / d px: el navegador lo amplía exactamente ×k. Sin él, la resolución de upstream (`dpr0`).
   */
  function resolucion(cv, dpr0) {
    const real = typeof devicePixelRatio === 'number' && devicePixelRatio > 0 ? devicePixelRatio : 1;
    const R = G.Dividida && G.Dividida.rectJuego ? G.Dividida.rectJuego() : null;
    const st = cv && cv.style;
    actual = { nitido: nitido(), real };
    if (!st) return actual.nitido ? dprInterno(real) : dpr0;
    st.position = R ? 'fixed' : ''; st.left = R ? R.x + 'px' : ''; st.top = R ? R.y + 'px' : '';
    st.width = R ? R.w + 'px' : ''; st.height = R ? R.h + 'px' : '';
    if (!actual.nitido) return dpr0;
    const W0 = R ? R.w : cv.clientWidth, H0 = R ? R.h : cv.clientHeight, d = dprInterno(real);
    if (W0 > 0 && H0 > 0) { st.width = Math.round(W0 * d) / d + 'px'; st.height = Math.round(H0 * d) / d + 'px'; }
    return d;
  }

  /** camera.js resize(): la escala con píxel nítido (s0 = la de upstream; dpr = la resolución interna). */
  function escala(s0, w, h, dpr) {
    if (!actual.nitido) return s0;
    const k = actual.real / dpr;
    if (!(dpr > 0) || Math.abs(k - Math.round(k)) > 1e-6) return s0;   // no es la resolución de resolucion(): como upstream
    return escalaNitida(s0, dpr, PX(), tope());
  }

  // ===================================================================
  // 2. Encuadre: tu Pokémon en el centro de la zona libre
  // ===================================================================
  const off = [0, 0];
  /** Desplazamiento de la cámara (px de mundo) que pide el HUD Dex compacto, o null. */
  function objetivo() {
    if (!MODS().encuadreMovil || !G.Game || !G.Game.player || G.Game.state === 'ui') return null;
    const dex = G.Estilo && (G.Estilo.hudDex ? G.Estilo.hudDex() : G.Estilo.dex);
    if (!dex || !G.HudDex || !G.HudDex.bandas) return null;
    const B = G.HudDex.bandas();
    if (!B || B.variante !== 'compacto' || !B.zona || !B.juego) return null;
    const s = (G.Camera && G.Camera.scale) || 1;
    // La cámara pone tu Pokémon en el centro del lienzo; la zona libre tiene su centro corrido (px CSS).
    const cx = B.zona.x + B.zona.w / 2 - (B.juego.x + B.juego.w / 2), cy = B.zona.y + B.zona.h / 2 - (B.juego.y + B.juego.h / 2);
    return [-cx / s, -cy / s];
  }
  /** camera.js follow(): lo que se suma al objetivo de la cámara este fotograma (suavizado en unos 400 ms). */
  function desplazamiento(dt) {
    if (!G.Game || G.Game.state === 'ui') { off[0] = off[1] = 0; return off; }
    const o = objetivo() || [0, 0], k = 1 - Math.exp(-Math.max(0, dt || 0) * 7.5);
    off[0] += (o[0] - off[0]) * k; off[1] += (o[1] - off[1]) * k;
    return off;
  }

  // ===================================================================
  // 3. Ajustes > Gráficos > Pantalla: «Píxel nítido»
  // ===================================================================
  const TEXTO = 'Cada píxel del dibujo ocupa un número exacto de píxeles de tu pantalla, sin columnas más anchas que otras. El mundo se ve un poco más cerca o más lejos.';
  /** settings-ui.js, render(), antes de wire(box): la fila, al final de la sección «Pantalla». */
  function ajustes(box, tab) {
    if (!box || tab !== 'gfx' || !box.querySelectorAll) return;
    const h3 = [...box.querySelectorAll('h3.set-h')].find(x => x.textContent.trim() === 'Pantalla');
    let ultimo = null;
    for (let n = h3 && h3.nextElementSibling; n && !(n.matches && n.matches('h3')); n = n.nextElementSibling) if (n.classList && n.classList.contains('set-row')) ultimo = n;
    const on = nitido();
    const html = `<div class="set-row" id="set-pixel"><div class="grow"><b>Píxel nítido</b><small>${TEXTO}</small></div>
      <button class="btn small switch ${on ? 'gold' : ''}" data-pixel aria-pressed="${on}">${on ? 'Sí' : 'No'}</button></div>`;
    if (ultimo) ultimo.insertAdjacentHTML('afterend', html); else box.insertAdjacentHTML('beforeend', html);
    const b = box.querySelector('[data-pixel]');
    if (b) b.onclick = () => {
      if (G.Settings) G.Settings.set('pixelNitido', !nitido());
      if (typeof dispatchEvent === 'function' && typeof Event === 'function') dispatchEvent(new Event('resize'));   // game.js rehace el lienzo
      if (G.SettingsUI && G.SettingsUI.isOpen) G.SettingsUI.open();
      const otro = typeof document !== 'undefined' && document.querySelector('[data-pixel]');
      if (otro) otro.focus();
    };
  }

  return { nitido, dprInterno, escalaNitida, calcular, resolucion, escala, objetivo, desplazamiento, ajustes, TEXTO,
    get estado() { return Object.assign({}, actual); } };
})();
