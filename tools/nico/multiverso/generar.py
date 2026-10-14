"""Genera con PixelLab los sprites de un personaje del Multiverso (gasta generaciones de la cuenta).

    python tools/nico/multiverso/generar.py crear  <clave> <carpeta>          # 8 rotaciones a 32 px (2 generaciones)
    python tools/nico/multiverso/generar.py andar  <clave> <carpeta> [dirs]   # pasos en 5 direcciones (1 por dirección)
    python tools/nico/multiverso/generar.py bajar  <carpeta>                  # vuelve a bajarlo todo (gratis)

Usa el cliente de herramientas/pixellab (su `pixellab.py` y su token, que no están en este
repositorio; ruta en PIXELLAB_DIR o la de siempre). La cuenta gratuita sólo admite un trabajo
a la vez: este guion espera su turno y lanza una dirección cada vez. La carpeta es de trabajo,
fuera del repositorio: después, `montar.py traer <clave> <carpeta>` copia lo bueno a fuentes/.

- crear: `create-character-v3` desde cero (`DESC[clave]`), mirando al sur, a 32x32 y vista
  «low top-down», con contorno negro; guarda crear.json (el id del personaje) y las 8 rotaciones.
- andar: animación `v3` («walking forward…», 4 fotogramas, sin repetir el de la rotación) en
  sur, sureste, este, noreste y norte; parte de la rotación y conserva su tamaño. Las plantillas
  por esqueleto (`walking-4-frames`) lo redibujan más pequeño y girado: no sirven.
- bajar: el personaje y los fotogramas de sus animaciones, en tiras anim-custom-<acción>-<dir>.png.
"""
import importlib.util
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request

PIXELLAB_DIR = os.environ.get('PIXELLAB_DIR', r'C:\Users\Nico\Desktop\Claude\herramientas\pixellab')
_spec = importlib.util.spec_from_file_location('pixellab', os.path.join(PIXELLAB_DIR, 'pixellab.py'))
pl = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(pl)

DESC = {
    'agumon': ("Agumon from Digimon: small short stout baby tyrannosaurus dinosaur standing upright, bright yellow-orange skin "
               "of one uniform color with no stripes and no lighter belly, big round head, wide snout with small sharp white teeth, "
               "large round light green eyes, three big white claws on each hand and on each foot, short thick stubby tail, "
               "chibi proportions, cute Pokemon Mystery Dungeon style sprite", 'Agumon'),
    'slayer': ("Doom Slayer from DOOM: armored space marine in bulky olive green power armor with dark grey joints, "
               "green helmet with an orange-gold visor, holding a big double-barreled super shotgun in both hands, "
               "standing upright, chibi proportions with a slightly big head, cute Pokemon Mystery Dungeon style game sprite", 'Doom Slayer'),
    'caco': ("Cacodemon from DOOM: a floating round red demon ball with no arms and no legs, one big green eye in the middle "
             "of its face, a huge wide mouth full of sharp white teeth, small dark red horns on top, blue mouth interior, "
             "hovering in the air, chibi cute Pokemon Mystery Dungeon style game sprite", 'Cacodemon'),
}
ANDAR = {
    'agumon': 'walking forward, a small step with each foot, body bobbing slightly, same size and same view',
    'slayer': 'walking forward holding the shotgun, a small step with each foot, body bobbing slightly, same size and same view',
}
CINCO = ['south', 'south-east', 'east', 'north-east', 'north']


def token():
    return pl.get_token(None)


def post(path, body):
    req = urllib.request.Request(pl.BASE + path, data=json.dumps(body).encode(), method='POST',
                                 headers={'Authorization': 'Bearer ' + token(), 'Content-Type': 'application/json', 'User-Agent': pl.UA})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def turno(path, body):
    """POST que espera su turno (plan gratuito: un trabajo a la vez)."""
    while True:
        code, r = post(path, body)
        if code == 429 or (isinstance(r, str) and 'concurrent' in r):
            time.sleep(15)
            continue
        if code >= 300:
            sys.exit('PixelLab %s: %s' % (code, str(r)[:500]))
        return r


def crear(clave, carpeta):
    desc, nombre = DESC[clave]
    os.makedirs(carpeta, exist_ok=True)
    r = turno('/create-character-v3', {'description': desc, 'image_size': {'width': 32, 'height': 32}, 'view': 'low top-down',
                                        'template_id': 'mannequin', 'no_background': True, 'outline': 'single color black outline',
                                        'detail': 'medium detail', 'seed': 11, 'name': nombre})
    json.dump(r, open(os.path.join(carpeta, 'crear.json'), 'w'), indent=1)
    pl.poll_character(token(), r['character_id'], carpeta, 900)


def andar(clave, carpeta, dirs):
    cid = json.load(open(os.path.join(carpeta, 'crear.json')))['character_id']
    gid = None
    for d in dirs:
        body = {'character_id': cid, 'mode': 'v3', 'action_description': ANDAR[clave], 'frame_count': 4,
                'keep_first_frame': False, 'directions': [d], 'animation_name': 'v3-andar'}
        if gid:
            body['animation_group_id'] = gid
        r = turno('/characters/animations', body)
        gid = r.get('animation_group_id') or gid
        jid, t0 = r['background_job_ids'][0], time.time()
        while True:
            st = pl.call('GET', '/background-jobs/%s' % jid, token()).get('status')
            if st in ('completed', 'failed', 'cancelled', 'error'):
                print('%s: %s (%.0f s)' % (d, st, time.time() - t0), flush=True)
                break
            time.sleep(6)
    bajar(carpeta)


def bajar(carpeta):
    from PIL import Image
    cid = json.load(open(os.path.join(carpeta, 'crear.json')))['character_id']
    c = pl.poll_character(token(), cid, carpeta, 900)
    for an in c.get('animations') or []:
        for d in an['directions']:
            ims = []
            for url in d['frames']:
                with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': pl.UA}), timeout=120) as r:
                    ims.append(Image.open(io.BytesIO(r.read())).convert('RGBA'))
            w, h = ims[0].size
            tira = Image.new('RGBA', (w * len(ims), h), (0, 0, 0, 0))
            for i, im in enumerate(ims):
                tira.alpha_composite(im, (i * w, 0))
            accion = (an.get('animation_type') or 'anim').replace('/', '-')
            tira.save(os.path.join(carpeta, 'anim-%s-%s.png' % (accion, d['direction'])))
            print('  %s %s: %d fotogramas de %dx%d' % (accion, d['direction'], len(ims), w, h))


if __name__ == '__main__':
    orden = sys.argv[1] if len(sys.argv) > 1 else ''
    if orden == 'crear':
        crear(sys.argv[2], sys.argv[3])
    elif orden == 'andar':
        andar(sys.argv[2], sys.argv[3], sys.argv[4].split(',') if len(sys.argv) > 4 else CINCO)
    elif orden == 'bajar':
        bajar(sys.argv[2])
    else:
        sys.exit(__doc__)
