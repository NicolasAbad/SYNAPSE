// Sprint 11a Phase 11a.5 — meta-tests that keep the audit scripts under
// the test suite so they can't silently bitrot. Per SPRINTS.md §Sprint 11a
// line 1042 ("rule-coverage grep: all 157 rules referenced") and line 1043
// ("scripts/check-invention.sh — all 4 gates green on full codebase").
//
// What this catches:
//   - Someone removes a rule from GDD without adjusting the allowlist
//     (rule-coverage script exits 1 — caught here)
//   - Someone adds a new hex code to UI_MOCKUPS or tokens.ts without
//     extending the palette allowlist (palette script exits 1 — caught
//     here; or extends GDD without adding to either side)
//
// Both scripts maintain explicit allowlists that documenting expected
// drift. New uncategorized drift fails the test until either the source
// is reconciled or the allowlist is extended with rationale.

import { describe, test, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '..', '..');

function runScript(script: string): { stdout: string; status: number } {
  try {
    const stdout = execFileSync('bash', [script], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { stdout, status: 0 };
  } catch (e) {
    const err = e as { status?: number; stdout?: string | Buffer; stderr?: string | Buffer };
    return {
      stdout: String(err.stdout ?? '') + String(err.stderr ?? ''),
      status: err.status ?? 1,
    };
  }
}

// Default vitest timeout is 5s; these scripts shell out, grep across
// hundreds of files, and need more headroom. 30s is generous on CI hardware.
const SCRIPT_TIMEOUT_MS = 30_000;

describe('Audit scripts (Sprint 11a Phase 11a.5)', () => {
  test('check-rule-coverage.sh exits 0 — every enforceable GDD rule is covered or allowlisted', () => {
    const { stdout, status } = runScript('scripts/check-rule-coverage.sh');
    expect(status, stdout).toBe(0);
    // Sanity: must report a non-trivial total. If GDD shrank below this, the
    // allowlist or extraction probably broke.
    expect(stdout).toMatch(/Total IDs in GDD:\s+\d{2,}/);
  }, SCRIPT_TIMEOUT_MS);

  test('check-palette-drift.sh exits 0 — UI_MOCKUPS hex aligned with tokens.ts COLORS', () => {
    const { stdout, status } = runScript('scripts/check-palette-drift.sh');
    expect(status, stdout).toBe(0);
    expect(stdout).toMatch(/UI_MOCKUPS hex codes:\s+\d+/);
    expect(stdout).toMatch(/tokens\.ts hex codes:\s+\d+/);
  }, SCRIPT_TIMEOUT_MS);

  // Note: check-invention.sh itself is NOT exercised here — it would
  // recursively invoke vitest (Gate 4 + Gate 5), bloating test runtime
  // without adding signal. The pre-commit hook + `npm run check-invention`
  // already cover it.
});
