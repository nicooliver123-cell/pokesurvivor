/* ============ tools/nico/coop-e2e.js — E2E del cooperativo de nuestra versión ============
 *   cd tools/nico && npm install   (la primera vez)
 *   node coop-e2e.js [--dev] [--headed] [--grande 799] [--normal 25] [--puerto 8090]
 *                    [--latencia 150] [--reutilizar-emulador]
 *
 * Qué hace, todo en este PC y sin tocar ningún servicio real:
 *   1. Arranca el emulador de Firebase (Auth 9099, Firestore 8080, RTDB 9000; proyecto
 *      demo-ps) con el JDK portable de ~/.cache/temurin-21 (sólo en el entorno del
 *      proceso, sin tocar el PATH del sistema). Si esos puertos ya están ocupados, para
 *      con un mensaje claro; con --reutilizar-emulador usa el que haya (y no lo cierra).
 *   2. Sirve el repo en http://127.0.0.1:8090 y abre index.html?emu (el paquete
 *      js/app.min.js; con --dev, dev.html con los scripts sueltos).
 *   3. Dos jugadores en dos navegadores aislados (Playwright/Chromium): crean cuenta de
 *      prueba, hacen el test, A elige un Pokémon GRANDE (Guzzlord) y B uno normal
 *      (Pikachu), se hacen amigos, A invita, B entra y juegan una partida en grupo.
 *      A es el anfitrión; B, el invitado (como jugará el amigo de Nico).
 *   4. Comprueba que cada uno ve al otro moverse, que el grande sale reducido en los dos
 *      clientes (misma escala, hitbox, alto y sprite) y el normal intacto.
 *   5. Transporte (obligatorio): los dos se ven por el canal directo (G.Net.mode 'direct'),
 *      el par de candidatos elegido de WebRTC está conectado y no pasa por un TURN, el canal
 *      del juego lleva mensajes en los dos sentidos, y durante la partida no se manda nada
 *      por el relé de la base de datos.
 *   6. Vida de los enemigos, con una TRAMPA en el setter de `hp` de G.Enemy (cada
 *      escritura, sin huecos de muestreo), en los dos clientes:
 *      - Anfitrión: con el mod no sube nunca (curandera forzada incluida); como control,
 *        activa un momento curacionEnemiga=true y exige que SÍ suba.
 *      - Invitado: con latencia simulada en su canal (--latencia ms por sentido), golpes
 *        suyos y escudos forzados, no puede verse ninguna subida que dure más de un
 *        fotograma de red (150 ms) salvo la resincronización legítima tras la ventana
 *        (ver CRITERIO abajo); con escudo no predice el golpe. Control: el invitado sin
 *        el mod (curacionEnemiga=true en su cliente) SÍ ve subidas largas y predice con
 *        escudo, así que la prueba sabe detectarlo.
 *      - Vuelta de la grieta: el invitado borra sus copias y el anfitrión las vuelve a
 *        anunciar ('ne'), como en rift.js; las copias nacen con la vida real.
 *   7. Falla si algún cliente habla con la infraestructura del juego original, si hay
 *      errores de JavaScript o si el aviso legal no lleva el contacto del fork.
 *   8. Antes de la partida, A trae una partida "oficial" sintética por Ajustes > Cuenta (elegir
 *      archivo, vista previa, Confirmar): tiene que sumarse y subirse a Firestore con la
 *      transacción normal, y traer otra vez el mismo archivo no puede sumar nada. El código
 *      de la sección, pegado en la consola de esta versión, avisa y no descarga; y elegir la
 *      partida de la propia cuenta (con o sin el registro de lo traído) da error.
 *
 * CRITERIO del invitado. Cada subida de vida de una copia se clasifica según el tiempo
 * desde el último golpe que el propio invitado predijo en ella (lo mide la trampa):
 *   - 'dentro-ventana': menos de G.MODS.ventanaVidaMs (600 ms). Es el rebote que se veía
 *     antes; con el mod no puede pasar: debe haber 0.
 *   - 'resincronizacion': pasada la ventana. El anfitrión manda y su vida es la buena (el
 *     golpe no llegó a contar, p. ej. por un escudo): legítima.
 *   - 'sin-golpe': sin golpe predicho en esa copia. Sólo puede ser una curación real o un
 *     dato viejo: falla si dura más de 150 ms.
 * La duración va desde la subida hasta que la vida vuelve a estar a su nivel anterior (o
 * la copia desaparece). Las fases en las que el anfitrión cura a propósito (su control)
 * no cuentan para el invitado.
 *
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
const REUSE = process.argv.includes('--reutilizar-emulador');
const LAT = +arg('--latencia', 150);          // ms por sentido en el canal del invitado durante su prueba
const VISIBLE_MS = 150;                       // una subida que dura más que esto se ve (un fotograma de red)
const EMU_PORTS = [9099, 8080, 9000];
const FORK_ISSUES = 'https://github.com/nicooliver123-cell/pokesurvivor/issues';
const FORK_REPO = 'https://github.com/nicooliver123-cell/pokesurvivor';

fs.rmSync(SHOTS, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const report = { inicio: new Date().toISOString(), url: BASE, grande: BIG, normal: NORMAL, latenciaInvitadoMs: LAT, pasos: [], comprobaciones: [], red: {} };
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
  const busy = EMU_PORTS.filter((p, i) => open[i]);
  if (busy.length) {
    if (!REUSE) throw new Error(`Puertos del emulador ocupados: ${busy.join(', ')}. Cierra lo que los usa (¿otro emulador de Firebase en marcha?) ` +
      'o, si es un emulador del proyecto demo-ps que quieres aprovechar, repite con --reutilizar-emulador.');
    if (busy.length < EMU_PORTS.length) throw new Error(`--reutilizar-emulador necesita un emulador con los tres puertos (${EMU_PORTS.join(', ')}); ` +
      `sólo están ocupados ${busy.join(', ')}, así que es otra cosa. Ciérrala y repite.`);
    step('Emulador', 'se reutiliza el que ya estaba en marcha en 9099/8080/9000 (--reutilizar-emulador; no se cierra al terminar)');
    return null;
  }
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
// Antes que el juego: guarda las RTCPeerConnection (para leer el par de candidatos elegido) y
// permite simular latencia en el canal directo (window.__lat ms por sentido, 0 = nada). La
// latencia retrasa lo que se manda y lo que llega sin desordenarlo. No cambia nada más del juego.
const INIT = `(() => {
  const O = window.RTCPeerConnection; if (!O) return; window.__pcs = [];
  window.RTCPeerConnection = function (...a) { const pc = new O(...a); window.__pcs.push(pc); return pc; };
  window.RTCPeerConnection.prototype = O.prototype; Object.setPrototypeOf(window.RTCPeerConnection, O);
  window.__lat = 0;
  const D = window.RTCDataChannel && RTCDataChannel.prototype; if (!D) return;
  const send = D.send, onm = Object.getOwnPropertyDescriptor(D, 'onmessage');
  const later = (ch, k, fn) => {
    const now = performance.now();
    if (!window.__lat && !(ch[k] > now)) return fn();
    const due = Math.max(now + window.__lat, ch[k] || 0); ch[k] = due;
    setTimeout(fn, due - now);
  };
  D.send = function (d) { const ch = this; return later(ch, '__dueOut', () => { if (ch.readyState === 'open' || !(ch.__dueOut > 0)) send.call(ch, d); }); };
  if (onm && onm.set) Object.defineProperty(D, 'onmessage', { configurable: true, enumerable: onm.enumerable,
    get() { return onm.get.call(this); },
    set(fn) { const ch = this; onm.set.call(this, typeof fn === 'function' ? function (ev) { later(ch, '__dueIn', () => fn.call(ch, ev)); } : fn); } });
})();`;

/** Trampa en el setter de la vida de los enemigos (G.Enemy.prototype.hp): ve CADA escritura.
 *  Sólo cuenta enemigos ya registrados (G.EnemyMgr.get(id) === e): lo que pasa al crearlos
 *  (shiny, élite, vida inicial de una copia) no es una subida. Se instala antes de la partida. */
const TRAP = `(() => {
  if (window.__hpTrap) return 'ya estaba';
  const K = Symbol('hp'), P = G.Enemy.prototype;
  const T = window.__hpTrap = { fase: 'menu', ventanaRef: +G.MODS.ventanaVidaMs || 600, subidas: [], abiertas: new Map(),
    golpeT: new WeakMap(), c: {}, enGolpe: null, enGolpeEscudo: false };
  const cnt = () => T.c[T.fase] || (T.c[T.fase] = { escrituras: 0, golpes: 0, golpesConEscudo: 0, predichas: 0, predichasConEscudo: 0 });
  const vigilado = e => G.EnemyMgr.get(e.id) === e && !e.dead;
  Object.defineProperty(P, 'hp', { configurable: true,
    get() { return this[K]; },
    set(v) {
      const old = this[K];
      this[K] = v;
      if (old === undefined || !vigilado(this)) return;
      const c = cnt(), now = performance.now();
      c.escrituras++;
      if (T.enGolpe === this) {                       // golpe predicho por el invitado (hurt de la copia)
        c.predichas++; if (T.enGolpeEscudo) c.predichasConEscudo++;
        T.enGolpe = null;
        T.golpeT.set(this, now);
      } else if (v > old + 1e-6) {
        const g = T.golpeT.get(this), ms = g === undefined ? null : now - g;
        const rec = { fase: T.fase, id: this.id, nombre: this.name, de: Math.round(old * 10) / 10, a: Math.round(v * 10) / 10,
          max: Math.round(this.maxHp), t: Math.round(now), msDesdeGolpe: ms === null ? null : Math.round(ms), dura: null,
          clase: !this.remote ? 'anfitrion' : ms === null ? 'sin-golpe' : ms < T.ventanaRef ? 'dentro-ventana' : 'resincronizacion' };
        T.subidas.push(rec);
        const prev = T.abiertas.get(this);
        if (prev) { prev.rec.dura = Math.round(now - prev.rec.t); prev.rec.cierre = 'otra subida'; }
        T.abiertas.set(this, { rec, base: old });
      }
      const ab = T.abiertas.get(this);
      if (ab && v <= ab.base + 1e-6) { ab.rec.dura = Math.round(now - ab.rec.t); T.abiertas.delete(this); }
    } });
  // G.Coop.hit va justo antes de restar en la copia la vida predicha (enemy.js, hurt).
  const hit = G.Coop.hit;
  G.Coop.hit = function (e, ...a) {
    const c = cnt(); c.golpes++;
    const esc = !!(e.net && (e.net.st & 4)); if (esc) c.golpesConEscudo++;
    T.enGolpe = e; T.enGolpeEscudo = esc;
    queueMicrotask(() => { if (T.enGolpe === e) T.enGolpe = null; });
    return hit.call(this, e, ...a);
  };
  T.timer = setInterval(() => {
    const now = performance.now();
    for (const [e, ab] of T.abiertas) if (!vigilado(e)) { ab.rec.dura = Math.round(now - ab.rec.t); ab.rec.cierre = 'desaparece'; T.abiertas.delete(e); }
  }, 50);
  T.cerrar = () => {
    const now = performance.now();
    for (const [, ab] of T.abiertas) { ab.rec.dura = Math.round(now - ab.rec.t); ab.rec.cierre = 'abierta al final'; }
    T.abiertas.clear(); clearInterval(T.timer);
  };
  return 'instalada';
})();`;

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
  step(`${tag}: trampa de vida`, await page.evaluate(TRAP));
}

/** Aviso legal: contacto y código del fork, sin correo ni donaciones. */
async function legalNotice(P) {
  const { page } = P;
  await page.click('#scr-login [data-legal]');
  await waitVisible(page, '#scr-legal');
  await sleep(900);   // que termine la transición, para la captura
  const r = await page.evaluate(() => {
    const m = document.getElementById('legal-mail'), rp = document.getElementById('legal-repo'), box = document.getElementById('scr-legal');
    return { contacto: m.href, textoContacto: m.textContent, abreAparte: m.target === '_blank', repo: rp.href,
      correo: /mailto:|@gmail\.com/i.test(box.innerHTML), donaciones: /donaciones voluntarias/i.test(box.textContent),
      atribucion: !!box.querySelector('a[href="https://github.com/JPTER78/pokesurvivor"]'),
      rechazaOriginal: G.FIREBASE_PERMITIDA({ projectId: 'pokesurvivor-jpter' }) === false };
  });
  report.capturaAvisoLegal = await shot(page, P.tag + '_aviso_legal');
  await page.click('#legal-close');
  await waitVisible(page, '#scr-login');
  check('Aviso legal: contacto = avisos del fork, código = repo del fork, original sólo como atribución, sin correo ni donaciones',
    r.contacto === FORK_ISSUES && r.abreAparte && r.repo === FORK_REPO && !r.correo && !r.donaciones && r.atribucion, r);
  check('En la página, G.FIREBASE_PERMITIDA rechaza el proyecto del original', r.rechazaOriginal);
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

/**
 * Traer la partida del juego oficial por Ajustes > Cuenta, en modo nube (emulador): elegir el
 * archivo, vista previa, Confirmar, subida con la transacción normal y reimportación sin duplicar.
 * La partida "oficial" es sintética (formato de newSave()): la prueba nunca habla con el juego oficial.
 */
async function importOfficial(P) {
  const { page, tag } = P;
  const file = path.join(OUT, 'partida-oficial-sintetica.json');
  const env = await page.evaluate(() => {
    const s = G.DB.newSave('OficialE2E');
    s.created = Date.UTC(2026, 3, 1); s.coins = 4321; s.tickets = { t1: 9, t10: 2 };
    for (const d of [1, 4, 7, 25, 133, 150, 249]) s.owned[d] = { at: s.created, from: 'gacha' };
    s.shiny[25] = { at: s.created, from: 'wild' }; s.partner = 25; s.partnerShiny = true;
    // Coherente, como una real: los logros que ya le dan sus datos (si no, el fork los daría con su premio al entrar al menú).
    s.legends = { 150: s.created }; s.ach = { own1: s.created, shiny1: s.created, leg_150: s.created }; s.pupg = { 25: { hp: 3 } };
    return { tipo: 'pokesurvivor-partida', version: 1, origen: 'pruebas', exportado: Date.now(), save: s };
  });
  fs.writeFileSync(file, JSON.stringify(env));
  const antes = await page.evaluate(() => ({ coins: G.DB.save.coins, t1: G.DB.save.tickets.t1, t10: G.DB.save.tickets.t10 }));
  await page.click('#btn-settings');
  await waitVisible(page, '#scr-settings');
  await page.click('#set-tabs .gen-tab[data-t="acc"]');
  await waitVisible(page, '#imp-pick');
  await page.setInputFiles('#imp-file', file);
  await waitVisible(page, '#imp-ok');
  await page.locator('#imp-box .imp-prev').scrollIntoViewIfNeeded();
  report.capturaImportar = await shot(page, tag + '_importar_vista_previa');
  const previa = (await text(page, '#imp-box .imp-prev')).replace(/\s+/g, ' ');
  await page.click('#imp-ok');
  await page.waitForFunction(() => /subida a la nube|se subirá/.test((document.querySelector('#imp-box .imp-msg') || {}).textContent || ''), null, { timeout: 20000 });
  const r = await page.evaluate(async () => {
    const fb = G.DB.fb, snap = await fb.fs.collection('saves').doc(fb.uid).get({ source: 'server' });
    const nube = snap.data().save, s = G.DB.save;
    return { coins: s.coins, t1: s.tickets.t1, t10: s.tickets.t10, partner: s.partner, partnerShiny: s.partnerShiny, sync: G.DB.syncState,
      nube: { coins: nube.coins, t1: nube.tickets.t1, owned: [1, 4, 7, 25, 133, 150, 249].every(d => nube.owned[d]), shiny25: !!nube.shiny[25],
        legend150: !!nube.legends[150], hp25: (nube.pupg[25] || {}).hp, reg: nube.importOficial },
      msg: document.querySelector('#imp-box .imp-msg').textContent.replace(/\s+/g, ' ').trim() };
  });
  step(`${tag}: traer partida oficial`, `vista previa «${previa.slice(0, 160)}…» · ${r.msg}`);
  check('Importar (nube): suma colección, monedas y tickets, pone el compañero y lo sube a Firestore con la transacción normal',
    r.coins === antes.coins + 4321 && r.t1 === antes.t1 + 9 && r.t10 === antes.t10 + 2 && r.partner === 25 && r.partnerShiny === true && r.sync === 'ok' &&
    r.nube.coins === r.coins && r.nube.t1 === r.t1 && r.nube.owned && r.nube.shiny25 && r.nube.legend150 && r.nube.hp25 === 3 &&
    r.nube.reg && r.nube.reg[String(env.save.created)] && r.nube.reg[String(env.save.created)].coins === 4321, { antes, despues: r });
  // Otra vez el mismo archivo: nada nuevo y Confirmar desactivado.
  await page.setInputFiles('#imp-file', file);
  await waitVisible(page, '#imp-box .imp-prev');
  const re = await page.evaluate(() => ({ desactivado: document.getElementById('imp-ok').disabled,
    yaTraida: /Ya habías traído esta partida/.test(document.querySelector('#imp-box .imp-prev').textContent),
    coins: G.DB.save.coins }));
  check('Importar otra vez el mismo archivo no ofrece sumar nada (monedas y tickets sin duplicar)', re.desactivado && re.yaTraida && re.coins === r.coins, re);
  await page.click('#imp-cancel');
  // El código de la sección, pegado en la consola de ESTA versión (la pestaña donde se pulsa Copiar):
  // avisa de que no es el juego oficial y no descarga nada.
  const codigo = await page.inputValue('#imp-code');
  let alerta = null, descargas = 0;
  const onDialog = d => { alerta = d.message(); d.dismiss().catch(() => {}); };
  const onDownload = () => { descargas++; };
  page.on('dialog', onDialog); page.on('download', onDownload);
  await page.evaluate(codigo);
  await sleep(800);
  page.off('dialog', onDialog); page.off('download', onDownload);
  check('El código para el juego oficial, pegado en la consola de esta versión, avisa y no descarga nada',
    /versión modificada, no el juego oficial/.test(alerta || '') && descargas === 0, { alerta, descargas });
  // Elegir la partida de la propia cuenta (como si se exportara desde aquí): error, sin vista previa ni sumar nada.
  // Con el registro de lo traído (lo normal) y sin él (se reconoce por su `created`).
  const propias = [];
  for (const conRegistro of [true, false]) {
    const f = path.join(OUT, `partida-propia-${conRegistro ? 'con' : 'sin'}-registro.json`);
    fs.writeFileSync(f, await page.evaluate(conReg => {
      const s = JSON.parse(JSON.stringify(G.DB.save));
      if (!conReg) delete s.importOficial;
      return JSON.stringify({ tipo: 'pokesurvivor-partida', version: 1, origen: 'otra-web.test', exportado: Date.now(), save: s });
    }, conRegistro));
    // Sin el mensaje de la vuelta anterior: así se espera al de este archivo (repintar lo vuelve a crear).
    await page.evaluate(() => { const m = document.querySelector('#imp-box .imp-msg'); if (m) m.remove(); });
    await page.setInputFiles('#imp-file', f);
    await waitVisible(page, '#imp-box .imp-msg');
    propias.push(await page.evaluate(() => ({ msg: document.querySelector('#imp-box .imp-msg').textContent.replace(/\s+/g, ' ').trim(),
      previa: !!document.querySelector('#imp-box .imp-prev'), confirmar: !!document.getElementById('imp-ok'), coins: G.DB.save.coins })));
  }
  report.capturaImportarPropia = await shot(page, tag + '_importar_partida_propia');
  check('Elegir la partida de la propia cuenta (con y sin el registro) da error, sin vista previa ni Confirmar, y no suma nada',
    propias.length === 2 && propias.every(p => /partida de esta versión, no del juego oficial/.test(p.msg) && !p.previa && !p.confirmar && p.coins === r.coins), propias);
  await page.click('#set-close');
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

/** Transporte: modo de G.Net y par de candidatos elegido por WebRTC (getStats). */
async function transport(P, peer) {
  return P.page.evaluate(async u => {
    const pares = [];
    for (const pc of window.__pcs || []) {
      if (pc.connectionState !== 'connected') continue;
      const st = await pc.getStats();
      let pair = null;
      st.forEach(s => { if (s.type === 'transport' && s.selectedCandidatePairId) pair = st.get(s.selectedCandidatePairId); });
      if (!pair) st.forEach(s => { if (s.type === 'candidate-pair' && s.nominated && s.state === 'succeeded') pair = s; });
      if (!pair) continue;
      const l = st.get(pair.localCandidateId) || {}, r = st.get(pair.remoteCandidateId) || {};
      // Lo que lleva el canal de datos del juego ('g'): los contadores de bytes del par a veces
      // se quedan atrás en Chromium; los mensajes del canal no.
      let canal = null;
      st.forEach(s => { if (s.type === 'data-channel' && s.label === 'g') canal = { estado: s.state, mensajesEnviados: s.messagesSent, mensajesRecibidos: s.messagesReceived }; });
      pares.push({ estado: pair.state, local: l.candidateType, remoto: r.candidateType, protocolo: l.protocol,
        bytesEnviados: pair.bytesSent, bytesRecibidos: pair.bytesReceived, rttMs: pair.currentRoundTripTime != null ? Math.round(pair.currentRoundTripTime * 1000) : null, canal });
    }
    return { modo: G.Net.mode(u), viaTurn: G.Net.viaTurn(u), pares, rele: G.Net.stats.relaySent, enviados: G.Net.stats.sent };
  }, peer);
}
const directOk = t => t.modo === 'direct' && !t.viaTurn && t.pares.length > 0 &&
  t.pares.every(p => p.estado === 'succeeded' && p.local && p.remoto && p.local !== 'relay' && p.remoto !== 'relay' &&
    p.canal && p.canal.estado === 'open' && p.canal.mensajesEnviados > 0 && p.canal.mensajesRecibidos > 0);

/** Resumen de la trampa de vida de un cliente. */
async function trapSummary(P) {
  return P.page.evaluate(() => {
    const T = window.__hpTrap;
    T.cerrar();
    return { contadores: T.c, ventanaRefMs: T.ventanaRef, subidas: T.subidas };
  });
}

(async () => {
  let emu = null, srv = null, browser = null, A = null, B = null, code = 0;
  try {
    if (await portOpen(PORT)) throw new Error(`El puerto ${PORT} (la web de la prueba) está ocupado: ciérralo o usa --puerto <otro>.`);
    emu = await startEmulator();
    srv = await startServer(ROOT, PORT);
    step('Servidor', `${ROOT} en http://127.0.0.1:${PORT}/ (página ${PAGE})`);
    browser = await chromium.launch({ headless: HEADLESS });
    report.navegador = browser.version();
    A = await newPlayer(browser, 'A');
    B = await newPlayer(browser, 'B');
    // De uno en uno: así no se juntan cientos de peticiones de sprites a la vez.
    await boot(A); await boot(B);
    await legalNotice(A);
    const tag = crypto.randomBytes(3).toString('hex'), pw = () => crypto.randomBytes(12).toString('base64url');
    const cred = { A: { nombre: 'e2eA_' + tag, pass: pw() }, B: { nombre: 'e2eB_' + tag, pass: pw() } };  // sólo existen en el emulador
    await register(A, cred.A.nombre, cred.A.pass);
    await register(B, cred.B.nombre, cred.B.pass);
    await personality(A); await personality(B);
    await importOfficial(A);   // Ajustes > Cuenta > traer la partida del juego oficial (sintética), en la nube
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
    // Instrumentación de prueba: cartas automáticas y sin morir (la prueba no va de esquivar).
    for (const P of [A, B]) await P.page.evaluate(`${UNBLOCK}; G.Coop.local.hurt = function () {}; window.__hpTrap.fase = 'partida';`);
    // Contadores de golpes del invitado: los que B manda ('h') y los que le llegan a A.
    await B.page.evaluate(() => {
      window.__hEnv = 0;
      const th = G.Net.toHost;
      G.Net.toHost = function (msg) { for (const ev of (msg && msg.ev) || []) if (ev[0] === 'h') window.__hEnv++; return th.call(this, msg); };
    });
    await A.page.evaluate(() => {
      window.__hRec = 0;
      G.Net.on((from, msg) => { if (msg && msg.k === 'f') for (const ev of msg.ev || []) if (ev[0] === 'h') window.__hRec++; });
    });
    const host = await A.page.evaluate(() => G.Coop.isHost);
    check('A es el anfitrión (quien decide la vida de los enemigos)', host === true, host);
    step('Partida en grupo', 'G.Coop.active en los dos clientes');
    await sleep(3500);   // que carguen los sprites y se coloquen
    const rele0 = { A: (await transport(A, uidB)).rele, B: (await transport(B, uidA)).rele };

    // Tamaños, en cruz
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

    // Se ven y se mueven
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

    // Transporte (obligatorio)
    const trA = await transport(A, uidB), trB = await transport(B, uidA);
    report.transporte = { A: trA, B: trB };
    check('Transporte: A y B se hablan por el canal directo de WebRTC: par elegido conectado, sin TURN, y el canal del juego abierto con mensajes en los dos sentidos', directOk(trA) && directOk(trB),
      { A: { modo: trA.modo, pares: trA.pares }, B: { modo: trB.modo, pares: trB.pares } });

    // ---- Vida en el ANFITRIÓN: curandera forzada, y control con la curación activada ----
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
      window.__hpTrap.fase = 'mod';
      return { id: h.id, comportamiento: h.behavior, curacionEnemiga: G.MODS.curacionEnemiga };
    });
    step('Curandera forzada en el anfitrión', JSON.stringify(healer));
    await sleep(8000);
    // Control del anfitrión: el invitado verá curaciones reales, que no cuentan para él.
    await B.page.evaluate(() => { window.__hpTrap.fase = 'control-anfitrion'; });
    await A.page.evaluate(() => { G.MODS.curacionEnemiga = true; window.__hpTrap.fase = 'control'; });
    await sleep(5000);
    await A.page.evaluate(() => { G.MODS.curacionEnemiga = false; window.__hpTrap.fase = 'mod-otra-vez'; });
    await sleep(1500);
    await B.page.evaluate(() => { window.__hpTrap.fase = 'partida'; });
    await sleep(2500);
    const healerAlive = await A.page.evaluate(() => { clearInterval(window.__woundT); return !window.__healer.dead; });

    // ---- Vida en el INVITADO: latencia, golpes suyos y escudos forzados ----
    // Dos dianas de mucha vida al lado de B (una con escudo permanente) y escudos en la mitad de
    // los enemigos de su alrededor, desde el anfitrión, que es quien los decide.
    const dianas = await A.page.evaluate(() => {
      const b = G.Coop.mates[0].pl;
      const mk = (dex, dx) => { const e = new G.Enemy({ dex, hp: 1e6, spd: 0, dmg: 0, xp: 0, behavior: 'healer', shotCd: 99, range: 0 }, b.x + dx, b.y - 60, { hp: 1, spd: 1, dmg: 1 }); G.EnemyMgr.add(e); return e; };
      const libre = mk(143, -70), conEscudo = mk(242, 70);
      window.__escudoT = setInterval(() => {
        conEscudo.shield = conEscudo.maxHp; conEscudo.shieldT = 8;
        for (const e of G.EnemyMgr.queryCircle(b.x, b.y, 420)) if (!e.dead && e !== libre && e.id % 2 === 0) { e.shield = Math.max(e.shield, e.maxHp * 0.35); e.shieldT = 8; }
      }, 300);
      window.__hpTrap.fase = 'invitado';
      return { libre: libre.id, conEscudo: conEscudo.id };
    });
    await sleep(800);   // que lleguen las copias y el bit de escudo
    // Golpes del invitado cada 400 ms por el camino de un ataque (hurt de la copia): a las dianas y a
    // los 6 enemigos más cercanos con vida. (Además ataca solo, como siempre.)
    await B.page.evaluate(({ d, lat }) => {
      window.__lat = lat;
      window.__golpesT = setInterval(() => {
        const me = G.Coop.local;
        const near = G.EnemyMgr.all().filter(e => e.remote && !e.dead && e.hp > 5 && e.id !== d.libre && e.id !== d.conEscudo)
          .sort((a, b) => G.U.dist2(a.x, a.y, me.x, me.y) - G.U.dist2(b.x, b.y, me.x, me.y)).slice(0, 6);
        for (const e of [G.EnemyMgr.get(d.libre), G.EnemyMgr.get(d.conEscudo), ...near]) if (e && !e.dead) e.hurt(3, '#fff');
      }, 400);
      window.__hpTrap.fase = 'B-mod';
    }, { d: dianas, lat: LAT });
    await sleep(8000);
    // Control del invitado: su cliente como el original (curacionEnemiga=true sólo en B: no cambia
    // nada del anfitrión). Debe ver el rebote que la prueba tiene que saber detectar.
    await B.page.evaluate(() => { G.MODS.curacionEnemiga = true; window.__hpTrap.fase = 'B-original'; });
    await sleep(6000);
    await B.page.evaluate(() => { G.MODS.curacionEnemiga = false; clearInterval(window.__golpesT); window.__lat = 0; window.__hpTrap.fase = 'final'; });
    await sleep(2000);
    await A.page.evaluate(() => { clearInterval(window.__escudoT); });

    // ---- Vuelta de la grieta: el invitado borra sus copias y el anfitrión las anuncia de nuevo ----
    await B.page.evaluate(() => {
      window.__hpTrap.fase = 'grieta';
      window.__ne = [];
      const ar = G.EnemyMgr.addRemote;
      G.EnemyMgr.addRemote = function (o) { const had = G.EnemyMgr.get(o.id); const e = ar.call(this, o); if (!had) window.__ne.push({ id: o.id, max: o.hp, vida: o.vida, nace: e.hp }); return e; };
      G.EnemyMgr.clearRemote();                       // como rift.js en el invitado
    });
    const grietaA = await A.page.evaluate(() => {
      const heridos = {}; let n = 0;
      for (const e of G.EnemyMgr.all()) {
        if (e.dead) continue;
        if (e.hp < e.maxHp - 1) heridos[e.id] = Math.ceil(e.hp);
        G.Coop.enemyAdded(e); n++;                    // lo mismo que hace restore() -> add() al volver
      }
      window.__hpTrap.fase = 'grieta';
      return { anunciados: n, heridos };
    });
    await sleep(1200);
    const grietaB = await B.page.evaluate(() => {
      const compat = G.EnemyMgr.addRemote({ id: 987654321, dex: 25, x: 0, y: 0, boss: false, shiny: false, hp: 50, dmg: 1, beh: 'remote' });
      const sinDato = compat.hp; G.EnemyMgr.removeRemote(987654321, false);
      return { recreadas: window.__ne, sinDato };
    });
    const heridosIds = Object.keys(grietaA.heridos).map(Number);
    const nace = new Map(grietaB.recreadas.map(r => [r.id, r]));
    const bien = heridosIds.filter(id => nace.has(id) && nace.get(id).nace === grietaA.heridos[id]);
    report.grieta = { anfitrion: grietaA, invitado: grietaB.recreadas.length, bien: bien.length };
    check("Vuelta de la grieta: las copias heridas nacen en el invitado con la vida real ('ne'), no con la máxima",
      heridosIds.length > 0 && bien.length === heridosIds.length,
      `${grietaA.anunciados} anunciadas, ${grietaB.recreadas.length} recreadas en B; heridas ${heridosIds.length}, con su vida ${bien.length}` +
      (bien.length < heridosIds.length ? '; mal: ' + JSON.stringify(heridosIds.filter(id => !bien.includes(id)).slice(0, 5).map(id => ({ id, anfitrion: grietaA.heridos[id], invitado: nace.get(id) || null }))) : ''));
    check("Compatibilidad: un 'ne' sin la vida real crea la copia con la máxima, como antes", grietaB.sinDato === 50, grietaB.sinDato);

    // ---- Resultados de las trampas ----
    const hA = await trapSummary(A), hB = await trapSummary(B);
    report.vidaAnfitrion = { contadores: hA.contadores, subidas: hA.subidas.slice(0, 50), totalSubidas: hA.subidas.length };
    const upsA = hA.subidas.filter(s => s.fase !== 'control');
    const ctlA = hA.subidas.filter(s => s.fase === 'control');
    const escA = Object.values(hA.contadores).reduce((a, c) => a + c.escrituras, 0);
    check('Anfitrión: ninguna subida de vida de enemigos con el mod (trampa en el setter, toda la partida)', upsA.length === 0,
      `${escA} escrituras de vida vigiladas; subidas fuera del control: ${upsA.length}${upsA.length ? ' p. ej. ' + JSON.stringify(upsA.slice(0, 3)) : ''}`);
    check('Control del anfitrión: con curacionEnemiga=true la misma curandera SÍ cura (la prueba lo detecta)', ctlA.length > 0 && healerAlive,
      `${ctlA.length} subidas en 5 s; p. ej. ${JSON.stringify(ctlA[0] || null)}`);

    const VALEN = ['partida', 'invitado', 'B-mod', 'final', 'grieta'];       // fases en las que cuenta el criterio del invitado
    const ups = hB.subidas.filter(s => VALEN.includes(s.fase));
    const byClass = k => ups.filter(s => s.clase === k);
    const visibles = ups.filter(s => s.clase !== 'resincronizacion' && (s.dura === null || s.dura > VISIBLE_MS));
    const dentro = byClass('dentro-ventana');
    const cB = hB.contadores, cMod = cB['B-mod'] || {}, cOrig = cB['B-original'] || {};
    report.vidaInvitado = { criterio: `fallo = subida 'dentro-ventana' o subida de más de ${VISIBLE_MS} ms que no sea 'resincronizacion'`,
      ventanaRefMs: hB.ventanaRefMs, contadores: cB, totalSubidas: hB.subidas.length,
      porFase: Object.fromEntries([...new Set(hB.subidas.map(s => s.fase))].map(f => [f, hB.subidas.filter(s => s.fase === f).length])),
      visibles: visibles.slice(0, 20), resincronizaciones: byClass('resincronizacion').slice(0, 10),
      control: hB.subidas.filter(s => s.fase === 'B-original').slice(0, 20) };
    const maxDur = ups.filter(s => s.clase !== 'resincronizacion').reduce((m, s) => Math.max(m, s.dura || 0), 0);
    check(`Invitado: ninguna subida de vida de enemigos de más de ${VISIBLE_MS} ms fuera de la resincronización tras la ventana (latencia ${LAT} ms por sentido, golpes y escudos)`,
      visibles.length === 0 && dentro.length === 0,
      `${ups.length} subidas en las fases que cuentan: dentro de la ventana ${dentro.length}, sin golpe ${byClass('sin-golpe').length} (la más larga ${maxDur} ms), ` +
      `resincronización legítima ${byClass('resincronizacion').length}; visibles ${visibles.length}${visibles.length ? ' p. ej. ' + JSON.stringify(visibles.slice(0, 3)) : ''}`);
    check('Invitado: la prueba ejercita la predicción (golpes suyos en copias, con y sin escudo)',
      (cMod.golpes || 0) >= 50 && (cMod.predichas || 0) >= 15 && (cMod.golpesConEscudo || 0) >= 10,
      { golpes: cMod.golpes, predichas: cMod.predichas, golpesConEscudo: cMod.golpesConEscudo });
    check('Invitado: con escudo activo no predice el golpe', (cMod.golpesConEscudo || 0) > 0 && (cMod.predichasConEscudo || 0) === 0,
      { golpesConEscudo: cMod.golpesConEscudo, predichasConEscudo: cMod.predichasConEscudo });
    const ctlB = hB.subidas.filter(s => s.fase === 'B-original' && s.clase === 'dentro-ventana' && s.dura > VISIBLE_MS);
    check(`Control del invitado: sin el mod SÍ se ven rebotes de más de ${VISIBLE_MS} ms y predice con escudo (la prueba lo detecta)`,
      ctlB.length > 0 && (cOrig.predichasConEscudo || 0) > 0,
      `${ctlB.length} rebotes visibles en 6 s (p. ej. ${JSON.stringify(ctlB[0] || null)}); predichas con escudo ${cOrig.predichasConEscudo || 0}`);

    // Ningún golpe del invitado se pierde por el camino (tampoco con la latencia simulada).
    const env1 = await B.page.evaluate(() => window.__hEnv);
    await sleep(600);
    const rec = await A.page.evaluate(() => window.__hRec), env2 = await B.page.evaluate(() => window.__hEnv);
    check('Todos los golpes que manda el invitado le llegan al anfitrión', env1 > 0 && rec >= env1 && rec <= env2,
      { enviadosAntes: env1, recibidos: rec, enviadosDespues: env2 });

    // Relé: nada por la base de datos durante la partida.
    const rele1 = { A: (await transport(A, uidB)).rele, B: (await transport(B, uidA)).rele };
    check('Transporte: durante la partida no se manda nada por el relé de la Realtime Database', rele1.A === rele0.A && rele1.B === rele0.B,
      { A: rele1.A - rele0.A, B: rele1.B - rele0.B });

    const st = { A: await A.page.evaluate(() => G.Game.state), B: await B.page.evaluate(() => G.Game.state) };
    check('La partida sigue viva en los dos clientes al terminar', st.A !== 'ui' && st.B !== 'ui' && st.A !== 'over' && st.B !== 'over', st);
    report.capturasFinal = [await shot(A.page, 'A_final'), await shot(B.page, 'B_final')];
  } catch (e) {
    code = 1;
    report.error = String(e && e.stack || e);
    console.error('[ERROR]', e && e.message || e);
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
