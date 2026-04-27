// Pre-launch audit Dimension M (M-2) — chained-reveal helper for the
// Neurons panel. Lives in its own file so NeuronsPanel.tsx satisfies
// react-refresh/only-export-components (component-only file).

import { NEURON_TYPES } from '../../config/neurons';
import { isNeuronUnlocked } from '../../store/purchases';
import type { NeuronType, NeuronState } from '../../types';

/**
 * Returns the neuron types that should render in the panel: every unlocked
 * type + the FIRST locked type as a "what's next" teaser. Far-future locked
 * types are hidden until their predecessor is unlocked. Cookie Clicker
 * pattern (next building visible as a motivational goal; subsequent
 * buildings hidden).
 *
 * P0 cold start: only `basica` (unlocked) + `sensorial` (locked teaser).
 * After 10 Basicas: + `piramidal` teaser (3 visible).
 * After 5 Sensorials: + `espejo` teaser (4 visible).
 * After 5 Piramidals: + `integradora` teaser (5 visible).
 * After P10 + 5 Espejos: all 5 unlocked, no extra teaser slot.
 *
 * Pure.
 */
export function visibleNeuronTypesAt(
  neurons: readonly NeuronState[],
  prestigeCount: number,
): NeuronType[] {
  const out: NeuronType[] = [];
  let teaserShown = false;
  for (const type of NEURON_TYPES) {
    if (isNeuronUnlocked({ neurons: [...neurons], prestigeCount }, type)) {
      out.push(type);
    } else if (!teaserShown) {
      out.push(type);
      teaserShown = true;
    }
  }
  return out;
}
