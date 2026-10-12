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
 *   8. Traer la partida del juego oficial: el exportador (sin red, una línea que es
 *      tools/nico/exportar-oficial.js, la versión comentada, sin comentarios ni sangría; no
 *      modifica nada, respaldo a localStorage, se niega en la consola de esta versión, avisos
 *      en español o inglés según el navegador y fecha local en el nombre del archivo) y el
 *      importador de js/core/importar.js (saneado, fusión, monedas sin duplicar, rechazo de la
 *      partida de esta versión, pity, compañero y perfil sólo la primera vez, aplicar() en modo
 *      local e invitado con el db.js real, la vista previa de js/ui/importar-ui.js con datos
 *      hostiles y que todos sus textos tienen inglés).
 *   9. Grieta garantizada: la lógica de js/core/mods.js (hora, una por partida, reintentos, jefe,
 *      quién manda) y js/systems/rift.js real con el juego simulado, en solitario y en grupo
 *      (anfitrión e invitado): el legendario de esa grieta con el 60 % y las naturales intactas.
 *  10. Gacha y tickets: tickets ganados ×2 (bankTickets, syncTeam y la recogida de game.js, los
 *      premios de progress.js; sin cobro doble, sin restas, sin tocar las definiciones ni traer dos
 *      veces la partida oficial) y shiny ×1,5 (el gacha real sembrado, rollShiny de spawner.js y la línea
 *      del legendario de rift.js tal cual, y el cartel del gacha con el refresh() real de gacha-ui.js) y
 *      repetido -> su evolución (js/data/evolutions.js sin ciclos y sólo con especies del juego; pull() real
 *      con las tiradas guionizadas: Bulbasaur, Eevee, shiny, ×10 en orden, ramas; la carta y el inglés).
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
if (['curacionEnemiga', 'anchoMaxJugador', 'grietaGarantizadaAntesDe', 'ticketsMult', 'shinyMult', 'repetidoDaEvolucion'].every(k => minS.includes(k))) ok('el paquete incluye js/core/mods.js');
else bad('el paquete no incluye js/core/mods.js (o una versión vieja)');
if (minS.includes('G.EVO={1:[2],')) ok('el paquete incluye js/data/evolutions.js'); else bad('el paquete no incluye js/data/evolutions.js');
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
  ['js/ui/settings-ui.js', /renderAccount\(box\);\r?\n\s*if \(G\.ImportarUI\) box\.insertAdjacentHTML\('beforeend', G\.ImportarUI\.html\(\)\);\s*\/\/ MOD nico/, 'Ajustes > Cuenta pinta la sección de importar detrás de lo de upstream (gancho aditivo)'],
  ['js/ui/settings-ui.js', /Crear cuenta o entrar<\/button>`;\r?\n\s*return;/, 'Ajustes > Cuenta (invitado): la línea de upstream, intacta'],
  ['js/ui/settings-ui.js', /id="set-msg"><\/p>`;\r?\n\s*\}/, 'Ajustes > Cuenta (con cuenta): la línea de upstream, intacta'],
  ['js/ui/settings-ui.js', /if \(G\.ImportarUI\) G\.ImportarUI\.wire\(box\);/, 'Ajustes conecta los botones de importar'],
  ['js/systems/rift.js', /function update\(dt, pl, time\) \{\r?\n\s*if \(G\.MODS && G\.MODS\.grietaGarantizada && G\.MODS\.grietaGarantizada\(pl, time, !!\(rift \|\| arena\), authority\(\)\)\) \{ open\(\); if \(rift\) \{ checkT = CHECK; G\.MODS\.grietaAbierta\(pl, rift, time\); \} \}\s*\/\/ MOD nico/,
    'grieta garantizada: gancho al principio de update()'],
  ['js/systems/rift.js', /\};\r?\n\s*if \(G\.MODS && G\.MODS\.arenaGarantizada\) cfg\.forzada = G\.MODS\.arenaGarantizada\(G\.Game\.player, rift, G\.Game\.st\.time\);\s*\/\/ MOD nico[^\n]*\r?\n\s*if \(G\.Coop\.isHost\) G\.Coop\.broadcast\(\['arena', cfg\]\);/,
    'grieta garantizada: start() marca su arena antes de anunciarla'],
  ['js/systems/rift.js', /const e = new G\.Enemy\(def, [^\n]*\r?\n\s*if \(G\.MODS && G\.MODS\.vidaLegendario\) G\.MODS\.vidaLegendario\(e, arena\);\s*\/\/ MOD nico/,
    'grieta garantizada: spawnLegend() rebaja la vida de su legendario'],
  ['js/game.js', /sv\.tickets\.t1 \+= G\.MODS && G\.MODS\.tickets \? G\.MODS\.tickets\(d1\) : d1; sv\.tickets\.t10 \+= G\.MODS && G\.MODS\.tickets \? G\.MODS\.tickets\(d10\) : d10;\s*\/\/ MOD nico/,
    'tickets ×2: bankTickets() apunta en la partida guardada los nuevos multiplicados'],
  ['js/game.js', /if \(p\.kind === 'ticket'\) pl\.t1\+\+; else pl\.t10\+\+;\r?\n\s*bankTickets\(\);/, 'tickets ×2: la recogida sigue contando 1 por objeto (pl.t1++, lo que viaja por la red)'],
  ['js/game.js', /t1: G\.MODS && G\.MODS\.tickets \? G\.MODS\.tickets\(pl\.t1\) : pl\.t1, t10: G\.MODS && G\.MODS\.tickets \? G\.MODS\.tickets\(pl\.t10\) : pl\.t10,\s*\/\/ MOD nico/,
    'tickets ×2: la pantalla final enseña los que se apuntaron'],
  ['js/game.js', /G\.MODS && G\.MODS\.textoTicket \? G\.MODS\.textoTicket\(p\.kind\) : p\.kind === 'ticket' \? '\+1 ticket' : '¡Ticket ×10!'/, 'tickets ×2: el texto que flota al coger uno'],
  ['js/systems/progress.js', /function grant\(r\) \{\r?\n\s*const s = G\.DB\.save;\r?\n\s*if \(!r\) return;\r?\n\s*if \(G\.MODS && G\.MODS\.premio\) r = G\.MODS\.premio\(r\);\s*\/\/ MOD nico/,
    'tickets ×2: premios de misiones y logros (grant)'],
  ['js/systems/progress.js', /function rewardText\(r\) \{\r?\n\s*if \(G\.MODS && G\.MODS\.premio\) r = G\.MODS\.premio\(r\);\s*\/\/ MOD nico/, 'tickets ×2: el premio que se enseña (rewardText)'],
  ['js/systems/spawner.js', /return Math\.random\(\) < \(G\.MODS && G\.MODS\.probShiny \? G\.MODS\.probShiny\(SHINY_RATE\) : SHINY_RATE\);\s*\/\/ MOD nico/, 'shiny ×1,5: salvajes y jefes (rollShiny)'],
  ['js/systems/rift.js', /shiny: G\.Sprites\.hasShiny\(mon\.dex\) && Math\.random\(\) < \(G\.MODS && G\.MODS\.probShiny \? G\.MODS\.probShiny\(1 \/ 512\) : 1 \/ 512\),\s*\/\/ MOD nico/, 'shiny ×1,5: legendario de la grieta'],
  ['js/systems/gacha.js', /Math\.random\(\) < \(G\.MODS && G\.MODS\.probShiny \? G\.MODS\.probShiny\(SHINY_RATE\) : SHINY_RATE\)\);\s*\/\/ MOD nico/, 'shiny ×1,5: gacha'],
  ['js/ui/gacha-ui.js', /<span>1%<\/span><\/div>[\s\S]*?<\/p>`;\r?\n\s*if \(G\.MODS && G\.MODS\.notasGacha\) \$\('gacha-rates'\)\.innerHTML = G\.MODS\.notasGacha\(\$\('gacha-rates'\)\.innerHTML\);\s*\/\/ MOD nico/,
    'shiny ×1,5: el cartel del gacha (el «1%» de upstream sigue ahí y el gancho lo cambia después de pintarlo)'],
  ['dev.html', /src="js\/data\/sprites-meta\.js"><\/script>\r?\n<script defer src="js\/data\/evolutions\.js"><\/script><!-- MOD nico/, 'repetidos: evolutions.js se carga justo después de sprites-meta.js'],
  ['js/systems/gacha.js', /else refund = REFUND\[rarity\];\r?\n\s*\}\r?\n\s*const evo = !isNew && G\.MODS && G\.MODS\.evolucionDeRepetido \? G\.MODS\.evolucionDeRepetido\(save, mon\.dex, shiny\) : 0; if \(evo\) refund = 0;\s*\/\/ MOD nico[^\n]*\n\s*save\.coins \+= refund;\r?\n\s*out\.push\(\{ dex: mon\.dex, rarity, shiny, isNew, refund \}\);\r?\n\s*if \(evo\) out\[out\.length - 1\]\.evo = evo;\s*\/\/ MOD nico/,
    'repetidos: pull() pregunta por la evolución antes de dar las monedas y la apunta en el resultado'],
  ['js/ui/gacha-ui.js', /<div class="tag">\$\{tag\}<\/div>`\);\r?\n\s*if \(r\.evo && G\.MODS && G\.MODS\.marcarEvolucion\) G\.MODS\.marcarEvolucion\(c, r\);\s*\/\/ MOD nico/, 'repetidos: la carta enseña la evolución desbloqueada'],
  ['js/ui/gacha-ui.js', /· Los repetidos dan Pokémonedas \(los shiny repetidos, el triple\)\.<br>/, 'repetidos: la nota de upstream que cambia notasGacha() sigue ahí']
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
  ['js/core/mods.js|e.maxHp = e.hp = Math.max(1, Math.round(e.maxHp * f));', 1,
    'legendario de la grieta garantizada (vidaLegendario): su vida al crearlo, antes de añadirlo; no es una curación'],
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
function runExporter(frag, { G: g, storage = {}, host = 'juego-oficial.test', nav, Fecha } = {}) {
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
  if (nav !== undefined) ctx.navigator = nav;      // sin él, el código no sabe el idioma: español
  if (Fecha) ctx.Date = Fecha;                     // reloj simulado (fecha local distinta de la UTC)
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
  const compila = c => { try { new vm.Script(c); return true; } catch (e) { return false; } };
  // tools/nico/exportar-oficial.js es la versión comentada: sus líneas de código, sin sangría y unidas con
  // un espacio, son exactamente la línea de Ajustes. Los comentarios van en líneas propias (//).
  const legible = rd('tools/nico/exportar-oficial.js'), lineas = legible.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const codigo = lineas.filter(l => !l.startsWith('//'));
  const i0 = lineas.indexOf(codigo[0]), i1 = lineas.lastIndexOf(codigo[codigo.length - 1]);
  const comentadas = lineas.slice(i0, i1).filter(l => l.startsWith('//')).length;
  t('tools/nico/exportar-oficial.js es G.Importar.EXPORTADOR (la línea que se copia en Ajustes) comentado: sin comentarios ni sangría, idéntico',
    codigo.join(' ') === frag && codigo.length >= 20 && comentadas >= 10 && compila(legible), { lineasDeCodigo: codigo.length, comentariosDentro: comentadas });
  t('el exportador es una sola línea de JavaScript válido', !/[\r\n]/.test(frag) && compila(frag));
  // De navigator sólo puede leer el idioma (navigator.language); nada de sendBeacon ni otras vías.
  const NET = [/\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|RTCPeerConnection|postMessage|importScripts|eval|Function)\b/,
    /\bnavigator\s*(\.\s*(?!language\b)\w|\[)/, /\bimport\s*\(/, /:\/\//, /\bhttps?\b/i, /\bwss?\b/i, /www\./i, /\.(com|net|org|io|app|dev|es|co)\b/i,
    /\.src\b/, /new\s+Image\b/, /\bopen\s*\(/];
  const netHit = NET.filter(re => re.test(frag));
  t('el exportador no usa fetch, XMLHttpRequest, sendBeacon, WebSocket ni otra vía de red, ni lleva URLs (de navigator, sólo el idioma)', !netHit.length, netHit.map(String));
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
  const hoy = new Date(), dd = n => String(n).padStart(2, '0');
  const e1 = runExporter(frag, { G: { DB: dbVivo } });
  const hoyLocal = `${hoy.getFullYear()}-${dd(hoy.getMonth() + 1)}-${dd(hoy.getDate())}`;
  const d1 = e1.downloads[0], env1 = d1 && JSON.parse(d1.blob.parts.join(''));
  t('exportador: descarga pokesurvivor-partida-<nombre>-<fecha local>.json con el envoltorio y una copia exacta de G.DB.save',
    e1.downloads.length === 1 && d1.nombre === `pokesurvivor-partida-AshOficial-${hoyLocal}.json` && d1.blob.type === 'application/json' &&
    env1.tipo === 'pokesurvivor-partida' && env1.version === 1 && env1.origen === 'juego-oficial.test' && typeof env1.exportado === 'number' &&
    J(env1.save) === ofJSON && !e1.alerts.length && /^Partida exportada: \d+ Pokémon en /.test(e1.logs[0] || ''), d1 && d1.nombre);
  t('exportador: no modifica la partida ni localStorage', J(of) === ofJSON && e1.escrituras === 0);
  // La fecha del nombre es la del reloj del PC, no la UTC: a las 01:30 del 13-10 en España (23:30 UTC del 12).
  class Madrugada { getFullYear() { return 2026; } getMonth() { return 9; } getDate() { return 13; }
    toISOString() { return '2026-10-12T23:30:00.000Z'; } static now() { return Date.UTC(2026, 9, 12, 23, 30); } }
  const eF = runExporter(frag, { G: { DB: dbVivo }, Fecha: Madrugada }), dF = eF.downloads[0];
  t('exportador: la fecha del nombre del archivo es la local (no la UTC de toISOString)',
    dF && dF.nombre === 'pokesurvivor-partida-AshOficial-2026-10-13.json' && JSON.parse(dF.blob.parts.join('')).exportado === Madrugada.now(), dF && dF.nombre);
  // La versión comentada hace exactamente lo mismo si se pega tal cual.
  const eL = runExporter(legible, { G: { DB: dbVivo } }), dL = eL.downloads[0];
  t('exportador: la versión comentada, pegada tal cual, descarga lo mismo', dL && dL.nombre === d1.nombre && JSON.parse(dL.blob.parts.join('')).save.name === 'AshOficial' && !eL.alerts.length);
  const e2 = runExporter(frag, { G: { DB: { guest: true, save: DB.newSave('Invitado') } } });
  t('exportador: como invitado avisa en español y no descarga nada', e2.downloads.length === 0 && e2.alerts.length === 1 && /invitado/i.test(e2.alerts[0]));
  const sinSesion = { guest: false }; Object.defineProperty(sinSesion, 'save', { get: () => null });
  const e3 = runExporter(frag, { G: { DB: sinSesion }, storage: { 'ps.cloud.x': ofJSON } });
  t('exportador: sin sesión iniciada avisa y no descarga (no tira de copias viejas)', e3.downloads.length === 0 && e3.alerts.length === 1 && /inicia sesi/i.test(e3.alerts[0]));
  // Idioma de los avisos: el del navegador (español si empieza por "es"; si no, inglés).
  const nav = language => ({ language });
  const en2 = runExporter(frag, { G: { DB: { guest: true, save: DB.newSave('Guest') } }, nav: nav('en-US') });
  const en3 = runExporter(frag, { G: { DB: sinSesion }, nav: nav('fr-FR') });
  const en7 = runExporter(frag, { G: { Importar: { TIPO: 'pokesurvivor-partida' } }, nav: nav('en-GB') });
  const en1 = runExporter(frag, { G: { DB: dbVivo }, nav: nav('en-US') });
  const es2 = runExporter(frag, { G: { DB: { guest: true, save: DB.newSave('Invitado') } }, nav: nav('es-MX') });
  const es7 = runExporter(frag, { G: { Importar: { TIPO: 'pokesurvivor-partida' } }, nav: nav('ES') });
  t('exportador: con el navegador en otro idioma, los avisos y el mensaje final salen en inglés; en español (es, es-MX...), en español',
    /playing as a guest/.test(en2.alerts[0] || '') && /save was not found/.test(en3.alerts[0] || '') && /modified version, not the official game/.test(en7.alerts[0] || '') &&
    /^Save exported: \d+ Pokémon in /.test(en1.logs[0] || '') && en1.downloads.length === 1 && en1.downloads[0].nombre === d1.nombre &&
    /jugando como invitado/.test(es2.alerts[0] || '') && /versión modificada, no el juego oficial/.test(es7.alerts[0] || '') &&
    [en2, en3, en7, es2, es7].every(x => x.downloads.length === 0 && x.alerts.length === 1),
    { en: [en2.alerts[0], en3.alerts[0], en7.alerts[0], en1.logs[0]], es: [es2.alerts[0], es7.alerts[0]] });
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
    // querySelector: lo que se acerca a la vista tras repintar (el resultado, centrado; la vista previa, lo justo).
    const vistos = [];
    const qs = sel => {
      const h = el('imp-box').innerHTML;
      if (sel === '#imp-box > .imp-msg' && /class="imp-msg/.test(h)) return { scrollIntoView: o => vistos.push('msg-' + o.block) };
      if (sel === '#imp-box .imp-prev' && /class="imp-prev/.test(h)) return { scrollIntoView: o => vistos.push('prev-' + o.block) };
      return null;
    };
    U.document = { getElementById: el, createElement: () => ({}), head: { appendChild() {} }, querySelector: qs };
    vm.runInContext(rd('js/ui/importar-ui.js'), U, { filename: 'js/ui/importar-ui.js' });
    const UI = UG.ImportarUI;
    el('imp-box').innerHTML = UI.html(); UI.wire();
    const hInicial = el('imp-box').innerHTML;
    // El cuadro del código lleva translate="no" y el DOM no traduce ni sus atributos: su aria-label pasa por G.T.
    UG.T = s => 'EN:' + s;
    const hTraducida = UI.html();
    delete UG.T;
    t('Ajustes: el aria-label del cuadro del código (translate="no") se traduce al pintarlo',
      /<textarea[^>]*translate="no"[^>]*aria-label="EN:Código para la consola del juego oficial"/.test(hTraducida));
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
    // Los avisos flotantes (logros, «Partida traída») salen arriba o abajo de la pantalla: el resultado va arriba de
    // la sección, antes de los pasos, y se centra en la pantalla (en el navegador lo mide el E2E a 844x390).
    t('Ajustes: el resultado de Confirmar va arriba de la sección (antes de los pasos) y se centra en la pantalla; la vista previa sólo se acerca',
      hOk.indexOf('class="imp-msg') > 0 && hOk.indexOf('class="imp-msg') < hOk.indexOf('class="imp-pasos"') && vistos[vistos.length - 1] === 'msg-center' &&
      vistos.includes('prev-nearest') && hPropia.indexOf('class="imp-msg') < hPropia.indexOf('class="imp-pasos"'), vistos);
    const hPropia2 = await elegir(store['ps.save.nicoui']);
    t('Ajustes: después, su propia partida (ya con el registro) también da el error y no suma nada',
      hPropia2.includes(I.TEXTOS.propia) && !/id="imp-ok"/.test(hPropia2) && JSON.parse(store['ps.save.nicoui']).coins === guardadaUI.coins);

    // Inglés: cada texto que enseña la sección (en los estados de arriba: inicial, error, vista previa y
    // resultado), sus errores, sus avisos flotantes y el alert del código pegado en esta versión tiene su
    // entrada en js/data/lang-en*.js (frase exacta o patrón con {x}). Lo marcado translate="no" no cuenta.
    const claves = new Set(), patrones = [];
    const reEsc = x => x.replace(/[.*+?^${}()|[\]\\]/g, m => '\\' + m);
    const ctxI = { G: { I18n: { add: d => Object.keys(d).forEach(k => {
      const n = k.replace(/\s+/g, ' ').trim();
      if (n.includes('{x}')) patrones.push(new RegExp('^' + n.split('{x}').map(reEsc).join('.+?') + '$', 'u'));
      else claves.add(n);
    }) } } };
    vm.createContext(ctxI);
    for (const f of ['js/data/lang-en.js', 'js/data/lang-en-mod.js']) vm.runInContext(rd(f), ctxI, { filename: f });
    const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
    const textos = h => {
      // Fuera el código del textarea (no se traduce), pero no la etiqueta: su aria-label sí cuenta.
      const limpio = h.replace(/(<textarea[^>]*>)[\s\S]*?(<\/textarea>)/g, (m, a, b) => a + b).replace(/<span translate="no">[\s\S]*?<\/span>/g, '');
      const out = [...limpio.matchAll(/(?:aria-label|title|placeholder)="([^"]*)"/g)].map(m => m[1]);
      out.push(...limpio.split(/<[^>]*>/));
      return out.map(x => x.replace(/&(amp|lt|gt|quot|#39);/g, m => ENT[m]).replace(/\s+/g, ' ').trim()).filter(x => /\p{L}/u.test(x));
    };
    const toasts = [...rd('js/ui/importar-ui.js').matchAll(/toast\('([^']+)'\)/g)].map(m => m[1]);
    const enFork = runExporter(frag, { G: Object.assign(Object.create(GG), { DB: { guest: false } }) }).alerts;
    const todos = new Set([...[hInicial, hPropia, hHostil, hOk].flatMap(textos), ...Object.values(I.TEXTOS), ...toasts, ...enFork]);
    const sinIngles = [...todos].filter(x => !claves.has(x) && !patrones.some(p => p.test(x)));
    t(`Ajustes: los ${todos.size} textos de la sección, sus errores y el aviso del código pegado aquí tienen inglés`,
      todos.size >= 40 && toasts.length > 0 && enFork.length === 1 && !sinIngles.length, sinIngles);
  } catch (e) { t('Ajustes (js/ui/importar-ui.js) con un DOM mínimo', false, String(e && e.stack || e)); }

  const failed = r.filter(x => !x[1]);
  if (!failed.length) ok(`exportador e importador: ${r.length} casos bien`);
  for (const [name, , detail] of failed) bad(`importar: ${name}${detail !== undefined ? ' · ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
}

// ---------------- 9. grieta garantizada ----------------
// A: la lógica de js/core/mods.js, fotograma a fotograma. B: js/systems/rift.js real con el juego simulado
// (sin navegador): solitario, anfitrión e invitado. Nada de esto usa las ayudas de depuración del juego.
function grietaChecks() {
  console.log('9. Grieta garantizada (js/core/mods.js y js/systems/rift.js con el código real)');
  const r = [];
  const t = (name, cond, detail) => r.push([name, !!cond, detail]);
  const DT = 1 / 30, CERCA = (a, b, e = 1e-6) => Math.abs(a - b) < e;

  // ---- A. lógica de mods.js ----
  let jefe = false;
  const cm = { performance: { now: () => 0 } };
  vm.createContext(cm);
  cm.G = { EnemyMgr: { bossAlive: () => jefe } };
  vm.runInContext(rd('js/core/mods.js'), cm, { filename: 'js/core/mods.js' });
  const M = cm.G.MODS, LIM = M.grietaGarantizadaAntesDe;
  const azar = v => vm.runInContext(`Math.random = () => ${v}`, cm);
  t('por defecto: antes de los 120 s y el legendario con el 60 % de la vida', LIM === 120 && M.grietaGarantizadaVida === 0.6);
  const horas = [0, 0.5, 0.999].map(v => { azar(v); const pl = {}; M.grietaGarantizada(pl, 0, false, true); return M.grietaGarantizadaHora(pl); });
  t('la hora cae en [límite-45, límite-10] = [75, 110] s (azar 0, 0,5 y 0,999)',
    horas.every(h => h >= LIM - 45 && h <= LIM - 10) && CERCA(horas[0], 75) && CERCA(horas[1], 92.5) && CERCA(horas[2], 109.965), horas);

  /** Fotogramas de 0 a `hasta` s. Devuelve los instantes en que pide abrirla. `fallos`: veces que open() no
   *  encuentra sitio; la grieta dura `ttl` s. `natural`: [desde, hasta) con una grieta natural; `jefes`: con un jefe. */
  function simular({ v = 0.5, manda = true, fallos = 0, ttl = 45, natural = null, jefes = null, hasta = 130, pl = {} } = {}) {
    azar(v);
    const pide = [];
    let fin = -1;
    for (let k = 0; k * DT <= hasta; k++) {
      const time = k * DT;
      jefe = !!(jefes && time >= jefes[0] && time < jefes[1]);
      const hay = !!(natural && time >= natural[0] && time < natural[1]) || time < fin;
      if (M.grietaGarantizada(pl, time, hay, manda)) { pide.push(time); if (fallos-- <= 0) fin = time + ttl; }
    }
    jefe = false;
    return { pide, hora: M.grietaGarantizadaHora(pl) };
  }
  const s1 = simular(), s2 = simular({ v: 0.999 });
  t('se abre una sola vez, en el primer fotograma tras su hora y antes de los 120 s',
    [s1, s2].every(s => s.pide.length === 1 && s.pide[0] >= s.hora && s.pide[0] < s.hora + DT + 1e-9 && s.pide[0] < LIM), { s1: s1.pide, s2: s2.pide });
  const corta = simular({ ttl: 2 });
  t('si no entráis antes de que se cierre, no se reabre (cerrada a los 94,5 s, nada hasta los 130)', corta.pide.length === 1, corta.pide);
  const invitado = simular({ manda: false });
  M.grietaGarantizadaAntesDe = 0;
  const apagada = simular();
  M.grietaGarantizadaAntesDe = LIM;
  t('nunca si no manda este cliente (invitado) ni con el ajuste a 0', invitado.pide.length === 0 && apagada.pide.length === 0 && apagada.hora === null);
  const nat1 = simular({ natural: [80, 125] }), nat2 = simular({ natural: [76, 78] }), nat3 = simular({ natural: [95, 140] });
  t('si ya hubo una natural (abierta o ya cerrada), no se fuerza otra', nat1.pide.length === 0 && nat2.pide.length === 0 && nat3.pide.length === 1 && nat3.pide[0] < 95,
    { nat1: nat1.pide, nat2: nat2.pide, nat3: nat3.pide });
  const sinSitio = simular({ fallos: 1e9 }), huecos = sinSitio.pide.slice(1).map((x, i) => x - sinSitio.pide[i]);
  t('si open() no encuentra sitio, lo reintenta cada segundo (nunca antes) hasta el límite',
    sinSitio.pide.length >= 25 && huecos.every(h => h >= 1 - 1e-9 && h < 1 + DT + 1e-6) && sinSitio.pide[sinSitio.pide.length - 1] < LIM,
    { veces: sinSitio.pide.length, minimo: Math.min(...huecos), maximo: Math.max(...huecos) });
  const dosFallos = simular({ fallos: 2 });
  t('tras dos intentos sin sitio, al tercero se abre y ya no pide más', dosFallos.pide.length === 3 && CERCA(dosFallos.pide[2] - dosFallos.pide[0], 2, DT + 1e-6), dosFallos.pide);
  const conJefe = simular({ jefes: [80, 100] }), jefeSiempre = simular({ jefes: [80, 130] });
  t('con un jefe vivo no: espera a que caiga (si cae antes del límite)', conJefe.pide.length === 1 && conJefe.pide[0] >= 100 && conJefe.pide[0] < 100 + DT + 1e-9 &&
    jefeSiempre.pide.length === 0, { conJefe: conJefe.pide, jefeSiempre: jefeSiempre.pide });
  const plA = {}, plB = {};
  const pA = simular({ v: 0, pl: plA }), pB = simular({ v: 0.999, pl: plB });
  t('otra partida (otro jugador local) vuelve a elegir hora y vuelve a tener su grieta', CERCA(pA.hora, 75) && CERCA(pB.hora, 109.965) &&
    pA.pide.length === 1 && pB.pide.length === 1 && CERCA(M.grietaGarantizadaHora(plA), 75), { A: pA, B: pB });
  // La marca de su arena y la vida del legendario.
  const plM = {}; M.grietaGarantizada(plM, 0, false, true);
  const forzada = { ttl: 45 }, otra = { ttl: 45 };
  M.grietaAbierta(plM, forzada, 92.5);
  const a1 = M.arenaGarantizada(plM, forzada, 93), a2 = M.arenaGarantizada(plM, forzada, 93.5), a3 = M.arenaGarantizada(plM, otra, 200);
  t('la arena de la grieta garantizada sale marcada una vez; otra grieta (natural) no', a1 === 1 && a2 === 0 && a3 === 0 && M.arenaGarantizada({}, otra, 100) === 0);
  const plT = {}, plU = {}; M.grietaGarantizada(plT, 0, false, true); M.grietaGarantizada(plU, 0, false, true);
  M.grietaAbierta(plT, { ttl: 45 }, 92.5); M.grietaAbierta(plU, { ttl: 45 }, 92.5);
  t('si aquí ya se cerró (el invitado entró en sus últimos instantes), vale hasta 5 s después; luego no',
    M.arenaGarantizada(plT, null, 92.5 + 45 + 4.9) === 1 && M.arenaGarantizada(plU, null, 92.5 + 45 + 5.1) === 0);
  const eF = { maxHp: 4190, hp: 4190 }, eN = { maxHp: 4190, hp: 4190 };
  M.vidaLegendario(eF, { forzada: 1 }); M.vidaLegendario(eN, { forzada: 0 });
  t('vidaLegendario: el de su arena, con el 60 % (4.190 -> 2.514); el de otra, igual', eF.maxHp === 2514 && eF.hp === 2514 && eN.maxHp === 4190 && eN.hp === 4190);

  // ---- B. js/systems/rift.js real ----
  const scaleHp = n => 1 + 0.3 * Math.max(0, n - 1);
  const vidaNormal = (t, n) => Math.round((3200 + t * 9) * scaleHp(n) * (n > 1 ? 1.4 : 1));   // la fórmula de spawnLegend
  function juego({ papel = 'solo' } = {}) {
    const S = { time: 0, rnd: 0.5, enemigos: new Map(), creados: [], banderas: [], enviados: [], alHost: [], vinculos: 0, grietas: [], pide: 0 };
    const c = { console };
    vm.createContext(c);
    c.window = c; c.G = {}; c.__rnd = () => S.rnd;
    for (const f of ['js/core/util.js', 'js/core/mods.js']) vm.runInContext(rd(f), c, { filename: f });
    vm.runInContext('Math.random = () => __rnd()', c);
    const G = c.G, nop = () => {};
    const pl = { x: 2000, y: 2000, dead: false, bonds: 0, bodyH: 30, revive: nop }, mate = { x: 2040, y: 2000, dead: false };
    let nid = 0;
    Object.assign(G, {
      Tiles: { T: 16, arenaBiome: () => 0, ARENA_THEMES: {}, propSprite: () => ({ width: 1, height: 1 }) },
      Sprites: { PX: 2, hasShiny: () => false },
      Coop: { active: papel !== 'solo', isHost: papel === 'anfitrion', scaleHp,
        broadcast: m => S.enviados.push(JSON.parse(JSON.stringify(m))), toHost: m => S.alHost.push(m) },
      Game: { get player() { return pl; }, st: { get time() { return S.time; } }, everyone: () => (papel === 'solo' ? [pl] : [pl, mate]), flash: nop,
        offerBond: () => { S.vinculos++; } },
      EnemyMgr: { bossAlive: () => [...S.enemigos.values()].some(e => e.boss && !e.dead), stash: nop, restore: nop, clearRemote: nop,
        add: e => { S.enemigos.set(e.id, e); S.creados.push({ e, t: S.time }); }, get: id => S.enemigos.get(id), all: () => [...S.enemigos.values()] },
      World: { isFree: () => true, setArena: nop, setBiome: nop, biome: 0 },
      Projectiles: { clear: nop }, Combat: { clearFields: nop }, Hazards: { clear: nop }, Weather: { force: nop, clear: nop },
      Camera: { x: 0, y: 0, kick: nop }, Audio: { sfx: nop }, FX: { ring: nop, dmgText: nop, px: nop }, Spawner: { say: nop },
      Progress: { event: nop }, Pickups: { pullAll: nop }, Guard: { flag: w => S.banderas.push(w) },
      DEX: [{ dex: 150, name: 'Mewtwo', leg: true, types: ['psychic'], spd: 130 }], SPRITE_META: { 150: {} },
      Enemy: class { constructor(def, x, y, sc, boss) { this.id = ++nid; this.def = def; this.name = def.name; this.x = x; this.y = y; this.boss = boss;
        this.maxHp = Math.round(def.hp * sc.hp); this.hp = this.maxHp; this.dead = false; } makeShiny() { this.maxHp *= 2; this.hp = this.maxHp; } }
    });
    G.DEX_BY = { 150: G.DEX[0] };
    vm.runInContext(rd('js/systems/rift.js'), c, { filename: 'js/systems/rift.js' });
    const R = G.Rift, M2 = G.MODS, gg = M2.grietaGarantizada;
    M2.grietaGarantizada = function (...a) { const x = gg.apply(this, a); if (x) S.pide++; return x; };
    const paso = () => {
      S.time += DT; R.update(DT, pl, S.time);
      if (R.rift && !S.grietas.includes(R.rift)) S.grietas.push(R.rift);
    };
    const hastaQue = (cond, max) => { while (!cond() && S.time < max) paso(); return cond(); };
    const entrar = () => { pl.x = R.rift.x; pl.y = R.rift.y - 10; paso(); };
    const legendario = () => S.creados.length ? S.creados[S.creados.length - 1] : null;
    return { S, R, pl, G, paso, hastaQue, entrar, legendario };
  }

  // Solitario: la garantizada a su hora, su legendario con el 60 %, el vínculo; después una natural intacta.
  {
    const J1 = juego(), { S, R } = J1;
    J1.hastaQue(() => R.rift, 130);
    const g0 = R.rift, tAbre = S.time, d = g0 ? Math.hypot(g0.x - J1.pl.x, (g0.y - J1.pl.y) / 0.85) : 0;
    t('solitario: la grieta se abre a su hora (92,5 s con azar 0,5) a 380-560 px del jugador', g0 && tAbre >= 92.5 && tAbre < 92.5 + 2 * DT && d >= 380 && d <= 560,
      { t: tAbre, distancia: Math.round(d) });
    for (let i = 0; i < 60; i++) J1.paso();
    J1.entrar();
    const L1 = J1.legendario();
    t('solitario: su legendario sale con el 60 % de la vida que tendría sin el mod (arena marcada)', R.inArena && R.arena.forzada === 1 && L1 &&
      L1.e.maxHp === Math.round(vidaNormal(L1.t, 1) * 0.6) && L1.e.hp === L1.e.maxHp, L1 && { t: L1.t, vida: L1.e.maxHp, sinMod: vidaNormal(L1.t, 1) });
    L1.e.dead = true; J1.paso();
    const bonds = J1.pl.bonds;
    J1.hastaQue(() => !R.inArena, S.time + 10);
    const tFin = S.time;
    t('solitario: al vencerlo, vínculo (bonds 1) y la fusión se ofrece al volver', bonds === 1 && !R.inArena && S.vinculos === 1, { bonds, vinculos: S.vinculos });
    // Natural después: la tirada de cada 30 s empieza de nuevo al cerrarse la garantizada (si no, a los ~12,5 s).
    S.rnd = 0.1;
    J1.hastaQue(() => R.rift, tFin + 40);
    const g1 = R.rift, tNat = S.time;
    t('solitario: la siguiente natural sale 30 s después de volver de la arena (la tirada vuelve a empezar)', g1 && g1 !== g0 && tNat - tFin >= 30 - DT && tNat - tFin < 30 + 2 * DT,
      { vuelta: tFin, natural: tNat });
    J1.entrar();
    const L2 = J1.legendario();
    t('solitario: el legendario de una grieta natural posterior sale con su vida completa (arena sin marca)', R.inArena && R.arena.forzada === 0 && L2 && L2.e !== L1.e &&
      L2.e.maxHp === vidaNormal(L2.t, 1), L2 && { t: L2.t, vida: L2.e.maxHp, normal: vidaNormal(L2.t, 1) });
    L2.e.dead = true; J1.paso(); J1.hastaQue(() => !R.inArena, S.time + 10);
    S.rnd = 0.5;
    J1.hastaQue(() => false, 400);
    t('solitario: en toda la partida (400 s) sólo la garantizada y la natural; se pidió abrir una vez y nada marcó la partida como debug',
      S.grietas.length === 2 && S.pide === 1 && S.banderas.length === 0 && J1.pl.bonds === 2, { grietas: S.grietas.length, pide: S.pide, banderas: S.banderas });
  }
  // Solitario: una natural antes de la hora (hora 106,5 s; la tirada de los 105 s sale) -> no se fuerza.
  {
    const J2 = juego(), { S, R } = J2;
    S.rnd = 0.9; J2.paso(); S.rnd = 0.1;
    J2.hastaQue(() => R.rift, 130);
    const tNat = S.time;
    J2.entrar();
    const L = J2.legendario();
    L.e.dead = true; J2.paso(); J2.hastaQue(() => !R.inArena, S.time + 10);
    S.rnd = 0.5; J2.hastaQue(() => false, 130);
    t('solitario: si a los 105 s sale una natural (hora 106,5), no se fuerza ninguna; su legendario, entero',
      tNat >= 105 - DT && tNat < 105 + 2 * DT && S.grietas.length === 1 && S.pide === 0 && R.arena === null && L.e.maxHp === vidaNormal(L.t, 1), { natural: tNat, grietas: S.grietas.length });
  }
  // Grupo: el anfitrión la abre y la anuncia; el invitado no abre ninguna, la recibe en el mismo sitio, entra,
  // el anfitrión crea la arena marcada y su legendario (60 % de la vida de grupo); al vencerlo, los dos con vínculo.
  {
    const H = juego({ papel: 'anfitrion' }), I = juego({ papel: 'invitado' });
    const reparte = () => {
      for (const m of H.S.enviados.splice(0)) I.R.onEvent(m);
      for (const m of I.S.alHost.splice(0)) if (m[0] === 're') H.R.enterRequest();
    };
    const ambos = () => { H.paso(); I.paso(); reparte(); };
    let invitadoSolo = false;
    while (!H.R.rift && H.S.time < 130) { ambos(); if (I.R.rift && !H.R.rift) invitadoSolo = true; }
    const anuncio = H.S.grietas.length ? [Math.round(H.R.rift.x), Math.round(H.R.rift.y)] : null;
    ambos();
    t('grupo: el anfitrión abre la grieta a su hora y la anuncia; el invitado no abre ninguna y la recibe en las mismas x e y',
      anuncio && I.R.rift && I.R.rift.x === anuncio[0] && I.R.rift.y === anuncio[1] && !invitadoSolo && I.S.pide === 0 && H.S.pide === 1,
      { anfitrion: anuncio, invitado: I.R.rift && [I.R.rift.x, I.R.rift.y], pideInvitado: I.S.pide });
    for (let i = 0; i < 30; i++) ambos();
    I.entrar(); reparte(); ambos();
    const L = H.legendario();
    t('grupo: entra el invitado, la arena (marcada) es para los dos y el legendario lo crea sólo el anfitrión, con el 60 % de la vida de dos',
      H.R.inArena && I.R.inArena && H.R.arena.forzada === 1 && I.R.arena.forzada === 1 && I.S.creados.length === 0 && L &&
      L.e.maxHp === Math.round(vidaNormal(L.t, 2) * 0.6), L && { t: L.t, vida: L.e.maxHp, sinMod: vidaNormal(L.t, 2) });
    L.e.dead = true; ambos();
    t('grupo: al vencerlo, los dos tienen bonds === 1', H.pl.bonds === 1 && I.pl.bonds === 1, { anfitrion: H.pl.bonds, invitado: I.pl.bonds });
    while ((H.R.inArena || I.R.inArena) && H.S.time < 200) ambos();
    t('grupo: vuelven los dos y nada marca la partida como debug', !H.R.inArena && !I.R.inArena && !H.S.banderas.length && !I.S.banderas.length);
  }
  // Grupo: el invitado entra cuando en el anfitrión ya se ha cerrado (su reloj va algo por detrás).
  {
    const tarde = espera => {
      const H = juego({ papel: 'anfitrion' });
      H.hastaQue(() => H.R.rift, 130);
      const fin = H.S.time + 45 + espera;
      H.hastaQue(() => false, fin);
      const sinGrieta = !H.R.rift;
      H.R.enterRequest();
      const L = H.legendario();
      return { sinGrieta, forzada: H.R.arena && H.R.arena.forzada, vida: L && L.e.maxHp, normal: L && vidaNormal(L.t, 2) };
    };
    const t1 = tarde(1), t2 = tarde(8);
    t('grupo: si el invitado entra justo cuando en el anfitrión ya se cerró, sigue siendo la garantizada (hasta 5 s); más tarde, no',
      t1.sinGrieta && t1.forzada === 1 && t1.vida === Math.round(t1.normal * 0.6) && t2.sinGrieta && t2.forzada === 0 && t2.vida === t2.normal, { t1, t2 });
  }

  const failed = r.filter(x => !x[1]);
  if (!failed.length) ok(`grieta garantizada: ${r.length} casos bien`);
  for (const [name, , detail] of failed) bad(`grieta: ${name}${detail !== undefined ? ' · ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
}

// ---------------- 10. gacha y tickets ----------------
// Con el código real en node:vm: js/core/mods.js, trozos de js/game.js (bankTickets, syncTeam y la recogida de
// tickets, tal cual), js/systems/progress.js con las misiones y los logros reales, y el importador.
function gachaChecks() {
  console.log('10. Gacha y tickets (js/core/mods.js con el código real)');
  const r = [];
  const t = (name, cond, detail) => r.push([name, !!cond, detail]);
  const medidas = [];
  const nuevoMods = () => { const c = { console }; vm.createContext(c); c.G = {}; vm.runInContext(rd('js/core/mods.js'), c, { filename: 'js/core/mods.js' }); return c; };
  /** G.I18n.t real en inglés (i18n.js con lang-en.js y lang-en-mod.js), con un navegador mínimo. */
  function traductorIngles() {
    const c = { console, navigator: { language: 'en-US', languages: ['en-US'] }, location: { pathname: '/' },
      localStorage: { getItem: () => null, setItem() {} }, document: { documentElement: {} }, confirm: () => true, alert() {} };
    c.CanvasRenderingContext2D = function () {};
    c.CanvasRenderingContext2D.prototype = { fillText() {}, strokeText() {}, measureText() {} };
    c.window = c; c.G = {};
    vm.createContext(c);
    for (const f of ['js/core/i18n.js', 'js/data/lang-en.js', 'js/data/lang-en-mod.js']) vm.runInContext(rd(f), c, { filename: f });
    if (c.G.I18n.lang !== 'en') throw new Error('i18n.js no ha elegido inglés');
    return c.G.I18n.t;
  }
  const EN = traductorIngles();

  // ---- A. Tickets ganados ×ticketsMult ----
  {
    const M = nuevoMods().G.MODS;
    t('tickets: por defecto ×2 (entero)', M.ticketsMult === 2 && M.multTickets() === 2 && M.tickets(3) === 6 && M.tickets(0) === 0);
    const raros = [0, -2, NaN, 'x', Infinity, 0.5, 2.7].map(v => { M.ticketsMult = v; return M.multTickets(); });
    M.ticketsMult = 2;
    t('tickets: un ajuste no válido (0, negativo, NaN, texto, infinito, <1) vale 1; con decimales, la parte entera', raros.join() === '1,1,1,1,1,1,2', raros);
    const def = { t1: 3, t10: 1, coins: 150 }, antes = JSON.stringify(def), p = M.premio(def);
    t('premio(): una copia con los tickets ×2, las Pokémonedas igual y la definición intacta', p !== def && p.t1 === 6 && p.t10 === 2 && p.coins === 150 &&
      JSON.stringify(def) === antes, p);
    const soloMonedas = M.premio({ coins: 100 });
    t('premio(): sin tickets no inventa ninguno; null y undefined pasan', soloMonedas.coins === 100 && !('t1' in soloMonedas) && !('t10' in soloMonedas) &&
      M.premio(null) === null && M.premio(undefined) === undefined);
    M.ticketsMult = 1;
    t('premio() y textos con ticketsMult = 1: como el original', M.premio(def) === def && M.textoTicket('ticket') === '+1 ticket' && M.textoTicket('ticket10') === '¡Ticket ×10!');
    M.ticketsMult = 2;
    t('texto que flota con ×2: «+2 tickets» y «¡2 tickets ×10!»', M.textoTicket('ticket') === '+2 tickets' && M.textoTicket('ticket10') === '¡2 tickets ×10!');
    const en = ['+2 tickets', '¡2 tickets ×10!', '+1 ticket', '¡Ticket ×10!'].map(EN);
    t('texto que flota, en inglés (i18n.js real): «+2 tickets», «2 ×10 tickets!» y los del original', en.join('|') === '+2 tickets|2 ×10 tickets!|+1 ticket|Ticket ×10!', en);
  }

  // Trozos de js/game.js, tal cual: si upstream los cambia, esto falla y hay que revisarlo.
  const gsrc = rd('js/game.js');
  const trozo = (re, que) => { const m = gsrc.match(re); if (!m) throw new Error('no encuentro en js/game.js: ' + que); return m[0]; };
  const fBank = trozo(/  let banked = \{ t1: 0, t10: 0 \};\r?\n  function bankTickets\(save_ = true\) \{[\s\S]*?\r?\n  \}\r?\n/, 'bankTickets');
  const fSync = trozo(/    syncTeam\(t\) \{[\s\S]*?\r?\n    \},\r?\n/, 'coopApi.syncTeam');
  const fTicket = trozo(/    if \(p\.kind === 'ticket' \|\| p\.kind === 'ticket10'\) \{[\s\S]*?\r?\n      return;\r?\n    \}\r?\n/, 'la recogida de tickets (onCollect)');
  const fOver = trozo(/t1: G\.MODS && G\.MODS\.tickets \? G\.MODS\.tickets\(pl\.t1\) : pl\.t1, t10: G\.MODS && G\.MODS\.tickets \? G\.MODS\.tickets\(pl\.t10\) : pl\.t10,/, 'la pantalla final');
  /** Una partida con la partida guardada `t1`/`t10` y el ajuste `mult`. nueva() = startRun; final() = endRun. */
  function partida({ mult = 2, t1 = 10, t10 = 1 } = {}) {
    const c = nuevoMods(), G = c.G, S = { commits: 0, textos: [], sfx: [] };
    G.MODS.ticketsMult = mult;
    G.DB = { save: { tickets: { t1, t10 } }, commit: () => { S.commits++; } };
    G.Audio = { sfx: k => S.sfx.push(k) };
    G.FX = { dmgText: (x, y, txt) => S.textos.push(txt), ring() {} };
    vm.runInContext(`var __J = (() => {
      let pl = null, time = 0;
${fBank}
      const coopApi = {
${fSync}      };
      function recoge(p, who = pl) {
${fTicket}      }
      function final() { bankTickets(false); return { ${fOver} }; }
      return { nueva(p) { pl = p; banked = { t1: 0, t10: 0 }; }, bankTickets, coopApi, recoge, final, get pl() { return pl; } };
    })();`, c, { filename: 'js/game.js (trozos)' });
    const J = c.__J, sv = G.DB.save.tickets;
    const jugador = () => ({ t1: 0, t10: 0, x: 0, y: 0, bodyH: 30, level: 1, xp: 0, xpNext: 10, kills: 0, bosses: 0, coins: 0 });
    return { J, S, sv, G, jugador, equipo: tk => ({ time: 1, level: 1, xp: 0, xpNext: 10, kills: 0, bosses: 0, coins: 0, t1: tk[0], t10: tk[1] }) };
  }
  try {
    // Solitario o anfitrión.
    const P = partida();
    P.J.nueva(P.jugador());
    P.J.recoge({ kind: 'ticket' });
    const uno = { pl: P.J.pl.t1, sv: P.sv.t1, commits: P.S.commits };
    P.J.recoge({ kind: 'ticket' }); P.J.recoge({ kind: 'ticket10' });
    t('recogida: cada objeto sigue sumando 1 al contador de la partida (pl.t1++, lo que viaja por la red)', uno.pl === 1 && P.J.pl.t1 === 2 && P.J.pl.t10 === 1, P.J.pl);
    t('bankTickets: +2 en la partida guardada por cada ticket (y por cada ticket ×10), guardando al momento', uno.sv === 12 && uno.commits === 1 && P.sv.t1 === 14 && P.sv.t10 === 3,
      { primero: uno, t1: P.sv.t1, t10: P.sv.t10 });
    t('recogida: el texto que flota dice «+2 tickets» y «¡2 tickets ×10!»', P.S.textos.join('|') === '+2 tickets|+2 tickets|¡2 tickets ×10!', P.S.textos);
    const otra = P.J.bankTickets(), fin = P.J.final();
    t('al terminar no se cobra otra vez (bankTickets sin nada nuevo y endRun) y la pantalla final dice lo apuntado (+4 y +2 ×10)',
      P.sv.t1 === 14 && P.sv.t10 === 3 && fin.t1 === 4 && fin.t10 === 2 && otra === undefined, { t1: P.sv.t1, t10: P.sv.t10, fin });
    // Otra partida: el contador vuelve a 0 y no se apunta nada al empezar.
    P.J.nueva(P.jugador()); P.J.bankTickets();
    t('otra partida empieza sin apuntar nada', P.sv.t1 === 14 && P.sv.t10 === 3);
    // Invitado: el anfitrión manda el contador del equipo (tk) y cada uno lo apunta con SU ajuste.
    const B = partida({ mult: 2, t1: 0, t10: 0 }), B1 = partida({ mult: 1, t1: 0, t10: 0 });
    for (const X of [B, B1]) X.J.nueva(X.jugador());
    const pasos = [[1, 0], [1, 0], [3, 1], [2, 1], [4, 1]];   // [t1, t10] del equipo; el 4.º baja (no debería pasar)
    const visto = pasos.map(tk => { for (const X of [B, B1]) X.J.coopApi.syncTeam(X.equipo(tk)); return [B.sv.t1, B.sv.t10, B1.sv.t1, B1.sv.t10].join(','); });
    t('invitado (syncTeam): con ×2 apunta +2 por ticket del equipo; un dato repetido no suma y uno menor no resta', visto.join(' ') === '2,0,1,0 2,0,1,0 6,2,3,1 6,2,3,1 8,2,4,1', visto);
    const finB = B.J.final(), finB1 = B1.J.final();
    t('invitado: al terminar no se cobra otra vez; la pantalla final dice lo apuntado (×2: +8 y +2 ×10; ×1: +4 y +1)',
      B.sv.t1 === 8 && B.sv.t10 === 2 && finB.t1 === 8 && finB.t10 === 2 && B1.sv.t1 === 4 && finB1.t1 === 4 && finB1.t10 === 1, { finB, finB1 });
    // Con ticketsMult = 1: el original.
    const O = partida({ mult: 1 });
    O.J.nueva(O.jugador()); O.J.recoge({ kind: 'ticket' }); O.J.recoge({ kind: 'ticket10' });
    t('con ticketsMult = 1, como el original: +1 por ticket y los textos de siempre', O.sv.t1 === 11 && O.sv.t10 === 2 && O.S.textos.join('|') === '+1 ticket|¡Ticket ×10!', O.S.textos);
  } catch (e) { t('trozos de js/game.js en node:vm', false, String(e && e.stack || e)); }

  // Premios de misiones y logros: js/systems/progress.js con las definiciones reales.
  try {
    const c = { console, setTimeout: () => 0, clearTimeout() {}, performance: { now: () => 0 } };
    vm.createContext(c);
    c.window = c; c.G = {};
    c.document = { getElementById: () => null, createElement: () => ({ classList: { add() {}, remove() {} }, prepend() {} }), body: { appendChild() {} } };
    for (const f of ['js/core/util.js', 'js/core/mods.js', 'js/data/pokedex.js', 'js/data/sprites-meta.js', 'js/data/moves.js', 'js/data/types.js',
      'js/data/missions.js', 'js/data/achievements.js', 'js/systems/progress.js']) vm.runInContext(rd(f), c, { filename: f });
    const G = c.G;
    Object.assign(G, { Ranking: { periodIds: () => ({ d: 'd1', w: 'w1' }) }, Icons: { html: k => `[${k}]` }, Audio: { sfx() {} } });
    const defs = JSON.stringify([G.MissionDefs.daily, G.MissionDefs.weekly, G.AchDefs.LIST].map(l => l.map(d => d.reward)));
    const s = { coins: 0, tickets: { t1: 0, t10: 0 }, stats: {}, owned: {}, shiny: {}, created: 1 };
    s.ach = Object.fromEntries(G.AchDefs.LIST.map(a => [a.id, 1]));   // todos ya conseguidos: sólo cuenta lo que se prueba
    G.DB = { save: s, commit() {} };
    const surv = G.MissionDefs.BY.survive.reward;
    const m = { id: 'survive', goal: 5, param: null, prog: 5, claimed: false, told: true };
    const okClaim = G.Progress.claim(m);
    const tras = { t1: s.tickets.t1, t10: s.tickets.t10, coins: s.coins };
    t(`misión (premio ${JSON.stringify(surv)}): se recoge con los tickets ×2 y las Pokémonedas igual`, okClaim && tras.t1 === surv.t1 * 2 && tras.coins === surv.coins && tras.t10 === 0, tras);
    t('misión: recogerla otra vez no da nada', G.Progress.claim(m) === false && s.tickets.t1 === tras.t1 && s.coins === tras.coins);
    const A = id => G.AchDefs.LIST.find(a => a.id === id);
    delete s.ach.evo1; delete s.ach.evo25; delete s.ach.own1;
    s.stats.evolutions = 25; s.owned[1] = { at: 1, from: 'gacha' };
    G.Progress.checkAch();
    const logro = { t1: s.tickets.t1 - tras.t1, t10: s.tickets.t10 - tras.t10, coins: s.coins - tras.coins };
    const esperado = { t1: (A('evo1').reward.t1 || 0) * 2, t10: (A('evo25').reward.t10 || 0) * 2, coins: A('own1').reward.coins || 0 };
    t('logros (evo1, evo25 y own1): tickets y tickets ×10 ×2; las Pokémonedas igual', logro.t1 === esperado.t1 && logro.t10 === esperado.t10 && logro.coins === esperado.coins &&
      esperado.t1 > 0 && esperado.t10 > 0 && esperado.coins > 0, { logro, esperado });
    G.Progress.checkAch();
    t('logros: no se dan dos veces', s.tickets.t1 - tras.t1 === logro.t1 && s.tickets.t10 - tras.t10 === logro.t10);
    const txt = G.Progress.rewardText(surv), txt10 = G.Progress.rewardText(A('evo25').reward);
    t('rewardText enseña lo que se da (×2) y las monedas igual', txt === `[ticket] ${surv.t1 * 2} &nbsp;<span class="coin"></span> ${surv.coins}` && txt10 === `[ticket10] ${A('evo25').reward.t10 * 2} ×10`, [txt, txt10]);
    t('las definiciones de misiones y logros no cambian', JSON.stringify([G.MissionDefs.daily, G.MissionDefs.weekly, G.AchDefs.LIST].map(l => l.map(d => d.reward))) === defs);
  } catch (e) { t('js/systems/progress.js en node:vm', false, String(e && e.stack || e)); }

  // Traer la partida oficial no es ganar: suma lo que tenía allí una vez, sin multiplicar, y la segunda vez nada.
  try {
    const c = loadImporter();
    vm.runInContext(rd('js/core/mods.js'), c, { filename: 'js/core/mods.js' });
    const G = c.G, AHORA = Date.UTC(2026, 9, 12);
    const mia = G.DB.newSave('Nico'); mia.created = Date.UTC(2026, 8, 1); mia.tickets = { t1: 5, t10: 0 };
    const of = G.DB.newSave('Oficial'); of.created = Date.UTC(2026, 3, 1); of.tickets = { t1: 9, t10: 2 };
    const x = G.Importar.analizar(JSON.stringify({ tipo: G.Importar.TIPO, version: 1, origen: 'pruebas', exportado: AHORA, save: of }), AHORA);
    const r1 = G.Importar.fusionar(mia, x.save, AHORA), r2 = G.Importar.fusionar(r1, x.save, AHORA);
    t('traer la partida oficial (con ticketsMult = 2): +9 y +2 ×10 una vez, sin multiplicar; la segunda vez, nada',
      x.ok && G.MODS.ticketsMult === 2 && r1.tickets.t1 === 14 && r1.tickets.t10 === 2 && r2.tickets.t1 === 14 && r2.tickets.t10 === 2, { r1: r1.tickets, r2: r2.tickets });
  } catch (e) { t('importador con mods.js', false, String(e && e.stack || e)); }

  // ---- B. Shiny ×shinyMult ----
  /** Azar reproducible (mulberry32). */
  const semilla = s => () => { s = s + 0x6D2B79F5 | 0; let x = Math.imul(s ^ s >>> 15, 1 | s); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
  /** El gacha real (y lo que le haga falta) con Math.random controlado: primero `R.cola`, luego `R.gen`. */
  function gacha(extra = []) {
    const c = { console };
    vm.createContext(c);
    c.window = c; c.G = {};
    for (const f of ['js/core/util.js', 'js/core/mods.js', 'js/data/pokedex.js', 'js/data/sprites-meta.js', ...extra, 'js/core/sprites.js', 'js/systems/gacha.js'])
      vm.runInContext(rd(f), c, { filename: f });
    const R = { cola: [], gen: semilla(1) };
    c.__rnd = () => (R.cola.length ? R.cola.shift() : R.gen());
    vm.runInContext('Math.random = () => __rnd()', c);
    return { c, G: c.G, R };
  }
  const trozoDe = (f, re, que) => { const m = rd(f).match(re); if (!m) throw new Error(`no encuentro en ${f}: ${que}`); return m[0]; };
  /** El cartel de probabilidades que pinta el refresh() real de js/ui/gacha-ui.js, con un DOM mínimo. */
  function cartelGacha({ mult = 1.5, evo = true, repetidos = true } = {}) {
    const { c, G } = gacha(evo ? ['js/data/evolutions.js'] : []);
    G.MODS.shinyMult = mult; G.MODS.repetidoDaEvolucion = repetidos;
    const els = {};
    const el = id => els[id] || (els[id] = { id, innerHTML: '', textContent: '', disabled: false, style: {}, classList: { toggle() {}, add() {}, remove() {} }, appendChild() {} });
    G.UI = { $: el, show() {}, stars: () => '*', spriteCanvas: () => ({}), refreshCoins() {} };
    G.Icons = { html: k => `[${k}]` };
    G.DB = { save: { owned: {}, shiny: {}, pity: {}, tickets: { t1: 0, t10: 0 } } };
    c.document = { querySelectorAll: () => [] };
    vm.runInContext(rd('js/ui/gacha-ui.js'), c, { filename: 'js/ui/gacha-ui.js' });
    G.GachaUI.open();
    return els['gacha-rates'].innerHTML;
  }
  try {
    const M = nuevoMods().G.MODS;
    const p = [1 / 4096, 1 / 512, 1 / 100].map(x => M.probShiny(x));
    t('shiny: por defecto ×1,5 (1/4096 -> 1/2731, 1/512 -> 1/341, 1 % -> 1,5 %), nunca más de 1', M.shinyMult === 1.5 && Math.abs(p[0] - 1.5 / 4096) < 1e-15 &&
      Math.abs(p[1] - 1.5 / 512) < 1e-15 && Math.abs(p[2] - 0.015) < 1e-15 && M.probShiny(0.9) === 1, p);
    const raros = [0, -1, NaN, 'x', Infinity].map(v => { M.shinyMult = v; return M.probShiny(0.01); });
    M.shinyMult = 1;
    t('shiny: con un ajuste no válido o con 1, la del original', raros.every(x => x === 0.01) && M.probShiny(0.01) === 0.01, raros);
    // Gacha real, 100.000 tiradas sembradas en los 9 banners: proporción de shiny entre los que tienen sprite shiny.
    const tasa = (mult, s, n = 100000) => {
      const { G, R } = gacha();
      R.gen = semilla(s); G.MODS.shinyMult = mult;
      const save = { tickets: { t1: n, t10: 0 }, owned: {}, shiny: {}, coins: 0, stats: {}, pity: {} };
      let sh = 0, con = 0;
      for (let i = 0; i < n / 10; i++) for (const x of G.Gacha.pull(save, 10, 1 + (i % 9))) if (G.Sprites.hasShiny(x.dex)) { con++; if (x.shiny) sh++; }
      return +(sh / con * 100).toFixed(3);
    };
    const g15 = tasa(1.5, 7), g1 = tasa(1, 8);
    medidas.push(`gacha ${g15} % (con 1: ${g1} %)`);
    t(`gacha real con shinyMult 1,5: ${g15} % de shiny en 100.000 tiradas (1,35-1,65 %); con 1: ${g1} % (0,85-1,15 %)`, g15 >= 1.35 && g15 <= 1.65 && g1 >= 0.85 && g1 <= 1.15, { g15, g1 });
    // Salvajes y jefes: rollShiny de js/systems/spawner.js, tal cual.
    const fRoll = trozoDe('js/systems/spawner.js', /  function rollShiny\(dex\) \{[\s\S]*?\r?\n  \}\r?\n/, 'rollShiny');
    const fRate = trozoDe('js/systems/spawner.js', /const SHINY_RATE = [^;\n]+;/, 'SHINY_RATE');
    const salvaje = (mult, s, n) => {
      const { c, G, R } = gacha();
      R.gen = semilla(s); G.MODS.shinyMult = mult; G.Sprites.hasShiny = () => true;
      vm.runInContext(`var __roll = (() => { let forceShiny = 0; ${fRate}\n${fRoll}\n return rollShiny; })();`, c, { filename: 'js/systems/spawner.js (rollShiny)' });
      let k = 0;
      for (let i = 0; i < n; i++) if (c.__roll(1)) k++;
      return +(k / n * 4096).toFixed(3);
    };
    const s15 = salvaje(1.5, 11, 2e6), s1 = salvaje(1, 12, 2e6);
    medidas.push(`salvajes ×${s15} (con 1: ×${s1})`);
    t(`salvajes y jefes (rollShiny real): ${s15} veces 1/4096 con 1,5 (1,35-1,65); con 1, ${s1} (0,85-1,15)`, s15 >= 1.35 && s15 <= 1.65 && s1 >= 0.85 && s1 <= 1.15, { s15, s1 });
    // Legendario de la grieta: la línea de start() en js/systems/rift.js, tal cual.
    const fLeg = trozoDe('js/systems/rift.js', /dex: mon\.dex, shiny: G\.Sprites\.hasShiny\(mon\.dex\) && Math\.random\(\) < [^\n]*?,(?=\s*\/\/)/, 'el shiny del legendario');
    const grieta = (mult, s, n) => {
      const { c, G, R } = gacha();
      R.gen = semilla(s); G.MODS.shinyMult = mult; G.Sprites.hasShiny = () => true;
      vm.runInContext(`var __leg = mon => ({ ${fLeg} });`, c, { filename: 'js/systems/rift.js (start)' });
      let k = 0;
      for (let i = 0; i < n; i++) if (c.__leg({ dex: 150 }).shiny) k++;
      return +(k / n * 512).toFixed(3);
    };
    const r15 = grieta(1.5, 21, 4e5), r1 = grieta(1, 22, 4e5);
    medidas.push(`grieta ×${r15} (con 1: ×${r1})`);
    t(`legendario de la grieta (start() real): ${r15} veces 1/512 con 1,5 (1,35-1,65); con 1, ${r1} (0,85-1,15)`, r15 >= 1.35 && r15 <= 1.65 && r1 >= 0.85 && r1 <= 1.15, { r15, r1 });
    // Cartel del gacha: refresh() real de js/ui/gacha-ui.js con un DOM mínimo.
    const c15 = cartelGacha({ mult: 1.5 }), c1 = cartelGacha({ mult: 1 });
    t('cartel del gacha (refresh() real): «1.5%» de shiny con 1,5 y «1%» con 1, como el original', /\[shiny\] Shiny<\/span><span>1\.5%<\/span>/.test(c15) && !c15.includes('<span>1%</span>') &&
      /\[shiny\] Shiny<\/span><span>1%<\/span>/.test(c1), c15.slice(c15.indexOf('[shiny]'), c15.indexOf('[shiny]') + 60));
  } catch (e) { t('shiny con el código real', false, String(e && e.stack || e)); }

  // ---- C. Repetido -> su evolución (js/data/evolutions.js y pull() real con las tiradas guionizadas) ----
  try {
    const { G } = gacha(['js/data/evolutions.js']);
    const E = G.EVO, enJuego = d => !!(G.DEX_BY[d] && G.SPRITE_META[d]);
    const padres = Object.keys(E).map(Number), hijos = padres.flatMap(p => E[p]);
    const malos = padres.filter(p => !enJuego(p) || !Array.isArray(E[p]) || !E[p].length || E[p].some(h => !enJuego(h) || h === p) || new Set(E[p]).size !== E[p].length);
    let ciclo = null;
    for (const p of padres) {
      const pila = [[p, [p]]];
      while (pila.length && !ciclo) { const [n, cam] = pila.pop(); for (const h of E[n] || []) { if (cam.includes(h)) ciclo = [...cam, h]; else pila.push([h, [...cam, h]]); } }
    }
    const conDosPadres = hijos.filter((h, i) => hijos.indexOf(h) !== i);
    t(`evolutions.js: ${padres.length} especies con evolución y ${hijos.length} evoluciones, todas del juego (G.DEX_BY con G.SPRITE_META), sin ciclos ni hijos con dos padres`,
      padres.length > 400 && !malos.length && !ciclo && !conDosPadres.length, { malos, ciclo, conDosPadres });
    t('evolutions.js: Eevee con sus 8, Tyrogue con 3, Pidove -> Unfezant (sin Tranquill, que no está en el juego) y Meowth -> Persian y Perrserker (forma regional)',
      E[133].join() === '134,135,136,196,197,470,471,700' && E[236].join() === '106,107,237' && E[519].join() === '521' && !enJuego(520) && E[52].join() === '53,863',
      { 133: E[133], 236: E[236], 519: E[519], 52: E[52] });
  } catch (e) { t('datos de js/data/evolutions.js', false, String(e && e.stack || e)); }
  try {
    const { G, R } = gacha(['js/data/evolutions.js']);
    const RE = G.Gacha.REFUND;
    // Valores de Math.random para que la tirada sea `dex` (normal o shiny) en su banner y, si hay que elegir rama, `rama`.
    const BANDA = [0, 45, 75, 92, 98.5, 100];
    const guion = (dex, shiny = false, rama) => {
      const p = G.DEX_BY[dex], lista = G.Gacha.pool(p.rarity, p.gen), i = lista.findIndex(x => x.dex === dex);
      if (i < 0) throw new Error('no está en su banner: ' + dex);
      const v = [(BANDA[p.rarity - 1] + BANDA[p.rarity]) / 200, (i + 0.5) / lista.length];
      if (G.Sprites.hasShiny(dex)) v.push(shiny ? 0 : 0.999);
      if (rama !== undefined) v.push(rama);
      return v;
    };
    const partida = (owned = [], shinies = [], coins = 1000) => ({ coins, tickets: { t1: 500, t10: 0 }, stats: {}, pity: {},
      owned: Object.fromEntries(owned.map(d => [d, { at: 1, from: 'gacha' }])), shiny: Object.fromEntries(shinies.map(d => [d, { at: 1, from: 'gacha' }])) });
    /** Tira `n` en el banner del primero, con el guion de cada [dex, shiny?, rama?]; falla si sobra algún valor del guion. */
    const tira = (save, dexes, n = dexes.length) => {
      R.cola = dexes.flatMap(x => guion(...x));
      const res = G.Gacha.pull(save, n, G.DEX_BY[dexes[0][0]].gen);
      const sobran = R.cola.length;
      R.cola = [];
      if (sobran) throw new Error(`sobran ${sobran} valores del guion`);
      return res;
    };
    const res1 = (s, ...x) => tira(s, [x])[0];
    t('por defecto: repetidoDaEvolucion = true', G.MODS.repetidoDaEvolucion === true);
    // Bulbasaur repetido.
    let s = partida([1]);
    let x = res1(s, 1);
    t('repetido de Bulbasaur sin Ivysaur: desbloquea Ivysaur (from evo), 0 monedas, gasta su ticket',
      x.dex === 1 && !x.isNew && x.evo === 2 && x.refund === 0 && s.coins === 1000 && s.owned[2] && s.owned[2].from === 'evo' && s.tickets.t1 === 499 && !s.shiny[2], x);
    x = res1(s, 1);
    t(`repetido de Bulbasaur con Ivysaur: las monedas del original (${RE[1]}) y no desbloquea Venusaur`, !x.evo && x.refund === RE[1] && s.coins === 1000 + RE[1] && !s.owned[3], x);
    // Eevee: 8 repetidos -> sus 8 evoluciones, cada una entre las que faltan; el noveno, monedas.
    s = partida([133]);
    const vistas = [];
    let soloFaltan = true;
    for (const v of [0, 0.999, 0.5, 0.3, 0.999, 0, 0.7, 0.2]) {
      const antes = new Set(Object.keys(s.owned).map(Number));
      const quedan = G.EVO[133].filter(d => !s.owned[d]).length;   // con una sola, no se sortea
      const y = tira(s, [quedan > 1 ? [133, false, v] : [133]])[0];
      if (!y.evo || antes.has(y.evo) || !G.EVO[133].includes(y.evo)) soloFaltan = false;
      vistas.push(y.evo);
    }
    const y9 = res1(s, 133), ER = G.DEX_BY[133].rarity;
    t('Eevee: 8 repetidos dan sus 8 evoluciones distintas, cada una de las que faltaban; el noveno da monedas', soloFaltan && new Set(vistas).size === 8 &&
      vistas.slice().sort((a, b) => a - b).join() === G.EVO[133].join() && !y9.evo && y9.refund === RE[ER] && vistas.every(d => s.owned[d].from === 'evo'), { vistas, noveno: y9 });
    // Shiny.
    s = partida([1], [1]);
    x = res1(s, 1, true);
    t('shiny repetido (ya tenías el shiny de Bulbasaur): desbloquea Ivysaur en shiny (y en normal), 0 monedas', x.shiny && !x.isNew && x.evo === 2 && x.refund === 0 &&
      s.shiny[2] && s.shiny[2].from === 'evo' && s.owned[2] && s.owned[2].from === 'evo' && s.coins === 1000, x);
    s = partida([1, 2], [1]);
    x = res1(s, 1, true);
    t('shiny repetido con Ivysaur normal pero sin su shiny: da el shiny de Ivysaur (la normal se queda como estaba)', x.evo === 2 && s.shiny[2].from === 'evo' && s.owned[2].from === 'gacha', x);
    s = partida([1, 2], [1, 2]);
    x = res1(s, 1, true);
    t(`shiny repetido con el shiny de Ivysaur: el triple del original (${RE[1] * 3}) y nada de Venusaur`, !x.evo && x.refund === RE[1] * 3 && !s.owned[3] && !s.shiny[3], x);
    s = partida([1]);
    x = res1(s, 1, true);
    t('shiny NUEVO de Bulbasaur con la normal ya tenida: es nuevo (no repetido), sin evolución ni monedas', x.shiny && x.isNew && !x.evo && x.refund === 0 && s.shiny[1].from === 'gacha' && !s.owned[2], x);
    // Evolución sin sprite shiny (Skwovet -> Greedent): el shiny repetido no se rebaja a un desbloqueo normal.
    const sinSh = [...new Set(Object.values(G.EVO).flat())].filter(d => !G.Sprites.hasShiny(d)).sort((a, b) => a - b);
    s = partida([819], [819]);
    x = res1(s, 819, true);
    const sN = partida([819]), xN = res1(sN, 819);
    t(`evoluciones sin sprite shiny (${sinSh.join(', ')}): un shiny repetido de Skwovet da el triple; uno normal sí desbloquea Greedent`,
      sinSh.join() === '820,847,916,933' && G.Sprites.hasShiny(819) && !x.evo && x.refund === RE[G.DEX_BY[819].rarity] * 3 && !s.owned[820] && xN.evo === 820 && !sN.shiny[820], { x, xN });
    // Orden en la ×10: lo desbloqueado en una tirada cuenta para las siguientes. Con el mod apagado, mismas rarezas y mismo pity.
    const seq = [[1], [1], [2], [3], [4], [5], [7], [7], [133], [133, false, 0.5]];
    const orden = on => {
      G.MODS.repetidoDaEvolucion = on;
      const sv = partida([1, 4]), res = tira(sv, on ? seq : seq.map(z => z.slice(0, 2)), 10);
      G.MODS.repetidoDaEvolucion = true;
      return { sv, res };
    };
    const A = orden(true), B = orden(false);
    const resumen = A.res.map(z => (z.isNew ? 'nuevo' : z.evo ? 'evo' + z.evo : '+' + z.refund));
    t('×10 en orden: Bulbasaur -> Ivysaur, Bulbasaur otra vez -> monedas, Ivysaur (desbloqueado en esta ×10) -> Venusaur, Venusaur -> monedas...; pity y rarezas como sin el mod',
      resumen.slice(0, 9).join() === `evo2,+${RE[1]},evo3,+${RE[G.DEX_BY[3].rarity]},evo5,evo6,nuevo,evo8,nuevo` && G.EVO[133].includes(A.res[9].evo) &&
      A.sv.pity[1] === 10 && B.sv.pity[1] === 10 && A.res.map(z => z.rarity).join() === B.res.map(z => z.rarity).join() && A.sv.stats.pulls === 10 &&
      B.res.every(z => !z.evo) && A.sv.coins === 1000 + RE[1] + RE[G.DEX_BY[3].rarity] && B.sv.coins === 1000 + B.res.reduce((k, z) => k + z.refund, 0),
      { resumen, sinMod: B.res.map(z => (z.isNew ? 'nuevo' : '+' + z.refund)) });
    // Ramas sólo entre las que faltan y nada fuera del juego (520, Tranquill, no está; 99999 no existe).
    const E1 = G.EVO[1];
    G.EVO[1] = [520, 2, 99999];
    const fuera = [0, 0.3, 0.6, 0.9999999].map(v => { R.cola = [v]; const d = G.MODS.evolucionDeRepetido(partida([1]), 1, false); R.cola = []; return d; });
    G.EVO[1] = E1;
    const tyro = [0, 0.5, 0.999].map(v => { R.cola = [v]; const d = G.MODS.evolucionDeRepetido(partida([236, 106, 237]), 236, false); R.cola = []; return d; });
    t('ramas: sólo entre las que faltan (Tyrogue con Hitmonlee y Hitmontop: siempre Hitmonchan) y nunca una especie que no está en el juego',
      fuera.every(d => d === 2) && tyro.every(d => d === 107), { fuera, tyro });
    // Sin G.EVO o con el ajuste en false: el original.
    const EVO = G.EVO;
    delete G.EVO;
    s = partida([1]); x = res1(s, 1);
    G.EVO = EVO; G.MODS.repetidoDaEvolucion = false;
    const s2 = partida([1]), x2 = res1(s2, 1);
    G.MODS.repetidoDaEvolucion = true;
    t('sin js/data/evolutions.js (G.EVO) o con repetidoDaEvolucion = false: monedas como el original', !x.evo && x.refund === RE[1] && !s.owned[2] && !x2.evo && x2.refund === RE[1] && !s2.owned[2]);
  } catch (e) { t('pull() real con las evoluciones', false, String(e && e.stack || e)); }
  // La carta, el inglés y el cartel.
  try {
    const { c, G } = gacha(['js/data/evolutions.js']);
    c.document = { createElement: tag => ({ tag, className: '', textContent: '' }) };
    G.UI = { spriteCanvas: (dex, w, h, o) => ({ tag: 'canvas', dex, w, h, o, style: {} }) };
    const carta = () => { const tag = { textContent: 'Repetido · +0', hijos: [], appendChild(n) { this.hijos.push(n); } }; return { tag, querySelector: q => (q === '.tag' ? tag : null) }; };
    const k1 = carta(), k2 = carta();
    G.MODS.marcarEvolucion(k1, { dex: 1, evo: 2, shiny: false });
    G.MODS.marcarEvolucion(k2, { dex: 439, evo: 122, shiny: true });
    const [a, b] = [k1.tag.hijos, k2.tag.hijos];
    t('carta: «¡Repetido! Desbloqueas Ivysaur» (y «… Mr. Mime shiny») en dorado y la evolución en pequeño (40x40, shiny si lo es)',
      k1.tag.textContent === '' && a.length === 2 && a[0].className === 'new' && a[0].textContent === '¡Repetido! Desbloqueas Ivysaur' && a[1].dex === 2 && a[1].w === 40 &&
      a[1].o.shiny === false && /width:40px/.test(a[1].style.cssText) && b[0].textContent === '¡Repetido! Desbloqueas Mr. Mime shiny' && b[1].o.shiny === true, [a, b]);
    const en = ['¡Repetido! Desbloqueas Ivysaur', '¡Repetido! Desbloqueas Mr. Mime shiny', G.MODS.NOTA_REPETIDOS].map(EN);
    t('inglés (i18n.js real): «Duplicate! You unlock Ivysaur», «… shiny Mr. Mime» y la nota del cartel', en[0] === 'Duplicate! You unlock Ivysaur' &&
      en[1] === 'Duplicate! You unlock shiny Mr. Mime' && /^· A duplicate unlocks its next evolution/.test(en[2]), en);
    const VIEJA = '· Los repetidos dan Pokémonedas (los shiny repetidos, el triple).';
    const h1 = cartelGacha(), h2 = cartelGacha({ repetidos: false }), h3 = cartelGacha({ evo: false });
    t('cartel del gacha (refresh() real): la nota de los repetidos habla de la evolución; con el ajuste en false o sin G.EVO, la del original',
      h1.includes(G.MODS.NOTA_REPETIDOS) && !h1.includes(VIEJA) && h2.includes(VIEJA) && h3.includes(VIEJA) && !h3.includes(G.MODS.NOTA_REPETIDOS));
  } catch (e) { t('la carta y el cartel del gacha', false, String(e && e.stack || e)); }

  const failed = r.filter(x => !x[1]);
  if (!failed.length) ok(`gacha y tickets: ${r.length} casos bien` + (medidas.length ? ` (shiny: ${medidas.join(', ')})` : ''));
  for (const [name, , detail] of failed) bad(`gacha: ${name}${detail !== undefined ? ' · ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
}

importChecks().catch(e => bad('no se pudo probar el importador: ' + (e && e.stack || e))).then(() => {
  try { grietaChecks(); } catch (e) { bad('no se pudo probar la grieta garantizada: ' + (e && e.stack || e)); }
  try { gachaChecks(); } catch (e) { bad('no se pudo probar el gacha y los tickets: ' + (e && e.stack || e)); }
  console.log(fails ? `\nRESULTADO: ${fails} fallo(s), ${warns} aviso(s)` : `\nRESULTADO: todo bien (${warns} aviso(s))`);
  process.exit(fails ? 1 : 0);
});
