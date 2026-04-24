// Sprint 9a Phase 9a.2 — RevenueCat mock adapter contract tests.
// Validates the mock honors the RevenueCatAdapter interface, supports
// configurable failure modes (MONEY-7), and returns typed entitlements.

import { describe, expect, test } from 'vitest';
import { createMockRevenueCatAdapter } from '../../src/platform/revenuecat.mock';

describe('createMockRevenueCatAdapter', () => {
  test('default mock has no active entitlements', async () => {
    const a = createMockRevenueCatAdapter();
    const info = await a.getCustomerInfo();
    expect(info.activeEntitlements).toEqual([]);
  });

  test('initialEntitlements seeds the active list', async () => {
    const a = createMockRevenueCatAdapter({ initialEntitlements: ['genius_pass'] });
    const info = await a.getCustomerInfo();
    expect(info.activeEntitlements).toEqual(['genius_pass']);
  });

  test('initialize is a no-op (resolves)', async () => {
    const a = createMockRevenueCatAdapter();
    await expect(a.initialize()).resolves.toBeUndefined();
  });

  test('restorePurchases echoes the seeded entitlements (success path)', async () => {
    const a = createMockRevenueCatAdapter({ initialEntitlements: ['genius_pass'] });
    const info = await a.restorePurchases();
    expect(info.activeEntitlements).toEqual(['genius_pass']);
  });

  test('restorePurchases on a clean mock returns empty (none-found path)', async () => {
    const a = createMockRevenueCatAdapter();
    const info = await a.restorePurchases();
    expect(info.activeEntitlements).toEqual([]);
  });

  test('failRestore: true → restorePurchases rejects (MONEY-7 failure path)', async () => {
    const a = createMockRevenueCatAdapter({ failRestore: true });
    await expect(a.restorePurchases()).rejects.toThrow('mock: restorePurchases failed');
  });

  test('failGetCustomerInfo: true → getCustomerInfo rejects', async () => {
    const a = createMockRevenueCatAdapter({ failGetCustomerInfo: true });
    await expect(a.getCustomerInfo()).rejects.toThrow('mock: getCustomerInfo failed');
  });

  test('returned activeEntitlements is a fresh copy (mutation safety)', async () => {
    const a = createMockRevenueCatAdapter({ initialEntitlements: ['genius_pass'] });
    const info = await a.getCustomerInfo();
    info.activeEntitlements.push('genius_pass'); // mutate caller copy
    const fresh = await a.getCustomerInfo();
    expect(fresh.activeEntitlements).toEqual(['genius_pass']); // unchanged
  });
});
