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
 * ni cooperativo. Cuando exista, pega aquí SU config (sin measurementId) y
 * reconstruye con `node tools/build.js --privado`.
 */
G.FIREBASE_CONFIG = null; // MOD nico: aquí irá la config del proyecto Firebase propio

/* MOD nico: interruptor del emulador local de Firebase, para pruebas.
 * Sólo actúa si la página se abre desde localhost / 127.0.0.1 / [::1] Y lleva
 * ?emu en la URL (p. ej. http://127.0.0.1:8090/index.html?emu). En cualquier
 * otro sitio (la web publicada) se ignora. Puertos fijos en db.js y firebase.json:
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

/* Ejemplo de cómo debe quedar:
G.FIREBASE_CONFIG = {
  apiKey: 'AIza...',
  authDomain: 'tu-proyecto.firebaseapp.com',
  projectId: 'tu-proyecto',
  storageBucket: 'tu-proyecto.firebasestorage.app',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abc123'
};
*/
