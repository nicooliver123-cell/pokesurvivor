/* ============ tools/nico/coop-e2e.js — E2E del cooperativo de nuestra versión ============
 *   cd tools/nico && npm install   (la primera vez)
 *   node coop-e2e.js [--dev] [--headed] [--grande 799] [--normal 25] [--puerto 8090]
 *
 * Qué hace, todo en este PC y sin tocar ningún servicio real:
 *   1. Arranca el emulador de Firebase (Auth 9099, Firestore 8080, RTDB 9000; proyecto
 *      demo-ps) con el JDK portable de ~/.cache/temurin-21 (sólo en el entorno del
 *      proceso, sin tocar el PATH del sistema). Si ya hay uno en marcha, lo reutiliza.
 *   2. Sirve el repo en http://127.0.0.1:8090 y abre index.html?emu (el paquete
 *      js/app.min.js; con --dev, dev.html con los scripts sueltos).
 *   3. Dos jugadores en dos navegadores aislados (Playwright/Chromium): crean cuenta de
 *      prueba, hacen el test, A elige un Pokémon GRANDE (Guzzlord) y B uno normal
 *      (Pikachu), se hacen amigos, A invita, B entra y juegan una partida en grupo.
 *   4. Comprueba que cada uno ve al otro moverse, que el grande sale reducido en los dos
 *      clientes (misma escala, hitbox, alto y sprite) y el normal intacto.
 *   5. En el ANFITRIÓN (A) registra cada 100 ms cualquier subida de vida de un enemigo
 *      durante toda la partida. Mete una curandera forzada (Chansey 'healer') y hiere a
 *      los de alrededor: con el mod no debe subir ninguna vida; como control, activa un
 *      momento curacionEnemiga=true y exige que SÍ suba (la prueba sabe detectarlo).
 *   6. Falla si algún cliente habla con la infraestructura del juego original.
 * Resultado en tools/nico/out/: informe.json, capturas, consolas y log del emulador.
 * Código de salida 0 = todo bien.
 */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), net = require('net'), crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { startServer } = require('./serve.js');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out'), SHOTS = path.join(OUT, 'capturas');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PORT = +arg('--puerto', 8090);
const PAGE = process.argv.includes('--dev') ? 'dev.html' : 'index.html';
const BASE = `http://127.0.0.1:${PORT}/${PAGE}?emu`;
const BIG = +arg('--grande', 799), NORMAL = +arg('--normal', 25);
const HEADLESS = !process.argv.includes('--headed');
const EMU_PORTS = [9099, 8080, 9000];

fs.rmSync(SHOTS, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const report = { inicio: new Date().toISOString(), url: BASE, grande: BIG, normal: NORMAL, pasos: [], comprobaciones: [], red: {} };
const save = () => fs.writeFileSync(path.join(OUT, 'informe.json'), JSON.stringify(report, null, 2));
function step(name, result) { report.pasos.push({ paso: name, resultado: result }); console.log(`[PASO] ${name} -> ${result}`); save(); }
function check(name, okv, detail) {
  report.comprobaciones.push({ comprobacion: name, ok: !!okv, detalle: detail });
  console.log(`[${okv ? 'OK' : 'FALLO'}] ${name}${detail !== undefined ? ' :: ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
  save();
}
let shotN = 0;
async function shot(page, label, opts = {}) {
  const f = path.join(SHOTS, String(++shotN).padStart(2, '0') + '_' + label + '.png');
  await page.screenshot(Object.assign({ path: f }, opts));
  return path.relative(OUT, f);
}

// ---------------- emulador de Firebase ----------------
function findJdk() {
  if (process.env.PS_JDK) return process.env.PS_JDK;
  const base = path.join(os.homedir(), '.cache', 'temurin-21');
  const java = d => path.join(d, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  if (fs.existsSync(java(base))) return base;
  const sub = fs.existsSync(base) ? fs.readdirSync(base).map(n => path.join(base, n)).find(d => fs.existsSync(java(d))) : null;
  if (!sub) throw new Error('No encuentro el JDK 21 en ' + base + ' (o define PS_JDK). Ver tools/nico/README.md.');
  return sub;
}
const portOpen = port => new Promise(res => {
  const s = net.connect({ host: '127.0.0.1', port });
  s.once('connect', () => { s.destroy(); res(true); });
  s.once('error', () => res(false));
  s.setTimeout(800, () => { s.destroy(); res(false); });
});
async function startEmulator() {
  const open = await Promise.all(EMU_PORTS.map(portOpen));
  if (open.every(Boolean)) { step('Emulador', 'ya había uno en marcha en 9099/8080/9000: se reutiliza'); return null; }
  if (open.some(Boolean)) throw new Error('Algún puerto del emulador está ocupado por otra cosa: ' + EMU_PORTS.filter((p, i) => open[i]).join(', '));
  const jdk = findJdk();
  const env = Object.assign({}, process.env, { JAVA_HOME: jdk, PATH: path.join(jdk, 'bin') + path.delimiter + process.env.PATH });
  const cli = require.resolve('firebase-tools/lib/bin/firebase.js');
  const log = fs.createWriteStream(path.join(OUT, 'emulador.log'));
  // cwd = out/: los firebase-debug.log / firestore-debug.log / database-debug.log quedan ahí.
  const child = spawn(process.execPath, [cli, 'emulators:start', '--project', 'demo-ps', '--only', 'auth,firestore,database',
    '--config', path.join(ROOT, 'firebase.json')], { cwd: OUT, env, windowsHide: true });
  let text = '', exited = null;
  child.stdout.on('data', d => { text += d; log.write(d); });
  child.stderr.on('data', d => { text += d; log.write(d); });
  child.on('exit', c => { exited = c; });
  const t0 = Date.now();
  while (Date.now() - t0 < 180000) {
    if (exited !== null) throw new Error('El emulador se cerró (código ' + exited + '). Ver out/emulador.log');
    if (/All emulators ready/i.test(text) && (await Promise.all(EMU_PORTS.map(portOpen))).every(Boolean)) {
      step('Emulador', `arrancado en ${((Date.now() - t0) / 1000).toFixed(1)} s con el JDK de ${jdk}`);
      return child;
    }
    await sleep(500);
  }
  throw new Error('El emulador no arrancó en 3 minutos. Ver out/emulador.log');
}
function stopEmulator(child) {
  if (!child || child.exitCode !== null) return;
  try {
    if (process.platform === 'win32') execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGINT');
  } catch (e) { /* ya cerrado */ }
}

// ---------------- jugadores ----------------
// Patrones de la infraestructura del original: ningún cliente debe tocarlos.
const PROD = [/pokesurvivor-jpter/i, /pokesurvivor\.com/i, /firebaseio\.com/i, /firebasedatabase\.app/i,
  /^https?:\/\/(firestore|identitytoolkit|securetoken|firebaseinstallations|firebase)\.googleapis\.com/i];
// Guarda las RTCPeerConnection para leer el tipo de conexión (no cambia el juego).
const INIT = `(() => { const O = window.RTCPeerConnection; if (!O) return; window.__pcs = [];
  window.RTCPeerConnection = function (...a) { const pc = new O(...a); window.__pcs.push(pc); return pc; };
  window.RTCPeerConnection.prototype = O.prototype; Object.setPrototypeOf(window.RTCPeerConnection, O); })();`;

async function newPlayer(browser, tag) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: 'block', locale: 'es-ES' });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const P = { tag, ctx, page, requests: [], prodHits: [], failed: [], consoleLines: [], pageErrors: [] };
  page.on('request', r => { P.requests.push(r.url()); if (PROD.some(p => p.test(r.url()))) P.prodHits.push(r.url()); });
  page.on('websocket', ws => { P.requests.push(ws.url()); if (PROD.some(p => p.test(ws.url()))) P.prodHits.push('WS ' + ws.url()); });
  page.on('requestfailed', r => P.failed.push(r.url() + ' :: ' + ((r.failure() || {}).errorText || '')));
  page.on('console', m => P.consoleLines.push(`[${new Date().toISOString()}] ${m.type()}: ${m.text()}`));
  page.on('pageerror', e => { P.pageErrors.push(e.message); P.consoleLines.push(`[${new Date().toISOString()}] PAGEERROR: ${e.message}`); });
  return P;
}
const visible = (page, sel) => page.locator(sel).first().isVisible().catch(() => false);
const waitVisible = (page, sel, timeout = 20000) => page.locator(sel).first().waitFor({ state: 'visible', timeout });
const text = (page, sel) => page.locator(sel).first().innerText().catch(() => '');

async function boot(P) {
  const { page, tag } = P;
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('boot') && document.getElementById('boot').classList.contains('hidden'), null, { timeout: 30000 });
  await sleep(300);
  if (await visible(page, '#tap-start')) await page.click('#tap-start');
  await waitVisible(page, '#scr-login');
  const m = await page.evaluate(() => ({ mode: G.DB.mode, emulator: !!(G.FIREBASE_CONFIG || {}).emulator, project: (G.FIREBASE_CONFIG || {}).projectId }));
  step(`${tag}: arranque`, `modo ${m.mode}, emulador=${m.emulator}, proyecto=${m.project}`);
  if (m.mode !== 'cloud' || !m.emulator || m.project !== 'demo-ps') throw new Error(tag + ': no está en modo nube contra el emulador (¿falta ?emu o el interruptor?)');
}

async function register(P, name, pass) {
  const { page, tag } = P;
  await page.click('#scr-login .tab[data-tab="register"]');
  await page.fill('#f-user', name);
  await page.fill('#f-pass', pass);
  await page.click('#btn-auth');
  await page.waitForFunction(() => {
    const v = id => { const e = document.getElementById(id); return e && !e.classList.contains('hidden'); };
    return v('scr-test') || v('scr-menu') || (document.getElementById('login-err').textContent || '').length > 0;
  }, null, { timeout: 20000 });
  const err = (await text(page, '#login-err')).trim();
  if (err) throw new Error(tag + ': crear cuenta: ' + err);
  step(`${tag}: cuenta de prueba`, 'creada en el emulador (uid ' + await page.evaluate(() => G.DB.fb && G.DB.fb.uid) + ')');
}

async function personality(P) {
  const { page, tag } = P;
  let n = 0;
  while (await visible(page, '#scr-test')) {
    await page.locator('#test-a .answer').first().click();
    await sleep(120);
    if (++n > 40) throw new Error('test infinito');
  }
  if (await visible(page, '#scr-result')) await page.click('#res-ok');
  await waitVisible(page, '#scr-menu');
  step(`${tag}: test de personalidad`, `${n} respuestas, menú principal`);
}

/** Pone de compañero un Pokémon concreto (como elegirlo en la colección). */
async function setPartner(P, dex) {
  const r = await P.page.evaluate(d => {
    G.DB.grant(d, 'gacha');
    G.DB.save.partner = d; G.DB.save.partnerShiny = false;
    G.DB.commit();
    return { dex: G.DB.save.partner, name: G.DEX_BY[d].name, escalaEsperada: G.MODS.escalaJugador(d) };
  }, dex);
  step(`${P.tag}: compañero`, `${r.name} (#${r.dex}), escala esperada ${r.escalaEsperada.toFixed(3)}`);
  return r;
}

async function openFriends(P) {
  const { page, tag } = P;
  await page.click('#scr-menu [data-go="friends"]');
  await page.waitForFunction(() => {
    const v = id => { const e = document.getElementById(id); return e && !e.classList.contains('hidden'); };
    return v('scr-friends') || v('scr-nick');
  }, null, { timeout: 20000 });
  if (await visible(page, '#scr-nick')) {
    await page.fill('#nick-in', await page.evaluate(() => G.DB.user));
    await page.click('#nick-ok');
    await waitVisible(page, '#scr-friends');
  }
  await sleep(500);
  step(`${tag}: Amigos`, (await text(page, '#fr-me')).trim().replace(/\s+/g, ' '));
}
const friendRow = (page, name) => page.locator('#fr-list .fr-row', { hasText: name });

/** En partida: elige solo las cartas de nivel / vínculo / objeto para que nada se quede parado. */
const UNBLOCK = `window.__unblock = setInterval(() => {
  const open = id => { const e = document.getElementById(id); return e && !e.classList.contains('hidden'); };
  try {
    if (open('scr-levelup')) { const c = document.querySelector('#cards:not(.done) > *'); if (c) c.click(); }
    if (open('scr-bond')) G.RunUI.pickBond(0);
    if (open('scr-item')) { const c = document.querySelector('#item-cards > *'); if (c) c.click(); }
  } catch (e) { /* nada */ }
}, 400);`;

/** Anfitrión: muestrea la vida de todos los enemigos cada 100 ms y apunta cualquier subida. */
const SAMPLER = `(() => {
  window.__heal = { phase: 'partida', samples: 0, ups: [], last: new Map(), maxSeen: 0 };
  window.__healT = setInterval(() => {
    const H = window.__heal, seen = new Map();
    H.samples++;
    for (const e of G.EnemyMgr.all()) {
      if (e.dead) continue;
      const prev = H.last.get(e.id);
      if (prev !== undefined && e.hp > prev + 1e-6)
        H.ups.push({ fase: H.phase, id: e.id, dex: e.dex, nombre: e.name, comportamiento: e.behavior, de: Math.round(prev), a: Math.round(e.hp), max: Math.round(e.maxHp) });
      seen.set(e.id, e.hp);
    }
    H.maxSeen = Math.max(H.maxSeen, seen.size);
    H.last = seen;
  }, 100);
})();`;

async function sizes(P) {
  return P.page.evaluate(() => {
    const info = p => ({ dex: p.dex, nombre: p.mon.name, escala: +((p.scale === undefined ? 1 : p.scale)).toFixed(4),
      r: +p.r.toFixed(2), alto: +p.bodyH.toFixed(2), escalaSprite: +p.anim.scale.toFixed(4) });
    const exp = d => { const s = G.MODS.escalaJugador(d); return { escala: +s.toFixed(4), r: +G.Sprites.bodyRadius(d, s).toFixed(2),
      alto: +G.Sprites.bodyHeight(d, s).toFixed(2), rOriginal: +G.Sprites.bodyRadius(d, 1).toFixed(2), altoOriginal: +G.Sprites.bodyHeight(d, 1).toFixed(2) }; };
    return { local: info(G.Coop.local), companeros: G.Coop.mates.map(m => Object.assign({ uid: m.uid, nombreJugador: m.name }, info(m.pl))),
      esperado: { [G.Coop.local.dex]: exp(G.Coop.local.dex), ...Object.fromEntries(G.Coop.mates.map(m => [m.pl.dex, exp(m.pl.dex)])) } };
  });
}

/** Recorte de la pantalla alrededor de los dos jugadores (para ver el tamaño). */
async function shotPlayers(P, label) {
  const box = await P.page.evaluate(() => {
    const cam = G.Camera, ps = [G.Coop.local, ...G.Coop.mates.map(m => m.pl)];
    const xs = ps.map(p => (p.x - cam.left()) * cam.scale), ys = ps.map(p => (p.y - cam.top()) * cam.scale);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2 - 30;
    const w = Math.max(360, Math.max(...xs) - Math.min(...xs) + 260), h = 260;
    return { x: Math.max(0, cx - w / 2), y: Math.max(0, cy - h / 2), width: Math.min(w, innerWidth), height: h };
  });
  box.width = Math.min(box.width, 1280 - box.x); box.height = Math.min(box.height, 720 - box.y);
  return shot(P.page, label, { clip: box });
}

(async () => {
  let emu = null, srv = null, browser = null, A = null, B = null, code = 0;
  try {
    emu = await startEmulator();
    srv = await startServer(ROOT, PORT);
    step('Servidor', `${ROOT} en http://127.0.0.1:${PORT}/ (página ${PAGE})`);
    browser = await chromium.launch({ headless: HEADLESS });
    report.navegador = browser.version();
    A = await newPlayer(browser, 'A');
    B = await newPlayer(browser, 'B');
    // De uno en uno: así no se juntan cientos de peticiones de sprites a la vez.
    await boot(A); await boot(B);
    const tag = crypto.randomBytes(3).toString('hex'), pw = () => crypto.randomBytes(12).toString('base64url');
    const cred = { A: { nombre: 'e2eA_' + tag, pass: pw() }, B: { nombre: 'e2eB_' + tag, pass: pw() } };  // sólo existen en el emulador
    await register(A, cred.A.nombre, cred.A.pass);
    await register(B, cred.B.nombre, cred.B.pass);
    await personality(A); await personality(B);
    const monA = await setPartner(A, BIG), monB = await setPartner(B, NORMAL);
    check('El Pokémon grande de la prueba es de los que se reducen', monA.escalaEsperada < 1, `${monA.name}: ${monA.escalaEsperada.toFixed(3)}`);
    check('El Pokémon normal de la prueba no se reduce', monB.escalaEsperada === 1, `${monB.name}: ${monB.escalaEsperada}`);
    await openFriends(A); await openFriends(B);

    // Amistad: A añade a B, B acepta.
    await A.page.fill('#fr-name', cred.B.nombre);
    await A.page.click('#fr-add button[type="submit"]');
    await A.page.waitForFunction(() => (document.getElementById('fr-msg').textContent || '').length > 0, null, { timeout: 15000 });
    step('A: añade a B', (await text(A.page, '#fr-msg')).trim());
    await friendRow(B.page, cred.A.nombre).locator('button', { hasText: 'Aceptar' }).waitFor({ timeout: 20000 });
    await friendRow(B.page, cred.A.nombre).locator('button', { hasText: 'Aceptar' }).click();
    await B.page.waitForFunction(() => (document.getElementById('fr-msg').textContent || '').length > 0, null, { timeout: 15000 });
    step('B: acepta', (await text(B.page, '#fr-msg')).trim());

    // A ve a B en línea (la presencia leída vale 1 min: si no sale, se reabre Amigos como haría un jugador).
    let inv = friendRow(A.page, cred.B.nombre).locator('button', { hasText: 'Invitar' });
    try { await inv.waitFor({ timeout: 15000 }); }
    catch (e) {
      step('A: Invitar aún no sale', 'se reabre Amigos tras 61 s (caché de presencia)');
      await sleep(61000);
      await A.page.click('#scr-friends [data-back]');
      await waitVisible(A.page, '#scr-menu');
      await A.page.click('#scr-menu [data-go="friends"]');
      await waitVisible(A.page, '#scr-friends');
      inv = friendRow(A.page, cred.B.nombre).locator('button', { hasText: 'Invitar' });
      await inv.waitFor({ timeout: 20000 });
    }
    await inv.click();
    await waitVisible(A.page, '#scr-lobby', 20000);
    await waitVisible(B.page, '#invite-pop', 20000);
    await B.page.click('#inv-yes');
    await waitVisible(B.page, '#scr-lobby', 20000);
    const t0 = Date.now();
    await A.page.waitForFunction(() => { const b = document.getElementById('lobby-start'); return b && !b.disabled && G.Social.room && G.Social.room.members.length >= 2; }, null, { timeout: 45000 });
    const lobby = await A.page.evaluate(() => G.Social.room.members.map(m => ({ nombre: m.name, dex: m.dex, modo: G.Net.mode(m.uid) })));
    step('Sala lista', `en ${Date.now() - t0} ms: ${JSON.stringify(lobby)}`);
    report.capturaSala = await shot(A.page, 'A_sala');

    // Partida
    const uidA = await A.page.evaluate(() => G.DB.fb.uid), uidB = await B.page.evaluate(() => G.DB.fb.uid);
    await A.page.click('#lobby-start');
    await Promise.all([A, B].map(P => P.page.waitForFunction(() => G.Coop.active && G.Game.state !== 'ui', null, { timeout: 25000 })));
    // Instrumentación de prueba: cartas automáticas, sin morir (la prueba no va de esquivar), y en el anfitrión el muestreo de vida.
    for (const P of [A, B]) await P.page.evaluate(`${UNBLOCK}; G.Coop.local.hurt = function () {};`);
    await A.page.evaluate(SAMPLER);
    const host = await A.page.evaluate(() => G.Coop.isHost);
    check('A es el anfitrión (quien decide la vida de los enemigos)', host === true, host);
    step('Partida en grupo', 'G.Coop.active en los dos clientes');
    await sleep(3500);   // que carguen los sprites y se coloquen

    // (c) tamaños, en cruz
    const sA = await sizes(A), sB = await sizes(B);
    report.tamanos = { A: sA, B: sB };
    const big = sA.esperado[BIG], mateA = sB.companeros.find(m => m.uid === uidA), mateB = sA.companeros.find(m => m.uid === uidB);
    const same = (x, y) => x && y && x.escala === y.escala && x.r === y.r && x.alto === y.alto && x.escalaSprite === y.escalaSprite;
    check('A (grande) se ve reducido en su propio cliente', sA.local.dex === BIG && sA.local.escala === big.escala && sA.local.escala < 1 &&
      sA.local.r === big.r && sA.local.r < big.rOriginal && sA.local.escalaSprite === sA.local.escala && sA.local.alto === big.alto,
      `${sA.local.nombre}: escala ${sA.local.escala}, hitbox ${sA.local.r} (original ${big.rOriginal}), alto ${sA.local.alto} (original ${big.altoOriginal})`);
    check('B ve al compañero grande reducido igual que A', mateA && mateA.dex === BIG && same(mateA, sA.local),
      mateA ? `en B: escala ${mateA.escala}, hitbox ${mateA.r}, alto ${mateA.alto}, sprite ${mateA.escalaSprite}` : 'B no tiene a A como compañero');
    check('B (normal) queda intacto en su cliente y en el de A', sB.local.escala === 1 && mateB && same(mateB, sB.local) && sB.local.r === sB.esperado[NORMAL].rOriginal,
      mateB ? `${sB.local.nombre}: escala ${sB.local.escala} / en A ${mateB.escala}, hitbox ${sB.local.r} / en A ${mateB.r}` : 'A no tiene a B como compañero');

    // (c) se ven y se mueven
    const pos = (P, u) => P.page.evaluate(u => { const m = G.Coop.mate(u); return m ? { x: Math.round(m.pl.x), y: Math.round(m.pl.y), conectado: m.connected } : null; }, u);
    const before = { AveB: await pos(A, uidB), BveA: await pos(B, uidA) };
    await Promise.all([
      (async () => { await A.page.keyboard.down('KeyD'); await sleep(1500); await A.page.keyboard.up('KeyD'); })(),
      (async () => { await B.page.keyboard.down('KeyS'); await sleep(1500); await B.page.keyboard.up('KeyS'); })()
    ]);
    await sleep(1500);
    const after = { AveB: await pos(A, uidB), BveA: await pos(B, uidA) };
    const moved = (a, b) => a && b && (a.x !== b.x || a.y !== b.y);
    check('A ve a B y lo ve moverse', moved(before.AveB, after.AveB), { antes: before.AveB, despues: after.AveB });
    check('B ve a A y lo ve moverse', moved(before.BveA, after.BveA), { antes: before.BveA, despues: after.BveA });
    // Se acercan para las capturas (A se queda un poco a la derecha de B, para verlos uno al lado del otro).
    await Promise.all([
      (async () => { await A.page.keyboard.down('KeyA'); await sleep(600); await A.page.keyboard.up('KeyA'); })(),
      (async () => { await B.page.keyboard.down('KeyW'); await sleep(1400); await B.page.keyboard.up('KeyW'); })()
    ]);
    await sleep(1200);
    report.capturas = [await shot(A.page, 'A_partida_juntos'), await shot(B.page, 'B_partida_juntos'),
      await shotPlayers(A, 'A_recorte_jugadores'), await shotPlayers(B, 'B_recorte_jugadores')];
    const tr = await A.page.evaluate(() => G.Net.peers().map(u => ({ uid: u, modo: G.Net.mode(u) })));
    step('Transporte', JSON.stringify(tr));

    // (d) curación en el anfitrión
    const healer = await A.page.evaluate(() => {
      const pl = G.Coop.local;
      const def = { dex: 113, name: 'Chansey', hp: 1e6, spd: 0, dmg: 1, xp: 0, behavior: 'healer', shotCd: 0.5, range: 9999 };
      const h = new G.Enemy(def, pl.x + 150, pl.y, { hp: 1, spd: 1, dmg: 1 });
      G.EnemyMgr.add(h);
      window.__healer = h;
      // Cada segundo se hiere a la curandera y a los de alrededor (sin matarlos), para que tengan vida que recuperar.
      window.__woundT = setInterval(() => {
        for (const e of G.EnemyMgr.queryCircle(h.x, h.y, 170)) if (!e.dead && e.hp > 2) e.hp = Math.max(1, e.hp * 0.6);
      }, 1000);
      window.__heal.phase = 'mod';
      return { id: h.id, comportamiento: h.behavior, curacionEnemiga: G.MODS.curacionEnemiga };
    });
    step('Curandera forzada en el anfitrión', JSON.stringify(healer));
    await sleep(8000);
    await A.page.evaluate(() => { G.MODS.curacionEnemiga = true; window.__heal.phase = 'control'; });
    await sleep(5000);
    await A.page.evaluate(() => { G.MODS.curacionEnemiga = false; window.__heal.phase = 'mod-otra-vez'; });
    await sleep(4000);
    const heal = await A.page.evaluate(() => {
      clearInterval(window.__healT); clearInterval(window.__woundT);
      const H = window.__heal, by = f => H.ups.filter(u => u.fase === f);
      return { muestras: H.samples, maxEnemigos: H.maxSeen, curanderaViva: !window.__healer.dead,
        subidas: { partida: by('partida'), mod: by('mod'), control: by('control').length, modOtraVez: by('mod-otra-vez') },
        ejemploControl: by('control').slice(0, 3) };
    });
    report.curacion = heal;
    check('Anfitrión: ninguna subida de vida de enemigos con el mod (toda la partida)',
      heal.subidas.partida.length === 0 && heal.subidas.mod.length === 0 && heal.subidas.modOtraVez.length === 0,
      `${heal.muestras} muestras cada 100 ms (hasta ${heal.maxEnemigos} enemigos a la vez); subidas: partida ${heal.subidas.partida.length}, con curandera ${heal.subidas.mod.length}, tras el control ${heal.subidas.modOtraVez.length}`);
    check('Control: con curacionEnemiga=true la misma curandera SÍ cura (la prueba lo detecta)', heal.subidas.control > 0 && heal.curanderaViva,
      `${heal.subidas.control} subidas en 5 s; p. ej. ${JSON.stringify(heal.ejemploControl[0] || null)}`);
    const st = { A: await A.page.evaluate(() => G.Game.state), B: await B.page.evaluate(() => G.Game.state) };
    check('La partida sigue viva en los dos clientes al terminar', st.A !== 'ui' && st.B !== 'ui' && st.A !== 'over' && st.B !== 'over', st);
    report.capturasFinal = [await shot(A.page, 'A_final'), await shot(B.page, 'B_final')];
  } catch (e) {
    code = 1;
    report.error = String(e && e.stack || e);
    console.error('[ERROR]', e);
    try { if (A) await shot(A.page, 'A_error'); if (B) await shot(B.page, 'B_error'); } catch (e2) { /* nada */ }
  } finally {
    for (const P of [A, B].filter(Boolean)) {
      fs.writeFileSync(path.join(OUT, `consola-${P.tag}.log`), P.consoleLines.join('\n'));
      const hosts = {};
      for (const u of P.requests) { try { const h = new URL(u).host; hosts[h] = (hosts[h] || 0) + 1; } catch (e) { /* data: */ } }
      report.red[P.tag] = { hosts, infraOriginal: P.prodHits, fallidas: P.failed.slice(0, 20), erroresDePagina: P.pageErrors };
    }
    if (A && B) {
      check('Ningún cliente habla con la infraestructura del juego original', !A.prodHits.length && !B.prodHits.length, { A: A.prodHits, B: B.prodHits });
      const ext = Object.keys(Object.assign({}, report.red.A.hosts, report.red.B.hosts)).filter(h => !/^127\.0\.0\.1(:\d+)?$/.test(h) && h !== 'www.gstatic.com');
      check('Sólo hosts locales y el SDK de Firebase (www.gstatic.com)', ext.length === 0, ext.length ? ext : Object.keys(Object.assign({}, report.red.A.hosts, report.red.B.hosts)));
      check('Sin errores de JavaScript en las páginas', !A.pageErrors.length && !B.pageErrors.length, { A: A.pageErrors, B: B.pageErrors });
    }
    if (report.comprobaciones.some(c => !c.ok)) code = 1;
    report.fin = new Date().toISOString();
    report.resultado = code ? 'FALLO' : 'OK';
    save();
    if (A) await A.ctx.close().catch(() => {});
    if (B) await B.ctx.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    if (srv) srv.close();
    stopEmulator(emu);
    console.log(`\nRESULTADO: ${report.resultado} · informe en ${path.join(OUT, 'informe.json')}`);
    process.exit(code);
  }
})();
