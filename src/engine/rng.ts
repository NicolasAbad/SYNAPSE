// Implements docs/GDD.md §30 RNG-1 — deterministic PRNG utilities. See §35 CODE-9.
//
// Engine-layer purity: no Math.random(), no Date.now(). Every function here
// is pure — same inputs produce byte-identical outputs across JS engines.
// Seeds are stateless: callers derive seeds from cycleStartTimestamp +
// local counters via hash() and pass them in. No internal PRNG state is
// stored in GameState except `mutationSeed` (per-cycle, MUT-2).
//
// Snapshot values are empirically verified in tests/engine/rng.test.ts.
// Do not modify this file without updating the snapshots.

/**
 * Standard 32-bit seeded PRNG. Returns a generator function; call to advance.
 * Same seed → same sequence across JS engines (all math via Math.imul).
 * Reference: github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32
 */
export function mulberry32(seed: number): () => number {
  // All magic numbers below are algorithm constants from the mulberry32 reference
  // (github.com/bryc/code). Changing any of them breaks the deterministic sequence
  // and fails the snapshot tests. These are NOT designer-tunable.
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1); // CONST-OK (mulberry32 constants)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); // CONST-OK (mulberry32 constants)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // CONST-OK (2^32 normalizer)
  };
}

/**
 * FNV-1a 32-bit hash (offset basis 2166136261, prime 16777619).
 * Numbers coerce via String(input) — hash(0) === hash("0").
 * Output: uint32 in [0, 2^32). Stable across JS engines via Math.imul.
 */
export function hash(input: number | string): number {
  // FNV-1a 32-bit: offset basis 2166136261, prime 16777619. These are the canonical
  // constants from the FNV spec (Fowler/Noll/Vo). Changing them produces a different
  // hash function and fails the hash("0") === 890022063 snapshot.
  let h = 2166136261 >>> 0; // CONST-OK (FNV-1a offset basis)
  const str = String(input);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619); // CONST-OK (FNV-1a prime)
  }
  return h >>> 0;
}

/**
 * One-shot random float in [0, 1) from a seed. Single use — constructs a
 * mulberry32 and discards it. For multi-draw sequences, call mulberry32
 * directly and reuse the returned generator.
 */
export function seededRandom(seed: number): number {
  return mulberry32(seed)();
}

/**
 * Deterministic integer in [min, max] (inclusive both ends) from seed.
 * Used by SPONT-1 for spontaneous event check interval randomization.
 */
export function randomInRange(min: number, max: number, seed: number): number {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

/**
 * Weighted pick from a list of {item, weight} pairs. Deterministic per seed.
 * Weights must be positive; their sum defines the cumulative range that
 * `seededRandom(seed) × totalWeight` lands in. Returns the matched item.
 *
 * Invariants (caller's responsibility):
 * - items.length ≥ 1
 * - every weight > 0 (non-positive weights are silently included but unreachable)
 */
export function pickWeightedRandom<T>(
  items: { item: T; weight: number }[],
  seed: number,
): T {
  let totalWeight = 0;
  for (const entry of items) totalWeight += entry.weight;
  const roll = seededRandom(seed) * totalWeight;
  let cumulative = 0;
  for (const entry of items) {
    cumulative += entry.weight;
    if (roll < cumulative) return entry.item;
  }
  // Reachable only via float rounding when roll ≈ totalWeight exactly.
  return items[items.length - 1].item;
}
