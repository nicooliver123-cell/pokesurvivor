/* ============ tools/nico/mapas/vista.js — los mapas en PNG, sin navegador ============
 *   node tools/nico/mapas/vista.js [--semilla 1234] [--x 0 --y 0] [--ancho 80 --alto 48] [--bioma 0|1|2|todos]
 *                                  [--arena fire|todos] [--estilo clasico|dex] [--escala 2] [--sin-props]
 *                                  [--upstream] [--salida <carpeta>] [--zoom-props] [--sin-pokemon]
 * Carga en node los scripts del mundo que lista dev.html (de js/world/, más util.js, mods.js y marca.js), con un
 * lienzo de mentira como el de check.js §16, y pinta una zona de ancho×alto casillas centrada en (x, y) (en casillas)
 * con los chunks horneados de verdad y los objetos del escenario encima (ordenados por Y, con su sombra), a resolución
 * de arte (1 px de arte = `escala` px del PNG). Sin `--upstream`, con nuestros ganchos; con él, sin las líneas «MOD nico»
 * (los mapas del proyecto base). Escribe <salida>/<nombre>.png (por defecto tools/nico/out/mapas/) y una línea de
 * cifras por imagen: cobertura de pared, líquido y suelo, objetos por tipo y ms por chunk (orientativo: node, no navegador).
 * Encima, una fila de 16 Pokémon de colores variados (Idle mirando abajo) para juzgar el contraste (--sin-pokemon la quita).
 * --zoom-props saca además dos láminas a ×4, rotuladas: cada objeto de cada bioma con todas sus variantes (las que pinta
 * drawProp: roca rota, hierba movida, los 4 poderes del altar sin usar y usados, manantial agotado y las 3 trampas) y los
 * objetos de las 18 arenas (árbol, roca y hierba, que son los únicos que salen en ellas), una fila por arena.
 */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const rd = f => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] !== undefined && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const flag = k => args.includes(k);

const SEMILLA = +arg('--semilla', 1234), CX = +arg('--x', 0), CY = +arg('--y', 0);
const ANCHO = +arg('--ancho', 80), ALTO = +arg('--alto', 48), ESCALA = +arg('--escala', 2);
const ESTILO = arg('--estilo', 'clasico'), UPSTREAM = flag('--upstream'), SIN_PROPS = flag('--sin-props'), SIN_POKEMON = flag('--sin-pokemon');
const SALIDA = path.resolve(arg('--salida', path.join(RAIZ, 'tools', 'nico', 'out', 'mapas')));

// ---------------- PNG ----------------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function trozo(tipo, datos) {
  const len = Buffer.alloc(4); len.writeUInt32BE(datos.length);
  const td = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
/** RGBA (Uint8Array w·h·4) → PNG, ampliado ×k sin suavizado. */
function png(rgba, w, h, k = 1) {
  const W = w * k, H = h * k, filas = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    const o = y * (W * 4 + 1), sy = Math.floor(y / k);
    for (let x = 0; x < W; x++) {
      const s = (sy * w + Math.floor(x / k)) * 4, d = o + 1 + x * 4;
      filas[d] = rgba[s]; filas[d + 1] = rgba[s + 1]; filas[d + 2] = rgba[s + 2]; filas[d + 3] = rgba[s + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), trozo('IHDR', ihdr),
    trozo('IDAT', zlib.deflateSync(filas, { level: 6 })), trozo('IEND', Buffer.alloc(0))]);
}
/** PNG de 8 bits sin entrelazar (paleta, RGB o RGBA, como las hojas de SpriteCollab) → { width, height, data RGBA }. */
function leerPng(buf) {
  let p = 8, w = 0, h = 0, tipo = 0, pal = null, trns = null;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), t = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); tipo = d[9]; if (d[8] !== 8 || d[12]) throw new Error('PNG no soportado'); }
    else if (t === 'PLTE') pal = d; else if (t === 'tRNS') trns = d; else if (t === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  const bpp = { 3: 1, 2: 3, 6: 4, 0: 1, 4: 2 }[tipo], raw = zlib.inflateSync(Buffer.concat(idat)), fila = w * bpp;
  const px = Buffer.alloc(fila * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (fila + 1)], s = y * (fila + 1) + 1, o = y * fila;
    for (let x = 0; x < fila; x++) {
      const a = x >= bpp ? px[o + x - bpp] : 0, b = y ? px[o - fila + x] : 0, c = x >= bpp && y ? px[o - fila + x - bpp] : 0;
      let v = raw[s + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[o + x] = v & 255;
    }
  }
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    if (tipo === 3) { const k = px[i]; data.set([pal[k * 3], pal[k * 3 + 1], pal[k * 3 + 2], trns && k < trns.length ? trns[k] : 255], i * 4); }
    else if (tipo === 2) data.set([px[i * 3], px[i * 3 + 1], px[i * 3 + 2], 255], i * 4);
    else if (tipo === 6) data.set(px.subarray(i * 4, i * 4 + 4), i * 4);
    else if (tipo === 0) data.set([px[i], px[i], px[i], 255], i * 4);
    else data.set([px[i * 2], px[i * 2], px[i * 2], px[i * 2 + 1]], i * 4);
  }
  return { width: w, height: h, data };
}
/** Primer fotograma de Idle mirando abajo de un Pokémon, con su ancla (pies). */
function spriteIdle(G, dex) {
  const m = G.SPRITE_META && G.SPRITE_META[dex] && G.SPRITE_META[dex].a.Idle;
  const f = path.join(RAIZ, 'assets', 'pokemon', String(dex), 'Idle.png');
  if (!m || !fs.existsSync(f)) return null;
  const hoja = leerPng(fs.readFileSync(f)), data = new Uint8ClampedArray(m.w * m.h * 4);
  for (let y = 0; y < m.h; y++) data.set(hoja.data.subarray(y * hoja.width * 4, (y * hoja.width + m.w) * 4), y * m.w * 4);
  return { width: m.w, height: m.h, data, ax: m.ax, ay: m.ay };
}
// Muestra de colores para juzgar el contraste: Pikachu, Charmander, Squirtle, Bulbasaur, Gengar, Snorlax, Eevee,
// Jigglypuff, Gastly, Lapras, Magikarp, Onix, Vulpix, Oddish, Machop, Geodude.
const MUESTRA = [25, 4, 7, 1, 94, 143, 133, 39, 92, 131, 129, 95, 37, 43, 66, 74];

// ---------------- el mundo ----------------
const lienzoFalso = () => {
  const cv = { width: 0, height: 0, _img: null };
  cv.getContext = () => ({
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData(img) { cv._img = img; cv.width = img.width; cv.height = img.height; },
    // Lo que no es putImageData (si un pintor lo usara) no pinta nada aquí: la vista sólo enseña lo horneado en ImageData.
    drawImage() {}, fillRect() {}, clearRect() {}, getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) })
  });
  return cv;
};

/** Los scripts del mundo en el orden de dev.html: util.js, mods.js, marca.js y los de js/world/. */
function scriptsMundo() {
  const html = rd('dev.html'), out = [];
  for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) {
    const f = m[1].split('?')[0];
    // Los que aún no existen (un fichero nuevo a medio hacer) se saltan con un aviso.
    if (!fs.existsSync(path.join(RAIZ, f))) { console.warn('(vista) falta ' + f + ': se salta'); continue; }
    if (/^js\/(core\/util|core\/mods|ui\/marca)\.js$/.test(f) || /^js\/world\//.test(f)) out.push(f);
  }
  return out;
}

/** Los scripts se ejecutan con `new Function` en este mismo reino (en node:vm cada acceso a un global pasa por el
 *  contexto y un chunk tarda ~100 ms en vez de ~2: así los ms por chunk se parecen a los del navegador). */
function mundo(estilo) {
  const c = { console, performance, document: { createElement: lienzoFalso } };
  c.window = c; c.G = {};
  const runInContext = (code, ctx, o) => new Function('window', 'G', 'document', 'performance', code + '\n//# sourceURL=' + o.filename)(ctx, ctx.G, ctx.document, ctx.performance);
  const vmLocal = { runInContext };
  const G = c.G, oyentes = [];
  const DEL_BASE = ['js/world/tiles.js', 'js/world/world.js'];
  const src = f => (UPSTREAM && DEL_BASE.includes(f) ? rd(f).split(/\r?\n/).filter(l => !/MOD nico/.test(l)).join('\n') : rd(f));
  for (const f of scriptsMundo()) {
    if (/^js\/world\//.test(f)) {
      if (f === 'js/world/tiles.js') {   // lo que tiles.js y los siguientes esperan encontrar ya puesto
        G.Estilo = { actual: estilo, get dex() { return this.actual === 'dex'; }, on(fn) { oyentes.push(fn); }, set(v) { this.actual = v; oyentes.forEach(fn => fn(v)); } };
        G.Settings = { fx: 2, get: () => false };
        G.Sprites = { PX: 2 };
        G.Game = { state: 'playing', st: { time: 10 }, player: { x: 0, y: 0 } };
        G.Rift = { inArena: false, rift: null };
      }
      if (UPSTREAM && !DEL_BASE.includes(f)) continue;
    }
    vmLocal.runInContext(src(f), c, { filename: f });
  }
  return { G, c };
}

// ---------------- pintar una zona ----------------
const rgbaDe = cv => (cv && cv._img ? cv._img : null);

function blit(dst, W, H, img, x0, y0, alfa = 1) {
  const s = img.data;
  for (let y = 0; y < img.height; y++) {
    const dy = y0 + y; if (dy < 0 || dy >= H) continue;
    for (let x = 0; x < img.width; x++) {
      const dx = x0 + x; if (dx < 0 || dx >= W) continue;
      const si = (y * img.width + x) * 4, a = s[si + 3] / 255 * alfa;
      if (a <= 0) continue;
      const di = (dy * W + dx) * 4;
      dst[di] = s[si] * a + dst[di] * (1 - a); dst[di + 1] = s[si + 1] * a + dst[di + 1] * (1 - a);
      dst[di + 2] = s[si + 2] * a + dst[di + 2] * (1 - a); dst[di + 3] = 255;
    }
  }
}
function sombra(dst, W, H, cx, cy, rx, ry) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1) continue;
    const di = (y * W + x) * 4;
    for (let k = 0; k < 3; k++) dst[di + k] *= 0.7;
  }
}

function zona(M, nombre, { bioma = 0, arena = null } = {}) {
  const { G } = M, T = G.Tiles.T, N = 16, PX = 2, TS = T * PX;
  G.World.reset(SEMILLA);
  let cx0 = CX, cy0 = CY;
  if (arena) {
    const a = { tx: 6000, ty: 6000, r: 11, type: arena };
    G.World.setArena(a);
    G.World.setBiome(G.Tiles.arenaBiome(arena), true);
    cx0 = a.tx; cy0 = a.ty;
  } else G.World.setBiome(bioma, true);
  const tx0 = Math.round(cx0 - ANCHO / 2), ty0 = Math.round(cy0 - ALTO / 2);
  const W = ANCHO * T, H = ALTO * T, dst = new Uint8Array(W * H * 4);
  // Suelo: los chunks horneados de verdad (chunkImage), recortados a la zona.
  const c0x = Math.floor(tx0 / N), c1x = Math.floor((tx0 + ANCHO - 1) / N);
  const c0y = Math.floor(ty0 / N), c1y = Math.floor((ty0 + ALTO - 1) / N);
  let msTotal = 0, nChunks = 0;
  // Sin --upstream, chunkImage es pública (gancho «MOD nico»); con él, se saca la imagen de drawGround con un contexto de mentira.
  const imagenChunk = G.World.chunkImage ? (cx, cy) => G.World.chunkImage(cx, cy) : (cx, cy) => {
    let img = null;
    const cam = { w: 8, h: 8, scale: 1, left: () => cx * N * TS + 8, top: () => cy * N * TS + 8, sees: () => true };
    G.World.drawGround({ set imageSmoothingEnabled(v) {}, drawImage(i) { img = img || i; } }, cam);
    return img;
  };
  for (let cy = c0y; cy <= c1y; cy++) for (let cx = c0x; cx <= c1x; cx++) {
    const t0 = process.hrtime.bigint();
    const img = rgbaDe(imagenChunk(cx, cy));
    msTotal += Number(process.hrtime.bigint() - t0) / 1e6; nChunks++;
    if (!img) continue;
    blit(dst, W, H, img, (cx * N - tx0) * T, (cy * N - ty0) * T);
  }
  // Cobertura y objetos (por casilla, con kindAt y propsInCircle del mundo real).
  const cuenta = { floor: 0, wall: 0, liquid: 0 }, props = {}, lista = [];
  for (let ty = ty0; ty < ty0 + ALTO; ty++) for (let tx = tx0; tx < tx0 + ANCHO; tx++) {
    const k = G.World.kindAt(tx * TS + TS / 2, ty * TS + TS / 2);
    cuenta[k] = (cuenta[k] || 0) + 1;
  }
  const vistos = new Set();
  const camZona = { x: (tx0 + ANCHO / 2) * TS, y: (ty0 + ALTO / 2) * TS, w: ANCHO * TS, h: ALTO * TS, scale: 1,
    left() { return this.x - this.w / 2; }, top() { return this.y - this.h / 2; },
    sees(px, py, pad = 60) { return px > this.left() - pad && px < this.left() + this.w + pad && py > this.top() - pad && py < this.top() + this.h + pad; } };
  for (const p of G.World.visibleProps(camZona)) {
    if (vistos.has(p.id) || p.tx < tx0 || p.tx >= tx0 + ANCHO || p.ty < ty0 || p.ty >= ty0 + ALTO) continue;
    vistos.add(p.id); lista.push(p); props[p.type] = (props[p.type] || 0) + 1;
  }
  if (!SIN_PROPS) {
    lista.sort((a, b) => (a.flat ? -1e9 : a.y) - (b.flat ? -1e9 : b.y));
    for (const p of lista) {
      const variant = p.type === 'altar' ? p.kind * 2 : p.type === 'trap' ? p.kind : 0;
      const img = rgbaDe(G.Tiles.propSprite(G.World.biome, p.type, variant));
      if (!img) continue;
      const ax = p.x / PX - tx0 * T, ay = p.y / PX - ty0 * T;
      if (p.flat) { blit(dst, W, H, img, Math.round(ax - img.width / 2), Math.round(ay - 4 - img.height / 2)); continue; }
      if (p.type !== 'grass') sombra(dst, W, H, ax, ay, p.r * 1.1 / PX, p.r * 0.38 / PX);
      blit(dst, W, H, img, Math.round(ax - img.width / 2), Math.round(ay - img.height + (p.type === 'grass' ? 2 : 1)));
    }
  }
  if (!SIN_POKEMON) {
    // Una fila de Pokémon de muestra en el centro de la zona, en casillas libres (como los pinta Animator: pies en el ancla).
    if (!G.SPRITE_META) new Function('G', rd('js/data/sprites-meta.js'))(G);
    let i = 0;
    const yFila = (ty0 + ALTO / 2) * TS;
    for (let tx = tx0 + 3; tx < tx0 + ANCHO - 3 && i < MUESTRA.length; tx += 3) {
      for (const dy of [0, 2, -2, 4, -4, 6, -6]) {
        const x = tx * TS + TS / 2, y = yFila + dy * TS;
        if (!G.World.isFree(x, y, 14)) continue;
        const s = spriteIdle(G, MUESTRA[i++]);
        if (!s) break;
        const ax = x / PX - tx0 * T, ay = y / PX - ty0 * T;
        sombra(dst, W, H, ax, ay, 6, 2.5);
        blit(dst, W, H, s, Math.round(ax - s.ax), Math.round(ay - s.ay));
        break;
      }
    }
  }
  fs.mkdirSync(SALIDA, { recursive: true });
  fs.writeFileSync(path.join(SALIDA, nombre + '.png'), png(dst, W, H, ESCALA));
  const tot = ANCHO * ALTO, pc = v => (100 * (v || 0) / tot).toFixed(1) + ' %';
  console.log(`${nombre}: «${G.World.biomeName()}» pared ${pc(cuenta.wall)} · líquido ${pc(cuenta.liquid)} · suelo ${pc(cuenta.floor)} · ` +
    `objetos ${JSON.stringify(props)} · ${(msTotal / Math.max(1, nChunks)).toFixed(1)} ms/chunk en node (${nChunks} chunks)`);
}

// ---------------- láminas de objetos ----------------
/** Letra de 3x5 píxeles (mayúsculas, cifras, guion y espacio) para rotular las láminas: cada fila, 3 bits. */
const LETRA = {
  A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6], E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4],
  G: [3, 4, 5, 5, 3], H: [5, 5, 7, 5, 5], I: [7, 2, 2, 2, 7], J: [1, 1, 1, 5, 2], K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7],
  M: [5, 7, 7, 5, 5], N: [6, 5, 5, 5, 5], O: [2, 5, 5, 5, 2], P: [6, 5, 6, 4, 4], Q: [2, 5, 5, 6, 3], R: [6, 5, 6, 5, 5],
  S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2], U: [5, 5, 5, 5, 7], V: [5, 5, 5, 5, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5],
  Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7], 0: [7, 5, 5, 5, 7], 1: [2, 6, 2, 2, 7], 2: [6, 1, 2, 4, 7], 3: [6, 1, 2, 1, 6],
  4: [5, 5, 7, 1, 1], 5: [7, 4, 6, 1, 6], 6: [3, 4, 6, 5, 2], 7: [7, 1, 2, 2, 2], 8: [2, 5, 2, 5, 2], 9: [2, 5, 3, 1, 6],
  '-': [0, 0, 7, 0, 0], ' ': [0, 0, 0, 0, 0]
};
const rotulo = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9 -]/g, '');
/** Escribe `s` (ya en mayúsculas) con la letra de 3x5 desde (x, y), cada letra a 4 px de la anterior. */
function texto(dst, W, H, s, x, y, rgb) {
  for (const [i, ch] of [...s].entries()) {
    const g = LETRA[ch] || LETRA[' '];
    for (let j = 0; j < 5; j++) for (let k = 0; k < 3; k++) {
      if (!(g[j] & (4 >> k))) continue;
      const px = x + i * 4 + k, py = y + j;
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      const d = (py * W + px) * 4;
      dst[d] = rgb[0]; dst[d + 1] = rgb[1]; dst[d + 2] = rgb[2]; dst[d + 3] = 255;
    }
  }
}
function rellenar(dst, W, x0, y0, w, h, rgb) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const i = (y * W + x) * 4; dst[i] = rgb[0]; dst[i + 1] = rgb[1]; dst[i + 2] = rgb[2]; dst[i + 3] = 255; }
}
const rgbHex = h => [1, 3, 5].map(i => parseInt((h || '#444444').slice(i, i + 2), 16));

/** Lámina de objetos a ×4: una fila por bioma (con su nombre a la izquierda, sobre el color de su suelo) y una columna por
 *  cada variante de cada tipo, con el tipo arriba y la variante (el número que recibe propSprite) en la esquina de la celda. */
function lamina(M, nombre, biomas, columnas) {
  const { G } = M, celda = 48, cab = 10;
  const etiquetas = biomas.map(bi => rotulo(G.Tiles.BIOMES[bi].name.replace(/^Grieta · /, '')));
  const izq = 4 + 4 * Math.max(...etiquetas.map(e => e.length)) + 4;
  const W = izq + celda * columnas.length, H = cab + celda * biomas.length;
  const dst = new Uint8Array(W * H * 4), oscuro = [24, 24, 28], claro = [236, 236, 230];
  rellenar(dst, W, 0, 0, W, H, oscuro);
  let previo = null;
  for (const [c, [tipo, v]] of columnas.entries()) if (tipo !== previo) { texto(dst, W, H, rotulo(tipo), izq + c * celda + 2, 2, claro); previo = tipo; }
  for (const [j, bi] of biomas.entries()) {
    const y0 = cab + j * celda;
    texto(dst, W, H, etiquetas[j], 4, y0 + celda / 2 - 2, claro);
    rellenar(dst, W, izq, y0, W - izq, celda, rgbHex(G.Tiles.BIOMES[bi].floor[0]));
    for (const [c, [tipo, v]] of columnas.entries()) {
      const x0 = izq + c * celda;
      for (let y = y0; y < y0 + celda; y++) { const i = (y * W + x0) * 4; dst[i] = dst[i + 1] = dst[i + 2] = 40; }   // raya entre celdas
      const img = rgbaDe(G.Tiles.propSprite(bi, tipo, v));
      if (img) blit(dst, W, H, img, x0 + Math.round((celda - img.width) / 2), y0 + celda - img.height - 2);
      texto(dst, W, H, String(v), x0 + 2, y0 + 2, claro);
    }
  }
  fs.mkdirSync(SALIDA, { recursive: true });
  fs.writeFileSync(path.join(SALIDA, nombre + '.png'), png(dst, W, H, 4));
  return { W, H };
}
/** Las variantes que dibuja drawProp de world.js: roca entera o rota, hierba quieta o movida, altar por poder (×2) y usado
 *  (+1), manantial lleno o agotado y trampa por clase; árbol y cofres, sólo la 0. */
const VARIANTES = { tree: [0], rock: [0, 1], grass: [0, 1], chest: [0], bigchest: [0], altar: [0, 1, 2, 3, 4, 5, 6, 7], spring: [0, 1], trap: [0, 1, 2] };
const columnasDe = tipos => tipos.flatMap(t => VARIANTES[t].map(v => [t, v]));
/** Lámina con cada objeto (y cada variante) de cada bioma normal. */
function laminaProps(M, nombre) {
  const tipos = ['tree', 'rock', 'grass', 'chest', 'bigchest', 'altar', 'spring', 'trap'];
  const { W, H } = lamina(M, nombre, [0, 1, 2], columnasDe(tipos));
  console.log(`${nombre}: ${tipos.map(t => t + ' ' + VARIANTES[t].join('/')).join(', ')} × biomas 0-2 (${W * 4}x${H * 4} px)`);
}
/** Lámina con los objetos de las 18 arenas de la grieta (en las arenas sólo hay árboles, rocas y hierba), una fila por arena
 *  en el orden de G.Tiles.ARENA_TYPES, sobre el color de su suelo. */
function laminaPropsArenas(M, nombre) {
  const { G } = M, tipos = ['tree', 'rock', 'grass'];
  const biomas = G.Tiles.ARENA_TYPES.map(t => G.Tiles.arenaBiome(t));
  const { W, H } = lamina(M, nombre, biomas, columnasDe(tipos));
  console.log(`${nombre}: ${tipos.map(t => t + ' ' + VARIANTES[t].join('/')).join(', ')} × las ${biomas.length} arenas (${G.Tiles.ARENA_TYPES.join(', ')}; ${W * 4}x${H * 4} px)`);
}

// ---------------- principal ----------------
const M = mundo(ESTILO);
const pref = (UPSTREAM ? 'upstream-' : '') + ESTILO + '-s' + SEMILLA;
const bArg = arg('--bioma', arg('--arena', null) ? null : 'todos');
if (bArg !== null) for (const b of (bArg === 'todos' ? [0, 1, 2] : [+bArg])) zona(M, `${pref}-bioma${b}`, { bioma: b });
const aArg = arg('--arena', null);
if (aArg) for (const t of (aArg === 'todos' ? M.G.Tiles.ARENA_TYPES : aArg.split(','))) zona(M, `${pref}-arena-${t}`, { arena: t });
if (flag('--zoom-props')) { laminaProps(M, `${pref}-objetos`); laminaPropsArenas(M, `${pref}-objetos-arenas`); }
console.log('PNG en ' + SALIDA);
