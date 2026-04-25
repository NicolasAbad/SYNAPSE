// Implements docs/GDD.md §32 (GameState) + §35 INIT-1 + CODE-9.
//
// The Zustand store is the ONLY impure component in the engine layer.
// createDefaultState() must remain pure (no Date.now, no Math.random).
// Mount-time timestamps are populated via initSessionTimestamps action
// per INIT-1 — see src/store/initSession.ts for the React boundary.
//
// CODE-2 exception: enumerating all 133 fields with section comments
// and per-field inline rationale pushes this file above the 200-line
// cap. Same justification as src/types/GameState.ts — the interface is
// a single-source-of-truth artifact; splitting it would lose the
// invariant that Object.keys(createDefaultState()).length === 124.

import { create } from 'zustand';
import { SYNAPSE_CONSTANTS } from '../config/constants';
import type { GameState } from '../types/GameState';
import type { NeuronType, Polarity, Pathway, Archetype, EndingID, Language, FontSize } from '../types';
import { loadGame, saveGame } from './saveGame';
import { tryBuyNeuron, tryBuyUpgrade, type BuyReason, type UndoToast } from './purchases';
import { tryBuyShardUpgrade } from './shardPurchases';
import { PRECOMMIT_GOALS_BY_ID } from '../config/precommitGoals';
import { NAMED_MOMENTS, hasMomentBeenLogged, defaultPhraseFor, logNamedMoment } from '../engine/innerVoice';
import type { NamedMomentId } from '../engine/innerVoice';
import { applyTap } from './tap';
import { performDischarge, type DischargeOutcome } from '../engine/discharge';
import { handlePrestige, type PrestigeOutcome } from '../engine/prestige';
import { handleTranscendence, type TranscendenceOutcome } from '../engine/transcendence';
import { tryBuyResonanceUpgrade } from '../engine/resonanceUpgrades';
import { tryBuyRunUpgrade } from '../engine/runUpgrades';
import { applyPermanentPatternDecisionsToState } from '../engine/patternDecisions';
import { dispatchNarrative, applyFragmentRead } from '../engine/narrative';
import { MUTATIONS_BY_ID } from '../config/mutations';
import { checkAllAchievements, achievementRewardSum } from '../engine/achievements';
import { applyMasteryXpGain } from '../engine/mastery';
import { applyOfflineProgress } from '../engine/offline';
import { ACHIEVEMENTS_BY_ID } from '../config/achievements';
import { COSMETIC_CATALOG } from '../config/cosmeticCatalog';
import { findLimitedTimeOffer } from '../config/limitedTimeOffers';
import { evaluateSparksPurchase, startOfCurrentMonthUTC } from '../engine/sparksPurchaseCap';
import { mulberry32 } from '../engine/rng';
import { logEvent, logEventOnce } from '../platform/firebase';
import { playSfx } from '../platform/audio';
import { evaluateDailyLogin } from '../engine/dailyLogin';
import type { DiaryEntry } from '../types';

/**
 * Pure default state. Matches GDD §32 124-field enumeration exactly.
 * 13 non-trivial initial values per §32 "DEFAULT_STATE non-trivial initial values"
 * (Phase 7.5.1 added `mood: 50` as the 13th, from SYNAPSE_CONSTANTS.moodInitialValue).
 * 5 impure timestamp fields stay at 0/null per INIT-1; mount effect populates them
 * (Sprint 9a Phase 9a.3 added `installedAt` to the impure-timestamp set per V-5).
 * Sprint 9b Phase 9b.4 added `geniusPassDismissals: 0` (lifetime counter, V-7).
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
    // === Offline (3) — Sprint 7.10 Phase 7.10.4 added pendingOfflineSummary ===
    currentOfflineCapHours: 4, // CONST-OK — §32 DEFAULT_STATE: baseOfflineCapHours
    currentOfflineEfficiency: 0.5, // CONST-OK — §32 DEFAULT_STATE: baseOfflineEfficiency
    pendingOfflineSummary: null,
    // === Session (2) — Sprint 9a Phase 9a.3 added installedAt (V-5, MONEY-4). ===
    sessionStartTimestamp: null, // INIT-1 impure — mount effect populates
    installedAt: 0, // INIT-1 impure — initSessionTimestamps sets ONCE on first ever launch
    // === Prestige & progression (11) ===
    prestigeCount: 0,
    // Matches calculateCurrentThreshold for a tutorial-cycle state. Recomputed by
    // prestige. Sprint 8c-tuning: references SYNAPSE_CONSTANTS.tutorialThreshold
    // so it auto-tracks tuning iterations without parallel edits.
    currentThreshold: SYNAPSE_CONSTANTS.tutorialThreshold,
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
    // === Session bonuses (4) — Sprint 7.10 Phase 7.10.5 added lucidDreamActiveUntil ===
    momentumBonus: 0,
    lastCycleEndProduction: 0,
    eurekaExpiry: null,
    lucidDreamActiveUntil: null,
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
    // === Hipocampo — Memory Shards (2) — §16.1 PRESERVE lifetime ===
    memoryShards: { emotional: 0, procedural: 0, episodic: 0 },
    memoryShardUpgrades: [],
    // === Prefrontal — Pre-commitments (2) — §16.2 ===
    activePrecommitment: null, // RESETS on prestige (cycle-scoped)
    precommitmentStreak: 0, // PRESERVE on prestige, RESET on Transcendence
    // === Límbico — Mood (2) — §16.3 ===
    mood: SYNAPSE_CONSTANTS.moodInitialValue, // CONST-OK — §32 DEFAULT_STATE: Calm tier (50)
    moodHistory: [],
    // === Broca — Named Moments (1) — §16.5 PRESERVE lifetime identity ===
    brocaNamedMoments: [],
    // === Mastery (1) — §38 PRESERVE lifetime ===
    mastery: {},
    // === Auto-buy config (1) — Sprint 6.8 QoL pull-in, P10+ ===
    autoBuyConfig: {},
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
    // === Genius Pass (3) — Sprint 9b Phase 9b.4 added geniusPassDismissals (V-7). ===
    geniusPassLastOfferTimestamp: 0,
    isSubscribed: false,
    geniusPassDismissals: 0,
    // === Monetization runtime (1) — Sprint 9a Phase 9a.3 (V-2, MONEY-6 cooldown). ===
    lastAdWatchedAt: 0,
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
    // === Settings (8) — Sprint 10 Phase 10.1, all PRESERVE on prestige + Transcendence ===
    sfxVolume: SYNAPSE_CONSTANTS.defaultSfxVolume,
    musicVolume: SYNAPSE_CONSTANTS.defaultMusicVolume,
    language: 'en', // CONST-OK CODE-1 exception: enum literal default per Language type
    colorblindMode: false,
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium', // CONST-OK CODE-1 exception: enum literal default per FontSize type
    notificationsEnabled: true,
    // === Analytics tracking (1) — Sprint 10 Phase 10.3 ===
    firstEventsFired: [],
  };
}

/**
 * UI-local state (Sprint 2 Phase 5) — NOT part of GameState, NOT persisted,
 * NOT counted in the 119-field invariant. Lives alongside GameState in the
 * same Zustand store for selector convenience but is semantically distinct.
 * Per PROGRESS.md Sprint 2 handoff: "may add UI-specific actions like
 * setActiveTab at the end, but not modify existing state shape".
 */
export type TabId = 'mind' | 'neurons' | 'upgrades' | 'regions';
export type MindSubtabId = 'home' | 'patterns' | 'archetypes' | 'diary' | 'achievements' | 'resonance' | 'mastery';

export interface UIState {
  activeTab: TabId;
  /**
   * Current Mind-tab subtab. Lifted from React-local (MindPanel) to the store
   * in Sprint 4c Phase 4c.6.5 so sibling HUD components (DischargeButton,
   * TutorialHints, FragmentOverlay) can gate on it. Resets to 'home' when
   * `activeTab` changes to 'mind' (default first-open behavior).
   */
  activeMindSubtab: MindSubtabId;
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
  /**
   * Sprint 7 Phase 7.2 (ACH-3): toast surface for achievement unlocks.
   * Set by the internal `processAchievementUnlocks` helper after any action
   * that can change achievement-relevant state. Auto-cleared after 3s by the
   * AchievementToast component (dismissAchievementToast action). UI-local.
   */
  achievementToast: { achievementId: string; expiresAt: number } | null;
}

/** Actions on the store. Sprint 1 ships INIT-1, reset, and Phase 7 save/load. */
export interface GameStoreActions {
  /** INIT-1: populate the 4 impure timestamp fields with mount-time nowTimestamp. Idempotent. */
  initSessionTimestamps: (nowTimestamp: number) => void;
  /**
   * Sprint 7.10 Phase 7.10.4 — call on mount + every app-resume. Pure engine
   * (applyOfflineProgress) produces `{ state, summary }`; action stashes
   * summary on `pendingOfflineSummary` + triggers save-on-resume. Idempotent
   * via OFFLINE-5 clamp + offlineMinMinutes skip branch.
   */
  applyOfflineReturn: (nowTimestamp: number) => void;
  /** Phase 7.10.4 — UI consumer (Sleep screen / Welcome modal) dismiss handler. Clears pendingOfflineSummary. */
  dismissOfflineSummary: () => void;
  /** Phase 7.10.5 — Lucid Dream Option A choice: +10% production for 1h. Sets lucidDreamActiveUntil + dismisses summary. */
  chooseLucidDreamOptionA: (nowTimestamp: number) => void;
  /** Phase 7.10.5 — Lucid Dream Option B choice: +N Memories one-shot. Dismisses summary. */
  chooseLucidDreamOptionB: () => void;
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
  /** Sprint 4c Phase 4c.6.5: Mind subtab selector. Lets sibling HUD components gate visibility. */
  setActiveMindSubtab: (subtab: MindSubtabId) => void;
  /** Sprint 2 Phase 6: GDPR analytics opt-in. Writes GameState.analyticsConsent. */
  setAnalyticsConsent: (consent: boolean) => void;
  /**
   * Sprint 10 Phase 10.1 — Settings setters. Each writes its single field
   * directly. Volume sliders accept 0–100 in 5% steps from the UI; setters
   * clamp defensively to [0, 100] so out-of-range programmatic calls are safe.
   * Consumers (Howler, accessibility CSS, push scheduler) ship in 10.2/10.4/10.5.
   */
  setSfxVolume: (vol: number) => void;
  setMusicVolume: (vol: number) => void;
  setLanguage: (lang: Language) => void;
  setColorblindMode: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setFontSize: (size: FontSize) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  /**
   * Sprint 10 Phase 10.1 — Hard Reset action (V-3). Wipes ALL state to defaults
   * via createDefaultState() — including settings (per design: Hard Reset returns
   * to factory state). Caller (UI) is responsible for: 3-tap counter, RESET text
   * input gate, logging the `reset_game` analytics event with timestamp BEFORE
   * calling this. This action just executes the reset.
   */
  hardReset: () => void;
  /**
   * Sprint 9a Phase 9a.2 — flip Genius Pass subscription status. Called by the
   * RevenueCat adapter on `customerInfo.entitlements.active['genius_pass']`
   * presence/absence. Idempotent.
   */
  setSubscriptionStatus: (isSubscribed: boolean) => void;
  /**
   * Sprint 9a Phase 9a.3 — record that a rewarded ad just completed. Stamps
   * `lastAdWatchedAt` so the MONEY-6 3-min cooldown gate (engine/adGate.ts)
   * blocks the next ad until `now - lastAdWatchedAt >= minAdCooldownMs`.
   * Called by the AdMob adapter on REWARD_RECEIVED.
   */
  recordAdWatched: (nowTimestamp: number) => void;
  /**
   * Sprint 10 Phase 10.4 — Daily Login Bonus claim. Caller passes today's
   * local-date string (YYYY-MM-DD) per the engine's pure contract. Returns
   * the engine outcome so the UI can render the right modal state.
   *
   * Side effects when outcome != 'no_action':
   *   - sparks += rewardSparks
   *   - dailyLoginStreak := nextStreak (0..6)
   *   - lastDailyClaimDate := nowDate
   *
   * On 'streak_save_eligible' the action does NOT auto-claim; the UI gates
   * on `canAutoSave` (subscriber path) vs explicit ad-watch path.
   */
  claimDailyLoginReward: (nowDate: string) => import('../engine/dailyLogin').DailyLoginOutcome;
  /**
   * Sprint 10 Phase 10.4 — finalize the streak-save flow after the streak-save
   * outcome was returned. `via` records the path: 'subscriber' (auto), 'ad'
   * (after rewarded-ad reward), or 'reset' (player declined → streak resets).
   * Awards the matching reward + advances state. No-op if there's no eligible
   * pending streak-save (state.dailyLoginStreak unchanged + lastDailyClaimDate
   * already today).
   */
  resolveStreakSave: (nowDate: string, via: 'subscriber' | 'ad' | 'reset') => void;
  /**
   * Sprint 10 Phase 10.4 — record that the OS notification permission prompt
   * has been asked at the given gate (1 = after P1, 3 = after P3 per Sprint 10
   * spec). Idempotent at each gate — re-recording doesn't bump.
   */
  recordNotificationPermissionAsked: (gate: 1 | 3) => void;
  /**
   * Sprint 9a Phase 9a.4 — ad reward payout: double the pending offline-return
   * summary. Adds `summary.gained` extra thoughts and dismisses the Sleep
   * screen summary. No-op when `pendingOfflineSummary` is null.
   */
  applyAdRewardOfflineDouble: () => void;
  /**
   * Sprint 9a Phase 9a.4 — ad reward payout: double the last Discharge burst.
   * Caller passes the burst magnitude from the DischargeOutcome (transient —
   * no GameState field tracks per-discharge burst).
   */
  applyAdRewardDischargeDouble: (burst: number) => void;
  /**
   * Sprint 9a Phase 9a.4 — mutation-reroll ad reward: clears currentMutation
   * and advances mutationSeed so getMutationOptions() yields a fresh set on
   * next read. No-op during a tutorial cycle (mutations not yet unlocked).
   */
  rerollMutationOptions: () => void;
  /**
   * Sprint 9a Phase 9a.4 — pattern-decision retry: removes a previously-locked
   * decision so the PendingDecisionFlow can re-prompt. `nodeIndex` must be an
   * existing decision node. Idempotent — a no-op when the node has no decision.
   */
  retryPatternDecision: (nodeIndex: number) => void;
  /**
   * Sprint 9b Phase 9b.2 — cosmetic unlock (add to owned* list). Called by
   * RevenueCat purchase success in Phase 9b.3 (or by `unlockAllCosmetics`
   * in dev). Idempotent — duplicate unlocks are no-ops.
   */
  unlockCosmetic: (category: 'neuron_skin' | 'canvas_theme' | 'glow_pack' | 'hud_style', id: string) => void;
  /**
   * Sprint 9b Phase 9b.2 — equip an owned cosmetic (set active* field).
   * No-op if the cosmetic isn't owned (defensive).
   */
  equipCosmetic: (category: 'neuron_skin' | 'canvas_theme' | 'glow_pack' | 'hud_style', id: string) => void;
  /** Sprint 9b Phase 9b.2 — unequip (clear active* for a category). */
  unequipCosmetic: (category: 'neuron_skin' | 'canvas_theme' | 'glow_pack' | 'hud_style') => void;
  /**
   * Sprint 9b Phase 9b.2 (V-f) — dev-only: unlock every cosmetic at once for
   * 9b.2–9b.5 testing without needing a real RevenueCat connection. Gated by
   * `import.meta.env.DEV`; compiled out of production bundles.
   */
  unlockAllCosmetics: () => void;
  /**
   * Sprint 9b Phase 9b.4 — Starter Pack acceptance (RevenueCat success callback
   * in 9b.3 wires this). Unlocks the 3-item bundle per GDD §26: +50 Sparks +
   * +5 Memories + the `neon_pulse` exclusive canvas theme. Idempotent — replay
   * guard via `starterPackPurchased`. Sparks DO NOT count toward the monthly
   * cap (V-c) since Starter Pack is a distinct IAP SKU.
   */
  acceptStarterPack: () => void;
  /** Sprint 9b Phase 9b.4 — Starter Pack dismissal: sets `starterPackDismissed=true`. */
  dismissStarterPack: () => void;
  /**
   * Sprint 9b Phase 9b.4 — stamp `starterPackExpiresAt` the first time the
   * pack becomes eligible (post-P2, first open). Idempotent.
   */
  stampStarterPackExpiry: (nowTimestamp: number) => void;
  /**
   * Sprint 9b Phase 9b.4 — Genius Pass offer dismissal: bumps
   * `geniusPassDismissals` + stamps `geniusPassLastOfferTimestamp`. Called by
   * the GeniusPassOfferModal's "Not now" button.
   */
  dismissGeniusPassOffer: (nowTimestamp: number) => void;
  /**
   * Sprint 9b Phase 9b.4 — record that the Genius Pass offer was shown to the
   * player (but not yet dismissed or accepted). Stamps the timestamp so the
   * 72h interval gate applies even if they close the app mid-decision.
   */
  recordGeniusPassOfferShown: (nowTimestamp: number) => void;
  /**
   * Sprint 9b Phase 9b.5 — Piggy Bank claim: transfer `piggyBankSparks` to
   * `sparks`, reset `piggyBankSparks: 0`, set `piggyBankBroken: true`. Called
   * by RevenueCat purchase success for the `piggy_break` product. Idempotent:
   * no-op when piggyBankBroken is already true.
   */
  claimPiggyBank: () => void;
  /**
   * Sprint 9b Phase 9b.5 — Spark Pack purchase: MONEY-8 cap-enforced Sparks grant.
   * Uses `evaluateSparksPurchase` to detect UTC-month rollover + check cap.
   * Returns 'ok' on success, 'cap_reached' on MONEY-8 block.
   */
  purchaseSparks: (packAmount: number, nowTimestamp: number) => 'ok' | 'cap_reached';
  /**
   * Sprint 9b Phase 9b.5 — stamp the active Limited-Time Offer window (48h)
   * when the offer first becomes eligible. Idempotent — second stamp for
   * the same offer ID is a no-op.
   */
  stampLimitedTimeOffer: (offerId: string, nowTimestamp: number) => void;
  /**
   * Sprint 9b Phase 9b.5 — Limited-Time Offer acceptance. RevenueCat purchase
   * success callback. Applies bundle contents per `LIMITED_TIME_OFFERS` catalog;
   * random cosmetic selections use `mulberry32` seeded by (installedAt, offerId).
   */
  acceptLimitedTimeOffer: (offerId: string) => void;
  /**
   * Sprint 9b Phase 9b.5 — Limited-Time Offer dismissal or expiry — adds offer
   * ID to `purchasedLimitedOffers` (acting as a "consumed" marker) so the
   * offer never re-triggers. Clears `activeLimitedOffer`.
   */
  consumeLimitedTimeOffer: (offerId: string) => void;
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
  /** Sprint 7.5.2 §16.1 — buy a Hipocampo Memory Shard upgrade (typed-shard cost). */
  buyShardUpgrade: (id: string, nowTimestamp: number) => BuyReason;
  /** Sprint 7.5.4 §16.2 PRECOMMIT-1/2 — set active Pre-commit (deducts wager from Memorias). */
  setActivePrecommitment: (goalId: string) => 'ok' | 'locked' | 'already_active' | 'unknown_goal' | 'insufficient_funds';
  /** Sprint 7.5.4 §16.2 PRECOMMIT-2 — cancel active Pre-commit (refunds wager, only if no meaningful progress). */
  cancelActivePrecommitment: () => 'ok' | 'no_active' | 'too_late';
  /** Sprint 7.5.6 §16.5 VOICE-1 — author a Named Moment with the player's chosen phrase. */
  authorNamedMoment: (momentId: string, phrase: string) => 'ok' | 'already_logged' | 'invalid_moment' | 'invalid_phrase';
  /** Sprint 7.5.6 §16.5 VOICE-2 — skip a Named Moment (substitutes archetype-keyed default phrase). */
  skipNamedMoment: (momentId: string) => 'ok' | 'already_logged' | 'invalid_moment';
  /** Sprint 7.6 Phase 7.6.3 §37 TUTOR-5 — mark a tutorial step complete (+2 Sparks per step, idempotent via narrativeFragmentsSeen). */
  completeTutorialStep: (stepId: string) => 'ok' | 'already_completed' | 'invalid_step';
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
  /**
   * Sprint 4a Phase 4a.4: trigger an Awakening (prestige) per §9 + §33.
   * Wraps the pure `handlePrestige` engine function. Merge-mode setState
   * preserves action references (CLAUDE.md Zustand pitfall). Gated on
   * `cycleGenerated >= currentThreshold` — returns { fired: false } if
   * the player hasn't met the threshold yet (UI belt-and-suspenders).
   * Sprint 6 Phase 6.5: `force=true` bypasses the threshold gate for GDD
   * §23 P24 Long Thought 45-min auto-awaken.
   */
  prestige: (nowTimestamp: number, force?: boolean) => { fired: boolean; outcome: PrestigeOutcome | null };
  /**
   * Sprint 4b Phase 4b.4: PAT-3 reset per GDD §10. Consumes 1000 Resonance,
   * clears `patternDecisions`, and reverses the Node 6 B dischargeMaxCharges
   * bump if it was set. UI owns the double-confirmation — this action does
   * NOT re-prompt; call it only after a confirmed intent.
   * Returns `{ fired: false }` if `resonance < patternResetCostResonance`.
   */
  resetPatternDecisions: () => { fired: boolean };
  /**
   * Sprint 4b Phase 4b.5: lock in a Pattern Tree decision at `nodeIndex`.
   * Writes `patternDecisions[nodeIndex] = choice` AND applies any permanent
   * state effect (Node 6 B dischargeMaxCharges +1). Rejects when:
   *   - the node isn't a decision node (index ∉ patternDecisionNodes), or
   *   - the decision has already been locked in (requires PAT-3 reset to re-choose).
   */
  choosePatternDecision: (nodeIndex: number, choice: 'A' | 'B') => { fired: boolean };
  /**
   * Sprint 4c Phase 4c.1: pick a Polarity for the current cycle (GDD §11 POLAR-1).
   * Gated on `prestigeCount >= polarityUnlockPrestige (3)`. Pre-P3 returns fired=false.
   * Player calls this from CycleSetupScreen; production/discharge modifiers (4c.2)
   * read `state.currentPolarity` directly — no state-cache propagation needed.
   */
  setPolarity: (polarity: Polarity) => { fired: boolean };
  /**
   * Sprint 5 Phase 5.2: pick a Mutation for the current cycle (GDD §13).
   * Pre-P7 returns fired=false (Mutations unlock at P7+ per spec).
   * Mutation #14 Déjà Vu: also rehydrates upgrades from `lastCycleConfig.upgrades`
   * so the player's previous-cycle purchases re-apply (with cost ×2 enforced via
   * mutationUpgradeCostMod in tryBuyUpgrade).
   */
  setMutation: (mutationId: string) => { fired: boolean };
  /**
   * Sprint 5 Phase 5.3: pick a Pathway for the current cycle (GDD §14).
   * Pre-P10 returns fired=false. PATH-2: defaults to last choice via
   * `lastCycleConfig.pathway` snapshot — but engine consumers read
   * `state.currentPathway` directly. POLAR-1 / SAME AS LAST flow in 5.5
   * pre-fills the picker from the snapshot.
   */
  setPathway: (pathway: Pathway) => { fired: boolean };
  /**
   * Sprint 6 Phase 6.2: pick an Archetype at P5+ (GDD §12). IRREVERSIBLE for
   * the Run — second call returns fired=false unless a Transcendence cleared
   * `state.archetype` to null. Pushes to `archetypeHistory` for meta progression.
   * Pre-P5 also returns fired=false.
   */
  setArchetype: (archetype: Archetype) => { fired: boolean };
  /**
   * Sprint 6 Phase 6.5: mark a narrative fragment / Era 3 event as read.
   * Appends id to `narrativeFragmentsSeen`. Grants +1 Memory on first read
   * for narrative fragments (NARR-8); era3_* ids are system events and do
   * NOT grant. Idempotent — re-reads are no-ops.
   */
  readFragment: (id: string) => void;
  /**
   * Sprint 6 Phase 6.6: log the player's P26 ending choice. Appends
   * `EndingID` to `endingsSeen` (idempotent — duplicates not re-added).
   * `option` is the A/B choice the player made; currently stored in the
   * Diary entry (Sprint 7) but not the GameState per §32 field budget.
   */
  chooseEnding: (id: EndingID, option: 'a' | 'b') => void;
  /** Sprint 8b Phase 8b.2 — fires after Transcendence confirm modal. Pure engine call. */
  applyTranscendence: (endingId: EndingID, nowTimestamp: number) => TranscendenceOutcome | null;
  /** Sprint 8b Phase 8b.4 — buy a Resonance upgrade. Returns true on success. */
  buyResonanceUpgrade: (id: string) => boolean;
  /** Sprint 8b Phase 8b.5 — buy a Run-exclusive upgrade (Run 2+ / Run 3+). Returns true on success. */
  buyRunUpgrade: (id: string) => boolean;
  /**
   * Sprint 7 Phase 7.2 (ACH-3): dismiss the achievement toast (player tapped
   * elsewhere or expiry timer fired). Idempotent — no-op if no toast active.
   */
  dismissAchievementToast: () => void;
}

/**
 * Internal helper: after any state change, check for newly-unlocked achievements
 * and apply their side effects (sparks reward, achievementsUnlocked append, diary
 * entries, toast surface). Returns a Partial<GameState> + UI-toast slice the
 * action can spread into its set() call. ACH-1: event-driven, called only after
 * actions that can change achievement-relevant state.
 */
function processAchievementUnlocks(
  nextState: GameState,
  nowTimestamp: number,
): Partial<GameState> & { achievementToast: { achievementId: string; expiresAt: number } | null } {
  const result = checkAllAchievements(nextState);
  if (result.newlyUnlocked.length === 0) {
    return { achievementToast: null };
  }
  const sparkBonus = achievementRewardSum(result.newlyUnlocked);
  // §27 feature — achievement_unlocked per newly-unlocked id. Consent reads
  // straight off the state we already have here.
  for (const id of result.newlyUnlocked) {
    logEvent('achievement_unlocked', { id, prestigeCount: nextState.prestigeCount }, nextState.analyticsConsent);
  }
  const newDiaryEntries: DiaryEntry[] = result.newlyUnlocked.map((id) => ({
    timestamp: nowTimestamp,
    type: 'achievement' as const,
    data: { achievementId: id, reward: ACHIEVEMENTS_BY_ID[id]?.reward ?? 0 },
  }));
  // §27 feature — diary_entry_added per achievement diary push.
  for (const entry of newDiaryEntries) {
    logEvent('diary_entry_added', { entryType: entry.type }, nextState.analyticsConsent);
  }
  // Diary cap: 500 entries circular, drop from head when over (Sprint 7.5 spec).
  const allDiary = [...nextState.diaryEntries, ...newDiaryEntries];
  const trimmed = allDiary.length > 500 ? allDiary.slice(allDiary.length - 500) : allDiary; // CONST-OK §24.5 nar_diary_50 + Sprint 7.5 cap
  // Toast: show first newly-unlocked. If multiple unlock atomically, the rest
  // populate the diary but only the first surfaces as toast (avoids overlap).
  return {
    achievementsUnlocked: [...nextState.achievementsUnlocked, ...result.newlyUnlocked],
    sparks: nextState.sparks + sparkBonus,
    diaryEntries: trimmed,
    achievementToast: { achievementId: result.newlyUnlocked[0], expiresAt: nowTimestamp + SYNAPSE_CONSTANTS.undoToastDurationMs },
  };
}

export const useGameStore = create<GameState & UIState & GameStoreActions>((set, get) => ({
  ...createDefaultState(),
  activeTab: 'mind',
  activeMindSubtab: 'home',
  undoToast: null,
  antiSpamActive: false,
  achievementToast: null,
  initSessionTimestamps: (nowTimestamp) => {
    const before = get();
    set((state) => {
      // Per INIT-1: only populate if field is still at the pure default sentinel.
      // Saved-state restore must NOT be overwritten.
      // installedAt (Sprint 9a Phase 9a.3, V-5): set ONCE on first launch ever
      // — never overwritten on subsequent loads even if reset() is called.
      const updates: Partial<GameState> = {};
      if (state.cycleStartTimestamp === 0) updates.cycleStartTimestamp = nowTimestamp;
      if (state.sessionStartTimestamp === null) updates.sessionStartTimestamp = nowTimestamp;
      if (state.lastActiveTimestamp === 0) updates.lastActiveTimestamp = nowTimestamp;
      if (state.dischargeLastTimestamp === 0) updates.dischargeLastTimestamp = nowTimestamp;
      if (state.installedAt === 0) updates.installedAt = nowTimestamp;
      return updates;
    });
    // §27 funnel — app_first_open fires once lifetime. Detected via installedAt
    // transitioning 0 → nowTimestamp on this very call.
    if (before.installedAt === 0) {
      const fired = logEventOnce('app_first_open', { timestamp: nowTimestamp }, before.analyticsConsent, before.firstEventsFired);
      if (fired !== before.firstEventsFired) set({ firstEventsFired: fired });
    }
  },
  applyOfflineReturn: (nowTimestamp) => {
    const prev = get();
    const { state: next, summary } = applyOfflineProgress(prev as GameState, nowTimestamp);
    // No-op guard: if nothing changed (skip branch with already-current timestamp),
    // don't overwrite pendingOfflineSummary. Keeps the flow cheap on rapid resumes.
    if (next.lastActiveTimestamp === prev.lastActiveTimestamp && summary.gained === 0) return;
    set({ ...next, pendingOfflineSummary: summary.elapsedMs >= SYNAPSE_CONSTANTS.offlineMinMinutes * 60_000 ? summary : prev.pendingOfflineSummary });
    // §27 core — offline_return when meaningful elapsed time accrued.
    if (summary.gained > 0) {
      logEvent('offline_return', {
        elapsedHours: summary.elapsedMs / (60 * 60 * 1_000), // CONST-OK ms→hr
        thoughtsEarned: summary.gained,
        lucidDream: summary.lucidDreamTriggered,
      }, prev.analyticsConsent);
    }
    // Save-on-resume — anti-exploit per Phase 7.10.4 spec. Fire-and-forget.
    saveGame(get() as GameState).catch((e) => console.error('[applyOfflineReturn] save failed:', e));
  },
  dismissOfflineSummary: () => set({ pendingOfflineSummary: null }),
  chooseLucidDreamOptionA: (nowTimestamp) => set({
    lucidDreamActiveUntil: nowTimestamp + SYNAPSE_CONSTANTS.lucidDreamOptionADurationMs,
    pendingOfflineSummary: null,
  }),
  chooseLucidDreamOptionB: () => set((s) => ({
    memories: s.memories + SYNAPSE_CONSTANTS.lucidDreamOptionBMemoryGain,
    pendingOfflineSummary: null,
  })),
  reset: () => set(() => ({ ...createDefaultState(), activeTab: 'mind' as TabId, activeMindSubtab: 'home' as MindSubtabId, undoToast: null, antiSpamActive: false, achievementToast: null })),
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
    // 119 GameState fields per §32 invariant.
    const { activeTab: _a, activeMindSubtab: _m, undoToast: _u, antiSpamActive: _s, achievementToast: _at, ...rest } = get();
    void _a;
    void _m;
    void _u;
    void _s;
    void _at;
    await saveGame(rest as GameState);
  },
  onTap: (nowTimestamp) => {
    const before = get();
    set((state) => applyTap(state, state.antiSpamActive, nowTimestamp));
    playSfx('tap'); // SFX wired in audio adapter (pitch jitter inside adapter)
    // §27 funnel — first ever tap and first tap of tutorial fire once each lifetime.
    let fired = before.firstEventsFired;
    fired = logEventOnce('first_tap', {}, before.analyticsConsent, fired);
    if (before.isTutorialCycle) {
      fired = logEventOnce('tutorial_first_tap', {}, before.analyticsConsent, fired);
    }
    if (fired !== before.firstEventsFired) set({ firstEventsFired: fired });
  },
  setActiveTab: (tab) => set({ activeTab: tab, activeMindSubtab: 'home' }),
  setActiveMindSubtab: (subtab) => set({ activeMindSubtab: subtab }),
  setAnalyticsConsent: (consent) => set({ analyticsConsent: consent }),
  // Sprint 10 Phase 10.1 — Settings setters. Volume sliders clamp to [0, 100]
  // defensively so out-of-range programmatic calls (e.g. malformed save migration
  // with an old pre-bounded value) don't poison state. UI emits 0–100 in 5% steps.
  setSfxVolume: (vol) => set({ sfxVolume: Math.max(0, Math.min(100, vol)) }),
  setMusicVolume: (vol) => set({ musicVolume: Math.max(0, Math.min(100, vol)) }),
  setLanguage: (lang) => set({ language: lang }),
  setColorblindMode: (enabled) => set({ colorblindMode: enabled }),
  setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
  setHighContrast: (enabled) => set({ highContrast: enabled }),
  setFontSize: (size) => set({ fontSize: size }),
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  // Sprint 10 Phase 10.1 — Hard Reset (V-3). Logs `reset_game` with timestamp
  // BEFORE wiping state so the analytics fire while consent is still readable.
  // Then full reset to defaults via the existing `reset` action's path.
  hardReset: () => {
    const { analyticsConsent } = get();
    logEvent('reset_game', { timestamp: Date.now() }, analyticsConsent);
    set(() => ({
      ...createDefaultState(),
      activeTab: 'mind' as TabId,
      activeMindSubtab: 'home' as MindSubtabId,
      undoToast: null,
      antiSpamActive: false,
      achievementToast: null,
    }));
  },
  setSubscriptionStatus: (isSubscribed) => {
    const prev = get();
    set({ isSubscribed });
    // GDD §27 Core: fire genius_pass_purchased when the flag transitions
    // false → true (i.e. a real subscription just activated via RevenueCat).
    // Re-running Restore Purchases for an already-subscribed user does NOT
    // re-fire the event.
    if (isSubscribed && !prev.isSubscribed) {
      logEvent('genius_pass_purchased', { plan: 'genius_pass' }, prev.analyticsConsent);
      // §27 funnel — first_purchase fires once across all monetization paths.
      const fired = logEventOnce('first_purchase', { source: 'genius_pass' }, prev.analyticsConsent, prev.firstEventsFired);
      if (fired !== prev.firstEventsFired) set({ firstEventsFired: fired });
    }
  },
  recordAdWatched: (nowTimestamp) => {
    const state = get();
    set({ lastAdWatchedAt: nowTimestamp });
    // §27 core — ad_watched. placementId/reward not tracked at this boundary
    // (the AdContext would have richer info); fire with timestamp for now.
    logEvent('ad_watched', { timestamp: nowTimestamp }, state.analyticsConsent);
  },
  // Sprint 10 Phase 10.4 — Daily Login Bonus.
  claimDailyLoginReward: (nowDate) => {
    const state = get();
    const outcome = evaluateDailyLogin(state, nowDate);
    if (outcome.kind === 'no_action' || outcome.kind === 'streak_save_eligible') {
      // No state change here — UI handles the eligible-modal flow.
      return outcome;
    }
    set({
      sparks: state.sparks + outcome.rewardSparks,
      dailyLoginStreak: outcome.nextStreak,
      lastDailyClaimDate: nowDate,
    });
    return outcome;
  },
  resolveStreakSave: (nowDate, via) => {
    const state = get();
    // Re-evaluate to get the eligible reward + nextStreak. If state moved on
    // (already-claimed today via a parallel path), bail out idempotently.
    const outcome = evaluateDailyLogin(state, nowDate);
    if (outcome.kind !== 'streak_save_eligible') return;
    if (via === 'reset') {
      // Player declined the save → streak resets, claim Day 1 today.
      set({
        sparks: state.sparks + SYNAPSE_CONSTANTS.dailyLoginRewards[0],
        dailyLoginStreak: 1 % SYNAPSE_CONSTANTS.dailyLoginCycleLength,
        lastDailyClaimDate: nowDate,
      });
      return;
    }
    // 'subscriber' or 'ad' — preserve the streak with the eligible reward.
    set({
      sparks: state.sparks + outcome.rewardSparks,
      dailyLoginStreak: outcome.nextStreak,
      lastDailyClaimDate: nowDate,
    });
  },
  recordNotificationPermissionAsked: (gate) => {
    const state = get();
    if (state.notificationPermissionAsked >= gate) return; // already past this gate
    set({ notificationPermissionAsked: gate });
  },
  applyAdRewardOfflineDouble: () => {
    const state = get();
    const summary = state.pendingOfflineSummary;
    if (summary === null) return;
    set({
      thoughts: state.thoughts + summary.gained,
      cycleGenerated: state.cycleGenerated + summary.gained,
      totalGenerated: state.totalGenerated + summary.gained,
      pendingOfflineSummary: null,
    });
  },
  applyAdRewardDischargeDouble: (burst) => {
    if (burst <= 0) return;
    const state = get();
    set({
      thoughts: state.thoughts + burst,
      cycleGenerated: state.cycleGenerated + burst,
      totalGenerated: state.totalGenerated + burst,
    });
  },
  rerollMutationOptions: () => {
    const state = get();
    if (state.isTutorialCycle) return;
    set({ currentMutation: null, mutationSeed: state.mutationSeed + 1 });
  },
  retryPatternDecision: (nodeIndex) => {
    const state = get();
    if (state.patternDecisions[nodeIndex] === undefined) return;
    const nextDecisions = { ...state.patternDecisions };
    delete nextDecisions[nodeIndex];
    set({ patternDecisions: nextDecisions });
  },
  unlockCosmetic: (category, id) => {
    const state = get();
    if (category === 'neuron_skin') {
      if (state.ownedNeuronSkins.includes(id)) return;
      set({ ownedNeuronSkins: [...state.ownedNeuronSkins, id] });
    } else if (category === 'canvas_theme') {
      if (state.ownedCanvasThemes.includes(id)) return;
      set({ ownedCanvasThemes: [...state.ownedCanvasThemes, id] });
    } else if (category === 'glow_pack') {
      if (state.ownedGlowPacks.includes(id)) return;
      set({ ownedGlowPacks: [...state.ownedGlowPacks, id] });
    } else {
      if (state.ownedHudStyles.includes(id)) return;
      set({ ownedHudStyles: [...state.ownedHudStyles, id] });
    }
    const catalogEntry = COSMETIC_CATALOG.find((c) => c.category === category && c.id === id);
    logEvent('cosmetic_purchased', { type: category, id, price: catalogEntry?.priceUsd ?? 0 }, state.analyticsConsent);
    // §27 funnel — first_purchase across all monetization.
    const fired = logEventOnce('first_purchase', { source: 'cosmetic', id }, state.analyticsConsent, state.firstEventsFired);
    if (fired !== state.firstEventsFired) set({ firstEventsFired: fired });
  },
  equipCosmetic: (category, id) => {
    const state = get();
    if (category === 'neuron_skin') {
      if (!state.ownedNeuronSkins.includes(id)) return;
      set({ activeNeuronSkin: id });
    } else if (category === 'canvas_theme') {
      if (!state.ownedCanvasThemes.includes(id)) return;
      set({ activeCanvasTheme: id });
    } else if (category === 'glow_pack') {
      if (!state.ownedGlowPacks.includes(id)) return;
      set({ activeGlowPack: id });
    } else {
      if (!state.ownedHudStyles.includes(id)) return;
      set({ activeHudStyle: id });
    }
    logEvent('cosmetic_equipped', { type: category, id }, state.analyticsConsent);
  },
  unequipCosmetic: (category) => {
    if (category === 'neuron_skin') set({ activeNeuronSkin: null });
    else if (category === 'canvas_theme') set({ activeCanvasTheme: null });
    else if (category === 'glow_pack') set({ activeGlowPack: null });
    else set({ activeHudStyle: null });
  },
  unlockAllCosmetics: () => {
    // Dev-only — guard strips this branch from production bundles via tree-shaking.
    if (!import.meta.env.DEV) return;
    set({
      ownedNeuronSkins: COSMETIC_CATALOG.filter((c) => c.category === 'neuron_skin').map((c) => c.id),
      ownedCanvasThemes: COSMETIC_CATALOG.filter((c) => c.category === 'canvas_theme').map((c) => c.id),
      ownedGlowPacks: COSMETIC_CATALOG.filter((c) => c.category === 'glow_pack').map((c) => c.id),
      ownedHudStyles: COSMETIC_CATALOG.filter((c) => c.category === 'hud_style').map((c) => c.id),
    });
  },
  acceptStarterPack: () => {
    const state = get();
    if (state.starterPackPurchased) return;
    const nextOwnedCanvasThemes = state.ownedCanvasThemes.includes('neon_pulse')
      ? state.ownedCanvasThemes
      : [...state.ownedCanvasThemes, 'neon_pulse'];
    set({
      starterPackPurchased: true,
      sparks: state.sparks + SYNAPSE_CONSTANTS.starterPackSparkReward,
      memories: state.memories + SYNAPSE_CONSTANTS.starterPackMemoryReward,
      ownedCanvasThemes: nextOwnedCanvasThemes,
    });
    logEvent('starter_pack_purchased', {}, state.analyticsConsent);
    const fired = logEventOnce('first_purchase', { source: 'starter_pack' }, state.analyticsConsent, state.firstEventsFired);
    if (fired !== state.firstEventsFired) set({ firstEventsFired: fired });
  },
  dismissStarterPack: () => {
    const state = get();
    if (state.starterPackDismissed || state.starterPackPurchased) return;
    set({ starterPackDismissed: true });
    logEvent('starter_pack_dismissed', {}, state.analyticsConsent);
  },
  stampStarterPackExpiry: (nowTimestamp) => {
    const state = get();
    if (state.starterPackExpiresAt !== 0) return;
    set({ starterPackExpiresAt: nowTimestamp + SYNAPSE_CONSTANTS.starterPackExpiryMs });
    logEvent('starter_pack_shown', {}, state.analyticsConsent);
  },
  dismissGeniusPassOffer: (nowTimestamp) => {
    const state = get();
    set({
      geniusPassDismissals: state.geniusPassDismissals + 1,
      geniusPassLastOfferTimestamp: nowTimestamp,
    });
  },
  recordGeniusPassOfferShown: (nowTimestamp) => {
    const state = get();
    set({ geniusPassLastOfferTimestamp: nowTimestamp });
    logEvent('genius_pass_offered', {}, state.analyticsConsent);
  },
  claimPiggyBank: () => {
    const state = get();
    if (state.piggyBankBroken) return;
    set({
      sparks: state.sparks + state.piggyBankSparks,
      piggyBankSparks: 0,
      piggyBankBroken: true,
    });
  },
  purchaseSparks: (packAmount, nowTimestamp) => {
    const state = get();
    const decision = evaluateSparksPurchase({ state, packAmount, nowTimestamp });
    if (!decision.allowed) {
      logEvent('spark_cap_reached', { remaining: decision.remaining }, state.analyticsConsent);
      return decision.reason;
    }
    const monthStart = startOfCurrentMonthUTC(nowTimestamp);
    const tier = packAmount === 20 ? 'small' : packAmount === 110 ? 'medium' : 'large'; // CONST-OK GDD §26 3-tier mapping
    set({
      sparks: state.sparks + packAmount,
      sparksPurchasedThisMonth: decision.effectivePurchasedThisMonth + packAmount,
      sparksPurchaseMonthStart: monthStart,
    });
    logEvent('spark_pack_purchased', { tier, amount: packAmount }, state.analyticsConsent);
    const fired = logEventOnce('first_purchase', { source: 'spark_pack', tier }, state.analyticsConsent, state.firstEventsFired);
    if (fired !== state.firstEventsFired) set({ firstEventsFired: fired });
    return 'ok';
  },
  stampLimitedTimeOffer: (offerId, nowTimestamp) => {
    const state = get();
    if (state.activeLimitedOffer?.id === offerId) return;
    set({
      activeLimitedOffer: { id: offerId, expiresAt: nowTimestamp + SYNAPSE_CONSTANTS.limitedOfferExpiryMs },
    });
    logEvent('limited_offer_shown', { id: offerId }, state.analyticsConsent);
  },
  acceptLimitedTimeOffer: (offerId) => {
    const state = get();
    if (state.purchasedLimitedOffers.includes(offerId)) return;
    const def = findLimitedTimeOffer(offerId);
    if (!def) return;
    const updates: Partial<GameState> = {
      sparks: state.sparks + (def.contents.sparks ?? 0),
      memories: state.memories + (def.contents.memories ?? 0),
      purchasedLimitedOffers: [...state.purchasedLimitedOffers, offerId],
      activeLimitedOffer: null,
    };
    // Random cosmetic selection via mulberry32 seeded by (installedAt, offerId).
    // Uses the same seeded-RNG pattern as mutations.ts — deterministic per install.
    if (def.contents.randomNeuronSkin || def.contents.randomGlowPack || def.contents.randomCanvasTheme) {
      const seed = (state.installedAt + offerId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) >>> 0;
      const rng = mulberry32(seed);
      const pickUnowned = (category: 'neuron_skin' | 'canvas_theme' | 'glow_pack', ownedList: readonly string[]): string | null => {
        const eligible = COSMETIC_CATALOG.filter((c) => c.category === category && c.exclusive === null && !ownedList.includes(c.id));
        if (eligible.length === 0) return null;
        return eligible[Math.floor(rng() * eligible.length)].id;
      };
      if (def.contents.randomNeuronSkin) {
        const pick = pickUnowned('neuron_skin', state.ownedNeuronSkins);
        if (pick) updates.ownedNeuronSkins = [...state.ownedNeuronSkins, pick];
      }
      if (def.contents.randomGlowPack) {
        const pick = pickUnowned('glow_pack', state.ownedGlowPacks);
        if (pick) updates.ownedGlowPacks = [...state.ownedGlowPacks, pick];
      }
      if (def.contents.randomCanvasTheme) {
        const pick = pickUnowned('canvas_theme', state.ownedCanvasThemes);
        if (pick) updates.ownedCanvasThemes = [...state.ownedCanvasThemes, pick];
      }
    }
    set(updates);
    logEvent('limited_offer_purchased', { id: offerId, price: def.priceUsd }, state.analyticsConsent);
    const fired = logEventOnce('first_purchase', { source: 'limited_offer', id: offerId }, state.analyticsConsent, state.firstEventsFired);
    if (fired !== state.firstEventsFired) set({ firstEventsFired: fired });
  },
  consumeLimitedTimeOffer: (offerId) => {
    const state = get();
    if (state.purchasedLimitedOffers.includes(offerId)) return;
    set({
      purchasedLimitedOffers: [...state.purchasedLimitedOffers, offerId],
      activeLimitedOffer: null,
    });
    // Fires as `limited_offer_expired` — covers both the timer-expiry case and
    // the manual-dismiss case (both consume the offer slot terminally).
    logEvent('limited_offer_expired', { id: offerId }, state.analyticsConsent);
  },
  buyNeuron: (type, nowTimestamp) => {
    const state = get();
    const result = tryBuyNeuron(state, type, nowTimestamp);
    if (!result.ok) return result.reason;
    const mid = { ...state, ...result.updates };
    const narrative = dispatchNarrative(mid, { kind: 'neuron_bought' });
    const post = { ...mid, ...narrative };
    const ach = processAchievementUnlocks(post as GameState, nowTimestamp);
    set({ ...result.updates, ...narrative, ...ach, undoToast: result.undoToast });
    playSfx('neuron_buy'); // SFX wired in audio adapter
    // §27 funnel + first-ever neuron + tutorial-first-buy.
    let fired = state.firstEventsFired;
    fired = logEventOnce('first_neuron', { type }, state.analyticsConsent, fired);
    if (state.isTutorialCycle) {
      fired = logEventOnce('tutorial_first_buy', {}, state.analyticsConsent, fired);
    }
    if (fired !== state.firstEventsFired) set({ firstEventsFired: fired });
    return 'ok';
  },
  buyUpgrade: (id, nowTimestamp) => {
    const state = get();
    const result = tryBuyUpgrade(state, id, nowTimestamp);
    if (!result.ok) return result.reason;
    // Sprint 7.7 §38 — Upgrade Mastery +1 XP per purchase (lifetime accrual).
    // applyMasteryXpGain ignores unknown ids (shards/mutations won't reach here).
    const masteryAfter = applyMasteryXpGain(state, id, 1);
    const post = { ...state, ...result.updates, mastery: masteryAfter };
    const ach = processAchievementUnlocks(post as GameState, nowTimestamp);
    set({ ...result.updates, mastery: masteryAfter, ...ach, undoToast: result.undoToast });
    playSfx('upgrade_buy'); // SFX wired in audio adapter
    // §27 core — every upgrade purchase. Tutorial-first-buy fires lifetime once.
    logEvent('upgrade_purchased', { id, prestigeCount: state.prestigeCount }, state.analyticsConsent);
    if (state.isTutorialCycle) {
      const fired = logEventOnce('tutorial_first_buy', {}, state.analyticsConsent, state.firstEventsFired);
      if (fired !== state.firstEventsFired) set({ firstEventsFired: fired });
    }
    return 'ok';
  },
  buyShardUpgrade: (id, nowTimestamp) => {
    const state = get();
    const result = tryBuyShardUpgrade(state, id, nowTimestamp);
    if (!result.ok) return result.reason;
    const post = { ...state, ...result.updates };
    const ach = processAchievementUnlocks(post as GameState, nowTimestamp);
    set({ ...result.updates, ...ach, undoToast: result.undoToast });
    return 'ok';
  },
  setActivePrecommitment: (goalId) => {
    const state = get();
    if (state.prestigeCount < SYNAPSE_CONSTANTS.precommitUnlockPrestige) return 'locked';
    if (state.activePrecommitment !== null) return 'already_active';
    const def = PRECOMMIT_GOALS_BY_ID[goalId];
    if (def === undefined) return 'unknown_goal';
    if (state.memories < def.wager) return 'insufficient_funds';
    set({ activePrecommitment: { goalId, wager: def.wager }, memories: state.memories - def.wager });
    return 'ok';
  },
  cancelActivePrecommitment: () => {
    const state = get();
    if (state.activePrecommitment === null) return 'no_active';
    // PRECOMMIT-2: cancellation refund only allowed before any meaningful cycle progress.
    // "Meaningful" = a tap, neuron buy, upgrade buy, or any thoughts production beyond Momentum carry.
    const meaningful = state.lastTapTimestamps.length > 0 || state.cycleNeuronsBought > 0 || state.cycleUpgradesBought > 0 || state.cycleGenerated > state.momentumBonus;
    if (meaningful) return 'too_late';
    set({ memories: state.memories + state.activePrecommitment.wager, activePrecommitment: null });
    return 'ok';
  },
  authorNamedMoment: (momentId, phrase) => {
    if (!(NAMED_MOMENTS as readonly string[]).includes(momentId)) return 'invalid_moment';
    const trimmed = phrase.trim();
    if (trimmed.length === 0 || trimmed.length > SYNAPSE_CONSTANTS.brocaPhraseMaxChars) return 'invalid_phrase';
    const state = get();
    const id = momentId as NamedMomentId;
    if (hasMomentBeenLogged(state, id)) return 'already_logged';
    set({ brocaNamedMoments: logNamedMoment(state, id, trimmed) });
    return 'ok';
  },
  skipNamedMoment: (momentId) => {
    if (!(NAMED_MOMENTS as readonly string[]).includes(momentId)) return 'invalid_moment';
    const state = get();
    const id = momentId as NamedMomentId;
    if (hasMomentBeenLogged(state, id)) return 'already_logged';
    set({ brocaNamedMoments: logNamedMoment(state, id, defaultPhraseFor(id, state.archetype)) });
    return 'ok';
  },
  completeTutorialStep: (stepId) => {
    if (!(SYNAPSE_CONSTANTS.tutorialStepIds as readonly string[]).includes(stepId)) return 'invalid_step';
    const state = get();
    if (state.narrativeFragmentsSeen.includes(stepId)) return 'already_completed';
    set({
      narrativeFragmentsSeen: [...state.narrativeFragmentsSeen, stepId],
      sparks: state.sparks + SYNAPSE_CONSTANTS.tutorialSparksRewardPerStep,
    });
    return 'ok';
  },
  undoLastPurchase: () => {
    const toast = get().undoToast;
    if (!toast) return;
    set({ ...toast.snapshot, undoToast: null });
  },
  dismissUndoToast: () => set({ undoToast: null }),
  discharge: (nowTimestamp) => {
    const state = get();
    const { updates, outcome } = performDischarge(state, nowTimestamp);
    if (!outcome.fired) return outcome;
    const mid = { ...state, ...updates };
    const narrative = dispatchNarrative(mid, { kind: 'discharge_fired' });
    const post = { ...mid, ...narrative };
    const ach = processAchievementUnlocks(post as GameState, nowTimestamp);
    set({ ...updates, ...narrative, ...ach });
    playSfx('discharge'); // SFX wired in audio adapter
    // §27 core — every discharge. Tutorial-first-discharge fires once.
    logEvent('discharge_used', {
      bonus: outcome.burst,
      cascade: outcome.isCascade,
      insightActive: state.insightActive,
    }, state.analyticsConsent);
    if (state.isTutorialCycle) {
      const fired = logEventOnce('tutorial_first_discharge', {}, state.analyticsConsent, state.firstEventsFired);
      if (fired !== state.firstEventsFired) set({ firstEventsFired: fired });
    }
    return outcome;
  },
  prestige: (nowTimestamp, force = false) => {
    const state = get();
    if (!force && state.cycleGenerated < state.currentThreshold) {
      return { fired: false, outcome: null };
    }
    // Pre-reset achievement check: catches cycle-scoped achievements (cyc_*) that
    // depend on cycleCascades/cycleNeuronPurchases/cycleDischargesUsed before
    // PRESTIGE_RESET zeros them. cyc_under_10 reads outcome.cycleDurationMs from
    // the awakeningLog entry that handlePrestige writes — so we run the check
    // on a synthetic pre-reset+latest-log state.
    const cycleEndState: GameState = {
      ...state,
      // Preview the awakening log entry that handlePrestige will append, so
      // cyc_under_10 can read it without waiting for handlePrestige to commit.
      awakeningLog: [...state.awakeningLog, { prestigeCount: state.prestigeCount, timestamp: nowTimestamp, cycleDurationMs: nowTimestamp - state.cycleStartTimestamp, endProduction: state.effectiveProductionPerSecond, polarity: state.currentPolarity, mutationId: state.currentMutation?.id ?? null, pathway: state.currentPathway, patternsGained: 0, memoriesGained: 0, wasPersonalBest: false }],
    };
    const preCheck = checkAllAchievements(cycleEndState);

    const { state: nextState, outcome } = handlePrestige(state, nowTimestamp);
    // Sprint 7.7 §38 — grant Mastery XP for the outgoing cycle's choices.
    // state (pre-PRESTIGE_RESET) still carries currentMutation/Pathway/archetype.
    // applyMasteryXpGain is pure + ignores unknown ids, so null-choices no-op.
    let masteryAfterPrestige = nextState.mastery;
    const mutationId = state.currentMutation?.id ?? null;
    const pathwayId = state.currentPathway;
    const archetypeId = state.archetype;
    if (mutationId !== null) masteryAfterPrestige = applyMasteryXpGain({ mastery: masteryAfterPrestige, memoryShardUpgrades: state.memoryShardUpgrades }, mutationId, 1);
    if (pathwayId !== null) masteryAfterPrestige = applyMasteryXpGain({ mastery: masteryAfterPrestige, memoryShardUpgrades: state.memoryShardUpgrades }, pathwayId, 1);
    if (archetypeId !== null) masteryAfterPrestige = applyMasteryXpGain({ mastery: masteryAfterPrestige, memoryShardUpgrades: state.memoryShardUpgrades }, archetypeId, 1);
    // Push prestige diary entry BEFORE post-reset achievement check so
    // hid_no_discharge_full_cycle can count this cycle's tail entry.
    // Sprint 7.5: also push personal_best entry if achieved + resonant_pattern
    // entries for any newly-discovered RPs (handlePrestige fires them inline).
    const prestigeDiary: DiaryEntry = {
      timestamp: nowTimestamp,
      type: 'prestige',
      data: {
        prestigeCount: outcome.newPrestigeCount,
        cycleDurationMs: outcome.cycleDurationMs,
        memoriesGained: outcome.memoriesGained,
        wasPersonalBest: outcome.wasPersonalBest,
        dischargesUsed: state.cycleDischargesUsed,
      },
    };
    const extraDiary: DiaryEntry[] = [];
    if (outcome.wasPersonalBest) {
      extraDiary.push({ timestamp: nowTimestamp, type: 'personal_best', data: { prestigeCount: state.prestigeCount, cycleMinutes: outcome.cycleDurationMs / 60_000 } });
    }
    // Newly-discovered RPs: compare pre-prestige vs post-prestige resonantPatternsDiscovered arrays.
    for (let i = 0; i < state.resonantPatternsDiscovered.length; i++) {
      if (!state.resonantPatternsDiscovered[i] && nextState.resonantPatternsDiscovered[i]) {
        extraDiary.push({ timestamp: nowTimestamp, type: 'resonant_pattern', data: { rpIndex: i, rpNumber: i + 1 } });
      }
    }
    const withDiary = { ...nextState, mastery: masteryAfterPrestige, diaryEntries: [...nextState.diaryEntries, prestigeDiary, ...extraDiary], achievementsUnlocked: [...nextState.achievementsUnlocked, ...preCheck.newlyUnlocked] };
    // Merge mode (no `true` flag) — preserves action bindings per CLAUDE.md
    // Zustand pitfall rule. undoToast cleared since pre-prestige purchases no
    // longer apply to the new cycle. Narrative triggers fire on the POST-reset
    // state (prestigeCount already incremented) per NARR-4 ordering.
    const narrative = dispatchNarrative(withDiary, { kind: 'prestige_done' });
    const post = { ...withDiary, ...narrative };
    // Post-reset check: catches meta_first_awakening (lifetimePrestiges incremented)
    // and any other persistent-field achievements. Pre-check IDs are already in
    // achievementsUnlocked so processAchievementUnlocks won't double-count.
    const ach = processAchievementUnlocks(post as GameState, nowTimestamp);
    // Merge pre-check rewards into the diary + sparks too (processAchievementUnlocks
    // only handled the post-check; pre-check unlocks need their own diary+spark side
    // effects). Compute pre-check side effects manually:
    const preReward = achievementRewardSum(preCheck.newlyUnlocked);
    const preDiary: DiaryEntry[] = preCheck.newlyUnlocked.map((id) => ({
      timestamp: nowTimestamp,
      type: 'achievement' as const,
      data: { achievementId: id, reward: ACHIEVEMENTS_BY_ID[id]?.reward ?? 0 },
    }));
    const finalDiary = [...(ach.diaryEntries ?? withDiary.diaryEntries), ...preDiary];
    const trimmedDiary = finalDiary.length > 500 ? finalDiary.slice(finalDiary.length - 500) : finalDiary; // CONST-OK Sprint 7.5 cap
    const finalToast = ach.achievementToast ?? (preCheck.newlyUnlocked.length > 0 ? { achievementId: preCheck.newlyUnlocked[0], expiresAt: nowTimestamp + SYNAPSE_CONSTANTS.undoToastDurationMs } : null);
    // Sprint 7.6 Phase 7.6.3 §37 TUTOR-5 — completed cycle N (pre-prestige
    // prestigeCount 0..4) grants tutorial_step_c{N+1} reward. Idempotent via
    // narrativeFragmentsSeen prefix (§39.2 pattern).
    const effectiveSeen = ach.narrativeFragmentsSeen ?? post.narrativeFragmentsSeen;
    const tutorialStepAdd = state.prestigeCount < SYNAPSE_CONSTANTS.tutorialTrackCycleCount
      ? SYNAPSE_CONSTANTS.tutorialStepIds[state.prestigeCount]
      : null;
    const grantsTutorialReward = tutorialStepAdd !== null && !effectiveSeen.includes(tutorialStepAdd);
    const tutorialSparksBonus = grantsTutorialReward ? SYNAPSE_CONSTANTS.tutorialSparksRewardPerStep : 0;
    const seenAfterTutorial = grantsTutorialReward ? [...effectiveSeen, tutorialStepAdd] : effectiveSeen;
    set({ ...withDiary, ...narrative, ...ach, sparks: (ach.sparks ?? post.sparks) + preReward + tutorialSparksBonus, narrativeFragmentsSeen: seenAfterTutorial, diaryEntries: trimmedDiary, achievementToast: finalToast, undoToast: null });
    // SFX wired in audio adapter — prestige + RP SFX. RP fires per newly-discovered
    // pattern; deliberate cascade over multiple discoveries (rare event by design).
    playSfx('prestige');
    for (let i = 0; i < state.resonantPatternsDiscovered.length; i++) {
      if (!state.resonantPatternsDiscovered[i] && nextState.resonantPatternsDiscovered[i]) {
        playSfx('resonant_pattern');
        // §27 core — RP discovered (per index).
        logEvent('resonant_pattern_discovered', { index: i }, state.analyticsConsent);
      }
    }
    // §27 core — prestige_completed every cycle.
    logEvent('prestige_completed', {
      prestigeCount: outcome.newPrestigeCount,
      cycleTime: outcome.cycleDurationMs,
      productionPeak: state.effectiveProductionPerSecond,
      patternsTotal: nextState.totalPatterns,
    }, state.analyticsConsent);
    if (outcome.wasPersonalBest) {
      logEvent('personal_best', {
        prestigeLevel: state.prestigeCount,
        oldTime: state.personalBests[state.prestigeCount]?.minutes ?? 0,
        newTime: outcome.cycleDurationMs / 60_000, // CONST-OK ms→min
      }, state.analyticsConsent);
    }
    // §27 funnel — first_prestige + reached_p5/p10 fire once each lifetime.
    let fired = state.firstEventsFired;
    fired = logEventOnce('first_prestige', { prestigeCount: outcome.newPrestigeCount }, state.analyticsConsent, fired);
    if (outcome.newPrestigeCount >= 5) fired = logEventOnce('reached_p5', {}, state.analyticsConsent, fired);
    if (outcome.newPrestigeCount >= 10) fired = logEventOnce('reached_p10', {}, state.analyticsConsent, fired);
    if (fired !== state.firstEventsFired) set({ firstEventsFired: fired });
    return { fired: true, outcome };
  },
  resetPatternDecisions: () => {
    const state = get();
    const cost = SYNAPSE_CONSTANTS.patternResetCostResonance;
    if (state.resonance < cost) return { fired: false };
    // §27 core — pattern_decisions_reset (PAT-3).
    logEvent('pattern_decisions_reset', { prestigeCount: state.prestigeCount, resonanceCost: cost }, state.analyticsConsent);
    // Node 6 B is the only state-mutating decision — remove its +1 bump.
    const wasSixB = state.patternDecisions[6] === 'B';
    set({
      resonance: state.resonance - cost,
      patternDecisions: {},
      dischargeMaxCharges: state.dischargeMaxCharges - (wasSixB ? 1 : 0),
    });
    return { fired: true };
  },
  choosePatternDecision: (nodeIndex, choice) => {
    const state = get();
    const isDecisionNode = (SYNAPSE_CONSTANTS.patternDecisionNodes as readonly number[]).includes(nodeIndex);
    if (!isDecisionNode) return { fired: false };
    if (state.patternDecisions[nodeIndex] !== undefined) return { fired: false };
    const nextDecisions = { ...state.patternDecisions, [nodeIndex]: choice };
    // Apply permanent state effect (Node 6 B bumps dischargeMaxCharges).
    const permUpdates = applyPermanentPatternDecisionsToState({
      patternDecisions: nextDecisions,
      dischargeMaxCharges: state.dischargeMaxCharges,
    });
    set({ patternDecisions: nextDecisions, ...permUpdates });
    // §27 core — pattern_decision per node + choice.
    logEvent('pattern_decision', { nodeIndex, choice }, state.analyticsConsent);
    return { fired: true };
  },
  setPolarity: (polarity) => {
    const state = get();
    if (state.prestigeCount < SYNAPSE_CONSTANTS.polarityUnlockPrestige) {
      return { fired: false };
    }
    const post = { ...state, currentPolarity: polarity };
    const ach = processAchievementUnlocks(post as GameState, Date.now());
    set({ currentPolarity: polarity, ...ach });
    logEvent('polarity_chosen', { type: polarity, prestigeCount: state.prestigeCount }, state.analyticsConsent);
    return { fired: true };
  },
  setPathway: (pathway) => {
    const state = get();
    if (state.prestigeCount < SYNAPSE_CONSTANTS.pathwayUnlockPrestige) {
      return { fired: false };
    }
    const post = { ...state, currentPathway: pathway, uniquePathwaysUsed: state.uniquePathwaysUsed.includes(pathway) ? state.uniquePathwaysUsed : [...state.uniquePathwaysUsed, pathway] };
    const ach = processAchievementUnlocks(post as GameState, Date.now());
    set({ currentPathway: pathway, uniquePathwaysUsed: post.uniquePathwaysUsed, ...ach });
    logEvent('pathway_chosen', { type: pathway, prestigeCount: state.prestigeCount }, state.analyticsConsent);
    return { fired: true };
  },
  setMutation: (mutationId) => {
    const state = get();
    if (state.prestigeCount < SYNAPSE_CONSTANTS.mutationUnlockPrestige) {
      return { fired: false };
    }
    const mutation = MUTATIONS_BY_ID[mutationId];
    if (!mutation) return { fired: false };
    // Déjà Vu (#14): rehydrate upgrades from last cycle's snapshot.
    // Cost ×2 is enforced separately via mutationUpgradeCostMod in tryBuyUpgrade.
    let upgrades = state.upgrades;
    if (mutation.effect.kind === 'deja_vu') {
      const carry = state.lastCycleConfig?.upgrades ?? [];
      upgrades = carry.map((id) => ({ id, purchased: true, purchasedAt: 0 }));
    }
    const uniqueMuts = state.uniqueMutationsUsed.includes(mutationId) ? state.uniqueMutationsUsed : [...state.uniqueMutationsUsed, mutationId];
    const post = { ...state, currentMutation: { id: mutationId }, upgrades, uniqueMutationsUsed: uniqueMuts };
    const ach = processAchievementUnlocks(post as GameState, Date.now());
    set({ currentMutation: { id: mutationId }, mutationSeed: mutationId === '' ? 0 : state.mutationSeed, upgrades, uniqueMutationsUsed: uniqueMuts, ...ach });
    // §27 core — mutation_chosen. `options` not tracked here (the options array
    // lives in the UI side); pass count via state-derived heuristic.
    logEvent('mutation_chosen', { id: mutationId, prestigeCount: state.prestigeCount }, state.analyticsConsent);
    return { fired: true };
  },
  setArchetype: (archetype) => {
    const state = get();
    if (state.prestigeCount < SYNAPSE_CONSTANTS.archetypeUnlockPrestige) {
      return { fired: false };
    }
    // GDD §12: irreversible for the Run. Transcendence is the only path that
    // clears `state.archetype` back to null (per §34 TRANSCENDENCE_RESET).
    if (state.archetype !== null) {
      return { fired: false };
    }
    const pending: Partial<GameState> = {
      archetype,
      archetypeHistory: [...state.archetypeHistory, archetype],
    };
    // Fire ARC-01 fragment (archetype_chosen event against post-set state).
    const mid = { ...state, ...pending };
    const narrative = dispatchNarrative(mid, { kind: 'archetype_chosen' });
    const post = { ...mid, ...narrative };
    const ach = processAchievementUnlocks(post as GameState, Date.now());
    set({ ...pending, ...narrative, ...ach });
    return { fired: true };
  },
  readFragment: (id) => {
    const state = get();
    const updates = applyFragmentRead(state, id);
    if (Object.keys(updates).length === 0) return;
    const post = { ...state, ...updates };
    const ach = processAchievementUnlocks(post as GameState, Date.now());
    set({ ...updates, ...ach });
  },
  chooseEnding: (id, option) => {
    const state = get();
    if (state.endingsSeen.includes(id)) return;
    const now = Date.now();
    const endingDiary: DiaryEntry = {
      timestamp: now,
      type: 'ending',
      data: { endingId: id, option },
    };
    const post = { ...state, endingsSeen: [...state.endingsSeen, id], diaryEntries: [...state.diaryEntries, endingDiary] };
    const ach = processAchievementUnlocks(post as GameState, now);
    set({ endingsSeen: post.endingsSeen, diaryEntries: post.diaryEntries, ...ach });
    // §27 core — ending_seen.
    logEvent('ending_seen', { endingId: id, choice: option }, state.analyticsConsent);
  },
  dismissAchievementToast: () => set({ achievementToast: null }),
  applyTranscendence: (endingId, nowTimestamp) => {
    const prev = get();
    if (prev.prestigeCount < 26) return null; // CONST-OK: P26 is the §9 Transcendence gate
    const { state: next, outcome } = handleTranscendence(prev as GameState, endingId, nowTimestamp);
    set(next);
    // §27 core — transcendence (every time) + funnel first_transcendence (once).
    logEvent('transcendence', {
      transcendenceCount: outcome.newTranscendenceCount,
      totalTime: nowTimestamp - (prev.installedAt ?? 0),
      archetypeChosen: prev.archetype ?? '',
    }, prev.analyticsConsent);
    const fired = logEventOnce('first_transcendence', { transcendenceCount: outcome.newTranscendenceCount }, prev.analyticsConsent, next.firstEventsFired);
    if (fired !== next.firstEventsFired) set({ firstEventsFired: fired });
    return outcome;
  },
  buyResonanceUpgrade: (id) => {
    const { bought, state: next } = tryBuyResonanceUpgrade(get() as GameState, id);
    if (!bought) return false;
    set(next);
    return true;
  },
  buyRunUpgrade: (id) => {
    const { bought, state: next } = tryBuyRunUpgrade(get() as GameState, id);
    if (!bought) return false;
    set(next);
    return true;
  },
}));
