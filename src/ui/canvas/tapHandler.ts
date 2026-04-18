/**
 * Tap hit-testing (Sprint 2 Phase 3).
 *
 * Pure function: given a tap position and the current state, returns
 * the hit neuron (if any). Reuses renderer.ts getNeuronPosition() for
 * layout — no duplication of scatter math.
 *
 * Hit radius per neuron = max(visualRadius, CANVAS.minHitRadiusPx)
 * per CODE-4 touch-target minimums (iOS 44pt / Android 48dp ÷ 2 = 24px).
 *
 * Sprint 3 will wire this into NeuronCanvas + gameStore for the full
 * TAP-2 formula. Phase 3 Sprint 2 scope is hit-test + minimum-thought
 * floor only.
 */

import type { GameState } from '../../types/GameState';
import type { NeuronType } from '../../types';
import { CANVAS } from '../tokens';
import { getNeuronPosition } from './renderer';

export interface TapHitResult {
  hit: boolean;
  neuronIndex: number | null;
  neuronType: NeuronType | null;
}

const MISS: TapHitResult = { hit: false, neuronIndex: null, neuronType: null };

export function testHit(
  tapX: number,
  tapY: number,
  state: GameState,
  canvasWidth: number,
  canvasHeight: number,
  hitRadiusMin: number = CANVAS.minHitRadiusPx,
): TapHitResult {
  const dims = { width: canvasWidth, height: canvasHeight };
  let globalIndex = 0;
  // Track the nearest hit (shortest centre-distance) — stable with
  // overlapping scatter positions and matches "tap the thing closest
  // to my finger" intuition.
  let bestDistSq = Infinity;
  let bestResult: TapHitResult = MISS;

  for (const neuron of state.neurons) {
    if (neuron.count <= 0) continue;
    const visualRadius = CANVAS.neuronRadii[neuron.type];
    const hitRadius = Math.max(visualRadius, hitRadiusMin);
    const hitRadiusSq = hitRadius * hitRadius;
    for (let i = 0; i < neuron.count; i++) {
      const { x, y } = getNeuronPosition(globalIndex, dims);
      const dx = tapX - x;
      const dy = tapY - y;
      const distSq = dx * dx + dy * dy;
      if (distSq <= hitRadiusSq && distSq < bestDistSq) {
        bestDistSq = distSq;
        bestResult = { hit: true, neuronIndex: globalIndex, neuronType: neuron.type };
      }
      globalIndex++;
    }
  }

  return bestResult;
}
