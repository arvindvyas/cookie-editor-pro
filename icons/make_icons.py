#!/usr/bin/env python3
"""Generate Cookie Editor Pro PNG icons (16/48/128) with no third-party deps.
A simple cookie-disc on a blue rounded background."""
import struct, zlib, math, os

def png(width, height, pixels):
    def chunk(typ, data):
        c = typ + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type 0
        for x in range(width):
            raw += bytes(pixels[y * width + x])
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)  # 8-bit RGBA
    idat = zlib.compress(bytes(raw), 9)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")

def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))

def make(size):
    BG1 = (47, 109, 246)   # blue
    BG2 = (31, 87, 214)
    COOKIE = (214, 161, 90) # tan
    COOKIE_D = (179, 128, 64)
    CHIP = (90, 58, 28)
    px = []
    cx, cy = size / 2, size / 2
    r_disc = size * 0.30
    radius_bg = size * 0.22
    # chip positions (relative)
    chips = [(-0.10, -0.10), (0.12, -0.02), (-0.02, 0.13), (0.10, 0.14), (-0.14, 0.06)]
    for y in range(size):
        for x in range(size):
            # rounded-rect background mask
            dx = max(abs(x - cx) - (size/2 - radius_bg), 0)
            dy = max(abs(y - cy) - (size/2 - radius_bg), 0)
            in_bg = (dx*dx + dy*dy) <= radius_bg*radius_bg
            if not in_bg:
                px.append((0, 0, 0, 0)); continue
            col = lerp(BG1, BG2, y / size)
            # cookie disc
            d = math.hypot(x - cx, y - cy)
            if d <= r_disc:
                edge = 1 - max(0, (d - (r_disc - size*0.04)) / (size*0.04))
                col = lerp(COOKIE_D, COOKIE, min(1, edge + 0.2))
                # bite (top-right)
                bx, by = cx + r_disc*0.7, cy - r_disc*0.7
                if math.hypot(x - bx, y - by) <= r_disc*0.45:
                    col = lerp(BG1, BG2, y / size)
                else:
                    for (chx, chy) in chips:
                        if math.hypot(x - (cx + chx*size), y - (cy + chy*size)) <= size*0.035:
                            col = CHIP
                            break
            px.append((col[0], col[1], col[2], 255))
    return png(size, size, px)

here = os.path.dirname(os.path.abspath(__file__))
for s in (16, 48, 128):
    with open(os.path.join(here, f"icon{s}.png"), "wb") as f:
        f.write(make(s))
    print(f"wrote icon{s}.png")
