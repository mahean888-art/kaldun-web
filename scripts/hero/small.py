"""The small renders, in the hero's material, light and camera.

Domains, four vignettes on white (4:3), each a slice of the same world with a
single point of warm light at its mechanism:
  v-res   a bank tower on a vault plinth, one lit route to a cluster of kiosks
  v-cred  a ladder of stepped blocks beside a lender's tower; the tallest is lit
  v-risk  a neighborhood of houses and shops, every one wired to one lit data center
  v-proj  a solar field and a factory joined by one lit rail line

Method, five frames on black (4:5), lit like product photography:
  f-evidence  a stack of documents and a ledger, glowing faintly at the edges
  f-model     the white world model, assembled
  f-simulate  the model with its fan of frosted futures
  f-compare   today's arrangement beside the changed one, its change lit
  f-decide    one lit future, alone on a plinth
  f-search    the model with proposed changes drawn in light above it
  f-observe   the chosen future beside the record of what actually happened

Run: python small.py -- OUTDIR   (env: SAMPLES, PCT, ONLY=v|f|all, NAMES=a,b)
"""
import bpy, math, os, sys
from mathutils import Vector

OUT = sys.argv[sys.argv.index('--') + 1]
os.makedirs(OUT, exist_ok=True)
SAMPLES = int(os.environ.get('SAMPLES', '96'))
PCT = int(os.environ.get('PCT', '100'))
ONLY = os.environ.get('ONLY', 'all')
NAMES = [n for n in os.environ.get('NAMES', '').split(',') if n]

def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

def reset(dark=False):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    sc.render.film_transparent = not dark
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.exposure = 0.05 if not dark else -0.2
    w = bpy.data.worlds.new('w')
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (0.98, 0.96, 0.93, 1) if not dark else (0.0, 0.0, 0.0, 1)
    bg.inputs['Strength'].default_value = 0.55 if not dark else 0.0
    bpy.ops.object.light_add(type='AREA', location=(-16, -14, 18))
    key = bpy.context.active_object
    key.data.energy = 2600 if not dark else 3400
    key.data.size = 12 if not dark else 6
    key.rotation_euler = (Vector((0, 0, 0)) - key.location).to_track_quat('-Z', 'Y').to_euler()
    if dark:
        bpy.ops.object.light_add(type='AREA', location=(14, -6, 6))
        rim = bpy.context.active_object
        rim.data.energy = 700
        rim.data.size = 8
        rim.rotation_euler = (Vector((0, 0, 1)) - rim.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -0.501))
    g = bpy.context.active_object
    if dark:
        m = bpy.data.materials.new('floor')
        m.use_nodes = True
        b = m.node_tree.nodes['Principled BSDF']
        b.inputs['Base Color'].default_value = (0.012, 0.011, 0.01, 1)
        b.inputs['Roughness'].default_value = 0.35
        g.data.materials.append(m)
    else:
        g.is_shadow_catcher = True
        g.visible_glossy = False
    return sc

M = {}
def mat(name, hexc, rough=0.6, emit=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(hexc), 1)
    b.inputs['Roughness'].default_value = rough
    if emit:
        b.inputs['Emission Color'].default_value = (*lin(emit), 1)
        b.inputs['Emission Strength'].default_value = strength
    return m
def mats():
    M['card'] = mat('card', '#fbf9f4')
    M['plate'] = mat('plate', '#f2eee6', 0.65)
    M['road'] = mat('road', '#e9e4da', 0.7)
    M['panel'] = mat('panel', '#c3c0ba', 0.25)
    M['steel'] = mat('steel', '#d8d4cc', 0.4)
    M['warm'] = mat('warm', '#f2a24a', 0.4, '#e8810c', 1.1)
    M['frost'] = frost(False, 0.05)
    M['frost_hi'] = frost(False, 1.1)
    M['frost_lit'] = frost(True)
    M['edge'] = mat('edge', '#fffaf0', 0.5, '#fff3dc', 1.4)

def frost(lit, glow=0.12):
    m = bpy.data.materials.new('frost')
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin('#f6b45c' if lit else '#ffffff'), 1)
    b.inputs['Roughness'].default_value = 0.35
    b.inputs['Alpha'].default_value = 0.5 if lit else 0.22
    b.inputs['Emission Color'].default_value = (*lin('#ef8a10' if lit else '#fffaf0'), 1)
    b.inputs['Emission Strength'].default_value = 1.2 if lit else glow
    return m


def frost_tex(tex, glow, alpha):
    m = bpy.data.materials.new('frost_tex')
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin('#f7f6f3'), 1)
    b.inputs['Roughness'].default_value = 0.35
    img = nt.nodes.new('ShaderNodeTexImage')
    img.image = bpy.data.images.load(tex)
    mx = nt.nodes.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; mx.inputs[1].default_value = alpha
    nt.links.new(img.outputs['Alpha'], mx.inputs[0])
    nt.links.new(mx.outputs['Value'], b.inputs['Alpha'])
    mix = nt.nodes.new('ShaderNodeMixRGB'); mix.blend_type = 'MIX'
    mix.inputs['Color1'].default_value = (*lin('#ffffff'), 1)
    nt.links.new(img.outputs['Alpha'], mix.inputs['Fac'])
    nt.links.new(img.outputs['Color'], mix.inputs['Color2'])
    nt.links.new(mix.outputs['Color'], b.inputs['Emission Color'])
    b.inputs['Emission Strength'].default_value = glow
    return m
ETCH = '/tmp/claude-0/-home-user-kaldun-web/fd930541-fe09-5744-8e47-e77ab427b4b2/scratchpad/blender/tex-etch.png'
TEX = '/tmp/claude-0/-home-user-kaldun-web/fd930541-fe09-5744-8e47-e77ab427b4b2/scratchpad/blender/tex-compare.png'

def box(x0, y0, z0, w, d, h, m='card', bevel=0.02, rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x0 + w / 2, y0 + d / 2, z0 + h / 2))
    o = bpy.context.active_object
    o.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        bv = o.modifiers.new('bv', 'BEVEL')
        bv.width = bevel
        bv.segments = 2
    o.data.materials.append(M[m])
    if rot:
        o.rotation_euler = rot
    return o

def cyl(x, y, z0, r, h, m='card', v=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h, location=(x, y, z0 + h / 2))
    o = bpy.context.active_object
    o.data.materials.append(M[m])
    bpy.ops.object.shade_smooth()
    return o

def tooth(x0, y0, z0, w, d, h):
    me = bpy.data.meshes.new('t')
    v = [(x0, y0, z0), (x0 + w, y0, z0), (x0 + w, y0, z0 + h), (x0, y0 + d, z0), (x0 + w, y0 + d, z0), (x0 + w, y0 + d, z0 + h)]
    me.from_pydata(v, [], [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (0, 2, 5, 3)])
    o = bpy.data.objects.new('t', me)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(M['card'])
    return o

def house(x, y, w, d, h, r):
    box(x, y, 0, w, d, h)
    me = bpy.data.meshes.new('roof')
    v = [(x, y, h), (x + w, y, h), (x + w, y + d, h), (x, y + d, h), (x, y + d / 2, h + r), (x + w, y + d / 2, h + r)]
    me.from_pydata(v, [], [(0, 1, 5, 4), (3, 4, 5, 2), (0, 4, 3), (1, 2, 5)])
    o = bpy.data.objects.new('roof', me)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(M['card'])

def plate(w, d, t=0.5):
    p = box(-w / 2, -d / 2, -t, w, d, t, 'plate', bevel=0.08)
    p.modifiers['bv'].segments = 4

def tower(x, y, w, d, h):
    box(x, y, 0, w, d, h)
    for z in [0.32 * k for k in range(1, int(h / 0.32))]:
        box(x - 0.005, y - 0.005, z, w + 0.01, 0.012, 0.02, 'road', bevel=0)
        box(x + w - 0.007, y - 0.005, z, 0.012, d + 0.01, 0.02, 'road', bevel=0)
    box(x + 0.08, y + 0.08, h, w - 0.16, d - 0.16, 0.12)

def camera(sc, target, scale, w, h, az=10, el=28):
    cd = bpy.data.cameras.new('c')
    cd.type = 'ORTHO'
    cd.ortho_scale = scale
    cd.clip_end = 400
    cam = bpy.data.objects.new('c', cd)
    bpy.context.collection.objects.link(cam)
    a, e = math.radians(az), math.radians(el)
    dv = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
    cam.location = Vector(target) + dv * 80
    cam.rotation_euler = (-dv).to_track_quat('-Z', 'Y').to_euler()
    sc.camera = cam
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.resolution_percentage = PCT

def render(sc, name, dark=False):
    sc.render.image_settings.file_format = 'WEBP'
    sc.render.image_settings.color_mode = 'RGB' if dark else 'RGBA'
    sc.render.image_settings.quality = 90
    sc.render.filepath = os.path.join(OUT, name + '.webp')
    bpy.ops.render.render(write_still=True)

def mini_world():
    """The hero world, in miniature: towers, factory, port, solar, road and rail."""
    plate(8.0, 4.4)
    box(-3.8, -1.9, 0, 7.4, 0.3, 0.03, 'road', bevel=0.01)
    for r in range(3):
        p = box(-3.7, -1.3 + r * 0.6, 0, 1.6, 0.4, 0.04, 'panel', bevel=0.006)
        p.rotation_euler = (math.radians(28), 0, 0)
        p.location.z = 0.3
    tower(-1.6, -0.6, 0.6, 0.6, 2.0)
    tower(-0.9, 0.2, 0.7, 0.7, 2.8)
    tower(-0.3, -0.7, 0.55, 0.55, 1.5)
    box(0.5, 0.2, 0, 1.6, 1.4, 0.6)
    for i in range(3):
        tooth(0.5 + i * 0.533, 0.2, 0.6, 0.533, 1.4, 0.3)
    cyl(0.7, 1.4, 0, 0.1, 1.6)
    for (x, y, n) in ((2.4, -0.6, 3), (2.4, 0.2, 2), (3.0, -0.2, 3)):
        for j in range(n):
            box(x, y, j * 0.2, 0.5, 0.55, 0.18, 'card' if j % 2 else 'road', bevel=0.006)
    for (x, y) in ((2.2, -1.0), (2.2, 1.2), (3.5, -1.0), (3.5, 1.2)):
        box(x, y, 0, 0.06, 0.06, 1.5, bevel=0)
    box(2.1, -1.1, 1.5, 1.6, 2.4, 0.1)

def slice_card(x, y, w, h, m, a=0.0):
    bpy.ops.mesh.primitive_plane_add(size=1)
    o = bpy.context.active_object
    o.scale = (w, h, 1)
    bpy.ops.object.transform_apply(scale=True)
    o.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    o.location = (0, 0, h / 2)
    bpy.ops.object.transform_apply(location=True)
    o.rotation_euler = (0, a, 0)
    o.location = (x, y, 0)
    o.data.materials.append(M[m])
    o.visible_shadow = False
    # a fine etched edge, so the card reads as a card
    bpy.ops.object.mode_set(mode='OBJECT')
    wf = o.copy()
    wf.data = o.data.copy()
    bpy.context.collection.objects.link(wf)
    mod = wf.modifiers.new('wf', 'WIREFRAME')
    mod.thickness = 0.025
    wf.data.materials.clear()
    wf.data.materials.append(M['edge'] if m != 'frost_lit' else M['warm'])
    return o

# --- the vignettes ------------------------------------------------------------------------------
def v_res():
    plate(6.0, 4.5)
    box(-2.4, -0.9, 0, 1.9, 1.9, 0.35)              # the vault plinth
    tower(-2.15, -0.65, 1.4, 1.4, 3.0)
    for (x, y) in ((1.2, -0.9), (2.0, -0.9), (1.2, 0.1), (2.0, 0.1), (1.6, 1.0)):
        box(x, y, 0, 0.55, 0.55, 0.42)
        box(x + 0.05, y + 0.05, 0.42, 0.45, 0.45, 0.05, 'road', bevel=0)
    box(-0.5, -0.14, 0.0, 1.7, 0.28, 0.16, 'warm', bevel=0.02)   # the route between them, raised and lit
def v_cred():
    plate(6.0, 4.5)
    tower(-2.6, -0.4, 1.1, 1.1, 3.2)
    hs = [0.4, 0.7, 1.0, 1.35, 2.3, 1.2]
    for i, h in enumerate(hs):
        box(-1.0 + i * 0.6, -0.7, 0, 0.5, 1.2, h, 'card')
        if i == 4:
            box(-1.0 + i * 0.6 - 0.005, -0.705, h - 0.16, 0.51, 1.21, 0.07, 'warm', bevel=0)   # one lit band
def v_risk():
    plate(6.0, 4.5)
    box(-0.8, 0.9, 0, 1.6, 1.0, 0.75)              # the data center
    for i in range(4):
        cyl(-0.5 + i * 0.35, 1.4, 0.75, 0.1, 0.08, 'steel', v=16)
    dc = box(-0.75, 0.86, 0.02, 1.5, 0.04, 0.6, 'warm', bevel=0)   # its lit face
    spots = [(-2.4, -1.6), (-1.6, -1.6), (-0.8, -1.6), (0.0, -1.6), (0.8, -1.6), (1.6, -1.6), (2.4, -1.6),
             (-2.4, -0.6), (-1.6, -0.6), (1.6, -0.6), (2.4, -0.6), (-2.4, 0.6), (2.4, 0.6)]
    for k, (x, y) in enumerate(spots):
        if k % 3 == 1:
            box(x - 0.25, y - 0.22, 0, 0.5, 0.44, 0.38)    # a shop
        else:
            house(x - 0.22, y - 0.22, 0.44, 0.44, 0.3, 0.22)
        # the fine line to the shared dependency
        v = Vector((0 - x, 0.9 - y, 0))
        L = v.length
        ln = box(-L / 2, -0.012, 0.005, L, 0.024, 0.012, 'road', bevel=0)
        bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY')
        ln.rotation_euler = (0, 0, math.atan2(v.y, v.x))
        ln.location = (x + v.x / 2, y + v.y / 2, 0.011)
def v_proj():
    plate(6.0, 4.5)
    for r in range(4):
        p = box(-2.7, -1.5 + r * 0.7, 0, 1.9, 0.45, 0.04, 'panel', bevel=0.006)
        p.rotation_euler = (math.radians(28), 0, 0)
        p.location.z = 0.3
    box(1.0, -0.6, 0, 1.9, 1.7, 0.8)
    for i in range(3):
        tooth(1.0 + i * 0.633, -0.6, 0.8, 0.633, 1.7, 0.35)
    cyl(1.25, 0.85, 0, 0.12, 1.9)
    for dy in (-0.07, 0.07):
        box(-0.7, -1.6 + dy - 0.02, 0.0, 1.9, 0.04, 0.05, 'warm', bevel=0)   # the rail link
    for i in range(10):
        box(-0.65 + i * 0.19, -1.72, 0, 0.06, 0.24, 0.02, 'road', bevel=0)

def v_trade():
    plate(6.0, 4.5)
    # a ship-to-shore crane: four legs, a cab, and a boom reaching out over the water
    for (x, y) in ((-2.7, -0.7), (-2.0, -0.7), (-2.7, 0.1), (-2.0, 0.1)):
        box(x, y, 0, 0.09, 0.09, 2.5, bevel=0)
    box(-2.75, -0.75, 1.2, 0.84, 0.95, 0.07, 'steel', bevel=0)
    box(-2.5, -2.05, 2.5, 0.34, 2.75, 0.14)            # the boom
    box(-2.6, 0.0, 2.64, 0.5, 0.55, 0.3)               # the machinery house
    box(-2.36, -1.55, 1.25, 0.03, 0.03, 1.25, 'road', bevel=0)   # the hoist line
    box(-2.5, -1.68, 1.0, 0.32, 0.26, 0.25, 'card', bevel=0.01)  # a container on the hook
    # containers, stacked
    for r in range(3):
        for c in range(4):
            for z in range(3 - (c % 2)):
                box(-0.9 + c * 0.62, -0.1 + r * 0.5, z * 0.3, 0.58, 0.44, 0.28, 'card' if (r + c + z) % 3 else 'road', bevel=0.01)
    # a small tank farm
    for (x, y) in ((1.9, 0.9), (2.5, 0.9), (1.9, 1.5), (2.5, 1.5)):
        cyl(x, y, 0, 0.26, 0.55)
    # the lane, lit, along the water's edge
    box(-2.9, -1.75, 0.0, 5.8, 0.12, 0.05, 'warm', bevel=0)
    box(-2.9, -1.35, 0, 5.8, 0.06, 0.03, 'road', bevel=0)
def v_energy():
    plate(6.0, 4.5)
    for r in range(4):
        p = box(-2.75, -1.6 + r * 0.6, 0, 1.7, 0.4, 0.04, 'panel', bevel=0.006)
        p.rotation_euler = (math.radians(28), 0, 0)
        p.location.z = 0.28
    for i in range(4):
        box(-0.75, -1.5 + i * 0.42, 0, 0.55, 0.34, 0.42)          # storage
    # the substation: a frame of posts over two transformers
    for (x, y) in ((0.15, -0.5), (0.95, -0.5), (0.15, 0.3), (0.95, 0.3)):
        box(x, y, 0, 0.05, 0.05, 1.0, 'steel', bevel=0)
    box(0.12, -0.5, 1.0, 0.9, 0.06, 0.05, 'steel', bevel=0)
    box(0.12, 0.3, 1.0, 0.9, 0.06, 0.05, 'steel', bevel=0)
    box(0.3, -0.3, 0, 0.3, 0.3, 0.4); box(0.65, -0.05, 0, 0.3, 0.3, 0.4)
    # the data center
    box(1.6, -0.9, 0, 1.3, 1.9, 0.8)
    for i in range(4):
        cyl(1.85 + (i % 2) * 0.7, -0.5 + (i // 2) * 1.0, 0.8, 0.13, 0.1, 'steel', v=16)
    # the line to it, lit
    box(1.0, -0.12, 0.0, 0.6, 0.1, 0.06, 'warm', bevel=0)
    box(0.95, -0.12, 0.0, 0.05, 0.1, 0.06, 'warm', bevel=0)

VIGNETTES = {'v-res': v_res, 'v-cred': v_cred, 'v-risk': v_risk, 'v-proj': v_proj, 'v-trade': v_trade, 'v-energy': v_energy}
DOMAINS = {'d-res': v_res, 'd-cred': v_cred, 'd-risk': v_risk, 'd-trade': v_trade, 'd-energy': v_energy}

# --- the filmstrip --------------------------------------------------------------------------------
def f_evidence():
    """A neat stack of documents and a closed ledger, their edges glowing faintly."""
    for k in range(10):
        j = math.radians([0.0, 1.2, -0.8, 0.6, -1.4, 0.9, -0.3, 1.6, -1.0, 0.4][k])
        z = k * 0.055
        box(-2.2, -1.2, z, 2.6, 1.9, 0.04, 'card', bevel=0.003, rot=(0, 0, j))
        e = box(-2.2, -1.2, z + 0.008, 2.6, 0.012, 0.024, 'edge', bevel=0, rot=(0, 0, j))
    box(0.8, -1.0, 0, 1.7, 2.2, 0.42, 'card', bevel=0.04, rot=(0, 0, math.radians(-8)))
    box(0.8, -1.0, 0.12, 1.7, 0.012, 0.18, 'edge', bevel=0, rot=(0, 0, math.radians(-8)))
    box(0.86, -0.94, 0.42, 0.06, 2.08, 0.01, 'road', bevel=0, rot=(0, 0, math.radians(-8)))

def f_model():
    mini_world()
def f_simulate():
    mini_world()
    for k in range(6):
        slice_card(0.2, 2.6 + k * 0.35, 5.2, 2.8, 'frost', math.radians((k - 2.5) * 7.5))
def placed(build, k, x, y):
    """Build a piece at the origin, then scale it by k and move it to (x, y)."""
    before = set(bpy.context.scene.objects)
    build()
    bpy.ops.object.empty_add(location=(0, 0, 0))
    e = bpy.context.active_object
    for o in set(bpy.context.scene.objects) - before - {e}:
        o.parent = e
    e.scale = (k, k, k)
    e.location = (x, y, 0)
def f_compare():
    """Two frosted futures with the world etched in, side by side; one brighter."""
    M['ft_lo'] = frost_tex(ETCH, 0.25, 0.14)
    M['ft_hi'] = frost_tex(ETCH, 1.4, 0.3)
    slice_card(-1.75, 0.0, 3.3, 2.6, 'ft_lo', math.radians(-3))
    slice_card(1.75, -0.3, 3.3, 2.6, 'ft_hi', math.radians(3))
def f_decide():
    box(-1.4, -0.9, 0, 2.8, 1.8, 0.5, 'card', bevel=0.04)
    slice_card(0.0, 0.0, 2.6, 3.4, 'frost_hi')
    for o in bpy.context.scene.objects:
        if o.type == 'MESH' and o.location.z == 0 and o.data.materials and o.data.materials[0].name.startswith('frost'):
            o.location.z = 0.5
    # also lift its edge
    for o in bpy.context.scene.objects:
        if o.modifiers.get('wf'):
            o.location.z = 0.5

def ghost(x0, y0, z0, w, d, h, bright=False):
    """A proposed change: a box drawn in warm light, with a faint frosted fill."""
    f = box(x0, y0, z0, w, d, h, 'frost_lit' if bright else 'frost', bevel=0)
    f.visible_shadow = False
    o = box(x0, y0, z0, w, d, h, 'warm', bevel=0)
    mod = o.modifiers.new('wf', 'WIREFRAME')
    mod.thickness = 0.03
    o.visible_shadow = False
    return o
def f_search():
    mini_world()
    ghost(-2.75, 0.55, 0.3, 0.6, 0.6, 2.2)               # another tower
    ghost(3.0, -1.45, 0.3, 0.55, 0.5, 0.5)                # more storage at the port
    ghost(-0.4, -1.55, 0.35, 2.9, 0.12, 0.12, True)       # a new link, factory to port
def f_observe():
    box(-1.4, 0.3, 0, 2.8, 1.6, 0.5, 'card', bevel=0.04)
    slice_card(0.0, 1.1, 2.6, 3.0, 'frost_hi')   # what was expected
    for o in bpy.context.scene.objects:
        if o.type == 'MESH' and (o.modifiers.get('wf') or (o.data.materials and o.data.materials[0].name.startswith('frost'))):
            o.location.z = 0.5
    # in front, the record: a few sheets, the newest with its line drawn in light
    for k in range(4):
        j = math.radians([0.0, 1.4, -0.9, 0.5][k])
        box(-1.7, -2.3, k * 0.05, 3.4, 2.0, 0.035, 'card', bevel=0.003, rot=(0, 0, j))
    for r in range(6):
        box(-1.45, -2.1 + r * 0.26, 0.205, 1.9 - (r % 2) * 0.6, 0.03, 0.006, 'road', bevel=0)
    box(-1.45, -0.6, 0.205, 2.9, 0.06, 0.014, 'warm', bevel=0)   # what actually happened

FILM = {'f-evidence': (f_evidence, (0.25, 0, 0.5), 7.4), 'f-model': (f_model, (0.1, 0.2, 0.8), 12.0), 'f-simulate': (f_simulate, (0.1, 1.2, 1.8), 13.0),
        'f-compare': (f_compare, (0, 0, 1.3), 9.0), 'f-decide': (f_decide, (0, 0, 2.0), 6.4),
        'f-search': (f_search, (0.1, 0.2, 0.8), 12.0), 'f-observe': (f_observe, (0, -0.5, 1.4), 7.8)}

def m_stack():
    """The mission figure: many futures, stacked like sheets of frosted acrylic; one drawn out and lit."""
    sheet = bpy.data.materials.new('sheet'); sheet.use_nodes = True
    g = sheet.node_tree.nodes['Principled BSDF']
    g.inputs['Base Color'].default_value = (*lin('#ffffff'), 1)
    g.inputs['Roughness'].default_value = 0.35
    g.inputs['Alpha'].default_value = 0.55
    g.inputs['Emission Strength'].default_value = 0.0
    M['sheet'] = sheet
    box(-1.7, -1.2, -0.5, 3.4, 2.4, 0.5, 'card', bevel=0.05)          # the plinth, on the ground
    n = 18
    for k in range(n):
        z = 0.12 + k * 0.13
        if k == 12:
            box(-1.45, -2.05, z, 2.9, 1.9, 0.035, 'warm', bevel=0.004)   # the one found, drawn out
        else:
            box(-1.45, -0.95, z, 2.9, 1.9, 0.03, 'sheet', bevel=0.004)
            box(-1.45, -0.952, z, 2.9, 0.008, 0.03, 'panel', bevel=0)         # a fine edge

def link(a, b, m='road', w=0.035, z=0.012):
    """A fine connection on the plate, from point a to point b."""
    v = Vector((b[0] - a[0], b[1] - a[1], 0)); L = v.length
    o = box(-L / 2, -w / 2, 0, L, w, w * 0.6, m, bevel=0)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY')
    o.rotation_euler = (0, 0, math.atan2(v.y, v.x))
    o.location = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z)
    return o
def m_system():
    """The mission figure: the world as a system, its connections drawn, one changed and lit."""
    mini_world()
    hubs = [(-1.3, -0.3), (-0.55, 0.55), (-0.05, -0.45), (1.3, 0.9), (2.65, 0.1), (3.2, -0.4), (-3.0, -0.7), (-2.9, 0.6), (1.0, -1.5), (2.4, -1.4)]
    pairs = [(0, 1), (0, 2), (1, 3), (2, 3), (3, 4), (4, 5), (6, 0), (7, 1), (6, 7), (2, 8), (8, 9), (9, 5), (1, 2)]
    M['flow'] = mat('flow', '#f6c48a', 0.5, '#f0a040', 0.35)
    for i, j in pairs:
        link(hubs[i], hubs[j], 'flow', w=0.022)
    for (x, y) in hubs:
        cyl(x, y, 0, 0.06, 0.04, 'flow', v=16)
    link(hubs[6], hubs[4], 'warm', w=0.07, z=0.02)       # the one changed connection, lit end to end
    for (x, y) in (hubs[6], hubs[4]):
        cyl(x, y, 0, 0.11, 0.08, 'warm', v=24)

if ONLY in ('s', 'all'):
    sc = reset()
    mats()
    m_system()
    camera(sc, (-0.2, 0.0, 0.5), 7.6, 900, 1200, az=-32, el=34)
    render(sc, 'm-system')
if ONLY in ('m', 'all'):
    sc = reset()
    mats()
    m_stack()
    camera(sc, (0, -0.5, 1.0), 6.6, 900, 1200, az=24, el=22)
    render(sc, 'm-stack')
if ONLY in ('d', 'all'):
    for name, build in DOMAINS.items():
        if NAMES and name not in NAMES:
            continue
        sc = reset()
        mats()
        build()
        camera(sc, (0, 0.2, 0.9), 8.6, 960, 1200)
        render(sc, name)
if ONLY in ('v', 'all'):
    for name, build in VIGNETTES.items():
        if NAMES and name not in NAMES:
            continue
        sc = reset()
        mats()
        build()
        camera(sc, (0, 0.2, 0.8), 7.4, 1200, 900)
        render(sc, name)
if ONLY in ('f', 'all'):
    for name, (build, target, scale) in FILM.items():
        if NAMES and name not in NAMES:
            continue
        sc = reset(dark=True)
        mats()
        build()
        camera(sc, target, scale, 640, 800, az=14, el=22)
        render(sc, name, dark=True)
print('done')
