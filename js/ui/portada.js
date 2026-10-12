/* ============ portada.js — «Tarjeta de entrenador» del estilo Dex (MOD nico) ============
 * Variante C de la portada (elegida por Nico el 12-10-2026). El marcado de la tarjeta está en dev.html (#tc-card,
 * dentro de #scr-menu) y su aspecto en css/portada.css, sólo con Dex: en Clásico la tarjeta no se ve y el menú es
 * el del proyecto base. Aquí:
 *   - rellenar(): la tarjeta con la partida abierta (tu compañero, su nombre, sus tipos y su N.º, tu récord, tu mejor
 *     nivel, tu colección y tu cuenta). La llama G.Estilo.companero() (el gancho de menu.js al abrir el menú), cada
 *     cambio de estilo y cada cambio de tamaño de la tarjeta;
 *   - el compañero de la tarjeta, sin cortes (G.Estilo.animar): ×6 en escritorio, ×5 en un plegable abierto o una
 *     tableta y ×4 en un móvil (las medidas, --tc-lienzo-* y --tc-escala de css/portada.css), con su peana del color
 *     de su tipo bajo los pies;
 *   - «Jugar» enseña su subtítulo cuando estás en una sala (G.Social);
 *   - en los dos estilos: las pestañas Entrar / Crear cuenta se alcanzan con Tab y se eligen con Intro, espacio o
 *     las flechas (upstream las hace con <div>, sin foco); y, con Dex, los campos llevan su texto de ayuda (en un
 *     móvil las etiquetas se leen pero no se ven: css/portada.css).
 * Sólo lee la partida: no cambia nada ni manda nada por la red.
 */
G.Portada = (() => {
  const doc = typeof document !== 'undefined' ? document : null;
  const $ = id => (doc ? doc.getElementById(id) : null);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = s => (G.T ? G.T(s) : s);
  let espera = 0;

  /** [ancho, alto, escala máxima] del lienzo del compañero: las variables de css/portada.css (una sola fuente). */
  function medidas(card) {
    const cs = getComputedStyle(card), n = k => parseFloat(cs.getPropertyValue(k));
    return [n('--tc-lienzo-w') || 264, n('--tc-lienzo-h') || 264, n('--tc-escala') || 6];
  }

  /** El compañero de la tarjeta, sin cortes, y su peana bajo los pies (cuando se sabe dónde caen). */
  function companero(card, dex, shiny) {
    const cv = $('tc-partner');
    if (!cv || !G.Estilo || !G.Estilo.animar) return;
    const [w, h, k] = medidas(card);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    card.classList.remove('tc-listo');
    // De pie sobre la peana: sin las animaciones que bajan de los pies (un ataque hacia abajo lo subiría todo).
    G.Estilo.animar(cv, dex, { lively: true, shiny, kmax: k, bajoMax: 4 });
    cancelAnimationFrame(espera);
    const t0 = performance.now();
    const mirar = () => {
      const c = G.Estilo.colocacion(cv);
      if (c && c.dex === dex) {
        card.style.setProperty('--tc-pies-x', c.fx + 'px');
        card.style.setProperty('--tc-pies-b', (cv.height - c.fy) + 'px');
        card.style.setProperty('--tc-k', c.k);
        card.classList.add('tc-listo');
      } else if (performance.now() - t0 < 10000) espera = requestAnimationFrame(mirar);
    };
    mirar();
  }

  /** Rellena la tarjeta con la partida abierta. */
  function rellenar() {
    const card = $('tc-card'), s = G.DB && G.DB.save, mon = s && G.DEX_BY && G.DEX_BY[s.partner];
    if (!card || !mon) return;
    const shiny = !!s.partnerShiny && G.DB.ownsShiny(mon.dex);
    card.setAttribute('aria-label', T('Tu compañero'));
    card.style.setProperty('--tc-tipo', shiny ? '#9ae6ff' : G.U.TYPE_COLOR[mon.types[0]]);
    $('tc-mon').innerHTML = `<b class="tc-name">${esc(mon.name)}</b>` + (shiny ? G.Icons.html('shiny', 24) : '') +
      G.UI.typeChips(mon.types) + `<span class="tc-no">${esc(T('N.º'))} ${String(mon.dex).padStart(3, '0')}</span>`;

    const st = s.stats || {};
    const owned = Object.keys(s.owned || {}).filter(k => G.DEX_BY[k]).length;
    const ico = n => G.Icons.html(n, 24);
    // Iconos en vez de etiquetas cuando bastan (el trofeo es el de Ranking y el libro, el de Pokémon); la etiqueta, para
    // el lector de pantalla.
    const col = `<span class="tc-stat" title="${esc(T('Colección'))}">${ico('book')}<span class="tc-vh">Colección:</span><b>${owned.toLocaleString('es')} / ${G.DEX.length.toLocaleString('es')}</b></span>`;
    $('tc-stats').innerHTML = st.runs
      ? `<span class="tc-stat" title="${esc(T('Récord: tu partida más larga'))}">${ico('trophy')}<span class="tc-vh">Récord:</span><b>${G.U.mmss(st.bestTime || 0)}</b></span>` +
        `<span class="tc-stat tc-nivel">Mejor nivel <b>${st.bestLevel || 0}</b></span>` + col
      : `<span class="tc-stat tc-sin">Sin partidas todavía</span>` + col;

    const guest = !!G.DB.guest;
    const u = $('tc-user');
    u.innerHTML = G.Icons.html(guest ? 'user' : 'crown', 18) + `<span translate="no">${esc(guest ? T('Invitado') : (G.DB.user || ''))}</span>`;
    u.title = T('Tu perfil');
    u.setAttribute('aria-label', T('Tu perfil') + ': ' + (guest ? T('Invitado') : (G.DB.user || '')));
    $('tc-guest').textContent = guest ? 'Como invitado, tu partida no se guarda.' : '';
    sala();
    if (G.Estilo && G.Estilo.dex) companero(card, mon.dex, shiny);
  }

  /** En una sala, «Jugar» enseña su subtítulo («Volver a tu sala (2/4)»). */
  function sala() {
    const play = doc && doc.querySelector('#scr-menu [data-go=play]');
    if (play) play.classList.toggle('tc-sala', !!(G.Social && G.Social.room));
  }

  /** Inicio de sesión (los dos estilos): pestañas con foco y teclado, y el texto de ayuda de los campos. */
  function pestanas() {
    const lista = doc.querySelector('#scr-login .tabs');
    if (!lista) return;
    const tabs = [...lista.querySelectorAll('.tab')];
    lista.setAttribute('role', 'tablist');
    lista.setAttribute('aria-label', T('Entrar o crear cuenta'));
    const marcar = () => tabs.forEach(t => {
      const on = t.classList.contains('on');
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = 0;   // las dos con Tab (lo pidió Nico); además, las flechas cambian de una a otra
    });
    tabs.forEach((t, i) => {
      t.setAttribute('role', 'tab');
      t.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t.click(); }
        else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const otra = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
          otra.click(); otra.focus();
        }
      });
    });
    marcar();
    new MutationObserver(marcar).observe(lista, { subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  /** Con Dex, los campos llevan su texto de ayuda (en un móvil sus etiquetas no se ven); con Clásico, como upstream. */
  function ayudas() {
    for (const [id, txt] of [['f-user', 'Nombre'], ['f-pass', 'Contraseña']]) {
      const f = $(id);
      if (!f) continue;
      if (G.Estilo && G.Estilo.dex) f.placeholder = T(txt); else f.removeAttribute('placeholder');
    }
  }

  function init() {
    if (!doc) return;
    pestanas();
    ayudas();
    const u = $('tc-user');
    if (u) u.addEventListener('click', () => { if (G.GoalsUI) G.GoalsUI.open('profile'); });   // como la píldora de la barra superior
    if (G.Estilo && G.Estilo.on) G.Estilo.on(() => { ayudas(); if (G.DB && G.DB.save) rellenar(); });
    if (G.Social && G.Social.on) G.Social.on(sala);
    // Al cruzar un tamaño de css/portada.css (girar el plegable, la barra del navegador), el lienzo cambia de medida.
    const card = $('tc-card');
    if (card && typeof ResizeObserver === 'function') {
      let antes = '';
      new ResizeObserver(() => {
        if (!(G.Estilo && G.Estilo.dex) || !(G.DB && G.DB.save)) return;
        const m = medidas(card).join('x');
        if (m !== antes) { antes = m; rellenar(); }
      }).observe(card);
    }
  }
  if (doc) { if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init(); }

  return { rellenar, medidas };
})();
