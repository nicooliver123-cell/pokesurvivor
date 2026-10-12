/* Empaqueta el juego para publicarlo: un solo JS minificado en vez de ~60.
 *   node tools/build.js
 *
 * - dev.html es la página "fuente": carga cada script por separado (para
 *   programar y depurar cómodamente). SE EDITA dev.html, no index.html.
 * - index.html se genera a partir de dev.html, cambiando el bloque de scripts
 *   por js/app.min.js (con la huella en la URL para que no se quede en caché).
 * - node tools/build.js --sin-seo  ->  sin lo de SEO.
 *
 * MOD nico (PokéSwarm): se construye con `node tools/build.js --privado` (es también lo
 * que hace sin flags): index.html sale con noindex y sin el SEO del proyecto base, que
 * aquí no hay (ni páginas SEO ni su generador). dev.html ya no tiene los bloques seo, así
 * que --con-seo sólo quitaría el noindex: se rechaza.
 */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
if (process.argv.includes('--con-seo')) {   // MOD nico
  console.error('Esta versión no se construye con --con-seo (quitaría el noindex): node tools/build.js --privado');
  process.exit(1);
}
const ROOT = path.join(__dirname, '..');
const DEV = path.join(ROOT, 'dev.html'), OUT = path.join(ROOT, 'index.html');
const BEGIN = '<!-- scripts:begin -->', END = '<!-- scripts:end -->';

const dev = fs.readFileSync(DEV, 'utf8');
const i = dev.indexOf(BEGIN), j = dev.indexOf(END);
if (i < 0 || j < 0) throw new Error('dev.html no tiene las marcas ' + BEGIN + ' / ' + END);
const block = dev.slice(i, j + END.length);
const files = [...block.matchAll(/<script[^>]*src="(js\/[^"]+\.js)"/g)].map(m => m[1]);

// Une los archivos en orden; cada uno separado por ';' por si alguno no acaba en punto y coma.
const joined = files.map(f => `/* ${f} */\n` + fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n');
const tmp = path.join(ROOT, 'tools', 'cache', 'app.js');
fs.mkdirSync(path.dirname(tmp), { recursive: true });
fs.writeFileSync(tmp, joined);
const outJs = path.join(ROOT, 'js', 'app.min.js');
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
execFileSync(npx, ['--yes', 'terser@5.51.2', tmp, '--compress', 'passes=1', '--mangle', '--comments', 'false', '--ecma', '2020', '-o', outJs],
  { stdio: 'inherit', shell: process.platform === 'win32' });
const min = fs.readFileSync(outJs);
const hash = crypto.createHash('sha1').update(min).digest('hex').slice(0, 10);

let html = dev.slice(0, i) + `<script defer src="js/app.min.js?v=${hash}"></script>` + dev.slice(j + END.length);
// MOD nico: por defecto (o con --privado) se construye "privada": sin SEO y CONSERVANDO
// el noindex de dev.html. --con-seo (el comportamiento de upstream) se rechaza arriba.
const PRIV = process.argv.includes('--privado') || !process.argv.includes('--con-seo');
if (!PRIV) html = html.replace(/<meta name="robots" content="noindex">\s*/, '');
// --sin-seo: sin canonical/redes/datos estructurados ni enlaces a las páginas.
const SIN_SEO = PRIV || process.argv.includes('--sin-seo');
html = SIN_SEO ? html.replace(/<!-- seo:begin -->[\s\S]*?<!-- seo:end -->\n?/g, '') : html.replace(/<!-- seo:(begin|end) -->\n?/g, '');
html = html.replace(/<!-- dev.html: página fuente[^>]*-->/, '<!-- GENERADO desde dev.html por tools/build.js: no editar a mano (se edita dev.html). -->');
fs.writeFileSync(OUT, html);
console.log(`${PRIV ? '[privado: noindex, sin SEO] ' : SIN_SEO ? '[sin SEO] ' : ''}ok: ${files.length} scripts · ${(joined.length / 1024).toFixed(0)} KB -> ${(min.length / 1024).toFixed(0)} KB (app.min.js?v=${hash})`);
