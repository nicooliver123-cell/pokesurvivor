"""tools/nico/relieve/laminas.py — láminas antes/después del prototipo de relieve y luz (PLAN.md, punto 10).

    python tools/nico/relieve/laminas.py

Lee las capturas que saca `node relieve/capturas.js` (en tools/nico/out/relieve/) y monta tres láminas rotuladas,
antes a la izquierda y después a la derecha: lamina-1-cresta.png, lamina-2-luz.png y lamina-3-movil-clasico.png.
Necesita Pillow.
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'out', 'relieve')


def letra(n):
    for f in ('C:/Windows/Fonts/segoeuib.ttf', 'C:/Windows/Fonts/arialbd.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'):
        try:
            return ImageFont.truetype(f, n)
        except OSError:
            pass
    return ImageFont.load_default()


TITULO, ROTULO = letra(28), letra(20)


def lamina(titulo, pares, salida):
    """pares: (antes, después, escala, rótulo) por fila; las capturas, en OUT."""
    filas = []
    for a, b, k, sub in pares:
        A = Image.open(os.path.join(OUT, a)).convert('RGB')
        B = Image.open(os.path.join(OUT, b)).convert('RGB')
        modo = Image.NEAREST if k >= 1 else Image.LANCZOS
        A = A.resize((int(A.width * k), int(A.height * k)), modo)
        B = B.resize(A.size, modo)
        filas.append((A, B, sub))
    W = max(A.width * 2 + 24 for A, _, _ in filas) + 32
    H = 70 + sum(A.height + 46 for A, _, _ in filas) + 16
    im = Image.new('RGB', (W, H), (17, 19, 24))
    d = ImageDraw.Draw(im)
    d.text((16, 18), titulo, font=TITULO, fill=(240, 240, 240))
    y = 70
    for A, B, sub in filas:
        d.text((16, y), sub + '  ·  antes', font=ROTULO, fill=(180, 186, 196))
        d.text((16 + A.width + 24, y), 'después', font=ROTULO, fill=(255, 210, 63))
        im.paste(A, (16, y + 28))
        im.paste(B, (16 + A.width + 24, y + 28))
        y += A.height + 46
    im.save(os.path.join(OUT, salida), optimize=True)
    print(salida, im.size)


lamina('Relieve: la cresta con altura (Vega del Alba, Dex)', [
    ('cresta-dex-1440x900-antes.png', 'cresta-dex-1440x900-despues.png', 0.5, '1440x900'),
    ('cresta-dex-1440x900-antes-recorte.png', 'cresta-dex-1440x900-despues-recorte.png', 1.5, 'de cerca (×1,5)')], 'lamina-1-cresta.png')
lamina('Búfer de luz: ácido, ataques eléctricos y tótem (Vega Sulfúrea, Dex)', [
    ('acido-dex-1440x900-antes.png', 'acido-dex-1440x900-despues.png', 0.5, '1440x900'),
    ('acido-dex-1440x900-antes-recorte.png', 'acido-dex-1440x900-despues-recorte.png', 1.5, 'de cerca (×1,5)')], 'lamina-2-luz.png')
lamina('Móvil (844x390) en Dex y PC en Clásico', [
    ('cresta-dex-844x390@3-antes.png', 'cresta-dex-844x390@3-despues.png', 0.42, 'móvil, cresta'),
    ('acido-dex-844x390@3-antes.png', 'acido-dex-844x390@3-despues.png', 0.42, 'móvil, ácido y tótem'),
    ('cresta-clasico-1440x900-antes.png', 'cresta-clasico-1440x900-despues.png', 0.5, 'PC, Clásico')], 'lamina-3-movil-clasico.png')
