/* ============ tools/nico/estilo-e2e.js — prueba de la identidad visual en el navegador ============
 *   cd tools/nico && node estilo-e2e.js [--dev] [--headed] [--puerto 8092] [--sin-capturas]
 *
 * Arnés del estilo «Dex de Expedición» (lote 1: base del estilo y menús). Modo local, un jugador
 * invitado, sin emulador: abre index.html (con --dev, dev.html) en Chromium con Playwright y, en
 * los dos estilos (Dex y Clásico, cambiados con G.Estilo.set en la misma página):
 *
 *   1. Pantallas: recorre las 22 pantallas (.scr) en cada tamaño (escritorio 1440x900, 1920x1080 y
 *      1024x768; móvil táctil 844x390@3 y 780x360@3; plegable desplegado 870x800, 800x870, 1000x900 y
 *      900x1000 @2,5 táctil) y exige: nada de desplazamiento horizontal (página, pantalla y caja), la
 *      caja dentro de la ventana y el menú principal oculto detrás de cualquier .scr.dim.
 *   2. Gacha en móvil (844x390 y 780x360) y en los plegables: en los 9 banners, cada lienzo destacado
 *      dentro del banner y de la ventana, a su tamaño (alto CSS = alto del lienzo), y los tres botones
 *      de tirar a la vista sin desplazar. Tiradas ×1 y ×10 por la interfaz real: sin desplazar y
 *      «Continuar» a la vista sin tapar ninguna carta.
 *   3. Nada se corta: en los lienzos que anima G.Estilo (los 27 legendarios destacados, el compañero del
 *      menú con 37 Pokémon, iniciales y gigantes, y el premio de las tiradas) se dibuja cada fotograma de
 *      Idle y de las animaciones que se les dejan, con su colocación (escala y pies) y su sombra, y la caja
 *      de píxeles opacos no toca el borde; y además 30 fotogramas de verdad de cada lienzo.
 *   4. «Volver al menú» a la vista en el fin de partida (con una partida larga, en todos los tamaños).
 *   5. Franja de tipo de 8 ± 1 px en las cartas de nivel de los 18 tipos (Dex), ≥ 3:1 contra la carta
 *      (con el filo claro en Fantasma, Dragón y Siniestro); sin franja en Clásico.
 *   6. Teclado (Dex, 1440x900): Tab recorre el menú, las cartas de nivel y Ajustes con el anillo de
 *      foco visible; «Estilo» es la primera sección de Gráficos y cambiarlo ahí funciona.
 *   7. «Gira el móvil»: sí en un móvil en vertical (390x844), no en los plegables.
 *   8. Sin internet: tras la primera carga (en Clásico, con el service worker), se corta la red y se
 *      pasa a Dex: la letra está (document.fonts.check) y no se pide nada fuera de assets/fonts.
 *   9. Consola sin errores ni avisos (menos los del entorno de la prueba: ver AVISOS_ENTORNO).
 *
 * Capturas en tools/nico/out/estilo/ (pares Dex/Clásico de menú, colección, gacha, tiradas, subida de
 * nivel con foco y con el ratón encima, Ajustes, pausa, fin, sala, iniciales, mejoras y tragaperras, a
 * 1440x900, 844x390 y 800x870) con una hoja de contactos (indice.html) e informe.json.
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
  pleg1: { w: 870, h: 800, dpr: 2.5, tactil: true }, pleg2: { w: 800, h: 870, dpr: 2.5, tactil: true },
  pleg3: { w: 1000, h: 900, dpr: 2.5, tactil: true }, pleg4: { w: 900, h: 1000, dpr: 2.5, tactil: true }
};
const nombreVp = v => `${v.w}x${v.h}${v.dpr ? '@' + v.dpr : ''}`;
const CON_CAPTURAS = ['pc', 'movil', 'pleg2'];
const GACHA_MOVIL = ['movil', 'movilBajo', 'pleg1', 'pleg2', 'pleg3', 'pleg4'];

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
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dpr || 1, hasTouch: !!v.tactil, isMobile: !!v.tactil,
    serviceWorkers: sw ? 'allow' : 'block', locale: 'es-ES' });
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

// ---------------- las 22 pantallas ----------------
const MOVS = `Object.keys(G.Moves.BY_ID)`;
const PANTALLAS = [
  ['scr-login', 'G.UI.hideAll(); G.LoginUI.open();'],
  ['scr-test', 'G.UI.hideAll(); G.TestUI.start();'],
  ['scr-result', 'G.UI.hideAll(); G.UI.show("scr-result");'],
  ['scr-starters', 'G.UI.hideAll(); G.UI.show("scr-result"); document.getElementById("res-other").click();'],
  ['scr-menu', 'G.MenuUI.open();'],
  ['scr-support', 'G.MenuUI.open(); G.SupportUI.open();', 'G.SupportUI.close();'],
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

async function recorrerPantallas(P) {
  const { page, v } = P, malas = [];
  for (const e of ESTILOS) {
    await estilo(page, e);
    for (const [id, abrir, cerrar, sub] of PANTALLAS) {
      await page.evaluate(abrir);
      await sleep(id === 'scr-gacha' || id === 'scr-dex' ? 120 : 30);
      const m = await page.evaluate(MEDIR_PANTALLA, id);
      const mal = !m.visible || m.pagina > 0 || m.cuerpo > 0 || m.pantalla > 1 || m.caja > 1 || m.cajaFuera > 1 || m.menuDetras;
      if (mal) malas.push({ estilo: e, cual: id + (sub ? '/' + sub : ''), ...m });
      if (cerrar) await page.evaluate(cerrar);
    }
    await page.evaluate(salirDePartida);
  }
  return malas;
}

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
  const { page } = P, malos = [], innerAlto = P.v.h;
  for (const e of ESTILOS) {
    await estilo(page, e);
    await page.evaluate('G.MenuUI.open(); G.GachaUI.open();');
    await sleep(350);   // la caja entra con una animación de escala (pop, 0,22 s)
    for (let g = 1; g <= 9; g++) {
      await page.click(`#gacha-gens .gen-tab[data-gen="${g}"]`);
      await sleep(60);
      const m = await page.evaluate(MEDIR_GACHA);
      // En pantallas bajas cabe todo sin desplazar; con más alto (un plegable), las probabilidades van debajo y se llega desplazando.
      const ok = m.lienzos.length === 3 && m.lienzos.every(l => l.dentroBanner && l.dentroVentana && Math.abs(l.altoCss - l.alto) < 0.01 && Math.abs(l.anchoCss - l.ancho) < 0.01) &&
        m.botones.every(Boolean) && (m.desplaza <= 1 || innerAlto >= 520);
      if (!ok) malos.push({ estilo: e, banner: g, ...m });
    }
  }
  return malos;
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
    // 7. «Gira el móvil»: un móvil en vertical sí; los plegables, no (y entran a jugar más abajo).
    {
      const P = await nuevo(browser, { w: 390, h: 844, dpr: 3, tactil: true });
      await P.page.goto(BASE, { waitUntil: 'load' });
      await P.page.waitForFunction(() => document.getElementById('boot').classList.contains('hidden'), null, { timeout: 30000 });
      await sleep(200);
      const gira = await P.page.evaluate(() => !document.getElementById('rotate').classList.contains('hidden'));
      check('«Gira el móvil» en un móvil en vertical (390x844, táctil)', gira);
      await P.ctx.close();
    }

    for (const [clave, v] of Object.entries(VP)) {
      const P = await nuevo(browser, v), { page } = P, nv = nombreVp(v), t0 = Date.now();
      const dentro = await entrar(P);
      if (v.tactil && v.w / v.h > 0.75) check(`${nv}: juega sin «Gira el móvil»`, dentro);
      if (!dentro) { await P.ctx.close(); continue; }

      // 1. Las 22 pantallas en los dos estilos.
      const malas = await recorrerPantallas(P);
      check(`${nv}: las 22 pantallas en Dex y Clásico sin desplazamiento horizontal, con la caja dentro y sin el menú detrás`, !malas.length, malas.slice(0, 6));

      // 4. «Volver al menú» a la vista.
      for (const e of ESTILOS) {
        await estilo(page, e);
        await page.evaluate(PANTALLAS.find(p => p[0] === 'scr-over')[1]);
        await sleep(120);
        const r = await page.evaluate(() => { const b = document.getElementById('btn-again').getBoundingClientRect(); return { arriba: Math.round(b.top), abajo: Math.round(b.bottom), alto: innerHeight, visible: b.top >= 0 && b.bottom <= innerHeight + 0.5 && b.height >= 40 }; });
        check(`${nv} ${e}: «Volver al menú» a la vista en el fin de partida (con las estadísticas de una partida larga)`, r.visible, r);
        await page.evaluate(salirDePartida);
      }

      // 2. Gacha: banners en pantallas de móvil y de plegable; tiradas.
      if (GACHA_MOVIL.includes(clave)) {
        const malos = await gachaBanners(P);
        check(`${nv}: gacha en los 9 banners (Dex y Clásico): destacados dentro del banner y de la ventana, a su tamaño (sin escalar), y los tres botones a la vista ${v.h < 520 ? 'sin desplazar nada' : 'sin desplazar (las probabilidades, debajo)'}`,
          !malos.length, malos.slice(0, 3));
      }
      if (['movil', 'movilBajo', 'pc', 'pleg2'].includes(clave)) {
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

      // 6. Teclado y Ajustes (Dex, escritorio).
      if (clave === 'pc') {
        await estilo(page, 'dex');
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
          res.push(...await page.evaluate(BORDES, '#menu-partner'));
        }
        const vivoComp = await page.evaluate(BORDES_VIVOS, '#menu-partner');
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

    // 8. Sin internet: con el service worker y en Clásico, se cargan las fuentes en reposo; luego, sin red, a Dex.
    {
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
