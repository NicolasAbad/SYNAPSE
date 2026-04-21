/**
 * Format a number with K/M/B/T/Q suffixes and dynamic precision.
 *
 * Precision rules (applied to the displayed scaled value):
 *   < 10  → up to 2 decimal places
 *   < 100 → up to 1 decimal place
 *   ≥ 100 → 0 decimal places
 * Trailing zeros after the decimal are trimmed: "1.50" → "1.5".
 *
 * Values above 999Q show "999Q+" (prevents 4-digit suffix displays
 * that would overflow the HUD counter width).
 *
 * Preserves fractions below 1000 — used for RATE displays (e.g. "0.5/s").
 * For CURRENCY displays (thoughts/memories/costs), use `formatCurrency`
 * instead (CODE-5 compliance: integer-floored).
 *
 * SPRINTS.md §Sprint 2 test expectations:
 *   formatNumber(1234)    === "1.23K"
 *   formatNumber(1.5e9)   === "1.5B"
 *   formatNumber(1.5e12)  === "1.5T"
 *   formatNumber(2.34e15) === "2.34Q"
 */

const SUFFIXES: readonly { threshold: number; suffix: string }[] = [
  { threshold: 1e15, suffix: 'Q' },
  { threshold: 1e12, suffix: 'T' },
  { threshold: 1e9, suffix: 'B' },
  { threshold: 1e6, suffix: 'M' },
  { threshold: 1e3, suffix: 'K' },
];

const MIN_SUFFIX_THRESHOLD = 1e3;
const MAX_DISPLAYABLE = 999e15; // above this → "999Q+" cap

export function formatNumber(n: number): string {
  if (n === 0) return '0';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs > MAX_DISPLAYABLE) return `${sign}999Q+`;
  if (abs < MIN_SUFFIX_THRESHOLD) return sign + formatScaled(abs);
  for (const { threshold, suffix } of SUFFIXES) {
    if (abs >= threshold) return `${sign}${formatScaled(abs / threshold)}${suffix}`;
  }
  // Unreachable: abs < MIN_SUFFIX_THRESHOLD handled above, ≥ MIN hits K branch.
  return String(n);
}

function formatScaled(value: number): string {
  if (value < 10) return trimTrailing(value.toFixed(2)); // CONST-OK: precision boundary per SPRINTS.md §Sprint 2
  if (value < 100) return trimTrailing(value.toFixed(1)); // CONST-OK: precision boundary per SPRINTS.md §Sprint 2
  return value.toFixed(0);
}

function trimTrailing(s: string): string {
  if (!s.includes('.')) return s;
  return s.replace(/0+$/, '').replace(/\.$/, '');
}

/**
 * Currency display — CODE-5 "Math.floor() all displayed numbers" per CLAUDE.md.
 * Floors the value BEFORE handing to formatNumber so small-value costs show
 * as integers (cost 12.8 → "12") while large values keep K/M/B/T/Q scaling.
 *
 * Use for: thoughts, memories, sparks, purchase costs, refund amounts.
 * NOT for: production rates (use `formatNumber` — "0.5/s" is correct).
 *
 * Sprint 4c Phase 4c.6 — added after blind-playtest audit flagged "12.8" cost
 * display as reading broken to idle-genre players. `formatNumber` stayed
 * decimal-preserving for rate displays that legitimately need fractions.
 */
export function formatCurrency(n: number): string {
  return formatNumber(Math.floor(n));
}
