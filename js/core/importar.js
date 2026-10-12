/* ============ importar.js — traer la partida del juego oficial (MOD nico) ============
 * El jugador saca su partida del juego oficial con un fragmento que pega ÉL MISMO en la consola
 * de su navegador, en la web oficial y con su sesión iniciada (EXPORTADOR, igual que
 * tools/nico/exportar-oficial.js). Ese fragmento sólo lee la partida que ya tiene su navegador
 * y la descarga como archivo; no envía nada ni cambia nada.
 * Esta versión NUNCA habla con la infraestructura del original: sólo lee el archivo .json que
 * elige el jugador (Ajustes > Cuenta, js/ui/importar-ui.js).
 *
 *   analizar(texto)                  -> { ok:false, error } | { ok:true, resumen, avisos, save }   (pura)
 *   esLaMisma(actual, oficial)       -> ¿el archivo es esta misma partida? (mismo `created`)
 *   fusionar(actual, oficial, ahora) -> partida nueva (pura: no toca ninguna de las dos)
 *   comparar(actual, nueva, oficial) -> qué cambia, para la vista previa (pura)
 *   previsualizar(actual, oficial)   -> { nueva, cambios } | { error }
 *   aplicar(oficial)                 -> fusiona con la partida abierta y la guarda como cualquier
 *                                       otro cambio: en local, en este navegador; en la nube, con
 *                                       la subida normal de js/core/db.js (transacción con merge()).
 *
 * Sólo se aceptan partidas del juego oficial. Una partida de ESTA versión (el fragmento pegado en
 * su propia consola, o un ps.save.* / ps.cloud.* suyo) se rechaza: sus monedas ya incluyen lo
 * acreditado antes y traerla otra vez lo volvería a sumar. Se reconoce porque lleva el registro
 * `importOficial` (sólo lo escribe esta versión), porque el archivo dice que se exportó desde esta
 * misma web o porque su `created` es el de la partida abierta. El propio fragmento, además, se
 * niega a funcionar si se pega aquí. Es una protección para el uso honrado, no antitrampas: el
 * archivo lo controla el jugador (y la partida abierta también, desde la consola).
 *
 * Saneado: sólo las claves de newSave() (+ pupgDone); dex que existan en la Pokédex; ids que
 * existan en el juego (mejoras, objetos, movimientos, logros, tipos, banners, títulos); números
 * finitos >= 0 con topes; objetos donde toca. Lo demás se descarta y se cuenta. El JSON se lee
 * con JSON.parse y las claves sólo se copian si están en esas listas (nada de __proto__).
 */
G.Importar = (() => {
  const TIPO = 'pokesurvivor-partida', VERSION_ARCHIVO = 1;
  const MAX_BYTES = 2 * 1024 * 1024;          // una partida completa ronda los 50-100 KB
  const MAX_MONEDAS = 1e9, MAX_TICKETS = 1e6, MAX_STAT = 1e9, MAX_FAVS = 3;
  const MAX_FECHA = Date.UTC(2100, 0, 1);
  const REGISTRO = 'importOficial';           // en la partida: created de la oficial -> lo ya acreditado

  // El fragmento para la consola del juego oficial. Una línea, sin dependencias, sin red. Es
  // tools/nico/exportar-oficial.js (la versión comentada) sin comentarios ni sangría: tools/nico/check.js
  // comprueba que coinciden, que no usa fetch/XMLHttpRequest/sendBeacon/WebSocket ni URLs (de navigator,
  // sólo el idioma) y que no modifica la partida.
  const EXPORTADOR = `(() => { const g = typeof G === 'object' && G ? G : window.G, db = g && g.DB; const es = String(typeof navigator === 'object' && navigator && navigator.language || 'es').toLowerCase().startsWith('es'), T = (a, b) => (es ? a : b); if (g && g.Importar && g.Importar.TIPO === 'pokesurvivor-partida') return alert(T('Esta página es la versión modificada, no el juego oficial. Pega este código en la consola del juego oficial, con tu cuenta iniciada.', 'This page is the modified version, not the official game. Paste this code into the console of the official game, signed in to your account.')); if (db && db.guest) return alert(T('Estás jugando como invitado. Inicia sesión con tu cuenta en el juego y vuelve a pegar esto.', 'You are playing as a guest. Sign in to your account in the game and paste this again.')); let s = db && db.save; if (!s && !(db && 'save' in db)) { try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ''; if (!k.startsWith('ps.cloud.') && !k.startsWith('ps.save.')) continue; try { const v = JSON.parse(localStorage.getItem(k)); if (v && v.owned && (!s || (v.updated || 0) > (s.updated || 0))) s = v; } catch (e) {} } } catch (e) {} } if (!s || typeof s !== 'object' || !s.owned) return alert(T('No encuentro tu partida. Inicia sesión con tu cuenta en el juego (no como invitado), espera a ver el menú y vuelve a pegar esto.', 'Your save was not found. Sign in to your account in the game (not as a guest), wait until you see the menu and paste this again.')); const nombre = String(s.name || 'jugador').replace(/[^a-z0-9ñáéíóúü_-]+/gi, '_'), d = new Date(), dd = n => String(n).padStart(2, '0'), fecha = d.getFullYear() + '-' + dd(d.getMonth() + 1) + '-' + dd(d.getDate()); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ tipo: 'pokesurvivor-partida', version: 1, origen: location.host, exportado: Date.now(), save: s })], { type: 'application/json' })); a.download = 'pokesurvivor-partida-' + nombre + '-' + fecha + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 10000); console.log(T('Partida exportada: ', 'Save exported: ') + Object.keys(s.owned).length + T(' Pokémon en ', ' Pokémon in ') + a.download + T('. Ya puedes cerrar la consola.', '. You can close the console now.')); })();`;

  const TEXTOS = {
    vacio: 'El archivo está vacío.',
    grande: 'El archivo es demasiado grande para ser una partida (máximo 2 MB).',
    json: 'El archivo no es un JSON válido: usa el que descarga el código, sin editarlo.',
    tipo: 'Este archivo no es una partida de PokéSurvivor.',
    version: 'Este archivo es de una versión más nueva del exportador: actualiza esta página y vuelve a probar.',
    creada: 'La partida no tiene una fecha de creación válida.',
    propia: 'Este archivo es una partida de esta versión, no del juego oficial: el código hay que pegarlo en la consola de pokesurvivor.com, con tu cuenta iniciada.',
    sinPartida: 'No hay ninguna partida abierta.',
    enRun: 'Para traer la partida, vuelve al menú: termina o abandona la run.',
    descartados: '{x} datos no reconocidos se han descartado.',
    ajustados: '{x} números fuera de rango se han ajustado.',
    nueva: 'La partida es de una versión más nueva del juego oficial: se trae lo que esta versión reconoce.'
  };

  const esObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const tiene = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
  const copia = v => JSON.parse(JSON.stringify(v));
  const n0 = v => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

  // ---------------- catálogos del juego (para validar ids) ----------------
  function catalogos() {
    const lista = (o, k) => (o && Array.isArray(o[k]) ? o[k] : []);
    return {
      dex: d => typeof d === 'string' ? /^[1-9]\d{0,3}$/.test(d) && tiene(G.DEX_BY, +d) : Number.isInteger(d) && d > 0 && tiene(G.DEX_BY, d),
      mejora: id => tiene(G.Upgrades && G.Upgrades.BY, id),
      maxMejora: id => +G.Upgrades.BY[id].max || 0,
      objeto: id => tiene(G.Items && G.Items.BY, id),
      movimiento: id => tiene(G.Moves && G.Moves.EVO, id),
      logro: id => tiene(G.AchDefs && G.AchDefs.BY, id),
      tipo: id => tiene(G.Types && G.Types.CHART, id),
      banner: id => lista(G.Gacha, 'BANNERS').some(b => String(b.gen) === id),
      maxPity: (G.Gacha && +G.Gacha.PITY_5) || 1000,
      titulo: t => lista(G.AchDefs, 'LIST').some(a => a.title && a.title === t)
    };
  }

  // ---------------- saneado ----------------
  /** Lleva la cuenta de lo descartado y lo ajustado. */
  function contador() {
    const c = { descartados: 0, ajustados: 0, claves: [] };
    c.desc = donde => { c.descartados++; if (c.claves.length < 20) c.claves.push(donde); };
    c.ajus = () => { c.ajustados++; };
    return c;
  }

  /** Número finito en [0, max] (entero si `entero`); null si no es un número. */
  function numero(v, max, c, donde, entero = true) {
    if (typeof v !== 'number' || Number.isNaN(v)) { if (v != null) c.desc(donde); return null; }
    let r = Math.min(max, Math.max(0, v));
    if (entero) r = Math.floor(r);
    if (r !== (entero ? Math.floor(v) : v)) c.ajus();
    return r;
  }

  /** Fecha (ms) válida, o `ahora` si sólo dice "sí" (true); null si no vale. */
  function fecha(v, ahora) {
    if (v === true) return ahora;
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) return Math.round(Math.min(v, MAX_FECHA));
    return null;
  }

  /** owned / shiny: dex -> { at, from }. */
  function coleccion(src, cat, c, nombre, ahora) {
    const out = {};
    if (src == null) return out;
    if (!esObj(src)) { c.desc(nombre); return out; }
    for (const k of Object.keys(src)) {
      const v = src[k];
      if (!cat.dex(k) || !v) { c.desc(nombre + '.' + k); continue; }
      const at = fecha(esObj(v) ? v.at : v, ahora) || ahora;
      const from = esObj(v) && typeof v.from === 'string' && /^[a-z]{1,16}$/i.test(v.from) ? v.from : 'oficial';
      out[k] = { at, from };
    }
    return out;
  }

  /** legends / arenas / itemsFound / evoMoves / ach: id -> fecha. */
  function marcas(src, valida, c, nombre, ahora) {
    const out = {};
    if (src == null) return out;
    if (!esObj(src)) { c.desc(nombre); return out; }
    for (const k of Object.keys(src)) {
      const f = fecha(src[k], ahora);
      if (!valida(k) || f === null) { c.desc(nombre + '.' + k); continue; }
      out[k] = f;
    }
    return out;
  }

  /** { id de mejora -> nivel }. */
  function niveles(src, cat, c, nombre) {
    const out = {};
    if (src == null) return out;
    if (!esObj(src)) { c.desc(nombre); return out; }
    for (const id of Object.keys(src)) {
      if (!cat.mejora(id)) { c.desc(nombre + '.' + id); continue; }
      const n = numero(src[id], cat.maxMejora(id), c, nombre + '.' + id);
      if (n) out[id] = n;
    }
    return out;
  }

  /** La partida oficial, sólo con lo que este juego reconoce. Lanza Error(TEXTOS.creada). */
  function sanear(src, ahora, c) {
    const cat = catalogos();
    const base = G.DB.newSave('');
    const CONOCIDAS = new Set([...Object.keys(base), 'pupgDone']);
    for (const k of Object.keys(src)) if (!CONOCIDAS.has(k)) c.desc(k);

    const created = fecha(src.created, ahora);
    if (created === null || src.created === true) throw new Error(TEXTOS.creada);
    const s = base;   // se rellena campo a campo
    s.v = typeof src.v === 'number' && Number.isFinite(src.v) ? src.v : s.v;
    s.name = typeof src.name === 'string' ? src.name.replace(/[^A-Za-z0-9_ñÑáéíóúÁÉÍÓÚ]/g, '').slice(0, 16) : '';
    s.created = created;
    s.updated = fecha(src.updated, ahora) || created;
    s.coins = numero(src.coins, MAX_MONEDAS, c, 'coins') || 0;
    s.owned = coleccion(src.owned, cat, c, 'owned', ahora);
    s.shiny = coleccion(src.shiny, cat, c, 'shiny', ahora);
    for (const d of Object.keys(s.shiny)) if (!s.owned[d]) s.owned[d] = { at: s.shiny[d].at, from: s.shiny[d].from };
    s.partner = cat.dex(src.partner) && s.owned[src.partner] ? +src.partner : null;
    if (src.partner != null && s.partner === null) c.desc('partner');
    s.partnerShiny = !!(src.partnerShiny === true && s.partner !== null && s.shiny[s.partner]);
    s.starter = cat.dex(src.starter) ? +src.starter : null;
    s.personality = null;   // no se trae: se queda la del fork
    s.missions = {};        // no se traen: se quedan las del fork
    s.upgrades = niveles(src.upgrades, cat, c, 'upgrades');
    s.pupg = {};
    if (src.pupg != null && !esObj(src.pupg)) c.desc('pupg');
    for (const d of Object.keys(esObj(src.pupg) ? src.pupg : {})) {
      if (!cat.dex(d)) { c.desc('pupg.' + d); continue; }
      const lv = niveles(src.pupg[d], cat, c, 'pupg.' + d);
      if (Object.keys(lv).length) s.pupg[d] = lv;
    }
    if (typeof src.pupgDone === 'boolean') s.pupgDone = src.pupgDone;
    else if (src.pupgDone != null) c.desc('pupgDone');
    const t = esObj(src.tickets) ? src.tickets : {};
    if (src.tickets != null && !esObj(src.tickets)) c.desc('tickets');
    for (const k of Object.keys(t)) if (k !== 't1' && k !== 't10') c.desc('tickets.' + k);
    s.tickets = { t1: numero(t.t1, MAX_TICKETS, c, 'tickets.t1') || 0, t10: numero(t.t10, MAX_TICKETS, c, 'tickets.t10') || 0 };
    s.pity = {};
    if (typeof src.pity === 'number') s.pity = { 1: numero(src.pity, cat.maxPity, c, 'pity') || 0 };   // formato v1
    else if (src.pity != null && !esObj(src.pity)) c.desc('pity');
    else for (const g of Object.keys(src.pity || {})) {
      if (!cat.banner(g)) { c.desc('pity.' + g); continue; }
      const n = numero(src.pity[g], cat.maxPity, c, 'pity.' + g);
      if (n !== null) s.pity[g] = n;
    }
    s.legends = marcas(src.legends, cat.dex, c, 'legends', ahora);
    s.arenas = marcas(src.arenas, cat.tipo, c, 'arenas', ahora);
    s.itemsFound = marcas(src.itemsFound, cat.objeto, c, 'itemsFound', ahora);
    s.evoMoves = marcas(src.evoMoves, cat.movimiento, c, 'evoMoves', ahora);
    s.ach = marcas(src.ach, cat.logro, c, 'ach', ahora);
    // Perfil: hasta 3 favoritos que tenga (el shiny, si tiene el shiny) y un título del juego.
    const p = esObj(src.profile) ? src.profile : {};
    if (src.profile != null && !esObj(src.profile)) c.desc('profile');
    s.profile = { favs: [], title: '' };
    for (const f of Array.isArray(p.favs) ? p.favs : []) {
      const dex = esObj(f) ? f.dex : f;
      if (!cat.dex(dex) || !s.owned[dex] || s.profile.favs.length >= MAX_FAVS) { if (f) c.desc('profile.favs'); continue; }
      s.profile.favs.push({ dex: +dex, shiny: !!(esObj(f) && f.shiny === true && s.shiny[dex]) });
    }
    if (typeof p.title === 'string' && p.title) { if (cat.titulo(p.title)) s.profile.title = p.title; else c.desc('profile.title'); }
    // Estadísticas: sólo las que conoce newSave(), con el máximo de cada una.
    const st = esObj(src.stats) ? src.stats : {};
    if (src.stats != null && !esObj(src.stats)) c.desc('stats');
    for (const k of Object.keys(st)) {
      if (!tiene(base.stats, k)) { c.desc('stats.' + k); continue; }
      const n = numero(st[k], MAX_STAT, c, 'stats.' + k, k !== 'bestTime' && k !== 'bestGroupTime');
      if (n !== null) s.stats[k] = n;
    }
    return G.DB.migrate(s, s.name);
  }

  // ---------------- analizar ----------------
  /** Lee el texto de un archivo. Acepta el envoltorio del exportador o una partida suelta. */
  function analizar(texto, ahora = Date.now()) {
    if (typeof texto !== 'string' || !texto.trim()) return { ok: false, error: TEXTOS.vacio };
    if (texto.length > MAX_BYTES) return { ok: false, error: TEXTOS.grande };
    let datos;
    try { datos = JSON.parse(texto.replace(/^﻿/, '')); } catch (e) { return { ok: false, error: TEXTOS.json }; }
    if (!esObj(datos)) return { ok: false, error: TEXTOS.tipo };
    const pareceSave = o => esObj(o) && esObj(o.owned) && 'created' in o;
    let src = null, env = null;
    if ('tipo' in datos) {
      if (datos.tipo !== TIPO) return { ok: false, error: TEXTOS.tipo };
      if (typeof datos.version !== 'number' || datos.version > VERSION_ARCHIVO) return { ok: false, error: TEXTOS.version };
      env = datos; src = datos.save;
    } else if (pareceSave(datos.save)) src = datos.save;   // documento saves/{uid} de Firestore: { save, v, updatedAt }
    else src = datos;                                      // partida suelta (localStorage ps.cloud.* / ps.save.*)
    if (!pareceSave(src)) return { ok: false, error: TEXTOS.tipo };
    // Una partida de esta versión no se trae (ver la cabecera): lleva el registro que sólo
    // escribe esta versión, o se exportó desde esta misma web.
    if (tiene(src, REGISTRO)) return { ok: false, error: TEXTOS.propia };
    const aqui = typeof location === 'object' && location ? location.host : '';
    if (env && aqui && env.origen === aqui) return { ok: false, error: TEXTOS.propia };
    const c = contador();
    let save;
    try { save = sanear(src, ahora, c); }
    catch (e) {
      if (e.message === TEXTOS.creada) return { ok: false, error: TEXTOS.creada };
      console.warn('[Importar] partida no reconocida:', e);
      return { ok: false, error: TEXTOS.tipo };
    }
    const avisos = [];
    if (typeof src.v === 'number' && src.v > save.v) avisos.push(TEXTOS.nueva);
    if (c.descartados) avisos.push(TEXTOS.descartados.replace('{x}', c.descartados));
    if (c.ajustados) avisos.push(TEXTOS.ajustados.replace('{x}', c.ajustados));
    const n = k => Object.keys(save[k] || {}).length;
    const exportado = env && fecha(env.exportado, ahora);
    const resumen = {
      nombre: save.name, origen: env && typeof env.origen === 'string' ? env.origen.slice(0, 80) : '',
      exportado: exportado || null, creada: save.created,
      pokemon: n('owned'), shinies: n('shiny'), monedas: save.coins, t1: save.tickets.t1, t10: save.tickets.t10,
      legendarios: n('legends'), arenas: n('arenas'), objetos: n('itemsFound'), movimientos: n('evoMoves'), logros: n('ach'),
      companero: save.partner, companeroShiny: save.partnerShiny,
      descartados: c.descartados, ajustados: c.ajustados, clavesDescartadas: c.claves
    };
    return { ok: true, resumen, avisos, save };
  }

  // ---------------- fusionar ----------------
  /** ¿El archivo es esta misma partida (exportada desde esta versión)? Mismo `created` = misma cuenta. */
  function esLaMisma(actual, oficial) {
    return esObj(actual) && esObj(oficial) && actual.created != null && String(actual.created) === String(oficial.created);
  }

  /**
   * Partida nueva = la del fork + lo de la oficial. No modifica ninguna de las dos.
   * Si la "oficial" es esta misma partida (esLaMisma), lanza Error(TEXTOS.propia).
   * Cada partida oficial se reconoce por su `created`; en la partida del fork queda apuntado en
   * `importOficial` lo ya acreditado por cada una. Traer la misma otra vez no duplica nada:
   *   - owned, shiny: unión (con la fecha más antigua, como merge()); un shiny trae su normal
   *   - mejoras (pupg y las antiguas) y estadísticas: el máximo
   *   - legendarios, arenas, objetos, movimientos evolucionados y logros: unión
   *   - monedas y tickets (t1, t10): se SUMAN, pero sólo lo nuevo: la primera vez, todo; después,
   *     sólo lo que la oficial tenga por encima de lo ya acreditado (si se gastó allí, no resta)
   *   - sólo la PRIMERA vez que se trae cada partida oficial (luego se quedan los del fork, que el
   *     jugador ya ha podido cambiar aquí):
   *       · pity de cada banner: el máximo (el del fork baja a 0 con un ★5; volver a subirlo sería
   *         regalar tiradas)
   *       · compañero: el de la oficial si lo tienes (y su shiny si tienes el shiny). También
   *         después, si el del fork no es válido (ninguno o uno que no tienes)
   *       · perfil (favoritos y título): los de la oficial si los del fork están vacíos
   *   - nombre, misiones, personalidad, inicial y fecha de creación: los del fork
   *   - updated = ahora
   */
  function fusionar(actual, oficial, ahora = Date.now()) {
    if (esLaMisma(actual, oficial)) throw new Error(TEXTOS.propia);
    const r = copia(actual), o = oficial;
    const reg = r[REGISTRO] = esObj(r[REGISTRO]) ? r[REGISTRO] : {};
    const id = String(o.created), primera = !tiene(reg, id), antes = esObj(reg[id]) ? reg[id] : {};
    for (const coll of ['owned', 'shiny']) {
      r[coll] = esObj(r[coll]) ? r[coll] : {};
      for (const k of Object.keys(o[coll] || {})) {
        const mio = r[coll][k], suyo = o[coll][k];
        if (!mio || (suyo.at || 0) < (mio.at || 0)) r[coll][k] = { at: suyo.at, from: suyo.from };
      }
    }
    for (const k of Object.keys(r.shiny)) if (!r.owned[k]) r.owned[k] = { at: r.shiny[k].at, from: r.shiny[k].from };
    r.upgrades = esObj(r.upgrades) ? r.upgrades : {};
    for (const k of Object.keys(o.upgrades || {})) r.upgrades[k] = Math.max(n0(r.upgrades[k]), o.upgrades[k]);
    r.pupg = esObj(r.pupg) ? r.pupg : {};
    for (const d of Object.keys(o.pupg || {})) {
      const mine = r.pupg[d] = esObj(r.pupg[d]) ? r.pupg[d] : {};
      for (const k of Object.keys(o.pupg[d])) mine[k] = Math.max(n0(mine[k]), o.pupg[d][k]);
    }
    r.pupgDone = !!(r.pupgDone || o.pupgDone);
    for (const coll of ['legends', 'arenas', 'itemsFound', 'evoMoves', 'ach']) {
      r[coll] = esObj(r[coll]) ? r[coll] : {};
      for (const k of Object.keys(o[coll] || {})) if (!r[coll][k]) r[coll][k] = o[coll][k];
    }
    r.stats = esObj(r.stats) ? r.stats : {};
    for (const k of Object.keys(o.stats || {})) r.stats[k] = Math.max(n0(r.stats[k]), n0(o.stats[k]));
    r.pity = esObj(r.pity) ? r.pity : {};
    if (primera) for (const g of Object.keys(o.pity || {})) r.pity[g] = Math.max(n0(r.pity[g]), n0(o.pity[g]));
    // Monedas y tickets: sólo lo que no se haya acreditado ya por esta partida oficial.
    r.tickets = Object.assign({ t1: 0, t10: 0 }, esObj(r.tickets) ? r.tickets : {});
    const ahoraReg = { coins: 0, t1: 0, t10: 0, at: ahora };
    for (const [k, v] of [['coins', o.coins], ['t1', o.tickets.t1], ['t10', o.tickets.t10]]) {
      const ya = n0(antes[k]), suma = Math.max(0, n0(v) - ya);
      ahoraReg[k] = Math.max(ya, n0(v));
      if (k === 'coins') r.coins = n0(r.coins) + suma; else r.tickets[k] = n0(r.tickets[k]) + suma;
    }
    reg[id] = ahoraReg;
    const compaValido = r.partner != null && !!r.owned[r.partner];
    if (o.partner != null && r.owned[o.partner] && (primera || !compaValido)) {
      r.partner = o.partner;
      r.partnerShiny = !!(o.partnerShiny && r.shiny[o.partner]);
    }
    r.profile = esObj(r.profile) ? r.profile : { favs: [], title: '' };
    if (primera && (!Array.isArray(r.profile.favs) || !r.profile.favs.some(Boolean))) {
      const favs = (o.profile && o.profile.favs || []).filter(f => r.owned[f.dex]).slice(0, MAX_FAVS)
        .map(f => ({ dex: f.dex, shiny: !!(f.shiny && r.shiny[f.dex]) }));
      if (favs.length) r.profile.favs = favs;
    }
    const titulo = o.profile && o.profile.title;
    if (primera && !r.profile.title && titulo && ((G.AchDefs && G.AchDefs.LIST) || []).some(a => a.title === titulo && r.ach[a.id])) r.profile.title = titulo;
    r.updated = ahora;
    return r;
  }

  // ---------------- comparar ----------------
  function comparar(a, n, o) {
    const nuevas = k => Object.keys(n[k] || {}).filter(x => !(a[k] || {})[x]).length;
    let mejoras = 0;
    for (const d of Object.keys(n.pupg || {})) {
      const pa = (a.pupg || {})[d] || {};
      if (Object.keys(n.pupg[d]).some(id => n0(n.pupg[d][id]) > n0(pa[id]))) mejoras++;
    }
    const mas = k => Object.keys(n[k] || {}).filter(x => n0(n[k][x]) > n0((a[k] || {})[x])).length;
    const at = a.tickets || {}, nt = n.tickets || {};
    const companero = n.partner !== a.partner || !!n.partnerShiny !== !!a.partnerShiny ? { dex: n.partner, shiny: !!n.partnerShiny } : null;
    // Perfil: favoritos y título, por separado (cada uno con su fila en la vista previa).
    const pa = esObj(a.profile) ? a.profile : {}, pn = esObj(n.profile) ? n.profile : {};
    const favsA = Array.isArray(pa.favs) ? pa.favs : [], favsN = Array.isArray(pn.favs) ? pn.favs : [];
    const favs = JSON.stringify(favsN) !== JSON.stringify(favsA) ? favsN : null;
    const titulo = (pn.title || '') !== (pa.title || '') ? pn.title || '' : null;
    // Todo lo que cuenta en `algo` tiene su fila en la vista previa (js/ui/importar-ui.js).
    const c = {
      pokemon: nuevas('owned'), shinies: nuevas('shiny'),
      monedas: n0(n.coins) - n0(a.coins), t1: n0(nt.t1) - n0(at.t1), t10: n0(nt.t10) - n0(at.t10),
      legendarios: nuevas('legends'), arenas: nuevas('arenas'), objetos: nuevas('itemsFound'),
      movimientos: nuevas('evoMoves'), logros: nuevas('ach'), mejoras,
      estadisticas: mas('stats'), pity: mas('pity'), companero, favs, titulo,
      perfil: !!(favs || titulo !== null),
      yaImportada: !!(o && esObj(a[REGISTRO]) && tiene(a[REGISTRO], String(o.created)))
    };
    c.algo = !!(c.pokemon || c.shinies || c.monedas || c.t1 || c.t10 || c.legendarios || c.arenas || c.objetos ||
      c.movimientos || c.logros || c.mejoras || c.estadisticas || c.pity || c.companero || c.perfil);
    return c;
  }

  function previsualizar(actual, oficial, ahora = Date.now()) {
    if (esLaMisma(actual, oficial)) return { error: TEXTOS.propia };
    const nueva = fusionar(actual, oficial, ahora);
    return { nueva, cambios: comparar(actual, nueva, oficial) };
  }

  // ---------------- aplicar a la partida abierta ----------------
  /** Fusiona y guarda. Devuelve { ok, cambios, guardada, invitado, nube, subida (promesa) }. */
  function aplicar(oficial) {
    const db = G.DB;
    if (!db || !db.save) return { ok: false, error: TEXTOS.sinPartida };
    if (G.Game && G.Game.state && G.Game.state !== 'ui') return { ok: false, error: TEXTOS.enRun };
    if (esLaMisma(db.save, oficial)) return { ok: false, error: TEXTOS.propia };
    const actual = copia(db.save);
    const nueva = fusionar(actual, oficial);
    const cambios = comparar(actual, nueva, oficial);
    db.applyInPlace(nueva);                 // mismo objeto: las pantallas abiertas lo siguen viendo
    const invitado = !!db.guest, nube = db.mode === 'cloud';
    const guardada = !!db.commit(true);     // local: este navegador; nube: copia local + subida pendiente
    const subida = nube && !invitado ? db.flush() : Promise.resolve();   // sube ya (transacción con merge)
    if (G.UI && G.UI.refreshCoins) G.UI.refreshCoins();
    return { ok: true, cambios, guardada, invitado, nube, subida };
  }

  return { analizar, esLaMisma, fusionar, comparar, previsualizar, aplicar, EXPORTADOR, TEXTOS, MAX_BYTES, TIPO, REGISTRO };
})();
