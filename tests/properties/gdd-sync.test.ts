// GDD ↔ constants.ts cross-check (Phase 4.5).
//
// Reads docs/GDD.md §31 at test time, extracts numeric key:value pairs
// from the SYNAPSE_CONSTANTS code block, and cross-checks each against
// the runtime `SYNAPSE_CONSTANTS` object.
//
// Why this matters:
//   - Previous consistency tests encoded GDD values in test assertions
//     as LITERALS. If I typo'd a value in BOTH constants.ts AND the test,
//     the test would pass silently.
//   - This test uses GDD.md as the ORACLE. Divergence between the doc
//     and the code is caught immediately.
//   - Limitation: only parses scalar number values (`key: NNN,`).
//     Arrays (baseThresholdTable, runThresholdMult, etc.) are handled
//     separately via dedicated consistency tests (they need human review
//     for tuning changes — parsing them here would false-positive noise).

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, test } from 'vitest';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

// Parse `  key: 1_234.56,` style entries inside the §31 TS code block.
// Accepts optional underscores (1_000), decimals, and negatives.
// Rejects array/object-valued keys (intentionally — arrays need dedicated checks).
function parseScalarConstants(gddSource: string): Record<string, number> {
  // Locate §31 code block.
  const section = gddSource.match(/# 31\. Constants[\s\S]*?```ts([\s\S]*?)```/);
  if (!section) throw new Error('GDD §31 constants block not found');
  const body = section[1];
  const out: Record<string, number> = {};
  // Match `  key: 1_234.56,` on its own — excludes arrays ([...]) and objects ({...})
  const lineRegex = /^\s*([a-zA-Z][a-zA-Z0-9]*)\s*:\s*(-?[\d_]+(?:\.\d+)?)\s*,/gm;
  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(body)) !== null) {
    const key = match[1];
    const numStr = match[2].replace(/_/g, '');
    const num = Number(numStr);
    if (!Number.isNaN(num)) out[key] = num;
  }
  return out;
}

const GDD_PATH = path.join(process.cwd(), 'docs', 'GDD.md');

describe('GDD §31 ↔ SYNAPSE_CONSTANTS cross-check (scalars)', () => {
  const gddSource = fs.readFileSync(GDD_PATH, 'utf-8');
  const parsed = parseScalarConstants(gddSource);

  test('GDD §31 block exists and yields ≥20 scalar constants', () => {
    expect(Object.keys(parsed).length).toBeGreaterThanOrEqual(20);
  });

  // Generate one test per parsed scalar. If GDD says X and code says Y,
  // the test names the specific key — easy to triage.
  for (const [key, gddValue] of Object.entries(parsed)) {
    test(`GDD.md declares ${key} = ${gddValue} → matches SYNAPSE_CONSTANTS.${key}`, () => {
      const runtimeValue = (SYNAPSE_CONSTANTS as Record<string, unknown>)[key];
      if (runtimeValue === undefined) {
        // Key in GDD but not in code — flag as drift.
        throw new Error(`GDD §31 declares ${key} but SYNAPSE_CONSTANTS has no such key`);
      }
      if (typeof runtimeValue !== 'number') {
        throw new Error(`SYNAPSE_CONSTANTS.${key} is ${typeof runtimeValue}, expected number`);
      }
      expect(runtimeValue).toBeCloseTo(gddValue, 10);
    });
  }
});

describe('GDD §31 parser sanity checks', () => {
  const gddSource = fs.readFileSync(GDD_PATH, 'utf-8');
  const parsed = parseScalarConstants(gddSource);

  test('parser extracts several known scalars (smoke test)', () => {
    // If these specific keys are missing from the parser output, the §31
    // block structure changed and other assertions may be stale.
    expect(parsed).toHaveProperty('tutorialThreshold');
    expect(parsed).toHaveProperty('costMult');
    expect(parsed).toHaveProperty('softCapExponent');
    expect(parsed).toHaveProperty('cascadeThreshold');
  });

  test('parser rejects array/object values (stays scalar-only)', () => {
    // runThresholdMult is an array — should NOT be in the scalar output.
    // If it were parsed, the comparison to SYNAPSE_CONSTANTS (which holds it as a ReadonlyArray) would throw.
    expect(parsed).not.toHaveProperty('runThresholdMult');
    expect(parsed).not.toHaveProperty('baseThresholdTable');
  });
});
