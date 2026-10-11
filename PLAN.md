# PLAN — pendientes de la versión modificada

Única lista de pendientes del proyecto. Lo hecho está descrito en [CLAUDE.md](CLAUDE.md) y en el historial de git.

## Requieren autorización o login de Nico

1. **Crear el proyecto Firebase propio.** Sin él no hay cuentas en la nube ni cooperativo a distancia: hoy el juego va en modo local y el cooperativo sólo funciona contra el emulador, en un mismo PC.
   - Plan Spark, gratuito: si se pasa de cuota se corta, no factura. Google Analytics desactivado.
   - Authentication: correo/contraseña y Google. Dominios autorizados: el de la web publicada, y localhost si se quiere probar en local contra el proyecto real.
   - Firestore en modo nativo, base `(default)`, en Europa. Realtime Database en europe-west1, modo bloqueado.
   - Registrar una app web y pegar su config en `js/core/firebase-config.js`, sin `measurementId`.
   - Añadir el alias `"prod": "<id>"` en `.firebaserc` y desplegar reglas e índices: `npx firebase-tools login` (login interactivo de Nico) y después `npx firebase-tools deploy --only firestore,database --project prod`.
   - Opcional: restringir la API key a la URL publicada y a `http://localhost:*/*`.
   - Reconstruir (`node tools/build.js --privado`), pasar `tools/nico` y probar el cooperativo real con el amigo.
2. **Publicar el fork.** Crear el repo en GitHub, añadir `origin`, hacer push y activar GitHub Pages desde `main` en la raíz.
   - Después comprobar: `curl -s <url> | grep -i robots` debe dar noindex, `404.html` debe funcionar en la subruta y ninguna página publicada debe contener pokesurvivor.com.
   - No darlo de alta en Search Console.

## Decisiones de Nico

3. **Contacto del fork en el Aviso legal.** Hoy `js/ui/ui.js` (CONTACT y REPO), `js/ui/settings-ui.js` (REPO) y `contacto/index.html` siguen con el correo y el repo del autor original. Quien opera la copia debería recibir las peticiones de retirada. Sugerencia: las issues del repo del fork, mejor que un correo personal. Cuando exista el repo, apuntar REPO a él y dejar el enlace al original como atribución.

## Opcionales

4. **TURN propio.** Sólo si la conexión directa falla a menudo: un Worker y una clave TURN de Cloudflare propios, en `TURN_URL` de `js/net/net.js`. Mientras tanto, si no hay conexión directa, el tráfico va por el relé de la Realtime Database. Con la cuota de Spark (unos 360 MB al día) da para unas 2,5-9 h de relé al día; es una estimación con la cifra del autor, no medida.
5. **Retoque cosmético del cooperativo.** Afecta sólo a lo que ve el invitado:
   - No predecir el daño en enemigos con escudo, para que no rebote la barra (`js/entities/enemy.js`, hurt en copia remota).
   - Mandar la vida real en 'ne' al volver de la grieta (`js/net/coop.js`).
6. **Textos de upstream desfasados.** `GDD.md` y `docs/` siguen describiendo las curanderas. No afecta al juego.
