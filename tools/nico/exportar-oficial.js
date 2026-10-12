// tools/nico/exportar-oficial.js — exportador de la partida del juego OFICIAL (MOD nico), comentado.
// Se pega en la consola del navegador (F12 > Consola) con pokesurvivor.com abierto y la sesión
// iniciada; si Chrome pide escribir "permitir pegar" / "allow pasting", se escribe primero.
// Lee la partida que ya tiene tu navegador (G.DB.save, o la copia de localStorage ps.cloud.* /
// ps.save.* más reciente si el juego cambia) y la descarga como pokesurvivor-partida-<nombre>-<fecha>.json.
// No envía nada a ninguna parte ni modifica nada. Si se pega en nuestra versión (allí existe
// G.Importar), avisa y no hace nada: una partida no se puede traer a sí misma. Como invitado o
// sin sesión, también avisa y no descarga nada. Los avisos salen en español si el navegador está
// en español y, si no, en inglés. El archivo se elige después en Ajustes > Cuenta de nuestra versión.
//
// Es el MISMO código que G.Importar.EXPORTADOR (js/core/importar.js), el que enseña el juego con
// el botón Copiar: aquél es éste en una sola línea, sin los comentarios ni la sangría.
// tools/nico/check.js comprueba que coinciden. Esta versión también se puede pegar tal cual.
(() => {
  // G es el juego oficial; G.DB.save, la partida abierta (null si no hay sesión iniciada).
  const g = typeof G === 'object' && G ? G : window.G, db = g && g.DB;
  // Idioma de los avisos: español si el navegador está en español; si no, inglés.
  const es = String(typeof navigator === 'object' && navigator && navigator.language || 'es').toLowerCase().startsWith('es'), T = (a, b) => (es ? a : b);
  // Pegado en NUESTRA versión (tiene G.Importar): no es el juego oficial, así que no hace nada.
  if (g && g.Importar && g.Importar.TIPO === 'pokesurvivor-partida') return alert(T('Esta página es la versión modificada, no el juego oficial. Pega este código en la consola del juego oficial, con tu cuenta iniciada.', 'This page is the modified version, not the official game. Paste this code into the console of the official game, signed in to your account.'));
  // Como invitado no hay cuenta que traer: primero hay que iniciar sesión.
  if (db && db.guest) return alert(T('Estás jugando como invitado. Inicia sesión con tu cuenta en el juego y vuelve a pegar esto.', 'You are playing as a guest. Sign in to your account in the game and paste this again.'));
  // La partida abierta. Si el juego ha cambiado por dentro y ya no existe G.DB.save, la copia más
  // reciente que guarda el navegador (ps.cloud.* con cuenta en la nube, ps.save.* en local).
  // Si G.DB.save existe pero está vacío (sin sesión), no tira de copias viejas.
  let s = db && db.save;
  if (!s && !(db && 'save' in db)) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || '';
        if (!k.startsWith('ps.cloud.') && !k.startsWith('ps.save.')) continue;
        // Sólo lee (getItem); una copia rota se salta.
        try { const v = JSON.parse(localStorage.getItem(k)); if (v && v.owned && (!s || (v.updated || 0) > (s.updated || 0))) s = v; } catch (e) {}
      }
    } catch (e) {}
  }
  if (!s || typeof s !== 'object' || !s.owned) return alert(T('No encuentro tu partida. Inicia sesión con tu cuenta en el juego (no como invitado), espera a ver el menú y vuelve a pegar esto.', 'Your save was not found. Sign in to your account in the game (not as a guest), wait until you see the menu and paste this again.'));
  // Nombre del archivo: el apodo (sólo letras, números, _ y -) y la fecha de hoy según el reloj
  // del PC, no la de Greenwich (de madrugada en España sería la de ayer).
  const nombre = String(s.name || 'jugador').replace(/[^a-z0-9ñáéíóúü_-]+/gi, '_'), d = new Date(), dd = n => String(n).padStart(2, '0'), fecha = d.getFullYear() + '-' + dd(d.getMonth() + 1) + '-' + dd(d.getDate());
  // La descarga: un enlace a un Blob del propio navegador, sin red. Dentro va la partida tal cual,
  // en un envoltorio que dice qué es, de qué web sale y cuándo se exportó.
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ tipo: 'pokesurvivor-partida', version: 1, origen: location.host, exportado: Date.now(), save: s })], { type: 'application/json' }));
  a.download = 'pokesurvivor-partida-' + nombre + '-' + fecha + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  console.log(T('Partida exportada: ', 'Save exported: ') + Object.keys(s.owned).length + T(' Pokémon en ', ' Pokémon in ') + a.download + T('. Ya puedes cerrar la consola.', '. You can close the console now.'));
})();
