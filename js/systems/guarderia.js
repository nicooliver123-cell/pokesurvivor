/* ============ guarderia.js — guardería Pokémon (MOD nico) ============
 * Decisión de Nico (14-10-2026): una guardería con G.MODS.guarderiaPlazas (5) plazas. Dejar un Pokémon cuesta
 * G.MODS.guarderiaPrecio (500) Pokémonedas, cada vez que entra; sacarlo es gratis y conserva lo ganado. Por cada
 * G.MODS.guarderiaSegundosPorPunto (120 = 2 min) de run, cada Pokémon de la guardería gana 1 nivel en una de sus
 * mejoras de siempre (G.Upgrades, las de la pantalla Mejoras), al azar entre las que no están al máximo.
 *
 * Sólo cuenta el tiempo de las partidas de quien tiene la guardería: cada jugador reparte al acabar su run (sola o en
 * grupo) con su propia partida guardada, sin mandar nada por la red. Lo que sobra de 2 minutos se guarda para la
 * siguiente run, pero sólo mientras haya alguien en la guardería (si no, una guardería vacía acumularía tiempo).
 * Mi criterio, no venía en el encargo:
 *   - no reparte en una run que G.Guard da por sospechosa (como los récords);
 *   - no cuenta «Repertorio» (empezar con 2 movimientos): no es una estadística y vale 1.500 Pokémonedas;
 * Y (Nico, 14-10-2026) un Pokémon de la guardería no puede ser tu compañero: no se puede dejar al compañero, y en la
 * Pokédex el de la guardería dice «Está en la guardería» en vez de «Elegir de compañero».
 *
 * Datos en la partida: save.guarderia = { mons: [dex…], resto: segundos }. Las mejoras van a save.pupg, como las
 * compradas, así que la fusión de partidas (DB.merge: el máximo de cada mejora) no pierde nada.
 * Ganchos de una línea: game.js (endRun, alAcabar), menu.js (renderUpgrades, pintar; showDetail, marcarDex) y
 * run-ui.js (showOver, enFin).
 */
G.Guarderia = (() => {
  const M = () => G.MODS || {};
  const plazas = () => Math.max(0, M().guarderiaPlazas | 0);
  const precio = () => Math.max(0, M().guarderiaPrecio | 0);
  const segPunto = () => Math.max(1, M().guarderiaSegundosPorPunto | 0 || 120);
  const activa = () => plazas() > 0;
  const EXCLUIDAS = ['moves'];

  let ultimo = null;   // lo repartido al acabar la última run, para la pantalla del final

  function estado(save) {
    const g = save.guarderia = save.guarderia || { mons: [], resto: 0 };
    if (!Array.isArray(g.mons)) g.mons = [];
    g.mons = g.mons.filter((d, i, a) => G.DEX_BY && G.DEX_BY[d] && a.indexOf(d) === i).slice(0, plazas());
    g.resto = Math.max(0, +g.resto || 0);
    return g;
  }

  const esta = (save, dex) => estado(save).mons.includes(dex);

  /** Deja a `dex` en la guardería. → { ok } o { ok: false, error }. */
  function meter(save, dex) {
    const g = estado(save);
    if (!activa()) return { ok: false, error: 'La guardería está cerrada' };
    if (!save.owned || !save.owned[dex]) return { ok: false, error: 'No tienes ese Pokémon' };
    if (g.mons.includes(dex)) return { ok: false, error: 'Ya está en la guardería' };
    if (save.partner === dex) return { ok: false, error: 'Es tu compañero: elige otro antes' };
    if (g.mons.length >= plazas()) return { ok: false, error: 'La guardería está llena: saca a alguno antes' };
    if ((save.coins || 0) < precio()) return { ok: false, error: `Necesitas ${precio()} Pokémonedas` };
    save.coins -= precio();
    g.mons.push(dex);
    return { ok: true };
  }

  /** Saca a `dex` (gratis). Las mejoras ganadas se quedan. */
  function sacar(save, dex) {
    const g = estado(save);
    const i = g.mons.indexOf(dex);
    if (i < 0) return { ok: false, error: 'No está en la guardería' };
    g.mons.splice(i, 1);
    if (!g.mons.length) g.resto = 0;
    return { ok: true };
  }

  /** Reparte `segundos` de run. → [{ dex, mejoras: { id: niveles } }] (sólo los que han ganado algo). */
  function repartir(save, segundos, rnd = Math.random) {
    const g = estado(save);
    if (!activa() || !g.mons.length) { g.resto = 0; return []; }
    g.resto += Math.max(0, Math.floor(segundos || 0));
    const puntos = Math.floor(g.resto / segPunto());
    g.resto -= puntos * segPunto();
    const out = [];
    save.pupg = save.pupg || {};
    for (const dex of g.mons) {
      const lv = save.pupg[dex] = save.pupg[dex] || {};
      const ganadas = {};
      for (let k = 0; k < puntos; k++) {
        const libres = G.Upgrades.LIST.filter(u => !EXCLUIDAS.includes(u.id) && (lv[u.id] || 0) < u.max);
        if (!libres.length) break;
        const u = libres[Math.min(libres.length - 1, Math.floor(rnd() * libres.length))];
        lv[u.id] = (lv[u.id] || 0) + 1;
        ganadas[u.id] = (ganadas[u.id] || 0) + 1;
      }
      if (Object.keys(ganadas).length) out.push({ dex, mejoras: ganadas });
    }
    return out;
  }

  /** Gancho de game.js (endRun): reparte el tiempo de esta run si la partida está limpia. */
  function alAcabar(save, tiempo, limpia) {
    ultimo = null;
    if (!activa() || !save) return null;
    const g = estado(save);
    if (!g.mons.length) return null;
    ultimo = { ganado: limpia ? repartir(save, tiempo) : [], falta: segPunto() - g.resto, limpia: !!limpia };
    return ultimo;
  }

  // ---------------- interfaz ----------------

  /** Gancho de menu.js (showDetail, la ficha de la Pokédex): si `dex` está en la guardería, el botón «Elegir de
   *  compañero» pasa a «Está en la guardería», desactivado (sin él, menu.js no lo puede elegir). */
  function marcarDex(dex) {
    const pick = document.getElementById('dex-pick');
    if (!pick || !activa() || !G.DB.save || !esta(G.DB.save, dex)) return;
    const b = document.createElement('button');
    b.className = 'btn grow'; b.disabled = true; b.style.width = '100%';
    b.textContent = 'Está en la guardería';
    pick.replaceWith(b);
  }

  const nombreMejora = id => (G.Upgrades.BY[id] || { name: id }).name;
  const texto = mejoras => Object.entries(mejoras).map(([id, n]) => `+${n} ${nombreMejora(id)}`).join(', ');

  /** Gancho de run-ui.js (showOver): una fila con lo que ha ganado la guardería en esta run. */
  function enFin(caja) {
    const r = ultimo;
    ultimo = null;
    if (!r || !caja) return;
    const lineas = r.ganado.length ? '<div>' + r.ganado.map(x => `<b>${G.DEX_BY[x.dex].name}</b> ${texto(x.mejoras)}`).join(' · ') + '</div>' : '';   // en un párrafo: el fin de un móvil es bajo
    const pie = !r.limpia ? 'Esta partida no cuenta para la guardería.'
      : `Siguiente entrenamiento en ${G.U.mmss(r.falta)} de juego.`;
    caja.insertAdjacentHTML('beforeend', `<div style="grid-column:1/-1" class="guarderia-fin"><span>Guardería</span>
      ${lineas || '<div>Aún no han subido de nivel.</div>'}<div class="nota">${pie}</div></div>`);
  }

  /** Gancho de menu.js (renderUpgrades): el panel de la guardería en Mejoras. `dex`, el Pokémon elegido;
   *  `rehacer`, para volver a pintar la pantalla. */
  function pintar(dex, rehacer) {
    const lista = document.getElementById('upg-list');
    if (!lista) return;
    let panel = document.getElementById('guarderia');
    if (!activa()) { if (panel) panel.remove(); return; }
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'guarderia';
      panel.className = 'panel guarderia';
      lista.parentNode.insertBefore(panel, lista);
    }
    const save = G.DB.save, g = estado(save), dentro = g.mons.includes(dex);
    const mon = G.DEX_BY[dex];
    panel.innerHTML = `<div class="row between guarderia-cab">
        <b>Guardería <small>${g.mons.length} / ${plazas()}</small></b>
        <small>Cada ${Math.round(segPunto() / 60)} min de run, sube 1 nivel una mejora al azar de cada Pokémon que esté aquí.</small>
      </div>
      <div class="guarderia-plazas"></div>
      <div class="row guarderia-pie"></div>`;
    const huecos = panel.querySelector('.guarderia-plazas');
    for (let i = 0; i < plazas(); i++) {
      const d = g.mons[i];
      const h = document.createElement('div');
      h.className = 'guarderia-plaza' + (d ? '' : ' vacia') + (d === dex ? ' on' : '');
      if (d) {
        h.appendChild(G.UI.spriteCanvas(d, 72, 60, { scale: 2, lively: d === dex }));
        h.insertAdjacentHTML('beforeend', `<small>${G.DEX_BY[d].name}</small>`);
        h.title = G.DEX_BY[d].name;
        h.tabIndex = 0;
        h.onclick = () => { const sel = document.getElementById('upg-mon'); if (sel && sel.value !== String(d)) { sel.value = d; sel.onchange && sel.onchange(); } };
      } else h.innerHTML = '<small>Libre</small>';
      huecos.appendChild(h);
    }
    const pie = panel.querySelector('.guarderia-pie');
    const btn = document.createElement('button');
    if (dentro) {
      btn.className = 'btn small';
      btn.textContent = `Sacar a ${mon.name}`;
      btn.onclick = () => {
        const r = sacar(G.DB.save, dex);
        if (!r.ok) { G.Audio.sfx('error'); G.UI.toast(r.error); return; }
        G.DB.commit(true);
        G.Audio.sfx('back');
        G.UI.toast(`${mon.name} sale de la guardería`);
        rehacer();
      };
    } else {
      const llena = g.mons.length >= plazas(), pobre = (save.coins || 0) < precio(), companero = save.partner === dex;
      btn.className = 'btn small gold';
      btn.dataset.sfx = 'none';
      btn.innerHTML = `Dejar a ${mon.name} · <span class="coin"></span> ${precio()}`;
      btn.disabled = llena || pobre || companero;
      if (llena) btn.title = 'La guardería está llena: saca a alguno antes';
      btn.onclick = () => {
        const r = meter(G.DB.save, dex);
        if (!r.ok) { G.Audio.sfx('error'); G.UI.toast(r.error); return; }
        G.DB.commit(true);
        G.Audio.sfx('buy');
        G.UI.refreshCoins();
        G.UI.toast(`${mon.name} entra en la guardería`);
        rehacer();
      };
    }
    pie.appendChild(btn);
    if (!dentro && save.partner === dex) pie.insertAdjacentHTML('beforeend', '<small>Es tu compañero: no puede quedarse en la guardería.</small>');
    else if (!dentro && g.mons.length >= plazas()) pie.insertAdjacentHTML('beforeend', '<small>Está llena: saca a alguno antes.</small>');
  }

  return { estado, esta, meter, sacar, repartir, alAcabar, enFin, pintar, marcarDex, plazas, precio };
})();
