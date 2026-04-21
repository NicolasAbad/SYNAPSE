// Tutorial-timing simulator — Sprint 3 Phase 7 player-test baseline.
//
// Runs the real engine (tick + applyTap + tryBuyNeuron) at a configurable
// constant tap rate and measures the time to hit tutorialThreshold
// (50 000 thoughts). Hedges the Phase 7 player test with an automated
// bound before Nico runs the blind-play session.
//
// CAVEATS:
// - Constant tap rate. Real players tap-pause; actual time may skew longer.
// - Greedy Basica-buying. Real players may also buy Sensorial (150 cost)
//   or upgrade(s) instead — but early-cycle Basica-only is the minimum-
//   overhead path, so this under-estimates actual time if the player
//   diversifies.
// - No Discharge usage modeled. First charge fires at t=20 min (no upgrade
//   reduces the base interval in P0), so Discharge has zero influence on
//   any reasonable tutorial time.
//
// Run: npx tsx scripts/tutorial-timing.ts

import { SYNAPSE_CONSTANTS } from '../src/config/constants';
import { createDefaultState } from '../src/store/gameStore';
import { tick } from '../src/engine/tick';
import { applyTap } from '../src/store/tap';
import { tryBuyNeuron, tryBuyUpgrade } from '../src/store/purchases';
import { neuronCost } from '../src/config/neurons';
import type { GameState } from '../src/types/GameState';
import type { NeuronType } from '../src/types';

const DT_MS = 100;
const MAX_SIM_MINUTES = 30;
const MAX_TICKS = (MAX_SIM_MINUTES * 60 * 1000) / DT_MS;
const START_TIME = 1_000_000; // arbitrary non-zero anchor so timestamp fields are set

interface SimResult {
  tapsPerSec: number;
  minutes: number;
  reachedThreshold: boolean;
  taps: number;
  basicasBought: number;
  endThoughts: number;
}

function countOf(state: GameState, type: NeuronType): number {
  return state.neurons.find((n) => n.type === type)?.count ?? 0;
}

function simulate(tapsPerSec: number): SimResult {
  let state = createDefaultState();
  state.cycleStartTimestamp = START_TIME;
  state.sessionStartTimestamp = START_TIME;
  state.lastActiveTimestamp = START_TIME;
  state.dischargeLastTimestamp = START_TIME;

  let now = START_TIME;
  let tapAccum = 0;
  const tapIntervalMs = 1000 / tapsPerSec;
  let ticks = 0;
  let taps = 0;
  let basicasBought = 0;
  let antiSpamActive = false;

  while (state.thoughts < SYNAPSE_CONSTANTS.tutorialThreshold && ticks < MAX_TICKS) {
    const result = tick(state, now);
    state = result.state as GameState;
    antiSpamActive = result.antiSpamActive;

    tapAccum += DT_MS;
    while (tapAccum >= tapIntervalMs) {
      tapAccum -= tapIntervalMs;
      const delta = applyTap(state, antiSpamActive, now);
      Object.assign(state, delta);
      taps++;
    }

    // Realistic tutorial purchase priority (captures what a first-time
    // player with the Connection-Multiplier HUD chip + hint-4 would do):
    //   1. red_neuronal_densa (3K)   — +25% global, cheap
    //   2. potencial_sinaptico (5K)  — 2× tap (0.05 → 0.10)
    //   3. First Sensorial once basica ≥ 10 and can afford (150)
    //   4. More Sensorials while affordable (9× basica rate)
    //   5. More Basicas to fill gaps
    let guard = 0;
    let changed = true;
    while (changed && guard < 200) {
      changed = false;
      guard++;
      const basicaCount = countOf(state, 'basica');
      const sensorialCount = countOf(state, 'sensorial');
      const ownsRed = state.upgrades.some((u) => u.id === 'red_neuronal_densa');
      const ownsPot = state.upgrades.some((u) => u.id === 'potencial_sinaptico');

      // Upgrade: red_neuronal_densa (3K)
      if (!ownsRed && state.thoughts >= 3_000) {
        const r = tryBuyUpgrade(state, 'red_neuronal_densa', now);
        if (r.ok) {
          Object.assign(state, r.updates);
          changed = true;
          continue;
        }
      }
      // Upgrade: potencial_sinaptico (5K)
      if (!ownsPot && state.thoughts >= 5_000) {
        const r = tryBuyUpgrade(state, 'potencial_sinaptico', now);
        if (r.ok) {
          Object.assign(state, r.updates);
          changed = true;
          continue;
        }
      }
      // Sensorial (unlocks at basica >= 10; cost 150 × 1.28^owned)
      if (basicaCount >= 10 && state.thoughts >= neuronCost('sensorial', sensorialCount)) {
        const r = tryBuyNeuron(state, 'sensorial', now);
        if (r.ok) {
          Object.assign(state, r.updates);
          changed = true;
          continue;
        }
      }
      // Basica
      if (state.thoughts >= neuronCost('basica', basicaCount)) {
        const r = tryBuyNeuron(state, 'basica', now);
        if (r.ok) {
          Object.assign(state, r.updates);
          basicasBought++;
          changed = true;
          continue;
        }
      }
    }

    now += DT_MS;
    ticks++;
  }

  return {
    tapsPerSec,
    minutes: (ticks * DT_MS) / 60_000,
    reachedThreshold: state.thoughts >= SYNAPSE_CONSTANTS.tutorialThreshold,
    taps,
    basicasBought,
    endThoughts: Math.floor(state.thoughts),
  };
}

console.log('');
console.log('Tutorial-timing simulator');
console.log('─────────────────────────');
console.log(`Target: ${SYNAPSE_CONSTANTS.tutorialThreshold.toLocaleString()} thoughts in 7–9 minutes.`);
console.log('');
console.log('┌─────────┬──────────┬──────┬──────────┬─────────────┐');
console.log('│ tap/sec │ minutes  │ taps │ basicas  │ end-thoughts │');
console.log('├─────────┼──────────┼──────┼──────────┼─────────────┤');

const RATES = [2, 3, 4, 5, 6, 7];
for (const rate of RATES) {
  const r = simulate(rate);
  const flag = r.reachedThreshold ? (r.minutes >= 7 && r.minutes <= 9 ? '✓' : ' ') : '⚠';
  const minutesDisplay = r.reachedThreshold ? r.minutes.toFixed(2) : `>${MAX_SIM_MINUTES}`;
  console.log(
    `│ ${String(rate).padStart(3)}${flag}    │ ${minutesDisplay.padStart(8)} │ ${String(r.taps).padStart(4)} │ ${String(r.basicasBought).padStart(8)} │ ${r.endThoughts.toLocaleString().padStart(11)} │`,
  );
}
console.log('└─────────┴──────────┴──────┴──────────┴─────────────┘');
console.log('✓ = within 7–9 min window · (blank) = reached but outside window · ⚠ = timeout');
console.log('');
