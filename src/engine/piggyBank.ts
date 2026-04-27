// Implements GDD.md §35 MONEY-10 (Piggy Bank cap) + pre-launch audit Day 3 (B7).
//
// Effective cap formula:
//   effective = min(base + prestigeCount * perPrestige, ceiling)
//
// Pre-audit constant `piggyBankMaxSparks: 500` was a flat cap. Audit finding
// B7: at P10+ the cap fills in hours and trivializes the engagement hook; by
// P25 it fills sub-minute. Scaling per-prestige preserves the engagement hook
// across the full prestige curve while the ceiling prevents runaway hoarding.

import { SYNAPSE_CONSTANTS } from '../config/constants';

export function effectivePiggyBankCap(prestigeCount: number): number {
  const base = SYNAPSE_CONSTANTS.piggyBankMaxSparks;
  const perPrestige = SYNAPSE_CONSTANTS.piggyBankCapPerPrestige;
  const ceiling = SYNAPSE_CONSTANTS.piggyBankCapCeiling;
  const scaled = base + Math.max(0, prestigeCount) * perPrestige;
  return Math.min(scaled, ceiling);
}
