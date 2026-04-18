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
