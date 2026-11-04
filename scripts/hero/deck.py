"""The deck of futures: one small world on a plate, and its futures behind it.

The world, in front: a continuous white architectural model on one plate. A
coast with a port, a crane and container stacks; a cluster of office and bank
towers; a solar field with storage; a factory; a data center; a road along the
front and a rail line along the back, joining them.

The futures, behind it: eight thin slices of frosted acrylic rising in a fan,
receding in depth like a deck of cards held open. Each carries an etched
silhouette of the same world in a slightly different state. One glows from
within in warm orange: the same world, with one changed connection.

Renders, through one camera per framing (wide, narrow):
  world-<view>.webp    the plate alone, with its contact shadow
  slice<k>-<view>.webp each slice alone (k = 0..7), and lit-<view>.webp
  rest-<view>.webp     everything together: the still
and deck.json: the flow paths on the world and the found connection,
projected through the same camera, with a visibility flag per point.

Run: python deck.py -- OUTDIR   (env: SAMPLES, PCT, ONLY=rest|layers|all)
Plate coordinates: x left to right, y into the scene, z up; plate top z = 0.
"""
import bpy, bmesh, json, math, os, sys
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
from PIL import Image, ImageDraw, ImageFilter

OUT = sys.argv[sys.argv.index('--') + 1]
os.makedirs(OUT, exist_ok=True)
SAMPLES = int(os.environ.get('SAMPLES', '128'))
PCT = int(os.environ.get('PCT', '100'))
ONLY = os.environ.get('ONLY', 'all')
VIEWS_ON = os.environ.get('VIEWS', 'wide,narrow').split(',')

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.03
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 3
scene.cycles.glossy_bounces = 2
scene.cycles.transmission_bounces = 2
scene.cycles.transparent_max_bounces = 16
scene.render.film_transparent = True
scene.view_settings.view_transform = 'Standard'
scene.view_settings.exposure = float(os.environ.get('EXPO', '0.05'))

def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

def mat(name, hexc, rough=0.6):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(hexc), 1)
    b.inputs['Roughness'].default_value = rough
    return m

CARD = mat('card', '#fbf9f4', 0.6)        # warm white card
CARD2 = mat('card2', '#f2eee6', 0.65)     # the plate, a shade warmer
CARD3 = mat('card3', '#e9e4da', 0.7)      # roads and quays
PANEL = mat('panel', '#c3c0ba', 0.25)     # solar glass
WATER = mat('water', '#eef0ee', 0.32)     # still water, the same white family
STEEL = mat('steel', '#d8d4cc', 0.4)

world_objs = []
def track(o):
    world_objs.append(o)
    return o

def box(x0, y0, z0, w, d, h, m=CARD, bevel=0.02):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x0 + w / 2, y0 + d / 2, z0 + h / 2))
    o = bpy.context.active_object
    o.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        bv = o.modifiers.new('bv', 'BEVEL')
        bv.width = bevel
        bv.segments = 2
    o.data.materials.append(m)
    return track(o)

def cyl(x, y, z0, r, h, m=CARD, v=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h, location=(x, y, z0 + h / 2))
    o = bpy.context.active_object
    o.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    return track(o)

def tooth(x0, y0, z0, w, d, h):
    me = bpy.data.meshes.new('tooth')
    v = [(x0, y0, z0), (x0 + w, y0, z0), (x0 + w, y0, z0 + h), (x0, y0 + d, z0), (x0 + w, y0 + d, z0), (x0 + w, y0 + d, z0 + h)]
    me.from_pydata(v, [], [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (0, 2, 5, 3)])
    o = bpy.data.objects.new('tooth', me)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(CARD)
    return track(o)

# --- the plate, with the sea cut out of its right end -----------------------------------
PX0, PX1, PY0, PY1, PT = -10.0, 10.0, -4.5, 4.5, 0.5
COAST = 5.6
plate = box(PX0, PY0, -PT, COAST - PX0, PY1 - PY0, PT, CARD2, bevel=0.1)
plate.modifiers['bv'].segments = 4
sea_bed = box(COAST, PY0, -PT, PX1 - COAST, PY1 - PY0, PT - 0.22, CARD2, bevel=0.06)
water = box(COAST + 0.02, PY0 + 0.02, -0.215, PX1 - COAST - 0.04, PY1 - PY0 - 0.04, 0.03, WATER, bevel=0)
box(COAST - 0.15, PY0, -0.2, 0.3, PY1 - PY0, 0.2, CARD3, bevel=0.01)      # the quay wall

# Road along the front, rail along the back, and the spurs that join them.
ROAD_Y, RAIL_Y = -3.95, 3.95
box(-9.4, ROAD_Y - 0.28, 0, COAST - 0.2 + 9.4, 0.56, 0.035, CARD3, bevel=0.01)
for (x, y0, y1) in ((-2.6, ROAD_Y, -1.1), (2.0, ROAD_Y, -3.2)):
    box(x - 0.2, y0, 0, 0.4, y1 - y0, 0.03, CARD3, bevel=0.01)
for dy in (-0.11, 0.11):
    box(-9.4, RAIL_Y + dy - 0.025, 0, COAST - 0.2 + 9.4, 0.05, 0.06, STEEL, bevel=0)
for i in range(70):
    box(-9.3 + i * 0.21, RAIL_Y - 0.2, 0, 0.07, 0.4, 0.025, CARD3, bevel=0)

# Solar field with storage, front left.
for r in range(4):
    yc = -2.7 + r * 0.95
    p = box(-9.1, yc - 0.32, 0, 3.6, 0.64, 0.05, PANEL, bevel=0.008)
    p.rotation_euler = (math.radians(28), 0, 0)
    p.location.z = 0.42
    for x in (-8.9, -7.3, -5.7):
        box(x, yc, 0, 0.05, 0.05, 0.36, STEEL, bevel=0)
for k in range(3):
    box(-5.0, -2.9 + k * 0.85, 0, 0.9, 0.62, 0.55)

# Towers: offices and a bank, center left, with floor lines.
def tower(x, y, w, d, h, crown=0.12):
    box(x, y, 0, w, d, h)
    for z in [0.32 * k for k in range(1, int(h / 0.32))]:
        box(x - 0.005, y - 0.005, z, w + 0.01, 0.012, 0.02, CARD3, bevel=0)
        box(x + w - 0.007, y - 0.005, z, 0.012, d + 0.01, 0.02, CARD3, bevel=0)
    box(x + 0.08, y + 0.08, h, w - 0.16, d - 0.16, crown)
tower(-4.2, -0.6, 1.1, 1.1, 3.3)
tower(-2.9, 0.6, 1.2, 1.2, 4.6)
tower(-1.6, -0.5, 1.0, 1.0, 2.5)
tower(-4.0, 1.4, 1.0, 1.0, 2.0)
box(-2.75, -1.15, 0, 1.6, 0.9, 0.9)        # the bank, low and broad, on its plinth
box(-2.85, -1.25, 0.9, 1.8, 1.1, 0.12)

# Factory: a hall with a north-light roof and a stack, back center.
box(0.0, 0.7, 0, 3.4, 2.6, 1.0)
for i in range(4):
    tooth(0.0 + i * 0.85, 0.7, 1.0, 0.85, 2.6, 0.45)
cyl(0.45, 2.85, 0, 0.18, 2.7)

# Data center: long and low, with cooling units on the roof, front center.
box(0.4, -3.2, 0, 3.6, 1.9, 0.85)
for i in range(6):
    for j in range(2):
        cyl(0.85 + i * 0.55, -2.7 + j * 0.85, 0.85, 0.16, 0.12, STEEL, v=20)

# Port: container stacks on the quay, a gantry crane, and a ship alongside.
for (x, y, n) in ((3.9, -0.9, 3), (3.9, 0.1, 2), (3.9, 1.1, 3), (4.75, -0.4, 2), (4.75, 0.6, 3)):
    for j in range(n):
        box(x, y, j * 0.3, 0.75, 0.8, 0.28, CARD if j % 2 else CARD3, bevel=0.008)
for (x, y) in ((5.0, -1.6), (5.0, 2.2), (6.3, -1.6), (6.3, 2.2)):
    box(x, y, 0 if x < COAST else -0.22, 0.1, 0.1, 2.5 if x < COAST else 2.72, CARD, bevel=0.005)
box(4.8, -1.75, 2.5, 3.2, 0.3, 0.16)
box(4.8, 2.05, 2.5, 3.2, 0.3, 0.16)
box(5.5, -1.75, 2.66, 0.7, 4.1, 0.25)
box(6.9, -1.4, -0.22, 2.4, 4.8, 0.55)                    # the hull
for k in range(4):
    box(7.05, -1.1 + k * 1.1, 0.33, 2.1, 0.95, 0.3 + (k % 2) * 0.28, CARD if k % 2 else CARD3, bevel=0.008)
box(7.1, 2.75, 0.33, 2.0, 0.5, 0.9)

world_set = list(world_objs)

# --- the found connection: storage to the data center, drawn only in light ---------------------
FOUND = [(-4.1, -2.6), (-0.2, -2.6), (0.4, -2.4)]

# --- the futures: eight frosted slices ---------------------------------------------------------
TEX_W, TEX_H = 2048, 820
SL_W, SL_H = 11.0, 5.2
def silhouette(path, variant, lit=False):
    """The world's profile, etched: thin lines, front elevation, in one state."""
    im = Image.new('RGBA', (TEX_W, TEX_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    LA = 255 if lit else 150
    X = lambda x: int((x * 0.68 - (-SL_W / 2)) / SL_W * TEX_W)
    Z = lambda z: int(TEX_H - (z + 0.5) / SL_H * TEX_H)
    ink = (255, 255, 255, LA)
    soft = (255, 255, 255, LA // 2)
    w = 7
    ground = Z(0)
    # The slice's own edge, etched: it reads as a card, not a haze.
    d.rectangle([2, 2, TEX_W - 3, TEX_H - 3], outline=(255, 255, 255, 235), width=5)
    d.line([(X(-5.2), ground), (X(5.2), ground)], fill=soft, width=2)
    def rect(x0, x1, h, fill=None, col=ink):
        if fill:
            d.rectangle([X(x0), Z(h), X(x1), ground], fill=fill)
        d.rectangle([X(x0), Z(h), X(x1), ground], outline=col, width=w)
    # solar rows and storage
    for k in range(3 if variant == 7 else 4):
        d.line([(X(-7.0 + k * 0.9), Z(0.25)), (X(-6.2 + k * 0.9), Z(0.62))], fill=ink, width=w)
    rect(-3.6, -3.0, 0.55)
    # towers
    for (x, wd, h, dim) in ((-2.6, 0.8, 3.0, False), (-1.6, 0.9, 4.1, variant == 3), (-0.6, 0.75, 2.3, False), (0.2, 0.7, 1.8, False)):
        rect(x, x + wd, h, col=(255, 255, 255, 70) if dim else ink)
    # factory, brighter in one future
    fx0, fx1 = 1.0, 3.6
    rect(fx0, fx1, 1.0, fill=(255, 236, 200, 150) if variant == 2 else None)
    for i in range(4):
        x = fx0 + i * 0.65
        d.line([(X(x), Z(1.0)), (X(x + 0.65), Z(1.4)), (X(x + 0.65), Z(1.0))], fill=ink, width=w)
    rect(1.2, 1.4, 2.4)
    # data center
    rect(3.9, 5.2, 0.7)
    # port: crane and containers, quieter in one future
    if variant != 4:
        d.line([(X(5.6), ground), (X(5.6), Z(2.2)), (X(6.9), Z(2.2)), (X(6.9), ground)], fill=ink, width=w)
    n = 1 if variant == 1 else (4 if variant == 6 else 3)
    for j in range(n):
        rect(5.8, 6.6, 0.28 * (j + 1))
    if variant != 1:
        rect(6.8, 7.2, 0.5)
    if lit:
        # The one changed connection, in light: storage to the data center.
        d.line([(X(-3.3), Z(0.32)), (X(4.4), Z(0.32))], fill=(255, 196, 110, 255), width=9)
    im = im.filter(ImageFilter.GaussianBlur(0.6))
    im.save(path)

def slice_material(name, tex, lit=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nodes, links = nt.nodes, nt.links
    bsdf = nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*lin('#f6b45c' if lit else '#ffffff'), 1)
    bsdf.inputs['Roughness'].default_value = 0.35
    img = nodes.new('ShaderNodeTexImage')
    img.image = bpy.data.images.load(tex)
    uv = nodes.new('ShaderNodeTexCoord')
    links.new(uv.outputs['UV'], img.inputs['Vector'])
    # Frosted: a faint body, the etched lines more opaque; brighter toward the bottom.
    sep = nodes.new('ShaderNodeSeparateXYZ')
    links.new(uv.outputs['UV'], sep.inputs['Vector'])
    ramp = nodes.new('ShaderNodeMapRange')
    links.new(sep.outputs['Y'], ramp.inputs['Value'])
    ramp.inputs['To Min'].default_value = 1.0
    ramp.inputs['To Max'].default_value = 0.35
    body = nodes.new('ShaderNodeMath')
    body.operation = 'MULTIPLY'
    links.new(ramp.outputs['Result'], body.inputs[0])
    body.inputs[1].default_value = 0.42 if lit else 0.1
    alpha = nodes.new('ShaderNodeMath')
    alpha.operation = 'MAXIMUM'
    links.new(body.outputs['Value'], alpha.inputs[0])
    links.new(img.outputs['Alpha'], alpha.inputs[1])
    links.new(alpha.outputs['Value'], bsdf.inputs['Alpha'])
    em = nodes.new('ShaderNodeMath')
    em.operation = 'MULTIPLY'
    links.new(ramp.outputs['Result'], em.inputs[0])
    em.inputs[1].default_value = 1.15 if lit else 0.12
    links.new(em.outputs['Value'], bsdf.inputs['Emission Strength'])
    bsdf.inputs['Emission Color'].default_value = (*lin('#ef8a10' if lit else '#fffaf0'), 1)
    return m

N = 8
LIT = 2
slices = []
for k in range(N):
    tex = os.path.join(OUT, f'tex{k}.png')
    silhouette(tex, k if k != LIT else 0, lit=(k == LIT))
    bpy.ops.mesh.primitive_plane_add(size=1)
    o = bpy.context.active_object
    o.scale = (SL_W, SL_H, 1)
    bpy.ops.object.transform_apply(scale=True)
    # Stand it up: the plane's UV y runs bottom to top.
    o.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    o.location = (0, 0, SL_H / 2)
    bpy.ops.object.transform_apply(location=True)
    # Then fan it from a pivot at its foot, receding in depth.
    a = math.radians((k - (N - 1) / 2) * 7.6)
    o.rotation_euler = (0, a, 0)
    o.location = (0.6, PY1 + 1.0 + k * 0.55, -PT)
    o.data.materials.append(slice_material(f'slice{k}', tex, lit=(k == LIT)))
    o.visible_shadow = False
    slices.append(o)

# --- light: one area light from the upper left, a soft sky, the paper ground -------------------
world = bpy.data.worlds.new('world')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (0.98, 0.96, 0.93, 1)
bg.inputs['Strength'].default_value = float(os.environ.get('SKY', '0.55'))
bpy.ops.object.light_add(type='AREA', location=(-16, -14, 18))
key = bpy.context.active_object
key.data.energy = float(os.environ.get('KEY', '2600'))
key.data.size = 12
key.rotation_euler = (Vector((0, 0, 0)) - key.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -PT - 0.001))
ground = bpy.context.active_object
ground.is_shadow_catcher = True
ground.visible_glossy = False
ground.visible_transmission = False

# --- cameras --------------------------------------------------------------------------------------
def camera(az, el, target, scale):
    cd = bpy.data.cameras.new('cam')
    cd.type = 'ORTHO'
    cd.ortho_scale = scale
    cd.clip_end = 400
    cam = bpy.data.objects.new('cam', cd)
    bpy.context.collection.objects.link(cam)
    t = Vector(target)
    dvec = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    cam.location = t + dvec * 80
    cam.rotation_euler = (-dvec).to_track_quat('-Z', 'Y').to_euler()
    return cam

VIEWS = {
    'wide': (camera(math.radians(10), math.radians(28), (0.0, 2.4, 2.0), 23.5), 2400, 1060),
    'narrow': (camera(math.radians(10), math.radians(28), (-0.6, 2.4, 2.2), 15.0), 1200, 1000),
}

def poly(points, z=0.06, step=0.1):
    out = []
    for (a, b) in zip(points, points[1:]):
        A, B = Vector((a[0], a[1], z)), Vector((b[0], b[1], z))
        n = max(1, int((B - A).length / step))
        out += [A.lerp(B, i / n) for i in range(n)]
    out.append(Vector((points[-1][0], points[-1][1], z)))
    return out

PATHS = {
    'rail': [poly([(-9.3, RAIL_Y), (COAST - 0.3, RAIL_Y)], 0.09)],
    'road': [poly([(-4.4, ROAD_Y), (COAST - 0.3, ROAD_Y)], 0.05), poly([(-2.6, -1.15), (-2.6, ROAD_Y)], 0.05), poly([(2.0, -3.2), (2.0, ROAD_Y)], 0.05)],
    'link': [poly([(-1.6, 1.2), (0.0, 1.6)], 0.4), poly([(-7.0, 1.2), (-7.0, RAIL_Y)], 0.05)],
    'found': [poly(FOUND, 0.05)],
}

def project(cam, w, h):
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = w, h
    dg = bpy.context.evaluated_depsgraph_get()
    fwd = cam.matrix_world.to_quaternion() @ Vector((0, 0, -1))
    def seen(v):
        hit, loc, _n, _i, obj, _m = scene.ray_cast(dg, v - fwd * 150, fwd)
        return 1 if (not hit or obj in slices or obj == ground or (loc - v).length < 0.12) else 0
    def pr(v):
        c = world_to_camera_view(scene, cam, v)
        return [round(c.x, 5), round(1 - c.y, 5), seen(v)]
    return {'w': w, 'h': h, 'paths': {k: [[pr(p) for p in line] for line in lines] for k, lines in PATHS.items()}}

def render(path):
    scene.render.resolution_percentage = PCT
    scene.render.image_settings.file_format = 'WEBP'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.quality = 90
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)

def show(objs_on):
    for o in world_set + slices:
        o.hide_render = o not in objs_on
    ground.hide_render = False

data = {}
for name, (cam, w, h) in VIEWS.items():
    if name not in VIEWS_ON:
        continue
    data[name] = project(cam, w, h)
    if ONLY in ('rest', 'all'):
        show(world_set + slices)
        render(os.path.join(OUT, f'rest-{name}.webp'))
    if ONLY in ('layers', 'all'):
        show(world_set)
        render(os.path.join(OUT, f'world-{name}.webp'))
        for k, o in enumerate(slices):
            show([o])
            ground.hide_render = True
            render(os.path.join(OUT, f'slice{k}-{name}.webp'))
        # The lit slice before it ignites: the same card, plain.
        o = slices[LIT]
        lit_mat = o.data.materials[0]
        plain_tex = os.path.join(OUT, 'tex-plain.png')
        silhouette(plain_tex, 0)
        o.data.materials[0] = slice_material('plain', plain_tex)
        show([o])
        ground.hide_render = True
        render(os.path.join(OUT, f'slice{LIT}p-{name}.webp'))
        o.data.materials[0] = lit_mat
json.dump(data, open(os.path.join(OUT, 'deck.json'), 'w'))
print('done')
