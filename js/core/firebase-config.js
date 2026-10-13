/* ============ firebase-config.js — conexión con tu proyecto de Firebase ============
 * Pega aquí la configuración de tu app web de Firebase (Consola de Firebase >
 * Configuración del proyecto > Tus apps > SDK setup and configuration > Config).
 * Los pasos completos están en docs/FIREBASE.md.
 *
 * Estos datos NO son secretos: Firebase los diseña para ir en la web. Lo que
 * protege las partidas son las reglas de Firestore (firestore.rules).
 *
 * Si se pone a null, el juego funciona en modo local (sólo en el navegador).
 *
 * MOD nico: esta versión modificada NUNCA debe apuntar al Firebase del juego
 * original (es su proyecto y su factura). Mientras no exista un proyecto propio
 * se queda en null = modo local: un jugador, sin cuentas en la nube, ranking
 * ni cooperativo. Cuando exista:
 *   1. pega aquí SU config (sin measurementId),
 *   2. añade su projectId a G.FIREBASE_PROYECTOS (la lista blanca de abajo),
 *   3. reconstruye con `node tools/build.js --privado` y pasa tools/nico.
 */
G.FIREBASE_CONFIG = {   // MOD nico: proyecto Firebase propio de PokéSwarm (creado el 13-10-2026, sin Analytics)
  apiKey: 'AIzaSyBkm-HyT6VBntQ5IGpLnLmk_2StP9NJbR4',
  authDomain: 'pokeswarm-9e39d.firebaseapp.com',
  databaseURL: 'https://pokeswarm-9e39d-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'pokeswarm-9e39d',
  storageBucket: 'pokeswarm-9e39d.firebasestorage.app',
  messagingSenderId: '389369669792',
  appId: '1:389369669792:web:e7e731a278db1113a481c5'
};

/* MOD nico: lista blanca de proyectos. js/core/db.js sólo se conecta a un proyecto
 * de esta lista y con URLs de ese mismo proyecto (G.FIREBASE_PERMITIDA); con
 * cualquier otro, o si faltara esta lista, el juego va en modo local.
 * 'demo-ps' es el emulador de las pruebas (tools/nico). tools/nico/check.js falla
 * si la config publicada no está en la lista. */
G.FIREBASE_PROYECTOS = ['demo-ps', 'pokeswarm-9e39d'];

/** MOD nico: ¿se puede usar esta config? Proyecto de la lista blanca; la Realtime
 *  Database es obligatoria (sin ella no hay cooperativo) y tiene que ser su
 *  instancia por defecto: https://<id>-default-rtdb.<región>.firebasedatabase.app
 *  (o .firebaseio.com) en la nube, o 127.0.0.1/localhost con ?ns=<id>-default-rtdb
 *  en el emulador; y Auth, exactamente <id>.firebaseapp.com o <id>.web.app. */
G.FIREBASE_PERMITIDA = cfg => {
  const id = cfg && cfg.projectId;
  if (!id || !/^[a-z0-9-]+$/.test(id) || !G.FIREBASE_PROYECTOS.includes(id)) return false;
  let db;
  try { db = new URL(cfg.databaseURL); } catch (e) { return false; }
  const local = db.hostname === '127.0.0.1' || db.hostname === 'localhost';
  if (local ? db.searchParams.get('ns') !== id + '-default-rtdb'
    : db.protocol !== 'https:' ||
      !new RegExp('^' + id + '-default-rtdb\\.(firebaseio\\.com|[a-z0-9-]+\\.firebasedatabase\\.app)$').test(db.hostname)) return false;
  const auth = String(cfg.authDomain || '').toLowerCase();
  return auth === id + '.firebaseapp.com' || auth === id + '.web.app';
};

/* MOD nico: interruptor del emulador local de Firebase, para pruebas.
 * Sólo actúa si la página se abre desde localhost / 127.0.0.1 / [::1] Y lleva
 * ?emu en la URL (p. ej. http://127.0.0.1:8090/index.html?emu). En cualquier
 * otro sitio (la web publicada) se ignora, y db.js rechaza una config de
 * emulador fuera de este PC. Puertos fijos en db.js y firebase.json:
 * Auth 9099, Firestore 8080, Realtime Database 9000. Proyecto demo-ps: los
 * proyectos "demo-" no existen en la nube, así que nunca se toca uno real. */
(() => {
  const h = location.hostname;
  const local = h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  if (local && new URLSearchParams(location.search).has('emu')) {
    G.FIREBASE_CONFIG = { apiKey: 'demo', projectId: 'demo-ps', authDomain: 'demo-ps.firebaseapp.com', appId: 'demo',
      databaseURL: 'http://127.0.0.1:9000?ns=demo-ps-default-rtdb', emulator: true };
  }
})();

/* Ejemplo de cómo debe quedar (con <id> = el projectId, que va también en
 * G.FIREBASE_PROYECTOS):
G.FIREBASE_CONFIG = {
  apiKey: 'AIza...',
  authDomain: '<id>.firebaseapp.com',
  databaseURL: 'https://<id>-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: '<id>',
  storageBucket: '<id>.firebasestorage.app',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abc123'
};
*/
