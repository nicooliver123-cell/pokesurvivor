/* ============ elegir-companero.js — sin el test de personalidad: «Elige a tu compañero» (MOD nico) ============
 * Petición de Nico (13-10-2026): «quita las preguntas del principio». Con G.MODS.sinTest, una partida sin compañero
 * (cuenta nueva o invitado) no pasa por las 8 preguntas de js/ui/test.js: va directa a esta pantalla, con los 29
 * iniciales de G.STARTERS (js/data/starters.js), cada uno con su sprite, su nombre y su tipo, «Al azar» y la
 * confirmación «Elegir a X». test.js de upstream no se toca: con sinTest = false todo sigue como antes.
 *
 * Gancho (// MOD nico): game.js, afterLogin(), una línea antes de la de upstream que abre el test.
 *
 * Reutiliza la pantalla de upstream #scr-starters (la de «Elegir otro», que ya está en la lista de pantallas de
 * G.UI): mientras la abre este fichero lleva la clase `sin-test`, que esconde la fila de upstream («Volver», su texto
 * y «Elegir») y enseña la nuestra (css/nico.css). En cuanto la pantalla se esconde se quita la clase, así que el
 * «Elegir otro» de upstream sigue igual si se vuelve a usar el test.
 *
 * Rejilla: disposicion(), pura (la prueba tools/nico/check.js §19), elige columnas y escala para que quepan los 29
 * sin desplazar: el sprite a un número entero de píxeles físicos por píxel de arte (nítido, como el píxel nítido del
 * juego) y lo más grande posible hasta 2,5 px CSS por píxel de arte (los pinta este fichero, en su animación Idle).
 * Los tipos van en píldoras con su nombre (G.UI.typeChips) en una línea o, si no caben, en dos; si así los Pokémon
 * quedarían mucho más pequeños, con su emblema (G.Icons 'type:…'), y el nombre del tipo va en la etiqueta accesible,
 * en el título y abajo al elegir. Si ni así cabe (una ventana muy pequeña), la rejilla se desplaza dentro de la caja.
 *
 * Teclado: la rejilla es un grupo de opciones (role radiogroup, una sola parada de Tab): las flechas mueven y eligen,
 * Inicio y Fin van al primero y al último, Espacio elige e Intro elige y lleva el foco a «Elegir a X» (otro Intro
 * confirma). Al confirmar, lo mismo que el test de upstream: inicial y compañero, personalidad null, el Pokémon en la
 * colección (el logro «Primer compañero» sale solo) y al menú.
 */
G.ElegirCompanero = (() => {
  // El recuadro de cada sprite, en píxeles de arte, medido sobre los 29 iniciales en su animación Idle (13-10-2026): la
  // cabeza más alta sube 26,5 sobre los pies (Totodile) y lo que más baja, 6 (la cola de Slowpoke; la sombra, 3,4); de
  // ancho, 21 como mucho (con la sombra, 18). Los pinta este fichero: G.UI.sprite pone los pies al 88 % del lienzo, y
  // para que cupiera la cola de Slowpoke el recuadro tendría que medir 54 de alto.
  const PIES = 28;         // de arriba a los pies
  const ALTO_ARTE = 35;    // alto del recuadro (7 por debajo de los pies)
  const ANCHO_ARTE = 24;   // ancho que tiene que caber en la celda
  const ANCHO_LIENZO = 32; // ancho del lienzo si la celda lo permite
  const A_MAX = 2.5;       // px CSS por píxel de arte, como mucho (la colección usa 2)
  const A_MIN = 1;         // por debajo, la rejilla se desplaza
  // Cuánto vale cada forma de enseñar el tipo frente al tamaño del sprite: con el nombre del tipo, mejor; los
  // emblemas sólo ganan si el Pokémon sale al menos un 20 % más grande que con los nombres (un 21 % con dos líneas).
  const PESO = { texto: 1, texto2: 0.97, emblema: 0.8 };

  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const T = s => (G.T ? G.T(s) : s);

  let sec = null, grid = null, pie = null, abierta = false, sel = null, foco = 0, disp = null, raf = 0;

  const activo = () => !!(G.MODS && G.MODS.sinTest);
  const tipos = dex => (G.DEX_BY[dex] ? G.DEX_BY[dex].types : []);
  const nombreTipos = dex => tipos(dex).map(t => (G.U.TYPE_NAME && G.U.TYPE_NAME[t]) || t);

  /**
   * Columnas y escala de la rejilla para que quepan `m.n` celdas en `m.ancho` x `m.alto` px CSS (pura).
   *   m: { ancho, alto, n, dpr, hueco, nombre (ancho del nombre más largo), tipo1 (la píldora más ancha),
   *        tipo2 (las píldoras de un Pokémon en una línea, el más ancho), emblemas (los emblemas, el más ancho),
   *        relleno (alto de bordes, relleno y huecos de la celda), rellenoH (ancho de bordes y relleno),
   *        lineaNombre, lineaTipo, lineaTipo2 (altos del nombre y de una y dos líneas de tipos: css/nico.css) }
   * Devuelve { cols, filas, k (px físicos por píxel de arte, entero), a (px CSS por píxel de arte = k / dpr),
   *   modo ('texto' | 'texto2' | 'emblema'), lineas, celdaW, celdaH, altoRejilla, cabe }.
   * Elige el que da la mejor nota (a por el peso del modo); a igualdad, la rejilla más baja y la que deja menos
   * huecos vacíos. Si nada cabe con a ≥ A_MIN, emblemas a A_MIN y cabe = false (la rejilla se desplaza).
   */
  function disposicion(m) {
    const dpr = m.dpr > 0 ? m.dpr : 1, hueco = m.hueco || 0;
    let mejor = null;
    for (let cols = 1; cols <= m.n; cols++) {
      const filas = Math.ceil(m.n / cols);
      const celdaW = (m.ancho - (cols - 1) * hueco) / cols;
      const altoCelda = (m.alto - (filas - 1) * hueco) / filas;
      for (const modo of ['texto', 'texto2', 'emblema']) {
        const lineas = modo === 'texto2' ? 2 : 1;
        const tipoW = modo === 'texto' ? m.tipo2 : modo === 'texto2' ? m.tipo1 : m.emblemas;
        if (celdaW - m.rellenoH < Math.max(m.nombre, tipoW)) continue;
        const fijo = m.relleno + m.lineaNombre + (lineas === 2 ? m.lineaTipo2 : m.lineaTipo);
        const aMax = Math.min(A_MAX, (altoCelda - fijo) / ALTO_ARTE, (celdaW - m.rellenoH) / ANCHO_ARTE);
        const k = Math.floor(aMax * dpr + 1e-9);
        if (k < 1 || k / dpr < A_MIN - 1e-9) continue;
        const a = k / dpr, celdaH = fijo + ALTO_ARTE * a;
        const c = { cols, filas, k, a, modo, lineas, celdaW, celdaH, altoRejilla: filas * celdaH + (filas - 1) * hueco, cabe: true,
          nota: a * PESO[modo], vacios: cols * filas - m.n };
        if (!mejor || c.nota > mejor.nota + 1e-9 || (Math.abs(c.nota - mejor.nota) <= 1e-9 &&
            (c.altoRejilla < mejor.altoRejilla - 0.5 || (Math.abs(c.altoRejilla - mejor.altoRejilla) <= 0.5 && c.vacios < mejor.vacios)))) mejor = c;
      }
    }
    if (mejor) return mejor;
    const k = Math.max(1, Math.round(A_MIN * dpr)), a = k / dpr;
    const necesita = Math.max(m.nombre, m.emblemas, ANCHO_ARTE * a) + m.rellenoH;
    const cols = Math.max(1, Math.min(m.n, Math.floor((m.ancho + hueco) / (necesita + hueco))));
    const filas = Math.ceil(m.n / cols), celdaH = m.relleno + m.lineaNombre + m.lineaTipo + ALTO_ARTE * a;
    return { cols, filas, k, a, modo: 'emblema', lineas: 1, celdaW: (m.ancho - (cols - 1) * hueco) / cols, celdaH,
      altoRejilla: filas * celdaH + (filas - 1) * hueco, cabe: false, nota: 0, vacios: cols * filas - m.n };
  }

  // ---------------- la pantalla ----------------

  /** Una vez: nuestra fila (Al azar, lo elegido y Elegir a X) y el vigilante que suelta la pantalla al esconderse. */
  function preparar() {
    if (sec) return true;
    sec = $('scr-starters'); grid = $('starter-grid');
    const box = sec && sec.querySelector('.box');
    if (!box || !grid) { sec = null; return false; }
    pie = document.createElement('div');
    pie.className = 'ec-pie';
    pie.innerHTML = `<button id="ec-azar" class="btn" type="button" data-sfx="select">${G.Icons.html('ball', 18)} <span>Al azar</span></button>` +
      '<span id="ec-info" class="grow" aria-live="polite"></span>' +
      '<button id="ec-ok" class="btn gold" type="button" data-sfx="confirm" disabled>Elegir</button>';
    box.appendChild(pie);
    $('ec-azar').onclick = azar;
    $('ec-ok').onclick = () => confirmar();
    grid.addEventListener('keydown', tecla);
    new MutationObserver(() => { if (abierta && sec.classList.contains('hidden')) soltar(); })
      .observe(sec, { attributes: true, attributeFilter: ['class'] });
    return true;
  }

  /** Abre la pantalla (game.js, afterLogin, sin compañero). */
  function abrir() {
    if (!preparar()) { G.TestUI.start(); return; }   // sin la pantalla de upstream, el test de siempre
    sel = null; foco = 0;
    G.UI.chrome(false);
    sec.classList.add('sin-test');
    grid.setAttribute('role', 'radiogroup');
    grid.setAttribute('aria-label', 'Iniciales');
    abierta = true;
    G.UI.show('scr-starters');
    pintarInfo();
    colocar();
    addEventListener('resize', alCambiar);
    if (window.visualViewport) visualViewport.addEventListener('resize', alCambiar);
    // La letra puede llegar después (Pixelify en Clásico, M PLUS Rounded 1c en Dex): con otra letra, otros anchos.
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', alCambiar);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (abierta) colocar(); });
    const c = celdas()[0];
    if (c) c.focus({ preventScroll: true });
  }

  /** La pantalla se ha escondido (al confirmar o por otra pantalla): vuelve a ser la de upstream. */
  function soltar() {
    abierta = false;
    sec.classList.remove('sin-test');
    grid.removeAttribute('role'); grid.removeAttribute('aria-label');
    grid.style.cssText = '';
    removeEventListener('resize', alCambiar);
    if (window.visualViewport) visualViewport.removeEventListener('resize', alCambiar);
    if (document.fonts && document.fonts.removeEventListener) document.fonts.removeEventListener('loadingdone', alCambiar);
    cancelAnimationFrame(raf);
    cancelAnimationFrame(rafSprites); rafSprites = 0; sprites = [];
  }

  function alCambiar() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { if (abierta) colocar(); });
  }

  const celdas = () => [...grid.querySelectorAll('.ec-celda')];

  // ---------------- sprites ----------------
  let sprites = [], rafSprites = 0, tPrev = 0;
  /** Un sprite en su lienzo: Idle mirando abajo, como la colección, con los pies a PIES píxeles de arte de arriba. */
  function nuevoSprite(cv, dex, k) {
    const a = new G.Sprites.Animator(dex, k / G.Sprites.PX, false);
    a.dir = 0;
    a.loop('Idle');
    a.update(Math.random() * 2);   // cada uno en un momento de su animación
    return { cv, ctx: cv.getContext('2d'), a, k };
  }
  function pintarSprite({ cv, ctx, a, k }) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.imageSmoothingEnabled = false;
    const fx = Math.round(cv.width / 2), fy = PIES * k;
    ctx.fillStyle = 'rgba(0,0,0,.35)';   // la sombra de ui.js
    ctx.beginPath(); ctx.ellipse(fx, fy, 9 * k, 3.4 * k, 0, 0, 6.2832); ctx.fill();
    a.draw(ctx, fx, fy);
  }
  function bucle(t) {
    const dt = tPrev ? Math.min(0.1, (t - tPrev) / 1000) : 0;
    tPrev = t;
    for (const s of sprites) { s.a.update(dt); pintarSprite(s); }
    rafSprites = abierta ? requestAnimationFrame(bucle) : 0;
  }
  function animar() { if (!rafSprites && abierta) { tPrev = 0; rafSprites = requestAnimationFrame(bucle); } }

  /** Las celdas sin tamaño (para medir) o con el de la disposición `d`. */
  function pintarCeldas(d) {
    grid.innerHTML = '';
    sprites = [];
    G.STARTERS.forEach((s, i) => {
      const mon = G.DEX_BY[s.dex];
      if (!mon) return;
      const nt = nombreTipos(s.dex);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cell ec-celda' + (sel === s.dex ? ' on' : '');
      b.dataset.dex = s.dex;
      b.dataset.sfx = 'select';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', sel === s.dex ? 'true' : 'false');
      b.setAttribute('aria-label', `${mon.name} (${nt.join(', ')})`);
      b.title = `${mon.name} · ${nt.join(' / ')}`;
      b.tabIndex = i === foco ? 0 : -1;
      if (d) {
        const dpr = window.devicePixelRatio || 1;
        const cw = Math.max(1, Math.floor(Math.min(d.celdaW - medidas.rellenoH, ANCHO_LIENZO * d.a) * dpr));
        const cv = document.createElement('canvas');
        cv.width = cw; cv.height = ALTO_ARTE * d.k;
        cv.style.width = cw / dpr + 'px'; cv.style.height = ALTO_ARTE * d.k / dpr + 'px';
        b.appendChild(cv);
        sprites.push(nuevoSprite(cv, s.dex, d.k));
      }
      b.insertAdjacentHTML('beforeend', `<b translate="no">${esc(mon.name)}</b><span class="ec-tipos">` +
        `<span class="ec-txt">${G.UI.typeChips(mon.types)}</span>` +
        `<span class="ec-emb">${mon.types.map(t => G.Icons.html('type:' + t, 14)).join('')}</span></span>`);
      b.onclick = () => elegir(s.dex, i);
      grid.appendChild(b);
    });
  }

  let medidas = { rellenoH: 6 };
  /** Mide lo que necesita cada celda con la letra y la piel de ahora (los dos estilos, los dos idiomas). */
  function medir() {
    pintarCeldas(null);
    grid.classList.add('ec-midiendo');
    const cs = celdas();
    let nombre = 0, tipo1 = 0, tipo2 = 0, emblemas = 0;
    // Con .ec-midiendo (css/nico.css) la rejilla va en una columna y el nombre, las píldoras en una línea y los
    // emblemas miden lo que su contenido. La caja entra con la animación `pop` de upstream (scale .94 → 1): los
    // rectángulos se dividen por su escala de ese momento para medir el tamaño de verdad.
    const box = sec.querySelector('.box');
    const escala = box.offsetWidth > 0 ? box.getBoundingClientRect().width / box.offsetWidth || 1 : 1;
    const w = el => el.getBoundingClientRect().width / escala;
    for (const c of cs) {
      nombre = Math.max(nombre, w(c.querySelector('b')));
      const txt = c.querySelector('.ec-txt');
      tipo2 = Math.max(tipo2, w(txt));
      for (const p of txt.children) tipo1 = Math.max(tipo1, w(p));
      emblemas = Math.max(emblemas, w(c.querySelector('.ec-emb')));
    }
    const st = cs[0] ? getComputedStyle(cs[0]) : null, px = v => parseFloat(v) || 0;
    const relleno = st ? px(st.paddingTop) + px(st.paddingBottom) + px(st.borderTopWidth) + px(st.borderBottomWidth) + 2 * px(st.rowGap) : 10;
    const rellenoH = st ? px(st.paddingLeft) + px(st.paddingRight) + px(st.borderLeftWidth) + px(st.borderRightWidth) : 6;
    grid.classList.remove('ec-midiendo');
    // Sitio de la rejilla: lo que queda de la pantalla sin la rejilla (título, fila de abajo, rellenos).
    const gs = getComputedStyle(grid), ss = getComputedStyle(sec);
    grid.style.display = 'none';
    const resto = box.offsetHeight;
    grid.style.display = '';
    const altoSec = sec.clientHeight - px(ss.paddingTop) - px(ss.paddingBottom);
    const pad = px(gs.paddingTop) + px(gs.paddingBottom);
    const v = (k, d) => px(gs.getPropertyValue(k)) || d;
    medidas = {
      ancho: grid.clientWidth - px(gs.paddingLeft) - px(gs.paddingRight), alto: Math.floor(altoSec - resto - pad - 1),
      n: cs.length, dpr: window.devicePixelRatio || 1, hueco: px(gs.columnGap),
      // 1 px de margen: los anchos con decimales, redondeados al pintar, no deben partir una línea.
      nombre: Math.ceil(nombre) + 1, tipo1: Math.ceil(tipo1) + 1, tipo2: Math.ceil(tipo2) + 1, emblemas: Math.ceil(emblemas), relleno, rellenoH,
      lineaNombre: v('--ec-nombre', 16), lineaTipo: v('--ec-tipo', 15), lineaTipo2: v('--ec-tipo2', 31)
    };
    return medidas;
  }

  /** Mide, elige la disposición y pinta (al abrir, al cambiar de tamaño y cuando llega la letra). */
  function colocar() {
    if (!abierta) return;
    const fc = document.activeElement && document.activeElement.closest && document.activeElement.closest('.ec-celda');
    const m = medir();
    const d = disposicion(m);
    disp = d;
    grid.style.setProperty('--ec-cols', d.cols);
    grid.classList.toggle('ec-texto', d.modo === 'texto');
    grid.classList.toggle('ec-texto2', d.modo === 'texto2');
    grid.classList.toggle('ec-emblema', d.modo === 'emblema');
    grid.classList.toggle('ec-desplaza', !d.cabe);
    grid.style.maxHeight = d.cabe ? '' : Math.max(80, m.alto) + 'px';
    pintarCeldas(d);
    for (const sp of sprites) pintarSprite(sp);
    animar();
    if (fc) { const c = celdas()[foco]; if (c) c.focus({ preventScroll: true }); }
  }

  // ---------------- elegir y confirmar ----------------

  function elegir(dex, i, enfocar) {
    sel = dex; foco = i;
    for (const [j, c] of celdas().entries()) {
      const on = +c.dataset.dex === dex;
      c.classList.toggle('on', on);
      c.setAttribute('aria-checked', on ? 'true' : 'false');
      c.tabIndex = j === i ? 0 : -1;
    }
    if (enfocar) { const c = celdas()[i]; if (c) { c.focus({ preventScroll: true }); c.scrollIntoView({ block: 'nearest' }); } }
    pintarInfo();
  }

  function pintarInfo() {
    const ok = $('ec-ok'), info = $('ec-info');
    if (!ok || !info) return;
    const mon = sel && G.DEX_BY[sel];
    ok.disabled = !mon;
    ok.textContent = mon ? `Elegir a ${mon.name}` : 'Elegir';
    if (!mon) { info.textContent = 'Elige uno o déjalo al azar.'; return; }
    const s = G.STARTER_BY[sel], mv = s && G.Moves.BY_ID[s.start];
    info.innerHTML = G.UI.typeChips(mon.types) + (mv ? `<span class="ec-mov">${G.Icons.html('move:' + s.start, 16)} ${esc(mv.name)}</span>` : '');
  }

  /** «Al azar»: uno distinto del que está elegido (no confirma). */
  function azar() {
    const lista = G.STARTERS.filter(s => G.DEX_BY[s.dex] && s.dex !== sel);
    if (!lista.length) return;
    const s = G.U.pick(lista);
    elegir(s.dex, G.STARTERS.indexOf(s), false);
    const c = celdas()[foco];
    if (c) c.scrollIntoView({ block: 'nearest' });
  }

  /** Confirma (el botón «Elegir a X»; `dex`, para la prueba): lo que hacía choose() de test.js, con la personalidad en null. */
  function confirmar(dex = sel) {
    if (!dex || !G.DEX_BY[dex] || !G.STARTER_BY[dex]) return false;
    const save = G.DB.save;
    save.starter = dex;
    save.partner = dex;
    save.personality = null;
    G.DB.grant(dex, 'starter');
    G.DB.commit();
    G.UI.toast('¡' + G.DEX_BY[dex].name + ' se une a ti!');
    G.Flow.goMenu();
    return true;
  }

  /** Teclado de la rejilla (grupo de opciones). input.js anula flechas y espacio en window: aquí se usan antes. */
  function tecla(e) {
    const cs = celdas();
    const i = cs.indexOf(e.target.closest && e.target.closest('.ec-celda'));
    if (i < 0) return;
    const cols = disp ? disp.cols : 1, n = cs.length;
    let j = null;
    switch (e.key) {
      case 'ArrowRight': j = (i + 1) % n; break;
      case 'ArrowLeft': j = (i - 1 + n) % n; break;
      // Abajo y arriba, por columnas; en la última fila (incompleta), abajo lleva al último si está en la fila siguiente.
      case 'ArrowDown': j = i + cols < n ? i + cols : Math.floor((n - 1) / cols) > Math.floor(i / cols) ? n - 1 : i; break;
      case 'ArrowUp': j = i - cols >= 0 ? i - cols : i; break;
      case 'Home': j = 0; break;
      case 'End': j = n - 1; break;
      case ' ': case 'Spacebar': j = i; break;
      case 'Enter': {
        e.preventDefault();
        elegir(+cs[i].dataset.dex, i, false);
        const ok = $('ec-ok');
        if (ok) ok.focus();
        return;
      }
      default: return;
    }
    e.preventDefault();
    if (G.Audio && j !== i) G.Audio.sfx('select');
    elegir(+cs[j].dataset.dex, j, true);
  }

  return {
    activo, abrir, disposicion, confirmar, azar, recolocar: colocar,
    get abierta() { return abierta; },
    get elegido() { return sel; },
    get disp() { return disp; },
    get medidas() { return medidas; },
    ALTO_ARTE, ANCHO_ARTE, PIES, A_MAX, A_MIN
  };
})();
