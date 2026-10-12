# Pruebas de nuestra versión (tools/nico)

Comando exacto, desde la raíz del repo:

```
cd tools/nico && npm install && npm test
```

`npm install` sólo hace falta la primera vez (o tras cambiar `package.json`). `npm test` ejecuta las dos pruebas seguidas y termina con código 0 si todo pasa.

| Prueba | Comando suelto | Qué comprueba | Tarda |
|---|---|---|---|
| Comprobación del fork | `node check.js` | Nada del Firebase, TURN, dominio o correo del original en lo que se sirve. Firebase: la config publicada es `null` o de un proyecto de la lista blanca (`G.FIREBASE_PROYECTOS` en `js/core/firebase-config.js`), toda URL de Firebase en la nube que se sirva es de un proyecto de esa lista y `G.FIREBASE_PERMITIDA` rechaza el del original. No han vuelto CNAME, robots.txt, en/ ni las páginas SEO. `index.html` y `dev.html` (también se publica) con noindex, sin SEO del original ni enlaces a páginas borradas. `js/app.min.js` al día con las fuentes; ganchos `// MOD nico` en su sitio; 0 curanderos en 2.000 runs simuladas con el código real (y control con la curación activada); tamaños de los 966 Pokémon; la ventana del invitado (10 casos); traer la partida del juego oficial (59 casos: el exportador sin red (de `navigator`, sólo el idioma), que es `exportar-oficial.js` (la versión comentada) sin comentarios ni sangría, no modifica nada, tira de localStorage si el juego cambia, se niega si se pega en esta versión, avisa en español o inglés según el navegador y pone la fecha local en el nombre del archivo; el importador: saneado, fusión, monedas sin duplicar, rechazo de la partida de esta versión (3 vueltas sin sumar, también entre dos cuentas), pity, compañero y perfil sólo la primera vez, y `aplicar()` en local e invitado; y la sección de Ajustes con un DOM mínimo y datos hostiles en el archivo, el resultado arriba y centrado, y todos sus textos con inglés, también la etiqueta del cuadro del código, que lleva translate="no"); la grieta garantizada (30 casos: la lógica de `js/core/mods.js` fotograma a fotograma y el `js/systems/rift.js` real con el juego simulado, en solitario, de anfitrión y de invitado: hora, una por partida, reintentos, jefe, el legendario con el 60 % y las naturales intactas; y la vuelta en grupo con dos clientes que usan `js/net/coop.js`, `rift.js` y `offerBond()`/`hold()` de `game.js` reales y la red simulada, de 0 a 150 ms y con relojes desiguales: el invitado vuelve cuando se lo dice el anfitrión (`'af'`), se queda con la copia de todos los enemigos del mapa, los dos eligen su fusión y nadie ve su propio nombre en «Pausa: … elige fusión»); el gacha y los tickets (tickets ganados ×2 con trozos reales de `game.js`: +2 por ticket al recogerlo y en el invitado, sin cobro doble al final ni restas, la recogida sigue sumando 1 a `pl.t1`; `progress.js` real con las misiones y los logros: premios ×2 sin tocar las definiciones ni las Pokémonedas; traer dos veces la partida oficial no dobla nada; shiny ×1,5 con el gacha real sembrado, `rollShiny` de `spawner.js` y la línea de `rift.js` tal cual, y el cartel del gacha con el `refresh()` real de `gacha-ui.js`; repetido → evolución: `js/data/evolutions.js` sólo con especies del juego, sin ciclos, Eevee con 8 y Tyrogue con 3, y `pull()` real con las tiradas guionizadas (Bulbasaur con y sin Ivysaur, los 8 repetidos de Eevee y el noveno, shiny repetido y shiny nuevo, evoluciones sin sprite shiny, ×10 en orden con el mismo pity, ramas sólo entre las que faltan, sin `G.EVO`), la carta y el inglés con el `i18n.js` real). Y las asignaciones de vida de **todo** `js/` (menos `app.min.js`): una que no esté en la lista revisada, o una conocida que aparezca más veces, es **FALLO**. | unos 10 s |
| Cooperativo E2E | `node coop-e2e.js` | Arranca el emulador de Firebase y un servidor en 127.0.0.1:8090, abre `index.html?emu` en dos navegadores aislados, A (anfitrión) juega con Guzzlord y B (invitado) con Pikachu, A trae una partida oficial sintética por Ajustes > Cuenta y saca un repetido en el gacha, se hacen amigos y juegan en grupo (con los tickets ×2); al final, la grieta garantizada. Ver abajo. | 1-2 min (unos 85 s el 12-10-2026) |

Opciones de `coop-e2e.js`: `--dev` (prueba `dev.html` con los scripts sueltos en vez del paquete), `--headed` (ver los navegadores), `--grande 384 --normal 4` (otros Pokémon), `--puerto 8090`, `--latencia 150` (ms por sentido en el canal del invitado durante su prueba), `--reutilizar-emulador` (usar un emulador que ya esté en marcha).

Resultado en `out/` (no se versiona): `informe.json` con cada paso y comprobación, `capturas/`, consolas de los dos navegadores y logs del emulador.

## Qué exige el E2E

- Aviso legal con el contacto (avisos) y el repo del fork, el original sólo como atribución, sin correo ni donaciones.
- Cada jugador ve moverse al otro; Guzzlord sale reducido igual en los dos clientes y Pikachu intacto.
- **Transporte obligatorio:** los dos se hablan por el canal directo (`G.Net.mode` = `direct`), el par de candidatos que eligió WebRTC (`getStats`) está conectado y no es un TURN, el canal de datos del juego está abierto con mensajes en los dos sentidos (los contadores de bytes del par a veces se quedan atrás en Chromium), y durante la partida no se manda nada por el relé de la Realtime Database. Todos los golpes que manda el invitado le llegan al anfitrión.
- **Vida de los enemigos, con una trampa en el setter de `hp`** de `G.Enemy` en los dos clientes: ve cada escritura, sin huecos de muestreo, de los enemigos ya registrados (lo que pasa al crearlos no cuenta).
  - Anfitrión: ninguna subida en toda la partida, con una curandera forzada. Control: con `curacionEnemiga=true` un momento, sí sube.
  - Invitado, con latencia simulada en su canal (150 ms por sentido), golpes suyos cada 400 ms a dos dianas (una con escudo permanente) y a los enemigos cercanos, y escudos forzados en la mitad de los de alrededor. Control: el cliente del invitado como el original (`curacionEnemiga=true` sólo en B) tiene que ver rebotes de más de 150 ms y predecir golpes con escudo.
  - Vuelta de la grieta simulada como en `rift.js`: el invitado borra sus copias y el anfitrión las vuelve a anunciar; las heridas nacen con su vida real. Un `ne` sin ese dato crea la copia con la máxima, como antes. (La vuelta real, con su orden de mensajes, se prueba al final, en la grieta garantizada.)
- **Traer la partida del juego oficial** (A, en la nube, con la ventana a 844x390): elige un archivo sintético con el formato del exportador, vista previa, Confirmar; la partida suma colección, monedas y tickets, pone el compañero y queda en Firestore con la transacción normal (`importOficial` incluido). Durante 3,5 s tras Confirmar, ni el aviso «Partida traída» ni los de logros tapan el resultado, que se ve entero dentro de Ajustes. Elegir otra vez el mismo archivo no ofrece sumar nada. El código de la sección, pegado en la consola de esta versión, avisa con un `alert` y no descarga nada; y elegir la partida de la propia cuenta (con el registro `importOficial` y sin él) da el error, sin vista previa ni Confirmar.
- **Gacha** (A, a 844x390, después de traer la partida): un Pokémon que A tiene con una sola evolución que no tiene (Bulbasaur) sale repetido por la interfaz real; sólo dentro de esa tirada el azar sigue un guion (no se toca el juego). La carta dice «¡Repetido! Desbloqueas Ivysaur» en dorado con su sprite de 40x40, queda apuntado con `from: 'evo'`, no da monedas y gasta su ticket; el cartel dice «1.5%» de shiny y la nota nueva de los repetidos.
- **Tickets ×2**, en plena partida: A (anfitrión) suelta a sus pies un ticket y un ticket ×10 y los recoge; el contador de la partida sube 1 por objeto, igual en los dos, y cada uno apunta el doble en su partida guardada. Con `ticketsMult = 1` sólo en B, otro ticket: A +2 y B +1. Si mientras tanto cae otro ticket o salta un logro, se cuenta (cada partida guardada se compara con su contador y con los premios de los logros nuevos).
- **Grieta garantizada**, al final de la partida (hasta entonces `grietaGarantizadaAntesDe = 0` en los dos, para que no interfiera). B, el invitado, la activa primero y su reloj pasa de su hora sin grieta: no abre ninguna. A pone su reloj 0,3 s antes de su hora con `G.Game.debugTime` (ayuda de depuración: sólo en la prueba; el juego no la usa) y la activa: la abre al llegar a su hora (no antes), antes de los 120 s, y B la recibe en las mismas x e y. B entra y los dos acaban en la arena, marcada; el legendario tiene exactamente el 60 % de la vida que daría `spawnLegend` sin el mod (y B recibe la del anfitrión); al vencerlo, los dos tienen `bonds === 1`, y vuelven al mapa sin ninguna otra grieta. Después, la vuelta real: la cuenta atrás de B se retrasa 1 s (sólo en la prueba; es como fallaba: B volvía por su cuenta después de recibir los enemigos que A anunciaba al volver y los borraba). B tiene que volver con A, a menos de 500 ms, sin quedarse en pausa dentro de la arena, y quedarse con la copia de todos los enemigos vivos de A, también los del mapa que A guardó durante la arena. Los dos abren su diálogo de fusión y ninguno ve su propio nombre en «Pausa: … elige fusión».
- Nadie habla con la infraestructura del original y no hay errores de JavaScript.

### Criterio del invitado

Cada subida de vida de una copia se clasifica por el tiempo desde el último golpe que el propio invitado predijo en ella:

| Clase | Cuándo | Resultado |
|---|---|---|
| `dentro-ventana` | antes de `ventanaVidaMs` (600 ms) | Es el rebote que se veía. Con el mod no puede pasar: tiene que haber 0. |
| `resincronizacion` | pasada la ventana | El anfitrión manda y su vida es la buena (el golpe no contó, por ejemplo por un escudo). Legítima. |
| `sin-golpe` | sin golpe predicho en esa copia | Una curación real o un dato viejo: falla si dura más de 150 ms (un fotograma de red). |

La duración va desde la subida hasta que la vida vuelve a su nivel anterior o la copia desaparece. Mientras el anfitrión cura a propósito (su control) no cuenta para el invitado.

## Requisitos

- Node 20 o superior.
- Chromium de Playwright 1.64. Si falta: `npx playwright install chromium` desde esta carpeta.
- JDK 21 para el emulador, en `~/.cache/temurin-21/` (aquí está Temurin 21.0.12.1). La prueba lo pone en el `PATH` sólo de su propio proceso. Si se borra, descargar el JDK 21 de Temurin (adoptium.net) en zip, descomprimirlo en esa carpeta o indicar otra ruta con la variable `PS_JDK`.
- Puertos libres: 8090 (web) y 9099, 8080 y 9000 (emulador). Si están ocupados, la prueba para con un mensaje que dice cuáles. Si lo que hay es un emulador del proyecto `demo-ps` que quieres aprovechar, `--reutilizar-emulador` lo usa y no lo cierra al terminar.

## Jugar en local sin la prueba

```
node tools/nico/serve.js
```

Después abre http://127.0.0.1:8090/index.html (modo local, un jugador) o `dev.html` para probar cambios sin reconstruir. Con `?emu` y el emulador en marcha (`npx firebase-tools emulators:start --project demo-ps --only auth,firestore,database` con el JDK en el `PATH`) se prueban cuentas y cooperativo en este PC.

Las cuentas que crea la prueba sólo existen en el emulador (proyecto `demo-ps`) y desaparecen al cerrarlo.

## Datos de las evoluciones

`js/data/evolutions.js` (`G.EVO`, para los repetidos del gacha) lo genera `evoluciones.js` a partir de la tabla de especies de PokeAPI, que no se versiona. Sólo hace falta si cambia la Pokédex del juego:

```
node tools/nico/evoluciones.js <carpeta fuera del repo>/pokemon_species.csv
```

La tabla es https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species.csv (unos 57 KB); el script sólo la lee como CSV (`id` y `evolves_from_species_id`), se queda con las especies del juego, salta los estadios que falten y para si encuentra un ciclo. Al terminar dice cuántas hay, qué estadios se han saltado y qué especies tienen varias ramas.
