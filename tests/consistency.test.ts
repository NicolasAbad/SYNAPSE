/**
 * tests/consistency.test.ts
 *
 * Catches silent divergence between documentation (docs/GDD.md) and code (src/).
 * Un-skipped in Sprint 1 Phase 8 for everything whose dependencies exist now;
 * BLOCKED-SPRINT-X markers indicate tests deferred until that sprint ships
 * its exports. Runs on every commit via scripts/check-invention.sh Gate 4.
 *
 * When a GDD value LEGITIMATELY changes, update all four places:
 *   1. This test (the assertion)
 *   2. src/config/constants.ts (the value)
 *   3. docs/GDD.md §N (the spec)
 *   4. docs/PROGRESS.md (the change + rationale)
 *
 * NEVER weaken an assertion to make a failing test pass. If the test fails,
 * the code diverged from the doc — fix the code, not the test.
 */

import { describe, expect, test } from 'vitest';
import { SYNAPSE_CONSTANTS } from '../src/config/constants';
import { createDefaultState } from '../src/store/gameStore';
import {
  calculateCurrentThreshold,
  calculateThreshold,
  softCap,
} from '../src/engine/production';
import { hash, mulberry32, seededRandom } from '../src/engine/rng';
import { tick } from '../src/engine/tick';
import { NEURON_CONFIG, NEURON_TYPES, neuronCost } from '../src/config/neurons';
import { UPGRADES } from '../src/config/upgrades';
import { NODE_36_TIER_2_MIN_PRESTIGE, PATTERN_DECISIONS } from '../src/config/patterns';
import {
  PRESTIGE_LIFETIME_FIELDS,
  PRESTIGE_PRESERVE_FIELDS,
  PRESTIGE_RESET,
  PRESTIGE_RESET_FIELDS,
  PRESTIGE_UPDATE_FIELDS,
} from '../src/config/prestige';
import type { GameState } from '../src/types/GameState';
import type { UpgradeCategory } from '../src/types';

/**
 * Rule coverage matrix (second audit Batches 1-5 + Sprint 1 Phase 8 un-skip):
 * - AUTOMATED HERE: CORE-10, TUTOR-2, THRES-1, RNG-1, TICK-1 (partial — steps 3/4/5),
 *   INIT-1, ECO-1, constant values per §31, CODE-2 file-size invariant, BUG-E
 *   productionPerSecond removal, POSTLAUNCH boundary.
 * - AUTOMATED IN tests/engine|store/ (not here): mulberry32/hash snapshots,
 *   full tick behavior + ordering, store actions, save round-trip.
 * - BLOCKED-SPRINT-X (skipped below with marker): achievements, mutations,
 *   archetypes, pathways, upgrades, resonance, RPs, mental states, spontaneous
 *   events, Era 3 events, micro-challenges, weekly challenges, narrative,
 *   analytics events, and PRESTIGE_RESET constant assertions (Sprint 4a owns
 *   the PRESTIGE exports).
 * - MANUAL (tracked in PROGRESS.md, no automated test): SCHED-1 (timeline).
 * - DEFERRED to Sprint 11a: ALL_RULE_IDS grep coverage, snapshot validation Gate 5.
 */

describe('Consistency: GDD ↔ constants.ts invariants', () => {
  test('tutorialThreshold is a positive number > 10_000 (Sprint 8c-tuning iterates this; GDD §31 pending Nico update)', () => {
    // Sprint 8c-tuning: exact value fluctuates during gradient-descent tuning.
    // TUTOR-2 target is 7-9 min @ tap=2; the constant is tuned to hit that.
    // Consistency check: positive, above obvious placeholder, below obvious typo.
    expect(SYNAPSE_CONSTANTS.tutorialThreshold).toBeGreaterThan(10_000);
    expect(SYNAPSE_CONSTANTS.tutorialThreshold).toBeLessThan(10_000_000);
  });

  test('tutorialDischargeMult = 3.0 (GDD §31)', () => {
    expect(SYNAPSE_CONSTANTS.tutorialDischargeMult).toBe(3.0);
  });

  test('costMult = 1.28 (GDD §31)', () => {
    expect(SYNAPSE_CONSTANTS.costMult).toBe(1.28);
  });

  test('softCapExponent = 0.72 (GDD §31)', () => {
    expect(SYNAPSE_CONSTANTS.softCapExponent).toBe(0.72);
  });

  test('connectionMultPerPair = 0.05 (GDD §5)', () => {
    expect(SYNAPSE_CONSTANTS.connectionMultPerPair).toBe(0.05);
  });

  test('sincroniaNeuralMult = 2 (GDD §24 sincronia_neural literal doubling)', () => {
    expect(SYNAPSE_CONSTANTS.sincroniaNeuralMult).toBe(2);
  });

  test('cascadeThreshold = 0.75 (GDD §31)', () => {
    expect(SYNAPSE_CONSTANTS.cascadeThreshold).toBe(0.75);
  });

  test('cascadeMultiplier = 2.5 (GDD §31)', () => {
    expect(SYNAPSE_CONSTANTS.cascadeMultiplier).toBe(2.5);
  });

  test('momentumBonusSeconds = 30 (GDD §31, CORE-8)', () => {
    expect(SYNAPSE_CONSTANTS.momentumBonusSeconds).toBe(30);
  });

  test('maxMomentumPct = 0.10 (GDD §31, CORE-8 cap, 2nd audit 4A-2)', () => {
    expect(SYNAPSE_CONSTANTS.maxMomentumPct).toBe(0.1);
  });

  test('baseOfflineCapHours = 4 (GDD §19, OFFLINE-6)', () => {
    expect(SYNAPSE_CONSTANTS.baseOfflineCapHours).toBe(4);
  });

  test('maxOfflineHours = 16 (GDD §19, OFFLINE-6)', () => {
    expect(SYNAPSE_CONSTANTS.maxOfflineHours).toBe(16);
  });

  test('baseOfflineEfficiency = 0.50 (GDD §19)', () => {
    expect(SYNAPSE_CONSTANTS.baseOfflineEfficiency).toBe(0.5);
  });

  test('maxOfflineEfficiencyRatio = 2.5 (Sprint 7.5.3 R6 lock; was 2.0 pre-Mood, GDD §19 OFFLINE-11)', () => {
    expect(SYNAPSE_CONSTANTS.maxOfflineEfficiencyRatio).toBe(2.5);
  });

  test('runThresholdMult = [1.0, 3.5, 6.0, 8.5, 12.0, 15.0] (GDD §20)', () => {
    expect(SYNAPSE_CONSTANTS.runThresholdMult).toEqual([1.0, 3.5, 6.0, 8.5, 12.0, 15.0]);
  });

  test('insightMultiplier = [3.0, 8.0, 18.0] (GDD §6 — the per-level multiplier array, NOT the scalar GameState field)', () => {
    expect(SYNAPSE_CONSTANTS.insightMultiplier).toEqual([3.0, 8.0, 18.0]);
  });

  test('insightDuration = [15, 12, 8] seconds (GDD §6)', () => {
    expect(SYNAPSE_CONSTANTS.insightDuration).toEqual([15, 12, 8]);
  });

  test('patternCycleBonusPerNode = 0.04 (GDD §10)', () => {
    expect(SYNAPSE_CONSTANTS.patternCycleBonusPerNode).toBe(0.04);
  });

  test('patternCycleCap = 1.5 (GDD §10)', () => {
    expect(SYNAPSE_CONSTANTS.patternCycleCap).toBe(1.5);
  });

  test('patternDecisionNodes = [6, 15, 24, 36, 48] (GDD §10)', () => {
    expect(SYNAPSE_CONSTANTS.patternDecisionNodes).toEqual([6, 15, 24, 36, 48]);
  });

  test('mutationPoolSize = 15 (GDD §13)', () => {
    expect(SYNAPSE_CONSTANTS.mutationPoolSize).toBe(15);
  });

  test('mutationOptionsPerCycle = 3 (GDD §13, +1 if Creativa)', () => {
    expect(SYNAPSE_CONSTANTS.mutationOptionsPerCycle).toBe(3);
  });

  test('spontaneousTriggerChance = 0.40 (GDD §8)', () => {
    expect(SYNAPSE_CONSTANTS.spontaneousTriggerChance).toBe(0.4);
  });

  test('antiSpamBufferSize = 20 (MENTAL-2 §17 circular buffer size for lastTapTimestamps)', () => {
    expect(SYNAPSE_CONSTANTS.antiSpamBufferSize).toBe(20);
  });
  test('antiSpamTapWindow = 30000ms (GDD §35 TAP-1)', () => {
    expect(SYNAPSE_CONSTANTS.antiSpamTapWindow).toBe(30_000);
  });

  test('starterPackShownAtPrestige = 2 (GDD §26, post-P2 tonal fix)', () => {
    expect(SYNAPSE_CONSTANTS.starterPackShownAtPrestige).toBe(2);
  });

  test('baseTapThoughtPct = 0.05 (TAP-2, GDD §6)', () => {
    expect(SYNAPSE_CONSTANTS.baseTapThoughtPct).toBe(0.05);
  });

  test('baseTapThoughtMin = 1 (TAP-2, GDD §6)', () => {
    expect(SYNAPSE_CONSTANTS.baseTapThoughtMin).toBe(1);
  });

  test('potencialSinapticoTapPct = 0.10 replaces base when upgrade owned (TAP-2)', () => {
    expect(SYNAPSE_CONSTANTS.potencialSinapticoTapPct).toBe(0.1);
  });

  test('sinestesiaTapMult = 0.40 (Mutation #13, TAP-2)', () => {
    expect(SYNAPSE_CONSTANTS.sinestesiaTapMult).toBe(0.4);
  });

  test('GameState has exactly 124 fields (GDD §32, post-Sprint-9b.4 added geniusPassDismissals)', () => {
    const state = createDefaultState();
    expect(Object.keys(state).length).toBe(124);
  });
});

describe('Consistency: Production formula (GDD §4)', () => {
  // Empirical values from Phase 4 Sprint 1 node verification.
  // Prior claim 1723.6 for softCap(10_000) was fabricated — 60% off.
  test('softCap(100) = 100 (identity at threshold)', () => {
    expect(softCap(100)).toBe(100);
  });

  test('softCap(200) ≈ 164.72', () => {
    expect(softCap(200)).toBeCloseTo(164.72, 2);
  });

  test('softCap(1000) ≈ 524.81', () => {
    expect(softCap(1000)).toBeCloseTo(524.81, 2);
  });

  test('softCap(10000) ≈ 2754.23', () => {
    expect(softCap(10_000)).toBeCloseTo(2754.23, 2);
  });

  test('softCap(x ≤ 100) = x (pass-through below threshold)', () => {
    expect(softCap(50)).toBe(50);
    expect(softCap(99)).toBe(99);
    expect(softCap(1)).toBe(1);
  });
});

describe('Consistency: Threshold scaling (GDD §9, THRES-1)', () => {
  test('calculateThreshold uses runThresholdMult[transcendenceCount]', () => {
    const t0 = calculateThreshold(1, 0);
    const t1 = calculateThreshold(1, 1);
    const t2 = calculateThreshold(1, 2);
    expect(t1 / t0).toBeCloseTo(3.5, 2);
    expect(t2 / t0).toBeCloseTo(6.0, 2);
  });

  test('calculateThreshold(0, 0) === baseThresholdTable[0] × runThresholdMult[0] (P0→P1, Run 1)', () => {
    expect(calculateThreshold(0, 0)).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[0] * SYNAPSE_CONSTANTS.runThresholdMult[0]);
  });

  test('calculateThreshold clamps out-of-range p and t (THRES-1 defensive)', () => {
    expect(calculateThreshold(999, 0)).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[25]);
    expect(calculateThreshold(0, 999)).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[0] * SYNAPSE_CONSTANTS.runThresholdMult[SYNAPSE_CONSTANTS.runThresholdMult.length - 1]);
  });

  test('calculateCurrentThreshold applies TUTOR-2 override (GDD §9)', () => {
    const tutorialState = {
      isTutorialCycle: true,
      prestigeCount: 0,
      transcendenceCount: 0,
    } as GameState;
    expect(calculateCurrentThreshold(tutorialState)).toBe(SYNAPSE_CONSTANTS.tutorialThreshold);
    const normalState = { ...tutorialState, isTutorialCycle: false };
    expect(calculateCurrentThreshold(normalState)).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[0]);
  });

  // ── ECO-1 coverage (Batch 3 4A-1): baseThresholdTable invariants ──
  test('ECO-1: baseThresholdTable has exactly 26 entries (P0→P1 through P25→P26)', () => {
    expect(SYNAPSE_CONSTANTS.baseThresholdTable.length).toBe(26);
  });

  test('ECO-1: baseThresholdTable monotonically increases from index 1 onward (post-tutorial path)', () => {
    // The table has a deliberate discontinuity at [0] → [1] (800K → 820K since Sprint 8c-tuning iter 1)
    // because index 0 is only consulted by the TUTOR-2 override path (which routes to
    // tutorialThreshold = 70K instead of reading the table). The monotonic
    // invariant applies to the post-tutorial path: indices 1..25.
    const t = SYNAPSE_CONSTANTS.baseThresholdTable;
    for (let i = 2; i < t.length; i++) {
      expect(t[i]).toBeGreaterThan(t[i - 1]);
    }
  });

  test('ECO-1: baseThresholdTable[0] is in the 100K–100M range (non-tutorial R1/R2 P1 target ~8 min; Sprint 8c-tuning iterates)', () => {
    // baseThresholdTable[0] is the P0→P1 threshold for non-tutorial runs (Run 1/2 onward).
    // Sprint 8c-tuning: exact value fluctuates during gradient-descent tuning.
    // Sanity: above placeholder, below typo range.
    expect(SYNAPSE_CONSTANTS.baseThresholdTable[0]).toBeGreaterThan(100_000);
    expect(SYNAPSE_CONSTANTS.baseThresholdTable[0]).toBeLessThan(100_000_000);
  });

  test('ECO-1: baseThresholdTable[25] (P25→P26) is in the 1e9–1e14 range (Sprint 8c-tuning: brittle pin removed, value iterates)', () => {
    // Sprint 8c-tuning: the brittle exact-value pin was removed since the value
    // will retune during future tuning passes. Baseline is 7e9 (INTERIM per §31).
    // Range allows full adjustment from sub-10B up to 100T.
    expect(SYNAPSE_CONSTANTS.baseThresholdTable[25]).toBeGreaterThan(1e9);
    expect(SYNAPSE_CONSTANTS.baseThresholdTable[25]).toBeLessThan(1e14);
  });

  // ── INIT-1 coverage (Batch 3 2B-1c): pure createDefaultState ──
  test('INIT-1: createDefaultState() returns cycleStartTimestamp === 0 (pure, not Date.now)', () => {
    const s = createDefaultState();
    expect(s.cycleStartTimestamp).toBe(0);
    expect(s.sessionStartTimestamp).toBeNull();
    expect(s.lastActiveTimestamp).toBe(0);
    expect(s.dischargeLastTimestamp).toBe(0);
  });

  test('INIT-1: createDefaultState() is idempotent (no Date.now in engine)', () => {
    const a = createDefaultState();
    const b = createDefaultState();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe('Consistency: PRESTIGE_RESET / PRESERVE / UPDATE split (GDD §33)', () => {
  // Field-set data un-skipped in Sprint 4a Phase 4a.1 (src/config/prestige.ts
  // defines the 4 tuples). handlePrestige() behavior tests un-skip in Phase 4a.4.

  test('PRESTIGE_RESET has exactly 48 fields (Sprint 7.10.5: +lucidDreamActiveUntil)', () => {
    expect(PRESTIGE_RESET_FIELDS.length).toBe(48);
    expect(Object.keys(PRESTIGE_RESET).length).toBe(48);
    // Tuple and data object must name the same fields.
    expect(new Set(PRESTIGE_RESET_FIELDS)).toEqual(new Set(Object.keys(PRESTIGE_RESET)));
  });

  test('PRESTIGE_PRESERVE has exactly 71 fields (Sprint 9b.4: +geniusPassDismissals)', () => {
    expect(PRESTIGE_PRESERVE_FIELDS.length).toBe(71);
  });

  test('RESET + PRESERVE + UPDATE + lifetime covers all 124 GameState fields', () => {
    const union = new Set<string>([
      ...PRESTIGE_RESET_FIELDS,
      ...PRESTIGE_PRESERVE_FIELDS,
      ...PRESTIGE_UPDATE_FIELDS,
      ...PRESTIGE_LIFETIME_FIELDS,
    ]);
    expect(union.size).toBe(124); // also asserts no duplicates across all 4 sets
    const gameStateKeys = new Set(Object.keys(createDefaultState()));
    expect(gameStateKeys.size).toBe(124);
    expect(union).toEqual(gameStateKeys);
  });

  test('Sprint 8b: TRANSCENDENCE_RESET has exactly 59 fields', async () => {
    const { TRANSCENDENCE_RESET, TRANSCENDENCE_RESET_FIELDS } = await import('../src/config/transcendence');
    expect(TRANSCENDENCE_RESET_FIELDS.length).toBe(59);
    expect(Object.keys(TRANSCENDENCE_RESET).length).toBe(59);
    expect(new Set(TRANSCENDENCE_RESET_FIELDS)).toEqual(new Set(Object.keys(TRANSCENDENCE_RESET)));
  });

  test('Sprint 9b.4: TRANSCENDENCE_PRESERVE has exactly 58 fields (+geniusPassDismissals)', async () => {
    const { TRANSCENDENCE_PRESERVE_FIELDS } = await import('../src/config/transcendence');
    expect(TRANSCENDENCE_PRESERVE_FIELDS.length).toBe(58);
  });

  test('Sprint 9b.4: TRANSCENDENCE RESET + PRESERVE + UPDATE covers all 124 GameState fields', async () => {
    const { TRANSCENDENCE_RESET_FIELDS, TRANSCENDENCE_PRESERVE_FIELDS, TRANSCENDENCE_UPDATE_FIELDS } = await import('../src/config/transcendence');
    const union = new Set<string>([
      ...TRANSCENDENCE_RESET_FIELDS,
      ...TRANSCENDENCE_PRESERVE_FIELDS,
      ...TRANSCENDENCE_UPDATE_FIELDS,
    ]);
    expect(union.size).toBe(124);
    const gameStateKeys = new Set(Object.keys(createDefaultState()));
    expect(union).toEqual(gameStateKeys);
  });

  test('Sprint 9b.4: geniusPassDismissals is PRESERVE on prestige + Transcendence (V-7 lifetime counter)', async () => {
    const { TRANSCENDENCE_PRESERVE_FIELDS } = await import('../src/config/transcendence');
    expect(PRESTIGE_PRESERVE_FIELDS).toContain('geniusPassDismissals');
    expect(TRANSCENDENCE_PRESERVE_FIELDS).toContain('geniusPassDismissals');
  });

  test('Sprint 9a.3: lastAdWatchedAt + installedAt are PRESERVE on prestige (V-2 + V-5 anti-exploit)', () => {
    expect(PRESTIGE_PRESERVE_FIELDS).toContain('lastAdWatchedAt');
    expect(PRESTIGE_PRESERVE_FIELDS).toContain('installedAt');
  });

  test('Sprint 9a.3: lastAdWatchedAt + installedAt are PRESERVE on Transcendence (V-2 + V-5)', async () => {
    const { TRANSCENDENCE_PRESERVE_FIELDS } = await import('../src/config/transcendence');
    expect(TRANSCENDENCE_PRESERVE_FIELDS).toContain('lastAdWatchedAt');
    expect(TRANSCENDENCE_PRESERVE_FIELDS).toContain('installedAt');
  });

  test('Sprint 8b: TRANSCENDENCE RESET ∩ PRESERVE === ∅ (disjoint)', async () => {
    const { TRANSCENDENCE_RESET_FIELDS, TRANSCENDENCE_PRESERVE_FIELDS } = await import('../src/config/transcendence');
    const resetSet = new Set<string>(TRANSCENDENCE_RESET_FIELDS);
    const overlap = TRANSCENDENCE_PRESERVE_FIELDS.filter((f) => resetSet.has(f));
    expect(overlap).toEqual([]);
  });

  test('no field appears in both RESET and PRESERVE (disjoint)', () => {
    const resetSet = new Set<string>(PRESTIGE_RESET_FIELDS);
    const overlap = PRESTIGE_PRESERVE_FIELDS.filter((f) => resetSet.has(f));
    expect(overlap).toEqual([]);
  });

  test('TUTOR-2 isTutorialCycle flipped to false on first prestige (handlePrestige integration)', async () => {
    const { handlePrestige } = await import('../src/engine/prestige');
    const before = { ...createDefaultState(), isTutorialCycle: true, prestigeCount: 0 };
    const { state: after } = handlePrestige(before, 1_000_000);
    expect(after.isTutorialCycle).toBe(false);
    expect(after.prestigeCount).toBe(1);
  });

  test('TUTOR-2 first cycle uses tutorialThreshold, not baseThresholdTable[0]', () => {
    const tutorialState = {
      isTutorialCycle: true,
      prestigeCount: 0,
      transcendenceCount: 0,
    } as GameState;
    expect(calculateCurrentThreshold(tutorialState)).toBe(SYNAPSE_CONSTANTS.tutorialThreshold);
    expect(calculateCurrentThreshold(tutorialState)).not.toBe(SYNAPSE_CONSTANTS.baseThresholdTable[0]);
  });

  // Ready-now: field-presence assertions use createDefaultState() directly.
  test('productionPerSecond is NOT in GameState (deprecated, BUG-E fix)', () => {
    const state = createDefaultState();
    expect('productionPerSecond' in state).toBe(false);
    expect('baseProductionPerSecond' in state).toBe(true);
    expect('effectiveProductionPerSecond' in state).toBe(true);
  });

  test('lastCycleEndProduction exists (CORE-8 fix, BUG-A)', () => {
    const state = createDefaultState();
    expect('lastCycleEndProduction' in state).toBe(true);
  });

  test('pendingHyperfocusBonus exists (MENTAL-5 / INT-9 fix)', () => {
    const state = createDefaultState();
    expect('pendingHyperfocusBonus' in state).toBe(true);
  });
});

describe('Consistency: Neuron configuration (GDD §5)', () => {
  // Un-skipped Sprint 3 Phase 1: NEURON_TYPES + NEURON_CONFIG + neuronCost() ship here.
  test('exactly 5 neuron types via NEURON_TYPES export', () => {
    expect(NEURON_TYPES.length).toBe(5);
    expect([...NEURON_TYPES].sort()).toEqual(
      ['basica', 'espejo', 'integradora', 'piramidal', 'sensorial'].sort(),
    );
  });
  test('Neuron base costs match GDD §5 table via NEURON_CONFIG', () => {
    expect(NEURON_CONFIG.basica.baseCost).toBe(10);
    expect(NEURON_CONFIG.sensorial.baseCost).toBe(150);
    expect(NEURON_CONFIG.piramidal.baseCost).toBe(2_200);
    expect(NEURON_CONFIG.espejo.baseCost).toBe(35_000);
    expect(NEURON_CONFIG.integradora.baseCost).toBe(600_000);
  });
  test('Neuron base rates match GDD §5 table via NEURON_CONFIG', () => {
    expect(NEURON_CONFIG.basica.baseRate).toBe(0.5);
    expect(NEURON_CONFIG.sensorial.baseRate).toBe(4.5);
    expect(NEURON_CONFIG.piramidal.baseRate).toBe(32);
    expect(NEURON_CONFIG.espejo.baseRate).toBe(220);
    expect(NEURON_CONFIG.integradora.baseRate).toBe(1_800);
  });
  test('Neuron unlock conditions match GDD §5 Unlock column', () => {
    expect(NEURON_CONFIG.basica.unlock).toEqual({ kind: 'start' });
    expect(NEURON_CONFIG.sensorial.unlock).toEqual({ kind: 'neuron_count', type: 'basica', count: 10 });
    expect(NEURON_CONFIG.piramidal.unlock).toEqual({ kind: 'neuron_count', type: 'sensorial', count: 5 });
    expect(NEURON_CONFIG.espejo.unlock).toEqual({ kind: 'neuron_count', type: 'piramidal', count: 5 });
    expect(NEURON_CONFIG.integradora.unlock).toEqual({ kind: 'prestige', min: 10 });
  });
  test('neuronCost() applies costMult^owned scaling (GDD §4)', () => {
    // baseCost × 1.28^owned; tolerate fp noise.
    expect(neuronCost('basica', 0)).toBeCloseTo(10, 6);
    expect(neuronCost('basica', 10)).toBeCloseTo(10 * Math.pow(1.28, 10), 3);
    expect(neuronCost('sensorial', 25)).toBeCloseTo(150 * Math.pow(1.28, 25), 0);
    expect(neuronCost('integradora', 50)).toBeCloseTo(600_000 * Math.pow(1.28, 50), -6);
  });
});

describe('Consistency: Mutation pool (GDD §13)', () => {
  test('Pool has exactly 15 mutations', async () => {
    const { MUTATIONS } = await import('../src/config/mutations');
    expect(MUTATIONS).toHaveLength(15);
  });
  test('Each mutation has required fields', async () => {
    const { MUTATIONS } = await import('../src/config/mutations');
    for (const m of MUTATIONS) {
      expect(typeof m.id).toBe('string');
      expect(typeof m.nameKey).toBe('string');
      expect(typeof m.descriptionKey).toBe('string');
      expect(typeof m.category).toBe('string');
      expect(typeof m.affectsOffline).toBe('boolean');
      expect(m.effect).toBeDefined();
      expect(typeof m.effect.kind).toBe('string');
    }
  });
  test('MUT-3 filters Déjà Vu + Neuroplasticidad at prestigeCount=0', async () => {
    const { MUT3_FIRST_CYCLE_FILTER } = await import('../src/config/mutations');
    expect(MUT3_FIRST_CYCLE_FILTER.has('deja_vu')).toBe(true);
    expect(MUT3_FIRST_CYCLE_FILTER.has('neuroplasticidad')).toBe(true);
  });
});

describe('Consistency: Archetypes (GDD §12)', () => {
  // BLOCKED-SPRINT-6: ARCHETYPES export lands in Sprint 6.
  test.skip('BLOCKED-SPRINT-6: Exactly 3 archetypes', () => {});
  test.skip('BLOCKED-SPRINT-6: Analítica bonuses match GDD §12', () => {});
  test.skip('BLOCKED-SPRINT-6: Empática bonuses match GDD §12', () => {});
  test.skip('BLOCKED-SPRINT-6: Creativa bonuses match GDD §12', () => {});
});

describe('Consistency: Pathways (GDD §14)', () => {
  test('Exactly 3 pathways', async () => {
    const { PATHWAYS } = await import('../src/config/pathways');
    expect(PATHWAYS).toHaveLength(3);
  });
  test('Rápida enables [tap, foc, syn, met]', async () => {
    const { PATHWAYS_BY_ID } = await import('../src/config/pathways');
    const rapida = PATHWAYS_BY_ID['rapida'];
    expect(rapida).toBeDefined();
    expect([...rapida.enables].sort()).toEqual(['foc', 'met', 'syn', 'tap']);
    expect([...rapida.blocks].sort()).toEqual(['con', 'new', 'reg']);
  });
  test('Equilibrada enables all categories but bonus × 0.85', async () => {
    const { PATHWAYS_BY_ID } = await import('../src/config/pathways');
    const equilibrada = PATHWAYS_BY_ID['equilibrada'];
    expect(equilibrada).toBeDefined();
    expect([...equilibrada.enables].sort()).toEqual(['con', 'foc', 'met', 'neu', 'new', 'reg', 'syn', 'tap']);
    expect(equilibrada.blocks).toEqual([]);
    expect(equilibrada.bonuses.upgradeBonusMult).toBe(0.85);
  });
});

describe('Consistency: Upgrades (GDD §24)', () => {
  // Un-skipped Sprint 3 Phase 1: UPGRADES data ships here.
  test('Total 42 upgrades (Sprint 7.5.5: +3 Visual - procesamiento_visual, was 40)', () => {
    expect(UPGRADES.length).toBe(42);
  });
  test('Each upgrade has a valid category', () => {
    const validCategories: ReadonlySet<UpgradeCategory> = new Set<UpgradeCategory>([
      'tap', 'foc', 'syn', 'neu', 'reg', 'con', 'met', 'new', 'mem',
    ]);
    for (const u of UPGRADES) {
      expect(validCategories.has(u.category)).toBe(true);
    }
  });
  test('Upgrade category counts match GDD §24 post-7.5.5 (tap=3, foc=1, syn=5, neu=8, reg=11, con=5, met=3, new=6)', () => {
    const counts = UPGRADES.reduce<Record<string, number>>((acc, u) => {
      acc[u.category] = (acc[u.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts.tap).toBe(3);
    expect(counts.foc).toBe(1);
    expect(counts.syn).toBe(5);
    expect(counts.neu).toBe(8);
    expect(counts.reg).toBe(11); // Sprint 7.5.5: 2 surviving regions + 6 Límbico + 3 Visual
    expect(counts.con).toBe(5);
    expect(counts.met).toBe(3);
    expect(counts.new).toBe(6);
  });
  test('Upgrade IDs are unique', () => {
    const ids = UPGRADES.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  test('Region upgrades are priced in Memorias (GDD §16, Sprint 7.5.5: 11 incl. 6 Límbico + 3 Visual)', () => {
    const regionUpgrades = UPGRADES.filter((u) => u.category === 'reg');
    expect(regionUpgrades.length).toBe(11);
    for (const u of regionUpgrades) {
      expect(u.costCurrency).toBe('memorias');
    }
  });
  test('Non-region upgrades are priced in Thoughts', () => {
    const nonRegion = UPGRADES.filter((u) => u.category !== 'reg');
    expect(nonRegion.length).toBe(31); // Sprint 7.5.3: +ondas_theta in `con`
    for (const u of nonRegion) {
      expect(u.costCurrency).toBe('thoughts');
    }
  });

  // ── Per-ID spec-authority spot checks (Phase 3.5 audit #6) ──
  // Guards every §24/§16 numeric in the data. Catches typos that the
  // kind-level production-formula tests wouldn't surface.
  test('§24 Tap tier: exact cost + effect params per GDD', () => {
    const ps = UPGRADES.find((u) => u.id === 'potencial_sinaptico')!;
    expect(ps.cost).toBe(5_000);
    expect(ps.unlockPrestige).toBe(0);
    expect(ps.effect).toEqual({ kind: 'tap_replace_pct', pct: 0.10 });
    const mi = UPGRADES.find((u) => u.id === 'mielina')!;
    expect(mi.cost).toBe(15_000);
    expect(mi.effect).toEqual({ kind: 'tap_focus_fill_add', add: 0.02 });
    const do_ = UPGRADES.find((u) => u.id === 'dopamina')!;
    expect(do_.cost).toBe(80_000);
    expect(do_.unlockPrestige).toBe(2);
    expect(do_.effect).toEqual({ kind: 'tap_bonus_mult', mult: 1.5 });
  });
  test('§24 Synapsis/Discharge tier: exact cost + effect params', () => {
    expect(UPGRADES.find((u) => u.id === 'descarga_neural')!.effect).toEqual({ kind: 'discharge_max_charges_add', add: 1 });
    expect(UPGRADES.find((u) => u.id === 'amplificador_de_disparo')!.effect).toEqual({ kind: 'discharge_mult', mult: 1.5 });
    expect(UPGRADES.find((u) => u.id === 'red_alta_velocidad')!.effect).toEqual({ kind: 'charge_rate_mult', mult: 1.25 });
    expect(UPGRADES.find((u) => u.id === 'cascada_profunda')!.effect).toEqual({ kind: 'cascade_mult_double' });
    expect(UPGRADES.find((u) => u.id === 'sincronizacion_total')!.effect).toEqual({ kind: 'post_cascade_focus_refund', amount: 0.18 });
  });
  test('§24 Neurons tier: per-type + all-neurons mults match GDD', () => {
    expect(UPGRADES.find((u) => u.id === 'red_neuronal_densa')!.effect).toEqual({ kind: 'all_neurons_mult', mult: 1.25 });
    expect(UPGRADES.find((u) => u.id === 'receptores_ampa')!.effect).toEqual({ kind: 'neuron_type_mult', neuronType: 'basica', mult: 2 });
    expect(UPGRADES.find((u) => u.id === 'transduccion_sensorial')!.effect).toEqual({ kind: 'neuron_type_mult', neuronType: 'sensorial', mult: 3 });
    expect(UPGRADES.find((u) => u.id === 'axones_proyeccion')!.effect).toEqual({ kind: 'neuron_type_mult', neuronType: 'piramidal', mult: 3 });
    expect(UPGRADES.find((u) => u.id === 'espejo_resonantes')!.effect).toEqual({ kind: 'neuron_type_mult', neuronType: 'espejo', mult: 4 });
    expect(UPGRADES.find((u) => u.id === 'sincronia_neural')!.effect).toEqual({ kind: 'connection_mult_double' });
    expect(UPGRADES.find((u) => u.id === 'ltp_potenciacion_larga')!.effect).toEqual({ kind: 'all_neurons_mult', mult: 1.5 });
    expect(UPGRADES.find((u) => u.id === 'neurogenesis')!.effect).toEqual({ kind: 'all_neurons_mult', mult: 1.10 });
  });
  test('§16 Regions tier: surviving region + Límbico mood + Visual Foresight (Sprint 7.5.5)', () => {
    // Sprint 7.5.2: consolidacion_memoria removed. 7.5.3: regulacion_emocional. 7.5.5: procesamiento_visual.
    expect(UPGRADES.find((u) => u.id === 'consolidacion_memoria')).toBeUndefined();
    expect(UPGRADES.find((u) => u.id === 'regulacion_emocional')).toBeUndefined();
    expect(UPGRADES.find((u) => u.id === 'procesamiento_visual')).toBeUndefined();
    expect(UPGRADES.find((u) => u.id === 'funciones_ejecutivas')!).toEqual(expect.objectContaining({ cost: 3, unlockPrestige: 2 }));
    expect(UPGRADES.find((u) => u.id === 'funciones_ejecutivas')!.effect).toEqual({ kind: 'upgrade_cost_reduction', pct: 0.20 });
    expect(UPGRADES.find((u) => u.id === 'amplitud_banda')!.cost).toBe(15);
    // Sprint 7.5.5 — 3 Visual Foresight tier-unlock upgrades.
    expect(UPGRADES.find((u) => u.id === 'vis_pattern_sight')).toEqual(expect.objectContaining({ cost: 2, unlockPrestige: 5 }));
    expect(UPGRADES.find((u) => u.id === 'vis_deep_sight')).toEqual(expect.objectContaining({ cost: 8, unlockPrestige: 12 }));
    expect(UPGRADES.find((u) => u.id === 'vis_prophet_sight')).toEqual(expect.objectContaining({ cost: 20, unlockPrestige: 19 }));
    // Sprint 7.5.3 — 6 Límbico mood upgrades all priced in Memorias with mood_passive_marker effect.
    for (const id of ['lim_steady_heart', 'lim_empathic_spark', 'lim_resilience', 'lim_elevation', 'lim_euphoric_echo', 'lim_emotional_wisdom']) {
      const u = UPGRADES.find((up) => up.id === id);
      expect(u, `${id} should exist`).toBeDefined();
      expect(u!.costCurrency).toBe('memorias');
      expect(u!.effect.kind).toBe('mood_passive_marker');
    }
    // Sprint 7.5.3 — ondas_theta replaces regulacion_emocional offline path (Thoughts-priced).
    const ot = UPGRADES.find((u) => u.id === 'ondas_theta');
    expect(ot).toEqual(expect.objectContaining({ cost: 300_000, costCurrency: 'thoughts', unlockPrestige: 3 }));
    expect(ot!.effect).toEqual({ kind: 'offline_efficiency_mult', mult: 2 });
  });
  test('§24 Consciousness/Offline tier: offline cap + consciousness fill match', () => {
    expect(UPGRADES.find((u) => u.id === 'sueno_rem')!.effect).toEqual({ kind: 'offline_cap_set', hours: 8 });
    expect(UPGRADES.find((u) => u.id === 'consciencia_distribuida')!.effect).toEqual({ kind: 'offline_cap_set', hours: 12 });
    expect(UPGRADES.find((u) => u.id === 'umbral_consciencia')!.effect).toEqual({ kind: 'consciousness_fill_mult', mult: 1.3 });
    expect(UPGRADES.find((u) => u.id === 'hiperconciencia')!.effect).toEqual({ kind: 'consciousness_fill_mult', mult: 2 });
    expect(UPGRADES.find((u) => u.id === 'ritmo_circadiano')!.effect).toEqual({ kind: 'offline_efficiency_and_autocharge', mult: 1.5 });
  });
  test('§24 Meta + Tier-P10: scaling params match GDD', () => {
    expect(UPGRADES.find((u) => u.id === 'retroalimentacion_positiva')!.effect).toEqual({ kind: 'all_production_mult', mult: 2 });
    expect(UPGRADES.find((u) => u.id === 'emergencia_cognitiva')!.effect).toEqual({ kind: 'upgrades_scaling_mult', perBucket: 1.5, bucketSize: 5, capMult: 5 });
    expect(UPGRADES.find((u) => u.id === 'singularidad')!.effect).toEqual({ kind: 'prestige_scaling_mult', perPrestige: 1.01 });
    expect(UPGRADES.find((u) => u.id === 'convergencia_sinaptica')!.effect).toEqual({ kind: 'lifetime_prestige_add', perLp: 0.015, capAdd: 0.40 });
    expect(UPGRADES.find((u) => u.id === 'potencial_latente')!.effect).toEqual({ kind: 'discharge_prestige_bonus', base: 1000 });
    expect(UPGRADES.find((u) => u.id === 'resonancia_acumulada')!.effect).toEqual({ kind: 'post_offline_discharge_bonus', perHour: 0.05, capAdd: 1.0 });
    expect(UPGRADES.find((u) => u.id === 'sintesis_cognitiva')!.effect).toEqual({ kind: 'pattern_flat_mult', mult: 2 });
    expect(UPGRADES.find((u) => u.id === 'focus_persistente')!.effect).toEqual({ kind: 'focus_persist', pct: 0.25 });
  });
  test('Every upgrade has positive cost + valid unlockPrestige', () => {
    for (const u of UPGRADES) {
      expect(u.cost).toBeGreaterThan(0);
      expect(u.unlockPrestige).toBeGreaterThanOrEqual(0);
      expect(u.unlockPrestige).toBeLessThanOrEqual(26);
    }
  });
  test('Every neuron_type_mult effect targets a valid type', () => {
    const valid = new Set(['basica', 'sensorial', 'piramidal', 'espejo', 'integradora']);
    for (const u of UPGRADES) {
      if (u.effect.kind === 'neuron_type_mult') {
        expect(valid.has(u.effect.neuronType)).toBe(true);
        expect(u.effect.mult).toBeGreaterThan(1);
      }
    }
  });
});

describe('Consistency: Pattern Tree decisions (GDD §10)', () => {
  // Sprint 4b Phase 4b.1: PATTERN_DECISIONS canonical data ships here.
  test('exactly 5 decision entries at the canonical indices [6, 15, 24, 36, 48]', () => {
    const keys = Object.keys(PATTERN_DECISIONS).map(Number).sort((a, b) => a - b);
    expect(keys).toEqual([6, 15, 24, 36, 48]);
  });

  test('keys match patternDecisionNodes constant (§31)', () => {
    const fromData = new Set(Object.keys(PATTERN_DECISIONS).map(Number));
    const fromConst = new Set(SYNAPSE_CONSTANTS.patternDecisionNodes);
    expect(fromData).toEqual(fromConst);
  });

  test('every decision has both A and B options with a typed effect', () => {
    for (const [, def] of Object.entries(PATTERN_DECISIONS)) {
      expect(def.A.effect.kind).toBeDefined();
      expect(def.B.effect.kind).toBeDefined();
      expect(def.A.description.length).toBeGreaterThan(0);
      expect(def.B.description.length).toBeGreaterThan(0);
    }
  });

  test('Node 6 effect values match GDD §10 (A: +8% cycle, B: +1 charge)', () => {
    expect(PATTERN_DECISIONS[6].A.effect).toEqual({ kind: 'cycle_bonus_add', add: 0.08 });
    expect(PATTERN_DECISIONS[6].B.effect).toEqual({ kind: 'discharge_charges_plus_one' });
  });

  test('Node 15 effect values match GDD §10 (A: +15% offline, B: +20% focus)', () => {
    expect(PATTERN_DECISIONS[15].A.effect).toEqual({ kind: 'offline_efficiency_mult', mult: 1.15 });
    expect(PATTERN_DECISIONS[15].B.effect).toEqual({ kind: 'focus_fill_rate_mult', mult: 1.20 });
  });

  test('Node 24 effect values match GDD §10 (A: +3s insight, B: +2 memories)', () => {
    expect(PATTERN_DECISIONS[24].A.effect).toEqual({ kind: 'insight_duration_add_s', add: 3 });
    expect(PATTERN_DECISIONS[24].B.effect).toEqual({ kind: 'memories_per_prestige_add', add: 2 });
  });

  test('Node 36 effect values match GDD §10 (A: cascade 0.65, B: +10% discharge)', () => {
    expect(PATTERN_DECISIONS[36].A.effect).toEqual({ kind: 'cascade_threshold_set', threshold: 0.65 });
    expect(PATTERN_DECISIONS[36].B.effect).toEqual({ kind: 'discharge_damage_mult', mult: 1.10 });
  });

  test('Node 48 effect values match GDD §10 (A: ×1.3 regions, B: +1 mutation)', () => {
    expect(PATTERN_DECISIONS[48].A.effect).toEqual({ kind: 'region_mult', mult: 1.30 });
    expect(PATTERN_DECISIONS[48].B.effect).toEqual({ kind: 'mutation_options_add', add: 1 });
  });

  test('NODE_36_TIER_2_MIN_PRESTIGE = 13 (INT-5 Resonance-on-Discharge gate)', () => {
    expect(NODE_36_TIER_2_MIN_PRESTIGE).toBe(13);
  });
});

describe('Consistency: Run-exclusive upgrades (GDD §21, 4 for v1.0)', () => {
  // BLOCKED-SPRINT-8b: RUN_EXCLUSIVE_UPGRADES export lands in Sprint 8b.
  test.skip('BLOCKED-SPRINT-8b: Exactly 4 run-exclusive upgrades in v1.0', () => {});
  test.skip('BLOCKED-SPRINT-8b: Run 2 upgrades: eco_ancestral, sueno_profundo', () => {});
  test.skip('BLOCKED-SPRINT-8b: Run 3 upgrades: neurona_pionera, despertar_acelerado', () => {});
  test.skip('BLOCKED-SPRINT-8b: memoria_ancestral and consciencia_plena are NOT in v1.0', () => {});
});

describe('Consistency: Resonance upgrades (GDD §15)', () => {
  // BLOCKED-SPRINT-8b: RESONANCE_UPGRADES export lands in Sprint 8b.
  test.skip('BLOCKED-SPRINT-8b: Exactly 8 resonance upgrades in 3 tiers', () => {});
  test.skip('BLOCKED-SPRINT-8b: Tier 1 unlocks at prestigeCount 13, 3 upgrades', () => {});

  // Ready-now: PAT-3 constant exists in Sprint 1's constants.ts.
  test('PAT-3 reset costs 1000 Resonance (GDD §10)', () => {
    expect(SYNAPSE_CONSTANTS.patternResetCostResonance).toBe(1000);
  });
});

describe('Consistency: Resonant Patterns (GDD §22, Secret Ending gate)', () => {
  // BLOCKED-SPRINT-8c: RESONANT_PATTERNS export lands in Sprint 8c.
  test.skip('BLOCKED-SPRINT-8c: Exactly 4 resonant patterns', () => {});
  test.skip('BLOCKED-SPRINT-8c: RP-4 Cascade Chorus requires NOT owning Cascada Profunda (INT-12)', () => {});
});

describe('Consistency: Mental States (GDD §17, 5 states with priority)', () => {
  // BLOCKED-SPRINT-7: MENTAL_STATES export lands in Sprint 7.
  test.skip('BLOCKED-SPRINT-7: Exactly 5 mental states', () => {});
  test.skip('BLOCKED-SPRINT-7: Priority order Eureka > Flow > Hyperfocus > Deep > Dormancy (MENTAL-1)', () => {});
  test.skip('BLOCKED-SPRINT-7: Eureka display name is "Flujo Eureka" (MENTAL-6 rename)', () => {});
});

describe('Consistency: Spontaneous events (GDD §8)', () => {
  // BLOCKED-SPRINT-6: SPONTANEOUS_EVENTS export lands in Sprint 6.
  test.skip('BLOCKED-SPRINT-6: Exactly 12 spontaneous events', () => {});
  test.skip('BLOCKED-SPRINT-6: Weights sum to 1.0 by type', () => {});
});

describe('Consistency: Era 3 events (GDD §23, 8 unique events P19-P26)', () => {
  // BLOCKED-SPRINT-6: ERA_3_EVENTS export lands in Sprint 6.
  test.skip('BLOCKED-SPRINT-6: Exactly 8 Era 3 events, one per prestige P19-P26', () => {});
  test.skip('BLOCKED-SPRINT-6: P24 is The Long Thought (auto-prestige at 45 min)', () => {});
  test.skip('BLOCKED-SPRINT-6: P26 is The Last Choice (triggers ending screen)', () => {});
});

describe('Consistency: Micro-challenges (GDD §18, 8 pool)', () => {
  // BLOCKED-SPRINT-7: MICRO_CHALLENGES export lands in Sprint 7.
  test.skip('BLOCKED-SPRINT-7: Exactly 8 micro-challenges', () => {});

  // Ready-now: MICRO-2 constant exists.
  test('Max 3 per cycle (MICRO-2)', () => {
    expect(SYNAPSE_CONSTANTS.microChallengeMaxPerCycle).toBe(3);
  });
});

describe('Consistency: Weekly challenges (GDD §25, CORE-9)', () => {
  // BLOCKED-SPRINT-10: WEEKLY_CHALLENGES export lands in Sprint 10.
  test.skip('BLOCKED-SPRINT-10: Exactly 8 weekly challenges', () => {});
});

describe('Consistency: Narrative content (GDD §10 and NARRATIVE.md)', () => {
  // BLOCKED-SPRINT-6: FRAGMENTS, ECHOES, ENDINGS exports land in Sprint 6.
  test.skip('BLOCKED-SPRINT-6: Exactly 57 fragments total (12 base + 15 per archetype × 3)', () => {});
  test.skip('BLOCKED-SPRINT-6: Exactly 30 echoes', () => {});
  test.skip('BLOCKED-SPRINT-6: Exactly 4 endings in v1.0 (resonance is v1.5+)', () => {});
});

describe('Consistency: Analytics events (GDD §27, 48 total)', () => {
  // BLOCKED-SPRINT-10: ANALYTICS_EVENTS export lands in Sprint 10.
  test.skip('BLOCKED-SPRINT-10: Exactly 48 analytics events (9+11+5+20+3)', () => {});
  test.skip('BLOCKED-SPRINT-10: pattern_decisions_reset in Core category (9A-2)', () => {});
  test.skip('BLOCKED-SPRINT-10: All 9 funnel events present', () => {});
  test.skip('BLOCKED-SPRINT-10: All 11 monetization events match §27 (ANALYTICS-5)', () => {});
});

describe('Consistency: File structure invariants', () => {
  test('No file in src/engine/ exceeds 200 lines (CODE-2)', async () => {
    const { promises: fs } = await import('fs');
    const path = await import('path');
    const dir = path.resolve(__dirname, '../src/engine');
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (!file.endsWith('.ts')) continue;
      const content = await fs.readFile(path.join(dir, file), 'utf-8');
      const lines = content.split('\n').length;
      expect(lines, `${file} exceeds 200 lines`).toBeLessThanOrEqual(200);
    }
  });

  test('productionPerSecond as a standalone identifier never appears in src/ (BUG-E)', async () => {
    const { promises: fs } = await import('fs');
    const path = await import('path');
    async function walk(dir: string): Promise<string[]> {
      const out: string[] = [];
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...(await walk(p)));
        else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) out.push(p);
      }
      return out;
    }
    const srcDir = path.resolve(__dirname, '../src');
    const files = await walk(srcDir);
    for (const file of files) {
      const rawContent = await fs.readFile(file, 'utf-8');
      // Strip // line comments and /* */ block comments before matching so that
      // intentional mentions in documentation comments (e.g. "productionPerSecond
      // REMOVED per BUG-E") don't trigger false positives on the runtime check.
      const codeOnly = rawContent
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      const offending = /(?<!base|effective|[a-zA-Z])productionPerSecond\b/;
      expect(offending.test(codeOnly), `${file} references bare productionPerSecond in code`).toBe(false);
    }
  });

  test('No post-v1.0 feature references in src/ code (POSTLAUNCH boundary)', async () => {
    const { promises: fs } = await import('fs');
    const path = await import('path');
    async function walk(dir: string): Promise<string[]> {
      const out: string[] = [];
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...(await walk(p)));
        else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) out.push(p);
      }
      return out;
    }
    const srcDir = path.resolve(__dirname, '../src');
    const files = await walk(srcDir);
    const bannedPatterns = [
      /\bobserver\b/i,
      /\boneiric\b/i,
      /\bdream_system\b/i,
      /\bsandbox_mode\b/i,
      /\benlightenment\b/i,
      /\blatent_neuron\b/i,
      /\bmemoria_ancestral\b/i,
      /\bconsciencia_plena\b/i,
      /\bcerebelo\b/i,
    ];
    for (const file of files) {
      const rawContent = await fs.readFile(file, 'utf-8');
      // Strip comments so that boundary-explaining comments (e.g. "Observer
      // archetype is v1.5+") don't trigger the guard. The guard is about code,
      // not documentation.
      const codeOnly = rawContent
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      for (const pattern of bannedPatterns) {
        expect(pattern.test(codeOnly), `${file} references banned post-v1.0 pattern ${pattern} in code`).toBe(false);
      }
    }
  });
});

describe('Consistency: Achievements (GDD §24.5, 30 total)', () => {
  // BLOCKED-SPRINT-7: ACHIEVEMENTS export lands in Sprint 7.
  test.skip('BLOCKED-SPRINT-7: Exactly 30 achievements', () => {});
  test.skip('BLOCKED-SPRINT-7: 6 per category × 5 categories', () => {});
  test.skip('BLOCKED-SPRINT-7: All IDs match category prefix pattern', () => {});
  test.skip('BLOCKED-SPRINT-7: Total Spark reward sum === 145 (ACH-3)', () => {});
  test.skip('BLOCKED-SPRINT-7: Hidden achievements (6) have isHidden: true (ACH-2)', () => {});
  test.skip('BLOCKED-SPRINT-7: All achievement IDs are stable (ACH-4) — ID snapshot', () => {});
  test.skip('BLOCKED-SPRINT-7: ACH-1 all achievement triggers are pure (state) => boolean', () => {});
});

describe('Consistency: RNG utilities (GDD §30 RNG-1)', () => {
  test('mulberry32(12345)() first 3 values match spec (snapshot)', () => {
    const gen = mulberry32(12345);
    expect(gen()).toBe(0.9797282677609473);
    expect(gen()).toBe(0.3067522644996643);
    expect(gen()).toBe(0.484205421525985);
  });

  test('hash is stable for string/number coercion', () => {
    expect(hash(0)).toBe(hash('0'));
    expect(hash(1)).toBe(hash('1'));
    expect(hash(0)).toBe(890022063);
  });

  test('seededRandom with same seed returns same value', () => {
    expect(seededRandom(42)).toBe(seededRandom(42));
    expect(seededRandom(42)).not.toBe(seededRandom(43));
  });

  // BLOCKED-SPRINT-6: pickWeightedRandom over SPONTANEOUS_EVENTS needs Sprint 6 export.
  test.skip('BLOCKED-SPRINT-6: pickWeightedRandom deterministic over SPONTANEOUS_EVENTS', () => {});
});

describe('Consistency: Tick order (GDD §35 TICK-1)', () => {
  // Tick Step 1 was the cycleTime spec gap resolved Option B in Phase 5:
  // state.cycleTime is not stored; derived as nowTimestamp - cycleStartTimestamp.
  // The stub previously asserted a cycleTime field — replaced with a basic
  // purity + ref-equality test. Full 12-step coverage is in tests/engine/tick.
  test('tick() accepts (state, nowTimestamp) and returns a new state object (pure reducer)', () => {
    const state = createDefaultState();
    const { state: next } = tick(state, 1_000_000);
    expect(next).not.toBe(state);
  });

  test('TICK-1 step 3 (recalc) runs BEFORE step 4 (produce)', () => {
    const s = createDefaultState();
    s.neurons[0].count = 10;
    s.baseProductionPerSecond = 0;
    s.effectiveProductionPerSecond = 0;
    const { state: next } = tick(s, 1_000_000);
    expect(next.effectiveProductionPerSecond).toBeGreaterThan(0);
    expect(next.thoughts).toBeCloseTo(next.effectiveProductionPerSecond * 0.1, 5);
  });

  test('TICK-1 step 5 (CORE-10) flips consciousnessBarUnlocked at 0.5 × threshold', () => {
    const s = createDefaultState();
    s.cycleGenerated = 24_999;
    s.currentThreshold = 50_000;
    s.neurons[0].count = 0;
    s.neurons[4].count = 10; // Integradora 1800/sec × 0.1 = 180 → pushes past 25_000
    s.consciousnessBarUnlocked = false;
    const { state: next } = tick(s, 1_000_000);
    expect(next.consciousnessBarUnlocked).toBe(true);
  });

  test('TICK-1 step 12 (anti-spam) returns false with insufficient buffer', () => {
    const partial = createDefaultState();
    partial.lastTapTimestamps = [1000, 1100, 1200];
    const { antiSpamActive } = tick(partial, 2000);
    expect(antiSpamActive).toBe(false);
  });
});
