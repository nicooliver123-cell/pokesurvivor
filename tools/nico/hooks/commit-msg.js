/* ============ tools/nico/hooks/commit-msg.js — el mensaje de commit no nombra el proyecto base ============
 * Lo llama el hook commit-msg (git config core.hooksPath tools/nico/hooks). Busca en el mensaje, sin las líneas de
 * comentario de git, las señas de tools/nico/base.js (su nombre, su autor, su dominio, su Firebase, su apiKey o su
 * correo) y, si sale alguna, cancela el commit. Los commits del proyecto base que llegan con un merge no pasan por aquí.
 *   node tools/nico/hooks/commit-msg.js <fichero con el mensaje>
 */
'use strict';
const fs = require('fs');
const BASE = require('../base.js');

const msg = fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(l => !l.startsWith('#')).join('\n');
const hay = [...new Set(BASE.nombra(msg).map(o => o.que))];
if (hay.length) {
  console.error(`commit-msg: el mensaje nombra ${hay.join(', ')}. Escríbelo sin nombrarlo (por ejemplo, «el proyecto base»).`);
  process.exit(1);
}
