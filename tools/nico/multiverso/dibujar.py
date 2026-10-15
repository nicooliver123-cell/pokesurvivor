"""Pac-Man y Blinky, dibujados por código para el Multiverso (sin PixelLab).

    python tools/nico/multiverso/dibujar.py

Escribe en tools/nico/multiverso/fuentes/pacman/ y fuentes/blinky/ lo mismo que deja `montar.py traer` para un
personaje de PixelLab (rot-<dirección>.png de 32x32 y andar-<dirección>.png en fila) y sus animaciones propias
(<Anim>-<dirección>.png) y su variocolor en s/. Luego `montar.py` monta las hojas del juego.

Se dibuja píxel a píxel, sin suavizado: cada píxel de la celda se pinta si su centro cae dentro de la figura;
el contorno es negro (como en SpriteCollab) y el volumen sale de 4 tonos según hacia dónde mira la superficie
(luz de arriba a la izquierda).

- Pac-Man (variocolor: el traje de metal cromado de Pac-Man World): una bola amarilla que mira hacia donde va, con la boca en cuña y un ojo en el lado de arriba (como en
  sus juegos modernos; el del arcade no tenía). Andar = comer (boca abierta, a medias, cerrada, a medias).
  Quieto, la boca entreabierta. Caer = la muerte del arcade: mira arriba y la boca se abre hasta que sólo queda
  una astilla.
- Blinky: cúpula roja con el faldón de picos, que ondea en 2 fotogramas, y los ojos blancos con las pupilas
  azules hacia donde va. Caer = el fantasma comido: parpadea en blanco y quedan los ojos, que miran hacia arriba
  (vuelven a casa). Variocolor = el fantasma asustado (azul, con la cara de puntos y la boca en zigzag).

Determinista. Requiere Pillow.
"""
import math
import os

from PIL import Image

FUENTES = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fuentes')
DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']
# Ángulo de cada dirección en pantalla (radianes; 0 = derecha, y hacia abajo).
ANG = {d: math.atan2(vy, vx) for d, (vx, vy) in {
    'south': (0, 1), 'south-east': (1, 1), 'east': (1, 0), 'north-east': (1, -1),
    'north': (0, -1), 'north-west': (-1, -1), 'west': (-1, 0), 'south-west': (-1, 1)}.items()}
# Hacia dónde miran las pupilas, en píxeles.
MIRA = {'south': (0, 1), 'south-east': (1, 1), 'east': (1, 0), 'north-east': (1, -1),
        'north': (0, -1), 'north-west': (-1, -1), 'west': (-1, 0), 'south-west': (-1, 1)}
N = 32
NEGRO = (0, 0, 0, 255)
LUZ = (-0.55, -0.65, 0.52)   # de arriba a la izquierda y hacia la cámara


def tono(paleta, nx, ny, nz):
    """El tono de la paleta (claro a oscuro) según la luz sobre la normal (nx, ny, nz)."""
    l = sum(a * b for a, b in zip((nx, ny, nz), LUZ))
    i = 0 if l > 0.72 else 1 if l > 0.38 else 2 if l > 0.05 else 3
    return paleta[i]


def contorno(img):
    """Contorno negro de 1 px por fuera de lo pintado (4 vecinos)."""
    px = img.load()
    fuera = [(x, y) for y in range(N) for x in range(N) if px[x, y][3] == 0 and any(
        0 <= x + dx < N and 0 <= y + dy < N and px[x + dx, y + dy][3] and px[x + dx, y + dy] != NEGRO
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
    for p in fuera:
        px[p] = NEGRO
    return img


# ---------------- Pac-Man ----------------
AMARILLO = [(255, 246, 160, 255), (255, 222, 0, 255), (230, 168, 0, 255), (168, 104, 0, 255)]
# Variocolor: el traje de metal de Pac-Man World (cromado).
PLATA = [(242, 246, 255, 255), (194, 204, 218, 255), (135, 148, 170, 255), (74, 84, 104, 255)]
CX, CY, R = 15.5, 18.0, 10.6


def pacman(ang, boca, ojo=True, paleta=AMARILLO):
    """Pac-Man mirando a `ang` con la boca abierta `boca` grados (la mitad de la cuña) hacia ese lado."""
    img = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    px = img.load()
    for y in range(N):
        for x in range(N):
            dx, dy = x + 0.5 - CX, y + 0.5 - CY
            d = math.hypot(dx, dy)
            if d > R:
                continue
            dif = abs((math.atan2(dy, dx) - ang + math.pi) % (2 * math.pi) - math.pi)
            if boca > 0 and dif < math.radians(boca) and d > 1.2:
                continue
            nz = math.sqrt(max(0.0, 1 - (d / R) ** 2))
            px[x, y] = tono(paleta, dx / R, dy / R, nz)
    if ojo:
        # El ojo, en el lado de arriba de la boca (hacia la parte alta de la pantalla), salvo de espaldas.
        if not (math.sin(ang) < -0.9):
            lado = ang - math.pi / 2 if math.cos(ang) >= 0 else ang + math.pi / 2
            if abs(math.cos(ang)) < 0.1:                       # de frente: arriba del todo
                lado = -math.pi / 2
            ex = CX + math.cos(ang) * 2.6 + math.cos(lado) * 5.2
            ey = CY + math.sin(ang) * 2.6 + math.sin(lado) * 5.2
            for oy in (0, 1):
                for ox in (0, 1):
                    xx, yy = int(ex - 0.5) + ox, int(ey - 1) + oy
                    if 0 <= xx < N and 0 <= yy < N and px[xx, yy][3]:
                        px[xx, yy] = (26, 16, 0, 255)
    return contorno(img)


def pacman_muerte(fase, paleta=AMARILLO):
    """La muerte del arcade: mira arriba y la boca se abre hasta dejar una astilla (fase 0..1)."""
    return pacman(-math.pi / 2, 40 + fase * 140, ojo=False, paleta=paleta)


# ---------------- Blinky ----------------
ROJO = [(255, 128, 128, 255), (236, 32, 40, 255), (176, 14, 30, 255), (110, 6, 22, 255)]
AZUL = [(120, 140, 255, 255), (40, 52, 230, 255), (24, 30, 168, 255), (12, 14, 110, 255)]
BLANCO = (255, 255, 255, 255)
PUPILA = (33, 33, 222, 255)
CARA_ASUSTADA = (255, 184, 174, 255)
GX, GY, GR = 15.5, 13.5, 9.6       # cúpula
FALDA = 27                          # fila de las puntas del faldón


def fantasma_cuerpo(paleta, ola):
    """La cúpula y el faldón con picos (ola 0/1 desplaza los picos 2 px, como en el arcade)."""
    img = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    px = img.load()
    for y in range(N):
        for x in range(N):
            cx, cy = x + 0.5, y + 0.5
            if abs(cx - GX) > GR:
                continue
            if cy < GY:
                if math.hypot(cx - GX, cy - GY) > GR:
                    continue
            else:
                # Picos: diente de sierra de 4 px de ancho bajo la fila FALDA - 2.
                fase = ((cx - (GX - GR)) + ola * 2) % 4
                pico = FALDA - (2 - abs(fase - 2))
                if cy > pico:
                    continue
            dx = (cx - GX) / GR
            dy = (min(cy, GY) - GY) / GR
            nz = math.sqrt(max(0.05, 1 - dx * dx - dy * dy))
            px[x, y] = tono(paleta, dx, dy * 0.7 + (cy - GY) / 40, nz)
    return img


def ojos(img, d, solos=False):
    """Los dos ojos (blanco de 4x5) con las pupilas (2x2) hacia `d`."""
    px = img.load()
    mx, my = MIRA[d]
    # De perfil se juntan hacia el lado al que mira.
    for ex in (GX - 4.5 + mx * 1.5, GX + 1.5 + mx * 1.5):
        x0, y0 = int(ex), int(GY - 1 + my)
        for y in range(y0, y0 + 5):
            for x in range(x0, x0 + 4):
                if (y in (y0, y0 + 4)) and x in (x0, x0 + 3):
                    continue
                px[x, y] = BLANCO
        p0x, p0y = x0 + 1 + mx, y0 + 2 + my
        for y in range(p0y, p0y + 2):
            for x in range(p0x, p0x + 2):
                px[x, y] = PUPILA
    return contorno(img) if solos else img


def fantasma(d, ola, paleta=ROJO):
    return contorno(ojos(fantasma_cuerpo(paleta, ola), d))


def fantasma_asustado(ola, blanco=False):
    """El fantasma asustado: azul (o blanco al acabarse la píldora), con la cara de puntos y la boca en zigzag."""
    pal = [(255, 255, 255, 255), (232, 232, 255, 255), (200, 200, 236, 255), (160, 160, 210, 255)] if blanco else AZUL
    img = fantasma_cuerpo(pal, ola)
    px = img.load()
    cara = (236, 24, 40, 255) if blanco else CARA_ASUSTADA
    for x0 in (int(GX) - 4, int(GX) + 2):
        for y in range(int(GY) - 1, int(GY) + 1):
            for x in range(x0, x0 + 2):
                px[x, y] = cara
    base = int(GY) + 5
    for i, x in enumerate(range(int(GX) - 6, int(GX) + 6)):
        px[x, base - (i // 2) % 2] = cara
    return contorno(img)


def tira(frames):
    t = Image.new('RGBA', (N * len(frames), N), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        t.alpha_composite(f, (i * N, 0))
    return t


def guardar(carpeta, nombre, img):
    os.makedirs(carpeta, exist_ok=True)
    img.save(os.path.join(carpeta, nombre + '.png'), optimize=True)


def main():
    for sub, pal in (('', AMARILLO), ('s', PLATA)):
        pac = os.path.join(FUENTES, 'pacman', sub)
        for d in DIRS:
            a = ANG[d]
            guardar(pac, 'rot-' + d, pacman(a, 24, paleta=pal))
            guardar(pac, 'andar-' + d, tira([pacman(a, k, paleta=pal) for k in (42, 24, 3, 24)]))
            guardar(pac, 'Idle-' + d, tira([pacman(a, 24, paleta=pal), pacman(a, 12, paleta=pal)]))
            guardar(pac, 'Faint-' + d, tira([pacman_muerte(f, pal) for f in (0, 0.4, 0.75, 1.0)]))
    bl = os.path.join(FUENTES, 'blinky')
    for d in DIRS:
        guardar(bl, 'rot-' + d, fantasma(d, 0))
        guardar(bl, 'andar-' + d, tira([fantasma(d, 0), fantasma(d, 1)]))
        comido = contorno(ojos(Image.new('RGBA', (N, N), (0, 0, 0, 0)), 'north'))
        guardar(bl, 'Faint-' + d, tira([fantasma(d, 0), fantasma_asustado(1, blanco=True), comido, comido]))
        # Variocolor: el fantasma asustado (la misma geometría; caer, igual: quedan los ojos).
        s = os.path.join(bl, 's')
        guardar(s, 'rot-' + d, fantasma_asustado(0))
        guardar(s, 'andar-' + d, tira([fantasma_asustado(0), fantasma_asustado(1)]))
        guardar(s, 'Faint-' + d, tira([fantasma_asustado(0), fantasma_asustado(1, blanco=True), comido, comido]))
    print('Pac-Man y Blinky dibujados en', FUENTES)


if __name__ == '__main__':
    main()
