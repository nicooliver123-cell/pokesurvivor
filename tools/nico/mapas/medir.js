/* ============ tools/nico/mapas/medir.js — medidas de los mapas propios, sin navegador (MOD nico) ============
 *   node tools/nico/mapas/medir.js [--completo] [--solo A,B,D,E,F,G,H,M,N,O,coste]
 * Los casos A, B, D, E, F, G, H, M, N y O del §10 de la especificación de los mapas propios, más el coste por chunk
 * frente a upstream en el mismo proceso, con los scripts reales en el orden de dev.html: util.js, mods.js, marca.js,
 * tiles.js, mapas-datos.js, mapas.js, mapas-pintar.js y mapas-sprites.js (si existen) y world.js (y entorno.js y
 * horno.js para el caso O). Las medidas de estructura son las del arnés del juez de la especificación (pasillos de 1,
 * bolsas cerradas, distancia a la pared, aparición en el anillo). Sin --completo, D va con 8 semillas × 300²; con él,
 * además, la pasada completa de 8 semillas × 400² con la de upstream al lado. Sale con 1 si algo falla.
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const rd = f => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const existe = f => fs.existsSync(path.join(RAIZ, f));
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] !== undefined && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const COMPLETO = args.includes('--completo');
const SOLO = arg('--solo', null) ? arg('--solo', '').split(',') : null;
const toca = k => !SOLO || SOLO.includes(k);

const FLOOR = 0, WALL = 1, LIQ = 2;
const SOLIDOS = new Set(['tree', 'rock', 'chest', 'altar', 'bigchest']);
const INTERACTIVOS = new Set(['altar', 'spring', 'bigchest', 'trap']);
const SEMILLAS = [1234, 777, 4242, 31337, 99, 2024, 5, 808];

// ---------------- el mundo ----------------
const lienzoFalso = () => {
  const cv = { width: 0, height: 0, _img: null };
  cv.getContext = () => ({
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData(img) { cv._img = img; cv.width = img.width; cv.height = img.height; },
    drawImage() {}, fillRect() {}, clearRect() {}, getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) })
  });
  return cv;
};
/** El mundo real. mapas: G.MODS.mapasPropios; upstream: tiles.js y world.js sin las líneas «MOD nico» y sin los
 *  ficheros de los mapas; conVm: en un contexto de node:vm (más lento, para comparar reinos); horno: con entorno.js
 *  y horno.js y un reloj de mentira. `previos` guarda las funciones de tiles.js antes de que las toque nadie. */
function mundo({ mapas = true, upstream = false, conVm = false, horno = false } = {}) {
  const reloj = { t: 1000 };
  const c = { console, performance: horno ? { now: () => reloj.t } : performance, document: { createElement: lienzoFalso } };
  c.window = c; c.G = {};
  let run;
  if (conVm) { vm.createContext(c); run = (code, f) => vm.runInContext(code, c, { filename: f }); }
  else run = (code, f) => new Function('window', 'G', 'document', 'performance', code + '\n//# sourceURL=' + f)(c, c.G, c.document, c.performance);
  const G = c.G, oyentes = [];
  run(rd('js/core/util.js'), 'js/core/util.js');
  run(rd('js/core/mods.js'), 'js/core/mods.js');
  G.MODS.mapasPropios = mapas;
  run(rd('js/ui/marca.js'), 'js/ui/marca.js');
  G.Estilo = { actual: 'clasico', get dex() { return this.actual === 'dex'; }, on(fn) { oyentes.push(fn); }, set(v) { this.actual = v; oyentes.forEach(fn => fn(v)); } };
  G.Settings = { fx: 2, get: () => false };
  G.Sprites = { PX: 2, white: x => x };
  G.Game = { state: 'playing', st: { time: 10 }, player: { x: 0, y: 0 } };
  G.Rift = { inArena: false, rift: null };
  G.Coop = { active: false };
  const src = f => (upstream ? rd(f).split(/\r?\n/).filter(l => !/MOD nico/.test(l)).join('\n') : rd(f));
  run(src('js/world/tiles.js'), 'js/world/tiles.js');
  const previos = { paintChunk: G.Tiles.paintChunk, propSprite: G.Tiles.propSprite, clearProps: G.Tiles.clearProps };
  if (!upstream) for (const f of ['js/world/mapas-datos.js', 'js/world/mapas.js', 'js/world/mapas-pintar.js', 'js/world/mapas-sprites.js'])
    if (existe(f)) run(rd(f), f);
  run(src('js/world/world.js'), 'js/world/world.js');
  if (horno) { run(rd('js/world/entorno.js'), 'js/world/entorno.js'); run(rd('js/world/horno.js'), 'js/world/horno.js'); }
  return { G, c, previos, reloj };
}

// ---------------- utilidades del arnés (no del juego: aquí sí valen la trigonometría y el azar sembrado) ----------------
function rng(s) { let x = s >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
const makeProp = (type, tx, ty, kind = 0) => ({ type, tx, ty, kind, solid: SOLIDOS.has(type) });
/** Códigos, kinds, sólidos y objetos de la ventana [x0, x0+W) × [y0, y0+W) con G.Mapas (capas y props). */
function rejilla(G, S, x0, y0, W, A = null, conProps = true) {
  const cod = new Uint8Array(W * W), g = new Uint8Array(W * W), solid = new Uint8Array(W * W), lista = [];
  for (let cy = Math.floor(y0 / 16); cy <= Math.floor((y0 + W - 1) / 16); cy++)
    for (let cx = Math.floor(x0 / 16); cx <= Math.floor((x0 + W - 1) / 16); cx++) {
      const cd = G.Mapas.capa(cx, cy, S, A).cod;
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
        const x = cx * 16 + i - x0, y = cy * 16 + j - y0;
        if (x >= 0 && y >= 0 && x < W && y < W) { cod[y * W + x] = cd[j * 16 + i]; g[y * W + x] = cd[j * 16 + i] & 3; }
      }
      if (!conProps) continue;
      const ch = { cx, cy, props: [], propAt: new Map() };
      G.Mapas.props(ch, 16, S, A, new Set(), makeProp);
      for (const p of ch.props) {
        const x = p.tx - x0, y = p.ty - y0;
        if (x < 0 || y < 0 || x >= W || y >= W) continue;
        lista.push(p);
        if (p.solid) solid[y * W + x] = 1;
      }
    }
  return { cod, g, solid, lista };
}
function distancia(g, W, esObst) {
  const INF = 1e9, d = new Float64Array(W * W), b = Math.SQRT2;
  for (let o = 0; o < W * W; o++) d[o] = esObst(g[o], o) ? 0 : INF;
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const o = y * W + x; let v = d[o];
    if (x > 0) v = Math.min(v, d[o - 1] + 1); if (y > 0) v = Math.min(v, d[o - W] + 1);
    if (x > 0 && y > 0) v = Math.min(v, d[o - W - 1] + b); if (x < W - 1 && y > 0) v = Math.min(v, d[o - W + 1] + b); d[o] = v; }
  for (let y = W - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const o = y * W + x; let v = d[o];
    if (x < W - 1) v = Math.min(v, d[o + 1] + 1); if (y < W - 1) v = Math.min(v, d[o + W] + 1);
    if (x < W - 1 && y < W - 1) v = Math.min(v, d[o + W + 1] + b); if (x > 0 && y < W - 1) v = Math.min(v, d[o + W - 1] + b); d[o] = v; }
  return d;
}
/** Suelo encerrado (no alcanzable desde el borde de la ventana) con `bloquea`: { n casillas, mayor bolsa }. */
function encerrado(g, W, bloquea) {
  const vis = new Uint8Array(W * W), q = [];
  const push = o => { if (!vis[o] && !bloquea(g[o], o)) { vis[o] = 1; q.push(o); } };
  for (let i = 0; i < W; i++) { push(i); push((W - 1) * W + i); push(i * W); push(i * W + W - 1); }
  while (q.length) { const o = q.pop(), x = o % W, y = (o / W) | 0;
    if (x > 0) push(o - 1); if (x < W - 1) push(o + 1); if (y > 0) push(o - W); if (y < W - 1) push(o + W); }
  let n = 0, mayor = 0; const vis2 = new Uint8Array(W * W);
  for (let o = 0; o < W * W; o++) if (!vis[o] && !bloquea(g[o], o) && !vis2[o] && g[o] === FLOOR) {
    let k = 0; const st = [o]; vis2[o] = 1;
    while (st.length) { const p = st.pop(); k++; const x = p % W, y = (p / W) | 0;
      for (const r of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < W - 1 ? p + W : -1])
        if (r >= 0 && !vis[r] && !vis2[r] && !bloquea(g[r], r)) { vis2[r] = 1; st.push(r); } }
    n += k; if (k > mayor) mayor = k;
  }
  return { n, mayor };
}
/** Estructura del juez sobre una ventana W×W centrada en el origen (sin el radio 20). */
function estructura(g, solid, W) {
  const R = W / 2;
  let n = 0, w = 0, l = 0, pas = 0, pasL = 0, fl = 0, abiertoW = 0, abiertoO = 0, sumO = 0;
  const dW = distancia(g, W, k => k === WALL), dO = distancia(g, W, k => k !== FLOOR);
  for (let j = 1; j < W - 1; j++) for (let i = 1; i < W - 1; i++) {
    const x = i - R, y = j - R; if (x * x + y * y < 400) continue;
    n++; const o = j * W + i, k = g[o];
    if (k === WALL) w++; else if (k === LIQ) l++;
    else {
      fl++;
      const Wl = (a, b) => g[(j + b) * W + i + a] === WALL, Ob = (a, b) => g[(j + b) * W + i + a] !== FLOOR;
      if ((Wl(-1, 0) && Wl(1, 0) && !Wl(0, -1) && !Wl(0, 1)) || (Wl(0, -1) && Wl(0, 1) && !Wl(-1, 0) && !Wl(1, 0))) pas++;
      if ((Ob(-1, 0) && Ob(1, 0) && !Ob(0, -1) && !Ob(0, 1)) || (Ob(0, -1) && Ob(0, 1) && !Ob(-1, 0) && !Ob(1, 0))) pasL++;
      if (dW[o] >= 4) abiertoW++;
      if (dO[o] >= 4) abiertoO++;
      sumO += Math.min(dO[o], 30);
    }
  }
  const e1 = encerrado(g, W, k => k === WALL), e2 = encerrado(g, W, k => k !== FLOOR);
  const e3 = solid ? encerrado(g, W, (k, o) => k === WALL || solid[o]) : null, e4 = solid ? encerrado(g, W, (k, o) => k !== FLOOR || solid[o]) : null;
  return { pared: 100 * w / n, liq: 100 * l / n, pas, pasL, bolsaW: e1.n, bolsaWL: e2.n, bolsaWS: e3 && e3.n, bolsaWLS: e4 && e4.n,
           abiertoW: 100 * abiertoW / fl, abiertoO: 100 * abiertoO / fl, holgura: sumO / fl };
}
const f1 = v => v.toFixed(1), f2 = v => v.toFixed(2);
const media = a => a.reduce((x, y) => x + y, 0) / a.length;

// ---------------- informe ----------------
const resultados = [];
function caso(id, nombre, ok, detalle) {
  resultados.push({ id, nombre, ok: !!ok });
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${id}. ${nombre}${detalle ? '\n       ' + detalle : ''}`);
}
function intenta(id, nombre, fn) {
  if (!toca(id)) return;
  const t0 = Date.now();
  try { fn(); } catch (e) { caso(id, nombre, false, String(e && e.stack || e)); }
  if (Date.now() - t0 > 3000) console.log(`       (${id}: ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}

// ================================================================
// Coste por chunk (terreno y objetos, por world.js) frente a upstream, en el mismo proceso (el primero: con el montón limpio)
// ================================================================
intenta('coste', 'Coste', () => {
  const medir = (G, S) => {
    G.World.reset(S);
    const t0 = process.hrtime.bigint();
    for (let cy = -9; cy < 9; cy++) for (let cx = -9; cx < 9; cx++) G.World.kindAt(cx * 512 + 16, cy * 512 + 16);
    return Number(process.hrtime.bigint() - t0) / 1e6 / 324;
  };
  const N_ = mundo().G, U = mundo({ upstream: true }).G;
  for (let i = 0; i < 3; i++) { medir(N_, 50 + i); medir(U, 50 + i); }   // calentar el JIT
  const n = [], u = [];
  for (let i = 0; i < 7; i++) { n.push(medir(N_, 100 + i)); u.push(medir(U, 100 + i)); }
  n.sort((a, b) => a - b); u.sort((a, b) => a - b);
  // Sólo las capas (terreno con la rejilla), sin objetos.
  const t0 = process.hrtime.bigint();
  for (let cy = -9; cy < 9; cy++) for (let cx = -9; cx < 9; cx++) N_.Mapas.capa(cx, cy, 999, null);
  const capa = Number(process.hrtime.bigint() - t0) / 1e6 / 324;
  caso('coste', `datos de un chunk (terreno y objetos, generados por world.js en 18×18 chunks): mediana ${n[3].toFixed(3)} ms con los mapas propios frente a ${u[3].toFixed(3)} ms de upstream (×${(n[3] / u[3]).toFixed(2)}); sólo la capa, ${capa.toFixed(3)} ms`,
    n[3] <= Math.max(u[3] * 1.5, 0.5));
});

// ================================================================
// A. Interruptor
// ================================================================
intenta('A', 'Interruptor', () => {
  const M = mundo(), G = M.G, D = G.MapasDatos, T = G.Tiles;
  const U = mundo({ upstream: true }).G, Fm = mundo({ mapas: false }), F = Fm.G;
  const nombres = [0, 1, 2].map(i => T.BIOMES[i].name);
  caso('A', `con mapasPropios: activo y los 3 biomas nuevos (${nombres.join(', ')})`,
    G.Mapas.activo === true && nombres.every((n, i) => n === D.BIOMAS[i].name));
  caso('A', 'con mapasPropios: las 18 arenas con las mismas claves y en el mismo orden, y 21 BIOMES',
    JSON.stringify(T.ARENA_TYPES) === JSON.stringify(U.Tiles.ARENA_TYPES) && JSON.stringify(Object.keys(T.ARENA_THEMES)) === JSON.stringify(Object.keys(U.Tiles.ARENA_THEMES)) &&
    T.ARENA_TYPES.length === 18 && T.BIOMES.length === 21 && T.ARENA_TYPES.every(t => T.ARENA_THEMES[t].name === D.ARENAS[t].name));
  // BIOMES[3..20]: lo que daría arenaBiome() de tiles.js (sacada de su fuente) con los temas nuevos, campo a campo.
  const fuente = rd('js/world/tiles.js');
  const trozo = re => { const m = fuente.match(re); if (!m) throw new Error('no encuentro ' + re); return m[0]; };
  const arenaBiomeTiles = new Function(trozo(/  function shade\(hex, k\) \{[\s\S]*?\r?\n  \}/) + '\n' + trozo(/  function rgb\(hex\) \{[\s\S]*?\r?\n  \}/) + '\n' +
    trozo(/  function arenaBiome\(th\) \{[\s\S]*?\r?\n  \}/) + '\nreturn arenaBiome;')();
  const malos = [];
  T.ARENA_TYPES.forEach((t, i) => {
    const esperado = arenaBiomeTiles(T.ARENA_THEMES[t]), b = T.BIOMES[T.ARENA + i];
    for (const k of Object.keys(esperado)) if (JSON.stringify(esperado[k]) !== JSON.stringify(b[k])) malos.push(t + '.' + k);
    for (const k of Object.keys(U.Tiles.BIOMES[T.ARENA + i])) if (!(k in b)) malos.push(t + ' sin ' + k);
    if (!b.name.startsWith('Grieta · ') || !b.sueloMat || !b.paredMat || !b.familia) malos.push(t + ' sin nombre o materiales');
  });
  const foamAuto = T.ARENA_TYPES.filter(t => D.ARENAS[t].foam === 'auto').every(t => !('foam' in T.ARENA_THEMES[t]));
  caso('A', 'BIOMES[3..20] = arenaBiome() de tiles.js con los temas nuevos (todos sus campos, prefijo «Grieta · »), más familia, variante y materiales; «auto» sin espuma propia',
    !malos.length && foamAuto, malos.slice(0, 8).join(', '));
  const campos = [0, 1, 2].map(i => Object.keys(G.MARCA.biomas[i]).sort().join(','));
  caso('A', 'G.MARCA.biomas[0..2] = { nombre, _g } (sin colores: entorno.js no recolorea) y las motas escarcha y esporas',
    campos.every(c => c === '_g,nombre') && [0, 1, 2].every(i => G.MARCA.biomas[i]._g === D.MARCA_G[D.BIOMAS[i].motivo]) &&
    G.MARCA.motas.escarcha && G.MARCA.motas.esporas, campos.join(' | '));
  const pintor = existe('js/world/mapas-pintar.js'), sprites = existe('js/world/mapas-sprites.js');
  if (pintor) caso('A', 'con mapasPropios: paintChunk === G.Mapas.pintar', T.paintChunk === G.Mapas.pintar);
  else console.log('       (A: falta js/world/mapas-pintar.js: sin comprobar paintChunk)');
  if (sprites) {
    const iguales = [0, 1, 2, 3].every(f => { const a = M.previos.propSprite(0, 'rift', f)._img, b = T.propSprite(0, 'rift', f)._img;
      return a && b && a.data.length === b.data.length && a.data.every((v, i) => v === b.data[i]); });
    caso('A', "con mapasPropios: propSprite(0, 'rift', f) con los mismos bytes que el original", iguales);
  } else console.log('       (A: falta js/world/mapas-sprites.js: sin comprobar la grieta)');
  // Sin mapas: todo como el proyecto base.
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  caso('A', 'sin mapasPropios: BIOMES, ARENA_THEMES y G.MARCA.biomas y motas iguales en JSON a upstream y las funciones de tiles.js sin tocar',
    F.Mapas.activo === false && eq(F.Tiles.BIOMES, U.Tiles.BIOMES) && eq(F.Tiles.ARENA_THEMES, U.Tiles.ARENA_THEMES) && eq(F.MARCA.biomas, U.MARCA.biomas) &&
    eq(F.MARCA.motas, U.MARCA.motas) && F.Tiles.paintChunk === Fm.previos.paintChunk && F.Tiles.propSprite === Fm.previos.propSprite &&
    F.Tiles.clearProps === Fm.previos.clearProps);
  // ... y el mundo byte a byte (terreno, objetos y el chunk horneado).
  let difT = 0, difP = 0, difB = 0;
  for (const W of [F, U]) { W.World.reset(1234); W.World.setBiome(0, true); }
  for (let ty = -60; ty < 60; ty++) for (let tx = -60; tx < 60; tx++) if (F.World.kindAt(tx * 32 + 16, ty * 32 + 16) !== U.World.kindAt(tx * 32 + 16, ty * 32 + 16)) difT++;
  const cam = { x: 0, y: 0, w: 3840, h: 3840, left() { return -1920; }, top() { return -1920; }, sees: () => true };
  const pf = F.World.visibleProps(cam).map(p => p.type + p.tx + ',' + p.ty + ':' + p.kind).join('|');
  const pu = U.World.visibleProps(cam).map(p => p.type + p.tx + ',' + p.ty + ':' + p.kind).join('|');
  if (pf !== pu) difP++;
  for (const [cx, cy] of [[0, 0], [2, -1], [-3, 2]]) {
    const a = F.World.chunkImage(cx, cy)._img.data;
    let b = null; U.World.drawGround({ set imageSmoothingEnabled(v) {}, drawImage(i) { b = b || i; } },
      { w: 8, h: 8, scale: 1, left: () => cx * 512 + 8, top: () => cy * 512 + 8, sees: () => true });
    if (!b || !b._img || !a.every((v, i) => v === b._img.data[i])) difB++;
  }
  caso('A', 'sin mapasPropios: terreno, objetos y chunks horneados byte a byte los de upstream (semilla 1234, 120×120 casillas)', !difT && !difP && !difB, `terreno ${difT}, objetos ${difP}, chunks ${difB}`);
});

// ================================================================
// B. Pureza
// ================================================================
intenta('B', 'Pureza', () => {
  const src = rd('js/world/mapas.js');
  const sinClima = src.replace(/function climaAlAzar[\s\S]*?\n  \}\n/, '');
  const prohibido = /\bMath\.(random|hypot|sqrt|sin|cos|tan|atan2?|pow|exp|log)\b|\bDate\b|\bperformance\b/;
  const m = sinClima.match(prohibido);
  caso('B', 'mapas.js: sin Math.random/hypot/sqrt/sin/cos/tan/atan/pow/exp/log, Date ni performance fuera de climaAlAzar', !m && /Math\.random/.test(src), m && m[0]);
  const S = 1234, chunks = [];
  for (let cy = -5; cy < 5; cy++) for (let cx = -10; cx < 10; cx++) chunks.push([cx, cy]);
  // Con Math.random lanzando un error: generar 200 chunks (terreno y objetos, por world.js) no lo llama nunca.
  const G1 = mundo().G, rnd = Math.random;
  let llamado = null;
  Math.random = () => { throw new Error('Math.random durante la generación'); };
  try { G1.World.reset(S); for (const [cx, cy] of chunks) G1.World.isFree(cx * 512 + 256, cy * 512 + 256, 4); G1.Mapas.huella(S, -10, -5, 20, 10, null); }
  catch (e) { llamado = String(e.message); } finally { Math.random = rnd; }
  caso('B', 'generar 200 chunks (world.js) y su huella con Math.random lanzando un error', !llamado, llamado);
  // La misma huella en orden normal, por chunks en orden barajado (con otras semillas y la LRU expulsando por medio) y en vm.
  const huellaA = mundo().G.Mapas.huella(S, -10, -5, 20, 10, null);
  const G2 = mundo().G, r = rng(99), orden = chunks.slice().sort(() => r() - 0.5), porChunk = new Map();
  for (const [cx, cy] of orden) {
    G2.Mapas.capa(cx + 40, cy - 30, 777, null); G2.Mapas.terreno(cx * 16 - 900, cy * 16 + 700, 4242, null);
    porChunk.set(cx + ',' + cy, G2.Mapas.huella(S, cx, cy, 1, 1, null));
    for (let k = 0; k < 4; k++) G2.Mapas.capa(Math.floor(r() * 400) - 200, Math.floor(r() * 400) - 200, 31337 + k, null);   // fuerza la LRU
  }
  const G3 = mundo().G;
  const igualesChunk = chunks.every(([cx, cy]) => porChunk.get(cx + ',' + cy) === G3.Mapas.huella(S, cx, cy, 1, 1, null));
  const huellaB = G2.Mapas.huella(S, -10, -5, 20, 10, null);
  const huellaV = mundo({ conVm: true }).G.Mapas.huella(S, -10, -5, 20, 10, null);
  caso('B', `huella de 200 chunks igual en orden normal, barajado (chunk a chunk y entera) y en otro contexto vm (${huellaA})`,
    huellaA === huellaB && huellaA === huellaV && igualesChunk, `${huellaB} · vm ${huellaV} · por chunk ${igualesChunk}`);
  // Y con una arena cerca: la misma, también en otro contexto.
  const A = { tx: 6100, ty: 5900, r: 11, type: 'fire' };
  const ha = mundo().G.Mapas.huella(S, 378, 364, 6, 6, A), hb = mundo({ conVm: true }).G.Mapas.huella(S, 378, 364, 6, 6, A);
  caso('B', `huella de la arena fire (36 chunks) igual en dos contextos (${ha})`, ha === hb, hb);
});

// ================================================================
// D. Estructura
// ================================================================
intenta('D', 'Estructura', () => {
  const G = mundo().G, filas = [];
  const pasada = (semillas, W, conUpstream) => {
    const out = [];
    for (const S of semillas) {
      const { g, solid } = rejilla(G, S, -W / 2, -W / 2, W);
      const e = estructura(g, solid, W);
      out.push(e);
      let lineaU = '';
      if (conUpstream) {
        const U = mundo({ upstream: true }).G; U.World.reset(S);
        const gu = new Uint8Array(W * W), K = { floor: 0, wall: 1, liquid: 2 };
        for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) gu[j * W + i] = K[U.World.kindAt((i - W / 2) * 32 + 16, (j - W / 2) * 32 + 16)];
        const eu = estructura(gu, null, W);
        lineaU = ` | upstream: pared ${f1(eu.pared)} % líq ${f1(eu.liq)} % pas1 ${eu.pas}/${eu.pasL} bolsas ${eu.bolsaW}/${eu.bolsaWL} ≥4 ${f1(eu.abiertoW)} %`;
      }
      filas.push(`s=${S} ${W}²: pared ${f2(e.pared)} % · líquido ${f2(e.liq)} % · pasillos de 1 ${e.pas}/${e.pasL} · bolsas ${e.bolsaW}/${e.bolsaWL}/${e.bolsaWLS} · ` +
        `≥4 de pared ${f1(e.abiertoW)} % · ≥4 de todo ${f1(e.abiertoO)} % · holgura ${f2(e.holgura)}${lineaU}`);
    }
    return out;
  };
  // Las 8 semillas de la especificación: con sólo las 4 primeras (las de más pared de las 8) la media de pared a 300²
  // sale 7,68 %, por encima del 7,5 % del caso, que se midió con las 8 a 400².
  const r = pasada(SEMILLAS, 300, false);
  const ok = r.every(e => e.pared >= 4 && e.pared <= 9.5 && e.liq >= 5 && e.liq <= 11 && e.pas <= 2 && e.pasL <= 2 && !e.bolsaW && !e.bolsaWL && !e.bolsaWLS) &&
    media(r.map(e => e.pared)) >= 5.5 && media(r.map(e => e.pared)) <= 7.5 && media(r.map(e => e.liq)) >= 6.5 && media(r.map(e => e.liq)) <= 9 &&
    media(r.map(e => e.abiertoW)) >= 75;
  caso('D', `8 semillas × 300²: pared 4-9,5 % (media ${f2(media(r.map(e => e.pared)))}), líquido 5-11 % (media ${f2(media(r.map(e => e.liq)))}), ≤ 2 pasillos de 1, 0 bolsas (pared / +líquido / +líquido y sólidos), ≥ 4 de pared ${f1(media(r.map(e => e.abiertoW)))} % de media (≥ 75)`,
    ok, filas.join('\n       '));
  if (COMPLETO) {
    filas.length = 0;
    const r8 = pasada(SEMILLAS, 400, true);
    caso('D', `pasada completa: 8 semillas × 400² (pared media ${f2(media(r8.map(e => e.pared)))} %, líquido ${f2(media(r8.map(e => e.liq)))} %)`,
      r8.every(e => e.pas <= 2 && e.pasL <= 2 && !e.bolsaW && !e.bolsaWL && !e.bolsaWLS), filas.join('\n       '));
  }
});

// ================================================================
// E. Claro del principio
// ================================================================
intenta('E', 'Claro', () => {
  const G = mundo().G, mal = [];
  for (let k = 0; k < 20; k++) {
    const S = 1000 + k * 7919;
    const { g, lista } = rejilla(G, S, -16, -16, 32);
    for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) { const x = i - 16, y = j - 16; if (x * x + y * y < 81 && g[j * 32 + i] !== FLOOR) mal.push(`s=${S} (${x},${y}) no es suelo`); }
    for (const p of lista) {
      const d2 = p.tx * p.tx + p.ty * p.ty;
      if (d2 < 49) mal.push(`s=${S} ${p.type} a d² ${d2}`);
      if (INTERACTIVOS.has(p.type) && d2 <= 144) mal.push(`s=${S} interactivo ${p.type} a d² ${d2}`);
    }
    G.World.reset(S);
    if (!G.World.isFree(51, 0, 26) || !G.World.isFree(-51, 0, 26)) mal.push(`s=${S} isFree(±51, 0, 26)`);
  }
  caso('E', '20 semillas: suelo a d < 9, ningún objeto a d < 7, ningún interactivo a d ≤ 12 e isFree(±51, 0, 26)', !mal.length, mal.slice(0, 6).join(' · '));
});

// ================================================================
// F. Objetos
// ================================================================
intenta('F', 'Objetos', () => {
  const G = mundo().G, SUB = G.Mapas.SUB;
  const RANGO = { tree: [2128, 2584], grass: null, rock: [862, 1025], chest: [48, 69], trap: [217, 275], spring: [27, 53], altar: [20, 53], bigchest: [23, 39] };
  const CRUCES = new Set([SUB.VADO, SUB.PUENTE, SUB.PUERTO, SUB.CALZADA, SUB.PRETIL, SUB.PLAZA]);
  const W = 384, filas = [], mal = [];
  for (const S of COMPLETO ? SEMILLAS : SEMILLAS.slice(0, 4)) {
    const { cod, g, solid, lista } = rejilla(G, S, -W / 2, -W / 2, W);
    const cnt = {};
    for (const p of lista) cnt[p.type] = (cnt[p.type] || 0) + 1;
    filas.push(`s=${S}: ` + Object.keys(RANGO).map(t => `${t} ${cnt[t] || 0}`).join(' · ') + ` · hierba ${f1(100 * (cnt.grass || 0) / (W * W))} %`);
    for (const [t, rg] of Object.entries(RANGO)) if (rg && ((cnt[t] || 0) < rg[0] * 0.85 || (cnt[t] || 0) > rg[1] * 1.15)) mal.push(`s=${S} ${t} ${cnt[t] || 0} fuera de ${Math.round(rg[0] * 0.85)}-${Math.round(rg[1] * 1.15)}`);
    const hierba = 100 * (cnt.grass || 0) / (W * W);
    if (hierba < 10.7 * 0.85 || hierba > 11.5 * 1.15) mal.push(`s=${S} hierba ${f1(hierba)} %`);
    let vec = 0, lin2 = 0, sin3 = 0, enCruce = 0;
    const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < W ? y * W + x : -1);
    for (const p of lista) {
      const i = p.tx + W / 2, j = p.ty + W / 2;
      if (CRUCES.has(cod[at(i, j)] >> 2) || g[at(i, j)] !== FLOOR) enCruce++;
      if (!p.solid) continue;
      for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) {
        if (!a && !b) continue; const o = at(i + a, j + b); if (o < 0 || !solid[o]) continue;
        if (Math.abs(a) <= 1 && Math.abs(b) <= 1) vec++; else if (a === 0 || b === 0) lin2++;
      }
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const o = at(i + a, j + b); if (o >= 0 && g[o] !== FLOOR) { sin3++; b = a = 2; } }
    }
    if (vec || lin2 || sin3 || enCruce) mal.push(`s=${S} sólidos vecinos ${vec / 2}, a 2 en línea ${lin2 / 2}, sin 3×3 de suelo ${sin3}, en un cruce ${enCruce}`);
  }
  caso('F', 'recuentos por 147.456 casillas dentro de los rangos del §6 ±15 %; 0 sólidos vecinos o a 2 en línea; todo sólido con 3×3 de suelo; nada en cruces', !mal.length,
    filas.join('\n       ') + (mal.length ? '\n       ' + mal.slice(0, 8).join(' · ') : ''));
  // Arenas: sólo tree, rock y grass, nunca en el pasillo y nada más hasta r + 40.
  const malA = [], tipos = {};
  for (const [k, type] of G.Tiles.ARENA_TYPES.entries()) {
    const A = { tx: 5000 + k * 131, ty: 6000 + k * 71, r: 11, type };
    const { lista } = rejilla(G, 1234, A.tx - 56, A.ty - 56, 112, A);
    for (const p of lista) {
      const lx = p.tx - A.tx, ly = p.ty - A.ty, q = lx * lx + ly * ly;
      if (q >= 51 * 51) continue;
      tipos[p.type] = (tipos[p.type] || 0) + 1;
      if (!['tree', 'rock', 'grass'].includes(p.type)) malA.push(`${type} ${p.type}`);
      if ((Math.abs(lx) <= 2 && ly >= -6 && ly <= 5) || q < 6.25) malA.push(`${type} ${p.type} en el pasillo (${lx},${ly})`);
      if (q >= 121) malA.push(`${type} ${p.type} fuera (${lx},${ly})`);
    }
  }
  caso('F', `arenas (las 18): sólo tree, rock y grass (${JSON.stringify(tipos)}), nunca en el pasillo y nada más hasta r + 40`, !malA.length, malA.slice(0, 8).join(' · '));
});

// ================================================================
// G. Aparición (con isFree de world.js: terreno y objetos)
// ================================================================
intenta('G', 'Aparición', () => {
  const G = mundo().G, filas = [];
  const outerEsc = Math.hypot(768, 480) / 2 + 40, outerMov = Math.hypot(1266, 585) / 2 + 40;
  let okAll = true;
  for (const S of SEMILLAS.slice(0, 4)) {
    G.World.reset(S); G.World.setBiome(0, true);
    // Casillas alcanzables desde el origen (sin pared ni sólidos; el agua se cruza).
    const W = 320, { g, solid } = rejilla(G, S, -W / 2, -W / 2, W), alc = new Uint8Array(W * W), q = [];
    const push = o => { if (!alc[o] && g[o] !== WALL && !solid[o]) { alc[o] = 1; q.push(o); } };
    push((W / 2) * W + W / 2);
    while (q.length) { const o = q.pop(), x = o % W, y = (o / W) | 0; if (x > 0) push(o - 1); if (x < W - 1) push(o + 1); if (y > 0) push(o - W); if (y < W - 1) push(o + W); }
    const r = rng(S * 7 + 1), c = { esc: [0, 0], mov: [0, 0], grieta: [0, 0], ladron: [0, 0], perdido: [0, 0] };
    const anillo = (px, py, outer, k) => {
      const ang = r() * 6.2832;
      for (let i = 0; i < 8; i++) { const a = ang + (i === 0 ? 0 : r() * 1.8 - 0.9), d = outer + 10 + r() * 60;
        if (G.World.isFree(px + Math.cos(a) * d, py + Math.sin(a) * d * 0.9, 14)) { c[k][0]++; break; } }
      c[k][1]++;
    };
    for (let k = 0; k < 2500; k++) {
      const tx = Math.floor((r() - 0.5) * 2 * (W / 2 - 40)), ty = Math.floor((r() - 0.5) * 2 * (W / 2 - 40));
      const o = (ty + W / 2) * W + tx + W / 2;
      if (g[o] !== FLOOR || !alc[o]) continue;
      const px = tx * 32 + 16, py = ty * 32 + 16;
      if (!G.World.isFree(px, py, 12)) continue;
      anillo(px, py, outerEsc, 'esc'); anillo(px, py, outerMov, 'mov');
      c.grieta[1]++;
      for (let i = 0; i < 24; i++) { const a = r() * 6.2832, d = 380 + r() * 180; if (G.World.isFree(px + Math.cos(a) * d, py + Math.sin(a) * d * 0.85, 22)) { c.grieta[0]++; break; } }
      c.ladron[1]++;
      for (let i = 0; i < 12; i++) { const a = r() * 6.2832, d = 230 + r() * 70; if (G.World.isFree(px + Math.cos(a) * d, py + Math.sin(a) * d * 0.8, 14)) { c.ladron[0]++; break; } }
      c.perdido[1]++;
      let at = null, to = null;
      for (let i = 0; i < 20 && !at; i++) { const a = r() * 6.2832, d = 220 + r() * 80, x = px + Math.cos(a) * d, y = py + Math.sin(a) * d * 0.8; if (G.World.isFree(x, y, 16)) at = [x, y]; }
      for (let i = 0; i < 30 && at && !to; i++) { const a = r() * 6.2832, d = 700 + r() * 150, x = at[0] + Math.cos(a) * d, y = at[1] + Math.sin(a) * d * 0.85; if (G.World.isFree(x, y, 30)) to = [x, y]; }
      if (at && to) c.perdido[0]++;
    }
    const pc = k => 100 * c[k][0] / c[k][1];
    const ok = pc('esc') >= 99.5 && pc('mov') >= 99.5 && pc('grieta') >= 99.9 && pc('ladron') >= 99 && pc('perdido') >= 99;
    okAll = okAll && ok;
    filas.push(`s=${S}: anillo escritorio ${f2(pc('esc'))} % · móvil ${f2(pc('mov'))} % · grieta ${f2(pc('grieta'))} % · ladrón ${f2(pc('ladron'))} % · perdido ${f2(pc('perdido'))} % (${c.esc[1]} jugadores)`);
  }
  caso('G', 'aparición en el anillo ≥ 99,5 % (escritorio y móvil), grieta ≥ 99,9 %, ladrón y destino del perdido ≥ 99 %', okAll, filas.join('\n       '));
});

// ================================================================
// H. Arenas en 40 posiciones
// ================================================================
intenta('H', 'Arenas', () => {
  const G = mundo().G, T = G.Tiles, S = 4242, filas = [], mal = [];
  const DANA = new Set(['lava', 'poison', 'spark']);
  T.ARENA_TYPES.forEach((type, idx) => {
    let peor = { inalc: 0, pasMal: 0, fuera: 0, pinza: 0, pared: 0, liq: 0, suelo: 1e9, leg: true, anillo: 0, mundo: 0 };
    const dana = DANA.has(T.ARENA_THEMES[type].liquid);
    for (let k = 0; k < 40; k++) {
      const a = { tx: 5000 + k * 97 + idx * 13, ty: 7000 - k * 53, r: 11, type };
      const g = (lx, ly) => G.Mapas.codigo(a.tx + lx, a.ty + ly, S, a) & 3;
      let suelo = 0, pared = 0, liq = 0, fuera = 0, pasMal = 0, pinza = 0, anillo = 0;
      const PR = G.Mapas.P.arena.pared;                         // la pared de la arena llega hasta aquí (casillas)
      for (let ly = -PR + 1; ly <= PR - 1; ly++) for (let lx = -PR + 1; lx <= PR - 1; lx++) {
        const kk = g(lx, ly), d2 = lx * lx + ly * ly;
        if (d2 >= PR * PR) continue;
        if (((Math.abs(lx) <= 2 && ly >= -6 && ly <= 5) || d2 < 6.25) && kk !== FLOOR) pasMal++;
        if (d2 >= 121) { if (kk !== WALL) anillo++; if (kk === FLOOR) fuera++; continue; }
        if (kk === FLOOR) {
          suelo++;
          const B = (x, y) => { const c = g(x, y); return c === WALL || (dana && c === LIQ); };
          if ((B(lx - 1, ly) && B(lx + 1, ly) && !B(lx, ly - 1) && !B(lx, ly + 1)) || (B(lx, ly - 1) && B(lx, ly + 1) && !B(lx - 1, ly) && !B(lx + 1, ly))) pinza++;
        } else if (kk === LIQ) liq++; else pared++;
      }
      const seen = new Set(['0,3']), q = [[0, 3]];
      while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy, kk = g(xx, yy), key = xx + ',' + yy;
        if (seen.has(key) || kk === WALL || (dana && kk === LIQ)) continue; seen.add(key); q.push([xx, yy]); } }
      let inalc = 0;
      for (let ly = -12; ly <= 12; ly++) for (let lx = -12; lx <= 12; lx++) if (g(lx, ly) === FLOOR && !seen.has(lx + ',' + ly)) inalc++;
      const tot = suelo + pared + liq;
      // world.js real: setArena, kindAt, isFree en las posiciones de rift.js y collide contra el borde.
      let malMundo = 0;
      if (k < 6) {
        G.World.reset(S); G.World.setArena({ tx: a.tx, ty: a.ty, r: 11, type }); G.World.setBiome(T.arenaBiome(type), true);
        const ts = 32, ax = a.tx * ts + ts / 2, ay = a.ty * ts + ts / 2;
        for (let ly = -13; ly <= 13; ly++) for (let lx = -13; lx <= 13; lx++)
          if (G.World.kindAt((a.tx + lx) * ts + 16, (a.ty + ly) * ts + 16) !== ['floor', 'wall', 'liquid'][g(lx, ly)]) malMundo++;
        for (let i = 0; i < 4; i++) if (!G.World.isFree(ax + (i - 1.5) * 34, ay + ts * 3, 14)) malMundo++;
        if (!G.World.isFree(ax, ay - ts * 3.5, 14)) malMundo++;
        // Un Pokémon que sale del centro andando hacia fuera (4 px por paso, con collide en cada uno, como player.js)
        // nunca acaba dentro de una pared ni pasa de q = 121 (y sin keepInside de rift.js, que lo frenaría antes).
        for (let i = 0; i < 16; i++) {
          const ang = i * 0.3927 + 0.1, e = { x: ax, y: ay + ts * 3, r: 12 };
          for (let n = 0; n < 160; n++) { e.x += Math.cos(ang) * 4; e.y += Math.sin(ang) * 4; G.World.collide(e); }
          const dx = e.x / ts - (a.tx + 0.5), dy = e.y / ts - (a.ty + 0.5);
          if (G.World.kindAt(e.x, e.y) === 'wall' || dx * dx + dy * dy >= 121) malMundo++;
        }
        const walk = (lx, ly) => G.World.walkable(a.tx + lx, a.ty + ly);
        if (!walk(0, 3) || !walk(0, -4)) malMundo++;
      }
      peor = { inalc: Math.max(peor.inalc, inalc), pasMal: Math.max(peor.pasMal, pasMal), fuera: Math.max(peor.fuera, fuera), pinza: Math.max(peor.pinza, pinza),
        pared: Math.max(peor.pared, 100 * pared / tot), liq: Math.max(peor.liq, 100 * liq / tot), suelo: Math.min(peor.suelo, suelo),
        leg: peor.leg && seen.has('0,-4') && seen.has('0,-3'), anillo: Math.max(peor.anillo, anillo), mundo: peor.mundo + malMundo };
    }
    const fam = G.MapasDatos.ARENAS[type];
    filas.push(`${type.padEnd(9)} ${(fam.familia + '·' + fam.variante).padEnd(20)} suelo ≥ ${peor.suelo} · pared ≤ ${f1(peor.pared)} % · líquido ≤ ${f1(peor.liq)} % · pasillo mal ${peor.pasMal} · suelo fuera ${peor.fuera} · ` +
      `no pared en 11-${G.Mapas.P.arena.pared} ${peor.anillo} · inalcanzable ${peor.inalc} · pasillos de 1 ${peor.pinza} · legendario ${peor.leg ? 'sí' : 'NO'} · world.js ${peor.mundo ? peor.mundo + ' mal' : 'bien'}`);
    if (peor.pasMal || peor.fuera || peor.anillo || peor.inalc || peor.pinza || !peor.leg || peor.pared > 24.5 || peor.liq > 18.5 || peor.suelo < 245 || peor.mundo) mal.push(type);
  });
  caso('H', 'las 18 arenas en 40 posiciones: pasillo libre, nada transitable a q ≥ 121 (pared hasta 36²), todo alcanzable desde (0,3) (con el líquido que quema cerrando), legendario alcanzable, 0 pasillos de 1, pared ≤ 24,5 %, líquido ≤ 18,5 %, suelo ≥ 245; setArena, kindAt, isFree, walkable y collide reales coherentes',
    !mal.length, filas.join('\n       '));
});

// ================================================================
// M. Semilla del menú
// ================================================================
intenta('M', 'Menú', () => {
  const G = mundo().G, SUB = G.Mapas.SUB, S = G.Mapas.SEMILLA_MENU;
  let n = 0, w = 0, l = 0, rio = 0, puente = 0, vado = 0, puerto = 0, cresta = 0;
  const sitios = new Set();
  for (let y = -16; y <= 16; y++) for (let x = -21; x <= 21; x++) {
    const c = G.Mapas.codigo(x, y, S, null), k = c & 3, sb = c >> 2; n++;
    if (k === WALL) { w++; if (sb === SUB.CRESTA) cresta++; } else if (k === LIQ) { l++; if (sb >= SUB.RIO_H && sb <= SUB.RIO_D2) rio++; }
    if (sb === SUB.PUENTE) puente++; if (sb === SUB.VADO) vado++; if (sb === SUB.PUERTO) puerto++;
    const z = G.Mapas.sitio(x, y, S); if (z && z.m <= z.h) sitios.add(z.tipo + '@' + z.cx + ',' + z.cy);
  }
  const pw = 100 * w / n, pl = 100 * l / n;
  caso('M', `SEMILLA_MENU = ${S}: en ±21 × ±16, río con agua (${rio}), puente o vado (${puente}/${vado}), cresta (${cresta}) con puerto (${puerto}), un sitio (${[...sitios].join(' ')}), líquido ${f1(pl)} % (5-12) y pared ${f1(pw)} % (3-9)`,
    rio > 0 && (puente || vado) && puerto && cresta >= 8 && sitios.size >= 1 && pl >= 5 && pl <= 12 && pw >= 3 && pw <= 9);
});

// ================================================================
// N. Clima
// ================================================================
intenta('N', 'Clima', () => {
  const G = mundo().G, KINDS = ['sun', 'rain', 'sand', 'snow', 'fog'], rnd = Math.random, filas = [];
  let ok = true;
  try {
    for (let b = 0; b < 3; b++) {
      const r = rng(4242 + b); Math.random = r;
      const w = G.MapasDatos.CLIMA[b], tot = Object.values(w).reduce((x, y) => x + y, 0), cnt = {};
      for (let i = 0; i < 20000; i++) { const k = G.Mapas.climaAlAzar(b); cnt[k] = (cnt[k] || 0) + 1; }
      const malas = Object.keys(cnt).filter(k => !KINDS.includes(k) || !(k in w));
      const desvio = Math.max(...Object.keys(w).map(k => Math.abs((cnt[k] || 0) / 20000 - w[k] / tot)));
      ok = ok && !malas.length && desvio <= 0.03;
      filas.push(`bioma ${b}: ${JSON.stringify(cnt)} · desvío máximo ${f2(100 * desvio)} puntos`);
    }
    Math.random = rng(7);
    ok = ok && KINDS.includes(G.Mapas.climaAlAzar(5)) && KINDS.includes(G.Mapas.climaAlAzar(-1));
  } finally { Math.random = rnd; }
  caso('N', '20.000 tiradas por bioma con Math.random sembrado: claves de KINDS y frecuencias a ±3 puntos de los pesos', ok, filas.join('\n       '));
});

// ================================================================
// O. El bioma no cambia el terreno; el horno sigue a 0 chunks en el cambio
// ================================================================
intenta('O', 'Bioma', () => {
  const G = mundo().G, S = 1234;
  const firma = () => {
    let s = '';
    for (let ty = -40; ty < 40; ty++) for (let tx = -40; tx < 40; tx++) s += G.World.kindAt(tx * 32 + 16, ty * 32 + 16)[0];
    const cam = { x: 0, y: 0, w: 2560, h: 2560, left() { return -1280; }, top() { return -1280; }, sees: () => true };
    return s + '|' + G.World.visibleProps(cam).map(p => p.type + p.tx + ',' + p.ty + ':' + p.kind).join(',');
  };
  G.World.reset(S); G.World.setBiome(0, true); const f0 = firma();
  G.World.setBiome(1); const f1b = firma(); G.World.setBiome(2); const f2b = firma();
  G.World.reset(S); G.World.setBiome(2, true); const f2c = firma();
  caso('O', 'los códigos y los objetos son iguales en los 3 biomas (setBiome con y sin fundido, y empezando en otro)', f0 === f1b && f0 === f2b && f0 === f2c);
  // §16 D1 con los mapas: precalentado desde t % 240 = 237 y 0 chunks horneados en el cambio.
  const M = mundo({ horno: true }), H = M.G, hornos = [];
  const pinta = H.Tiles.paintChunk;
  H.Tiles.paintChunk = function (cx, cy) { const cv = pinta.apply(this, arguments); hornos.push(cx + ',' + cy); return cv; };
  const cam = { x: 300, y: 200, w: 768, h: 432, scale: 1, left() { return this.x - this.w / 2; }, top() { return this.y - this.h / 2; },
    sees(px, py, pad = 60) { return px > this.left() - pad && px < this.left() + this.w + pad && py > this.top() - pad && py < this.top() + this.h + pad; } };
  const ctx = { set imageSmoothingEnabled(v) {}, drawImage() {}, globalAlpha: 1 };
  const fotograma = () => { const a = hornos.length; H.World.drawGround(ctx, cam); H.Horno.tick(cam); M.reloj.t += 16.7; H.World.update(1 / 60, cam); return hornos.length - a; };
  H.Game.player = { x: 300, y: 200 };
  H.World.reset(S); H.World.setBiome(0, true);
  H.Game.st.time = 236.9; for (let i = 0; i < 80; i++) fotograma();
  H.Game.st.time = 237; for (let i = 0; i < 62; i++) fotograma();
  H.Game.st.time = 240; H.World.setBiome(1);
  const n = fotograma();
  caso('O', `horno con los mapas: precalentado y 0 chunks horneados en el fotograma del cambio de bioma (${n}; ${H.Horno.stats.precalentados} precalentados)`, n === 0 && H.Horno.stats.precalentados > 0);
});

const fallos = resultados.filter(r => !r.ok);
console.log(`\n${resultados.length - fallos.length} de ${resultados.length} bien${fallos.length ? ' · FALLAN: ' + fallos.map(r => r.id).join(', ') : ''}`);
process.exit(fallos.length ? 1 : 0);
