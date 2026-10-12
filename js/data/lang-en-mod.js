/* ============ lang-en-mod.js — inglés de los textos de nuestra versión (MOD nico) ============
 * Se carga justo después de js/data/lang-en.js (dev.html). Las claves son los
 * textos en español tal y como salen en la página (los espacios se juntan).
 */
G.I18n.add({
  'PokéSurvivor (versión modificada no oficial)': 'PokéSurvivor (unofficial modified version)',
  'Versión modificada no oficial': 'Unofficial modified version',
  ', basada en': ', based on',
  'basada en': 'based on',
  'PokéSurvivor de JPTER78': 'PokéSurvivor by JPTER78',
  '(licencia MIT; sprites CC BY-NC 4.0). Cambios: los enemigos no se curan, los Pokémon más grandes son más pequeños en partida (sus sprites se muestran a escala reducida), en cada partida se abre una grieta antes de los 2 minutos, con un legendario más débil, los tickets que ganas cuentan doble, los shiny salen un 50 % más y en el gacha un Pokémon repetido desbloquea su evolución. Sus cuentas y partidas son independientes de las del juego original, pero puedes traer aquí tu partida oficial desde Ajustes > Cuenta. El autor del juego original no mantiene esta versión ni responde de ella.':
    '(MIT licence; sprites CC BY-NC 4.0). Changes: enemies don\'t heal, the biggest Pokémon are smaller in a run (their sprites are shown scaled down), every run opens a rift before the 2-minute mark, with a weaker legendary, the tickets you earn count double, shinies are 50% more common and in the gacha a duplicate Pokémon unlocks its evolution. Its accounts and saves are separate from the original game\'s, but you can bring your official save here from Settings > Account. The author of the original game does not maintain this version and is not responsible for it.',
  '. No tiene anuncios, compras ni donaciones.': '. It has no ads, purchases or donations.',
  'Si eres titular de derechos y quieres que retiremos algo, abre un aviso en el repositorio de esta versión y lo quitaremos lo antes posible:':
    'If you are a rights holder and want something removed, open an issue in this version\'s repository and we\'ll take it down as soon as possible:',
  // Ajustes > Cuenta: traer la partida del juego oficial (js/ui/importar-ui.js y js/core/importar.js)
  'Traer partida del juego oficial': 'Bring your save from the official game',
  'Suma aquí tu colección, shinies, mejoras, logros, Pokémonedas y tickets del juego oficial. No se borra nada de lo que ya tienes.':
    'Adds your collection, shinies, upgrades, achievements, PokéCoins and tickets from the official game. Nothing you already have here is removed.',
  'Estás jugando como invitado: lo que traigas no se guardará al salir. Mejor crea una cuenta antes (botón de arriba) y tráela después.':
    'You\'re playing as a guest: whatever you bring won\'t be saved when you leave. Better create an account first (button above) and bring it afterwards.',
  'Abre pokesurvivor.com en un PC e inicia sesión con tu cuenta.': 'Open pokesurvivor.com on a computer and sign in with your account.',
  'Pulsa F12 y ve a la pestaña Consola. Si Chrome te pide escribir «permitir pegar» (o «allow pasting»), escríbelo y pulsa Enter.':
    'Press F12 and go to the Console tab. If Chrome asks you to type “allow pasting”, type it and press Enter.',
  'Copia este código, pégalo en la consola y pulsa Enter: se descargará un archivo con tu partida.':
    'Copy this code, paste it into the console and press Enter: a file with your save will download.',
  'Vuelve aquí, pulsa «Elegir archivo» y elige ese archivo.': 'Come back here, press “Choose file” and pick that file.',
  'Código para la consola del juego oficial': 'Code for the official game\'s console',
  // El código de la sección pegado en la consola de esta versión: su alert() pasa por G.I18n.
  // (En el juego oficial, el propio código elige español o inglés según el idioma del navegador.)
  'Esta página es la versión modificada, no el juego oficial. Pega este código en la consola del juego oficial, con tu cuenta iniciada.':
    'This page is the modified version, not the official game. Paste this code into the console of the official game, signed in to your account.',
  'Copiar': 'Copy',
  'Copiado': 'Copied',
  'Selecciónalo y cópialo a mano': 'Select it and copy it by hand',
  'Elegir archivo': 'Choose file',
  'Confirmar': 'Confirm',
  'Trayendo…': 'Bringing…',
  'Los pasos 1 a 3 necesitan un PC: en el móvil no hay consola. Vale cualquier PC, porque tu partida oficial está en su nube: basta con entrar con tu cuenta. El código sólo lee tu partida y la descarga; no envía nada a ninguna parte.':
    'Steps 1 to 3 need a computer: phones have no console. Any computer works, because your official save is in its cloud: just sign in with your account. The code only reads your save and downloads it; it sends nothing anywhere.',
  'Pega sólo este código, copiado de esta página: nunca pegues en la consola código que te pase otra persona.':
    'Only paste this code, copied from this page: never paste code someone else gives you into the console.',
  'Ver el código comentado': 'See the commented code',
  'Para traer la partida, vuelve al menú: termina o abandona la run.': 'To bring your save, go back to the menu: finish or quit the run.',
  'Vista previa': 'Preview',
  'Partida oficial': 'Official save',
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
  '¡Hecho! Tu partida del juego oficial ya está aquí.': 'Done! Your save from the official game is here now.',
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
  'Partida del juego oficial traída': 'Save from the official game brought over',
  'El archivo está vacío.': 'The file is empty.',
  'El archivo es demasiado grande para ser una partida (máximo 2 MB).': 'The file is too big to be a save (2 MB max).',
  'El archivo no es un JSON válido: usa el que descarga el código, sin editarlo.':
    'The file isn\'t valid JSON: use the one the code downloads, without editing it.',
  'Este archivo no es una partida de PokéSurvivor.': 'This file isn\'t a PokéSurvivor save.',
  'Este archivo es de una versión más nueva del exportador: actualiza esta página y vuelve a probar.':
    'This file comes from a newer version of the exporter: reload this page and try again.',
  'La partida no tiene una fecha de creación válida.': 'The save doesn\'t have a valid creation date.',
  'Este archivo es una partida de esta versión, no del juego oficial: el código hay que pegarlo en la consola de pokesurvivor.com, con tu cuenta iniciada.':
    'This file is a save from this version, not from the official game: the code has to be pasted into the console on pokesurvivor.com, signed in to your account.',
  'No hay ninguna partida abierta.': 'No save is open.',
  '{x} datos no reconocidos se han descartado.': '{x} unrecognised entries were discarded.',
  '{x} números fuera de rango se han ajustado.': '{x} out-of-range numbers were adjusted.',
  'La partida es de una versión más nueva del juego oficial: se trae lo que esta versión reconoce.':
    'The save is from a newer version of the official game: whatever this version recognises is brought over.',
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
  'Dex: menús de Pokédex y letra redondeada. Clásico: el aspecto del juego original.': 'Dex: Pokédex menus and a rounded font. Classic: the look of the original game.',
  'Letra del estilo Dex:': 'Dex style font:',
  'Letra del estilo Dex: M PLUS Rounded 1c (OFL).': 'Dex style font: M PLUS Rounded 1c (OFL).',
  // Controles: un plegable abierto o una tableta también juegan en vertical (y, con las ranuras en columna, «de la derecha»).
  'Pon el dedo en cualquier parte y arrastra para moverte: el joystick aparece donde tocas. Toca un ataque de abajo para cambiarlo y el botón de arriba a la derecha para pausar. Se juega en horizontal (en un plegable abierto o en una tableta, también en vertical).':
    'Put your finger anywhere and drag to move: the joystick appears where you touch. Tap a move at the bottom to switch to it and the top-right button to pause. Play in landscape (on an unfolded foldable or a tablet, portrait works too).',
  'Pon el dedo en cualquier parte y arrastra para moverte: el joystick aparece donde tocas. Toca un ataque de la derecha para cambiarlo y el botón de arriba a la derecha para pausar. Se juega en horizontal (en un plegable abierto o en una tableta, también en vertical).':
    'Put your finger anywhere and drag to move: the joystick appears where you touch. Tap a move on the right to switch to it and the top-right button to pause. Play in landscape (on an unfolded foldable or a tablet, portrait works too).'
});
