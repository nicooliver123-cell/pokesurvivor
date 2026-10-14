/* ============ tools/nico/relieve/alturas.js — el relieve a 8, 12 y 16 px, pegado a la cresta como deja la colisión ============
 *   cd tools/nico && node relieve/alturas.js [--puerto 8096] [--semilla 7]
 * En partida, world.js (collide) no deja que los pies de un Pokémon que anda se acerquen al borde norte de una pared a
 * menos de su radio (G.Sprites.bodyRadius: unos 9 px Pikachu, 14 Charmander): el techo subido sólo tapa lo que pasa de
 * ese radio. Pone a tu Pokémon (Charmander) y a un Pikachu salvaje lo más cerca que deja la colisión de una cresta fina,
 * con el juego en marcha unos fotogramas (la colisión los coloca), y saca un recorte con relieveAltura 0, 8, 12 y 16 a
 * 1440x900. Escribe tools/nico/out/relieve/altura-<h>.png y lamina-4-alturas.png (con laminas.py si hay Pillow).
 */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { startServer } = require('../serve.js');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const OUT = path.join(__dirname, '..', 'out', 'relieve');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PORT = +arg('--puerto', 8096), SEMILLA = +arg('--semilla', 7);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SIN_NUBE = () => { window.G = window.G || {}; Object.defineProperty(window.G, 'FIREBASE_CONFIG', { get: () => null, set() {}, configurable: true, enumerable: true }); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await startServer(ROOT, PORT);
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', locale: 'es-ES' });
    await ctx.addInitScript(SIN_NUBE);
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/dev.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => document.getElementById('boot').classList.contains('hidden'), null, { timeout: 30000 });
    if (await page.locator('#tap-start').isVisible().catch(() => false)) await page.click('#tap-start');
    await page.locator('#btn-guest').click();
    await page.waitForFunction(() => ['scr-starters', 'scr-menu'].some(id => !document.getElementById(id).classList.contains('hidden')));
    if (await page.locator('#scr-starters.sin-test').isVisible().catch(() => false)) { await page.locator('#starter-grid .ec-celda').nth(1).click(); await page.click('#ec-ok'); }
    await page.locator('#scr-menu').waitFor({ state: 'visible' });
    await page.evaluate(() => { G.Settings.set('quality', 'high'); G.Estilo.set('dex'); G.Flow.play(); });
    await sleep(1500);
    const info = await page.evaluate(async semilla => {
      const W = G.World, TS = W.TS, pl = G.Game.player, k = (tx, ty) => W.kindAt(tx * TS + 16, ty * TS + 16);
      for (const x of document.querySelectorAll('.ach-pop, .toast')) x.remove();
      pl.hurt = function () {}; G.Spawner.update = () => {}; G.Combat.tick = () => {};
      G.EnemyMgr.clear(); G.Projectiles.clear(); G.FX.clear(); G.Hazards.clear(); G.Weather.clear();
      W.reset(semilla); W.setBiome(0, true);
      let s = null;
      for (let r = 6; r < 200 && !s; r++) for (let a = 0; a < 6.283 && !s; a += 0.05) {
        const tx = Math.round(Math.cos(a) * r), ty = Math.round(Math.sin(a) * r);
        let ok = true;
        for (let i = -3; i <= 3 && ok; i++) { if (k(tx + i, ty) !== 'wall' || k(tx + i, ty - 1) !== 'floor' || k(tx + i, ty - 2) !== 'floor' || k(tx + i, ty + 1) !== 'floor') ok = false; }
        if (ok) s = { tx, ty };
      }
      const y0 = s.ty * TS;
      const e = new G.Enemy({ dex: 25, hp: 9999, spd: 0, dmg: 0, xp: 0, behavior: 'melee' }, s.tx * TS + 16 - 60, y0 - 1, { hp: 1, spd: 1, dmg: 1 }, false);
      e.spd = 0; e.dmg = 0; G.EnemyMgr.add(e);
      // Contra la pared: los pies, 1 px dentro; el juego en marcha unos fotogramas y la colisión los saca a su radio.
      pl.x = s.tx * TS + 16; pl.y = y0 - 1; G.Camera.x = pl.x; G.Camera.y = pl.y;
      for (let i = 0; i < 20; i++) { pl.y = Math.max(pl.y, y0 - 1); await new Promise(r => requestAnimationFrame(r)); }
      for (let i = 0; i < 10; i++) await new Promise(r => requestAnimationFrame(r));
      if (G.Game.state === 'playing') G.Game.togglePause();
      G.UI.hideAll(); G.FX.clear();
      return { radio: pl.r, hueco: +(y0 - pl.y).toFixed(1), radioPikachu: e.r, huecoPikachu: +(y0 - e.y).toFixed(1), x: pl.x, y: pl.y };
    }, SEMILLA);
    console.log('[INFO] pegados a la cresta:', JSON.stringify(info));
    for (const h of [0, 8, 12, 16]) {
      await page.evaluate(h => { G.MODS.relieveAltura = h; if (G.Horno) G.Horno.rehornear(); }, h);
      await page.evaluate(async () => { for (let i = 0; i < 300 && G.Horno && G.Horno.conViejas; i++) await new Promise(r => requestAnimationFrame(r)); for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r)); });
      const c = await page.evaluate(() => { const cam = G.Camera, p = G.Game.player; return { x: (p.x - cam.left()) * cam.scale, y: (p.y - cam.top()) * cam.scale }; });
      await page.screenshot({ path: path.join(OUT, `altura-${h}.png`), clip: { x: Math.max(0, c.x - 200), y: Math.max(0, c.y - 150), width: 400, height: 220 } });
    }
    fs.writeFileSync(path.join(OUT, 'alturas.json'), JSON.stringify(info, null, 1));
  } finally { await browser.close(); srv.close(); }
})().catch(e => { console.error(e); process.exit(1); });
