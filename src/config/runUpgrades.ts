// Implements GDD §21 — 4 Run-exclusive upgrades for v1.0 (2 Run 2 + 2 Run 3).
// Sprint 8b Phase 8b.5. Sprint 6.8 note: original spec "6 run-exclusive upgrades"
// was aspirational; 2 are POSTLAUNCH (memoria_ancestral, consciencia_plena).
//
// CANONICAL STORAGE FILE per CLAUDE.md "Canonical storage file rule". Costs +
// effects come verbatim from GDD §21 tables. Gate 3 auto-excludes src/config/.
//
// RUN-1: survives Transcendence (`runUpgradesPurchased: string[]`).
// RUN-2: does NOT count toward 35-upgrade limit. Displayed in a separate
// "Run Upgrades" section of the Upgrades tab.
//
// Consumer status (Sprint 8b Phase 8b.5):
//   WIRED: sueno_profundo (offline cap +4h, parallels time_dilation),
//          despertar_acelerado (threshold ×0.8 for P1-P3).
//   STUBBED: eco_ancestral (retro +1 Pattern to last 3 cycles — needs
//            awakeningLog lookback consumer),
//            neurona_pionera (first-neuron discount — needs per-cycle flag).
//   The stubbed pair is owned in state.runUpgradesPurchased (purchase UI works)
//   but the runtime effect is deferred to Phase 8b.5b / v1.1 polish.

import type { RunUpgradeDef } from '../types';

export const RUN_UPGRADES: readonly RunUpgradeDef[] = [
  // ─── Run 2+ ──────────────────────────────────────────
  {
    id: 'eco_ancestral',
    unlockAtTranscendenceCount: 1,
    costThoughts: 100_000,
    effect: { kind: 'retro_patterns_last_cycles', extraPerCycle: 1, lookbackCycles: 3 },
  },
  {
    id: 'sueno_profundo',
    unlockAtTranscendenceCount: 1,
    costThoughts: 200_000,
    effect: { kind: 'offline_cap_add_hours', hours: 4 },
  },
  // ─── Run 3+ ──────────────────────────────────────────
  {
    id: 'neurona_pionera',
    unlockAtTranscendenceCount: 2,
    costThoughts: 150_000,
    effect: { kind: 'first_neuron_cost_mult', mult: 0.5 },
  },
  {
    id: 'despertar_acelerado',
    unlockAtTranscendenceCount: 2,
    costThoughts: 300_000,
    effect: { kind: 'early_prestige_threshold_mult', mult: 0.8, maxPrestige: 3 },
  },
] as const;

export const RUN_UPGRADES_BY_ID: Readonly<Record<string, RunUpgradeDef>> = Object.freeze(
  Object.fromEntries(RUN_UPGRADES.map((u) => [u.id, u])),
);
