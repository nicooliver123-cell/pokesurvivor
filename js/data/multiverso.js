/* ============ multiverso.js — personajes de otras franquicias (MOD nico) ============
 * La generación «Multiverso»: personajes jugables de otros juegos y series, como
 * guiño, con las mismas reglas que un Pokémon (tipos, ataques con sus mejoras y
 * evoluciones, colección, gacha y compañero), salvo que sus ataques son de su
 * mundo. Se carga justo después de js/data/moves.js (dev.html), porque registra
 * sus ataques propios en G.Moves.
 *
 * Cada personaje:
 *   - una entrada de G.DEX con número 10001 en adelante, `gen: GEN` y `mv: true`
 *     (los enemigos, los jefes y el Pokémon perdido nunca la usan: ganchos de una
 *     línea en enemies.js y events.js);
 *   - sus hojas en assets/pokemon/{dex}/ con el formato de SpriteCollab (7
 *     animaciones, 8 direcciones; s/ es el variocolor) y su geometría en META, que
 *     pasa a G.SPRITE_META. Las dibuja PixelLab (8 rotaciones y la animación de
 *     andar) y las monta tools/nico/multiverso/montar.py, que también escribe META;
 *   - sus ataques, todos de su mundo (`pool`, con el inicial, `start`, el primero):
 *     al subir de nivel aprende sólo esos (gancho de una línea al principio de
 *     poolFor() de moves.js), y ningún Pokémon los aprende (no entran en el pool de
 *     ningún tipo). Cada uno sube con la escalera de su forma (`kind`) y evoluciona
 *     como los demás (EVO; los potenciadores, como Danza Espada, no). Cuentan para
 *     el logro «Maestro de movimientos», como el personaje cuenta para el de
 *     tenerlos todos. `vis` (gancho en forMove() de vfx.js) es cómo se ve: sin él,
 *     con la forma de su tipo.
 *
 * Equilibrio (lista validada por Nico el 14-10-2026): el daño nominal de cada
 * ataque (daño × proyectiles ÷ recarga) y su alcance caen dentro del rango de los
 * ataques Pokémon de su misma forma, y lo que gana por un lado (empuje, quemar,
 * frenar, tamaño) lo paga con más recarga o menos arco; un potenciador copia los
 * números de uno de upstream de la misma estadística. Los números del cuerpo a
 * cuerpo ya llevan el +20 % de daño y +25 % de alcance y arco que moves.js aplica
 * a los suyos. check.js §24 lo comprueba.
 *
 * Todos con rareza 2: su banner los reparte a partes iguales (lo que dice el
 * cartel; con rarezas distintas haría falta un sorteo propio, porque el pity de un
 * banner sin legendarios nunca vuelve a 0) y un repetido da 30 Pokémonedas, menos
 * de lo que vale de media una tirada repetida en otro banner: no regala monedas.
 * Stats de un Pokémon de segunda fase (Agumon, los de Charmeleon).
 *
 * Ganchos de una línea (// MOD nico): gacha.js (el banner), gacha-ui.js (el
 * cartel y sus probabilidades), menu.js (el nombre en la colección y la ficha),
 * enemies.js y events.js (nunca de enemigo), moves.js (poolFor: sus ataques) y
 * vfx.js (forMove: cómo se ven).
 */
G.MULTIVERSO = (() => {
  const GEN = 10;
  const BANNER = { gen: GEN, name: 'Multiverso', color: ['#14304a', '#3a1d6e', '#0f5a52'] };

  const PERSONAJES = [
    { dex: 10001, name: 'Agumon', types: ['fire', 'dragon'], hp: 96, spd: 112, atk: 1.14, rarity: 2, bst: 405,
      starter: false, gen: GEN, mv: true, start: 'llama-bebe', serie: 'Digimon',
      pool: ['llama-bebe', 'garra-afilada', 'escupefuego', 'cabezazo', 'lluvia-fuego', 'torbellino', 'emblema-valor'] },
    { dex: 10002, name: 'Doom Slayer', types: ['fighting', 'steel'], hp: 104, spd: 116, atk: 1.18, rarity: 2, bst: 425,
      starter: false, gen: GEN, mv: true, start: 'super-escopeta', serie: 'DOOM',
      pool: ['super-escopeta', 'lanzacohetes', 'rifle-plasma', 'motosierra', 'gancho-carne', 'granada', 'eructo-llamas', 'berserker'] },
    { dex: 10003, name: 'Cacodemonio', types: ['dark', 'electric'], hp: 126, spd: 92, atk: 1.08, rarity: 2, bst: 420,
      starter: false, gen: GEN, mv: true, start: 'rayo-bola', serie: 'DOOM',
      pool: ['rayo-bola', 'mordisco-infernal', 'embestida', 'lluvia-bolas', 'mirada-ojo', 'aura-infernal', 'pellejo-grueso'] }
  ];

  // En el comentario de cada uno, su daño nominal y el de ataques Pokémon de su forma.
  const ATAQUES = [
    // ---- Agumon (Digimon): sus evoluciones son ataques de sus digievoluciones ----
    { id: 'llama-bebe', name: 'Llama Bebé', type: 'fire', kind: 'projectile',          // 33,3 (Ascuas 34,6)
      desc: 'Escupe una bola de fuego grande al enemigo más cercano. Quema.',
      cd: 0.6, dmg: 20, speed: 300, count: 1, spread: 0.12, pierce: 0, life: 1.6, size: 9, burn: 1,
      evo: ['Mega Llama', 'atk'] },
    { id: 'garra-afilada', name: 'Garra Afilada', type: 'dragon', kind: 'melee',        // 34 (Garra Metal 36)
      desc: 'Zarpazo en arco amplio que empuja.',
      cd: 0.5, dmg: 17, radius: 62, arc: 2.0, knock: 50, vis: { melee: 'claw' },
      evo: ['Brazo Tridente', 'atk'] },
    { id: 'escupefuego', name: 'Escupefuego', type: 'fire', kind: 'cone',               // 66,7 (Lanzallamas 70)
      desc: 'Una ráfaga de bolitas de fuego en abanico estrecho. Quema.',
      cd: 0.72, dmg: 8, count: 6, arc: 0.7, speed: 380, life: 0.42, size: 6, pierce: 1, burn: 1,
      vis: { proj: 'fire', trail: 'ember' }, evo: ['Gigadestructor', 'cd'] },
    { id: 'cabezazo', name: 'Cabezazo', type: 'normal', kind: 'dash',                   // 26,3 (Ataque Rápido 26,7)
      desc: 'Cargas de cabeza hacia el enemigo y arrollas lo que cruzas.',
      cd: 0.8, dmg: 21, radius: 110, width: 36, knock: 70,
      evo: ['Gran Cuerno', 'hp'] },
    { id: 'lluvia-fuego', name: 'Lluvia de Fuego', type: 'fire', kind: 'meteor',        // 50,8 (Puño Meteoro 48,6; Granizo 60)
      desc: 'Bolas de fuego caen sobre los enemigos cercanos y los queman.',
      cd: 1.3, dmg: 22, count: 3, radius: 46, burn: 1, vis: { proj: 'fire', trail: 'ember' },
      evo: ['Fuerza de Gaia', 'atk'] },
    { id: 'torbellino', name: 'Torbellino', type: 'dragon', kind: 'orbit',              // 150 (Giro Fuego 140)
      desc: 'Giras tan rápido que unas llamas de dragón te rodean.',
      cd: 0.28, dmg: 14, count: 3, radius: 66, speed: 2.6, size: 8,
      evo: ['Gran Tornado', 'spd'] },
    { id: 'emblema-valor', name: 'Emblema del Valor', type: 'dragon', kind: 'buff',      // los números de Danza Dragón
      desc: 'No hace daño: acumula ATAQUE mientras esté activo.',
      cd: 0.7, stat: 'atk', amount: 0.11, dur: 7, stacks: 5 },

    // ---- Doom Slayer (DOOM) ----
    { id: 'super-escopeta', name: 'Súper Escopeta', type: 'steel', kind: 'cone',         // 70 (Lanzallamas 70)
      desc: 'Escopeta de dos cañones: una ráfaga corta de perdigones que empuja.',
      cd: 0.8, dmg: 7, count: 8, arc: 0.75, speed: 520, life: 0.3, size: 5, pierce: 1, knock: 60,
      evo: ['Súper Escopeta Maestra', 'cd'] },
    { id: 'lanzacohetes', name: 'Lanzacohetes', type: 'fire', kind: 'projectile',        // 32,9 (Lanzarrocas 34,3)
      desc: 'Un cohete lento y pesado que empuja con fuerza.',
      cd: 0.85, dmg: 28, speed: 250, count: 1, spread: 0.12, pierce: 0, life: 1.6, size: 10, knock: 120,
      vis: { proj: 'rock', trail: 'ember' }, evo: ['Ráfaga de Cohetes', 'atk'] },
    { id: 'rifle-plasma', name: 'Rifle de Plasma', type: 'electric', kind: 'beam',       // 22,1 (Furia Dragón 24)
      desc: 'Un chorro de plasma en línea recta que lo atraviesa todo.',
      cd: 0.95, dmg: 21, radius: 230, width: 26, vis: { beam: 'lightning' },
      evo: ['BFG 9000', 'atk'] },
    { id: 'motosierra', name: 'Motosierra', type: 'steel', kind: 'melee',                // 40 (Golpe Kárate 44)
      desc: 'Corta de cerca y muy fuerte, en un arco estrecho.',
      cd: 0.55, dmg: 22, radius: 55, arc: 1.3, knock: 30, vis: { melee: 'claw' },
      evo: ['Crisol', 'atk'] },
    { id: 'gancho-carne', name: 'Gancho de Carne', type: 'fighting', kind: 'dash',       // 25,3 (Golpe Aéreo 24)
      desc: 'Te enganchas al enemigo y cruzas hasta él golpeando todo el camino.',
      cd: 0.75, dmg: 19, radius: 120, width: 32, knock: 30,
      evo: ['Gancho Ardiente', 'spd'] },
    { id: 'granada', name: 'Granada', type: 'steel', kind: 'meteor',                     // 51,2 (Puño Meteoro 48,6)
      desc: 'Lanzas dos granadas que estallan sobre los enemigos y los empujan.',
      cd: 1.25, dmg: 32, count: 2, radius: 52, knock: 70, vis: { proj: 'rock', trail: 'spark' },
      evo: ['Granada de Racimo', 'cd'] },
    { id: 'eructo-llamas', name: 'Eructo de Llamas', type: 'fire', kind: 'cone',         // 65,3 (Rayo Burbuja 64,6)
      desc: 'Un chorro de llamas desde el hombro, en abanico corto. Quema.',
      cd: 0.75, dmg: 7, count: 7, arc: 1.0, speed: 340, life: 0.45, size: 6, pierce: 1, burn: 1,
      vis: { proj: 'fire', trail: 'ember' }, evo: ['Eructo Infernal', 'def'] },
    { id: 'berserker', name: 'Berserker', type: 'fighting', kind: 'buff',                // los números de Danza Espada
      desc: 'No hace daño: acumula ATAQUE mientras esté activo.',
      cd: 0.85, stat: 'atk', amount: 0.13, dur: 7, stacks: 5 },

    // ---- Cacodemonio (DOOM) ----
    { id: 'rayo-bola', name: 'Rayo Bola', type: 'electric', kind: 'projectile',          // 26,7 (Confusión 22,4; Ascuas 34,6)
      desc: 'Escupe una bola de rayos lenta y grande que atraviesa y frena.',
      cd: 0.9, dmg: 24, speed: 210, count: 1, spread: 0.1, pierce: 3, life: 2.4, size: 11, slow: 0.35,
      vis: { proj: 'ball', trail: 'spark' }, evo: ['Tormenta Infernal', 'def'] },
    { id: 'mordisco-infernal', name: 'Mordisco Infernal', type: 'dark', kind: 'melee',   // 38 (Mordisco 37,8)
      desc: 'Abre la boca entera y muerde lo que tiene delante.',
      cd: 0.5, dmg: 19, radius: 56, arc: 1.6, knock: 60, vis: { melee: 'jaws' },
      evo: ['Fauces del Abismo', 'atk'] },
    { id: 'embestida', name: 'Embestida', type: 'dark', kind: 'dash',                   // 26,3 (Ataque Rápido 26,7)
      desc: 'Se lanza con todo el cuerpo: ancha y corta, empuja mucho.',
      cd: 0.8, dmg: 21, radius: 110, width: 46, knock: 90,
      evo: ['Carga Demoníaca', 'hp'] },
    { id: 'lluvia-bolas', name: 'Lluvia de Bolas', type: 'electric', kind: 'meteor',     // 57,6 (Granizo 60)
      desc: 'Bolas de rayos caen sobre los enemigos cercanos y los frenan.',
      cd: 1.25, dmg: 18, count: 4, radius: 42, slow: 0.3, vis: { proj: 'ball', trail: 'spark' },
      evo: ['Aguacero de Plasma', 'cd'] },
    { id: 'mirada-ojo', name: 'Mirada del Ojo', type: 'dark', kind: 'beam',              // 20 (Rayo Hielo 18,2)
      desc: 'Su único ojo lanza un rayo oscuro que atraviesa y frena.',
      cd: 1.1, dmg: 22, radius: 220, width: 34, slow: 0.3, vis: { beam: 'shadow' },
      evo: ['Ojo del Infierno', 'atk'] },
    { id: 'aura-infernal', name: 'Aura Infernal', type: 'dark', kind: 'aura',            // 16,4 (Tinieblas 18)
      desc: 'Un aura del infierno le rodea: daña y frena algo a lo cercano.',
      cd: 0.55, dmg: 9, radius: 80, slow: 0.2, vis: { aura: 'shadow', rise: true },
      evo: ['Círculo Infernal', 'rgn'] },
    { id: 'pellejo-grueso', name: 'Pellejo Grueso', type: 'dark', kind: 'buff',          // los números de Fortaleza
      desc: 'No hace daño: acumula DEFENSA mientras esté activo.',
      cd: 0.85, stat: 'def', amount: 0.07, dur: 7, stacks: 5 }
  ];

  // Geometría de las hojas (G.SPRITE_META): la escribe tools/nico/multiverso/montar.py.
  // <meta montar.py>
  const META = {
    10001: {"s":1,"a":{"Idle":{"w":32,"h":36,"n":2,"r":8,"d":[36,20],"ax":15.5,"ay":30.5},"Walk":{"w":44,"h":42,"n":4,"r":8,"d":[6,8,6,8],"ax":21.5,"ay":36.5},"Attack":{"w":40,"h":36,"n":7,"r":8,"d":[2,2,3,3,2,2,2],"ax":19.5,"ay":30.5},"Shoot":{"w":40,"h":36,"n":5,"r":8,"d":[2,2,3,2,2],"ax":19.5,"ay":30.5},"Charge":{"w":32,"h":36,"n":2,"r":8,"d":[4,4],"ax":15.5,"ay":30.5},"Hurt":{"w":40,"h":36,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":30.5},"Faint":{"w":40,"h":36,"n":4,"r":8,"d":[8,12,4,10],"ax":19.5,"ay":30.5}},"sh":1},
    10002: {"s":1,"a":{"Idle":{"w":32,"h":36,"n":2,"r":8,"d":[36,20],"ax":15.5,"ay":30.5},"Walk":{"w":48,"h":44,"n":4,"r":8,"d":[6,8,6,8],"ax":23.5,"ay":38.5},"Attack":{"w":40,"h":36,"n":7,"r":8,"d":[2,2,3,3,2,2,2],"ax":19.5,"ay":30.5},"Shoot":{"w":40,"h":36,"n":5,"r":8,"d":[2,2,3,2,2],"ax":19.5,"ay":30.5},"Charge":{"w":32,"h":36,"n":2,"r":8,"d":[4,4],"ax":15.5,"ay":30.5},"Hurt":{"w":40,"h":36,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":30.5},"Faint":{"w":40,"h":36,"n":4,"r":8,"d":[8,12,4,10],"ax":19.5,"ay":30.5}},"sh":1},
    10003: {"s":1,"a":{"Idle":{"w":32,"h":41,"n":4,"r":8,"d":[10,10,10,10],"ax":15.5,"ay":35.5},"Walk":{"w":32,"h":41,"n":4,"r":8,"d":[6,6,6,6],"ax":15.5,"ay":35.5},"Attack":{"w":40,"h":41,"n":7,"r":8,"d":[2,2,3,3,2,2,2],"ax":19.5,"ay":35.5},"Shoot":{"w":40,"h":41,"n":5,"r":8,"d":[2,2,3,2,2],"ax":19.5,"ay":35.5},"Charge":{"w":32,"h":41,"n":2,"r":8,"d":[4,4],"ax":15.5,"ay":35.5},"Hurt":{"w":40,"h":41,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":35.5},"Faint":{"w":40,"h":41,"n":4,"r":8,"d":[8,6,6,10],"ax":19.5,"ay":35.5}},"sh":1,"hv":1},
  };
  // </meta montar.py>

  for (const p of PERSONAJES) {
    if (G.DEX_BY[p.dex] || !META[p.dex]) continue;
    if (!G.SPRITE_META[p.dex]) G.SPRITE_META[p.dex] = META[p.dex];
    const mon = Object.assign({}, p);
    G.DEX.push(mon);
    G.DEX_BY[mon.dex] = mon;
  }

  if (G.Moves) {
    for (const a of ATAQUES) {
      if (G.Moves.BY_ID[a.id]) continue;
      // La escalera de mejoras es la de su forma: la copia de un ataque de esa forma.
      const igual = G.Moves.ALL.find(m => m.kind === a.kind && m.ups);
      if (!igual) continue;
      const m = Object.assign({}, a, { ups: igual.ups, maxLvl: igual.maxLvl });
      delete m.evo;
      G.Moves.ALL.push(m);
      G.Moves.BY_ID[m.id] = m;
      if (a.evo) G.Moves.EVO[m.id] = a.evo;
    }
  }

  const $ = id => document.getElementById(id);
  const lista = () => G.DEX.filter(p => p.mv && G.SPRITE_META[p.dex]);

  /**
   * El cartel del banner (gancho en refresh() de gacha-ui.js, al final, tras las
   * notas de las probabilidades). Los textos van en español: i18n.js los traduce
   * en el DOM. La pestaña dice «Otros mundos» en vez de «Gen 10» desde que se abre
   * el gacha, esté donde esté. En el banner del Multiverso, las probabilidades de
   * upstream (por rareza, con la Épica de la ×10 y el pity de la Legendaria) no
   * valen: cada tirada trae a uno de sus personajes, todos con la misma
   * probabilidad (poolNear() de gacha.js cae siempre en su rareza).
   */
  function cartel(gen) {
    const tab = document.querySelector(`#gacha-gens .gen-tab[data-gen="${GEN}"] small`);
    if (tab) tab.textContent = 'Otros mundos';
    if (gen !== GEN) return;
    const todos = lista();
    const feat = $('gacha-feat');
    if (feat && !feat.children.length) {
      // Los destacados de upstream son tres legendarios a ×2; con menos personajes, y más pequeños, se
      // ven más grandes: hasta ×4 con uno solo (el encaje de estilo.js los deja sin cortar).
      const kmax = Math.max(2, 5 - Math.min(3, todos.length));
      for (const p of todos.slice(0, 3)) {
        feat.appendChild(G.UI.spriteCanvas(p.dex, 170, 190, { lively: true, scale: 2, dir: 1 }));
        if (G.Estilo) G.Estilo.destacado(feat.lastChild, p.dex);
        if (G.Estilo && G.Estilo.animar && kmax > 2) G.Estilo.animar(feat.lastChild, p.dex, { lively: true, kmax, dir: 1 });
      }
    }
    $('banner-title').textContent = BANNER.name;
    $('banner-desc').textContent = 'Personajes de otros mundos que se cuelan en el enjambre: ' +
      todos.map(p => `${p.name} (${p.serie})`).join(', ') + '.';
    $('gacha-pity').textContent = '';
    const rates = $('gacha-rates');
    if (!rates || !todos.length) return;
    const G_ = G.Gacha;
    const pct = x => +(x * 100).toFixed(2) + '%';
    const shiny = G.MODS && G.MODS.probShiny ? G.MODS.probShiny(G_.SHINY_RATE) : G_.SHINY_RATE;
    const rarezas = [...new Set(todos.map(p => p.rarity))];
    const repetido = rarezas.length === 1
      ? `Un repetido da ${G_.REFUND[rarezas[0]]} Pokémonedas (un shiny repetido, el triple).`
      : 'Los repetidos dan Pokémonedas (los shiny repetidos, el triple).';
    rates.innerHTML = '<h3>Probabilidades</h3>' + todos.map(p => `
      <div><span style="color:${G_.RARITY_COLOR[p.rarity]}">${G.UI.stars(p.rarity, 10)} ${p.name}</span>
      <span>${pct(1 / todos.length)}</span></div>`).join('') +
      `<div><span>${G.Icons.html('shiny', 12)} Shiny</span><span>${pct(shiny)}</span></div>
       <p class="note">· Cada tirada trae a uno de estos personajes, todos con la misma probabilidad.<br>
       · No hay legendarios, así que tampoco pity.<br>
       · ${repetido}<br>
       · Nunca salen de enemigos: sólo se consiguen aquí.</p>`;
  }

  /**
   * La ficha de la colección (gancho en showDetail() de menu.js): si aún no lo
   * tienes, upstream dice «Consíguelo en el banner de X o derrotándolo cuando
   * salga shiny», y un personaje del Multiverso nunca sale de enemigo.
   */
  function ficha(dex) {
    const p = G.DEX_BY[dex], s = G.DB && G.DB.save;
    if (!p || !p.mv || !s || s.owned[dex]) return;
    const nota = document.querySelector('#dex-detail p.center');
    if (nota) nota.innerHTML = 'Aún no lo tienes.<br>Sólo sale en el banner del Multiverso, en el gacha.';
  }

  return { GEN, BANNER, PERSONAJES, ATAQUES, lista, cartel, ficha };
})();
