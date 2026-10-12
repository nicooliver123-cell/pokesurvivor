/* ============ importar-ui.js — Ajustes > Cuenta: traer la partida del juego oficial (MOD nico) ============
 * La lógica está en js/core/importar.js. Aquí sólo la sección de Ajustes: los pasos, el código
 * para la consola del juego oficial (con botón Copiar), elegir el archivo, la vista previa y
 * Confirmar. js/ui/settings-ui.js la añade con dos ganchos "// MOD nico": html() al pintar la
 * pestaña Cuenta y wire() al conectar sus botones. El inglés va en js/data/lang-en-mod.js.
 */
G.ImportarUI = (() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let analisis = null;        // resultado de G.Importar.analizar() a la espera de Confirmar
  let aviso = null;           // { ok: bool, textos: [...] } (resultado o error)
  let trabajando = false;
  // Al cerrar sesión o borrar la cuenta no queda nada a medias para la siguiente cuenta.
  if (G.DB && G.DB.onLeave) G.DB.onLeave(() => { analisis = null; aviso = null; });

  const CSS = `
    .imp-pasos { margin: 4px 0 8px; padding-left: 22px; color: var(--muted); font-size: 14px; line-height: 1.5; }
    .imp-pasos li { margin: 2px 0; }
    .imp-code { display: block; width: 100%; box-sizing: border-box; min-height: 74px; max-height: 140px; resize: vertical;
      font: 11px/1.35 ui-monospace, Consolas, monospace; color: var(--ink); background: rgba(0,0,0,.35);
      border: 2px solid rgba(255,255,255,.18); border-radius: 8px; padding: 6px 8px; text-shadow: none; }
    .imp-prev { margin-top: 12px; padding: 4px 12px 10px; border: 2px solid rgba(255,255,255,.16); border-radius: 10px; background: rgba(0,0,0,.18); }
    .imp-msg { margin-top: 10px; font-size: 14px; } .imp-msg p { margin: 4px 0; }
    .imp-ok { color: #8be39a; } .imp-err { color: #ffb0b8; }`;
  function css() {
    if ($('imp-css')) return;
    const st = document.createElement('style');
    st.id = 'imp-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }

  const enRun = () => !!(G.Game && G.Game.state && G.Game.state !== 'ui');
  const fechaDMA = ms => { const d = new Date(ms); return [d.getDate(), d.getMonth() + 1].map(n => String(n).padStart(2, '0')).join('-') + '-' + d.getFullYear(); };
  const mas = n => (n > 0 ? '+' + n.toLocaleString('es') : '0');
  const nombrePk = dex => (G.DEX_BY[dex] || {}).name || ('#' + dex);

  /** HTML de la sección (lo llama settings-ui.js al pintar la pestaña Cuenta). */
  function html() { css(); return `<div id="imp-box">${cuerpo()}</div>`; }

  function cuerpo() {
    let h = `<h3 class="set-h">Traer partida del juego oficial</h3>`
      + `<p class="sub">Suma aquí tu colección, shinies, mejoras, logros, Pokémonedas y tickets del juego oficial. No se borra nada de lo que ya tienes.</p>`;
    if (G.DB.guest) h += `<p class="note imp-err">Estás jugando como invitado: lo que traigas no se guardará al salir. Mejor crea una cuenta antes (botón de arriba) y tráela después.</p>`;
    h += `<ol class="imp-pasos">
        <li>Abre pokesurvivor.com en un PC e inicia sesión con tu cuenta.</li>
        <li>Pulsa F12 y ve a la pestaña Consola. Si Chrome te pide escribir «permitir pegar» (o «allow pasting»), escríbelo y pulsa Enter.</li>
        <li>Copia este código, pégalo en la consola y pulsa Enter: se descargará un archivo con tu partida.</li>
        <li>Vuelve aquí, pulsa «Elegir archivo» y elige ese archivo.</li>
      </ol>
      <textarea id="imp-code" class="imp-code" readonly spellcheck="false" translate="no" aria-label="Código para la consola del juego oficial">${esc(G.Importar.EXPORTADOR)}</textarea>
      <div class="row wrap" style="gap:8px;margin-top:8px">
        <button class="btn small" id="imp-copy">Copiar</button>
        <button class="btn small gold" id="imp-pick" ${enRun() || trabajando ? 'disabled' : ''}>Elegir archivo</button>
        <input type="file" id="imp-file" accept=".json,application/json" hidden>
      </div>
      <p class="note">Los pasos 1 a 3 necesitan un PC: en el móvil no hay consola. Vale cualquier PC, porque tu partida oficial está en su nube: basta con entrar con tu cuenta. El código sólo lee tu partida y la descarga; no envía nada a ninguna parte.</p>
      <p class="note">Pega sólo este código, copiado de esta página: nunca pegues en la consola código que te pase otra persona. <a href="tools/nico/exportar-oficial.js" target="_blank" rel="noopener">Ver el código comentado</a></p>`;
    if (enRun()) h += `<p class="note imp-err">Para traer la partida, vuelve al menú: termina o abandona la run.</p>`;
    if (analisis && G.DB.save) h += previa();
    if (aviso) h += `<div class="imp-msg ${aviso.ok ? 'imp-ok' : 'imp-err'}">${aviso.textos.map(t => `<p>${esc(t)}</p>`).join('')}</div>`;
    return h;
  }

  function previa() {
    const R = analisis.resumen;
    const P = G.Importar.previsualizar(G.DB.save, analisis.save);
    if (P.error) return `<div class="imp-msg imp-err"><p>${esc(P.error)}</p></div>`;
    const C = P.cambios;
    const fila = (label, val) => `<div class="set-row"><div class="grow"><b>${esc(label)}</b></div><span class="gold">${val}</span></div>`;
    const si = (n, label) => (n > 0 ? fila(label, mas(n)) : '');
    const favs = C.favs && C.favs.length ? C.favs.map(f => esc(nombrePk(f.dex)) + (f.shiny ? ' ★' : '')).join(', ') : '';
    let h = `<div class="imp-prev"><h3 class="set-h">Vista previa</h3>`
      + fila('Partida oficial', `<span translate="no">${esc(R.nombre || '?')}</span>`)
      + (R.exportado ? fila('Exportada el', fechaDMA(R.exportado)) : '')
      + fila('Pokémon en esa partida', R.pokemon.toLocaleString('es'))
      + fila('Pokémon nuevos', mas(C.pokemon))
      + si(C.shinies, 'Shinies nuevos')
      + fila('Pokémonedas que se suman', mas(C.monedas))
      + si(C.t1, 'Tickets ×1 que se suman') + si(C.t10, 'Tickets ×10 que se suman')
      + si(C.legendarios, 'Legendarios vencidos nuevos') + si(C.logros, 'Logros nuevos')
      + si(C.arenas, 'Arenas ganadas nuevas') + si(C.objetos, 'Objetos nuevos')
      + si(C.movimientos, 'Movimientos evolucionados nuevos') + si(C.mejoras, 'Pokémon con mejoras subidas')
      + si(C.estadisticas, 'Récords y estadísticas mejorados')
      + si(C.pity, 'Banners con más tiradas sin legendaria')
      + (C.companero && C.companero.dex ? fila('Compañero', `<span translate="no">${esc(nombrePk(C.companero.dex))}${C.companero.shiny ? ' ★' : ''}</span>`) : '')
      + (favs ? fila('Favoritos del perfil', `<span translate="no">${favs}</span>`) : '')
      + (C.titulo ? fila('Título del perfil', esc(C.titulo)) : '');
    const notas = [];
    if (C.yaImportada) notas.push('Ya habías traído esta partida: sólo se suma lo que tenga de nuevo. De Pokémonedas y tickets, lo que tenga de más desde la última vez; tu compañero, tu perfil y el pity de los banners no cambian.');
    if (!C.algo) notas.push('No hay nada nuevo que traer.');
    notas.push('Tu apodo, tus misiones de hoy, tu personalidad y tu inicial no cambian.');
    for (const a of analisis.avisos) notas.push(a);
    h += notas.map(t => `<p class="note">${esc(t)}</p>`).join('')
      + `<div class="row wrap" style="gap:8px;margin-top:10px">
           <button class="btn small gold" id="imp-ok" ${!C.algo || trabajando || enRun() ? 'disabled' : ''}>Confirmar</button>
           <button class="btn small" id="imp-cancel">Cancelar</button>
         </div></div>`;
    return h;
  }

  /** Conecta los botones (lo llama settings-ui.js después de pintar). */
  function wire() {
    const code = $('imp-code'), copy = $('imp-copy'), pick = $('imp-pick'), file = $('imp-file');
    if (!code || !copy || !pick || !file) return;
    code.onclick = () => code.select();
    copy.onclick = () => copiar(copy, code);
    pick.onclick = () => { file.value = ''; file.click(); };
    file.onchange = () => elegido(file.files && file.files[0]);
    const ok = $('imp-ok'), no = $('imp-cancel');
    if (ok) ok.onclick = confirmar;
    if (no) no.onclick = () => { analisis = null; aviso = null; repintar(); };
  }

  function repintar() { const box = $('imp-box'); if (!box) return; box.innerHTML = cuerpo(); wire(); }

  async function copiar(btn, code) {
    let ok = false;
    try { await navigator.clipboard.writeText(G.Importar.EXPORTADOR); ok = true; }
    catch (e) { try { code.focus(); code.select(); ok = document.execCommand('copy'); } catch (e2) { /* nada */ } }
    btn.textContent = ok ? 'Copiado' : 'Selecciónalo y cópialo a mano';
    setTimeout(() => { if (btn.isConnected) btn.textContent = 'Copiar'; }, 2000);
  }

  async function elegido(f) {
    if (!f) return;
    analisis = null; aviso = null;
    if (f.size > G.Importar.MAX_BYTES) { aviso = { ok: false, textos: [G.Importar.TEXTOS.grande] }; return repintar(); }
    let texto;
    try { texto = await f.text(); }
    catch (e) { aviso = { ok: false, textos: ['No se ha podido leer el archivo.'] }; return repintar(); }
    const r = G.Importar.analizar(texto);
    // Una partida de esta misma cuenta (exportada desde aquí) no se trae: se dice ya, sin vista previa.
    if (r.ok && G.DB.save && G.Importar.esLaMisma(G.DB.save, r.save)) aviso = { ok: false, textos: [G.Importar.TEXTOS.propia] };
    else if (r.ok) analisis = r; else aviso = { ok: false, textos: [r.error] };
    repintar();
    const p = document.querySelector('#imp-box .imp-prev, #imp-box .imp-msg');
    if (p && p.scrollIntoView) p.scrollIntoView({ block: 'nearest' });
  }

  async function confirmar() {
    if (!analisis || trabajando) return;
    trabajando = true;
    const btn = $('imp-ok');
    if (btn) { btn.disabled = true; btn.textContent = 'Trayendo…'; }
    const r = G.Importar.aplicar(analisis.save);
    if (!r.ok) { trabajando = false; aviso = { ok: false, textos: [r.error] }; return repintar(); }
    analisis = null;
    const t = ['¡Hecho! Tu partida del juego oficial ya está aquí.'];
    if (r.invitado) t.push('Como eres invitado, se perderá al salir: crea una cuenta y vuelve a traerla.');
    else if (!r.nube) t.push(r.guardada ? 'Guardada en este navegador.' : 'No se ha podido guardar en este navegador (¿modo incógnito o sin espacio?).');
    else t.push('Subiendo a la nube…');
    t.push('Si vuelves a traerla más adelante, sólo se sumará lo nuevo.');
    aviso = { ok: r.guardada || r.invitado, textos: t };
    repintar();
    if (G.UI && G.UI.toast) G.UI.toast('Partida del juego oficial traída');
    // El menú de detrás (compañero, colección, monedas) se vuelve a pintar.
    if (G.UI && G.UI.isOpen && G.UI.isOpen('scr-menu') && G.MenuUI) { try { G.MenuUI.open(); } catch (e) { /* nada */ } }
    if (r.nube && !r.invitado) {
      try { await r.subida; } catch (e) { /* queda pendiente: la copia local ya está guardada */ }
      t[1] = G.DB.syncState === 'ok' ? 'Guardada y subida a la nube.' : 'Guardada en este dispositivo; se subirá a la nube en cuanto se pueda.';
    }
    trabajando = false;
    repintar();
  }

  return { html, wire };
})();
