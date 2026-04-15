import type { GameState } from '@/types';
import type { ThemeConfig } from './themes';
import type { SkinConfig, PlacedNode } from './nodes';

export type GlowPackId = 'firefly' | 'halo' | 'plasma';

export interface GlowPackConfig {
  id: GlowPackId;
  drawConnection: (
    ctx: CanvasRenderingContext2D,
    a: PlacedNode,
    b: PlacedNode,
    color: string,
    width: number,
    time: number,
  ) => void;
}

const GLOW_REGISTRY: Record<string, GlowPackConfig> = {
  // TODO Sprint 9: firefly orbits, halo rings, plasma jagged arcs
};

export function getActiveGlowPack(state: GameState): GlowPackConfig | null {
  if (!state.activeGlowPack) return null;
  return GLOW_REGISTRY[state.activeGlowPack] ?? null;
}

function drawDefaultLine(
  ctx: CanvasRenderingContext2D,
  a: PlacedNode,
  b: PlacedNode,
  color: string,
  width: number,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

export function drawConnections(
  ctx: CanvasRenderingContext2D,
  nodes: PlacedNode[],
  theme: ThemeConfig,
  skin: SkinConfig,
  glow: GlowPackConfig | null,
  time: number,
): void {
  if (nodes.length < 2) return;
  const color = theme.connectionStyle.color ?? skin.connections;
  const width = theme.connectionStyle.width;
  ctx.save();
  ctx.shadowBlur = 0;
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    const b = nodes[(i + 1) % nodes.length];
    if (glow) glow.drawConnection(ctx, a, b, color, width, time);
    else drawDefaultLine(ctx, a, b, color, width);
  }
  ctx.restore();
}
