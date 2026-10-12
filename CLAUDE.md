# PokéSurvivor — versión modificada de Nico

Copia propia y modificable de [PokéSurvivor](https://github.com/JPTER78/pokesurvivor) (fan game de JPTER78, HTML + JS vanilla sobre Canvas; código MIT, sprites CC BY-NC 4.0) para que Nico y un amigo jueguen en cooperativo con sus cambios. Se publicará como fork en https://github.com/nicooliver123-cell/pokesurvivor, con el juego en https://nicooliver123-cell.github.io/pokesurvivor/. Pendientes: [PLAN.md](PLAN.md), la única lista.

Es otra web y otro Firebase, así que las cuentas son nuevas; pero el jugador puede traer su partida del juego oficial desde Ajustes > Cuenta (ver «Traer la partida del juego oficial»).

## Reglas duras

- **Nunca usar la infraestructura del original**: su proyecto Firebase `pokesurvivor-jpter`, `turn.pokesurvivor.com`, su ranking, su dominio ni su correo. Sería usar su backend y su factura con un cliente modificado. `js/core/db.js` sólo conecta con un proyecto de la lista blanca `G.FIREBASE_PROYECTOS` de `js/core/firebase-config.js` (si falta la lista, con ninguno) y `tools/nico/check.js` lo vigila.
- Traer la partida del oficial no rompe lo anterior: la saca el propio jugador en su navegador y el fork sólo lee el archivo `.json` que él elige. Nada de `fetch` ni conexiones al juego oficial desde el fork, y ningún agente inicia sesión en el juego oficial ni crea cuentas allí.
- Sin autorización expresa de Nico: nada de `git push`, crear repos en GitHub ni crear proyectos de Firebase.
- `index.html` y `js/app.min.js` son **generados**: no se editan ni se resuelven a mano en un merge.
- Conservar `LICENSE`, `CREDITS.md`, `assets/fonts/OFL.txt` y las atribuciones del juego. Sin monetización ni donaciones: los sprites son CC BY-NC.
- `core.autocrlf=false` y muchos ficheros son CRLF: respetar el final de línea de cada uno (ojo con `sed -i` en Git Bash, que los pasa a LF).

## Remotos y ramas

- `upstream` = https://github.com/JPTER78/pokesurvivor, sólo para traer cambios.
- `origin` será https://github.com/nicooliver123-cell/pokesurvivor (por crear, PLAN.md). Se trabaja en `main`.

## Cómo editar y construir

- Se edita `dev.html` y `js/**`. `dev.html` carga los ~66 scripts sueltos, sirve para probar sin reconstruir y **también se publica**: lleva noindex, `window.PS_PAGES = false` y ya no tiene los bloques `seo` del original.
- Ajustes de nuestros cambios: `js/core/mods.js` (`G.MODS`), con cada valor comentado. En el código de upstream sólo hay ganchos pequeños marcados `// MOD nico`; se listan con `git grep -n "MOD nico"`. El inglés de nuestros textos va en `js/data/lang-en-mod.js`.
- Build: `node tools/build.js --privado` (es también lo que hace sin flags). Une y minifica en `js/app.min.js` con terser y genera `index.html` con noindex. `--con-seo` se rechaza. Commitear siempre `index.html` y `js/app.min.js` juntos.
- No ejecutar `tools/make_seo_pages.py`: regenera en/, las páginas SEO, robots.txt, sitemap.xml y 404.html con canonical a pokesurvivor.com.

## Probar

- Rápido, sin navegador: `node tools/nico/check.js`. Sale con 1 si algo falla.
- Jugar en local: `node tools/nico/serve.js` y abrir http://127.0.0.1:8090/index.html (modo local, un jugador) o `dev.html`.
- Todo, cooperativo incluido, contra el emulador de Firebase: `cd tools/nico && npm install && npm test` (unos 2 min; código 0 si pasa). Detalles, opciones y el criterio de la prueba del invitado en [tools/nico/README.md](tools/nico/README.md). El JDK 21 portable está en `~/.cache/temurin-21/`.
- Emulador a mano: `?emu` en la URL sólo actúa en localhost/127.0.0.1/[::1] y usa el proyecto `demo-ps` con los puertos 9099, 8080 y 9000.

## Mods

| Ajuste (`js/core/mods.js`) | Por defecto | Efecto |
|---|---|---|
| `curacionEnemiga` | `false` | Ningún enemigo recupera vida. Las 14 curanderas del original (Chansey, Blissey, Audino, Clefairy, Sylveon...) pelean con el comportamiento de su tipo, el hueco de apoyo de cada tramo sale escudo o invocador y `healAround` no hace nada aunque llegue un curandero. `true` = original. |
| `ventanaVidaMs` / `ventanaVidaReleMs` | `600` / `1500` | Cooperativo, lo que ve el invitado: tras un golpe suyo predicho, durante esa ventana no acepta del anfitrión una vida mayor que la que enseña; pasada, manda el anfitrión. La segunda es para cuando la conexión va por el relé de la Realtime Database. `0` = sin ventana. |
| `anchoMaxJugador` | `56` | El Pokémon que controlas, si su sprite mide más de 56 px de arte de ancho, se encoge en la misma proporción: sprite, sombra, hitbox y altura del nombre. Afecta a 38 de 966, de Guzzlord ×0,47 a Kyogre y Groudon ×0,88; normales e iniciales intactos. `64` es más suave, `48` más fuerte y `0` lo desactiva. |
| `grietaGarantizadaAntesDe` | `120` | Grieta garantizada (decisión de Nico): en cada partida se abre una grieta, la del vínculo para fusionar movimientos, a una hora al azar entre 45 y 10 s antes del límite (75-110 s de juego). Sólo si aún no ha habido ninguna (si la tirada natural de los 105 s ya abrió una, no se fuerza otra), una por partida (si no entráis antes de que se cierre, no se reabre), nunca con un jefe vivo y, si no hay sitio libre, reintenta cada segundo. La decide quien manda (solitario o anfitrión). `0` = original (sólo un 20 % de las partidas tiene grieta antes de los 120 s). |
| `grietaGarantizadaVida` | `0.6` | Vida del legendario de esa grieta sobre la normal: unos 2.500 en solitario y 4.600 en dúo a los 110 s (sin rebaja, 4.200 y 7.600). Las grietas naturales no cambian. `1` = sin rebaja. |

**Por qué 56** (es mi criterio, con cálculo hecho sobre el código): deja la hitbox máxima en 24,6, la de Zacian o Giratina, frente a 17,6 de Pikachu. Esquivar pasa a costar a los grandes lo mismo que a un Pokémon de 56 de ancho:

| Situación | Pikachu | Guzzlord antes | Guzzlord ahora |
|---|---|---|---|
| Distancia a la que te da un disparo enemigo | 24,6 | 59 | 31,3 |
| Distancia al jefe para colarte entre los 14 disparos de la nova | 110 | 263 | 139 |
| Recorrido para salir de la zona avisada de un zoner (radio 44) desde su centro | 54,6 | 75,2 | 58,6 |

Siguen siendo algo más grandes que los pequeños, así que se reconocen. El alcance de los ataques no cambia: sale de los pies con el radio de cada movimiento. Los enemigos, los jefes y los menús tampoco cambian. El tamaño no viaja por la red: cada cliente lo calcula a partir del Pokémon, así que los dos jugadores tienen que usar la misma versión.

**Cooperativo.** El anfitrión decide la vida de los enemigos. El invitado resta su golpe en pantalla al momento y luego recibe la vida del anfitrión; antes, con latencia o con escudo, la barra subía y parecía una curación. Ahora, con `curacionEnemiga=false`: la ventana de arriba, no se predice el golpe si el anfitrión dice que el enemigo tiene escudo, y al volver de la grieta las copias llegan con su vida real (`'ne'` la lleva; un cliente que no la mande deja la máxima, como antes). La prueba mide la vida en los dos clientes con una trampa en el setter y latencia simulada.

**Grieta garantizada.** Tres ganchos de una línea en `js/systems/rift.js`: al principio de `update()` pregunta a `G.MODS.grietaGarantizada(pl, time, hayGrieta, manda)` y, si toca, llama a `open()` (la misma de las naturales, con el mismo anuncio `'rift'` al invitado) y reinicia la tirada natural de 30 s; `start()` marca la arena (`cfg.forzada`, de `G.MODS.arenaGarantizada()`), y `spawnLegend()` rebaja la vida de su legendario con `G.MODS.vidaLegendario()` al crearlo, antes de añadirlo (`check.js` la tiene revisada: no es una curación). El estado es de cada partida (la clave es el jugador local, nuevo en cada `startRun`). La marca es de esa grieta y se gasta en su arena; si el invitado entra en sus últimos instantes, cuando en el anfitrión ya se ha cerrado (su reloj va algo por detrás), vale hasta 5 s después: una natural no puede abrirse hasta 30 s después. El invitado nunca la abre y recibe del anfitrión la grieta y la vida del legendario. No usa las ayudas de depuración (`G.Guard` no marca la partida). Pruebas: `check.js` (la lógica y el `rift.js` real con el juego simulado, en solitario y en grupo) y la última fase del E2E.

## Traer la partida del juego oficial

- **Exportador** (en el oficial): una línea que el jugador pega en la consola de pokesurvivor.com con su sesión iniciada. Lee `G.DB.save` (si el juego cambia y no existe, la copia `ps.cloud.*` / `ps.save.*` más reciente de localStorage), avisa con `alert` si es invitado, si no hay sesión o si se pega en esta versión (en español si `navigator.language` empieza por `es`; si no, en inglés), y descarga `pokesurvivor-partida-<nombre>-<fecha local>.json` con `{tipo: 'pokesurvivor-partida', version: 1, origen, exportado, save}`. Sin red y sin escribir nada; de `navigator`, sólo el idioma. La fuente es la versión comentada, `tools/nico/exportar-oficial.js`; `G.Importar.EXPORTADOR` (`js/core/importar.js`, lo que copia el botón de Ajustes) es esa misma sin comentarios ni sangría, en una línea, y `check.js` exige que coincidan. Si se cambia el exportador, se edita el comentado y se regenera la línea (sin `\`, comillas invertidas ni `${`, porque va en una plantilla).
- **Importador**, `js/core/importar.js` (`G.Importar`): `analizar(texto)` (JSON.parse, máximo 2 MB, envoltorio o partida suelta, sólo claves de `newSave()` + `pupgDone`, dex de la Pokédex, ids que existan en el juego, números finitos ≥ 0 con tope), `fusionar(actual, oficial)` y `comparar()`, puras, y `aplicar(oficial)`, que fusiona sobre la partida abierta (`applyInPlace`) y guarda con `commit(true)` y, en la nube, `flush()` (la transacción normal con `merge()`).
- **Fusión**: unión de colección, shinies, legendarios, arenas, objetos, movimientos evolucionados y logros; máximo de mejoras y estadísticas; monedas y tickets se suman sólo una vez: `save.importOficial[<created de la oficial>]` guarda lo ya acreditado y una reimportación suma sólo la diferencia positiva. Sólo la primera vez de cada partida oficial (sin entrada en `importOficial`): pity (máximo por banner), compañero (el oficial si lo tiene, shiny si tiene el shiny; después, sólo si el del fork no es válido) y perfil (el oficial si el del fork está vacío); al reimportar se quedan los del fork, para no devolver el pity gastado aquí ni pisar lo que el jugador cambió. Nombre, misiones, personalidad, inicial y `created`: los del fork. Todo lo que habilita Confirmar tiene su fila en la vista previa. Detalle en el comentario de `fusionar()`.
- **Sólo partidas del oficial**: una partida de esta versión no se trae, porque sus monedas ya incluyen lo acreditado y cada vuelta lo volvería a sumar. El exportador avisa y no descarga si se pega aquí (existe `G.Importar`); `analizar()` rechaza la que lleva `importOficial` (sólo lo escribe el fork) o un `origen` igual a `location.host`; `previsualizar()`, `fusionar()` y `aplicar()` rechazan la que tiene el mismo `created` que la partida abierta (`esLaMisma()`).
- **No es antitrampas**: el archivo lo controla el jugador (puede cambiar `created` o `coins`) y la partida abierta también, desde la consola; las reglas de Firestore aceptan cualquier `save`. La protección contra duplicados es para el uso honrado y sólo afecta a la propia partida, no a otros jugadores.
- **UI**: `js/ui/importar-ui.js`, sección de Ajustes > Cuenta (pasos, Copiar, Elegir archivo, vista previa, Confirmar); aviso si es invitado y bloqueo en mitad de una run. El resultado (o el error) va arriba de la sección y se centra en la pantalla: los avisos flotantes (logros arriba en PC y abajo en un móvil en horizontal, «Partida traída» abajo) ya no lo tapan. Ganchos `// MOD nico`: `db.js` expone `newSave`, `migrate` y `applyInPlace`; `settings-ui.js` añade la sección detrás de lo de upstream (una línea aditiva en `render()`, sin tocar las suyas) y conecta sus botones. Inglés en `js/data/lang-en-mod.js`.
- **Pruebas**: `check.js` (59 casos: exportador simulado, también pegado en el fork, en los dos idiomas y con la fecha local; su versión comentada; importador, autoimportación, pity, compañero y perfil al reimportar; `aplicar()` en local e invitado con el `db.js` real; la sección de Ajustes con un DOM mínimo y datos hostiles, dónde queda el resultado y que todos sus textos tienen inglés, también la etiqueta del cuadro del código) y el E2E (A trae una partida sintética por la UI en la nube del emulador a 844x390 sin que los avisos tapen el resultado, la reimporta sin duplicar, el código pegado en el fork avisa y su propia partida se rechaza). La partida oficial real no se ha probado aquí: ningún agente entra en el juego oficial.

## Higiene del fork (hecha)

`firebase-config.js` está en `null` (modo local) con hueco para la config propia y la lista blanca `G.FIREBASE_PROYECTOS` (hoy sólo `demo-ps`, el emulador). TURN y el contador de cuentas, Workers del autor, están apagados. Ko-fi y Sponsors vacíos y el aviso legal dice que no hay donaciones. El contacto (aviso legal, Ajustes > Acerca de y `contacto/`) son los avisos del repo del fork; el original sale sólo como atribución. `.firebaserc` apunta a `demo-ps` y ya no hay bloque `functions` ni carpeta `functions/`. Se quitaron CNAME, robots.txt, sitemap.xml, `en/`, las páginas SEO y `activar_dominio.sh`. `404.html` funciona en una subruta de GitHub Pages, `contacto/` y `dev.html` llevan noindex y el service worker sólo toca sus cachés. Hay un aviso de versión modificada en el README, el título, la PWA y el aviso legal. `cloudflare/`, `docs/` y `GDD.md` se conservan como referencia del original: GitHub Pages publica todo `main`, así que se sirven como ficheros estáticos, pero el juego no los carga ni se despliega ningún Worker.

## Traer actualizaciones de upstream

```
git fetch upstream
git merge upstream/main
```

1. Conflictos en `index.html` o `js/app.min.js`: no se resuelven a mano. Se aceptan los nuestros (`git checkout --ours index.html js/app.min.js`) y se regeneran en el paso 4.
2. Si upstream modificó algo que borramos (en/, guia/, sitemap.xml, CNAME, robots.txt, functions/...), el conflicto es "modify/delete": `git rm -r <ruta>`. Lo mismo con los bloques `seo` de `dev.html`: se quedan borrados.
3. Conflicto en una línea `// MOD nico` o en `js/core/firebase-config.js`: conservar lo nuestro y adaptarlo al código nuevo.
4. `node tools/build.js --privado`
5. `node tools/nico/check.js`. Si falla por una asignación de vida nueva, revisarla: puede ser una curación nueva de upstream. Si no puede subir la vida de un enemigo, se añade a la lista `KNOWN` de `check.js` con su motivo.
6. `cd tools/nico && npm test`
7. Commit del merge con `index.html` y `js/app.min.js` regenerados.
