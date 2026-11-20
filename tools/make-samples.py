#!/usr/bin/env python3
"""Paint the ten sample plates shipped with Sunset State Cover Studio.

Every plate is drawn from code with PIL — layered gradients, glow passes,
silhouette shapes, sparkle fields and film grain — so the sample photos
are original art produced inside the build session, byte for byte from
this script. Fixed seeds keep the output stable between runs.
"""
import math
import pathlib
import random

from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEST = ROOT / "app" / "samples"
W, H = 1280, 960


# ---------------------------------------------------------------- helpers

def vgrad(w, h, stops):
    """Vertical gradient image. stops = [(pos0..1, (r,g,b)), ...] sorted."""
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]
            p1, c1 = stops[i + 1]
            if p0 <= t <= p1:
                f = 0.0 if p1 == p0 else (t - p0) / (p1 - p0)
                col = tuple(round(c0[k] + (c1[k] - c0[k]) * f) for k in range(3))
                break
        else:
            col = stops[-1][1]
        for x in range(w):
            px[x, y] = col
    return img


def glow(base, draw_fn, blur=24, passes=2):
    """Draw shapes on a layer, blur it, and screen it over the base."""
    import PIL.ImageChops as C
    layer = Image.new("RGB", base.size, (0, 0, 0))
    d = ImageDraw.Draw(layer)
    draw_fn(d)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    for _ in range(passes):
        base = C.screen(base, layer)
    return base


def disc_glow(base, cx, cy, r, color, blur=30):
    layer = Image.new("RGB", base.size, (0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([cx - r * 2.2, cy - r * 2.2, cx + r * 2.2, cy + r * 2.2], fill=tuple(c // 3 for c in color))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    import PIL.ImageChops as C
    base = C.screen(base, layer)
    d = ImageDraw.Draw(base)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    return base


def sparkle(draw, rng, box, count, color=(255, 240, 210), max_len=16):
    x0, y0, x1, y1 = box
    for _ in range(count):
        x = rng.uniform(x0, x1)
        y = rng.uniform(y0, y1)
        ln = rng.uniform(2, max_len) * (0.4 + (y - y0) / max(1, (y1 - y0)))
        a = rng.uniform(0.3, 1.0)
        c = tuple(int(v * a) for v in color)
        draw.line([x - ln, y, x + ln, y], fill=c, width=1)
        if rng.random() < 0.3:
            draw.point((x, y), fill=color)


def grain(img, rng, amount=14):
    noise = Image.effect_noise(img.size, 32).convert("L")
    import PIL.ImageChops as C
    noise_rgb = Image.merge("RGB", (noise, noise, noise))
    return C.blend(img, C.add(img, noise_rgb, 1, -128), amount / 255.0)


def vignette(img, strength=90):
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([-w * 0.25, -h * 0.25, w * 1.25, h * 1.25], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(120))
    dark = Image.new("RGB", (w, h), (10, 6, 14))
    return Image.composite(img, Image.blend(img, dark, strength / 255.0), mask)


def palm(draw, x, y, scale, color=(16, 10, 18), lean=0.35):
    """A palm silhouette: curved trunk plus arcing fronds."""
    top_x = x + lean * 120 * scale
    top_y = y - 210 * scale
    steps = 14
    prev = (x, y)
    for i in range(1, steps + 1):
        t = i / steps
        px_ = x + (top_x - x) * t
        py_ = y + (top_y - y) * (t * t * 0.4 + t * 0.6)
        wdt = max(2, int((1 - t) * 13 * scale) + 2)
        draw.line([prev, (px_, py_)], fill=color, width=wdt)
        prev = (px_, py_)
    # fronds: curved strokes that rise off the crown then droop
    for i, ang in enumerate(range(-172, -6, 15)):
        a = math.radians(ang)
        ln = (95 + ((i * 41) % 53)) * scale
        pts = []
        steps = 9
        for s_i in range(steps + 1):
            t = s_i / steps
            fx = top_x + math.cos(a) * ln * t
            fy = top_y + math.sin(a) * ln * t + (ln * 0.52) * t * t
            pts.append((fx, fy))
        for s_i in range(steps):
            wdt = max(1, int((4.6 - 3.4 * (s_i / steps)) * scale))
            draw.line([pts[s_i], pts[s_i + 1]], fill=color, width=wdt)
    draw.ellipse([top_x - 7 * scale, top_y - 4 * scale, top_x + 7 * scale, top_y + 10 * scale], fill=color)


def skyline(draw, rng, base_y, h_min, h_max, w_range, color, windows=None, win_color=(255, 214, 130)):
    x = -20
    while x < W + 20:
        bw = rng.uniform(*w_range)
        bh = rng.uniform(h_min, h_max)
        draw.rectangle([x, base_y - bh, x + bw, base_y], fill=color)
        if rng.random() < 0.4:
            draw.rectangle([x + bw * 0.3, base_y - bh - 14, x + bw * 0.55, base_y - bh], fill=color)
        if windows:
            cols = max(1, int(bw // 26))
            rows = max(1, int(bh // 34))
            for cx in range(cols):
                for cy in range(rows):
                    if rng.random() < windows:
                        wx = x + 8 + cx * 26
                        wy = base_y - bh + 10 + cy * 34
                        draw.rectangle([wx, wy, wx + 9, wy + 13], fill=win_color)
        x += bw + rng.uniform(4, 26)


def car_silhouette(draw, cx, cy, scale, color=(12, 8, 16)):
    """Low sports-car side profile."""
    s = scale
    body = [
        (cx - 150 * s, cy), (cx - 148 * s, cy - 26 * s), (cx - 96 * s, cy - 34 * s),
        (cx - 52 * s, cy - 62 * s), (cx + 8 * s, cy - 68 * s), (cx + 58 * s, cy - 40 * s),
        (cx + 118 * s, cy - 34 * s), (cx + 150 * s, cy - 18 * s), (cx + 150 * s, cy),
    ]
    draw.polygon(body, fill=color)
    draw.ellipse([cx - 108 * s, cy - 24 * s, cx - 56 * s, cy + 12 * s], fill=color)
    draw.ellipse([cx + 52 * s, cy - 24 * s, cx + 104 * s, cy + 12 * s], fill=color)
    for wx in (cx - 82 * s, cx + 78 * s):
        draw.ellipse([wx - 21 * s, cy - 21 * s, wx + 21 * s, cy + 21 * s], fill=(4, 3, 6))
        draw.ellipse([wx - 9 * s, cy - 9 * s, wx + 9 * s, cy + 9 * s], fill=(70, 66, 84))


# ---------------------------------------------------------------- plates

def plate_sunset_shore(rng):
    img = vgrad(W, H, [(0.0, (64, 32, 96)), (0.34, (196, 74, 110)), (0.52, (255, 138, 76)), (0.62, (255, 196, 110)), (0.66, (58, 120, 150)), (1.0, (16, 52, 84))])
    d = ImageDraw.Draw(img)
    horizon = int(H * 0.64)
    img = disc_glow(img, W // 2, horizon - 26, 74, (255, 214, 130), blur=36)
    d = ImageDraw.Draw(img)
    for i in range(46):  # cloud bands
        y = rng.uniform(30, horizon - 130)
        x = rng.uniform(-100, W - 200)
        ln = rng.uniform(140, 420)
        c = (255, int(rng.uniform(140, 190)), int(rng.uniform(110, 150)))
        d.line([x, y, x + ln, y], fill=c, width=rng.randint(3, 7))
    sparkle(d, rng, (W * 0.2, horizon + 8, W * 0.8, H - 60), 340)
    d.rectangle([0, H - 66, W, H], fill=(24, 14, 26))  # wet sand strip
    sparkle(d, rng, (0, H - 60, W, H - 6), 120, color=(255, 190, 150), max_len=8)
    palm(d, 108, H - 40, 1.25)
    palm(d, W - 128, H - 30, 1.5, lean=-0.4)
    palm(d, W - 330, H - 52, 0.8, lean=-0.2)
    return img


def plate_ocean_avenue(rng):
    img = vgrad(W, H, [(0.0, (26, 20, 66)), (0.45, (96, 44, 110)), (0.62, (214, 92, 96)), (0.7, (52, 36, 60)), (1.0, (18, 12, 26))])
    d = ImageDraw.Draw(img)
    horizon = int(H * 0.66)
    # deco blocks left and right with neon sign glows
    for side, x0 in (("L", 0), ("R", W - 330)):
        for i in range(3):
            bw = rng.uniform(150, 300)
            bh = rng.uniform(300, 520)
            x = x0 + (i * 40 if side == "L" else -i * 30)
            d.rectangle([x, horizon - bh, x + bw, horizon], fill=(20, 14, 34))
            for wy in range(int(horizon - bh) + 24, horizon - 30, 44):
                for wx in range(int(x) + 16, int(x + bw) - 24, 36):
                    if rng.random() < 0.5:
                        d.rectangle([wx, wy, wx + 14, wy + 20], fill=(255, 206, 120))
            if side == "L":
                x0 += bw * 0.55
            else:
                x0 -= bw * 0.4
    img = glow(img, lambda dd: (
        dd.rounded_rectangle([86, 210, 250, 330], 14, fill=(255, 70, 160)),
        dd.rounded_rectangle([W - 260, 150, W - 110, 300], 14, fill=(60, 220, 255)),
    ), blur=26)
    d = ImageDraw.Draw(img)
    d.polygon([(340, H), (560, horizon), (740, horizon), (1010, H)], fill=(30, 22, 38))  # street
    for i in range(9):
        y = horizon + 14 + i * i * 4.4
        d.line([640 - i * 4, y, 660 + i * 4, y], fill=(255, 220, 160), width=3)
    for i, x in enumerate(range(300, 1020, 120)):  # street palms
        palm(d, x, horizon + 26, 0.52, lean=0.2 if i % 2 else -0.2)
    car_silhouette(d, 650, H - 150, 1.15)
    d.ellipse([650 - 168, H - 168, 650 - 148, H - 152], fill=(255, 236, 180))
    d.ellipse([650 + 148, H - 168, 650 + 168, H - 152], fill=(255, 236, 180))
    return img


def plate_speedboat(rng):
    img = vgrad(W, H, [(0.0, (70, 160, 200)), (0.4, (120, 205, 215)), (0.52, (30, 130, 165)), (1.0, (10, 70, 110))])
    d = ImageDraw.Draw(img)
    horizon = int(H * 0.5)
    for i in range(26):
        y = rng.uniform(20, horizon - 60)
        x = rng.uniform(0, W - 260)
        d.line([x, y, x + rng.uniform(120, 300), y], fill=(240, 250, 255), width=rng.randint(4, 9))
    sparkle(d, rng, (0, horizon + 6, W, H - 30), 420, color=(220, 250, 255))
    cx, cy = 640, 640
    d.polygon([(cx - 330, cy + 66), (cx + 60, cy + 20), (cx + 330, cy + 66), (cx + 60, cy + 96)], fill=(235, 240, 245))  # wake
    for i in range(120):
        x = cx + rng.uniform(-320, 320)
        y = cy + rng.uniform(24, 110)
        d.point((x, y), fill=(255, 255, 255))
    hull = [(cx - 190, cy), (cx + 190, cy), (cx + 130, cy + 42), (cx - 130, cy + 42)]
    d.polygon(hull, fill=(16, 20, 34))
    d.polygon([(cx - 60, cy), (cx - 26, cy - 52), (cx + 66, cy - 52), (cx + 92, cy)], fill=(24, 28, 44))
    d.rectangle([cx - 20, cy - 48, cx + 58, cy - 30], fill=(120, 220, 240))
    d.line([cx + 92, cy, cx + 150, cy - 66], fill=(16, 20, 34), width=5)
    return img


def plate_neon_alley(rng):
    img = vgrad(W, H, [(0.0, (8, 8, 24)), (0.6, (14, 12, 34)), (1.0, (6, 5, 14))])
    d = ImageDraw.Draw(img)
    d.ellipse([W - 240, 60, W - 160, 140], fill=(232, 236, 255))  # moon
    for side, x0, x1 in (("L", 0, 430), ("R", 850, W)):
        x = x0
        while x < x1:
            bw = rng.uniform(90, 170)
            bh = rng.uniform(420, 760)
            d.rectangle([x, H - 240 - bh, x + bw, H - 200], fill=(10, 9, 20))
            for wy in range(int(H - 240 - bh) + 20, H - 240, 40):
                for wx in range(int(x) + 12, int(x + bw) - 18, 30):
                    if rng.random() < 0.34:
                        d.rectangle([wx, wy, wx + 11, wy + 16], fill=(150, 190, 255))
            x += bw + rng.uniform(6, 30)
    img = glow(img, lambda dd: (
        dd.rounded_rectangle([120, 300, 300, 470], 10, fill=(255, 60, 170)),
        dd.rounded_rectangle([330, 210, 420, 420], 10, fill=(50, 230, 255)),
        dd.rounded_rectangle([900, 260, 1060, 430], 10, fill=(255, 170, 40)),
        dd.rounded_rectangle([1080, 350, 1180, 520], 10, fill=(140, 90, 255)),
    ), blur=22)
    d = ImageDraw.Draw(img)
    # bright sign cores so the glows read as neon signs, with bar "lettering"
    signs = [
        (120, 300, 300, 470, (255, 120, 200), (255, 220, 245)),
        (330, 210, 420, 420, (120, 240, 255), (230, 255, 255)),
        (900, 260, 1060, 430, (255, 196, 92), (255, 244, 214)),
        (1080, 350, 1180, 520, (178, 140, 255), (240, 232, 255)),
    ]
    for x0, y0, x1, y1, fill, core in signs:
        d.rounded_rectangle([x0, y0, x1, y1], 10, fill=fill)
        rows = max(2, int((y1 - y0) // 52))
        for r_i in range(rows):
            by = y0 + 26 + r_i * 52
            bw = (x1 - x0) * (0.52 + 0.3 * ((r_i * 37) % 10) / 10)
            d.rounded_rectangle([x0 + 20, by, x0 + 20 + bw, by + 15], 7, fill=core)
    d.rectangle([0, H - 200, W, H], fill=(12, 10, 22))
    for x, c in ((210, (255, 60, 170)), (375, (50, 230, 255)), (980, (255, 170, 40)), (1130, (140, 90, 255))):
        for i in range(26):
            yy = H - 190 + rng.uniform(0, 170)
            d.line([x + rng.uniform(-26, 26), yy, x + rng.uniform(10, 60), yy], fill=tuple(v // 2 for v in c), width=2)
    return img


def plate_skyline_dusk(rng):
    img = vgrad(W, H, [(0.0, (40, 24, 84)), (0.4, (140, 52, 120)), (0.58, (240, 110, 92)), (0.66, (30, 60, 92)), (1.0, (10, 30, 54))])
    horizon = int(H * 0.64)
    img = disc_glow(img, 1030, 130, 52, (238, 240, 255), blur=20)
    d = ImageDraw.Draw(img)
    skyline(d, rng, horizon, 120, 300, (60, 120), (70, 40, 84), windows=0.22, win_color=(255, 190, 120))
    skyline(d, rng, horizon + 6, 60, 190, (50, 100), (26, 16, 40), windows=0.4)
    sparkle(d, rng, (0, horizon + 16, W, H - 20), 260, color=(255, 180, 140))
    return img


def plate_boardwalk(rng):
    img = vgrad(W, H, [(0.0, (84, 44, 110)), (0.4, (226, 96, 96)), (0.58, (255, 176, 96)), (0.66, (40, 44, 66)), (1.0, (22, 18, 34))])
    d = ImageDraw.Draw(img)
    horizon = int(H * 0.62)
    img = disc_glow(img, 330, horizon - 120, 120, (255, 190, 120), blur=40)
    d = ImageDraw.Draw(img)
    # ferris wheel silhouette
    cx, cy, r = 920, horizon - 190, 168
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(18, 12, 24), width=10)
    for a in range(0, 360, 30):
        ex = cx + r * math.cos(math.radians(a))
        ey = cy + r * math.sin(math.radians(a))
        d.line([cx, cy, ex, ey], fill=(18, 12, 24), width=5)
        d.ellipse([ex - 9, ey - 9, ex + 9, ey + 9], fill=(255, 214, 130))
    d.polygon([(cx - 90, horizon), (cx, cy), (cx + 90, horizon)], outline=(18, 12, 24), width=9)
    # boardwalk planks in perspective
    d.polygon([(0, H), (430, horizon), (850, horizon), (W, H)], fill=(52, 34, 40))
    for i in range(11):
        t = i / 10
        y = horizon + (H - horizon) * (t * t)
        d.line([430 - 430 * (y - horizon) / (H - horizon), y, 850 + 430 * (y - horizon) / (H - horizon), y], fill=(30, 20, 26), width=3)
    for i in range(7):
        x = 120 + i * 170
        d.line([x, horizon + 30, x - 30, H], fill=(24, 16, 22), width=6)
        d.ellipse([x - 8, horizon + 16, x + 8, horizon + 34], fill=(255, 226, 150))
    palm(d, 130, horizon + 60, 0.9)
    return img


def plate_rooftop_pool(rng):
    img = vgrad(W, H, [(0.0, (90, 150, 205)), (0.42, (170, 205, 225)), (0.55, (60, 60, 84)), (1.0, (30, 26, 40))])
    d = ImageDraw.Draw(img)
    horizon = int(H * 0.5)
    skyline(d, rng, horizon, 80, 220, (70, 140), (52, 52, 78), windows=0.3, win_color=(255, 230, 170))
    d.rectangle([0, horizon, W, H], fill=(196, 178, 158))  # deck
    for i in range(14):
        y = horizon + 30 + i * 32
        d.line([0, y, W, y], fill=(170, 150, 128), width=3)
    d.polygon([(240, H - 90), (430, horizon + 66), (880, horizon + 66), (1080, H - 90)], fill=(40, 190, 205))
    d.polygon([(268, H - 104), (448, horizon + 82), (862, horizon + 82), (1050, H - 104)], fill=(64, 205, 220))
    sparkle(d, rng, (300, horizon + 96, 1020, H - 120), 300, color=(235, 255, 255), max_len=10)
    # umbrella + loungers silhouettes
    d.polygon([(170, horizon + 130), (300, horizon + 66), (430, horizon + 130)], fill=(24, 18, 30))
    d.line([300, horizon + 66, 300, horizon + 190], fill=(24, 18, 30), width=7)
    for x in (880, 990):
        d.polygon([(x, H - 190), (x + 90, H - 190), (x + 120, H - 160), (x + 20, H - 160)], fill=(24, 18, 30))
    palm(d, 90, H - 60, 1.0)
    palm(d, W - 90, H - 70, 1.1, lean=-0.35)
    return img


def plate_desert_highway(rng):
    img = vgrad(W, H, [(0.0, (110, 70, 130)), (0.36, (240, 130, 96)), (0.55, (255, 196, 120)), (0.62, (214, 140, 92)), (1.0, (140, 84, 60))])
    horizon = int(H * 0.6)
    img = disc_glow(img, 640, horizon - 40, 120, (255, 222, 150), blur=44)
    d = ImageDraw.Draw(img)
    d.polygon([(470, H), (600, horizon), (690, horizon), (830, H)], fill=(44, 36, 42))
    for i in range(8):
        t = i / 8
        y = horizon + (H - horizon) * (t * t)
        half = 4 + 26 * t
        d.line([645 - half / 4, y, 645 + half / 4, y], fill=(255, 226, 160), width=max(2, int(7 * t)))
    def cactus(x, y, s):
        d.line([x, y, x, y - 120 * s], fill=(20, 26, 20), width=int(13 * s))
        d.arc([x - 52 * s, y - 110 * s, x, y - 40 * s], 270, 360, fill=(20, 26, 20), width=int(10 * s))
        d.arc([x, y - 130 * s, x + 52 * s, y - 60 * s], 180, 270, fill=(20, 26, 20), width=int(10 * s))
    cactus(180, horizon + 90, 1.1)
    cactus(1080, horizon + 130, 1.5)
    cactus(950, horizon + 40, 0.6)
    # motel sign post
    d.line([240, horizon + 200, 240, horizon - 60], fill=(26, 20, 26), width=10)
    d.rounded_rectangle([150, horizon - 150, 330, horizon - 60], 12, outline=(26, 20, 26), width=8)
    car_silhouette(d, 700, horizon + 26, 0.34)
    return img


def plate_marina_night(rng):
    img = vgrad(W, H, [(0.0, (6, 12, 34)), (0.5, (12, 26, 54)), (0.62, (10, 34, 54)), (1.0, (4, 14, 28))])
    d = ImageDraw.Draw(img)
    horizon = int(H * 0.6)
    d.ellipse([150, 70, 210, 130], fill=(226, 232, 248))
    for bx in (180, 430, 700, 950, 1150):
        bh = rng.uniform(180, 300)
        d.polygon([(bx - 90, horizon), (bx + 90, horizon), (bx + 50, horizon - 34), (bx - 50, horizon - 34)], fill=(8, 10, 18))
        d.line([bx, horizon - 30, bx, horizon - bh], fill=(8, 10, 18), width=6)
        d.line([bx, horizon - bh, bx - 84, horizon - 6], fill=(60, 70, 90), width=2)
        d.line([bx, horizon - bh, bx + 84, horizon - 6], fill=(60, 70, 90), width=2)
    img2 = img
    def strings(dd):
        for x0 in (60, 340, 620, 900):
            for t_i in range(21):
                t = t_i / 20
                x = x0 + t * 260
                y = 190 + math.sin(t * math.pi) * 60 + t * 30
                dd.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(255, 196, 110))
    img = glow(img2, strings, blur=7, passes=1)
    d = ImageDraw.Draw(img)
    sparkle(d, rng, (0, horizon + 14, W, H - 16), 200, color=(170, 200, 255), max_len=10)
    for bx in (180, 430, 700, 950, 1150):
        for i in range(16):
            yy = horizon + rng.uniform(8, 120)
            d.line([bx + rng.uniform(-40, 40), yy, bx + rng.uniform(-16, 66), yy], fill=(50, 70, 100), width=2)
    return img


def plate_causeway(rng):
    img = vgrad(W, H, [(0.0, (36, 150, 180)), (0.5, (30, 165, 175)), (1.0, (16, 105, 145))])
    d = ImageDraw.Draw(img)
    for i in range(7):  # soft cloud shadows on the water
        x, y = rng.uniform(0, W - 300), rng.uniform(0, H - 200)
        d.ellipse([x, y, x + rng.uniform(240, 420), y + rng.uniform(60, 120)], fill=(22, 120, 150))
    img = img.filter(ImageFilter.GaussianBlur(1))
    d = ImageDraw.Draw(img)
    sparkle(d, rng, (0, 0, W, H), 500, color=(210, 245, 250), max_len=9)
    d.polygon([(-40, 700), (420, 300), (760, 40), (900, 130), (560, 420), (120, 800)], fill=(88, 82, 78))
    d.polygon([(-20, 690), (430, 306), (762, 52), (876, 128), (552, 408), (128, 782)], fill=(120, 114, 108))
    for t_i in range(15):  # centre dashes along the causeway
        t = t_i / 14
        x = 60 + (800 - 60) * t
        y = 730 + (90 - 730) * t
        d.ellipse([x - 7, y - 3, x + 7, y + 3], fill=(255, 226, 150))
    for t in (0.24, 0.52, 0.78):  # tiny cars
        x = 60 + 740 * t + 26
        y = 730 - 640 * t + 14
        d.rounded_rectangle([x - 17, y - 8, x + 17, y + 8], 4, fill=(20, 18, 26))
        d.point((x + 15, y - 4), fill=(255, 240, 200))
        d.point((x + 15, y + 4), fill=(255, 240, 200))
    for i in range(9):  # cloud blobs in a sky corner
        x, y = rng.uniform(880, 1180), rng.uniform(560, 800)
        d.ellipse([x, y, x + rng.uniform(90, 190), y + rng.uniform(26, 54)], fill=(240, 248, 250))
    return img


PLATES = [
    ("sunset-shore.jpg", plate_sunset_shore),
    ("ocean-avenue.jpg", plate_ocean_avenue),
    ("speedboat-run.jpg", plate_speedboat),
    ("neon-alley.jpg", plate_neon_alley),
    ("skyline-dusk.jpg", plate_skyline_dusk),
    ("boardwalk-carnival.jpg", plate_boardwalk),
    ("rooftop-pool.jpg", plate_rooftop_pool),
    ("desert-highway.jpg", plate_desert_highway),
    ("marina-night.jpg", plate_marina_night),
    ("causeway-aerial.jpg", plate_causeway),
]


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    for i, (name, fn) in enumerate(PLATES):
        rng = random.Random(20261120 + i * 77)
        img = fn(rng)
        img = grain(img, rng, amount=12)
        img = vignette(img, strength=70)
        out = DEST / name
        img.save(out, quality=86)
        print(f"{name}: {out.stat().st_size} bytes")


if __name__ == "__main__":
    main()
