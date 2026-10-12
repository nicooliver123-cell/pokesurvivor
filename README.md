# PokéSurvivor · Mundo Misterioso

> **Versión modificada no oficial.** Esta copia está basada en
> [PokéSurvivor de JPTER78](https://github.com/JPTER78/pokesurvivor) (web oficial:
> pokesurvivor.com) y no la mantiene su autor. Cambios: los enemigos no se curan,
> los Pokémon más grandes son más pequeños en partida (sus sprites se muestran a
> escala reducida) y en cada partida se abre una grieta antes de los 2 minutos, con
> un legendario más débil. No usa la infraestructura del juego original. Detalles en
> [CLAUDE.md](CLAUDE.md); licencias y créditos en [LICENSE](LICENSE) y [CREDITS.md](CREDITS.md).
>
> **Jugar:** https://nicooliver123-cell.github.io/pokesurvivor/ · Fallos, sugerencias
> y retiradas de contenido: [avisos del repositorio](https://github.com/nicooliver123-cell/pokesurvivor/issues).
>
> **Tu partida del juego oficial se puede traer.** Es otra web y otra base de datos (un
> Firebase propio), así que las cuentas son nuevas, pero desde **Ajustes > Cuenta** se
> suman aquí tu colección, shinies, mejoras, logros, Pokémonedas y tickets del juego
> oficial. Pasos más abajo, en [Traer tu partida del juego oficial](#traer-tu-partida-del-juego-oficial).

Bullet-heaven con Pokémon al estilo de Survivor.io y Megabonk, con sprites de
*Pokémon Mundo Misterioso*, capa roguelike, **966 Pokémon de las 9 generaciones**,
shinies y gacha por región. Música y efectos compuestos para el juego.

HTML + CSS + JavaScript vanilla sobre Canvas 2D. Sin build, sin dependencias y
**todo local**: no necesita internet para jugar.

> **Aviso sobre criptomonedas / Crypto disclaimer**
>
> PokéSurvivor **no tiene ninguna criptomoneda, token ni NFT oficial**, y yo no
> he creado ninguno. Cualquier token que use el nombre del juego lo han creado
> terceros. **No me hago cargo de ninguna compra, venta o inversión** que hagas
> con ellos y nada de lo que hay aquí es una recomendación de inversión. El
> juego es gratis y lo seguirá siendo.
>
> PokéSurvivor has **no official cryptocurrency, token or NFT**, and I have not
> created any. Any token using the game's name was created by third parties.
> **I take no responsibility for any purchase, sale or investment** you make
> with them, and nothing here is investment advice. The game is free and will
> stay free.

## Jugar

Doble clic en `index.html`. Crea una cuenta o entra como invitado, haz el test
de personalidad y a la mazmorra.

| Tecla | Acción |
|---|---|
| `W` `A` `S` `D` / flechas | Moverse |
| `1` `2` `3` `4` | Elegir el movimiento activo |
| `Q` / `E` | Ciclar movimientos |
| `Esc` / `P` | Pausa |

**En móvil o tablet** (en horizontal): pon el dedo en cualquier sitio y arrastra
para moverte (el joystick aparece donde tocas), toca un ataque de abajo para
cambiarlo y el botón de arriba a la derecha para pausar. Se puede instalar como
app ("Añadir a pantalla de inicio"). En **Ajustes** hay sonido, calidad gráfica
(con modo automático), números de daño, menos sacudidas, FPS y la cuenta.

El Pokémon ataca solo con el movimiento activo (o con todos los de un
**vínculo**: cada legendario vencido deja fusionar movimientos para lanzarlos a
la vez desde un solo hueco, hasta 4). Las rocas, cofres y la hierba
alta se rompen; las paredes y los árboles bloquean los disparos enemigos; el
agua frena y la lava quema (también a los enemigos).

En el mapa hay **altares de poder**, **manantiales** que curan, **cofres con
candado** (quédate a su lado unos segundos) y **trampas** que también dañan a
los enemigos. A veces se abre una **grieta**: entra y lucharás contra un
**legendario** en una arena aparte. En esta versión siempre se abre una antes de
los 2 minutos de juego, con el legendario al 60 % de su vida, para que consigas el
**vínculo** y fusiones movimientos; si no entras antes de que se cierre, no vuelve.
Las demás grietas salen como en el original.

Hay **tabla de tipos** (un Rayo Burbuja le quita más a un Charmander) y,
de vez en cuando, **climas** (sol, lluvia, arena, nieve, niebla) que potencian
unos tipos y debilitan otros.

Cada día hay **misiones** (y semanales) que dan tickets y monedas; los
**logros** dan medallas y títulos, y tu **perfil** enseña tus 3 Pokémon
favoritos, tus marcas y tus medallas. En las runs encuentras **objetos** (Restos,
Cinta Elección...) y tus movimientos **evolucionan** al máximo nivel. Los
enemigos tienen personalidad: ponen escudos, llaman a su manada o atacan
con aviso en el suelo (en esta versión ninguno cura).

Las **mejoras** son de cada Pokémon. El **gacha** va con **tickets** que se
ganan jugando (×1 de algunos Pokémon, ×10 de jefes y legendarios), y se tira
en una tragaperras pixel art. En esta versión cada ticket que ganas cuenta
doble: los que recoges en las runs y los de las misiones y los logros.

Cada enemigo tiene 1/4096 de salir **shiny**: brilla, una flecha en el borde de
la pantalla te dice dónde está, y si lo derrotas te lo quedas. En el gacha sale
shiny 1 de cada 100 tiradas. En esta versión los shiny salen un 50 % más: 1 de
cada 2.731 enemigos, 1,5 de cada 100 tiradas y 1 de cada 341 legendarios de las
grietas (en el original, 1 de cada 512). En la colección eliges tu compañero en
versión normal o shiny.

La música suena tras el primer clic (los navegadores no dejan reproducir sonido
antes). Volumen y silencio: botón del altavoz arriba a la derecha, o en la pausa.

El guardado vive en el `localStorage` del navegador: si borras los datos del
sitio, se pierde.

En `videos/` hay grabaciones del juego (con su música): un combate contra un
jefe, la captura de un shiny salvaje y un shiny en el gacha.

## Traer tu partida del juego oficial

Esta versión no entra en tu cuenta del juego oficial ni habla con su servidor. La
partida la sacas tú de tu navegador, con un código que pegas en la web oficial:

1. En un **PC**, abre pokesurvivor.com e inicia sesión con tu cuenta. Vale
   cualquier PC: tu partida oficial está en su nube.
2. Pulsa `F12` y ve a la pestaña **Consola**. Si Chrome te pide escribir
   `permitir pegar` (o `allow pasting`), escríbelo y pulsa Enter.
3. En esta versión, abre **Ajustes > Cuenta > Traer partida del juego oficial**,
   pulsa **Copiar**, pega el código en la consola del juego oficial y pulsa Enter.
   Se descarga `pokesurvivor-partida-<nombre>-<fecha>.json`. El mismo código está,
   comentado línea a línea, en [tools/nico/exportar-oficial.js](tools/nico/exportar-oficial.js).
   Pega sólo este código, copiado de esta versión: nunca pegues en la consola
   código que te pase otra persona.
4. Vuelve aquí, pulsa **Elegir archivo**, mira la vista previa y pulsa **Confirmar**.

El código sólo lee la partida que ya tiene tu navegador y la descarga: no envía
nada a ninguna parte ni cambia nada. Sus avisos salen en español o en inglés,
según el idioma del navegador. Esta versión sólo lee el archivo que eliges.

Se suma a lo que ya tengas aquí, sin borrar nada:

- Colección y shinies, legendarios vencidos, arenas, objetos, movimientos
  evolucionados y logros: se juntan.
- Mejoras de cada Pokémon y estadísticas: se queda el máximo.
- Pokémonedas y tickets: se suman una sola vez. Si más adelante vuelves a traer
  la misma partida, sólo se suma lo que tenga de más desde la última vez.
- Sólo la primera vez que traes cada partida oficial: el pity del gacha (se queda
  el máximo), el compañero del juego oficial (y su shiny, si lo tienes) y, si aquí
  no tenías, los favoritos y el título del perfil. Si la vuelves a traer, se
  quedan los que tengas aquí.
- Tu apodo, tus misiones del día, tu personalidad y tu inicial de aquí no cambian.

Límites:

- Desde el móvil no se puede exportar, porque no hay consola: hace falta un PC.
  El archivo sí se puede elegir luego en cualquier dispositivo.
- Mientras esta versión no tenga su Firebase propio, la partida traída se guarda
  sólo en el navegador donde la traigas: hazlo en el que juegues. Como invitado
  no se guarda.
- Es una foto de ese momento: lo que juegues después en el oficial no llega solo.
  Vuelve a traerla cuando quieras: sólo se suma lo nuevo, sin repetir monedas,
  tickets ni pity.
- Sólo vale una partida del juego oficial. El código no hace nada si lo pegas en
  esta versión, y una partida de esta versión se rechaza al elegirla: sus monedas
  ya incluyen lo traído y se volverían a sumar.
- Si el juego oficial cambia mucho por dentro, el código puede dejar de
  encontrar la partida: avisará con un mensaje y no descargará nada.

## Guardado en la nube y publicación

- **Base de datos (Firebase):** cuentas con nombre + contraseña o Google, y la
  partida se sigue en cualquier ordenador. Pasos en [docs/FIREBASE.md](docs/FIREBASE.md).
  Sin configurar, el juego guarda sólo en el navegador, como antes.
- **Jugar con amigos (hasta 4) y ranking:** con cuenta en la nube, menú
  **Amigos** (añadir por apodo, invitar a tu sala) y **Ranking** (tiempo
  aguantado: solo o grupo, de hoy a histórico, amigos, por Pokémon).
- **Publicar gratis en GitHub Pages:** [docs/PUBLICAR.md](docs/PUBLICAR.md).
- Si se juega en dos ordenadores a la vez o sin conexión, las partidas se
  **fusionan**: las colecciones se unen (nunca se pierde un Pokémon ni un
  shiny), mejoras y estadísticas se quedan con el máximo, y monedas y
  compañero con la versión más reciente. Los cambios de otro ordenador llegan
  en directo.

## Licencia

Código bajo MIT. Los sprites (CC BY-NC 4.0), la fuente (OFL) y las marcas de
Pokémon tienen sus propias condiciones: ver [LICENSE](LICENSE) y
[CREDITS.md](CREDITS.md). Proyecto de fan sin ánimo de lucro.

## Estructura

```
index.html              pantallas + orden de carga
css/style.css           interfaz estilo Mundo Misterioso
assets/pokemon/{dex}/   hojas de sprites PMD (Idle, Walk, Attack, Shoot, Charge, Hurt, Faint)
assets/pokemon/{dex}/s/ las mismas en versión shiny
assets/fonts/           Pixelify Sans (OFL)
js/
  net/      social (apodo, amigos, salas), net (WebRTC + relé),
            coop (partida en grupo), ranking
  core/     util, db (guardado), audio (sintetizador + efectos), input,
            sprites (animador PMD), camera
  data/     pokedex*, sprites-meta*, moves, starters (+ test), enemies,
            upgrades, music (partituras)
  world/    tiles (pixel art en código), world (terreno, objetos, colisiones)
  entities/ player, enemy, projectile, pickup, fx
  systems/  combat, spawner, levelup, gacha
  ui/       icons (pixel art), ui, hud, login, test, menu, gacha-ui, run-ui,
            social-ui, ranking-ui
  game.js   flujo y bucle principal
tools/      scripts que regeneran los ficheros marcados con *
```

`*` = generado. Para rehacerlos (necesita Python 3 + Pillow e internet, sólo esa vez):

```
python tools/fetch_sprites.py    # sprites normal y shiny + js/data/sprites-meta.js
                                 # (~20 min; se puede cortar y relanzar: usa tools/cache/)
python tools/fetch_pokedex.py    # js/data/pokedex.js
python tools/fetch_credits.py    # CREDITS.md
```

## Notas de implementación

- **Sprites PMD.** Columnas = fotogramas, filas = 8 direcciones (Down, DownRight,
  Right, UpRight, Up, UpLeft, Left, DownLeft — verificado con los `-Offsets.png`).
  Cada animación tiene su propio tamaño de fotograma, así que se alinean por el
  **ancla al suelo** sacada del `-Shadow.png`; sin eso el sprite saltaría al atacar.
- **Coordenadas.** `(x, y)` de una entidad son sus **pies**. Las colisiones
  ocurren en el plano del suelo; los proyectiles vuelan en ese plano y se dibujan
  elevados con su sombra debajo.
- **Mundo.** Chunks de 16×16 tiles: los *datos* (terreno, objetos) son baratos y
  se generan siempre; la *imagen* se hornea a resolución de arte escribiendo en un
  `ImageData` (~4 ms por chunk en Chrome) y sólo para los visibles.
- **Rendimiento.** Rejilla espacial de enemigos reconstruida cada frame. Con 420
  enemigos, simulación + render completo ≈ 3 ms por frame en Chrome.
- **Metadatos en `.js`, no `.json`**, porque `fetch()` está bloqueado en `file://`.
- **Shiny.** Los shiny de SpriteCollab son el mismo dibujo con otra paleta; están
  en `s/` y sólo 30 tienen geometría distinta (campo `sa` en los metadatos).
  Las hojas se guardan como PNG con paleta exacta: misma imagen, la mitad de peso.
- **Audio.** Sintetizador Web Audio con planificador anticipado (programa las
  notas 150 ms por delante) y reverb por convolución con un impulso generado.
  Las partituras están en `js/data/music.js` en un formato de texto propio.
  Los efectos tienen separación mínima entre repeticiones y un tope de voces,
  para que 400 enemigos golpeados a la vez no saturen.
- **Iconos.** Mapas de caracteres convertidos a canvas y data URLs; siempre a
  múltiplos enteros de su tamaño para que el píxel quede limpio.

## Créditos y licencia

Sprites de [SpriteCollab](https://github.com/PMDCollab/SpriteCollab) bajo
**CC BY-NC 4.0** — uso **no comercial** y con atribución; la lista de artistas
está en [`CREDITS.md`](CREDITS.md). Pokémon es propiedad de Nintendo, Creatures
Inc. y GAME FREAK. Proyecto de fan sin ánimo de lucro.
