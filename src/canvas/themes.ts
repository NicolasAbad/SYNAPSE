import type { GameState, EraTheme } from '@/types';

export interface ThemeConfig {
  id: string;
  background: (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => void;
  particleEffect: (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => void;
  nodeGlow: { blur: number; tintShift?: { r: number; g: number; b: number } };
  connectionStyle: { width: number; color?: string };
}

function paintSolid(color: string) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
  };
}

const noop = (): void => {};

const BIOLUMINESCENT: ThemeConfig = {
  id: 'bioluminescent',
  background: paintSolid('#03050C'),
  particleEffect: (ctx, w, h, time) => {
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#80C0FF';
    for (let i = 0; i < 12; i++) {
      const seed = i * 37;
      const x = (seed * 53) % w;
      const y = (h - ((time * 0.5 + seed * 17) % h) + h) % h;
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },
  nodeGlow: { blur: 12 },
  connectionStyle: { width: 1 },
};

const DIGITAL: ThemeConfig = {
  id: 'digital',
  background: paintSolid('#060A14'),
  particleEffect: (ctx, w, h, time) => {
    ctx.save();
    ctx.strokeStyle = '#1A2A4A15';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    const scanY = ((time / 8000) * h) % h;
    ctx.strokeStyle = '#40D0D020';
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(w, scanY);
    ctx.stroke();
    ctx.restore();
  },
  nodeGlow: { blur: 14 },
  connectionStyle: { width: 1, color: '#40D0D018' },
};

const COSMIC: ThemeConfig = {
  id: 'cosmic',
  background: (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 1.2);
    grad.addColorStop(0, '#0A0520');
    grad.addColorStop(1, '#030308');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  },
  particleEffect: (ctx, w, h, time) => {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 30; i++) {
      const seed = i * 91;
      const x = (seed * 13) % w;
      const y = (seed * 29) % h;
      const tw = 0.1 + 0.2 * Math.abs(Math.sin(time / 1000 + i));
      ctx.globalAlpha = tw;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },
  nodeGlow: { blur: 20 },
  connectionStyle: { width: 1.5, color: '#8B7FE818' },
};

const ERA_THEMES: Record<EraTheme, ThemeConfig> = {
  bioluminescent: BIOLUMINESCENT,
  digital: DIGITAL,
  cosmic: COSMIC,
};

const COSMETIC_REGISTRY: Record<string, ThemeConfig> = {
  // TODO Sprint 9: aurora, deep_ocean, nebula, circuit, neon_pulse, genius_gold
};

export function eraThemeForPrestige(prestige: number): EraTheme {
  if (prestige >= 19) return 'cosmic';
  if (prestige >= 10) return 'digital';
  return 'bioluminescent';
}

export function getActiveTheme(state: GameState): ThemeConfig {
  const cosmetic = state.activeCanvasTheme;
  if (cosmetic && COSMETIC_REGISTRY[cosmetic]) return COSMETIC_REGISTRY[cosmetic];
  return ERA_THEMES[eraThemeForPrestige(state.prestigeCount)];
}

export const __noop = noop;
