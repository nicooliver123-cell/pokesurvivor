# PokéSurvivor — versión modificada de Nico

Copia propia y modificable de [PokéSurvivor](https://github.com/JPTER78/pokesurvivor) (fan game de JPTER78, HTML + JS vanilla sobre Canvas; código MIT, sprites CC BY-NC 4.0) para que Nico y un amigo jueguen en cooperativo con sus cambios. Pendientes: [PLAN.md](PLAN.md), la única lista.

## Reglas duras

- **Nunca usar la infraestructura del original**: su proyecto Firebase `pokesurvivor-jpter`, `turn.pokesurvivor.com`, su ranking ni su dominio. Sería usar su backend y su factura con un cliente modificado. `js/core/db.js` rechaza su proyecto y `tools/nico/check.js` lo vigila.
- Sin autorización expresa de Nico: nada de `git push`, crear repos en GitHub ni crear proyectos de Firebase.
- `index.html` y `js/app.min.js` son **generados**: no se editan ni se resuelven a mano en un merge.
- Conservar `LICENSE`, `CREDITS.md`, `assets/fonts/OFL.txt` y las atribuciones del juego. Sin monetización: los sprites son CC BY-NC.
- `core.autocrlf=false` y muchos ficheros son CRLF: respetar el final de línea de cada uno.

## Remotos y ramas

- `upstream` = https://github.com/JPTER78/pokesurvivor, sólo para traer cambios.
- Todavía no hay `origin`: publicar el fork está pendiente (PLAN.md). Se trabaja en `main`.

## Cómo editar y construir

- Se edita `dev.html` y `js/**`. `dev.html` carga los ~65 scripts sueltos y sirve para probar sin reconstruir.
- Ajustes de nuestros cambios: `js/core/mods.js` (`G.MODS`), con cada valor comentado. En el código de upstream sólo hay ganchos pequeños marcados `// MOD nico`; se listan con `git grep -n "MOD nico"`.
- Build: `node tools/build.js --privado`. Une y minifica en `js/app.min.js` con terser y genera `index.html` con noindex y sin el SEO del original. En el fork es también lo que hace sin flags; `--con-seo` daría el de upstream y no se usa. Commitear siempre `index.html` y `js/app.min.js` juntos.
- No ejecutar `tools/make_seo_pages.py`: regenera en/, las páginas SEO, robots.txt, sitemap.xml y 404.html con canonical a pokesurvivor.com.

## Probar

- Rápido, sin navegador: `node tools/nico/check.js`.
- Jugar en local: `node tools/nico/serve.js` y abrir http://127.0.0.1:8090/index.html (modo local, un jugador) o `dev.html`.
- Cooperativo completo contra el emulador de Firebase: `cd tools/nico && npm install && npm test`. Detalles y requisitos en [tools/nico/README.md](tools/nico/README.md). El JDK 21 portable está en `~/.cache/temurin-21/`.
- Emulador a mano: `?emu` en la URL sólo actúa en localhost/127.0.0.1/[::1] y usa el proyecto `demo-ps` con los puertos 9099, 8080 y 9000.

## Mods

| Ajuste (`js/core/mods.js`) | Por defecto | Efecto |
|---|---|---|
| `curacionEnemiga` | `false` | Ningún enemigo recupera vida. Las 14 curanderas del original (Chansey, Blissey, Audino, Clefairy, Sylveon...) pelean con el comportamiento de su tipo, el hueco de apoyo de cada tramo sale escudo o invocador y `healAround` no hace nada aunque llegue un curandero. `true` = original. |
| `anchoMaxJugador` | `56` | El Pokémon que controlas, si su sprite mide más de 56 px de arte de ancho, se encoge en la misma proporción: sprite, sombra, hitbox y altura del nombre. Afecta a 38 de 966, de Guzzlord ×0,47 a Kyogre y Groudon ×0,88; normales e iniciales intactos. `64` es más suave, `48` más fuerte y `0` lo desactiva. |

**Por qué 56** (es mi criterio, con cálculo hecho sobre el código): deja la hitbox máxima en 24,6, la de Zacian o Giratina, frente a 17,6 de Pikachu. Esquivar pasa a costar a los grandes lo mismo que a un Pokémon de 56 de ancho:

| Situación | Pikachu | Guzzlord antes | Guzzlord ahora |
|---|---|---|---|
| Distancia a la que te da un disparo enemigo | 24,6 | 59 | 31,3 |
| Distancia al jefe para colarte entre los 14 disparos de la nova | 110 | 263 | 139 |
| Recorrido para salir de la zona avisada de un zoner (radio 44) desde su centro | 54,6 | 75,2 | 58,6 |

Siguen siendo algo más grandes que los pequeños, así que se reconocen. El alcance de los ataques no cambia: sale de los pies con el radio de cada movimiento. Los enemigos, los jefes y los menús tampoco cambian. El tamaño no viaja por la red: cada cliente lo calcula a partir del Pokémon, así que los dos jugadores tienen que usar la misma versión.

**Cooperativo.** El anfitrión decide la vida de los enemigos. Como invitado puede verse rebotar la barra de un enemigo con burbuja azul: es el escudo o la latencia, no una curación. La prueba mide en el anfitrión.

## Higiene del fork (hecha)

`firebase-config.js` está en `null` (modo local) con hueco para la config propia. TURN y el contador de cuentas, Workers del autor, están apagados. Ko-fi y Sponsors vacíos. `.firebaserc` apunta a `demo-ps` y ya no hay bloque `functions` ni carpeta `functions/`. Se quitaron CNAME, robots.txt, sitemap.xml, `en/`, las páginas SEO y `activar_dominio.sh`. `404.html` funciona en una subruta de GitHub Pages, `contacto/` lleva noindex y el service worker sólo toca sus cachés. Hay un aviso de versión modificada en el README, el título, la PWA y el aviso legal. `cloudflare/` y `docs/` se conservan sólo como referencia del original: no se despliegan.

## Traer actualizaciones de upstream

```
git fetch upstream
git merge upstream/main
```

1. Conflictos en `index.html` o `js/app.min.js`: no se resuelven a mano. Se aceptan los nuestros (`git checkout --ours index.html js/app.min.js`) y se regeneran en el paso 4.
2. Si upstream modificó algo que borramos (en/, guia/, CNAME, robots.txt, functions/...), el conflicto es "modify/delete": `git rm -r <ruta>`.
3. Conflicto en una línea `// MOD nico`: conservar el gancho y adaptarlo al código nuevo.
4. `node tools/build.js --privado`
5. `node tools/nico/check.js`. Si avisa de asignaciones de vida nuevas, revisarlas: puede ser una curación nueva de upstream.
6. `cd tools/nico && npm test`
7. Commit del merge con `index.html` y `js/app.min.js` regenerados.
