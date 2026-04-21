// Sprint 4c Phase 4c.5 integration — end-to-end Polarity flow.
// Exercises the full pipeline: handlePrestige → lastCycleConfig snapshot →
// next-cycle setPolarity → production + discharge modifiers reflect choice.
// Plus a multi-prestige chain verifying POLAR-1 persistence across cycles.

import { describe, expect, test } from 'vitest';
import { handlePrestige } from '../../src/engine/prestige';
import { calculateProduction } from '../../src/engine/production';
import { computeDischargeMultiplier, effectiveCascadeThreshold } from '../../src/engine/discharge';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import { createDefaultState } from '../../src/store/gameStore';
import type { GameState } from '../../src/types/GameState';

const START = 1_000_000;

function stateWithNeurons(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createDefaultState(),
    neurons: [
      { type: 'basica', count: 10 },
      { type: 'sensorial', count: 0 },
      { type: 'piramidal', count: 0 },
      { type: 'espejo', count: 0 },
      { type: 'integradora', count: 0 },
    ],
    ...overrides,
  };
}

describe('Sprint 4c integration — P0 → P3 → Polarity pick → production reflects choice', () => {
  test('simulated 3 prestiges; P3 cycle with Excitatory yields +10% production', () => {
    // Walk from P0 through 3 prestiges using handlePrestige. Each cycle we
    // inject a "currentPolarity" before prestige to trigger lastCycleConfig
    // snapshotting — but for this test we just care that after reaching P3
    // and setting currentPolarity='excitatory', production reflects +10%.
    let s: GameState = createDefaultState();
    for (let i = 0; i < 3; i++) {
      s = handlePrestige(s, START + i * 60_000).state;
    }
    expect(s.prestigeCount).toBe(3);
    expect(s.isTutorialCycle).toBe(false);
    // Add neurons + set excitatory polarity for the P3 cycle.
    s.neurons = stateWithNeurons().neurons;
    const noPolarity: GameState = { ...s, currentPolarity: null };
    const excit: GameState = { ...s, currentPolarity: 'excitatory' };
    const baseProd = calculateProduction(noPolarity).base;
    const excitProd = calculateProduction(excit).base;
    expect(excitProd / baseProd).toBeCloseTo(SYNAPSE_CONSTANTS.excitatoryProdMult, 6);
  });

  test('Discharge multiplier reflects Polarity + Node 36 B (when both active)', () => {
    // Deep state: P5, owns cascada_profunda-style upgrades off, Node 36 B
    // chosen, inhibitory polarity. Verify compounded mult.
    const s: GameState = {
      ...stateWithNeurons(),
      prestigeCount: 5,
      isTutorialCycle: false,
      currentPolarity: 'inhibitory',
      patternDecisions: { 36: 'B' },
    };
    const baseline = computeDischargeMultiplier(
      { ...s, currentPolarity: null, patternDecisions: {} },
      false,
    );
    const combined = computeDischargeMultiplier(s, false);
    // Expected ratio: inhibitory 1.30 × Node 36 B 1.10 = 1.43.
    expect(combined / baseline).toBeCloseTo(
      SYNAPSE_CONSTANTS.inhibitoryDischargeMult * 1.10, // CONST-OK: mirrors PATTERN_DECISIONS[36].B value for audit
      4,
    );
  });

  test('Inhibitory + Node 36 A stack picks MIN threshold (Option A spec resolution)', () => {
    const inhibOnly: GameState = { ...createDefaultState(), currentPolarity: 'inhibitory' };
    const node36AOnly: GameState = { ...createDefaultState(), patternDecisions: { 36: 'A' } };
    const both: GameState = { ...inhibOnly, patternDecisions: { 36: 'A' } };
    expect(effectiveCascadeThreshold(inhibOnly)).toBeCloseTo(0.675, 6);
    expect(effectiveCascadeThreshold(node36AOnly)).toBe(0.65);
    expect(effectiveCascadeThreshold(both)).toBe(0.65); // MIN(0.675, 0.65)
  });
});

describe('Sprint 4c integration — POLAR-1 persistence across multi-prestige', () => {
  test('lastCycleConfig snapshots each cycle; survives prestige RESETs', () => {
    let s: GameState = createDefaultState();
    s = handlePrestige(s, START + 1 * 60_000).state; // P0→P1 (pre-Polarity)
    expect(s.lastCycleConfig?.polarity).toBe(''); // currentPolarity was null
    s = { ...s, currentPolarity: 'excitatory' }; // player picks during P1 cycle
    s = handlePrestige(s, START + 2 * 60_000).state; // P1→P2
    expect(s.lastCycleConfig?.polarity).toBe('excitatory');
    // currentPolarity itself RESETs to null each cycle — only lastCycleConfig
    // preserves the choice for next cycle's SAME AS LAST.
    expect(s.currentPolarity).toBeNull();
    s = { ...s, currentPolarity: 'inhibitory' };
    s = handlePrestige(s, START + 3 * 60_000).state; // P2→P3
    expect(s.lastCycleConfig?.polarity).toBe('inhibitory');
  });

  test('5-prestige chain: lastCycleConfig.polarity reflects most recent cycle only', () => {
    let s: GameState = createDefaultState();
    const choices: ('excitatory' | 'inhibitory' | null)[] = [
      null, 'excitatory', 'inhibitory', 'excitatory', 'inhibitory',
    ];
    for (let i = 0; i < choices.length; i++) {
      s = { ...s, currentPolarity: choices[i] };
      s = handlePrestige(s, START + (i + 1) * 60_000).state;
    }
    // Final snapshot reflects the 5th (last) cycle's choice.
    expect(s.lastCycleConfig?.polarity).toBe('inhibitory');
    expect(s.prestigeCount).toBe(5);
  });
});

describe('Sprint 4c integration — Polarity flip within a single cycle', () => {
  test('switching polarity mid-cycle updates production immediately', () => {
    const s: GameState = { ...stateWithNeurons(), prestigeCount: 3 };
    const excit = calculateProduction({ ...s, currentPolarity: 'excitatory' }).base;
    const inhib = calculateProduction({ ...s, currentPolarity: 'inhibitory' }).base;
    // Ratio matches constants — excit/inhib = 1.10 / 0.94.
    expect(excit / inhib).toBeCloseTo(
      SYNAPSE_CONSTANTS.excitatoryProdMult / SYNAPSE_CONSTANTS.inhibitoryProdMult,
      6,
    );
  });
});
