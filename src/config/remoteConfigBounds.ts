// Sprint 10 Phase 10.7 — Remote Config bounds (canonical storage).
//
// Per Sprint 10 spec line 951: each remotely-overridable constant has a
// validated min/max bound. Out-of-bound fetches fall back to the local
// SYNAPSE_CONSTANTS value (see src/platform/remoteConfig.ts).
//
// Bounds rationale:
//   - costMult       1.10–1.50: too-low breaks 1000-run sim economy;
//                                too-high makes cycles never resolve.
//   - softCapExponent 0.50–0.90: stays within softCap monotonicity;
//                                outside this the production curve inverts.
//   - cascadeMult     1.50–5.00: 1.5 floor preserves Cascade-feels-stronger
//                                identity; 5 ceiling caps burst exploit risk.
//   - baseOfflineEff  0.10–1.00: never zero, never above active rate.
//   - maxOfflineRatio 1.00–5.00: ratio cap to active production growth.
//   - baseThreshold_0 100K-100M: bounds Run-1 P0→P1 cycle to 1-30 min realistic.

import { SYNAPSE_CONSTANTS } from './constants';

export type RemoteConfigKey =
  | 'costMult'
  | 'softCapExponent'
  | 'cascadeMultiplier'
  | 'baseOfflineEfficiency'
  | 'maxOfflineEfficiencyRatio'
  | 'baseThresholdTable_0';

export interface RemoteConfigBounds {
  readonly min: number;
  readonly max: number;
  readonly fallback: number;
}

export const REMOTE_CONFIG_BOUNDS: Record<RemoteConfigKey, RemoteConfigBounds> = {
  costMult:                   { min: 1.10, max: 1.50, fallback: SYNAPSE_CONSTANTS.costMult },
  softCapExponent:            { min: 0.50, max: 0.90, fallback: SYNAPSE_CONSTANTS.softCapExponent },
  cascadeMultiplier:          { min: 1.50, max: 5.00, fallback: SYNAPSE_CONSTANTS.cascadeMultiplier },
  baseOfflineEfficiency:      { min: 0.10, max: 1.00, fallback: SYNAPSE_CONSTANTS.baseOfflineEfficiency },
  maxOfflineEfficiencyRatio:  { min: 1.00, max: 5.00, fallback: SYNAPSE_CONSTANTS.maxOfflineEfficiencyRatio },
  baseThresholdTable_0:       { min: 100_000, max: 100_000_000, fallback: SYNAPSE_CONSTANTS.baseThresholdTable[0] },
};
