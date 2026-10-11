/* ============ tools/nico/check.js — comprobación rápida del fork (sin navegador) ============
 *   node tools/nico/check.js            (desde la raíz del repo o desde tools/nico)
 *
 * Pasarlo SIEMPRE tras `git merge upstream/main` y antes de publicar. Comprueba:
 *   1. Higiene de fork: nada del Firebase/TURN/dominio del original en lo que se sirve,
 *      y que no han vuelto CNAME, robots.txt, sitemap.xml, en/, las páginas SEO, etc.
 *   2. index.html: noindex, sin SEO del original, y que su ?v= coincide con js/app.min.js.
 *   3. Que el paquete js/app.min.js está al día con las fuentes (lo reconstruye en una
 *      carpeta temporal con los mismos parámetros que tools/build.js y compara).
 *   4. Que siguen los ganchos "// MOD nico" y js/core/mods.js se carga en dev.html.
 *   5. Curación: simula 2.000 runs con el código real (node:vm) y exige 0 curanderos,
 *      y que con curacionEnemiga=true sí salgan (control: la prueba sabe detectarlos).
 *   6. Tamaño: escala de los 966 Pokémon con el código real; normales intactos.
 *   7. Busca en el código de enemigos/red asignaciones de vida nuevas (posible curación
 *      nueva de upstream) que no estén en la lista de conocidas.
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
  [/firebasedatabase\.app|firebaseio\.com/i, 'URL de una Realtime Database en la nube (debe venir de la config propia)'],
  [/ko-fi\.com\/jpter78|kofi:\s*'jpter78'/i, 'Ko-fi del original']
];
let hits = 0;
for (const f of SERVED) {
  const s = rd(f);
  for (const [re, what] of FORBIDDEN) if (re.test(s)) { hits++; bad(`${f}: ${what} (${re})`); }
}
if (!hits) ok(`${SERVED.length} ficheros servidos sin referencias a la infraestructura del original`);
const GONE = ['CNAME', 'robots.txt', 'sitemap.xml', 'en', 'guia', 'pokedex', 'legendarios', 'shinies', 'tipos', 'movimientos',
  'objetos', 'logros', 'novedades', 'apoyar', 'functions', 'tools/activar_dominio.sh', '.github/FUNDING.yml'];
const back = GONE.filter(ex);
if (back.length) bad(`han vuelto (seguramente por un merge de upstream): ${back.join(', ')}. Quitar con: git rm -r ${back.join(' ')}`);
else ok('sin CNAME, robots.txt, sitemap.xml, en/, páginas SEO, functions/ ni activar_dominio.sh');
if (/(href|src)="\//.test(rd('404.html'))) bad('404.html vuelve a tener rutas absolutas (no sirve en una subruta de GitHub Pages): ¿se ejecutó make_seo_pages.py?');
else ok('404.html sin rutas absolutas (vale en subruta)');
if (/"default"\s*:\s*"demo-ps"/.test(rd('.firebaserc'))) ok('.firebaserc apunta a demo-ps'); else bad('.firebaserc no apunta a demo-ps');
if (/"functions"/.test(rd('firebase.json'))) bad('firebase.json vuelve a tener el bloque functions'); else ok('firebase.json sin functions');
if (/^G\.FIREBASE_CONFIG = null;/m.test(rd('js/core/firebase-config.js'))) ok('firebase-config.js en null (modo local) con interruptor ?emu');
else warn('firebase-config.js no está en null: comprueba que es el proyecto PROPIO');

// ---------------- 2-3. index.html y paquete ----------------
console.log('2. index.html y js/app.min.js');
const idx = rd('index.html');
if (/<meta name="robots" content="noindex">/.test(idx)) ok('index.html lleva noindex'); else bad('index.html sin noindex: construir con node tools/build.js --privado');
if (/pokesurvivor\.com/i.test(idx) || /rel="canonical"/.test(idx)) bad('index.html conserva SEO del original (canonical/og): construir con --privado');
else ok('index.html sin canonical ni enlaces al dominio del original');
const min = fs.readFileSync(path.join(ROOT, 'js/app.min.js'));
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
  ['js/core/db.js', /\/jpter\/i\.test\(/, 'db.js rechaza el proyecto del original']
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

// ---------------- 7. asignaciones de vida en el código de enemigos ----------------
console.log('6. Vías de vida de enemigos (detección de curaciones nuevas de upstream)');
const KNOWN = new Set([
  'js/entities/enemy.js|this.hp = this.maxHp;',                                   // constructor (enemigo nuevo)
  'js/entities/enemy.js|this.maxHp *= 2; this.hp = this.maxHp;',                  // makeShiny (sólo enemigos nuevos)
  'js/entities/enemy.js|this.hp = Math.max(1, this.hp - d);',                     // golpe predicho en el invitado
  'js/entities/enemy.js|e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.07);',        // healAround (bloqueado por el gancho B)
  'js/net/coop.js|e.hp = Math.min(e.maxHp, a[3]);',                               // sincronización del invitado
  'js/systems/interact.js|pl.hp = Math.min(pl.maxHp, pl.hp + pl.maxHp * 0.14 * dt);', // manantial: cura al JUGADOR
  'js/entities/enemy.js|if (this.pt <= 0) { this.hp = 0; this.die(); }',          // mecha del bomber: muere
  'js/entities/enemy.js|e.maxHp = o.hp; e.hp = o.hp;',                            // copia nueva en el invitado ('ne')
  "js/data/enemies.js|if (behavior === 'bomber') { d.spd = Math.round(d.spd * 1.25); d.hp = Math.round(d.hp * 0.8); }", // definición, no instancia
  "js/data/enemies.js|if (r) { r.behavior = 'runner'; r.spd = Math.round(r.spd * 1.6); r.hp = Math.round(r.hp * 0.7); }", // definición
  'js/systems/spawner.js|if (G.EnemyMgr.count >= CAP * ELITE_FROM) { e.maxHp = e.hp = Math.round(e.maxHp * 1.6); e.dmg *= 1.25; e.xp = Math.round(e.xp * 1.6); }' // élite, antes de add
]);
const SCAN = ['js/entities/enemy.js', 'js/net/coop.js', 'js/data/enemies.js', ...walk('js/systems').filter(f => f.endsWith('.js'))];
let unknown = 0;
for (const f of SCAN) rd(f).split(/\r?\n/).forEach((line, n) => {
  if (!/\.hp\s*(\+=|=(?!=))/.test(line)) return;
  const key = f + '|' + line.trim().replace(/\s*\/\/.*$/, '');
  if (!KNOWN.has(key)) { unknown++; warn(`${f}:${n + 1} asignación de vida no revisada: ${line.trim()}`); }
});
if (!unknown) ok('sin asignaciones de vida nuevas en enemigos, sistemas y red');
else warn('revisa si alguna de esas líneas puede subir la vida de un enemigo; si no, añádela a KNOWN en tools/nico/check.js');

console.log(fails ? `\nRESULTADO: ${fails} fallo(s), ${warns} aviso(s)` : `\nRESULTADO: todo bien (${warns} aviso(s))`);
process.exit(fails ? 1 : 0);
