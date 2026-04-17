"""
SYNAPSE — Brand placeholder asset generator.
Creates app icon (multiple sizes) + 5 marketing screenshots for App Store / Play Store.

Design language (from GDD §3):
- Background: #0A0E1A (deep night blue, "bioluminescent" aesthetic)
- Primary accent: #4A9FFF (sky-blue / electric)
- Secondary glow: #7BD4FF
- Deep accent: #2E5C99 (muted blue for gradients)

All files are PLACEHOLDERS — replace in Sprint 10-12 with real assets.
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ── Design tokens ───────────────────────────────────────────────────────────
BG_DEEP = (10, 14, 26)        # #0A0E1A
BG_MID  = (18, 28, 54)        # slightly lighter for gradient
SKY_BLUE = (74, 159, 255)     # #4A9FFF
GLOW = (123, 212, 255)        # #7BD4FF
TEXT_DIM = (170, 195, 230)    # muted sky-blue for body text

FONT_PATH_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_PATH_REG  = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

OUTDIR = "/home/claude/branding"
os.makedirs(OUTDIR, exist_ok=True)

# ── Helpers ─────────────────────────────────────────────────────────────────

def radial_gradient(size, center_color, edge_color):
    """Create a radial gradient background."""
    w, h = size
    img = Image.new("RGB", (w, h), edge_color)
    pixels = img.load()
    cx, cy = w / 2, h / 2
    max_dist = ((w/2) ** 2 + (h/2) ** 2) ** 0.5
    for y in range(h):
        for x in range(w):
            dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            t = min(dist / max_dist, 1.0)
            r = int(center_color[0] * (1 - t) + edge_color[0] * t)
            g = int(center_color[1] * (1 - t) + edge_color[1] * t)
            b = int(center_color[2] * (1 - t) + edge_color[2] * t)
            pixels[x, y] = (r, g, b)
    return img


def add_bioluminescent_dots(img, count=80, max_radius=3, seed=42):
    """Scatter small glowing dots to evoke synapses/neurons in the background."""
    import random
    rng = random.Random(seed)
    w, h = img.size
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for _ in range(count):
        x = rng.randint(0, w)
        y = rng.randint(0, h)
        r = rng.randint(1, max_radius)
        # Opacity varies from 40 to 180 (0-255 alpha)
        alpha = rng.randint(40, 180)
        color = (*GLOW, alpha)
        draw.ellipse([x - r, y - r, x + r, y + r], fill=color)
    # Slight blur for glow effect
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=1.5))
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, overlay)
    return img.convert("RGB")


def draw_text_centered(draw, text, font, y_center, fill, img_width):
    """Draw text horizontally centered at a given y coordinate (text center)."""
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (img_width - text_w) / 2 - bbox[0]
    y = y_center - text_h / 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=fill)
    return text_h


# ── APP ICON ─────────────────────────────────────────────────────────────────

def make_icon(size=1024):
    """
    Generate SYNAPSE app icon at given size.
    Simple, legible at small sizes: 'SYN' text, soft glow, no border.
    """
    # Radial gradient background (darker at edges, slightly lifted in center)
    bg_center = (22, 34, 62)
    bg_edge = BG_DEEP
    img = radial_gradient((size, size), bg_center, bg_edge)
    
    # Scatter bioluminescent dots (fewer at icon sizes to avoid noise)
    dot_count = max(10, int(size / 40))
    img = add_bioluminescent_dots(img, count=dot_count, max_radius=max(1, size // 500))
    
    # Draw "SYN" centered — large, bold, sky-blue
    draw = ImageDraw.Draw(img)
    font_size = int(size * 0.42)  # 42% of icon size for the text
    try:
        font = ImageFont.truetype(FONT_PATH_BOLD, font_size)
    except OSError:
        font = ImageFont.load_default()
    
    # Draw "SYN" with soft glow (draw 3x at decreasing alpha, then main)
    glow_layers = Image.new("RGBA", img.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layers)
    
    # Calculate position
    bbox = draw.textbbox((0, 0), "SYN", font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) / 2 - bbox[0]
    y = (size - text_h) / 2 - bbox[1]
    
    # Soft glow
    glow_draw.text((x, y), "SYN", font=font, fill=(*GLOW, 60))
    glow_layers = glow_layers.filter(ImageFilter.GaussianBlur(radius=size // 50))
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, glow_layers)
    img = img.convert("RGB")
    
    # Main "SYN" text in sky-blue
    draw = ImageDraw.Draw(img)
    draw.text((x, y), "SYN", font=font, fill=SKY_BLUE)
    
    return img


# Generate icon master (1024x1024) + variants
print("Generating app icons...")
master_icon = make_icon(1024)
master_icon.save(os.path.join(OUTDIR, "icon_1024.png"), "PNG", optimize=True)
print(f"  ✓ icon_1024.png (1024×1024) — App Store / Play Store master")

# Apple iOS variants
for apple_size in [180, 167, 152, 120, 87, 80, 60, 58, 40, 29]:
    variant = master_icon.resize((apple_size, apple_size), Image.LANCZOS)
    variant.save(os.path.join(OUTDIR, f"icon_ios_{apple_size}.png"), "PNG", optimize=True)
    print(f"  ✓ icon_ios_{apple_size}.png (iOS)")

# Android variants (adaptive icon = foreground 108dp, but we ship full icons at common sizes)
for android_size, name in [(192, "xxxhdpi"), (144, "xxhdpi"), (96, "xhdpi"), (72, "hdpi"), (48, "mdpi")]:
    variant = master_icon.resize((android_size, android_size), Image.LANCZOS)
    variant.save(os.path.join(OUTDIR, f"icon_android_{name}_{android_size}.png"), "PNG", optimize=True)
    print(f"  ✓ icon_android_{name}_{android_size}.png (Android {name})")

# Favicon
for favicon_size in [512, 192, 32, 16]:
    variant = master_icon.resize((favicon_size, favicon_size), Image.LANCZOS)
    variant.save(os.path.join(OUTDIR, f"favicon_{favicon_size}.png"), "PNG", optimize=True)
    print(f"  ✓ favicon_{favicon_size}.png (web)")

print("\nIcon generation complete.\n")
