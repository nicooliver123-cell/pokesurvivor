# PLAN — pendientes de la versión modificada

Única lista de pendientes del proyecto. Lo hecho está descrito en [CLAUDE.md](CLAUDE.md) y en el historial de git.

En esta versión se empieza de cero: es otro origen (otra web) y otro backend (otro Firebase), así que no se traen las cuentas, la colección ni el progreso del juego oficial. No hay forma de importarlos ni está previsto.

## Inmediatos (los hace la sesión principal)

1. **Crear el proyecto Firebase propio.** Sin él no hay cuentas en la nube ni cooperativo a distancia: hoy el juego va en modo local y el cooperativo sólo funciona contra el emulador, en un mismo PC.
   - Plan Spark, gratuito: si se pasa de cuota se corta, no factura. Google Analytics desactivado.
   - Authentication: correo/contraseña y Google. Dominios autorizados: `nicooliver123-cell.github.io`, y localhost si se quiere probar en local contra el proyecto real.
   - Firestore en modo nativo, base `(default)`, en Europa. Realtime Database en europe-west1, modo bloqueado.
   - Registrar una app web, pegar su config en `js/core/firebase-config.js` (sin `measurementId`) y **añadir su projectId a `G.FIREBASE_PROYECTOS`**, la lista blanca del mismo fichero. Sin eso `js/core/db.js` no conecta y `tools/nico/check.js` falla. La `databaseURL` tiene que ser la instancia por defecto (`<id>-default-rtdb`).
   - Añadir el alias `"prod": "<id>"` en `.firebaserc` (el `default` sigue siendo `demo-ps`) y desplegar reglas e índices: `npx firebase-tools login` (login interactivo de Nico) y después `npx firebase-tools deploy --only firestore,database --project prod`.
   - Opcional: restringir la API key a `https://nicooliver123-cell.github.io/*` y a `http://localhost:*/*`.
   - Reconstruir (`node tools/build.js --privado`), pasar `tools/nico` (`npm test`) y probar el cooperativo real con el amigo, él de invitado.
2. **Publicar el fork** en https://github.com/nicooliver123-cell/pokesurvivor (remoto `origin`), con GitHub Pages desde `main` en la raíz: https://nicooliver123-cell.github.io/pokesurvivor/.
   - Después comprobar: `curl -s <url> | grep -i robots` da noindex, también en `dev.html`; `404.html` funciona en la subruta; las páginas HTML publicadas (`index.html`, `dev.html`, `404.html`, `contacto/`) no mencionan pokesurvivor.com; y nada de lo que carga el juego apunta al Firebase, TURN, correo o avisos del original. Es lo que vigila `check.js`. Las únicas menciones del dominio en `js/` son la lista de costes de la pantalla de donaciones del original, que aquí no se muestra; `README.md`, `docs/` y `GDD.md` lo citan como referencia.
   - Comprobar que los avisos (issues) del repo están activados: el aviso legal, Ajustes y `contacto/` mandan ahí.
   - No darlo de alta en Search Console.

## Opcionales

3. **TURN propio.** Sólo si la conexión directa falla a menudo: un Worker y una clave TURN de Cloudflare propios, en `TURN_URL` de `js/net/net.js`. Mientras tanto, si no hay conexión directa, el tráfico va por el relé de la Realtime Database y el invitado usa la ventana larga (`ventanaVidaReleMs`). Con la cuota de Spark (unos 360 MB al día) da para unas 2,5-9 h de relé al día; es una estimación con la cifra del autor, no medida.
4. **Textos de upstream desfasados.** `GDD.md` y `docs/` siguen describiendo las curanderas y el despliegue del original. No afecta al juego.
