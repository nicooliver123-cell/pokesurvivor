/* ============ tools/nico/evoluciones.js — genera js/data/evolutions.js (MOD nico) ============
 *   node tools/nico/evoluciones.js <ruta/pokemon_species.csv>
 *
 * Lee la tabla de especies de PokeAPI (pokemon_species.csv, columnas `id` y
 * `evolves_from_species_id`; se bajó una vez y se guarda FUERA del repo) como DATOS: sólo se
 * parte en filas y columnas, nunca se ejecuta nada de ella. Con la Pokédex del juego
 * (js/data/pokedex.js y js/data/sprites-meta.js, en node:vm) escribe js/data/evolutions.js:
 *
 *   G.EVO = { padre: [hijos] }    sólo especies del juego (en G.DEX_BY y con G.SPRITE_META)
 *
 * - Si falta un estadio intermedio en el juego, se salta: Pidove (519) -> Unfezant (521), porque
 *   Tranquill (520) no está. Si falta el primero, el siguiente queda sin padre.
 * - Las evoluciones de formas regionales cuentan a nivel de especie (Meowth -> Perrserker).
 * - Hijos en orden de número. Sin ciclos (el script lo comprueba y para si hubiera uno).
 *
 * Lo usa el mod «Pokémon repetido» del gacha (js/core/mods.js, repetidoDaEvolucion). Sin red:
 * el juego no pide nada a internet. Si cambia la Pokédex, volver a ejecutarlo con la tabla.
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'js', 'data', 'evolutions.js');

const csvPath = process.argv[2];
if (!csvPath) { console.error('Uso: node tools/nico/evoluciones.js <ruta/pokemon_species.csv>'); process.exit(2); }

// ---- CSV: sólo texto -> filas. Campos entre comillas por si acaso; nada se evalúa. ----
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const text = fs.readFileSync(path.resolve(csvPath), 'utf8');
if (text.length > 5e6) { console.error('El CSV es demasiado grande para ser la tabla de especies.'); process.exit(1); }
const rows = parseCsv(text.replace(/^﻿/, ''));
const head = rows.shift() || [];
const cId = head.indexOf('id'), cFrom = head.indexOf('evolves_from_species_id');
if (cId < 0 || cFrom < 0) { console.error('Faltan las columnas id y evolves_from_species_id.'); process.exit(1); }
const from = new Map();              // especie -> especie de la que evoluciona (o 0)
for (const r of rows) {
  const id = r[cId], f = r[cFrom];
  if (!/^\d{1,5}$/.test(id) || !(f === '' || /^\d{1,5}$/.test(f))) { console.error('Fila no válida: ' + JSON.stringify(r.slice(0, 4))); process.exit(1); }
  from.set(+id, f === '' ? 0 : +f);
}

// ---- Pokédex del juego ----
const ctx = { console };
vm.createContext(ctx);
ctx.G = {};
for (const f of ['js/data/pokedex.js', 'js/data/sprites-meta.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const G = ctx.G;
const enJuego = d => !!(G.DEX_BY[d] && G.SPRITE_META[d]);
const juego = Object.keys(G.DEX_BY).map(Number).filter(enJuego).sort((a, b) => a - b);

// ---- Padre dentro del juego (saltando estadios que faltan) ----
const sinTabla = [], saltos = [];
function padre(d) {
  if (!from.has(d)) { sinTabla.push(d); return 0; }
  const visto = new Set([d]);
  let p = from.get(d), saltados = [];
  while (p) {
    if (visto.has(p)) throw new Error('ciclo en la tabla: ' + [...visto, p].join(' -> '));
    visto.add(p);
    if (enJuego(p)) break;
    saltados.push(p);
    p = from.get(p) || 0;
  }
  if (p && saltados.length) saltos.push(`${G.DEX_BY[p].name} (${p}) -> ${G.DEX_BY[d].name} (${d}), sin ${saltados.join(', ')}`);
  return p;
}
const EVO = {};
for (const d of juego) {
  const p = padre(d);
  if (p) (EVO[p] = EVO[p] || []).push(d);
}
for (const k of Object.keys(EVO)) EVO[k].sort((a, b) => a - b);

// Sin ciclos dentro del juego.
for (const k of Object.keys(EVO)) {
  const pila = [[+k, new Set([+k])]];
  while (pila.length) {
    const [n, camino] = pila.pop();
    for (const h of EVO[n] || []) {
      if (camino.has(h)) throw new Error('ciclo: ' + [...camino, h].join(' -> '));
      pila.push([h, new Set([...camino, h])]);
    }
  }
}

// ---- Escribir ----
const padres = Object.keys(EVO).map(Number).sort((a, b) => a - b);
const aristas = padres.reduce((a, p) => a + EVO[p].length, 0);
const nombre = d => G.DEX_BY[d].name.replace(/\*\//g, '');
const lineas = padres.map(p => {
  const s = `  ${p}: [${EVO[p].join(', ')}],`;
  return (s.length < 24 ? s.padEnd(24) : s + ' ') + `// ${nombre(p)} -> ${EVO[p].map(nombre).join(', ')}`;
});
const out = `/* ============ evolutions.js — GENERADO, no editar a mano (MOD nico) ============
 * Lo produce tools/nico/evoluciones.js con la tabla de especies de PokeAPI
 * (pokemon_species.csv: id y evolves_from_species_id), bajada una vez: el juego no
 * hace ninguna petición a internet.
 *
 * G.EVO = { padre: [hijos] }: la siguiente fase inmediata de cada especie, sólo entre
 * las ${juego.length} del juego (en G.DEX_BY y con G.SPRITE_META). Si falta un estadio
 * intermedio, se salta (Pidove -> Unfezant); las formas regionales cuentan como su
 * especie. ${padres.length} especies con evolución, ${aristas} evoluciones.
 * Lo usa el mod «Pokémon repetido» del gacha (js/core/mods.js, repetidoDaEvolucion).
 */
G.EVO = {
${lineas.join('\n')}
};
`;
fs.writeFileSync(OUT, out);
console.log(`js/data/evolutions.js: ${juego.length} especies del juego, ${padres.length} con evolución, ${aristas} evoluciones.`);
if (saltos.length) console.log(`Estadios intermedios que faltan en el juego (${saltos.length}):\n  ` + saltos.join('\n  '));
if (sinTabla.length) console.log(`Especies del juego que no están en la tabla (${sinTabla.length}): ${sinTabla.join(', ')}`);
const ramas = padres.filter(p => EVO[p].length > 1);
console.log(`Con varias ramas (${ramas.length}): ` + ramas.map(p => `${nombre(p)} (${EVO[p].length})`).join(', '));
