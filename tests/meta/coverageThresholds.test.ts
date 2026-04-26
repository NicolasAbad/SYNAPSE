// Sprint 11a Phase 11a.1 — coverage threshold meta-test.
//
// Pre-commit (npm test) doesn't run coverage for speed reasons (~30s overhead).
// Coverage thresholds enforce on `npm run test:coverage`, which CI runs.
//
// This meta-test makes sure the THRESHOLDS THEMSELVES don't silently regress —
// e.g. if someone "fixes" a build break by dropping engine to 50%. By asserting
// the values in vitest.config.ts directly, we catch threshold tampering at
// pre-commit even though the actual coverage run isn't there.

import { describe, expect, test } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const CONFIG_PATH = path.resolve(__dirname, '../../vitest.config.ts');
const config = fs.readFileSync(CONFIG_PATH, 'utf-8');

describe('Sprint 11a Phase 11a.1 — coverage threshold floors', () => {
  test('engine bucket has all four metrics at ≥85% per SPRINTS.md', () => {
    const engineBlock = extractBlock(config, "'src/engine/\\*\\*'");
    expect(engineBlock).toMatch(/statements:\s*85/);
    expect(engineBlock).toMatch(/branches:\s*80/);
    expect(engineBlock).toMatch(/functions:\s*85/);
    expect(engineBlock).toMatch(/lines:\s*85/);
  });

  test('store bucket has all four metrics at ≥75% per SPRINTS.md', () => {
    const storeBlock = extractBlock(config, "'src/store/\\*\\*'");
    expect(storeBlock).toMatch(/statements:\s*75/);
    expect(storeBlock).toMatch(/branches:\s*70/);
    expect(storeBlock).toMatch(/functions:\s*75/);
    expect(storeBlock).toMatch(/lines:\s*75/);
  });

  test('ui (components) bucket has all four metrics at ≥60% per SPRINTS.md', () => {
    const uiBlock = extractBlock(config, "'src/ui/\\*\\*'");
    expect(uiBlock).toMatch(/statements:\s*60/);
    expect(uiBlock).toMatch(/branches:\s*55/);
    expect(uiBlock).toMatch(/functions:\s*60/);
    expect(uiBlock).toMatch(/lines:\s*60/);
  });

  test('coverage provider is v8 (matches @vitest/coverage-v8 dep)', () => {
    expect(config).toMatch(/provider:\s*'v8'/);
  });

  test('canonical config files (src/config/) excluded from coverage', () => {
    expect(config).toMatch(/'src\/config\/\*\*'/);
  });

  test('sim helpers (src/sim/) excluded from coverage', () => {
    expect(config).toMatch(/'src\/sim\/\*\*'/);
  });
});

function extractBlock(source: string, keyPattern: string): string {
  const re = new RegExp(`${keyPattern}\\s*:\\s*\\{[^}]+\\}`, 'm');
  const match = source.match(re);
  if (match === null) throw new Error(`Could not find threshold block for ${keyPattern}`);
  return match[0];
}
