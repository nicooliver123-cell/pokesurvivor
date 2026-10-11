/* ============ mods.js — ajustes de nuestra versión (MOD nico) ============
 * Todo lo que esta versión modificada cambia del juego original se controla
 * aquí. En el código de upstream sólo hay ganchos de una o dos líneas marcados
 * con el comentario "// MOD nico" (búscalos con: git grep -n "MOD nico").
 *
 * Se carga justo después de util.js (dev.html), antes de cualquiera que lo use.
 * Si tras un merge faltara este fichero, los ganchos se comportan de forma
 * segura: los enemigos siguen sin curarse y el tamaño queda como el original.
 *
 * COOPERATIVO: los dos jugadores tienen que usar la MISMA versión (mismos
 * valores). El anfitrión decide los enemigos (curación) y cada cliente calcula
 * el tamaño de todos los jugadores a partir de su Pokémon, sin mandarlo por red.
 *
 * Tras cambiar un valor: `node tools/build.js --privado` (index.html usa el
 * paquete js/app.min.js) y, si quieres comprobarlo, el arnés de tools/nico/.
 */
G.MODS = {
  /* Curación de los enemigos.
   *   false (por defecto): NINGÚN enemigo recupera vida.
   *     - Las 14 especies curanderas del original (Clefairy, Chansey, Blissey,
   *       Audino, Sylveon, Hatterene...) dejan de curar y pelean con el
   *       comportamiento que les toca por su tipo, como cualquier otra.
   *     - El hueco de "apoyo" de cada tramo sale escudo o invocador.
   *     - Red de seguridad: aunque llegue un curandero por otra vía, no cura.
   *     - Los escudos (burbuja azul) se mantienen: no curan, absorben daño un rato.
   *   true: como el original (cada curandero devuelve un 7 % de la vida máxima a
   *     los enemigos de alrededor cada 3,5 s, jefes incluidos). */
  curacionEnemiga: false,

  /* Ancho máximo del Pokémon que CONTROLAS, en píxeles de arte del fotograma
   * Idle (los sprites de los Pokémon normales miden 24-40). Si tu Pokémon es más
   * ancho, se encoge todo su cuerpo en la misma proporción: sprite, sombra,
   * hitbox (círculo de choque con disparos, enemigos, zonas y paredes) y altura
   * del nombre y los números. Los que no pasan del límite quedan intactos.
   *   56 (por defecto): se reducen 38 de 966 (Guzzlord ×0,47, Eternatus ×0,54,
   *      Onix ×0,58, Articuno ×0,64, Rayquaza ×0,70, Lugia y Gyarados ×0,78,
   *      Kyogre y Groudon ×0,88...). Hitbox máxima 24,6, la de Zacian; Pikachu 17,6.
   *   64: más suave (26 reducidos, hitbox máxima 28,2).
   *   48: más fuerte (61 reducidos, hitbox máxima 21,1).
   *   0: desactivado (tamaño original).
   * NO cambia el alcance de los ataques (salen de los pies con el radio de cada
   * movimiento) ni el tamaño de los enemigos, los jefes o los menús. */
  anchoMaxJugador: 56,

  /** Escala del Pokémon de un jugador (1 = tamaño original). Usa la geometría
   *  normal (nunca la shiny) para que todos los clientes calculen lo mismo. */
  escalaJugador(dex) {
    const max = +this.anchoMaxJugador;
    if (!(max > 0) || !isFinite(max)) return 1;
    const m = G.Sprites && G.Sprites.animMeta(dex, 'Idle');
    return Math.min(1, max / (m ? m.w : 32));
  }
};
