# Pruebas de nuestra versión (tools/nico)

Comando exacto, desde la raíz del repo:

```
cd tools/nico && npm install && npm test
```

`npm install` sólo hace falta la primera vez (o tras cambiar `package.json`). `npm test` ejecuta las dos pruebas seguidas y termina con código 0 si todo pasa.

| Prueba | Comando suelto | Qué comprueba | Tarda |
|---|---|---|---|
| Comprobación del fork | `node check.js` | Nada del Firebase, TURN, dominio o correo del original en lo que se sirve. Firebase: la config publicada es `null` o de un proyecto de la lista blanca (`G.FIREBASE_PROYECTOS` en `js/core/firebase-config.js`), toda URL de Firebase en la nube que se sirva es de un proyecto de esa lista y `G.FIREBASE_PERMITIDA` rechaza el del original. No han vuelto CNAME, robots.txt, en/ ni las páginas SEO. `index.html` y `dev.html` (también se publica) con noindex, sin SEO del original ni enlaces a páginas borradas. `js/app.min.js` al día con las fuentes; ganchos `// MOD nico` en su sitio; 0 curanderos en 2.000 runs simuladas con el código real (y control con la curación activada); tamaños de los 966 Pokémon; la ventana del invitado (10 casos). Y las asignaciones de vida de **todo** `js/` (menos `app.min.js`): una que no esté en la lista revisada, o una conocida que aparezca más veces, es **FALLO**. | unos 10 s |
| Cooperativo E2E | `node coop-e2e.js` | Arranca el emulador de Firebase y un servidor en 127.0.0.1:8090, abre `index.html?emu` en dos navegadores aislados, A (anfitrión) juega con Guzzlord y B (invitado) con Pikachu, se hacen amigos y juegan en grupo. Ver abajo. | unos 2,5 min |

Opciones de `coop-e2e.js`: `--dev` (prueba `dev.html` con los scripts sueltos en vez del paquete), `--headed` (ver los navegadores), `--grande 384 --normal 4` (otros Pokémon), `--puerto 8090`, `--latencia 150` (ms por sentido en el canal del invitado durante su prueba), `--reutilizar-emulador` (usar un emulador que ya esté en marcha).

Resultado en `out/` (no se versiona): `informe.json` con cada paso y comprobación, `capturas/`, consolas de los dos navegadores y logs del emulador.

## Qué exige el E2E

- Aviso legal con el contacto (avisos) y el repo del fork, el original sólo como atribución, sin correo ni donaciones.
- Cada jugador ve moverse al otro; Guzzlord sale reducido igual en los dos clientes y Pikachu intacto.
- **Transporte obligatorio:** los dos se hablan por el canal directo (`G.Net.mode` = `direct`), el par de candidatos que eligió WebRTC (`getStats`) está conectado y no es un TURN, el canal de datos del juego está abierto con mensajes en los dos sentidos (los contadores de bytes del par a veces se quedan atrás en Chromium), y durante la partida no se manda nada por el relé de la Realtime Database. Todos los golpes que manda el invitado le llegan al anfitrión.
- **Vida de los enemigos, con una trampa en el setter de `hp`** de `G.Enemy` en los dos clientes: ve cada escritura, sin huecos de muestreo, de los enemigos ya registrados (lo que pasa al crearlos no cuenta).
  - Anfitrión: ninguna subida en toda la partida, con una curandera forzada. Control: con `curacionEnemiga=true` un momento, sí sube.
  - Invitado, con latencia simulada en su canal (150 ms por sentido), golpes suyos cada 400 ms a dos dianas (una con escudo permanente) y a los enemigos cercanos, y escudos forzados en la mitad de los de alrededor. Control: el cliente del invitado como el original (`curacionEnemiga=true` sólo en B) tiene que ver rebotes de más de 150 ms y predecir golpes con escudo.
  - Vuelta de la grieta simulada como en `rift.js`: el invitado borra sus copias y el anfitrión las vuelve a anunciar; las heridas nacen con su vida real. Un `ne` sin ese dato crea la copia con la máxima, como antes.
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
