# Pruebas de nuestra versión (tools/nico)

Comando exacto, desde la raíz del repo:

```
cd tools/nico && npm install && npm test
```

`npm install` sólo hace falta la primera vez (o tras cambiar `package.json`). `npm test` ejecuta las dos pruebas seguidas y termina con código 0 si todo pasa.

| Prueba | Comando suelto | Qué comprueba | Tarda |
|---|---|---|---|
| Comprobación del fork | `node check.js` | Nada del Firebase, TURN o dominio del original en lo que se sirve; no han vuelto CNAME, robots.txt, en/ ni las páginas SEO; `index.html` con noindex; `js/app.min.js` al día con las fuentes; ganchos `// MOD nico` en su sitio; 0 curanderos en 2.000 runs simuladas con el código real (y control con la curación activada); tamaños de los 966 Pokémon; asignaciones de vida nuevas en el código de enemigos. | unos 10 s |
| Cooperativo E2E | `node coop-e2e.js` | Arranca el emulador de Firebase y un servidor en 127.0.0.1:8090, abre `index.html?emu` en dos navegadores aislados, A juega con Guzzlord y B con Pikachu, se hacen amigos y juegan en grupo. Exige que cada uno vea moverse al otro, que Guzzlord salga reducido igual en los dos clientes y Pikachu intacto, que en el anfitrión no suba la vida de ningún enemigo (con una curandera forzada) y que, como control, sí suba al activar un momento la curación. También que nadie hable con la infraestructura del original y que no haya errores de JavaScript. | unos 2 min |

Opciones de `coop-e2e.js`: `--dev` (prueba `dev.html` con los scripts sueltos en vez del paquete), `--headed` (ver los navegadores), `--grande 384 --normal 4` (otros Pokémon), `--puerto 8090`.

Resultado en `out/` (no se versiona): `informe.json` con cada paso y comprobación, `capturas/`, consolas de los dos navegadores y logs del emulador.

## Requisitos

- Node 20 o superior.
- Chromium de Playwright 1.64. Si falta: `npx playwright install chromium` desde esta carpeta.
- JDK 21 para el emulador, en `~/.cache/temurin-21/` (aquí está Temurin 21.0.12.1). La prueba lo pone en el `PATH` sólo de su propio proceso. Si se borra, descargar el JDK 21 de Temurin (adoptium.net) en zip, descomprimirlo en esa carpeta o indicar otra ruta con la variable `PS_JDK`.
- Puertos libres: 8090 (web) y 9099, 8080 y 9000 (emulador). Si ya hay un emulador en marcha en esos puertos, la prueba lo reutiliza y no lo cierra.

## Jugar en local sin la prueba

```
node tools/nico/serve.js
```

Después abre http://127.0.0.1:8090/index.html (modo local, un jugador) o `dev.html` para probar cambios sin reconstruir. Con `?emu` y el emulador en marcha (`npx firebase-tools emulators:start --project demo-ps --only auth,firestore,database` con el JDK en el `PATH`) se prueban cuentas y cooperativo en este PC.

Las cuentas que crea la prueba sólo existen en el emulador (proyecto `demo-ps`) y desaparecen al cerrarlo.
