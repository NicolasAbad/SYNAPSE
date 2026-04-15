import { SYNAPSE_CONSTANTS } from '@/config/constants';

const SUFFIXES = SYNAPSE_CONSTANTS.NUMBER_SUFFIXES;
const BASE = 1000;

export function formatNumber(value: number): string {
  const v = Math.floor(value);
  if (v < BASE) return String(v);
  let tier = 0;
  let scaled = v;
  while (scaled >= BASE && tier < SUFFIXES.length - 1) {
    scaled /= BASE;
    tier += 1;
  }
  const suffix = SUFFIXES[tier];
  const formatted = scaled >= 100 ? scaled.toFixed(0) : scaled.toFixed(1);
  return `${formatted}${suffix}`;
}

export function formatRate(value: number): string {
  return `+${formatNumber(value)}/s`;
}
