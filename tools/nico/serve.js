/* ============ tools/nico/serve.js — servidor estático mínimo para probar el juego ============
 *   node tools/nico/serve.js [--root <carpeta>] [--port 8090]
 * Sólo escucha en 127.0.0.1. Se usa en lugar de `python -m http.server`, que en
 * Windows rechaza conexiones cuando el navegador pide muchos sprites a la vez.
 * Abrir: http://127.0.0.1:8090/index.html  (o dev.html; con ?emu usa el emulador).
 * Con la variable PS_SITIO=<carpeta> sirve esa carpeta en lugar de la que le pidan (también en las pruebas E2E): así se
 * juega contra lo que publica Pages, montado con `node tools/nico/sitio.js <carpeta>`. Con PS_404=<fichero> apunta en
 * él cada ruta que no encuentra (una por línea).
 */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8'
};

function startServer(root, port = 8090) {
  root = path.resolve(process.env.PS_SITIO || root);
  const srv = http.createServer((req, res) => {
    let p;
    try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); return res.end(); }
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(root, p);
    if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); return res.end(); }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        const nf = path.join(root, '404.html');
        if (process.env.PS_404) try { fs.appendFileSync(process.env.PS_404, p + '\n'); } catch (e) { /* sin registro */ }
        res.writeHead(404, { 'content-type': TYPES['.html'] });
        return fs.existsSync(nf) ? fs.createReadStream(nf).pipe(res) : res.end('404');
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'content-length': st.size, 'cache-control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    });
  });
  srv.keepAliveTimeout = 1000;
  return new Promise((resolve, reject) => {
    srv.once('error', reject);
    srv.listen(port, '127.0.0.1', () => resolve(srv));
  });
}

module.exports = { startServer };

if (require.main === module) {
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
  const root = arg('--root', path.resolve(__dirname, '..', '..')), port = +arg('--port', 8090);
  startServer(root, port).then(() => console.log(`Sirviendo ${root} en http://127.0.0.1:${port}/`),
    e => { console.error('No se pudo abrir el puerto ' + port + ': ' + e.message); process.exit(1); });
}
