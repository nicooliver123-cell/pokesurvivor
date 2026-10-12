# tools/nico/iconos.py — iconos de PokéSwarm (MOD nico), en pixel art.
#   python tools/nico/iconos.py      (desde la raíz del repo o desde cualquier sitio)
#
# El motivo es el Rotom-Dex mínimo de la identidad «Dex de Expedición» (la misma marca que va delante del
# nombre en la portada: cuerpo rojo de carcasa #D7263D con su canto #8C1328, contorno #071318 y dos ojos
# cian #62E3DD con su brillo) rodeado por un enjambre de rivales en el violeta de los jefes (#9B6BFF), con un
# shiny dorado entre ellos: tú y tu compañero contra el enjambre. Nada de Poké Ball.
#
# Dos dibujos:
#   MARCA (16x16): sólo el Rotom-Dex, sin fondo; para 16 y 32 px (favicon.ico), donde el enjambre no se lee.
#   APP (20x20): el Rotom-Dex y el enjambre, sobre el cristal petróleo de la interfaz (#0F2630).
# Siempre a escala entera (sin suavizar los píxeles). El fondo redondeado sí se suaviza.
#
# Salida (nombres nuevos: sw.js guarda assets/icons/ para siempre, así que un nombre no se reutiliza):
#   assets/icons/swarm-48.png, -96, -144, -192, -512   iconos «any» (fondo redondeado, esquinas transparentes)
#   assets/icons/swarm-180.png                         apple-touch-icon (fondo entero: iOS pone sus esquinas)
#   assets/icons/swarm-maskable-512.png                PWA «maskable» (fondo entero; el motivo, en la zona segura)
#   favicon.ico                                        16 y 32 (MARCA) y 48 (APP)
# Necesita Pillow (pip install --user pillow).
import os
from PIL import Image, ImageDraw

RAIZ = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(RAIZ, 'assets', 'icons')

PAL = {
    'k': (7, 19, 24),        # contorno (#071318)
    'r': (215, 38, 61),      # carcasa (#D7263D)
    'R': (240, 86, 106),     # brillo de la carcasa (#F0566A, el borde de los botones rojos)
    'd': (140, 19, 40),      # canto (#8C1328)
    'c': (98, 227, 221),     # ojos (#62E3DD)
    'w': (255, 255, 255),    # brillo de los ojos
    'v': (155, 107, 255),    # enjambre (#9B6BFF, la barra rival)
    'V': (91, 59, 184),      # su sombra
    'o': (255, 203, 61),     # el shiny del enjambre (#FFCB3D, el oro de la interfaz)
    'O': (184, 134, 11),     # su sombra
}
FONDO = (15, 38, 48)         # --color-cristal (#0F2630)
FONDO_ALTO = (19, 47, 58)    # #132F3A, el arriba del degradado de las cajas

MARCA = [
    '................',
    '...kkkkkkkkkk...',
    '..kRRRrrrrrrrk..',
    '.kRRrrrrrrrrrrk.',
    '.krrkkrrrrkkrrk.',
    '.krkwckrrkwckrk.',
    '.krkcckrrkcckrk.',
    '.krkcckrrkcckrk.',
    '.krkcckrrkcckrk.',
    '.krrkkrrrrkkrrk.',
    '.krrrrrrrrrrrrk.',
    '.krrrrrrrrrrrrk.',
    '.kddddddddddddk.',
    '..kddddddddddk..',
    '...kkkkkkkkkk...',
    '................',
]

# El enjambre: bichitos de 2x2 (violeta arriba, sombra abajo) cerrando el cerco alrededor del Rotom-Dex. Uno es
# shiny (oro): la caza de shinies también es del juego.
ENJAMBRE = [(5, 0), (12, 1), (0, 6), (1, 12), (18, 4), (17, 11), (3, 18), (10, 18), (15, 17)]
SHINY = (18, 4)


def app():
    g = [['.'] * 20 for _ in range(20)]
    for y, fila in enumerate(MARCA):
        for x, ch in enumerate(fila):
            if ch != '.':
                g[y + 2][x + 2] = ch
    for x, y in ENJAMBRE:
        for dx in (0, 1):
            if g[y][x + dx] != '.' or g[y + 1][x + dx] != '.':
                raise SystemExit(f'el enjambre pisa el Rotom-Dex en {x},{y}')
            g[y][x + dx] = 'o' if (x, y) == SHINY else 'v'
            g[y + 1][x + dx] = 'O' if (x, y) == SHINY else 'V'
    return [''.join(f) for f in g]


APP = app()


def motivo(rejilla, k):
    n = len(rejilla)
    img = Image.new('RGBA', (n * k, n * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for y, fila in enumerate(rejilla):
        for x, ch in enumerate(fila):
            if ch in PAL:
                d.rectangle([x * k, y * k, (x + 1) * k - 1, (y + 1) * k - 1], fill=PAL[ch] + (255,))
    return img


def fondo(size, redondeado):
    s = 4   # suavizado de las esquinas
    big = Image.new('RGBA', (size * s, size * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    for y in range(size * s):   # degradado vertical, como las cajas del Dex
        t = y / (size * s - 1)
        c = tuple(round(FONDO_ALTO[i] + (FONDO[i] - FONDO_ALTO[i]) * t) for i in range(3))
        d.line([(0, y), (size * s - 1, y)], fill=c + (255,))
    if redondeado:
        mask = Image.new('L', big.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size * s - 1, size * s - 1], radius=round(size * s * 0.2), fill=255)
        big.putalpha(mask)
    return big.resize((size, size), Image.LANCZOS)


def icono(size, redondeado=True, k=None):
    img = fondo(size, redondeado)
    k = k or max(1, int(size * 0.86 // 20))
    m = motivo(APP, k)
    o = (size - m.width) // 2
    img.alpha_composite(m, (o, o))
    return img


def marca(size):
    k = size // 16
    m = motivo(MARCA, k)
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    img.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    hechos = []
    for size in (48, 96, 144, 192, 512):
        f = os.path.join(OUT, f'swarm-{size}.png')
        icono(size).save(f, optimize=True)
        hechos.append(f)
    f = os.path.join(OUT, 'swarm-180.png')
    icono(180, redondeado=False).save(f, optimize=True)
    hechos.append(f)
    # Maskable: el sistema recorta un círculo de radio 0,4·tamaño; con k = 14 el motivo (280 px) cabe entero en él.
    f = os.path.join(OUT, 'swarm-maskable-512.png')
    icono(512, redondeado=False, k=14).save(f, optimize=True)
    hechos.append(f)
    ico = os.path.join(RAIZ, 'favicon.ico')
    icono(48).save(ico, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=[marca(32), marca(16)])
    hechos.append(ico)
    for h in hechos:
        print('ok', os.path.relpath(h, RAIZ).replace(os.sep, '/'))


if __name__ == '__main__':
    main()
