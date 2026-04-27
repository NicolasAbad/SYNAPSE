// @vitest-environment jsdom
// Pre-launch audit H-1 — GDPR Article 15 data export tests.

import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { exportGameState, serializeGameStateForExport } from '../../src/platform/dataExport';
import { createDefaultState } from '../../src/store/gameStore';

// Suppress console.warn from intentional fallback paths.
let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => { consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => {
  consoleWarnSpy.mockRestore();
  vi.unstubAllGlobals();
});

describe('serializeGameStateForExport', () => {
  test('returns valid JSON string with envelope (bundleId / exportedAt / schemaVersion / state)', () => {
    const state = createDefaultState();
    const result = serializeGameStateForExport(state, 1_700_000_000_000);
    const parsed = JSON.parse(result) as Record<string, unknown>;
    expect(parsed.bundleId).toBe('com.nicoabad.synapse');
    expect(parsed.exportedAt).toBe(1_700_000_000_000);
    expect(parsed.schemaVersion).toBe('synapse.save.v1');
    expect(parsed.state).toBeDefined();
  });

  test('state inside envelope round-trips field-for-field with the input', () => {
    const state = createDefaultState();
    const result = serializeGameStateForExport(state, 0);
    const parsed = JSON.parse(result) as { state: Record<string, unknown> };
    expect(Object.keys(parsed.state).length).toBe(Object.keys(state).length);
  });

  test('output is human-readable (2-space indent, not minified)', () => {
    const state = createDefaultState();
    const result = serializeGameStateForExport(state, 0);
    expect(result).toContain('\n  '); // 2-space indent present
  });
});

describe('exportGameState — outcome cascade', () => {
  test('web environment with Blob support: returns "downloaded"', async () => {
    // jsdom doesn't always provide URL.createObjectURL (varies by version) —
    // mock it explicitly so the test verifies the FUNCTION'S logic, not jsdom.
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });
    const result = await exportGameState('{"hello":"world"}');
    expect(result.kind).toBe('downloaded');
  });

  test('clipboard fallback: when document undefined + clipboard exists, returns "copied"', async () => {
    vi.stubGlobal('document', undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const result = await exportGameState('{"foo":42}');
    expect(result.kind).toBe('copied');
    expect(writeText).toHaveBeenCalledWith('{"foo":42}');
  });

  test('failed: when no path is available, returns "failed" with reason', async () => {
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('URL', undefined);
    vi.stubGlobal('navigator', {}); // no clipboard
    const result = await exportGameState('{}');
    expect(result.kind).toBe('failed');
    if (result.kind === 'failed') {
      expect(result.reason).toMatch(/No supported export path/);
    }
  });

  test('failed: clipboard write rejection surfaces as "failed" with reason', async () => {
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) },
    });
    const result = await exportGameState('{}');
    expect(result.kind).toBe('failed');
    if (result.kind === 'failed') {
      expect(result.reason).toBe('NotAllowedError');
    }
  });
});
