// Implements docs/GDD.md §32 (GameState) + §35 INIT-1 + CODE-9.
//
// The Zustand store is the ONLY impure component in the engine layer.
// createDefaultState() must remain pure (no Date.now, no Math.random).
// Mount-time timestamps are populated via initSessionTimestamps action
// per INIT-1 — see src/store/initSession.ts for the React boundary.
//
// CODE-2 exception: enumerating all 110 fields with section comments
// and per-field inline rationale pushes this file above the 200-line
// cap. Same justification as src/types/GameState.ts — the interface is
// a single-source-of-truth artifact; splitting it would lose the
// invariant that Object.keys(createDefaultState()).length === 110.

import { create } from 'zustand';
import { SYNAPSE_CONSTANTS } from '../config/constants';
import type { GameState } from '../types/GameState';
import type { NeuronType } from '../types';
import { loadGame, saveGame } from './saveGame';
import { tryBuyNeuron, tryBuyUpgrade, type BuyReason, type UndoToast } from './purchases';
import { applyTap } from './tap';
import { performDischarge, type DischargeOutcome } from '../engine/discharge';

/**
 * Pure default state. Matches GDD §32 100-field enumeration exactly.
 * 12 non-trivial initial values per §32 "DEFAULT_STATE non-trivial initial values"
 * (updated Phase 6 — insightMultiplier was the 12th, added from §33 PRESTIGE_RESET).
 * 4 impure timestamp fields stay at 0/null per INIT-1; mount effect populates them.
 */
export function createDefaultState(): GameState {
  return {
    // === Economy (5) ===
    thoughts: 0,
    memories: 0,
    sparks: 0,
    cycleGenerated: 0,
    totalGenerated: 0,
    // === Production cache (2) ===
    baseProductionPerSecond: 0,
    effectiveProductionPerSecond: 0,
    // === Neurons (2) — UI-9 auto-grant 1 Básica on first open ===
    neurons: [
      { type: 'basica', count: 1 },
      { type: 'sensorial', count: 0 },
      { type: 'piramidal', count: 0 },
      { type: 'espejo', count: 0 },
      { type: 'integradora', count: 0 },
    ],
    connectionMult: 1, // 1 neuron type at start (no pairs yet)
    // === Focus (5) ===
    focusBar: 0,
    focusFillRate: 0.01, // CONST-OK — §32 DEFAULT_STATE: base focusFillPerTap
    insightActive: false,
    insightMultiplier: 1, // CONST-OK — §32 DEFAULT_STATE: identity; matches §33 PRESTIGE_RESET + TICK-1 step 2 exit
    insightEndTime: null,
    // === Discharge (4) ===
    dischargeCharges: 0,
    dischargeMaxCharges: 2, // CONST-OK — §32 DEFAULT_STATE: §7 base for P0-P9
    dischargeLastTimestamp: 0, // INIT-1 impure — mount effect populates
    nextDischargeBonus: 0,
    // === Upgrades (1) ===
    upgrades: [],
    // === Cycle choices (4) ===
    currentPolarity: null,
    currentMutation: null,
    mutationSeed: 0,
    currentPathway: null,
    // === Offline (2) ===
    currentOfflineCapHours: 4, // CONST-OK — §32 DEFAULT_STATE: baseOfflineCapHours
    currentOfflineEfficiency: 0.5, // CONST-OK — §32 DEFAULT_STATE: baseOfflineEfficiency
    // === Session (1) ===
    sessionStartTimestamp: null, // INIT-1 impure — mount effect populates
    // === Prestige & progression (11) ===
    prestigeCount: 0,
    // 50_000 = TUTOR-2 tutorial threshold; matches calculateCurrentThreshold
    // for a tutorial-cycle state. Recomputed by prestige to regular values.
    currentThreshold: 50_000,
    consciousnessBarUnlocked: false,
    patterns: [],
    totalPatterns: 0,
    regionsUnlocked: [],
    archetype: null,
    archetypeHistory: [],
    cycleStartTimestamp: 0, // INIT-1 impure — mount effect populates
    firstCycleSnapshot: null,
    awakeningLog: [],
    // === Personal bests (1) ===
    personalBests: {},
    // === Resonance (2) ===
    resonance: 0,
    resonanceUpgrades: [],
    // === Spontaneous events (3) ===
    lastSpontaneousCheck: 0,
    spontaneousMemoryUsed: false,
    spontaneousInterferenceUsed: false,
    // === Pattern decisions (1) ===
    patternDecisions: {},
    // === Resonant Patterns (1) — fixed 4-tuple ===
    resonantPatternsDiscovered: [false, false, false, false],
    // === Tutorial + Retention (3) ===
    isTutorialCycle: true, // TUTOR-2: first-ever cycle flag
    dailyLoginStreak: 0,
    lastDailyClaimDate: null,
    // === Session bonuses (3) ===
    momentumBonus: 0,
    lastCycleEndProduction: 0,
    eurekaExpiry: null,
    // === Active event (1) ===
    activeSpontaneousEvent: null,
    // === Run-exclusive upgrades (1) ===
    runUpgradesPurchased: [],
    // === Achievements (6) ===
    achievementsUnlocked: [],
    lifetimeDischarges: 0,
    lifetimeInsights: 0,
    lifetimePrestiges: 0,
    uniqueMutationsUsed: [],
    uniquePathwaysUsed: [],
    // === Achievement tracking (5) ===
    personalBestsBeaten: 0,
    cycleUpgradesBought: 0,
    cycleCascades: 0,
    cyclePositiveSpontaneous: 0,
    cycleNeuronsBought: 0,
    // === Mental States (7) ===
    currentMentalState: null,
    mentalStateExpiry: null,
    lastTapTimestamps: [],
    lastPurchaseTimestamp: 0,
    insightTimestamps: [],
    focusAbove50Since: null,
    pendingHyperfocusBonus: false,
    // === Micro-challenges (3) ===
    activeMicroChallenge: null,
    lastMicroChallengeTime: 0,
    cycleMicroChallengesAttempted: 0,
    // === Resonant Pattern tracking (2) ===
    cycleDischargesUsed: 0,
    cycleNeuronPurchases: [],
    // === Neural Diary (1) ===
    diaryEntries: [],
    // === What-if Preview (2) ===
    lastCycleTimes: [],
    lastCycleConfig: null,
    // === App infrastructure (2) ===
    notificationPermissionAsked: 0,
    analyticsConsent: false,
    // === Piggy Bank (2) ===
    piggyBankSparks: 0,
    piggyBankBroken: false,
    // === Cosmetics — ownership (4) ===
    ownedNeuronSkins: [],
    ownedCanvasThemes: [],
    ownedGlowPacks: [],
    ownedHudStyles: [],
    // === Cosmetics — equipped (4) ===
    activeNeuronSkin: null,
    activeCanvasTheme: null,
    activeGlowPack: null,
    activeHudStyle: null,
    // === Starter Pack + Limited Offers (7) ===
    starterPackPurchased: false,
    starterPackDismissed: false,
    starterPackExpiresAt: 0,
    activeLimitedOffer: null,
    purchasedLimitedOffers: [],
    sparksPurchasedThisMonth: 0,
    sparksPurchaseMonthStart: 0,
    // === Genius Pass (2) ===
    geniusPassLastOfferTimestamp: 0,
    isSubscribed: false,
    // === Narrative (2) ===
    narrativeFragmentsSeen: [],
    eraVisualTheme: 'bioluminescent', // Era 1 default
    // === Endings (1) ===
    endingsSeen: [],
    // === Transcendence (1) ===
    transcendenceCount: 0,
    // === Retention (3) ===
    dailyStreakDays: 0,
    lastOpenedDate: null,
    weeklyChallenge: {
      id: '',
      weekStartTimestamp: 0,
      progress: 0,
      target: 0,
      rewardClaimed: false,
    },
    // === Tab badges (1) ===
    tabBadgesDismissed: [],
    // === System (2) ===
    lastActiveTimestamp: 0, // INIT-1 impure — mount effect populates
    gameVersion: SYNAPSE_CONSTANTS.gameVersion,
  };
}

/**
 * UI-local state (Sprint 2 Phase 5) — NOT part of GameState, NOT persisted,
 * NOT counted in the 110-field invariant. Lives alongside GameState in the
 * same Zustand store for selector convenience but is semantically distinct.
 * Per PROGRESS.md Sprint 2 handoff: "may add UI-specific actions like
 * setActiveTab at the end, but not modify existing state shape".
 */
export type TabId = 'mind' | 'neurons' | 'upgrades' | 'regions';

export interface UIState {
  activeTab: TabId;
  /**
   * Undo toast for expensive purchases (UI-4, §24 Sprint 3). Null when no
   * toast active. UI-local — never persisted (transient 3s window). Set by
   * buyNeuron/buyUpgrade when cost > 10% of the currency bank; cleared by
   * undoLastPurchase, dismissUndoToast, or natural expiry. See
   * src/store/purchases.ts for the UndoToast shape.
   */
  undoToast: UndoToast | null;
  /**
   * TAP-1 anti-spam flag (Sprint 3 Phase 4). Derived per-tick by the engine
   * (tick.ts step 12) and cached here so the tap handler can apply the ×0.10
   * effectiveness penalty without recomputing. UI-local — not persisted.
   */
  antiSpamActive: boolean;
}

/** Actions on the store. Sprint 1 ships INIT-1, reset, and Phase 7 save/load. */
export interface GameStoreActions {
  /** INIT-1: populate the 4 impure timestamp fields with mount-time nowTimestamp. Idempotent. */
  initSessionTimestamps: (nowTimestamp: number) => void;
  /** Full reset to createDefaultState — placeholder for Sprint 7 save-load error path. */
  reset: () => void;
  /** Phase 7: load saved state from Capacitor Preferences; returns true if a save was applied. */
  loadFromSave: () => Promise<boolean>;
  /** Phase 7: manual save trigger (used by scheduler + tests). */
  saveToStorage: () => Promise<void>;
  /**
   * Sprint 3 Phase 4: full TAP-2 formula per GDD §6. Replaces the Sprint 2
   * `incrementThoughtsByMinTap` stub. Applies Potencial Sináptico / Dopamina /
   * Sinestesia / anti-spam penalty stacks; fills Focus Bar (+ Mielina); pushes
   * timestamp to `lastTapTimestamps` circular buffer.
   */
  onTap: (nowTimestamp: number) => void;
  /** Sprint 2 Phase 5: UI-local tab selection. Default 'mind' per UI_MOCKUPS Screen 1. */
  setActiveTab: (tab: TabId) => void;
  /** Sprint 2 Phase 6: GDPR analytics opt-in. Writes GameState.analyticsConsent. */
  setAnalyticsConsent: (consent: boolean) => void;
  /**
   * Sprint 3 Phase 3: purchase a neuron of `type` at the current scaled cost
   * (GDD §4 `baseCost × 1.28^owned`). Returns 'ok' on success or a reason
   * code on failure. Recomputes connectionMult on new-type entry (C(n,2)),
   * pushes to cycleNeuronPurchases (RP-1), sets undoToast if expensive.
   */
  buyNeuron: (type: NeuronType, nowTimestamp: number) => BuyReason;
  /**
   * Sprint 3 Phase 3: purchase an upgrade by id from UPGRADES (§24 + §16).
   * Applies COST-1 (Funciones Ejecutivas −20% on thought-cost upgrades)
   * and immediate state side-effects (discharge_max_charges_add,
   * offline_cap_set, focus_fill_mult, connection_mult_double,
   * offline_efficiency_mult). Other effects consumed at event time.
   */
  buyUpgrade: (id: string, nowTimestamp: number) => BuyReason;
  /** Restore pre-purchase state from the active undo toast's snapshot. No-op if none active. */
  undoLastPurchase: () => void;
  /** Dismiss the undo toast without reversing the purchase (player tapped elsewhere or timer elapsed). */
  dismissUndoToast: () => void;
  /**
   * Sprint 3 Phase 6: fire a Discharge (§7). Returns the outcome so the UI can
   * trigger haptics + visual glow (medium on Discharge, heavy on Cascade).
   * No-op (returns fired=false) if dischargeCharges === 0.
   */
  discharge: (nowTimestamp: number) => DischargeOutcome;
}

export const useGameStore = create<GameState & UIState & GameStoreActions>((set, get) => ({
  ...createDefaultState(),
  activeTab: 'mind',
  undoToast: null,
  antiSpamActive: false,
  initSessionTimestamps: (nowTimestamp) => {
    set((state) => {
      // Per INIT-1: only populate if field is still at the pure default sentinel.
      // Saved-state restore must NOT be overwritten.
      const updates: Partial<GameState> = {};
      if (state.cycleStartTimestamp === 0) updates.cycleStartTimestamp = nowTimestamp;
      if (state.sessionStartTimestamp === null) updates.sessionStartTimestamp = nowTimestamp;
      if (state.lastActiveTimestamp === 0) updates.lastActiveTimestamp = nowTimestamp;
      if (state.dischargeLastTimestamp === 0) updates.dischargeLastTimestamp = nowTimestamp;
      return updates;
    });
  },
  reset: () => set(() => ({ ...createDefaultState(), activeTab: 'mind' as TabId, undoToast: null, antiSpamActive: false })),
  loadFromSave: async () => {
    const loaded = await loadGame();
    if (loaded === null) return false;
    // Merge mode (no `true` flag) — preserves action bindings per CLAUDE.md Zustand pitfall rule.
    // activeTab intentionally NOT overwritten — it's UI-local, not part of saved GameState.
    set(loaded);
    return true;
  },
  saveToStorage: async () => {
    // Strip UI-local state before persistence: `activeTab`, `undoToast`, and
    // `antiSpamActive` are all transient per session; actions are dropped by
    // JSON.stringify naturally. Keeps the persisted payload at exactly
    // 110 GameState fields per §32 invariant.
    const { activeTab: _a, undoToast: _u, antiSpamActive: _s, ...rest } = get();
    void _a;
    void _u;
    void _s;
    await saveGame(rest as GameState);
  },
  onTap: (nowTimestamp) =>
    set((state) => applyTap(state, state.antiSpamActive, nowTimestamp)),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAnalyticsConsent: (consent) => set({ analyticsConsent: consent }),
  buyNeuron: (type, nowTimestamp) => {
    const result = tryBuyNeuron(get(), type, nowTimestamp);
    if (!result.ok) return result.reason;
    set({ ...result.updates, undoToast: result.undoToast });
    return 'ok';
  },
  buyUpgrade: (id, nowTimestamp) => {
    const result = tryBuyUpgrade(get(), id, nowTimestamp);
    if (!result.ok) return result.reason;
    set({ ...result.updates, undoToast: result.undoToast });
    return 'ok';
  },
  undoLastPurchase: () => {
    const toast = get().undoToast;
    if (!toast) return;
    set({ ...toast.snapshot, undoToast: null });
  },
  dismissUndoToast: () => set({ undoToast: null }),
  discharge: (nowTimestamp) => {
    const { updates, outcome } = performDischarge(get(), nowTimestamp);
    if (outcome.fired) set(updates);
    return outcome;
  },
}));
