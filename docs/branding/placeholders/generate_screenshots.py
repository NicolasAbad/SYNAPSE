"""
SYNAPSE — Marketing screenshot generator.
Creates 5 placeholder screenshots for App Store (iPhone 15 Pro Max: 1290x2796)
and Play Store (equivalent resolution).
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ── Design tokens ───────────────────────────────────────────────────────────
BG_DEEP = (10, 14, 26)
BG_MID  = (18, 28, 54)
SKY_BLUE = (74, 159, 255)
GLOW = (123, 212, 255)
TEXT_DIM = (170, 195, 230)
TEXT_MUTED = (110, 140, 180)

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG  = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

OUTDIR = "/home/claude/branding"

# iPhone 15 Pro Max dimensions (App Store required)
SCREEN_W = 1290
SCREEN_H = 2796


def radial_gradient(size, center_color, edge_color):
    """Fast-ish radial gradient using numpy-free PIL."""
    w, h = size
    img = Image.new("RGB", (w, h), edge_color)
    pixels = img.load()
    cx, cy = w / 2, h * 0.35  # Center gradient slightly above middle
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


def add_biolum_particles(img, count=120, seed=42):
    """Add scattered glowing dots across the image."""
    import random
    rng = random.Random(seed)
    w, h = img.size
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for _ in range(count):
        x = rng.randint(0, w)
        y = rng.randint(0, h)
        r = rng.randint(1, 4)
        alpha = rng.randint(50, 200)
        draw.ellipse([x - r, y - r, x + r, y + r], fill=(*GLOW, alpha))
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=1.8))
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, overlay)
    return img.convert("RGB")


def draw_wrapped_text(draw, text, font, x, y, max_width, fill, line_spacing=1.2):
    """Draw text with word wrapping. Returns total height used."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = current + (" " if current else "") + word
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    
    bbox = draw.textbbox((0, 0), "Ag", font=font)
    line_h = (bbox[3] - bbox[1]) * line_spacing
    
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        line_w = bbox[2] - bbox[0]
        line_x = x - line_w / 2  # Center horizontally around x
        draw.text((line_x, y + i * line_h), line, font=font, fill=fill)
    
    return len(lines) * line_h


def draw_centered_single_line(draw, text, font, y, fill, canvas_width):
    """Draw a single line of text centered horizontally at y."""
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    x = (canvas_width - text_w) / 2 - bbox[0]
    draw.text((x, y), text, font=font, fill=fill)
    return bbox[3] - bbox[1]


def make_screenshot(index, headline, subhead, tagline=None, brand="SYNAPSE"):
    """
    Generate one marketing screenshot.
    
    Layout (top to bottom):
    - Top 10%: small "SYNAPSE" brand mark
    - 30-55%: large headline (wrapped)
    - 60-70%: subhead (smaller)
    - 80-90%: tagline (optional, muted)
    - Bottom: subtle particles / glow
    """
    img = radial_gradient((SCREEN_W, SCREEN_H), BG_MID, BG_DEEP)
    img = add_biolum_particles(img, count=180, seed=42 + index)
    
    draw = ImageDraw.Draw(img)
    
    # Fonts
    font_brand = ImageFont.truetype(FONT_BOLD, 60)
    font_headline = ImageFont.truetype(FONT_BOLD, 130)
    font_subhead = ImageFont.truetype(FONT_REG, 72)
    font_tagline = ImageFont.truetype(FONT_REG, 48)
    
    # ── Brand mark at top ──
    brand_y = int(SCREEN_H * 0.09)
    draw_centered_single_line(draw, brand, font_brand, brand_y, SKY_BLUE, SCREEN_W)
    
    # Tiny underline beneath brand
    underline_y = brand_y + 90
    bbox = draw.textbbox((0, 0), brand, font=font_brand)
    brand_w = bbox[2] - bbox[0]
    ux1 = (SCREEN_W - brand_w * 0.4) / 2
    ux2 = (SCREEN_W + brand_w * 0.4) / 2
    draw.line([(ux1, underline_y), (ux2, underline_y)], fill=(*SKY_BLUE, 180), width=3)
    
    # ── Headline (center area) ──
    cx = SCREEN_W / 2
    headline_y = int(SCREEN_H * 0.32)
    
    # Glow layer for headline
    glow_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    draw_wrapped_text(glow_draw, headline, font_headline, cx, headline_y,
                      max_width=int(SCREEN_W * 0.85), fill=(*GLOW, 60), line_spacing=1.15)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=12))
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, glow_layer)
    img = img.convert("RGB")
    draw = ImageDraw.Draw(img)
    
    # Main headline text
    headline_h = draw_wrapped_text(draw, headline, font_headline, cx, headline_y,
                                    max_width=int(SCREEN_W * 0.85), fill=SKY_BLUE,
                                    line_spacing=1.15)
    
    # ── Subhead below headline ──
    subhead_y = int(headline_y + headline_h + 80)
    draw_wrapped_text(draw, subhead, font_subhead, cx, subhead_y,
                      max_width=int(SCREEN_W * 0.80), fill=TEXT_DIM, line_spacing=1.3)
    
    # ── Tagline at bottom ──
    if tagline:
        tagline_y = int(SCREEN_H * 0.86)
        draw_wrapped_text(draw, tagline, font_tagline, cx, tagline_y,
                          max_width=int(SCREEN_W * 0.80), fill=TEXT_MUTED, line_spacing=1.3)
    
    # ── "Coming soon" style decorative line at very bottom ──
    bar_y = int(SCREEN_H * 0.95)
    bar_w = 160
    bx1 = (SCREEN_W - bar_w) / 2
    bx2 = (SCREEN_W + bar_w) / 2
    draw.line([(bx1, bar_y), (bx2, bar_y)], fill=(*SKY_BLUE, 150), width=4)
    
    return img


# ── 5 Screenshots (simple, text-only placeholder) ──
screenshots = [
    {
        "headline": "Evolve your\nneural network",
        "subhead": "A mobile idle game about awakening consciousness, one synapse at a time.",
        "tagline": "PLACEHOLDER — final art in Sprint 10-12",
    },
    {
        "headline": "From one neuron\nto cosmic mind",
        "subhead": "Grow, prestige, transcend. Three Runs of escalating depth.",
        "tagline": "PLACEHOLDER — final art in Sprint 10-12",
    },
    {
        "headline": "Master mental\nstates & patterns",
        "subhead": "Flow, Eureka, Hyperfocus. Discover 4 Resonant Patterns hidden in your choices.",
        "tagline": "PLACEHOLDER — final art in Sprint 10-12",
    },
    {
        "headline": "4 endings.\nInfinite depth.",
        "subhead": "Analytical, Empathic, Creative — or the secret Singularity.",
        "tagline": "PLACEHOLDER — final art in Sprint 10-12",
    },
    {
        "headline": "Coming soon\nto iOS & Android",
        "subhead": "Idle, by design. Active, by choice. Pre-register now.",
        "tagline": "PLACEHOLDER — final art in Sprint 10-12",
    },
]

print("Generating marketing screenshots...")
for i, cfg in enumerate(screenshots, start=1):
    img = make_screenshot(i, cfg["headline"], cfg["subhead"], cfg.get("tagline"))
    filename = f"screenshot_{i}_iphone_15_pro_max.png"
    path = os.path.join(OUTDIR, filename)
    img.save(path, "PNG", optimize=True)
    print(f"  ✓ {filename} ({SCREEN_W}×{SCREEN_H})")

# Android Play Store uses 1080x1920 phone, 1920x1080 landscape, or 1080x1920 portrait
# Generate matching Android set
ANDROID_W = 1080
ANDROID_H = 1920

def make_screenshot_android(index, headline, subhead, tagline=None, brand="SYNAPSE"):
    """Same logic as iOS but Android dimensions — regenerate (re-rasterize for quality)."""
    import random
    # Just scale the iOS version down for Android
    # (Acceptable for placeholders; Sprint 10-12 produces native renders per platform)
    src = make_screenshot(index, headline, subhead, tagline, brand)
    return src.resize((ANDROID_W, ANDROID_H), Image.LANCZOS)


print("\nGenerating Android Play Store screenshots...")
for i, cfg in enumerate(screenshots, start=1):
    img = make_screenshot_android(i, cfg["headline"], cfg["subhead"], cfg.get("tagline"))
    filename = f"screenshot_{i}_android_phone.png"
    path = os.path.join(OUTDIR, filename)
    img.save(path, "PNG", optimize=True)
    print(f"  ✓ {filename} ({ANDROID_W}×{ANDROID_H})")

print("\nScreenshot generation complete.\n")
