// Sprint 5 Phase 5.6 — Mutation engine tests.
//
// Covers:
//   - mutationSeed deterministic
//   - getMutationOptions: 3 baseline; +N with archetype/genius/pattern bonus;
//     MUT-2 lastMutationId filter; MUT-3 first-cycle filter; MUT-4 weekly
//     challenge swap.
//   - Per-effect helpers identity vs active-mutation values.

import { describe, test, expect } from 'vitest';
import { createDefaultState } from '../../src/store/gameStore';
import {
  mutationSeed,
  getMutationOptions,
  mutationProdMult,
  mutationDischargeMult,
  mutationChargeIntervalMs,
  mutationMaxChargesOverride,
  mutationNeuronCostMod,
  mutationUpgradeCostMod,
} from '../../src/engine/mutations';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';
import type { MutationActive } from '../../src/types';

function freshState(overrides: Partial<GameState> = {}): GameState {
  // createDefaultState() returns a GameState — but our test imports it from
  // gameStore (mixed with action defs). Strip non-data fields.
  const raw = createDefaultState() as unknown as Record<string, unknown>;
  for (const k of ['activeTab', 'activeMindSubtab', 'undoToast', 'antiSpamActive']) delete raw[k];
  return { ...(raw as unknown as GameState), ...overrides };
}

describe('mutationSeed', () => {
  test('deterministic for same (timestamp, prestigeCount)', () => {
    expect(mutationSeed(1_000, 0)).toBe(mutationSeed(1_000, 0));
    expect(mutationSeed(1_000, 1)).not.toBe(mutationSeed(1_000, 0));
    expect(mutationSeed(2_000, 0)).not.toBe(mutationSeed(1_000, 0));
  });
});

describe('getMutationOptions — pool draw + filters', () => {
  test('returns mutationOptionsPerCycle baseline (3)', () => {
    const s = freshState({ prestigeCount: 7, cycleStartTimestamp: 1_000_000 });
    const opts = getMutationOptions(s);
    expect(opts).toHaveLength(SYNAPSE_CONSTANTS.mutationOptionsPerCycle);
  });

  test('Creativa archetype adds +1 option', () => {
    const s = freshState({ prestigeCount: 7, cycleStartTimestamp: 1_000_000 });
    const opts = getMutationOptions(s, { creativaArchetype: true });
    expect(opts).toHaveLength(SYNAPSE_CONSTANTS.mutationOptionsPerCycle + SYNAPSE_CONSTANTS.creativaMutationBonusOptions);
  });

  test('Genius Pass adds +1 option', () => {
    const s = freshState({ prestigeCount: 7, cycleStartTimestamp: 1_000_000 });
    const opts = getMutationOptions(s, { geniusPass: true });
    expect(opts).toHaveLength(SYNAPSE_CONSTANTS.mutationOptionsPerCycle + SYNAPSE_CONSTANTS.geniusPassMutationBonusOptions);
  });

  test('Pattern Tree Node 48 B adds patternBonusOptions', () => {
    const s = freshState({ prestigeCount: 7, cycleStartTimestamp: 1_000_000 });
    const opts = getMutationOptions(s, { patternBonusOptions: 1 });
    expect(opts).toHaveLength(SYNAPSE_CONSTANTS.mutationOptionsPerCycle + 1);
  });

  test('MUT-2 deterministic — same seed → same options', () => {
    const s = freshState({ prestigeCount: 7, cycleStartTimestamp: 1_000_000 });
    const a = getMutationOptions(s);
    const b = getMutationOptions(s);
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id));
  });

  test('MUT-2 lastMutationId filter — last cycle\'s mutation excluded', () => {
    const lastId = 'crescendo';
    const s = freshState({
      prestigeCount: 7,
      cycleStartTimestamp: 1_000_000,
      lastCycleConfig: { polarity: '', mutation: lastId, pathway: '', upgrades: [] },
    });
    const opts = getMutationOptions(s);
    expect(opts.find((m) => m.id === lastId)).toBeUndefined();
  });

  test('MUT-3 — at prestigeCount=0, Déjà Vu and Neuroplasticidad filtered out', () => {
    const s = freshState({ prestigeCount: 0, cycleStartTimestamp: 1_000_000 });
    // Draw a large pool to surface filter — request +12 to draw most
    const opts = getMutationOptions(s, { patternBonusOptions: 12 });
    expect(opts.find((m) => m.id === 'deja_vu')).toBeUndefined();
    expect(opts.find((m) => m.id === 'neuroplasticidad')).toBeUndefined();
  });

  test('MUT-3 — at prestigeCount=1, Déjà Vu and Neuroplasticidad CAN appear', () => {
    const s = freshState({ prestigeCount: 1, cycleStartTimestamp: 1_000_000 });
    const opts = getMutationOptions(s, { patternBonusOptions: 12 });
    expect(opts.length).toBeGreaterThanOrEqual(13);
    // Both are now eligible — at least one should appear in a 13-card draw.
    const hasDejaVu = opts.some((m) => m.id === 'deja_vu');
    const hasNeuro = opts.some((m) => m.id === 'neuroplasticidad');
    expect(hasDejaVu || hasNeuro).toBe(true);
  });
});

describe('Per-mutation effect helpers', () => {
  function withMutation(id: string): GameState {
    const m: MutationActive = { id };
    return freshState({ currentMutation: m });
  }

  test('mutationProdMult — identity when no mutation', () => {
    expect(mutationProdMult(freshState())).toBe(1);
  });
  test('mutationProdMult — Eficiencia Neural ×0.75', () => {
    expect(mutationProdMult(withMutation('eficiencia_neural'))).toBe(0.75);
  });
  test('mutationProdMult — Hiperestimulación ×2', () => {
    expect(mutationProdMult(withMutation('hiperestimulacion'))).toBe(2);
  });

  test('mutationDischargeMult — identity when no mutation', () => {
    expect(mutationDischargeMult(freshState())).toBe(1);
  });
  test('mutationDischargeMult — Disparo Concentrado ×3', () => {
    expect(mutationDischargeMult(withMutation('disparo_concentrado'))).toBe(3);
  });
  test('mutationDischargeMult — Descarga Rápida ×0.6', () => {
    expect(mutationDischargeMult(withMutation('descarga_rapida'))).toBe(0.6);
  });

  test('mutationChargeIntervalMs — Descarga Rápida overrides to 12 min', () => {
    expect(mutationChargeIntervalMs(withMutation('descarga_rapida'), 999_999)).toBe(12 * 60_000);
  });
  test('mutationChargeIntervalMs — passes through baseMs without mutation', () => {
    expect(mutationChargeIntervalMs(freshState(), 12345)).toBe(12345);
  });

  test('mutationMaxChargesOverride — Disparo Concentrado caps at 1', () => {
    expect(mutationMaxChargesOverride(withMutation('disparo_concentrado'))).toBe(1);
  });
  test('mutationMaxChargesOverride — null when no override', () => {
    expect(mutationMaxChargesOverride(freshState())).toBeNull();
    expect(mutationMaxChargesOverride(withMutation('hiperestimulacion'))).toBeNull();
  });

  test('mutationNeuronCostMod — Eficiencia Neural ×0.6', () => {
    expect(mutationNeuronCostMod(withMutation('eficiencia_neural'))).toBe(0.6);
  });
  test('mutationNeuronCostMod — identity for non-cost mutations', () => {
    expect(mutationNeuronCostMod(withMutation('hiperestimulacion'))).toBe(1);
  });

  test('mutationUpgradeCostMod — Neuroplasticidad ×0.5', () => {
    expect(mutationUpgradeCostMod(withMutation('neuroplasticidad'))).toBe(0.5);
  });
  test('mutationUpgradeCostMod — Déjà Vu ×2.0', () => {
    expect(mutationUpgradeCostMod(withMutation('deja_vu'))).toBe(2);
  });
});
