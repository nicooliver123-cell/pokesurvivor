"""Hojas de los personajes del Multiverso, a partir de lo que dibuja PixelLab.

    python tools/nico/multiverso/montar.py                      monta las hojas de todos
    python tools/nico/multiverso/montar.py traer <clave> <dir>  copia a fuentes/ lo bajado de PixelLab

PixelLab (https://www.pixellab.ai, API v2) dibuja cada personaje mirando al sur y lo
rota a 8 direcciones (create-character-v3), y anima su forma de andar (animación `v3`,
que parte de la rotación y conserva su tamaño; las plantillas por esqueleto lo redibujaban
más pequeño) en 5 direcciones: sur, sureste, este, noreste y norte. Lo que
devuelve (lo pide tools/nico/multiverso/generar.py) se guarda, normalizado, en
tools/nico/multiverso/fuentes/<clave>/ (montar.py traer):

    rot-<dirección>.png    las 8 rotaciones (32x32)
    andar-<dirección>.png  los 4 fotogramas de andar, en fila (si los hay), en celdas de 44x44

Con eso, este script escribe assets/pokemon/<dex>/{Idle,Walk,Attack,Shoot,Charge,Hurt,Faint}.png
y su variocolor en s/, con el formato de SpriteCollab que lee js/core/sprites.js
(columnas = fotogramas; filas = las 8 direcciones: sur, sureste, este, noreste, norte,
noroeste, oeste, suroeste). Oeste, noroeste y suroeste salen en espejo de este, noreste
y sureste, para que quieto y andando sean el mismo dibujo. Las demás animaciones salen
por código de las rotaciones: respirar (Idle), un impulso hacia delante (Attack y
Shoot; el Slayer, retroceso al disparar), agacharse (Charge), retroceder (Hurt) y
caer de lado (Faint). Los que flotan (el Cacodemonio) se mecen arriba y abajo en vez
de andar, y su ancla queda por debajo del dibujo para que la sombra quede en el suelo.

La geometría (G.SPRITE_META) la escribe en js/data/multiverso.js, entre las marcas
`// <meta montar.py>` y `// </meta montar.py>`. Determinista: volver a ejecutarlo da
los mismos ficheros. Requiere Pillow.

OJO: sw.js guarda assets/pokemon/ para siempre (caché ps-art-v1). Si cambian unas
hojas ya publicadas, hace falta otra carpeta o subir ART en sw.js.
"""
import colorsys
import json
import os
import re
import shutil
import sys

from PIL import Image, ImageOps

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
FUENTES = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fuentes')
MULTIVERSO_JS = os.path.join(RAIZ, 'js', 'data', 'multiverso.js')

DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']
ESPEJO = {'west': 'east', 'north-west': 'north-east', 'south-west': 'south-east'}
# Hacia dónde mira cada fila, en píxeles de pantalla (y hacia abajo).
VECTOR = {'south': (0, 1), 'south-east': (1, 1), 'east': (1, 0), 'north-east': (1, -1),
          'north': (0, -1), 'north-west': (-1, -1), 'west': (-1, 0), 'south-west': (-1, 1)}
CELDA = 32             # lo que dibuja PixelLab
ARRIBA, ABAJO = 2, 3   # margen del fotograma por encima y por debajo de la celda
LADO = 4               # margen a los lados en lo que se desplaza (ataques, golpe, caída)


def hsv(rgb):
    r, g, b = (c / 255 for c in rgb)
    return colorsys.rgb_to_hsv(r, g, b)


def rgb(h, s, v):
    return tuple(max(0, min(255, round(c * 255))) for c in colorsys.hsv_to_rgb(h % 1, max(0, min(1, s)), max(0, min(1, v))))


def vario_agumon(c):
    """BlackAgumon: la piel naranja y amarilla, gris ceniza; ojos verdes, garras y boca, igual."""
    h, s, v = hsv(c)
    if s > 0.28 and 15 / 360 <= h <= 62 / 360:
        return rgb(225 / 360, 0.12, 0.10 + 0.42 * v)
    return c


def vario_slayer(c):
    """La armadura verde, carmesí; el visor, el arma y el gris de las juntas, igual."""
    h, s, v = hsv(c)
    if s > 0.14 and 62 / 360 <= h <= 170 / 360:
        return rgb(352 / 360, min(1, s * 1.15 + 0.1), v * 0.95)
    return c


def vario_caco(c):
    """El cuerpo rojo, morado; el ojo verde, los dientes y la boca azul, igual."""
    h, s, v = hsv(c)
    if s > 0.3 and (h <= 22 / 360 or h >= 330 / 360):
        return rgb(278 / 360, s * 0.85, v)
    return c


PJ = {
    'agumon': {'dex': 10001, 'flota': False, 'sombra': 1, 'disparo': 1, 'vario': vario_agumon},
    'slayer': {'dex': 10002, 'flota': False, 'sombra': 1, 'disparo': -1, 'vario': vario_slayer},
    'caco':   {'dex': 10003, 'flota': True,  'sombra': 1, 'disparo': 1, 'vario': vario_caco},
}
VUELO = 7   # píxeles de arte entre el suelo y el Cacodemonio


def nitida(img):
    """Sin semitransparencias: el alfa, 0 o 255 (como las hojas de SpriteCollab)."""
    img = img.convert('RGBA')
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 255) if a >= 128 else (0, 0, 0, 0)
    return img


def fondo(img):
    """Fila más baja con algo pintado (los pies)."""
    return img.getbbox()[3] - 1


def respirar(img):
    """La mitad de arriba baja un píxel (el pecho se hunde al soltar el aire)."""
    caja = img.getbbox()
    corte = caja[1] + (caja[3] - caja[1]) * 5 // 11
    out = img.copy()
    out.paste((0, 0, 0, 0), (0, 0, img.width, corte + 1))
    out.alpha_composite(img.crop((0, 0, img.width, corte)), (0, 1))
    return out


def tumbar(img, d):
    """De lado en el suelo: girado 90 grados hacia donde mira (o hacia la derecha si mira al frente)."""
    caja = img.getbbox()
    cuerpo = img.crop(caja)
    dx = VECTOR[d][0]
    return cuerpo.transpose(Image.Transpose.ROTATE_270 if dx >= 0 else Image.Transpose.ROTATE_90)


class Marco:
    """El fotograma de una animación: la celda de 32 con `lado` píxeles a cada lado (más si sus dibujos son
    más grandes). El ancla (ax, ay) cae 1,5 px por encima de la fila de los pies, como en SpriteCollab (los pies
    de Charmander acaban 2-3 px por debajo de la suya), así que la sombra queda bajo los pies; en los que flotan,
    VUELO píxeles más abajo."""
    def __init__(self, m, lado=0, celda=CELDA):
        extra = max(0, (celda - CELDA + 1) // 2)
        self.ox, self.oy = lado + extra, ARRIBA + extra
        self.w = CELDA + 2 * self.ox
        self.suelo = self.oy + m.pies + (VUELO if m.flota else 0)
        self.h = self.suelo + ABAJO + 1
        self.ax, self.ay = self.ox + CELDA / 2 - 0.5, self.suelo - 1.5


class Montaje:
    def __init__(self, clave):
        self.clave = clave
        self.cfg = PJ[clave]
        self.flota = self.cfg['flota']
        carpeta = os.path.join(FUENTES, clave)
        self.rot = {}
        for d in DIRS:
            src = ESPEJO.get(d)
            self.rot[d] = ImageOps.mirror(self._abrir(carpeta, 'rot-' + src)) if src else self._abrir(carpeta, 'rot-' + d)
        self.andar = {}
        for d in DIRS:
            src = ESPEJO.get(d) or d
            p = os.path.join(carpeta, 'andar-%s.png' % src)
            if os.path.exists(p):
                tira = nitida(Image.open(p))
                n = tira.width // tira.height
                frames = [tira.crop((i * tira.height, 0, (i + 1) * tira.height, tira.height)) for i in range(n)]
                self.andar[d] = [ImageOps.mirror(f) for f in frames] if ESPEJO.get(d) else frames
        # Los pies: la fila más baja de las rotaciones, en la celda de 32.
        self.pies = max(fondo(self.rot[d]) for d in DIRS)

    @staticmethod
    def _abrir(carpeta, nombre):
        return nitida(Image.open(os.path.join(carpeta, nombre + '.png')))

    def poner(self, mc, img, dx=0, dy=0):
        """Un fotograma: la celda de PixelLab (o una más grande, con el mismo centro) en su sitio del marco."""
        f = Image.new('RGBA', (mc.w, mc.h), (0, 0, 0, 0))
        f.alpha_composite(img, (mc.ox + (CELDA - img.width) // 2 + dx, mc.oy + (CELDA - img.height) // 2 + dy))
        return f

    def tumbado(self, mc, d):
        t = tumbar(self.rot[d], d)
        f = Image.new('RGBA', (mc.w, mc.h), (0, 0, 0, 0))
        f.alpha_composite(t, ((mc.w - t.width) // 2, mc.suelo + 1 - t.height))
        return f

    def anims(self):
        """{nombre: (marco, [fila de fotogramas por dirección], duraciones en 1/60 s)}"""
        fl, R = self.flota, self.rot
        A = {}
        vec = lambda d, k: (round(VECTOR[d][0] * k), round(VECTOR[d][1] * k * 0.6))
        meca = [0, -1, -2, -1]
        quieto = Marco(self)
        if fl:
            A['Idle'] = (quieto, [[self.poner(quieto, R[d], 0, o) for o in meca] for d in DIRS], [10, 10, 10, 10])
            A['Walk'] = (quieto, [[self.poner(quieto, R[d], 0, o) for o in meca] for d in DIRS], [6, 6, 6, 6])
        else:
            A['Idle'] = (quieto, [[self.poner(quieto, R[d]), self.poner(quieto, respirar(R[d]))] for d in DIRS], [36, 20])
            if self.andar:
                n = len(next(iter(self.andar.values())))
                mw = Marco(self, 0, max(f.width for fs in self.andar.values() for f in fs))
                A['Walk'] = (mw, [[self.poner(mw, f) for f in self.andar[d]] for d in DIRS], ([6, 8] * n)[:n])
            else:
                A['Walk'] = (quieto, [[self.poner(quieto, R[d], 0, o) for o in [0, -1, 0, -1]] for d in DIRS], [6, 8, 6, 8])
        mv = Marco(self, LADO)
        empuje = [0, 1, 3, 3, 2, 1, 0]
        A['Attack'] = (mv, [[self.poner(mv, R[d], *vec(d, k)) for k in empuje] for d in DIRS], [2, 2, 3, 3, 2, 2, 2])
        sg = self.cfg['disparo']
        A['Shoot'] = (mv, [[self.poner(mv, R[d], *vec(d, sg * k)) for k in [0, 1, 2, 1, 0]] for d in DIRS], [2, 2, 3, 2, 2])
        A['Charge'] = (quieto, [[self.poner(quieto, respirar(R[d]), 0, -1 if fl else 0) for _ in range(2)] for d in DIRS], [4, 4])
        A['Hurt'] = (mv, [[self.poner(mv, R[d], *vec(d, -2)), self.poner(mv, R[d], *vec(d, -1))] for d in DIRS], [2, 8])
        if fl:
            A['Faint'] = (mv, [[self.poner(mv, R[d]), self.poner(mv, R[d], 0, VUELO // 2), self.poner(mv, R[d], 0, VUELO), self.tumbado(mv, d)]
                               for d in DIRS], [8, 6, 6, 10])
        else:
            A['Faint'] = (mv, [[self.poner(mv, R[d]), self.poner(mv, respirar(R[d]), 0, 1), self.tumbado(mv, d), self.tumbado(mv, d)] for d in DIRS],
                          [8, 12, 4, 10])
        return A

    def escribir(self):
        dex = self.cfg['dex']
        dst = os.path.join(RAIZ, 'assets', 'pokemon', str(dex))
        os.makedirs(os.path.join(dst, 's'), exist_ok=True)
        meta = {'s': self.cfg['sombra'], 'a': {}, 'sh': 1}
        if self.flota:
            meta['hv'] = 1
        for nombre, (mc, filas, dur) in self.anims().items():
            n = len(dur)
            hoja = Image.new('RGBA', (mc.w * n, mc.h * 8), (0, 0, 0, 0))
            for r, fila in enumerate(filas):
                assert len(fila) == n, (self.clave, nombre, r)
                for i, f in enumerate(fila):
                    hoja.alpha_composite(f, (i * mc.w, r * mc.h))
            hoja.save(os.path.join(dst, nombre + '.png'), optimize=True)
            vario = hoja.copy()
            px = vario.load()
            cache = {}
            for y in range(vario.height):
                for x in range(vario.width):
                    c = px[x, y]
                    if c[3]:
                        k = c[:3]
                        if k not in cache:
                            cache[k] = self.cfg['vario'](k)
                        px[x, y] = cache[k] + (c[3],)
            vario.save(os.path.join(dst, 's', nombre + '.png'), optimize=True)
            meta['a'][nombre] = {'w': mc.w, 'h': mc.h, 'n': n, 'r': 8, 'd': dur, 'ax': mc.ax, 'ay': mc.ay}
        print('%s (%d): %s' % (self.clave, dex, ', '.join('%s %d (%dx%d)' % (k, v['n'], v['w'], v['h']) for k, v in meta['a'].items())))
        return dex, meta


def escribir_meta(metas):
    s = open(MULTIVERSO_JS, encoding='utf-8').read()
    a, b = '  // <meta montar.py>\n', '  // </meta montar.py>\n'
    if a not in s or b not in s:
        sys.exit('No encuentro las marcas de la geometría en js/data/multiverso.js')
    cuerpo = '  const META = {\n' + ''.join('    %d: %s,\n' % (dex, json.dumps(m, separators=(',', ':'))) for dex, m in metas) + '  };\n'
    s = s[:s.index(a) + len(a)] + cuerpo + s[s.index(b):]
    open(MULTIVERSO_JS, 'w', encoding='utf-8', newline='\n').write(s)


def traer(clave, origen):
    """Copia a fuentes/<clave>/ lo bajado de PixelLab: las 8 rotaciones (<dirección>.png) y, si las hay, las
    tiras de andar (anim-custom-<acción>-<dirección>.png: los fotogramas de la animación `v3`, en fila, en
    celdas cuadradas con el personaje en el mismo sitio que en su rotación)."""
    dst = os.path.join(FUENTES, clave)
    os.makedirs(dst, exist_ok=True)
    for d in DIRS:
        p = os.path.join(origen, d + '.png')
        if os.path.exists(p):
            nitida(Image.open(p)).save(os.path.join(dst, 'rot-%s.png' % d), optimize=True)
    for f in sorted(os.listdir(origen)):
        m = re.match(r'anim-custom-.*?-(%s)\.png$' % '|'.join(re.escape(d) for d in sorted(DIRS, key=len, reverse=True)), f)
        if not m:
            continue
        tira = nitida(Image.open(os.path.join(origen, f)))
        tira.save(os.path.join(dst, 'andar-%s.png' % m.group(1)), optimize=True)
        print('  andar-%s: %d fotogramas de %dx%d' % (m.group(1), tira.width // tira.height, tira.height, tira.height))


def main():
    if len(sys.argv) > 1 and sys.argv[1] == 'traer':
        traer(sys.argv[2], sys.argv[3])
        return
    metas = [Montaje(c).escribir() for c in PJ if os.path.isdir(os.path.join(FUENTES, c))]
    escribir_meta(metas)


if __name__ == '__main__':
    main()
