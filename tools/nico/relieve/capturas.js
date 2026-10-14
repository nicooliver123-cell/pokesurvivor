/* ============ tools/nico/relieve/capturas.js — capturas antes/después del relieve y la luz ============
 *   cd tools/nico && node relieve/capturas.js [--puerto 8097] [--semilla 1234] [--headed]
 * PROTOTIPO de la 2.5D falsa (PLAN.md, punto 10): para que Nico decida. Entra de invitado en dev.html (modo local, sin
 * nube, como estilo-e2e.js), monta dos escenas quietas y saca cada una sin y con el relieve y la luz (G.MODS.relieveAltura
 * y G.MODS.luz, cambiados en caliente), con Calidad Alta, en Dex y en Clásico a 1440x900 y en Dex en un móvil (844x390 a
 * dpr 3):
 *   cresta   Vega del Alba: una cresta de pared con tu Pokémon justo al norte (detrás), un Pokémon salvaje delante y
 *            otro detrás, y tres bolas de fuego tuyas quietas al lado (luz de los ataques).
 *   acido    Vega Sulfúrea: un río de ácido, tres disparos eléctricos tuyos y un aviso de zona de un enemigo encima (que
 *            no se oscurece); si hay un tótem cerca, a la vista.
 * Escribe tools/nico/out/relieve/<escena>-<estilo>-<pantalla>-{antes,despues}.png, un recorte ×2 alrededor de tu Pokémon
 * y una hoja (indice.html). También mide el coste por fotograma del relieve y de la luz (G.Relieve.escena y G.Luz.pintar).
 */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { startServer } = require('../serve.js');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const OUT = path.join(__dirname, '..', 'out', 'relieve');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PORT = +arg('--puerto', 8097);
const SEMILLA = +arg('--semilla', 1234);
const ALTURA = 12;                      // la de js/core/mods.js (relieveAltura)   // el mundo de las capturas (el mismo en todas las pantallas)
const BASE = `http://127.0.0.1:${PORT}/dev.html`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SIN_NUBE = () => {
  window.G = window.G || {};
  Object.defineProperty(window.G, 'FIREBASE_CONFIG', { get: () => null, set() {}, configurable: true, enumerable: true });
};

async function entrar(page) {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('boot') && document.getElementById('boot').classList.contains('hidden'), null, { timeout: 30000 });
  await sleep(200);
  if (await page.locator('#tap-start').isVisible().catch(() => false)) await page.click('#tap-start');
  await page.locator('#btn-guest').click();
  await page.waitForFunction(() => ['scr-starters', 'scr-test', 'scr-menu'].some(id => !document.getElementById(id).classList.contains('hidden')), null, { timeout: 15000 });
  if (await page.locator('#scr-starters.sin-test').isVisible().catch(() => false)) {
    await page.locator('#starter-grid .ec-celda').nth(1).click();
    await page.click('#ec-ok');
  }
  await page.locator('#scr-menu').waitFor({ state: 'visible', timeout: 15000 });
  // Calidad Alta en las dos (la luz sólo va con Alta; en un móvil, la automática se queda en Media).
  await page.evaluate(() => { G.Settings.set('quality', 'high'); G.Flow.play(); });
  await page.waitForFunction(() => G.Game.state === 'playing' && G.Game.player, null, { timeout: 15000 });
  await sleep(1500);
}

/** Una cresta: una fila de ≥ 6 paredes seguidas con suelo en las 3 filas de encima y en la de debajo. Pone a tu Pokémon
 *  con los pies 6 px al norte de su borde (detrás), un salvaje delante y otro detrás, y bolas de fuego tuyas al lado. */
const ESCENA_CRESTA = () => {
  const W = G.World, TS = W.TS, pl = G.Game.player, k = (tx, ty) => W.kindAt(tx * TS + 16, ty * TS + 16);
  for (const x of document.querySelectorAll('.ach-pop, .toast')) x.remove();
  pl.hurt = function () {};
  G.Spawner.update = () => {};
  G.Combat.tick = () => {};                  // tu Pokémon no ataca: sin números de daño en las capturas
  G.EnemyMgr.clear(); G.Projectiles.clear(); G.FX.clear(); G.Hazards.clear(); G.Pickups.clear && G.Pickups.clear();
  let sitio = null;
  // Una cresta de 1 a 3 casillas de grueso (5 columnas seguidas con suelo en las 2 filas de encima y suelo debajo de la
  // cresta), para que se vea la cara al lado de tu Pokémon; si no hay, la de 4 a 6.
  const grueso = (tx, ty) => { let d = 0; while (d < 8 && k(tx, ty + d) === 'wall') d++; return k(tx, ty + d) === 'floor' ? d : 99; };
  for (const max of [3, 6]) for (let r = 6; r < 200 && !sitio; r += 1) for (let a = 0; a < 6.283 && !sitio; a += 0.05) {
    const tx = Math.round(Math.cos(a) * r), ty = Math.round(Math.sin(a) * r);
    let ok = true, g = [];
    for (let i = -2; i <= 2 && ok; i++) {
      for (let j = 1; j <= 2 && ok; j++) if (k(tx + i, ty - j) !== 'floor') ok = false;
      const d = ok ? grueso(tx + i, ty) : 99;
      if (d < 1 || d > max) ok = false; else g.push(d);
    }
    if (ok) sitio = { tx, ty, grueso: g };
  }
  if (!sitio) return null;
  const x = sitio.tx * TS + 16, yPared = sitio.ty * TS;
  pl.x = x; pl.y = yPared - 6;
  const enemigo = (dex, ex, ey) => {
    const e = new G.Enemy({ dex, hp: 9999, spd: 0, dmg: 0, xp: 0, behavior: 'melee' }, ex, ey, { hp: 1, spd: 1, dmg: 1 }, false);
    e.spd = 0; e.dmg = 0; G.EnemyMgr.add(e); return e;
  };
  enemigo(1, x + 2 * TS, (sitio.ty + sitio.grueso[4]) * TS + 18);    // delante de la cresta, en el suelo de debajo
  enemigo(25, x - 2 * TS, yPared - 4);                                 // detrás, como tu Pokémon
  for (const [dx, dy] of [[-150, -60], [120, -50]]) {
    G.Projectiles.spawn({ x: x + dx, y: yPared + dy, vx: 0, vy: 0, dmg: 0, r: 7, life: 9999, color: '#ff8a2a', vis: G.VFX.forType('fire'), friendly: true });
  }
  G.Projectiles.spawn({ x: x + 3 * TS, y: (sitio.ty + sitio.grueso[4]) * TS + 60, vx: 0, vy: 0, dmg: 0, r: 7, life: 9999, color: '#ff8a2a', vis: G.VFX.forType('fire'), friendly: true });
  G.Camera.x = x; G.Camera.y = yPared + 24;
  return sitio;
};

/** Ácido: una casilla de suelo con ≥ 10 de ácido alrededor (en la Vega Sulfúrea), con tres disparos eléctricos tuyos y un
 *  aviso de zona encima; y el tótem más cercano, si hay alguno a menos de 6 casillas. */
const ESCENA_ACIDO = () => {
  const W = G.World, TS = W.TS, pl = G.Game.player;
  G.EnemyMgr.clear(); G.Projectiles.clear(); G.FX.clear(); G.Hazards.clear();
  let sitio = null;
  for (let r = 4; r < 140 && !sitio; r += 1) for (let a = 0; a < 6.283 && !sitio; a += 0.08) {
    const tx = Math.round(Math.cos(a) * r), ty = Math.round(Math.sin(a) * r);
    if (W.kindAt(tx * TS + 16, ty * TS + 16) !== 'floor') continue;
    let l = 0, p = 0;
    for (let j = -5; j <= 5; j++) for (let i = -9; i <= 9; i++) { const kk = W.kindAt((tx + i) * TS + 16, (ty + j) * TS + 16); if (kk === 'liquid') l++; else if (kk === 'wall') p++; }
    if (l >= 22 && p >= 4) sitio = { tx, ty, l, p };
  }
  if (!sitio) return null;
  const x = sitio.tx * TS + 16, y = sitio.ty * TS + 16;
  pl.x = x; pl.y = y;
  for (const [dx, dy] of [[-90, -30], [80, -60], [40, 70]]) {
    G.Projectiles.spawn({ x: x + dx, y: y + dy, vx: 0, vy: 0, dmg: 0, r: 7, life: 9999, color: '#ffd21a', vis: G.VFX.forType('electric'), friendly: true });
  }
  G.Hazards.add({ kind: 'zone', x: x - 150, y: y + 40, r: 56, delay: 9999, dmg: 0, type: 'poison', color: '#c04bff', t: 9999 * 0.8 }, true);
  G.Camera.x = x; G.Camera.y = y;
  const tot = [];
  for (const q of W.visibleProps(G.Camera)) if (q.type === 'altar') tot.push(q);
  return Object.assign(sitio, { totems: tot.length });
};

/** Coste por fotograma (ms) del relieve y de la luz: 120 fotogramas con el juego en marcha. */
const COSTE = async () => {
  const fr = () => new Promise(r => requestAnimationFrame(r));
  const medir = (o, k) => { const f = o[k], m = []; o[k] = function () { const t0 = performance.now(); const r = f.apply(this, arguments); m.push(performance.now() - t0); return r; }; return () => { o[k] = f; return m; }; };
  const a = medir(G.Relieve, 'escena'), b = medir(G.Luz, 'pintar');
  for (let i = 0; i < 120; i++) await fr();
  const ma = a(), mb = b(), med = l => { const s = l.slice().sort((x, y) => x - y); return +(s[s.length >> 1] || 0).toFixed(3); }, max = l => +Math.max(0, ...l).toFixed(3);
  return { relieve: { mediana: med(ma), max: max(ma), n: ma.length }, luz: { mediana: med(mb), max: max(mb), n: mb.length } };
};

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await startServer(ROOT, PORT);
  const browser = await chromium.launch({ headless: !process.argv.includes('--headed') });
  const filas = [], medidas = {};
  try {
    for (const [nv, v, estilos] of [['1440x900', { w: 1440, h: 900, dpr: 1 }, ['dex', 'clasico']], ['844x390@3', { w: 844, h: 390, dpr: 3, tactil: true }, ['dex']]]) {
      const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dpr, hasTouch: !!v.tactil, isMobile: !!v.tactil, serviceWorkers: 'block', locale: 'es-ES' });
      await ctx.addInitScript(SIN_NUBE);
      const page = await ctx.newPage(), errores = [];
      page.on('pageerror', e => errores.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
      await entrar(page);
      await page.evaluate(s => G.World.reset(s), SEMILLA);
      for (const [escena, bioma, fn] of [['cresta', 0, ESCENA_CRESTA], ['acido', 2, ESCENA_ACIDO]]) {
        await page.evaluate(b => { G.World.setBiome(b, true); G.Weather.clear(); }, bioma);
        const sitio = await page.evaluate(fn);
        console.log(`[INFO] ${nv} ${escena}: ${JSON.stringify(sitio)}`);
        if (!sitio) continue;
        await sleep(400);
        if (escena === 'cresta') medidas[nv] = await page.evaluate(COSTE);
        await page.evaluate(() => { if (G.Game.state === 'playing') G.Game.togglePause(); G.UI.hideAll(); G.FX.clear(); });
        for (const est of estilos) {
          await page.evaluate(e => G.Estilo.set(e), est);
          // Antes: sin relieve, luz ni sombras y, en Clásico, con el mundo del proyecto base (mundoDex = false), como era.
          for (const [cuando, on] of [['antes', false], ['despues', true]]) {
            await page.evaluate(([on, A]) => {
              Object.assign(G.MODS, { relieveAltura: on ? A : 0, luz: on, sombras: on, mundoDex: on });
              G.Tiles.clearProps && G.Tiles.clearProps();
              if (G.Horno) G.Horno.rehornear(); else G.World.rehornear();
            }, [on, ALTURA]);
            await page.evaluate(async () => {
              for (let i = 0; i < 300 && G.Horno && G.Horno.conViejas; i++) await new Promise(r => requestAnimationFrame(r));
              for (let i = 0; i < 8; i++) await new Promise(r => requestAnimationFrame(r));
            });
            const base = `${escena}-${est}-${nv}-${cuando}`;
            await page.locator('#game').screenshot({ path: path.join(OUT, base + '.png') });
            // Recorte ×2 alrededor de tu Pokémon (en píxeles CSS de la ventana).
            const c = await page.evaluate(() => { const cam = G.Camera, p = G.Game.player, k = cam.scale; return { x: (p.x - cam.left()) * k, y: (p.y - cam.top()) * k }; });
            const w = Math.min(v.w, 480), h = Math.min(v.h, 300);
            const clip = { x: Math.max(0, Math.min(v.w - w, c.x - w / 2)), y: Math.max(0, Math.min(v.h - h, c.y - h * 0.55)), width: w, height: h };
            await page.screenshot({ path: path.join(OUT, base + '-recorte.png'), clip });
            filas.push({ escena, est, nv, cuando, f: base + '.png', r: base + '-recorte.png' });
          }
        }
        await page.evaluate(A => { Object.assign(G.MODS, { relieveAltura: A, luz: true, sombras: true, mundoDex: true }); if (G.Game.state === 'paused') G.Game.togglePause(); }, ALTURA);
      }
      if (errores.length) console.log(`[AVISO] ${nv}: errores en la página: ${errores.slice(0, 5).join(' | ')}`);
      await ctx.close();
    }
  } finally {
    await browser.close();
    srv.close();
  }
  console.log('[INFO] coste por fotograma (ms):', JSON.stringify(medidas));
  const grupos = {};
  for (const f of filas) (grupos[`${f.escena} · ${f.est} · ${f.nv}`] = grupos[`${f.escena} · ${f.est} · ${f.nv}`] || {})[f.cuando] = f;
  const html = Object.entries(grupos).map(([k, g]) => `<h2>${k}</h2><div class="par">${['antes', 'despues'].map(c => g[c] ? `<figure><figcaption>${c === 'antes' ? 'Antes' : 'Después'}</figcaption><a href="${g[c].f}"><img src="${g[c].f}"></a><a href="${g[c].r}"><img class="rec" src="${g[c].r}"></a></figure>` : '').join('')}</div>`).join('\n');
  fs.writeFileSync(path.join(OUT, 'indice.html'), `<!doctype html><meta charset="utf-8"><title>Relieve y luz: antes y después</title>
<style>body{font:14px system-ui;background:#111;color:#eee;margin:16px}.par{display:flex;gap:12px;flex-wrap:wrap}figure{margin:0}img{width:640px;display:block;image-rendering:pixelated}img.rec{width:640px;margin-top:6px}figcaption{font-weight:700;margin:4px 0}</style>
<h1>Relieve (paredes con altura) y búfer de luz: antes y después</h1><p>${new Date().toISOString()} · coste por fotograma: ${JSON.stringify(medidas)}</p>${html}`);
  console.log('[INFO] hoja: ' + path.join(OUT, 'indice.html'));
})().catch(e => { console.error(e); process.exit(1); });
