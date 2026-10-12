# PokéSwarm

**Roguelite de hordas Pokémon.** Tú y tu compañero contra el enjambre: elige a tu
Pokémon, aguanta oleadas cada vez más grandes, sube de nivel, evoluciona tus
ataques, entra en las grietas a por legendarios y caza shinies. En el navegador
y en el móvil, solo o con amigos.

> **Jugar:** https://nicooliver123-cell.github.io/pokesurvivor/
> Fallos, sugerencias y retiradas de contenido: [avisos del repositorio](https://github.com/nicooliver123-cell/pokesurvivor/issues).

Es un juego hecho por fans, **gratuito y sin ánimo de lucro**: sin anuncios ni
compras. Pokémon no es nuestro (ver [Marca](#marca)).

## Cómo se juega

Entra con una cuenta o como invitado, haz el test de personalidad (te da tu
primer compañero) y a la mazmorra. Tu Pokémon ataca solo con su movimiento
activo; tú te mueves, esquivas y eliges qué aprender al subir de nivel.

| En el PC | Acción |
|---|---|
| `W` `A` `S` `D` o flechas | Moverse |
| `1` a `4`, o clic en el icono | Elegir el ataque activo |
| `Q` / `E` | Ataque anterior / siguiente |
| `Esc` o `P` | Pausa |
| `1` a `3` | Elegir carta al subir de nivel |
| `Tab` | Recorrer los menús |

**En el móvil**, en horizontal: pon el dedo en cualquier sitio y arrastra para
moverte (el joystick aparece donde tocas), toca un ataque para cambiarlo y el
botón de arriba a la derecha para pausar. En vertical te pide girar el móvil.

**En un plegable abierto o en una tableta** también se juega en vertical. Con el
estilo Dex, el HUD se aparta del pliegue de la pantalla para que, a medio
plegar, ninguna ranura ni el reloj queden encima.

Se puede **instalar como app** («Añadir a pantalla de inicio» o el botón de
instalar del navegador). En **Ajustes** están el sonido, los gráficos (con el
**estilo**: Dex, con menús de Rotom-Dex y letra redondeada, o Clásico, en pixel
art), los controles, la cuenta y el aviso legal.

En una partida hay **jefes**, **grietas** con un legendario en una arena aparte
(siempre se abre una antes de los 2 minutos, con el legendario más débil, para
que consigas el **vínculo** y fusiones movimientos), **climas** que potencian
unos tipos y debilitan otros, **altares**, **cofres**, **trampas**, **objetos**,
y **misiones** y **logros** que dan tickets y monedas. Con los tickets se tira en
el **gacha**, y un Pokémon repetido desbloquea su siguiente evolución. Los
tickets que ganas cuentan doble y los shiny salen un 50 % más a menudo. Los
enemigos no se curan, y los Pokémon más grandes que manejas se encogen para que
esquivar les cueste lo mismo que a los demás.

El guardado vive en tu navegador (como invitado o sin la nube, sólo ahí: si
borras los datos del sitio, se pierde).

## Cooperativo

Hasta 4 jugadores en la misma partida: añadid vuestros apodos en **Amigos**,
cread una **sala** e invitad. Los navegadores se conectan directamente entre sí
(cada uno puede llegar a ver la IP del otro: juega en grupo sólo con gente que
conozcas).

El cooperativo, las cuentas en la nube, los amigos y el ranking necesitan el
proyecto de Firebase de PokéSwarm, que **aún no está creado**: hasta entonces el
juego va en modo local (un jugador, guardado en el navegador). En cuanto esté,
bastará con crear una cuenta.

## Traer partida guardada

Si tienes una partida en otra web de este juego, puedes sumarla aquí: colección,
shinies, mejoras, logros, Pokémonedas y tickets. No se borra nada de lo que ya
tienes y, si la traes otra vez, sólo se suma lo nuevo. PokéSwarm no entra en
ninguna cuenta ni habla con ningún servidor: la partida la sacas tú.

1. En un **PC**, abre la web donde tienes tu partida, con tu cuenta iniciada.
2. Pulsa `F12` y ve a la pestaña **Consola**. Si Chrome te pide escribir
   `permitir pegar` (o `allow pasting`), escríbelo y pulsa Enter.
3. En PokéSwarm, abre **Ajustes > Cuenta > Traer partida guardada**, pulsa
   **Copiar**, pega el código en esa consola y pulsa Enter: se descarga un
   archivo `.json` con tu partida.
4. Vuelve a PokéSwarm, pulsa **Elegir archivo**, elige ese archivo, mira la
   vista previa y pulsa **Confirmar**.

El código sólo lee la partida que ya tiene tu navegador y la descarga: no envía
nada a ninguna parte. Su versión comentada está en
[tools/nico/exportar-oficial.js](tools/nico/exportar-oficial.js). Pega sólo ese
código, copiado del juego: nunca pegues en la consola código que te pase otra
persona.

## Créditos

- **Sprites:** [PMD SpriteCollab](https://github.com/PMDCollab/SpriteCollab) y
  sus artistas, con licencia
  [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). La lista
  completa de autores está en [CREDITS.md](CREDITS.md).
- **Datos de los Pokémon:** [PokeAPI](https://pokeapi.co/).
- **Fuentes:** Pixelify Sans (estilo Clásico) y M PLUS Rounded 1c (estilo Dex),
  las dos con la [SIL Open Font License 1.1](https://openfontlicense.org/)
  (`assets/fonts/`).
- **Música y sonidos:** generados por el propio juego.

## Marca

Pokémon y todos los nombres y personajes relacionados son marcas y propiedad de
Nintendo, Creatures Inc., GAME FREAK y The Pokémon Company. PokéSwarm es un
proyecto de fans sin ánimo de lucro, no afiliado, patrocinado ni aprobado por
ellos.

## Licencia

El código es MIT; los sprites, las fuentes y los datos tienen sus propias
licencias. Todo está en [LICENSE](LICENSE) y [CREDITS.md](CREDITS.md).

## Desarrollo

HTML y JavaScript sin dependencias, sobre Canvas. Se edita `dev.html` (carga los
scripts sueltos), y `index.html` y `js/app.min.js` se generan con
`node tools/build.js --privado`. Las reglas del proyecto están en
[CLAUDE.md](CLAUDE.md), los pendientes en [PLAN.md](PLAN.md) y las pruebas
(`npm test`) en [tools/nico/README.md](tools/nico/README.md). Los iconos salen
de `tools/nico/iconos.py`.
