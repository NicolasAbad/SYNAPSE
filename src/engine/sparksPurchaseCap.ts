// Implements docs/GDD.md §26 MONEY-8 (Spark monthly cap + UTC month reset).
// Sprint 9b Phase 9b.5.
//
// Pure helper (CODE-9: no Math.random, no Date.now — caller passes nowTimestamp).
// Computes MONEY-8 rollover + checks whether a proposed Spark purchase fits.
// Per GDD §26 pseudocode: monthly cap is 1000 Sparks; the month boundary is
// `startOfCurrentMonthUTC(now)`. First-ever purchase (sparksPurchaseMonthStart=0)
// always triggers a reset from 1970-01 → current month.

import { SYNAPSE_CONSTANTS } from '../config/constants';
import type { GameState } from '../types/GameState';

/** MONEY-8 helper: compute the UTC midnight timestamp of the 1st of the current month. */
export function startOfCurrentMonthUTC(nowTimestamp: number): number {
  const d = new Date(nowTimestamp);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1); // CONST-OK (MONEY-8 pseudocode)
}

export type SparksPurchaseDecision =
  | { allowed: true; resetApplied: boolean; effectivePurchasedThisMonth: number }
  | { allowed: false; reason: 'cap_reached'; remaining: number };

export interface SparksPurchaseInput {
  state: Pick<GameState, 'sparksPurchasedThisMonth' | 'sparksPurchaseMonthStart'>;
  packAmount: number;
  nowTimestamp: number;
}

/**
 * Decide whether a Spark pack purchase is allowed under MONEY-8. Also returns
 * whether a month-rollover reset was applied (the caller re-stamps
 * `sparksPurchaseMonthStart` on success + commits the new `sparksPurchasedThisMonth`).
 */
export function evaluateSparksPurchase({ state, packAmount, nowTimestamp }: SparksPurchaseInput): SparksPurchaseDecision {
  const monthStart = startOfCurrentMonthUTC(nowTimestamp);
  const resetApplied = state.sparksPurchaseMonthStart !== monthStart;
  const effectivePurchasedThisMonth = resetApplied ? 0 : state.sparksPurchasedThisMonth;
  const afterPurchase = effectivePurchasedThisMonth + packAmount;
  if (afterPurchase > SYNAPSE_CONSTANTS.maxSparksPurchasedPerMonth) {
    return { allowed: false, reason: 'cap_reached', remaining: Math.max(0, SYNAPSE_CONSTANTS.maxSparksPurchasedPerMonth - effectivePurchasedThisMonth) };
  }
  return { allowed: true, resetApplied, effectivePurchasedThisMonth };
}
