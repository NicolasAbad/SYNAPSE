// Sprint 11a Phase 11a.3 — save fuzz (1000 malformed payloads → migrateState
// recovers OR validator rejects). Per SPRINTS.md §Sprint 11a line 1012 + 1039.
//
// Contract under test (src/store/migrate.ts + src/store/saveGame.ts):
//   1. migrateState(any) MUST NOT throw — defensive at boundary (CODE-8).
//   2. migrateState's output is either:
//      (a) a 133-field object that validateLoadedState ACCEPTS, OR
//      (b) anything else — validateLoadedState REJECTS (returns null), and the
//          caller (loadGame) falls back to createDefaultState silently.
//   3. NEVER an in-between: a partially-malformed object that validateLoadedState
//      accepts but the engine then crashes on. Structural shape is enforced.
//
// Five fuzz categories (combined via fc.oneof, totaling 1000 cases):
//   A. Field deletion       — random subset of 133 fields stripped
//   B. Field type corruption — random fields replaced with wrong primitive
//   C. Extra adversarial keys — 1-50 garbage keys appended
//   D. Random arbitrary objects — fc.dictionary of fc.anything
//   E. Non-object payloads — null / array / primitive / nested junk

import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import * as fc from 'fast-check';
import { migrateState } from '../../src/store/migrate';
import { validateLoadedState } from '../../src/store/saveGame';
import { createDefaultState } from '../../src/store/gameStore';

// validateLoadedState logs to console.error on every rejection — the fuzz
// triggers thousands of these by design. Suppress to keep CI logs readable.
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
beforeAll(() => { consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterAll(() => { consoleErrorSpy.mockRestore(); });

const DEFAULT_KEYS = Object.keys(createDefaultState() as unknown as Record<string, unknown>);

// ---------- Arbitraries ----------

/** A. Random subset of fields stripped from a current default. */
const partialDefaultArb = fc.uniqueArray(fc.constantFrom(...DEFAULT_KEYS), { minLength: 0, maxLength: 133 })
  .map((keysToStrip) => {
    const base = createDefaultState() as unknown as Record<string, unknown>;
    const out: Record<string, unknown> = { ...base };
    for (const k of keysToStrip) delete out[k];
    return out;
  });

/** B. Random subset of fields with corrupted types (wrong primitive). */
const wrongPrimitiveArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.string(),
  fc.boolean(),
  fc.integer(),
  fc.double({ noNaN: false }),
  fc.constant({}),
  fc.constant([]),
);

const corruptedTypesArb = fc.uniqueArray(fc.constantFrom(...DEFAULT_KEYS), { minLength: 1, maxLength: 30 })
  .chain((keysToCorrupt) => fc.tuple(fc.constant(keysToCorrupt), fc.array(wrongPrimitiveArb, { minLength: keysToCorrupt.length, maxLength: keysToCorrupt.length })))
  .map(([keys, badValues]) => {
    const out: Record<string, unknown> = { ...(createDefaultState() as unknown as Record<string, unknown>) };
    for (let i = 0; i < keys.length; i++) out[keys[i]] = badValues[i];
    return out;
  });

/** C. Default + 1-50 adversarial extra keys with random junk values. */
const extraKeysArb = fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), wrongPrimitiveArb, { minKeys: 1, maxKeys: 50 })
  .map((extras) => {
    const base = createDefaultState() as unknown as Record<string, unknown>;
    return { ...base, ...extras };
  });

/** D. Fully arbitrary object with random keys (almost never matches schema). */
const randomObjectArb = fc.dictionary(fc.string({ maxLength: 15 }), wrongPrimitiveArb, { maxKeys: 20 });

/** E. Non-object payloads — null, arrays, primitives. */
const nonObjectArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.string(),
  fc.integer(),
  fc.double({ noNaN: false }),
  fc.boolean(),
  fc.array(wrongPrimitiveArb, { maxLength: 10 }),
);

const fuzzPayloadArb = fc.oneof(
  partialDefaultArb,
  corruptedTypesArb,
  extraKeysArb,
  randomObjectArb,
  nonObjectArb,
);

// ---------- Tests ----------

describe('migrateState save fuzz — 1000 malformed payloads (Sprint 11a 11a.3)', () => {
  test('PROP-FUZZ-1: migrateState NEVER throws on any input (1000 cases)', () => {
    fc.assert(
      fc.property(fuzzPayloadArb, (payload) => {
        // The function must not throw. If it does, fast-check surfaces the input.
        expect(() => migrateState(payload)).not.toThrow();
        return true;
      }),
      { numRuns: 1000 },
    );
  });

  test('PROP-FUZZ-2: migrate→validate yields either valid 133-field GameState OR null (1000 cases)', () => {
    fc.assert(
      fc.property(fuzzPayloadArb, (payload) => {
        const migrated = migrateState(payload);
        const validated = validateLoadedState(migrated);
        // Two acceptable outcomes — there is no third state.
        if (validated === null) return true;
        // If it validated, it MUST be a 133-field plain object.
        return (
          typeof validated === 'object'
          && validated !== null
          && !Array.isArray(validated)
          && Object.keys(validated).length === 133
        );
      }),
      { numRuns: 1000 },
    );
  });

  test('PROP-FUZZ-3: extra adversarial keys cause rejection (validator catches, loader falls back)', () => {
    fc.assert(
      fc.property(extraKeysArb, (payload) => {
        // Default + extras → field count > 133 → validator must reject.
        const migrated = migrateState(payload);
        return validateLoadedState(migrated) === null;
      }),
      { numRuns: 200 },
    );
  });

  test('PROP-FUZZ-4: random objects nearly never match the 133-field shape (validator rejects)', () => {
    fc.assert(
      fc.property(randomObjectArb, (payload) => {
        const migrated = migrateState(payload);
        const v = validateLoadedState(migrated);
        // Random key payloads through migrateState gain backfilled fields, but
        // their non-default base keys mean total ≠ 133 in nearly all cases.
        // Permissive check: if validator accepts, the count MUST be 133.
        if (v !== null) {
          return Object.keys(v).length === 133;
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });

  test('PROP-FUZZ-5: non-object inputs pass through, validator rejects them (loader falls back)', () => {
    fc.assert(
      fc.property(nonObjectArb, (payload) => {
        const migrated = migrateState(payload);
        // migrateState returns non-objects unchanged.
        if (payload === null) return migrated === null && validateLoadedState(migrated) === null;
        if (Array.isArray(payload)) return migrated === payload && validateLoadedState(migrated) === null;
        if (typeof payload !== 'object') return migrated === payload && validateLoadedState(migrated) === null;
        return true;
      }),
      { numRuns: 200 },
    );
  });

  test('PROP-FUZZ-6: pre-existing field values pass through migration unchanged (only missing fields backfilled)', () => {
    // migrate.ts contract: only ADD missing keys + rewrite `upgrades` (strip retired).
    // For every other key already present in the input, Object.is(migrated[k], payload[k])
    // must hold — including NaN (Object.is(NaN, NaN) === true, unlike ===).
    fc.assert(
      fc.property(corruptedTypesArb, (payload) => {
        const payloadObj = payload as Record<string, unknown>;
        const migrated = migrateState(payloadObj) as Record<string, unknown>;
        for (const key of Object.keys(payloadObj)) {
          if (key === 'upgrades') continue; // intentionally rewritten by stripRetiredUpgrades
          if (!Object.is(migrated[key], payloadObj[key])) return false;
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });
});
