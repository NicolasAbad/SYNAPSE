// Sprint 7.8 Balance Scout Sim — preliminary pacing + anomaly validator for
// Sprint 7.5-7.7 balance additions. NOT canonical TEST-5 (Sprint 8c owns that,
// gated by Sprint 8a offline + 8b Transcendence + RP detection predicates).
//
// Single-Run simulation: P0 → P26. Deterministic — pure engine calls, no
// Math.random / Date.now. Simulates a player tapping at a configured rate +
// buying most-affordable available neuron/upgrade + discharging at full charges.
//
// Telemetry per cycle: duration_s, memoriesGained, moodTierAtPrestige,
// masteryTotalAtPrestige, shardBalances, dischargesUsed, cascadesCount.
// Aggregate: archetype / pathway / tap-rate config + any anomaly flags.

import { tick } from '../engine/tick';
import { handlePrestige } from '../engine/prestige';
import { handleTranscendence } from '../engine/transcendence';
import { computeTapThought, computeFocusFillPerTap } from '../store/tap';
import { performDischarge } from '../engine/discharge';
import { tryBuyNeuron, tryBuyUpgrade } from '../store/purchases';
import { effectiveCascadeThreshold } from '../engine/discharge';
import { calculateCurrentThreshold } from '../engine/production';
import { applyMasteryXpGain } from '../engine/mastery';
import { useGameStore } from '../store/gameStore';
import { UPGRADES } from '../config/upgrades';
import { NEURON_CONFIG } from '../config/neurons';
import type { GameState } from '../types/GameState';
import type { Archetype, Pathway, NeuronType, EndingID } from '../types';

const TICK_MS = 100; // CONST-OK §35 TICK-1
const NEURON_TYPES: readonly NeuronType[] = ['basica', 'sensorial', 'piramidal', 'espejo', 'integradora'];
const CYCLES_TO_SIMULATE = 26; // CONST-OK GDD §9 P26 endgame
const MAX_SIM_MS_PER_CYCLE = 60 * 60 * 1_000; // CONST-OK sim safety cap: 60 sim-minutes / cycle

export interface BalanceScoutConfig {
  tapRate: number; // taps per second (0 = idle-only)
  archetype: Archetype | null;
  pathway: Pathway | null;
  label: string;
  /** Sprint 8c — number of Runs (Transcendence cycles) to simulate. Default 1; TEST-5 uses 3. */
  runs?: number;
}

export interface CycleTelemetry {
  runIndex: number; // Sprint 8c — 0-indexed Run (0 = first Run, 1 = post-1st-Transcendence, ...)
  prestigeCount: number;
  durationMs: number;
  memoriesGained: number;
  thoughtsEndOfCycle: number;
  mood: number;
  masterySum: number; // sum of all mastery[id] values
  shardsEmo: number;
  shardsProc: number;
  shardsEpi: number;
  dischargesUsed: number;
  resonanceGained: number; // Sprint 8c — Resonance earned this prestige (P13+ gated)
  anomalies: string[]; // NaN / Infinity / negative-balance flags for this cycle
}

export interface ScoutResult {
  config: BalanceScoutConfig;
  cycles: CycleTelemetry[];
  totalSimMs: number;
  anomalies: string[];
  timedOut: boolean;
}

/** Fresh simulation state. Uses the store's reset to stay in sync with createDefaultState. */
function freshSimState(): GameState {
  useGameStore.getState().reset();
  const raw = useGameStore.getState() as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const UI_FIELDS = new Set(['activeTab', 'activeMindSubtab', 'undoToast', 'antiSpamActive', 'achievementToast']);
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'function' || UI_FIELDS.has(k)) continue;
    out[k] = v;
  }
  return out as unknown as GameState;
}

/** Heuristic: buy the cheapest neuron type the player can currently afford. */
function simBuyNeuron(state: GameState, now: number): GameState {
  for (const type of NEURON_TYPES) {
    const config = NEURON_CONFIG[type];
    const unlock = config.unlock;
    if (unlock.kind === 'neuron_count') {
      const unlockType = unlock.type;
      const parentCount = state.neurons.find((n) => n.type === unlockType)?.count ?? 0;
      if (parentCount < unlock.count) continue;
    } else if (unlock.kind === 'prestige') {
      if (state.prestigeCount < unlock.min) continue;
    }
    const result = tryBuyNeuron(state, type, now);
    if (result.ok) return { ...state, ...result.updates };
  }
  return state;
}

/** Heuristic: buy the cheapest available upgrade. */
function simBuyUpgrade(state: GameState, now: number): GameState {
  const owned = new Set(state.upgrades.filter((u) => u.purchased).map((u) => u.id));
  const candidates = UPGRADES.filter((u) => !owned.has(u.id) && u.unlockPrestige <= state.prestigeCount);
  candidates.sort((a, b) => a.cost - b.cost);
  for (const u of candidates) {
    const result = tryBuyUpgrade(state, u.id, now);
    if (result.ok) return { ...state, ...result.updates };
  }
  return state;
}

/** Apply player taps (tapRate taps/sec × TICK_MS/1000 sec) to the state. Fractional taps accumulate as partial. */
function simTaps(state: GameState, _now: number, tapRate: number, tapAccumulator: number): { state: GameState; tapAccumulator: number } {
  const nextAcc = tapAccumulator + (tapRate * TICK_MS) / 1000; // CONST-OK ms→sec unit conversion
  const whole = Math.floor(nextAcc);
  if (whole === 0) return { state, tapAccumulator: nextAcc };
  let s = state;
  for (let i = 0; i < whole; i++) {
    const thoughtGain = computeTapThought(s, false);
    const focusGain = computeFocusFillPerTap(s);
    s = { ...s, thoughts: s.thoughts + thoughtGain, cycleGenerated: s.cycleGenerated + thoughtGain, totalGenerated: s.totalGenerated + thoughtGain, focusBar: s.focusBar + focusGain };
  }
  return { state: s, tapAccumulator: nextAcc - whole };
}

/** Heuristic: discharge when focusBar >= cascadeThreshold (cascade) OR at full charges. */
function simMaybeDischarge(state: GameState, now: number): GameState {
  if (state.dischargeCharges === 0) return state;
  const atCascade = state.focusBar >= effectiveCascadeThreshold(state);
  const atFullCharges = state.dischargeCharges >= state.dischargeMaxCharges;
  if (!atCascade && !atFullCharges) return state;
  const { updates, outcome } = performDischarge(state, now);
  if (!outcome.fired) return state;
  return { ...state, ...updates };
}

function detectAnomalies(state: GameState): string[] {
  const out: string[] = [];
  const nums: [string, number][] = [
    ['thoughts', state.thoughts], ['memories', state.memories], ['sparks', state.sparks],
    ['cycleGenerated', state.cycleGenerated], ['mood', state.mood],
    ['effectiveProductionPerSecond', state.effectiveProductionPerSecond],
  ];
  for (const [k, v] of nums) {
    if (!Number.isFinite(v)) out.push(`${k} non-finite: ${v}`);
    if (v < 0) out.push(`${k} negative: ${v}`);
  }
  return out;
}

export function runBalanceScoutSim(config: BalanceScoutConfig): ScoutResult {
  let state = freshSimState();
  if (config.archetype !== null) state = { ...state, archetype: config.archetype, archetypeHistory: [config.archetype] };
  if (config.pathway !== null) state = { ...state, currentPathway: config.pathway };

  const cycles: CycleTelemetry[] = [];
  const allAnomalies: string[] = [];
  let now = 0;
  let tapAccumulator = 0;
  let dischargesThisCycle = 0;
  let cycleStartTime = 0;
  let timedOut = false;
  const totalRuns = config.runs ?? 1;
  const SIM_ENDING_FOR_TRANSCENDENCE: EndingID = 'equation'; // CONST-OK sim placeholder ending

  for (let runIndex = 0; runIndex < totalRuns; runIndex++) {

  while (state.prestigeCount < CYCLES_TO_SIMULATE) {
    const target = calculateCurrentThreshold(state);
    const cycleStartCycleGenerated = state.cycleGenerated;
    dischargesThisCycle = 0;
    const initialNow = now;

    while (state.cycleGenerated < target) {
      now += TICK_MS;
      const { state: tickState } = tick(state, now);
      state = tickState;

      const tapResult = simTaps(state, now, config.tapRate, tapAccumulator);
      state = tapResult.state;
      tapAccumulator = tapResult.tapAccumulator;

      state = simBuyNeuron(state, now);
      state = simBuyUpgrade(state, now);

      const preCharges = state.dischargeCharges;
      state = simMaybeDischarge(state, now);
      if (state.dischargeCharges < preCharges) dischargesThisCycle++;

      if (now - initialNow > MAX_SIM_MS_PER_CYCLE) {
        timedOut = true;
        allAnomalies.push(`Cycle ${state.prestigeCount} timed out after ${MAX_SIM_MS_PER_CYCLE}ms`);
        break;
      }
      const cycleAnomalies = detectAnomalies(state);
      if (cycleAnomalies.length > 0) {
        for (const a of cycleAnomalies) allAnomalies.push(`P${state.prestigeCount}: ${a}`);
        break;
      }
    }

    if (timedOut) break;

    const preMemories = state.memories;
    const preMood = state.mood;
    const preShards = { ...state.memoryShards };
    // Sprint 7.7 §38 — mirror gameStore.prestige's XP dispatcher since the sim
    // invokes the engine directly (skipping store actions for speed).
    const preMutId = state.currentMutation?.id ?? null;
    const prePathId = state.currentPathway;
    const preArchId = state.archetype;
    const { state: postPrestige, outcome } = handlePrestige(state, now);
    let masteryAfter = postPrestige.mastery;
    if (preMutId !== null) masteryAfter = applyMasteryXpGain({ mastery: masteryAfter, memoryShardUpgrades: state.memoryShardUpgrades }, preMutId, 1);
    if (prePathId !== null) masteryAfter = applyMasteryXpGain({ mastery: masteryAfter, memoryShardUpgrades: state.memoryShardUpgrades }, prePathId, 1);
    if (preArchId !== null) masteryAfter = applyMasteryXpGain({ mastery: masteryAfter, memoryShardUpgrades: state.memoryShardUpgrades }, preArchId, 1);
    state = { ...postPrestige, mastery: masteryAfter };

    cycles.push({
      runIndex,
      prestigeCount: outcome.newPrestigeCount,
      durationMs: now - cycleStartTime,
      memoriesGained: outcome.memoriesGained,
      thoughtsEndOfCycle: cycleStartCycleGenerated + (state.thoughts - cycleStartCycleGenerated),
      mood: preMood,
      masterySum: Object.values(state.mastery).reduce((a, b) => a + b, 0),
      shardsEmo: state.memoryShards.emotional - preShards.emotional,
      shardsProc: state.memoryShards.procedural - preShards.procedural,
      shardsEpi: state.memoryShards.episodic - preShards.episodic,
      dischargesUsed: dischargesThisCycle,
      resonanceGained: outcome.resonanceGained,
      anomalies: [],
    });
    if (config.pathway !== null) state = { ...state, currentPathway: config.pathway };
    cycleStartTime = now;
    if (preMemories > state.memories) allAnomalies.push(`P${state.prestigeCount}: Memory decreased ${preMemories}→${state.memories}`);
  }

  if (timedOut) break;

  // Sprint 8c — between Runs, apply Transcendence to advance to the next Run.
  // Skip after the last Run. Re-apply config archetype + pathway since
  // Transcendence resets them per GDD §20.
  if (runIndex < totalRuns - 1) {
    const { state: postT } = handleTranscendence(state, SIM_ENDING_FOR_TRANSCENDENCE, now);
    state = postT;
    if (config.archetype !== null) state = { ...state, archetype: config.archetype, archetypeHistory: [...state.archetypeHistory, config.archetype] };
    if (config.pathway !== null) state = { ...state, currentPathway: config.pathway };
    cycleStartTime = now;
  }

  } // end runs loop

  return { config, cycles, totalSimMs: now, anomalies: allAnomalies, timedOut };
}
