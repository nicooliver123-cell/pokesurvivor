/* ============ estilo.js — interruptor «Estilo: Dex / Clásico» (MOD nico) ============
 * Identidad visual «Dex de Expedición» elegida por Nico el 12-10-2026 (guía de marca y plan del
 * 12-10-2026, con las correcciones de la revisión cruzada). Este fichero es el lote 1: la base.
 *
 *   Dex      menús con la piel de Rotom-Dex (css/nico.css bajo html.estilo-dex) y la letra
 *            M PLUS Rounded 1c 500/800 en todo, también en el lienzo (Pixelify sólo en el logo).
 *   Clásico  el aspecto del original (style.css de upstream y Pixelify), más la tanda 1 de
 *            claridad y los arreglos que no son estética (ver abajo).
 *
 * El valor por defecto sale de G.MODS.estiloPorDefecto (js/core/mods.js); la elección del
 * jugador se guarda en G.Settings ('estilo', por dispositivo). Es local: no viaja por la red, y
 * en grupo uno puede jugar en Dex y otro en Clásico. Cambiarlo es inmediato, sin recargar.
 *
 * Qué hace, en los DOS estilos (arreglos independientes del estilo):
 *   - los legendarios destacados del gacha, el compañero del menú y el premio de la tirada se
 *     animan sin cortar ningún fotograma (sección 5), a escala entera: en Clásico, en los lienzos de
 *     upstream (el compañero, con su escalado por CSS en pantallas bajas); en Dex, en lienzos más
 *     grandes y del tamaño en que se ven;
 *   - Tab recorre los menús (upstream lo anulaba siempre en input.js) y las cartas de subida de
 *     nivel se pueden enfocar (tabindex, role=button, Intro);
 *   - en el gacha de un móvil en horizontal, el botón «Probabilidades» abre el cartel como capa
 *     (css/nico.css lo enseña sólo en pantallas bajas) y la tira de pestañas trae a la vista la
 *     del banner elegido y avisa con un degradado del lado por el que hay más;
 *   - Ajustes > Controles dice que un plegable abierto o una tableta también juegan en vertical.
 * Y sólo en Dex: la clase en <html>, la fuente del lienzo (abajo), la franja de tipo de 8 px y la
 * píldora del tipo en las cartas, y el texto de los controles cuando las ranuras van en columna.
 *
 * Fuente del lienzo: en vez de tocar cada «… Pixelify …» de upstream (hud.js, fx.js, player.js,
 * events.js, game.js, slots.js, claridad.js), se envuelve el setter de
 * CanvasRenderingContext2D.prototype.font (como hace i18n.js con fillText): con Dex,
 * «peso tamaño Pixelify…» pasa a M PLUS (peso ≥ 600 → 800; el resto, 500), con una caché por
 * cadena. Con Clásico no toca nada. Cubre también el texto del lienzo que upstream añada.
 *
 * Ganchos «// MOD nico» de una línea: settings-ui.js (render: la sección «Estilo», los créditos
 * y el texto de los controles), run-ui.js (cada carta de nivel), menu.js (el compañero),
 * gacha-ui.js (los destacados y el premio) e input.js (Tab). Si falta este fichero, todo queda
 * como upstream.
 *
 * Para el HUD Dex (lote 2) y la pantalla dividida (opcional, más adelante): disposicion() da las
 * bandas del HUD y la zona libre de cualquier pantalla, con la variante (escritorio, compacta o
 * dividida estilo Nintendo DS) como parámetro. Ver su comentario.
 */
G.Estilo = (() => {
  const CLASE = 'estilo-dex', ESTILOS = ['dex', 'clasico'];
  const MARCA = () => G.MARCA || null;
  const valido = v => ESTILOS.includes(v);
  const porDefecto = () => (G.MODS && valido(G.MODS.estiloPorDefecto) ? G.MODS.estiloPorDefecto : 'clasico');
  const leer = () => { const v = G.Settings && G.Settings.get('estilo'); return valido(v) ? v : porDefecto(); };
  let actual = leer();
  const oyentes = new Set();
  const doc = typeof document !== 'undefined' ? document : null;
  const compacto = () => (typeof innerHeight === 'number' ? innerHeight : 900) < ((MARCA() && MARCA().ALTO_COMPACTO) || 520);
  /** ¿Menú principal en columna? Pantalla estrecha y alta (un plegable abierto en vertical): por debajo de 760
   *  de ancho y sin ser baja, como el @media de upstream (css/style.css) y el arreglo de css/nico.css. */
  const columnaEstrecha = () => !compacto() && (typeof innerWidth === 'number' ? innerWidth : 1440) <= 760;

  // ===================================================================
  // 1. Fuente del lienzo: «… Pixelify …» -> M PLUS Rounded 1c (sólo con Dex)
  // ===================================================================
  const FAMILIA = (MARCA() && MARCA().familia) || '"M PLUS Rounded 1c","Segoe UI",system-ui,sans-serif';
  const PESOS = { normal: 400, bold: 700, bolder: 800, lighter: 300 };
  const cache = new Map();
  /** '700 13px Pixelify,"Segoe UI",sans-serif' -> '800 13px "M PLUS Rounded 1c",…'. Lo que no es
   *  Pixelify, igual. Pura (no mira el estilo): la usa el setter sólo con Dex. */
  function fuenteCanvas(v) {
    if (typeof v !== 'string') return v;
    let r = cache.get(v);
    if (r !== undefined) return r;
    r = v;
    const m = /^\s*((?:[\w-]+\s+)*?)(\d+(?:\.\d+)?px)(?:\s*\/\s*[\d.]+(?:px)?)?\s+(.+)$/.exec(v);
    if (m && /pixelify/i.test(m[3])) {
      let peso = 400;
      for (const tk of m[1].trim().split(/\s+/)) {
        if (/^\d{3}$/.test(tk)) peso = +tk; else if (PESOS[tk]) peso = PESOS[tk];
      }
      r = `${peso >= 600 ? 800 : 500} ${m[2]} ${FAMILIA}`;
    }
    if (cache.size > 600) cache.clear();
    cache.set(v, r);
    return r;
  }
  (function instalarFuente() {
    const P = typeof CanvasRenderingContext2D !== 'undefined' && CanvasRenderingContext2D.prototype;
    const d = P && Object.getOwnPropertyDescriptor(P, 'font');
    if (!d || !d.set || !d.configurable) return;
    Object.defineProperty(P, 'font', {
      configurable: true, enumerable: d.enumerable, get: d.get,
      set(v) { d.set.call(this, actual === 'dex' ? fuenteCanvas(v) : v); }
    });
  })();

  /** Pide las dos fuentes (no bloquea: el #boot tapa la pantalla hasta que arranca main.js). */
  function cargarFuentes() {
    if (!doc || !doc.fonts || !doc.fonts.load) return Promise.resolve(false);
    return Promise.all(['500 16px "M PLUS Rounded 1c"', '800 16px "M PLUS Rounded 1c"'].map(f => doc.fonts.load(f)))
      .then(() => true, () => false);
  }

  /** Con Clásico, baja las fuentes en reposo para que el service worker las guarde: así se puede
   *  pasar a Dex sin internet. Una vez por sesión, con el service worker ya al mando. */
  let descarga = null;
  function descargaEnReposo() {
    if (descarga) return descarga;
    const sw = typeof navigator !== 'undefined' && navigator.serviceWorker;
    if (!sw || typeof fetch !== 'function' || !/^http/.test(location.protocol)) return Promise.resolve(false);
    descarga = new Promise(resolve => {
      const bajar = () => Promise.all(['MPLUSRounded1c-500-latin.woff2', 'MPLUSRounded1c-800-latin.woff2']
        .map(f => fetch('assets/fonts/' + f).then(r => r.ok)))
        .then(v => resolve(v.every(Boolean)), () => resolve(false));
      const cuando = () => (typeof requestIdleCallback === 'function' ? requestIdleCallback(bajar, { timeout: 8000 }) : setTimeout(bajar, 3000));
      if (sw.controller) setTimeout(cuando, 2000);
      else sw.addEventListener('controllerchange', () => setTimeout(cuando, 500), { once: true });
    });
    return descarga;
  }

  // ===================================================================
  // 2. Interruptor
  // ===================================================================
  function aplicar() {
    if (doc) doc.documentElement.classList.toggle(CLASE, actual === 'dex');
    if (actual === 'dex') cargarFuentes(); else descargaEnReposo();
    rehacerCompanero();
    oyentes.forEach(fn => { try { fn(actual); } catch (e) { console.warn('[Estilo]', e); } });
  }
  /** Cambia el estilo ('dex' | 'clasico'), lo guarda y lo aplica al momento. */
  function set(v) {
    if (!valido(v)) return false;
    if (G.Settings) G.Settings.set('estilo', v);
    actual = v;
    aplicar();
    return true;
  }

  /** Primera línea de G.HUD.draw (js/ui/hud.js): con Dex pinta el HUD de js/ui/hud-dex.js y devuelve true (upstream
   *  no pinta); con Clásico, false. Si el HUD Dex falla, lo dice una vez en la consola y devuelve false: ese
   *  fotograma lo pinta upstream (nunca una partida sin HUD). */
  let falloHud = false;
  function hud(ctx, w, h, pl, st) {
    if (actual !== 'dex' || !G.HudDex || !pl) return false;
    try { G.HudDex.draw(ctx, w, h, pl, st); colocarLogro(); return true; } catch (e) {
      if (!falloHud) { falloHud = true; console.warn('[Estilo] el HUD Dex ha fallado; se pinta el de upstream', e); }
      return false;
    }
  }

  /** Dónde sale el aviso de logro: con Dex y en partida (jugando, o esperando a que un compañero elija su fusión), la
   *  clase hud-dex-logro en <html> y --hud-dex-sup = lo que ocupa arriba el HUD Dex; css/nico.css pone el aviso 8 px
   *  por debajo (en pantallas de 521 px de alto o más; en las bajas sigue abajo, como en upstream). Fuera de partida,
   *  donde siempre. Se mira antes de cada aviso (G.MODS.avisoEnEspera, al principio de showNext() de progress.js) y
   *  tras pintar el HUD Dex en cada fotograma (un aviso que salió en el menú baja al empezar la partida); sólo se toca
   *  el DOM si cambia. */
  let logro = { raiz: null, en: null, sup: null, inf: null };
  function colocarLogro() {
    const raiz = doc && doc.documentElement;
    if (!raiz || !raiz.classList) return;
    if (logro.raiz !== raiz) logro = { raiz, en: null, sup: null, inf: null };
    const st = G.Game && G.Game.state;
    const en = actual === 'dex' && !!G.HudDex && (st === 'playing' || st === 'held');
    if (en !== logro.en) { raiz.classList.toggle('hud-dex-logro', en); logro.en = en; }
    if (en && raiz.style) {
      const v = Math.round(G.HudDex.bandaSup()) + 'px';
      if (v !== logro.sup) { raiz.style.setProperty('--hud-dex-sup', v); logro.sup = v; }
      // Y lo que ocupa abajo (la fila de ranuras de escritorio): el aviso flotante (toast) en partida va encima.
      const i = G.HudDex.bandaInf ? Math.round(G.HudDex.bandaInf()) + 'px' : null;
      if (i && i !== logro.inf) { raiz.style.setProperty('--hud-dex-inf', i); logro.inf = i; }
    }
  }

  /** Menú principal: la línea de créditos (fija abajo, de upstream) no pisa sus cajas. Lo que ocupa abajo (uno, dos o tres
   *  renglones según el ancho y la letra, más su separación del borde) va en --hueco-creditos de <html>, y css/nico.css sube
   *  hasta ahí el borde de abajo del menú: con la barra del navegador en el plegable (724x680, 784x700…) se montaba en la
   *  caja de estadísticas. Oculta (en partida o en una pantalla baja), 0. */
  function vigilarCreditos() {
    const el = doc && doc.getElementById && doc.getElementById('credits-line'), raiz = doc && doc.documentElement;
    if (!el || !raiz || !raiz.style || typeof el.getBoundingClientRect !== 'function') return;
    let antes = null;
    const poner = () => {
      const r = el.getBoundingClientRect(), alto = typeof innerHeight === 'number' ? innerHeight : 0;
      const v = (r.height > 0 ? Math.max(0, Math.ceil(alto - r.top) + 6) : 0) + 'px';
      if (v !== antes) { raiz.style.setProperty('--hueco-creditos', v); antes = v; }
    };
    if (typeof ResizeObserver === 'function') new ResizeObserver(poner).observe(el);
    if (typeof addEventListener === 'function') addEventListener('resize', poner);
    poner();
  }

  // ===================================================================
  // 3. Ajustes: la sección «Estilo» (la primera de Gráficos), créditos y controles
  // ===================================================================
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TEXTO_ESTILO = 'Dex: menús y HUD de Pokédex y letra redondeada. Clásico: menús de pixel art y letra pixelada.';
  const ABAJO = 'Toca un ataque de abajo para cambiarlo', DERECHA = 'Toca un ataque de la derecha para cambiarlo';
  /** «Se juega en horizontal» ya no es del todo cierto: un plegable abierto o una tableta juegan en vertical
   *  (G.MODS.pedirGiro). En los dos estilos. */
  const HORIZONTAL = 'Se juega en horizontal.', HORIZONTAL_PLEGABLE = 'Se juega en horizontal (en un plegable abierto o en una tableta, también en vertical).';

  /** ¿Van las ranuras de ataque en columna a la derecha? (HUD Dex en su variante compacta, G.HudDex.columna). */
  const ranurasEnColumna = () => !!(actual === 'dex' && G.HudDex && G.HudDex.columna && G.HudDex.columna());

  /** settings-ui.js, render(), antes de wire(box): lo nuestro en la pestaña `tab`. */
  function ajustes(box, tab) {
    if (!box) return;
    if (tab === 'gfx') {
      const op = [['dex', 'Dex'], ['clasico', 'Clásico']];
      box.insertAdjacentHTML('afterbegin', `<h3 class="set-h">Estilo</h3><p class="sub">${esc(TEXTO_ESTILO)}</p>
        <div class="chips set-chips estilo-chips" role="radiogroup" aria-label="Estilo">${op.map(([v, l]) =>
          `<button class="chip ${v === actual ? 'on' : ''}" data-estilo="${v}" role="radio" aria-checked="${v === actual}">${esc(l)}</button>`).join('')}</div>`);
      box.querySelectorAll('[data-estilo]').forEach(b => {
        b.onclick = () => {
          if (b.dataset.estilo === actual) return;
          set(b.dataset.estilo);
          if (G.SettingsUI && G.SettingsUI.isOpen) G.SettingsUI.open();   // repinta Ajustes con el estilo nuevo
          const otro = box.querySelector(`[data-estilo="${b.dataset.estilo}"]`);
          if (otro) otro.focus();
        };
      });
    } else if (tab === 'ctl') {
      const columna = ranurasEnColumna();
      for (const p of box.querySelectorAll('p.sub')) {
        let txt = p.textContent;
        if (columna && txt.includes(ABAJO)) txt = txt.replace(ABAJO, DERECHA);
        if (txt.endsWith(HORIZONTAL)) txt = txt.slice(0, -HORIZONTAL.length) + HORIZONTAL_PLEGABLE;
        if (txt !== p.textContent) p.textContent = txt;
      }
    } else if (tab === 'about') {
      const li = [...box.querySelectorAll('ul.credits li')].find(x => /Pixelify/.test(x.textContent));
      if (li) li.insertAdjacentHTML('afterend', '<li><b>Letra del estilo Dex:</b> M PLUS Rounded 1c (OFL).</li>');
    }
  }

  // ===================================================================
  // 4. Cartas de subida de nivel: franja de tipo de 8 px e icono tintado (Dex), y foco con Tab
  // ===================================================================
  /** El tipo del movimiento de una carta ('new:ember', 'up:ember'); null en mejoras y evoluciones. */
  function tipoDeCarta(c) {
    const m = c && /^(new|up):(.+)$/.exec(c.key || '');
    const d = m && G.Moves && G.Moves.BY_ID && G.Moves.BY_ID[m[2]];
    return d && d.type ? d.type : null;
  }
  /** «EVOLUCIÓN» -> «Evolución», «¡SHINY NUEVO!» -> «¡Shiny nuevo!» (sin mayúsculas sostenidas); lo demás, igual. */
  const frase = s => {
    if (s !== s.toUpperCase() || !/\p{L}{3}/u.test(s)) return s;
    const t = s.toLowerCase(), i = t.search(/\p{L}/u);
    return t.slice(0, i) + t.charAt(i).toUpperCase() + t.slice(i + 1);
  };

  /** run-ui.js, renderCards(): cada carta, recién pintada. */
  function carta(el, c) {
    if (!el || !c) return;
    const tipo = tipoDeCarta(c), M = MARCA();
    const color = c.type === 'evo' ? ((M && M.color.oro) || '#FFCB3D') : tipo && G.U && G.U.TYPE_COLOR[tipo] ? G.U.TYPE_COLOR[tipo] : c.color;
    if (color) el.style.setProperty('--tc', color);
    if (tipo) el.dataset.tipo = tipo;
    if (tipo && M && M.tipoConFilo.includes(tipo)) el.classList.add('tc-filo');
    // Foco con Tab (en los dos estilos): las cartas son <div>.
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
    if (actual !== 'dex') return;
    const chip = el.querySelector('.tag-chip');
    if (chip) {
      const p = tipo && M && M.tipoPildora[tipo];
      if (p) { chip.style.background = p[0]; chip.style.color = p[1]; }
      for (const n of chip.childNodes) if (n.nodeType === 3) n.nodeValue = frase(n.nodeValue);   // «EVOLUCIÓN» -> «Evolución»
    }
  }

  // ===================================================================
  // 5. Lienzos al tamaño en que se ven, sin cortar el sprite: destacados del gacha, compañero del
  //    menú y premio de la tirada (los dos estilos)
  // ===================================================================
  /* ui.js (G.UI.sprite) pinta con una escala fija y los pies al 88 % del lienzo: un ataque que se
   * lanza hacia abajo (hasta 25 píxeles de arte por debajo de los pies) o un legendario ancho se
   * salían del lienzo y se veían cortados. Aquí cada lienzo se anima con su propio bucle: la escala
   * entera más grande (hasta kmax) con la que su Idle cabe, y en esa escala sólo las animaciones de
   * «vida» (Charge, Shoot, Attack) que también caben; los pies, colocados para que la caja de
   * píxeles opacos de todo lo que puede pintar (y su sombra) quede dentro con 2 px de margen. Lo
   * demás, como ui.js: sombra, centelleos del shiny y una animación al azar cada 2,5-4,5 s. */
  const VIDA = ['Charge', 'Shoot', 'Attack'];
  const cajasOpacas = new Map();
  let lectura = null, lctx = null;
  /** Caja opaca [izq, arriba, der, abajo] respecto a los pies, en píxeles de arte, de todos los
   *  fotogramas de `anim` en la fila `dir`. Sin poder leer la imagen (file://), la del fotograma. */
  function cajaDe(dex, anim, shiny, dir) {
    const S = G.Sprites, clave = dex + '/' + anim + '/' + (shiny ? 1 : 0) + '/' + dir;
    if (cajasOpacas.has(clave)) return cajasOpacas.get(clave);
    const meta = S.meta && S.meta(dex);
    if (!meta || !meta.a || !meta.a[anim]) return null;
    const m = S.animMeta(dex, anim, shiny), sh = S.sheet && S.sheet(dex, anim, shiny);
    if (!m) return null;
    let caja = [m.ax, m.ay, m.w - m.ax, m.h - m.ay];
    if (!sh || !sh.ready || !doc) return caja;   // aún cargando (o sin página): la del fotograma, sin guardarla
    try {
      if (!lectura) { lectura = doc.createElement('canvas'); lctx = lectura.getContext('2d', { willReadFrequently: true }); }
      lectura.width = m.w; lectura.height = m.h;
      let L = -1e9, T = -1e9, R = -1e9, B = -1e9;
      const fila = Math.min(dir, m.r - 1);
      for (let f = 0; f < m.n; f++) {
        lctx.clearRect(0, 0, m.w, m.h);
        lctx.drawImage(sh.img, f * m.w, fila * m.h, m.w, m.h, 0, 0, m.w, m.h);
        const d = lctx.getImageData(0, 0, m.w, m.h).data;
        for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (d[(y * m.w + x) * 4 + 3] > 0) {
          if (m.ax - x > L) L = m.ax - x;
          if (x + 1 - m.ax > R) R = x + 1 - m.ax;
          if (m.ay - y > T) T = m.ay - y;
          if (y + 1 - m.ay > B) B = y + 1 - m.ay;
        }
      }
      if (L > -1e9) caja = [L, T, R, B];
    } catch (e) { /* imagen sin permiso de lectura (file://): la del fotograma */ }
    cajasOpacas.set(clave, caja);
    return caja;
  }
  const unir = (a, b) => [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
  /** Cómo se coloca un sprite en un lienzo de W×H: { k, fx, fy, vida, caja } (pura; `cajas` = { anim: caja }).
   *  k: la mayor escala ≤ kmax con la que cabe su Idle (si ni con 1, 1); vida: las animaciones extra que
   *  también caben con esa k; fx, fy: los pies, con la caja de todo centrada en horizontal y abajo, con
   *  MARGEN px libres alrededor (Animator.draw redondea medio píxel y la sombra se suaviza). Con bajoMax, sólo las animaciones
   *  que bajan como mucho esos píxeles de arte por debajo de los pies (la tarjeta del menú: el compañero, de pie sobre su peana). */
  const MARGEN = 2;
  function encaje(cajas, W, H, kmax, lively, sombra = true, bajoMax = Infinity) {
    const somb = sombra ? [9, 0, 9, 3.4] : [0, 0, 0, 0], M2 = 2 * MARGEN;
    const cabe = (c, k) => k * (c[0] + c[2]) <= W - M2 && k * (c[1] + c[3]) <= H - M2;
    const idle = unir(cajas.Idle || [12, 24, 12, 2], somb);
    let k = Math.max(1, kmax | 0);
    while (k > 1 && !cabe(idle, k)) k--;
    let u = idle;
    const vida = [];
    if (lively) for (const a of VIDA) { if (!cajas[a] || cajas[a][3] > bajoMax) continue; const v = unir(u, cajas[a]); if (cabe(v, k)) { u = v; vida.push(a); } }
    const fx = Math.floor(MARGEN + k * u[0] + Math.max(0, (W - M2 - k * (u[0] + u[2])) / 2));
    const fy = Math.floor(Math.max(MARGEN + k * u[1], H - MARGEN - k * u[3]));
    return { k, fx, fy, vida, caja: u };
  }

  const vivos = new Set();
  let bucleT = 0;
  function bucle(t) {
    const dt = bucleT ? Math.min(0.1, (t - bucleT) / 1000) : 0;
    bucleT = t;
    for (const v of vivos) {
      if (!v.cv.isConnected) { vivos.delete(v); continue; }
      if (v.cv.offsetParent === null || !v.a) continue;
      pintar(v, dt);
    }
    if (vivos.size) requestAnimationFrame(bucle); else bucleT = 0;
  }
  function pintar(v, dt) {
    const { cv, a, e, ctx } = v;
    a.update(dt);
    if (v.lively && e.vida.length) { v.t -= dt; if (v.t <= 0) { v.t = G.U.rand(2.5, 4.5); a.play(G.U.pick(e.vida)); } }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(e.fx, e.fy, 9 * e.k, 3.4 * e.k, 0, 0, 6.2832); ctx.fill();
    a.draw(ctx, e.fx, e.fy);
    if (v.shiny && G.Icons && G.Icons.twinkle) {   // los centelleos de ui.js
      v.sparkT -= dt;
      if (v.sparkT <= 0 && v.tw.length < 4) {
        v.sparkT = G.U.rand(0.18, 0.45);
        v.tw.push({ x: e.fx + G.U.rand(-0.32, 0.32) * cv.width, y: G.U.rand(0.12, 0.7) * cv.height, t: 0, life: G.U.rand(0.5, 0.8) });
      }
      for (let i = v.tw.length - 1; i >= 0; i--) {
        const w = v.tw[i];
        w.t += dt;
        if (w.t >= w.life) { v.tw.splice(i, 1); continue; }
        G.Icons.twinkle(ctx, w.x, w.y, w.t / w.life, Math.max(2, e.k));
      }
      ctx.globalAlpha = 1;
    }
  }
  /** Anima `dex` en `cv` (que nadie más pinta) con el encaje de arriba. op: { lively, shiny, kmax, dir, bajoMax }. */
  function animar(cv, dex, op = {}) {
    for (const v of vivos) if (v.cv === cv) vivos.delete(v);
    const dir = op.dir || 0;
    const v = { cv, ctx: cv.getContext('2d'), dex, dir, lively: !!op.lively, shiny: !!op.shiny, t: Math.random() * 3, sparkT: 0, tw: [], a: null, e: null };
    vivos.add(v);
    const S = G.Sprites;
    const listo = () => {
      const cajas = {};
      for (const an of ['Idle', ...VIDA]) { const c = cajaDe(dex, an, v.shiny, dir); if (c) cajas[an] = c; }
      v.e = encaje(cajas, cv.width, cv.height, op.kmax || 2, v.lively, true, op.bajoMax);
      const a = new S.Animator(dex, 1, v.shiny);
      a.scale = v.e.k / S.PX; a.dir = dir; a.loop('Idle');
      v.a = a;
      if (!bucleT && typeof requestAnimationFrame === 'function') requestAnimationFrame(bucle);
    };
    const espera = S.preload ? S.preload([dex], 8000, v.shiny) : null;
    if (espera && espera.then) espera.then(listo, listo); else listo();
    return v;
  }
  /** Para estilo-e2e: cómo está colocado lo que se anima en `cv` ({ dex, shiny, dir, k, fx, fy, vida, caja }; null si aún carga). */
  const colocacion = cv => { for (const v of vivos) if (v.cv === cv && v.e) return Object.assign({ dex: v.dex, shiny: v.shiny, dir: v.dir }, v.e); return null; };

  /** Cambia un lienzo de upstream (que anima ui.js) por uno nuevo, del mismo tamaño o del indicado:
   *  ui.js deja de pintar el viejo en cuanto sale de la página. Conserva id, clases y estilo en línea. */
  function relevar(viejo, w, h) {
    const cv = doc.createElement('canvas');
    cv.width = w || viejo.width; cv.height = h || viejo.height;
    if (viejo.id) cv.id = viejo.id;
    if (viejo.className) cv.className = viejo.className;
    if (viejo.title) cv.title = viejo.title;
    const st = viejo.getAttribute && viejo.getAttribute('style');
    if (st) cv.setAttribute('style', st);
    viejo.replaceWith(cv);
    return cv;
  }

  /** gacha-ui.js, refresh(): un legendario destacado del banner (170×190, a ×2 como upstream si su
   *  Idle cabe), sin cortes. */
  function destacado(viejo, dex) {
    if (!viejo || !doc || !G.Sprites || !G.Sprites.Animator) return;
    if (!viejo.previousElementSibling) tiraPestanas(true);   // la pestaña del banner elegido, a la vista
    animar(relevar(viejo), dex, { lively: true, kmax: 2, dir: 1 });
  }

  /** La tira de pestañas de región del gacha, que en una pantalla baja se desplaza en horizontal (css/nico.css):
   *  con `traer`, la del banner elegido queda entera y fuera del degradado del borde (antes podía quedar a medias
   *  y la tira no avisaba de que había más); y las clases mas-izq / mas-der ponen el degradado sólo en el lado por
   *  el que hay más pestañas. */
  const FUNDIDO = 36;
  function tiraPestanas(traer) {
    const tira = doc && doc.getElementById('gacha-gens');
    if (!tira || !tira.getBoundingClientRect) return;
    const on = tira.querySelector('.gen-tab.on');
    if (traer && on && tira.scrollWidth > tira.clientWidth + 1) {
      const q = tira.getBoundingClientRect(), r = on.getBoundingClientRect(), m = FUNDIDO + 4;
      const d = r.left < q.left + m ? r.left - (q.left + m) : r.right > q.right - m ? r.right - (q.right - m) : 0;
      if (d) tira.scrollLeft += d;   // el navegador lo deja entre 0 y el máximo
    }
    const max = tira.scrollWidth - tira.clientWidth;
    tira.classList.toggle('mas-izq', max > 1 && tira.scrollLeft > 1);
    tira.classList.toggle('mas-der', max > 1 && tira.scrollLeft < max - 1);
  }

  const TAM_COMPANERO = { escritorio: [320, 240], compacto: [208, 150], clasico: [260, 200] };
  let ultimoCompanero = null;
  /** [ancho, alto, escala máxima] del compañero. Clásico: el lienzo y la escala de upstream (260×200, ×4; en
   *  pantallas bajas y en la columna estrecha, css/style.css y css/nico.css lo escalan por CSS, como upstream).
   *  Dex: 320×240 hasta ×6 (208×150 en pantallas bajas y en la columna estrecha), al tamaño en que se ve. */
  function tamCompanero() {
    if (actual !== 'dex') return [...TAM_COMPANERO.clasico, 4];
    return [...(compacto() || columnaEstrecha() ? TAM_COMPANERO.compacto : TAM_COMPANERO.escritorio), 6];
  }
  /** menu.js, open(): el compañero del menú, sin cortes, en el lienzo de tamCompanero(). */
  function companero(cv, dex, op = {}) {
    if (!cv || !doc || !G.Sprites || !G.Sprites.Animator) return;
    const [w, h, kmax] = tamCompanero();
    const nuevo = relevar(cv, w, h);
    animar(nuevo, dex, { lively: true, shiny: !!op.shiny, kmax });
    ultimoCompanero = { cv: nuevo, dex, op };
    if (G.Portada) G.Portada.rellenar();   // la «Tarjeta de entrenador» del menú (Dex): js/ui/portada.js
  }
  /** Al cambiar de estilo o de tamaño de ventana: el compañero, en el lienzo que le toca. */
  function rehacerCompanero() {
    const u = ultimoCompanero;
    if (!u || !u.cv.isConnected) return;
    const [w, h] = tamCompanero();
    if (u.cv.width !== w || u.cv.height !== h) companero(u.cv, u.dex, u.op);
  }

  /** [ancho, alto, escala máxima] del premio: [tirada][pantalla normal, pantalla baja, pantalla alta de menos de
   *  800 de ancho]. Clásico: el lienzo y la escala de upstream (132×120, ×2); en pantallas bajas, 96×76, sin el
   *  escalado por CSS de upstream (a 84 de ancho), para que la ×10 quepa en dos filas sin cortar a nadie. Dex: ×1
   *  200×180 hasta ×4 (160×140, ×3) y ×10 132×120 hasta ×3 (96×76, ×2). En la ×10 de una pantalla alta y estrecha
   *  (el Magic V6 abierto, 724 o 784 de ancho), 120×110: así caben cinco cartas por fila y las diez en dos filas,
   *  sin desplazar (con 132, cuatro por fila y tres filas). La cuarta, la ×10 de una pantalla baja y estrecha (menos
   *  de 690 px útiles: 640x360, 667x375), 88×76 en cartas de 96: así siguen cabiendo seis por fila y «Continuar»
   *  tiene su esquina libre (con cinco y cinco pisaba la última). */
  const TAM_PREMIO = {
    dex: { 1: [[200, 180, 4], [160, 140, 3], [200, 180, 4], [160, 140, 3]], 10: [[132, 120, 3], [96, 76, 2], [120, 110, 3], [88, 76, 2]] },
    clasico: { 1: [[132, 120, 2], [96, 76, 2], [132, 120, 2], [96, 76, 2]], 10: [[132, 120, 2], [96, 76, 2], [120, 110, 2], [88, 76, 2]] }
  };
  const ANCHO_ESTRECHO = 800;   // como el @media de css/nico.css para las cartas de la ×10
  const UTIL_SEIS = 6 * 110 + 5 * 6;   // seis cartas de 110 con su separación (css/nico.css, pantallas bajas)
  /** Pantalla para el premio: 0 normal, 1 baja, 2 alta de menos de 800 de ancho, 3 baja y estrecha (sólo la ×10). */
  function pantallaPremio(n) {
    const W = typeof innerWidth === 'number' ? innerWidth : 1440;
    if (!compacto()) return W < ANCHO_ESTRECHO ? 2 : 0;
    const sg = zonasSeguras(), util = W - Math.max(10, sg.izq) - Math.max(10, sg.der);   // el relleno de #pull-fx
    return n !== 1 && util < UTIL_SEIS ? 3 : 1;
  }
  /** gacha-ui.js, pull(): el premio, sin cortes, en un lienzo del tamaño en que se ve (TAM_PREMIO). */
  function premio(card, r, n) {
    const viejo = card && card.querySelector('canvas');
    if (!viejo || !r || !doc || !G.Sprites || !G.Sprites.Animator) return;
    const pantalla = pantallaPremio(n);
    const [w, h, kmax] = TAM_PREMIO[actual === 'dex' ? 'dex' : 'clasico'][n === 1 ? 1 : 10][pantalla];
    animar(relevar(viejo, w, h), r.dex, { lively: r.rarity >= 4 || !!r.shiny, shiny: !!r.shiny, kmax });
    card.classList.add(n === 1 ? 'premio-1' : 'premio-10');
    if (pantalla === 3) card.classList.add('premio-10e');
    // Dex: «¡NUEVO!» -> «¡Nuevo!». gacha-ui.js escribe el nombre y la etiqueta justo después de este gancho,
    // antes de esperar a la carta siguiente: se cambia en cuanto termina (microtarea).
    if (actual === 'dex' && card.querySelectorAll) Promise.resolve().then(() => {
      for (const s of card.querySelectorAll('.new')) for (const nd of s.childNodes) if (nd.nodeType === 3) nd.nodeValue = frase(nd.nodeValue);
    });
  }

  // ===================================================================
  // 6. Gacha en pantallas bajas: «Probabilidades» como capa (los dos estilos)
  // ===================================================================
  function capaProbabilidades(abrir) {
    const capa = doc && doc.getElementById('gacha-prob-capa');
    if (!capa) return;
    if (abrir) {
      const rates = doc.getElementById('gacha-rates');
      capa.querySelector('.rates').innerHTML = rates ? rates.innerHTML.replace(/<h3>[^<]*<\/h3>/, '') : '';
      capa.classList.remove('hidden');
      const b = capa.querySelector('button'); if (b) b.focus();
    } else if (!capa.classList.contains('hidden')) {
      capa.classList.add('hidden');
      const b = doc.getElementById('gacha-prob'); if (b) b.focus();
    }
  }
  function prepararGacha() {
    const fila = doc && doc.querySelector('#scr-gacha .row.between');
    if (!fila || doc.getElementById('gacha-prob')) return;
    const volver = fila.querySelector('[data-back]');
    const b = doc.createElement('button');
    b.id = 'gacha-prob'; b.className = 'btn small ghost'; b.type = 'button'; b.textContent = 'Probabilidades';
    b.onclick = () => capaProbabilidades(true);
    fila.insertBefore(b, volver || null);
    doc.getElementById('scr-gacha').insertAdjacentHTML('beforeend',
      `<div id="gacha-prob-capa" class="box hidden" role="dialog" aria-label="Probabilidades"><div class="row between"><h3>Probabilidades</h3>
        <button class="btn small ghost" type="button">Cerrar</button></div><div class="panel rates"></div></div>`);
    const capa = doc.getElementById('gacha-prob-capa');
    capa.querySelector('button').onclick = () => capaProbabilidades(false);
    const tira = doc.getElementById('gacha-gens');
    if (tira) tira.addEventListener('scroll', () => tiraPestanas(false), { passive: true });
    // Esc cierra la capa sin cerrar el gacha (game.js vuelve al menú con Esc): se atiende antes.
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && !capa.classList.contains('hidden')) { e.stopPropagation(); capaProbabilidades(false); }
    }, true);
  }

  // ===================================================================
  // 7. Teclado: Tab recorre los menús (los dos estilos)
  // ===================================================================
  /** input.js, keydown: ¿se deja que Tab mueva el foco? Upstream lo anulaba siempre (para que no se
   *  fuera el foco del lienzo jugando), así que con el teclado no se podía llegar a ningún botón. Ahora
   *  sólo se deja con una pantalla abierta (menús, pausa, cartas, fin, resultado del gacha y su capa) o
   *  fuera de partida (estado 'ui'). En partida sin pantalla ('playing', o 'held' mientras un compañero
   *  elige su fusión), se sigue anulando: Tab sacaría el foco del lienzo hacia los botones de detrás. */
  function tabLibre() {
    if (!doc) return false;
    if (doc.querySelector('.scr:not(.hidden), #pull-fx:not(.hidden), #gacha-prob-capa:not(.hidden)')) return true;
    return !G.Game || G.Game.state === 'ui';
  }

  // ===================================================================
  // 8. Disposición del HUD: bandas y zona libre (para el HUD Dex del lote 2 y la pantalla dividida)
  // ===================================================================
  let seguras = null;
  /** Márgenes de la muesca (env(safe-area-inset-*)) en px CSS; se leen una vez por cambio de tamaño. */
  function zonasSeguras() {
    if (seguras) return seguras;
    seguras = { sup: 0, der: 0, inf: 0, izq: 0 };
    if (!doc || !doc.body || typeof getComputedStyle !== 'function') return seguras;
    let s = doc.getElementById('estilo-seguras');
    if (!s) {
      s = doc.createElement('div');
      s.id = 'estilo-seguras';
      s.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
        'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
      doc.body.appendChild(s);
    }
    const cs = getComputedStyle(s);
    seguras = { sup: parseFloat(cs.paddingTop) || 0, der: parseFloat(cs.paddingRight) || 0, inf: parseFloat(cs.paddingBottom) || 0, izq: parseFloat(cs.paddingLeft) || 0 };
    return seguras;
  }

  /**
   * Marco, variante y bandas reservadas del HUD Dex en una pantalla de w×h px CSS (pura: no mira la
   * página salvo para las zonas seguras si no se pasan). La usa js/ui/hud-dex.js para colocar cada pieza
   * (G.HudDex.maquetar), las flechas de borde (dentro de la zona libre) y, en el lote 4, el encuadre (tu
   * Pokémon en el centro de la zona libre). Es también la interfaz de la pantalla dividida opcional estilo
   * Nintendo DS (lote posterior): basta con cambiar los rectángulos `juego` y `controles`.
   *
   * op: { seguras: {sup, der, inf, izq}   (si faltan, las de la página: env(safe-area-inset-*)),
   *       juego, controles: rectángulos explícitos {x, y, w, h} (controles con `lado`), o bien
   *       dividida: false | 'auto' | 'abajo' | 'arriba' | 'derecha' | 'izquierda' (dónde van los CONTROLES;
   *       'auto': abajo si la pantalla es casi cuadrada o alta, a la derecha si es apaisada) y
   *       proporcion: parte de la pantalla para los controles (0,5),
   *       columnaIzq: px de la columna de compañeros y chips en compacto (0 si no hay nada),
   *       tactil: pantalla táctil (para el pliegue),
   *       pantalla: {w, h} de la pantalla entera o null (si falta, screen: el pliegue es del cristal, no de la ventana) }
   * Devuelve { variante: 'escritorio' | 'compacto', escala (u -> px en escritorio), kc (px ×kc en compacto),
   *            dividida, seguras, bordes: las zonas seguras que tocan a `juego` (sólo las de sus lados que dan
   *            al borde de la pantalla),
   *            juego: {x, y, w, h}   el rectángulo donde se ve el mundo y va el HUD de datos,
   *            controles: null | {x, y, w, h, lado}   el de los mandos (ranuras y pausa), si lo hay,
   *            filas: {f1, f2, hueco, margen, margenLados} (compacto),
   *            bandas: {sup, inf, izq, der}   lo que el HUD reserva DENTRO de `juego` en el peor caso (jefe y
   *            aviso a la vez; G.HudDex.bandas() da las del último fotograma, iguales arriba y abajo),
   *            libre: {x, y, w, h}   `juego` menos las bandas,
   *            ranuras: 'fila' | 'columna' | 'controles',
   *            pliegue: null | {eje: 'x' | 'y', pos, ancho}   dónde estaría el pliegue de un plegable abierto
   *            (táctil, casi cuadrado y con el lado corto ≥ 600: parte por la mitad el lado corto; eje 'x' = línea
   *            vertical en x = pos). Sin saber la postura, el HUD compacto aparta sus piezas de esa franja. }
   * Variante: compacta si `juego` mide menos de 520 de alto (móvil en horizontal) o si es más estrecho que
   * la fila de arriba de escritorio con la entrada del jefe (884 u: plegable abierto, ventana estrecha); si
   * no, escritorio. Cifras en G.MARCA.hud.
   */
  function disposicion(w, h, op = {}) {
    const M = MARCA(), H = M && M.hud, E = H && H.escritorio, C = H && H.compacto;
    const s0 = op.seguras || zonasSeguras();
    const sg = { sup: s0.sup || 0, der: s0.der || 0, inf: s0.inf || 0, izq: s0.izq || 0 };
    let juego = { x: 0, y: 0, w, h }, controles = null, dividida = false;
    if (op.juego) {
      juego = { x: +op.juego.x || 0, y: +op.juego.y || 0, w: +op.juego.w || w, h: +op.juego.h || h };
      if (op.controles) { controles = Object.assign({}, op.controles); dividida = controles.lado || 'abajo'; }
    } else if (op.dividida) {
      const k = Math.min(0.7, Math.max(0.3, +op.proporcion || 0.5));
      let lado = op.dividida;
      if (lado === 'auto' || !['abajo', 'arriba', 'derecha', 'izquierda'].includes(lado)) lado = w < h * 1.25 ? 'abajo' : 'derecha';
      dividida = lado;
      if (lado === 'abajo' || lado === 'arriba') {
        const hc = Math.round(h * k);
        controles = { x: 0, y: lado === 'abajo' ? h - hc : 0, w, h: hc, lado };
        juego = { x: 0, y: lado === 'abajo' ? 0 : hc, w, h: h - hc };
      } else {
        const wc = Math.round(w * k);
        controles = { x: lado === 'derecha' ? w - wc : 0, y: 0, w: wc, h, lado };
        juego = { x: lado === 'derecha' ? 0 : wc, y: 0, w: w - wc, h };
      }
    }
    // Las zonas seguras sólo cuentan en los lados de `juego` que dan al borde de la pantalla.
    const bordes = { sup: juego.y <= 0 ? sg.sup : 0, izq: juego.x <= 0 ? sg.izq : 0,
      der: juego.x + juego.w >= w ? sg.der : 0, inf: juego.y + juego.h >= h ? sg.inf : 0 };
    const ALTO = (M && M.ALTO_COMPACTO) || 520;
    const escalaE = M ? M.escalaHUD(juego.w, juego.h) : 1;
    const esCompacto = juego.h < ALTO || juego.w / escalaE < ((E && E.anchoMin) || 884);
    const bandas = { sup: 0, inf: 0, izq: 0, der: 0 };
    let escala = 1, kc = 1, ranuras, filas = null;
    if (esCompacto) {
      const A = (C && C.adaptable) || { fila1: [0.1, 32, 40], fila2: [0.064, 22, 26], margen: [6, 6], hueco: [3, 4], altoApretado: 360, ranuraApretada: 44 };
      const K = (C && C.escala) || { base: 640, max: 1.15 };
      kc = Math.max(1, Math.min(K.max, Math.min(juego.w, juego.h) / K.base));
      const fila = ([k, mn, mx]) => Math.round(Math.max(mn, Math.min(mx, Math.round(k * juego.h))) * kc);
      const apretado = juego.h < A.altoApretado;
      const margen = apretado ? A.margen[0] : A.margen[1], hueco = apretado ? A.hueco[0] : A.hueco[1];
      const margenLados = juego.w < 700 ? 6 : ((C && C.margenLados) || 8);   // pantallas estrechas: 2 px más para las columnas
      filas = { f1: fila(A.fila1), f2: fila(A.fila2), hueco, margen, margenLados, apretado };
      bandas.sup = Math.max(margen, bordes.sup) + filas.f1 + hueco + filas.f2;
      if (controles) ranuras = 'controles';
      else {
        const R = C && C.ranuras;
        const lado = apretado ? A.ranuraApretada : Math.round(((R && R.lado) || 48) * kc);
        const sep = juego.h < 376 ? ((R && R.apretado.separacion) || 4) : Math.round(((R && R.separacion) || 6) * kc);
        bandas.der = Math.max(margenLados, bordes.der) + lado + sep;
        ranuras = 'columna';
      }
      const izq = Math.max(0, +op.columnaIzq || 0);
      if (izq) bandas.izq = Math.max(margenLados, bordes.izq) + Math.min(izq, Math.round(((C && C.columnaIzq.anchoMax) || 100) * kc)) + Math.round(((C && C.separacion) || 6) * kc);
    } else {
      escala = escalaE;
      const u = v => Math.round(v * escala);
      const e = E || { margen: 12, margenAbajo: 16, separacion: 8, contador: { h: 56 }, jefe: { h: 40 }, aviso: { separacion: 10, h: 36 },
        ranuras: { lado: 56, elevacion: 6, pildora: { h: 18, sobre: 6 } } };
      bandas.sup = Math.max(u(e.margen), bordes.sup) + u(e.contador.h) + u(e.separacion) + u(e.jefe.h) + u(e.aviso.separacion) + u(e.aviso.h);
      if (controles) ranuras = 'controles';
      else {
        const R = e.ranuras;
        bandas.inf = Math.max(u(e.margenAbajo), bordes.inf) + u(R.lado) + u(R.elevacion) + u(R.pildora.sobre) + u(R.pildora.h);
        ranuras = 'fila';
      }
    }
    const libre = { x: juego.x + bandas.izq, y: juego.y + bandas.sup, w: Math.max(0, juego.w - bandas.izq - bandas.der), h: Math.max(0, juego.h - bandas.sup - bandas.inf) };
    // Pliegue de un plegable abierto (el Magic V6: 724×784 con el pliegue vertical en x = 362; girado, 784×724 con
    // él en y = 362). La pantalla entera, no el rectángulo de juego: el pliegue es del cristal.
    const pliegue = op.tactil ? plieguePantalla(w, h, op.pantalla !== undefined ? op.pantalla : pantalla(w, h), (C && C.pliegue) || { aspectoMax: 1.2, ladoMin: 600, ancho: 24 }) : null;
    return { variante: esCompacto ? 'compacto' : 'escritorio', escala, kc, dividida, seguras: sg, bordes, juego, controles, filas, bandas, libre, ranuras, pliegue };
  }

  /** La pantalla entera (screen.width × screen.height, px CSS) si es creíble: no más pequeña que la ventana de w×h. */
  function pantalla(w, h) {
    const s = typeof screen !== 'undefined' && screen;
    if (!s || !(s.width > 0) || !(s.height > 0) || s.width < w - 1 || s.height < h - 1) return null;
    return { w: s.width, h: s.height };
  }
  /**
   * Dónde estaría el pliegue de un plegable abierto en una ventana de w×h (sin saber la postura): parte por la mitad el
   * lado corto de la PANTALLA (sc), no de la ventana. Con la barra del navegador, el Magic V6 en vertical da una ventana
   * de 724×700 y el pliegue sigue siendo vertical, en x = 362 (antes, al ser la ventana más ancha que alta, se suponía
   * horizontal); girado, 784×640, horizontal y 362 px por debajo de lo alto de la pantalla, que con las barras arriba (la
   * de estado y la de direcciones de Chrome) queda en y = 640 − 362 = 278 (sin confirmar en el teléfono). Si la ventana
   * no tiene el ancho (o casi el alto) de la pantalla, está en una pantalla dividida del sistema: sin pliegue. Sin `sc`,
   * la ventana. Pura.
   */
  function plieguePantalla(w, h, sc, PG) {
    const sw = sc ? sc.w : w, sh = sc ? sc.h : h, corto = Math.min(sw, sh), largo = Math.max(sw, sh);
    if (corto < PG.ladoMin || largo / corto > PG.aspectoMax) return null;
    if (sw <= sh) return w >= sw - 2 ? { eje: 'x', pos: Math.round(w / 2), ancho: PG.ancho } : null;
    if (h >= sh - 2) return { eje: 'y', pos: Math.round(h / 2), ancho: PG.ancho };
    if (h < sh * 0.75) return null;
    return { eje: 'y', pos: Math.round(Math.max(h * 0.25, Math.min(h * 0.75, h - sh / 2))), ancho: PG.ancho };
  }

  // ===================================================================
  // Arranque
  // ===================================================================
  if (typeof addEventListener === 'function') {
    addEventListener('resize', () => {
      seguras = null;
      rehacerCompanero();
      tiraPestanas(true);
    });
  }
  if (doc) {
    prepararGacha();
    vigilarCreditos();
    aplicar();
  }

  return {
    get actual() { return actual; }, get dex() { return actual === 'dex'; },
    set, porDefecto, hud, colocarLogro, fuenteCanvas, cargarFuentes, descargaEnReposo, ajustes, carta, tipoDeCarta, companero, premio,
    destacado, encaje, animar, colocacion, disposicion, zonasSeguras, pantalla, plieguePantalla, ranurasEnColumna, capaProbabilidades, tabLibre,
    on(fn) { oyentes.add(fn); },
    TEXTO_ESTILO, TAM_COMPANERO, TAM_PREMIO, HORIZONTAL_PLEGABLE, tiraPestanas
  };
})();
