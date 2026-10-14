/* ============ tools/nico/base.js — nombres reservados del proyecto base (MOD nico) ============
 * Las señas del proyecto base que PokéSwarm no usa ni nombra (salvo el crédito: ver CREDITO_EN, abajo): su dominio, su proyecto Firebase, el principio de su
 * apiKey, su autor (también su usuario de GitHub y de Ko-fi), el usuario del correo del autor y el nombre del juego.
 * Este fichero también es público (está en el repositorio), así que no las guarda: sólo su huella (SHA-256 de SAL y la
 * seña normalizada) y su longitud. `nombra(texto)` parte el texto en tramos de los caracteres que puede tener cada seña,
 * calcula la huella de cada ventana de esa longitud y la compara: es la misma búsqueda de subcadena que hacían las
 * expresiones regulares de antes, sin escribir lo que se busca. Las usan tools/nico/check.js (que falla si vuelven a
 * aparecer en cualquier fichero del repositorio, salvo LICENSE, que conserva el aviso MIT), tools/nico/coop-e2e.js (que
 * vigila que nadie hable con esa infraestructura) y el hook tools/nico/hooks/commit-msg (los mensajes de commit).
 * Para cambiar una seña: su huella sale de `node -e "console.log(require('./tools/nico/base.js').huella('<seña normalizada>'))"`.
 */
'use strict';
const crypto = require('crypto');

const SAL = 'pokeswarm/vigilado/1\0';
const huella = s => crypto.createHash('sha256').update(SAL + s).digest('hex');

/* Cada seña: `tramo`, los trozos del texto donde puede estar (sus caracteres; con la `g`); `n`, su longitud;
 * `may`, si distingue mayúsculas (si no, se compara en minúsculas); `tildes`, si «é» cuenta como «e»; y `espacio`,
 * si puede llevar un espacio en medio (dos palabras seguidas). */
const SENAS = [
  { id: 'dominio', que: 'el dominio del proyecto base', tramo: /[a-z0-9.-]+/gi, n: 16, may: false,
    h: '4fd58cc8f927c01140472076524ff7c072eaf00b8b8cc58ae98a6672716455c9' },
  { id: 'firebase', que: 'el proyecto Firebase del proyecto base', tramo: /[a-z0-9-]+/gi, n: 18, may: false,
    h: 'b172e4dcb1996878586024f68364255bde712741e3d11825aa92a3e7d27e937e' },
  // Todas las apiKey de Firebase empiezan por «AIza»: sólo se miran esas.
  { id: 'apikey', que: 'la apiKey del proyecto base', tramo: /AIza[0-9A-Za-z_-]{8}/g, n: 12, may: true,
    h: 'b38aecc33a90b54722a51d9f441cdf8bf5f8083014c9c9280a79feb167a6ecd6' },
  { id: 'autor', que: 'el autor del proyecto base (o su GitHub o su Ko-fi)', tramo: /[a-z0-9]+/gi, n: 5, may: false, credito: true,
    h: '73a029d833cb23f80ecba68f03773507688c34ad913aeaf00e753df4ad4c05f5' },
  { id: 'correo', que: 'el correo del autor del proyecto base', tramo: /[a-z0-9._+-]+/gi, n: 16, may: false,
    h: '57e5eb9eb6a8ae830ae8706bf6f35cc6beae8068f3607b163aeb6cbb05dd6eb5' },
  // El nombre, con sus mayúsculas, con y sin tilde y con un espacio en medio o sin él: «pokesurvivor» en minúsculas
  // es la carpeta local, las claves internas y el tipo de los archivos de partida, y se queda.
  { id: 'nombre', que: 'el nombre del proyecto base', tramo: /[A-Za-z]+/g, n: 12, may: true, tildes: true, espacio: true, credito: true,
    h: '0d7b3869375030f2332408ee765399eb7848924bd2ff1785ea8ca8ef0f406378' }
];

// «é» → «e» sin cambiar la longitud del texto (para poder dar la línea de cada aparición).
const sinTildes = t => t.replace(/[À-ſ]/g, c => c.normalize('NFD')[0]);

// Huellas ya calculadas por seña: muchos tramos se repiten en cientos de ficheros.
const memo = new Map();
function ventanas(s, trozo, desde = 0) {
  let m = memo.get(s);
  if (!m) memo.set(s, m = new Map());
  const out = [];
  for (let k = desde; k + s.n <= trozo.length; k++) {
    const v = trozo.slice(k, k + s.n);
    let ok = m.get(v);
    if (ok === undefined) { ok = huella(s.may ? v : v.toLowerCase()) === s.h; m.set(v, ok); }
    if (ok) out.push(k);
  }
  return out;
}

/** Las apariciones de las señas en `texto`: [{ id, que, i }], con `i` el índice donde empieza cada una.
 *  `senas`: los ids que mirar (por defecto, todas) o señas hechas con `crear()`. */
function nombra(texto, senas) {
  const lista = !senas ? SENAS : senas.map(x => typeof x === 'string' ? SENAS.find(s => s.id === x) : x);
  if (lista.some(s => !s)) throw new Error('base.js: seña desconocida en ' + JSON.stringify(senas));
  const out = [];
  for (const s of lista) {
    const t = s.tildes ? sinTildes(String(texto)) : String(texto);
    const re = new RegExp(s.tramo.source, s.tramo.flags.includes('g') ? s.tramo.flags : s.tramo.flags + 'g');
    let ant = null;
    for (const m of t.matchAll(re)) {
      for (const k of ventanas(s, m[0])) out.push({ id: s.id, que: s.que, i: m.index + k });
      // Dos palabras separadas por un espacio: sólo las ventanas que cruzan el espacio (las otras ya se han mirado).
      if (s.espacio && ant && ant.index + ant[0].length + 1 === m.index && t[m.index - 1] === ' ') {
        const junto = ant[0] + m[0], corte = ant[0].length;
        for (const k of ventanas(s, junto.slice(Math.max(0, corte - s.n + 1), corte + s.n - 1)))
          out.push({ id: s.id, que: s.que, i: ant.index + Math.max(0, corte - s.n + 1) + k });
      }
      ant = m;
    }
  }
  return out.sort((a, b) => a.i - b.i);
}

/** Una seña nueva con las reglas de la seña `id` (para las pruebas de check.js, con valores inventados). */
function crear(id, valor, que = 'seña de prueba') {
  const base = SENAS.find(s => s.id === id);
  if (!base) throw new Error('base.js: seña desconocida: ' + id);
  const v = base.tildes ? sinTildes(valor).replace(/ /g, '') : valor;
  return { ...base, id: 'prueba-' + id, que, n: v.length, h: huella(base.may ? v : v.toLowerCase()) };
}

/* Crédito al juego original (decisión de Nico del 14-10-2026): su nombre y su autor (`credito: true`) se pueden
 * nombrar en los créditos (CREDITO_EN) y en los mensajes de commit; la infraestructura (dominio, Firebase, apiKey) y el
 * correo, en ningún sitio. VIGILADAS son las que no se nombran nunca. */
const CREDITO = SENAS.filter(s => s.credito).map(s => s.id);
const VIGILADAS = SENAS.filter(s => !s.credito).map(s => s.id);
const CREDITO_EN = ['README.md', 'CREDITS.md', 'CLAUDE.md', 'js/core/mods.js', 'js/data/lang-en-mod.js', 'js/app.min.js'];

module.exports = { SENAS, nombra, crear, huella, CREDITO, VIGILADAS, CREDITO_EN };
