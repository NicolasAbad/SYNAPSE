import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts'],
    setupFiles: ['./tests/setup/canvasMock.ts'],
    coverage: {
      // Sprint 11a Phase 11a.1 — coverage thresholds enforced. Per SPRINTS.md
      // lines 1010+: engine ≥85, store ≥75, components ≥60. All three buckets
      // cleared the bar at sprint kickoff (engine 99.0 / store 90.5 / ui 85.3
      // baseline 2026-04-26) — thresholds here are FLOORS that prevent
      // regression, not targets to chase.
      provider: 'v8',
      reporter: ['text-summary'],
      include: ['src/**'],
      // Excludes:
      //   - canonical config (data, not behavior)
      //   - i18n strings (translation bulk, no logic)
      //   - sim helpers (run via npm run sim, not the test suite)
      //   - .test.ts files (the tests themselves)
      //   - .d.ts type-only files (no runtime)
      //   - main.tsx (entry boot, browser-only)
      exclude: [
        'src/config/**',
        'src/sim/**',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.d.ts',
        'src/main.tsx',
      ],
      // Per-bucket thresholds via the path-keyed map (vitest v0.34+).
      thresholds: {
        'src/engine/**': {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85,
        },
        'src/store/**': {
          statements: 75,
          branches: 70,
          functions: 75,
          lines: 75,
        },
        'src/ui/**': {
          statements: 60,
          branches: 55,
          functions: 60,
          lines: 60,
        },
      },
    },
  },
});
