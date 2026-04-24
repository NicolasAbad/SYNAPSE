// Mock RevenueCat adapter — Sprint 9a Phase 9a.2.
// Used by Vitest tests + dev/web preview where the native SDK can't run.
// Configurable failure modes let tests cover MONEY-7 (ad/store failure paths).

import type { RevenueCatAdapter, CustomerInfo, EntitlementId } from './revenuecat';

export interface MockOptions {
  /** Pre-seed active entitlements (default: []). */
  initialEntitlements?: EntitlementId[];
  /** When true, restorePurchases rejects (used to test failure UI). */
  failRestore?: boolean;
  /** When true, getCustomerInfo rejects (used to test init-time failure). */
  failGetCustomerInfo?: boolean;
}

export function createMockRevenueCatAdapter(opts: MockOptions = {}): RevenueCatAdapter {
  const entitlements: EntitlementId[] = [...(opts.initialEntitlements ?? [])];
  return {
    initialize: async () => { /* no-op */ },
    getCustomerInfo: async (): Promise<CustomerInfo> => {
      if (opts.failGetCustomerInfo) throw new Error('mock: getCustomerInfo failed');
      return { activeEntitlements: [...entitlements] };
    },
    restorePurchases: async (): Promise<CustomerInfo> => {
      if (opts.failRestore) throw new Error('mock: restorePurchases failed');
      return { activeEntitlements: [...entitlements] };
    },
  };
}

