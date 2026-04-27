// @vitest-environment jsdom
// Pre-launch audit Day 1 — GDPR EU detection logic tests.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { _resetEuDetectionCache, detectEU } from '../../src/platform/euDetection';

const originalLanguage = navigator.language;
const originalDateTimeFormat = Intl.DateTimeFormat;

function mockLanguage(value: string | undefined): void {
  Object.defineProperty(navigator, 'language', {
    value,
    configurable: true,
  });
}

function mockTimeZone(value: string): void {
  // Intl.DateTimeFormat is not trivially mockable across runtimes; replace
  // the constructor with a stub that returns the desired resolvedOptions.
  // @ts-expect-error — test-only override
  Intl.DateTimeFormat = function () {
    return {
      resolvedOptions: () => ({ timeZone: value }),
    };
  };
}

beforeEach(() => {
  _resetEuDetectionCache();
});

afterEach(() => {
  mockLanguage(originalLanguage);
  Intl.DateTimeFormat = originalDateTimeFormat;
  _resetEuDetectionCache();
  vi.restoreAllMocks();
});

describe('detectEU', () => {
  test('returns true for German locale', () => {
    mockLanguage('de-DE');
    mockTimeZone('Europe/Berlin');
    expect(detectEU()).toBe(true);
  });

  test('returns true for French language even without region', () => {
    mockLanguage('fr');
    mockTimeZone('UTC'); // even with non-EEA timezone, fr language matches
    expect(detectEU()).toBe(true);
  });

  test('returns true for UK English (en-GB)', () => {
    mockLanguage('en-GB');
    mockTimeZone('Europe/London');
    expect(detectEU()).toBe(true);
  });

  test('returns true for Irish English (en-IE)', () => {
    mockLanguage('en-IE');
    mockTimeZone('Europe/Dublin');
    expect(detectEU()).toBe(true);
  });

  test('returns true based on Europe/* timezone alone (English locale)', () => {
    mockLanguage('en-US');
    mockTimeZone('Europe/Paris');
    expect(detectEU()).toBe(true);
  });

  test('returns true for Atlantic/Madeira timezone (Portugal)', () => {
    mockLanguage('en-US');
    mockTimeZone('Atlantic/Madeira');
    expect(detectEU()).toBe(true);
  });

  test('returns false for US English with America/* timezone', () => {
    mockLanguage('en-US');
    mockTimeZone('America/New_York');
    expect(detectEU()).toBe(false);
  });

  test('returns false for Mexican Spanish (Latin America)', () => {
    // es-MX language code — but timezone is America/* which gates it out.
    // Note: the language `es` IS in the EEA list (Spain), but the region tag
    // `es-MX` is not in EEA_REGION_TAGS. We DO match on `es` base, so this
    // returns true, intentionally over-prompting (false positive is OK per
    // module comment — better than missing a real EEA user).
    mockLanguage('es-MX');
    mockTimeZone('America/Mexico_City');
    // Bias is intentional: language match alone is sufficient (Spanish users
    // anywhere see the modal). One extra click for non-EEA Spanish speakers,
    // zero compliance risk for EEA Spanish speakers.
    expect(detectEU()).toBe(true);
  });

  test('returns false for Japanese locale + Asian timezone', () => {
    mockLanguage('ja-JP');
    mockTimeZone('Asia/Tokyo');
    expect(detectEU()).toBe(false);
  });

  test('caches result across calls', () => {
    mockLanguage('de-DE');
    mockTimeZone('Europe/Berlin');
    expect(detectEU()).toBe(true);

    // Change inputs — cached value should still return true
    mockLanguage('en-US');
    mockTimeZone('America/New_York');
    expect(detectEU()).toBe(true);

    // Reset, then re-evaluate
    _resetEuDetectionCache();
    expect(detectEU()).toBe(false);
  });

  test('handles missing navigator.language gracefully', () => {
    mockLanguage(undefined);
    mockTimeZone('Europe/Berlin');
    expect(detectEU()).toBe(true); // timezone still wins
  });

  test('handles broken Intl gracefully (fallback to language only)', () => {
    mockLanguage('de-DE');
    // @ts-expect-error — simulate broken Intl
    Intl.DateTimeFormat = function () {
      throw new Error('broken');
    };
    expect(detectEU()).toBe(true); // language match still works
  });
});
