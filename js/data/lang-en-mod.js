/* ============ lang-en-mod.js — inglés de los textos de nuestra versión (MOD nico) ============
 * Se carga justo después de js/data/lang-en.js (dev.html). Las claves son los
 * textos en español tal y como salen en la página (los espacios se juntan).
 */
G.I18n.add({
  // PokéSwarm: el nombre, el lema, la portada y el aviso legal (dev.html, js/ui/settings-ui.js, js/ui/portada.js).
  'PokéSwarm se juega en horizontal.': 'PokéSwarm is played in landscape.',
  'PokéSwarm necesita JavaScript para funcionar. Actívalo para jugar.': 'PokéSwarm needs JavaScript to work. Please enable it to play.',
  'Roguelite de hordas Pokémon': 'A Pokémon horde roguelite',
  '. No tiene anuncios ni compras.': '. It has no ads or purchases.',
  '; créditos completos en': '; full credits in',
  '). Datos de la Pokédex de': '). Pokédex data from',
  'Proyecto de fan sin ánimo de lucro · Sprites: SpriteCollab (CC BY-NC 4.0) · Pokémon © Nintendo/Creatures/GAME FREAK/The Pokémon Company ·':
    'Non-profit fan project · Sprites: SpriteCollab (CC BY-NC 4.0) · Pokémon © Nintendo/Creatures/GAME FREAK/The Pokémon Company ·',
  'Juego de fans {x}: sin anuncios ni compras. Pokémon y sus personajes son propiedad de Nintendo, Creatures, GAME FREAK y The Pokémon Company; este proyecto no está afiliado a ellos.':
    'Fan game {x}: no ads or purchases. Pokémon and its characters are owned by Nintendo, Creatures, GAME FREAK and The Pokémon Company; this project is not affiliated with them.',
  ': sin anuncios ni compras. Pokémon y sus personajes son propiedad de Nintendo, Creatures, GAME FREAK y The Pokémon Company; este proyecto no está afiliado a ellos.':
    ': no ads or purchases. Pokémon and its characters are owned by Nintendo, Creatures, GAME FREAK and The Pokémon Company; this project is not affiliated with them.',
  // La «Tarjeta de entrenador» del menú (js/ui/portada.js) y las pestañas del inicio de sesión.
  'Tu compañero': 'Your partner', 'Colección:': 'Collection:', 'Récord:': 'Record:', 'Récord: tu partida más larga': 'Record: your longest run',
  'Sin partidas todavía': 'No runs yet', 'Como invitado, tu partida no se guarda.': 'As a guest, your progress isn\'t saved.', 'Tu perfil': 'Your profile',
  'Entrar o crear cuenta': 'Sign in or create an account',
  'Si eres titular de derechos y quieres que retiremos algo, abre un aviso en el repositorio de PokéSwarm y lo quitaremos lo antes posible:':
    'If you are a rights holder and want something removed, open an issue in the PokéSwarm repository and we\'ll take it down as soon as possible:',
  // Ajustes > Cuenta: traer una partida guardada (js/ui/importar-ui.js y js/core/importar.js)
  'Traer partida guardada': 'Bring a saved game',
  'Suma aquí tu colección, shinies, mejoras, logros, Pokémonedas y tickets de una partida guardada en otra web. No se borra nada de lo que ya tienes.':
    'Adds your collection, shinies, upgrades, achievements, PokéCoins and tickets from a save on another website. Nothing you already have here is removed.',
  'Estás jugando como invitado: lo que traigas no se guardará al salir. Mejor crea una cuenta antes (botón de arriba) y tráela después.':
    'You\'re playing as a guest: whatever you bring won\'t be saved when you leave. Better create an account first (button above) and bring it afterwards.',
  'Abre en un PC la web donde tienes tu partida, con tu cuenta iniciada.': 'On a computer, open the website where your save is, signed in to your account.',
  'Pulsa F12 y ve a la pestaña Consola. Si Chrome te pide escribir «permitir pegar» (o «allow pasting»), escríbelo y pulsa Enter.':
    'Press F12 and go to the Console tab. If Chrome asks you to type “allow pasting”, type it and press Enter.',
  'Copia este código, pégalo en la consola y pulsa Enter: se descargará un archivo con tu partida.':
    'Copy this code, paste it into the console and press Enter: a file with your save will download.',
  'Vuelve aquí, pulsa «Elegir archivo» y elige ese archivo.': 'Come back here, press “Choose file” and pick that file.',
  'Código para la consola de esa web': 'Code for that website\'s console',
  // El código de la sección pegado en la consola de PokéSwarm: su alert() pasa por G.I18n. (En la web del
  // proyecto base, el propio código elige español o inglés según el idioma del navegador.)
  'Este código va en la consola de la web donde tienes tu partida, no aquí. Pégalo allí con tu cuenta iniciada.':
    'This code goes in the console of the website where your save is, not here. Paste it there, signed in to your account.',
  'Copiar': 'Copy',
  'Copiado': 'Copied',
  'Selecciónalo y cópialo a mano': 'Select it and copy it by hand',
  'Elegir archivo': 'Choose file',
  'Confirmar': 'Confirm',
  'Trayendo…': 'Bringing…',
  'Los pasos 1 a 3 necesitan un PC: en el móvil no hay consola. Vale cualquier PC, porque tu partida está en la nube de esa web: basta con entrar con tu cuenta. El código sólo lee tu partida y la descarga; no envía nada a ninguna parte.':
    'Steps 1 to 3 need a computer: phones have no console. Any computer works, because your save is in that website\'s cloud: just sign in with your account. The code only reads your save and downloads it; it sends nothing anywhere.',
  'Pega sólo este código, copiado de esta página: nunca pegues en la consola código que te pase otra persona.':
    'Only paste this code, copied from this page: never paste code someone else gives you into the console.',
  'Ver el código comentado': 'See the commented code',
  'Para traer la partida, vuelve al menú: termina o abandona la run.': 'To bring your save, go back to the menu: finish or quit the run.',
  'Vista previa': 'Preview',
  'Partida que traes': 'Save you\'re bringing',
  'Exportada el': 'Exported on',
  'Pokémon en esa partida': 'Pokémon in that save',
  'Pokémon nuevos': 'New Pokémon',
  'Shinies nuevos': 'New shinies',
  'Pokémonedas que se suman': 'PokéCoins added',
  'Tickets ×1 que se suman': '×1 tickets added',
  'Tickets ×10 que se suman': '×10 tickets added',
  'Legendarios vencidos nuevos': 'New legendaries defeated',
  'Logros nuevos': 'New achievements',
  'Arenas ganadas nuevas': 'New arenas won',
  'Objetos nuevos': 'New items',
  'Movimientos evolucionados nuevos': 'New evolved moves',
  'Pokémon con mejoras subidas': 'Pokémon with higher upgrades',
  'Récords y estadísticas mejorados': 'Records and stats improved',
  'Banners con más tiradas sin legendaria': 'Banners with more pulls without a legendary',
  'Favoritos del perfil': 'Profile favourites',
  'Título del perfil': 'Profile title',
  'Ya habías traído esta partida: sólo se suma lo que tenga de nuevo. De Pokémonedas y tickets, lo que tenga de más desde la última vez; tu compañero, tu perfil y el pity de los banners no cambian.':
    'You already brought this save: only what is new is added. For PokéCoins and tickets, what it has gained since last time; your partner, your profile and the banners\' pity don\'t change.',
  'No hay nada nuevo que traer.': 'There is nothing new to bring.',
  'Tu apodo, tus misiones de hoy, tu personalidad y tu inicial no cambian.':
    'Your nickname, today\'s missions, your personality and your starter don\'t change.',
  'No se ha podido leer el archivo.': 'Couldn\'t read the file.',
  '¡Hecho! Tu partida ya está aquí.': 'Done! Your save is here now.',
  'Como eres invitado, se perderá al salir: crea una cuenta y vuelve a traerla.':
    'As you\'re a guest, it will be lost when you leave: create an account and bring it again.',
  'Guardada en este navegador.': 'Saved in this browser.',
  'No se ha podido guardar en este navegador (¿modo incógnito o sin espacio?).':
    'Couldn\'t save in this browser (private mode or out of space?).',
  'Subiendo a la nube…': 'Uploading to the cloud…',
  'Guardada y subida a la nube.': 'Saved and uploaded to the cloud.',
  'Guardada en este dispositivo; se subirá a la nube en cuanto se pueda.':
    'Saved on this device; it will upload to the cloud as soon as possible.',
  'Si vuelves a traerla más adelante, sólo se sumará lo nuevo.': 'If you bring it again later, only what is new will be added.',
  'Partida traída': 'Save brought over',
  'El archivo está vacío.': 'The file is empty.',
  'El archivo es demasiado grande para ser una partida (máximo 2 MB).': 'The file is too big to be a save (2 MB max).',
  'El archivo no es un JSON válido: usa el que descarga el código, sin editarlo.':
    'The file isn\'t valid JSON: use the one the code downloads, without editing it.',
  'Este archivo no es una partida guardada.': 'This file isn\'t a saved game.',
  'Este archivo es de una versión más nueva del exportador: actualiza esta página y vuelve a probar.':
    'This file comes from a newer version of the exporter: reload this page and try again.',
  'La partida no tiene una fecha de creación válida.': 'The save doesn\'t have a valid creation date.',
  'Este archivo es una partida de PokéSwarm: el código hay que pegarlo en la consola de la web donde tienes la partida que quieres traer, con tu cuenta iniciada.':
    'This file is a PokéSwarm save: the code has to be pasted into the console of the website where the save you want to bring is, signed in to your account.',
  'No hay ninguna partida abierta.': 'No save is open.',
  '{x} datos no reconocidos se han descartado.': '{x} unrecognised entries were discarded.',
  '{x} números fuera de rango se han ajustado.': '{x} out-of-range numbers were adjusted.',
  'La partida es de una versión más nueva del juego: se trae lo que PokéSwarm reconoce.':
    'The save is from a newer version of the game: whatever PokéSwarm recognises is brought over.',
  // Tickets ganados ×ticketsMult (js/core/mods.js, textoTicket): lo que flota al coger uno. '+2 tickets' es igual.
  '¡{x} tickets ×10!': '{x} ×10 tickets!',
  // Gacha: un repetido desbloquea su evolución (js/core/mods.js, textoEvolucion y NOTA_REPETIDOS). El shiny, antes.
  '¡Repetido! Desbloqueas {x} shiny': 'Duplicate! You unlock shiny {x}',
  '¡Repetido! Desbloqueas {x}': 'Duplicate! You unlock {x}',
  '· Un repetido desbloquea su siguiente evolución si aún no la tienes (si es shiny, en shiny); si ya no le queda ninguna, da Pokémonedas (un shiny, el triple).':
    '· A duplicate unlocks its next evolution if you don\'t have it yet (shiny if it\'s shiny); if it has none left, it gives PokéCoins (triple for a shiny).',
  // Identidad visual «Dex de Expedición» (js/ui/estilo.js): Ajustes > Gráficos > Estilo, créditos y controles.
  'Estilo': 'Style',
  'Clásico': 'Classic',
  'Dex: menús y HUD de Pokédex y letra redondeada. Clásico: menús de pixel art y letra pixelada.': 'Dex: Pokédex menus and HUD and a rounded font. Classic: pixel-art menus and a pixel font.',
  'Letra del estilo Dex:': 'Dex style font:',
  'Letra del estilo Dex: M PLUS Rounded 1c (OFL).': 'Dex style font: M PLUS Rounded 1c (OFL).',
  // Controles: un plegable abierto o una tableta también juegan en vertical (y, con las ranuras en columna, «de la derecha»).
  'Pon el dedo en cualquier parte y arrastra para moverte: el joystick aparece donde tocas. Toca un ataque de abajo para cambiarlo y el botón de arriba a la derecha para pausar. Se juega en horizontal (en un plegable abierto o en una tableta, también en vertical).':
    'Put your finger anywhere and drag to move: the joystick appears where you touch. Tap a move at the bottom to switch to it and the top-right button to pause. Play in landscape (on an unfolded foldable or a tablet, portrait works too).',
  'Pon el dedo en cualquier parte y arrastra para moverte: el joystick aparece donde tocas. Toca un ataque de la derecha para cambiarlo y el botón de arriba a la derecha para pausar. Se juega en horizontal (en un plegable abierto o en una tableta, también en vertical).':
    'Put your finger anywhere and drag to move: the joystick appears where you touch. Tap a move on the right to switch to it and the top-right button to pause. Play in landscape (on an unfolded foldable or a tablet, portrait works too).',
  // HUD del estilo Dex (js/ui/hud-dex.js): ficha, jefe, sensor de Rotom, chips, avisos y cooperativo.
  'PS': 'HP', 'N.º': 'No.', 'Despejado': 'Clear', 'Caído': 'Down',
  'Ataque ×{x}': 'Attack ×{x}', 'Velocidad ×{x}': 'Speed ×{x}', 'Defensa ×{x}': 'Defense ×{x}', 'Regenera ×{x}': 'Regen ×{x}',
  'Atq ×{x}': 'Atk ×{x}', 'Vel ×{x}': 'Spd ×{x}',
  'Horda {x} · {x} s': '{x} horde · {x} s', 'Hora dorada · {x} s': 'Golden hour · {x} s',
  'Grieta {x}': 'Rift {x}', 'Grieta · {x} s': 'Rift · {x} s',
  '¡Se ha abierto una grieta!': 'A rift has opened!', '¡Grieta abierta! Sigue la flecha morada': 'Rift open! Follow the purple arrow',
  // Versiones cortas de la pista de controles (si la larga no cabe).
  'WASD moverse · 1-4, Q, E o clic: cambiar ataque · Esc pausa': 'WASD move · 1-4, Q, E or click: switch move · Esc pause',
  'WASD · 1-4 / Q / E · Esc pausa': 'WASD · 1-4 / Q / E · Esc pause',
  'Arrastra para moverte · toca un ataque para cambiarlo': 'Drag to move · tap a move to switch', 'Arrastra · toca un ataque': 'Drag · tap a move',
  // La pista con la pantalla dividida (el joystick del panel).
  'Mueve con el joystick · toca un ataque para cambiarlo': 'Move with the joystick · tap a move to switch',
  'Joystick para moverte · toca un ataque': 'Joystick to move · tap a move', 'Joystick · toca un ataque': 'Joystick · tap a move',
  // Lote 4: píxel nítido (js/ui/encuadre.js) y el rótulo de una arena (js/ui/hud-dex.js).
  'Píxel nítido': 'Crisp pixels',
  'Cada píxel del dibujo ocupa un número exacto de píxeles de tu pantalla, sin columnas más anchas que otras. El mundo se ve un poco más cerca o más lejos.':
    'Each pixel of the art takes an exact number of pixels on your screen, with no columns wider than others. The world looks slightly closer or farther away.',
  'Grieta de tipo {x}': '{x}-type rift',
  // Lote 5: pantalla dividida estilo Nintendo DS (js/ui/pantalla-dividida.js), Ajustes > Controles.
  'Pantalla dividida': 'Split screen',
  'El juego en una mitad de la pantalla y los mandos en la otra, como en una consola de dos pantallas: joystick grande, los cuatro ataques, el objeto, la pausa, tus PS y tu nivel. Se puede cambiar en plena partida desde la pausa.':
    'The game on one half of the screen and the controls on the other, like a dual-screen console: a big joystick, your four moves, your item, pause, your HP and your level. You can change it mid-run from the pause menu.',
  'Desactivada': 'Off', 'Juego arriba, mandos abajo': 'Game on top, controls below', 'Juego a un lado': 'Game on one side', 'Automática al plegar': 'Automatic when folded',
  'Mandos a la derecha': 'Controls on the right', 'Mandos a la izquierda': 'Controls on the left', 'Lado de los mandos': 'Controls side',
  'Este navegador no informa de cómo está plegado el móvil, así que la automática no se activará: elige «Juego arriba, mandos abajo».':
    'This browser doesn\'t report how the phone is folded, so automatic won\'t kick in: choose «Game on top, controls below».',
  'Se divide al plegar el móvil a medias con la bisagra en horizontal, como un portátil (juego arriba, mandos abajo); abierto del todo, pantalla entera. Ahora: plegado.':
    'It splits when you half-fold the phone with the hinge horizontal, like a laptop (game on top, controls below); fully open, full screen. Now: folded.',
  'Se divide al plegar el móvil a medias con la bisagra en horizontal, como un portátil (juego arriba, mandos abajo); abierto del todo, pantalla entera. Ahora: abierto.':
    'It splits when you half-fold the phone with the hinge horizontal, like a laptop (game on top, controls below); fully open, full screen. Now: open.',
  'Se divide al plegar el móvil a medias con la bisagra en horizontal, como un portátil (juego arriba, mandos abajo); abierto del todo, pantalla entera. Ahora: plegado en libro, con la bisagra en vertical: así no se divide (para jugar así, elige «Juego a un lado»).':
    'It splits when you half-fold the phone with the hinge horizontal, like a laptop (game on top, controls below); fully open, full screen. Now: folded like a book, with the hinge vertical: it doesn\'t split like this (to play this way, choose «Game on one side»).',
  'Se divide al plegar el móvil a medias con la bisagra en horizontal, como un portátil (juego arriba, mandos abajo); abierto del todo, pantalla entera. Ahora: plegado, pero el navegador no dice dónde está la bisagra: no se divide.':
    'It splits when you half-fold the phone with the hinge horizontal, like a laptop (game on top, controls below); fully open, full screen. Now: folded, but the browser doesn\'t say where the hinge is: it doesn\'t split.',
  'En un plegable, la división cae en la bisagra si el navegador la conoce; si no, en la mitad exacta.':
    'On a foldable, the split falls on the hinge if the browser knows where it is; otherwise, exactly in the middle.',
  // «Elige a tu compañero» sin el test de personalidad (js/ui/elegir-companero.js) y la nota de Ajustes > Cuenta sin la personalidad.
  'Al azar': 'Random', 'Elegir a {x}': 'Choose {x}', 'Elige uno o déjalo al azar.': 'Pick one or leave it to chance.', 'Iniciales': 'Starters',
  'Tu apodo, tus misiones de hoy y tu inicial no cambian.': 'Your nickname, today\'s missions and your starter don\'t change.',
  // La máquina de gancho del gacha (js/ui/gancho.js); el resto de sus rótulos son los de la tragaperras (lang-en.js).
  'POKé GANCHO': 'POKé CLAW',
  // Crédito al juego original en Ajustes > Acerca de (G.MODS.creditoOriginal).
  // Va en trozos (las negritas parten el texto): cada uno con su clave.
  'PokéSwarm es un proyecto personal de Nico, inspirado en': 'PokéSwarm is a personal project by Nico, inspired by',
  ', el juego de fans de': ', the fan game by', ', y desarrollado a partir de su código (licencia MIT).': ', and built from its code (MIT license).',
  // La guardería (js/systems/guarderia.js): su panel en Mejoras, los avisos y su fila en el fin de partida.
  'Guardería': 'Daycare', 'Entrenan mientras juegas': 'They train while you play',
  'Deja aquí a los Pokémon que no usas: entrenan mientras juegas con tu compañero.': 'Leave the Pokémon you don\'t use here: they train while you play with your partner.',
  '{x} · en la guardería': '{x} · in the daycare', 'Plazas': 'Slots',
  'Cada {x} min de run, sube 1 nivel una mejora al azar de cada Pokémon que esté aquí.': 'Every {x} min of play, each Pokémon here gains 1 level in a random upgrade.',
  'Sacar a {x}': 'Take {x} out', 'Dejar a {x} ·': 'Leave {x} ·', 'Está llena: saca a alguno antes.': 'It\'s full: take one out first.',
  '{x} entra en la guardería': '{x} enters the daycare', '{x} sale de la guardería': '{x} leaves the daycare',
  'La guardería está llena: saca a alguno antes': 'The daycare is full: take one out first', 'Necesitas {x} Pokémonedas': 'You need {x} PokéCoins',
  'Ya está en la guardería': 'Already in the daycare', 'No está en la guardería': 'Not in the daycare', 'No tienes ese Pokémon': 'You don\'t have that Pokémon',
  'La guardería está cerrada': 'The daycare is closed', 'Aún no han subido de nivel.': 'No level-ups yet.',
  'Está en la guardería': 'In the daycare', 'Es tu compañero: elige otro antes': 'It\'s your partner: pick another one first',
  'Es tu compañero: no puede quedarse en la guardería.': 'It\'s your partner: it can\'t stay in the daycare.',
  // Evolución dentro de la partida (js/systems/evo-partida.js).
  'Evolucionar en {x}': 'Evolve into {x}', 'EVOLUCIÓN': 'EVOLUTION',
  'Hasta el final de la partida. Vida {x} → {x}, ataque ×{x} → ×{x}, velocidad {x} → {x}.': 'Until the end of the run. HP {x} → {x}, attack ×{x} → ×{x}, speed {x} → {x}.',
  '¡{x} ha evolucionado en {x}!': '{x} evolved into {x}!',
  // El menú de pruebas de Nico (js/ui/dev-menu.js).
  'Menú de pruebas': 'Test menu', 'Sólo lo ve tu cuenta. Suma a tu partida guardada; no cuenta para el ranking.': 'Only your account sees this. It adds to your save; it doesn\'t count for the ranking.',
  '+10 tickets': '+10 tickets', '+1 ticket ×10': '+1 ticket ×10', '+1.000 Pokémonedas': '+1,000 PokéCoins', '+10.000 Pokémonedas': '+10,000 PokéCoins',
  'Siguiente entrenamiento en {x} de juego.': 'Next training after {x} of play.', 'Esta partida no cuenta para la guardería.': 'This run doesn\'t count for the daycare.',
  // El Multiverso (js/data/multiverso.js): el banner, la colección y los ataques propios.
  'Multiverso': 'Multiverse', 'Otros mundos': 'Other worlds',
  'Personajes de otros mundos que se cuelan en el enjambre: {x}.': 'Characters from other worlds who slip into the swarm: {x}.',
  'Llama Bebé': 'Pepper Breath', 'Mega Llama': 'Nova Blast',
  'Escupe una bola de fuego grande al enemigo más cercano. Quema.': 'Spits a big fireball at the nearest enemy. Burns.',
  'Cacodemonio': 'Cacodemon', 'Súper Escopeta': 'Super Shotgun', 'Rayo Bola': 'Ball Lightning', 'Tormenta Infernal': 'Hellstorm',
  'Escopeta de dos cañones: una ráfaga corta de perdigones que empuja.': 'Double-barrelled shotgun: a short burst of pellets that knocks back.',
  'Escupe una bola de rayos lenta y grande que atraviesa y frena.': 'Spits a big, slow ball of lightning that goes through and slows down.',
  '· Cada tirada trae a uno de estos personajes, todos con la misma probabilidad.': '· Each pull brings one of these characters, all equally likely.',
  '· No hay legendarios, así que tampoco pity.': '· There are no legendaries, so there is no pity either.',
  '· Un repetido da {x} Pokémonedas (un shiny repetido, el triple).': '· A duplicate gives {x} PokéCoins (a shiny duplicate, triple).',
  '· Nunca salen de enemigos: sólo se consiguen aquí.': '· They never show up as enemies: you can only get them here.',
  'Sólo sale en el banner del Multiverso, en el gacha.': 'Only in the Multiverse banner of the gacha.',
  // Mapas propios (js/world/mapas-datos.js: los mismos que G.MapasDatos.NOMBRES_EN): los 3 biomas y las 18 arenas de la
  // grieta. «Grieta · {x}», «— {x} —» y las mayúsculas del HUD clásico salen de estas claves (i18n.js).
  'Vega del Alba': 'Dawn Vale', 'Vega Helada': 'Frozen Vale', 'Vega Sulfúrea': 'Sulfur Vale',
  'Plaza del Eco': 'Echo Plaza', 'Caldera Rúnica': 'Rune Caldera', 'Atolón Hundido': 'Sunken Atoll',
  'Jardín Colgante': 'Hanging Garden', 'Bobina Tormenta': 'Storm Coil', 'Lago de Seracs': 'Serac Lake',
  'Tatami Sagrado': 'Sacred Tatami', 'Pozas de Ponzoña': 'Venom Pools', 'Cañada Seca': 'Dry Gulch',
  'Mirador Nuboso': 'Cloud Lookout', 'Corona Astral': 'Astral Crown', 'Celdas de Ámbar': 'Amber Cells',
  'Cantil Fósil': 'Fossil Cliff', 'Osario Velado': 'Veiled Ossuary', 'Nido Escamado': 'Scaled Nest',
  'Arrabal Sin Luna': 'Moonless Quarter', 'Forja Sellada': 'Sealed Forge', 'Corro de Hadas': 'Fairy Ring'
});
