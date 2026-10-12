/* ============ tools/nico/base.js — lo que no puede salir en lo publicado (MOD nico) ============
 * Las señas del proyecto base que PokéSwarm no usa ni nombra: su dominio, su proyecto Firebase, el principio de su
 * apiKey, su autor (también su usuario de GitHub y de Ko-fi), el usuario del correo del autor y el nombre del juego.
 * Van en base64 para que este fichero, que también se publica (GitHub Pages sirve todo el repositorio), no las diga
 * en claro. Las usan tools/nico/check.js (que falla si vuelven a aparecer en cualquier fichero publicado, salvo
 * LICENSE, que conserva el aviso MIT) y tools/nico/coop-e2e.js (que vigila que nadie hable con esa infraestructura).
 */
'use strict';
const d = s => Buffer.from(s, 'base64').toString('utf8');
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const DOMINIO = d('cG9rZXN1cnZpdm9yLmNvbQ==');     // el dominio del juego base (y su TURN, un subdominio)
const FIREBASE = d('cG9rZXN1cnZpdm9yLWpwdGVy');    // su proyecto Firebase
const APIKEY = d('QUl6YVN5RDRZcGZa');              // el principio de su apiKey
const AUTOR = d('anB0ZXI=');                       // su autor, sin el número (usuario de GitHub y de Ko-fi)
const CORREO = d('anBpZXJhdG9ycmVncm9zYQ==');      // el usuario del correo del autor
const NOMBRE = d('UG9rw6lTdXJ2aXZvcg==');          // el nombre del juego base, con tilde

/** Lo vigilado, como expresiones regulares: [re, qué es]. El nombre, con y sin tilde y con espacio o sin él, pero con
 *  sus mayúsculas: «pokesurvivor» en minúsculas es la ruta de la web y del repositorio (no se renombran), las claves
 *  internas y el tipo de los archivos de partida, y se queda. */
const VIGILADO = [
  [new RegExp(reEsc(DOMINIO), 'i'), 'el dominio del proyecto base'],
  [new RegExp(reEsc(FIREBASE), 'i'), 'el proyecto Firebase del proyecto base'],
  [new RegExp(reEsc(APIKEY)), 'la apiKey del proyecto base'],
  [new RegExp(reEsc(AUTOR), 'i'), 'el autor del proyecto base (o su GitHub o su Ko-fi)'],
  [new RegExp(reEsc(CORREO), 'i'), 'el correo del autor del proyecto base'],
  [new RegExp(reEsc(NOMBRE).replace('é', '[eé]').replace('S', ' ?S')), 'el nombre del proyecto base']
];

module.exports = { DOMINIO, FIREBASE, APIKEY, AUTOR, CORREO, NOMBRE, VIGILADO };
