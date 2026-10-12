/* ============ tools/nico/estilo-e2e.js — prueba de la identidad visual en el navegador ============
 *   cd tools/nico && node estilo-e2e.js [--dev] [--headed] [--puerto 8092] [--sin-capturas] [--solo-hud]
 *
 * Arnés del estilo «Dex de Expedición» (lote 1: base del estilo y menús). Modo local, un jugador
 * invitado, sin emulador: abre index.html (con --dev, dev.html) en Chromium con Playwright y, en
 * los dos estilos (Dex y Clásico, cambiados con G.Estilo.set en la misma página):
 *
 *   1. Pantallas: recorre las 21 pantallas (.scr) en cada tamaño (escritorio 1440x900, 1920x1080 y
 *      1024x768; móvil táctil 844x390@3 y 780x360@3; el Magic V6 de Nico, con los tamaños que usó la
 *      verificación del 12-10-2026 (sin confirmar en el teléfono): interior 724x784 y 784x724 y exterior
 *      807x360 @3 táctil; y otros plegables o tabletas casi cuadrados, 1000x900 y 900x1000 @2,5 táctil) y
 *      exige: nada de desplazamiento horizontal (página, pantalla y caja), la caja dentro de la ventana y el
 *      menú principal oculto detrás de cualquier .scr.dim. Con Dex, que la piel está puesta en cada una
 *      (borde de la caja y letra y fondo de los botones: si upstream renombra .box o .btn, falla); con
 *      Clásico, que no. Y el menú principal: las 8 opciones a la vista sin desplazar, el logotipo libre de la
 *      barra superior y la línea de créditos sin pisar ninguna caja.
 *   2. Gacha en pantallas bajas y en los plegables: en los 9 banners, cada lienzo destacado dentro del
 *      banner y de la ventana, a su tamaño (alto CSS = alto del lienzo), y los tres botones de tirar a la
 *      vista sin desplazar; si las pestañas no caben, la elegida entera (fuera del degradado) y el
 *      degradado sólo donde hay más; en pantallas bajas, la capa «Probabilidades» (la tabla debajo del título, «Cerrar» entero
 *      y sin pisarla) y los avisos de logro sin tapar ni quedarse los toques de los botones de tirar.
 *      Tiradas ×1 y ×10 por la interfaz real: sin desplazar y «Continuar» a la vista sin tapar ninguna
 *      carta; y una ×10 con diez repetidos que desbloquean su evolución (las de nombre más largo; el azar
 *      de esa tirada, guionizado sólo en la prueba): cada etiqueta entera, con el nombre, y cada carta a la
 *      vista sin «Continuar» encima (en pantallas bajas, sin desplazar).
 *   3. Nada se corta: en los lienzos que anima G.Estilo (los 27 legendarios destacados, el compañero del
 *      menú con 37 Pokémon, iniciales y gigantes, y el premio de las tiradas) se dibuja cada fotograma de
 *      Idle y de las animaciones que se les dejan, con su colocación (escala y pies) y su sombra, y la caja
 *      de píxeles opacos no toca el borde; y además 30 fotogramas de verdad de cada lienzo.
 *   4. Fin de partida (con una partida larga, en todos los tamaños): «Volver al menú» a la vista, y cada
 *      panel de las estadísticas se llega a ver entero, sin el botón encima, desplazando la caja.
 *   5. Franja de tipo de 8 ± 1 px en las cartas de nivel de los 18 tipos (Dex), ≥ 3:1 contra la carta
 *      (con el filo claro en Fantasma, Dragón y Siniestro); sin franja en Clásico. Y las píldoras de tipo
 *      (G.UI.typeChips) de los 18 tipos con Dex, ≥ 4,5:1.
 *   6. Teclado (Dex, 1440x900): Tab recorre el menú, las cartas de nivel y Ajustes con el anillo de
 *      foco visible; «Estilo» es la primera sección de Gráficos y cambiarlo ahí funciona.
 *   7. «Gira el móvil»: sí en un móvil en vertical (390x844) y en el Magic V6 plegado en vertical
 *      (360x807), no en los plegables abiertos.
 *   8. Sin internet: tras la primera carga (en Clásico, con el service worker), se corta la red y se
 *      pasa a Dex: la letra está (document.fonts.check) y no se pide nada fuera de assets/fonts.
 *   9. Consola sin errores ni avisos (menos los del entorno de la prueba: ver AVISOS_ENTORNO).
 *  10. HUD Dex en partida (lote 2), en escritorio, móvil y el Magic V6 (interior en horizontal y en vertical, exterior
 *      en horizontal y la mitad de arriba en modo mesa, 784x362): con un jefe a la vista, su aviso, lluvia, mejoras, objeto
 *      y cuatro ataques, la banda de arriba medida en píxeles (el HUD en un lienzo transparente aparte) es la de
 *      G.HudDex.bandas() y la de check.js (≤ 20 % del alto en un móvil); pares Dex/Clásico; tocar la ranura 2 la activa y
 *      la pausa responde (844x390, con el dedo); contraste de los textos en píxeles reales en bosque, cueva, volcán, arena
 *      y lluvia (p10 ≥ 3:1, mediana ≥ 4,5:1); el HUD Dex cuesta de media como mucho 0,3 ms más que el de upstream en la misma escena (escritorio); capturas con 4 jugadores; y
 *      con movimiento reducido no parpadea nada. Con la letra de verdad, cada bioma y cada arena salen enteros en el
 *      sensor de Rotom y la pista de controles del principio sale entera; el aviso de logro en partida va bajo la banda
 *      de arriba del HUD (también el que salió en el menú); en el plegable abierto nada pisa el pliegue; y las flechas
 *      del mismo cuadrante (jefe y tres compañeros, uno caído) no se pisan y sus etiquetas quedan en la zona libre.
 *  11. Arreglos de la verificación de los lotes 1 y 2: el Magic V6 con la barra del navegador (724x740 a 640 y 784x700
 *      a 640, con `screen` de la pantalla entera): el menú entero sin desplazar y sin los créditos encima, el pliegue
 *      vertical a 724x700 sin nada encima (tampoco un aviso largo) y las tiradas a 724x640 y 784x640; la ×10 de 640x360
 *      y 667x375; la barra superior compacta a 640, 600, 520 y 400 de ancho; el aviso flotante del menú, al empezar la
 *      partida, por encima de las ranuras; «…» con los puntos en la línea base; y zonas seguras simuladas (cada
 *      env(safe-area-inset-*) de lo que se sirve, cambiado por píxeles: 844x390 con 47/24/47/21).
 *
 * Capturas en tools/nico/out/estilo/ (pares Dex/Clásico de menú, colección, gacha, tiradas, subida de
 * nivel con foco y con el ratón encima, Ajustes, pausa, fin, sala, iniciales, mejoras y tragaperras, a
 * 1440x900, 844x390 y 724x784; la capa «Probabilidades» y la ×10 de repetidos, en pantallas bajas) con una
 * hoja de contactos (indice.html) e informe.json.
 * Código de salida 0 = todo bien. Nada habla con servicios de fuera: sólo 127.0.0.1.
 */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { startServer } = require('./serve.js');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out', 'estilo');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PORT = +arg('--puerto', 8092);
const PAGE = process.argv.includes('--dev') ? 'dev.html' : 'index.html';
const BASE = `http://127.0.0.1:${PORT}/${PAGE}`;
const HEADLESS = !process.argv.includes('--headed');
const CAPTURAS = !process.argv.includes('--sin-capturas');
const SOLO_HUD = process.argv.includes('--solo-hud');   // sólo el HUD Dex en partida (sección 10), para ir más rápido
const SOLO_PORTADA = process.argv.includes('--solo-portada');   // sólo la portada «Tarjeta de entrenador» (sección 12)
const ESTILOS = ['clasico', 'dex'];

/** Avisos de la consola que son del entorno de la prueba, no del juego. */
const AVISOS_ENTORNO = [
  /Service Worker registration blocked by Playwright/i,                         // la prueba bloquea el service worker (menos en la de sin internet)
  /AudioContext was not allowed to start/i,                                      // Chromium sin gesto del usuario al arrancar (upstream crea el audio al cargar)
  /Multiple readback operations using getImageData/i                             // la prueba lee los píxeles de los lienzos del juego
];

const VP = {
  pc: { w: 1440, h: 900 }, fhd: { w: 1920, h: 1080 }, tab: { w: 1024, h: 768 },
  movil: { w: 844, h: 390, dpr: 3, tactil: true }, movilBajo: { w: 780, h: 360, dpr: 3, tactil: true },
  // El Honor Magic V6 de Nico (los tamaños de la verificación del 12-10-2026, sin confirmar en el teléfono):
  // pantalla interior en horizontal y en vertical, y exterior en horizontal.
  pleg1: { w: 784, h: 724, dpr: 3, tactil: true }, pleg2: { w: 724, h: 784, dpr: 3, tactil: true }, exterior: { w: 807, h: 360, dpr: 3, tactil: true },
  // Otros plegables o tabletas casi cuadrados.
  pleg3: { w: 1000, h: 900, dpr: 2.5, tactil: true }, pleg4: { w: 900, h: 1000, dpr: 2.5, tactil: true }
};
const nombreVp = v => `${v.w}x${v.h}${v.dpr ? '@' + v.dpr : ''}${v.seguras ? '-muesca' : ''}`;
const CON_CAPTURAS = ['pc', 'movil', 'pleg2'];
const GACHA_MOVIL = ['movil', 'movilBajo', 'exterior', 'pleg1', 'pleg2', 'pleg3', 'pleg4'];
const TIRADAS = ['movil', 'movilBajo', 'exterior', 'pc', 'pleg1', 'pleg2'];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const report = { inicio: new Date().toISOString(), url: BASE, comprobaciones: [], capturas: [], medidas: {} };
const save = () => fs.writeFileSync(path.join(OUT, 'informe.json'), JSON.stringify(report, null, 2));
let fallos = 0;
function check(name, okv, detail) {
  if (!okv) fallos++;
  report.comprobaciones.push({ comprobacion: name, ok: !!okv, detalle: detail });
  const d = detail === undefined ? '' : ' :: ' + (typeof detail === 'string' ? detail : JSON.stringify(detail));
  console.log(`[${okv ? 'OK' : 'FALLO'}] ${name}${okv ? '' : d.slice(0, 1500)}`);
  save();
}
async function captura(page, nombre) {
  if (!CAPTURAS) return null;
  const f = nombre + '.png';
  await page.screenshot({ path: path.join(OUT, f) });
  report.capturas.push(f);
  return f;
}

// ---------------- arranque de un jugador (invitado, modo local) ----------------
async function nuevo(browser, v, { sw = false } = {}) {
  // v.pantalla: [ancho, alto] de la pantalla entera si no es la ventana (el plegable con la barra del navegador).
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dpr || 1, hasTouch: !!v.tactil, isMobile: !!v.tactil,
    serviceWorkers: sw ? 'allow' : 'block', locale: 'es-ES', ...(v.pantalla ? { screen: { width: v.pantalla[0], height: v.pantalla[1] } } : {}) });
  if (v.seguras) await simularSeguras(ctx, v.seguras);
  const page = await ctx.newPage();
  const P = { ctx, page, v, consola: [], fuera: [] };
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !AVISOS_ENTORNO.some(re => re.test(m.text()))) P.consola.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => P.consola.push('pageerror: ' + e.message));
  page.on('request', r => { if (!r.url().startsWith(`http://127.0.0.1:${PORT}/`) && !/^(data|blob):/.test(r.url())) P.fuera.push(r.url()); });
  return P;
}
async function entrar(P) {
  const { page } = P;
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('boot') && document.getElementById('boot').classList.contains('hidden'), null, { timeout: 30000 });
  await sleep(200);
  const gira = await page.evaluate(() => !document.getElementById('rotate').classList.contains('hidden'));
  if (gira) return false;
  if (await page.locator('#tap-start').isVisible().catch(() => false)) await page.click('#tap-start');
  await page.locator('#btn-guest').click();
  for (let n = 0; n < 40 && await page.locator('#scr-test').isVisible(); n++) { await page.locator('#test-a .answer').first().click(); await sleep(40); }
  if (await page.locator('#scr-result').isVisible()) await page.click('#res-ok');
  await page.locator('#scr-menu').waitFor({ state: 'visible', timeout: 15000 });
  await page.evaluate(() => {
    G.DB.save.tickets = { t1: 60, t10: 6 };
    // Una sala de mentira para ver la pantalla de la sala (la que más usa Nico) sin red: sólo en la prueba.
    const sala = { id: 'prueba', isHost: true, host: 'u1', members: [{ uid: 'u1', name: 'Nico', dex: 255 }, { uid: 'u2', name: 'Ana', dex: 25, shiny: true }, { uid: 'u3', name: 'Leo', dex: 7 }] };
    window.__sala = sala;
    G.Social.refreshMember = () => {}; G.Social.refreshPresence = () => {};
    G.Net.mode = () => 'direct';
  });
  return true;
}
const estilo = (page, e) => page.evaluate(x => { G.Estilo.set(x); }, e);

// ---------------- las 21 pantallas ----------------
const MOVS = `Object.keys(G.Moves.BY_ID)`;
const PANTALLAS = [
  ['scr-login', 'G.UI.hideAll(); G.LoginUI.open();'],
  ['scr-test', 'G.UI.hideAll(); G.TestUI.start();'],
  ['scr-result', 'G.UI.hideAll(); G.UI.show("scr-result");'],
  ['scr-starters', 'G.UI.hideAll(); G.UI.show("scr-result"); document.getElementById("res-other").click();'],
  ['scr-menu', 'G.MenuUI.open();'],
  ['scr-settings', 'G.MenuUI.open(); G.SettingsUI.open("sound");', 'G.SettingsUI.close();'],
  ['scr-settings', 'G.MenuUI.open(); G.SettingsUI.open("gfx");', 'G.SettingsUI.close();', 'gfx'],
  ['scr-settings', 'G.MenuUI.open(); G.SettingsUI.open("ctl");', 'G.SettingsUI.close();', 'ctl'],
  ['scr-settings', 'G.MenuUI.open(); G.SettingsUI.open("acc");', 'G.SettingsUI.close();', 'acc'],
  ['scr-settings', 'G.MenuUI.open(); G.SettingsUI.open("about");', 'G.SettingsUI.close();', 'about'],
  ['scr-legal', 'G.MenuUI.open(); document.querySelector("[data-legal]").click();', 'document.getElementById("legal-close").click();'],
  ['scr-nick', 'G.MenuUI.open(); G.NickUI.open();'],
  // Amigos y ranking piden una cuenta en la nube: en modo local se abre la pantalla tal cual, para ver su piel.
  ['scr-friends', 'G.MenuUI.open(); G.FriendsUI.open(); if (!G.UI.isOpen("scr-friends")) G.UI.show("scr-friends", true);'],
  ['scr-lobby', 'G.MenuUI.open(); Object.defineProperty(G.Social, "room", { get: () => window.__sala, configurable: true }); G.LobbyUI.open();',
    'Object.defineProperty(G.Social, "room", { get: () => null, configurable: true });'],
  ['scr-rank', 'G.MenuUI.open(); G.RankingUI.open(); if (!G.UI.isOpen("scr-rank")) G.UI.show("scr-rank", true);'],
  ['scr-goals', 'G.MenuUI.open(); G.GoalsUI.open("missions");'],
  ['scr-goals', 'G.MenuUI.open(); G.GoalsUI.open("ach");', '', 'ach'],
  ['scr-goals', 'G.MenuUI.open(); G.GoalsUI.open("profile");', '', 'profile'],
  ['scr-profile', `G.MenuUI.open(); G.ProfileUI.showData({ name: 'Nico', title: 'Explorador', best: { solo: 754, group: 1203, level: 31, bosses: 12, legends: 3, kills: 4321, medals: 2 },
    favs: [{ dex: 255 }, { dex: 25, shiny: true }, { dex: 150 }], medals: Object.keys(G.AchDefs.BY).slice(0, 6) });`, 'document.getElementById("prof-close").click();'],
  ['scr-dex', 'G.MenuUI.open(); document.querySelector("#scr-menu [data-go=dex]").click();'],
  ['scr-upgrades', 'G.MenuUI.open(); document.querySelector("#scr-menu [data-go=upgrades]").click();'],
  ['scr-gacha', 'G.MenuUI.open(); G.GachaUI.open();'],
  // En partida (la run real; las pantallas se abren con sus funciones de run-ui.js).
  ['scr-levelup', `if (G.Game.state === 'ui') G.Flow.play(); G.RunUI.showLevelUp(7, G.LevelUp.offer(G.Game.player), () => {});`],
  ['scr-item', `if (G.Game.state === 'ui') G.Flow.play(); const it = Object.keys(G.Items.BY); G.RunUI.showItemChoice(it[0], it[1], () => {});`],
  ['scr-bond', `if (G.Game.state === 'ui') G.Flow.play(); const ids = ${MOVS}.slice(0, 4); G.RunUI.showBond({ mode: 'pair', group: [],
    loose: ids.map((id, i) => ({ id, name: G.Moves.BY_ID[id].name, type: G.Moves.BY_ID[id].type, lvl: 3 + i, desc: G.Moves.BY_ID[id].desc })) }, () => {});`],
  ['scr-pause', `if (G.Game.state === 'ui') G.Flow.play(); G.UI.hideAll(); G.RunUI.showPause();`],
  ['scr-over', `if (G.Game.state === 'ui') G.Flow.play(); G.UI.hideAll(); G.RunUI.showOver({ dead: true, time: 1754, level: 37, kills: 12345, bosses: 6, coins: 1234,
    breakdown: 'Tiempo +600 · Derrotados +400 · Jefes +234', t1: 7, t10: 2, moves: ${MOVS}.slice(0, 4).map((id, i) => ({ id, name: G.Moves.BY_ID[id].name, lvl: 5 + i })),
    caught: [{ dex: 25, isNew: true }, { dex: 133, isNew: false }, { dex: 150, isNew: true }], record: true }, () => {});`]
];
const salirDePartida = `G.UI.hideAll(); if (G.Game.state !== 'ui') { G.Game.quit(); } G.Flow.goMenu();`;

/** Mide la pantalla abierta: desplazamiento horizontal, caja dentro de la ventana y el menú de detrás. */
const MEDIR_PANTALLA = id => {
  const scr = document.getElementById(id), box = scr && scr.querySelector('.box');
  const W = innerWidth, de = document.documentElement;
  const menu = document.getElementById('scr-menu');
  const dimAbierta = !!document.querySelector('.scr.dim:not(.hidden)');
  const r = box ? box.getBoundingClientRect() : null;
  return {
    visible: !!scr && !scr.classList.contains('hidden'),
    pagina: de.scrollWidth - de.clientWidth, cuerpo: document.body.scrollWidth - W,
    pantalla: scr ? scr.scrollWidth - scr.clientWidth : 0, caja: box ? box.scrollWidth - box.clientWidth : 0,
    cajaFuera: r ? Math.max(0, -r.left, r.right - W) : 0,
    menuDetras: dimAbierta && !menu.classList.contains('hidden') && getComputedStyle(menu).visibility !== 'hidden'
  };
};

/** ¿Lleva la pantalla la piel Dex? Borde de su caja (--color-bisel) y letra y fondo de un botón normal (M PLUS y
 *  --color-cristal-2). Si upstream renombra .box o .btn, la piel deja de aplicarse: esto lo ve. */
const PIEL = id => {
  const scr = document.getElementById(id), box = scr && scr.querySelector('.box');
  const ref = document.createElement('div');
  ref.style.cssText = 'position:absolute;visibility:hidden;border-top:1px solid var(--color-bisel);background:var(--color-cristal-2)';
  document.body.appendChild(ref);
  const bisel = getComputedStyle(ref).borderTopColor, cristal2 = getComputedStyle(ref).backgroundColor;
  ref.remove();
  const btn = scr && [...scr.querySelectorAll('.btn')].find(b => b.offsetParent !== null && !b.matches('.gold, .danger, .google, .ghost, :hover, :focus'));
  const bc = box && getComputedStyle(box), tc = btn && getComputedStyle(btn);
  return { fuenteCaja: bc ? bc.fontFamily : '', bordeCaja: bc ? bc.borderTopColor : '', bisel, boton: btn ? (btn.id || btn.textContent.trim().slice(0, 16)) : null,
    fuenteBoton: tc ? tc.fontFamily : '', fondoBoton: tc ? tc.backgroundColor : '', cristal2 };
};
const conPiel = p => /M PLUS Rounded 1c/.test(p.fuenteCaja) && p.bordeCaja === p.bisel && (!p.boton || (/M PLUS Rounded 1c/.test(p.fuenteBoton) && p.fondoBoton === p.cristal2));
const sinPiel = p => /Pixelify/.test(p.fuenteCaja) && p.bordeCaja !== p.bisel && (!p.boton || !/M PLUS/.test(p.fuenteBoton));

async function recorrerPantallas(P) {
  const { page, v } = P, malas = [], piel = [];
  for (const e of ESTILOS) {
    await estilo(page, e);
    for (const [id, abrir, cerrar, sub] of PANTALLAS) {
      await page.evaluate(abrir);
      await sleep(id === 'scr-gacha' || id === 'scr-dex' ? 120 : 30);
      const m = await page.evaluate(MEDIR_PANTALLA, id);
      const mal = !m.visible || m.pagina > 0 || m.cuerpo > 0 || m.pantalla > 1 || m.caja > 1 || m.cajaFuera > 1 || m.menuDetras;
      if (mal) malas.push({ estilo: e, cual: id + (sub ? '/' + sub : ''), ...m });
      const p = await page.evaluate(PIEL, id);
      if (!(e === 'dex' ? conPiel(p) : sinPiel(p))) piel.push({ estilo: e, cual: id + (sub ? '/' + sub : ''), ...p });
      if (cerrar) await page.evaluate(cerrar);
    }
    await page.evaluate(salirDePartida);
  }
  return { malas, piel };
}

/** Menú principal: las 8 opciones a la vista sin desplazar nada (ni la pantalla ni una caja), el logotipo libre
 *  de la barra superior y la línea de créditos sin pisar ninguna caja (lo que se ve de ella: el menú acaba por encima
 *  de la línea y, si no cabe, se desplaza por encima de ella). sobra: lo que habría que desplazar para verlo todo. */
const MEDIR_MENU = () => {
  const H = innerHeight, W = innerWidth, rr = el => el.getBoundingClientRect();
  const cruza = (a, b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
  /** Lo que se ve de un elemento: su caja recortada por los contenedores que recortan (con desplazamiento). */
  const visto = el => {
    const r = rr(el); let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (/(auto|scroll|hidden|clip)/.test(cs.overflowY + ' ' + cs.overflowX)) { const q = rr(p); x0 = Math.max(x0, q.left); y0 = Math.max(y0, q.top); x1 = Math.min(x1, q.right); y1 = Math.min(y1, q.bottom); }
    }
    return { left: x0, top: y0, right: Math.max(x0, x1), bottom: Math.max(y0, y1) };
  };
  const visible = el => !!el && !el.classList.contains('hidden') && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
  const items = [...document.querySelectorAll('#scr-menu .menu-item')];
  const mal = items.filter(it => {
    const r = rr(it);
    if (r.top < -0.5 || r.bottom > H + 0.5 || r.left < -0.5 || r.right > W + 0.5) return true;
    for (let p = it.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (/(auto|scroll|hidden)/.test(cs.overflowY + ' ' + cs.overflowX)) { const q = rr(p); if (r.top < q.top - 0.5 || r.bottom > q.bottom + 0.5) return true; }
    }
    return false;
  }).map(it => it.dataset.go);
  const scr = document.getElementById('scr-menu'), tb = document.getElementById('topbar'), cl = document.getElementById('credits-line');
  // El logotipo que se ve: con Dex, el de la «Tarjeta de entrenador» (css/portada.css); con Clásico, el del proyecto base.
  const logo = [document.querySelector('#tc-card .tc-title'), document.querySelector('#scr-menu .logo')].find(el => el && el.getClientRects().length > 0);
  const cajas = [...document.querySelectorAll('#scr-menu .menu-right > .box, #tc-card')].filter(visible), mr = document.querySelector('#scr-menu .menu-right');
  return { opciones: items.length, mal, desplazada: scr.scrollTop + mr.scrollTop, sobra: Math.max(scr.scrollHeight - scr.clientHeight, mr.scrollHeight - mr.clientHeight),
    logoTapado: visible(tb) && cruza(rr(tb), rr(logo)), creditosPisan: visible(cl) && cajas.some(b => cruza(visto(b), rr(cl))),
    logo: [Math.round(rr(logo).top), Math.round(rr(logo).bottom)], barra: visible(tb) ? [Math.round(rr(tb).top), Math.round(rr(tb).bottom)] : null };
};

/** Fin de partida: para cada desplazamiento de la caja, ¿qué paneles se ven enteros (dentro de la caja y de la
 *  ventana) sin «Volver al menú» encima? Un panel que nunca se ve entero es información perdida. */
const FIN_PANELES = () => {
  const box = document.querySelector('#scr-over > .box'), st = document.getElementById('over-stats'), btn = document.getElementById('btn-again');
  const paneles = [...st.children], visto = paneles.map(() => false), max = box.scrollHeight - box.clientHeight;
  for (let y = 0; y <= max + 8; y += 4) {
    box.scrollTop = y;
    const b = box.getBoundingClientRect(), k = btn.getBoundingClientRect();
    paneles.forEach((p, i) => {
      const r = p.getBoundingClientRect();
      if (r.top >= b.top - 0.5 && r.bottom <= b.bottom + 0.5 && r.top >= -0.5 && r.bottom <= innerHeight + 0.5 && !(r.top < k.bottom - 1 && r.bottom > k.top + 1)) visto[i] = true;
    });
  }
  box.scrollTop = 0;
  const k = btn.getBoundingClientRect();
  return { paneles: paneles.length, nunca: paneles.filter((p, i) => !visto[i]).map(p => (p.innerText || '').trim().split('\n')[0].slice(0, 24)),
    boton: [Math.round(k.top), Math.round(k.bottom)], botonVisible: k.top >= 0 && k.bottom <= innerHeight + 0.5 && k.height >= 40, alto: innerHeight };
};

/** Capa «Probabilidades» (pantallas bajas): dentro de la ventana, la tabla debajo del título y de «Cerrar», que
 *  no la pisa y con su texto entero dentro del botón. */
const MEDIR_PROB = () => {
  const capa = document.getElementById('gacha-prob-capa'), h = capa.querySelector('h3'), b = capa.querySelector('button'), t = capa.querySelector('.rates');
  const rr = el => el.getBoundingClientRect(), cruza = (x, y) => x.left < y.right - 0.5 && x.right > y.left + 0.5 && x.top < y.bottom - 0.5 && x.bottom > y.top + 0.5;
  const rango = document.createRange(); rango.selectNodeContents(b);
  const tx = rango.getBoundingClientRect(), R = rr(capa), B = rr(b);
  return { abierta: !capa.classList.contains('hidden'), debajo: rr(t).top >= Math.max(rr(h).bottom, B.bottom) - 0.5, pisa: cruza(B, rr(t)),
    textoDentro: tx.left >= B.left - 0.5 && tx.right <= B.right + 0.5 && tx.top >= B.top - 0.5 && tx.bottom <= B.bottom + 0.5,
    filas: t.querySelectorAll('div').length, dentro: R.top >= -0.5 && R.bottom <= innerHeight + 0.5 && R.left >= -0.5 && R.right <= innerWidth + 0.5, cerrar: Math.round(B.width) };
};

/** Tira de pestañas del gacha (si no caben, se desplaza en horizontal): la elegida, entera y fuera del degradado del lado por el que
 *  hay más; las clases mas-izq / mas-der, de acuerdo con el desplazamiento. */
const MEDIR_TIRA = () => {
  const tira = document.getElementById('gacha-gens'), on = tira.querySelector('.gen-tab.on'), q = tira.getBoundingClientRect(), r = on.getBoundingClientRect();
  const max = tira.scrollWidth - tira.clientWidth, F = 36, izq = tira.classList.contains('mas-izq'), der = tira.classList.contains('mas-der');
  return { gen: on.dataset.gen, entera: r.left >= q.left + (izq ? F : 0) - 0.5 && r.right <= q.right - (der ? F : 0) + 0.5,
    clases: izq === (max > 1 && tira.scrollLeft > 1) && der === (max > 1 && tira.scrollLeft < max - 1), desborda: max > 1, desplazada: Math.round(tira.scrollLeft), max };
};

/** Un aviso de logro con el gacha abierto (pantallas bajas): ¿tapa algún botón de tirar o se queda su toque? */
const AVISO_GACHA = () => {
  let el = document.getElementById('ach-pop'), creado = false;
  if (!el) { el = document.createElement('div'); el.id = 'ach-pop'; el.className = 'box ach-pop'; document.body.appendChild(el); creado = true; }
  const antes = el.innerHTML, oculto = el.classList.contains('hidden');
  el.innerHTML = '<div><b>Logro de prueba</b><small>Un aviso cualquiera</small></div>';
  el.classList.remove('hidden');
  const r = el.getBoundingClientRect(), bs = ['pull-1', 'pull-10', 'pull-10b'].map(id => document.getElementById(id).getBoundingClientRect());
  const tapa = bs.some(b => r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top);
  const b = bs[1], hit = document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2);
  const res = { tapa, toque: !!(hit && hit.closest('#pull-10')), eventos: getComputedStyle(el).pointerEvents, aviso: [Math.round(r.top), Math.round(r.bottom)] };
  if (creado) el.remove(); else { el.innerHTML = antes; el.classList.toggle('hidden', oculto); }
  return res;
};

/** Las píldoras de tipo (G.UI.typeChips) de los 18 tipos: contraste de la letra con su fondo. */
const PILDORAS = () => {
  const rgb = s => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  const lum = v => { const [r, g, b] = v.map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const caja = document.createElement('div');
  caja.innerHTML = G.UI.typeChips(Object.keys(G.U.TYPE_COLOR));
  document.body.appendChild(caja);
  const r = [...caja.children].map(el => { const cs = getComputedStyle(el); return { tipo: el.textContent, ratio: +ratio(rgb(cs.color), rgb(cs.backgroundColor)).toFixed(2) }; });
  caja.remove();
  return r;
};

// ---------------- gacha ----------------
const MEDIR_GACHA = () => {
  const W = innerWidth, H = innerHeight, b = document.getElementById('banner').getBoundingClientRect();
  const box = document.querySelector('#scr-gacha > .box');
  const lienzos = [...document.querySelectorAll('#gacha-feat canvas')].map(c => {
    const r = c.getBoundingClientRect();
    return { dentroBanner: r.left >= b.left - 0.5 && r.right <= b.right + 0.5 && r.top >= b.top - 0.5 && r.bottom <= b.bottom + 0.5,
      dentroVentana: r.left >= -0.5 && r.right <= W + 0.5 && r.top >= -0.5 && r.bottom <= H + 0.5, altoCss: +r.height.toFixed(2), alto: c.height, anchoCss: +r.width.toFixed(2), ancho: c.width };
  });
  const botones = ['pull-1', 'pull-10', 'pull-10b'].map(id => { const r = document.getElementById(id).getBoundingClientRect(); return r.top >= 0 && r.bottom <= H + 0.5 && r.left >= 0 && r.right <= W + 0.5; });
  return { lienzos, botones, desplaza: box.scrollHeight - box.clientHeight, banner: [Math.round(b.width), Math.round(b.height)] };
};

async function gachaBanners(P) {
  const { page } = P, malos = [], innerAlto = P.v.h, tiras = [];
  for (const e of ESTILOS) {
    await estilo(page, e);
    await page.evaluate('G.MenuUI.open(); G.GachaUI.open();');
    await sleep(350);   // la caja entra con una animación de escala (pop, 0,22 s)
    for (let g = 1; g <= 9; g++) {
      await page.click(`#gacha-gens .gen-tab[data-gen="${g}"]`);
      await sleep(60);
      { const t = await page.evaluate(MEDIR_TIRA); if (!t.entera || !t.clases) tiras.push({ estilo: e, ...t }); }
      const m = await page.evaluate(MEDIR_GACHA);
      // En pantallas bajas cabe todo sin desplazar; con más alto (un plegable), las probabilidades van debajo y se llega desplazando.
      const ok = m.lienzos.length === 3 && m.lienzos.every(l => l.dentroBanner && l.dentroVentana && Math.abs(l.altoCss - l.alto) < 0.01 && Math.abs(l.anchoCss - l.ancho) < 0.01) &&
        m.botones.every(Boolean) && (m.desplaza <= 1 || innerAlto >= 520);
      if (!ok) malos.push({ estilo: e, banner: g, ...m });
    }
  }
  return { malos, tiras };
}

/** Tira por la interfaz real y mide el resultado. La animación de la tragaperras se salta (sólo en la prueba:
 *  la tirada ya está hecha cuando empieza); se ve entera en su captura. */
async function tirar(P, boton) {
  const { page } = P;
  await page.evaluate(() => { if (!G.Slots.__play) G.Slots.__play = G.Slots.play; G.Slots.play = () => Promise.resolve(); });
  await page.click('#' + boton);
  const t0 = Date.now();
  while (Date.now() - t0 < 20000) {
    if (await page.locator('#pull-close').isVisible().catch(() => false)) break;
    if (await page.locator('#slot').isVisible().catch(() => false)) await page.locator('#slot').click({ force: true }).catch(() => {});
    await sleep(150);
  }
  await sleep(450);   // que termine la entrada de las cartas
  const bordes = await page.evaluate(BORDES, '#pull-results .pcard > canvas');
  const r = await page.evaluate(() => {
    const fx = document.getElementById('pull-fx'), c = document.getElementById('pull-close').getBoundingClientRect(), H = innerHeight, W = innerWidth;
    const cartas = [...document.querySelectorAll('#pull-results .pcard')].map(k => k.getBoundingClientRect());
    const pisa = cartas.filter(r => r.left < c.right && r.right > c.left && r.top < c.bottom && r.bottom > c.top).length;
    const lienzos = [...document.querySelectorAll('#pull-results .pcard > canvas')].map(k => ({ w: k.width, h: k.height, css: [k.getBoundingClientRect().width, k.getBoundingClientRect().height] }));
    return { cartas: cartas.length, desplaza: fx.scrollHeight - fx.clientHeight, continuarVisible: c.top >= 0 && c.bottom <= H + 0.5 && c.left >= 0 && c.right <= W + 0.5,
      pisa, fuera: cartas.filter(r => r.bottom > H + 0.5 || r.right > W + 0.5 || r.left < -0.5 || r.top < -0.5).length,
      lienzos: lienzos.slice(0, 2), escalaCss: lienzos.every(l => Math.abs(l.css[0] - l.w) < 0.01 && Math.abs(l.css[1] - l.h) < 0.01) };
  });
  await page.evaluate(() => { if (G.Slots.__play) G.Slots.play = G.Slots.__play; });
  r.premioCortado = bordes.filter(x => x.sinColocar || x.toca).map(x => ({ nombre: x.nombre, lienzo: x.lienzo, k: x.k, peor: x.peor }));
  r.premioK = bordes.map(x => x.k).join('');
  return r;
}

/** Una ×10 por la interfaz real con diez repetidos que desbloquean su evolución: las diez de nombre más largo (el
 *  peor caso de la etiqueta), una de cada tres en shiny. Sólo dentro de esa tirada, G.Gacha.pull devuelve ese guion
 *  (y se gasta su ticket); la carta, la etiqueta y el premio los pintan gacha-ui.js, mods.js y estilo.js de verdad.
 *  Mide que cada etiqueta está entera (sin recortar, dentro de su carta y con el nombre de la evolución) y que cada
 *  carta se llega a ver entera sin «Continuar» encima (en una pantalla baja, sin desplazar nada). */
async function tirarRepetidos(P) {
  const { page } = P;
  await page.evaluate(() => {
    if (!G.Slots.__play) G.Slots.__play = G.Slots.play;
    G.Slots.play = () => Promise.resolve();
    const largos = Object.keys(G.EVO).map(Number).filter(d => G.DEX_BY[d]).map(d => ({ d, e: G.EVO[d][0] })).filter(x => G.DEX_BY[x.e])
      .sort((a, b) => G.DEX_BY[b.e].name.length - G.DEX_BY[a.e].name.length || a.d - b.d).slice(0, 10);
    const pull = G.Gacha.pull;
    G.Gacha.pull = function (save, n) {
      G.Gacha.pull = pull;
      save.tickets.t1 -= n;
      return largos.slice(0, n).map((x, i) => ({ dex: x.d, rarity: G.DEX_BY[x.d].rarity || 3, shiny: i % 3 === 0 && G.Sprites.hasShiny(x.d) && G.Sprites.hasShiny(x.e), isNew: false, refund: 0, evo: x.e }));
    };
    window.__evos = largos.map(x => G.DEX_BY[x.e].name);
  });
  await page.click('#pull-10');
  for (let i = 0; i < 130 && !(await page.locator('#pull-close').isVisible().catch(() => false)); i++) await sleep(150);
  await sleep(500);
  const r = await page.evaluate(() => {
    const fx = document.getElementById('pull-fx'), close = document.getElementById('pull-close'), H = innerHeight, W = innerWidth;
    const cartas = [...document.querySelectorAll('#pull-results .pcard')];
    const etiquetas = cartas.map((k, i) => {
      const t = k.querySelector('.tag'), tr = t.getBoundingClientRect(), kr = k.getBoundingClientRect(), cs = getComputedStyle(t);
      return { nombre: window.__evos[i], texto: t.innerText.replace(/\s+/g, ' ').trim(), conNombre: t.innerText.replace(/\s+/g, ' ').includes(window.__evos[i]),
        recortada: t.scrollHeight > t.clientHeight + 1 || t.scrollWidth > t.clientWidth + 1 || tr.bottom > kr.bottom + 0.5 || tr.top < kr.top - 0.5 || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') };
    });
    const vista = cartas.map(() => false), max = fx.scrollHeight - fx.clientHeight;
    for (let y = 0; y <= max + 8; y += 4) {
      fx.scrollTop = y;
      const c = close.getBoundingClientRect();
      cartas.forEach((k, i) => { const q = k.getBoundingClientRect();
        if (q.top >= -0.5 && q.bottom <= H + 0.5 && q.left >= -0.5 && q.right <= W + 0.5 && !(q.left < c.right && q.right > c.left && q.top < c.bottom && q.bottom > c.top)) vista[i] = true; });
    }
    fx.scrollTop = 0;
    const filas = {};
    cartas.forEach(k => { const t = Math.round(k.getBoundingClientRect().top); filas[t] = (filas[t] || 0) + 1; });
    return { cartas: cartas.length, desplaza: max, filas: Object.values(filas).join('+'), nuncaEnteras: vista.filter(x => !x).length,
      malas: etiquetas.filter(x => !x.conNombre || x.recortada), ejemplo: etiquetas.slice(0, 2) };
  });
  await page.evaluate(() => { if (G.Slots.__play) G.Slots.play = G.Slots.__play; });
  return r;
}

// ---------------- píxeles opacos de los lienzos (que no se corte ningún sprite) ----------------
/* Para cada lienzo que anima G.Estilo (destacados, compañero, premio): dibuja cada fotograma de Idle y de
 * las animaciones de vida que deja en ese lienzo, con su colocación (k y pies) y la sombra, y mide la caja
 * de píxeles opacos: no puede tocar el borde. */
const BORDES = async sel => {
  const S = G.Sprites, PX = S.PX, cvs = [...document.querySelectorAll(sel)];
  for (let i = 0; i < 200 && cvs.some(c => !G.Estilo.colocacion(c)); i++) await new Promise(r => setTimeout(r, 50));
  const tmp = document.createElement('canvas'), ctx = tmp.getContext('2d', { willReadFrequently: true }), out = [];
  for (const c of cvs) {
    const e = G.Estilo.colocacion(c);
    if (!e) { out.push({ sinColocar: true }); continue; }
    tmp.width = c.width; tmp.height = c.height;
    await S.preload([e.dex], 15000, e.shiny);
    let peor = null, toca = 0, fotogramas = 0;
    for (const anim of ['Idle', ...e.vida]) {
      const m = S.animMeta(e.dex, anim, e.shiny);
      for (let f = 0; f < m.n; f++) {
        const a = new S.Animator(e.dex, 1, e.shiny);
        a.scale = e.k / PX; a.dir = e.dir; a.cur = anim; a.frame = f;
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(e.fx, e.fy, 9 * e.k, 3.4 * e.k, 0, 0, 6.2832); ctx.fill();
        a.draw(ctx, e.fx, e.fy);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; }
        fotogramas++;
        if (x1 < 0) continue;
        const margen = Math.min(x0, y0, c.width - 1 - x1, c.height - 1 - y1);
        if (margen <= 0) toca++;
        if (!peor || margen < peor.margen) peor = { anim, f, margen, caja: [x0, y0, x1, y1] };
      }
    }
    out.push({ dex: e.dex, nombre: (G.DEX_BY[e.dex] || {}).name, lienzo: c.width + 'x' + c.height, k: e.k, vida: e.vida, fotogramas, toca, peor });
  }
  return out;
};
/** 30 fotogramas de verdad de los lienzos de `sel`: ¿toca algún píxel opaco el borde? */
const BORDES_VIVOS = async sel => {
  const cvs = [...document.querySelectorAll(sel)], res = cvs.map(() => ({ toca: 0, minMargen: 1e9, vacios: 0 }));
  for (let i = 0; i < 30; i++) {
    await new Promise(r => requestAnimationFrame(r));
    cvs.forEach((c, j) => {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; }
      if (x1 < 0) { res[j].vacios++; return; }
      const mg = Math.min(x0, y0, c.width - 1 - x1, c.height - 1 - y1);
      if (mg <= 0) res[j].toca++;
      res[j].minMargen = Math.min(res[j].minMargen, mg);
    });
  }
  return res;
};

// ---------------- franja de tipo en las cartas de nivel ----------------
const FRANJAS = () => {
  const porTipo = {};
  for (const [id, m] of Object.entries(G.Moves.BY_ID)) if (!porTipo[m.type]) porTipo[m.type] = id;
  const cartas = Object.entries(porTipo).map(([tipo, id]) => ({ w: 10, type: 'new', key: 'new:' + id, icon: 'move:' + id, color: G.U.TYPE_COLOR[tipo],
    tag: G.U.TYPE_NAME[tipo], title: G.Moves.BY_ID[id].name, desc: G.Moves.BY_ID[id].desc, apply() {} }));
  G.RunUI.showLevelUp(7, cartas, () => {});
  const rgb = s => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  const lum = v => { const [r, g, b] = v.map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  return [...document.querySelectorAll('#cards .card')].map(el => {
    const be = getComputedStyle(el, '::before'), fondo = rgb(getComputedStyle(el).backgroundColor), franja = rgb(be.backgroundColor);
    const filo = /inset/.test(be.boxShadow) && /238, 246, 247/.test(be.boxShadow);
    const conFilo = filo ? ratio(franja.map((v, i) => Math.round(v * 0.65 + [238, 246, 247][i] * 0.35)), fondo) : 0;
    return { tipo: el.dataset.tipo, contenido: be.content, ancho: parseFloat(be.width), alto: Math.round(parseFloat(be.height)), cartaAlto: Math.round(el.getBoundingClientRect().height),
      contraste: +ratio(franja, fondo).toFixed(2), conFilo: +conFilo.toFixed(2), tabindex: el.tabIndex, role: el.getAttribute('role') };
  });
};

// ---------------- teclado: Tab y el anillo de foco ----------------
async function tabula(page, n, sel) {
  const vistos = [];
  for (let i = 0; i < n; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(s => {
      const a = document.activeElement;
      if (!a || !a.matches(s)) return null;
      const cs = getComputedStyle(a);
      return { que: (a.textContent || '').trim().slice(0, 24), anillo: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 ? cs.outlineColor : null };
    }, sel);
    if (f) vistos.push(f);
  }
  return vistos;
}

// ---------------- HUD Dex en partida (lote 2) ----------------
/** Escena de prueba en la partida real (sólo en la prueba): un jefe a la vista, su aviso, lluvia, mejoras, objeto,
 *  cuatro ataques y, si se pide, tres compañeros simulados (cambiando G.Coop sólo mientras se pinta el HUD). */
const ESCENA_HUD = op => {
  const pl = G.Game.player, W = innerWidth, H = innerHeight, cam = G.Camera;
  for (const x of document.querySelectorAll('.ach-pop, .toast')) x.remove();
  if (op.jefe !== false && !G.EnemyMgr.all().some(e => e.boss && !e.dead)) {
    // A la vista, en la zona libre (sin flecha): a la derecha y algo abajo de tu Pokémon.
    const b = new G.Enemy({ dex: 983, hp: 5000, spd: 0, dmg: 0, xp: 0, behavior: 'melee' }, pl.x + (op.jefeX || 0.18) * W / cam.scale, pl.y + 0.12 * H / cam.scale, { hp: 1, spd: 1, dmg: 1 }, true);
    b.hp = b.maxHp * 0.64; b.spd = 0; G.EnemyMgr.add(b);
  }
  if (op.lluvia !== false) G.Weather.onEvent(['w', 'rain', 90]);
  pl.buffs.atk.n = 2; pl.buffs.spd.n = 1;
  for (const id of Object.keys(G.Moves.BY_ID).filter(id => !pl.hasMove(id)).slice(0, Math.max(0, 4 - pl.slots.length))) pl.addMove(id);
  pl.item = Object.keys(G.Items.BY)[0];
  G.Coop.local && (G.Coop.local.hurt = function () {});
  pl.hurt = function () {};
  if (op.aviso !== false) G.Spawner.say('¡Kingambit salvaje apareció!', 600, true);
  if (op.companeros && !window.__hudCoop) {
    const mk = (name, color, dx, dy, dead) => ({ name, color, connected: true, pl: { x: pl.x + dx, y: pl.y + dy, hp: 50, maxHp: 80, dead: !!dead, bodyH: 30 } });
    const mates = [mk('Ana', '#5FC8FF', -1800, 200, true), mk('Leo', '#7EE07A', 60, 40), mk('Sol', '#FF8AD8', 300, 2200)];
    const orig = G.HUD.draw, C = G.Coop;
    window.__hudCoop = { orig, mates };
    G.HUD.draw = function (ctx, w, h, p, st) {
      const dA = Object.getOwnPropertyDescriptor(C, 'active'), dM = Object.getOwnPropertyDescriptor(C, 'mates'), pP = C.players;
      Object.defineProperty(C, 'active', { get: () => true, configurable: true });
      Object.defineProperty(C, 'mates', { get: () => mates, configurable: true });
      C.players = () => [p, ...mates.map(m => m.pl)];
      try { return orig.call(this, ctx, w, h, p, st); } finally { Object.defineProperty(C, 'active', dA); Object.defineProperty(C, 'mates', dM); C.players = pP; }
    };
  }
};
/** El HUD Dex pintado en un lienzo transparente aparte (sin mundo, dpr 1): la fila opaca más baja de la mitad de arriba
 *  (sin las columnas laterales) y las bandas que dice G.HudDex.bandas(). */
const BANDA_PIXELES = async () => {
  const W = innerWidth, H = innerHeight, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'), pl = G.Game.player, st = { time: 100 };
  G.HudDex.draw(ctx, W, H, pl, st);
  await new Promise(r => setTimeout(r, 300));
  ctx.clearRect(0, 0, W, H);
  G.HudDex.draw(ctx, W, H, pl, st);
  const B = G.HudDex.bandas(), d = ctx.getImageData(0, 0, W, H).data;
  let fila = -1;
  for (let y = Math.floor(H / 2) - 1; y >= 0 && fila < 0; y--) {
    for (let x = Math.ceil(B.izq); x < W - B.der; x++) if (d[(y * W + x) * 4 + 3] > 8) { fila = y; break; }
  }
  return { sup: B.sup, inf: B.inf, izq: B.izq, der: B.der, variante: B.variante, escala: B.escala, filaOpaca: fila + 1, flechas: B.flechas.length };
};
/** Contraste de cada texto del HUD en los píxeles de verdad del lienzo del juego: color del texto frente a la mediana de
 *  lo que hay en su caja y no es texto (el panel, o el contorno si va suelto). Devuelve las razones. */
const CONTRASTE_PIXELES = async () => {
  const cv = document.getElementById('game'), ctx = cv.getContext('2d'), textos = [];
  const orig = G.HUD.draw;
  G.HUD.draw = function (c, w, h, p, st) {
    const ft = c.fillText;
    c.fillText = function (t, x, y) {
      const m = c.getTransform(), tam = +(/(\d+)px/.exec(c.font) || [0, 11])[1], wd = c.measureText(t).width;
      const al = c.textAlign, x0 = al === 'center' ? x - wd / 2 : al === 'right' ? x - wd : x;
      if (/\p{L}|\d/u.test(t) && c.globalAlpha > 0.95) textos.push({ t, col: String(c.fillStyle), x0: m.a * x0 + m.e, y0: m.d * (y - tam * 0.75) + m.f, x1: m.a * (x0 + wd) + m.e, y1: m.d * (y + tam * 0.1) + m.f });
      return ft.call(this, t, x, y);
    };
    try { return orig.call(this, c, w, h, p, st); } finally { delete c.fillText; }
  };
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  G.HUD.draw = orig;
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const rgb = s => { const p = document.createElement('canvas').getContext('2d'); p.fillStyle = s; const v = p.fillStyle; if (v[0] === '#') { const n = parseInt(v.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; } return (/\(([^)]+)\)/.exec(v) || [0, '0,0,0'])[1].split(',').slice(0, 3).map(Number); };
  const out = [];
  for (const T of textos) {
    const x = Math.max(0, Math.floor(T.x0)), y = Math.max(0, Math.floor(T.y0)), w = Math.min(cv.width - x, Math.ceil(T.x1 - T.x0)), h = Math.min(cv.height - y, Math.ceil(T.y1 - T.y0));
    if (w < 2 || h < 2) continue;
    const d = ctx.getImageData(x, y, w, h).data, c = rgb(T.col), lc = lum(c), fondo = [];
    for (let i = 0; i < d.length; i += 4) {
      const dist = Math.abs(d[i] - c[0]) + Math.abs(d[i + 1] - c[1]) + Math.abs(d[i + 2] - c[2]);
      if (dist > 90) fondo.push(lum([d[i], d[i + 1], d[i + 2]]));
    }
    if (fondo.length < 4) continue;
    fondo.sort((a, b) => a - b);
    const lf = fondo[Math.floor(fondo.length / 2)];
    out.push({ t: T.t, r: +((Math.max(lc, lf) + 0.05) / (Math.min(lc, lf) + 0.05)).toFixed(2) });
  }
  return out;
};
/** Con la letra de verdad: el sensor de Rotom con cada bioma y cada arena (con y sin clima) y la pista de controles del
 *  principio, pintados en un lienzo aparte. Devuelve los textos recortados con «…» o con «Grieta · » en Rotom, y la pista. */
const TEXTOS_ENTEROS = async () => {
  const W = innerWidth, H = innerHeight, pl = G.Game.player, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'), textos = [], ft = ctx.fillText;
  ctx.fillText = function (t, x, y) { const m = ctx.getTransform(); textos.push({ t: String(t), x: m.a * x + m.e, y: m.d * y + m.f }); return ft.call(this, t, x, y); };
  const dentro = (o, R) => R && o.x >= R.x - 1 && o.x <= R.x + R.w + 1 && o.y >= R.y - 1 && o.y <= R.y + R.h + 1;
  const bn = G.World.biomeName, dW = Object.getOwnPropertyDescriptor(G.Weather, 'current'), ban = G.Spawner.banner;
  const lluvia = { name: 'Lluvia', icon: 'wrain', left: 67, mult: { water: 1.5, fire: 0.5 }, kind: 'rain' };
  const malos = [];
  let n = 0;
  try {
    for (const clima of [null, lluvia]) {
      Object.defineProperty(G.Weather, 'current', { get: () => clima, configurable: true });
      for (const b of G.Tiles.BIOMES) {
        G.World.biomeName = () => b.name;
        textos.length = 0;
        G.HudDex.draw(ctx, W, H, pl, { time: 100 });
        const B = G.HudDex.bandas(), R = B.piezas.rotom;
        if (R.modo === 'cara') continue;
        const tx = textos.filter(o => dentro(o, R)).map(o => o.t), limpio = b.name.replace(/^Grieta · /, '');
        const debe = !clima || B.variante !== 'compacto';
        if (tx.some(x => /…/.test(x) || /^Grieta ·/.test(x)) || (debe && !tx.join(' ').includes(limpio))) malos.push({ clima: !!clima, nombre: b.name, tx });
        n++;
      }
    }
  } finally { G.World.biomeName = bn; Object.defineProperty(G.Weather, 'current', dW); }
  // La pista de controles (los primeros 14 s, con la ranura de avisos libre).
  let pista = null;
  try {
    G.Spawner.banner = () => null;
    G.HudDex.Avisos.reiniciar();
    G.HudDex.draw(ctx, W, H, pl, { time: 3 });
    await new Promise(r => setTimeout(r, 350));
    textos.length = 0;
    G.HudDex.draw(ctx, W, H, pl, { time: 3.4 });
    const v = G.HudDex.Avisos.visible, A = G.HudDex.bandas().piezas.aviso;
    const tx = textos.filter(o => dentro(o, A)).map(o => o.t);
    pista = { tx, variantes: v && v.variantes, larga: !!(v && v.variantes && tx[0] === v.variantes[0]) };
  } finally { G.Spawner.banner = ban; G.HudDex.Avisos.reiniciar(); }
  return { n, malos, pista };
};
/** Las flechas del mismo cuadrante: el jefe y los tres compañeros simulados (ESCENA_HUD con compañeros) arriba a la
 *  derecha y lejos; el HUD pintado en un lienzo aparte con la letra de verdad, apuntando cada etiqueta. Devuelve los
 *  problemas: flechas o etiquetas que se pisan, o etiquetas fuera de la zona libre o de la pantalla. */
const FLECHAS_CUADRANTE = () => {
  const pl = G.Game.player, cam = G.Camera, W = innerWidth, H = innerHeight, k = 1 / cam.scale;
  for (const e of G.EnemyMgr.all()) if (e.boss && !e.dead) { e.x = pl.x + 1.4 * W * k; e.y = pl.y - 0.9 * H * k; }
  const m = window.__hudCoop && window.__hudCoop.mates;
  if (m) [[2.0, -0.4], [0.9, -1.5], [2.5, -1.1]].forEach(([dx, dy], i) => { m[i].pl.x = pl.x + dx * W * k; m[i].pl.y = pl.y + dy * H * k; });
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'), ft = ctx.fillText, textos = [];
  ctx.fillText = function (t, x, y) {
    const tm = ctx.getTransform(), w = ctx.measureText(t).width, al = ctx.textAlign, x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
    const tam = +(/(\d+)px/.exec(ctx.font) || [0, 11])[1];
    textos.push({ t: String(t), x: tm.a * x0 + tm.e, y: tm.d * (y - tam * 0.75) + tm.f, w, h: tam * 0.95 });
    return ft.call(this, t, x, y);
  };
  G.HUD.draw(ctx, W, H, pl, G.Game.st);
  const B = G.HudDex.bandas(), Z = B.zona, F = B.flechas;
  const cruzan = (a, b) => a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
  const et = textos.filter(o => /· \d+ m$/.test(o.t)), mal = [];
  for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) if (F[i].cajas.some(a => F[j].cajas.some(b => cruzan(a, b)))) mal.push(F[i].tipo + '/' + F[j].tipo);
  for (let i = 0; i < et.length; i++) for (let j = i + 1; j < et.length; j++) if (cruzan(et[i], et[j])) mal.push('«' + et[i].t + '» y «' + et[j].t + '»');
  for (const o of et) if (o.x < Z.x - 0.5 || o.y < Z.y - 0.5 || o.x + o.w > Z.x + Z.w + 0.5 || o.y + o.h > Z.y + Z.h + 0.5) mal.push('«' + o.t + '» fuera de la zona libre');
  return { flechas: F.length, tipos: F.map(f => f.tipo), etiquetas: et.map(o => ({ t: o.t, x: Math.round(o.x), y: Math.round(o.y), w: Math.round(o.w) })), zona: Z, mal };
};
/** Un aviso de logro (el elemento de progress.js) en plena partida: dónde sale con el HUD Dex. */
const LOGRO = () => {
  let el = document.getElementById('ach-pop');
  if (!el) { el = document.createElement('div'); el.id = 'ach-pop'; el.className = 'box ach-pop'; document.body.appendChild(el); }
  el.innerHTML = '<div><b>¡Logro: Prueba!</b><small>Nuevo título: Prueba</small></div>';
  el.classList.remove('hidden');
  G.MODS.avisoEnEspera(() => {});
  const r = el.getBoundingClientRect(), B = G.HudDex.bandas();
  const out = { top: Math.round(r.top), bottom: Math.round(r.bottom), sup: Math.round(B.juego.y + B.sup), alto: innerHeight, estado: G.Game.state, clase: document.documentElement.classList.contains('hud-dex-logro') };
  el.remove();
  return out;
};
const percentil = (v, p) => { const s = v.slice().sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };
const VP_HUD = {
  pc: VP.pc, movil: VP.movil, movilBajo: VP.movilBajo, pleg1: VP.pleg1, pleg2: VP.pleg2, exterior: VP.exterior,
  mesa: { w: 784, h: 362, dpr: 3, tactil: true },      // el Magic V6 a medio plegar en modo mesa: la mitad de arriba
  tab: VP.tab
};

async function pruebaHud(browser) {
  for (const [clave, v] of Object.entries(VP_HUD)) {
    const P = await nuevo(browser, v), { page } = P, nv = nombreVp(v);
    if (!await entrar(P)) { check(`${nv}: HUD: se entra a jugar`, false); await P.ctx.close(); continue; }
    await page.evaluate(() => { G.Estilo.set('dex'); G.Flow.play(); });
    await sleep(1200);
    // El aviso de logro que salió en el menú («Primer compañero», del invitado nuevo) baja al empezar la partida.
    const logroMenu = await page.evaluate(() => {
      const el = document.getElementById('ach-pop');
      if (!el || el.classList.contains('hidden')) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), sup: Math.round(G.HudDex.bandaSup()), alto: innerHeight, texto: el.textContent.trim().slice(0, 40) };
    });
    await page.evaluate(ESCENA_HUD, {});
    await sleep(2200);    // que se vaya la píldora del ataque y se horneen los sprites
    // La banda superior medida en píxeles (HUD sin mundo) es la que dice el HUD (y check.js).
    const b = await page.evaluate(BANDA_PIXELES);
    report.medidas['hud-' + nv] = b;
    const compacto = b.variante === 'compacto';
    check(`${nv}: HUD Dex (${b.variante}, ×${b.escala}): la banda de arriba medida en píxeles con el HUD en un lienzo aparte (${b.filaOpaca} px) es la de G.HudDex.bandas() (${b.sup})${compacto && v.h < 520 ? ', ≤ 20 % del alto (criterio de Nico)' : ''}`,
      b.flechas === 0 && Math.abs(b.filaOpaca - b.sup) <= 1 && (!compacto || v.h >= 520 || (b.sup + b.inf) / v.h <= 0.2), b);
    // Con la letra de verdad: ningún nombre de bioma o de arena recortado en Rotom y la pista de controles entera.
    const te = await page.evaluate(TEXTOS_ENTEROS);
    report.medidas['hud-textos-' + nv] = te;
    check(`${nv}: con la letra de verdad, el sensor de Rotom enseña entero cada bioma y cada arena (${te.n} casos, con y sin lluvia; sin «Grieta · » ni «…») y la pista de controles del principio sale entera${clave === 'pc' ? ' (la larga)' : ''}: «${te.pista && te.pista.tx[0]}»`,
      te.n >= 40 && !te.malos.length && te.pista && te.pista.tx.length === 1 && te.pista.variantes.includes(te.pista.tx[0]) && !/…/.test(te.pista.tx[0]) && (clave !== 'pc' || te.pista.larga),
      { malos: te.malos.slice(0, 5), pista: te.pista });
    await sleep(700);    // la ranura de avisos vuelve a enseñar el del jefe (se ha vaciado para mirar la pista)
    // El aviso de logro en partida: bajo la banda de arriba del HUD (en pantallas bajas, abajo, como upstream).
    if (['pc', 'tab', 'movil', 'pleg2'].includes(clave)) {
      const lg = await page.evaluate(LOGRO);
      report.medidas['hud-logro-' + nv] = lg;
      const bajo = v.h < 521;
      const menuOk = !logroMenu || (bajo ? logroMenu.bottom >= logroMenu.alto - 30 : logroMenu.top >= logroMenu.sup + 8 - 3);
      report.medidas['hud-logro-menu-' + nv] = logroMenu;
      check(`${nv}: un aviso de logro en partida con el HUD Dex sale ${bajo ? 'abajo (pantalla baja, como upstream)' : `bajo la banda de arriba del HUD (${lg.top} px ≥ ${lg.sup} + 8)`} y no tapa la ranura de avisos ni la entrada del jefe; ${logroMenu ? `el que salió en el menú («${logroMenu.texto}») también, al empezar la partida (${logroMenu.top} px)` : 'no quedaba ninguno del menú'}`,
        lg.estado === 'playing' && lg.clase && (bajo ? lg.bottom >= lg.alto - 30 && lg.top > lg.sup : lg.top >= lg.sup + 8 - 3) && menuOk, { lg, logroMenu });
    }
    // El plegable abierto: nada del HUD sobre el pliegue (por si está a medio plegar).
    if (clave === 'pleg1' || clave === 'pleg2') {
      const pg = await page.evaluate(() => {
        const B = G.HudDex.bandas(), P = B.piezas, g = B.pliegue, L = [];
        for (const k of ['ficha', 'contador', 'rotom', 'pausa', 'jefe', 'aviso', 'objeto', 'vinculo']) if (P[k]) L.push({ n: k, ...P[k] });
        ['ranuras', 'chips', 'companeros'].forEach(k => (P[k] || []).forEach((r, i) => L.push({ n: k + i, ...r })));
        const pisa = g ? L.filter(p => g.eje === 'x' ? p.x < g.pos + g.ancho / 2 && p.x + p.w > g.pos - g.ancho / 2 : p.y < g.pos + g.ancho / 2 && p.y + p.h > g.pos - g.ancho / 2).map(p => p.n) : null;
        return { pliegue: g, pisa };
      });
      report.medidas['hud-pliegue-' + nv] = pg;
      check(`${nv}: plegable abierto: ninguna pieza del HUD Dex (contador, jefe, aviso, ranuras, objeto…) pisa la franja del pliegue (${pg.pliegue ? `${pg.pliegue.eje === 'x' ? 'vertical en x' : 'horizontal en y'} = ${pg.pliegue.pos}` : 'sin pliegue'})`,
        pg.pliegue && !pg.pisa.length, pg);
    }
    // Pares Dex/Clásico del mismo momento (bosque, jefe con su aviso y lluvia).
    await captura(page, `hud-jefe-dex-${nv}`);
    await estilo(page, 'clasico');
    await sleep(250);
    await captura(page, `hud-jefe-clasico-${nv}`);
    await estilo(page, 'dex');
    if (v.tactil && clave === 'movil') {
      // Tocar la ranura 2 la activa; tocar la pausa pausa (con el dedo, por la interfaz real).
      const antes = await page.evaluate(() => { G.Game.player.setActive(0); return G.Game.player.active; });
      await sleep(100);
      const r2 = await page.evaluate(() => { const R = G.HudDex.bandas().piezas.ranuras[1]; return { x: R.x + R.w / 2, y: R.y + R.h / 2, w: R.w }; });
      await page.touchscreen.tap(r2.x, r2.y);
      await sleep(150);
      const despues = await page.evaluate(() => G.Game.player.active);
      const pz = await page.evaluate(() => { const R = G.HudDex.bandas().piezas.pausa; return R && { x: R.x + R.w / 2, y: R.y + R.h / 2, w: R.w, h: R.h }; });
      if (pz) await page.touchscreen.tap(pz.x, pz.y);
      await sleep(250);
      const estado = await page.evaluate(() => G.Game.state);
      check(`${nv}: tocar la ranura 2 del HUD Dex la activa (columna a la derecha, ${r2.w} px) y el botón de pausa (${pz && pz.w}x${pz && pz.h}) pausa`,
        antes === 0 && despues === 1 && pz && pz.w >= 44 && estado === 'paused', { antes, despues, pz, estado });
      await page.evaluate(() => { if (G.Game.state === 'paused') G.Game.togglePause(); G.UI.hideAll(); });
      await sleep(200);
    }
    if (clave === 'pc' || clave === 'movil') {
      // Contraste en píxeles reales, en los tres biomas, una arena y con lluvia.
      const res = {};
      for (const [n, fn] of [['bosque', 'G.Weather.onEvent(["w"]); G.World.setBiome(0, true)'], ['cueva', 'G.World.setBiome(1, true)'], ['volcan', 'G.World.setBiome(2, true)'],
        ['arena', 'G.World.setBiome(G.Tiles.arenaBiome("fire"), true)'], ['lluvia', 'G.World.setBiome(0, true); G.Weather.onEvent(["w", "rain", 90])']]) {
        await page.evaluate(fn);
        await sleep(n === 'lluvia' ? 3400 : 700);
        const r = (await page.evaluate(CONTRASTE_PIXELES)).map(x => x.r);
        res[n] = { textos: r.length, p10: percentil(r, 0.1), mediana: percentil(r, 0.5) };
        if (n === 'lluvia' || n === 'volcan') await captura(page, `hud-${n}-dex-${nv}`);
      }
      report.medidas['hud-contraste-' + nv] = res;
      check(`${nv}: contraste de los textos del HUD Dex en píxeles reales (bosque, cueva, volcán, arena y lluvia): p10 ≥ 3:1 y mediana ≥ 4,5:1`,
        Object.values(res).every(x => x.textos >= 10 && x.p10 >= 3 && x.mediana >= 4.5), res);
    }
    if (clave === 'pc') {
      // Rendimiento: G.HUD.draw, de media por fotograma, con el HUD Dex y con el de upstream (Clásico) en la misma escena.
      // En este Chromium de la prueba (sin pantalla) el de upstream ya ronda los 0,3 ms: se exige que el Dex no cueste
      // más de 0,3 ms por encima de él, y se apuntan los dos.
      const mide = e => page.evaluate(async est => {
        G.Estilo.set(est);
        const orig = G.HUD.draw, t = [];
        G.HUD.draw = function (...a) { const t0 = performance.now(); const r = orig.apply(this, a); t.push(performance.now() - t0); return r; };
        await new Promise(r => setTimeout(r, 2500));
        G.HUD.draw = orig;
        t.sort((a, b) => a - b);
        return { n: t.length, media: +(t.reduce((s, x) => s + x, 0) / t.length).toFixed(3), p95: +t[Math.floor(t.length * 0.95)].toFixed(3) };
      }, e);
      const msC = await mide('clasico'), ms = await mide('dex');
      report.medidas['hud-ms-' + nv] = { dex: ms, clasico: msC };
      check(`${nv}: el HUD Dex cuesta de media ${ms.media} ms por fotograma (p95 ${ms.p95}) y el de upstream ${msC.media} ms en la misma escena: como mucho 0,3 ms más`,
        ms.n > 60 && msC.n > 60 && ms.media <= msC.media + 0.3, { dex: ms, clasico: msC });
    }
    if (clave === 'pc' || clave === 'movil' || clave === 'pleg2' || clave === 'tab') {
      // Cuatro jugadores (tres compañeros simulados en el HUD: uno caído y lejos, otro a la vista y otro lejos) y el jefe lejos.
      await page.evaluate(() => { for (const e of G.EnemyMgr.all()) if (e.boss) { e.x += 3000; e.y -= 400; } });
      await page.evaluate(ESCENA_HUD, { companeros: true, jefe: false, aviso: false });
      await sleep(600);
      if (clave !== 'tab') await captura(page, `hud-4-jugadores-dex-${nv}`);
      // Flechas del mismo cuadrante (el jefe y los tres compañeros, arriba a la derecha y lejos) con la letra de verdad:
      // ni las flechas ni sus etiquetas se pisan, y cada etiqueta, entera dentro de la zona libre.
      const fq = await page.evaluate(FLECHAS_CUADRANTE);
      report.medidas['hud-flechas-' + nv] = fq;
      await sleep(300);
      await captura(page, `hud-flechas-dex-${nv}`);
      check(`${nv}: flechas del mismo cuadrante (jefe, compañero caído y dos compañeros, arriba a la derecha) con la letra de verdad: ${fq.flechas} flechas y ${fq.etiquetas.length} etiquetas, sin pisarse y enteras dentro de la zona libre`,
        fq.flechas === 4 && fq.etiquetas.length === 4 && !fq.mal.length, fq);
      await page.evaluate(() => { const m = window.__hudCoop && window.__hudCoop.mates, pl = G.Game.player; if (m) { [[-1800, 200], [60, 40], [300, 2200]].forEach(([dx, dy], i) => { m[i].pl.x = pl.x + dx; m[i].pl.y = pl.y + dy; }); } });
      // Movimiento reducido: con PS bajos, un compañero caído, flechas y la grieta, dos fotogramas a 400 ms son iguales.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate(() => { if (G.Game.state === 'playing') G.Game.togglePause(); });
      const igual = await page.evaluate(async () => {
        const pl = G.Game.player, W = innerWidth, H = innerHeight, st = G.Game.st;
        pl.hp = pl.maxHp * 0.12;
        const pinta = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; G.HUD.draw(cv.getContext('2d'), W, H, pl, st); return cv.getContext('2d').getImageData(0, 0, W, H).data; };
        pinta(); await new Promise(r => setTimeout(r, 300));
        const a = pinta(); await new Promise(r => setTimeout(r, 400));
        const b = pinta();
        let dif = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) dif++;
        return { dif, flechas: G.HudDex.bandas().flechas.map(f => f.tipo) };
      });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.evaluate(() => { if (G.Game.state === 'paused') G.Game.togglePause(); G.UI.hideAll(); });
      check(`${nv}: con movimiento reducido nada parpadea ni late en el HUD Dex (PS bajos, compañero caído y flechas: dos fotogramas a 400 ms, idénticos)`,
        igual.dif === 0 && igual.flechas.includes('caido'), igual);
    }
    check(`${nv}: HUD Dex: consola sin errores ni avisos`, !P.consola.length, P.consola.slice(0, 5));
    await P.ctx.close();
  }
}

// ---------------- 11. Arreglos de la verificación de los lotes 1 y 2 ----------------
/** Zonas seguras simuladas: Playwright no emula env(safe-area-inset-*), así que en lo que se sirve (las hojas de estilo,
 *  los scripts y la página) cada env(safe-area-inset-X) pasa a los píxeles de `s` ({sup, der, inf, izq}). Sólo en la
 *  prueba: así se ven las reglas que los usan (gacha y tiradas en pantallas bajas) y lo que lee G.Estilo.zonasSeguras(). */
async function simularSeguras(ctx, s) {
  const px = { top: s.sup, right: s.der, bottom: s.inf, left: s.izq };
  await ctx.route(/\/(css\/[^?]+\.css|js\/[^?]+\.js|index\.html|dev\.html)(\?.*)?$/, async route => {
    const r = await route.fetch();
    const body = (await r.text()).replace(/env\(\s*safe-area-inset-(top|right|bottom|left)\s*(?:,[^)]*)?\)/g, (_, k) => px[k] + 'px');
    await route.fulfill({ response: r, body });
  });
}
/** ¿Está el rectángulo r dentro de la ventana menos las zonas seguras s? */
const dentroSeguro = (r, s, W, H) => r.left >= s.izq - 0.5 && r.top >= s.sup - 0.5 && r.right <= W - s.der + 0.5 && r.bottom <= H - s.inf + 0.5;
/** El Magic V6 con la barra del navegador (la ventana, más baja que la pantalla; tamaños estimados por Nico). */
const VP_BARRA = {
  v740: { w: 724, h: 740, dpr: 3, tactil: true, pantalla: [724, 784] }, v700: { w: 724, h: 700, dpr: 3, tactil: true, pantalla: [724, 784] },
  v680: { w: 724, h: 680, dpr: 3, tactil: true, pantalla: [724, 784] }, v660: { w: 724, h: 660, dpr: 3, tactil: true, pantalla: [724, 784] },
  v640: { w: 724, h: 640, dpr: 3, tactil: true, pantalla: [724, 784] }, g700: { w: 784, h: 700, dpr: 3, tactil: true, pantalla: [784, 724] },
  g680: { w: 784, h: 680, dpr: 3, tactil: true, pantalla: [784, 724] }, g640: { w: 784, h: 640, dpr: 3, tactil: true, pantalla: [784, 724] }
};
/** La barra superior: dentro de la ventana, sin partirse en dos filas (con 480 px de ancho o más) y sin tapar el logotipo. */
const MEDIR_BARRA = () => {
  const ve = el => !!el && el.getClientRects().length > 0;
  const tb = document.getElementById('topbar'), q = tb.getBoundingClientRect();
  const logo = [document.querySelector('#tc-card .tc-title'), document.querySelector('#scr-menu .logo')].find(ve).getBoundingClientRect();
  const hijos = [...tb.children].filter(c => c.offsetParent !== null).map(c => c.getBoundingClientRect());
  const filas = [];
  for (const r of hijos) { const c = (r.top + r.bottom) / 2; if (!filas.some(f => Math.abs(f - c) < 12)) filas.push(c); }
  return { barra: [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)], filas: filas.length,
    fuera: hijos.filter(r => r.left < -0.5 || r.right > innerWidth + 0.5 || r.top < -0.5).length,
    logoTapado: q.bottom > logo.top + 0.5 && q.top < logo.bottom && q.left < logo.right && q.right > logo.left, pagina: document.documentElement.scrollWidth - innerWidth };
};
/** «…» con la letra del lienzo en Dex: sus puntos, en la línea base (como el de «.»), no a media altura (M PLUS); y las
 *  caras de M PLUS de la página (DOM y lienzo), sin U+2026 en su unicode-range. */
const PUNTOS = () => {
  const cv = document.createElement('canvas'); cv.width = 200; cv.height = 100;
  const c = cv.getContext('2d', { willReadFrequently: true });
  const tinta = t => {
    c.clearRect(0, 0, 200, 100); c.font = '700 48px Pixelify, "Segoe UI", sans-serif'; c.fillStyle = '#000'; c.textBaseline = 'alphabetic'; c.fillText(t, 20, 70);
    const d = c.getImageData(0, 0, 200, 100).data; let y0 = 100, y1 = -1;
    for (let y = 0; y < 100; y++) for (let x = 0; x < 200; x++) if (d[(y * 200 + x) * 4 + 3] > 40) { if (y < y0) y0 = y; y1 = y; }
    return { arriba: y0, abajo: y1, fuente: c.font };
  };
  const caras = [...document.fonts].filter(f => /M PLUS/.test(f.family)).map(f => f.unicodeRange);
  return { elipsis: tinta('…'), punto: tinta('.'), caras };
};
/** El aviso flotante (toast) al empezar la partida: ¿pisa la fila de ranuras? Clásico: la de upstream (54 px a 18 del
 *  borde, la activa 6 más arriba y su nombre encima: hasta unos 94 px); Dex: la banda de abajo del HUD Dex. */
const TOAST_PARTIDA = () => {
  const t = document.querySelector('.toast'), r = t.getBoundingClientRect(), H = innerHeight;
  const dex = G.Estilo.actual === 'dex', inf = dex ? G.HudDex.bandaInf() : 94;
  return { estado: G.Game.state, estilo: G.Estilo.actual, toast: [Math.round(r.top), Math.round(r.bottom)], limite: Math.round(H - inf), visible: getComputedStyle(t).display !== 'none',
    pisa: r.bottom > H - inf + 0.5 };
};

/** Tiradas ×1, ×10 y la ×10 de repetidos en los dos estilos (como en la sección 2, para las pantallas de la sección 11). */
async function comprobarTiradas(P, nv) {
  const { page } = P;
  for (const e of ESTILOS) {
    await estilo(page, e);
    await page.evaluate('G.MenuUI.open(); G.GachaUI.open();');
    const x1 = await tirar(P, 'pull-1');
    await page.click('#pull-close'); await sleep(200);
    const x10 = await tirar(P, 'pull-10');
    await page.click('#pull-close'); await sleep(200);
    check(`${nv} ${e}: tiradas ×1 y ×10 sin desplazar, con «Continuar» a la vista sin tapar ninguna carta y el premio sin cortes`,
      x1.cartas === 1 && x10.cartas === 10 && [x1, x10].every(x => x.desplaza <= 1 && x.continuarVisible && !x.pisa && !x.fuera && x.escalaCss && !x.premioCortado.length), { x1, x10 });
    const ev = await tirarRepetidos(P);
    await captura(page, `tirada-x10-repetidos-${e}-${nv}`);
    await page.click('#pull-close'); await sleep(200);
    check(`${nv} ${e}: ×10 de diez repetidos (nombres largos): cada etiqueta entera, cada carta a la vista sin «Continuar» encima y sin desplazar`,
      ev.cartas === 10 && !ev.malas.length && !ev.nuncaEnteras && ev.desplaza <= 1, ev);
  }
}

async function pruebaArreglos(browser) {
  // 11a. Menú del plegable con la barra del navegador: los créditos no pisan la caja de estadísticas y todo cabe.
  for (const [clave, v] of Object.entries(VP_BARRA)) {
    const P = await nuevo(browser, v), { page } = P, nv = nombreVp(v);
    if (!await entrar(P)) { check(`${nv}: se entra (barra del navegador)`, false); await P.ctx.close(); continue; }
    for (const e of ESTILOS) {
      await estilo(page, e);
      await page.evaluate(() => { G.MenuUI.open(); document.getElementById('scr-menu').scrollTop = 0; for (const x of document.querySelectorAll('.ach-pop, .toast')) x.classList.add('hidden'); });
      await sleep(300);
      const m = await page.evaluate(MEDIR_MENU);
      report.medidas[`menu-barra-${e}-${nv}`] = m;
      check(`${nv} ${e} (plegable con la barra del navegador): menú principal con las 8 opciones a la vista, entero sin desplazar (${m.sobra} px de más) y la línea de créditos sin pisar ninguna caja`,
        m.opciones === 8 && !m.mal.length && m.sobra <= 1 && !m.logoTapado && !m.creditosPisan, m);
      if (clave === 'v680' || clave === 'g680') await captura(page, `menu-barra-${e}-${nv}`);
    }
    // El pliegue sale de la pantalla: en vertical con la barra (724x700), vertical en x = 362; y nada del HUD encima,
    // tampoco un aviso largo junto al jefe.
    if (clave === 'v700') {
      await page.evaluate(() => { G.Estilo.set('dex'); G.Flow.play(); });
      await sleep(1000);
      await page.evaluate(ESCENA_HUD, { aviso: false });
      await page.evaluate(() => G.Spawner.say('Guardas el vínculo: aprende otro movimiento para usarlo', 600, true));
      await sleep(2400);
      const pg = await page.evaluate(() => {
        const W = innerWidth, H = innerHeight, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const ctx = cv.getContext('2d'), ft = ctx.fillText, textos = [];
        ctx.fillText = function (t, x, y) {
          const m = ctx.getTransform(), w = ctx.measureText(t).width, al = ctx.textAlign, x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
          textos.push({ t: String(t), x0: m.a * x0 + m.e, x1: m.a * (x0 + w) + m.e, y: m.d * y + m.f });
          return ft.call(this, t, x, y);
        };
        G.HudDex.draw(ctx, W, H, G.Game.player, G.Game.st);
        const B = G.HudDex.bandas(), P = B.piezas, g = B.pliegue, A = P.aviso, L = [];
        for (const k of ['ficha', 'contador', 'rotom', 'pausa', 'jefe', 'aviso', 'objeto', 'vinculo']) if (P[k]) L.push({ n: k, ...P[k] });
        ['ranuras', 'chips', 'companeros'].forEach(k => (P[k] || []).forEach((r, i) => L.push({ n: k + i, ...r })));
        const pisa = g ? L.filter(p => g.eje === 'x' ? p.x < g.pos + g.ancho / 2 && p.x + p.w > g.pos - g.ancho / 2 : p.y < g.pos + g.ancho / 2 && p.y + p.h > g.pos - g.ancho / 2).map(p => p.n) : null;
        const tx = A ? textos.filter(o => o.y >= A.y - 1 && o.y <= A.y + A.h + 1 && o.x0 >= A.x - 1 && o.x1 <= A.x + A.w + 1) : [];
        return { pliegue: g, pisa, aviso: A, textos: tx.map(o => o.t), cruzan: g ? tx.filter(o => o.x0 < g.pos + g.ancho / 2 && o.x1 > g.pos - g.ancho / 2).map(o => o.t) : [] };
      });
      report.medidas['hud-pliegue-barra-' + nv] = pg;
      await captura(page, `hud-pliegue-barra-dex-${nv}`);
      check(`${nv} (Magic V6 en vertical con la barra del navegador; pantalla 724x784): el pliegue sigue siendo vertical en x = 362 y ninguna pieza del HUD Dex lo pisa, ni el aviso largo junto al jefe («${pg.textos.join(' / ')}», entero)`,
        pg.pliegue && pg.pliegue.eje === 'x' && pg.pliegue.pos === 362 && pg.pisa && !pg.pisa.length && !pg.cruzan.length && pg.textos.length >= 1 && !pg.textos.some(t => /…$/.test(t)), pg);
      await page.evaluate(salirDePartida);
    }
    // Tiradas ×1 y ×10 (también la de repetidos) con la barra del navegador.
    if (clave === 'v640' || clave === 'g640') await comprobarTiradas(P, nv);
    check(`${nv}: consola sin errores ni avisos (barra del navegador)`, !P.consola.length, P.consola.slice(0, 5));
    await P.ctx.close();
  }

  // 11b. ×10 en un móvil pequeño en horizontal (640x360, 667x375): seis y cuatro, «Continuar» en su esquina libre.
  for (const v of [{ w: 640, h: 360, dpr: 3, tactil: true }, { w: 667, h: 375, dpr: 2, tactil: true }]) {
    const P = await nuevo(browser, v), nv = nombreVp(v);
    if (!await entrar(P)) { check(`${nv}: se entra`, false); await P.ctx.close(); continue; }
    await comprobarTiradas(P, nv);
    check(`${nv}: consola sin errores ni avisos`, !P.consola.length, P.consola.slice(0, 5));
    await P.ctx.close();
  }

  // 11c. Barra superior en anchos de menos de 680 (en vertical): compacta, en una fila (dos, sin salirse, por debajo de 480).
  for (const v of [{ w: 640, h: 780, dpr: 3, tactil: true }, { w: 600, h: 740, dpr: 3, tactil: true }, { w: 520, h: 640 }, { w: 400, h: 700 }]) {
    const P = await nuevo(browser, v), { page } = P, nv = nombreVp(v);
    if (!await entrar(P)) { check(`${nv}: se entra`, false); await P.ctx.close(); continue; }
    for (const e of ESTILOS) {
      await estilo(page, e);
      await page.evaluate(() => { G.MenuUI.open(); for (const x of document.querySelectorAll('.ach-pop, .toast')) x.classList.add('hidden'); });
      await sleep(250);
      const b = await page.evaluate(MEDIR_BARRA);
      report.medidas[`barra-${e}-${nv}`] = b;
      check(`${nv} ${e}: barra superior compacta: dentro de la ventana, ${v.w >= 480 ? 'en una fila' : 'en dos filas como mucho'}, sin desplazamiento horizontal y sin tapar el logotipo`,
        !b.fuera && b.filas <= (v.w >= 480 ? 1 : 2) && b.pagina <= 0 && !b.logoTapado, b);
      if (v.w === 600) await captura(page, `barra-${e}-${nv}`);
    }
    await P.ctx.close();
  }

  // 11d. El aviso flotante (toast) del menú, si sigue en pantalla al empezar la partida, no pisa la fila de ranuras.
  for (const v of [VP.pc, VP.tab, VP.movil]) {
    const P = await nuevo(browser, v), { page } = P, nv = nombreVp(v);
    if (!await entrar(P)) { check(`${nv}: se entra`, false); await P.ctx.close(); continue; }
    for (const e of ESTILOS) {
      await estilo(page, e);
      await page.evaluate(() => { G.UI.toast('¡Bulbasaur se une a ti!', 5000); G.Flow.play(); });
      await sleep(700);
      const t = await page.evaluate(TOAST_PARTIDA);
      report.medidas[`toast-${e}-${nv}`] = t;
      if (v === VP.pc) await captura(page, `toast-partida-${e}-${nv}`);
      check(`${nv} ${e}: el aviso «¡Bulbasaur se une a ti!» del menú, al empezar la partida, queda por encima de la fila de ranuras (${t.toast[1]} ≤ ${t.limite} px)`,
        t.estado === 'playing' && t.visible && !t.pisa, t);
      await page.evaluate(salirDePartida);
    }
    // Y «…» con los puntos abajo en Dex (la letra de reserva), en el lienzo y en las caras de M PLUS de la página.
    if (v === VP.pc) {
      await estilo(page, 'dex');
      const p = await page.evaluate(PUNTOS);
      report.medidas['puntos-suspensivos'] = p;
      check(`Dex: «…» con los puntos en la línea base (su tinta acaba a ${p.elipsis.abajo} px y la de «.» a ${p.punto.abajo}; empieza a ${p.elipsis.arriba}), no a media altura como en M PLUS; las ${p.caras.length} caras de M PLUS sin U+2026 (${p.caras[0]})`,
        Math.abs(p.elipsis.abajo - p.punto.abajo) <= 2 && p.elipsis.arriba >= p.punto.arriba - 3 && p.caras.length >= 2 && p.caras.every(u => /2025/.test(u) && /2027/.test(u)), p);
    }
    check(`${nv}: consola sin errores ni avisos (aviso flotante en partida)`, !P.consola.length, P.consola.slice(0, 5));
    await P.ctx.close();
  }

  // 11e. Zonas seguras simuladas (muesca de 47 px a los lados, 24 arriba y 21 abajo) en un móvil en horizontal: las reglas
  //      que usan env(safe-area-inset-*) (gacha, tiradas, avisos de logro en el gacha) y lo que lee el HUD Dex.
  {
    const s = { sup: 24, der: 47, inf: 21, izq: 47 }, v = { w: 844, h: 390, dpr: 3, tactil: true, seguras: s };
    const P = await nuevo(browser, v), { page } = P, nv = nombreVp(v);
    if (!await entrar(P)) check(`${nv}: se entra`, false);
    else {
      const leidas = await page.evaluate(() => G.Estilo.zonasSeguras());
      check(`${nv}: la simulación llega al juego: G.Estilo.zonasSeguras() lee ${JSON.stringify(leidas)}`, leidas.sup === s.sup && leidas.der === s.der && leidas.inf === s.inf && leidas.izq === s.izq, leidas);
      for (const e of ESTILOS) {
        await estilo(page, e);
        await page.evaluate('G.MenuUI.open(); G.GachaUI.open();');
        await sleep(400);
        const g = await page.evaluate(() => {
          const r = el => { const q = el.getBoundingClientRect(); return { left: q.left, top: q.top, right: q.right, bottom: q.bottom }; };
          let a = document.getElementById('ach-pop'), creado = false;
          if (!a) { a = document.createElement('div'); a.id = 'ach-pop'; a.className = 'box ach-pop'; a.innerHTML = '<div><b>Logro</b></div>'; document.body.appendChild(a); creado = true; }
          a.classList.remove('hidden');
          const out = { caja: r(document.querySelector('#scr-gacha > .box')), botones: ['pull-1', 'pull-10', 'pull-10b'].map(id => r(document.getElementById(id))), logro: r(a) };
          if (creado) a.remove(); else a.classList.add('hidden');
          return out;
        });
        await page.evaluate(() => { if (!G.Slots.__play) G.Slots.__play = G.Slots.play; G.Slots.play = () => Promise.resolve(); });
        await page.click('#pull-10');
        for (let i = 0; i < 130 && !(await page.locator('#pull-close').isVisible().catch(() => false)); i++) await sleep(150);
        await sleep(500);
        const tiradas = await page.evaluate(() => {
          const r = el => { const q = el.getBoundingClientRect(); return { left: q.left, top: q.top, right: q.right, bottom: q.bottom }; };
          return { continuar: r(document.getElementById('pull-close')), cartas: [...document.querySelectorAll('#pull-results .pcard')].map(r) };
        });
        if (e === 'dex') await captura(page, `tirada-x10-muesca-${e}-${nv}`);
        await page.click('#pull-close');
        await page.evaluate(() => { if (G.Slots.__play) G.Slots.play = G.Slots.__play; });
        await sleep(200);
        const W = v.w, H = v.h;
        const fuera = [['caja del gacha', g.caja], ...g.botones.map((b, i) => ['botón ' + i, b]), ['aviso de logro', g.logro], ['Continuar', tiradas.continuar], ...tiradas.cartas.map((c, i) => ['carta ' + i, c])]
          .filter(([, r]) => !dentroSeguro(r, s, W, H)).map(([n, r]) => `${n} ${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}`);
        check(`${nv} ${e} (muesca simulada de 47/24/47/21): el gacha, sus botones, el aviso de logro, las diez cartas de la ×10 y «Continuar», dentro de las zonas seguras`,
          !fuera.length && tiradas.cartas.length === 10, fuera.slice(0, 6));
        await page.evaluate(salirDePartida);
      }
      // El HUD Dex en partida, con todo a la vez, dentro de las zonas seguras.
      await page.evaluate(() => { G.Estilo.set('dex'); G.Flow.play(); });
      await sleep(900);
      await page.evaluate(ESCENA_HUD, { companeros: true });
      await sleep(1800);
      const h = await page.evaluate(sg => {
        const B = G.HudDex.bandas(), P = B.piezas, L = [];
        for (const k of ['ficha', 'contador', 'rotom', 'pausa', 'jefe', 'aviso', 'objeto', 'vinculo']) if (P[k]) L.push({ n: k, ...P[k] });
        ['ranuras', 'chips', 'companeros'].forEach(k => (P[k] || []).forEach((r, i) => L.push({ n: k + i, ...r })));
        return L.filter(p => p.x < sg.izq - 0.5 || p.y < sg.sup - 0.5 || p.x + p.w > innerWidth - sg.der + 0.5 || p.y + p.h > innerHeight - sg.inf + 0.5).map(p => p.n);
      }, s);
      await captura(page, `hud-muesca-dex-${nv}`);
      check(`${nv} (muesca simulada): todas las piezas del HUD Dex, dentro de las zonas seguras`, !h.length, h);
    }
    check(`${nv}: consola sin errores ni avisos (zonas seguras simuladas)`, !P.consola.length, P.consola.slice(0, 5));
    await P.ctx.close();
  }
}

// ---------------- 12. Portada «Tarjeta de entrenador» (PokéSwarm, 12-10-2026) ----------------
/** Fracción de la pantalla opaca, medida como en la maqueta de la variante C: la interfaz sin el mundo, sobre negro y
 *  sobre blanco; por píxel a = 1 - (blanco - negro) / 255 (media de los canales) y opaco si a ≥ 0,6. */
async function opaco(page) {
  const fotos = [];
  for (const c of ['#000', '#fff']) {
    await page.evaluate(c => {
      let s = document.getElementById('__medir');
      if (!s) { s = document.createElement('style'); s.id = '__medir'; document.head.appendChild(s); }
      s.textContent = `#game{visibility:hidden!important} html,body{background:${c}!important} .ach-pop,.toast{display:none!important}`;
    }, c);
    await sleep(150);
    fotos.push((await page.screenshot({ scale: 'css' })).toString('base64'));
  }
  await page.evaluate(() => document.getElementById('__medir').remove());
  return page.evaluate(async ([n, b]) => {
    const px = async s => {
      const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob());
      const c = new OffscreenCanvas(im.width, im.height), x = c.getContext('2d');
      x.drawImage(im, 0, 0);
      return x.getImageData(0, 0, im.width, im.height).data;
    };
    const N = await px(n), B = await px(b);
    let op = 0;
    for (let i = 0; i < N.length; i += 4) if (1 - ((B[i] - N[i]) + (B[i + 1] - N[i + 1]) + (B[i + 2] - N[i + 2])) / 765 >= 0.6) op++;
    return Math.round(op / (N.length / 4) * 1000) / 10;
  }, fotos);
}

/** Cómo está la cara de la tarjeta que se ve: dentro de la ventana, sin desplazar, con el Rotom-Dex delante del nombre
 *  y sin la lengüeta roja de los paneles del Dex. */
const CARA = ([selCaja, selNombre]) => {
  const caja = document.querySelector(selCaja), nombre = document.querySelector(selNombre);
  const r = caja.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  const antes = el => el ? getComputedStyle(el, '::before') : null;
  return {
    dentro: r.left >= -0.5 && r.top >= -0.5 && r.right <= W + 0.5 && r.bottom <= H + 0.5 && r.width > 0,
    desplaza: Math.max(0, caja.scrollHeight - caja.clientHeight),
    rotom: !!nombre && /url\("data:image\/svg/.test(antes(nombre).backgroundImage) && nombre.textContent.trim() === 'PokéSwarm',
    lengueta: antes(caja).display !== 'none' && antes(caja).content !== 'none' && /D7263D|215, 38, 61/i.test(antes(caja).backgroundColor),
    pagina: document.documentElement.scrollWidth - document.documentElement.clientWidth
  };
};

async function pruebaPortada(browser) {
  // Los tamaños que pidió Nico: escritorio, el móvil, el Magic V6 (abierto, en las dos posturas, con la barra del
  // navegador, plegado en horizontal y la mitad de arriba en modo mesa).
  const VPS = [
    { w: 1440, h: 900 }, { w: 1920, h: 1080 }, { w: 1024, h: 768 }, { w: 844, h: 390, dpr: 3, tactil: true },
    { w: 807, h: 360, dpr: 3, tactil: true }, { w: 784, h: 362, dpr: 3, tactil: true, pantalla: [784, 724] },
    { w: 724, h: 784, dpr: 3, tactil: true }, { w: 784, h: 724, dpr: 3, tactil: true },
    { w: 724, h: 700, dpr: 3, tactil: true, pantalla: [724, 784] }, { w: 784, h: 640, dpr: 3, tactil: true, pantalla: [784, 724] }
  ];
  for (const v of VPS) {
    const P = await nuevo(browser, v), { page } = P, nv = nombreVp(v);
    const movil = v.h < 520, plegable = !movil && v.w <= 920;
    // Como en una primera visita de verdad, el sonido espera al primer gesto: así sale «Pulsa para empezar».
    await page.addInitScript(() => {
      try { localStorage.setItem('ps.settings', JSON.stringify({ estilo: 'dex' })); } catch (e) {}
      let gesto = false;
      addEventListener('pointerdown', () => { gesto = true; }, true);
      addEventListener('keydown', () => { gesto = true; }, true);
      document.addEventListener('DOMContentLoaded', () => { if (window.G && G.Audio) { const o = G.Audio.canPlay.bind(G.Audio); G.Audio.canPlay = () => gesto && o(); } });
    });
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForFunction(() => document.getElementById('boot').classList.contains('hidden'), null, { timeout: 30000 });
    await sleep(500);
    const estiloInicial = await page.evaluate(() => G.Estilo.actual);
    // «Pulsa para empezar»: el dorso de la tarjeta, sin velo.
    const pulsa = await page.locator('#tap-start').isVisible();
    if (pulsa) {
      const c = await page.evaluate(CARA, ['#tap-start .boot-in', '#tap-start h1']);
      const velo = await page.evaluate(() => getComputedStyle(document.getElementById('tap-start')).backgroundImage);
      await captura(page, `portada-pulsa-dex-${nv}`);
      check(`${nv} Dex: «Pulsa para empezar», la tarjeta entera dentro de la ventana con el Rotom-Dex delante de «PokéSwarm» y sin velo sobre el mundo`,
        estiloInicial === 'dex' && c.dentro && c.rotom && !c.lengueta && velo === 'none' && c.pagina <= 0, { c, velo, estiloInicial });
      if (v.tactil) await page.tap('#tap-start'); else await page.click('#tap-start');
    } else check(`${nv}: sale «Pulsa para empezar» (el sonido espera al primer gesto)`, false);
    // Inicio de sesión: la cara del formulario; las dos pestañas con Tab y elegibles con Intro.
    await page.locator('#scr-login').waitFor({ state: 'visible' });
    await sleep(300);
    const lg = await page.evaluate(CARA, ['#scr-login > .box', '#scr-login .logo .t1']);
    const tabs = await page.evaluate(() => [...document.querySelectorAll('#scr-login .tab')].map(t => ({ rol: t.getAttribute('role'), tab: t.tabIndex, sel: t.getAttribute('aria-selected') })));
    await page.focus('#scr-login .tab[data-tab="login"]');
    await page.keyboard.press('Tab');
    const segunda = await page.evaluate(() => document.activeElement && document.activeElement.dataset.tab);
    await page.keyboard.press('Enter');
    const registro = await page.evaluate(() => document.querySelector('#scr-login .tab[data-tab="register"]').classList.contains('on') && document.querySelector('#scr-login .tab[data-tab="register"]').getAttribute('aria-selected') === 'true');
    await captura(page, `portada-login-foco-dex-${nv}`);
    await page.keyboard.press('ArrowLeft');
    const vuelta = await page.evaluate(() => document.querySelector('#scr-login .tab[data-tab="login"]').classList.contains('on') && document.activeElement.dataset.tab === 'login');
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await captura(page, `portada-login-dex-${nv}`);
    const pLogin = movil ? await opaco(page) : null;
    check(`${nv} Dex: inicio de sesión entero sin desplazar, con el Rotom-Dex delante del nombre y sin lengüeta; las pestañas Entrar y Crear cuenta se alcanzan con Tab, Intro elige y las flechas cambian${movil ? ` (${pLogin} % opaco)` : ''}`,
      lg.dentro && lg.desplaza <= 1 && lg.rotom && !lg.lengueta && lg.pagina <= 0 && tabs.length === 2 && tabs.every(t => t.rol === 'tab' && t.tab === 0) &&
      segunda === 'register' && registro && vuelta, { lg, tabs, segunda, registro, vuelta, pLogin });
    // Test y resultado: la misma tarjeta, sin oscurecido (retoque d).
    await page.click('#btn-guest');
    await page.locator('#scr-test').waitFor({ state: 'visible' });
    await sleep(300);
    const te = await page.evaluate(CARA, ['#scr-test .test-box', '#nada']);
    const dim = await page.evaluate(() => { const cs = getComputedStyle(document.getElementById('scr-test')); return cs.backgroundImage === 'none' && /rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor); });
    const respuestas = await page.evaluate(() => [...document.querySelectorAll('#test-a .answer')].map(b => Math.round(b.getBoundingClientRect().height)));
    await captura(page, `portada-test-dex-${nv}`);
    check(`${nv} Dex: test sin oscurecido, la tarjeta dentro de la ventana y sin lengüeta, respuestas de 44 px o más`,
      dim && te.dentro && te.desplaza <= 1 && !te.lengueta && respuestas.length === 4 && respuestas.every(h => h >= 44), { te, dim, respuestas });
    for (let n = 0; n < 40 && await page.locator('#scr-test').isVisible(); n++) { await page.locator('#test-a .answer').first().click(); await sleep(40); }
    await page.locator('#scr-result').waitFor({ state: 'visible' });
    await sleep(600);
    const re = await page.evaluate(CARA, ['#scr-result .result', '#nada']);
    const dimR = await page.evaluate(() => getComputedStyle(document.getElementById('scr-result')).backgroundImage === 'none');
    await captura(page, `portada-resultado-dex-${nv}`);
    check(`${nv} Dex: resultado del test sin oscurecido, entero y sin lengüeta`, dimR && re.dentro && re.desplaza <= 1 && !re.lengueta, { re, dimR });
    await page.click('#res-ok');
    await page.locator('#scr-menu').waitFor({ state: 'visible' });
    // Menú: el anverso. Una partida con récord para que la tarjeta tenga sus cifras.
    const menu = async dex => {
      await page.evaluate(d => {
        Object.assign(G.DB.save.stats, { runs: 14, bestTime: 754, bestLevel: 31 });
        if (d) { G.DB.save.partner = d; G.DB.save.owned[d] = G.DB.save.owned[d] || 1; }
        G.MenuUI.open();
        for (const x of document.querySelectorAll('.ach-pop, .toast')) x.classList.add('hidden');
      }, dex);
      await page.waitForFunction(() => document.getElementById('tc-card').classList.contains('tc-listo'), null, { timeout: 15000 }).catch(() => {});
      await sleep(400);
      return page.evaluate(() => {
        const W = innerWidth, H = innerHeight, r = el => el.getBoundingClientRect();
        const dentro = b => b.left >= -0.5 && b.top >= -0.5 && b.right <= W + 0.5 && b.bottom <= H + 0.5 && b.width > 0;
        const card = document.getElementById('tc-card'), botones = [...document.querySelectorAll('#scr-menu .menu-item')];
        const cv = document.getElementById('tc-partner'), c = G.Estilo.colocacion(cv);
        const tb = [...document.querySelectorAll('#topbar > *')].filter(e => e.getClientRects().length).map(r);
        const cruza = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        return {
          tarjeta: dentro(r(card)), izquierda: getComputedStyle(document.querySelector('#scr-menu > .menu-left')).display,
          rotom: /url\("data:image\/svg/.test(getComputedStyle(document.querySelector('#tc-card .tc-title'), '::before').backgroundImage),
          lengueta: getComputedStyle(card, '::before').display !== 'none',
          botones: botones.length, fuera: botones.filter(b => !dentro(r(b))).map(b => b.dataset.go), bajos: botones.filter(b => r(b).height < 44 - 0.5).map(b => b.dataset.go),
          cortados: botones.filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.dataset.go),
          pisaBarra: tb.some(t => cruza(t, r(card)) || botones.some(b => cruza(t, r(b)))),
          escala: c && c.k, escalaMax: +getComputedStyle(card).getPropertyValue('--tc-escala'), dex: c && c.dex,
          renglones: (() => {   // renglones de la tarjeta: los centros de sus piezas, agrupados con 8 px de tolerancia
            const cs = [...card.querySelectorAll('.tc-title, .tc-mon, .tc-stats, .tc-user')].filter(e => e.getClientRects().length).map(e => (r(e).top + r(e).bottom) / 2).sort((a, b) => a - b);
            return cs.reduce((n, y, i) => n + (i && y - cs[i - 1] <= 8 ? 0 : 1), 0);
          })(),
          pagina: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      });
    };
    const m = await menu(null);
    await captura(page, `portada-menu-dex-${nv}`);
    const pMenu = await opaco(page);
    report.medidas[`portada-opaco-${nv}`] = { menu: pMenu, login: pLogin };
    check(`${nv} Dex: menú «Tarjeta de entrenador»: la tarjeta y los 8 botones dentro de la ventana, de 44 px o más, sin textos cortados ni la barra superior encima; el Rotom-Dex delante del nombre, sin lengüeta; el compañero a ×${m.escalaMax}${movil ? ' (retoque a: ×4)' : ''}; ${pMenu} % de pantalla opaca${movil || plegable ? ' (≤ 25 %)' : ''}`,
      m.tarjeta && m.izquierda === 'none' && m.rotom && !m.lengueta && m.botones === 8 && !m.fuera.length && !m.bajos.length && !m.cortados.length && !m.pisaBarra &&
      m.escala === m.escalaMax && (!movil || m.escala === 4) && (!(movil || plegable) || pMenu <= 25) && m.pagina <= 0, { m, pMenu });
    if (movil) {
      // El peor caso: un compañero grande (Dragonite) a ×4 y un nombre largo con dos tipos (Crabominable, tan ancho que va a
      // ×3, como los gigantes: el 8 % de la Pokédex baja de ×4 para no cortarse).
      for (const dex of [149, 740]) {
        const g = await menu(dex);
        const pg = await opaco(page);
        report.medidas[`portada-opaco-${nv}-${dex}`] = pg;
        if (dex === 149) await captura(page, `portada-menu-grande-dex-${nv}`);
        check(`${nv} Dex: menú con ${dex === 149 ? 'Dragonite (grande), a ×4' : 'Crabominable (nombre largo, dos tipos; ancho: ×3)'}, dos renglones en la tarjeta, ${pg} % opaco (≤ 25 %)`,
          g.escala === (dex === 149 ? 4 : 3) && g.renglones === 2 && pg <= 25 && !g.fuera.length && !g.cortados.length, { g, pg });
      }
    }
    // Clásico: la composición del proyecto base, con el nombre y el lema.
    if (v.w === 1440 || v.w === 844 || (v.w === 724 && v.h === 784)) {
      await estilo(page, 'clasico');
      await page.evaluate(() => { G.MenuUI.open(); for (const x of document.querySelectorAll('.ach-pop, .toast')) x.classList.add('hidden'); });
      await sleep(300);
      const k = await page.evaluate(() => ({
        tarjeta: getComputedStyle(document.getElementById('tc-card')).display, izquierda: getComputedStyle(document.querySelector('#scr-menu > .menu-left')).display,
        nombre: document.querySelector('#scr-menu .logo .t1').textContent.trim(), lema: document.querySelector('#scr-menu .logo .t2').textContent.trim(),
        letra: getComputedStyle(document.querySelector('#scr-menu .logo .t1')).fontFamily
      }));
      await captura(page, `portada-menu-clasico-${nv}`);
      check(`${nv} Clásico: el menú del proyecto base (sin tarjeta) con «PokéSwarm» y el lema`,
        k.tarjeta === 'none' && k.izquierda !== 'none' && k.nombre === 'PokéSwarm' && k.lema === 'Roguelite de hordas Pokémon' && /Pixelify/.test(k.letra), k);
    }
    check(`${nv}: consola sin errores ni avisos (portada)`, !P.consola.length && !P.fuera.length, { consola: P.consola.slice(0, 5), fuera: P.fuera.slice(0, 5) });
    await P.ctx.close();
  }
}

// ---------------- hoja de contactos ----------------
function hojaDeContactos() {
  const pares = {};
  for (const f of report.capturas) { const m = /^(.+)-(dex|clasico)-(.+)\.png$/.exec(f); if (!m) continue; const k = m[1] + ' · ' + m[3]; (pares[k] = pares[k] || {})[m[2]] = f; }
  const filas = Object.entries(pares).map(([k, p]) => `<tr><th>${k}</th><td>${p.clasico ? `<a href="${p.clasico}"><img src="${p.clasico}"></a>` : ''}</td><td>${p.dex ? `<a href="${p.dex}"><img src="${p.dex}"></a>` : ''}</td></tr>`).join('\n');
  fs.writeFileSync(path.join(OUT, 'indice.html'), `<!doctype html><meta charset="utf-8"><title>Estilo: Clásico y Dex</title>
<style>body{font:14px system-ui;background:#111;color:#eee;margin:16px}table{border-collapse:collapse}th{text-align:left;padding:8px;vertical-align:top;width:180px}td{padding:4px}img{width:560px;display:block}</style>
<h1>Estilo: Clásico (izquierda) y Dex (derecha)</h1><p>${report.inicio} · ${BASE}</p><table>${filas}</table>`);
}

// ---------------- prueba ----------------
(async () => {
  const srv = await startServer(ROOT, PORT);
  const browser = await chromium.launch({ headless: HEADLESS });
  try {
    // 7. «Gira el móvil»: un móvil en vertical y el Magic V6 plegado en vertical, sí; los plegables abiertos, no (y entran a jugar más abajo).
    for (const v of SOLO_HUD || SOLO_PORTADA ? [] : [{ w: 390, h: 844, dpr: 3, tactil: true }, { w: 360, h: 807, dpr: 3, tactil: true }]) {
      const P = await nuevo(browser, v);
      await P.page.goto(BASE, { waitUntil: 'load' });
      await P.page.waitForFunction(() => document.getElementById('boot').classList.contains('hidden'), null, { timeout: 30000 });
      await sleep(200);
      const gira = await P.page.evaluate(() => !document.getElementById('rotate').classList.contains('hidden'));
      check(`«Gira el móvil» en un móvil en vertical (${nombreVp(v)}, táctil)`, gira);
      await P.ctx.close();
    }

    for (const [clave, v] of SOLO_HUD || SOLO_PORTADA ? [] : Object.entries(VP)) {
      const P = await nuevo(browser, v), { page } = P, nv = nombreVp(v), t0 = Date.now();
      const dentro = await entrar(P);
      if (v.tactil && v.w / v.h > 0.75) check(`${nv}: juega sin «Gira el móvil»`, dentro);
      if (!dentro) { await P.ctx.close(); continue; }

      // 1. Las 21 pantallas en los dos estilos (y la piel Dex puesta en cada una).
      const { malas, piel } = await recorrerPantallas(P);
      check(`${nv}: las 21 pantallas en Dex y Clásico sin desplazamiento horizontal, con la caja dentro y sin el menú detrás`, !malas.length, malas.slice(0, 6));
      check(`${nv}: la piel Dex está puesta en las 21 pantallas (borde de la caja, letra y fondo de los botones) y en Clásico no`, !piel.length, piel.slice(0, 4));

      // El menú principal.
      for (const e of ESTILOS) {
        await estilo(page, e);
        await page.evaluate(() => { G.MenuUI.open(); document.getElementById('scr-menu').scrollTop = 0; for (const x of document.querySelectorAll('.ach-pop, .toast')) x.classList.add('hidden'); });
        await sleep(250);
        const m = await page.evaluate(MEDIR_MENU);
        check(`${nv} ${e}: menú principal con las 8 opciones a la vista sin desplazar, el logotipo libre de la barra superior y los créditos sin pisar ninguna caja`,
          m.opciones === 8 && !m.mal.length && !m.desplazada && !m.logoTapado && !m.creditosPisan, m);
      }

      // 4. Fin de partida: «Volver al menú» a la vista y cada panel, entero en algún momento.
      for (const e of ESTILOS) {
        await estilo(page, e);
        await page.evaluate(PANTALLAS.find(p => p[0] === 'scr-over')[1]);
        await sleep(300);
        const r = await page.evaluate(FIN_PANELES);
        check(`${nv} ${e}: fin de partida con las estadísticas de una partida larga: «Volver al menú» a la vista y los ${r.paneles} paneles se llegan a ver enteros, sin el botón encima, desplazando la caja`,
          r.botonVisible && r.paneles >= 8 && !r.nunca.length, r);
        await page.evaluate(salirDePartida);
      }

      // 2. Gacha: banners en pantallas de móvil y de plegable; tiradas.
      if (GACHA_MOVIL.includes(clave)) {
        const { malos, tiras } = await gachaBanners(P);
        check(`${nv}: gacha en los 9 banners (Dex y Clásico): destacados dentro del banner y de la ventana, a su tamaño (sin escalar), y los tres botones a la vista ${v.h < 520 ? 'sin desplazar nada' : 'sin desplazar (las probabilidades, debajo)'}`,
          !malos.length, malos.slice(0, 3));
        check(`${nv}: pestañas de región (Dex y Clásico): la elegida, entera y fuera del degradado, en los 9 banners; el degradado, sólo en el lado por el que hay más (si no caben)`, !tiras.length, tiras.slice(0, 4));
        if (v.h < 520) {
          for (const e of ESTILOS) {
            await estilo(page, e);
            await page.evaluate('G.MenuUI.open(); G.GachaUI.open();');
            await sleep(350);
            const aviso = await page.evaluate(AVISO_GACHA);
            await page.click('#gacha-prob');
            await sleep(250);
            const prob = await page.evaluate(MEDIR_PROB);
            if (clave === 'movil') await captura(page, `probabilidades-${e}-${nv}`);
            await page.keyboard.press('Escape');
            await sleep(150);
            const trasEsc = await page.evaluate(() => ({ capa: !document.getElementById('gacha-prob-capa').classList.contains('hidden'), gacha: G.UI.isOpen('scr-gacha') }));
            check(`${nv} ${e}: capa «Probabilidades»: dentro de la ventana, la tabla debajo del título, «Cerrar» entero y sin pisarla; Esc la cierra sin cerrar el gacha`,
              prob.abierta && prob.dentro && prob.debajo && !prob.pisa && prob.textoDentro && prob.filas >= 6 && !trasEsc.capa && trasEsc.gacha, { prob, trasEsc });
            check(`${nv} ${e}: un aviso de logro con el gacha abierto no tapa los botones de tirar ni se queda sus toques`, !aviso.tapa && aviso.toque && aviso.eventos === 'none', aviso);
          }
        }
      }
      if (TIRADAS.includes(clave)) {
        for (const e of (v.h < 520 ? ESTILOS : ['dex'])) {
          await estilo(page, e);
          await page.evaluate('G.MenuUI.open(); G.GachaUI.open();');
          const x1 = await tirar(P, 'pull-1');
          if (CON_CAPTURAS.includes(clave)) await captura(page, `tirada-x1-${e}-${nv}`);
          await page.click('#pull-close');
          await sleep(200);
          const x10 = await tirar(P, 'pull-10');
          if (CON_CAPTURAS.includes(clave)) await captura(page, `tirada-x10-${e}-${nv}`);
          await page.click('#pull-close');
          await sleep(200);
          check(`${nv} ${e}: tiradas ×1 y ×10 sin desplazar, con «Continuar» a la vista sin tapar ninguna carta y el premio en su lienzo, a su tamaño y sin cortes`,
            x1.cartas === 1 && x10.cartas === 10 && [x1, x10].every(x => x.desplaza <= 1 && x.continuarVisible && !x.pisa && !x.fuera && x.escalaCss && !x.premioCortado.length), { x1, x10 });
          const ev = await tirarRepetidos(P);
          if (CON_CAPTURAS.includes(clave) || clave === 'movilBajo') await captura(page, `tirada-x10-repetidos-${e}-${nv}`);
          await page.click('#pull-close');
          await sleep(200);
          check(`${nv} ${e}: ×10 de diez repetidos que desbloquean su evolución (nombres largos): cada etiqueta entera, con el nombre de la evolución, y cada carta a la vista sin «Continuar» encima${v.h < 520 ? ', sin desplazar' : ''}`,
            ev.cartas === 10 && !ev.malas.length && !ev.nuncaEnteras && (v.h >= 520 || ev.desplaza <= 1), ev);
        }
      }

      // 5. Franja de tipo (y foco en las cartas, en los dos estilos).
      if (clave === 'pc' || clave === 'movil') {
        for (const e of ESTILOS) {
          await estilo(page, e);
          await page.evaluate('G.Flow.play();');
          const f = await page.evaluate(FRANJAS);
          if (e === 'dex') {
            const mal = f.filter(x => !(Math.abs(x.ancho - 8) <= 1 && x.alto >= x.cartaAlto - 2 && (x.contraste >= 3 || x.conFilo >= 3)));
            check(`${nv} Dex: franja de tipo de 8 ± 1 px a todo el alto en las cartas de los 18 tipos, ≥ 3:1 contra la carta (con su filo en Fantasma, Dragón y Siniestro)`,
              f.length === 18 && !mal.length, mal.length ? mal : f.map(x => `${x.tipo} ${x.contraste}${x.conFilo ? '/' + x.conFilo : ''}`).join(', '));
            report.medidas['franjas-' + nv] = f;
          } else {
            check(`${nv} Clásico: sin franja de tipo (como upstream) y las cartas se pueden enfocar con Tab (tabindex 0, role=button)`,
              f.every(x => x.contenido === 'none' && x.tabindex === 0 && x.role === 'button'), f.slice(0, 2));
          }
          await page.evaluate(salirDePartida);
        }
      }

      // 6. Teclado y Ajustes (Dex, escritorio); y las píldoras de tipo con Dex.
      if (clave === 'pc') {
        await estilo(page, 'dex');
        const pild = await page.evaluate(PILDORAS);
        check('Dex: las píldoras de tipo (G.UI.typeChips: colección, menú, iniciales…) de los 18 tipos con ≥ 4,5:1 entre la letra y su fondo (Fantasma, Dragón y Siniestro, con letra clara)',
          pild.length === 18 && pild.every(x => x.ratio >= 4.5), pild.map(x => `${x.tipo} ${x.ratio}`).join(', '));
        await page.evaluate('G.MenuUI.open(); document.activeElement && document.activeElement.blur();');
        const menu = await tabula(page, 12, '.menu-item');
        await page.evaluate(`G.Flow.play(); G.RunUI.showLevelUp(3, G.LevelUp.offer(G.Game.player), () => {}); document.activeElement && document.activeElement.blur();`);
        const cartas = await tabula(page, 4, '#cards .card');
        await page.evaluate(salirDePartida);
        await page.evaluate('G.MenuUI.open(); G.SettingsUI.open("gfx"); document.activeElement && document.activeElement.blur();');
        const ajustes = await tabula(page, 12, '#set-body [data-estilo], #set-tabs .gen-tab, #set-close');
        const anillo = 'rgb(98, 227, 221)';
        check('Dex: Tab recorre el menú, las cartas de nivel y Ajustes con el anillo de foco visible (2 px, color pantalla)',
          menu.length >= 8 && cartas.length >= 3 && ajustes.length >= 3 && [...menu, ...cartas, ...ajustes].every(x => x.anillo === anillo), { menu, cartas, ajustes });
        const sec = await page.evaluate(() => [...document.querySelectorAll('#set-body .set-h')].map(h => h.textContent.trim()));
        await page.click('#set-body [data-estilo="clasico"]');
        await sleep(100);
        const trasClic = await page.evaluate(() => ({ estilo: G.Estilo.actual, clase: document.documentElement.classList.contains('estilo-dex'), primera: document.querySelector('#set-body .set-h').textContent,
          marcado: document.querySelector('#set-body [data-estilo].on').dataset.estilo, guardado: JSON.parse(localStorage.getItem('ps.settings') || '{}').estilo }));
        await page.click('#set-body [data-estilo="dex"]');
        await sleep(100);
        const vuelta = await page.evaluate(() => ({ estilo: G.Estilo.actual, clase: document.documentElement.classList.contains('estilo-dex'), fuente: (() => { const c = document.createElement('canvas').getContext('2d'); c.font = '700 13px Pixelify'; return c.font; })() }));
        check('Ajustes > Gráficos: «Estilo» es la primera sección y sus botones cambian el estilo al momento (clase de <html>, lo guardado y la letra del lienzo)',
          sec[0] === 'Estilo' && trasClic.estilo === 'clasico' && !trasClic.clase && trasClic.primera === 'Estilo' && trasClic.marcado === 'clasico' && trasClic.guardado === 'clasico' &&
          vuelta.estilo === 'dex' && vuelta.clase && /M PLUS Rounded 1c/.test(vuelta.fuente), { sec, trasClic, vuelta });
        await page.evaluate('G.SettingsUI.close();');
      }

      // Capturas por pares (los dos estilos, mismo momento).
      if (CON_CAPTURAS.includes(clave)) {
        const fotos = [
          ['menu', 'G.MenuUI.open();'], ['coleccion', 'G.MenuUI.open(); document.querySelector("#scr-menu [data-go=dex]").click();'],
          ['gacha', 'G.MenuUI.open(); G.GachaUI.open();'], ['ajustes', 'G.MenuUI.open(); G.SettingsUI.open("gfx");', 'G.SettingsUI.close();'],
          ['sala', PANTALLAS.find(p => p[0] === 'scr-lobby')[1], PANTALLAS.find(p => p[0] === 'scr-lobby')[2]],
          ['iniciales', PANTALLAS.find(p => p[0] === 'scr-starters')[1]], ['mejoras', 'G.MenuUI.open(); document.querySelector("#scr-menu [data-go=upgrades]").click();'],
          ['subida-nivel', `G.Flow.play(); G.RunUI.showLevelUp(7, G.LevelUp.offer(G.Game.player), () => {});`],
          ['pausa', PANTALLAS.find(p => p[0] === 'scr-pause')[1]], ['fin', PANTALLAS.find(p => p[0] === 'scr-over')[1]]
        ];
        for (const e of ESTILOS) {
          await estilo(page, e);
          for (const [n, abrir, cerrar] of fotos) {
            await page.evaluate(abrir);
            await sleep(n === 'gacha' || n === 'coleccion' ? 700 : 350);
            await page.mouse.move(2, 2);
            await captura(page, `${n}-${e}-${nv}`);
            if (n === 'subida-nivel') {
              await page.hover('#cards .card >> nth=1');
              await sleep(200);
              await captura(page, `subida-nivel-raton-${e}-${nv}`);
              await page.mouse.move(2, 2);
              await page.evaluate(() => { document.activeElement && document.activeElement.blur(); });
              for (let i = 0; i < 8 && !(await page.evaluate(() => !!(document.activeElement && document.activeElement.matches('#cards .card')))); i++) await page.keyboard.press('Tab');
              await sleep(150);
              await captura(page, `subida-nivel-foco-${e}-${nv}`);
            }
            if (cerrar) await page.evaluate(cerrar);
            if (['subida-nivel', 'pausa', 'fin'].includes(n)) await page.evaluate(salirDePartida);
          }
          // La tragaperras, a medio girar (escritorio y móvil).
          if (clave === 'pleg2') { await page.evaluate(salirDePartida); continue; }
          await page.evaluate('G.MenuUI.open(); G.GachaUI.open();');
          await page.click('#pull-1');
          await sleep(900);
          await captura(page, `tragaperras-${e}-${nv}`);
          for (let i = 0; i < 150 && !(await page.locator('#pull-close').isVisible().catch(() => false)); i++) { await page.locator('#slot').click({ force: true }).catch(() => {}); await sleep(150); }
          await page.click('#pull-close').catch(() => {});
          await page.evaluate(salirDePartida);
        }
      }

      // 3. Que no se corte ningún sprite: destacados de los 9 banners, compañero del menú (y el premio, en las tiradas).
      if (clave === 'pc' || clave === 'movil') {
        await estilo(page, 'dex');
        await page.evaluate('G.MenuUI.open(); G.GachaUI.open();');
        const feat = [], vivos = [];
        for (let g = 1; g <= 9; g++) {
          await page.click(`#gacha-gens .gen-tab[data-gen="${g}"]`);
          feat.push(...(await page.evaluate(BORDES, '#gacha-feat canvas')).map(x => ({ banner: g, ...x })));
          vivos.push(...(await page.evaluate(BORDES_VIVOS, '#gacha-feat canvas')).map((x, j) => ({ banner: g, j, ...x })));
        }
        const malos = feat.filter(x => x.sinColocar || x.toca);
        check(`${nv}: destacados del gacha: ningún fotograma que pueden pintar (Idle y las animaciones que caben) de los 27 legendarios toca el borde de su lienzo de 170x190 (${feat.reduce((s, x) => s + (x.fotogramas || 0), 0)} fotogramas), ni en 30 fotogramas de verdad`,
          feat.length === 27 && !malos.length && vivos.every(x => !x.toca && !x.vacios), malos.length ? malos : vivos.filter(x => x.toca || x.vacios));
        report.medidas['destacados-' + nv] = feat.map(x => ({ banner: x.banner, nombre: x.nombre, k: x.k, vida: x.vida, margen: x.peor && x.peor.margen }));
        if (clave === 'pc') console.log('[INFO] destacados a ×2: ' + feat.filter(x => x.k === 2).length + ' de 27; a ×1: ' + feat.filter(x => x.k === 1).map(x => x.nombre).join(', '));
        const comp = await page.evaluate(() => [...new Set([...G.STARTERS.map(s => s.dex), 25, 133, 799, 321, 890, 384, 6, 150])]);
        const res = [];
        for (const dex of comp) {
          await page.evaluate(d => { G.DB.save.partner = d; G.DB.save.partnerShiny = false; G.MenuUI.open(); }, dex);
          res.push(...await page.evaluate(BORDES, '#tc-partner'));   // con Dex, el de la «Tarjeta de entrenador»
        }
        const vivoComp = await page.evaluate(BORDES_VIVOS, '#tc-partner');
        const malComp = res.filter(x => x.sinColocar || x.toca);
        check(`${nv}: compañero del menú (${res[0] && res[0].lienzo}): ningún fotograma de ${comp.length} Pokémon (iniciales y gigantes) toca el borde; la escala, entera hasta ×6`,
          !malComp.length && vivoComp.every(x => !x.toca) && res.every(x => x.k >= 1 && x.k <= 6), malComp.length ? malComp : vivoComp);
        report.medidas['companero-' + nv] = res.map(x => ({ nombre: x.nombre, k: x.k, vida: x.vida, margen: x.peor && x.peor.margen }));
        await page.evaluate(d => { G.DB.save.partner = d; G.MenuUI.open(); }, comp[0]);
      }

      check(`${nv}: consola sin errores ni avisos y nada pedido fuera de 127.0.0.1`, !P.consola.length && !P.fuera.length, { consola: P.consola.slice(0, 5), fuera: P.fuera.slice(0, 5) });
      console.log(`[INFO] ${nv}: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      await P.ctx.close();
    }

    // 10. HUD Dex en partida (lote 2).
    if (!SOLO_PORTADA) await pruebaHud(browser);

    // 11. Arreglos de la verificación de los lotes 1 y 2 (barra del navegador, móviles pequeños, barra superior estrecha,
    //     el aviso flotante al empezar, «…» y zonas seguras simuladas).
    if (!SOLO_HUD && !SOLO_PORTADA) await pruebaArreglos(browser);

    // 12. Portada «Tarjeta de entrenador» (Dex) y el menú del proyecto base con el nombre nuevo (Clásico).
    if (!SOLO_HUD) await pruebaPortada(browser);

    // 8. Sin internet: con el service worker y en Clásico, se cargan las fuentes en reposo; luego, sin red, a Dex.
    if (!SOLO_HUD && !SOLO_PORTADA) {
      const P = await nuevo(browser, VP.pc, { sw: true }), { page, ctx } = P;
      await page.goto(BASE, { waitUntil: 'load' });
      await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 30000 }).catch(() => {});
      const control = await page.evaluate(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller));
      const bajadas = await page.evaluate(() => Promise.race([G.Estilo.descargaEnReposo(), new Promise(r => setTimeout(() => r('tiempo'), 25000))]));
      const antes = await page.evaluate(() => ({ estilo: G.Estilo.actual, fuente: document.fonts.check('800 16px "M PLUS Rounded 1c"') }));
      const pedidas = [];
      page.on('request', r => pedidas.push(r.url()));
      await ctx.setOffline(true);
      await page.evaluate(() => G.Estilo.set('dex'));
      const despues = await page.evaluate(async () => {
        await Promise.all(['500 16px "M PLUS Rounded 1c"', '800 16px "M PLUS Rounded 1c"'].map(f => document.fonts.load(f).catch(() => null)));
        return { estilo: G.Estilo.actual, f500: document.fonts.check('500 16px "M PLUS Rounded 1c"'), f800: document.fonts.check('800 16px "M PLUS Rounded 1c"'),
          cargadas: [...document.fonts].filter(f => /M PLUS/.test(f.family) && f.status === 'loaded').length };
      });
      await ctx.setOffline(false);
      const fueraDeFuentes = pedidas.filter(u => !/\/assets\/fonts\//.test(u));
      check('sin internet: tras la primera carga en Clásico (service worker al mando y fuentes bajadas en reposo), al pasar a Dex sin red la letra está y no se pide nada fuera de assets/fonts',
        control && bajadas === true && antes.estilo === 'clasico' && despues.f500 && despues.f800 && despues.cargadas >= 2 && !fueraDeFuentes.length,
        { control, bajadas, antes, despues, pedidas });
      await ctx.close();
    }
  } catch (e) {
    check('la prueba terminó sin excepciones', false, String(e && e.stack || e));
  } finally {
    hojaDeContactos();
    report.fin = new Date().toISOString();
    report.resultado = fallos ? `${fallos} fallo(s)` : 'todo bien';
    save();
    await browser.close().catch(() => {});
    srv.close();
  }
  console.log(fallos ? `\nRESULTADO: ${fallos} fallo(s). Informe: ${path.relative(process.cwd(), path.join(OUT, 'informe.json'))}` : `\nRESULTADO: todo bien. Capturas y hoja de contactos: ${path.relative(process.cwd(), path.join(OUT, 'indice.html'))}`);
  process.exit(fallos ? 1 : 0);
})();
