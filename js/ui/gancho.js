/* ============ gancho.js — máquina de gancho del gacha (MOD nico) ============
 * Sustituye a la tragaperras de upstream (js/ui/slots.js) con G.MODS.maquinaGancho: un gancho
 * coge Poké Balls de un montón y las suelta por la trampilla. Mismo contrato que G.Slots:
 * play(canvas, resultados) -> Promise; se pinta en el mismo <canvas id="slot"> de 176×170 a
 * resolución de arte, sin suavizado, así que la maquetación y el CSS no cambian.
 *
 *   el gancho va hasta la bola de la rareza que ha salido (Poké, Super, Ultra, Lujo y Master
 *   Ball, como G.Icons.RARITY_BALL), baja, la coge, sube, la lleva a la trampilla y la suelta
 *   en la bandeja. Si es Épica, Legendaria o shiny, sube despacio, se tambalea y las luces se
 *   vuelven locas. Un shiny es la bola de su rareza con centelleo y una estrellita.
 *   La ×10 son 10 cogidas rápidas; cada premio cae a la bandeja.
 *
 * Un clic acelera la animación. Gancho en gacha-ui.js (pull). Sin este fichero o con
 * maquinaGancho = false, la tragaperras de upstream.
 */
G.Gancho = (() => {
  const W = 176, H = 170, BALL = 12;
  const SYM = G.Icons.RARITY_BALL;
  // Lo que se ve en el montón (el premio lo decide gacha.js, no esto): sobre todo Poké y Super Balls.
  const MONTON = ['ball', 'ball', 'ball', 'ball2', 'ball2', 'ball3', 'ball', 'ball2', 'ballLux', 'ball3', 'ball', 'ball4'];
  const VIDRIO = { x: 23, y: 41, w: 116, h: 72 };
  const SUELO = VIDRIO.y + VIDRIO.h - 1;                  // y del suelo del vidrio
  const TRAMPILLA = { x: 25, w: 24 };                     // hueco de la izquierda, por donde cae el premio
  const RIEL_Y = 44, GANCHO_Y0 = 52, CASA_X = TRAMPILLA.x + TRAMPILLA.w / 2;
  // Huecos del montón: fila de abajo y fila de arriba (x, y de la esquina del icono de 12).
  const HUECOS = [];
  for (let k = 0; k < 7; k++) HUECOS.push({ x: 55 + k * 12, y: SUELO - BALL, fila: 0 });
  for (let k = 0; k < 6; k++) HUECOS.push({ x: 61 + k * 12, y: SUELO - BALL * 2 + 2, fila: 1 });
  const ARRIBA = HUECOS.map((h, i) => i).filter(i => HUECOS[i].fila === 1);
  const C = {
    body: '#2f6fd0', bodyD: '#1d4790', bodyL: '#5c97ef', trim: '#ffd23f', trimD: '#c08a10',
    dark: '#1b1528', glass: '#0d1230', glassL: '#1a2450', chrome: '#c9d2de', chromeD: '#7d8899',
    led: '#2a0f14', bulbOn: '#ffe9a0', bulbOff: '#6b4a20', floor: '#3a2a52', wall: '#8fb4ff'
  };

  let cv = null, ctx = null, st = null, raf = 0, last = 0, fast = false;

  const bolaDe = r => SYM[r.rarity] || 'ball';
  const colOf = r => (r.shiny ? '#9ae6ff' : G.Gacha.RARITY_COLOR[r.rarity]);
  const azar = a => a[Math.floor(Math.random() * a.length)];

  function wait(s) {
    return new Promise(res => {
      const end = performance.now() + s * 1000 * (fast ? 0.25 : 1);
      (function chk() { if (performance.now() >= end || !st) res(); else setTimeout(chk, 16); })();
    });
  }

  function tween(set, a, b, dur) {
    return new Promise(res => {
      const t0 = performance.now(), d = Math.max(1, dur * 1000 * (fast ? 0.25 : 1));
      (function step() {
        const k = Math.min(1, (performance.now() - t0) / d);
        set(a + (b - a) * (k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k)));
        if (k < 1 && st) requestAnimationFrame(step); else res();
      })();
    });
  }

  /** Anima las tiradas. → Promise que se resuelve al terminar. */
  async function play(canvas, results) {
    cv = canvas; ctx = cv.getContext('2d');
    fast = false;
    cv.onclick = () => { fast = true; };
    const ten = results.length === 10;
    st = {
      t: 0, x: CASA_X, y: GANCHO_Y0, abierto: 0.4, vaiven: 0, palanca: 0, boton: 0,
      monton: HUECOS.map(() => ({ sym: azar(MONTON), pop: 0 })), cogida: null, cayendo: [],
      ten, tray: [], led: ten ? 'TIRADA ×10' : '¡SUERTE!', ledCol: C.bulbOn, win: null, frenzy: 0, sparks: []
    };
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);

    const v = ten ? 0.22 : 1;                              // la ×10, mucho más rápida
    for (let i = 0; i < results.length; i++) {
      const r = results[i], big = r.rarity >= 4 || r.shiny;
      if (ten) st.led = 'TIRADA ' + (i + 1) + '/10';
      // La bola del premio, en un hueco de arriba al azar.
      const h = azar(ARRIBA), hueco = HUECOS[h];
      st.monton[h] = { sym: bolaDe(r), pop: 0, shiny: r.shiny };
      const bx = hueco.x + BALL / 2;
      G.Audio.sfx('ball');
      // Al sitio, con la palanca inclinada hacia donde va.
      st.palanca = Math.sign(bx - st.x);
      await tween(x => { st.x = x; }, st.x, bx, (0.35 + Math.abs(bx - st.x) / 160) * v);
      st.palanca = 0;
      // Botón: baja abierto, cierra y la coge.
      st.boton = 1;
      await tween(a => { st.abierto = a; }, st.abierto, 1, 0.12 * v);
      await tween(y => { st.y = y; }, GANCHO_Y0, hueco.y - 3, 0.5 * v);
      await tween(a => { st.abierto = a; }, 1, 0, 0.18 * v);
      st.boton = 0;
      G.Audio.sfx('shake');
      st.cogida = { sym: st.monton[h].sym, shiny: r.shiny };
      st.monton[h] = { sym: null, pop: 0 };
      if (big) {
        // Suspense: sube despacio, se tambalea y las luces parpadean.
        st.frenzy = 1;
        st.led = r.shiny ? '¡¿SHINY?!' : r.rarity === 5 ? '¡¿LEGENDARIO?!' : '¡¿ÉPICO?!';
        st.ledCol = colOf(r);
        st.vaiven = 1;
      }
      await tween(y => { st.y = y; }, hueco.y - 3, GANCHO_Y0, (big ? 1.1 : 0.45) * v);
      // A la trampilla.
      st.palanca = -1;
      await tween(x => { st.x = x; }, bx, CASA_X, (big ? 0.9 : 0.35 + (bx - CASA_X) / 160) * v);
      st.palanca = 0;
      st.vaiven = 0;
      st.frenzy = 0;
      // La suelta: cae por la trampilla a la bandeja.
      await tween(a => { st.abierto = a; }, 0, 1, 0.12 * v);
      st.cayendo.push({ sym: st.cogida.sym, shiny: st.cogida.shiny, x: CASA_X - BALL / 2, y: st.y + 2, vy: 0, n: i });
      st.cogida = null;
      st.monton[h] = { sym: azar(MONTON), pop: 1 };       // el montón se rellena
      await wait((ten ? 0.18 : 0.35));
      // Premio.
      st.win = { col: colOf(r), t: 0 };
      st.led = (r.shiny ? 'SHINY · ' : '') + G.Gacha.RARITY_NAME[r.rarity].toUpperCase();
      st.ledCol = colOf(r);
      G.Audio.sfx('reveal', { rarity: r.rarity });
      if (r.rarity === 5) G.Audio.sfx('legend');
      if (r.shiny) G.Audio.sfx('shiny');
      if (big) burst(colOf(r), r.rarity === 5 || r.shiny ? 60 : 30);
      await wait(ten ? (big ? 0.6 : 0.15) : 0.8);
      await tween(a => { st.abierto = a; }, 1, 0.4, 0.1 * v);
    }
    await wait(0.4);
    stopAll();
  }

  function stopAll() { cancelAnimationFrame(raf); st = null; if (cv) cv.onclick = null; }

  function burst(col, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.2832, s = 30 + Math.random() * 70;
      st.sparks.push({ x: W / 2, y: 128, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, t: 0, life: 0.6 + Math.random() * 0.6,
                       col: Math.random() < 0.5 ? col : '#ffffff' });
    }
  }

  // ---------------- dibujo ----------------

  const BANDEJA = { x: 28, y: 138, w: 106, h: 18 };

  function frame(now) {
    if (!st) return;
    const dt = Math.min(0.05, (now - last) / 1000) * (fast ? 2 : 1);
    last = now;
    st.t += dt;
    if (st.win) st.win.t += dt;
    for (const m of st.monton) if (m.pop > 0) m.pop = Math.max(0, m.pop - dt * 4);
    // Lo que cae por la trampilla: dentro del vidrio y, al salir por abajo, a la bandeja.
    for (const b of st.cayendo) {
      b.vy += 500 * dt; b.y += b.vy * dt;
      if (b.y > SUELO + 4) {
        b.fuera = true;
        const n = st.ten ? 10 : 1, size = BALL;
        const x = n === 1 ? BANDEJA.x + BANDEJA.w / 2 - size / 2 : BANDEJA.x + 1 + b.n * 10.3;
        st.tray.push({ sym: b.sym, shiny: b.shiny, x, size, y: BANDEJA.y - size, vy: 40, done: false });
      }
    }
    st.cayendo = st.cayendo.filter(b => !b.fuera);
    const suelo = BANDEJA.y + BANDEJA.h - 2;
    for (const b of st.tray) if (!b.done) {
      b.vy += 400 * dt; b.y += b.vy * dt;
      if (b.y >= suelo - b.size) { b.y = suelo - b.size; b.vy *= -0.35; if (Math.abs(b.vy) < 20) b.done = true; }
    }
    for (const p of st.sparks) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; }
    st.sparks = st.sparks.filter(p => p.t < p.life);
    draw();
    raf = requestAnimationFrame(frame);
  }

  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    const t = st.t;

    // --- mueble ---
    R(10, 30, 142, 134, C.dark);
    R(11, 31, 140, 132, C.body);
    R(11, 31, 6, 132, C.bodyL); R(145, 31, 6, 132, C.bodyD);
    R(11, 157, 140, 6, C.bodyD);
    R(10, 164, 142, 3, C.dark);

    // --- cartel con bombillas ---
    R(14, 4, 134, 28, C.dark);
    R(15, 5, 132, 26, C.trimD);
    R(18, 8, 126, 20, C.led);
    const winCol = st.win && st.win.t < 1.5 && Math.floor(st.win.t * 8) % 2 === 0 ? st.win.col : null;
    let i = 0;
    for (let x = 16; x < 146; x += 7) { bulb(x, 5, i++, winCol); bulb(x, 29, i++, winCol); }
    for (let y = 12; y < 28; y += 7) { bulb(15, y, i++, winCol); bulb(146, y, i++, winCol); }
    ctx.font = '700 12px Pixelify,"Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = C.dark; ctx.fillText('POKé GANCHO', W / 2 + 1, 23);
    ctx.fillStyle = C.trim; ctx.fillText('POKé GANCHO', W / 2, 22);

    // --- vitrina ---
    const V = VIDRIO;
    R(V.x - 3, V.y - 3, V.w + 6, V.h + 6, C.dark);
    R(V.x - 2, V.y - 2, V.w + 4, V.h + 4, C.trimD);
    R(V.x, V.y, V.w, V.h, C.glass);
    R(V.x, SUELO - 3, V.w, 4, C.floor);
    // Trampilla: un hueco negro con su pared de cristal.
    R(TRAMPILLA.x, SUELO - 3, TRAMPILLA.w, 4, '#000');
    R(TRAMPILLA.x + TRAMPILLA.w, SUELO - 16, 2, 16, C.wall);
    ctx.globalAlpha = 0.5; R(TRAMPILLA.x + TRAMPILLA.w + 2, SUELO - 16, 1, 16, '#ffffff'); ctx.globalAlpha = 1;
    // El montón: primero la fila de abajo y luego la de arriba.
    HUECOS.forEach((h, k) => {
      const m = st.monton[k];
      if (!m.sym) return;
      const dy = m.pop > 0 ? -Math.round(Math.sin(m.pop * Math.PI) * 4) : 0;
      G.Icons.draw(ctx, m.sym, h.x, h.y + dy, BALL);
      if (m.shiny) brillo(h.x + BALL / 2, h.y + dy + BALL / 2, k);
    });
    // Riel, carro, cable y gancho.
    const sway = st.vaiven ? Math.round(Math.sin(t * 18) * 2) : 0;
    const gx = Math.round(st.x) + sway, gy = Math.round(st.y);
    R(V.x, RIEL_Y - 2, V.w, 3, C.chromeD);
    R(V.x, RIEL_Y - 2, V.w, 1, C.chrome);
    R(Math.round(st.x) - 5, RIEL_Y - 3, 10, 5, C.dark);
    R(Math.round(st.x) - 4, RIEL_Y - 2, 8, 3, C.chrome);
    ctx.strokeStyle = C.chrome; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(Math.round(st.x) + 0.5, RIEL_Y + 1); ctx.lineTo(gx + 0.5, gy - 3); ctx.stroke();
    if (st.cogida) {
      G.Icons.draw(ctx, st.cogida.sym, gx - BALL / 2, gy + 1, BALL);
      if (st.cogida.shiny) brillo(gx, gy + 1 + BALL / 2, 99);
    }
    drawGarra(gx, gy, st.abierto);
    // Lo que cae por la trampilla.
    for (const b of st.cayendo) G.Icons.draw(ctx, b.sym, b.x, b.y, BALL);
    // Reflejo del cristal.
    ctx.globalAlpha = 0.12;
    R(V.x + 4, V.y + 2, 3, V.h - 8, '#ffffff'); R(V.x + 9, V.y + 2, 1, V.h - 8, '#ffffff');
    ctx.globalAlpha = 1;
    if (st.win && st.win.t < 1.2 && Math.floor(st.win.t * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = st.win.col; ctx.lineWidth = 2;
      ctx.strokeRect(V.x - 1, V.y - 1, V.w + 2, V.h + 2);
      ctx.globalAlpha = 1;
    }

    // --- marcador ---
    R(36, 119, 90, 16, C.dark);
    R(37, 120, 88, 14, C.led);
    ctx.font = '700 8px Pixelify,"Segoe UI",sans-serif';
    ctx.fillStyle = st.ledCol || C.bulbOn;
    if (!st.frenzy || Math.floor(t * 10) % 2 === 0) ctx.fillText(st.led, 81, 130);
    // Botón de bajar el gancho (se hunde al pulsarlo).
    const by = st.boton ? 2 : 0;
    R(130, 122 + by, 10, 8 - by, '#ff4d4d'); R(130, 130, 10, 2, '#a52a2a'); R(132, 123 + by, 3, 2, '#ffd0d0');
    R(22, 121, 8, 6, '#5fe08a'); R(22, 127, 8, 2, '#2f9a52');

    // --- bandeja ---
    R(BANDEJA.x - 2, BANDEJA.y - 2, BANDEJA.w + 4, BANDEJA.h + 4, C.dark);
    R(BANDEJA.x, BANDEJA.y, BANDEJA.w, BANDEJA.h, '#0a0712');
    R(BANDEJA.x, BANDEJA.y + BANDEJA.h - 2, BANDEJA.w, 2, C.chromeD);
    st.tray.forEach((b, k) => {
      G.Icons.draw(ctx, b.sym, b.x, Math.round(b.y), b.size);
      if (b.shiny) {
        G.Icons.draw(ctx, 'shiny', b.x + b.size - 5, Math.round(b.y) - 3, 8);
        brillo(b.x + b.size / 2, b.y + b.size / 2, k + 20);
      }
    });

    // --- palanca de mando, a la derecha (se inclina hacia donde va el gancho) ---
    R(152, 96, 14, 10, C.dark);
    R(153, 97, 12, 8, C.chromeD); R(153, 97, 12, 2, C.chrome);
    const kx = 159 + st.palanca * 4;
    ctx.strokeStyle = C.chromeD; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(159, 97); ctx.lineTo(kx, 84); ctx.stroke();
    disc(kx, 82, 5, C.dark); disc(kx, 82, 4, '#ff4d4d'); R(kx - 2, 79, 2, 2, '#ffd0d0');

    // --- chispas del premio ---
    for (const p of st.sparks) R(Math.round(p.x), Math.round(p.y), 2, 2, p.col);
  }

  /** El gancho: un cubo y dos garras que se abren (abierto 0..1) hacia los lados. */
  function drawGarra(x, y, abierto) {
    R(x - 4, y - 4, 8, 4, C.dark);
    R(x - 3, y - 3, 6, 2, C.chrome);
    const a = Math.round(abierto * 4);
    for (const s of [-1, 1]) {
      const bx = x + s * (3 + a);
      // Brazo: baja en diagonal hacia fuera y la punta vuelve hacia dentro.
      ctx.strokeStyle = C.dark; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x + s * 2, y); ctx.lineTo(bx + s * 2, y + 6); ctx.lineTo(bx - s, y + 12); ctx.stroke();
      ctx.strokeStyle = C.chrome; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + s * 2, y); ctx.lineTo(bx + s * 2, y + 6); ctx.lineTo(bx - s, y + 12); ctx.stroke();
    }
  }

  /** Centelleo de shiny sobre una bola (el de G.Icons, con fase propia por bola). */
  function brillo(cx, cy, k) {
    const ph = (st.t * 0.9 + k * 0.37) % 1;
    G.Icons.twinkle(ctx, cx + (k % 2 ? 5 : -5), cy - 5, ph, 1);
  }

  function bulb(x, y, i, winCol) {
    const on = st.frenzy ? Math.floor(st.t * 14 + i) % 2 === 0 : Math.floor(st.t * 4 + i) % 3 !== 0;
    R(x, y, 3, 3, winCol || (on ? C.bulbOn : C.bulbOff));
  }

  function disc(cx, cy, r, col) {
    ctx.fillStyle = col;
    for (let y = -r; y <= r; y++) {
      const w = Math.round(Math.sqrt(r * r - y * y));
      ctx.fillRect(Math.round(cx) - w, Math.round(cy) + y, w * 2, 1);
    }
  }

  return { play, stop: stopAll };
})();
