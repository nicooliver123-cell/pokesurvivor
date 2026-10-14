/* ============ evolutions.js — GENERADO, no editar a mano (MOD nico) ============
 * Lo produce tools/nico/evoluciones.js con la tabla de especies de PokeAPI
 * (pokemon_species.csv: id y evolves_from_species_id), bajada una vez: el juego no
 * hace ninguna petición a internet.
 *
 * G.EVO = { padre: [hijos] }: la siguiente fase inmediata de cada especie, sólo entre
 * las 966 del juego (en G.DEX_BY y con G.SPRITE_META). Si falta un estadio
 * intermedio, se salta (Pidove -> Unfezant); las formas regionales cuentan como su
 * especie. 429 especies con evolución, 456 evoluciones.
 * Lo usa el mod «Pokémon repetido» del gacha (js/core/mods.js, repetidoDaEvolucion).
 */
G.EVO = {
  1: [2],               // Bulbasaur -> Ivysaur
  2: [3],               // Ivysaur -> Venusaur
  4: [5],               // Charmander -> Charmeleon
  5: [6],               // Charmeleon -> Charizard
  7: [8],               // Squirtle -> Wartortle
  8: [9],               // Wartortle -> Blastoise
  10: [11],             // Caterpie -> Metapod
  11: [12],             // Metapod -> Butterfree
  13: [14],             // Weedle -> Kakuna
  14: [15],             // Kakuna -> Beedrill
  16: [17],             // Pidgey -> Pidgeotto
  17: [18],             // Pidgeotto -> Pidgeot
  19: [20],             // Rattata -> Raticate
  21: [22],             // Spearow -> Fearow
  23: [24],             // Ekans -> Arbok
  25: [26],             // Pikachu -> Raichu
  27: [28],             // Sandshrew -> Sandslash
  29: [30],             // Nidoran♀ -> Nidorina
  30: [31],             // Nidorina -> Nidoqueen
  32: [33],             // Nidoran♂ -> Nidorino
  33: [34],             // Nidorino -> Nidoking
  35: [36],             // Clefairy -> Clefable
  37: [38],             // Vulpix -> Ninetales
  39: [40],             // Jigglypuff -> Wigglytuff
  41: [42],             // Zubat -> Golbat
  42: [169],            // Golbat -> Crobat
  43: [44],             // Oddish -> Gloom
  44: [45, 182],        // Gloom -> Vileplume, Bellossom
  46: [47],             // Paras -> Parasect
  48: [49],             // Venonat -> Venomoth
  50: [51],             // Diglett -> Dugtrio
  52: [53, 863],        // Meowth -> Persian, Perrserker
  54: [55],             // Psyduck -> Golduck
  56: [57],             // Mankey -> Primeape
  57: [979],            // Primeape -> Annihilape
  58: [59],             // Growlithe -> Arcanine
  60: [61],             // Poliwag -> Poliwhirl
  61: [62, 186],        // Poliwhirl -> Poliwrath, Politoed
  63: [64],             // Abra -> Kadabra
  64: [65],             // Kadabra -> Alakazam
  66: [67],             // Machop -> Machoke
  67: [68],             // Machoke -> Machamp
  69: [70],             // Bellsprout -> Weepinbell
  70: [71],             // Weepinbell -> Victreebel
  72: [73],             // Tentacool -> Tentacruel
  74: [75],             // Geodude -> Graveler
  75: [76],             // Graveler -> Golem
  77: [78],             // Ponyta -> Rapidash
  79: [80, 199],        // Slowpoke -> Slowbro, Slowking
  81: [82],             // Magnemite -> Magneton
  82: [462],            // Magneton -> Magnezone
  84: [85],             // Doduo -> Dodrio
  86: [87],             // Seel -> Dewgong
  88: [89],             // Grimer -> Muk
  90: [91],             // Shellder -> Cloyster
  92: [93],             // Gastly -> Haunter
  93: [94],             // Haunter -> Gengar
  95: [208],            // Onix -> Steelix
  96: [97],             // Drowzee -> Hypno
  98: [99],             // Krabby -> Kingler
  100: [101],           // Voltorb -> Electrode
  102: [103],           // Exeggcute -> Exeggutor
  104: [105],           // Cubone -> Marowak
  108: [463],           // Lickitung -> Lickilicky
  109: [110],           // Koffing -> Weezing
  111: [112],           // Rhyhorn -> Rhydon
  112: [464],           // Rhydon -> Rhyperior
  113: [242],           // Chansey -> Blissey
  114: [465],           // Tangela -> Tangrowth
  116: [117],           // Horsea -> Seadra
  117: [230],           // Seadra -> Kingdra
  118: [119],           // Goldeen -> Seaking
  120: [121],           // Staryu -> Starmie
  123: [212, 900],      // Scyther -> Scizor, Kleavor
  125: [466],           // Electabuzz -> Electivire
  126: [467],           // Magmar -> Magmortar
  129: [130],           // Magikarp -> Gyarados
  133: [134, 135, 136, 196, 197, 470, 471, 700], // Eevee -> Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon, Sylveon
  137: [233],           // Porygon -> Porygon2
  138: [139],           // Omanyte -> Omastar
  140: [141],           // Kabuto -> Kabutops
  147: [148],           // Dratini -> Dragonair
  148: [149],           // Dragonair -> Dragonite
  152: [153],           // Chikorita -> Bayleef
  153: [154],           // Bayleef -> Meganium
  155: [156],           // Cyndaquil -> Quilava
  156: [157],           // Quilava -> Typhlosion
  158: [159],           // Totodile -> Croconaw
  159: [160],           // Croconaw -> Feraligatr
  161: [162],           // Sentret -> Furret
  163: [164],           // Hoothoot -> Noctowl
  165: [166],           // Ledyba -> Ledian
  167: [168],           // Spinarak -> Ariados
  170: [171],           // Chinchou -> Lanturn
  172: [25],            // Pichu -> Pikachu
  173: [35],            // Cleffa -> Clefairy
  174: [39],            // Igglybuff -> Jigglypuff
  175: [176],           // Togepi -> Togetic
  176: [468],           // Togetic -> Togekiss
  177: [178],           // Natu -> Xatu
  179: [180],           // Mareep -> Flaaffy
  180: [181],           // Flaaffy -> Ampharos
  183: [184],           // Marill -> Azumarill
  187: [188],           // Hoppip -> Skiploom
  188: [189],           // Skiploom -> Jumpluff
  190: [424],           // Aipom -> Ambipom
  191: [192],           // Sunkern -> Sunflora
  193: [469],           // Yanma -> Yanmega
  194: [195, 980],      // Wooper -> Quagsire, Clodsire
  198: [430],           // Murkrow -> Honchkrow
  200: [429],           // Misdreavus -> Mismagius
  203: [981],           // Girafarig -> Farigiraf
  204: [205],           // Pineco -> Forretress
  206: [982],           // Dunsparce -> Dudunsparce
  207: [472],           // Gligar -> Gliscor
  209: [210],           // Snubbull -> Granbull
  211: [904],           // Qwilfish -> Overqwil
  215: [461, 903],      // Sneasel -> Weavile, Sneasler
  216: [217],           // Teddiursa -> Ursaring
  217: [901],           // Ursaring -> Ursaluna
  218: [219],           // Slugma -> Magcargo
  220: [221],           // Swinub -> Piloswine
  221: [473],           // Piloswine -> Mamoswine
  222: [864],           // Corsola -> Cursola
  223: [224],           // Remoraid -> Octillery
  228: [229],           // Houndour -> Houndoom
  231: [232],           // Phanpy -> Donphan
  233: [474],           // Porygon2 -> Porygon-Z
  234: [899],           // Stantler -> Wyrdeer
  236: [106, 107, 237], // Tyrogue -> Hitmonlee, Hitmonchan, Hitmontop
  238: [124],           // Smoochum -> Jynx
  239: [125],           // Elekid -> Electabuzz
  240: [126],           // Magby -> Magmar
  246: [247],           // Larvitar -> Pupitar
  247: [248],           // Pupitar -> Tyranitar
  252: [253],           // Treecko -> Grovyle
  253: [254],           // Grovyle -> Sceptile
  255: [256],           // Torchic -> Combusken
  256: [257],           // Combusken -> Blaziken
  258: [259],           // Mudkip -> Marshtomp
  259: [260],           // Marshtomp -> Swampert
  261: [262],           // Poochyena -> Mightyena
  263: [264],           // Zigzagoon -> Linoone
  264: [862],           // Linoone -> Obstagoon
  265: [266, 268],      // Wurmple -> Silcoon, Cascoon
  266: [267],           // Silcoon -> Beautifly
  268: [269],           // Cascoon -> Dustox
  270: [271],           // Lotad -> Lombre
  271: [272],           // Lombre -> Ludicolo
  273: [274],           // Seedot -> Nuzleaf
  274: [275],           // Nuzleaf -> Shiftry
  276: [277],           // Taillow -> Swellow
  278: [279],           // Wingull -> Pelipper
  280: [281],           // Ralts -> Kirlia
  281: [282, 475],      // Kirlia -> Gardevoir, Gallade
  283: [284],           // Surskit -> Masquerain
  285: [286],           // Shroomish -> Breloom
  287: [288],           // Slakoth -> Vigoroth
  288: [289],           // Vigoroth -> Slaking
  290: [291, 292],      // Nincada -> Ninjask, Shedinja
  293: [294],           // Whismur -> Loudred
  294: [295],           // Loudred -> Exploud
  296: [297],           // Makuhita -> Hariyama
  298: [183],           // Azurill -> Marill
  299: [476],           // Nosepass -> Probopass
  300: [301],           // Skitty -> Delcatty
  304: [305],           // Aron -> Lairon
  305: [306],           // Lairon -> Aggron
  307: [308],           // Meditite -> Medicham
  309: [310],           // Electrike -> Manectric
  315: [407],           // Roselia -> Roserade
  316: [317],           // Gulpin -> Swalot
  318: [319],           // Carvanha -> Sharpedo
  320: [321],           // Wailmer -> Wailord
  322: [323],           // Numel -> Camerupt
  325: [326],           // Spoink -> Grumpig
  328: [329],           // Trapinch -> Vibrava
  329: [330],           // Vibrava -> Flygon
  331: [332],           // Cacnea -> Cacturne
  333: [334],           // Swablu -> Altaria
  339: [340],           // Barboach -> Whiscash
  341: [342],           // Corphish -> Crawdaunt
  343: [344],           // Baltoy -> Claydol
  345: [346],           // Lileep -> Cradily
  347: [348],           // Anorith -> Armaldo
  349: [350],           // Feebas -> Milotic
  353: [354],           // Shuppet -> Banette
  355: [356],           // Duskull -> Dusclops
  356: [477],           // Dusclops -> Dusknoir
  360: [202],           // Wynaut -> Wobbuffet
  361: [362, 478],      // Snorunt -> Glalie, Froslass
  363: [364],           // Spheal -> Sealeo
  364: [365],           // Sealeo -> Walrein
  366: [367, 368],      // Clamperl -> Huntail, Gorebyss
  371: [372],           // Bagon -> Shelgon
  372: [373],           // Shelgon -> Salamence
  374: [375],           // Beldum -> Metang
  375: [376],           // Metang -> Metagross
  387: [388],           // Turtwig -> Grotle
  388: [389],           // Grotle -> Torterra
  390: [391],           // Chimchar -> Monferno
  391: [392],           // Monferno -> Infernape
  393: [394],           // Piplup -> Prinplup
  394: [395],           // Prinplup -> Empoleon
  396: [397],           // Starly -> Staravia
  397: [398],           // Staravia -> Staraptor
  399: [400],           // Bidoof -> Bibarel
  401: [402],           // Kricketot -> Kricketune
  403: [404],           // Shinx -> Luxio
  404: [405],           // Luxio -> Luxray
  406: [315],           // Budew -> Roselia
  408: [409],           // Cranidos -> Rampardos
  410: [411],           // Shieldon -> Bastiodon
  412: [413, 414],      // Burmy -> Wormadam, Mothim
  415: [416],           // Combee -> Vespiquen
  418: [419],           // Buizel -> Floatzel
  420: [421],           // Cherubi -> Cherrim
  422: [423],           // Shellos -> Gastrodon
  425: [426],           // Drifloon -> Drifblim
  427: [428],           // Buneary -> Lopunny
  431: [432],           // Glameow -> Purugly
  433: [358],           // Chingling -> Chimecho
  434: [435],           // Stunky -> Skuntank
  436: [437],           // Bronzor -> Bronzong
  438: [185],           // Bonsly -> Sudowoodo
  439: [122],           // Mime Jr. -> Mr. Mime
  440: [113],           // Happiny -> Chansey
  443: [444],           // Gible -> Gabite
  444: [445],           // Gabite -> Garchomp
  446: [143],           // Munchlax -> Snorlax
  447: [448],           // Riolu -> Lucario
  449: [450],           // Hippopotas -> Hippowdon
  451: [452],           // Skorupi -> Drapion
  453: [454],           // Croagunk -> Toxicroak
  456: [457],           // Finneon -> Lumineon
  458: [226],           // Mantyke -> Mantine
  459: [460],           // Snover -> Abomasnow
  495: [496],           // Snivy -> Servine
  496: [497],           // Servine -> Serperior
  498: [499],           // Tepig -> Pignite
  499: [500],           // Pignite -> Emboar
  501: [502],           // Oshawott -> Dewott
  502: [503],           // Dewott -> Samurott
  504: [505],           // Patrat -> Watchog
  506: [507],           // Lillipup -> Herdier
  507: [508],           // Herdier -> Stoutland
  509: [510],           // Purrloin -> Liepard
  511: [512],           // Pansage -> Simisage
  517: [518],           // Munna -> Musharna
  519: [521],           // Pidove -> Unfezant
  524: [525],           // Roggenrola -> Boldore
  525: [526],           // Boldore -> Gigalith
  527: [528],           // Woobat -> Swoobat
  529: [530],           // Drilbur -> Excadrill
  532: [533],           // Timburr -> Gurdurr
  533: [534],           // Gurdurr -> Conkeldurr
  535: [536],           // Tympole -> Palpitoad
  536: [537],           // Palpitoad -> Seismitoad
  540: [541],           // Sewaddle -> Swadloon
  541: [542],           // Swadloon -> Leavanny
  543: [544],           // Venipede -> Whirlipede
  544: [545],           // Whirlipede -> Scolipede
  546: [547],           // Cottonee -> Whimsicott
  548: [549],           // Petilil -> Lilligant
  550: [902],           // Basculin -> Basculegion
  551: [552],           // Sandile -> Krokorok
  552: [553],           // Krokorok -> Krookodile
  554: [555],           // Darumaka -> Darmanitan
  559: [560],           // Scraggy -> Scrafty
  562: [563, 867],      // Yamask -> Cofagrigus, Runerigus
  566: [567],           // Archen -> Archeops
  568: [569],           // Trubbish -> Garbodor
  570: [571],           // Zorua -> Zoroark
  572: [573],           // Minccino -> Cinccino
  574: [575],           // Gothita -> Gothorita
  575: [576],           // Gothorita -> Gothitelle
  577: [578],           // Solosis -> Duosion
  578: [579],           // Duosion -> Reuniclus
  580: [581],           // Ducklett -> Swanna
  582: [583],           // Vanillite -> Vanillish
  583: [584],           // Vanillish -> Vanilluxe
  585: [586],           // Deerling -> Sawsbuck
  588: [589],           // Karrablast -> Escavalier
  595: [596],           // Joltik -> Galvantula
  597: [598],           // Ferroseed -> Ferrothorn
  599: [600],           // Klink -> Klang
  600: [601],           // Klang -> Klinklang
  602: [603],           // Tynamo -> Eelektrik
  603: [604],           // Eelektrik -> Eelektross
  605: [606],           // Elgyem -> Beheeyem
  607: [608],           // Litwick -> Lampent
  608: [609],           // Lampent -> Chandelure
  610: [611],           // Axew -> Fraxure
  611: [612],           // Fraxure -> Haxorus
  613: [614],           // Cubchoo -> Beartic
  619: [620],           // Mienfoo -> Mienshao
  622: [623],           // Golett -> Golurk
  624: [625],           // Pawniard -> Bisharp
  625: [983],           // Bisharp -> Kingambit
  627: [628],           // Rufflet -> Braviary
  629: [630],           // Vullaby -> Mandibuzz
  633: [634],           // Deino -> Zweilous
  634: [635],           // Zweilous -> Hydreigon
  636: [637],           // Larvesta -> Volcarona
  650: [651],           // Chespin -> Quilladin
  651: [652],           // Quilladin -> Chesnaught
  653: [654],           // Fennekin -> Braixen
  654: [655],           // Braixen -> Delphox
  656: [657],           // Froakie -> Frogadier
  657: [658],           // Frogadier -> Greninja
  659: [660],           // Bunnelby -> Diggersby
  661: [662],           // Fletchling -> Fletchinder
  662: [663],           // Fletchinder -> Talonflame
  664: [665],           // Scatterbug -> Spewpa
  665: [666],           // Spewpa -> Vivillon
  669: [670],           // Flabébé -> Floette
  670: [671],           // Floette -> Florges
  672: [673],           // Skiddo -> Gogoat
  674: [675],           // Pancham -> Pangoro
  677: [678],           // Espurr -> Meowstic
  679: [680],           // Honedge -> Doublade
  680: [681],           // Doublade -> Aegislash
  684: [685],           // Swirlix -> Slurpuff
  686: [687],           // Inkay -> Malamar
  688: [689],           // Binacle -> Barbaracle
  690: [691],           // Skrelp -> Dragalge
  692: [693],           // Clauncher -> Clawitzer
  694: [695],           // Helioptile -> Heliolisk
  696: [697],           // Tyrunt -> Tyrantrum
  698: [699],           // Amaura -> Aurorus
  704: [705],           // Goomy -> Sliggoo
  705: [706],           // Sliggoo -> Goodra
  708: [709],           // Phantump -> Trevenant
  710: [711],           // Pumpkaboo -> Gourgeist
  712: [713],           // Bergmite -> Avalugg
  714: [715],           // Noibat -> Noivern
  722: [723],           // Rowlet -> Dartrix
  723: [724],           // Dartrix -> Decidueye
  725: [726],           // Litten -> Torracat
  726: [727],           // Torracat -> Incineroar
  728: [729],           // Popplio -> Brionne
  729: [730],           // Brionne -> Primarina
  736: [737],           // Grubbin -> Charjabug
  737: [738],           // Charjabug -> Vikavolt
  739: [740],           // Crabrawler -> Crabominable
  742: [743],           // Cutiefly -> Ribombee
  744: [745],           // Rockruff -> Lycanroc
  747: [748],           // Mareanie -> Toxapex
  749: [750],           // Mudbray -> Mudsdale
  751: [752],           // Dewpider -> Araquanid
  753: [754],           // Fomantis -> Lurantis
  757: [758],           // Salandit -> Salazzle
  759: [760],           // Stufful -> Bewear
  761: [762],           // Bounsweet -> Steenee
  762: [763],           // Steenee -> Tsareena
  767: [768],           // Wimpod -> Golisopod
  769: [770],           // Sandygast -> Palossand
  772: [773],           // Código Cero -> Silvally
  782: [783],           // Jangmo-o -> Hakamo-o
  783: [784],           // Hakamo-o -> Kommo-o
  789: [790],           // Cosmog -> Cosmoem
  790: [791, 792],      // Cosmoem -> Solgaleo, Lunala
  803: [804],           // Poipole -> Naganadel
  808: [809],           // Meltan -> Melmetal
  810: [811],           // Grookey -> Thwackey
  811: [812],           // Thwackey -> Rillaboom
  813: [814],           // Scorbunny -> Raboot
  814: [815],           // Raboot -> Cinderace
  816: [817],           // Sobble -> Drizzile
  817: [818],           // Drizzile -> Inteleon
  819: [820],           // Skwovet -> Greedent
  821: [822],           // Rookidee -> Corvisquire
  822: [823],           // Corvisquire -> Corviknight
  824: [825],           // Blipbug -> Dottler
  825: [826],           // Dottler -> Orbeetle
  827: [828],           // Nickit -> Thievul
  829: [830],           // Gossifleur -> Eldegoss
  831: [832],           // Wooloo -> Dubwool
  833: [834],           // Chewtle -> Drednaw
  835: [836],           // Yamper -> Boltund
  840: [841, 842, 1011], // Applin -> Flapple, Appletun, Dipplin
  843: [844],           // Silicobra -> Sandaconda
  846: [847],           // Arrokuda -> Barraskewda
  848: [849],           // Toxel -> Toxtricity
  850: [851],           // Sizzlipede -> Centiskorch
  852: [853],           // Clobbopus -> Grapploct
  854: [855],           // Sinistea -> Polteageist
  856: [857],           // Hatenna -> Hattrem
  857: [858],           // Hattrem -> Hatterene
  859: [860],           // Impidimp -> Morgrem
  860: [861],           // Morgrem -> Grimmsnarl
  868: [869],           // Milcery -> Alcremie
  872: [873],           // Snom -> Frosmoth
  884: [1018],          // Duraludon -> Archaludon
  885: [886],           // Dreepy -> Drakloak
  886: [887],           // Drakloak -> Dragapult
  891: [892],           // Kubfu -> Urshifu
  906: [907],           // Sprigatito -> Floragato
  907: [908],           // Floragato -> Meowscarada
  909: [910],           // Fuecoco -> Crocalor
  910: [911],           // Crocalor -> Skeledirge
  912: [913],           // Quaxly -> Quaxwell
  913: [914],           // Quaxwell -> Quaquaval
  915: [916],           // Lechonk -> Oinkologne
  917: [918],           // Tarountula -> Spidops
  919: [920],           // Nymble -> Lokix
  921: [922],           // Pawmi -> Pawmo
  922: [923],           // Pawmo -> Pawmot
  924: [925],           // Tandemaus -> Maushold
  926: [927],           // Fidough -> Dachsbun
  928: [930],           // Smoliv -> Arboliva
  932: [933],           // Nacli -> Naclstack
  933: [934],           // Naclstack -> Garganacl
  935: [936, 937],      // Charcadet -> Armarouge, Ceruledge
  938: [939],           // Tadbulb -> Bellibolt
  940: [941],           // Wattrel -> Kilowattrel
  951: [952],           // Capsakid -> Scovillain
  957: [958],           // Tinkatink -> Tinkatuff
  958: [959],           // Tinkatuff -> Tinkaton
  960: [961],           // Wiglett -> Wugtrio
  963: [964],           // Finizen -> Palafin
  965: [966],           // Varoom -> Revavroom
  969: [970],           // Glimmet -> Glimmora
  971: [972],           // Greavard -> Houndstone
  974: [975],           // Cetoddle -> Cetitan
  996: [997],           // Frigibax -> Arctibax
  997: [998],           // Arctibax -> Baxcalibur
  1011: [1019],         // Dipplin -> Hydrapple
  1012: [1013],         // Poltchageist -> Sinistcha
};

/* G.EVO_NIVEL = { hijo: nivel }: al que evoluciona en los juegos, sólo las 327 que son por subir de
 * nivel (de 456; el resto es por piedra, intercambio, amistad...). Lo usa js/systems/evo-partida.js. */
G.EVO_NIVEL = {
  2: 16,      // Ivysaur
  3: 32,      // Venusaur
  5: 16,      // Charmeleon
  6: 36,      // Charizard
  8: 16,      // Wartortle
  9: 36,      // Blastoise
  11: 7,      // Metapod
  12: 10,     // Butterfree
  14: 7,      // Kakuna
  15: 10,     // Beedrill
  17: 18,     // Pidgeotto
  18: 36,     // Pidgeot
  20: 20,     // Raticate
  22: 20,     // Fearow
  24: 22,     // Arbok
  28: 22,     // Sandslash
  30: 16,     // Nidorina
  33: 16,     // Nidorino
  42: 22,     // Golbat
  44: 21,     // Gloom
  47: 24,     // Parasect
  49: 31,     // Venomoth
  51: 26,     // Dugtrio
  53: 28,     // Persian
  55: 33,     // Golduck
  57: 28,     // Primeape
  61: 25,     // Poliwhirl
  64: 16,     // Kadabra
  67: 28,     // Machoke
  70: 21,     // Weepinbell
  73: 30,     // Tentacruel
  75: 25,     // Graveler
  78: 40,     // Rapidash
  80: 37,     // Slowbro
  82: 30,     // Magneton
  85: 31,     // Dodrio
  87: 34,     // Dewgong
  89: 38,     // Muk
  93: 25,     // Haunter
  97: 26,     // Hypno
  99: 28,     // Kingler
  101: 30,    // Electrode
  105: 28,    // Marowak
  106: 20,    // Hitmonlee
  107: 20,    // Hitmonchan
  110: 35,    // Weezing
  112: 42,    // Rhydon
  117: 32,    // Seadra
  119: 33,    // Seaking
  124: 30,    // Jynx
  125: 30,    // Electabuzz
  126: 30,    // Magmar
  130: 20,    // Gyarados
  139: 40,    // Omastar
  141: 40,    // Kabutops
  148: 30,    // Dragonair
  149: 55,    // Dragonite
  153: 16,    // Bayleef
  154: 32,    // Meganium
  156: 14,    // Quilava
  157: 36,    // Typhlosion
  159: 18,    // Croconaw
  160: 30,    // Feraligatr
  162: 15,    // Furret
  164: 20,    // Noctowl
  166: 18,    // Ledian
  168: 22,    // Ariados
  171: 27,    // Lanturn
  178: 25,    // Xatu
  180: 15,    // Flaaffy
  181: 30,    // Ampharos
  184: 18,    // Azumarill
  188: 18,    // Skiploom
  189: 27,    // Jumpluff
  195: 20,    // Quagsire
  202: 15,    // Wobbuffet
  205: 31,    // Forretress
  210: 23,    // Granbull
  217: 30,    // Ursaring
  219: 38,    // Magcargo
  221: 33,    // Piloswine
  224: 25,    // Octillery
  229: 24,    // Houndoom
  232: 25,    // Donphan
  237: 20,    // Hitmontop
  247: 30,    // Pupitar
  248: 55,    // Tyranitar
  253: 16,    // Grovyle
  254: 36,    // Sceptile
  256: 16,    // Combusken
  257: 36,    // Blaziken
  259: 16,    // Marshtomp
  260: 36,    // Swampert
  262: 18,    // Mightyena
  264: 20,    // Linoone
  266: 7,     // Silcoon
  267: 10,    // Beautifly
  268: 7,     // Cascoon
  269: 10,    // Dustox
  271: 14,    // Lombre
  274: 14,    // Nuzleaf
  277: 22,    // Swellow
  279: 25,    // Pelipper
  281: 20,    // Kirlia
  282: 30,    // Gardevoir
  284: 22,    // Masquerain
  286: 23,    // Breloom
  288: 18,    // Vigoroth
  289: 36,    // Slaking
  291: 20,    // Ninjask
  294: 20,    // Loudred
  295: 40,    // Exploud
  297: 24,    // Hariyama
  305: 32,    // Lairon
  306: 42,    // Aggron
  308: 37,    // Medicham
  310: 26,    // Manectric
  317: 26,    // Swalot
  319: 30,    // Sharpedo
  321: 40,    // Wailord
  323: 33,    // Camerupt
  326: 32,    // Grumpig
  329: 35,    // Vibrava
  330: 45,    // Flygon
  332: 32,    // Cacturne
  334: 35,    // Altaria
  340: 30,    // Whiscash
  342: 30,    // Crawdaunt
  344: 36,    // Claydol
  346: 40,    // Cradily
  348: 40,    // Armaldo
  354: 37,    // Banette
  356: 37,    // Dusclops
  362: 42,    // Glalie
  364: 32,    // Sealeo
  365: 44,    // Walrein
  372: 30,    // Shelgon
  373: 50,    // Salamence
  375: 20,    // Metang
  376: 45,    // Metagross
  388: 18,    // Grotle
  389: 32,    // Torterra
  391: 14,    // Monferno
  392: 36,    // Infernape
  394: 16,    // Prinplup
  395: 36,    // Empoleon
  397: 14,    // Staravia
  398: 34,    // Staraptor
  400: 15,    // Bibarel
  402: 10,    // Kricketune
  404: 15,    // Luxio
  405: 30,    // Luxray
  409: 30,    // Rampardos
  411: 30,    // Bastiodon
  413: 20,    // Wormadam
  414: 20,    // Mothim
  416: 21,    // Vespiquen
  419: 26,    // Floatzel
  421: 25,    // Cherrim
  423: 30,    // Gastrodon
  426: 28,    // Drifblim
  432: 38,    // Purugly
  435: 34,    // Skuntank
  437: 33,    // Bronzong
  444: 24,    // Gabite
  445: 48,    // Garchomp
  450: 34,    // Hippowdon
  452: 40,    // Drapion
  454: 37,    // Toxicroak
  457: 31,    // Lumineon
  460: 40,    // Abomasnow
  496: 17,    // Servine
  497: 36,    // Serperior
  499: 17,    // Pignite
  500: 36,    // Emboar
  502: 17,    // Dewott
  503: 36,    // Samurott
  505: 20,    // Watchog
  507: 16,    // Herdier
  508: 32,    // Stoutland
  510: 20,    // Liepard
  521: 32,    // Unfezant
  525: 25,    // Boldore
  530: 31,    // Excadrill
  533: 25,    // Gurdurr
  536: 25,    // Palpitoad
  537: 36,    // Seismitoad
  541: 20,    // Swadloon
  544: 22,    // Whirlipede
  545: 30,    // Scolipede
  552: 29,    // Krokorok
  553: 40,    // Krookodile
  555: 35,    // Darmanitan
  560: 39,    // Scrafty
  563: 34,    // Cofagrigus
  567: 37,    // Archeops
  569: 36,    // Garbodor
  571: 30,    // Zoroark
  575: 32,    // Gothorita
  576: 41,    // Gothitelle
  578: 32,    // Duosion
  579: 41,    // Reuniclus
  581: 35,    // Swanna
  583: 35,    // Vanillish
  584: 47,    // Vanilluxe
  586: 34,    // Sawsbuck
  596: 36,    // Galvantula
  598: 40,    // Ferrothorn
  600: 38,    // Klang
  601: 49,    // Klinklang
  603: 39,    // Eelektrik
  606: 42,    // Beheeyem
  608: 41,    // Lampent
  611: 38,    // Fraxure
  612: 48,    // Haxorus
  614: 37,    // Beartic
  620: 50,    // Mienshao
  623: 43,    // Golurk
  625: 52,    // Bisharp
  628: 54,    // Braviary
  630: 54,    // Mandibuzz
  634: 50,    // Zweilous
  635: 64,    // Hydreigon
  637: 59,    // Volcarona
  651: 16,    // Quilladin
  652: 36,    // Chesnaught
  654: 16,    // Braixen
  655: 36,    // Delphox
  657: 16,    // Frogadier
  658: 36,    // Greninja
  660: 20,    // Diggersby
  662: 17,    // Fletchinder
  663: 35,    // Talonflame
  665: 9,     // Spewpa
  666: 12,    // Vivillon
  670: 19,    // Floette
  673: 32,    // Gogoat
  675: 32,    // Pangoro
  678: 25,    // Meowstic
  680: 35,    // Doublade
  687: 30,    // Malamar
  689: 39,    // Barbaracle
  691: 48,    // Dragalge
  693: 37,    // Clawitzer
  697: 39,    // Tyrantrum
  699: 39,    // Aurorus
  705: 40,    // Sliggoo
  706: 50,    // Goodra
  713: 37,    // Avalugg
  715: 48,    // Noivern
  723: 17,    // Dartrix
  724: 34,    // Decidueye
  726: 17,    // Torracat
  727: 34,    // Incineroar
  729: 17,    // Brionne
  730: 34,    // Primarina
  737: 20,    // Charjabug
  743: 25,    // Ribombee
  745: 25,    // Lycanroc
  748: 38,    // Toxapex
  750: 30,    // Mudsdale
  752: 22,    // Araquanid
  754: 34,    // Lurantis
  758: 33,    // Salazzle
  760: 27,    // Bewear
  762: 18,    // Steenee
  768: 30,    // Golisopod
  770: 42,    // Palossand
  783: 35,    // Hakamo-o
  784: 45,    // Kommo-o
  790: 43,    // Cosmoem
  791: 53,    // Solgaleo
  792: 53,    // Lunala
  811: 16,    // Thwackey
  812: 35,    // Rillaboom
  814: 16,    // Raboot
  815: 35,    // Cinderace
  817: 16,    // Drizzile
  818: 35,    // Inteleon
  820: 24,    // Greedent
  822: 18,    // Corvisquire
  823: 38,    // Corviknight
  825: 10,    // Dottler
  826: 30,    // Orbeetle
  828: 18,    // Thievul
  830: 20,    // Eldegoss
  832: 24,    // Dubwool
  834: 22,    // Drednaw
  836: 25,    // Boltund
  844: 36,    // Sandaconda
  847: 26,    // Barraskewda
  849: 30,    // Toxtricity
  851: 28,    // Centiskorch
  857: 32,    // Hattrem
  858: 42,    // Hatterene
  860: 32,    // Morgrem
  861: 42,    // Grimmsnarl
  862: 35,    // Obstagoon
  863: 28,    // Perrserker
  864: 38,    // Cursola
  886: 50,    // Drakloak
  887: 60,    // Dragapult
  907: 16,    // Floragato
  908: 36,    // Meowscarada
  910: 16,    // Crocalor
  911: 36,    // Skeledirge
  913: 16,    // Quaxwell
  914: 36,    // Quaquaval
  916: 18,    // Oinkologne
  918: 15,    // Spidops
  920: 24,    // Lokix
  922: 18,    // Pawmo
  927: 26,    // Dachsbun
  930: 35,    // Arboliva
  933: 24,    // Naclstack
  934: 38,    // Garganacl
  941: 25,    // Kilowattrel
  958: 24,    // Tinkatuff
  959: 38,    // Tinkaton
  961: 26,    // Wugtrio
  964: 38,    // Palafin
  966: 40,    // Revavroom
  970: 35,    // Glimmora
  972: 30,    // Houndstone
  980: 20,    // Clodsire
  997: 35,    // Arctibax
  998: 54,    // Baxcalibur
};
