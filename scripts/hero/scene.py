"""The lit model: one white plate, five objects, etched channels.

Rendered in Cycles with soft global illumination and contact shadows, from an
orthographic camera, twice (wide and narrow). Writes the stills as WebP and a
JSON of every flow path projected through the same camera, so the browser can
run light along the channels exactly where they are etched.

Plate coordinates: x along the plate (left to right), y into the scene (the
camera sits on the -y side), z up. The plate's top is z = 0.
"""
import bpy, bmesh, json, math, sys, os
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp'
SAMPLES = int(os.environ.get('SAMPLES', '160'))

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.denoiser = 'OPENIMAGEDENOISE'
scene.render.film_transparent = True
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.view_settings.exposure = float(os.environ.get('EXPO', '-0.25'))

# --- materials ---------------------------------------------------------------------------
def mat(name, rgb, rough=0.6, spec=0.3):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Roughness'].default_value = rough
    if 'Specular IOR Level' in b.inputs:
        b.inputs['Specular IOR Level'].default_value = spec
    return m

srgb = lambda h: tuple(((int(h[i:i + 2], 16) / 255) / 12.92) if (int(h[i:i + 2], 16) / 255) <= 0.04045 else (((int(h[i:i + 2], 16) / 255 + 0.055) / 1.055) ** 2.4) for i in (1, 3, 5))
M_PLATE = mat('plate', srgb('#f2eee6'), 0.62)
M_WHITE = mat('white', srgb('#fbfaf6'), 0.55)
M_WARM = mat('warm', srgb('#f1ece2'), 0.6)
M_PANEL = mat('panel', srgb('#bdbbb6'), 0.2, 0.6)
M_GROOVE = mat('groove', srgb('#d9d2c5'), 0.8)

def box(x0, y0, z0, w, d, h, m=M_WHITE, bevel=0.025, name='box'):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x0 + w / 2, y0 + d / 2, z0 + h / 2))
    o = bpy.context.active_object
    o.name = name
    o.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        bv = o.modifiers.new('bevel', 'BEVEL')
        bv.width = bevel
        bv.segments = 2
    o.data.materials.append(m)
    return o

def prism(x0, y0, z0, w, d, h, m=M_WHITE):
    """A north-light roof tooth: vertical face at x0 + w, slope down toward x0."""
    me = bpy.data.meshes.new('tooth')
    v = [(x0, y0, z0), (x0 + w, y0, z0), (x0 + w, y0, z0 + h), (x0, y0 + d, z0), (x0 + w, y0 + d, z0), (x0 + w, y0 + d, z0 + h)]
    f = [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (0, 2, 5, 3)]
    me.from_pydata(v, [], f)
    o = bpy.data.objects.new('tooth', me)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(m)
    return o

def cyl(x, y, z0, r, h, m=M_WHITE):
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=r, depth=h, location=(x, y, z0 + h / 2))
    o = bpy.context.active_object
    o.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    return o

# --- the plate, with its channels etched --------------------------------------------------------
PX0, PX1, PY0, PY1, PT = -14.5, 14.5, -4.4, 4.4, 0.55
plate = box(PX0, PY0, -PT, PX1 - PX0, PY1 - PY0, PT, M_PLATE, bevel=0.14, name='plate')
plate.modifiers['bevel'].segments = 5

FRONT, BACK = -3.05, 3.15     # goods run along the front, money along the back
XS = {'bank': -11.0, 'solar': -5.5, 'factory': 0.0, 'port': 5.5, 'city': 11.0}
EDGE_F = {'solar': -1.55, 'factory': -1.6, 'port': -1.3, 'city': -1.6}    # objects' front edges
EDGE_B = {'bank': 1.75, 'factory': 1.6, 'port': 1.3, 'city': 1.6, 'solar': 1.75}
W_G = 0.17
grooves = []
def groove(a, b):
    (x0, y0), (x1, y1) = a, b
    if abs(x1 - x0) > abs(y1 - y0):
        grooves.append((min(x0, x1) - W_G / 2, y0 - W_G / 2, abs(x1 - x0) + W_G, W_G))
    else:
        grooves.append((x0 - W_G / 2, min(y0, y1) - W_G / 2, W_G, abs(y1 - y0) + W_G))
# goods and power: solar → factory → port → city, along the front
groove((XS['solar'], FRONT), (XS['city'], FRONT))
for k in ('solar', 'factory', 'port', 'city'):
    groove((XS[k], EDGE_F[k]), (XS[k], FRONT))
# money: the bank → factory, port and city, along the back (not yet to the solar field)
groove((XS['bank'], BACK), (XS['city'], BACK))
for k in ('bank', 'factory', 'port', 'city'):
    groove((XS[k], EDGE_B[k]), (XS[k], BACK))
for (gx, gy, gw, gd) in grooves:
    cutter = box(gx, gy, -0.045, gw, gd, 0.2, M_GROOVE, bevel=0, name='cut')
    mod = plate.modifiers.new('cut', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = cutter
    mod.solver = 'EXACT'
    bpy.context.view_layer.objects.active = plate
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
plate.data.materials.append(M_GROOVE)
# Groove floors take the groove tone.
bm = bmesh.new()
bm.from_mesh(plate.data)
for f in bm.faces:
    c = f.calc_center_median()
    if -0.06 < c.z < -0.03 and f.normal.z > 0.9:
        f.material_index = 1
bm.to_mesh(plate.data)
bm.free()

# --- the five objects --------------------------------------------------------------------------
# Bank: a raised plinth of two steps, a block, a thin roof slab and vertical fins.
bx = XS['bank']
box(bx - 2.1, -1.75, 0, 4.2, 3.5, 0.2, M_WARM)
box(bx - 1.85, -1.5, 0.2, 3.7, 3.0, 0.2, M_WARM)
box(bx - 1.5, -1.15, 0.4, 3.0, 2.3, 2.1)
box(bx - 1.62, -1.27, 2.5, 3.24, 2.54, 0.12)
# Two horizontal window bands and an entrance: a modern civic front, no columns.
for z in (1.05, 1.75):
    box(bx - 1.3, -1.2, z, 2.6, 0.06, 0.38, M_PANEL, bevel=0.005)
box(bx - 0.45, -1.2, 0.4, 0.9, 0.06, 0.5, M_PANEL, bevel=0.005)
box(bx - 0.5, -0.4, 2.62, 1.0, 1.0, 0.3, M_WARM)

# Solar field with storage.
sx = XS['solar']
for r in range(4):
    yc = -1.25 + r * 1.03
    p = box(sx - 2.1, yc - 0.35, 0.0, 3.3, 0.7, 0.06, M_PANEL, bevel=0.01)
    p.rotation_euler = (math.radians(30), 0, 0)
    p.location.z = 0.5
    for x in (sx - 1.9, sx - 0.45, sx + 1.0):
        box(x, yc + 0.05, 0, 0.05, 0.05, 0.42, M_WHITE, bevel=0)
for k in range(2):
    box(sx + 1.55, -1.2 + k * 1.2, 0, 0.8, 0.95, 0.62, M_WHITE)

# Factory: a hall with a north-light roof and a stack.
fx = XS['factory']
box(fx - 2.0, -1.6, 0, 4.0, 3.2, 1.15)
for i in range(4):
    prism(fx - 2.0 + i * 1.0, -1.6, 1.15, 1.0, 3.2, 0.5)
cyl(fx - 1.45, 1.05, 0, 0.21, 3.1)

# Warehouse and port: a shed, a gantry crane and stacked containers.
wx = XS['port']
box(wx - 2.0, -1.3, 0, 2.7, 2.6, 1.0)
box(wx - 2.08, -1.38, 1.0, 2.86, 2.76, 0.08, M_WARM)
for (x, y) in ((wx + 1.05, -1.1), (wx + 1.05, 0.9), (wx + 1.85, -1.1), (wx + 1.85, 0.9)):
    box(x, y, 0, 0.12, 0.12, 2.3, M_WHITE, bevel=0.01)
box(wx + 0.9, -1.2, 2.3, 1.2, 2.4, 0.16)
box(wx + 1.15, -0.4, 2.46, 0.7, 0.8, 0.28)
for (x, y, n) in ((wx + 1.2, -0.7, 3), (wx + 1.2, 0.1, 2)):
    for j in range(n):
        box(x, y + 0.0, j * 0.32, 0.62, 0.55, 0.3, M_WARM if j % 2 else M_WHITE, bevel=0.01)

# A city block of offices: the institution's customers.
cx = XS['city']
box(cx - 2.0, -1.6, 0, 4.0, 3.2, 0.1, M_WARM)
for (x, y, w, d, h) in ((cx - 1.7, -1.3, 1.05, 1.05, 3.7), (cx - 0.35, -1.35, 0.95, 0.95, 2.6), (cx + 0.85, -1.2, 0.95, 1.2, 1.9),
                        (cx - 1.5, 0.15, 1.2, 1.0, 2.2), (cx + 0.1, 0.2, 1.3, 1.1, 3.0)):
    box(x, y, 0.1, w, d, h)
    box(x + 0.08, y + 0.08, 0.1 + h, w - 0.16, d - 0.16, 0.12, M_WARM, bevel=0.01)

# --- light: a soft sky and a low sun; the plate's shadow falls on the page ------------------
world = bpy.data.worlds.new('world')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (0.98, 0.96, 0.93, 1)
bg.inputs['Strength'].default_value = float(os.environ.get('SKY', '0.5'))
bpy.ops.object.light_add(type='SUN', location=(0, 0, 10))
sun = bpy.context.active_object
sun.data.energy = float(os.environ.get('SUNE', '2.0'))
sun.data.angle = math.radians(9)
sun.rotation_euler = (math.radians(42), 0, math.radians(-38))
bpy.ops.mesh.primitive_plane_add(size=120, location=(0, 0, -PT - 0.001))
ground = bpy.context.active_object
ground.is_shadow_catcher = True

# --- cameras and the projected paths -----------------------------------------------------------
def camera(az, el, target, scale):
    cam_d = bpy.data.cameras.new('cam')
    cam_d.type = 'ORTHO'
    cam_d.ortho_scale = scale
    cam = bpy.data.objects.new('cam', cam_d)
    bpy.context.collection.objects.link(cam)
    t = Vector(target)
    d = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    cam.location = t + d * 60
    cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    cam_d.clip_end = 200
    return cam

def poly(points, z=0.012, step=0.12):
    out = []
    for (a, b) in zip(points, points[1:]):
        A, B = Vector((a[0], a[1], z)), Vector((b[0], b[1], z))
        n = max(1, int((B - A).length / step))
        for i in range(n):
            out.append(A.lerp(B, i / n))
    out.append(Vector((points[-1][0], points[-1][1], z)))
    return out

def bez(a, c, b, z=0.012, n=80):
    A, C, B = Vector((*a, z)), Vector((*c, z)), Vector((*b, z))
    return [((1 - t) ** 2) * A + 2 * (1 - t) * t * C + (t ** 2) * B for t in (i / n for i in range(n + 1))]

PATHS = {
    'goods': [
        poly([(XS['solar'], EDGE_F['solar']), (XS['solar'], FRONT), (XS['factory'], FRONT), (XS['factory'], EDGE_F['factory'])]),
        poly([(XS['factory'], EDGE_F['factory']), (XS['factory'], FRONT), (XS['port'], FRONT), (XS['port'], EDGE_F['port'])]),
        poly([(XS['port'], EDGE_F['port']), (XS['port'], FRONT), (XS['city'], FRONT), (XS['city'], EDGE_F['city'])]),
    ],
    'money': [
        poly([(XS['bank'], EDGE_B['bank']), (XS['bank'], BACK), (XS['factory'], BACK), (XS['factory'], EDGE_B['factory'])]),
        poly([(XS['bank'], EDGE_B['bank']), (XS['bank'], BACK), (XS['port'], BACK), (XS['port'], EDGE_B['port'])]),
        poly([(XS['bank'], EDGE_B['bank']), (XS['bank'], BACK), (XS['city'], BACK), (XS['city'], EDGE_B['city'])]),
    ],
    # The discovery: the loan from the bank to the solar field, staged with deliveries.
    'found': [poly([(XS['bank'], EDGE_B['bank']), (XS['bank'], BACK), (XS['solar'], BACK), (XS['solar'], EDGE_B['solar'])])],
    # Futures: branches fanning from the bank's route across the plate. Index 2 reaches the port, and is delayed.
    'futures': [
        bez((XS['bank'], BACK), (-4, 4.0), (2.5, 3.9)),
        bez((XS['bank'], BACK), (-3, 2.3), (4.0, 2.6)),
        bez((XS['bank'], BACK), (-1, 3.6), (XS['port'], EDGE_B['port'] + 0.15)),
        bez((XS['bank'], BACK), (2, 4.1), (9.5, 3.8)),
        bez((XS['bank'], BACK), (4, 2.0), (13.2, 2.4)),
        bez((XS['bank'], BACK), (-6, 2.0), (-2.6, 2.1)),
    ],
}
TAG = Vector((XS['solar'] - 2.75, BACK, 0.012))

def project(cam, w, h):
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = w, h
    dg = bpy.context.evaluated_depsgraph_get()
    fwd = cam.matrix_world.to_quaternion() @ Vector((0, 0, -1))
    def seen(v):
        hit, loc, _n, _i, obj, _m = scene.ray_cast(dg, v - fwd * 80, fwd)
        return 1 if (not hit or obj.name in ('plate',) or (loc - v).length < 0.08) else 0
    def pr(v, vis=False):
        c = world_to_camera_view(scene, cam, v)
        out = [round(c.x, 5), round(1 - c.y, 5)]
        return out + [seen(v)] if vis else out
    return {'w': w, 'h': h, 'paths': {k: [[pr(p, True) for p in line] for line in lines] for k, lines in PATHS.items()}, 'tag': pr(TAG)}

VIEWS = {
    'wide': (camera(math.radians(11), math.radians(31), (0.2, 0.2, 0.5), 31.8), 3000, 840),
    'narrow': (camera(math.radians(11), math.radians(31), (-6.0, 0.3, 0.7), 15.2), 1400, 1000),
}
data = {}
for name, (cam, w, h) in VIEWS.items():
    data[name] = project(cam, w, h)
    scene.render.resolution_percentage = int(os.environ.get('PCT', '100'))
    scene.render.image_settings.file_format = 'WEBP'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.quality = 88
    scene.render.filepath = os.path.join(OUT, f'lit-{name}.webp')
    if os.environ.get('NORENDER') != '1':
        bpy.ops.render.render(write_still=True)
json.dump(data, open(os.path.join(OUT, 'lit.json'), 'w'))
print('done', OUT)
