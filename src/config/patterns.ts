// Implements docs/GDD.md §10 (Pattern Tree — 50 nodes + 5 decisions at
// indices [6, 15, 24, 36, 48]). Sprint 4b Phase 4b.1 — canonical storage
// file for the 10 decision-option effects (5 nodes × A/B).
//
// CANONICAL STORAGE FILE per CLAUDE.md "Canonical storage file rule":
// pure data, no logic. The 10 effect values (0.08 / 1.15 / 1.20 / 3 / 2 /
// 0.65 / 1.10 / 1.30 / 1) are copied verbatim from GDD §10 table. Gate 3
// auto-excludes src/config/ from its literal count (Sprint 1 Phase 8 precedent).
//
// The `kind` discriminants are intentionally distinct from UpgradeEffect's
// so consumer sites (production.ts / discharge.ts / offline.ts / etc.)
// distinguish "effect from upgrade" vs "effect from pattern decision"
// without needing a shared registry. Parallel approach to UPGRADES.

import type { PatternDecisionEffect } from '../types';

export interface PatternDecisionOption {
  readonly description: string; // audit cross-ref to GDD §10 (human-readable)
  readonly effect: PatternDecisionEffect;
}

export interface PatternDecisionDef {
  readonly nodeIndex: number; // one of [6, 15, 24, 36, 48]
  readonly A: PatternDecisionOption;
  readonly B: PatternDecisionOption;
}

/**
 * The 5 binary decisions of the Pattern Tree. Keyed by the pattern-count
 * threshold that unlocks them (matches `patternDecisionNodes` in constants).
 *
 * Node 36 tier-2 (INT-5): at `prestigeCount >= 13`, Option B additionally
 * generates Resonance on Discharge. The Resonance side lives in Sprint 8b
 * (Resonance currency isn't wired yet) — this file declares the data shape;
 * the gate logic is in `src/engine/discharge.ts` when 8b ships.
 */
export const PATTERN_DECISIONS: Readonly<Record<6 | 15 | 24 | 36 | 48, PatternDecisionDef>> = {
  6: {
    nodeIndex: 6,
    A: { description: '+8% cycle bonus', effect: { kind: 'cycle_bonus_add', add: 0.08 } },
    B: { description: '+1 max Discharge charge', effect: { kind: 'discharge_charges_plus_one' } },
  },
  15: {
    nodeIndex: 15,
    A: { description: '+15% offline efficiency', effect: { kind: 'offline_efficiency_mult', mult: 1.15 } },
    B: { description: 'Focus fills +20% faster', effect: { kind: 'focus_fill_rate_mult', mult: 1.20 } },
  },
  24: {
    nodeIndex: 24,
    A: { description: 'Insight duration +3s', effect: { kind: 'insight_duration_add_s', add: 3 } },
    B: { description: '+2 Memories per prestige', effect: { kind: 'memories_per_prestige_add', add: 2 } },
  },
  36: {
    nodeIndex: 36,
    A: { description: 'Cascade threshold 75%→65%', effect: { kind: 'cascade_threshold_set', threshold: 0.65 } },
    B: { description: '+10% Discharge damage (P13+ also Resonance on Discharge)', effect: { kind: 'discharge_damage_mult', mult: 1.10 } },
  },
  48: {
    nodeIndex: 48,
    A: { description: 'Regions give ×1.3', effect: { kind: 'region_mult', mult: 1.30 } },
    B: { description: '+1 Mutation option (4 total)', effect: { kind: 'mutation_options_add', add: 1 } },
  },
};

/** Minimum prestigeCount for Node 36 Option B's Resonance side-effect (INT-5). */
export const NODE_36_TIER_2_MIN_PRESTIGE = 13;
