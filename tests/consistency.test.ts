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
  test('tutorialThreshold = 50000 (GDD §31)', () => {
    expect(SYNAPSE_CONSTANTS.tutorialThreshold).toBe(50_000);
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

  test('maxOfflineEfficiencyRatio = 2.0 (GDD §19, OFFLINE-4)', () => {
    expect(SYNAPSE_CONSTANTS.maxOfflineEfficiencyRatio).toBe(2.0);
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

  test('GameState has exactly 110 fields (GDD §32)', () => {
    const state = createDefaultState();
    expect(Object.keys(state).length).toBe(110);
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

  test('calculateThreshold(0, 0) === 800_000 (P0→P1, Run 1)', () => {
    expect(calculateThreshold(0, 0)).toBe(800_000);
  });

  test('calculateThreshold clamps out-of-range p and t (THRES-1 defensive)', () => {
    expect(calculateThreshold(999, 0)).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[25]);
    expect(calculateThreshold(0, 999)).toBe(800_000 * 15.0);
  });

  test('calculateCurrentThreshold applies TUTOR-2 override (GDD §9)', () => {
    const tutorialState = {
      isTutorialCycle: true,
      prestigeCount: 0,
      transcendenceCount: 0,
    } as GameState;
    expect(calculateCurrentThreshold(tutorialState)).toBe(50_000);
    const normalState = { ...tutorialState, isTutorialCycle: false };
    expect(calculateCurrentThreshold(normalState)).toBe(800_000);
  });

  // ── ECO-1 coverage (Batch 3 4A-1): baseThresholdTable invariants ──
  test('ECO-1: baseThresholdTable has exactly 26 entries (P0→P1 through P25→P26)', () => {
    expect(SYNAPSE_CONSTANTS.baseThresholdTable.length).toBe(26);
  });

  test('ECO-1: baseThresholdTable monotonically increases from index 1 onward (post-tutorial path)', () => {
    // The table has a deliberate discontinuity at [0] → [1] (800K → 450K) because
    // index 0 is only consulted by the TUTOR-2 override path (which routes to
    // tutorialThreshold = 50K instead of reading the table). The monotonic
    // invariant applies to the post-tutorial path: indices 1..25.
    const t = SYNAPSE_CONSTANTS.baseThresholdTable;
    for (let i = 2; i < t.length; i++) {
      expect(t[i]).toBeGreaterThan(t[i - 1]);
    }
  });

  test('ECO-1: index 0 discontinuity is by design (TUTOR-2 override takes over)', () => {
    // baseThresholdTable[0] === 800_000 is the "would-be" P0→P1 value but is
    // overridden by TUTOR-2 to tutorialThreshold (50_000). baseThresholdTable[1]
    // (450_000) is the first normally-read entry. Its ratio to [0] is <1 by design.
    const t = SYNAPSE_CONSTANTS.baseThresholdTable;
    expect(t[0]).toBe(800_000);
    expect(t[1]).toBe(450_000);
    expect(t[1]).toBeLessThan(t[0]); // explicit: this discontinuity is expected
  });

  test('ECO-1: baseThresholdTable[0] === 800_000 (interim value; update comment if TEST-5 retunes)', () => {
    expect(SYNAPSE_CONSTANTS.baseThresholdTable[0]).toBe(800_000);
  });

  test('ECO-1: baseThresholdTable[25] (P25→P26) === 7_000_000_000 (Batch 3 rebalance)', () => {
    expect(SYNAPSE_CONSTANTS.baseThresholdTable[25]).toBe(7_000_000_000);
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
  // BLOCKED-SPRINT-4a: PRESTIGE_RESET / PRESTIGE_PRESERVE / handlePrestige live
  // in src/engine/prestige.ts which is Sprint 4a. The 45/60/4/1 field count
  // assertion, RESET-PRESERVE disjointness, and TUTOR-2 prestige flip tests
  // all un-skip in Sprint 4a.
  test.skip('BLOCKED-SPRINT-4a: PRESTIGE_RESET has exactly 45 fields', () => {});
  test.skip('BLOCKED-SPRINT-4a: PRESTIGE_PRESERVE has exactly 60 fields', () => {});
  test.skip('BLOCKED-SPRINT-4a: RESET + PRESERVE + UPDATE + lifetime covers all 110 GameState fields', () => {});
  test.skip('BLOCKED-SPRINT-4a: no field appears in both RESET and PRESERVE (disjoint)', () => {});
  test.skip('BLOCKED-SPRINT-4a: TUTOR-2 isTutorialCycle flipped to false on first prestige', () => {});
  test.skip('BLOCKED-SPRINT-4a: TUTOR-2 first cycle uses tutorialThreshold, not baseThresholdTable[0]', () => {});

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
  // BLOCKED-SPRINT-5: MUTATIONS + getMutationOptions exports land in Sprint 5.
  test.skip('BLOCKED-SPRINT-5: Pool has exactly 15 mutations', () => {});
  test.skip('BLOCKED-SPRINT-5: Each mutation has required fields', () => {});
  test.skip('BLOCKED-SPRINT-5: MUT-3 filters Déjà Vu + Neuroplasticidad at prestigeCount=0', () => {});
});

describe('Consistency: Archetypes (GDD §12)', () => {
  // BLOCKED-SPRINT-6: ARCHETYPES export lands in Sprint 6.
  test.skip('BLOCKED-SPRINT-6: Exactly 3 archetypes', () => {});
  test.skip('BLOCKED-SPRINT-6: Analítica bonuses match GDD §12', () => {});
  test.skip('BLOCKED-SPRINT-6: Empática bonuses match GDD §12', () => {});
  test.skip('BLOCKED-SPRINT-6: Creativa bonuses match GDD §12', () => {});
});

describe('Consistency: Pathways (GDD §14)', () => {
  // BLOCKED-SPRINT-5: PATHWAYS export lands in Sprint 5.
  test.skip('BLOCKED-SPRINT-5: Exactly 3 pathways', () => {});
  test.skip('BLOCKED-SPRINT-5: Rápida enables [tap, foc, syn, met]', () => {});
  test.skip('BLOCKED-SPRINT-5: Equilibrada enables all categories but bonus × 0.85', () => {});
});

describe('Consistency: Upgrades (GDD §24)', () => {
  // Un-skipped Sprint 3 Phase 1: UPGRADES data ships here.
  test('Total 35 upgrades (not counting run-exclusive or resonance)', () => {
    expect(UPGRADES.length).toBe(35);
  });
  test('Each upgrade has a valid category', () => {
    const validCategories: ReadonlySet<UpgradeCategory> = new Set<UpgradeCategory>([
      'tap', 'foc', 'syn', 'neu', 'reg', 'con', 'met', 'new',
    ]);
    for (const u of UPGRADES) {
      expect(validCategories.has(u.category)).toBe(true);
    }
  });
  test('Upgrade category counts match GDD §24 (tap=3, foc=1, syn=5, neu=8, reg=5, con=4, met=3, new=6)', () => {
    const counts = UPGRADES.reduce<Record<string, number>>((acc, u) => {
      acc[u.category] = (acc[u.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts.tap).toBe(3);
    expect(counts.foc).toBe(1);
    expect(counts.syn).toBe(5);
    expect(counts.neu).toBe(8);
    expect(counts.reg).toBe(5);
    expect(counts.con).toBe(4);
    expect(counts.met).toBe(3);
    expect(counts.new).toBe(6);
  });
  test('Upgrade IDs are unique', () => {
    const ids = UPGRADES.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  test('Region upgrades are priced in Memorias (GDD §16)', () => {
    const regionUpgrades = UPGRADES.filter((u) => u.category === 'reg');
    expect(regionUpgrades.length).toBe(5);
    for (const u of regionUpgrades) {
      expect(u.costCurrency).toBe('memorias');
    }
  });
  test('Non-region upgrades are priced in Thoughts', () => {
    const nonRegion = UPGRADES.filter((u) => u.category !== 'reg');
    expect(nonRegion.length).toBe(30);
    for (const u of nonRegion) {
      expect(u.costCurrency).toBe('thoughts');
    }
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
