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
 *      Y que el paquete js/app.min.js está al día con las fuentes (lo reconstruye en una
 *      carpeta temporal con los mismos parámetros que tools/build.js y compara).
 *   3. Que siguen los ganchos "// MOD nico" y js/core/mods.js se carga en dev.html.
 *   4. Curación: simula 2.000 runs con el código real (node:vm) y exige 0 curanderos,
 *      y que con curacionEnemiga=true sí salgan (control: la prueba sabe detectarlos).
 *   5. Tamaño: escala de los 966 Pokémon con el código real; normales intactos.
 *   6. Invitado del cooperativo: la ventana que evita el rebote de vida (js/core/mods.js).
 *   7. Busca en TODO js/ (menos js/app.min.js) asignaciones de vida que no estén en la
 *      lista de conocidas: una nueva es FALLO hasta revisarla (posible curación de upstream).
 *   8. Traer la partida del juego oficial: el exportador (sin red, una línea, igual que
 *      tools/nico/exportar-oficial.js, no modifica nada, respaldo a localStorage, se niega
 *      en la consola de esta versión) y el importador de js/core/importar.js (saneado,
 *      fusión, monedas sin duplicar, rechazo de la partida de esta versión, pity, compañero
 *      y perfil sólo la primera vez, aplicar() en modo local e invitado con el db.js real,
 *      y la vista previa de js/ui/importar-ui.js con datos hostiles).
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
  const ctx = { URL, URLSearchParams, location: { hostname: host, search } };
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
      { projectId: 'demo-ps', authDomain: 'otro.firebaseapp.com' },
      { projectId: 'demo-ps', authDomain: 'pokesurvivor.com', databaseURL: 'https://demo-ps-default-rtdb.europe-west1.firebasedatabase.app' },
      { projectId: 'demo-ps', authDomain: 'demo-ps.firebaseapp.com' },
      { projectId: 'demo-ps', authDomain: 'demo-ps.firebaseapp.com', databaseURL: 'https://otro.example.com/?ns=demo-ps-default-rtdb' },
      { projectId: 'demo-ps', authDomain: 'demo-ps.firebaseapp.com', databaseURL: 'http://demo-ps-default-rtdb.europe-west1.firebasedatabase.app' }].filter(c => P(c));
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

// ---------------- 2. index.html y paquete ----------------
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
const domIn = ['index.html', 'dev.html', '404.html', 'contacto/index.html'].filter(f => /pokesurvivor\.com/i.test(rd(f)));
if (domIn.length) bad('el dominio del original aparece en páginas publicadas: ' + domIn.join(', '));
else ok('ninguna página HTML publicada menciona el dominio del original');
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
    execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--yes', 'terser@5.51.2', tmp, '--compress', 'passes=1', '--mangle', '--comments', 'false', '--ecma', '2020', '-o', out],
      { stdio: ['ignore', 'ignore', 'inherit'], shell: process.platform === 'win32' });
    if (fs.readFileSync(out).equals(min)) ok('js/app.min.js está al día con las fuentes (' + files.length + ' scripts)');
    else bad('js/app.min.js NO coincide con las fuentes: ejecutar node tools/build.js --privado y commitear index.html + js/app.min.js');
  } catch (e) { warn('no se pudo reconstruir el paquete para comparar (' + e.message.split('\n')[0] + ')'); }
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
const minS = min.toString('utf8');
if (minS.includes('curacionEnemiga') && minS.includes('anchoMaxJugador')) ok('el paquete incluye js/core/mods.js'); else bad('el paquete no incluye js/core/mods.js');
if (minS.includes('pokesurvivor-partida') && minS.includes('imp-box')) ok('el paquete incluye el importador (js/core/importar.js y js/ui/importar-ui.js)');
else bad('el paquete no incluye js/core/importar.js o js/ui/importar-ui.js');

// ---------------- 3. ganchos ----------------
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
  ['js/net/coop.js', /beh: ev\[9\], vida: ev\[10\] \}\);/, "el invitado lee la vida real de 'ne'"],
  ['dev.html', /src="js\/core\/db\.js"><\/script>\r?\n<script defer src="js\/core\/importar\.js">/, 'importar.js se carga justo después de db.js'],
  ['dev.html', /src="js\/ui\/settings-ui\.js"><\/script>\r?\n<script defer src="js\/ui\/importar-ui\.js">/, 'importar-ui.js se carga justo después de settings-ui.js'],
  ['js/core/db.js', /newSave, migrate, applyInPlace,\s*\/\/ MOD nico/, 'db.js expone newSave, migrate y applyInPlace al importador'],
  ['js/ui/settings-ui.js', /Crear cuenta o entrar<\/button>`\r?\n\s*\+ \(G\.ImportarUI \? G\.ImportarUI\.html\(\) : ''\);/, 'Ajustes > Cuenta (invitado) pinta la sección de importar'],
  ['js/ui/settings-ui.js', /id="set-msg"><\/p>`\r?\n\s*\+ \(G\.ImportarUI \? G\.ImportarUI\.html\(\) : ''\);/, 'Ajustes > Cuenta (con cuenta) pinta la sección de importar'],
  ['js/ui/settings-ui.js', /if \(G\.ImportarUI\) G\.ImportarUI\.wire\(box\);/, 'Ajustes conecta los botones de importar']
];
for (const [f, re, what] of HOOKS) (re.test(rd(f)) ? ok : bad)(`${what} (${f})`);

// ---------------- 4. simulación de curación ----------------
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

// ---------------- 5. tamaño ----------------
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

// ---------------- 6. invitado del cooperativo: lógica de la ventana de vida ----------------
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

// ---------------- 7. asignaciones de vida en todo js/ ----------------
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

// ---------------- 8. traer la partida del juego oficial ----------------
// El juego real (db.js, Pokédex, logros, mejoras...) en node:vm; nunca se habla con el juego oficial:
// la partida "oficial" de estas pruebas es sintética, con el formato de newSave().
const IMPORT_FILES = ['js/core/util.js', 'js/data/pokedex.js', 'js/data/sprites-meta.js', 'js/data/moves.js', 'js/data/types.js',
  'js/data/upgrades.js', 'js/data/items.js', 'js/data/achievements.js', 'js/systems/gacha.js', 'js/core/db.js', 'js/core/importar.js'];
function loadImporter(extra = {}) {
  const ctx = Object.assign({ console }, extra);
  vm.createContext(ctx);
  ctx.window = ctx;
  for (const f of IMPORT_FILES) vm.runInContext(rd(f), ctx, { filename: f });
  return ctx;
}
/** Ejecuta el fragmento exportador como en la consola del juego oficial, con un navegador simulado. */
function runExporter(frag, { G: g, storage = {}, host = 'juego-oficial.test' } = {}) {
  const out = { alerts: [], downloads: [], logs: [], escrituras: 0 };
  const blobs = [], keys = Object.keys(storage);
  const ctx = {
    alert: m => out.alerts.push(String(m)),
    console: { log: m => out.logs.push(String(m)) },
    location: { host },
    Blob: class { constructor(parts, opts) { this.parts = parts; this.type = opts && opts.type; } },
    URL: { createObjectURL: b => { blobs.push(b); return 'blob:' + blobs.length; }, revokeObjectURL: () => {} },
    setTimeout: fn => fn(),
    document: {
      createElement: tag => { const a = { tag, href: '', download: '', click() { out.downloads.push({ nombre: a.download, blob: blobs[blobs.length - 1] }); }, remove() {} }; return a; },
      body: { appendChild() {} }
    },
    localStorage: { get length() { return keys.length; }, key: i => keys[i], getItem: k => (k in storage ? storage[k] : null),
      setItem() { out.escrituras++; }, removeItem() { out.escrituras++; }, clear() { out.escrituras++; } }
  };
  if (g !== undefined) ctx.G = g;
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(frag, ctx, { filename: 'exportador' });
  return out;
}

async function importChecks() {
  console.log('8. Traer la partida del juego oficial (exportador y js/core/importar.js)');
  const r = [];   // [descripción, ok, detalle]
  const t = (name, cond, detail) => r.push([name, !!cond, detail]);
  const C = loadImporter(), GG = C.G, I = GG.Importar, DB = GG.DB;
  const J = v => JSON.stringify(v);

  // ---- el exportador ----
  const frag = I.EXPORTADOR;
  const fileLines = rd('tools/nico/exportar-oficial.js').split(/\r?\n/).filter(l => l.trim() && !l.startsWith('//'));
  t('tools/nico/exportar-oficial.js es la misma línea que G.Importar.EXPORTADOR (la que se copia en Ajustes)', fileLines.length === 1 && fileLines[0] === frag);
  t('el exportador es una sola línea de JavaScript válido', !/[\r\n]/.test(frag) && (() => { try { new vm.Script(frag); return true; } catch (e) { return false; } })());
  const NET = [/\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|RTCPeerConnection|postMessage|importScripts|navigator|eval|Function)\b/,
    /\bimport\s*\(/, /:\/\//, /\bhttps?\b/i, /\bwss?\b/i, /www\./i, /\.(com|net|org|io|app|dev|es|co)\b/i, /\.src\b/, /new\s+Image\b/, /\bopen\s*\(/];
  const netHit = NET.filter(re => re.test(frag));
  t('el exportador no usa fetch, XMLHttpRequest, sendBeacon, WebSocket ni otra vía de red, ni lleva URLs', !netHit.length, netHit.map(String));
  const WRITE = [/setItem|removeItem|\.clear\s*\(/, /\b(commit|flush|logout|deleteAccount|register|login|applyInPlace|grant)\b/, /\.save\s*=[^=]/];
  const wHit = WRITE.filter(re => re.test(frag));
  t('el exportador no escribe en localStorage ni llama a nada que guarde o cambie la partida', !wHit.length, wHit.map(String));

  // Partida "oficial" realista (sintética): 1 de cada 3 Pokémon, shinies, mejoras, logros...
  const T0 = Date.UTC(2026, 3, 1, 10), AHORA = Date.UTC(2026, 9, 12, 12);
  const dexes = Object.keys(GG.DEX_BY).map(Number);
  const of = DB.newSave('AshOficial');
  of.created = T0; of.updated = T0 + 5e9; of.coins = 48210;
  dexes.filter((d, i) => i % 3 === 0).forEach((d, i) => { of.owned[d] = { at: T0 + i * 1000, from: i % 5 ? 'gacha' : 'wild' }; });
  const lista = Object.keys(of.owned).map(Number);
  lista.slice(0, 12).forEach(d => { of.shiny[d] = { at: T0 + 99, from: 'wild' }; });
  const P = lista[3];
  of.partner = P; of.partnerShiny = true; of.starter = 4;
  of.personality = { trait: 'brave', scores: { brave: 3 } };
  of.pupg = { [P]: { hp: 6, atk: 4 }, 1: { hp: 2 } };
  of.tickets = { t1: 23, t10: 4 }; of.pity = { 1: 41, 4: 12 };
  of.legends = { 150: T0 + 1, 151: T0 + 2, 249: T0 + 3 }; of.arenas = { fire: T0, water: T0 };
  of.itemsFound = { leftovers: T0, quickclaw: T0 }; of.evoMoves = { tackle: T0, ember: T0 };
  of.ach = { own1: T0, own10: T0, own50: T0, own100: T0, own250: T0, shiny1: T0, shiny5: T0, boss1: T0 };
  of.missions = { day: '2026-10-12', daily: [{ id: 'x', prog: 3 }] };
  of.profile = { favs: [{ dex: P, shiny: true }, { dex: lista[5], shiny: false }], title: 'Coleccionista' };
  Object.assign(of.stats, { runs: 210, bestTime: 1342.5, bestLevel: 41, totalKills: 152000, pulls: 380, coinsEarned: 260000,
    shinies: 12, bossesTotal: 77, riftWins: 19, evolutions: 30, missionsDone: 120 });
  of.pupgDone = true;
  const ofJSON = J(of);

  // Exportador con la partida viva (G.DB.save es un getter, como en el juego).
  const dbVivo = { guest: false }; Object.defineProperty(dbVivo, 'save', { get: () => of, enumerable: true });
  const e1 = runExporter(frag, { G: { DB: dbVivo } });
  const d1 = e1.downloads[0], env1 = d1 && JSON.parse(d1.blob.parts.join(''));
  t('exportador: descarga pokesurvivor-partida-<nombre>-<fecha>.json con el envoltorio y una copia exacta de G.DB.save',
    e1.downloads.length === 1 && /^pokesurvivor-partida-AshOficial-\d{4}-\d{2}-\d{2}\.json$/.test(d1.nombre) && d1.blob.type === 'application/json' &&
    env1.tipo === 'pokesurvivor-partida' && env1.version === 1 && env1.origen === 'juego-oficial.test' && typeof env1.exportado === 'number' &&
    J(env1.save) === ofJSON && !e1.alerts.length, d1 && d1.nombre);
  t('exportador: no modifica la partida ni localStorage', J(of) === ofJSON && e1.escrituras === 0);
  const e2 = runExporter(frag, { G: { DB: { guest: true, save: DB.newSave('Invitado') } } });
  t('exportador: como invitado avisa en español y no descarga nada', e2.downloads.length === 0 && e2.alerts.length === 1 && /invitado/i.test(e2.alerts[0]));
  const sinSesion = { guest: false }; Object.defineProperty(sinSesion, 'save', { get: () => null });
  const e3 = runExporter(frag, { G: { DB: sinSesion }, storage: { 'ps.cloud.x': ofJSON } });
  t('exportador: sin sesión iniciada avisa y no descarga (no tira de copias viejas)', e3.downloads.length === 0 && e3.alerts.length === 1 && /inicia sesi/i.test(e3.alerts[0]));
  const viejo = Object.assign(DB.newSave('Viejo'), { updated: 100 }), nuevo = Object.assign(JSON.parse(ofJSON), { updated: 200 });
  const almacen = { 'ps.cloud.uidViejo': J(viejo), 'ps.save.ash': J(nuevo), 'ps.lang': 'es', 'ps.cloud.roto': '{no es json', 'otra.cosa': J(Object.assign(DB.newSave('Otro'), { updated: 999 })) };
  const e4 = runExporter(frag, { storage: almacen });
  const e5 = runExporter(frag, { G: { Otra: 1 }, storage: almacen });
  const env4 = e4.downloads[0] && JSON.parse(e4.downloads[0].blob.parts.join(''));
  t('exportador: si el juego cambia y no hay G.DB.save, usa la copia ps.cloud.* / ps.save.* más reciente (ignora otras claves y copias rotas)',
    e4.downloads.length === 1 && env4.save.name === 'AshOficial' && env4.save.updated === 200 && e5.downloads.length === 1 && !e4.alerts.length);
  const e6 = runExporter(frag, { storage: { 'ps.lang': 'es' } });
  t('exportador: sin partida en ningún sitio avisa y no descarga', e6.downloads.length === 0 && e6.alerts.length === 1);
  // Pegado en la consola de ESTA versión (con su G real, que tiene G.Importar y una partida abierta): avisa y no descarga.
  const vivoFork = { guest: false }; Object.defineProperty(vivoFork, 'save', { get: () => of, enumerable: true });
  const e7 = runExporter(frag, { G: Object.assign(Object.create(GG), { DB: vivoFork }), storage: { 'ps.save.nicofork': ofJSON } });
  t('exportador: pegado en la consola de esta versión avisa de que no es el juego oficial y no descarga nada',
    e7.downloads.length === 0 && e7.alerts.length === 1 && /versión modificada, no el juego oficial/.test(e7.alerts[0]) && e7.escrituras === 0, e7.alerts);

  // ---- el importador: partida oficial realista contra una cuenta nueva del fork ----
  const texto = d1 ? d1.blob.parts.join('') : J({ tipo: I.TIPO, version: 1, save: of });
  const a = I.analizar(texto, AHORA);
  t('analizar: acepta lo que descarga el exportador', a.ok && a.resumen.pokemon === lista.length && a.resumen.shinies === 12 && a.resumen.monedas === 48210 &&
    a.resumen.descartados === 0 && a.resumen.ajustados === 0 && a.avisos.length === 0, a.ok ? a.resumen : a.error);
  const fk = DB.migrate(DB.newSave('NicoFork'));
  fk.created = Date.UTC(2026, 9, 10); fk.updated = fk.created + 1000;
  fk.owned = { 7: { at: fk.created, from: 'starter' }, 1: { at: fk.created + 5, from: 'gacha' } };
  fk.starter = 7; fk.partner = 7; fk.personality = { trait: 'calm', scores: { calm: 4 } };
  fk.coins = 650; fk.tickets = { t1: 2, t10: 0 }; fk.pupg = { 1: { hp: 5 } }; fk.pity = { 1: 10, 2: 5 }; fk.ach = { own1: fk.created };
  fk.stats.bestLevel = 50; fk.stats.runs = 3;
  fk.missions = { day: '2026-10-12', daily: [{ id: 'kill', prog: 10 }] };
  const fkJSON = J(fk), aJSON = a.ok ? J(a.save) : '';
  const n1 = a.ok ? I.fusionar(fk, a.save, AHORA) : null;
  if (n1) {
    const union = new Set([...Object.keys(of.owned), ...Object.keys(fk.owned)]);
    t('fusionar: no modifica la partida del fork ni la oficial', J(fk) === fkJSON && J(a.save) === aJSON);
    t('fusionar: colección y shinies = unión (con la fecha más antigua)', Object.keys(n1.owned).length === union.size && n1.owned[7] && n1.owned[1].at === of.owned[1].at &&
      Object.keys(n1.shiny).length === 12, { owned: Object.keys(n1.owned).length, esperado: union.size });
    t('fusionar: monedas y tickets se suman', n1.coins === 650 + 48210 && n1.tickets.t1 === 25 && n1.tickets.t10 === 4, { coins: n1.coins, tickets: n1.tickets });
    t('fusionar: queda apuntado lo acreditado por esa partida oficial (su created)',
      J(n1[I.REGISTRO]) === J({ [T0]: { coins: 48210, t1: 23, t10: 4, at: AHORA } }), n1[I.REGISTRO]);
    t('fusionar: mejoras por Pokémon, estadísticas y pity = el máximo', n1.pupg[1].hp === 5 && n1.pupg[P].hp === 6 && n1.pupg[P].atk === 4 &&
      n1.stats.runs === 210 && n1.stats.bestLevel === 50 && n1.stats.bestTime === 1342.5 && J(n1.pity) === J({ 1: 41, 2: 5, 4: 12 }), { pity: n1.pity });
    t('fusionar: legendarios, arenas, objetos, movimientos y logros = unión', Object.keys(n1.legends).length === 3 && Object.keys(n1.arenas).length === 2 &&
      Object.keys(n1.itemsFound).length === 2 && Object.keys(n1.evoMoves).length === 2 && Object.keys(n1.ach).length === 8 && n1.ach.own1 === fk.created);
    t('fusionar: compañero = el oficial (y shiny, porque tiene el shiny)', n1.partner === P && n1.partnerShiny === true);
    t('fusionar: perfil vacío en el fork -> favoritos y título del oficial', J(n1.profile) === J({ favs: [{ dex: P, shiny: true }, { dex: lista[5], shiny: false }], title: 'Coleccionista' }), n1.profile);
    t('fusionar: nombre, misiones, personalidad, inicial y creación = los del fork; updated = ahora', n1.name === 'NicoFork' && J(n1.missions) === J(fk.missions) &&
      J(n1.personality) === J(fk.personality) && n1.starter === 7 && n1.created === fk.created && n1.updated === AHORA);
    const c1 = I.comparar(fk, n1, a.save);
    t('comparar: la vista previa cuenta lo nuevo', c1.pokemon === union.size - 2 && c1.monedas === 48210 && c1.t1 === 23 && c1.logros === 7 && c1.companero && !c1.yaImportada && c1.algo, c1);
    // Perfil ya puesto en el fork: se respeta.
    const fk2 = Object.assign(JSON.parse(fkJSON), { profile: { favs: [{ dex: 7, shiny: false }], title: 'Valiente' } });
    const nP = I.fusionar(fk2, a.save, AHORA);
    t('fusionar: si el fork ya tiene favoritos y título, se quedan', J(nP.profile) === J(fk2.profile));

    // Reimportar la misma: no duplica.
    const n2 = I.fusionar(n1, a.save, AHORA + 1), c2 = I.comparar(n1, n2, a.save);
    t('reimportar la misma partida no duplica monedas, tickets ni nada', n2.coins === n1.coins && J(n2.tickets) === J(n1.tickets) &&
      Object.keys(n2.owned).length === Object.keys(n1.owned).length && c2.yaImportada && !c2.algo, c2);
    // Reimportar con más monedas: sólo la diferencia. Con menos (gastadas): nada, y luego sólo lo que pase del máximo acreditado.
    const conMas = v => { const o = JSON.parse(ofJSON); o.coins = v.coins; o.tickets = v.tickets; return I.analizar(J({ tipo: I.TIPO, version: 1, save: o }), AHORA).save; };
    const n3 = I.fusionar(n2, conMas({ coins: 50000, tickets: { t1: 30, t10: 4 } }), AHORA + 2);
    t('reimportar con más monedas acredita sólo la diferencia', n3.coins === n2.coins + 1790 && n3.tickets.t1 === n2.tickets.t1 + 7 && n3.tickets.t10 === n2.tickets.t10 &&
      n3[I.REGISTRO][T0].coins === 50000, { antes: n2.coins, despues: n3.coins });
    const n4 = I.fusionar(n3, conMas({ coins: 1000, tickets: { t1: 0, t10: 0 } }), AHORA + 3);
    const n5 = I.fusionar(n4, conMas({ coins: 50500, tickets: { t1: 30, t10: 5 } }), AHORA + 4);
    t('reimportar tras gastar en el oficial no resta ni duplica; luego sólo suma lo que pase de lo ya acreditado',
      n4.coins === n3.coins && n4[I.REGISTRO][T0].coins === 50000 && n5.coins === n3.coins + 500 && n5.tickets.t10 === n3.tickets.t10 + 1);

    // Primera importación: todo lo que cuenta para Confirmar tiene su fila (pity, favoritos y título incluidos).
    t('primera importación: la vista previa cuenta los banners con más pity, los favoritos y el título',
      c1.pity === 2 && J(c1.favs) === J(n1.profile.favs) && c1.titulo === 'Coleccionista' && c1.perfil, { pity: c1.pity, favs: c1.favs, titulo: c1.titulo });
    // Después de traerla, el jugador saca un ★5 aquí (pity 0), elige otro compañero y vacía el perfil. Reimportar
    // el mismo archivo no le devuelve el pity ni le cambia nada de eso, y Confirmar queda sin nada que hacer.
    const aqui = JSON.parse(J(n2));
    aqui.pity[1] = 0; aqui.partner = 7; aqui.partnerShiny = false; aqui.profile = { favs: [], title: '' };
    const aquiJSON = J(aqui);
    const n6 = I.fusionar(aqui, a.save, AHORA + 5), c6 = I.comparar(aqui, n6, a.save);
    const ciclosPity = [n6.pity[1]];
    let vuelta = n6;
    for (let i = 0; i < 2; i++) { vuelta = I.fusionar(vuelta, a.save, AHORA + 6 + i); ciclosPity.push(vuelta.pity[1]); }
    t('reimportar no devuelve el pity gastado aquí (3 vueltas) ni cambia el compañero o el perfil elegidos aquí; nada que confirmar',
      ciclosPity.every(p => p === 0) && n6.partner === 7 && n6.partnerShiny === false && J(n6.profile) === J(aqui.profile) &&
      n6.coins === aqui.coins && J(n6.tickets) === J(aqui.tickets) && c6.yaImportada && !c6.algo && !c6.pity && !c6.companero && !c6.perfil && J(aqui) === aquiJSON,
      { pity: ciclosPity, partner: n6.partner, profile: n6.profile, c6 });
    // Reimportar con más monedas en el oficial: sólo se suman monedas; pity, compañero y perfil se quedan.
    const n7 = I.fusionar(aqui, conMas({ coins: 48210 + 2000, tickets: { t1: 25, t10: 4 } }), AHORA + 9), c7 = I.comparar(aqui, n7, a.save);
    t('reimportar con más monedas: sólo suma monedas y tickets nuevos; pity, compañero y perfil se quedan como aquí',
      n7.coins === aqui.coins + 2000 && n7.tickets.t1 === aqui.tickets.t1 + 2 && n7.tickets.t10 === aqui.tickets.t10 && n7.pity[1] === 0 &&
      n7.partner === 7 && J(n7.profile) === J(aqui.profile) && c7.monedas === 2000 && c7.t1 === 2 && c7.algo && !c7.pity && !c7.companero && !c7.perfil,
      { coins: [aqui.coins, n7.coins], c7 });
    // Si aquí no hay un compañero válido (ninguno), se pone el oficial aunque no sea la primera vez.
    const sinCompa = Object.assign(JSON.parse(aquiJSON), { partner: null });
    const n8 = I.fusionar(sinCompa, a.save, AHORA + 10), c8 = I.comparar(sinCompa, n8, a.save);
    t('reimportar sin compañero válido aquí: pone el oficial y lo enseña en la vista previa', n8.partner === P && n8.partnerShiny === true && c8.companero && c8.algo);
  } else t('analizar la partida realista', false, a.error);

  // ---- una partida de ESTA versión no se trae (autoimportación) ----
  // Sus monedas ya incluyen lo acreditado; si se aceptara, cada vuelta lo volvería a sumar.
  const propia = (x, origen = 'otra-web.test') => I.analizar(J({ tipo: I.TIPO, version: 1, origen, exportado: AHORA, save: x }), AHORA);
  const vueltasPropia = [];
  let miPartida = JSON.parse(fkJSON);   // una partida del fork que nunca ha traído nada (sin registro)
  for (let i = 0; i < 3; i++) {
    const x = propia(miPartida), pv = x.ok ? I.previsualizar(miPartida, x.save, AHORA + i) : {};
    let lanza = false;
    try { if (x.ok) miPartida = I.fusionar(miPartida, x.save, AHORA + i); } catch (e) { lanza = e.message === I.TEXTOS.propia; }
    vueltasPropia.push({ analiza: x.ok, error: pv.error, lanza, coins: miPartida.coins });
  }
  t('autoimportación: la partida de esta misma cuenta (mismo created) se rechaza en la vista previa y en fusionar; 3 vueltas sin sumar nada',
    vueltasPropia.every(v => v.analiza && v.error === I.TEXTOS.propia && v.lanza && v.coins === fk.coins), vueltasPropia);
  const conReg = propia(Object.assign(JSON.parse(ofJSON), { importOficial: { 1: { coins: 1e6 } } }));
  t('una partida con el registro importOficial (sólo lo escribe esta versión) se rechaza al elegirla', !conReg.ok && conReg.error === I.TEXTOS.propia, conReg.error);
  C.location = { host: 'fork.test' };
  const mismaWeb = propia(of, 'fork.test'), otraWeb = propia(of, 'juego-oficial.test');
  delete C.location;
  t('un archivo exportado desde esta misma web se rechaza; desde otra, no', !mismaWeb.ok && mismaWeb.error === I.TEXTOS.propia && otraWeb.ok);
  // Dos cuentas de esta versión: A (sin traer nada) -> B suma lo de A una sola vez; B ya lleva el registro y no vuelve a A.
  const cuentaA = JSON.parse(fkJSON), cuentaB = Object.assign(JSON.parse(fkJSON), { created: fk.created + 777, name: 'Amigo', coins: 500 });
  let B = cuentaB;
  for (let i = 0; i < 3; i++) B = I.fusionar(B, propia(cuentaA).save, AHORA + i);
  const deB = propia(B);
  t('dos cuentas de esta versión: de A a B se suma una sola vez (3 vueltas) y de B a A se rechaza (lleva el registro)',
    B.coins === 500 + fk.coins && !deB.ok && deB.error === I.TEXTOS.propia, { B: B.coins, deB: deB.error });

  // ---- errores y saneado ----
  const env = save => J({ tipo: I.TIPO, version: 1, origen: 'pruebas', exportado: T0, save });
  const err = (txt, e) => { const x = I.analizar(txt, AHORA); return !x.ok && x.error === e; };
  t('JSON roto, vacío o demasiado grande: error claro', err('{"tipo": "pokesurvivor-partida", "save": {', I.TEXTOS.json) && err('', I.TEXTOS.vacio) &&
    err('   ', I.TEXTOS.vacio) && err(' '.repeat(I.MAX_BYTES) + '{}', I.TEXTOS.grande));
  t('envoltorio de otro tipo, versión futura o algo que no es una partida: error',
    err(J({ tipo: 'otra-cosa', version: 1, save: of }), I.TEXTOS.tipo) && err(J({ tipo: I.TIPO, version: 2, save: of }), I.TEXTOS.version) &&
    err(J({ tipo: I.TIPO, version: 1, save: 'hola' }), I.TEXTOS.tipo) && err('[1,2,3]', I.TEXTOS.tipo) && err('42', I.TEXTOS.tipo) &&
    err(J({ hola: 1 }), I.TEXTOS.tipo) && err(env(Object.assign(JSON.parse(ofJSON), { created: -5 })), I.TEXTOS.creada));
  const suelta = I.analizar(ofJSON, AHORA), doc = I.analizar(J({ save: of, v: 3 }), AHORA);
  t('acepta también una partida suelta y el documento saves/{uid} de Firestore', suelta.ok && doc.ok && suelta.resumen.pokemon === lista.length && doc.resumen.pokemon === lista.length);

  // Claves desconocidas (también __proto__), dex inválidos y números negativos o enormes.
  const raro = JSON.parse(ofJSON);
  Object.assign(raro, { hack: { x: 1 }, coins: -50 });   // importOficial se rechaza aparte (es de esta versión)
  raro.stats.inventado = 5; raro.stats.runs = -1; raro.stats.totalKills = 1e20; raro.stats.bestTime = 'mucho';
  raro.pupg[P] = { hp: 99, superpoder: 9 }; raro.ach.inventado = T0; raro.arenas.cosmico = T0; raro.itemsFound.gorra = T0;
  raro.evoMoves['no-existe'] = T0; raro.tickets = { t1: -3, t10: 1e12, t100: 5 }; raro.pity = { 1: 500, 99: 4 };
  raro.legends = { 0: T0, 150: T0, 9999: T0 }; raro.profile = { favs: [{ dex: 9999 }, { dex: P, shiny: true }], title: 'Inventado' };
  for (const k of ['0', '9999', 'abc', '-5', '1.5']) raro.owned[k] = { at: T0, from: 'gacha' };
  raro.owned[lista[1]] = { at: -7, from: '<script>' };
  let txt = env(raro).replace('"save":{', '"save":{"__proto__":{"polluted":true},').replace('"owned":{', '"owned":{"__proto__":{"at":1,"from":"x"},');
  const b = I.analizar(txt, AHORA), s = b.save || {};
  const proto = Object.getPrototypeOf(s) === vm.runInContext("Object.prototype", C) && ({}).polluted === undefined && vm.runInContext("({}).polluted", C) === undefined && !('polluted' in s);
  t('claves desconocidas descartadas (también __proto__, sin contaminar prototipos) y contadas', b.ok && proto && !('hack' in s) && !(I.REGISTRO in s) &&
    !('inventado' in s.stats) && !('superpoder' in s.pupg[P]) && !('inventado' in s.ach) && !('cosmico' in s.arenas) && !('gorra' in s.itemsFound) &&
    !('no-existe' in s.evoMoves) && !('t100' in s.tickets) && !('99' in s.pity) && s.profile.title === '' && b.resumen.descartados >= 12,
    b.ok ? { descartados: b.resumen.descartados, claves: b.resumen.clavesDescartadas } : b.error);
  t('dex inválidos fuera (owned, legendarios, favoritos); una fecha o un origen raro se corrigen', b.ok && ['0', '9999', 'abc', '-5', '1.5'].every(k => !(k in s.owned)) &&
    Object.keys(s.owned).length === lista.length && J(Object.keys(s.legends)) === J(['150']) && J(s.profile.favs) === J([{ dex: P, shiny: true }]) &&
    s.owned[lista[1]].at === AHORA && s.owned[lista[1]].from === 'oficial');
  t('números negativos o enormes: a 0 o al tope, avisando', b.ok && s.coins === 0 && s.tickets.t1 === 0 && s.tickets.t10 === 1e6 && s.pupg[P].hp === 10 &&
    s.stats.runs === 0 && s.stats.totalKills === 1e9 && s.stats.bestTime === 0 && s.pity[1] === 70 && b.resumen.ajustados >= 7 && b.avisos.length === 2,
    b.ok ? { coins: s.coins, tickets: s.tickets, hp: s.pupg[P].hp, pity: s.pity, ajustados: b.resumen.ajustados, avisos: b.avisos } : null);
  const inf = I.analizar(env(JSON.parse(ofJSON)).replace('"coins":48210', '"coins":1e999'), AHORA);
  const str = I.analizar(env(Object.assign(JSON.parse(ofJSON), { coins: '500' })), AHORA);
  t('monedas 1e999 (Infinity) al tope; monedas en texto se descartan', inf.ok && inf.save.coins === 1e9 && str.ok && str.save.coins === 0 && str.resumen.descartados === 1);

  // ---- el compañero ----
  const conCompa = (partner, partnerShiny, shinyOf) => {
    const o = JSON.parse(ofJSON); o.partner = partner; o.partnerShiny = partnerShiny;
    if (!shinyOf) delete o.shiny[partner];
    const x = I.analizar(env(o), AHORA); return x.ok ? I.fusionar(fk, x.save, AHORA) : null;
  };
  const sinTener = dexes.find(d => !of.owned[d] && d !== 7);
  const c1 = conCompa(P, true, true), c2 = conCompa(P, true, false), c3 = conCompa(sinTener, false, true), c4 = conCompa(null, false, true);
  t('compañero: el oficial si lo tiene; shiny sólo si tiene el shiny; si no lo tiene o no hay, se queda el del fork',
    c1.partner === P && c1.partnerShiny === true && c2.partner === P && c2.partnerShiny === false &&
    c3.partner === 7 && c3.partnerShiny === false && c4.partner === 7, { c1: [c1.partner, c1.partnerShiny], c2: [c2.partner, c2.partnerShiny], c3: c3.partner, c4: c4.partner });

  // ---- aplicar() con el db.js real: modo local (localStorage) e invitado ----
  try {
    const store = {};
    const ls = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
    const L = loadImporter({ localStorage: ls, location: { protocol: 'file:', hostname: '', search: '' }, crypto: require('crypto').webcrypto, TextEncoder });
    const LG = L.G;
    await LG.DB.ready();
    const reg = await LG.DB.register('NicoFork', 'prueba-local-' + crypto.randomBytes(4).toString('hex'));   // sólo en memoria
    LG.DB.grant(2, 'starter'); LG.DB.save.partner = 2; LG.DB.commit();   // el 2 no está en la oficial
    const ref = LG.DB.save, refOwned = ref.owned, base = ref.coins;
    // Autoimportación con el db.js real, antes de traer nada (la partida aún no lleva registro): la de esta
    // misma cuenta, sacada con un fragmento sin la comprobación o elegida tal cual de localStorage, no se
    // aplica. 3 vueltas: las monedas no cambian y no se guarda nada.
    const vivoL = { guest: false }; Object.defineProperty(vivoL, 'save', { get: () => LG.DB.save, enumerable: true });
    const exportarAqui = () => runExporter(frag, { G: { DB: vivoL } }).downloads[0].blob.parts.join('');
    const guardadoAntes = store['ps.save.nicofork'], vueltasL = [];
    for (let i = 0; i < 3; i++) {
      const y = LG.Importar.analizar(i === 2 ? store['ps.save.nicofork'] : exportarAqui(), AHORA);
      const ap = y.ok ? LG.Importar.aplicar(y.save) : { ok: false, error: y.error };
      vueltasL.push({ analiza: y.ok, ok: ap.ok, error: ap.error, coins: LG.DB.save.coins });
    }
    t('aplicar (local): la partida de esta misma cuenta no se trae (mismo created); 3 vueltas sin sumar monedas ni guardar nada',
      !!guardadoAntes && vueltasL.every(v => v.analiza && !v.ok && v.error === LG.Importar.TEXTOS.propia && v.coins === base) &&
      store['ps.save.nicofork'] === guardadoAntes, vueltasL);
    const x = LG.Importar.analizar(texto, AHORA);
    const res = LG.Importar.aplicar(x.save);
    await res.subida;
    const guardada = JSON.parse(store['ps.save.nicofork'] || 'null');
    t('aplicar (local): guarda en este navegador la partida fusionada, en el mismo objeto', reg.ok && res.ok && res.guardada && !res.nube && !res.invitado &&
      LG.DB.save === ref && ref.owned === refOwned && guardada && guardada.coins === base + 48210 && Object.keys(guardada.owned).length === lista.length + 1 &&
      guardada.partner === P && guardada[LG.Importar.REGISTRO][T0].coins === 48210, { ok: res.ok, guardada: res.guardada, coins: guardada && guardada.coins });
    const res2 = LG.Importar.aplicar(x.save);
    const guardada2 = JSON.parse(store['ps.save.nicofork']);
    t('aplicar (local) dos veces no duplica', res2.ok && guardada2.coins === guardada.coins && guardada2.tickets.t1 === guardada.tickets.t1);
    // Ya con el registro: exportarla desde aquí y elegirla da error al leer el archivo (3 vueltas, nada cambia).
    const vueltasR = [];
    for (let i = 0; i < 3; i++) { const y = LG.Importar.analizar(exportarAqui(), AHORA); vueltasR.push({ ok: y.ok, error: y.error, coins: LG.DB.save.coins }); }
    t('autoimportación después de traer la oficial: el archivo se rechaza al elegirlo (lleva el registro) y las monedas no cambian',
      vueltasR.every(v => !v.ok && v.error === LG.Importar.TEXTOS.propia && v.coins === guardada.coins) && JSON.parse(store['ps.save.nicofork']).coins === guardada.coins, vueltasR);
    LG.Game = { state: 'playing' };
    const res3 = LG.Importar.aplicar(x.save);
    t('aplicar: en mitad de una run no hace nada y lo dice', !res3.ok && res3.error === LG.Importar.TEXTOS.enRun);
    LG.Game = { state: 'ui' };
    LG.DB.playAsGuest();
    const antes = J(store);
    const res4 = LG.Importar.aplicar(x.save);
    t('aplicar (invitado): se aplica en memoria, no se guarda y lo indica', res4.ok && res4.invitado && !res4.guardada && LG.DB.save.coins === LG.DB.START_COINS + 48210 &&
      J(store) === antes && JSON.parse(store['ps.save.nicofork']).coins === guardada.coins);
  } catch (e) { t('aplicar con el db.js real', false, String(e && e.stack || e)); }

  // ---- la sección de Ajustes (js/ui/importar-ui.js) con el db.js real y un DOM mínimo ----
  // Los textos del archivo (nombre, origen, fecha, título, favoritos, orígenes) no pueden meter HTML;
  // la partida de esta cuenta da el error sin vista previa ni Confirmar; lo que cuenta tiene su fila.
  try {
    const store = {};
    const ls = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
    const U = loadImporter({ localStorage: ls, location: { protocol: 'file:', hostname: '', search: '' }, crypto: require('crypto').webcrypto, TextEncoder });
    const UG = U.G;
    await UG.DB.ready();
    await UG.DB.register('NicoUI', 'prueba-ui-' + crypto.randomBytes(4).toString('hex'));   // sólo en memoria
    UG.DB.commit();
    const els = {};
    const el = id => els[id] || (els[id] = { id, innerHTML: '', textContent: '', disabled: false, value: '', files: null, isConnected: true,
      click() {}, select() {}, focus() {} });
    U.document = { getElementById: el, createElement: () => ({}), head: { appendChild() {} }, querySelector: () => null };
    vm.runInContext(rd('js/ui/importar-ui.js'), U, { filename: 'js/ui/importar-ui.js' });
    const UI = UG.ImportarUI;
    el('imp-box').innerHTML = UI.html(); UI.wire();
    const elegir = async txt => { el('imp-file').files = [{ size: Buffer.byteLength(txt), text: async () => txt }]; await el('imp-file').onchange(); return el('imp-box').innerHTML; };
    const hPropia = await elegir(store['ps.save.nicoui']);   // su propia partida, tal cual de localStorage
    t('Ajustes: elegir la partida de esta misma cuenta da el error, sin vista previa ni Confirmar',
      hPropia.includes(I.TEXTOS.propia) && !/Vista previa|id="imp-ok"/.test(hPropia), hPropia.slice(-300));
    const hostil = JSON.parse(ofJSON);
    hostil.name = '<img src=x onerror=alert(1)>';
    hostil.profile = { favs: [{ dex: P, shiny: true }, { dex: '<svg onload=alert(2)>' }], title: '<b>x</b>' };
    hostil.owned[lista[2]] = { at: T0, from: '"><svg onload=alert(3)>' };
    const hHostil = await elegir(J({ tipo: I.TIPO, version: 1, origen: '<script>alert(4)</script>', exportado: '<i>hoy</i>', save: hostil }));
    const PELIGRO = /<img|<svg|<script|<iframe|onerror\s*=|onload\s*=|<b>x<\/b>|<i>hoy|javascript:/i;
    t('Ajustes: la vista previa con nombre, origen, fecha, título, favoritos y orígenes hostiles no pinta HTML del archivo',
      /Vista previa/.test(hHostil) && /id="imp-ok"/.test(hHostil) && !PELIGRO.test(hHostil), (hHostil.match(PELIGRO) || ['vista previa sin pintar'])[0]);
    t('Ajustes: la vista previa enseña el pity y los favoritos que se traen (y no un título descartado)',
      /Banners con más tiradas sin legendaria/.test(hHostil) && /Favoritos del perfil/.test(hHostil) && !/Título del perfil/.test(hHostil) && /Compañero/.test(hHostil));
    await el('imp-ok').onclick();
    const hOk = el('imp-box').innerHTML, guardadaUI = JSON.parse(store['ps.save.nicoui']);
    t('Ajustes: Confirmar trae la partida y la guarda en este navegador', /¡Hecho!/.test(hOk) && /Guardada en este navegador/.test(hOk) &&
      guardadaUI.coins === UG.DB.START_COINS + 48210 && guardadaUI.name === 'NicoUI', { coins: guardadaUI.coins });
    const hPropia2 = await elegir(store['ps.save.nicoui']);
    t('Ajustes: después, su propia partida (ya con el registro) también da el error y no suma nada',
      hPropia2.includes(I.TEXTOS.propia) && !/id="imp-ok"/.test(hPropia2) && JSON.parse(store['ps.save.nicoui']).coins === guardadaUI.coins);
  } catch (e) { t('Ajustes (js/ui/importar-ui.js) con un DOM mínimo', false, String(e && e.stack || e)); }

  const failed = r.filter(x => !x[1]);
  if (!failed.length) ok(`exportador e importador: ${r.length} casos bien`);
  for (const [name, , detail] of failed) bad(`importar: ${name}${detail !== undefined ? ' · ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
}

importChecks().catch(e => bad('no se pudo probar el importador: ' + (e && e.stack || e))).then(() => {
  console.log(fails ? `\nRESULTADO: ${fails} fallo(s), ${warns} aviso(s)` : `\nRESULTADO: todo bien (${warns} aviso(s))`);
  process.exit(fails ? 1 : 0);
});
