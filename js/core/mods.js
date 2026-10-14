/* ============ mods.js — ajustes de nuestra versión (MOD nico) ============
 * Todo lo que esta versión modificada cambia del juego original se controla
 * aquí. En el código de upstream sólo hay ganchos de una o dos líneas marcados
 * con el comentario "// MOD nico" (búscalos con: git grep -n "MOD nico").
 *
 * Se carga justo después de util.js (dev.html), antes de cualquiera que lo use.
 * Si tras un merge faltara este fichero, los ganchos se comportan de forma
 * segura: los enemigos siguen sin curarse, el tamaño queda como el original,
 * no hay grieta garantizada y los tickets y el gacha son los del original.
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

  /* Cooperativo: lo que VE el invitado de la vida de los enemigos (con
   * curacionEnemiga=false; con true, todo como el original).
   * El anfitrión decide la vida real. El invitado resta su golpe en pantalla al
   * momento (predicción) y después recibe la vida del anfitrión unas 15 veces por
   * segundo. Con latencia, ese dato puede salir del anfitrión ANTES de que le
   * llegue el golpe, y la barra subía: parecía que el enemigo se curaba.
   *   - Durante esta ventana tras tu último golpe predicho a un enemigo, el
   *     invitado no acepta del anfitrión una vida MAYOR que la que enseña.
   *     Pasada la ventana acepta la del anfitrión, para no desincronizarse (por
   *     si el golpe no llegó a contar).
   *   - Con escudo activo (bit de estado que manda el anfitrión) no se predice:
   *     el escudo absorbe el golpe y la barra no debe bajar.
   * Milisegundos. Directo (WebRTC, ~15 mensajes/s): 600 de sobra. Por el relé de
   * la Realtime Database van 3 mensajes/s y la ida y vuelta puede pasar de 1 s:
   * 1500. 0 = sin ventana (como el original). */
  ventanaVidaMs: 600,
  ventanaVidaReleMs: 1500,

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

  /* Grieta garantizada: en cada partida se abre UNA grieta (la del vínculo, para
   * fusionar movimientos) antes de este segundo de juego. La hora se elige al
   * azar entre 45 y 10 s antes del límite (con 120: entre 75 y 110 s; el reloj
   * de juego se para en las cartas, en la pausa en solitario y al elegir fusión).
   *   - Sólo si en la partida aún no ha habido ninguna (natural o ésta): si la
   *     tirada normal de rift.js ya abrió una, no se fuerza otra.
   *   - Una por partida: si no entráis antes de que se cierre, NO se reabre.
   *   - No con un jefe vivo (espera a que caiga, hasta el límite) y, si no hay
   *     sitio libre cerca, lo vuelve a intentar cada segundo.
   *   - La decide quien manda en rift.js: el jugador en solitario, el anfitrión
   *     en grupo (el invitado la recibe como cualquier otra).
   *   - Las grietas naturales siguen igual (después de ésta, la tirada de cada
   *     30 s vuelve a empezar cuando se cierra).
   * 0 = desactivado (como el original). */
  grietaGarantizadaAntesDe: 120,

  /* Vida del legendario de ESA grieta, sobre la normal: 0,6 = el 60 %. Es la
   * PRIMERA grieta de la partida si se abre antes de grietaGarantizadaAntesDe,
   * sea la forzada o la natural (la tirada de los 105 s, en ~3 % de las partidas,
   * cuando cae antes de la hora elegida). A los 110 s son unos 2.500 en solitario y
   * 4.600 en dúo (sin rebaja, 4.200 y 7.600). Las grietas posteriores no cambian.
   * En grupo lo decide el anfitrión y el invitado recibe su vida. 1 = sin rebaja. */
  grietaGarantizadaVida: 0.6,

  /* Tickets del gacha GANADOS (decisión de Nico): cada uno cuenta por ticketsMult.
   *   - En partida: los objetos ticket y ticket ×10 que se recogen. El contador de la
   *     partida (pl.t1/pl.t10, lo que viaja por la red) sigue contando 1 por objeto; al
   *     apuntarlos en tu partida guardada (game.js, bankTickets) se multiplican. En grupo,
   *     cada jugador multiplica con SU ajuste los del equipo.
   *   - Fuera de partida: los premios de misiones y logros (progress.js, grant). Las
   *     Pokémonedas de esos premios no cambian.
   *   - No es ganar (no cambia): gastarlos en el gacha, traer la partida oficial (suma lo
   *     que tenía allí, una vez) ni juntar partidas de la nube.
   * Entero. 1 = como el original. */
  ticketsMult: 2,

  /* Probabilidad de shiny (decisión de Nico): ×shinyMult en los sitios donde se sortea:
   * salvajes y jefes (1/4096), el legendario de la grieta (1/512) y el gacha (1/100, que
   * pasa a 1,5 %; el cartel de probabilidades del gacha lo dice). En grupo, los salvajes y
   * la grieta los sortea el anfitrión; el gacha, cada uno el suyo. 1 = como el original. */
  shinyMult: 1.5,

  /* Pokémon REPETIDO en el gacha (decisión de Nico):
   *   - Repetido normal: desbloquea su siguiente fase inmediata que no tengas (con varias ramas,
   *     una de las que te faltan al azar: Eevee da sus 8 evoluciones, una por repetido).
   *   - Repetido SHINY (ya tenías ese shiny): su siguiente fase en SHINY (y la normal, si te
   *     faltaba), entre las que tienen sprite shiny y aún no tienes en shiny. Las 4 evoluciones
   *     sin sprite shiny (Greedent, Barraskewda, Oinkologne, Naclstack) no cuentan: un shiny
   *     repetido vale el triple y no se rebaja a un desbloqueo normal.
   *   - Si no queda ninguna o la especie no evoluciona: Pokémonedas, como el original (un
   *     shiny repetido, el triple).
   *   - Un shiny nuevo de una especie que ya tienes en normal sigue siendo NUEVO (no es repetido).
   *   - En una tirada ×10 se miran en orden; el pity no cambia. Quedan apuntados con from 'evo'.
   *   - Datos: js/data/evolutions.js (G.EVO, de tools/nico/evoluciones.js). Si falta, todo como el
   *     original. Sólo el gacha: el shiny salvaje repetido y el rescate no cambian.
   * false = como el original. */
  repetidoDaEvolucion: true,

  /* ---- Claridad en partida (aprobado por Nico en la revisión con maquetas del 12-10-2026) ----
   * Todo es dibujo local (js/entities/claridad.js): no viaja por la red ni cambia el juego, así
   * que en grupo cada cliente lo ve con su ajuste, también con los enemigos del anfitrión. */

  /* Tu Pokémon siempre visible: un aro a los pies (dorado el tuyo; blanco frío el de tus
   * compañeros). Si algo dibujado delante lo tapa (enemigos, árboles, hierba alta, otro jugador:
   * se mira con las cajas de sus sprites), se vuelve a pintar ENCIMA con un contorno de 1 píxel
   * de arte (blanco el tuyo, blanco frío los compañeros) y el aro. A escala con la reducción de
   * los grandes (anchoMaxJugador). false = como el original. */
  jugadorVisible: true,

  /* Chevrón dorado encima de tu Pokémon (sólo el tuyo), pintado después de los números:
   * 'tapado' (por defecto: sólo cuando algo lo tapa), 'siempre' o 'nunca'. */
  jugadorChevron: 'tapado',

  /* Números de daño: un número por enemigo mientras vive. Los golpes al mismo enemigo se suman
   * en un único número encima de él, que da un saltito con cada golpe; al caer el enemigo, o tras
   * numerosPausa segundos sin golpes, sube y se desvanece. Los del escudo (azules), aparte. Respeta
   * Ajustes > Números de daño. false = un número por golpe, como el original. */
  numerosAgrupados: true,
  numerosPausa: 1,

  /* Disparos enemigos con contorno rojo (#ff2440) de 1 píxel de arte. false = como el original. */
  contornoDisparos: true,

  /* Barras de vida de los enemigos: sólo durante estos segundos después de que les cambie la vida.
   * Jefes, legendarios, shiny, duendes del tesoro y apoyos (escudo, invocador y curandero) la
   * conservan como en el original. 0 = como el original (siempre que estén heridos). */
  barrasTrasGolpe: 1.5,

  /* Borde rojo: al recibir daño, un fogonazo breve (alfa 0,2-0,45 según el daño, ~0,35 s) y, por
   * debajo del 30 % de vida, un latido lento. Con «Menos sacudidas y destellos», a la mitad. Sólo
   * tu propio Pokémon. false = sin borde. */
  vinetaDanio: true,

  /* Arreglo de un fallo de upstream (desde «Arenas de grieta por tipo», 3f85b87): a partir del
   * minuto 12 el mapa normal se volvía una arena de la grieta («Grieta · …», con su líquido y su
   * daño; y en el 84 se rompía). true = el mapa rota entre sus 3 biomas normales cada 4 min.
   * false = como upstream. */
  biomasEnCiclo: true,

  /* Arreglo de un fallo de upstream: el fogonazo del viaje de vuelta de la grieta se quedaba
   * congelado mientras eliges la fusión (y en cualquier pausa). true = se apaga a su ritmo. */
  destelloSinCongelar: true,

  /* Avisos de logro y resultado del gacha: nada encima del resultado. Los logros de una tirada
   * (salen al tirar) esperan a que lo cierres con «Continuar», y un aviso que ya estaba en pantalla
   * al tirar se esconde mientras tanto (si le queda tiempo, vuelve al cerrarlo; regla de
   * css/style.css). Encima del resultado tapaban las cartas (en un móvil en horizontal, y en una
   * ×10 también en un portátil de 1280x720) o «Continuar». false = como el original. */
  avisosTrasGacha: true,

  /* Animación de la tirada del gacha (decisión de Nico, 14-10-2026): true = una máquina de gancho
   * coge del montón la Poké Ball de la rareza que ha salido y la suelta en la bandeja (js/ui/gancho.js).
   * Sólo es la animación: probabilidades, pity y premios siguen en gacha.js. false = la tragaperras
   * del original. */
  maquinaGancho: true,

  /* Guardería Pokémon (decisión de Nico, 14-10-2026; js/systems/guarderia.js, en la pantalla Mejoras): plazas, lo que
   * cuesta dejar a un Pokémon (cada vez que entra; sacarlo es gratis y conserva lo ganado) y cada cuántos segundos de
   * run gana cada uno 1 nivel en una de sus mejoras al azar. Sólo cuenta el tiempo de las runs de quien tiene la
   * guardería, solo o en grupo. guarderiaPlazas: 0 = sin guardería. */
  guarderiaPlazas: 5,
  guarderiaPrecio: 500,
  guarderiaSegundosPorPunto: 120,

  /* Menú de pruebas en Ajustes > Cuenta (petición de Nico, 14-10-2026; js/ui/dev-menu.js): las cuentas que lo ven, por la
   * huella SHA-256 de su uid de Firebase (el repositorio es público: el uid no se escribe). [] = nadie. */
  devHuellas: ['b9f8d94bd49b7471e01e9827da437297a0dad61278c0fa80bda2a936b5e1db4c'],   // Nico (su cuenta de Google)

  /** Crédito al juego original en Ajustes > Acerca de (decisión de Nico, 14-10-2026): su nombre y su autor, sin
   *  enlaces a su web ni a su repositorio (tools/nico/base.js sólo los deja aquí, en lang-en-mod.js y en los
   *  créditos del repositorio). */
  creditoOriginal() {
    return '<p class="sub">PokéSwarm es un proyecto personal de Nico, inspirado en <b>PokéSurvivor</b>, el juego de fans de <b>JPTER78</b>, y desarrollado a partir de su código (licencia MIT).</p>';
  },

  /* ---- Identidad visual «Dex de Expedición» (elegida por Nico el 12-10-2026) ----
   * Estilo que ve quien no lo ha cambiado en Ajustes > Gráficos > Estilo (js/ui/estilo.js):
   *   'dex'      menús de Rotom-Dex (css/nico.css) y letra M PLUS Rounded 1c en todo, también en el
   *              lienzo (Pixelify sólo en el logotipo). En los lotes siguientes: HUD Dex y entornos.
   *   'clasico'  el aspecto del juego original, con la tanda 1 de claridad y los arreglos que no son
   *              estética (menús sin el de detrás, gacha y fin de partida en móvil, lienzos del
   *              compañero y del premio al tamaño en que se ven).
   * La elección del jugador se guarda en su navegador y gana a este valor. Es local: en grupo, cada
   * uno juega con el suyo. 'clasico' mientras se implementa la identidad (pasará a 'dex' al cerrarla). */
  estiloPorDefecto: 'clasico',

  /* ---- Entornos del Gremio y horneado escalonado (lote 3 de la identidad; js/world/entorno.js y horno.js) ----
   * Horneado escalonado del suelo, en los DOS estilos (es rendimiento: el chunk horneado no cambia). Upstream hornea cada
   * trozo de suelo la primera vez que se ve y, al cambiar de bioma (cada 4 min; en el fondo de los menús, cada 30 s),
   * todos los visibles en el mismo fotograma: un tirón de 20-45 ms. Ahora, como mucho UN trozo por fotograma (y sólo si
   * en ese fotograma no se ha horneado otro); si uno cuesta más que hornoMsFotograma (un móvil lento), uno cada
   * ceil(coste / hornoMsFotograma) fotogramas. Y hornoAnticipoS segundos antes de cada cambio de bioma se precalientan
   * los visibles y un anillo con la paleta siguiente, uno cada 2 fotogramas: al cambiar, 0 trozos horneados. */
  hornoMsFotograma: 4,
  hornoAnticipoS: 3,

  /* Halos de luz en el suelo (Dex, Calidad alta) bajo los disparos ENEMIGOS, en el rojo de peligro. false (por defecto,
   * decisión de Nico): sólo los de tus disparos, con el color de su tipo; el rojo de «esto te hace daño» ya lo pone el
   * contorno de la tanda 1 (contornoDisparos). */
  halosDisparosHostiles: false,

  /* Lo que pinta el entorno Dex sobre el suelo según Ajustes > Gráficos > Calidad (0 Baja, 1 Media, 2 Alta; «Auto»
   * empieza en Alta, o en Media en un táctil, y baja sola si va a tirones). La gradación del suelo NO depende de esto:
   * va horneada (cambiar de Calidad obligaría a rehornear).
   *   farol         sombra amplia del suelo alrededor de tu Pokémon (nunca tiñe un sprite);
   *   halos         luces pixeladas sobre el suelo: 'grieta', 'jefe' (color de su tipo) y 'disparos' (los tuyos, hasta 24);
   *   motas         polen, polvo o brasas del bioma (factor sobre su número; 0 = ninguna);
   *   clima         densidad de la lluvia, la nieve, la arena y el sol (1 = la de la guía);
   *   salpicaduras  de la lluvia, sobre el suelo y de un píxel de arte.
   * Con Clásico no se pinta nada de esto. */
  calidadEntorno: [
    { farol: false, halos: [], motas: 0, clima: 0.5, salpicaduras: false },
    { farol: true, halos: ['grieta'], motas: 0.7, clima: 1, salpicaduras: true },
    { farol: true, halos: ['grieta', 'jefe', 'disparos'], motas: 1, clima: 1, salpicaduras: true }
  ],

  /* ---- Pantallas: móviles en vertical y plegables ----
   * «Gira el móvil» (tapa la partida y la pausa) sólo en una pantalla PEQUEÑA y claramente EN VERTICAL:
   * ancho/alto por debajo de giroAspectoMax Y el lado corto por debajo de giroLadoMax px CSS. Upstream
   * lo pedía en cualquier pantalla táctil con más alto que ancho, y un plegable desplegado (casi
   * cuadrado: el Honor Magic V6 de Nico, ~0,9:1 sujeto en vertical) no podía jugar.
   *   0,8 y 600 (por defecto): un móvil en vertical (390x844, 0,46) lo pide; un plegable desplegado
   *     (800x870, 900x1000) o una tableta en vertical (768x1024) juegan.
   * El botón de pantalla completa sólo fija la horizontal donde la vertical pediría girar.
   * giroAspectoMax = 1 y giroLadoMax = 0 = como upstream. */
  giroAspectoMax: 0.8,
  giroLadoMax: 600,

  /* ---- Lote 4 de la identidad: ajustes de juego (js/ui/encuadre.js, transicion.js y golpe-final.js) ----
   * Píxel nítido (Ajustes > Gráficos > Pantalla; en los DOS estilos): cada píxel del dibujo ocupa un número
   * ENTERO de píxeles de tu pantalla. Resolución interna del lienzo: con un devicePixelRatio de hasta 1,5, el de
   * la pantalla; con más, dpr / ceil(dpr / 1,5) (2 -> 1, 2,625 -> 1,3125, 3 -> 1,5): el navegador lo amplía por
   * un entero y nunca se pintan más píxeles que en upstream. El píxel de arte se redondea al entero más cercano
   * (empate hacia arriba), salvo si así se dejara de ver más de pixelNitidoPerdidaMax del mundo (a lo ancho y a
   * lo alto): entonces hacia abajo, y se ve algo MÁS de mundo. 1440x900 pasa de 3,75 a 4 px (6,25 % menos);
   * 844x390 a dpr 3, de 5,57 a 4 (con 6 se perdería un 7,1 %).
   *   pixelNitidoPorDefecto: lo que ve quien no lo ha tocado en Ajustes (lo elegido gana). false = upstream. */
  pixelNitidoPorDefecto: true,
  pixelNitidoPerdidaMax: 0.07,

  /* Encuadre (sólo con el HUD Dex en su variante compacta: móvil en horizontal, plegable abierto, pantalla
   * dividida): la cámara se corre para que tu Pokémon quede en el centro de la zona libre, sin las filas de
   * arriba ni la columna de los ataques, suavizado en unos 400 ms. 0 en los menús y con el HUD de escritorio.
   * Sólo mueve la cámara de tu pantalla: no viaja por la red. false = siempre en el centro, como upstream. */
  encuadreMovil: true,

  /* Transiciones (sólo con Dex): iris centrado en tu Pokémon al empezar la partida (se abre desde negro), al
   * entrar en la arena de la grieta (negro al instante y se abre en 280 ms) y al salir (se cierra en 220 ms
   * dentro de la espera de la vuelta, 80 ms de negro como mínimo y se abre). Nunca en el cambio de bioma ni al
   * volver de la pausa. Con movimiento reducido o «Menos sacudidas», fundidos de 150 ms. false = sin iris. */
  transiciones: true,

  /* Golpe final (en los dos estilos, SÓLO en solitario): al derrotar a un jefe o al legendario de la grieta, el
   * juego se queda quieto golpeFinalMs (se sigue dibujando), el derrotado sale blanco 2 fotogramas y la cámara
   * da una sacudida amortiguada (4 px de mundo, 9 Hz, τ = 0,12 s, 0,4 s, de tu Pokémon hacia él) en vez del
   * temblor al azar. «Menos sacudidas»: ×0,25 y sin destello; movimiento reducido: sin sacudida. En grupo, nada
   * (congelaría a los demás), ni con tu Pokémon caído. 0 = sin congelación; golpeFinalSacudida false = el
   * temblor de upstream. */
  golpeFinalMs: 140,
  golpeFinalSacudida: true,

  /* ---- Pantalla dividida estilo Nintendo DS (lote 5, petición de Nico; js/ui/pantalla-dividida.js) ----
   * Ajustes > Controles > «Pantalla dividida»: el mundo y el HUD en una mitad y, en la otra, un panel de mandos
   * (joystick grande, los 4 ataques, objeto, pausa, PS y nivel). Siempre opcional. Local de cada jugador.
   *   divididaPorDefecto: 'no' (desactivada) | 'abajo' (juego arriba, mandos abajo) | 'lado' (a un lado) |
   *     'auto' (sólo plegado a medias en modo mesa, si el navegador informa de la postura). Lo elegido gana.
   *   divididaMargenBisagra: px que quedan libres a cada lado de la línea que parte la pantalla (la bisagra o,
   *     sin saberla, la mitad exacta): ni un botón ni un texto encima.
   *   divididaEscalaMin / divididaEncogeMax: el tamaño del mundo en la mitad de juego. La regla de upstream (ver
   *     como poco 420 de mundo de alto) deja los Pokémon diminutos en una franja baja (844x195 en un móvil: 0,46) y
   *     el píxel nítido, que redondea hacia abajo para no perder más de un 7 % de mundo, los encogía a la mitad
   *     (0,33 en el móvil y 0,5 a 1024x768). Ahora la escala parte de como poco divididaEscalaMin px CSS por px de
   *     mundo (0,6: un píxel de arte de 1,2 px CSS; a pantalla entera en un móvil, 1,33) y el redondeo hacia abajo
   *     no encoge más de divididaEncogeMax (25 %): si encogería más, hacia arriba. El Magic V6 no cambia (mesa,
   *     0,667; abierto en vertical, 1). Sólo con la pantalla dividida. 0 / 1 = como antes. */
  divididaPorDefecto: 'no',
  divididaMargenBisagra: 16,
  divididaEscalaMin: 0.6,
  divididaEncogeMax: 0.25,

  /* ---- Sin el test de personalidad (petición de Nico del 13-10-2026: «quita las preguntas del principio») ----
   * true: una partida sin compañero (cuenta nueva o invitado) no pasa por las 8 preguntas de js/ui/test.js: va
   *   directa a «Elige a tu compañero» (js/ui/elegir-companero.js), con los 29 iniciales de js/data/starters.js,
   *   cada uno con su sprite, su nombre y su tipo, «Al azar» y «Elegir a X». Al confirmar se guarda como hacía el
   *   test (inicial, compañero y el Pokémon en la colección), con la personalidad en null.
   * false: como upstream (el test, su resultado y «Elegir otro»). test.js no se toca en ningún caso. */
  sinTest: true,

  /** game.js, checkOrientation(): ¿pide girar una pantalla de w×h px CSS (táctil)? */
  pedirGiro(w, h) {
    if (!(w > 0) || !(h > 0) || !(h > w)) return false;
    const asp = +this.giroAspectoMax, lado = +this.giroLadoMax;
    if (!(lado > 0) && asp >= 1) return true;   // como upstream
    return w / h < (asp > 0 ? asp : 0.8) && (!(lado > 0) || Math.min(w, h) < lado);
  },

  /** settings-ui.js, pantalla completa: ¿se fija la horizontal? Sólo si esta pantalla, en vertical,
   *  pediría girar (un móvil); un plegable desplegado o una tableta se quedan como los tengas. */
  fijarHorizontal() {
    const s = typeof screen !== 'undefined' ? screen : null;
    if (!s || !(s.width > 0) || !(s.height > 0)) return true;
    return this.pedirGiro(Math.min(s.width, s.height), Math.max(s.width, s.height));
  },

  /** game.js, update(): el bioma del mapa para el tramo `b` (= minutos / 4). Con biomasEnCiclo,
   *  siempre uno normal (0..G.Tiles.NORMAL-1); las arenas sólo las pone rift.js. */
  biomaNormal(b) {
    const n = (G.Tiles && G.Tiles.NORMAL) | 0;
    if (!this.biomasEnCiclo || !(n > 0) || !isFinite(b)) return b;
    b = Math.floor(b);
    return ((b % n) + n) % n;
  },

  /** spawner.js, rift.js y gacha.js: la probabilidad de shiny `p` con el ajuste (como mucho 1). */
  probShiny(p) {
    const k = +this.shinyMult;
    return k > 0 && isFinite(k) ? Math.min(1, p * k) : p;
  },

  /** gacha.js, pull(): `dex` ha salido repetido (`shiny`: ya tenías ese shiny). Si le queda una
   *  evolución por desbloquear, la apunta en `save` (from 'evo') y devuelve su dex; si no, 0 (y
   *  pull() da las monedas del original). Con varias ramas, una de las que faltan al azar. */
  evolucionDeRepetido(save, dex, shiny) {
    if (!this.repetidoDaEvolucion || !G.EVO || !save || !save.owned) return 0;
    const hijos = G.EVO[dex];
    if (!Array.isArray(hijos)) return 0;
    const meta = G.SPRITE_META || {};
    const enJuego = d => !!(G.DEX_BY && G.DEX_BY[d] && meta[d]);
    const conShiny = d => (G.Sprites && G.Sprites.hasShiny ? G.Sprites.hasShiny(d) : !!meta[d].sh);
    save.shiny = save.shiny || {};
    const faltan = hijos.filter(d => enJuego(d) && (shiny ? conShiny(d) && !save.shiny[d] : !save.owned[d]));
    if (!faltan.length) return 0;
    const d = faltan.length === 1 ? faltan[0] : faltan[Math.min(faltan.length - 1, Math.floor(Math.random() * faltan.length))];
    const at = Date.now();
    if (!save.owned[d]) save.owned[d] = { at, from: 'evo' };
    if (shiny) save.shiny[d] = { at, from: 'evo' };
    return d;
  },

  /** Texto de la carta de un repetido que desbloquea su evolución (`r`: resultado de pull, con `evo`). */
  textoEvolucion(r) {
    const n = ((G.DEX_BY && G.DEX_BY[r.evo]) || {}).name || '';
    return '¡Repetido! Desbloqueas ' + n + (r.shiny ? ' shiny' : '');
  },

  /** gacha-ui.js, al pintar la carta `card` de ese repetido: el texto y la evolución en pequeño. */
  marcarEvolucion(card, r) {
    const tag = card && card.querySelector && card.querySelector('.tag');
    if (!tag || !r || !G.DEX_BY || !G.DEX_BY[r.evo]) return;
    tag.textContent = '';
    const s = document.createElement('span');
    s.className = 'new';
    s.textContent = this.textoEvolucion(r);
    tag.appendChild(s);
    if (G.UI && G.UI.spriteCanvas) {
      const cv = G.UI.spriteCanvas(r.evo, 40, 40, { scale: 1, shiny: !!r.shiny });
      cv.style.cssText = 'display:block;margin:2px auto 0;width:40px;height:40px';
      tag.appendChild(cv);
    }
  },

  /** La nota de los repetidos en el cartel del gacha, con repetidoDaEvolucion. */
  NOTA_REPETIDOS: '· Un repetido desbloquea su siguiente evolución si aún no la tienes (si es shiny, en shiny); si ya no le queda ninguna, da Pokémonedas (un shiny, el triple).',

  /** gacha-ui.js, refresh(): el cartel de probabilidades (su HTML ya pintado) con el % de shiny
   *  del ajuste y, con repetidoDaEvolucion, la nota de los repetidos. Si upstream cambia esos
   *  textos, no toca nada (tools/nico/check.js lo vigila). */
  notasGacha(html) {
    if (typeof html !== 'string' || !G.Gacha) return html;
    const pct = +(this.probShiny(G.Gacha.SHINY_RATE) * 100).toFixed(2) + '%';
    let h = html.replace('<span>1%</span>', '<span>' + pct + '</span>');
    if (this.repetidoDaEvolucion && G.EVO) h = h.replace('· Los repetidos dan Pokémonedas (los shiny repetidos, el triple).', this.NOTA_REPETIDOS);
    return h;
  },

  /** progress.js, showNext(): ¿espera el aviso de logro? (`seguir`: showNext, que se vuelve a llamar).
   *  Con el resultado del gacha abierto, sí. pull() de gacha-ui.js comprueba los logros (y avisa)
   *  justo ANTES de abrir el resultado, así que en la pantalla del gacha la primera vez se vuelve a
   *  mirar en el turno siguiente. Fuera del gacha no cambia nada. Además pone en <html> la clase
   *  mod-avisos-tras-gacha con el ajuste: con ella, css/style.css esconde mientras está abierto el
   *  resultado un aviso que ya estaba en pantalla al tirar (vuelve al cerrarlo si le queda tiempo).
   *  Antes de todo, G.Estilo.colocarLogro(): con el HUD Dex en partida, el aviso sale bajo su banda de arriba. */
  _avisoMirado: false,
  avisoEnEspera(seguir) {
    if (typeof document === 'undefined' || typeof seguir !== 'function') return false;
    if (G.Estilo && G.Estilo.colocarLogro) G.Estilo.colocarLogro();   // con el HUD Dex en partida, bajo su banda de arriba
    const raiz = document.documentElement;
    if (raiz && raiz.classList) raiz.classList.toggle('mod-avisos-tras-gacha', !!this.avisosTrasGacha);
    if (!this.avisosTrasGacha) return false;
    const fx = document.getElementById('pull-fx'), gacha = document.getElementById('scr-gacha');
    if (fx && !fx.classList.contains('hidden')) { this._avisoMirado = true; setTimeout(seguir, 200); return true; }
    if (!this._avisoMirado && gacha && !gacha.classList.contains('hidden')) { this._avisoMirado = true; setTimeout(seguir, 0); return true; }
    this._avisoMirado = false;
    return false;
  },

  /** Multiplicador de tickets saneado: entero ≥ 1 (cualquier otro valor, 1). */
  multTickets() {
    const m = Math.floor(+this.ticketsMult);
    return m >= 1 && isFinite(m) ? m : 1;
  },

  /** game.js, bankTickets() y pantalla final: `n` tickets de la partida -> los que van a tu partida guardada. */
  tickets(n) { return n * this.multTickets(); },

  /** progress.js, grant() y rewardText(): el premio de una misión o un logro con sus tickets
   *  multiplicados. Devuelve una COPIA (no toca G.MissionDefs ni G.AchDefs); las monedas, igual. */
  premio(r) {
    const m = this.multTickets();
    if (!r || typeof r !== 'object' || m === 1) return r;
    const c = Object.assign({}, r);
    if (c.t1) c.t1 *= m;
    if (c.t10) c.t10 *= m;
    return c;
  },

  /** game.js, onCollect(): el texto que flota al coger un ticket (con 1, el del original). */
  textoTicket(kind) {
    const m = this.multTickets();
    if (kind === 'ticket') return m === 1 ? '+1 ticket' : '+' + m + ' tickets';
    return m === 1 ? '¡Ticket ×10!' : '¡' + m + ' tickets ×10!';
  },

  /** Estado de la grieta garantizada de cada partida. La clave es el jugador local,
   *  que es nuevo en cada startRun: { hora, hecha, intentoT, grieta, usada, cierreT }. */
  _grietas: new WeakMap(),

  /** rift.js, update(), en cada fotograma: ¿hay que abrir ya la grieta garantizada?
   *  `hayGrieta`: hay una grieta o una arena; `manda`: este cliente decide las grietas. */
  grietaGarantizada(pl, time, hayGrieta, manda) {
    const lim = +this.grietaGarantizadaAntesDe;
    if (!(lim > 0) || !isFinite(lim) || !pl || typeof pl !== 'object') return false;
    let st = this._grietas.get(pl);
    if (!st) {
      const a = Math.max(0, lim - 45), b = Math.max(a, lim - 10);
      st = { hora: a + Math.random() * (b - a), hecha: false, intentoT: -Infinity, grieta: null, usada: false, cierreT: 0 };
      this._grietas.set(pl, st);
    }
    if (hayGrieta) {                                      // ya hay (o hubo) una: natural o ésta
      // La PRIMERA grieta de la partida, si se abre antes del límite, es la garantizada aunque sea
      // la natural (la tirada de los 105 s): su legendario también sale con grietaGarantizadaVida.
      const r = G.Rift && G.Rift.rift;
      if (!st.hecha && manda && time < lim && r && !st.grieta) this.grietaAbierta(pl, r, time);
      st.hecha = true;
      return false;
    }
    if (st.hecha || !manda || !(time >= st.hora) || !(time < lim)) return false;
    if (G.EnemyMgr && G.EnemyMgr.bossAlive && G.EnemyMgr.bossAlive()) return false;
    if (time - st.intentoT < 1) return false;           // open() no encontró sitio: otra vez en 1 s
    st.intentoT = time;
    return true;
  },

  /** Hora elegida para la grieta garantizada de esta partida (null si aún no hay). Para pruebas. */
  grietaGarantizadaHora(pl) {
    const st = pl && typeof pl === 'object' ? this._grietas.get(pl) : null;
    return st ? st.hora : null;
  },

  /** rift.js, update(): se acaba de abrir la grieta garantizada (`rift`, con su ttl). También
   *  grietaGarantizada(), cuando la primera de la partida es una natural abierta antes del límite. */
  grietaAbierta(pl, rift, time) {
    const st = pl && typeof pl === 'object' ? this._grietas.get(pl) : null;
    if (!st || !rift) return;
    st.grieta = rift; st.usada = false; st.cierreT = time + (+rift.ttl || 0);
  },

  /** rift.js, start(), en quien manda: 1 si la arena que empieza es la de la grieta
   *  garantizada (la marca se gasta: una sola arena) y 0 si es otra. Se reconoce por la
   *  propia grieta; si aquí ya se cerró (el invitado entró en sus últimos instantes y su
   *  reloj va algo por detrás), hasta 5 s después. Una grieta natural no puede abrirse
   *  hasta 30 s después de que se cierre ésta. */
  arenaGarantizada(pl, rift, time) {
    const st = pl && typeof pl === 'object' ? this._grietas.get(pl) : null;
    if (!st || !st.grieta || st.usada) return 0;
    if (rift ? rift !== st.grieta : !(time <= st.cierreT + 5)) return 0;
    st.usada = true;
    return 1;
  },

  /** rift.js, spawnLegend(), antes de añadirlo: el legendario de la arena de la grieta
   *  garantizada (arena.forzada) sale con grietaGarantizadaVida de su vida. Es al crearlo,
   *  no una curación (tools/nico/check.js la tiene revisada). */
  vidaLegendario(e, arena) {
    const f = +this.grietaGarantizadaVida;
    if (!e || !arena || !arena.forzada || !(f > 0) || !isFinite(f) || f === 1) return;
    e.maxHp = e.hp = Math.max(1, Math.round(e.maxHp * f));
  },

  /** Escala del Pokémon de un jugador (1 = tamaño original). Usa la geometría
   *  normal (nunca la shiny) para que todos los clientes calculen lo mismo. */
  escalaJugador(dex) {
    const max = +this.anchoMaxJugador;
    if (!(max > 0) || !isFinite(max)) return 1;
    const m = G.Sprites && G.Sprites.animMeta(dex, 'Idle');
    return Math.min(1, max / (m ? m.w : 32));
  },

  /** Ventana del invitado según el camino hasta el anfitrión (directo o relé). */
  ventanaVida() {
    const rele = !!(G.Net && G.Net.hostUid && G.Net.slow(G.Net.hostUid));
    const ms = +(rele ? this.ventanaVidaReleMs : this.ventanaVidaMs);
    return ms > 0 && isFinite(ms) ? ms : 0;
  },

  /** Invitado, copia de un enemigo (enemy.js, hurt): ¿se resta ya en pantalla tu
   *  golpe? No si el anfitrión dice que tiene escudo (bit 4 de su estado). */
  predecirGolpe(e) {
    if (!this.curacionEnemiga && e.net && (e.net.st & 4)) return false;
    e.golpePredichoT = performance.now();   // también con true, por si se cambia en plena partida
    return true;
  },

  /** Invitado (coop.js, onHostFrame): vida que se enseña al llegar `hp` del
   *  anfitrión. Dentro de la ventana tras tu último golpe predicho no sube. */
  vidaDelAnfitrion(e, hp) {
    const v = Math.min(e.maxHp, hp);
    if (this.curacionEnemiga || !(v > e.hp) || !e.golpePredichoT) return v;
    return performance.now() - e.golpePredichoT < this.ventanaVida() ? e.hp : v;
  }
};
