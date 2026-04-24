// Implements docs/GDD.md §26 (Monetization) — RevenueCat platform adapter.
// Sprint 9a Phase 9a.2.
//
// Adapter pattern: callers depend on the RevenueCatAdapter interface; the real
// SDK is reached only via createRevenueCatAdapter(). Tests use the mock factory
// (./revenuecat.mock.ts). Native-only guard: createRevenueCatAdapter throws if
// invoked off-native; App.tsx must check Capacitor.isNativePlatform() first.

import { Capacitor } from '@capacitor/core';

export type EntitlementId = 'genius_pass';

export interface CustomerInfo {
  activeEntitlements: EntitlementId[];
}

export interface RevenueCatAdapter {
  initialize: () => Promise<void>;
  getCustomerInfo: () => Promise<CustomerInfo>;
  restorePurchases: () => Promise<CustomerInfo>;
}

function pickApiKey(): string {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') return import.meta.env.VITE_REVENUECAT_IOS_KEY ?? '';
  if (platform === 'android') return import.meta.env.VITE_REVENUECAT_ANDROID_KEY ?? '';
  return '';
}

/** Map RevenueCat's CustomerInfo.entitlements.active → strongly-typed list. */
function toEntitlements(rcEntitlements: Record<string, unknown> | undefined): EntitlementId[] {
  if (!rcEntitlements) return [];
  return Object.keys(rcEntitlements).filter(isEntitlementId);
}

function isEntitlementId(id: string): id is EntitlementId {
  return id === 'genius_pass';
}

export function createRevenueCatAdapter(): RevenueCatAdapter {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('createRevenueCatAdapter: native-only — caller must guard with Capacitor.isNativePlatform()');
  }
  return {
    initialize: async () => {
      const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
      await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
      await Purchases.configure({ apiKey: pickApiKey() });
    },
    getCustomerInfo: async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const result = await Purchases.getCustomerInfo();
      return { activeEntitlements: toEntitlements(result.customerInfo.entitlements.active as Record<string, unknown> | undefined) };
    },
    restorePurchases: async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const result = await Purchases.restorePurchases();
      return { activeEntitlements: toEntitlements(result.customerInfo.entitlements.active as Record<string, unknown> | undefined) };
    },
  };
}
