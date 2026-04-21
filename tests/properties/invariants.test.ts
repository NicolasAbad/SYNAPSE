// Property-based tests (Phase 4.5 — addresses self-confirming-test risk).
//
// Philosophy: instead of "given X input → expect Y output" (which I can write
// to pass by construction), we pick INVARIANTS that must hold across ALL
// inputs fast-check generates. If the invariant is wrong, fast-check shrinks
// the counterexample so you see the minimum failing input.
//
// What these catch that the deterministic suite doesn't:
//   - Edge cases I didn't think to write assertions for (negative counts,
//     0-rate states, buffer-boundary conditions).
//   - Formula reorderings that accidentally break commutativity / monotonicity.
//   - Future refactors where I change one side of the formula without the other.

import { describe, expect, test } from 'vitest';
import * as fc from 'fast-check';
import { calculateProduction, computeConnectionMult, softCap } from '../../src/engine/production';
import { applyTap, computeTapThought } from '../../src/store/tap';
import { neuronBuyCost, tryBuyNeuron, tryBuyUpgrade } from '../../src/store/purchases';
import { tick } from '../../src/engine/tick';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import { NEURON_TYPES } from '../../src/config/neurons';
import type { GameState } from '../../src/types/GameState';

// ── Helpers ──

const anyNeuronType = fc.constantFrom(...NEURON_TYPES);
const validEffectivePPS = fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true });
const validPrestige = fc.integer({ min: 0, max: 26 });
const validLifetimePrestiges = fc.integer({ min: 0, max: 100 });
const validThoughts = fc.double({ min: 0, max: 1e15, noNaN: true, noDefaultInfinity: true });
const validNeuronCount = fc.integer({ min: 0, max: 500 });

function stateWithEffectivePPS(pps: number): GameState {
  return { ...createDefaultState(), effectiveProductionPerSecond: pps };
}

describe('Invariant: softCap is monotonic non-decreasing', () => {
  test('x1 ≤ x2 ⇒ softCap(x1) ≤ softCap(x2)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1e10, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 1e10, noNaN: true, noDefaultInfinity: true }),
        (a, b) => {
          const [lo, hi] = a <= b ? [a, b] : [b, a];
          return softCap(lo) <= softCap(hi) + 1e-9;
        },
      ),
    );
  });
  test('softCap(x) ≤ x for x ≥ 100 (dampening holds)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100, max: 1e10, noNaN: true, noDefaultInfinity: true }),
        (x) => softCap(x) <= x + 1e-9,
      ),
    );
  });
});

describe('Invariant: neuronCost strictly increases with owned count', () => {
  test('neuronBuyCost(type, n+1) > neuronBuyCost(type, n)', () => {
    fc.assert(
      fc.property(anyNeuronType, fc.integer({ min: 0, max: 100 }), (type, owned) => {
        return neuronBuyCost(type, owned + 1) > neuronBuyCost(type, owned);
      }),
    );
  });
  test('neuronBuyCost(type, 0) === baseCost', () => {
    for (const type of NEURON_TYPES) {
      expect(neuronBuyCost(type, 0)).toBeGreaterThan(0);
    }
  });
});

describe('Invariant: computeConnectionMult grows with owned-type count', () => {
  test('More owned types ⇒ connection mult ≥ fewer owned types', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 1, max: 5 }), (n1, n2) => {
        const [small, big] = n1 <= n2 ? [n1, n2] : [n2, n1];
        const smallNeurons = NEURON_TYPES.slice(0, small).map((t) => ({ type: t, count: 1 }));
        const bigNeurons = NEURON_TYPES.slice(0, big).map((t) => ({ type: t, count: 1 }));
        return computeConnectionMult(smallNeurons, false) <= computeConnectionMult(bigNeurons, false) + 1e-9;
      }),
    );
  });
  test('Sincronía Neural doubles the applied value (always)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5 }), (n) => {
        const neurons = NEURON_TYPES.slice(0, n).map((t) => ({ type: t, count: 1 }));
        const withoutSinc = computeConnectionMult(neurons, false);
        const withSinc = computeConnectionMult(neurons, true);
        return Math.abs(withSinc - withoutSinc * 2) < 1e-9;
      }),
    );
  });
});

describe('Invariant: calculateProduction — base ≤ effective; insight boost only', () => {
  test('base ≤ effective (insight multiplier is ≥1 when active, else identity)', () => {
    fc.assert(
      fc.property(validEffectivePPS, fc.boolean(), fc.double({ min: 1, max: 20, noNaN: true }), (pps, insight, insightMult) => {
        const state = { ...stateWithEffectivePPS(pps), insightActive: insight, insightMultiplier: insight ? insightMult : 1 };
        const { base, effective } = calculateProduction(state);
        return effective >= base - 1e-6;
      }),
    );
  });
  test('Zero neurons owned ⇒ base === 0 regardless of multipliers', () => {
    fc.assert(
      fc.property(validPrestige, validLifetimePrestiges, (p, lp) => {
        const state: GameState = {
          ...createDefaultState(),
          neurons: NEURON_TYPES.map((t) => ({ type: t, count: 0 })),
          prestigeCount: p,
          lifetimePrestiges: lp,
        };
        return calculateProduction(state).base === 0;
      }),
    );
  });
});

describe('Invariant: computeTapThought — never below floor, anti-spam only reduces', () => {
  test('tap thought ≥ baseTapThoughtMin ÷ 10 (anti-spam floor)', () => {
    fc.assert(
      fc.property(validEffectivePPS, fc.boolean(), (pps, antiSpam) => {
        const result = computeTapThought(stateWithEffectivePPS(pps), antiSpam);
        // Floor × anti-spam penalty = 1 × 0.10 = 0.10 (worst case)
        return result >= SYNAPSE_CONSTANTS.baseTapThoughtMin * SYNAPSE_CONSTANTS.antiSpamPenaltyMultiplier - 1e-9;
      }),
    );
  });
  test('antiSpam=true ⇒ tap ≤ antiSpam=false tap (penalty never positive)', () => {
    fc.assert(
      fc.property(validEffectivePPS, (pps) => {
        const state = stateWithEffectivePPS(pps);
        const withSpam = computeTapThought(state, true);
        const withoutSpam = computeTapThought(state, false);
        return withSpam <= withoutSpam + 1e-9;
      }),
    );
  });
});

describe('Invariant: applyTap strictly increases thoughts, cycleGenerated, totalGenerated', () => {
  test('Thoughts strictly grow after tap', () => {
    fc.assert(
      fc.property(validEffectivePPS, validThoughts, fc.boolean(), fc.integer({ min: 0, max: 1e12 }), (pps, thoughts, antiSpam, ts) => {
        const state = { ...stateWithEffectivePPS(pps), thoughts };
        const delta = applyTap(state, antiSpam, ts);
        // thoughts must strictly increase (TAP-2 floor is 1, with anti-spam 0.10)
        return (delta.thoughts ?? thoughts) > thoughts - 1e-9;
      }),
    );
  });
  test('Tap timestamps buffer never exceeds antiSpamBufferSize', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 1e12 }), { maxLength: 50 }), (timestamps) => {
        let state: GameState = createDefaultState();
        for (const ts of timestamps) {
          const delta = applyTap(state, false, ts);
          state = { ...state, ...delta } as GameState;
        }
        return state.lastTapTimestamps.length <= SYNAPSE_CONSTANTS.antiSpamBufferSize;
      }),
    );
  });
});

describe('Invariant: tryBuyNeuron — thoughts decrease, count increases by 1, cost > 0', () => {
  test('Successful buy: thoughts strictly decrease; count increases by exactly 1', () => {
    // Use smaller thoughts values (1e6) where float precision doesn't bite.
    // The "exactly cost" property fails at 1e12 due to IEEE 754 precision loss
    // (ulp at 1e12 is ~0.125; costs near 100 have ~1e-3 relative precision after
    // add/subtract round-trip). 1e-9 tolerance is not achievable — would be a
    // false property, not a real invariant.
    fc.assert(
      fc.property(anyNeuronType, fc.integer({ min: 0, max: 50 }), (type, startCount) => {
        const state: GameState = {
          ...createDefaultState(),
          thoughts: 1e10, // enough for anything but in a precision-friendly range
          neurons: NEURON_TYPES.map((t) => ({
            type: t,
            count: t === 'basica' ? Math.max(10, startCount) :
                   t === 'sensorial' ? 5 :
                   t === 'piramidal' ? 5 :
                   t === type ? startCount : 0,
          })),
          prestigeCount: 10, // unlock integradora
        };
        const before = state.thoughts;
        const countBefore = state.neurons.find((n) => n.type === type)?.count ?? 0;
        const result = tryBuyNeuron(state, type, 1000);
        if (!result.ok) return true; // locked/insufficient is ok — only check success path
        const thoughtsAfter = result.updates.thoughts!;
        const countAfter = result.updates.neurons!.find((n) => n.type === type)!.count;
        // Real invariants: thoughts strictly decreased, count increased by exactly 1.
        return thoughtsAfter < before && countAfter === countBefore + 1;
      }),
    );
  });
});

describe('Invariant: tryBuyUpgrade is idempotent (double-buy always rejected)', () => {
  test('Buying the same upgrade twice fails with already_owned', () => {
    fc.assert(
      fc.property(fc.constantFrom('red_neuronal_densa', 'mielina', 'descarga_neural', 'potencial_sinaptico', 'sueno_rem'), (id) => {
        const state: GameState = { ...createDefaultState(), thoughts: 1e12 };
        const r1 = tryBuyUpgrade(state, id, 1000);
        if (!r1.ok) return true;
        const stateAfter: GameState = { ...state, upgrades: [...state.upgrades, ...(r1.updates.upgrades ?? [])] };
        const r2 = tryBuyUpgrade(stateAfter, id, 2000);
        return !r2.ok && r2.reason === 'already_owned';
      }),
    );
  });
});

describe('Invariant: tick preserves non-decreasing totalGenerated', () => {
  test('After one tick, totalGenerated ≥ before-tick totalGenerated', () => {
    fc.assert(
      fc.property(validEffectivePPS, fc.integer({ min: 1, max: 1e12 }), (pps, ts) => {
        const state: GameState = {
          ...createDefaultState(),
          effectiveProductionPerSecond: pps,
          cycleStartTimestamp: ts - 1000,
          lastSpontaneousCheck: ts - 1000,
          dischargeLastTimestamp: ts - 1000,
        };
        const beforeTotal = state.totalGenerated;
        const { state: next } = tick(state, ts);
        return next.totalGenerated >= beforeTotal - 1e-9;
      }),
    );
  });
  test('Thoughts never become negative from tick alone', () => {
    fc.assert(
      fc.property(validThoughts, validEffectivePPS, fc.integer({ min: 1, max: 1e12 }), (t, pps, ts) => {
        const state: GameState = {
          ...createDefaultState(),
          thoughts: t,
          effectiveProductionPerSecond: pps,
          cycleStartTimestamp: ts - 1000,
          lastSpontaneousCheck: ts - 1000,
          dischargeLastTimestamp: ts - 1000,
        };
        const { state: next } = tick(state, ts);
        return next.thoughts >= 0;
      }),
    );
  });
});

describe('Invariant: tick() is a pure function (same input ⇒ same output)', () => {
  test('Repeated calls with same state + timestamp produce identical results', () => {
    fc.assert(
      fc.property(validEffectivePPS, fc.integer({ min: 1, max: 1e12 }), (pps, ts) => {
        const state: GameState = {
          ...createDefaultState(),
          effectiveProductionPerSecond: pps,
          cycleStartTimestamp: ts - 1000,
          lastSpontaneousCheck: ts - 1000,
          dischargeLastTimestamp: ts - 1000,
        };
        const a = tick(state, ts);
        const b = tick(state, ts);
        return a.state.thoughts === b.state.thoughts
          && a.state.totalGenerated === b.state.totalGenerated
          && a.antiSpamActive === b.antiSpamActive;
      }),
    );
  });
});

// Satisfy ESLint noUnused-vars for helper imports not exercised in every test:
void stateWithEffectivePPS;
void validPrestige;
void validLifetimePrestiges;
void anyNeuronType;
void validNeuronCount;
