/* ============ tools/nico/check.js — comprobación rápida del fork (sin navegador) ============
 *   node tools/nico/check.js            (desde la raíz del repo o desde tools/nico)
 *
 * Pasarlo SIEMPRE tras `git merge upstream/main` y antes de publicar. Comprueba:
 *   1. Higiene de fork: nada del Firebase/TURN/dominio/correo del original en lo que se
 *      sirve; que no han vuelto CNAME, robots.txt, sitemap.xml, en/, las páginas SEO, etc.;
 *      y Firebase: la config publicada es null o de un proyecto de la lista blanca
 *      (G.FIREBASE_PROYECTOS en js/core/firebase-config.js), igual que toda URL de
 *      Firebase en la nube que aparezca en lo servido.
 *   2. index.html y dev.html (también se publica): noindex, sin SEO del original, sin
 *      enlaces a páginas borradas, y que el ?v= de index.html coincide con js/app.min.js.
 *   3. Que el paquete js/app.min.js está al día con las fuentes (lo reconstruye en una
 *      carpeta temporal con los mismos parámetros que tools/build.js y compara).
 *   4. Que siguen los ganchos "// MOD nico" y js/core/mods.js se carga en dev.html.
 *   5. Curación: simula 2.000 runs con el código real (node:vm) y exige 0 curanderos,
 *      y que con curacionEnemiga=true sí salgan (control: la prueba sabe detectarlos).
 *   6. Tamaño: escala de los 966 Pokémon con el código real; normales intactos.
 *   7. Invitado del cooperativo: la ventana que evita el rebote de vida (js/core/mods.js).
 *   8. Busca en TODO js/ (menos js/app.min.js) asignaciones de vida que no estén en la
 *      lista de conocidas: una nueva es FALLO hasta revisarla (posible curación de upstream).
 * Sale con código 1 si algo falla.
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto'), os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const ex = f => fs.existsSync(path.join(ROOT, f));
let fails = 0, warns = 0;
const ok = m => console.log('  ok    ' + m);
const bad = m => { fails++; console.log('  FALLO ' + m); };
const warn = m => { warns++; console.log('  aviso ' + m); };

function walk(dir, out = []) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// ---------------- 1. higiene de fork ----------------
console.log('1. Higiene de fork');
const SERVED = ['index.html', 'dev.html', '404.html', 'sw.js', 'manifest.webmanifest', 'contacto/index.html',
  ...walk('js').filter(f => f.endsWith('.js')), ...walk('css')].filter(ex);
const FORBIDDEN = [
  [/pokesurvivor-jpter/i, 'proyecto Firebase del original'],
  [/turn\.pokesurvivor\.com/i, 'Worker TURN/contador del original'],
  [/AIzaSyD4YpfZ/, 'apiKey del original'],
  [/ko-fi\.com\/jpter78|kofi:\s*'jpter78'/i, 'Ko-fi del original'],
  [/jpieratorregrosa/i, 'correo del autor original (el contacto es el del fork)'],
  [/github\.com\/JPTER78\/pokesurvivor\/issues/i, 'avisos del original como contacto (el contacto es el del fork)']
];
// Firebase: lista blanca y config, con el código real de js/core/firebase-config.js.
function loadFirebaseConfig(host, search) {
  const ctx = { URLSearchParams, location: { hostname: host, search } };
  vm.createContext(ctx);
  ctx.G = {};
  vm.runInContext(rd('js/core/firebase-config.js'), ctx, { filename: 'js/core/firebase-config.js' });
  return ctx.G;
}
let FB = null, ALLOWED = [];
try { FB = loadFirebaseConfig('nicooliver123-cell.github.io', ''); ALLOWED = Array.isArray(FB.FIREBASE_PROYECTOS) ? [...FB.FIREBASE_PROYECTOS] : []; }
catch (e) { bad('no se pudo evaluar js/core/firebase-config.js: ' + e.message); }
// Toda URL de Firebase en la nube (Realtime Database, Auth/Hosting) debe ser de un proyecto de la lista.
const FB_HOST = /(?<![\w<>.-])([a-z0-9][a-z0-9-]*)((?:\.[a-z0-9-]+)*)\.(firebasedatabase\.app|firebaseio\.com|firebaseapp\.com|web\.app)\b/g;
let hits = 0;
for (const f of SERVED) {
  const s = rd(f);
  for (const [re, what] of FORBIDDEN) if (re.test(s)) { hits++; bad(`${f}: ${what} (${re})`); }
  for (const m of s.matchAll(FB_HOST)) {
    const id = m[1].replace(/-default-rtdb$/, '');
    if (!ALLOWED.includes(id)) { hits++; bad(`${f}: URL de Firebase de un proyecto fuera de la lista blanca: ${m[0]}`); }
  }
}
if (!hits) ok(`${SERVED.length} ficheros servidos sin referencias a la infraestructura ni al correo del original`);
const GONE = ['CNAME', 'robots.txt', 'sitemap.xml', 'en', 'guia', 'pokedex', 'legendarios', 'shinies', 'tipos', 'movimientos',
  'objetos', 'logros', 'novedades', 'apoyar', 'functions', 'tools/activar_dominio.sh', '.github/FUNDING.yml'];
const back = GONE.filter(ex);
if (back.length) bad(`han vuelto (seguramente por un merge de upstream): ${back.join(', ')}. Quitar con: git rm -r ${back.join(' ')}`);
else ok('sin CNAME, robots.txt, sitemap.xml, en/, páginas SEO, functions/ ni activar_dominio.sh');
if (/(href|src)="\//.test(rd('404.html'))) bad('404.html vuelve a tener rutas absolutas (no sirve en una subruta de GitHub Pages): ¿se ejecutó make_seo_pages.py?');
else ok('404.html sin rutas absolutas (vale en subruta)');
if (/"default"\s*:\s*"demo-ps"/.test(rd('.firebaserc'))) ok('.firebaserc apunta a demo-ps'); else bad('.firebaserc no apunta a demo-ps');
if (/"functions"/.test(rd('firebase.json'))) bad('firebase.json vuelve a tener el bloque functions'); else ok('firebase.json sin functions');
if (FB) {
  const okList = ALLOWED.length && ALLOWED.every(x => typeof x === 'string' && x && !/jpter/i.test(x)) && ALLOWED.includes('demo-ps');
  if (okList) ok(`lista blanca de Firebase: ${ALLOWED.join(', ')}`); else bad(`lista blanca de Firebase incorrecta: ${JSON.stringify(ALLOWED)}`);
  const P = FB.FIREBASE_PERMITIDA, cfg = FB.FIREBASE_CONFIG;
  if (typeof P !== 'function') bad('falta G.FIREBASE_PERMITIDA en firebase-config.js (db.js no conectaría con nada)');
  else {
    // Controles: lo que debe rechazar.
    const no = [
      { projectId: 'pokesurvivor-jpter', authDomain: 'pokesurvivor-jpter.firebaseapp.com' },
      { projectId: 'otro-proyecto' },
      { projectId: 'demo-ps', databaseURL: 'https://otro-default-rtdb.europe-west1.firebasedatabase.app' },
      { projectId: 'demo-ps', authDomain: 'otro.firebaseapp.com' }].filter(c => P(c));
    if (no.length) bad('G.FIREBASE_PERMITIDA acepta configs ajenas: ' + JSON.stringify(no)); else ok('G.FIREBASE_PERMITIDA rechaza el proyecto del original, proyectos fuera de la lista y URLs de otro proyecto');
    if (cfg === null) ok('config publicada en null (modo local) hasta tener el Firebase propio');
    else if (!cfg || !ALLOWED.includes(cfg.projectId) || !P(cfg) || cfg.emulator || /^demo-/.test(cfg.projectId))
      bad(`config publicada NO permitida: proyecto ${cfg && cfg.projectId} (lista blanca: ${ALLOWED.join(', ')}; sin emulator ni demo-)`);
    else ok(`config publicada del proyecto propio ${cfg.projectId} (en la lista blanca)`);
    const emu = loadFirebaseConfig('127.0.0.1', '?emu').FIREBASE_CONFIG;
    if (emu && emu.emulator && emu.projectId === 'demo-ps' && P(emu)) ok('?emu en 127.0.0.1 usa el emulador (demo-ps)'); else bad('?emu en local no da la config del emulador demo-ps');
    const emuFuera = loadFirebaseConfig('nicooliver123-cell.github.io', '?emu').FIREBASE_CONFIG;
    if (emuFuera && emuFuera.emulator) bad('?emu activa el emulador fuera de este PC'); else ok('?emu no hace nada fuera de localhost');
  }
}

// ---------------- 2-3. index.html y paquete ----------------
console.log('2. index.html y js/app.min.js');
const idx = rd('index.html');
if (/<meta name="robots" content="noindex">/.test(idx)) ok('index.html lleva noindex'); else bad('index.html sin noindex: construir con node tools/build.js --privado');
if (/pokesurvivor\.com/i.test(idx) || /rel="canonical"/.test(idx)) bad('index.html conserva SEO del original (canonical/og): construir con --privado');
else ok('index.html sin canonical ni enlaces al dominio del original');
// dev.html también se publica (GitHub Pages sirve todo el repo).
const devH = rd('dev.html');
const robots = [...devH.matchAll(/<meta name="robots" content="([^"]*)">/g)].map(m => m[1]);
if (robots.length && robots.every(c => /noindex/.test(c))) ok('dev.html lleva noindex y ningún robots "index"');
else bad(`dev.html: robots ${JSON.stringify(robots)} (debe haber noindex y ningún "index")`);
if (/pokesurvivor\.com/i.test(devH) || /rel="canonical"/.test(devH)) bad('dev.html conserva el SEO del original (canonical/og a pokesurvivor.com)');
else ok('dev.html sin canonical ni enlaces al dominio del original');
if (/window\.PS_PAGES = false;/.test(devH) && !/PS_PAGES\s*=\s*true/.test(devH)) ok('dev.html: window.PS_PAGES = false (sin botones a guía, Pokédex ni apoyar)');
else bad('dev.html: falta window.PS_PAGES = false o vuelve a ponerse a true');
const noidx = ['404.html', 'contacto/index.html'].filter(f => !/<meta name="robots" content="noindex">/.test(rd(f)));
if (noidx.length) bad('sin noindex: ' + noidx.join(', ')); else ok('404.html y contacto/ llevan noindex');
// Enlaces a páginas que el fork borró, en las páginas que se sirven.
const DEAD = /href="(\.\.\/|\.\/|\/)?(en|guia|pokedex|legendarios|shinies|tipos|movimientos|objetos|logros|novedades|apoyar)\//;
const deadIn = ['index.html', 'dev.html', '404.html', 'contacto/index.html'].filter(f => DEAD.test(rd(f)));
if (deadIn.length) bad('enlaces a páginas que el fork borró en: ' + deadIn.join(', '));
else ok('ninguna página enlaza a las que borró el fork (guia/, pokedex/, en/, apoyar/...)');
const min =fs.readFileSync(path.join(ROOT, 'js/app.min.js'));
const hash = crypto.createHash('sha1').update(min).digest('hex').slice(0, 10);
if (idx.includes(`js/app.min.js?v=${hash}`)) ok('index.html carga js/app.min.js?v=' + hash); else bad('index.html no apunta a la huella actual de js/app.min.js');
if (!process.argv.includes('--sin-paquete')) {
  // Igual que tools/build.js, pero a una carpeta temporal.
  const dev = rd('dev.html');
  const i = dev.indexOf('<!-- scripts:begin -->'), j = dev.indexOf('<!-- scripts:end -->');
  const files = [...dev.slice(i, j).matchAll(/<script[^>]*src="(js\/[^"]+\.js)"/g)].map(m => m[1]);
  const joined = files.map(f => `/* ${f} */\n` + rd(f)).join('\n;\n');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ps-check-'));
  const tmp = path.join(tmpDir, 'app.js'), out = path.join(tmpDir, 'app.min.js');
  fs.writeFileSync(tmp, joined);
  try {
    execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--yes', 'terser@5', tmp, '--compress', 'passes=1', '--mangle', '--comments', 'false', '--ecma', '2020', '-o', out],
      { stdio: ['ignore', 'ignore', 'inherit'], shell: process.platform === 'win32' });
    if (fs.readFileSync(out).equals(min)) ok('js/app.min.js está al día con las fuentes (' + files.length + ' scripts)');
    else bad('js/app.min.js NO coincide con las fuentes: ejecutar node tools/build.js --privado y commitear index.html + js/app.min.js');
  } catch (e) { warn('no se pudo reconstruir el paquete para comparar (' + e.message.split('\n')[0] + ')'); }
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
const minS = min.toString('utf8');
if (minS.includes('curacionEnemiga') && minS.includes('anchoMaxJugador')) ok('el paquete incluye js/core/mods.js'); else bad('el paquete no incluye js/core/mods.js');

// ---------------- 4. ganchos ----------------
console.log('3. Ganchos "// MOD nico"');
const HOOKS = [
  ['dev.html', /src="js\/core\/util\.js"><\/script>\r?\n<script defer src="js\/core\/mods\.js">/, 'mods.js se carga justo después de util.js'],
  ['js/data/enemies.js', /HEAL\.has\(p\.dex\) && G\.MODS && G\.MODS\.curacionEnemiga\) return 'healer';\s*\/\/ MOD nico/, 'gancho A (sin curanderos) en behaviorOf'],
  ['js/entities/enemy.js', /healAround\(\) \{\r?\n\s*if \(!\(G\.MODS && G\.MODS\.curacionEnemiga\)\) return;/, 'gancho B (red de seguridad) en healAround'],
  ['js/entities/player.js', /this\.scale = G\.MODS \? G\.MODS\.escalaJugador\(mon\.dex\) : 1;/, 'escala del jugador en el constructor'],
  ['js/entities/player.js', /new G\.Sprites\.Animator\(mon\.dex, this\.scale, this\.shiny\)/, 'sprite a escala'],
  ['js/entities/player.js', /this\.r = G\.Sprites\.bodyRadius\(mon\.dex, this\.scale\)/, 'hitbox a escala'],
  ['js/entities/player.js', /this\.bodyH = G\.Sprites\.bodyHeight\(mon\.dex, this\.scale\)/, 'alto (nombre/números) a escala'],
  ['js/entities/player.js', /drawShadow\(ctx, this\.dex, this\.x, this\.y, this\.scale\)/, 'sombra a escala'],
  ['js/net/net.js', /const TURN_URL = '';/, 'TURN apagado'],
  ['js/core/db.js', /\/jpter\/i\.test\(/, 'db.js rechaza el proyecto del original'],
  ['js/core/db.js', /if \(!\(G\.FIREBASE_PERMITIDA && G\.FIREBASE_PERMITIDA\(cfg\)\) \|\|/, 'db.js sólo conecta con la lista blanca (si falta, con nada)'],
  ['js/core/db.js', /\(cfg\.emulator && !\/\^\(localhost\|127/, 'db.js rechaza configs de emulador fuera de este PC'],
  ['js/ui/ui.js', /const CONTACT = 'https:\/\/github\.com\/nicooliver123-cell\/pokesurvivor\/issues';/, 'contacto del aviso legal: avisos del fork'],
  ['js/ui/settings-ui.js', /const REPO = 'https:\/\/github\.com\/nicooliver123-cell\/pokesurvivor';/, 'Ajustes > Acerca de: repo del fork'],
  ['js/entities/enemy.js', /if \(!G\.MODS \|\| G\.MODS\.predecirGolpe\(this\)\) this\.hp = /, 'invitado: sin predecir golpes con escudo'],
  ['js/net/coop.js', /e\.hp = G\.MODS \? G\.MODS\.vidaDelAnfitrion\(e, a\[3\]\) :/, 'invitado: ventana sin subidas tras un golpe predicho'],
  ['js/net/coop.js', /e\.behavior, Math\.ceil\(e\.hp\)\]\);/, "'ne' lleva la vida real (vuelta de la grieta)"],
  ['js/net/coop.js', /beh: ev\[9\], vida: ev\[10\] \}\);/, "el invitado lee la vida real de 'ne'"]
];
for (const [f, re, what] of HOOKS) (re.test(rd(f)) ? ok : bad)(`${what} (${f})`);

// ---------------- 5. simulación de curación ----------------
console.log('4. Curación de enemigos (simulación con el código real)');
function loadGame(curacion) {
  const ctx = { console, window: {} };
  vm.createContext(ctx);
  ctx.window = ctx; ctx.G = {};
  for (const f of ['js/core/util.js', 'js/core/mods.js', 'js/data/pokedex.js', 'js/data/sprites-meta.js', 'js/core/sprites.js', 'js/data/starters.js', 'js/data/enemies.js'])
    vm.runInContext(rd(f), ctx, { filename: f });
  ctx.G.MODS.curacionEnemiga = curacion;
  ctx.G.Events = ctx.G.Events || { bag: () => null };
  return ctx.G;
}
function healersIn(G, runs) {
  let defs = 0, boss = 0, horde = 0, badSupport = 0;
  for (let k = 0; k < runs; k++) {
    const r = G.Enemies.rollRun() || {};
    const cast = r.cast || G.Enemies.cast, bosses = r.bosses || G.Enemies.BOSSES;
    cast.forEach(tier => {
      if (!['healer', 'shielder', 'summoner'].includes(tier.list[0].behavior)) badSupport++;
      defs += tier.list.filter(d => d.behavior === 'healer').length;
    });
    boss += bosses.filter(b => b.behavior === 'healer').length;
  }
  for (const t of [0, 100, 200, 300, 450, 600]) for (const ty of G.Enemies.hordeTypes(t)) for (let r = 0; r < 10; r++)
    horde += G.Enemies.hordeDefs(ty, t).filter(d => d.behavior === 'healer').length;
  return { defs, boss, horde, badSupport };
}
try {
  const on = healersIn(loadGame(false), 2000);
  if (on.defs + on.boss + on.horde === 0) ok(`2.000 runs con el mod: 0 curanderos (elencos ${on.defs}, jefes ${on.boss}, hordas ${on.horde})`);
  else bad(`con el mod aparecen curanderos: elencos ${on.defs}, jefes ${on.boss}, hordas ${on.horde}`);
  if (on.badSupport === 0) ok('el hueco de apoyo de cada tramo sigue saliendo (escudo o invocador)'); else bad(`${on.badSupport} tramos sin apoyo`);
  const off = healersIn(loadGame(true), 300);
  if (off.defs > 0) ok(`control: con curacionEnemiga=true sí salen curanderos (${off.defs} en 300 runs)`);
  else bad('control: con curacionEnemiga=true no sale ningún curandero (la prueba no detectaría el fallo)');
} catch (e) { bad('no se pudo simular: ' + (e && e.stack || e)); }

// ---------------- 6. tamaño ----------------
console.log('5. Tamaño de los Pokémon del jugador');
try {
  const G = loadGame(false);
  const S = G.Sprites, max = G.MODS.anchoMaxJugador;
  const dexes = Object.keys(G.SPRITE_META).map(Number);
  let reduced = 0, maxR = 0, minS = 1, wrong = 0, bigName = '';
  for (const d of dexes) {
    const m = S.animMeta(d, 'Idle'), s = G.MODS.escalaJugador(d), w = m ? m.w : 32;
    if (w <= max && s !== 1) wrong++;
    if (w > max && !(s < 1)) wrong++;
    if (s < 1) reduced++;
    const r = S.bodyRadius(d, s);
    if (r > maxR) { maxR = r; }
    if (s < minS) { minS = s; bigName = (G.DEX_BY[d] || {}).name || d; }
  }
  if (!wrong) ok(`ancho máximo ${max}: ${reduced} de ${dexes.length} reducidos; hitbox máxima ${maxR.toFixed(1)}; escala mínima ${minS.toFixed(3)} (${bigName})`);
  else bad(`${wrong} Pokémon con una escala incoherente con el límite`);
  const st = (G.STARTERS || []).map(x => typeof x === 'object' ? x.dex : x).filter(Boolean);
  const touched = st.filter(d => G.MODS.escalaJugador(d) !== 1);
  if (st.length && !touched.length) ok(`los ${st.length} iniciales y Pikachu (escala ${G.MODS.escalaJugador(25)}) quedan intactos`);
  else if (touched.length) bad('se reducen iniciales: ' + touched.join(', '));
} catch (e) { bad('no se pudo calcular el tamaño: ' + (e && e.stack || e)); }

// ---------------- 7. invitado del cooperativo: lógica de la ventana de vida ----------------
console.log('6. Invitado del cooperativo: sin rebote de vida (lógica de js/core/mods.js)');
try {
  let now = 1000, rele = false;
  const ctx = { performance: { now: () => now } };
  vm.createContext(ctx);
  ctx.G = { Net: { hostUid: 'H', slow: () => rele } };
  vm.runInContext(rd('js/core/mods.js'), ctx, { filename: 'js/core/mods.js' });
  const M = ctx.G.MODS, W = M.ventanaVidaMs, WR = M.ventanaVidaReleMs;
  const e = { maxHp: 100, hp: 100, net: { st: 0 } };
  const r = [];
  // Golpe predicho de 10; el anfitrión aún manda 100 (todavía no le ha llegado): no sube.
  r.push(['predice el golpe sin escudo', M.predecirGolpe(e) === true]); e.hp = 90;
  now += 100; r.push(['dentro de la ventana no acepta una vida mayor', M.vidaDelAnfitrion(e, 100) === 90]);
  r.push(['dentro de la ventana sí acepta una menor', M.vidaDelAnfitrion(e, 85) === 85]);
  now += W; r.push(['pasada la ventana acepta la del anfitrión', M.vidaDelAnfitrion(e, 100) === 100]);
  rele = true; e.hp = 90; M.predecirGolpe(e); now += W + 1;
  r.push([`por el relé la ventana es mayor (${WR} ms)`, WR > W && M.vidaDelAnfitrion(e, 100) === 90]);
  now += WR; r.push(['por el relé, pasada su ventana, acepta', M.vidaDelAnfitrion(e, 100) === 100]);
  const s = { maxHp: 100, hp: 100, net: { st: 4 } };
  r.push(['con escudo (bit 4) no predice', M.predecirGolpe(s) === false && s.golpePredichoT === undefined]);
  r.push(['sin golpe predicho acepta la del anfitrión', M.vidaDelAnfitrion({ maxHp: 100, hp: 50 }, 60) === 60]);
  r.push(['nunca por encima de la vida máxima', M.vidaDelAnfitrion({ maxHp: 100, hp: 50 }, 130) === 100]);
  M.curacionEnemiga = true;
  const o = { maxHp: 100, hp: 90, golpePredichoT: now, net: { st: 4 } };
  r.push(['con curacionEnemiga=true, como el original', M.predecirGolpe(o) === true && M.vidaDelAnfitrion(o, 100) === 100]);
  const failed = r.filter(x => !x[1]);
  if (!failed.length) ok(`ventana ${W} ms directo / ${WR} ms por el relé: ${r.length} casos bien`);
  else failed.forEach(x => bad('ventana de vida: ' + x[0]));
} catch (e) { bad('no se pudo probar la ventana de vida: ' + (e && e.stack || e)); }

// ---------------- 8. asignaciones de vida en todo js/ ----------------
console.log('7. Asignaciones de vida en js/ (detección de curaciones nuevas de upstream)');
// Cada línea que asigna vida (=, +=, -=, *=, ++...), revisada a mano, con las veces que puede salir.
// Si upstream añade una nueva o repite una conocida en otro sitio, es FALLO hasta revisarla:
// si no puede subir la vida de un enemigo, se añade aquí con su motivo.
const KNOWN = [
  // enemigos
  ['js/entities/enemy.js|this.hp = this.maxHp;', 1, 'constructor (enemigo nuevo)'],
  ['js/entities/enemy.js|this.maxHp *= 2; this.hp = this.maxHp;', 1, 'makeShiny (sólo enemigos nuevos)'],
  ['js/entities/enemy.js|if (!G.MODS || G.MODS.predecirGolpe(this)) this.hp = Math.max(1, this.hp - d);', 1, 'golpe predicho en el invitado (baja)'],
  ['js/entities/enemy.js|this.hp -= Math.max(1, Math.round(amount));', 1, 'golpe en el anfitrión o en solitario (baja)'],
  ['js/entities/enemy.js|if (this.pt <= 0) { this.hp = 0; this.die(); }', 1, 'mecha del bomber: muere'],
  ['js/entities/enemy.js|e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.07);', 1, 'healAround: CURA, bloqueada por el gancho B'],
  ['js/entities/enemy.js|e.maxHp = o.hp; e.hp = o.vida > 0 && o.vida < o.hp ? o.vida : o.hp;', 1, "copia nueva en el invitado ('ne'), nunca por encima de la máxima"],
  ['js/net/coop.js|e.hp = G.MODS ? G.MODS.vidaDelAnfitrion(e, a[3]) : Math.min(e.maxHp, a[3]);', 1, 'sincronización del invitado (ventana en mods.js)'],
  ["js/data/enemies.js|if (behavior === 'bomber') { d.spd = Math.round(d.spd * 1.25); d.hp = Math.round(d.hp * 0.8); }", 1, 'definición, no instancia'],
  ["js/data/enemies.js|if (r) { r.behavior = 'runner'; r.spd = Math.round(r.spd * 1.6); r.hp = Math.round(r.hp * 0.7); }", 1, 'definición, no instancia'],
  ['js/systems/spawner.js|function scaled(sc, k) { return k === 1 ? sc : Object.assign({}, sc, { hp: sc.hp * k }); }', 1, 'escala de la definición, antes de crear'],
  ['js/systems/spawner.js|if (G.EnemyMgr.count >= CAP * ELITE_FROM) { e.maxHp = e.hp = Math.round(e.maxHp * 1.6); e.dmg *= 1.25; e.xp = Math.round(e.xp * 1.6); }', 1, 'élite, antes de add'],
  ['js/systems/weather.js|e.hp -= e.maxHp * 0.02 + 1;', 1, 'clima: daño a enemigos (baja)'],
  // jugador, compañero perdido y objetos del mapa (no son enemigos)
  ['js/entities/player.js|this.hp = this.maxHp;', 1, 'jugador: constructor'],
  ['js/entities/player.js|this.hp = Math.max(1, this.hp - Math.max(1, this.maxHp * 0.01));', 1, 'jugador: daño'],
  ['js/entities/player.js|this.hp -= d;', 1, 'jugador: daño'],
  ['js/entities/player.js|this.hp = 1; this.invuln = 1.2;', 1, 'jugador: aguante'],
  ['js/entities/player.js|this.hp = 0; this.dead = true;', 1, 'jugador: KO'],
  ['js/entities/player.js|this.hp = Math.min(this.maxHp, this.hp + amount);', 1, 'jugador: curación'],
  ['js/entities/player.js|addMaxHp(amount) { this.maxHp += amount; this.hp += amount; }', 1, 'jugador: más vida máxima'],
  ['js/entities/player.js|if (this.bellHeal > 0) { const h = Math.min(this.bellHeal, 4 * dt); this.hp = Math.min(this.maxHp, this.hp + h); this.bellHeal -= h; }', 1, 'jugador: Cascabel'],
  ['js/entities/player.js|if (this.regen > 0) this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);', 1, 'jugador: regeneración'],
  ['js/entities/player.js|this.hp = Math.max(1, this.maxHp * frac);', 1, 'jugador: reanimado'],
  ['js/entities/player.js|this.hp = n.hp; this.maxHp = n.maxHp;', 1, 'compañero remoto: su vida por red'],
  ['js/systems/interact.js|pl.hp = Math.min(pl.maxHp, pl.hp + pl.maxHp * 0.14 * dt);', 1, 'manantial: cura al JUGADOR'],
  ['js/systems/weather.js|pl.hp -= d;', 1, 'clima: daño al jugador'],
  ['js/systems/events.js|L.hp -= Math.min(30, hits.reduce((a, e) => a + 4 + e.dmg * 0.12, 0));', 1, 'Pokémon perdido que escoltas (baja)'],
  ['js/world/world.js|p.hp -= amount;', 1, 'rocas y cofres (baja)']
];
const HP_RE = /\.hp\s*(\+\+|--|[-+*\/]?=(?!=))|\bhp\s*(\+\+|--)|\[\s*['"]hp['"]\s*\]\s*[-+*\/]?=(?!=)|Object\.assign\([^)]*\bhp\s*:/;
const SCAN = walk('js').filter(f => f.endsWith('.js') && f !== 'js/app.min.js');
const found = new Map();
for (const f of SCAN) rd(f).split(/\r?\n/).forEach((line, n) => {
  if (!HP_RE.test(line)) return;
  const key = f + '|' + line.trim().replace(/\s*\/\/.*$/, '');
  if (!found.has(key)) found.set(key, []);
  found.get(key).push(n + 1);
});
const expected = new Map(KNOWN.map(([k, c]) => [k, c]));
let unknown = 0;
for (const [key, lines] of found) {
  const f = key.slice(0, key.indexOf('|')), code = key.slice(key.indexOf('|') + 1);
  if (!expected.has(key)) { unknown++; bad(`${f}:${lines.join(',')} asignación de vida no revisada: ${code}`); }
  else if (lines.length > expected.get(key)) { unknown++; bad(`${f}:${lines.join(',')} asignación conocida repetida (${lines.length} veces, esperadas ${expected.get(key)}): ${code}`); }
}
const stale = KNOWN.filter(([k]) => !found.has(k));
if (stale.length) warn(`${stale.length} línea(s) de la lista ya no están (actualizar KNOWN): ${stale.map(([k]) => k).join(' · ')}`);
if (!unknown) ok(`${SCAN.length} ficheros de js/: sólo las ${KNOWN.length} asignaciones de vida revisadas`);
else console.log('        Revisa si alguna puede subir la vida de un enemigo; si no, añádela a KNOWN en tools/nico/check.js con su motivo.');

console.log(fails ? `\nRESULTADO: ${fails} fallo(s), ${warns} aviso(s)` : `\nRESULTADO: todo bien (${warns} aviso(s))`);
process.exit(fails ? 1 : 0);
