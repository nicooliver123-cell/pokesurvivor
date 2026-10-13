/* ============ tools/nico/check.js — comprobación rápida del fork (sin navegador) ============
 *   node tools/nico/check.js            (desde la raíz del repo o desde tools/nico)
 *
 * Pasarlo SIEMPRE tras `git merge upstream/main` y antes de publicar. Comprueba:
 *   1. Higiene de fork: nada del Firebase/TURN/dominio/correo del proyecto base en lo que se
 *      sirve; que no han vuelto CNAME, robots.txt, sitemap.xml, en/, las páginas SEO, etc.;
 *      y Firebase: la config publicada es null o de un proyecto de la lista blanca
 *      (G.FIREBASE_PROYECTOS en js/core/firebase-config.js), igual que toda URL de
 *      Firebase en la nube que aparezca en lo servido. Y nada de lo publicado (todo el
 *      repositorio salvo LICENSE, que conserva el aviso MIT) nombra el proyecto base: su nombre,
 *      su autor, su dominio, su Firebase, su apiKey ni su correo (en base64 en tools/nico/base.js).
 *   2. index.html y dev.html (también se publica): noindex, sin SEO del proyecto base, sin
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
 *      (anfitrión e invitado): el legendario de esa grieta con el 60 % y las naturales intactas. Y la
 *      vuelta en grupo con js/net/coop.js real y la red simulada: el invitado vuelve con el anfitrión
 *      ('af') y conserva las copias de los enemigos del mapa; fusiones y aviso «Pausa: …» sin tu nombre.
 *  10. Gacha y tickets: tickets ganados ×2 (bankTickets, syncTeam y la recogida de game.js, los
 *      premios de progress.js; sin cobro doble, sin restas, sin tocar las definiciones ni traer dos
 *      veces la partida oficial) y shiny ×1,5 (el gacha real sembrado, rollShiny de spawner.js y la línea
 *      del legendario de rift.js tal cual, y el cartel del gacha con el refresh() real de gacha-ui.js) y
 *      repetido -> su evolución (js/data/evolutions.js sin ciclos y sólo con especies del juego; pull() real
 *      con las tiradas guionizadas: Bulbasaur, Eevee, shiny, ×10 en orden, ramas; la carta y el inglés).
 *      La grieta: también la primera natural antes del límite lleva el 60 % (las posteriores, enteras).
 *      Avisos de logro: los de una tirada esperan a que cierres el resultado (progress.js real).
 *  11. Claridad en partida (js/entities/claridad.js con fx.js, enemy.js y mods.js reales): números de daño
 *      sumados por enemigo (también el invitado; el escudo aparte, a la derecha sin tocarlo), su vida y su
 *      subida sin depender de los FPS; barras de vida sólo 1,5 s tras un cambio (y quién las conserva); qué
 *      tapa a tu Pokémon (también lo alto con los pies lejos y lo que salta), el contorno a escala, el aro, el chevrón y los
 *      compañeros; el borde rojo (golpe, vida baja, «menos sacudidas»). Y que lo que copia de upstream sigue
 *      igual: disparoHostil() frente a G.VFX.draw (vfx.js real) y a la llamada de projectile.js, y repintar()
 *      frente a Animator.draw (sprites.js real), y el salto de cada enemigo, frente al lift de enemy.js draw().
 *  12. Arreglos de upstream: el bioma a los 0-120 min con world.js y tiles.js reales (nombre, líquido y daño de
 *      los charcos; control: upstream da «Grieta · …» a los 12 min y se rompe a los 84) y el fogonazo de la
 *      grieta, que se apaga también al elegir fusión (frame() de game.js tal cual).
 *  13. Pantallas: «Gira el móvil» sólo en un móvil en vertical (pedirGiro de mods.js y checkOrientation() de
 *      game.js tal cual): un plegable desplegado o una tableta juegan; la pantalla completa sólo fija la
 *      horizontal en un móvil.
 *  14. Identidad visual «Dex de Expedición»: las fuentes de M PLUS Rounded 1c en local (su tabla name: copyright
 *      y OFL; los glifos de los textos; «…» fuera de su unicode-range), su licencia y CREDITS.md; css/tokens-dex.css y js/ui/marca.js con las
 *      mismas cifras; G.Estilo (js/ui/estilo.js) con settings.js real: valor por defecto de mods.js, guardado,
 *      fuente del lienzo (setter: con Dex, Pixelify -> M PLUS; con Clásico, nada; también las cadenas que upstream
 *      monta en hud.js, fx.js y claridad.js), Ajustes (Estilo primero, créditos, controles), cartas (franja,
 *      filo, foco, píldora), contraste de la franja en los 18 tipos, lienzos del compañero y del premio (los de
 *      upstream en Clásico), Tab (tabLibre) y disposicion() (bandas y zona libre del HUD, ≤ 20 % en compacto y
 *      escala ≤ 1,25, criterio de Nico; pantalla dividida);
 *      css/nico.css (arreglos en los dos estilos, piel sólo bajo html.estilo-dex), inglés, finales de línea
 *      y que cada ajuste de mods.js está en la tabla de CLAUDE.md.
 *  15. HUD Dex (js/ui/hud-dex.js, con hud.js y events.js reales y un lienzo de mentira que apunta cada operación):
 *      ≤ 20 % del alto en compacto con todo a la vez (criterio de Nico) y columnas ≤ 22 % del ancho; sin solapes
 *      en escritorio, móvil (con muesca) y el plegable; escala ≤ 1,25; bandas iguales a G.Estilo.disposicion(); barra
 *      del jefe en #9B6BFF con 3 marcas y más gruesa que tus PS; flechas (fuera de pantalla o tapado, dentro de la
 *      zona libre); ranura de avisos con cola; toques donde se pintan (≥ 44 px); cooperativo; contraste de cada texto;
 *      red de seguridad (fallback a upstream, Clásico = upstream, huellas e inventario de hud.js y events.js);
 *      pantalla dividida preparada (rectángulos de juego y de controles) e inglés. Y los arreglos de la verificación
 *      del lote 2: nombres de bioma y arena enteros en Rotom, pista de controles corta, flechas fuera de la píldora
 *      del ataque, «Caído» con muesca, nada sobre el pliegue del plegable, aire en las filas de compañeros y el
 *      aviso de logro bajo el HUD. Y los de la verificación de los lotes 1 y 2: flechas del mismo cuadrante sin pisarse
 *      y con su etiqueta entera en la zona libre (cuatro esquinas, 9 pantallas, ocho a la vez, el caído en las
 *      esquinas), los avisos de la fila 2 a un lado del pliegue, el pliegue de la pantalla y no de la ventana, y la
 *      caché de anchos que se vacía al cargar una fuente. Y el acabado de las flechas (verificación de la tanda
 *      PokéSwarm): 12 px de texto a texto entre etiquetas, el cuerpo a 8 px o más de las piezas, de la píldora y de la
 *      ranura activa (donde se pinta, corrida), y nada sobre el pliegue (también con la barra del navegador).
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
// Las señas del proyecto base (dominio, proyecto Firebase, apiKey, autor, su correo y el nombre del juego), codificadas
// en tools/nico/base.js para que no salgan en claro en lo que se publica.
const BASE = require('./base.js');
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RE_DOMINIO = new RegExp(reEsc(BASE.DOMINIO), 'i'), RE_AUTOR = new RegExp(reEsc(BASE.AUTOR), 'i');
const FORBIDDEN = BASE.VIGILADO;
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
if (!hits) ok(`${SERVED.length} ficheros servidos sin referencias a la infraestructura ni al correo del proyecto base`);
// Y en TODO lo publicado (GitHub Pages sirve el repositorio entero: también README, CREDITS, CLAUDE.md, PLAN.md y
// tools/), ni el nombre del proyecto base, ni su dominio, su Firebase, su apiKey, su autor (ni su repositorio) ni su
// correo. Sólo LICENSE conserva el aviso MIT, que es obligatorio. Los binarios (imágenes, fuentes, sonido) no se miran.
{
  let pub = null;
  try { pub = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean); }
  catch (e) { pub = ['.'].flatMap(d => walk(d)).map(f => f.replace(/^\.\//, '')).filter(f => !/^(\.git|tools\/nico\/(node_modules|out)|tools\/cache)\//.test(f)); }
  const BIN = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|mp3|ogg|wav|zip|gz)$/i;
  const malos = [];
  for (const f of pub.filter(f => f !== 'LICENSE' && !BIN.test(f) && ex(f))) {
    const lineas = rd(f).split('\n');
    lineas.forEach((l, i) => { for (const [re, what] of BASE.VIGILADO) if (re.test(l)) malos.push(`${f}:${i + 1} (${what})`); });
  }
  if (malos.length) bad(`lo publicado nombra el proyecto base (${malos.length}): ${malos.slice(0, 12).join('; ')}${malos.length > 12 ? '…' : ''}`);
  else ok(`${pub.length} ficheros publicados sin el nombre, el dominio, el Firebase, la apiKey, el autor ni el correo del proyecto base (salvo el aviso MIT de LICENSE)`);
  // Y LICENSE conserva el aviso MIT tal cual (la única excepción).
  const lic = rd('LICENSE');
  if (/^MIT License$/m.test(lic) && /^Copyright \(c\) 2026 /m.test(lic) && RE_AUTOR.test(lic) && /The above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software\./.test(lic.replace(/\r/g, '')))
    ok('LICENSE conserva el aviso MIT del proyecto base, con su copyright');
  else bad('LICENSE: falta el aviso MIT con su copyright (es obligatorio conservarlo)');
}
const GONE = ['CNAME', 'robots.txt', 'sitemap.xml', 'en', 'guia', 'pokedex', 'legendarios', 'shinies', 'tipos', 'movimientos',
  'objetos', 'logros', 'novedades', 'apoyar', 'functions', 'tools/activar_dominio.sh', '.github/FUNDING.yml',
  // PokéSwarm (12-10-2026): documentación, Worker y generadores del proyecto base, donaciones y el generador del
  // icono anterior (los iconos de PokéSwarm salen de tools/nico/iconos.py).
  'docs', 'GDD.md', 'cloudflare', 'tools/make_seo_pages.py', 'tools/export_data.js', 'assets/og-image.jpg', 'tools/make_icons.py',
  'js/data/funding.js', 'js/ui/support-ui.js'];
const back = GONE.filter(ex);
if (back.length) bad(`han vuelto (seguramente por un merge de upstream): ${back.join(', ')}. Quitar con: git rm -r ${back.join(' ')}`);
else ok('sin CNAME, robots.txt, sitemap.xml, en/, páginas SEO, functions/, docs/, GDD.md, cloudflare/, donaciones ni el generador del icono anterior');
if (/(href|src)="\//.test(rd('404.html'))) bad('404.html vuelve a tener rutas absolutas (no sirve en una subruta de GitHub Pages): ¿se ejecutó make_seo_pages.py?');
else ok('404.html sin rutas absolutas (vale en subruta)');
if (/"default"\s*:\s*"demo-ps"/.test(rd('.firebaserc'))) ok('.firebaserc apunta a demo-ps'); else bad('.firebaserc no apunta a demo-ps');
if (/"functions"/.test(rd('firebase.json'))) bad('firebase.json vuelve a tener el bloque functions'); else ok('firebase.json sin functions');
if (FB) {
  const okList = ALLOWED.length && ALLOWED.every(x => typeof x === 'string' && x && !RE_AUTOR.test(x)) && ALLOWED.includes('demo-ps');
  if (okList) ok(`lista blanca de Firebase: ${ALLOWED.join(', ')}`); else bad(`lista blanca de Firebase incorrecta: ${JSON.stringify(ALLOWED)}`);
  const P = FB.FIREBASE_PERMITIDA, cfg = FB.FIREBASE_CONFIG;
  if (typeof P !== 'function') bad('falta G.FIREBASE_PERMITIDA en firebase-config.js (db.js no conectaría con nada)');
  else {
    // Controles: lo que debe rechazar.
    const no = [
      { projectId: BASE.FIREBASE, authDomain: BASE.FIREBASE + '.firebaseapp.com' },
      { projectId: 'otro-proyecto' },
      { projectId: 'demo-ps', databaseURL: 'https://otro-default-rtdb.europe-west1.firebasedatabase.app' },
      { projectId: 'demo-ps', authDomain: 'otro.firebaseapp.com' },
      { projectId: 'demo-ps', authDomain: BASE.DOMINIO, databaseURL: 'https://demo-ps-default-rtdb.europe-west1.firebasedatabase.app' },
      { projectId: 'demo-ps', authDomain: 'demo-ps.firebaseapp.com' },
      { projectId: 'demo-ps', authDomain: 'demo-ps.firebaseapp.com', databaseURL: 'https://otro.example.com/?ns=demo-ps-default-rtdb' },
      { projectId: 'demo-ps', authDomain: 'demo-ps.firebaseapp.com', databaseURL: 'http://demo-ps-default-rtdb.europe-west1.firebasedatabase.app' }].filter(c => P(c));
    if (no.length) bad('G.FIREBASE_PERMITIDA acepta configs ajenas: ' + JSON.stringify(no)); else ok('G.FIREBASE_PERMITIDA rechaza el proyecto del proyecto base, proyectos fuera de la lista y URLs de otro proyecto');
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
if (RE_DOMINIO.test(idx) || /rel="canonical"/.test(idx)) bad('index.html conserva SEO del proyecto base (canonical/og): construir con --privado');
else ok('index.html sin canonical ni enlaces al dominio del proyecto base');
// dev.html también se publica (GitHub Pages sirve todo el repo).
const devH = rd('dev.html');
const robots = [...devH.matchAll(/<meta name="robots" content="([^"]*)">/g)].map(m => m[1]);
if (robots.length && robots.every(c => /noindex/.test(c))) ok('dev.html lleva noindex y ningún robots "index"');
else bad(`dev.html: robots ${JSON.stringify(robots)} (debe haber noindex y ningún "index")`);
if (RE_DOMINIO.test(devH) || /rel="canonical"/.test(devH)) bad('dev.html conserva el SEO del proyecto base (canonical/og a su dominio)');
else ok('dev.html sin canonical ni enlaces al dominio del proyecto base');
if (/window\.PS_PAGES = false;/.test(devH) && !/PS_PAGES\s*=\s*true/.test(devH)) ok('dev.html: window.PS_PAGES = false (sin botones a guía, Pokédex ni apoyar)');
else bad('dev.html: falta window.PS_PAGES = false o vuelve a ponerse a true');
const noidx = ['404.html', 'contacto/index.html'].filter(f => !/<meta name="robots" content="noindex">/.test(rd(f)));
if (noidx.length) bad('sin noindex: ' + noidx.join(', ')); else ok('404.html y contacto/ llevan noindex');
// Enlaces a páginas que el fork borró, en las páginas que se sirven.
const DEAD = /href="(\.\.\/|\.\/|\/)?(en|guia|pokedex|legendarios|shinies|tipos|movimientos|objetos|logros|novedades|apoyar)\//;
const deadIn = ['index.html', 'dev.html', '404.html', 'contacto/index.html'].filter(f => DEAD.test(rd(f)));
if (deadIn.length) bad('enlaces a páginas que el fork borró en: ' + deadIn.join(', '));
else ok('ninguna página enlaza a las que borró el fork (guia/, pokedex/, en/, apoyar/...)');
const domIn = ['index.html', 'dev.html', '404.html', 'contacto/index.html'].filter(f => RE_DOMINIO.test(rd(f)));
if (domIn.length) bad('el dominio del proyecto base aparece en páginas publicadas: ' + domIn.join(', '));
else ok('ninguna página HTML publicada menciona el dominio del proyecto base');
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
if (minS.includes('G.MARCA=') && minS.includes('G.Estilo=') && minS.includes('G.HudDex=') && minS.includes('estiloPorDefecto') && minS.includes('pedirGiro')) ok('el paquete incluye la identidad visual (js/ui/marca.js, js/ui/estilo.js y el HUD Dex de js/ui/hud-dex.js) y lo de los plegables');
else bad('el paquete no incluye js/ui/marca.js, js/ui/estilo.js, js/ui/hud-dex.js o los ajustes de estilo y plegables de js/core/mods.js');
if (/<link rel="stylesheet" href="css\/tokens-dex\.css">/.test(idx) && /<link rel="stylesheet" href="css\/nico\.css">/.test(idx)) ok('index.html carga css/tokens-dex.css y css/nico.css');
else bad('index.html no carga css/tokens-dex.css o css/nico.css: reconstruir con node tools/build.js --privado');
if (minS.includes('G.Claridad=') && ['jugadorVisible', 'numerosAgrupados', 'contornoDisparos', 'barrasTrasGolpe', 'vinetaDanio', 'biomasEnCiclo', 'destelloSinCongelar'].every(k => minS.includes(k)))
  ok('el paquete incluye la claridad en partida (js/entities/claridad.js) y sus ajustes');
else bad('el paquete no incluye js/entities/claridad.js o sus ajustes de js/core/mods.js');

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
  ['js/core/db.js', /\/\\x6a\\x70\\x74\\x65\\x72\/i\.test\(/, 'db.js rechaza el proyecto base (su autor, en hexadecimal)'],
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
  ['js/systems/rift.js', /G\.Weather\.clear\(\);\r?\n\s*if \(G\.Coop\.isHost\) G\.Coop\.broadcast\(\['af'\]\);\s*\/\/ MOD nico[^\n]*\r?\n\s*if \(authority\(\)\) G\.EnemyMgr\.restore\(\); else G\.EnemyMgr\.clearRemote\(\);/,
    "vuelta de la grieta: el anfitrión avisa ('af') antes de restore(), que anuncia con 'ne' los enemigos del mapa"],
  ['js/systems/rift.js', /arena\.endT -= dt;\r?\n\s*if \(!authority\(\) && arena\.endT > -3\) return;\s*\/\/ MOD nico[^\n]*\r?\n\s*if \(arena\.endT <= 0\) finish\(\);/,
    "vuelta de la grieta: el invitado no vuelve por su cuenta (espera 'af'; si no llega, 3 s más)"],
  ['js/systems/rift.js', /case 'al': lost\(\); break;\r?\n\s*case 'af': if \(arena\) finish\(\); break;\s*\/\/ MOD nico/, "vuelta de la grieta: el invitado vuelve al recibir 'af'"],
  ['js/net/coop.js', /case 'aw': case 'al': G\.Rift\.onEvent\(ev\); break;\r?\n\s*case 'af': G\.Rift\.onEvent\(ev\); break;\s*\/\/ MOD nico/, "vuelta de la grieta: coop.js pasa 'af' a rift.js"],
  ['js/game.js', /const others = holdBy\.filter\(n => n !== \(G\.Social\.me && G\.Social\.me\.name\)\);\s*\/\/ MOD nico[^\n]*\r?\n\s*if \(!mine && others\.length\) G\.Spawner\.say\('Pausa: ' \+ others\.join\(', '\) \+ ' ' \+ \(others\.length > 1 \? 'eligen' : 'elige'\) \+ ' fusión…', 999, true\);/,
    'fusión: el aviso «Pausa: … elige fusión» nunca lleva tu propio nombre (coopApi.hold)'],
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
  ['js/ui/gacha-ui.js', /· Los repetidos dan Pokémonedas \(los shiny repetidos, el triple\)\.<br>/, 'repetidos: la nota de upstream que cambia notasGacha() sigue ahí'],
  // Claridad en partida (js/entities/claridad.js)
  ['dev.html', /src="js\/entities\/player\.js"><\/script>\r?\n<script defer src="js\/entities\/claridad\.js"><\/script><!-- MOD nico/, 'claridad: claridad.js se carga justo después de player.js'],
  ['js/game.js', /items\.sort\(\(a, b\) => a\.y - b\.y\);\r?\n\s*if \(G\.Claridad\) G\.Claridad\.escenaOrdenada\(items\);\s*\/\/ MOD nico/, 'claridad: drawScene pasa la escena ordenada (qué tapa a cada jugador)'],
  ['js/game.js', /drawScene\(G\.Camera, [^\n]*\r?\n\s*if \(G\.Claridad\) G\.Claridad\.encima\(ctx\);\s*\/\/ MOD nico[^\n]*\r?\n\s*G\.Projectiles\.draw\(ctx\);/, 'claridad: tu Pokémon tapado, encima de la escena y debajo de disparos y efectos'],
  ['js/game.js', /G\.FX\.draw\(ctx\);\r?\n\s*if \(G\.Claridad\) G\.Claridad\.chevron\(ctx\);\s*\/\/ MOD nico/, 'claridad: el chevrón, después de los números'],
  ['js/game.js', /if \(G\.Claridad\) G\.Claridad\.vineta\(ctx, w, h, pl\);\s*\/\/ MOD nico[^\n]*\r?\n\s*G\.HUD\.draw\(ctx, w, h, pl, st\);/, 'claridad: el borde rojo, antes del HUD'],
  ['js/entities/fx.js', /function dmgText\(x, y, value, color = '#ffffff', big = false\) \{\r?\n\s*if \(arguments\[5\] && G\.Claridad && G\.Claridad\.sumar\(arguments\[5\], value, color, big, arguments\[6\]\)\) return;\s*\/\/ MOD nico/, 'claridad: dmgText suma los golpes de cada enemigo'],
  ['js/entities/fx.js', /if \(G\.Claridad\) G\.Claridad\.actualizar\(dt\);\s*\/\/ MOD nico/, 'claridad: FX.update mueve los números agrupados'],
  ['js/entities/fx.js', /if \(G\.Claridad\) G\.Claridad\.dibujarNumeros\(ctx\);\s*\/\/ MOD nico/, 'claridad: FX.draw pinta los números agrupados'],
  ['js/entities/enemy.js', /this\.boss \|\| eff === 'super', this\);\s*\/\/ MOD nico/, 'claridad: showHurt pasa el enemigo (también los golpes que anuncia el anfitrión)'],
  ['js/entities/enemy.js', /G\.FX\.dmgText\(this\.x, this\.y - this\.bodyH - 4, d, '#9fd8ff', false, this, true\);/, 'claridad: el escudo pasa el enemigo y que es su escudo'],
  ['js/entities/enemy.js', /if \(\(this\.boss \|\| this\.hp < this\.maxHp\) && \(!G\.Claridad \|\| G\.Claridad\.barra\(this\)\)\) \{\s*\/\/ MOD nico/, 'claridad: barra de vida sólo tras un golpe reciente'],
  ['js/entities/player.js', /drawShadow\(ctx, this\.dex, this\.x, this\.y, this\.scale\);[^\n]*\r?\n\s*if \(G\.Claridad\) G\.Claridad\.aro\(ctx, this\);\s*\/\/ MOD nico/, 'claridad: el aro a los pies, debajo del sprite'],
  ['js/entities/player.js', /G\.Camera\.kick\(0\.28\);\r?\n\s*if \(G\.Claridad\) G\.Claridad\.golpe\(this, d\);\s*\/\/ MOD nico/, 'claridad: el golpe recibido, para el borde rojo'],
  ['js/entities/projectile.js', /if \(!p\.friendly && G\.Claridad && G\.Claridad\.disparoHostil\(ctx, shape, v\.pal, p\.x, p\.y - L, angle, a, p\.r >= 8 \? 1\.5 : 1, Math\.floor\(p\.t \* 12\)\)\) continue;\s*\/\/ MOD nico/,
    'claridad: los disparos enemigos, con su contorno rojo'],
  // Arreglos de upstream
  ['js/game.js', /G\.World\.setBiome\(G\.MODS && G\.MODS\.biomaNormal \? G\.MODS\.biomaNormal\(b\) : b\);\s*\/\/ MOD nico/, 'biomas: desde el minuto 12, el mapa sigue en sus biomas normales'],
  ['js/game.js', /if \(state !== 'playing' && flashT > 0 && G\.MODS && G\.MODS\.destelloSinCongelar\) flashT -= dt;\s*\/\/ MOD nico/, 'fogonazo de la grieta: se apaga también al elegir fusión'],
  ['js/systems/progress.js', /function showNext\(\) \{\r?\n\s*const n = toastQ\[0\];\r?\n\s*if \(!n\) return;\r?\n\s*if \(G\.MODS && G\.MODS\.avisoEnEspera && G\.MODS\.avisoEnEspera\(showNext\)\) return;\s*\/\/ MOD nico/,
    'gacha: los avisos de logro de una tirada esperan a «Continuar» (showNext)'],
  ['css/style.css', /\.mod-avisos-tras-gacha body:has\(#pull-fx:not\(\.hidden\)\) \.ach-pop \{ visibility: hidden; \}/, 'gacha: un aviso que ya estaba en pantalla al tirar no se ve encima del resultado'],
  // Pantallas: móviles en vertical y plegables
  ['js/game.js', /const portrait = G\.Touch\.active && innerHeight > innerWidth && \(!G\.MODS \|\| !G\.MODS\.pedirGiro \|\| G\.MODS\.pedirGiro\(innerWidth, innerHeight\)\);\s*\/\/ MOD nico/,
    'plegables: «Gira el móvil» sólo en un móvil en vertical (checkOrientation)'],
  ['js/ui/settings-ui.js', /if \(!G\.MODS \|\| !G\.MODS\.fijarHorizontal \|\| G\.MODS\.fijarHorizontal\(\)\) screen\.orientation\.lock\('landscape'\)/, 'plegables: la pantalla completa sólo fija la horizontal en un móvil'],
  // Identidad visual «Dex de Expedición» (js/ui/estilo.js, js/ui/marca.js, css/tokens-dex.css, css/nico.css)
  ['dev.html', /<link rel="stylesheet" href="css\/style\.css">\r?\n<link rel="stylesheet" href="css\/tokens-dex\.css"><!-- MOD nico[^\n]*\r?\n<link rel="stylesheet" href="css\/nico\.css"><!-- MOD nico/,
    'estilo: tokens-dex.css y nico.css, justo después de style.css'],
  ['dev.html', /src="js\/core\/mods\.js"><\/script>[^\n]*\r?\n<script defer src="js\/ui\/marca\.js"><\/script><!-- MOD nico/, 'estilo: marca.js justo después de mods.js'],
  ['dev.html', /src="js\/core\/settings\.js"><\/script>\r?\n<script defer src="js\/ui\/estilo\.js"><\/script><!-- MOD nico/, 'estilo: estilo.js justo después de settings.js (antes de cualquier lienzo)'],
  ['dev.html', /originales del proyecto\. <span>Letra del estilo Dex: M PLUS Rounded 1c \(OFL\)\.<\/span><!-- MOD nico --><\/p>/, 'estilo: el aviso legal cita la letra (OFL), sin tocar el texto de upstream'],
  ['js/ui/settings-ui.js', /<\/div>`;\r?\n    \}\r?\n    if \(G\.Estilo\) G\.Estilo\.ajustes\(box, tab\);\s*\/\/ MOD nico[^\n]*\r?\n(    if \(G\.\w+\) G\.\w+\.ajustes\(box, tab\);\s*\/\/ MOD nico[^\n]*\r?\n)*    wire\(box\);/, 'estilo: Ajustes pinta lo nuestro antes de wire(box) (render)'],
  ['js/ui/run-ui.js', /<div class="key">\$\{i \+ 1\}<\/div>`;\r?\n      if \(G\.Estilo\) G\.Estilo\.carta\(el, c\);\s*\/\/ MOD nico/, 'estilo: cada carta de nivel (franja, icono y foco)'],
  ['js/ui/menu.js', /G\.UI\.sprite\(\$\('menu-partner'\), mon\.dex, \{ lively: true, scale: 4, hero: true, shiny \}\);\r?\n    if \(G\.Estilo\) G\.Estilo\.companero\(\$\('menu-partner'\), mon\.dex, \{ shiny \}\);\s*\/\/ MOD nico/, 'estilo: el compañero del menú, a su tamaño'],
  ['js/ui/gacha-ui.js', /c\.appendChild\(G\.UI\.spriteCanvas\(r\.dex, 132, 120, [^\n]*\r?\n      if \(G\.Estilo\) G\.Estilo\.premio\(c, r, n\);\s*\/\/ MOD nico/, 'estilo: el premio del gacha, a su tamaño'],
  ['js/ui/gacha-ui.js', /feat\.appendChild\(G\.UI\.spriteCanvas\(dex, 170, 190, \{ lively: true, scale: 2, dir: 1 \}\)\);\r?\n      if \(G\.Estilo\) G\.Estilo\.destacado\(feat\.lastChild, dex\);\s*\/\/ MOD nico/, 'estilo: los destacados del gacha, sin cortar'],
  ['js/core/input.js', /'tab'\]\.includes\(c\) && !\(c === 'tab' && G\.Estilo && G\.Estilo\.tabLibre\(\)\)\) e\.preventDefault\(\);\s*\/\/ MOD nico/, 'estilo: Tab recorre los menús (input.js sólo lo anula jugando)'],
  // HUD Dex (js/ui/hud-dex.js)
  ['dev.html', /src="js\/ui\/hud\.js"><\/script>\r?\n<script defer src="js\/ui\/hud-dex\.js"><\/script><!-- MOD nico/, 'HUD Dex: hud-dex.js justo después de hud.js'],
  ['js/ui/hud.js', /function draw\(ctx, w, h, pl, st\) \{\r?\n    if \(G\.Estilo && G\.Estilo\.hud\(ctx, w, h, pl, st\)\) return;\s*\/\/ MOD nico[^\n]*\r?\n    ctx\.save\(\);/, 'HUD Dex: primera línea de G.HUD.draw (con Clásico, o si falla, sigue el de upstream)'],
  ['js/systems/events.js', /get current\(\) \{ return cur \? cur\.id : null; \},\r?\n    get estado\(\) \{ return cur \|\| lost \? \{[^\n]*\} : null; \},\s*\/\/ MOD nico/, 'HUD Dex: getter aditivo del evento en curso (events.js)'],
  // Lote 4: ajustes de juego (js/ui/encuadre.js, transicion.js y golpe-final.js)
  ['dev.html', /src="js\/ui\/hud-dex\.js"><\/script>[^\n]*\r?\n<script defer src="js\/ui\/encuadre\.js"><\/script><!-- MOD nico[^\n]*\r?\n<script defer src="js\/ui\/transicion\.js"><\/script><!-- MOD nico[^\n]*\r?\n<script defer src="js\/ui\/golpe-final\.js"><\/script><!-- MOD nico/,
    'lote 4: encuadre.js, transicion.js y golpe-final.js, tras hud-dex.js'],
  ['js/game.js', /dpr = Math\.min\(1\.5, window\.devicePixelRatio \|\| 1\);\r?\n    if \(G\.Encuadre\) dpr = G\.Encuadre\.resolucion\(cv, dpr\);\s*\/\/ MOD nico[^\n]*\r?\n    w = cv\.clientWidth; h = cv\.clientHeight;/,
    'píxel nítido: game.js resize() pide la resolución (y coloca el lienzo) antes de medirlo'],
  ['js/core/camera.js', /this\.scale = Math\.min\(cssW \/ this\.VIEW_W, cssH \/ this\.MIN_VIEW_H\);\r?\n    if \(G\.Encuadre\) this\.scale = G\.Encuadre\.escala\(this\.scale, cssW, cssH, dpr\);\s*\/\/ MOD nico/, 'píxel nítido: camera.js resize() redondea la escala'],
  ['js/core/camera.js', /follow\(tx, ty, dt\) \{\r?\n    if \(G\.Encuadre\) \{ const o = G\.Encuadre\.desplazamiento\(dt\); tx \+= o\[0\]; ty \+= o\[1\]; \}\s*\/\/ MOD nico/, 'encuadre: camera.js follow() corre el objetivo'],
  ['js/core/camera.js', /\} else \{ this\._sx = this\._sy = 0; \}\r?\n    if \(G\.GolpeFinal\) G\.GolpeFinal\.sacudida\(this, dt\);\s*\/\/ MOD nico/, 'golpe final: la sacudida amortiguada, tras el temblor de upstream (follow)'],
  ['js/game.js', /function update\(dt\) \{\r?\n    if \(G\.GolpeFinal && G\.GolpeFinal\.congelar\(\)\) return;\s*\/\/ MOD nico/, 'golpe final: primera línea de update() (el juego, quieto)'],
  ['js/entities/enemy.js', /\r?\n        return;\r?\n      \}\r?\n      if \(G\.GolpeFinal\) G\.GolpeFinal\.derrotado\(this\);\s*\/\/ MOD nico[^\n]*\r?\n      if \(this\.boss\) \{/, 'golpe final: die(), tras descartar las copias de la red'],
  ['js/game.js', /ctx\.fillRect\(0, 0, w, h\);\r?\n      ctx\.restore\(\);\r?\n    \}\r?\n    if \(G\.Transicion\) G\.Transicion\.dibujar\(ctx, w, h, pl\);\s*\/\/ MOD nico/, 'iris: después del fogonazo, encima de todo (render)'],
  ['js/ui/settings-ui.js', /if \(G\.Encuadre\) G\.Encuadre\.ajustes\(box, tab\);\s*\/\/ MOD nico/, 'píxel nítido: la fila de Ajustes > Gráficos > Pantalla'],
  // Lote 5: pantalla dividida estilo Nintendo DS (js/ui/pantalla-dividida.js)
  ['dev.html', /src="js\/ui\/golpe-final\.js"><\/script>[^\n]*\r?\n<script defer src="js\/ui\/pantalla-dividida\.js"><\/script><!-- MOD nico/, 'pantalla dividida: pantalla-dividida.js tras golpe-final.js'],
  ['js/game.js', /if \(G\.Transicion\) G\.Transicion\.dibujar\(ctx, w, h, pl\);\s*\/\/ MOD nico[^\n]*\r?\n    if \(G\.Dividida\) G\.Dividida\.pintar\(pl, st\);\s*\/\/ MOD nico/, 'pantalla dividida: el panel, en la última línea de render()'],
  ['js/core/touch.js', /function vector\(\) \{\r?\n    const dv = G\.Dividida && G\.Dividida\.vector\(\); if \(dv\) return dv;\s*\/\/ MOD nico/, 'pantalla dividida: el joystick del panel manda en G.Touch.vector() (touch.js)'],
  ['js/ui/settings-ui.js', /if \(G\.Dividida\) G\.Dividida\.ajustes\(box, tab\);\s*\/\/ MOD nico/, 'pantalla dividida: la sección de Ajustes > Controles'],
  ['js/ui/estilo.js', /const hudDex = \(\) => actual === 'dex' \|\| !!\(G\.Dividida && G\.Dividida\.activa && G\.Dividida\.activa\(\)\);\r?\n  function hud\(ctx, w, h, pl, st\) \{\r?\n    if \(!hudDex\(\) \|\| !G\.HudDex \|\| !pl\) return false;/, 'pantalla dividida: el HUD Dex también con Clásico mientras va (estilo.js)']
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
  r.push(['con curacionEnemiga=true, como el proyecto base', M.predecirGolpe(o) === true && M.vidaDelAnfitrion(o, 100) === 100]);
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
      /<textarea[^>]*translate="no"[^>]*aria-label="EN:Código para la consola de esa web"/.test(hTraducida));
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
  // La PRIMERA grieta de la partida, si es la natural y se abre antes del límite, cuenta como la garantizada.
  {
    const natural = { ttl: 45 }, despues = { ttl: 45 };
    cm.G.Rift = { rift: null };
    const plN = {}; M.grietaGarantizada(plN, 0, false, true);
    cm.G.Rift.rift = natural;
    const pide = M.grietaGarantizada(plN, 105, true, true);
    const n1 = M.arenaGarantizada(plN, natural, 106), n2 = M.arenaGarantizada(plN, natural, 107), n3 = M.arenaGarantizada(plN, despues, 200);
    const plTarde = {}; M.grietaGarantizada(plTarde, 0, false, true);
    cm.G.Rift.rift = despues; M.grietaGarantizada(plTarde, 125, true, true);
    const tarde = M.arenaGarantizada(plTarde, despues, 126);
    const plInv = {}; M.grietaGarantizada(plInv, 0, false, false);
    cm.G.Rift.rift = natural; M.grietaGarantizada(plInv, 105, true, false);
    const inv = M.arenaGarantizada(plInv, natural, 106);
    M.grietaGarantizadaAntesDe = 0;
    const plOff = {}; M.grietaGarantizada(plOff, 105, true, true);
    M.grietaGarantizadaAntesDe = LIM;
    const off = M.arenaGarantizada(plOff, natural, 106);
    delete cm.G.Rift;
    t('la primera grieta, si es natural y se abre antes del límite, queda marcada (una vez); pasada la hora límite, en el invitado o con el ajuste a 0, no',
      pide === false && n1 === 1 && n2 === 0 && n3 === 0 && tarde === 0 && inv === 0 && off === 0, { pide, n1, n2, n3, tarde, inv, off });
  }

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
  // Solitario: una natural antes de la hora (hora 106,5 s; la tirada de los 105 s sale) -> no se fuerza, y como es la
  // PRIMERA de la partida y se abre antes de los 120 s, su legendario sale con el 60 % (~3 % de las partidas). La
  // siguiente natural, ya con su vida completa.
  {
    const J2 = juego(), { S, R } = J2;
    S.rnd = 0.9; J2.paso(); S.rnd = 0.1;
    J2.hastaQue(() => R.rift, 130);
    const tNat = S.time;
    J2.entrar();
    const L = J2.legendario(), marca = R.arena && R.arena.forzada;
    L.e.dead = true; J2.paso(); J2.hastaQue(() => !R.inArena, S.time + 10);
    const tFin = S.time;
    S.rnd = 0.5; J2.hastaQue(() => false, 130);
    t('solitario: si a los 105 s sale una natural (hora 106,5), no se fuerza ninguna; es la primera: su legendario, con el 60 % (arena marcada)',
      tNat >= 105 - DT && tNat < 105 + 2 * DT && S.grietas.length === 1 && S.pide === 0 && R.arena === null && marca === 1 &&
      L.e.maxHp === Math.round(vidaNormal(L.t, 1) * 0.6) && L.e.hp === L.e.maxHp, { natural: tNat, grietas: S.grietas.length, vida: L.e.maxHp, sinMod: vidaNormal(L.t, 1) });
    S.rnd = 0.1;
    J2.hastaQue(() => R.rift, tFin + 40);
    J2.entrar();
    const L2 = J2.legendario();
    t('solitario: tras esa natural, la siguiente natural sale con su legendario entero (arena sin marca)',
      S.grietas.length === 2 && R.inArena && R.arena.forzada === 0 && L2 && L2.e !== L.e && L2.e.maxHp === vidaNormal(L2.t, 1), L2 && { t: L2.t, vida: L2.e.maxHp });
  }
  // Grupo: la primera natural del anfitrión antes del límite también lleva el 60 % (el invitado recibe la arena marcada).
  {
    const H = juego({ papel: 'anfitrion' }), I = juego({ papel: 'invitado' });
    const reparte = () => {
      for (const m of H.S.enviados.splice(0)) I.R.onEvent(m);
      for (const m of I.S.alHost.splice(0)) if (m[0] === 're') H.R.enterRequest();
    };
    const ambos = () => { H.paso(); I.paso(); reparte(); };
    H.S.rnd = 0.9; I.S.rnd = 0.9; ambos(); H.S.rnd = 0.1;
    while (!H.R.rift && H.S.time < 130) ambos();
    ambos();
    I.entrar(); reparte(); ambos();
    const L = H.legendario();
    t('grupo: la primera natural (105 s, antes de la hora 106,5) del anfitrión: arena marcada en los dos y su legendario con el 60 % de la vida de dos',
      H.S.pide === 0 && H.R.inArena && I.R.inArena && H.R.arena.forzada === 1 && I.R.arena.forzada === 1 && L && L.e.maxHp === Math.round(vidaNormal(L.t, 2) * 0.6),
      L && { t: L.t, vida: L.e.maxHp, sinMod: vidaNormal(L.t, 2) });
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

  // ---- C. La vuelta de la grieta en grupo, con la red simulada ----
  // Dos clientes en node:vm con util.js, mods.js, js/net/coop.js y js/systems/rift.js reales y, de js/game.js tal cual,
  // offerBond() y coopApi.hold() (la fusión y su pausa común). El resto, mínimo: un gestor de enemigos como el de
  // enemy.js (add() anuncia con 'ne', stash/restore, las copias del invitado), el bucle (sólo 'playing' hace avanzar el
  // juego; la red se atiende siempre) y el diálogo de fusión, que el arnés elige a los `elige` s. La red entrega en
  // orden, `lat` fotogramas más tarde. Antes del arreglo el invitado volvía con su propia cuenta atrás (5 s desde 'aw'),
  // después de recibir los 'ne' con los que el anfitrión anuncia al volver los enemigos que guardó, y los borraba.
  try {
    const gsrc9 = rd('js/game.js');
    const trozo9 = (re, que) => { const m = gsrc9.match(re); if (!m) throw new Error('no encuentro en js/game.js: ' + que); return m[0]; };
    const fOffer = trozo9(/  function offerBond\(quiet = false\) \{[\s\S]*?\r?\n  \}\r?\n/, 'offerBond');
    const fHold = trozo9(/    hold\(names\) \{[\s\S]*?\r?\n    \}\r?\n/, 'coopApi.hold');
    const enRed = ({ lat = 0, ritmoInvitado = 1, elige = 0.6, eligeInvitado = elige, pierden = false, n = 12 } = {}) => {
      const cola = [], C = {};
      let f = 0;
      const envia = (de, a, msg) => cola.push({ llega: f + lat, de, a, msg: JSON.parse(JSON.stringify(msg)) });
      function cliente(uid, nombre, anfitrion) {
        const S = { time: 80, propios: 0, enArenaEnPausa: 0, estuvo: false, vuelta: null, dialogos: 0, eligeF: 0, banderas: [] };
        const c = { console, performance: { now: () => f * DT * 1000 } };
        vm.createContext(c);
        c.window = c; c.G = {};
        for (const fl of ['js/core/util.js', 'js/core/mods.js']) vm.runInContext(rd(fl), c, { filename: fl });
        vm.runInContext('Math.random = () => 0.5', c);
        const G = c.G, nop = () => {};
        G.MODS.grietaGarantizadaAntesDe = 0;   // la arena la empieza la prueba (el invitado pide entrar)
        let nid = anfitrion ? 0 : 1e6;
        const enemigo = (id, x, y, hp) => ({ id, x, y, hp, maxHp: hp, dead: false, boss: false, remote: false, dex: 19, dmg: 5, behavior: 'chaser',
          anim: { cur: 'Idle', dir: 0 }, burn: 0, poison: 0, shield: 0 });
        const lista = [], porId = new Map();
        let guardados = null;
        const quita = e => { porId.delete(e.id); const i = lista.indexOf(e); if (i >= 0) lista.splice(i, 1); };
        const EM = {
          all: () => lista, get: id => porId.get(id), bossAlive: () => lista.some(e => e.boss && !e.dead),
          add(e) { lista.push(e); porId.set(e.id, e); if (G.Coop.isHost) G.Coop.enemyAdded(e); return e; },
          addRemote(o) {
            if (porId.has(o.id)) return porId.get(o.id);
            const e = Object.assign(enemigo(o.id, o.x, o.y, o.hp), { remote: true, net: { x: o.x, y: o.y, vx: 0, vy: 0, age: 0, dir: 0, anim: 0, st: 0 } });
            lista.push(e); porId.set(e.id, e); return e;
          },
          removeRemote(id) { const e = porId.get(id); if (e) quita(e); },
          stash() { guardados = lista.filter(e => !e.dead); lista.length = 0; porId.clear(); },
          restore() {
            for (const e of lista.splice(0)) { porId.delete(e.id); if (G.Coop.isHost) G.Coop.enemyGone(e, false); }
            for (const e of guardados || []) EM.add(e);
            guardados = null;
          },
          clearRemote() { for (const e of lista.filter(x => x.remote)) quita(e); }
        };
        const ui = new Set();
        let bond = null, announce = '', announceT = 0;
        const pl = { x: 0, y: 0, dead: false, bonds: 0, bodyH: 30, hp: 100, maxHp: 100, moveAngle: 0, walking: false, magnet: 78, aim: 0, xpMul: 1, reviveT: 0,
          revive: nop, activeGroup: () => [], bondOptions: () => ({ mode: 'pair', group: [], loose: [{ name: 'a' }, { name: 'b' }] }),
          fuse(p) { this.bonds--; return p; } };
        Object.assign(G, {
          Net: { uid, on: fn => { S.recibe = fn; }, onPeer: nop, slow: () => false, viaTurn: () => false,
            send: (to, msg) => envia(uid, to, msg), toHost: msg => envia(uid, 'A', msg) },
          Player: class { constructor(mon) { Object.assign(this, { mon, dex: mon.dex, x: 0, y: 0, hp: 100, maxHp: 100, dead: false }); } },
          startMoveOf: () => 'tackle',
          Tiles: { T: 16, arenaBiome: () => 0, ARENA_THEMES: {} }, Sprites: { PX: 2, hasShiny: () => false, preload: nop },
          Game: { get player() { return pl; }, st: { get time() { return S.time; } }, everyone: () => G.Coop.players(), flash: nop, offerBond: () => c.__J.offerBond() },
          EnemyMgr: EM, World: { isFree: () => true, setArena: nop, setBiome: nop, biome: 0 },
          Projectiles: { clear: nop, clearOrbs: nop }, Combat: { clearFields: nop }, Hazards: { clear: nop }, Weather: { force: nop, clear: nop },
          Camera: { x: 0, y: 0, kick: nop }, Audio: { sfx: nop }, FX: { ring: nop, dmgText: nop, burst: nop, px: nop },
          Spawner: { say(txt, secs) { announce = txt; announceT = secs; }, banner: () => (announceT > 0 ? { text: announce, t: announceT } : null) },
          Progress: { event: nop }, Pickups: { pullAll: nop }, Guard: { flag: w => S.banderas.push(w) },
          UI: { isOpen: id => ui.has(id) },
          RunUI: { showBond: (opt, cb) => { ui.add('scr-bond'); bond = cb; S.dialogos++; S.eligeF = Math.round((anfitrion ? elige : eligeInvitado) / DT); } },
          Social: { me: { name: nombre } },
          DEX: [{ dex: 150, name: 'Mewtwo', leg: true, types: ['psychic'], spd: 130 }], SPRITE_META: { 150: {} },
          Enemy: class { constructor(def, x, y, sc, boss) { Object.assign(this, enemigo(++nid, x, y, Math.round(def.hp * sc.hp)), { boss, name: def.name, dex: def.dex, dmg: def.dmg }); } makeShiny() {} }
        });
        G.DEX_BY = { 150: G.DEX[0] };
        vm.runInContext(rd('js/net/coop.js'), c, { filename: 'js/net/coop.js' });
        vm.runInContext(rd('js/systems/rift.js'), c, { filename: 'js/systems/rift.js' });
        c.__pl = pl;
        vm.runInContext(`var __J = (() => {
          let pl = __pl, state = 'playing', holdBy = [];
${fOffer}
          const coopApi = {
${fHold}          };
          return { offerBond, coopApi, get state() { return state; } };
        })();`, c, { filename: 'js/game.js (offerBond y coopApi.hold)' });
        const J = c.__J;
        G.Coop.begin({ host: 'A', members: [{ uid: 'A', name: 'Ana', dex: 150 }, { uid: 'B', name: 'Bea', dex: 150 }] }, pl, Object.assign({
          team: () => ({ time: S.time, level: 1, xp: 0, xpNext: 10, kills: 0, bosses: 0, coins: 0, t1: 0, t10: 0 }),
          syncTeam: tm => { if (tm.time != null) S.time = tm.time; },
          levelStart: nop, waiting: nop, resume: nop, shiny: nop, over: nop, lost: nop, item: nop, mateLeft: nop
        }, J.coopApi));
        function fotograma() {
          const dt = DT * (anfitrion ? 1 : ritmoInvitado);
          if (J.state === 'playing') { S.time += dt; G.Rift.update(dt, pl, S.time); if (pl.bonds > 0) J.offerBond(true); }
          if (bond && --S.eligeF <= 0) { const cb = bond; bond = null; ui.delete('scr-bond'); cb(['a', 'b']); }
          // Lo que se ve al pintar este fotograma: el aviso «Pausa: …» con tu propio nombre no debe salir nunca.
          const b = G.Spawner.banner(), m = b && /^Pausa: (.+) eligen? fusión…$/.exec(b.text);
          if (m && m[1].split(', ').includes(nombre)) S.propios++;
          if (G.Rift.inArena) { S.estuvo = true; if (J.state === 'held') S.enArenaEnPausa++; } else if (S.estuvo && S.vuelta === null) S.vuelta = f;
          G.Coop.tick(dt);
        }
        return (C[uid] = { S, G, pl, J, EM, fotograma, nuevo: (x, y) => EM.add(enemigo(++nid, x, y, 50)) });
      }
      const H = cliente('A', 'Ana', true), I = cliente('B', 'Bea', false);
      const paso = () => {
        while (cola.length && cola[0].llega <= f) { const m = cola.shift(); C[m.a].S.recibe(m.de, m.msg); }
        H.fotograma(); I.fotograma(); f++;
      };
      const copias = () => I.EM.all().filter(e => e.remote).map(e => e.id).sort((a, b) => a - b);
      for (let i = 0; i < n; i++) H.nuevo(40 * i, 120);
      for (let i = 0; i < 20; i++) paso();
      const antes = copias().length;
      I.G.Coop.toHost(['re']);                       // el invitado entra en la grieta: el anfitrión empieza la arena para los dos
      for (let i = 0; i < 40; i++) paso();
      const enArena = H.G.Rift.inArena && I.G.Rift.inArena, jefe = H.EM.get(H.G.Rift.arena && H.G.Rift.arena.bossId);
      const copiaJefe = !!(jefe && I.EM.get(jefe.id)), sinMapa = copias().length === 1;
      if (pierden) H.G.Rift.arena.t = 1e9; else jefe.dead = true;
      const listos = () => !H.G.Rift.inArena && !I.G.Rift.inArena && H.J.state === 'playing' && I.J.state === 'playing' && !H.S.eligeF && !I.S.eligeF;
      for (let i = 0; i < 30 * 30 && !listos(); i++) paso();
      for (let i = 0; i < 30; i++) paso();
      const vivos = H.EM.all().filter(e => !e.dead && !e.remote).map(e => e.id).sort((a, b) => a - b), cs = copias();
      return { antes, enArena, copiaJefe, sinMapa, vivos: vivos.length, copias: cs.length, iguales: vivos.join() === cs.join(), listos: listos(),
        vueltaA: H.S.vuelta, vueltaB: I.S.vuelta, pausaB: I.S.enArenaEnPausa, dialogos: [H.S.dialogos, I.S.dialogos], bonds: [H.pl.bonds, I.pl.bonds],
        propios: [H.S.propios, I.S.propios], banderas: H.S.banderas.length + I.S.banderas.length };
    };
    const casos = [
      ['sin latencia', { lat: 0 }], ['150 ms', { lat: 4 }], ['150 ms y el reloj del invitado un 15 % más rápido', { lat: 4, ritmoInvitado: 1.15 }],
      ['70 ms y el reloj del invitado a la mitad', { lat: 2, ritmoInvitado: 0.5 }],
      // Los dos eligen en el mismo fotograma: al invitado le llega después un 'hp' que aún le incluye (el anfitrión no ha recibido su 'he').
      ['150 ms y eligen a la vez', { lat: 4, eligeInvitado: 0.45 }]
    ].map(([k, o]) => [k, o, enRed(o)]);
    const base = x => x.antes === 12 && x.enArena && x.copiaJefe && x.sinMapa && x.listos && x.banderas === 0;
    t('vuelta (coop.js real, red simulada): ganada, el invitado se queda con la copia de los 12 enemigos del mapa (sin latencia, 150 ms, su reloj más rápido o más lento, eligen a la vez)',
      casos.every(([, , x]) => base(x) && x.vivos === 12 && x.iguales), casos.map(([k, , x]) => ({ k, vivos: x.vivos, copias: x.copias, iguales: x.iguales })));
    t("vuelta: el invitado vuelve cuando le llega 'af' (lat fotogramas después que el anfitrión) y no se queda en pausa dentro de la arena",
      casos.every(([, o, x]) => x.pausaB === 0 && x.vueltaB - x.vueltaA >= 0 && x.vueltaB - x.vueltaA <= o.lat + 2),
      casos.map(([k, , x]) => ({ k, vueltaA: x.vueltaA, vueltaB: x.vueltaB, pausaB: x.pausaB })));
    t('fusión: los dos eligen (un diálogo cada uno, bonds a 0) y nadie ve su propio nombre en «Pausa: … elige fusión»',
      casos.every(([, , x]) => x.dialogos.join() === '1,1' && x.bonds.join() === '0,0' && x.propios.join() === '0,0'),
      casos.map(([k, , x]) => ({ k, dialogos: x.dialogos, bonds: x.bonds, propios: x.propios })));
    const rapido = enRed({ lat: 2, ritmoInvitado: 2.5 }), perdida = enRed({ lat: 2, pierden: true });
    t("vuelta: si 'af' no llega a tiempo (reloj del invitado 2,5 veces más rápido), vuelve 3 s después por su cuenta y aun así tiene todas las copias",
      base(rapido) && rapido.vueltaB < rapido.vueltaA && rapido.vivos === 12 && rapido.iguales && rapido.propios.join() === '0,0',
      { vueltaA: rapido.vueltaA, vueltaB: rapido.vueltaB, vivos: rapido.vivos, copias: rapido.copias });
    t('vuelta: perdida (se acaba el tiempo), sin vínculo; el invitado vuelve con el anfitrión y tiene todas las copias',
      base(perdida) && perdida.vivos === 12 && perdida.iguales && perdida.pausaB === 0 && perdida.vueltaB - perdida.vueltaA >= 0 && perdida.vueltaB - perdida.vueltaA <= 4 &&
      perdida.dialogos.join() === '0,0', { vueltaA: perdida.vueltaA, vueltaB: perdida.vueltaB, vivos: perdida.vivos, copias: perdida.copias, dialogos: perdida.dialogos });
  } catch (e) { t('vuelta de la grieta con la red simulada (coop.js real)', false, String(e && e.stack || e)); }

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
    t('premio() y textos con ticketsMult = 1: como el proyecto base', M.premio(def) === def && M.textoTicket('ticket') === '+1 ticket' && M.textoTicket('ticket10') === '¡Ticket ×10!');
    M.ticketsMult = 2;
    t('texto que flota con ×2: «+2 tickets» y «¡2 tickets ×10!»', M.textoTicket('ticket') === '+2 tickets' && M.textoTicket('ticket10') === '¡2 tickets ×10!');
    const en = ['+2 tickets', '¡2 tickets ×10!', '+1 ticket', '¡Ticket ×10!'].map(EN);
    t('texto que flota, en inglés (i18n.js real): «+2 tickets», «2 ×10 tickets!» y los del proyecto base', en.join('|') === '+2 tickets|2 ×10 tickets!|+1 ticket|Ticket ×10!', en);
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
    // Con ticketsMult = 1: el proyecto base.
    const O = partida({ mult: 1 });
    O.J.nueva(O.jugador()); O.J.recoge({ kind: 'ticket' }); O.J.recoge({ kind: 'ticket10' });
    t('con ticketsMult = 1, como el proyecto base: +1 por ticket y los textos de siempre', O.sv.t1 === 11 && O.sv.t10 === 2 && O.S.textos.join('|') === '+1 ticket|¡Ticket ×10!', O.S.textos);
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

  // Avisos de logro y el resultado del gacha: progress.js real (notify/showNext) con un DOM y un reloj de mentira.
  // pull() de gacha-ui.js llama a checkAch() y, en el mismo turno, abre el resultado (#pull-fx).
  try {
    const aviso = ({ mods = {} } = {}) => {
      const reloj = { t: 0, q: [] };
      const els = {};
      const elemento = (id, oculto) => { const cl = new Set(oculto ? ['hidden'] : []); return { id, className: '', innerHTML: '', classList: { add: k => cl.add(k), remove: k => cl.delete(k), contains: k => cl.has(k) }, prepend() {} }; };
      els['pull-fx'] = elemento('pull-fx', true); els['scr-gacha'] = elemento('scr-gacha', true);
      const c = { console, performance: { now: () => reloj.t }, clearTimeout() {},
        setTimeout: (f, ms) => { reloj.q.push({ f, at: reloj.t + (ms || 0) }); return reloj.q.length; } };
      const raiz = elemento('html', false);
      raiz.classList.toggle = (k, si) => (si ? raiz.classList.add(k) : raiz.classList.remove(k));
      c.document = { documentElement: raiz, getElementById: id => els[id] || null, createElement: () => elemento('', false), body: { appendChild: e => { els[e.id] = e; } } };
      vm.createContext(c);
      c.window = c; c.G = {};
      for (const f of ['js/core/util.js', 'js/core/mods.js', 'js/data/pokedex.js', 'js/data/sprites-meta.js', 'js/data/moves.js', 'js/data/types.js',
        'js/data/missions.js', 'js/data/achievements.js', 'js/systems/progress.js']) vm.runInContext(rd(f), c, { filename: f });
      const G = c.G;
      Object.assign(G.MODS, mods);
      Object.assign(G, { Ranking: { periodIds: () => ({ d: 'd1', w: 'w1' }) }, Icons: { html: k => `[${k}]` }, Audio: { sfx() {} }, UI: { spriteCanvas: () => ({}) } });
      const s = { coins: 0, tickets: { t1: 0, t10: 0 }, stats: {}, owned: {}, shiny: {}, created: 1 };
      s.ach = Object.fromEntries(G.AchDefs.LIST.map(a => [a.id, 1]));
      G.DB = { save: s, commit() {} };
      const avanzar = ms => { const fin = reloj.t + ms; for (;;) { reloj.q.sort((a, b) => a.at - b.at); const x = reloj.q[0]; if (!x || x.at > fin) break; reloj.q.shift(); reloj.t = x.at; x.f(); } reloj.t = fin; };
      const visible = () => !!els['ach-pop'] && !els['ach-pop'].classList.contains('hidden');
      const logro = () => { delete s.ach.own1; s.owned[1] = { at: 1, from: 'gacha' }; G.Progress.checkAch(); };
      return { els, avanzar, visible, logro, G, clase: () => raiz.classList.contains('mod-avisos-tras-gacha') };
    };
    // Tirada en la pantalla del gacha: el logro sale con el resultado abierto y espera a «Continuar».
    const A = aviso();
    A.els['scr-gacha'].classList.remove('hidden');
    A.logro(); A.els['pull-fx'].classList.remove('hidden');   // lo que hace pull(): checkAch() y abrir el resultado
    const alTirar = A.visible();
    A.avanzar(6000);
    const conResultado = A.visible();
    A.els['pull-fx'].classList.add('hidden');                  // «Continuar»
    A.avanzar(300);
    const trasContinuar = A.visible();
    A.avanzar(3000);
    const seVa = A.visible();
    // Fuera del gacha (en partida o en el menú), al momento, como el proyecto base.
    const B = aviso();
    B.logro();
    const enMenu = B.visible();
    // avisosTrasGacha = false: como el proyecto base, también con el resultado abierto.
    const O = aviso({ mods: { avisosTrasGacha: false } });
    O.els['scr-gacha'].classList.remove('hidden');
    O.logro(); O.els['pull-fx'].classList.remove('hidden');
    const original = O.visible();
    t('avisos de logro: los de una tirada esperan a que cierres el resultado del gacha (después salen sus 2,8 s); fuera del gacha y con avisosTrasGacha = false, al momento',
      !alTirar && !conResultado && trasContinuar && !seVa && enMenu && original, { alTirar, conResultado, trasContinuar, seVa, enMenu, original });
    // La clase de <html> con la que style.css esconde, con el resultado abierto, un aviso que ya estaba en pantalla.
    t('avisos de logro: <html> lleva mod-avisos-tras-gacha con el ajuste (y no con avisosTrasGacha = false)', A.clase() && B.clase() && !O.clase(), { A: A.clase(), B: B.clase(), O: O.clase() });
  } catch (e) { t('avisos de logro y el gacha', false, String(e && e.stack || e)); }

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
    t('shiny: con un ajuste no válido o con 1, la del proyecto base', raros.every(x => x === 0.01) && M.probShiny(0.01) === 0.01, raros);
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
    t('cartel del gacha (refresh() real): «1.5%» de shiny con 1,5 y «1%» con 1, como el proyecto base', /\[shiny\] Shiny<\/span><span>1\.5%<\/span>/.test(c15) && !c15.includes('<span>1%</span>') &&
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
    t(`repetido de Bulbasaur con Ivysaur: las monedas del proyecto base (${RE[1]}) y no desbloquea Venusaur`, !x.evo && x.refund === RE[1] && s.coins === 1000 + RE[1] && !s.owned[3], x);
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
    t(`shiny repetido con el shiny de Ivysaur: el triple del proyecto base (${RE[1] * 3}) y nada de Venusaur`, !x.evo && x.refund === RE[1] * 3 && !s.owned[3] && !s.shiny[3], x);
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
    // Sin G.EVO o con el ajuste en false: el proyecto base.
    const EVO = G.EVO;
    delete G.EVO;
    s = partida([1]); x = res1(s, 1);
    G.EVO = EVO; G.MODS.repetidoDaEvolucion = false;
    const s2 = partida([1]), x2 = res1(s2, 1);
    G.MODS.repetidoDaEvolucion = true;
    t('sin js/data/evolutions.js (G.EVO) o con repetidoDaEvolucion = false: monedas como el proyecto base', !x.evo && x.refund === RE[1] && !s.owned[2] && !x2.evo && x2.refund === RE[1] && !s2.owned[2]);
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
    t('cartel del gacha (refresh() real): la nota de los repetidos habla de la evolución; con el ajuste en false o sin G.EVO, la del proyecto base',
      h1.includes(G.MODS.NOTA_REPETIDOS) && !h1.includes(VIEJA) && h2.includes(VIEJA) && h3.includes(VIEJA) && !h3.includes(G.MODS.NOTA_REPETIDOS));
  } catch (e) { t('la carta y el cartel del gacha', false, String(e && e.stack || e)); }

  const failed = r.filter(x => !x[1]);
  if (!failed.length) ok(`gacha y tickets: ${r.length} casos bien` + (medidas.length ? ` (shiny: ${medidas.join(', ')})` : ''));
  for (const [name, , detail] of failed) bad(`gacha: ${name}${detail !== undefined ? ' · ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
}

// ---------------- 11. claridad en partida ----------------
function claridadChecks() {
  console.log('11. Claridad en partida (js/entities/claridad.js con fx.js, enemy.js y mods.js reales)');
  const r = [];
  const t = (name, cond, detail) => r.push([name, !!cond, detail]);
  /** El juego mínimo: util.js, mods.js, fx.js, enemy.js y claridad.js reales; sprites, ajustes y red, de mentira. */
  function mundo({ numeros = true, fx = 2, calm = false, mods = {} } = {}) {
    const S = { reloj: 1000, ajustes: { dmgNumbers: numeros, calm }, red: [], dibujados: [] };
    // Un document mínimo: sus lienzos pintan (tinte del contorno) pero no se pueden leer.
    const document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage() {}, fillRect() {} }) }) };
    const c = { console, document, performance: { now: () => S.reloj } };
    vm.createContext(c);
    c.window = c; c.G = {};
    for (const f of ['js/core/util.js', 'js/core/mods.js']) vm.runInContext(rd(f), c, { filename: f });
    const G = c.G;
    Object.assign(G.MODS, mods);
    G.Sprites = { PX: 2, bodyRadius: () => 10, bodyHeight: () => 30, hovers: () => false, drawShadow() {}, white: img => img,
      Animator: class { constructor(dex, scale) { this.dex = dex; this.scale = scale; this.cur = 'Idle'; this.frame = 0; this.dir = 0; }
        busy() { return false; } play() {} loop() {} update() {} draw(ctx, x, y, o) { S.dibujados.push({ x, y, o }); } },
      // Geometría de un fotograma de 40x40 con los pies en (20, 30); la imagen no se puede leer en node (sin document):
      // claridad.js usa entonces la caja del cuerpo (radio y alto), como con el juego abierto con file://.
      animMeta: () => ({ w: 40, h: 40, ax: 20, ay: 30, n: 1, r: 8 }), sheet: () => S.hoja || (S.hoja = { ready: true, img: { width: 40, height: 320 } }) };
    G.Settings = { get: k => S.ajustes[k], get fx() { return fx; } };
    G.Audio = { sfx() {} };
    G.Coop = { isHost: false, active: false, hit: (...a) => S.red.push(a), puppets: () => [] };
    G.DEX_BY = {}; G.Events = { golden: false }; G.Icons = { draw() {} };
    G.Game = { player: { x: 0, y: 0, hp: 100, maxHp: 100, r: 10, bodyH: 30 } };
    for (const f of ['js/entities/fx.js', 'js/entities/enemy.js', 'js/entities/claridad.js']) vm.runInContext(rd(f), c, { filename: f });
    const enemigo = (o = {}) => {
      const e = new G.Enemy({ dex: 1, name: 'Prueba', hp: o.hp || 1000, spd: 1, dmg: 1, xp: 1, behavior: o.behavior || 'charger' }, o.x || 0, o.y || 0, { hp: 1, spd: 1, dmg: 1 }, !!o.boss);
      if (o.remote) { e.remote = true; e.net = { st: 0 }; }
      G.EnemyMgr.add(e);
      return e;
    };
    return { c, G, S, C: G.Claridad, enemigo };
  }
  /** Un lienzo de mentira que apunta lo que se pinta. */
  function lienzo() {
    const L = { textos: [], rects: [], imgs: [], elipses: [], lineas: 0, fillStyle: '', strokeStyle: '', font: '', lineWidth: 1, globalAlpha: 1, textAlign: 'start' };
    const nop = () => {};
    return new Proxy(L, {
      get(o, k) {
        if (k in o) return o[k];
        if (k === 'fillText') return (s, x, y) => o.textos.push({ s: String(s), color: o.fillStyle, font: o.font, borde: o.lineWidth, alinea: o.textAlign, x, y });
        // Ancho de una letra de tamaño N: 0,6·N (como Pixelify en negrita, más o menos).
        if (k === 'measureText') return s => { const m = /(\d+(?:\.\d+)?)px/.exec(o.font || ''); return { width: String(s).length * 0.6 * (m ? +m[1] : 10) }; };
        if (k === 'fillRect') return (x, y, w, h) => o.rects.push({ x, y, w, h, color: o.fillStyle });
        if (k === 'drawImage') return (...a) => o.imgs.push(a);
        if (k === 'ellipse') return (...a) => o.elipses.push({ a, color: o.strokeStyle });
        if (k === 'moveTo') return () => { o.lineas++; };
        if (k === 'createRadialGradient') return () => ({ addColorStop: (p, col) => o.rects.push({ parada: p, color: col }) });
        return nop;
      },
      set(o, k, v) { o[k] = v; return true; }
    });
  }
  const digitos = L => L.textos.filter(x => /^\d+$/.test(x.s));

  // ---- A. Números de daño: uno por enemigo mientras vive ----
  try {
    const W = mundo(), { G, C } = W;
    const e1 = W.enemigo(), e2 = W.enemigo({ x: 200 });
    e1.hurt(10); e1.hurt(12); e1.hurt(8);
    let n = C.numeros, L = lienzo();
    G.FX.draw(L);
    t('tres golpes al mismo enemigo (por su id): un único número con la suma (30), en el hueco de fx.js', n.length === 1 && n[0].id === e1.id && n[0].suma === 30 &&
      n[0].golpes === 3 && !n[0].suelto && digitos(L).length === 1 && digitos(L)[0].s === '30', { n, textos: L.textos });
    t('tamaño 11 (con el saltito de cada golpe, más) y contorno de 2', /^700 1[1-5]px Pixelify/.test(digitos(L)[0].font) && digitos(L)[0].borde === 2, digitos(L)[0]);
    e2.hurt(5);
    e2.shield = 100; e2.shieldT = 8;
    e2.hurt(20); e2.hurt(20);
    n = C.numeros;
    const n2 = n.find(x => x.id === e2.id && !x.escudo), esc = n.find(x => x.escudo);
    t('otro enemigo, otro número; los del escudo (azules), aparte del suyo', n.length === 3 && n2 && n2.suma === 5 && esc && esc.id === e2.id && esc.suma === 40 &&
      esc.clave === e2.id + ':e' && esc.color === '#9fd8ff', n);
    e1.hurt(10, '#fff', 0, 0, 0, 'super');
    const s1 = C.numeros.find(x => x.id === e1.id);
    t('un «muy eficaz» tiñe el número de amarillo y lo hace grande', s1.suma === 40 && s1.color === '#ffe14d' && s1.big, s1);
    G.FX.update(0.2);
    L = lienzo(); G.FX.draw(L);
    const f16 = digitos(L).find(x => x.s === '40');
    t('grande, ya sin el saltito: 16', f16 && /^700 16px/.test(f16.font), f16);
    G.FX.update(0.3);
    e1.hurt(1);
    const r1 = C.numeros.find(x => x.id === e1.id);
    G.FX.update(0.9);
    const vivo = C.numeros.find(x => x.id === e1.id);
    G.FX.update(0.15);
    const suelto = C.numeros.find(x => x.id === e1.id);
    t('se renueva mientras recibe (0,5 s después suma al mismo) y tras ~1 s sin golpes se suelta', r1.suma === 41 && r1.golpes === 5 && !vivo.suelto && suelto.suelto,
      { r1, vivo, suelto });
    const y0 = suelto.y;
    G.FX.update(0.1);
    const y1 = C.numeros.find(x => x.id === e1.id).y;
    e1.hurt(3);
    const nuevo = C.numeros.filter(x => x.id === e1.id && !x.escudo);
    t('suelto, sube; un golpe nuevo empieza otro número', y1 < y0 && nuevo.length === 2 && nuevo.some(x => !x.suelto && x.suma === 3), { y0, y1, nuevo });
    for (let i = 0; i < 12; i++) G.FX.update(0.1);
    t('el suelto se desvanece (los grandes, en 0,95 s)', !C.numeros.some(x => x.id === e1.id && x.suma === 41));
    e2.dead = true;
    G.FX.update(0.016);
    t('al caer el enemigo, sus números se sueltan', C.numeros.filter(x => x.id === e2.id).every(x => x.suelto));
    // Invitado: golpes suyos a una copia (hurt, remote) y los del anfitrión ('hn' -> showHurt), juntos.
    const e3 = W.enemigo({ remote: true });
    e3.hurt(4); e3.hurt(4); e3.showHurt(7, '#fff');
    const g3 = C.numeros.find(x => x.id === e3.id);
    t('invitado: sus golpes a una copia (los manda al anfitrión) y los que anuncia el anfitrión, en un único número', W.S.red.length === 2 && g3 && g3.suma === 15 && g3.golpes === 3, g3);
  } catch (e) { t('números agrupados', false, String(e && e.stack || e)); }
  // El número del escudo, a la derecha del de su enemigo sin tocarlo (con 4 cifras grandes y su saltito, también al soltarse).
  try {
    const W = mundo(), { G, C } = W, e = W.enemigo({ boss: true, hp: 1e6 });
    const AZUL = '#9fd8ff';
    const medir = () => {
      const L = lienzo(); G.FX.draw(L);
      const d = digitos(L), s = d.find(x => x.color === AZUL), p = d.find(x => x.color !== AZUL);
      if (!p || !s) return { p, s };
      const tam = +/(\d+)px/.exec(p.font)[1], borde = p.x + p.s.length * 0.6 * tam / 2;   // borde derecho del número de los golpes
      return { hueco: +(s.x - borde).toFixed(2), golpes: p.s, escudo: s.s, alineaGolpes: p.alinea, alineaEscudo: s.alinea, tam };
    };
    e.hurt(1060, '#fff', 0, 0, 0, 'super');
    e.shield = 1000; e.shieldT = 8; e.hurt(172);
    const conSalto = medir();
    G.FX.update(0.3);
    const quieto = medir();
    // Sin más golpes al escudo, el suyo se suelta (1 s) mientras el jefe sigue recibiendo: sube desde donde estaba.
    e.shield = 0;
    for (let i = 0; i < 6; i++) { e.hurt(1); G.FX.update(0.15); medir(); }
    const esc = C.numeros.find(x => x.escudo), suelto = medir();
    // Un escudo que lo absorbe todo (sin número de golpes), su número se suelta y el jefe estrena número debajo.
    const W2 = mundo(), e2 = W2.enemigo({ boss: true, hp: 1e6 });
    e2.shield = 1000; e2.shieldT = 8; e2.hurt(172);
    W2.G.FX.draw(lienzo()); W2.G.FX.update(1.05);
    e2.shield = 0; e2.hurt(1060, '#fff', 0, 0, 0, 'super');
    const L2 = lienzo(); W2.G.FX.draw(L2);
    const d2 = digitos(L2), s2 = d2.find(x => x.color === AZUL), p2 = d2.find(x => x.color !== AZUL);
    const estrena = s2 && p2 ? +(s2.x - (p2.x + p2.s.length * 0.6 * +/(\d+)px/.exec(p2.font)[1] / 2)).toFixed(2) : null;
    t('escudo: su número a la derecha del de los golpes, sin tocarlo (1060 grande y 172; con el saltito, quieto, al soltarse y si el jefe estrena número con el del escudo ya suelto)',
      conSalto.hueco >= 3 && quieto.hueco >= 3 && suelto.hueco >= 3 && esc && esc.suelto && estrena >= 3 && W2.C.numeros.find(x => x.escudo).suelto &&
      conSalto.tam > quieto.tam && quieto.alineaGolpes === 'center' && quieto.alineaEscudo === 'left', { conSalto, quieto, suelto, escSuelto: esc && esc.suelto, estrena });
    // El de los golpes se suelta (sin más golpes) mientras el escudo sigue absorbiendo: el azul no lo pisa mientras
    // sube (casi a su altura) ni salta hacia el centro cuando se desvanece.
    const W3 = mundo(), e3 = W3.enemigo({ boss: true, hp: 1e6 });
    e3.hurt(1060, '#fff', 0, 0, 0, 'super');
    e3.shield = 1e6; e3.shieldT = 99; e3.hurt(172);
    const huecos = [], dxs = [];
    let vioSuelto = false, sueltoT = -1;
    for (let i = 0; i < 18; i++) {
      e3.hurt(40); W3.G.FX.update(0.15);
      const L3 = lienzo(); W3.G.FX.draw(L3);
      const d3 = digitos(L3), s3 = d3.find(x => x.color === AZUL), p3 = d3.find(x => x.color !== AZUL);
      const n3 = W3.C.numeros.find(x => !x.escudo);
      if (n3 && n3.suelto && !vioSuelto) { vioSuelto = true; sueltoT = i; }
      if (s3 && p3) huecos.push(+(s3.x - (p3.x + p3.s.length * 0.6 * +/(\d+)px/.exec(p3.font)[1] / 2)).toFixed(2));
      if (s3 && vioSuelto) dxs.push(+(s3.x - e3.x).toFixed(2));
    }
    const desaparece = !W3.C.numeros.some(x => !x.escudo), escVivo = W3.C.numeros.find(x => x.escudo);
    t('escudo: si el de los golpes se suelta mientras el escudo sigue absorbiendo, el azul se queda a su derecha sin tocarlo mientras sube y, al desvanecerse, no salta',
      vioSuelto && desaparece && escVivo && !escVivo.suelto && huecos.length > 8 && Math.min(...huecos) >= 3 && dxs.length > 4 && dxs.every(d => Math.abs(d - dxs[0]) < 0.01),
      { sueltoT, huecos, dxs });
  } catch (e) { t('escudo al lado del número', false, String(e && e.stack || e)); }
  // La subida al soltarse no depende de los FPS (fx.js frena ×0,94 por fotograma: a 144 FPS sube la mitad que a 30).
  try {
    const subida = dt => {
      const W = mundo(), e = W.enemigo();
      e.hurt(10);
      W.G.FX.update(1.05);
      const y0 = W.C.numeros[0].y;
      for (let k = 0; k < Math.round(0.5 / dt); k++) W.G.FX.update(dt);
      return y0 - W.C.numeros[0].y;
    };
    const a = subida(1 / 30), b = subida(1 / 144);
    t('frenado de la subida independiente de los FPS (0,5 s a 30 y a 144 FPS)', a > 8 && Math.abs(a - b) < 1, { a30: +a.toFixed(2), a144: +b.toFixed(2) });
  } catch (e) { t('subida independiente de los FPS', false, String(e && e.stack || e)); }
  // Ajustes: sin números de daño, nada; con numerosAgrupados = false, como el proyecto base (uno por golpe).
  try {
    const sin = mundo({ numeros: false }), e = sin.enemigo();
    e.hurt(10); e.hurt(10);
    const L1 = lienzo(); sin.G.FX.draw(L1);
    const orig = mundo({ mods: { numerosAgrupados: false } }), o = orig.enemigo();
    o.hurt(10); o.hurt(11); o.hurt(12);
    const L2 = lienzo(); orig.G.FX.draw(L2);
    t('Ajustes > Números de daño apagado: ningún número; numerosAgrupados = false: uno por golpe (13 px, contorno 3)',
      !sin.C.numeros.length && !digitos(L1).length && !orig.C.numeros.length && digitos(L2).length === 3 && /^700 13px/.test(digitos(L2)[0].font), digitos(L2));
    const tope = mundo({ fx: 0 });
    for (let i = 0; i < 30; i++) tope.enemigo({ x: i * 40 }).hurt(5);
    t('calidad baja: como mucho 25 números a la vez (los topes de fx.js)', tope.C.numeros.length === 25, tope.C.numeros.length);
  } catch (e) { t('ajustes de los números', false, String(e && e.stack || e)); }

  // ---- B. Barras de vida sólo tras un golpe reciente (enemy.js draw real) ----
  try {
    const W = mundo(), { G, S } = W;
    const barra = e => { const L = lienzo(); e.draw(L); return L.rects.some(x => x.color === '#ff5f6d' || x.color === '#ffcb3d'); };
    const e = W.enemigo();
    const b0 = barra(e);
    e.hurt(10);
    const b1 = barra(e);
    S.reloj += 1400; const b2 = barra(e);
    S.reloj += 200; const b3 = barra(e);
    e.hurt(5); const b4 = barra(e);
    t('enemigo normal: sin barra entero; con el golpe, 1,5 s y se esconde; otro golpe, otra vez', !b0 && b1 && b2 && !b3 && b4, { b0, b1, b2, b3, b4 });
    S.reloj += 5000;
    const casos = { jefe: W.enemigo({ boss: true }), escudo: W.enemigo({ behavior: 'shielder' }), invocador: W.enemigo({ behavior: 'summoner' }),
      curandero: W.enemigo({ behavior: 'healer' }), duende: W.enemigo({ behavior: 'thief' }), shiny: W.enemigo(), legendario: W.enemigo() };
    casos.shiny.shiny = true; casos.legendario.legend = true;
    const siempre = {};
    for (const [k, x] of Object.entries(casos)) { if (k !== 'jefe') x.hp -= 100; barra(x); S.reloj += 3000; siempre[k] = barra(x); }
    t('jefes, legendarios, shiny, duendes del tesoro y apoyos (escudo, invocador, curandero) la conservan', Object.values(siempre).every(Boolean), siempre);
    const h = W.enemigo(); h.hp -= 50; barra(h); S.reloj += 3000;
    G.MODS.barrasTrasGolpe = 0; const orig = barra(h); G.MODS.barrasTrasGolpe = 1.5;
    t('barrasTrasGolpe = 0: como el proyecto base (siempre que esté herido)', orig && !barra(h));
    // Invitado: la vida le llega por red (la línea de coop.js con la ventana de mods.js).
    const cp = W.enemigo({ remote: true });
    barra(cp);
    cp.hp = G.MODS.vidaDelAnfitrion(cp, 700);
    const r1 = barra(cp);
    S.reloj += 1600; cp.hp = G.MODS.vidaDelAnfitrion(cp, 700);
    const r2 = barra(cp);
    t('invitado: la vida que llega por red enseña la barra 1,5 s; si no cambia, se esconde', r1 && !r2, { r1, r2 });
  } catch (e) { t('barras de vida', false, String(e && e.stack || e)); }

  // ---- C. Tu Pokémon siempre visible (cajas de los sprites; aquí, las del cuerpo) ----
  try {
    const W = mundo(), { G, C, S } = W;
    G.World = { biome: 0 };
    G.Tiles = { propSprite: () => ({ width: 24, height: 40 }) };
    const jugador = (o = {}) => Object.assign(new (function Jugador() {})(), { x: 0, y: 0, r: 10, bodyH: 40, dead: false, invuln: 0, flash: 0,
      anim: Object.assign(new G.Sprites.Animator(25, o.escala || 1), {}) }, o);
    const pl = jugador();
    G.Game.player = pl;
    const ene = (x, y, extra = {}) => Object.assign(W.enemigo({ x, y }), extra);
    const escena = (...cosas) => cosas.map(c => (c.prop ? { y: c.prop.y, prop: c.prop } : { y: c.y, ent: c })).sort((a, b) => a.y - b.y);
    const delante = ene(0, 12), detras = ene(0, -12), lado = ene(60, 12), muerto = ene(0, 14, { dead: true }), rozando = ene(19, 12);
    const arbol = { prop: { x: 4, y: 20, type: 'tree' } }, plano = { prop: { x: 0, y: 10, type: 'spring', flat: true } };
    const casos = {
      delante: C.tapado(pl, escena(pl, delante)), detras: C.tapado(pl, escena(pl, detras)), lado: C.tapado(pl, escena(pl, lado)),
      muerto: C.tapado(pl, escena(pl, muerto)), rozando: C.tapado(pl, escena(pl, rozando)), arbol: C.tapado(pl, escena(pl, arbol)),
      plano: C.tapado(pl, escena(pl, plano))
    };
    t('tapado: un enemigo delante encima de él o un árbol, sí; detrás, al lado, caído, rozando o un objeto plano, no',
      casos.delante && !casos.detras && !casos.lado && !casos.muerto && !casos.rozando && casos.arbol && !casos.plano, casos);
    // Lo alto tapa con los pies muy por debajo (antes se dejaba de mirar a 48 px de los pies del jugador:
    // un jefe de ~110-160 de alto o un árbol de 80 no contaban justo cuando más tapan).
    const alto = (x, y, boss = true) => Object.assign(W.enemigo({ x, y, boss, hp: 1e6 }), { r: 24, bodyH: 110 });
    const altos = {
      jefe80: C.tapado(pl, escena(pl, alto(0, 80))), arbol60: C.tapado(pl, escena(pl, { prop: { x: 0, y: 60, type: 'tree' } })),
      // Con la imagen sin leer (file://) cuenta la caja del cuerpo, aunque sea más alta que su fotograma.
      cuerpoMasAltoQueSuFotograma: C.tapado(pl, escena(pl, alto(0, 80, false))),
      jefe80TrasMuchos: C.tapado(pl, escena(pl, ...Array.from({ length: 30 }, (_, k) => ene(200 + k * 30, 5 + k)), alto(0, 80))),
      jefe160: C.tapado(pl, escena(pl, alto(0, 160))), jefeAlLado: C.tapado(pl, escena(pl, alto(90, 80))),
      arbol100: C.tapado(pl, escena(pl, { prop: { x: 0, y: 100, type: 'tree' } }))
    };
    t('tapado por lo alto: un jefe de 110 de alto con los pies a 80 px (también detrás de 30 enemigos lejos, y con la caja del cuerpo si la imagen no se lee) y un árbol de 80 a 60 px, sí; el jefe a 160 px o a un lado y el árbol a 100 px, no',
      altos.jefe80 && altos.arbol60 && altos.jefe80TrasMuchos && altos.cuerpoMasAltoQueSuFotograma && !altos.jefe160 && !altos.jefeAlLado && !altos.arbol100, altos);
    // Lo que salta se pinta en y − lift (enemy.js draw): cuenta donde se ve, no donde tiene los pies.
    const saltos = {
      saltando: C.tapado(pl, escena(pl, ene(0, 50, { jumpLift: 46 }))), enSuelo: C.tapado(pl, escena(pl, ene(0, 50))),
      bajandoLejos: C.tapado(pl, escena(pl, ene(0, 90, { jumpLift: 10 })))
    };
    t('tapado por lo que salta: con los pies a 50 px, en lo alto de su salto (46 px), sí; el mismo en el suelo o uno a 90 px que apenas se levanta, no',
      saltos.saltando && !saltos.enSuelo && !saltos.bajandoLejos, saltos);
    // encima(): aro + contorno de 1 píxel de arte (4 copias desplazadas) + el sprite; y el chevrón después.
    const L = lienzo();
    C.escenaOrdenada(escena(pl, delante));
    S.dibujados.length = 0;
    C.encima(L);
    const desp = L.imgs.map(a => a[5]).sort((a, b) => a - b);
    const L2 = lienzo(); C.chevron(L2);
    t('tapado: aro dorado encima, contorno blanco (4 copias a ±1 píxel de arte) y el sprite; chevrón después de los números',
      C.tapados.length === 1 && L.elipses.some(x => x.color === '#ffcb3d') && L.imgs.length === 4 && desp[3] - desp[0] === 4 && S.dibujados.length === 1 && L2.lineas === 1,
      { tapados: C.tapados.length, imgs: L.imgs.length, desp, sprite: S.dibujados.length, chevron: L2.lineas });
    // Sin nada encima: sólo el aro (lo pinta player.js debajo del sprite) y sin chevrón.
    const L3 = lienzo(); C.escenaOrdenada(escena(pl, detras)); C.encima(L3);
    const L4 = lienzo(); C.chevron(L4);
    const L5 = lienzo(); C.aro(L5, pl);
    const ar = L5.elipses[0] && L5.elipses[0].a;
    t('sin nada encima: nada repintado ni chevrón; el aro a los pies (1,65 r × 0,66 r), dorado', !C.tapados.length && !L3.imgs.length && !L4.lineas &&
      ar && Math.abs(ar[2] - 16.5) < 1e-9 && Math.abs(ar[3] - 6.6) < 1e-9 && L5.elipses[0].color === '#ffcb3d', { ar });
    // Grande reducido (anchoMaxJugador): el contorno, a 1 píxel de arte de SU sprite; y su caja, a escala.
    const gr = jugador({ escala: 0.47, r: 11, bodyH: 22 });
    G.Game.player = gr;
    const L6 = lienzo(); C.escenaOrdenada(escena(gr, ene(0, 6))); C.encima(L6);
    const d6 = L6.imgs.map(a => a[5]).sort((a, b) => a - b);
    t('Pokémon grande reducido: contorno a 1 píxel de arte de su sprite (0,94 -> 1 unidad) y a escala', L6.imgs.length === 4 && d6[3] - d6[0] === 2 && L6.imgs[0][7] === 40 * 2 * 0.47,
      { d6, ancho: L6.imgs[0] && L6.imgs[0][7] });
    // Compañero: aro y contorno en blanco frío (el tuyo, dorado y blanco).
    G.Game.player = pl;
    const amigo = jugador({ x: 300 });
    G.Coop.active = true; G.Coop.puppets = () => [amigo];
    const L7 = lienzo(); C.aro(L7, amigo);
    const L8 = lienzo(); C.escenaOrdenada(escena(pl, amigo, ene(300, 12))); C.encima(L8);
    G.Coop.active = false;
    t('compañero: aro y contorno en blanco frío (#cfe8ff), sin chevrón', L7.elipses[0] && L7.elipses[0].color === '#cfe8ff' && C.tapados.length === 1 && C.tapados[0] === amigo &&
      L8.elipses.some(x => x.color === '#cfe8ff'), { aro: L7.elipses[0] && L7.elipses[0].color, tapados: C.tapados.length });
    G.MODS.jugadorVisible = false;
    const L9 = lienzo(); C.escenaOrdenada(escena(pl, delante)); C.encima(L9); C.aro(L9, pl); C.chevron(L9);
    t('jugadorVisible = false: ni aro, ni contorno, ni chevrón', !L9.elipses.length && !L9.imgs.length && !L9.lineas);
  } catch (e) { t('tu Pokémon siempre visible', false, String(e && e.stack || e)); }

  // ---- D. Borde rojo: golpe recibido y vida baja ----
  try {
    const W = mundo(), { G, C, S } = W, pl = G.Game.player;
    C.vineta(lienzo(), 800, 400, pl);   // el primer fotograma de la partida
    C.golpe(pl, 1); const a1 = C.alfaVineta(pl);
    C.golpe(pl, 30); const a2 = C.alfaVineta(pl);
    S.reloj += 175; const a3 = C.alfaVineta(pl);
    S.reloj += 200; const a4 = C.alfaVineta(pl);
    t('golpe: alfa de 0,2 (poco daño) a 0,45 (un cuarto de la vida o más) que se apaga en ~0,35 s', Math.abs(a1 - 0.21) < 1e-9 && Math.abs(a2 - 0.45) < 1e-9 &&
      Math.abs(a3 - 0.225) < 1e-6 && a4 === 0, { a1, a2, a3, a4 });
    C.golpe({ hp: 100, maxHp: 100 }, 50);
    t('el golpe a otro jugador (un compañero) no pinta tu borde', C.alfaVineta(pl) === 0);
    pl.hp = 20;
    const latido = []; for (let i = 0; i < 40; i++) { S.reloj += 50; latido.push(C.alfaVineta(pl)); }
    pl.hp = 40; const sano = C.alfaVineta(pl);
    pl.hp = 0; pl.dead = true; const ko = C.alfaVineta(pl);
    t('por debajo del 30 %: latido lento (sube y baja en 2 s, sin llegar al golpe más fuerte); con más vida o KO, nada', Math.min(...latido) > 0.1 && Math.max(...latido) < 0.3 && Math.max(...latido) - Math.min(...latido) > 0.08 &&
      sano === 0 && ko === 0, { min: Math.min(...latido), max: Math.max(...latido) });
    pl.dead = false; pl.hp = 100;
    C.golpe(pl, 30); const fuerte = C.alfaVineta(pl);
    S.ajustes.calm = true; const suave = C.alfaVineta(pl);
    const L = lienzo(); C.vineta(L, 800, 400, pl);
    G.MODS.vinetaDanio = false; const L2 = lienzo(); C.vineta(L2, 800, 400, pl);
    t('«Menos sacudidas y destellos»: a la mitad; vinetaDanio = false: no pinta nada', Math.abs(suave - fuerte / 2) < 1e-9 && L.rects.length > 0 && !L2.rects.length, { fuerte, suave });
  } catch (e) { t('borde rojo', false, String(e && e.stack || e)); }

  // ---- E. Disparos enemigos: el gancho y el ajuste (el contorno se mira en el navegador: coop-e2e.js) ----
  try {
    const W = mundo({ mods: { contornoDisparos: false } });
    W.G.VFX = { SHAPES: { ball: { w: 5, h: 5 } }, sprite: () => { throw new Error('no debería pedir el sprite'); } };
    t('contornoDisparos = false: projectile.js pinta como siempre', W.C.disparoHostil(lienzo(), 'ball', 'normal', 0, 0, 0, 1, 1, 0) === false);
  } catch (e) { t('disparos enemigos', false, String(e && e.stack || e)); }

  // ---- F. Lo que claridad.js repite de upstream sigue coincidiendo con él ----
  // disparoHostil() pinta como G.VFX.draw y repintar() elige celda y posición como Animator.draw: si upstream
  // cambia cualquiera de los dos, el disparo contorneado o tu Pokémon repintado dejarían de coincidir.
  /** Un lienzo de mentira que apunta las llamadas (con sus números) y lo que se le asigna, en orden. */
  const grabadora = () => {
    const o = { ops: [], imgs: [], globalAlpha: 0.8 };
    return new Proxy(o, {
      get(x, k) { if (k in x) return x[k]; return (...a) => { x.ops.push([k, ...a.map(v => (typeof v === 'number' ? +v.toFixed(4) : typeof v))]); if (k === 'drawImage') x.imgs.push(a); }; },
      set(x, k, v) { x[k] = v; x.ops.push(['=' + k, typeof v === 'number' ? +v.toFixed(4) : v]); return true; }
    });
  };
  /** Un canvas de mentira que guarda qué píxeles se pintan (para el contorno de claridad.js); legible o no. */
  const canvasPx = (legible = true) => {
    const c = { width: 0, height: 0 };
    let d = null;
    const x = {
      fillStyle: '', globalCompositeOperation: '',
      fillRect(px, py, w, h) {
        if (!d || d.length !== c.width * c.height * 4) d = new Uint8ClampedArray(c.width * c.height * 4);
        for (let yy = py; yy < py + h; yy++) for (let xx = px; xx < px + w; xx++) if (xx >= 0 && yy >= 0 && xx < c.width && yy < c.height) d[(yy * c.width + xx) * 4 + 3] = 255;
      },
      getImageData(px, py, w, h) {
        if (!legible) throw new Error('SecurityError: lienzo contaminado');
        return { data: d && w === c.width && h === c.height ? d : new Uint8ClampedArray(w * h * 4) };
      },
      clearRect() {}, drawImage() {}
    };
    c.getContext = () => x;
    return c;
  };
  try {
    // F1. projectile.js: el gancho recibe lo mismo que la llamada a G.VFX.draw que sustituye.
    const src = rd('js/entities/projectile.js');
    const m = /G\.Claridad\.disparoHostil\(([^\n]*)\)\) continue;[^\n]*\r?\n\s*G\.VFX\.draw\(([\s\S]*?)\);/.exec(src);
    const partir = s => { const out = []; let d = 0, cur = ''; for (const ch of s) { if ('([{'.includes(ch)) d++; if (')]}'.includes(ch)) d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
    const gancho = m ? partir(m[1]) : [], vfx = m ? partir(m[2]) : [];
    const op = {};
    if (vfx[5]) for (const kv of partir(vfx[5].replace(/^\{|\}$/g, ''))) { const i = kv.indexOf(':'); op[(i < 0 ? kv : kv.slice(0, i)).trim()] = (i < 0 ? kv : kv.slice(i + 1)).trim(); }
    t('projectile.js: el disparo contorneado recibe lo mismo que la llamada a G.VFX.draw que sustituye (posición, ángulo, alfa, escala y fotograma)',
      gancho.length === 9 && vfx.length === 6 && vfx.slice(0, 5).join('|') === gancho.slice(0, 5).join('|') && Object.keys(op).sort().join() === 'alpha,angle,frame,scale' &&
      op.angle === gancho[5] && op.alpha === gancho[6] && op.scale === gancho[7] && op.frame === gancho[8], { gancho, vfx: vfx.slice(0, 5), op });

    // F2. disparoHostil() frente a G.VFX.draw() real (vfx.js): mismo centro, giro, alfa y suavizado; 1 píxel de arte más por lado.
    const c = { console, document: { createElement: () => canvasPx() } };
    vm.createContext(c);
    c.window = c; c.G = { Sprites: { PX: 2 } };
    for (const f of ['js/core/util.js', 'js/entities/vfx.js', 'js/core/mods.js', 'js/entities/claridad.js']) vm.runInContext(rd(f), c, { filename: f });
    const G = c.G, PX = G.Sprites.PX;
    let casos = 0, mal = [];
    for (const shape of Object.keys(G.VFX.SHAPES)) for (const angle of [0, 0.3, 0.5, 1, 2, 2.9, -1.2]) for (const scale of [1, 1.5]) for (const alpha of [1, 0.5]) for (const frame of [0, 3]) {
      const a = grabadora(), b = grabadora();
      G.VFX.draw(a, shape, 'fire', 100.6, 50.2, { angle, alpha, scale, frame });
      const pinto = G.Claridad.disparoHostil(b, shape, 'fire', 100.6, 50.2, angle, alpha, scale, frame);
      const k = PX * scale, oa = a.ops, ob = b.ops;
      const ok1 = pinto && oa.length === ob.length && oa.every((x, i) => (x[0] === 'drawImage'
        ? ob[i][0] === 'drawImage' && Math.abs(ob[i][2] - (x[2] - k)) < 1e-6 && Math.abs(ob[i][3] - (x[3] - k)) < 1e-6 && Math.abs(ob[i][4] - (x[4] + 2 * k)) < 1e-6 && Math.abs(ob[i][5] - (x[5] + 2 * k)) < 1e-6
        : JSON.stringify(x) === JSON.stringify(ob[i])));
      const cv = b.imgs[0] && b.imgs[0][0], orig = a.imgs[0] && a.imgs[0][0];
      const ok2 = cv && orig && cv.width === orig.width + 2 && cv.height === orig.height + 2;
      casos++;
      if (!ok1 || !ok2) mal.push({ shape, angle, scale, alpha, frame, vfx: oa, claridad: ob });
    }
    t(`disparoHostil() pinta como G.VFX.draw (vfx.js real, ${casos} casos: todas las formas, giros, escalas, alfas y fotogramas), con el sprite 1 píxel de arte más grande por lado`,
      casos > 0 && !mal.length, mal.slice(0, 2));
  } catch (e) { t('disparoHostil frente a G.VFX.draw', false, String(e && e.stack || e)); }

  try {
    // F3. repintar() (tu Pokémon tapado) frente a Animator.draw real (sprites.js): misma hoja, celda y posición;
    // el contorno, a ±1 píxel de arte. Con una geometría de mentira en G.SPRITE_META y hojas que se cargan a mano.
    const fot = (w, h, ax, ay, n) => ({ w, h, ax, ay, n, r: 8, d: Array(n).fill(4) });
    const c = { console, performance: { now: () => 0 }, document: { createElement: () => canvasPx(false) } };
    c.Image = class { constructor() { this.width = 256; this.height = 512; this.onload = this.onerror = null; } set src(v) { this._src = v; } get src() { return this._src; } };
    vm.createContext(c);
    c.window = c;
    c.G = { SPRITE_META: { 25: { s: 1, sh: 1, a: { Idle: fot(32, 40, 16, 34, 2), Walk: fot(32, 40, 16, 34, 4), Attack: fot(48, 56, 24, 44, 3) }, sa: { Idle: fot(36, 44, 18, 38, 2) } } } };
    for (const f of ['js/core/util.js', 'js/core/sprites.js', 'js/core/mods.js', 'js/entities/claridad.js']) vm.runInContext(rd(f), c, { filename: f });
    const G = c.G, S = G.Sprites, C = G.Claridad;
    G.Coop = { active: false, puppets: () => [] };
    const cargar = (anim, shiny = false) => { const s = S.sheet(25, anim, shiny); s.img.onload(); return s; };
    cargar('Idle'); cargar('Idle', true);
    const casos = [
      { nombre: 'Idle cargada (fotograma 1, dirección 3)', cur: 'Idle', frame: 1, dir: 3 },
      { nombre: 'Attack sin cargar: enseña Idle, fotograma 0', cur: 'Attack', frame: 2, dir: 5 },
      { nombre: 'Attack cargada, fotograma y dirección fuera de la hoja', cur: 'Attack', frame: 7, dir: 11, carga: 'Attack' },
      { nombre: 'reducido ×0,47 (anchoMaxJugador)', cur: 'Walk', frame: 3, dir: 2, carga: 'Walk', escala: 0.47 },
      { nombre: 'shiny con su propia geometría', cur: 'Idle', frame: 1, dir: 6, shiny: true }
    ];
    const mal = [];
    for (const k of casos) {
      if (k.carga) cargar(k.carga, !!k.shiny);
      const anim = new S.Animator(25, k.escala || 1, !!k.shiny);
      Object.assign(anim, { cur: k.cur, frame: k.frame, dir: k.dir });
      const pl = { x: 100.7, y: 200.6, r: 10, bodyH: 40, dead: false, invuln: 0, flash: 0, anim };
      const delante = { x: 100, y: 210, r: 10, bodyH: 40, dead: false, anim: new S.Animator(25, 1) };
      G.Game = { player: pl };
      const L = grabadora();
      C.escenaOrdenada([{ y: pl.y, ent: pl }, { y: delante.y, ent: delante }]);
      C.encima(L);
      const im = L.imgs, real = im[4], copias = im.slice(0, 4), o = Math.max(1, S.PX * (k.escala || 1));
      const bien = im.length === 5 && copias.every(a => a[0] === S.white(real[0]) && [1, 2, 3, 4, 7, 8].every(i => Math.abs(a[i] - real[i]) < 1e-9)) &&
        copias.map(a => [a[5] - real[5], a[6] - real[6]].join()).sort().join('|') === [[-o, 0], [0, -o], [0, o], [o, 0]].map(v => v.join()).sort().join('|');
      if (!bien) mal.push({ caso: k.nombre, dibujos: im.length, real: real && real.slice(1), copias: copias.map(a => a.slice(1)) });
    }
    t(`repintar() elige la misma hoja, celda y posición que Animator.draw (sprites.js real, ${casos.length} casos: carga, respaldo de Idle, fuera de la hoja, reducido y shiny); el contorno, a ±1 píxel de arte`,
      !mal.length, mal);
  } catch (e) { t('repintar frente a Animator.draw', false, String(e && e.stack || e)); }

  try {
    // F4. El salto que tapado() suma a cada enemigo es el lift con el que lo pinta enemy.js draw().
    const m = /const lift = ([^;\n]+);\r?\n\s*this\.anim\.draw\(ctx, this\.x, this\.y - lift,/.exec(rd('js/entities/enemy.js'));
    const C = mundo().C, f = m && new Function('return ' + m[1]);
    const mal = [];
    for (const flying of [false, true]) for (const boss of [false, true]) for (const bob of [0, 1, 2.5, 4.4]) for (const jumpLift of [undefined, 0, 20, 46]) {
      const e = { flying, boss, bob, jumpLift }, a = f ? f.call(e) : NaN, b = C.alzado(e);
      if (!(Math.abs(a - b) < 1e-9)) mal.push({ e, enemy: a, claridad: b });
    }
    t('tapado(): el salto de cada enemigo es el lift con el que lo pinta enemy.js draw() (flota, salta, jefe)', !!m && !mal.length, m ? mal.slice(0, 3) : 'no encuentro el lift de draw() en enemy.js');
  } catch (e) { t('el salto de enemy.js', false, String(e && e.stack || e)); }

  const failed = r.filter(x => !x[1]);
  if (!failed.length) ok(`claridad en partida: ${r.length} casos bien`);
  for (const [name, , detail] of failed) bad(`claridad: ${name}${detail !== undefined ? ' · ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
}

// ---------------- 12. arreglos de upstream: biomas desde el minuto 12 y el fogonazo de la grieta ----------------
function arreglosChecks() {
  console.log('12. Arreglos de upstream: biomas desde el minuto 12 (world.js y tiles.js reales) y el fogonazo de la grieta');
  const r = [];
  const t = (name, cond, detail) => r.push([name, !!cond, detail]);
  const gsrc = rd('js/game.js');
  const trozo = (re, que) => { const m = gsrc.match(re); if (!m) throw new Error('no encuentro en js/game.js: ' + que); return m[0]; };
  let resumen = '';
  // El cambio de bioma de update(), tal cual, con world.js y tiles.js reales.
  function partida(biomasEnCiclo = true) {
    const c = { console };
    vm.createContext(c);
    c.window = c; c.G = {};
    for (const f of ['js/core/util.js', 'js/core/mods.js']) vm.runInContext(rd(f), c, { filename: f });
    c.G.Sprites = { PX: 2 };
    for (const f of ['js/world/tiles.js', 'js/world/world.js']) vm.runInContext(rd(f), c, { filename: f });
    const G = c.G, avisos = [];
    G.MODS.biomasEnCiclo = biomasEnCiclo;
    Object.assign(G, { Rift: { inArena: false }, Audio: { sfx() {} }, Spawner: { say: s => avisos.push(s) }, FX: { ring() {} }, Camera: { outerRadius: () => 500 } });
    const cambio = trozo(/    const b = Math\.floor\(time \/ 240\);\r?\n    if \(b !== biome && !G\.Rift\.inArena\) \{[\s\S]*?\r?\n    \}\r?\n/, 'el cambio de bioma de update()');
    vm.runInContext(`var __P = (() => { let biome = 0, time = 0; const pl = { x: 0, y: 0 };
      G.World.reset(1234); G.World.setBiome(0, true);
      return { a(tt) { time = tt;
${cambio}      } }; })();`, c, { filename: 'js/game.js (cambio de bioma)' });
    let roto = null;
    const ver = min => {
      for (let s = 0; s <= min * 60; s += 5) { try { c.__P.a(s); } catch (e) { roto = roto || e.message; } }   // en el juego, el bucle lo atrapa y lo repite cada fotograma
      let nombre; try { nombre = roto ? 'ERROR: ' + roto : G.World.biomeName(); } catch (e) { nombre = 'ERROR: ' + e.message; }
      return { min, i: G.World.biome, nombre, liquido: G.World.biome < G.Tiles.BIOMES.length ? G.World.liquidKind() : null,
               danio: G.World.biome < G.Tiles.BIOMES.length ? !!G.World.liquidEffect(['normal']).dmg : null };
    };
    return { G, ver, avisos };
  }
  try {
    const P = partida(true), N = P.G.Tiles.NORMAL, B = P.G.Tiles.BIOMES;
    const fila = [0, 4, 8, 12, 16, 24, 60, 84, 120].map(P.ver);
    const esperado = fila.map(f => Math.floor(f.min / 4) % N);
    resumen = fila.map(f => `${f.min}′ ${f.i} ${f.nombre}`).join(', ');
    t('con el arreglo: a los 0, 4, 8, 12, 16, 24, 60, 84 y 120 min, el bioma normal que toca (cada 4 min, en ciclo de 3)',
      fila.every((f, k) => f.i === esperado[k] && f.nombre === B[esperado[k]].name), fila.map(f => `${f.min}: ${f.i} ${f.nombre}`));
    t('con el arreglo: el líquido y el daño de los charcos, los del bioma normal (sólo el volcán quema)',
      fila.every(f => f.liquido === B[f.i].liquid && f.danio === (f.liquido === 'lava')) && fila[4].liquido === 'water' && !fila[4].danio,
      fila.map(f => `${f.min}: ${f.liquido}${f.danio ? ' (quema)' : ''}`));
    t('con el arreglo: el aviso de bioma nunca dice «Grieta»', P.avisos.length > 0 && !P.avisos.some(s => /Grieta/.test(s)), P.avisos.slice(0, 6));
    const O = partida(false);
    const ctl = [12, 16, 84].map(O.ver);
    t('control (biomasEnCiclo = false, como upstream): a los 12 min «Grieta · …», a los 16 lava que quema y a los 84 se rompe (la prueba lo detecta)',
      /^Grieta · /.test(ctl[0].nombre) && ctl[1].liquido === 'lava' && ctl[1].danio && /^ERROR/.test(ctl[2].nombre), ctl.map(f => `${f.min}: ${f.i} ${f.nombre}`));
    const M = P.G.MODS;
    t('biomaNormal(): entero en [0, 3) también con negativos o decimales; con el ajuste en false, tal cual', M.biomaNormal(3) === 0 && M.biomaNormal(-1) === 2 &&
      M.biomaNormal(7.9) === 1 && (M.biomasEnCiclo = false, M.biomaNormal(5) === 5));
  } catch (e) { t('biomas', false, String(e && e.stack || e)); }

  // El fogonazo de la grieta en el estado 'choice' (elegir fusión): frame() de game.js, tal cual.
  try {
    const fFlash = trozo(/  let flashT = 0, flashDur = 1, flashCol = '#fff';\r?\n  function flash\(col, dur\) \{[^\n]*\}\r?\n/, 'flash()');
    const fFrame = trozo(/  function frame\(ts\) \{[\s\S]*?\r?\n  \}\r?\n/, 'frame()');
    const fogonazo = (activo, estado) => {
      const c = { console };
      vm.createContext(c);
      c.G = { MODS: { destelloSinCongelar: activo }, Settings: { sample() {} }, FX: { update() {} }, Coop: { active: false }, UI: { tick() {} }, Input: { endFrame() {} } };
      vm.runInContext(`var __F = (() => { let state = '${estado}', pl = { anim: { update() {} } }, last = 0, speedK = 1, frameDt = 0, fpsAcc = 0, fpsN = 0, fpsShown = 60;
        const w = 1, h = 1, dpr = 1, ctx = null; function handleKeys() {} function update() {} function render() {} const Backdrop = { render() {} };
${fFlash}${fFrame}        return { flash, frame, get flashT() { return flashT; } }; })();`, c, { filename: 'js/game.js (frame)' });
      const F = c.__F;
      F.flash('#c9a6ff', 0.8);
      for (let k = 1; k <= 45; k++) F.frame(k * 1000 / 60);   // 0,75 s
      return F.flashT;
    };
    const eleccion = fogonazo(true, 'choice'), espera = fogonazo(true, 'held'), ctl = fogonazo(false, 'choice');
    t("el fogonazo de la vuelta de la grieta se apaga también eligiendo la fusión ('choice') o esperando al otro ('held'); control como upstream: congelado",
      eleccion <= 0.06 && espera <= 0.06 && ctl === 0.8, { eleccion, espera, control: ctl });
  } catch (e) { t('fogonazo de la grieta', false, String(e && e.stack || e)); }

  const failed = r.filter(x => !x[1]);
  if (!failed.length) ok(`arreglos de upstream: ${r.length} casos bien (biomas: ${resumen})`);
  for (const [name, , detail] of failed) bad(`arreglos: ${name}${detail !== undefined ? ' · ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
}

// ---------------- 13. pantallas: móviles en vertical y plegables ----------------
function pantallasChecks() {
  console.log('13. Pantallas: «Gira el móvil» sólo en un móvil en vertical (plegables y tabletas juegan)');
  const r = [];
  const t = (name, cond, detail) => r.push([name, !!cond, detail]);
  const nuevo = (mods = {}) => {
    const c = { console };
    vm.createContext(c);
    c.window = c; c.G = {};
    for (const f of ['js/core/util.js', 'js/core/mods.js']) vm.runInContext(rd(f), c, { filename: f });
    Object.assign(c.G.MODS, mods);
    return c;
  };
  try {
    const M = nuevo().G.MODS;
    const tabla = { '390x844': true, '412x915': true, '360x640': true, '430x932': true, '844x390': false, '800x870': false, '870x800': false,
      '900x1000': false, '1000x900': false, '768x1024': false, '600x960': false, '560x700': false,
      // Magic V6 (tamaños de la verificación): interior en vertical y en horizontal, exterior en horizontal y en vertical, y una mitad de la interior.
      '724x784': false, '784x724': false, '807x360': false, '360x807': true, '362x784': true };
    const mal = Object.entries(tabla).filter(([k, v]) => { const [w, h] = k.split('x').map(Number); return M.pedirGiro(w, h) !== v; });
    t('pedirGiro: un móvil en vertical (390x844, 412x915, 360x640, 430x932; el Magic V6 plegado, 360x807, y una mitad de su pantalla interior, 362x784) sí; en horizontal, un plegable desplegado (724x784, 784x724, 800x870, 900x1000 y girados) o una tableta en vertical (768x1024, 600x960), no',
      !mal.length, mal);
    const U = nuevo({ giroAspectoMax: 1, giroLadoMax: 0 }).G.MODS;
    t('con giroAspectoMax = 1 y giroLadoMax = 0, como upstream: cualquier pantalla con más alto que ancho (800x870, 768x1024) lo pide; en horizontal, no',
      U.pedirGiro(800, 870) && U.pedirGiro(768, 1024) && U.pedirGiro(390, 844) && !U.pedirGiro(870, 800));
    const fijar = (w, h) => { const c = nuevo(); c.screen = { width: w, height: h }; return c.G.MODS.fijarHorizontal(); };
    t('pantalla completa: fija la horizontal en un móvil (390x844 o 844x390), no en un plegable desplegado (870x800) ni en una tableta (1024x768)',
      fijar(390, 844) && fijar(844, 390) && !fijar(870, 800) && !fijar(1024, 768));
  } catch (e) { t('pedirGiro', false, String(e && e.stack || e)); }
  try {
    // checkOrientation() de game.js, tal cual, con un document y una ventana de mentira.
    const m = rd('js/game.js').match(/  function checkOrientation\(\) \{[\s\S]*?\r?\n  \}\r?\n/);
    if (!m) throw new Error('no encuentro checkOrientation() en js/game.js');
    const prueba = (w, h, tactil = true, mods = {}) => {
      const c = nuevo(mods), clase = new Set(['hidden']);
      const el = { classList: { toggle(k, on) { if (on) clase.add(k); else clase.delete(k); } } }, ico = { innerHTML: '' };
      c.innerWidth = w; c.innerHeight = h;
      c.document = { getElementById: id => (id === 'rotate' ? el : id === 'rotate-ico' ? ico : null) };
      Object.assign(c.G, { Touch: { active: tactil }, Icons: { html: () => '<i></i>' } });
      vm.runInContext('var __pausas = 0; function autoPause() { __pausas++; }\n' + m[0] + 'checkOrientation();', c, { filename: 'js/game.js (checkOrientation)' });
      return { gira: !clase.has('hidden'), pausa: c.__pausas > 0 };
    };
    const casos = {
      movilVertical: prueba(390, 844), movilHorizontal: prueba(844, 390), plegable800x870: prueba(800, 870), plegable870x800: prueba(870, 800),
      plegable900x1000: prueba(900, 1000), plegable1000x900: prueba(1000, 900), tableta: prueba(768, 1024), pcAlto: prueba(390, 844, false),
      upstream800x870: prueba(800, 870, true, { giroAspectoMax: 1, giroLadoMax: 0 })
    };
    t('checkOrientation() real: «Gira el móvil» y pausa en un móvil en vertical; un plegable desplegado (800x870, 870x800, 900x1000, 1000x900) o una tableta juegan; sin táctil, nunca; control como upstream: el plegable lo pedía',
      casos.movilVertical.gira && casos.movilVertical.pausa && !casos.movilHorizontal.gira && !casos.plegable800x870.gira && !casos.plegable800x870.pausa &&
      !casos.plegable870x800.gira && !casos.plegable900x1000.gira && !casos.plegable1000x900.gira && !casos.tableta.gira && !casos.pcAlto.gira && casos.upstream800x870.gira, casos);
  } catch (e) { t('checkOrientation', false, String(e && e.stack || e)); }
  const failed = r.filter(x => !x[1]);
  if (!failed.length) ok(`pantallas: ${r.length} casos bien`);
  for (const [name, , detail] of failed) bad(`pantallas: ${name}${detail !== undefined ? ' · ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
}

// ---------------- 14. identidad visual «Dex de Expedición» ----------------
/** Tabla name y glifos (cmap) de un woff2, para comprobar la licencia y la cobertura sin herramientas de fuera. */
function leerWoff2(f) {
  const b = fs.readFileSync(path.join(ROOT, f));
  if (b.toString('latin1', 0, 4) !== 'wOF2') throw new Error(f + ' no es woff2');
  const TAGS = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH',
    'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln',
    'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];
  const n = b.readUInt16BE(12), comp = b.readUInt32BE(20);
  let o = 48;
  const b128 = () => { let v = 0; for (let i = 0; i < 5; i++) { const c = b[o++]; v = (v << 7) | (c & 0x7f); if (!(c & 0x80)) return v >>> 0; } return v >>> 0; };
  const tabs = [];
  for (let i = 0; i < n; i++) {
    const fl = b[o++];
    let tag = TAGS[fl & 63];
    if ((fl & 63) === 63) { tag = b.toString('latin1', o, o + 4); o += 4; }
    const orig = b128(), trans = tag === 'glyf' || tag === 'loca' ? (fl >> 6) === 0 : (fl >> 6) !== 0;
    tabs.push({ tag, len: trans ? b128() : orig });
  }
  const data = require('zlib').brotliDecompressSync(b.subarray(o, o + comp));
  const T = {};
  let off = 0;
  for (const t of tabs) { T[t.tag] = { off, len: t.len }; off += t.len; }
  const d = data.subarray(T.name.off, T.name.off + T.name.len), nombres = {};
  for (let i = 0, cnt = d.readUInt16BE(2), so = d.readUInt16BE(4); i < cnt; i++) {
    const r = 6 + i * 12, pid = d.readUInt16BE(r), id = d.readUInt16BE(r + 6), l = d.readUInt16BE(r + 8), po = d.readUInt16BE(r + 10);
    const raw = Buffer.from(d.subarray(so + po, so + po + l));
    if (pid === 3 || pid === 0) nombres[id] = raw.swap16().toString('utf16le'); else if (!nombres[id]) nombres[id] = raw.toString('latin1');
  }
  const cm = data.subarray(T.cmap.off, T.cmap.off + T.cmap.len), glifos = new Set();
  for (let i = 0, nt = cm.readUInt16BE(2); i < nt; i++) {
    const so = cm.readUInt32BE(8 + i * 8), fmt = cm.readUInt16BE(so);
    if (fmt === 4) {
      const seg = cm.readUInt16BE(so + 6) / 2, fin = so + 14, ini = fin + seg * 2 + 2;
      for (let s = 0; s < seg; s++) for (let c = cm.readUInt16BE(ini + s * 2), e = cm.readUInt16BE(fin + s * 2); c <= e && c !== 0xffff; c++) glifos.add(c);
    } else if (fmt === 12) {
      for (let k = 0, g = cm.readUInt32BE(so + 12); k < g; k++) for (let c = cm.readUInt32BE(so + 16 + k * 12), e = cm.readUInt32BE(so + 20 + k * 12); c <= e; c++) glifos.add(c);
    }
  }
  return { nombres, glifos, bytes: b.length };
}

function identidadChecks() {
  console.log('14. Identidad visual «Dex de Expedición» (fuentes, licencia, estilo, menús)');
  const r = [];
  const t = (name, cond, detail) => r.push([name, !!cond, detail]);

  // ---- A. Fuentes en local y su licencia ----
  try {
    const FUENTES = { 'assets/fonts/MPLUSRounded1c-500-latin.woff2': 'Medium', 'assets/fonts/MPLUSRounded1c-800-latin.woff2': 'ExtraBold' };
    const info = {};
    for (const [f, peso] of Object.entries(FUENTES)) {
      if (!ex(f)) { info[f] = 'no existe'; continue; }
      const w = leerWoff2(f);
      info[f] = { kb: +(w.bytes / 1024).toFixed(1), copyright: w.nombres[0], nombre: w.nombres[4], licencia: w.nombres[14], glifos: w.glifos.size,
        faltan: [...'áéíóúñüÁÉÍÓÚÑÜ¡¿º×…·–—’“”«»%€'].filter(ch => !w.glifos.has(ch.codePointAt(0))).join('') , peso };
    }
    const bien = Object.values(info).every(x => x && x.kb > 12 && x.kb < 48 && x.copyright === 'Copyright 2016 The Rounded M+ Project Authors.' &&
      /scripts\.sil\.org\/OFL/.test(x.licencia || '') && x.nombre === 'Rounded Mplus 1c ' + x.peso && !x.faltan);
    t('las dos fuentes de M PLUS Rounded 1c (500 y 800) están en assets/fonts, en woff2, con su copyright (The Rounded M+ Project Authors) y la OFL en su tabla name, y con los acentos, ñ, ¡¿, «», ×, …, · y –— de los textos', bien, info);
    // «…» (U+2026) con la letra de reserva: M PLUS lo dibuja con los puntos a media altura. Las dos caras de M PLUS de
    // tokens-dex.css lo dejan fuera de su unicode-range y cubren el resto (los mismos caracteres de arriba y el latín).
    const caras = [...rd('css/tokens-dex.css').matchAll(/@font-face\s*\{([^}]*)\}/g)].map(m => m[1]).filter(b => /M PLUS Rounded 1c/.test(b));
    const rangos = caras.map(b => { const m = /unicode-range:\s*([^;]+);/.exec(b); return m ? m[1].split(',').map(x => x.trim().replace(/^U\+/i, '').split('-').map(h => parseInt(h, 16))).map(([a, z]) => [a, z === undefined ? a : z]) : null; });
    const cubre = (r, cp) => r.some(([a, z]) => cp >= a && cp <= z);
    const usados = [...'áéíóúñüÁÉÍÓÚÑÜ¡¿º×·–—’“”«»%€ AZaz09'].map(ch => ch.codePointAt(0));
    t('«…» con la letra de reserva (los puntos en la línea base, no a media altura): las dos caras de M PLUS de css/tokens-dex.css dejan U+2026 fuera de su unicode-range y cubren el resto de los caracteres de los textos',
      caras.length === 2 && rangos.every(r => r && !cubre(r, 0x2026) && usados.every(cp => cubre(r, cp))), rangos);
    const ofl = ex('assets/fonts/OFL-MPLUSRounded1c.txt') ? rd('assets/fonts/OFL-MPLUSRounded1c.txt') : '';
    t('assets/fonts/OFL-MPLUSRounded1c.txt: «SIL Open Font License, Version 1.1» y «Rounded M+ Project Authors»; se conserva OFL.txt (Pixelify Sans)',
      /SIL Open Font License, Version 1\.1/.test(ofl) && /Copyright 2016 The Rounded M\+ Project Authors/.test(ofl) && ex('assets/fonts/OFL.txt') && /Pixelify Sans/.test(rd('assets/fonts/OFL.txt')) && ex('assets/fonts/PixelifySans.ttf'));
    const cr = rd('CREDITS.md');
    t('CREDITS.md cita las dos fuentes con su licencia (M PLUS Rounded 1c y Pixelify Sans, OFL)',
      /M PLUS Rounded 1c/.test(cr) && /Rounded M\+ Project Authors/.test(cr) && /OFL-MPLUSRounded1c\.txt/.test(cr) && /Pixelify Sans/.test(cr) && /Open Font License/.test(cr));
  } catch (e) { t('fuentes y licencia', false, String(e && e.stack || e)); }


  // ---- B. Las cifras de css/tokens-dex.css y js/ui/marca.js coinciden (las comparte el DOM y el lienzo) ----
  /** G.MARCA real (marca.js) en un contexto aparte. */
  const marca = () => { const c = { console }; c.window = c; vm.createContext(c); vm.runInContext(rd('js/ui/marca.js'), c, { filename: 'js/ui/marca.js' }); return c.G.MARCA; };
  try {
    const M = marca(), css = rd('css/tokens-dex.css');
    const raiz = css.slice(css.indexOf(':root {'), css.indexOf('@media'));
    const vars = {};
    for (const m of raiz.matchAll(/(--[\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
    const norm = v => String(v).replace(/\s+/g, '').toLowerCase(), camel = k => k.replace(/-([a-z0-9])/g, (_, x) => x.toUpperCase());
    let iguales = 0;
    const mal = [];
    const cmp = (k, v) => { if (norm(vars[k]) === norm(v)) iguales++; else mal.push(`${k}: css=${vars[k]} js=${v}`); };
    const alias = { '--color-ps-bajo-destello': 'psBajoDestello', '--color-cristal-hud': 'cristalHUD' };
    for (const k of Object.keys(vars).filter(x => x.startsWith('--color-'))) {
      const jk = alias[k] || camel(k.slice(8));
      if (!(jk in M.color)) { mal.push(`${k}: no existe G.MARCA.color.${jk}`); continue; }
      cmp(k, M.color[jk]);
    }
    for (const [tipo, [fondo]] of Object.entries(M.tipoPildora)) cmp('--tipo-' + tipo, fondo);
    cmp('--tipo-filo', M.filoTipo);
    for (const [k, j] of Object.entries({ '--fs-1': 'sm', '--fs-2': 'md', '--fs-3': 'lg', '--fs-4': 'xl', '--fs-5': 'x2', '--fs-6': 'x3' })) cmp(k, M.escalaTipo[j] + 'px');
    M.espacio.forEach((v, i) => cmp('--space-' + i, v ? v + 'px' : '0'));
    for (const i of [0, 1, 2, 3]) cmp('--radius-' + i, M.radio['r' + i] + 'px');
    cmp('--font-peso-normal', M.peso.normal); cmp('--font-peso-fuerte', M.peso.fuerte);
    cmp('--dur-micro', M.tiempo.micro + 'ms'); cmp('--dur-entrada', M.tiempo.entrada + 'ms');
    const ps = [M.color.psAlto, M.color.psMedio, M.color.psBajo].map(norm);
    t(`css/tokens-dex.css y js/ui/marca.js dicen lo mismo (${iguales} cifras: colores, tipos, letra, espacio, radios, tiempos) y la barra rival no es un color de PS`,
      !mal.length && iguales >= 70 && !ps.includes(norm(M.color.rival)) && norm(M.color.rival) === '#9b6bff', mal);
    t('G.MARCA sólo lleva lo visual: el horno, el iris, el golpe final y la tabla de Calidad son ajustes de js/core/mods.js (revisión cruzada)',
      ['horneado', 'iris', 'golpeFinal', 'calidad'].every(k => !(k in M)) && M.escalaHUD(1440, 900) === 1.25 && M.escalaHUD(1920, 1080) === 1.25 && M.escalaHUD(2560, 1440) === 1.25 &&
      M.escalaHUD(1280, 720) === 1 && M.ESCALA_HUD_MAX === 1.25);
    t('escala del HUD con tope de 1,25 (Nico: «a veces creo que ocupa demasiado»; la guía llegaba a 1,5) y filas compactas de como mucho 40 + 26 px',
      M.ESCALA_HUD_MAX === 1.25 && M.hud.compacto.adaptable.fila1[2] === 40 && M.hud.compacto.adaptable.fila2[2] === 26 && M.hud.compacto.bandaSuperiorMax === 76,
      { max: M.ESCALA_HUD_MAX, adaptable: M.hud.compacto.adaptable });
  } catch (e) { t('tokens y marca', false, String(e && e.stack || e)); }

  // ---- C. G.Estilo (js/ui/estilo.js) con settings.js, mods.js y marca.js reales ----
  /** Un navegador mínimo para estilo.js: localStorage de mentira (que sobrevive a una «recarga»), un
   *  CanvasRenderingContext2D con su accesor font y un document sin pantallas. */
  const almacen = {};
  function cargarEstilo({ mods = {}, guardado = null, alto = 900, ancho = 1440, extra = {} } = {}) {
    if (guardado !== null) almacen['ps.settings'] = JSON.stringify(guardado);
    const clases = new Set();
    const c = {
      console, innerHeight: alto, innerWidth: ancho,
      localStorage: { getItem: k => (k in almacen ? almacen[k] : null), setItem: (k, v) => { almacen[k] = String(v); } },
      matchMedia: () => ({ matches: false }), navigator: {}, location: { protocol: 'file:' },
      document: { documentElement: { classList: { toggle: (k, on) => (on ? clases.add(k) : clases.delete(k)), contains: k => clases.has(k) } },
        getElementById: () => null, querySelector: () => null, fonts: { load: () => Promise.resolve([]) }, body: null }
    };
    function Ctx() { this._f = '10px sans-serif'; }
    Object.defineProperty(Ctx.prototype, 'font', { configurable: true, enumerable: true, get() { return this._f; }, set(v) { this._f = v; } });
    c.CanvasRenderingContext2D = Ctx;
    c.window = c; c.G = {};
    vm.createContext(c);
    for (const f of ['js/core/util.js', 'js/core/mods.js', 'js/ui/marca.js', 'js/core/settings.js']) vm.runInContext(rd(f), c, { filename: f });
    Object.assign(c.G.MODS, mods);
    Object.assign(c.G, extra);
    vm.runInContext(rd('js/ui/estilo.js'), c, { filename: 'js/ui/estilo.js' });
    return { c, G: c.G, E: c.G.Estilo, clases, Ctx };
  }
  try {
    for (const k of Object.keys(almacen)) delete almacen[k];
    const a = cargarEstilo();
    const pd = { actual: a.E.actual, clase: a.clases.has('estilo-dex') };
    const b = cargarEstilo({ mods: { estiloPorDefecto: 'dex' } });
    const pdDex = { actual: b.E.actual, clase: b.clases.has('estilo-dex') };
    b.E.set('dex');
    const c2 = cargarEstilo();   // «recarga» con lo guardado: gana al valor de mods.js
    const recarga = c2.E.actual;
    c2.E.set('clasico');
    const vuelta = { actual: c2.E.actual, clase: c2.clases.has('estilo-dex'), guardado: JSON.parse(almacen['ps.settings']).estilo };
    const raro = cargarEstilo({ guardado: { estilo: 'arcoiris' } }).E.actual;
    const rechaza = c2.E.set('arcoiris') === false && c2.E.actual === 'clasico';
    t("estilo: el valor por defecto sale de G.MODS.estiloPorDefecto ('clasico' en este lote); la elección se guarda en G.Settings, sobrevive a una recarga y gana al de mods.js; un valor raro vale el de mods.js",
      pd.actual === 'clasico' && !pd.clase && pdDex.actual === 'dex' && pdDex.clase && recarga === 'dex' && vuelta.actual === 'clasico' && !vuelta.clase &&
      vuelta.guardado === 'clasico' && raro === 'clasico' && rechaza, { pd, pdDex, recarga, vuelta, raro });
    const mods = rd('js/core/mods.js');
    t("js/core/mods.js: estiloPorDefecto: 'clasico' mientras se implementa la identidad", /\n  estiloPorDefecto: 'clasico',/.test(mods));
  } catch (e) { t('interruptor de estilo', false, String(e && e.stack || e)); }

  try {
    // Fuente del lienzo: con Dex, «… Pixelify …» pasa a M PLUS (≥ 600 -> 800; el resto, 500); con Clásico, nada.
    for (const k of Object.keys(almacen)) delete almacen[k];
    const { E, Ctx } = cargarEstilo();
    const FAM = '"M PLUS Rounded 1c","Segoe UI",system-ui,sans-serif';
    const casos = {
      '700 13px Pixelify,"Segoe UI",sans-serif': '800 13px ' + FAM, '600 10px Pixelify, monospace': '800 10px ' + FAM,
      '400 11px Pixelify,"Segoe UI",system-ui,sans-serif': '500 11px ' + FAM, '16px Pixelify': '500 16px ' + FAM,
      'bold 12px Pixelify, monospace': '800 12px ' + FAM, '700 14.5px Pixelify': '800 14.5px ' + FAM,
      '12px sans-serif': '12px sans-serif', '700 20px "Segoe UI"': '700 20px "Segoe UI"'
    };
    const x = new Ctx(), clasico = {}, dex = {};
    for (const f of Object.keys(casos)) { x.font = f; clasico[f] = x.font; }
    E.set('dex');
    for (const f of Object.keys(casos)) { x.font = f; dex[f] = x.font; }
    const mal = Object.keys(casos).filter(f => clasico[f] !== f || dex[f] !== casos[f]);
    const cacheIgual = E.fuenteCanvas('700 13px Pixelify') === E.fuenteCanvas('700 13px Pixelify');
    // Las cadenas reales de upstream y de claridad.js: todas cambian con Dex.
    const reales = [];
    for (const f of ['js/ui/hud.js', 'js/entities/fx.js', 'js/entities/player.js', 'js/systems/events.js', 'js/game.js', 'js/ui/slots.js', 'js/entities/claridad.js']) {
      for (const m of rd(f).matchAll(/font = (['`])([^'`$]*?\d+px[^'`]*?Pixelify[^'`]*)\1/g)) reales.push(m[2]);
    }
    // Y las que upstream monta (F() de hud.js, la concatenación de fx.js y la de claridad.js): cada «ctx.font = …»
    // con Pixelify (o F(…) en hud.js) se evalúa tal cual, con las variables libres de comodín, en las dos ramas.
    const montadas = [];
    // F de hud.js (events.js la recibe de hud.js como parámetro).
    const defF = (/const F = \(w, s\) => `[^`]*`;/.exec(rd('js/ui/hud.js').replace(/\r/g, '')) || [''])[0].replace(/^const F = /, '').replace(/;$/, '');
    const evaluar = (expr, verdad) => {
      const comodin = new Proxy(function () {}, { get: (o, k) => (k === Symbol.toPrimitive ? () => 1 : typeof k === 'symbol' ? undefined : verdad ? comodin : undefined) });
      const libres = new Proxy({}, { has: (o, k) => typeof k === 'string' && !['Math', 'String', 'Number', 'F'].includes(k),
        get: (o, k) => (typeof k === 'symbol' ? undefined : verdad ? comodin : 0) });
      const c = { libres }; vm.createContext(c);
      return vm.runInContext('var F = ' + (defF || 'undefined') + '; with (libres) { (' + expr + '); }', c);
    };
    /** La expresión que se asigna a ctx.font: hasta el «;», la «,» o el «)» que la cierran (puede ir dentro de un paréntesis). */
    const expresion = (src, i) => {
      let prof = 0, j = i, cad = null;
      for (; j < src.length; j++) {
        const ch = src[j];
        if (cad) { if (ch === '\\') j++; else if (ch === cad) cad = null; continue; }
        if (ch === "'" || ch === '"' || ch === '`') { cad = ch; continue; }
        if (ch === '(') prof++;
        else if (ch === ')') { if (!prof) break; prof--; }
        else if ((ch === ';' || ch === ',' || ch === '\n') && !prof) break;
      }
      return src.slice(i, j).trim();
    };
    for (const f of ['js/ui/hud.js', 'js/entities/fx.js', 'js/entities/claridad.js', 'js/entities/player.js', 'js/systems/events.js', 'js/game.js', 'js/ui/slots.js']) {
      const src = rd(f).replace(/\r/g, '');
      for (const m of src.matchAll(/\bctx\.font = /g)) {
        const expr = expresion(src, m.index + m[0].length);
        if (!/Pixelify|\bF\(/.test(expr)) continue;
        for (const verdad of [true, false]) {
          try { montadas.push({ f, expr, font: evaluar(expr, verdad) }); } catch (e) { montadas.push({ f, expr, error: String(e.message || e) }); }
        }
      }
    }
    const porFichero = n => montadas.filter(x => x.f === n).length / 2;
    const sinCambio = reales.filter(f => !/^(500|800) \d+(\.\d+)?px "M PLUS Rounded 1c"/.test(E.fuenteCanvas(f)))
      .concat(montadas.filter(x => x.error || typeof x.font !== 'string' || !/Pixelify/.test(x.font) || !/^(500|800) \d+(\.\d+)?px "M PLUS Rounded 1c"/.test(E.fuenteCanvas(x.font))).map(x => x.f + ': ' + x.expr + ' -> ' + (x.error || x.font)));
    t(`fuente del lienzo (setter de CanvasRenderingContext2D.prototype.font): con Clásico ningún cambio; con Dex, «700 13px Pixelify…» -> «800 13px "M PLUS Rounded 1c"…», 600 -> 800, 400 y sin peso -> 500, «bold» -> 800; lo que no es Pixelify, igual; y cada «ctx.font = …» con Pixelify de upstream y de claridad.js, también las montadas (${porFichero('js/ui/hud.js')} con F() en hud.js, ${porFichero('js/entities/fx.js')} en fx.js, ${porFichero('js/entities/claridad.js')} en claridad.js), pasa a M PLUS`,
      !mal.length && cacheIgual && !sinCambio.length && porFichero('js/ui/hud.js') >= 20 && porFichero('js/entities/fx.js') >= 1 && porFichero('js/entities/claridad.js') >= 1 && reales.length >= 6,
      { mal: mal.map(f => ({ f, clasico: clasico[f], dex: dex[f] })), sinCambio, hud: porFichero('js/ui/hud.js'), reales: reales.length });
  } catch (e) { t('fuente del lienzo', false, String(e && e.stack || e)); }

  try {
    // Ajustes: la sección «Estilo» (la primera de Gráficos), los créditos y el texto de los controles.
    for (const k of Object.keys(almacen)) delete almacen[k];
    const { E, G, c: ctxE } = cargarEstilo();
    const caja = () => {
      const B = { html: '', pos: [], insertAdjacentHTML(p, h) { this.pos.push(p); this.html = p === 'afterbegin' ? h + this.html : this.html + h; },
        querySelectorAll(sel) {
          if (sel === '[data-estilo]') return [...B.html.matchAll(/data-estilo="([^"]+)"/g)].map(m => ({ dataset: { estilo: m[1] } }));
          if (sel === 'ul.credits li') return B.lis || [];
          if (sel === 'p.sub') return B.ps || [];
          return [];
        }, querySelector: () => null };
      return B;
    };
    const g = caja();
    g.html = '<h3 class="set-h">Idioma</h3>';
    E.ajustes(g, 'gfx');
    const botones = g.querySelectorAll('[data-estilo]');
    t('Ajustes > Gráficos: «Estilo» es la primera sección, con su texto y los dos botones (Dex y Clásico, el actual marcado)',
      g.pos[0] === 'afterbegin' && /^<h3 class="set-h">Estilo<\/h3>/.test(g.html) && g.html.indexOf('Estilo') < g.html.indexOf('Idioma') &&
      g.html.includes(E.TEXTO_ESTILO) && botones.map(b => b.dataset.estilo).join() === 'dex,clasico' &&
      /data-estilo="clasico" role="radio" aria-checked="true"/.test(g.html) && /data-estilo="dex" role="radio" aria-checked="false"/.test(g.html), g.html);
    const ab = caja(), li = { textContent: 'Fuente: Pixelify Sans (OFL).', despues: '', insertAdjacentHTML(p, h) { this.despues = p + ' ' + h; } };
    ab.lis = [{ textContent: 'Sprites: …', insertAdjacentHTML() {} }, li];
    E.ajustes(ab, 'about');
    t('Ajustes > Acerca de: «Letra del estilo Dex: M PLUS Rounded 1c (OFL)», justo después de Pixelify', /^afterend <li><b>Letra del estilo Dex:<\/b> M PLUS Rounded 1c \(OFL\)\.<\/li>$/.test(li.despues), li.despues);
    const TXT = 'Pon el dedo en cualquier parte y arrastra para moverte: el joystick aparece donde tocas. Toca un ataque de abajo para cambiarlo y el botón de arriba a la derecha para pausar. Se juega en horizontal.';
    const ctl = () => { const k = caja(); k.ps = [{ textContent: TXT }]; return k; };
    const k1 = ctl(); E.ajustes(k1, 'ctl');
    E.set('dex');
    const k2 = ctl(); E.ajustes(k2, 'ctl');
    G.HudDex = { columna: () => true };
    const k3 = ctl(); E.ajustes(k3, 'ctl');
    E.set('clasico');
    const k4 = ctl(); E.ajustes(k4, 'ctl');
    const PLEG = TXT.replace('Se juega en horizontal.', 'Se juega en horizontal (en un plegable abierto o en una tableta, también en vertical).');
    t('Ajustes > Controles: en los dos estilos, «Se juega en horizontal» añade que un plegable abierto o una tableta juegan también en vertical; «de abajo» pasa a «de la derecha» sólo con Dex y las ranuras en columna (G.HudDex, lote 2)',
      PLEG !== TXT && k1.ps[0].textContent === PLEG && k2.ps[0].textContent === PLEG && k3.ps[0].textContent === PLEG.replace('de abajo', 'de la derecha') && k4.ps[0].textContent === PLEG,
      [k1, k2, k3, k4].map(k => k.ps[0].textContent));
    // Tab (input.js): libre con una pantalla abierta o fuera de partida; anulado en partida sin pantalla.
    const tab = (estado, abierta) => { G.Game = estado === null ? undefined : { state: estado }; ctxE.document.querySelector = q => (abierta && /\.scr:not\(\.hidden\)/.test(q) ? {} : null); return E.tabLibre(); };
    const tabs = { ui: tab('ui', false), playing: tab('playing', false), held: tab('held', false), paused: tab('paused', false), levelup: tab('levelup', false),
      pausaAbierta: tab('paused', true), cartasAbiertas: tab('levelup', true), jugandoConPantalla: tab('playing', true), sinJuego: tab(null, false) };
    t("Tab (tabLibre, input.js): libre con una pantalla abierta o fuera de partida ('ui'); anulado en partida sin pantalla ('playing', 'held' mientras un compañero elige fusión, 'paused' o 'levelup' sin su pantalla)",
      tabs.ui && !tabs.playing && !tabs.held && !tabs.paused && !tabs.levelup && tabs.pausaAbierta && tabs.cartasAbiertas && tabs.jugandoConPantalla && tabs.sinJuego, tabs);
    delete G.Game;
    // Las cartas de subida de nivel: --tc, filo, foco con Tab y la píldora (Dex).
    G.Moves = { BY_ID: { ascuas: { type: 'fire' }, lenguetazo: { type: 'ghost' } } };
    const carta = () => {
      const nodo = { nodeType: 3, nodeValue: 'EVOLUCIÓN' }, chip = { style: {}, childNodes: [nodo] };
      return { css: {}, style: { setProperty(k, v) { this.owner.css[k] = v; } }, dataset: {}, clases: new Set(), attrs: {}, teclas: 0, tabIndex: -1,
        classList: { add(k) { this.owner.clases.add(k); } }, setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(k) { if (k === 'keydown') this.teclas++; },
        querySelector: q => (q === '.tag-chip' ? chip : null), chip, nodo, init() { this.style.owner = this; this.classList.owner = this; return this; } }.init();
    };
    const cl = carta(); E.carta(cl, { key: 'new:ascuas', type: 'new', color: '#ff7b3d' });
    E.set('dex');
    const dx = carta(); E.carta(dx, { key: 'up:lenguetazo', type: 'up', color: '#7a6bc4' });
    const ev = carta(); E.carta(ev, { key: 'evo:ascuas', type: 'evo', color: '#ffd23f' });
    const st = carta(); E.carta(st, { key: 'stat:speed', type: 'stat', color: '#8fa3c4' });
    t('cartas de nivel: --tc con el color del tipo (evolución en oro, mejoras con el suyo), filo en Fantasma, tabindex y role=button con Intro en los dos estilos; la píldora con su tinta (Fantasma oscurecido) y sin mayúsculas sólo en Dex',
      cl.css['--tc'] === '#ff7b3d' && cl.tabIndex === 0 && cl.attrs.role === 'button' && cl.teclas === 1 && !cl.chip.style.background && cl.nodo.nodeValue === 'EVOLUCIÓN' &&
      dx.css['--tc'] === '#7a6bc4' && dx.clases.has('tc-filo') && dx.dataset.tipo === 'ghost' && dx.chip.style.background === '#7164B6' && dx.chip.style.color === '#FFFFFF' &&
      ev.css['--tc'] === '#FFCB3D' && ev.nodo.nodeValue === 'Evolución' && st.css['--tc'] === '#8fa3c4' && !st.dataset.tipo,
      { clasico: cl.css, fantasma: [dx.css, dx.chip.style], evo: [ev.css, ev.nodo.nodeValue], mejora: st.css });
  } catch (e) { t('Ajustes y cartas', false, String(e && e.stack || e)); }

  try {
    // Franja de tipo: ≥ 3:1 contra el fondo de la carta (cristal 2) en los 18 tipos, con el filo claro donde no llega.
    const M = marca(), c = { console }; c.window = c; c.G = {}; vm.createContext(c); vm.runInContext(rd('js/core/util.js'), c, { filename: 'js/core/util.js' });
    const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const lum = v => { const [r, g, b] = v.map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const fondo = rgb(M.color.cristal2), filo = [238, 246, 247], af = 0.35;
    const tabla = {}, mal = [];
    for (const [tipo, col] of Object.entries(c.G.U.TYPE_COLOR)) {
      const base = ratio(rgb(col), fondo);
      const conFilo = M.tipoConFilo.includes(tipo) ? ratio(rgb(col).map((v, i) => Math.round(v * (1 - af) + filo[i] * af)), fondo) : null;
      tabla[tipo] = +(Math.max(base, conFilo || 0)).toFixed(2);
      if (!(base >= 3 || conFilo >= 3)) mal.push({ tipo, base: +base.toFixed(2), conFilo: conFilo && +conFilo.toFixed(2) });
    }
    t('franja de tipo: ≥ 3:1 contra el fondo de la carta en los 18 tipos (Fantasma, Dragón y Siniestro, con su filo claro de 1 px)', Object.keys(tabla).length === 18 && !mal.length, mal.length ? mal : tabla);
  } catch (e) { t('contraste de la franja', false, String(e && e.stack || e)); }

  try {
    // Lienzos al tamaño en que se ven y sin cortes: encaje() (pura) y los tamaños del compañero y del premio.
    for (const k of Object.keys(almacen)) delete almacen[k];
    const { E } = cargarEstilo();
    const dentro = (e, W, H) => e.fx - e.k * e.caja[0] >= 2 && e.fx + e.k * e.caja[2] <= W - 2 && e.fy - e.k * e.caja[1] >= 2 && e.fy + e.k * e.caja[3] <= H - 2;
    // Cajas opacas medidas en el navegador (píxeles de arte respecto a los pies, dirección 1): Mewtwo y Eternatus.
    const mewtwo = { Idle: [11.5, 32.5, 16.5, 3.5], Attack: [19.5, 31.5, 37.5, 25.5], Shoot: [18.5, 28.5, 25.5, 9.5], Charge: [13.5, 28.5, 15.5, 4.5] };
    const eternatus = { Idle: [48.5, 60.5, 59.5, 23.5], Attack: [48.5, 60.5, 59.5, 23.5] };
    const torchic = { Idle: [10, 23, 10, 2], Attack: [12, 25, 20, 15], Shoot: [11, 24, 14, 4], Charge: [10, 22, 10, 3] };
    const m = E.encaje(mewtwo, 170, 190, 2, true), et = E.encaje(eternatus, 170, 190, 2, true), tc = E.encaje(torchic, 320, 240, 6, true), tq = E.encaje(torchic, 96, 76, 2, false);
    // Upstream (ui.js): escala 2 y pies al 88 % de 190 = 167: el ataque de Mewtwo (25,5 por debajo de los pies) se salía 22 px.
    const upstreamSeSale = 167 + 2 * mewtwo.Attack[3] > 190;
    t('encaje(): Mewtwo en el destacado de 170x190 a ×2 con Idle, Charge, Shoot y Attack, todo dentro con 2 px de margen (con upstream, su ataque se salía por abajo); Eternatus, tan ancho, a ×1; Torchic en el compañero de 320x240 a ×6 sin el ataque que no cabe; sin «vida», sólo Idle',
      upstreamSeSale && m.k === 2 && m.vida.join() === 'Charge,Shoot,Attack' && dentro(m, 170, 190) && et.k === 1 && dentro(et, 170, 190) &&
      tc.k === 6 && !tc.vida.includes('Attack') && tc.vida.includes('Shoot') && dentro(tc, 320, 240) && tq.vida.length === 0 && dentro(tq, 96, 76), { m, et, tc, tq });
  } catch (e) { t('encaje de los sprites', false, String(e && e.stack || e)); }
  try {
    // Tamaños. Dex: compañero 320x240 (208x150 en pantallas bajas y en la columna estrecha), premio ×1 200x180 (160x140) y ×10
    // 132x120 (96x76). Clásico: los de upstream (compañero 260x200 hasta ×4; premio 132x120 a ×2; 96x76 en pantallas bajas).
    const prueba = (alto, estilo = 'dex', ancho = 1440) => {
      for (const k of Object.keys(almacen)) delete almacen[k];
      almacen['ps.settings'] = JSON.stringify({ estilo });
      const lienzo = () => ({ width: 300, height: 150, getContext: () => ({}), getAttribute: () => null, replaceWith(x) { this.por = x; } });
      const fot = (w, h, ax, ay) => ({ w, h, ax, ay, n: 1, r: 8 });
      const { E, c } = cargarEstilo({ alto, ancho, extra: { Sprites: { PX: 2, meta: () => ({ a: { Idle: 1, Attack: 1 } }), animMeta: (d, a) => (a === 'Idle' ? fot(24, 32, 12, 24) : fot(40, 48, 20, 30)),
        sheet: () => ({ ready: false }), preload: () => null, Animator: class { constructor() { this.scale = 1; } loop() {} } } } });
      c.document.createElement = lienzo;
      const viejo = Object.assign(lienzo(), { id: 'menu-partner', className: 'stage', width: 260, height: 200 });
      E.companero(viejo, 4, { shiny: false });
      const comp = { w: viejo.por.width, h: viejo.por.height, id: viejo.por.id, clase: viejo.por.className, e: E.colocacion(viejo.por) };
      const premio = (n, rareza) => {
        const v = lienzo(), card = { clases: [], querySelector: () => v, classList: { add: k => card.clases.push(k) } };
        E.premio(card, { dex: 150, rarity: rareza, shiny: false }, n);
        return { w: v.por.width, h: v.por.height, clase: card.clases[0], e: E.colocacion(v.por) };
      };
      return { comp, x1: premio(1, 5), x10: premio(10, 2) };
    };
    {
      const pc = prueba(900), mv = prueba(390), pl = prueba(784, 'dex', 724), plH = prueba(724, 'dex', 784);
      t('Dex: compañero del menú en un lienzo de 320x240 (208x150 en pantallas bajas y en la columna estrecha de un plegable en vertical, 724x784) que releva al de upstream con su id y su clase, hasta ×6; premio ×1 de 200x180 (160x140 en bajas) y ×10 de 132x120 (96x76; 120x110 en una pantalla alta de menos de 800 de ancho, 724x784 y 784x724), con su clase',
        pc.comp.w === 320 && pc.comp.h === 240 && pc.comp.id === 'menu-partner' && pc.comp.clase === 'stage' && pc.comp.e && pc.comp.e.k >= 1 && pc.comp.e.k <= 6 &&
        mv.comp.w === 208 && mv.comp.h === 150 && pl.comp.w === 208 && pl.comp.h === 150 && plH.comp.w === 320 &&
        pl.x10.w === 120 && pl.x10.h === 110 && plH.x10.w === 120 && plH.x1.w === 200 && pl.x10.e.k <= 3 &&
        pc.x1.w === 200 && pc.x1.h === 180 && pc.x1.clase === 'premio-1' && mv.x1.w === 160 && mv.x1.h === 140 &&
        pc.x10.w === 132 && pc.x10.h === 120 && mv.x10.w === 96 && mv.x10.h === 76 && mv.x10.clase === 'premio-10' && pc.x1.e.k <= 4 && mv.x10.e.k <= 2, { pc, mv, pl: pl.comp });
      const cpc = prueba(900, 'clasico'), cmv = prueba(390, 'clasico'), cpl = prueba(784, 'clasico', 724);
      t('Clásico = upstream: el compañero en el lienzo de upstream (260x200, hasta ×4) en todas las pantallas, y el premio en el suyo (132x120 a ×2; 96x76 en pantallas bajas y, en la ×10 de una pantalla alta y estrecha, 120x110), sin cortes',
        [cpc, cmv, cpl].every(x => x.comp.w === 260 && x.comp.h === 200 && x.comp.id === 'menu-partner' && x.comp.e && x.comp.e.k <= 4) &&
        cpc.x1.w === 132 && cpc.x1.h === 120 && cpc.x1.e.k <= 2 && cpc.x10.w === 132 && cpc.x10.h === 120 && cmv.x1.w === 96 && cmv.x1.h === 76 && cmv.x10.w === 96 && cmv.x10.h === 76 &&
        cpl.x1.w === 132 && cpl.x10.w === 120 && cpl.x10.h === 110 && cpl.x10.e.k <= 2,
        { cpc, cmv: cmv.comp });
    }
  } catch (e) { t('lienzos del compañero y del premio', false, String(e && e.stack || e)); }

  try {
    // disposicion(): bandas y zona libre del HUD (lote 2) y la pantalla dividida opcional.
    for (const k of Object.keys(almacen)) delete almacen[k];
    const { E } = cargarEstilo();
    const S0 = { sup: 0, der: 0, inf: 0, izq: 0 }, muesca = { sup: 0, der: 47, inf: 21, izq: 47 };
    const d = (w, h, op = {}) => E.disposicion(w, h, Object.assign({ seguras: S0 }, op));
    const m844 = d(844, 390), m780 = d(780, 360), m800 = d(800, 340), se = d(568, 320), ms = d(844, 390, { seguras: muesca, columnaIzq: 104 });
    const pc = d(1440, 900), fhd = d(1920, 1080), p1280 = d(1280, 720);
    const pleg = d(800, 870), plegH = d(870, 800);
    const dv = d(800, 870, { dividida: 'auto' }), dh = d(1440, 900, { dividida: 'auto' }), dm = d(844, 390, { dividida: 'derecha' }), dp = d(800, 870, { dividida: 'abajo', proporcion: 0.45 });
    const pct = x => +((x.bandas.sup + x.bandas.inf) / x.juego.h * 100).toFixed(1);
    const dentro = x => x.libre.x >= x.juego.x && x.libre.y >= x.juego.y && x.libre.x + x.libre.w <= x.juego.x + x.juego.w + 1e-9 && x.libre.y + x.libre.h <= x.juego.y + x.juego.h + 1e-9;
    const todas = [m844, m780, m800, se];
    t('disposición compacta (alto < 520), con el criterio de Nico (≤ 20 % del alto, objetivo 18-20 %): banda superior de 74 px a 844x390 (19,0 %), 69 a 780x360, 65 a 800x340 y 63 a 568x320, todas entre el 18 y el 20 %, y abajo nada; ranuras en columna a la derecha (62 px a 844x390, con ranuras de 48 y el margen; 54 si es estrecha y muy baja); con muesca, los márgenes la respetan',
      m844.variante === 'compacto' && m844.bandas.sup === 74 && m844.bandas.inf === 0 && m844.bandas.der === 62 && m844.ranuras === 'columna' &&
      m780.bandas.sup === 69 && m800.bandas.sup === 65 && se.bandas.sup === 63 && se.bandas.der === 6 + 44 + 4 && todas.every(x => pct(x) >= 18 && pct(x) <= 20) &&
      ms.bandas.der === 47 + 48 + 6 && ms.bandas.izq === 47 + 100 + 6 && ms.libre.w === 844 - 101 - 153 && dentro(ms),
      { m844: [m844.bandas, pct(m844)], m780: [m780.bandas, pct(m780)], m800: [m800.bandas, pct(m800)], se: [se.bandas, pct(se)], ms: ms.bandas });
    t('disposición de escritorio: escala 1,25 a 1440x900 y también a 1920x1080 (tope de Nico; 1 a 1280x720); pila de arriba de 203 px y fila de ranuras abajo de 129 a 1440x900 y a 1920x1080 (piezas más finas que las de la guía); un plegable desplegado estrecho (800x870, 870x800: la entrada del jefe no cabe entre las columnas) va en compacto, con las piezas ×1,15',
      pc.variante === 'escritorio' && pc.escala === 1.25 && pc.bandas.sup === 203 && pc.bandas.inf === 129 && pc.ranuras === 'fila' && fhd.escala === 1.25 && fhd.bandas.sup === 203 && p1280.escala === 1 &&
      pleg.variante === 'compacto' && plegH.variante === 'compacto' && pleg.kc === 1.15 && pleg.ranuras === 'columna' && dentro(pc) && dentro(pleg), { pc: pc.bandas, fhd: fhd.bandas, pleg: [pleg.variante, pleg.kc, pleg.bandas] });
    t("pantalla dividida (opcional, estilo DS): 'auto' pone los controles abajo en un plegable (800x870: juego arriba de 435) y a la derecha en apaisado; el juego y los controles no se pisan y la zona libre queda dentro del juego",
      dv.dividida === 'abajo' && dv.juego.h === 435 && dv.controles.y === 435 && dv.controles.h === 435 && dv.ranuras === 'controles' && dv.bandas.inf === 0 && dentro(dv) &&
      dh.dividida === 'derecha' && dh.juego.w === 720 && dh.controles.x === 720 && dentro(dh) && dm.variante === 'compacto' && dm.bandas.der === 0 && dm.juego.w === 422 &&
      dp.controles.h === Math.round(870 * 0.45) && dp.juego.h + dp.controles.h === 870,
      { dv: [dv.juego, dv.controles, dv.libre], dh: [dh.juego, dh.controles], dm: [dm.juego, dm.bandas], dp: [dp.juego, dp.controles] });
  } catch (e) { t('disposición del HUD', false, String(e && e.stack || e)); }

  // ---- D. css/nico.css: los arreglos van en los dos estilos y la piel sólo bajo html.estilo-dex ----
  try {
    const css = rd('css/nico.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const corte = css.indexOf('html.estilo-dex body');
    const reglas = parte => {
      const out = [];
      for (const m of parte.matchAll(/([^{};]+)\{/g)) {
        const sel = m[1].trim();
        if (!sel || sel.startsWith('@') || /^(from|to|\d+%)$/.test(sel)) continue;
        let prof = 0, cur = '';
        for (const ch of sel) { if (ch === '(') prof++; if (ch === ')') prof--; if (ch === ',' && !prof) { out.push(cur.trim()); cur = ''; } else cur += ch; }
        out.push(cur.trim());
      }
      return out;
    };
    const siempre = reglas(css.slice(0, corte)), dex = reglas(css.slice(corte));
    const malSiempre = siempre.filter(s => /estilo-dex/.test(s)), malDex = dex.filter(s => !s.startsWith('html.estilo-dex'));
    // css/portada.css (la «Tarjeta de entrenador», PokéSwarm): todo con Dex, salvo esconder la tarjeta en Clásico.
    const pc = rd('css/portada.css').replace(/\/\*[\s\S]*?\*\//g, ''), rp = reglas(pc);
    const malPortada = rp.filter(s => s !== '#tc-card' && !s.startsWith('html.estilo-dex'));
    t('css/portada.css: la portada «Tarjeta de entrenador» sólo con Dex (en Clásico, sólo #tc-card { display: none }); el Rotom-Dex delante del nombre sale de --marca-rotom (css/tokens-dex.css)',
      rp.length > 80 && !malPortada.length && /#tc-card \{ display: none; \}/.test(pc) && /--marca-rotom: url\("data:image\/svg\+xml/.test(rd('css/tokens-dex.css')) &&
      /background: var\(--marca-rotom\)/.test(pc), malPortada.slice(0, 5));
    t('css/nico.css: el bloque «siempre» (arreglos de los dos estilos) no depende del estilo y toda la piel Dex va bajo html.estilo-dex (Clásico = upstream + arreglos)',
      corte > 0 && siempre.length > 20 && dex.length > 150 && !malSiempre.length && !malDex.length, { malSiempre, malDex: malDex.slice(0, 5) });
    t('css/nico.css: el menú principal se oculta con cualquier .scr.dim abierta, en los dos estilos',
      siempre.includes('body:has(.scr.dim:not(.hidden)) #scr-menu') && /body:has\(\.scr\.dim:not\(\.hidden\)\) #scr-menu \{ visibility: hidden; \}/.test(css));
    t('css/nico.css no escala por CSS los lienzos del premio ni los destacados del gacha (width/height: auto) y, en Dex, tampoco el del compañero (en Clásico, el de upstream con su escalado de upstream)',
      /html\.estilo-dex #scr-menu #menu-partner \{ width: auto; height: auto; \}/.test(css) && !/\n#scr-menu #menu-partner \{ width: auto; height: auto; \}/.test(css) &&
      /#pull-results \.pcard canvas \{ width: auto; height: auto;/.test(css) && /#banner \.feat canvas \{ width: auto; height: auto; \}/.test(css));
    t('css/nico.css: en el fin de partida las estadísticas no se encogen (la caja se desplaza bajo «Volver al menú») y la capa «Probabilidades» no hereda la rejilla del gacha de una pantalla baja',
      /#scr-over #over-stats \{ flex-shrink: 0; \}/.test(css) && !/#scr-over #over-stats \{ min-height: 0; \}/.test(css) &&
      /#scr-gacha > \.box:not\(#gacha-prob-capa\) \{/.test(css) && !/#scr-gacha > \.box \{/.test(css) && /#scr-gacha > \.box:not\(#gacha-prob-capa\) > \.row\.between \{ display: contents; \}/.test(css));
    t('avisos centrados (logros y mensajes): su animación de entrada conserva el translateX(-50%) (la «pop» de upstream lo anulaba y entraban desplazados)',
      /\.toast, \.ach-pop \{ animation-name: pop-centrado; \}/.test(css) && /@keyframes pop-centrado \{ from \{ transform: translateX\(-50%\) scale\(\.94\);[^}]*\} to \{ transform: translateX\(-50%\);/.test(css) &&
      /\.toast \{[^}]*transform: translateX\(-50%\)[^}]*animation: pop/.test(rd('css/style.css').replace(/\r/g, '')));
    const sw = rd('sw.js');
    t('sw.js guarda assets/fonts en caché (las fuentes de Dex funcionan sin internet tras la primera carga)', /assets\\\/\(pokemon\|icons\|fonts\)/.test(sw));
  } catch (e) { t('css/nico.css', false, String(e && e.stack || e)); }

  // ---- E. Inglés, finales de línea y ajustes documentados ----
  try {
    const c = { console, navigator: { language: 'en-US', languages: ['en-US'] }, location: { pathname: '/' },
      localStorage: { getItem: () => null, setItem() {} }, document: { documentElement: {} }, confirm: () => true, alert() {} };
    c.CanvasRenderingContext2D = function () {};
    c.CanvasRenderingContext2D.prototype = { fillText() {}, strokeText() {}, measureText() {} };
    c.window = c; c.G = {};
    vm.createContext(c);
    for (const f of ['js/core/i18n.js', 'js/data/lang-en.js', 'js/data/lang-en-mod.js']) vm.runInContext(rd(f), c, { filename: f });
    const EN = c.G.I18n.t;
    const leg = /<span>([^<]+)<\/span><!-- MOD nico -->/.exec(rd('dev.html'));
    const textos = ['Estilo', 'Dex', 'Clásico', 'Dex: menús y HUD de Pokédex y letra redondeada. Clásico: menús de pixel art y letra pixelada.', 'Letra del estilo Dex:',
      'Probabilidades', 'Cerrar', leg ? leg[1] : '(falta el texto legal)',
      'Pon el dedo en cualquier parte y arrastra para moverte: el joystick aparece donde tocas. Toca un ataque de abajo para cambiarlo y el botón de arriba a la derecha para pausar. Se juega en horizontal (en un plegable abierto o en una tableta, también en vertical).',
      'Pon el dedo en cualquier parte y arrastra para moverte: el joystick aparece donde tocas. Toca un ataque de la derecha para cambiarlo y el botón de arriba a la derecha para pausar. Se juega en horizontal (en un plegable abierto o en una tableta, también en vertical).'];
    const sin = textos.filter(s => s !== 'Dex' && EN(s) === s);
    t('todos los textos nuevos tienen inglés (i18n.js real): Estilo, Clásico, su explicación, los créditos, «Probabilidades», «Cerrar», el aviso legal y los controles (el plegable en vertical, con las ranuras abajo y a la derecha)', !sin.length, sin);
  } catch (e) { t('inglés de la identidad', false, String(e && e.stack || e)); }
  try {
    const ficheros = ['dev.html', 'css/style.css', 'css/tokens-dex.css', 'css/nico.css', 'js/ui/marca.js', 'js/ui/estilo.js', 'js/ui/settings-ui.js', 'js/ui/run-ui.js',
      'js/ui/menu.js', 'js/ui/gacha-ui.js', 'js/game.js', 'js/core/mods.js', 'js/data/lang-en-mod.js', 'js/entities/claridad.js', 'CREDITS.md', 'assets/fonts/OFL-MPLUSRounded1c.txt',
      'tools/nico/check.js', 'js/ui/hud.js', 'js/ui/hud-dex.js', 'js/systems/events.js', 'tools/nico/coop-e2e.js', 'css/portada.css', 'js/ui/portada.js',
      'tools/nico/iconos.py', 'js/main.js', 'js/core/importar.js', 'js/ui/importar-ui.js', 'js/ui/ui.js', '404.html', 'contacto/index.html', 'manifest.webmanifest'].concat(ex('tools/nico/estilo-e2e.js') ? ['tools/nico/estilo-e2e.js'] : []);
    const mezcla = ficheros.filter(f => { const s = rd(f), crlf = (s.match(/\r\n/g) || []).length, lf = (s.match(/\n/g) || []).length; return crlf && crlf !== lf; });
    const nuevosCRLF = ['css/tokens-dex.css', 'css/nico.css', 'js/ui/marca.js', 'js/ui/estilo.js', 'js/ui/hud-dex.js', 'assets/fonts/OFL-MPLUSRounded1c.txt',
      'css/portada.css', 'js/ui/portada.js', 'tools/nico/iconos.py'].filter(f => /\r/.test(rd(f)));
    t('finales de línea: ningún fichero tocado mezcla CRLF y LF, y los nuevos van en LF', !mezcla.length && !nuevosCRLF.length, { mezcla, nuevosCRLF });
  } catch (e) { t('finales de línea', false, String(e && e.stack || e)); }
  try {
    const c = { console }; c.window = c; c.G = {}; vm.createContext(c); vm.runInContext(rd('js/core/mods.js'), c, { filename: 'js/core/mods.js' });
    const md = rd('CLAUDE.md');
    const sin = Object.keys(c.G.MODS).filter(k => /^[a-z]/.test(k) && typeof c.G.MODS[k] !== 'function' && !md.includes('`' + k + '`'));
    t('cada ajuste de js/core/mods.js tiene su fila en la tabla de CLAUDE.md', !sin.length, sin);
  } catch (e) { t('ajustes documentados', false, String(e && e.stack || e)); }

  const failed = r.filter(x => !x[1]);
  if (!failed.length) ok(`identidad visual: ${r.length} casos bien`);
  for (const [name, , detail] of failed) bad(`identidad: ${name}${detail !== undefined ? ' · ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
}

// ---------------- 15. HUD Dex (js/ui/hud-dex.js) y su red de seguridad ----------------
// Huellas de lo que upstream pinta en el HUD (sha1 sin CR y sin las líneas «MOD nico»). Si upstream cambia hud.js o
// la parte de dibujo de events.js, FALLO: hay que mirar el cambio, portarlo a js/ui/hud-dex.js y poner aquí la huella nueva.
const HUELLA_HUD = 'bf063dc4dcef03350fe2cd237b0bd752d23d4db2';
const HUELLA_EVENTOS_HUD = '4348077c74d1e2721c8baab78453d0d132f05768';
const sinModNico = s => s.replace(/\r/g, '').split('\n').filter(l => !/MOD nico/.test(l)).join('\n');
const sha1 = s => crypto.createHash('sha1').update(s).digest('hex');
/** La parte de dibujo de events.js: drawHud y edgeArrow (de su comentario al return). */
const eventosHud = s => { const a = s.indexOf('  /** Flecha en el borde hacia el Pokémon perdido'), b = s.indexOf('  return {', a); return a < 0 || b < 0 ? '' : s.slice(a, b); };
/** Lo que lee el HUD de upstream: pl.x, st.x y G.Modulo.x (con lo que se llama encadenado). */
function inventarioHud(src) {
  const s = src.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ''), out = new Set();
  for (const m of s.matchAll(/\bpl\.(\w+)/g)) out.add('pl.' + m[1]);
  for (const m of s.matchAll(/\bst\.(\w+)/g)) out.add('st.' + m[1]);
  for (const m of s.matchAll(/\bG\.(\w+)\.(\w+)/g)) if (!['HUD', 'MODS', 'Estilo'].includes(m[1])) out.add('G.' + m[1] + '.' + m[2]);
  return out;
}

/** Un CanvasRenderingContext2D de mentira que apunta cada operación con su caja en coordenadas de pantalla. */
class LienzoFalso {
  constructor() {
    this.ops = []; this.pila = []; this.m = [1, 0, 0, 1, 0, 0]; this.camino = null;
    Object.assign(this, { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, font: '10px sans-serif', textAlign: 'start', textBaseline: 'alphabetic', globalAlpha: 1, lineJoin: 'miter' });
  }
  get profundidad() { return this.pila.length; }
  save() { this.pila.push({ m: this.m.slice(), fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, lineWidth: this.lineWidth, font: this.font, textAlign: this.textAlign, textBaseline: this.textBaseline, globalAlpha: this.globalAlpha, lineJoin: this.lineJoin }); }
  restore() { const e = this.pila.pop(); if (e) { const { m, ...r } = e; this.m = m; Object.assign(this, r); } }
  setTransform(a, b, c, d, e, f) { this.m = [a, b, c, d, e, f]; }
  translate(x, y) { const m = this.m; m[4] += m[0] * x + m[2] * y; m[5] += m[1] * x + m[3] * y; }
  scale(x, y) { const m = this.m; m[0] *= x; m[1] *= x; m[2] *= y; m[3] *= y; }
  rotate() {}
  pt(x, y) { const m = this.m; return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
  caja(x0, y0, x1, y1) { const a = this.pt(x0, y0), b = this.pt(x1, y1); return { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), x2: Math.max(a[0], b[0]), y2: Math.max(a[1], b[1]) }; }
  beginPath() { this.camino = null; }
  anadir(c) { const p = this.camino; this.camino = p ? { x: Math.min(p.x, c.x), y: Math.min(p.y, c.y), x2: Math.max(p.x2, c.x2), y2: Math.max(p.y2, c.y2) } : c; }
  moveTo(x, y) { this.anadir(this.caja(x, y, x, y)); }
  lineTo(x, y) { this.anadir(this.caja(x, y, x, y)); }
  arcTo(x1, y1, x2, y2) { this.anadir(this.caja(x1, y1, x1, y1)); this.anadir(this.caja(x2, y2, x2, y2)); }
  arc(x, y, r) { this.anadir(this.caja(x - r, y - r, x + r, y + r)); }
  ellipse(x, y, rx, ry) { this.anadir(this.caja(x - rx, y - ry, x + rx, y + ry)); }
  rect(x, y, w, h) { this.anadir(this.caja(x, y, x + w, y + h)); }
  roundRect(x, y, w, h) { this.rect(x, y, w, h); }
  closePath() {}
  clip() {}
  apuntar(op, caja, estilo) { if (caja) this.ops.push({ op, ...caja, estilo, alfa: this.globalAlpha }); }
  fill() { this.apuntar('fill', this.camino, this.fillStyle); }
  stroke() { this.apuntar('stroke', this.camino, this.strokeStyle); }
  fillRect(x, y, w, h) { this.apuntar('fill', this.caja(x, y, x + w, y + h), this.fillStyle); }
  strokeRect(x, y, w, h) { this.apuntar('stroke', this.caja(x, y, x + w, y + h), this.strokeStyle); }
  clearRect() {}
  tam() { const m = /(\d+(?:\.\d+)?)px/.exec(this.font); return m ? +m[1] : 10; }
  measureText(t) { return { width: String(t).length * this.tam() * (/^8\d\d/.test(this.font) ? 0.62 : 0.56) }; }
  texto(op, t, x, y) {
    const w = this.measureText(t).width, s = this.tam(), al = this.textAlign;
    const x0 = al === 'center' ? x - w / 2 : al === 'right' || al === 'end' ? x - w : x;
    const p = this.pt(x0, y), q = this.pt(x0 + w, y);
    this.ops.push({ op, texto: String(t), x: p[0], y: p[1] - s * 0.72, x2: q[0], y2: p[1] + s * 0.2, base: p[1], estilo: op === 'texto' ? this.fillStyle : this.strokeStyle, fuente: this.font, tam: s, alfa: this.globalAlpha, ancla: this.pt(x, y) });
  }
  fillText(t, x, y) { this.texto('texto', t, x, y); }
  strokeText(t, x, y) { this.texto('contorno', t, x, y); }
  drawImage(img, ...a) { const [x, y, w, h] = a.length >= 8 ? a.slice(4) : a.length >= 4 ? a : [a[0], a[1], 0, 0]; this.apuntar('imagen', this.caja(x, y, x + w, y + h), null); }
  createRadialGradient() { const g = { paradas: [], addColorStop(o, c) { this.paradas.push(c); } }; return g; }
  createLinearGradient() { return this.createRadialGradient(); }
}

/** El juego mínimo para js/ui/hud-dex.js (y js/ui/hud.js de upstream), con los ficheros reales del HUD. */
function cargarHud({ w = 1440, h = 900, tactil = false, estilo = 'dex', seguras = { sup: 0, der: 0, inf: 0, izq: 0 }, hudSrc = null, fallar = false } = {}) {
  const reloj = { t: 1000 };
  const almacenH = {};
  const c = {
    console: { log() {}, warn() { c.__avisos.push([...arguments].map(String).join(' ')); }, error() {} }, __avisos: [],
    innerHeight: h, innerWidth: w, performance: { now: () => reloj.t },
    localStorage: { getItem: k => (k in almacenH ? almacenH[k] : null), setItem: (k, v) => { almacenH[k] = String(v); } },
    matchMedia: () => ({ matches: false }), navigator: {}, location: { protocol: 'file:' },
    document: { documentElement: { classList: { toggle() {}, contains: () => false } }, getElementById: () => null, querySelector: () => null, body: null,
      // document.fonts con su evento «loadingdone» (la prueba lo dispara: ver M9).
      fonts: { load: () => Promise.resolve([]), addEventListener(tipo, fn) { (c.__fuentes[tipo] = c.__fuentes[tipo] || []).push(fn); } } },
    __fuentes: {}
  };
  function Ctx() {}
  Object.defineProperty(Ctx.prototype, 'font', { configurable: true, enumerable: true, get() { return this._f; }, set(v) { this._f = v; } });
  c.CanvasRenderingContext2D = Ctx;
  c.window = c; c.G = {};
  vm.createContext(c);
  for (const f of ['js/core/util.js', 'js/core/mods.js', 'js/ui/marca.js', 'js/core/settings.js']) vm.runInContext(rd(f), c, { filename: f });
  const G = c.G;
  // Lo que el HUD lee del juego, a mano: cada prueba lo cambia.
  const botones = [];
  const juego = { banner: null, jefes: [], shinies: [], otros: [], rift: null, inArena: false, timeLeft: 0, mates: [], clima: null, bioma: 'Bosque Umbrío' };
  G.Touch = { active: tactil, clearButtons() { botones.length = 0; }, addButton(x, y, bw, bh, fn, pad = 6) { botones.push({ x, y, w: bw, h: bh, fn, pad }); } };
  G.Camera = { scale: 1, left: () => 0, top: () => 0 };
  G.EnemyMgr = { all: () => [...juego.jefes, ...juego.otros], shinies: () => juego.shinies.filter(e => !e.dead), bossAlive: () => juego.jefes.some(e => !e.dead) };
  G.World = { biomeName: () => juego.bioma };
  G.Weather = { get current() { return juego.clima; }, KINDS: { rain: { name: 'Lluvia', icon: 'wrain' }, sun: { name: 'Sol abrasador', icon: 'wsun' } } };
  G.Rift = { get rift() { return juego.rift; }, get inArena() { return juego.inArena; }, get timeLeft() { return juego.timeLeft; } };
  G.Spawner = { banner: () => juego.banner };
  G.Coop = { get active() { return juego.mates.length > 0; }, get mates() { return juego.mates; }, players: () => [juego.pl, ...juego.mates.map(m => m.pl)], isHost: false };
  G.Icons = { draw(ctx, n, x, y, s) { ctx.fillStyle = '#ICONO'; ctx.fillRect(x, y, s, s); } };
  class Animator { constructor(dex, scale) { this.dex = dex; this.scale = scale; this.dir = 0; } loop() {} update() {} draw(ctx, x, y) { ctx.drawImage({}, x - 10, y - 20, 20, 20); } }
  G.Sprites = { PX: 2, animMeta: () => { if (fallar) throw new Error('fallo forzado'); return { ay: 24 }; }, Animator, bodyRadius: () => 10, bodyHeight: () => 30 };
  G.Items = { BY: { leftovers: { name: 'Restos' } } };
  G.Player = { REVIVE_TIME: 3 };
  G.Audio = { sfx() {} };
  G.DEX_BY = { 25: { name: 'Pikachu' }, 52: { name: 'Meowth' } };
  G.Game = { state: 'playing', togglePause() { G.Game.pausado = !G.Game.pausado; }, st: { time: 100 } };
  vm.runInContext(rd('js/ui/estilo.js'), c, { filename: 'js/ui/estilo.js' });
  G.Estilo.set(estilo);
  vm.runInContext(rd('js/systems/events.js'), c, { filename: 'js/systems/events.js' });
  vm.runInContext(hudSrc || rd('js/ui/hud.js'), c, { filename: 'js/ui/hud.js' });
  vm.runInContext(rd('js/ui/hud-dex.js'), c, { filename: 'js/ui/hud-dex.js' });
  // Tu Pokémon: 4 ataques, objeto, vínculo y mejoras.
  const mov = (id, type, lvl, extra) => Object.assign({ id, type, name: id, lvl, t: 0, cd: 1, kind: 'shot', def: { maxLvl: 5 } }, extra);
  const pl = juego.pl = {
    x: 0, y: 0, dex: 25, mon: { name: 'Crabominable', dex: 25 }, anim: { shiny: false }, level: 12, hp: 41, maxHp: 90, xp: 30, xpNext: 100, kills: 1204, coins: 87,
    buffs: { atk: { n: 2 }, spd: { n: 1 }, def: { n: 1 }, regen: { n: 1 } }, power: { def: { name: 'Furia', color: '#FF7A5C' }, t: 12 },
    slots: [[mov('ember', 'fire', 3)], [mov('surf', 'water', 2)], [mov('tackle', 'normal', 5, { evolved: true })], [mov('a', 'grass', 1), mov('b', 'ice', 1)]],
    active: 1, cdMul: 1, setActive(i) { this.active = i; }, bonds: 2, item: 'leftovers', dead: false, reviveT: 0, bodyH: 30
  };
  const st = { time: 100 };
  const lienzo = () => new LienzoFalso();
  const pintar = (ctx = lienzo(), ww = w, hh = h) => { reloj.t += 16; G.HUD.draw(ctx, ww, hh, pl, st); return ctx; };
  G.Estilo.zonasSeguras = () => seguras;
  return { c, G, pl, st, juego, botones, reloj, pintar, lienzo, seguras };
}
/** Un jefe (o legendario) en coordenadas de mundo (con la cámara en 0,0 y escala 1, son las de pantalla). */
const jefeFalso = (x, y, f = 0.64, extra = {}) => Object.assign({ id: 7, boss: true, dead: false, dex: 983, name: 'Kingambit', types: ['dark', 'steel'], hp: 1000 * f, maxHp: 1000, x, y, bodyH: 60, shiny: false }, extra);
const mateFalso = (name, color, x, y, extra = {}) => ({ name, color, connected: true, pl: Object.assign({ x, y, hp: 50, maxHp: 80, dead: false, bodyH: 30 }, extra) });
/** Todo a la vez: jefe, aviso, 4 ranuras, objeto, vínculo, chips (4 mejoras, poder, horda), clima y 3 compañeros. */
function escenaCompleta(H, { lejos = false } = {}) {
  const { juego, G } = H;
  juego.jefes = [jefeFalso(H.c.innerWidth * 0.6, H.c.innerHeight * 0.55)];
  juego.banner = { text: '¡Kingambit salvaje apareció!', t: 3.2 };
  juego.clima = { name: 'Lluvia', icon: 'wrain', left: 67, mult: { water: 1.5, electric: 1.2, fire: 0.5 } };
  // Cerca: en la zona libre, a la vista (sin flechas); lejos: fuera de la pantalla (con flechas).
  const W = H.c.innerWidth, Hh = H.c.innerHeight, d = lejos ? 5000 : 0;
  juego.mates = [mateFalso('Ana', '#5FC8FF', W / 2 - 60 + d, Hh / 2), mateFalso('Leo', '#7EE07A', W / 2 + 60, Hh / 2 + 40 + d), mateFalso('Sol', '#FF8AD8', W / 2 - d, Hh / 2 - 40)];
  G.Events.onNet(['ev', 's', 'horde', 'fire']);
}

function hudDexChecks() {
  console.log('15. HUD Dex (js/ui/hud-dex.js): presupuesto, solapes, escala, jefe, flechas, avisos, toques, red de seguridad');
  const r = [];
  const t = (name, cond, detail) => r.push([name, !!cond, detail]);
  const solapan = (a, b) => a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
  /** Las piezas del último fotograma, como lista de rectángulos con nombre (la ranura activa, donde se pinta). */
  const piezas = (G, pl) => {
    const P = G.HudDex.bandas().piezas, L = [];
    for (const k of ['ficha', 'contador', 'rotom', 'pausa', 'jefe', 'aviso', 'objeto', 'grupo']) if (P[k]) L.push({ n: k, ...P[k] });
    (P.chips || []).forEach((x, i) => L.push({ n: 'chip' + i, ...x }));
    if (!P.grupo) (P.companeros || []).forEach((x, i) => L.push({ n: 'comp' + i, ...x }));
    const B = G.HudDex.bandas();
    (P.ranuras || []).forEach((x, i) => {
      const on = i === pl.active;
      L.push({ n: 'ranura' + i, x: x.x - (on && B.variante === 'compacto' && B.columna ? P.desplazamiento : 0), y: x.y - (on && !B.columna ? P.elevacion || 0 : 0), w: x.w, h: x.h });
    });
    if (P.vinculo && !P.vinculo.insignia) L.push({ n: 'vinculo', ...P.vinculo });
    return L;
  };

  // ---- A. Presupuesto en compacto (criterio de Nico: ≤ 20 % del alto arriba + abajo; columnas ≤ 22 % del ancho) ----
  try {
    const filas = [];
    for (const [w, h] of [[844, 390], [780, 360], [800, 340], [568, 320]]) {
      const H = cargarHud({ w, h, tactil: true });
      escenaCompleta(H);
      H.pintar(); H.reloj.t += 2000;
      const ctx = H.pintar();
      const B = H.G.HudDex.bandas();
      // Medido en lo pintado: lo más bajo de lo anclado arriba (todo lo que empieza en la mitad de arriba, menos
      // las columnas laterales y las flechas) y lo más alto de lo anclado abajo.
      const cols = B.izq + 0.5, colD = w - B.der - 0.5;
      const arriba = ctx.ops.filter(o => o.y < h / 2 && o.x2 > cols && o.x < colD && o.y2 < h / 2 + 40).map(o => o.y2);
      const sup = Math.max(...arriba), inf = 0;
      const pct = (sup + inf) / h * 100, lat = (B.izq + B.der) / w * 100;
      filas.push({ vp: `${w}x${h}`, sup: Math.round(sup), bandas: B.sup, pct: +pct.toFixed(1), laterales: +lat.toFixed(1), variante: B.variante });
    }
    t('compacto, con jefe, aviso, 4 ranuras, objeto, vínculo, chips, clima y 3 compañeros a la vez: arriba + abajo ≤ 20 % del alto (criterio de Nico; medido en lo pintado) a 844x390, 780x360, 800x340 y 568x320, y las columnas laterales ≤ 22 % del ancho',
      filas.every(f => f.variante === 'compacto' && f.pct <= 20 && f.sup <= f.bandas + 0.5 && f.laterales <= 22), filas);
  } catch (e) { t('presupuesto del HUD compacto', false, String(e && e.stack || e)); }

  // ---- B. Sin solapes, dentro de la pantalla y de las zonas seguras ----
  try {
    const malos = [], visto = [];
    const VPS = [[1024, 768], [1280, 720], [1366, 657], [1440, 900], [1920, 1080], [844, 390, true, { sup: 0, der: 47, inf: 21, izq: 47 }], [780, 360, true],
      [724, 784, true], [784, 724, true], [869, 941, true], [941, 869, true], [360, 807, true], [807, 360, true], [784, 362, true], [800, 870, true]];
    for (const [w, h, tactil = false, seguras] of VPS) {
      const H = cargarHud({ w, h, tactil, seguras: seguras || { sup: 0, der: 0, inf: 0, izq: 0 } });
      escenaCompleta(H);
      H.pintar();
      const L = piezas(H.G, H.pl), B = H.G.HudDex.bandas(), sg = H.seguras;
      visto.push(`${w}x${h}:${B.variante}`);
      for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (solapan(L[i], L[j])) malos.push(`${w}x${h} ${L[i].n}/${L[j].n}`);
      for (const p of L) if (p.x < sg.izq - 0.5 || p.y < sg.sup - 0.5 || p.x + p.w > w - sg.der + 0.5 || p.y + p.h > h - sg.inf + 0.5) malos.push(`${w}x${h} ${p.n} fuera`);
    }
    t('sin solapes entre las piezas del HUD (con todo a la vez), todas dentro de la pantalla y de las zonas seguras, a 1024x768, 1280x720, 1366x657, 1440x900, 1920x1080, 844x390 con muesca de 47/47/21, 780x360 y en el plegable (724x784, 784x724, 869x941, 941x869, 360x807, 807x360, la mitad de 784x362 y 800x870)',
      !malos.length, malos.length ? malos.slice(0, 8) : visto);
  } catch (e) { t('solapes del HUD', false, String(e && e.stack || e)); }

  // ---- C. Escala, variante y bandas iguales a las de G.Estilo.disposicion() ----
  try {
    const esc = {}, dif = [];
    for (const [w, h, tactil] of [[1440, 900], [1920, 1080], [1280, 720], [1024, 768], [844, 390, true], [780, 360, true], [724, 784, true], [784, 724, true], [941, 869, true]]) {
      const H = cargarHud({ w, h, tactil });
      escenaCompleta(H);
      H.pintar();
      const B = H.G.HudDex.bandas(), d = H.G.Estilo.disposicion(w, h, { seguras: H.seguras });
      esc[`${w}x${h}`] = `${B.variante} ${B.escala}`;
      if (B.sup !== d.bandas.sup || B.inf !== d.bandas.inf || B.der !== d.bandas.der || B.variante !== d.variante) dif.push({ vp: `${w}x${h}`, hud: [B.sup, B.inf, B.der, B.variante], disp: [d.bandas.sup, d.bandas.inf, d.bandas.der, d.variante] });
    }
    t('escala del HUD: 1,25 a 1440x900 y también a 1920x1080 (tope de Nico, no 1,5), 1 a 1280x720; el plegable abierto (724x784, 784x724) va en compacto (la entrada del jefe no cabe entre columnas) con las piezas un poco mayores (×1,13), y 941x869, en escritorio; las bandas del HUD son las de G.Estilo.disposicion()',
      esc['1440x900'] === 'escritorio 1.25' && esc['1920x1080'] === 'escritorio 1.25' && esc['1280x720'] === 'escritorio 1' && /^compacto 1\.1/.test(esc['724x784']) &&
      /^compacto 1\.1/.test(esc['784x724']) && esc['844x390'] === 'compacto 1' && /^escritorio/.test(esc['941x869']) && !dif.length, { esc, dif });
  } catch (e) { t('escala del HUD', false, String(e && e.stack || e)); }

  // ---- D. Barra del jefe: violeta #9B6BFF (nunca los colores de PS), con 3 marcas, y más gruesa que la tuya ----
  try {
    const res = [];
    for (const [w, h, tactil] of [[1440, 900, false], [844, 390, true]]) {
      for (const f of [1, 0.4, 0.1]) {
        const H = cargarHud({ w, h, tactil });
        H.juego.jefes = [jefeFalso(w / 2, h / 2, f)];
        const ctx = H.pintar();
        const M = H.G.MARCA.color;
        // El carril de la barra rival es el fill de 'rgba(2,8,11,0.6)' justo antes del primer fill violeta.
        const iv = ctx.ops.findIndex(o => o.op === 'fill' && o.estilo === M.rival);
        const carril = iv > 0 ? ctx.ops.slice(0, iv).reverse().find(o => o.op === 'fill' && o.estilo === M.carril) : null;
        if (!carril) { res.push({ w, f, mal: 'sin barra rival' }); continue; }
        const bw = carril.x2 - carril.x, bh = carril.y2 - carril.y;
        const px = carril.x + bw * f * 0.375, py = carril.y + bh * 0.65;
        const encima = ctx.ops.filter(o => o.op === 'fill' && px >= o.x && px <= o.x2 && py >= o.y && py <= o.y2).pop();
        const marcas = ctx.ops.filter(o => o.op === 'fill' && o.estilo === 'rgba(15,38,48,0.7)' && o.y === carril.y && o.x2 - o.x <= 3).length;
        // Tus PS: la barra de la ficha (el carril antes del primer fill de un color de PS).
        const ips = ctx.ops.findIndex(o => o.op === 'fill' && [M.psAlto, M.psMedio, M.psBajo, M.psBajoDestello].includes(o.estilo));
        const carrilPS = ctx.ops.slice(0, ips).reverse().find(o => o.op === 'fill' && o.estilo === M.carril);
        res.push({ w, f, color: encima && encima.estilo, marcas, alto: bh, altoPS: carrilPS ? carrilPS.y2 - carrilPS.y : null });
      }
    }
    t('barra del jefe: el píxel al 37,5 % del tramo lleno y al 65 % del alto es #9B6BFF con el jefe al 100, 40 y 10 %, en escritorio y en compacto; 3 marcas (25, 50 y 75 %); y más gruesa que tus PS en las dos variantes',
      res.length === 6 && res.every(x => x.color === '#9B6BFF' && x.marcas === 3 && x.altoPS && x.alto > x.altoPS), res);
  } catch (e) { t('barra del jefe', false, String(e && e.stack || e)); }

  // ---- E. Flechas: fuera de pantalla o detrás de un panel, y siempre dentro de la zona libre ----
  try {
    const res = [];
    for (const [w, h, tactil] of [[1440, 900, false], [844, 390, true], [724, 784, true]]) {
      const H = cargarHud({ w, h, tactil });
      const { juego, G } = H;
      // Fuera: el jefe a la derecha, la grieta arriba, un shiny abajo a la izquierda, Ana lejos (caída) y Leo lejos,
      // un ladrón a la izquierda y el Pokémon perdido abajo.
      juego.jefes = [jefeFalso(w + 900, h / 2)];
      juego.rift = { x: w / 2, y: -800, ttl: 30, t: 9 };
      juego.shinies = [{ x: -300, y: h + 300, dead: false }];
      juego.mates = [mateFalso('Ana', '#5FC8FF', w * 3, h * 2, { dead: true }), mateFalso('Leo', '#7EE07A', -2000, h / 3)];
      juego.otros = [{ behavior: 'thief', dead: false, x: -900, y: h * 0.7, name: 'Meowth' }];
      G.Events.onNet(['ev', 'lp', 52, w / 2, h + 2000, 100, 0, w / 2, h + 3000, 0, 0]);
      H.pintar();
      const B = G.HudDex.bandas(), Z = B.zona, tipos = B.flechas.map(f => f.tipo);
      const fuera = B.flechas.filter(f => f.x < Z.x + 20 || f.x > Z.x + Z.w - 20 || f.y < Z.y + 20 || f.y > Z.y + Z.h - 20);
      // Detrás de un panel: el jefe en mitad de la ficha (dentro de la pantalla) también lleva flecha; en la zona libre, no.
      const P = B.piezas.ficha;
      juego.jefes = [jefeFalso(P.x + P.w / 2, P.y + P.h / 2 + 30)];
      H.pintar();
      const tapado = G.HudDex.bandas().flechas.some(f => f.tipo === 'jefe');
      juego.jefes = [jefeFalso(Z.x + Z.w / 2, Z.y + Z.h / 2 + 30)];
      H.pintar();
      const libre = !G.HudDex.bandas().flechas.some(f => f.tipo === 'jefe');
      res.push({ vp: `${w}x${h}`, tipos, fuera: fuera.map(f => f.tipo), tapado, libre });
    }
    const todas = ['jefe', 'grieta', 'shiny', 'caido', 'companero', 'evento'];
    t('flechas comunes (jefe, grieta, shiny, compañero caído y lejos, ladrón y Pokémon perdido): salen si el objetivo está fuera de la pantalla o detrás de un panel (no si está en la zona libre) y quedan dentro de la zona libre con su margen',
      res.every(x => todas.every(k => x.tipos.includes(k)) && x.tipos.filter(k => k === 'evento').length === 2 && !x.fuera.length && x.tapado && x.libre), res);
  } catch (e) { t('flechas del HUD', false, String(e && e.stack || e)); }

  // ---- F. Avisos: una ranura con cola (prioridad, ≤ 2 en espera, persistentes, sin repetir) ----
  try {
    const H = cargarHud({ w: 1440, h: 900 });
    const { G, juego } = H, A = G.HudDex.Avisos, st = { time: 60 };
    let tt = 10;
    const paso = (s, n = 1) => { for (let i = 0; i < n; i++) { tt += s; A.actualizar(tt, st, false); } };
    const di = (text, t2) => { juego.banner = { text, t: t2 }; paso(0.016); };
    const vistos = [];
    const anota = () => { const v = A.visible; if (v && !v.saliendo && vistos[vistos.length - 1] !== v.texto) vistos.push(v.texto); };
    di('¡Un Pidgey shiny anda cerca!', 3.4); anota();
    di('Lluvia: el Agua se potencia y el Fuego se debilita', 3.4);
    di('¡Kingambit salvaje apareció!', 3.2);
    di('— Cueva Cristal —', 3);
    const cola = A.cola.map(x => x.tipo);
    for (let i = 0; i < 700; i++) { juego.banner = null; paso(0.016); anota(); }
    // Persistente: «Pausa: … elige fusión…» se queda mientras el origen lo mantenga, aunque pasen 20 s.
    di('Pausa: Ana elige fusión…', 999);
    for (let i = 0; i < 1250; i++) { juego.banner = { text: 'Pausa: Ana elige fusión…', t: 999 - i * 0.016 }; paso(0.016); }
    const sigue = A.visible && A.visible.texto === 'Pausa: Ana elige fusión…' && !A.visible.saliendo;
    juego.banner = null; paso(0.016, 40);
    const acaba = !A.visible || A.visible.tipo === 'pista' || A.visible.saliendo;
    // «— Bioma —» una sola vez (aunque se repita mientras se ve) y «Has entrado en la grieta…» como rótulo de zona.
    const zonas = [];
    di('— Bosque Umbrío —', 3); di('— Bosque Umbrío —', 3);
    for (let i = 0; i < 300; i++) { paso(0.016); const v = A.visible; if (v && v.tipo === 'zona' && zonas[zonas.length - 1] !== v.texto) zonas.push(v.texto); }
    juego.banner = null; paso(0.016, 300);
    juego.bioma = 'Grieta · Pradera Eterna';
    di('Has entrado en la grieta…', 2.4);
    const arena = A.visible && A.visible.tipo === 'zona' && A.visible.texto === 'Grieta · Pradera Eterna';
    // La pista de controles: sólo con la ranura libre y hasta los 14 s.
    juego.banner = null; paso(0.016, 400);
    const st2 = { time: 3 }; tt += 0.016; A.actualizar(tt, st2, true);
    const pista = A.visible && A.visible.tipo === 'pista' && /Arrastra el dedo/.test(A.visible.texto);
    t('avisos: una ranura con cola por prioridad (jefe > zona > clima > resto), como mucho 2 en espera (se pierde el clima), cada uno visible su tiempo; «Pausa: … elige fusión…» se queda 20 s mientras dure y se va al quitarse; «— Bioma —» sale una vez, sin guiones; «Has entrado en la grieta…» es el rótulo de la arena; y la pista de controles sólo con la ranura libre',
      JSON.stringify(cola) === '["jefe","zona"]' && JSON.stringify(vistos) === JSON.stringify(['¡Un Pidgey shiny anda cerca!', '¡Kingambit salvaje apareció!', 'Cueva Cristal']) &&
      sigue && acaba && JSON.stringify(zonas) === '["Bosque Umbrío"]' && arena && pista, { cola, vistos, sigue, acaba, zonas, arena, pista });
  } catch (e) { t('avisos del HUD', false, String(e && e.stack || e)); }

  // ---- G. Toques: las ranuras y la pausa se registran donde se pintan y miden ≥ 44 px ----
  try {
    const res = [];
    for (const [w, h] of [[844, 390], [568, 320], [724, 784], [1440, 900]]) {
      const H = cargarHud({ w, h, tactil: true });
      H.pintar();
      const B = H.G.HudDex.bandas(), P = B.piezas, pl = H.pl;
      const ran = piezas(H.G, pl).filter(p => /^ranura/.test(p.n));
      const casa = ran.every(p => H.botones.some(b => Math.abs(b.x - p.x) < 0.5 && Math.abs(b.y - p.y) < 0.5 && b.w === p.w && b.h === p.h && b.w >= 44 && b.h >= 44));
      const pz = H.botones.find(b => P.pausa && b.x === P.pausa.x && b.y === P.pausa.y);
      // Tocar la ranura 3 la activa; tocar la pausa pausa.
      const b3 = H.botones.find(b => Math.abs(b.y - ran[2].y) < 0.5 && Math.abs(b.x - ran[2].x) < 0.5);
      if (b3) b3.fn();
      if (pz) pz.fn();
      res.push({ vp: `${w}x${h}`, variante: B.variante, columna: B.columna, casa, pausa: pz ? [pz.w, pz.h] : null, activa: pl.active, pausado: !!H.G.Game.pausado });
    }
    t('toques: cada ranura y la pausa se registran justo donde se pintan, con ≥ 44 px (también a 568x320 y en el plegable); tocar la ranura 3 la activa y la pausa responde; en compacto, las ranuras van en columna (Ajustes dirá «de la derecha»)',
      res.every(x => x.casa && x.pausa && x.pausa[0] >= 44 && x.pausa[1] >= 44 && x.activa === 2 && x.pausado) && res.filter(x => x.columna).length === 3, res);
  } catch (e) { t('toques del HUD', false, String(e && e.stack || e)); }

  // ---- H. Cooperativo: barras, «Caído», flechas a los lejanos y «Has caído» con la barra de levantar ----
  try {
    const res = [];
    for (const [w, h, tactil] of [[1280, 720, false], [844, 390, true]]) {
      const H = cargarHud({ w, h, tactil });
      const { juego, G } = H;
      juego.mates = [mateFalso('Ana', '#5FC8FF', w / 2 + 100, h / 2), mateFalso('Leo', '#7EE07A', w / 2 - 100, h / 2 + 50, { dead: true }), mateFalso('Sol', '#FF8AD8', w + 1500, h / 2)];
      let ctx = H.pintar();
      const textos = ctx.ops.filter(o => o.op === 'texto').map(o => o.texto);
      const M = G.MARCA.color;
      const barras = ctx.ops.filter(o => o.op === 'fill' && [M.psAlto, M.psMedio, M.psBajo].includes(o.estilo)).length;
      const flechas = G.HudDex.bandas().flechas.map(f => f.tipo);
      const lab = textos.find(x => /^Sol · \d+ m$/.test(x));
      H.pl.dead = true; H.pl.reviveT = 1.5;
      ctx = H.pintar();
      const t2 = ctx.ops.filter(o => o.op === 'texto').map(o => o.texto);
      const levantar = ctx.ops.some(o => o.op === 'fill' && o.estilo === M.psAlto && o.x2 - o.x > 30);
      res.push({ vp: `${w}x${h}`, caido: textos.includes('Caído'), barras, flechas, lab, hasCaido: t2.includes('Has caído: un compañero puede levantarte'), levantar });
    }
    t('cooperativo: la barra de cada compañero, «Caído» en el caído, flecha «Nombre · N m» sólo al que está lejos (no a los que se ven) y, si caes tú, «Has caído: un compañero puede levantarte» con la barra de levantar',
      res.every(x => x.caido && x.barras >= 3 && JSON.stringify(x.flechas) === '["companero"]' && x.lab && x.hasCaido && x.levantar), res);
  } catch (e) { t('cooperativo del HUD', false, String(e && e.stack || e)); }

  // ---- I. Contraste de cada texto (calculado con los tokens, contra lo que tiene debajo sobre el peor fondo) ----
  try {
    const rgba = s => { if (/^#/.test(s)) return [...hexRgb(s), 1]; const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null; const v = m[1].split(',').map(Number); return [v[0], v[1], v[2], v[3] === undefined ? 1 : v[3]]; };
    const hexRgb = h => { const n = parseInt(h.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const sobre = (c, f) => [0, 1, 2].map(i => c[i] * c[3] + f[i] * (1 - c[3]));
    const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const malos = [];
    let n = 0;
    for (const [w, h, tactil] of [[1440, 900, false], [844, 390, true]]) {
      const H = cargarHud({ w, h, tactil });
      escenaCompleta(H, { lejos: true });
      H.juego.rift = { x: w / 2, y: -800, ttl: 30, t: 1 };
      H.juego.mates[0].pl.dead = true;
      H.pintar(); H.reloj.t += 600;
      const ctx = H.pintar();
      ctx.ops.forEach((o, i) => {
        if (o.op !== 'texto' || !/\p{L}|\d/u.test(o.texto)) return;
        const col = rgba(o.estilo);
        if (!col) return;
        const c0 = sobre(col, [255, 255, 255]);
        const trazo = ctx.ops.slice(Math.max(0, i - 3), i).reverse().find(p => p.op === 'contorno' && p.texto === o.texto);
        let fondo, donde;
        if (trazo) { fondo = sobre(rgba(trazo.estilo), [255, 255, 255]); donde = 'contorno'; }
        else {
          const cx = (o.x + o.x2) / 2, cy = (o.y + o.base) / 2;
          const bajo = ctx.ops.slice(0, i).filter(p => p.op === 'fill' && typeof p.estilo === 'string' && p.estilo !== '#ICONO' && cx >= p.x && cx <= p.x2 && cy >= p.y && cy <= p.y2).pop();
          if (!bajo) { malos.push({ texto: o.texto, por: 'sin panel ni contorno' }); return; }
          fondo = sobre(rgba(bajo.estilo), [255, 255, 255]); donde = bajo.estilo;
        }
        n++;
        const q = ratio(c0, fondo);
        if (q < 4.5) malos.push({ texto: o.texto, color: o.estilo, fondo: donde, ratio: +q.toFixed(2) });
      });
    }
    t(`contraste: cada texto del HUD Dex (${n}, en escritorio y en compacto, con todo a la vez y la grieta) da ≥ 4,5:1 contra su panel al 92 % sobre blanco (el peor fondo) o, si va suelto, contra su contorno`, n > 60 && !malos.length, malos.slice(0, 8));
  } catch (e) { t('contraste del HUD', false, String(e && e.stack || e)); }

  // ---- J. Red de seguridad (U6): fallback, Clásico = upstream, huellas e inventario ----
  try {
    const H = cargarHud({ w: 1440, h: 900, fallar: true });
    const ctx = H.pintar();
    const textos = ctx.ops.filter(o => o.op === 'texto').map(o => o.texto);
    const upstream = textos.some(x => /DERROTADOS/.test(x));
    t('fallback: una excepción dentro del HUD Dex hace que ese fotograma lo pinte upstream (se avisa una vez en la consola) y el contexto del lienzo queda como estaba',
      upstream && ctx.profundidad === 0 && H.c.__avisos.length === 1 && /HUD Dex ha fallado/.test(H.c.__avisos[0]), { upstream, profundidad: ctx.profundidad, avisos: H.c.__avisos });
  } catch (e) { t('fallback del HUD', false, String(e && e.stack || e)); }
  try {
    // Clásico: G.HUD.draw con el gancho pinta exactamente lo mismo que el hud.js de upstream sin él.
    const sinGancho = rd('js/ui/hud.js').split('\n').filter(l => !/MOD nico/.test(l)).join('\n');
    const graba = src => { const H = cargarHud({ w: 1280, h: 720, estilo: 'clasico', hudSrc: src }); escenaCompleta(H); H.juego.rift = { x: 300, y: -500, ttl: 30, t: 2 }; return H.pintar().ops; };
    const a = JSON.stringify(graba(null)), b = JSON.stringify(graba(sinGancho));
    t('Clásico = upstream: con el estilo Clásico, G.HUD.draw con el gancho graba los mismos textos, rectángulos y caminos que el hud.js de upstream sin él', a === b && a.length > 1000, { iguales: a === b, ops: a.length });
  } catch (e) { t('Clásico = upstream', false, String(e && e.stack || e)); }
  try {
    const hud = rd('js/ui/hud.js'), ev = rd('js/systems/events.js');
    const hHud = sha1(sinModNico(hud)), hEv = sha1(eventosHud(sinModNico(ev)));
    const mutadoHud = sha1(sinModNico(hud.replace('const touch = G.Touch.active;', 'const touch = G.Touch.active; const combo = pl.combo;')));
    const mutadoEv = sha1(eventosHud(sinModNico(ev.replace("'#ffd23f', e.name, F);", "'#ffd23f', e.name + ' ' + e.loot, F);"))));
    t(`huellas de lo que pinta upstream: js/ui/hud.js y drawHud/edgeArrow de js/systems/events.js siguen como cuando se portaron al HUD Dex (si no: «hud.js de upstream ha cambiado: revisa git diff -- js/ui/hud.js js/systems/events.js, porta lo nuevo a js/ui/hud-dex.js y actualiza HUELLA_HUD y HUELLA_EVENTOS_HUD»); una copia cambiada da otra huella`,
      hHud === HUELLA_HUD && hEv === HUELLA_EVENTOS_HUD && mutadoHud !== HUELLA_HUD && mutadoEv !== HUELLA_EVENTOS_HUD, { hud: hHud, eventos: hEv });
    // Inventario: cada dato que lee hud.js (y drawHud de events.js) lo cubre el HUD Dex (G.HudDex.CUBRE).
    const H = cargarHud({ w: 1440, h: 900 }), CU = H.G.HudDex.CUBRE;
    const cubre = new Set([...CU.pl.map(x => 'pl.' + x), ...CU.st.map(x => 'st.' + x), ...CU.G.map(x => 'G.' + x)]);
    const faltan = src => [...inventarioHud(src)].filter(x => !cubre.has(x));
    const real = faltan(sinModNico(hud)).concat(faltan(eventosHud(sinModNico(ev))).filter(x => /^pl\.|^st\./.test(x)));
    const mut = faltan(sinModNico(hud.replace('const touch = G.Touch.active;', 'const touch = G.Touch.active; const combo = pl.combo + G.Weather.racha;')));
    t('inventario: todo lo que lee el HUD de upstream (pl.*, st.*, G.*.*) está en G.HudDex.CUBRE; una copia de hud.js que lea pl.combo y G.Weather.racha da FALLO con sus nombres',
      !real.length && JSON.stringify(mut) === '["pl.combo","G.Weather.racha"]', { real, mutado: mut });
  } catch (e) { t('huellas e inventario', false, String(e && e.stack || e)); }

  // ---- K. Pantalla dividida (interfaz preparada): el HUD se maqueta contra los rectángulos de juego y de controles ----
  try {
    const H = cargarHud({ w: 784, h: 724, tactil: true });
    escenaCompleta(H);
    H.G.HudDex.ponerMarco((w, h) => { const d = H.G.Estilo.disposicion(w, h, { dividida: 'abajo', proporcion: 0.4, seguras: H.seguras }); return { juego: d.juego, controles: d.controles }; });
    H.pintar();
    const B = H.G.HudDex.bandas(), P = B.piezas, J = B.juego, K = B.controles;
    const dentro = (r, R) => r.x >= R.x - 0.5 && r.y >= R.y - 0.5 && r.x + r.w <= R.x + R.w + 0.5 && r.y + r.h <= R.y + R.h + 0.5;
    const datos = ['ficha', 'contador', 'rotom', 'jefe', 'aviso'].every(k => !P[k] || dentro(P[k], J)) && P.chips.every(x => dentro(x, J));
    const mandos = P.ranuras.length === 4 && P.ranuras.every(x => dentro(x, K) && x.w >= 48) && P.pausa && dentro(P.pausa, K);
    const zona = B.zona.y + B.zona.h <= J.y + J.h + 0.5 && B.der === 0;
    const colm = H.G.HudDex.columna();
    H.G.HudDex.ponerMarco(null);
    H.pintar();
    const vuelta = H.G.HudDex.bandas().controles === null && H.G.HudDex.bandas().columna;
    t('pantalla dividida (preparada, sin activar): con G.HudDex.ponerMarco() los datos van en el rectángulo de juego, las ranuras (≥ 48 px) y la pausa en el de controles, la zona libre no pasa del juego; ponerMarco(null) vuelve a la pantalla entera',
      datos && mandos && zona && !colm && vuelta, { juego: J, controles: K, ranuras: P.ranuras, pausa: P.pausa, zona: B.zona });
  } catch (e) { t('pantalla dividida del HUD', false, String(e && e.stack || e)); }

  // ---- L. Inglés de los textos nuevos del HUD (i18n.js real) ----
  try {
    const c = { console, navigator: { language: 'en-US', languages: ['en-US'] }, location: { pathname: '/' },
      localStorage: { getItem: () => null, setItem() {} }, document: { documentElement: {} }, confirm: () => true, alert() {} };
    c.CanvasRenderingContext2D = function () {};
    c.CanvasRenderingContext2D.prototype = { fillText() {}, strokeText() {}, measureText() {} };
    c.window = c; c.G = {};
    vm.createContext(c);
    for (const f of ['js/core/i18n.js', 'js/data/lang-en.js', 'js/data/lang-en-mod.js']) vm.runInContext(rd(f), c, { filename: f });
    const EN = c.G.I18n.t;
    const textos = ['PS', 'N.º', 'Nv.', 'Despejado', 'Caído', 'Ataque ×2', 'Atq ×2', 'Velocidad ×1', 'Vel ×1', 'Defensa ×1', 'Regenera ×3', 'Horda Fuego · 18 s', 'Hora dorada · 30 s',
      'Grieta 0:45', 'Grieta · 30 s', 'Grieta · 24 m · 30 s', '¡Se ha abierto una grieta!', 'Sigue la flecha morada: dentro te espera un legendario',
      '¡Grieta abierta! Sigue la flecha morada', '¡Ana necesita ayuda! · 12 m', 'Marca · 12 m', 'Has caído: un compañero puede levantarte', 'Habéis caído todos…',
      'Arrastra el dedo para moverte  ·  toca un ataque para cambiarlo', 'WASD moverse  ·  1-4 / Q / E o clic en un ataque para cambiarlo  ·  Esc pausa', 'Lluvia · 67 s'];
    const sin = textos.filter(s => EN(s) === s);
    t('inglés de los textos del HUD Dex (i18n.js real): PS, N.º, Despejado, Caído, los chips, la horda y la hora dorada, la grieta, los compañeros, «Has caído», la pista de controles y el clima', !sin.length, sin);
    const cortas = ['WASD moverse  ·  1-4, Q, E o clic: cambiar ataque  ·  Esc pausa', 'WASD  ·  1-4 / Q / E  ·  Esc pausa', 'Arrastra para moverte  ·  toca un ataque para cambiarlo', 'Arrastra  ·  toca un ataque'];
    const cortasSin = cortas.filter(s => EN(s) === s || /[áéíóú]|moverse|ataque|pausa|Arrastra/.test(EN(s)));
    t('inglés de las versiones cortas de la pista de controles', !cortasSin.length, cortasSin.length ? cortasSin : cortas.map(EN));
  } catch (e) { t('inglés del HUD', false, String(e && e.stack || e)); }

  // ---- M. Arreglos de la verificación del lote 2 ----
  const enRect = (o, R) => o.ancla && o.ancla[0] >= R.x - 0.5 && o.ancla[0] <= R.x + R.w + 0.5 && o.ancla[1] >= R.y - 0.5 && o.ancla[1] <= R.y + R.h + 0.5;
  const cortaUp = s => /…$/.test(s) && !/(elige fusión|todos|grieta)…$/.test(s);
  // M1. Nombres de arena enteros en el sensor de Rotom (sin «Grieta · »; con la letra un punto menor o en dos líneas).
  try {
    const tiles = rd('js/world/tiles.js'), ini = tiles.indexOf('const ARENA_THEMES');
    const arenas = [...tiles.slice(ini, tiles.indexOf('};', ini)).matchAll(/name: '([^']+)'/g)].map(m => 'Grieta · ' + m[1]);
    const nombres = ['Bosque Umbrío', 'Cueva Cristal', 'Volcán Ceniza', ...arenas];
    const malos = [], vistos = {};
    for (const [w, h, tactil] of [[1440, 900], [1920, 1080], [1024, 768], [724, 784, true], [784, 724, true], [844, 390, true], [780, 360, true], [568, 320, true]]) {
      const H = cargarHud({ w, h, tactil });
      for (const clima of [null, { name: 'Lluvia', icon: 'wrain', left: 67, mult: { water: 1.5, fire: 0.5 } }]) {
        H.juego.clima = clima;
        for (const n of nombres) {
          H.juego.bioma = n;
          const ctx = H.pintar(), B = H.G.HudDex.bandas(), R = B.piezas.rotom;
          if (R.modo === 'cara') { vistos[`${w}x${h}`] = 'cara'; continue; }
          const tx = ctx.ops.filter(o => o.op === 'texto' && enRect(o, R)).map(o => o.texto);
          const limpio = n.replace(/^Grieta · /, ''), junto = tx.join(' ');
          const debeVerse = !clima || B.variante !== 'compacto';
          if (tx.some(x => /…/.test(x) || /^Grieta ·/.test(x)) || (debeVerse && !junto.includes(limpio))) malos.push({ vp: `${w}x${h}`, clima: !!clima, n, tx });
          vistos[`${w}x${h}`] = (vistos[`${w}x${h}`] || 0) + 1;
        }
      }
    }
    t(`sensor de Rotom: los ${nombres.length} nombres (3 biomas y ${arenas.length} arenas) enteros, sin «Grieta · » ni «…», con y sin clima, en escritorio (1440x900, 1920x1080, 1024x768), el plegable abierto (724x784, 784x724) y los móviles (844x390, 780x360, 568x320)`,
      arenas.length === 18 && !malos.length, malos.length ? malos.slice(0, 6) : vistos);
    // Un nombre que no cabe ni con la letra menor (Rotom estrecho): en dos líneas, entero y sin «Despejado».
    const H = cargarHud({ w: 844, h: 390, tactil: true });
    H.juego.bioma = 'Grieta · Bosque Encantado de las Hadas Eternas';
    const ctx = H.pintar(), R = H.G.HudDex.bandas().piezas.rotom;
    const tx = ctx.ops.filter(o => o.op === 'texto' && enRect(o, R)).map(o => o.texto);
    t('sensor de Rotom: un nombre que no cabe en una línea ni con la letra un punto menor va en dos líneas, entero (sin «…» ni «Despejado»)',
      tx.length === 2 && tx.join(' ') === 'Bosque Encantado de las Hadas Eternas' && !tx.some(x => /…/.test(x)), tx);
  } catch (e) { t('nombres de arena en Rotom', false, String(e && e.stack || e)); }
  // M2. La pista de controles: si la larga no cabe, una más corta entera (no «… · Es…»).
  try {
    const res = [];
    for (const [w, h, tactil, jefe] of [[1024, 768, false], [1280, 720, false], [568, 320, true, true], [844, 390, true]]) {
      const H = cargarHud({ w, h, tactil });
      H.st.time = 3; H.juego.banner = null;
      if (jefe) H.juego.jefes = [jefeFalso(w * 0.6, h * 0.6)];
      H.pintar(); H.reloj.t += 400;
      const ctx = H.pintar(), A = H.G.HudDex.bandas().piezas.aviso;
      const tx = A ? ctx.ops.filter(o => o.op === 'texto' && enRect(o, A)).map(o => o.texto) : [];
      const vs = H.G.HudDex.Avisos.visible && H.G.HudDex.Avisos.visible.variantes || [];
      res.push({ vp: `${w}x${h}`, tx, ok: tx.length === 1 && vs.includes(tx[0]) && !/…/.test(tx[0]) });
    }
    // (Con la letra de verdad, a 1024x768 cabe la del medio y a 1280x720 la larga: lo mira estilo-e2e.js; aquí el ancho es
    // el de mentira, más ancho que el real.)
    t('pista de controles: a 1024x768 (y en un móvil pequeño con el jefe al lado) sale una versión que cabe entera, sin «…»; con sitio, la larga', res.every(x => x.ok) && res[3].tx[0] === 'Arrastra el dedo para moverte  ·  toca un ataque para cambiarlo', res);
  } catch (e) { t('pista de controles', false, String(e && e.stack || e)); }
  // M3. La píldora del ataque activo (compacto, dentro de la zona libre) no la pisa ninguna flecha ni su etiqueta.
  try {
    const res = [];
    for (const [w, h, seguras, caida] of [[844, 390], [844, 390, null, true], [844, 390, { sup: 0, der: 47, inf: 21, izq: 47 }], [724, 784]]) {
      const H = cargarHud({ w, h, tactil: true, seguras: seguras || { sup: 0, der: 0, inf: 0, izq: 0 } });
      H.pl.slots[1][0].name = 'Danza Espada';   // un nombre largo: la píldora llega hasta donde va la etiqueta de la flecha
      H.pintar();
      const S1 = H.G.HudDex.bandas().piezas.ranuras[1], yc = S1.y + S1.h / 2;
      // Sol (o Ana, caída) lejos a la derecha, justo a la altura de la ranura activa, donde va la píldora.
      H.juego.mates = [caida ? mateFalso('Ana', '#5FC8FF', w + 2500, yc + 15, { dead: true }) : mateFalso('Sol', '#FF8AD8', w + 2000, yc + 15)];
      const ctx = H.pintar(), B = H.G.HudDex.bandas();
      // La píldora, en lo pintado: el relleno bajo el nombre del ataque activo.
      const it = ctx.ops.findIndex(o => o.op === 'texto' && o.texto === 'Danza Espada');
      const fp = it > 0 ? ctx.ops.slice(0, it).reverse().find(o => o.op === 'fill' && o.ancla === undefined && o.x <= o.x2 && (ctx.ops[it].ancla[0] >= o.x && ctx.ops[it].ancla[0] <= o.x2 && ctx.ops[it].ancla[1] >= o.y && ctx.ops[it].ancla[1] - 8 <= o.y2)) : null;
      const pil = fp ? { x: fp.x, y: fp.y, w: fp.x2 - fp.x, h: fp.y2 - fp.y } : null;
      const choca = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      const cajas = B.flechas.flatMap(f => f.cajas || []);
      const etiquetas = ctx.ops.filter(o => o.op === 'texto' && /· \d+ m$/.test(o.texto)).map(o => ({ x: o.x, y: o.y, w: o.x2 - o.x, h: o.y2 - o.y, t: o.texto }));
      const pisan = pil ? [...cajas, ...etiquetas].filter(c => choca(c, pil)) : null;
      res.push({ vp: `${w}x${h}${seguras ? ' muesca' : ''}${caida ? ' caída' : ''}`, pildora: pil, igualQueBandas: !!(B.pildora && pil && Math.abs(B.pildora.x - pil.x) < 1 && Math.abs(B.pildora.y - pil.y) < 1), flechas: B.flechas.map(f => [f.tipo, Math.round(f.y)]), pisan: pisan && pisan.map(c => c.t || 'cuerpo') });
    }
    t('flechas y píldora del ataque: en compacto, ninguna flecha ni su etiqueta pisa la píldora del ataque activo (también con muesca y en el plegable), aunque el compañero (o el caído) esté a su altura y el ataque tenga un nombre largo',
      res.every(x => x.pildora && x.igualQueBandas && x.flechas.length === 1 && x.pisan && !x.pisan.length), res);
  } catch (e) { t('flechas y píldora', false, String(e && e.stack || e)); }
  // M4. «Caído» en una columna estrecha (muesca): una cruz y la barra vacía, nunca «Ca…».
  try {
    const H = cargarHud({ w: 844, h: 390, tactil: true, seguras: { sup: 0, der: 47, inf: 21, izq: 47 } });
    H.juego.mates = [mateFalso('Ana', '#5FC8FF', 400, 200, { dead: true }), mateFalso('Leo', '#7EE07A', 450, 220)];
    const ctx = H.pintar(), C0 = H.G.HudDex.bandas().piezas.companeros[0];
    const tx = ctx.ops.filter(o => o.op === 'texto' && o.y >= C0.y - 1 && o.y2 <= C0.y + C0.h + 1 && o.x >= C0.x - 1 && o.x2 <= C0.x + C0.w + 2).map(o => o.texto);
    const cruz = ctx.ops.some(o => o.op === 'stroke' && o.x >= C0.x && o.x2 <= C0.x + C0.w && o.y >= C0.y && o.y2 <= C0.y + C0.h && o.x2 - o.x <= 12 && o.x2 - o.x >= 5);
    const ancho = C0.w;
    // Y sin muesca, con sitio, sigue diciendo «Caído».
    const H2 = cargarHud({ w: 844, h: 390, tactil: true });
    H2.juego.mates = H.juego.mates;
    const tx2 = H2.pintar().ops.filter(o => o.op === 'texto').map(o => o.texto);
    t('«Caído» en la columna estrecha de compañeros (844x390 con muesca de 47/47/21): una cruz y la barra vacía en vez de «Ca…»; con sitio, «Caído»',
      !tx.some(x => /…/.test(x)) && (tx.includes('Caído') || cruz) && tx2.includes('Caído'), { ancho, tx, cruz });
  } catch (e) { t('«Caído» en columna estrecha', false, String(e && e.stack || e)); }
  // M5. Plegable abierto: nada del HUD encima del pliegue (por si está a medio plegar: libro o mesa).
  try {
    const res = [];
    for (const [w, h, jefe] of [[724, 784, true], [724, 784, false], [784, 724, true], [800, 870, true], [869, 941, true]]) {
      const H = cargarHud({ w, h, tactil: true });
      escenaCompleta(H);
      // Un aviso que cabe entero a un lado del pliegue (uno que no cabe lo cruza: antes eso que recortarlo).
      H.juego.banner = { text: '¡Onix salvaje apareció!', t: 3.2 };
      if (!jefe) H.juego.jefes = [];
      H.pintar();
      const B = H.G.HudDex.bandas(), pg = B.pliegue;
      const L = piezas(H.G, H.pl);
      const pisa = pg ? L.filter(p => pg.eje === 'x' ? p.x < pg.pos + pg.ancho / 2 && p.x + p.w > pg.pos - pg.ancho / 2 : p.y < pg.pos + pg.ancho / 2 && p.y + p.h > pg.pos - pg.ancho / 2).map(p => p.n) : null;
      res.push({ vp: `${w}x${h}${jefe ? '' : ' sin jefe'}`, pliegue: pg, pisa });
    }
    const sin = [[724, 784, false], [844, 390, true], [1024, 768, true], [1440, 900, true]].map(([w, h, tactil]) => { const H = cargarHud({ w, h, tactil }); H.pintar(); return H.G.HudDex.bandas().pliegue; });
    t('plegable abierto (táctil, casi cuadrado, lado corto ≥ 600): el pliegue parte el lado corto (724x784: vertical en x = 362; 784x724: horizontal en y = 362) y ninguna pieza del HUD lo pisa (contador, jefe, aviso que cabe a un lado, ranuras, objeto, compañeros, chips); con ratón, en un móvil o en una tableta 4:3, no hay pliegue',
      res.every(x => x.pliegue && !x.pisa.length) && res[0].pliegue.eje === 'x' && res[0].pliegue.pos === 362 && res[2].pliegue.eje === 'y' && res[2].pliegue.pos === 362 && sin.every(x => x === null), { res, sin });
  } catch (e) { t('pliegue del plegable', false, String(e && e.stack || e)); }
  // M6. Filas de compañeros en escritorio: aire entre la insignia y el nombre, y entre el nombre y la barra.
  try {
    const res = [];
    for (const [w, h] of [[1024, 768], [1440, 900]]) {
      const H = cargarHud({ w, h });
      H.juego.mates = [mateFalso('Ana', '#5FC8FF', w / 2 + 100, h / 2), mateFalso('e2eA_deaa94', '#7EE07A', w / 2 - 100, h / 2)];
      const ctx = H.pintar(), B = H.G.HudDex.bandas(), k = B.escala, E = H.G.MARCA.hud.escritorio.companeros;
      B.piezas.companeros.forEach((R, i) => {
        const nom = ctx.ops.find(o => o.op === 'texto' && o.y >= R.y - 2 && o.y2 <= R.y + R.h + 2 && o.x > R.x + 4 && o.texto !== 'Caído' && !/^[A-Z]$/.test(o.texto));
        const finInsignia = R.x + Math.round(6 * k) + 2 * Math.round(E.insignia * k), barra = R.x + Math.round(E.barra.x * k);
        res.push({ vp: `${w}x${h}`, n: nom && nom.texto, aire: nom && +(nom.x - finInsignia).toFixed(1), hastaBarra: nom && +(barra - nom.x2).toFixed(1) });
      });
    }
    t('compañeros en escritorio: al menos 4 px entre la insignia y el nombre, y entre el nombre y su barra', res.length === 4 && res.every(x => x.n && x.aire >= 4 && x.hastaBarra >= 4), res);
  } catch (e) { t('filas de compañeros', false, String(e && e.stack || e)); }
  // M7. Avisos de logro en partida con el HUD Dex: bajo su banda de arriba (G.MODS.avisoEnEspera -> G.Estilo.colocarLogro).
  try {
    const H = cargarHud({ w: 1440, h: 900 });
    H.pintar();
    const clases = new Set(), props = {};
    H.c.document.documentElement = { classList: { toggle(c, v) { if (v) clases.add(c); else clases.delete(c); }, contains: c => clases.has(c) }, style: { setProperty(k, v) { props[k] = v; } } };
    const sup = H.G.HudDex.bandas().sup;
    H.G.Game.state = 'playing'; H.G.MODS.avisoEnEspera(() => {});
    const jugando = clases.has('hud-dex-logro') && props['--hud-dex-sup'] === sup + 'px';
    H.G.Game.state = 'ui'; H.G.MODS.avisoEnEspera(() => {});
    const menu = !clases.has('hud-dex-logro');
    // Un aviso que salió en el menú (sin la clase) baja al empezar la partida: lo mira el HUD Dex al pintarse.
    H.G.Game.state = 'playing'; H.pintar();
    const alEmpezar = clases.has('hud-dex-logro');
    H.G.Game.state = 'levelup'; H.pintar();
    const cartas = !clases.has('hud-dex-logro');
    H.G.Game.state = 'playing'; H.G.Estilo.set('clasico'); H.G.MODS.avisoEnEspera(() => {});
    const clasico = !clases.has('hud-dex-logro');
    const css = rd('css/nico.css');
    const regla = /@media \(min-height: 521px\) \{\s*html\.estilo-dex\.hud-dex-logro \.ach-pop \{ top: calc\(var\(--hud-dex-sup, 56px\) \+ 8px\); \}\s*\}/.test(css);
    t(`avisos de logro en partida con el HUD Dex: la clase hud-dex-logro y --hud-dex-sup (${sup} px a 1440x900) al salir cada aviso y al pintarse el HUD (un aviso del menú baja al empezar la partida), y css/nico.css lo pone 8 px por debajo (en pantallas de 521 px de alto o más); en el menú, con las cartas de nivel o con Clásico, donde siempre`,
      jugando && menu && alEmpezar && cartas && clasico && regla, { jugando, menu, alEmpezar, cartas, clasico, regla, props });
  } catch (e) { t('avisos de logro bajo el HUD Dex', false, String(e && e.stack || e)); }

  // ---- N. Arreglos de la verificación de los lotes 1 y 2 ----
  const cruzan = (a, b) => a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
  const pisaPliegueR = (r, pg) => (pg.eje === 'x' ? r.x < pg.pos + pg.ancho / 2 && r.x + r.w > pg.pos - pg.ancho / 2 : r.y < pg.pos + pg.ancho / 2 && r.y + r.h > pg.pos - pg.ancho / 2);
  const dentroDe = (a, R) => a.x >= R.x - 0.5 && a.y >= R.y - 0.5 && a.x + a.w <= R.x + R.w + 0.5 && a.y + a.h <= R.y + R.h + 0.5;
  /** Las etiquetas de flecha pintadas (texto con «· N m» o «Grieta · …»), como rectángulos. */
  const etiquetasPintadas = ctx => ctx.ops.filter(o => o.op === 'texto' && (/· \d+ m$/.test(o.texto) || /^Grieta · \d+ m/.test(o.texto) || /^Meowth$/.test(o.texto)))
    .map(o => ({ t: o.texto, x: o.x, y: o.y, w: o.x2 - o.x, h: o.y2 - o.y }));
  /** Los problemas de las flechas del último fotograma: dos flechas (cuerpo o etiqueta) que se pisan, etiquetas fuera de la
   *  zona libre o encima de una pieza del HUD, y etiquetas pintadas que se pisan, se salen de la pantalla o no están donde
   *  dice flechas(). */
  function problemasFlechas(H, ctx) {
    const B = H.G.HudDex.bandas(), F = B.flechas, Z = B.zona, mal = [];
    const pzs = piezas(H.G, H.pl).concat(B.pildora ? [{ n: 'pildora', ...B.pildora }] : []);
    for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) {
      if (F[i].cajas.some(a => F[j].cajas.some(b => cruzan(a, b)))) mal.push(`${F[i].tipo}/${F[j].tipo} se pisan`);
    }
    for (const f of F) for (const c of f.cajas.filter(x => x.etiqueta)) {
      if (!dentroDe(c, Z)) mal.push(`etiqueta de ${f.tipo} fuera de la zona libre`);
      const p = pzs.find(q => cruzan(c, q));
      if (p) mal.push(`etiqueta de ${f.tipo} sobre ${p.n}`);
    }
    const E = etiquetasPintadas(ctx), W = H.c.innerWidth, Hh = H.c.innerHeight;
    for (let i = 0; i < E.length; i++) {
      if (E[i].x < -0.5 || E[i].x + E[i].w > W + 0.5 || E[i].y < -0.5 || E[i].y + E[i].h > Hh + 0.5) mal.push(`«${E[i].t}» pintada fuera de la pantalla`);
      for (let j = i + 1; j < E.length; j++) if (cruzan(E[i], E[j])) mal.push(`«${E[i].t}» y «${E[j].t}» pintadas una encima de otra`);
    }
    const cajasEt = F.flatMap(f => f.cajas.filter(x => x.etiqueta));
    for (const e of E) if (!cajasEt.some(c => e.x >= c.x - 1 && e.x + e.w <= c.x + c.w + 1)) mal.push(`«${e.t}» no está donde la colocó flechas()`);
    return { mal, n: F.length, etiquetas: E.length };
  }
  // N1. Flechas del mismo cuadrante (cooperativo con 3 compañeros y el jefe), en las cuatro esquinas: ni las flechas ni
  //     sus etiquetas se pisan, y cada etiqueta queda entera dentro de la zona libre y fuera de los paneles.
  try {
    const res = [];
    const ESQ = { 'arriba-der': [1, -1], 'abajo-der': [1, 1], 'arriba-izq': [-1, -1], 'abajo-izq': [-1, 1] };
    const VPS = [[1440, 900], [1024, 768], [1920, 1080], [1280, 720], [844, 390, true], [844, 390, true, { sup: 0, der: 47, inf: 21, izq: 47 }], [780, 360, true], [724, 784, true], [784, 724, true]];
    for (const [w, h, tactil = false, seguras] of VPS) {
      for (const [esq, [sx, sy]] of Object.entries(ESQ)) {
        const H = cargarHud({ w, h, tactil, seguras: seguras || { sup: 0, der: 0, inf: 0, izq: 0 } });
        const cx = sx > 0 ? w : 0, cy = sy > 0 ? h : 0;
        H.juego.jefes = [jefeFalso(cx + sx * 900, cy + sy * 500)];
        H.juego.mates = [mateFalso('Ana', '#5FC8FF', cx + sx * 1500, cy + sy * 300, { dead: true }), mateFalso('Leo', '#7EE07A', cx + sx * 600, cy + sy * 1400),
          mateFalso('Sol', '#FF8AD8', cx + sx * 2000, cy + sy * 900)];
        const ctx = H.pintar();
        const p = problemasFlechas(H, ctx);
        if (p.mal.length || p.n !== 4 || p.etiquetas !== 4) res.push({ vp: `${w}x${h}${seguras ? ' muesca' : ''}`, esq, ...p });
      }
    }
    t(`flechas del mismo cuadrante (jefe, compañero caído y dos compañeros, en las cuatro esquinas, en ${VPS.length} pantallas: escritorio, móvil con y sin muesca y el plegable): ni las flechas ni sus etiquetas se pisan, y cada etiqueta queda entera en la zona libre, fuera de los paneles y donde la colocó flechas()`,
      !res.length, res.slice(0, 4));
  } catch (e) { t('flechas del mismo cuadrante', false, String(e && e.stack || e)); }
  // N2. Muchas a la vez en un cuadrante (jefe, 3 compañeros, la grieta, un shiny, el ladrón y el Pokémon perdido), y el
  //     caído solo, justo en las esquinas de la derecha (su etiqueta se salía de la pantalla a 1440x900 y 1024x768).
  try {
    const res = [];
    for (const [w, h, tactil = false] of [[1440, 900], [1024, 768], [1920, 1080], [724, 784, true]]) {
      const H = cargarHud({ w, h, tactil });
      const { juego, G } = H;
      juego.jefes = [jefeFalso(w + 900, -500)];
      juego.mates = [mateFalso('Ana', '#5FC8FF', w + 1500, -300, { dead: true }), mateFalso('Leo', '#7EE07A', w + 600, -1400), mateFalso('Sol', '#FF8AD8', w + 2000, -900)];
      juego.rift = { x: w + 700, y: -700, ttl: 30, t: 9 };
      juego.shinies = [{ x: w + 300, y: -200, dead: false }];
      juego.otros = [{ behavior: 'thief', dead: false, x: w + 1200, y: -1200, name: 'Meowth' }];
      G.Events.onNet(['ev', 'lp', 52, w + 800, -2000, 100, 0, w + 800, -2100, 0, 0]);
      const ctx = H.pintar();
      const p = problemasFlechas(H, ctx);
      res.push({ vp: `${w}x${h}`, flechas: p.n, mal: p.mal.slice(0, 4) });
    }
    for (const [w, h, tactil = false] of [[1440, 900], [1024, 768], [844, 390, true], [724, 784, true]]) {
      for (const y of [-400, h + 400, 0.62 * h]) {
        const H = cargarHud({ w, h, tactil });
        H.juego.mates = [mateFalso('Ana', '#5FC8FF', w + 3000, y, { dead: true })];
        const ctx = H.pintar();
        const p = problemasFlechas(H, ctx);
        res.push({ vp: `${w}x${h} caído en y=${Math.round(y)}`, flechas: p.n, mal: p.mal.slice(0, 4) });
      }
    }
    t('flechas: ocho a la vez en el mismo cuadrante (jefe, caído, dos compañeros, grieta, shiny, ladrón y Pokémon perdido) sin pisarse, en escritorio y en el plegable; y el compañero caído en las esquinas de la derecha y a media altura: su etiqueta, entera dentro de la zona libre (antes se salía de la pantalla a 1440x900 y 1024x768)',
      res.every(x => !x.mal.length) && res.slice(0, 4).every(x => x.flechas === 8) && res.slice(4).every(x => x.flechas === 1), res);
  } catch (e) { t('flechas: muchas a la vez y el caído en la esquina', false, String(e && e.stack || e)); }
  // N3. Plegable abierto en vertical: los avisos de la fila 2 respetan el pliegue (con y sin jefe, también los largos).
  try {
    const AVISOS = ['¡Kingambit salvaje apareció!', 'Guardas el vínculo: aprende otro movimiento para usarlo', '¡Un Meowth con un ticket ×10! ¡Atrápalo antes de que huya!',
      'Pausa: Ana, Leo eligen fusión…', '¡Poder Furia! Tu ataque sube un 30 % durante 30 s', 'grieta', 'pista'];
    const res = [];
    for (const [w, h, pantalla] of [[724, 784], [724, 700, { w: 724, h: 784 }], [800, 870], [869, 941]]) {
      for (const jefe of [true, false]) {
        for (const a of AVISOS) {
          const H = cargarHud({ w, h, tactil: true });
          if (pantalla) H.G.Estilo.pantalla = () => pantalla;   // el Magic V6 en vertical con la barra del navegador
          if (jefe) H.juego.jefes = [jefeFalso(w * 0.6, h * 0.6)];
          if (a === 'grieta') H.juego.rift = { x: w * 0.3, y: h * 0.7, ttl: 30, t: 1 };
          else if (a === 'pista') { H.st.time = 3; H.juego.banner = null; }
          else H.juego.banner = { text: a, t: 3.2 };
          H.pintar(); H.reloj.t += 400;
          const ctx = H.pintar(), B = H.G.HudDex.bandas(), A = B.piezas.aviso, pg = B.pliegue;
          if (!A || !pg) { res.push({ vp: `${w}x${h}`, a, mal: 'sin aviso o sin pliegue' }); continue; }
          const tx = ctx.ops.filter(o => o.op === 'texto' && enRect(o, A));
          const pisa = pisaPliegueR(A, pg) || tx.some(o => o.x < pg.pos + pg.ancho / 2 && o.x2 > pg.pos - pg.ancho / 2);
          const recortado = tx.some(o => /…$/.test(o.texto) && !cortaUp(o.texto));
          const j = B.piezas.jefe;
          if (pisa || recortado || (j && pisaPliegueR(j, pg)) || (j && cruzan(j, A))) res.push({ vp: `${w}x${h}${jefe ? ' con jefe' : ''}`, a, aviso: A, textos: tx.map(o => o.texto), pisa, recortado });
        }
      }
    }
    t(`plegable abierto en vertical (724x784, 724x700 con la barra del navegador, 800x870 y 869x941; con y sin jefe): los avisos de la fila 2 (${AVISOS.length} textos: el del jefe, los largos de upstream, la grieta y la pista) quedan enteros a un lado del pliegue (con la letra un punto menor o en dos líneas si hace falta), sin «…» y sin pisar al jefe`,
      !res.length, res.slice(0, 4));
  } catch (e) { t('avisos y pliegue', false, String(e && e.stack || e)); }
  // N5. El pliegue es de la pantalla, no de la ventana: con la barra del navegador (724x700 dentro de 724x784) sigue
  //     vertical en x = 362; girado (784x640 dentro de 784x724), horizontal a 362 px de lo alto de la pantalla; en una
  //     ventana del sistema partida o en un portátil táctil con la ventana casi cuadrada, sin pliegue.
  try {
    const H = cargarHud({ w: 724, h: 700, tactil: true }), E = H.G.Estilo, PG = H.G.MARCA.hud.compacto.pliegue;
    const casos = {
      'vertical con barra': E.plieguePantalla(724, 700, { w: 724, h: 784 }, PG), 'vertical': E.plieguePantalla(724, 784, { w: 724, h: 784 }, PG),
      'girado con barra': E.plieguePantalla(784, 640, { w: 784, h: 724 }, PG), 'girado': E.plieguePantalla(784, 724, { w: 784, h: 724 }, PG),
      'ventana partida': E.plieguePantalla(362, 784, { w: 724, h: 784 }, PG), 'portátil táctil': E.plieguePantalla(700, 650, { w: 1920, h: 1080 }, PG),
      'sin pantalla (la ventana)': E.plieguePantalla(784, 724, null, PG)
    };
    H.G.Estilo.pantalla = () => ({ w: 724, h: 784 });
    H.pintar();
    const enHud = H.G.HudDex.bandas().pliegue;
    const q = (k, eje, pos) => casos[k] && casos[k].eje === eje && casos[k].pos === pos;
    t('el pliegue sale de la pantalla y no de la ventana: el Magic V6 en vertical con la barra del navegador (724x700) lo tiene vertical en x = 362 (también en el HUD), girado con la barra (784x640) horizontal en y = 278; sin pliegue en una ventana partida del sistema ni en un portátil táctil (pantalla 16:9)',
      q('vertical con barra', 'x', 362) && q('vertical', 'x', 362) && q('girado con barra', 'y', 278) && q('girado', 'y', 362) && !casos['ventana partida'] && !casos['portátil táctil'] &&
      q('sin pantalla (la ventana)', 'y', 362) && enHud && enHud.eje === 'x' && enHud.pos === 362, { casos, enHud });
  } catch (e) { t('pliegue de la pantalla', false, String(e && e.stack || e)); }
  // N4. La caché de anchos del HUD se vacía cuando termina de cargar una fuente (document.fonts «loadingdone»).
  try {
    const H = cargarHud({ w: 844, h: 390, tactil: true });
    H.juego.banner = { text: '¡Kingambit salvaje apareció!', t: 30 };
    let f = 1.1;   // la letra de reserva, más ancha
    const lienzo = () => { const c = new LienzoFalso(); c.measureText = s => ({ width: String(s).length * c.tam() * f }); return c; };
    H.pintar(lienzo()); H.reloj.t += 400;
    const w0 = (H.pintar(lienzo()), H.G.HudDex.bandas().piezas.aviso.w);
    f = 0.6;   // llega M PLUS (más estrecha): sin el evento, el aviso conserva el ancho viejo
    const w1 = (H.pintar(lienzo()), H.G.HudDex.bandas().piezas.aviso.w);
    const oyentes = (H.c.__fuentes.loadingdone || []).length;
    (H.c.__fuentes.loadingdone || []).forEach(fn => fn({}));
    const w2 = (H.pintar(lienzo()), H.G.HudDex.bandas().piezas.aviso.w);
    t('caché de anchos del HUD Dex: se vacía al terminar de cargar una fuente (document.fonts, evento «loadingdone»; y con fonts.ready): el aviso pasa a medir con la letra nueva',
      oyentes >= 1 && w1 === w0 && w2 < w1, { oyentes, w0, w1, w2 });
  } catch (e) { t('caché de anchos y fuentes', false, String(e && e.stack || e)); }

  // ---- P. Acabado de las flechas (verificación de la tanda PokéSwarm) ----
  // P1. Entre dos etiquetas, 12 px de texto a texto (a 6, «Kingambit · 18 m» y «Sol · 33 m» se leían como una frase); el
  //     cuerpo de cada flecha, con su punta, a 8 px o más de las piezas del HUD y de la píldora del ataque (a 1,3 px
  //     parecía señalar la ranura); y, en el plegable abierto, ninguna flecha ni su etiqueta sobre el pliegue (también con
  //     la barra del navegador, con el pliegue de la pantalla).
  try {
    const res = [];
    /** Hueco entre dos cajas (negativo si se pisan). */
    const hueco = (a, b) => Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h));
    const revisar = (H, nombre, n) => {
      const ctx = H.pintar(), B = H.G.HudDex.bandas(), F = B.flechas, mal = [];
      const pzs = piezas(H.G, H.pl).concat(B.pildora ? [{ n: 'pildora', ...B.pildora }] : []);
      const et = F.flatMap(f => f.cajas.filter(c => c.etiqueta).map(c => Object.assign({ f: f.tipo }, c)));
      // Las cajas de etiqueta llevan 2 px de relleno por lado: 8 entre cajas son 12 entre textos.
      for (let i = 0; i < et.length; i++) for (let j = i + 1; j < et.length; j++) {
        const g = hueco(et[i], et[j]);
        if (g < 8 - 0.5) mal.push(`etiquetas de ${et[i].f} y ${et[j].f} a ${Math.round(g + 4)} px de texto a texto`);
      }
      for (const f of F) {
        const c = f.cajas.find(x => !x.etiqueta), p = c && pzs.find(q => hueco(c, q) < 8 - 0.5);
        if (p) mal.push(`${f.tipo} a ${Math.round(hueco(c, p))} px de ${p.n}`);
      }
      if (B.pliegue) for (const f of F) for (const c of f.cajas) if (pisaPliegueR(c, B.pliegue)) mal.push(`${c.etiqueta ? 'etiqueta' : 'flecha'} de ${f.tipo} sobre el pliegue`);
      const p = problemasFlechas(H, ctx);
      if (mal.length || p.mal.length || p.n !== n) res.push({ caso: nombre, flechas: p.n, mal: mal.concat(p.mal).slice(0, 4) });
    };
    // Todos arriba (móvil y escritorio): el jefe y tres compañeros, uno caído, por encima de la pantalla.
    for (const [w, h, tactil = false] of [[844, 390, true], [780, 360, true], [1440, 900], [1024, 768], [724, 784, true]]) {
      const H = cargarHud({ w, h, tactil });
      H.juego.jefes = [jefeFalso(w * 0.35, -700)];
      H.juego.mates = [mateFalso('Ana', '#5FC8FF', w * 0.45, -500, { dead: true }), mateFalso('Leo', '#7EE07A', w * 0.6, -1200), mateFalso('Sol', '#FF8AD8', w * 0.42, -1000)];
      revisar(H, `${w}x${h} todos arriba`, 4);
    }
    // En línea a la derecha, a la altura de la ranura activa (con la píldora del ataque, de nombre largo, a la vista).
    for (const [w, h] of [[844, 390], [780, 360], [807, 360], [724, 784]]) {
      const H = cargarHud({ w, h, tactil: true });
      H.pl.slots[1][0].name = 'Danza Espada';
      H.pintar();
      const S1 = H.G.HudDex.bandas().piezas.ranuras[1], yc = S1.y + S1.h / 2;
      H.juego.jefes = [jefeFalso(w + 900, yc)];
      H.juego.mates = [mateFalso('Ana', '#5FC8FF', w + 300, yc + 10, { dead: true }), mateFalso('Leo', '#7EE07A', w + 1500, yc - 10), mateFalso('Sol', '#FF8AD8', w + 2000, yc + 20)];
      revisar(H, `${w}x${h} en línea a la derecha`, 4);
    }
    // Las cuatro esquinas (las de N1), en el móvil, con muesca y en el plegable.
    const ESQ = [[1, -1], [1, 1], [-1, -1], [-1, 1]];
    for (const [w, h, seguras] of [[844, 390], [844, 390, { sup: 0, der: 47, inf: 21, izq: 47 }], [724, 784], [784, 724]]) {
      for (const [sx, sy] of ESQ) {
        const H = cargarHud({ w, h, tactil: true, seguras: seguras || { sup: 0, der: 0, inf: 0, izq: 0 } });
        const cx = sx > 0 ? w : 0, cy = sy > 0 ? h : 0;
        H.juego.jefes = [jefeFalso(cx + sx * 900, cy + sy * 500)];
        H.juego.mates = [mateFalso('Ana', '#5FC8FF', cx + sx * 1500, cy + sy * 300, { dead: true }), mateFalso('Leo', '#7EE07A', cx + sx * 600, cy + sy * 1400),
          mateFalso('Sol', '#FF8AD8', cx + sx * 2000, cy + sy * 900)];
        revisar(H, `${w}x${h}${seguras ? ' muesca' : ''} esquina ${sx},${sy}`, 4);
      }
    }
    // El pliegue: el jefe justo encima (vertical, x = 362) o los compañeros en el horizonte (horizontal, y = 362; girado con
    // la barra del navegador, y = 278).
    for (const [w, h, pantalla] of [[724, 784], [724, 700, { w: 724, h: 784 }], [784, 724], [784, 640, { w: 784, h: 724 }]]) {
      const H = cargarHud({ w, h, tactil: true });
      if (pantalla) H.G.Estilo.pantalla = () => pantalla;
      const vertical = (pantalla || { w, h }).w < (pantalla || { w, h }).h, pos = vertical ? 362 : (pantalla ? 278 : 362);
      if (vertical) {
        H.juego.jefes = [jefeFalso(pos, -800)];
        H.juego.mates = [mateFalso('Ana', '#5FC8FF', pos, -1500, { dead: true }), mateFalso('Leo', '#7EE07A', pos, h + 900)];
      } else {
        H.juego.jefes = [jefeFalso(-900, pos)];
        H.juego.mates = [mateFalso('Ana', '#5FC8FF', w + 1500, pos, { dead: true }), mateFalso('Leo', '#7EE07A', w + 700, pos)];
      }
      H.pintar();
      const pg = H.G.HudDex.bandas().pliegue;
      if (!pg || pg.pos !== pos) { res.push({ caso: `${w}x${h} pliegue`, mal: ['el pliegue no es el esperado', pg] }); continue; }
      revisar(H, `${w}x${h}${pantalla ? ' con la barra' : ''}: pliegue ${pg.eje === 'x' ? 'vertical' : 'horizontal'} en ${pos}`, 3);
    }
    t('acabado de las flechas: 12 px de texto a texto entre etiquetas, el cuerpo de cada flecha a 8 px o más de las piezas del HUD y de la píldora del ataque, y nada sobre el pliegue del plegable abierto (todos arriba, en línea a la altura de la ranura activa, en las cuatro esquinas y con el jefe o los compañeros sobre el pliegue; escritorio, móvil, muesca y el Magic V6, también con la barra del navegador)',
      !res.length, res.slice(0, 6));
  } catch (e) { t('acabado de las flechas', false, String(e && e.stack || e)); }

  const failed = r.filter(x => !x[1]);
  if (!failed.length) ok(`HUD Dex: ${r.length} casos bien`);
  for (const [name, , detail] of failed) bad(`HUD Dex: ${name}${detail !== undefined ? ' · ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
}

// ---------------- 16. ajustes de juego (lote 4): píxel nítido, encuadre, iris, rótulo de zona y golpe final ----------------
function juegoChecks() {
  console.log('16. Ajustes de juego (lote 4): píxel nítido, encuadre, iris, rótulo de zona y golpe final');
  const r = [];
  const t = (name, cond, detail) => r.push([name, !!cond, detail]);
  const casi = (a, b, e = 1e-6) => Math.abs(a - b) <= e;
  /** El juego mínimo con mods.js, marca.js, settings.js y camera.js reales y los módulos pedidos. */
  const nuevo = ({ mods = {}, ajustes = {}, dpr = 1, ficheros = [] } = {}) => {
    const almacen = { 'ps.settings': JSON.stringify(ajustes) }, reloj = { t: 1000 };
    const c = { console, devicePixelRatio: dpr, performance: { now: () => reloj.t }, matchMedia: () => ({ matches: false }),
      localStorage: { getItem: k => (k in almacen ? almacen[k] : null), setItem: (k, v) => { almacen[k] = String(v); } } };
    c.window = c; c.G = {}; c.__reloj = reloj;
    vm.createContext(c);
    for (const f of ['js/core/util.js', 'js/core/mods.js', 'js/ui/marca.js', 'js/core/settings.js', 'js/core/camera.js']) vm.runInContext(rd(f), c, { filename: f });
    Object.assign(c.G.MODS, mods);
    c.G.Sprites = { PX: 2 };
    for (const f of ficheros) vm.runInContext(rd(f), c, { filename: f });
    return c;
  };

  // ---- A. Píxel nítido: tabla de devicePixelRatio y pantallas ----
  try {
    const c = nuevo({ ficheros: ['js/ui/encuadre.js'] }), E = c.G.Encuadre;
    const DPR = [1, 1.25, 1.5, 1.75, 2, 2.625, 3], VPS = [[1440, 900], [1920, 1080], [1366, 768], [1280, 720], [1024, 768], [844, 390], [780, 360], [807, 360],
      [784, 724], [724, 784], [784, 362], [724, 392], [1000, 900], [900, 1000], [568, 320]];
    const mal = [], filas = [];
    for (const d of DPR) for (const [w, h] of VPS) {
      const k = E.calcular(w, h, d);
      const entero = casi(k.fisicos, Math.round(k.fisicos)) && casi(k.k, Math.round(k.k)) && casi(k.m, Math.round(k.m)) && k.m >= 1;
      if (!entero || k.perdida > 0.07 + 1e-9 || k.dprInt > Math.min(1.5, d) + 1e-9) mal.push({ w, h, d, ...k });
      if ([1, 2.625, 3].includes(d) && [[1440, 900], [844, 390], [784, 724], [784, 362]].some(v => v[0] === w && v[1] === h)) filas.push(`${w}x${h}@${d}: ${k.antes.toFixed(2)} -> ${+k.fisicos.toFixed(3)} px (${(k.perdida * 100).toFixed(1)} %)`);
    }
    t(`píxel nítido: en ${DPR.length * VPS.length} combinaciones (dpr ${DPR.join(', ')} y ${VPS.length} pantallas) el píxel de arte mide un número entero de píxeles físicos, el navegador amplía por un entero, nunca se pintan más píxeles que en upstream (resolución ≤ min(1,5, dpr)) y se deja de ver como mucho un 7 % del mundo (${filas.join('; ')})`,
      !mal.length, mal.slice(0, 4));
    const a = E.calcular(1440, 900, 1), b = E.calcular(844, 390, 3), d = E.calcular(1366, 768, 1), e = E.calcular(844, 390, 2.625);
    t('píxel nítido: 1440x900 pasa de 3,75 a 4 px (6,25 % menos de mundo); 1366x768 no sube a 4 (perdería un 11 %) y baja a 3; 844x390 a dpr 3, resolución 1,5 ×2 y 4 px; a dpr 2,625, resolución 1,3125 ×2',
      casi(a.fisicos, 4) && casi(a.perdida, 0.0625) && casi(d.fisicos, 3) && d.perdida < 0 && casi(b.fisicos, 4) && b.dprInt === 1.5 && casi(b.k, 2) && e.dprInt === 1.3125 && casi(e.k, 2), { a, b, d, e });
    t('resolución interna: hasta 1,5 la de la pantalla; con más, dpr / ceil(dpr / 1,5): 2 -> 1, 2,625 -> 1,3125, 3 -> 1,5, 1,75 -> 0,875',
      E.dprInterno(1) === 1 && E.dprInterno(1.25) === 1.25 && E.dprInterno(1.5) === 1.5 && E.dprInterno(2) === 1 && E.dprInterno(2.625) === 1.3125 && E.dprInterno(3) === 1.5 && E.dprInterno(1.75) === 0.875);
  } catch (e) { t('píxel nítido (tabla)', false, String(e && e.stack || e)); }
  try {
    // game.js resize() con camera.js reales: el lienzo y la cámara, con y sin el ajuste.
    const m = rd('js/game.js').match(/  function resize\(\) \{[\s\S]*?\r?\n  \}\r?\n/);
    if (!m) throw new Error('no encuentro resize() en js/game.js');
    const prueba = (w, h, d, ajustes) => {
      const c = nuevo({ dpr: d, ajustes, ficheros: ['js/ui/encuadre.js'] });
      const cv = { style: {}, get clientWidth() { return this.style.width ? Math.round(parseFloat(this.style.width)) : w; }, get clientHeight() { return this.style.height ? Math.round(parseFloat(this.style.height)) : h; } };
      c.__cv = cv;
      vm.runInContext('var cv = __cv, dpr = 1, w = 0, h = 0; function checkOrientation() {}\n' + m[0] + 'resize();', c, { filename: 'js/game.js (resize)' });
      return { cam: c.G.Camera, cv };
    };
    const res = [];
    for (const [w, h, d] of [[1440, 900, 1], [844, 390, 3], [844, 390, 2.625], [845, 391, 3], [784, 724, 3]]) {
      const on = prueba(w, h, d, {}), off = prueba(w, h, d, { pixelNitido: false });
      const fis = 2 * on.cam.scale * d, ancho = parseFloat(on.cv.style.width), k = d / on.cam.dpr;
      res.push({ vp: `${w}x${h}@${d}`, fis, k, lienzo: on.cv.width, css: ancho, exacto: casi(on.cv.width * k, ancho * d, 1e-6),
        apagado: off.cam.scale === Math.min(w / 768, h / 420) && off.cam.dpr === Math.min(1.5, d) && !off.cv.style.width });
    }
    t('game.js resize() y camera.js reales: con píxel nítido (por defecto), el píxel de arte en px físicos enteros y el lienzo con un tamaño CSS que el navegador amplía exactamente ×k (844 a 2,625: 1108 px en 844,19 CSS); apagado, como upstream (escala min(w/768, h/420) y resolución min(1,5, dpr))',
      res.every(x => casi(x.fis, Math.round(x.fis)) && casi(x.k, Math.round(x.k)) && x.exacto && x.apagado), res);
  } catch (e) { t('píxel nítido (game.js y camera.js)', false, String(e && e.stack || e)); }

  // ---- B. Encuadre: tu Pokémon en el centro de la zona libre (HUD Dex compacto) ----
  try {
    const caso = ({ variante = 'compacto', dex = true, estado = 'playing', mods = {} } = {}) => {
      const c = nuevo({ mods, ficheros: ['js/ui/encuadre.js'] }), G = c.G;
      G.Game = { state: estado, player: {} };
      G.Estilo = { dex, hudDex: () => dex };
      // 844x390: dos filas arriba (74 px) y la columna de ataques a la derecha (62 px).
      G.HudDex = { bandas: () => ({ variante, sup: 74, inf: 0, izq: 0, der: 62, juego: { x: 0, y: 0, w: 844, h: 390 }, zona: { x: 0, y: 74, w: 782, h: 316 } }) };
      G.Camera.resize(844, 390, 1);
      G.Camera.x = 0; G.Camera.y = 0;
      const s = G.Camera.scale;
      for (let i = 0; i < 24; i++) G.Camera.follow(0, 0, 1 / 60);   // 0,4 s
      const a400 = [G.Camera.x * s, G.Camera.y * s];
      for (let i = 0; i < 240; i++) G.Camera.follow(0, 0, 1 / 60);
      // Tu Pokémon (en 0,0) en la pantalla: (0 − left) · escala.
      return { s, a400, pantalla: [(0 - G.Camera.left()) * s, (0 - G.Camera.top()) * s] };
    };
    const comp = caso(), esc = caso({ variante: 'escritorio' }), clas = caso({ dex: false }), menu = caso({ estado: 'ui' }), sin = caso({ mods: { encuadreMovil: false } });
    const centro = [782 / 2, 74 + 316 / 2];
    t('encuadre: con el HUD Dex compacto (844x390, filas de 74 px arriba y columna de 62 a la derecha), tu Pokémon acaba en el centro de la zona libre (391, 232) ±1 px y a los 400 ms ya ha hecho el 80 % del camino; con el HUD de escritorio, con Clásico, en los menús o con encuadreMovil = false, en el centro de la pantalla',
      Math.abs(comp.pantalla[0] - centro[0]) <= 1 && Math.abs(comp.pantalla[1] - centro[1]) <= 1 && comp.a400[0] >= 0.8 * 31 &&
      [esc, clas, menu, sin].every(x => Math.abs(x.pantalla[0] - 422) <= 0.5 && Math.abs(x.pantalla[1] - 195) <= 0.5), { comp, esc: esc.pantalla, clas: clas.pantalla, menu: menu.pantalla, sin: sin.pantalla });
  } catch (e) { t('encuadre', false, String(e && e.stack || e)); }

  // ---- C. Iris: cuándo salta ----
  try {
    const caso = ({ dex = true, calma = false } = {}) => {
      const c = nuevo({ ajustes: calma ? { calm: true } : {}, ficheros: ['js/ui/transicion.js'] }), G = c.G, R = c.__reloj;
      const juego = { inArena: false, arena: null, st: { time: 0 } };
      G.Estilo = { dex };
      G.Game = { get st() { return juego.st; }, state: 'playing' };
      G.Rift = { get inArena() { return juego.inArena; }, get arena() { return juego.arena; } };
      G.Camera.resize(1440, 900, 1); G.Camera.x = 0; G.Camera.y = 0;
      const pl = { x: 0, y: 0, bodyH: 30 }, ctx = new LienzoFalso();
      const log = [];
      const paso = (ms = 16, n = 1) => { for (let i = 0; i < n; i++) { R.t += ms; juego.st.time += ms / 1000; ctx.ops.length = 0; G.Transicion.dibujar(ctx, 1440, 900, pl); log.push(G.Transicion.fase); } };
      return { G, R, juego, pl, ctx, log, paso, apertura: () => G.Transicion.apertura(R.t / 1000) };
    };
    const S = caso();
    S.paso(16); const alEmpezar = { fase: S.G.Transicion.fase, a: S.apertura() };
    S.paso(16, 20); const abierto = S.G.Transicion.fase;
    S.juego.st.time += 240; S.paso(16, 30); const bioma = S.log.slice(-30).every(f => f === null);   // pasa un cambio de bioma (sólo el reloj)
    S.G.Game.state = 'paused'; S.paso(16, 30); S.G.Game.state = 'playing'; S.paso(16, 10); const pausa = S.log.slice(-40).every(f => f === null);
    S.juego.inArena = true; S.juego.arena = { phase: 'fight', endT: 0 }; S.paso(16);
    const entrada = { fase: S.G.Transicion.fase, a: S.apertura(), negro: S.ctx.ops.some(o => o.op === 'fill' && o.x <= 0 && o.y <= 0 && o.x2 >= 1440 && o.y2 >= 900) };
    S.paso(16, 25); const abiertaArena = S.G.Transicion.fase;
    S.juego.arena = { phase: 'won', endT: 5 };
    let cierre = null;
    for (let i = 0; i < 400 && S.juego.inArena; i++) {
      S.juego.arena.endT -= 0.016; S.paso(16);
      if (cierre === null && S.G.Transicion.fase === 'cerrando') cierre = +S.juego.arena.endT.toFixed(3);
      if (S.juego.arena.endT <= 0) S.juego.inArena = false;
    }
    S.paso(16);   // el fotograma de la vuelta
    // Negro desde que se cerró hasta que empieza a abrirse (el fotograma de la vuelta, aún negro).
    const iniNegro = S.log.indexOf('negro'), finNegro = S.log.indexOf('abriendo', iniNegro);
    const vuelta = { cierre, negroMs: (finNegro - iniNegro) * 16, fase: S.G.Transicion.fase, a: S.apertura() };
    // El invitado: vuelve ('af') antes de cerrarse: negro al instante y se abre.
    const I = caso(); I.paso(16, 30); I.juego.inArena = true; I.juego.arena = { phase: 'fight', endT: 0 }; I.paso(16, 30); I.juego.arena = { phase: 'won', endT: 2 }; I.paso(16);
    I.juego.inArena = false; I.paso(16); const invitado = { fase: I.G.Transicion.fase, a: I.apertura() };
    const C = caso({ dex: false }); C.paso(16, 5); C.juego.inArena = true; C.paso(16, 5); const clasico = C.log.every(f => f === null) && !C.ctx.ops.length;
    const M = caso({ calma: true }); M.paso(16); M.paso(16, 10); const fundido = M.G.Transicion.fase;   // 150 ms: ya abierto a los 176
    t('iris (sólo Dex): salta al empezar (negro y se abre en 280 ms), al entrar en la arena (el fotograma del tirón, negro) y al salir (se cierra con endT ≤ 0,3 s, 80 ms o más de negro y se abre); no en el cambio de bioma ni al volver de la pausa; el invitado que vuelve antes de cerrarse, negro al instante; con Clásico, nada; con «Menos sacudidas», fundidos de 150 ms',
      alEmpezar.fase === 'abriendo' && alEmpezar.a < 0.1 && abierto === null && bioma && pausa && entrada.fase === 'abriendo' && entrada.a < 0.1 && entrada.negro &&
      abiertaArena === null && vuelta.cierre <= 0.3 && vuelta.cierre > 0.26 && vuelta.negroMs >= 80 && vuelta.fase === 'abriendo' && vuelta.a < 0.1 &&
      invitado.fase === 'abriendo' && invitado.a < 0.1 && clasico && fundido === null,
      { alEmpezar, abierto, bioma, pausa, entrada, abiertaArena, vuelta, invitado, clasico, fundido });
  } catch (e) { t('iris', false, String(e && e.stack || e)); }

  // ---- D. Golpe final: 140 ms quieto sólo en solitario con jefe o legendario ----
  try {
    const caso = ({ coop = false, host = false, remota = false, jefe = true, legend = false, caido = false, calma = false, reducido = false } = {}) => {
      const c = nuevo({ ajustes: calma ? { calm: true } : {}, ficheros: ['js/ui/golpe-final.js'] }), G = c.G, R = c.__reloj;
      if (reducido) c.matchMedia = q => ({ matches: /reduced-motion/.test(q) });
      G.Coop = { active: coop, isHost: host };
      G.Game = { player: { x: 0, y: 0, dead: caido } };
      const e = { x: 30, y: 40, boss: jefe, legend, remote: remota, flash: 0 };
      const hay = G.GolpeFinal.derrotado(e);
      let quieto = 0, blanco = 0;
      const t0 = R.t;
      if (e.flash > 0) blanco++;   // el fotograma en que cae
      while (R.t - t0 < 400) { const q = G.GolpeFinal.congelar(); if (q) quieto = R.t + 8 - t0; if (e.flash > 0) blanco++; R.t += 8; }
      // La sacudida, tras la congelación: la cámara de verdad (follow).
      G.Camera.resize(1440, 900, 1);
      const sx = [];
      for (let i = 0; i < 30; i++) { G.Camera.follow(0, 0, 1 / 60); sx.push([G.Camera._sx, G.Camera._sy]); }
      return { hay, quieto, blanco, sx };
    };
    const solo = caso(), leg = caso({ jefe: false, legend: true }), normal = caso({ jefe: false }), host = caso({ coop: true, host: true }), inv = caso({ coop: true, remota: true }),
      remota = caso({ remota: true }), caido = caso({ caido: true }), calma = caso({ calma: true }), red = caso({ reducido: true });
    const amp = v => Math.max(...v.sx.map(p => Math.hypot(p[0], p[1])));
    // Dirección: de tu Pokémon (0, 0) al derrotado (30, 40), es decir (0,6; 0,8).
    const dir = solo.sx.filter(p => Math.hypot(p[0], p[1]) > 0.5).every(p => casi(p[0] * 0.8, p[1] * 0.6, 1e-6));
    t('golpe final: sólo en solitario con un jefe o el legendario, el juego quieto 140 ms (± 8, en tiempo real), el derrotado blanco 2 fotogramas y una sacudida amortiguada (hasta 4 px de mundo, de tu Pokémon hacia él); nada con un enemigo normal, en grupo (anfitrión o invitado), con una copia de la red ni con tu Pokémon caído; «Menos sacudidas», ×0,25 y sin destello; movimiento reducido, sin sacudida',
      solo.hay && Math.abs(solo.quieto - 140) <= 8 && solo.blanco === 2 && amp(solo) > 2 && amp(solo) <= 4 && dir && leg.hay && Math.abs(leg.quieto - 140) <= 8 &&
      [normal, host, inv, remota, caido].every(x => !x.hay && x.quieto === 0 && x.blanco === 0 && amp(x) < 1e-9) &&
      calma.hay && calma.blanco === 0 && amp(calma) > 0 && amp(calma) <= 1.01 && red.hay && amp(red) < 1e-9 && red.blanco === 2,
      { solo: [solo.hay, solo.quieto, solo.blanco, amp(solo), dir], leg: [leg.hay, leg.quieto], normal: normal.hay, host: host.hay, inv: inv.hay, remota: remota.hay, caido: caido.hay,
        calma: [calma.blanco, amp(calma)], red: [red.blanco, amp(red)] });
  } catch (e) { t('golpe final', false, String(e && e.stack || e)); }

  // ---- E. Rótulo de zona (HUD Dex): al empezar la partida y, en la arena, con su tipo ----
  try {
    const H = cargarHud({ w: 1440, h: 900 }), { G, juego } = H, A = G.HudDex.Avisos;
    let tt = 10;
    tt += 0.016; A.actualizar(tt, { time: 0.1 }, false);
    const inicio = !!(A.visible && A.visible.tipo === 'zona' && A.visible.texto === 'Bosque Umbrío');
    for (let i = 0; i < 400; i++) { tt += 0.016; A.actualizar(tt, { time: 0.1 + i * 0.016 }, false); }
    const pista = !!(A.visible && A.visible.tipo === 'pista');
    // En la arena: «Has entrado en la grieta…» con el tipo de la arena -> dos líneas en escritorio.
    juego.bioma = 'Grieta · Volcán Ígneo';
    G.Rift = { get rift() { return null; }, get inArena() { return true; }, get timeLeft() { return 40; }, arena: { type: 'fire' } };
    juego.banner = { text: 'Has entrado en la grieta…', t: 2.4 };
    let ctx = null;
    for (let i = 0; i < 40; i++) ctx = H.pintar();   // la pista de controles sale (0,4 s) y entra el rótulo
    const v = A.visible, B = G.HudDex.bandas(), P = B.piezas.aviso, E = G.MARCA.hud.escritorio.aviso;
    const textos = ctx.ops.filter(o => o.op === 'texto').map(o => o.texto);
    t('rótulo de zona (Dex): al empezar la partida, el bioma por la ranura de avisos («Bosque Umbrío») y después la pista de controles; al entrar en una arena, en escritorio, su nombre y «Grieta de tipo Fuego» en dos líneas',
      inicio && pista && v && v.tipo === 'zona' && v.titulo === 'Volcán Ígneo' && v.sub === 'Grieta de tipo Fuego' && P && P.h === Math.round(E.grieta.h * B.escala) &&
      textos.includes('Volcán Ígneo') && textos.includes('Grieta de tipo Fuego'), { inicio, pista, v, P, textos: textos.slice(0, 12) });
  } catch (e) { t('rótulo de zona', false, String(e && e.stack || e)); }

  const failed = r.filter(x => !x[1]);
  if (!failed.length) ok(`ajustes de juego: ${r.length} casos bien`);
  for (const [name, , detail] of failed) bad(`ajustes de juego: ${name}${detail !== undefined ? ' · ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
}

// ---------------- 17. pantalla dividida estilo Nintendo DS (lote 5) ----------------
function divididaChecks() {
  console.log('17. Pantalla dividida estilo Nintendo DS (js/ui/pantalla-dividida.js): reparto, postura, panel, HUD y toques');
  const r = [];
  const t = (name, cond, detail) => r.push([name, !!cond, detail]);
  const solapan = (a, b) => a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
  /** pantalla-dividida.js con settings.js, mods.js, marca.js, estilo.js, touch.js y camera.js reales; un documento de mentira
   *  que guarda los manejadores del lienzo del panel (para tocarlo) y su contexto (un LienzoFalso). */
  const nuevo = ({ ajustes = {}, w = 784, h = 724, dpr = 3, estilo = 'clasico', tactil = true } = {}) => {
    const almacen = { 'ps.settings': JSON.stringify(Object.assign({ estilo }, ajustes)) };
    const lienzos = [];
    const elemento = () => ({ style: {}, classList: { toggle() {}, contains: () => false }, setAttribute() {}, insertAdjacentElement() {}, appendChild() {},
      _m: {}, addEventListener(tipo, fn) { this._m[tipo] = fn; }, getContext() { return this._ctx || (this._ctx = new LienzoFalso()); }, setPointerCapture() {} });
    const c = {
      console, innerWidth: w, innerHeight: h, devicePixelRatio: dpr, performance: { now: () => 1000 }, matchMedia: () => ({ matches: false }), navigator: {},
      localStorage: { getItem: k => (k in almacen ? almacen[k] : null), setItem: (k, v) => { almacen[k] = String(v); } }, location: { protocol: 'file:' },
      __eventos: [], dispatchEvent(e) { c.__eventos.push(e.type); }, Event: function (tipo) { this.type = tipo; }
    };
    c.document = { documentElement: { classList: { toggle() {}, contains: () => false }, style: { setProperty() {} } }, body: null,
      getElementById: id => (id === 'game' ? (c.__juego = c.__juego || elemento()) : null), querySelector: () => null,
      createElement: () => { const e = elemento(); lienzos.push(e); return e; }, addEventListener() {}, fonts: null };
    c.window = c; c.G = {}; c.__lienzos = lienzos;
    vm.createContext(c);
    for (const f of ['js/core/util.js', 'js/core/mods.js', 'js/ui/marca.js', 'js/core/settings.js', 'js/ui/estilo.js', 'js/core/camera.js']) vm.runInContext(rd(f), c, { filename: f });
    vm.runInContext(rd('js/core/touch.js'), c, { filename: 'js/core/touch.js' });
    vm.runInContext(rd('js/ui/pantalla-dividida.js'), c, { filename: 'js/ui/pantalla-dividida.js' });
    const G = c.G;
    G.Estilo.zonasSeguras = () => ({ sup: 0, der: 0, inf: 0, izq: 0 });
    Object.defineProperty(G.Touch, 'active', { get: () => tactil, configurable: true });
    const mov = id => [{ id, type: 'fire', name: id, lvl: 1, t: 0, cd: 1, kind: 'shot', def: { maxLvl: 5 } }];
    const pl = { x: 0, y: 0, slots: [mov('a'), mov('b'), mov('c'), mov('d')], active: 0, setActive(i) { this.active = i; }, level: 7, hp: 50, maxHp: 80, xp: 3, xpNext: 10, mon: { name: 'Pikachu' }, bonds: 1, item: null, dead: false };
    G.Game = { state: 'playing', player: pl, pausas: 0, togglePause() { this.pausas++; } };
    G.Icons = { draw() {} };
    return { c, G, pl, panel: () => lienzos.find(e => e._m.pointerdown) };
  };

  // ---- A. El reparto (puro): modos, bisagra (Viewport Segments), máscara, mitad exacta y postura ----
  try {
    const { G } = nuevo(), D = G.Dividida;
    const seg = (x, y, w, h) => ({ x, y, w, h });
    const mesa = [seg(0, 0, 784, 362), seg(0, 362, 784, 362)], mascara = [seg(0, 0, 784, 352), seg(0, 372, 784, 352)], libro = [seg(0, 0, 362, 784), seg(362, 0, 362, 784)];
    const c = {
      no: D.reparto(784, 724, 'no', 'derecha', {}),
      abajo: D.reparto(784, 724, 'abajo', 'derecha', {}),
      abajoMesa: D.reparto(784, 724, 'abajo', 'derecha', { postura: 'folded', segmentos: mesa }),
      abajoMascara: D.reparto(784, 724, 'abajo', 'derecha', { postura: 'folded', segmentos: mascara }),
      abajoLibro: D.reparto(724, 784, 'abajo', 'derecha', { postura: 'folded', segmentos: libro }),
      abajoSupuesto: D.reparto(724, 784, 'abajo', 'derecha', { pliegue: { eje: 'x', pos: 362, ancho: 24 } }),
      ladoDer: D.reparto(1440, 900, 'lado', 'derecha', {}), ladoIzq: D.reparto(1440, 900, 'lado', 'izquierda', {}),
      ladoLibro: D.reparto(724, 784, 'lado', 'izquierda', { postura: 'folded', segmentos: libro }),
      ladoMesa: D.reparto(784, 724, 'lado', 'derecha', { postura: 'folded', segmentos: mesa }),
      autoPlano: D.reparto(784, 724, 'auto', 'derecha', { postura: 'continuous', segmentos: [seg(0, 0, 784, 724)] }),
      autoSinApi: D.reparto(784, 724, 'auto', 'derecha', { postura: null, segmentos: null }),
      autoMesa: D.reparto(784, 724, 'auto', 'derecha', { postura: 'folded', segmentos: mesa }),
      autoLibro: D.reparto(724, 784, 'auto', 'derecha', { postura: 'folded', segmentos: libro }),
      d2625: D.reparto(723, 701, 'abajo', 'derecha', { dpr: 2.625 })
    };
    const R = (o, x, y, w, h) => o && o.x === x && o.y === y && o.w === w && o.h === h;
    t('reparto: desactivada, nada; «abajo» a 784x724, juego 784x362 arriba y mandos abajo (la mitad exacta); con la bisagra de Viewport Segments, justo en ella (y con una máscara de 20 px, fuera de las dos mitades); «a un lado», mitad y mitad (mandos a la derecha o a la izquierda); con la bisagra vertical (libro), en ella; una bisagra que cruza las dos mitades se pasa al panel para que la esquive (también la supuesta sin postura); la automática, sólo plegado en modo mesa (ni plano, ni sin la API, ni en libro); con dpr 2,625, la división en px físicos enteros',
      c.no === null && R(c.abajo.juego, 0, 0, 784, 362) && R(c.abajo.controles, 0, 362, 784, 362) && c.abajo.costura === 'sup' && c.abajo.fuente === 'mitad' &&
      R(c.abajoMesa.juego, 0, 0, 784, 362) && R(c.abajoMesa.controles, 0, 362, 784, 362) && c.abajoMesa.fuente === 'bisagra' && c.abajoMesa.bisagra === null &&
      R(c.abajoMascara.juego, 0, 0, 784, 352) && R(c.abajoMascara.controles, 0, 372, 784, 352) && R(c.abajoMascara.bisagra, 0, 352, 784, 20) &&
      R(c.abajoLibro.juego, 0, 0, 724, 392) && c.abajoLibro.pliegue && c.abajoLibro.pliegue.eje === 'x' && c.abajoLibro.pliegue.pos === 362 &&
      c.abajoSupuesto.pliegue && c.abajoSupuesto.pliegue.pos === 362 &&
      R(c.ladoDer.juego, 0, 0, 720, 900) && R(c.ladoDer.controles, 720, 0, 720, 900) && c.ladoDer.costura === 'izq' && R(c.ladoIzq.juego, 720, 0, 720, 900) && R(c.ladoIzq.controles, 0, 0, 720, 900) && c.ladoIzq.costura === 'der' &&
      R(c.ladoLibro.juego, 362, 0, 362, 784) && R(c.ladoLibro.controles, 0, 0, 362, 784) && c.ladoLibro.fuente === 'bisagra' &&
      c.ladoMesa.pliegue && c.ladoMesa.pliegue.eje === 'y' && c.ladoMesa.pliegue.pos === 362 &&
      c.autoPlano === null && c.autoSinApi === null && R(c.autoMesa.juego, 0, 0, 784, 362) && c.autoMesa.fuente === 'bisagra' && c.autoLibro === null &&
      Number.isInteger(c.d2625.juego.h * 2.625) && Math.abs(c.d2625.juego.h - 350.5) <= 4, c);
  } catch (e) { t('reparto', false, String(e && e.stack || e)); }

  // ---- B. El panel: todo dentro, sin solapes, ≥ 44 px de toque y nada junto a la división ni sobre el pliegue ----
  try {
    const { G } = nuevo(), D = G.Dividida, mg = G.MODS.divididaMargenBisagra;
    const casos = [
      { n: 'mesa 784x362', w: 784, h: 362, op: { costura: 'sup' } },
      { n: 'vertical 724x392 con el pliegue en 362', w: 724, h: 392, op: { costura: 'sup', pliegue: { eje: 'x', pos: 362, ancho: 24 } } },
      { n: 'a la derecha 392x724 con el pliegue en 362', w: 392, h: 724, op: { costura: 'izq', pliegue: { eje: 'y', pos: 362, ancho: 0 } } },
      { n: 'libro 362x784', w: 362, h: 784, op: { costura: 'der' } },
      { n: 'escritorio 1440x450', w: 1440, h: 450, op: { costura: 'sup' } },
      { n: 'escritorio 720x900', w: 720, h: 900, op: { costura: 'izq' } },
      { n: 'móvil 844x195 con muesca', w: 844, h: 195, op: { costura: 'sup', seguras: { izq: 47, der: 47, inf: 21 } } },
      { n: 'exterior 807x180', w: 807, h: 180, op: { costura: 'sup' } }
    ];
    const mal = [];
    for (const k of casos) {
      const L = D.maquetarPanel(k.w, k.h, Object.assign({ n: 4 }, k.op)), S = L.stick;
      const base = { x: S.cx - S.r, y: S.cy - S.r, w: 2 * S.r, h: 2 * S.r };
      const piezas = [['info', L.info], ['objeto', L.objeto], ['pausa', L.pausa], ...L.ranuras.map((x, i) => ['ataque' + (i + 1), x]), ['joystick', base]];
      const sg = Object.assign({ sup: 0, der: 0, inf: 0, izq: 0 }, k.op.seguras || {});
      const lim = { x0: Math.max(sg.izq, k.op.costura === 'izq' ? mg : 0), y0: Math.max(sg.sup, k.op.costura === 'sup' ? mg : 0),
        x1: k.w - Math.max(sg.der, k.op.costura === 'der' ? mg : 0), y1: k.h - sg.inf };
      for (const [n, p] of piezas) {
        if (p.x < lim.x0 - 0.5 || p.y < lim.y0 - 0.5 || p.x + p.w > lim.x1 + 0.5 || p.y + p.h > lim.y1 + 0.5) mal.push(`${k.n}: ${n} fuera (${JSON.stringify(p)})`);
        const pg = k.op.pliegue;
        if (pg) { const a = pg.pos - pg.ancho / 2 - mg + 0.5, b = pg.pos + pg.ancho / 2 + mg - 0.5; if (pg.eje === 'x' ? p.x < b && p.x + p.w > a : p.y < b && p.y + p.h > a) mal.push(`${k.n}: ${n} sobre el pliegue`); }
      }
      for (let i = 0; i < piezas.length; i++) for (let j = i + 1; j < piezas.length; j++) if (solapan(piezas[i][1], piezas[j][1])) mal.push(`${k.n}: ${piezas[i][0]} y ${piezas[j][0]} se pisan`);
      if (L.lado < 44 || L.pausa.w < 44 || S.r < 44) mal.push(`${k.n}: toque pequeño (ataques ${L.lado}, pausa ${L.pausa.w}, joystick ${S.r})`);
    }
    t(`panel de mandos en ${casos.length} tamaños (el Magic V6 en mesa, en vertical con el pliegue cruzando, a un lado, en libro; escritorio; móvil con muesca; la exterior): todo dentro, sin solapes, ataques, pausa y joystick de 44 px o más, nada a menos de ${mg} px de la división y nada sobre el pliegue que lo cruza`,
      !mal.length, mal.slice(0, 8));
  } catch (e) { t('panel', false, String(e && e.stack || e)); }

  // ---- C. En partida: el lienzo del juego en su rectángulo, el HUD Dex (también con Clásico), los toques y el teclado ----
  try {
    const { c, G, pl, panel } = nuevo({ ajustes: { dividida: 'abajo' }, w: 784, h: 724 });
    const D = G.Dividida;
    const antes = { hudDex: G.Estilo.hudDex(), rect: D.rectJuego() };
    D.recolocar();
    const activo = D.activa(), hudDexDentro = G.Estilo.hudDex(), juegoCv = c.__juego && Object.assign({}, c.__juego.style);
    const P = panel(), K = activo && activo.controles;
    const ev = (x, y, id = 1) => ({ clientX: x, clientY: y, pointerId: id, preventDefault() {} });
    const B = D.botonesPantalla(), b2 = B.find(b => b.que === 'ataque2'), bp = B.find(b => b.que === 'pausa');
    P._m.pointerdown(ev(b2.x + b2.w / 2, b2.y + b2.h / 2, 2));
    P._m.pointerdown(ev(bp.x + 5, bp.y + 5, 3));
    // El joystick: en su círculo (fijo) y arrastrando a la derecha.
    const S = D.panel.stick, cx = S.cx + K.x, cy = S.cy + K.y;
    const sinDedo = G.Touch.vector();
    P._m.pointerdown(ev(cx, cy, 4)); P._m.pointermove(ev(cx + S.r, cy, 4));
    const v = G.Touch.vector();
    P._m.pointerup(ev(cx + S.r, cy, 4));
    const suelto = G.Touch.vector();
    // Donde tocas (fuera del círculo, dentro de su zona): aparece ahí.
    const Z = S.zona, zx = K.x + Z.x + 4, zy = K.y + Z.y + Z.h - 4;   // una esquina de su zona, lejos del círculo
    P._m.pointerdown(ev(zx, zy, 5)); const libre = D.stick; P._m.pointerup(ev(zx, zy, 5));
    const cambiado = {};
    // En plena partida: a un lado (derecha), sin reiniciar; fuera de partida, la pantalla entera.
    G.Settings.set('dividida', 'lado'); D.recolocar(); cambiado.lado = D.rectJuego();
    G.Game.state = 'ui'; D.recolocar(); cambiado.menu = D.rectJuego(); cambiado.hudDex = G.Estilo.hudDex();
    t('en partida: con «abajo», el lienzo del juego mide 784x362 (G.Encuadre.resolucion lo coloca), el HUD es el Dex también con Clásico, tocar el ataque 2 lo elige, la pausa pausa, el joystick del panel manda en G.Touch.vector() (a la derecha, a toda velocidad; suelto, nada) y aparece donde tocas dentro de su zona; cambiarlo en plena partida recoloca sin reiniciar; en el menú, la pantalla entera y el HUD de su estilo',
      antes.rect === null && !antes.hudDex && activo && activo.juego.w === 784 && activo.juego.h === 362 && hudDexDentro && juegoCv.pointerEvents === 'none' &&
      pl.active === 1 && G.Game.pausas === 1 && sinDedo === null && v && v[0] > 0.99 && Math.abs(v[1]) < 0.01 && suelto === null && libre && !libre.fijo &&
      cambiado.lado && cambiado.lado.w === 392 && cambiado.lado.h === 724 && cambiado.menu === null && cambiado.hudDex === false && c.__eventos.includes('resize'),
      { antes, activo, hudDexDentro, juegoCv, activa: pl.active, pausas: G.Game.pausas, sinDedo, v, suelto, libre, cambiado, eventos: c.__eventos.length });
  } catch (e) { t('en partida', false, String(e && e.stack || e)); }

  // ---- D. El HUD Dex en el rectángulo de juego: sin ranuras, objeto, pausa ni ficha (van en el panel) y lejos de la división ----
  try {
    const res = [];
    for (const [w, h, inf] of [[784, 362, 16], [724, 392, 16], [392, 724, 0]]) {
      const H = cargarHud({ w, h, tactil: true });
      escenaCompleta(H);
      const seguras = { sup: 0, izq: 0, der: inf ? 0 : 16, inf };
      H.G.HudDex.ponerMarco((ww, hh) => ({ juego: { x: 0, y: 0, w: ww, h: hh }, controles: { x: 0, y: hh + 8, w: 8, h: 8, lado: 'abajo', aparte: true }, seguras }));
      H.pintar(); const ctx = H.pintar();
      const B = H.G.HudDex.bandas(), P = B.piezas;
      const fuera = Object.entries(P).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x, i) => [k + i, x]) : [[k, v]])).filter(([, v]) => v && v.w && v.h)
        .filter(([, v]) => v.y + v.h > h - inf + 0.5 || v.x + v.w > w - seguras.der + 0.5).map(([k]) => k);
      const pintado = ctx.ops.filter(o => o.op !== 'texto' || true).filter(o => o.y2 > h - inf + 0.5 && o.alfa > 0).length;
      res.push({ vp: `${w}x${h}`, ficha: !!P.ficha, ranuras: P.ranuras.length, objeto: !!P.objeto, pausa: !!P.pausa, botones: H.botones.length, fuera, pintado, variante: B.variante });
    }
    t('HUD Dex con el panel aparte (ponerMarco con controles.aparte): en el rectángulo de juego no van la ficha, las ranuras, el objeto ni la pausa (ningún toque registrado: van en el panel) y nada se pinta a menos de 16 px de la división (784x362 y 724x392 con el panel debajo, 392x724 con el panel a la derecha)',
      res.every(x => !x.ficha && !x.ranuras && !x.objeto && !x.pausa && !x.botones && !x.fuera.length && !x.pintado), res);
  } catch (e) { t('HUD Dex con el panel aparte', false, String(e && e.stack || e)); }

  // ---- E. Local de cada jugador, el ajuste y el manifiesto ----
  try {
    const src = rd('js/ui/pantalla-dividida.js');
    const red = /G\.(Net|Coop)\.|broadcast|\bsend\(/.test(src.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ''));
    const { G } = nuevo();
    const porDefecto = G.Dividida.modo();
    const man = JSON.parse(rd('manifest.webmanifest'));
    const M = G.MODS;
    t('local: pantalla-dividida.js no habla con la red (ni G.Net ni G.Coop); por defecto desactivada (divididaPorDefecto = \'no\'); el manifiesto ya no fija la horizontal ("orientation": "any", la pantalla interior del plegable en vertical para «abajo») y «Gira el móvil» sigue sólo en una pantalla estrecha en vertical (390x844, 360x807 y la mitad de 362x784 sí; el Magic V6 abierto, 724x784 y 784x724, no)',
      !red && porDefecto === 'no' && man.orientation === 'any' && M.pedirGiro(390, 844) && M.pedirGiro(360, 807) && !M.pedirGiro(724, 784) && !M.pedirGiro(784, 724) && M.pedirGiro(362, 784),
      { red, porDefecto, orientacion: man.orientation });
  } catch (e) { t('local y manifiesto', false, String(e && e.stack || e)); }

  // ---- E2. La cámara en una franja alta (juego a un lado): el lado largo ve 768 de mundo ----
  try {
    const { c } = nuevo();
    vm.runInContext(rd('js/ui/encuadre.js'), c, { filename: 'js/ui/encuadre.js' });
    const E = c.G.Encuadre, s0 = (w, h) => Math.min(w / 768, h / 420);
    const alta = E.escalaVertical(s0(392, 724), 392, 724, true), sinDividir = E.escalaVertical(s0(724, 784), 724, 784, false), mesa = E.escalaVertical(s0(784, 362), 784, 362, true);
    const k = E.calcular(392, 724, 3);   // sin la regla: 1176 x 2172 de mundo con el píxel nítido
    t('cámara de la pantalla dividida: con el juego en una franja alta (392x724, a un lado) el lado largo ve 768 de mundo (sin la regla, 768 de ANCHO: 768x1418, y con el píxel nítido 1176x2172); en apaisado (784x362) y sin dividir (724x784), la regla de upstream',
      Math.abs(724 / alta - 768) < 1e-6 && sinDividir === s0(724, 784) && mesa === s0(784, 362) && Math.round(392 / k.escala) === 1176, { alta, sinDividir, mesa, sinRegla: 392 / k.escala });
  } catch (e) { t('cámara de la franja alta', false, String(e && e.stack || e)); }

  // ---- F. Inglés de lo nuevo de los lotes 4 y 5 (i18n.js real) ----
  try {
    const c = { console, navigator: { language: 'en-US', languages: ['en-US'] }, location: { pathname: '/' },
      localStorage: { getItem: () => null, setItem() {} }, document: { documentElement: {} }, confirm: () => true, alert() {} };
    c.CanvasRenderingContext2D = function () {};
    c.CanvasRenderingContext2D.prototype = { fillText() {}, strokeText() {}, measureText() {} };
    c.window = c; c.G = {};
    vm.createContext(c);
    for (const f of ['js/core/i18n.js', 'js/data/lang-en.js', 'js/data/lang-en-mod.js']) vm.runInContext(rd(f), c, { filename: f });
    const EN = c.G.I18n.t, { G } = nuevo(), D = G.Dividida;
    const textos = ['Píxel nítido', vm.runInContext('G.Encuadre.TEXTO', (() => { const k = nuevo().c; vm.runInContext(rd('js/ui/encuadre.js'), k); return k; })()),
      'Grieta de tipo Fuego', 'Pantalla dividida', D.TEXTO, ...D.OPCIONES.map(o => o[1]), ...D.OPCIONES_LADO.map(o => o[1]), 'Lado de los mandos'];
    for (const md of ['abajo', 'auto']) { G.Settings.set('dividida', md); textos.push(D.nota()); }
    const sin = textos.filter(s => EN(s) === s);
    t('inglés (i18n.js real) de lo nuevo: «Píxel nítido» y su explicación, «Grieta de tipo Fuego» y la sección «Pantalla dividida» (explicación, opciones, lado y notas)', !sin.length, sin);
  } catch (e) { t('inglés', false, String(e && e.stack || e)); }

  const failed = r.filter(x => !x[1]);
  if (!failed.length) ok(`pantalla dividida: ${r.length} casos bien`);
  for (const [name, , detail] of failed) bad(`pantalla dividida: ${name}${detail !== undefined ? ' · ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
}

importChecks().catch(e => bad('no se pudo probar el importador: ' + (e && e.stack || e))).then(() => {
  try { grietaChecks(); } catch (e) { bad('no se pudo probar la grieta garantizada: ' + (e && e.stack || e)); }
  try { gachaChecks(); } catch (e) { bad('no se pudo probar el gacha y los tickets: ' + (e && e.stack || e)); }
  try { claridadChecks(); } catch (e) { bad('no se pudo probar la claridad en partida: ' + (e && e.stack || e)); }
  try { arreglosChecks(); } catch (e) { bad('no se pudo probar los arreglos de upstream: ' + (e && e.stack || e)); }
  try { pantallasChecks(); } catch (e) { bad('no se pudo probar las pantallas: ' + (e && e.stack || e)); }
  try { identidadChecks(); } catch (e) { bad('no se pudo probar la identidad visual: ' + (e && e.stack || e)); }
  try { hudDexChecks(); } catch (e) { bad('no se pudo probar el HUD Dex: ' + (e && e.stack || e)); }
  try { juegoChecks(); } catch (e) { bad('no se pudo probar los ajustes de juego: ' + (e && e.stack || e)); }
  try { divididaChecks(); } catch (e) { bad('no se pudo probar la pantalla dividida: ' + (e && e.stack || e)); }
  console.log(fails ? `\nRESULTADO: ${fails} fallo(s), ${warns} aviso(s)` : `\nRESULTADO: todo bien (${warns} aviso(s))`);
  process.exit(fails ? 1 : 0);
});
