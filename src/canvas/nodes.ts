import type { GameState, NeuronType, NeuronState } from '@/types';
import { getSkinPalette, type NeuronSkinPalette } from '@/config/colorPalettes';
import type { ThemeConfig } from './themes';

export type SkinConfig = NeuronSkinPalette;

export interface PlacedNode {
  type: NeuronType;
  x: number;
  y: number;
  radius: number;
}

const MAX_VISIBLE = 80;
const TYPE_RADIUS: Record<NeuronType, number> = {
  basica: 8,
  sensorial: 9,
  piramidal: 12,
  espejo: 10,
  integradora: 11,
};

export function getActiveSkin(state: GameState): SkinConfig {
  return getSkinPalette(state.activeNeuronSkin);
}

function hash(seed: number): number {
  let x = (seed | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return ((x ^ (x >>> 16)) >>> 0) / 0xffffffff;
}

export function layoutNodes(neurons: NeuronState[], width: number, height: number): PlacedNode[] {
  const placed: PlacedNode[] = [];
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) * 0.38;
  let idx = 0;
  for (const n of neurons) {
    if (n.owned <= 0) continue;
    for (let i = 0; i < n.owned && placed.length < MAX_VISIBLE; i++) {
      const seed = idx * 1013 + i * 17;
      const angle = hash(seed) * Math.PI * 2;
      const dist = Math.sqrt(hash(seed + 1)) * maxR;
      placed.push({
        type: n.type,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        radius: TYPE_RADIUS[n.type],
      });
    }
    idx++;
  }
  return placed;
}

export function drawNeurons(
  ctx: CanvasRenderingContext2D,
  nodes: PlacedNode[],
  theme: ThemeConfig,
  skin: SkinConfig,
  time: number,
): void {
  ctx.save();
  for (const node of nodes) {
    const color = skin.colors[node.type];
    const pulse = 1 + 0.2 * Math.sin(time / 500 + node.x * 0.01);
    ctx.shadowBlur = theme.nodeGlow.blur * pulse;
    ctx.shadowColor = color;
    ctx.fillStyle = color + '40';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
