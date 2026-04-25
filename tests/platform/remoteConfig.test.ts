// Sprint 10 Phase 10.7 — Remote Config adapter tests.
// On web/jsdom (Capacitor.isNativePlatform() === false), initRemoteConfig
// short-circuits without fetching; getRemoteValue falls back to the local
// SYNAPSE_CONSTANTS values via BOUNDS.fallback for all keys.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { __resetRemoteConfigForTests, getRemoteValue, initRemoteConfig } from '../../src/platform/remoteConfig';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

beforeEach(() => __resetRemoteConfigForTests());
afterEach(() => __resetRemoteConfigForTests());

describe('remoteConfig — inert + fallback on non-native', () => {
  test('initRemoteConfig resolves without throwing', async () => {
    await expect(initRemoteConfig()).resolves.toBeUndefined();
  });

  test('getRemoteValue returns fallback for each key', () => {
    expect(getRemoteValue('costMult')).toBe(SYNAPSE_CONSTANTS.costMult);
    expect(getRemoteValue('softCapExponent')).toBe(SYNAPSE_CONSTANTS.softCapExponent);
    expect(getRemoteValue('cascadeMultiplier')).toBe(SYNAPSE_CONSTANTS.cascadeMultiplier);
    expect(getRemoteValue('baseOfflineEfficiency')).toBe(SYNAPSE_CONSTANTS.baseOfflineEfficiency);
    expect(getRemoteValue('maxOfflineEfficiencyRatio')).toBe(SYNAPSE_CONSTANTS.maxOfflineEfficiencyRatio);
    expect(getRemoteValue('baseThresholdTable_0')).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[0]);
  });

  test('init is idempotent', async () => {
    await initRemoteConfig();
    await initRemoteConfig();
    await initRemoteConfig();
    expect(getRemoteValue('costMult')).toBe(SYNAPSE_CONSTANTS.costMult);
  });
});
