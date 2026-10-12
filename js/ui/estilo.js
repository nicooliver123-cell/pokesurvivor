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
 *     animan en lienzos del tamaño en que se ven, a escala entera (nada escalado por CSS) y sin
 *     cortar ningún fotograma (sección 5); el compañero y el premio, más grandes que en upstream;
 *   - Tab recorre los menús (upstream lo anulaba siempre en input.js) y las cartas de subida de
 *     nivel se pueden enfocar (tabindex, role=button, Intro);
 *   - en el gacha de un móvil en horizontal, el botón «Probabilidades» abre el cartel como capa
 *     (css/nico.css lo enseña sólo en pantallas bajas).
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

  // ===================================================================
  // 3. Ajustes: la sección «Estilo» (la primera de Gráficos), créditos y controles
  // ===================================================================
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TEXTO_ESTILO = 'Dex: menús de Pokédex y letra redondeada. Clásico: el aspecto del juego original.';
  const ABAJO = 'Toca un ataque de abajo para cambiarlo', DERECHA = 'Toca un ataque de la derecha para cambiarlo';

  /** ¿Van las ranuras de ataque en columna a la derecha? (lo decidirá el HUD Dex del lote 2). */
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
    } else if (tab === 'ctl' && ranurasEnColumna()) {
      for (const p of box.querySelectorAll('p.sub')) if (p.textContent.includes(ABAJO)) p.textContent = p.textContent.replace(ABAJO, DERECHA);
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
   *  MARGEN px libres alrededor (Animator.draw redondea medio píxel y la sombra se suaviza). */
  const MARGEN = 2;
  function encaje(cajas, W, H, kmax, lively, sombra = true) {
    const somb = sombra ? [9, 0, 9, 3.4] : [0, 0, 0, 0], M2 = 2 * MARGEN;
    const cabe = (c, k) => k * (c[0] + c[2]) <= W - M2 && k * (c[1] + c[3]) <= H - M2;
    const idle = unir(cajas.Idle || [12, 24, 12, 2], somb);
    let k = Math.max(1, kmax | 0);
    while (k > 1 && !cabe(idle, k)) k--;
    let u = idle;
    const vida = [];
    if (lively) for (const a of VIDA) { if (!cajas[a]) continue; const v = unir(u, cajas[a]); if (cabe(v, k)) { u = v; vida.push(a); } }
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
  /** Anima `dex` en `cv` (que nadie más pinta) con el encaje de arriba. op: { lively, shiny, kmax, dir }. */
  function animar(cv, dex, op = {}) {
    for (const v of vivos) if (v.cv === cv) vivos.delete(v);
    const dir = op.dir || 0;
    const v = { cv, ctx: cv.getContext('2d'), dex, dir, lively: !!op.lively, shiny: !!op.shiny, t: Math.random() * 3, sparkT: 0, tw: [], a: null, e: null };
    vivos.add(v);
    const S = G.Sprites;
    const listo = () => {
      const cajas = {};
      for (const an of ['Idle', ...VIDA]) { const c = cajaDe(dex, an, v.shiny, dir); if (c) cajas[an] = c; }
      v.e = encaje(cajas, cv.width, cv.height, op.kmax || 2, v.lively);
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
    // En la tira de pestañas de una pantalla baja, la del banner elegido, a la vista.
    if (!viejo.previousElementSibling) { const on = doc.querySelector('#gacha-gens .gen-tab.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    animar(relevar(viejo), dex, { lively: true, kmax: 2, dir: 1 });
  }

  const TAM_COMPANERO = { escritorio: [320, 240], compacto: [208, 150] };
  let ultimoCompanero = null;
  /** menu.js, open(): el compañero del menú, en un lienzo de 320×240 (208×150 en pantallas bajas),
   *  hasta ×6. */
  function companero(cv, dex, op = {}) {
    if (!cv || !doc || !G.Sprites || !G.Sprites.Animator) return;
    const [w, h] = compacto() ? TAM_COMPANERO.compacto : TAM_COMPANERO.escritorio;
    const nuevo = relevar(cv, w, h);
    animar(nuevo, dex, { lively: true, shiny: !!op.shiny, kmax: 6 });
    ultimoCompanero = { cv: nuevo, dex, op };
  }

  /** gacha-ui.js, pull(): el premio, en un lienzo del tamaño en que se ve. Tirada ×1: 200×180 hasta
   *  ×4 (160×140 y ×3 en pantallas bajas); ×10: 132×120 hasta ×3 (96×76 y ×2). */
  function premio(card, r, n) {
    const viejo = card && card.querySelector('canvas');
    if (!viejo || !r || !doc || !G.Sprites || !G.Sprites.Animator) return;
    const bajo = compacto();
    const [w, h, kmax] = n === 1 ? (bajo ? [160, 140, 3] : [200, 180, 4]) : (bajo ? [96, 76, 2] : [132, 120, 3]);
    animar(relevar(viejo, w, h), r.dex, { lively: r.rarity >= 4 || !!r.shiny, shiny: !!r.shiny, kmax });
    card.classList.add(n === 1 ? 'premio-1' : 'premio-10');
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
   *  sólo se anula jugando sin ninguna pantalla encima. */
  function tabLibre() {
    if (!doc) return false;
    if (doc.querySelector('.scr:not(.hidden), #pull-fx:not(.hidden), #gacha-prob-capa:not(.hidden)')) return true;
    return !(G.Game && G.Game.state === 'playing');
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
   * Bandas del HUD y zona libre de una pantalla de w×h px CSS (pura: no mira la página salvo para
   * las zonas seguras si no se pasan). La usará el HUD Dex del lote 2 para colocar cada pieza, las
   * flechas de borde (dentro de la zona libre) y el encuadre (tu Pokémon en el centro de la zona
   * libre); con op.dividida, la pantalla dividida opcional estilo Nintendo DS.
   *
   * op: { seguras: {sup, der, inf, izq}, columnaIzq: px de la columna de compañeros y chips en
   *       compacto (0 si no hay nada), dividida: false | 'auto' | 'abajo' | 'arriba' | 'derecha' |
   *       'izquierda' (dónde van los CONTROLES; 'auto': abajo si la pantalla es casi cuadrada o alta,
   *       a la derecha si es apaisada), proporcion: parte de la pantalla para los controles (0,5) }
   * Devuelve { variante: 'escritorio' | 'compacto', escala, dividida, seguras,
   *            juego: {x, y, w, h}   el rectángulo donde se dibuja el mundo (toda la pantalla, o su mitad),
   *            controles: null | {x, y, w, h, lado}   la otra mitad (joystick, ranuras, HUD de datos),
   *            bandas: {sup, inf, izq, der}   lo que el HUD reserva DENTRO de `juego`,
   *            libre: {x, y, w, h}   `juego` menos las bandas,
   *            ranuras: 'fila' | 'columna' | 'controles' }
   * Cifras (G.MARCA.hud): escritorio, la pila central (contador, jefe y aviso) arriba y la fila de
   * ranuras con su píldora abajo, por la escala; compacto (alto < 520), filas adaptables al alto
   * arriba, nada abajo, ranuras en columna a la derecha (decisión de Nico) y la columna izquierda.
   */
  function disposicion(w, h, op = {}) {
    const M = MARCA(), H = M && M.hud;
    const s0 = op.seguras || zonasSeguras();
    const sg = { sup: s0.sup || 0, der: s0.der || 0, inf: s0.inf || 0, izq: s0.izq || 0 };
    let juego = { x: 0, y: 0, w, h }, controles = null, dividida = false;
    if (op.dividida) {
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
    const ALTO = (M && M.ALTO_COMPACTO) || 520;
    const esCompacto = juego.h < ALTO;
    const bandas = { sup: 0, inf: 0, izq: 0, der: 0 };
    let escala = 1, ranuras;
    if (esCompacto) {
      const A = (H && H.compacto.adaptable) || { fila1: [0.113, 36, 44], fila2: [0.077, 24, 30], margen: [6, 8], hueco: [4, 6], altoApretado: 360, ranuraApretada: 44 };
      const fila = ([k, mn, mx]) => Math.max(mn, Math.min(mx, Math.round(k * juego.h)));
      const apretado = juego.h < A.altoApretado;
      const margen = apretado ? A.margen[0] : A.margen[1], hueco = apretado ? A.hueco[0] : A.hueco[1];
      bandas.sup = Math.max(margen, sg.sup) + fila(A.fila1) + hueco + fila(A.fila2);
      if (dividida) ranuras = 'controles';
      else {
        const lado = apretado ? A.ranuraApretada : ((H && H.compacto.ranuras.lado) || 48);
        bandas.der = Math.max(margen, sg.der) + lado + ((H && H.compacto.ranuras.separacion) || 6);
        ranuras = 'columna';
      }
      const izq = Math.max(0, +op.columnaIzq || 0);
      if (izq) bandas.izq = Math.max(margen, sg.izq) + Math.min(izq, (H && H.compacto.columnaIzq.anchoMax) || 112);
      bandas.inf = 0;
    } else {
      escala = M ? M.escalaHUD(juego.w, juego.h) : 1;
      const E = H && H.escritorio;
      const u = v => Math.round(v * escala);
      const pila = E ? E.margen + E.contador.h + E.separacion + E.jefe.h + E.aviso.separacion + E.aviso.h : 176;
      bandas.sup = Math.max(u(E ? E.margen : 12), sg.sup) + u(pila - (E ? E.margen : 12));
      if (dividida) ranuras = 'controles';
      else {
        const R = E && E.ranuras;
        bandas.inf = Math.max(u(R ? R.margenAbajo : 16), sg.inf) + u(R ? R.lado + R.elevacionActiva + R.pildora.sobre : 88);
        ranuras = 'fila';
      }
    }
    const libre = { x: juego.x + bandas.izq, y: juego.y + bandas.sup, w: Math.max(0, juego.w - bandas.izq - bandas.der), h: Math.max(0, juego.h - bandas.sup - bandas.inf) };
    return { variante: esCompacto ? 'compacto' : 'escritorio', escala, dividida, seguras: sg, juego, controles, bandas, libre, ranuras };
  }

  // ===================================================================
  // Arranque
  // ===================================================================
  if (typeof addEventListener === 'function') {
    addEventListener('resize', () => {
      seguras = null;
      const u = ultimoCompanero;
      if (u && u.cv.isConnected && u.cv.offsetParent !== null) companero(u.cv, u.dex, u.op);
    });
  }
  if (doc) {
    prepararGacha();
    aplicar();
  }

  return {
    get actual() { return actual; }, get dex() { return actual === 'dex'; },
    set, porDefecto, fuenteCanvas, cargarFuentes, descargaEnReposo, ajustes, carta, tipoDeCarta, companero, premio,
    destacado, encaje, colocacion, disposicion, zonasSeguras, ranurasEnColumna, capaProbabilidades, tabLibre,
    on(fn) { oyentes.add(fn); },
    TEXTO_ESTILO, TAM_COMPANERO
  };
})();
