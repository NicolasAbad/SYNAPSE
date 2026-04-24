// Implements GDD.md §20 (Transcendence + TRANS-1..5) — pure handleTranscendence
// (CODE-9). Sprint 8b Phase 8b.2.
//
// Trigger path (UI side): EndingScreen.chooseEnding(endingId, option) →
// store.applyTranscendence(endingId, nowTimestamp) → handleTranscendence.
//
// Pure: no Date.now() / Math.random(); takes nowTimestamp param like handlePrestige.

import { TRANSCENDENCE_RESET, NARRATIVE_TRANSCENDENCE_RETAIN_PREFIXES } from '../config/transcendence';
import { calculateThreshold } from './production';
import type { GameState } from '../types/GameState';
import type { Archetype, EndingID } from '../types';

export interface TranscendenceOutcome {
  prevTranscendenceCount: number;
  newTranscendenceCount: number;
  endingChosen: EndingID;
  archetypeArchived: Archetype | null; // the archetype that just completed
  nextThreshold: number; // Run N+1 P0→P1 threshold (with new runThresholdMult applied)
  retainedFragmentCount: number; // narrative fragments that survived the prefix filter
}

/**
 * §20 narrative-fragment filter: retain entries matching any of the V10
 * cross-Run prefixes (`crossrun_` / `greeting_` / `dream_`); clear the rest.
 * GDD says "reset to []" but Sprint 6.8 §16.5/§39 Inner Voice cross-Run
 * identity demands these survive — Nico-approved Sprint 8b V10.
 */
function filterCrossRunFragments(seen: readonly string[]): string[] {
  const out: string[] = [];
  for (const id of seen) {
    for (const prefix of NARRATIVE_TRANSCENDENCE_RETAIN_PREFIXES) {
      if (id.startsWith(prefix)) {
        out.push(id);
        break;
      }
    }
  }
  return out;
}

/**
 * Apply Transcendence per GDD §20 + TRANS-1..5. Pure.
 *
 * Field-set discipline: spread state, then TRANSCENDENCE_RESET, then per-field
 * overrides for UPDATE fields + engine-overridden RESET fields
 * (dischargeLastTimestamp ← nowTimestamp; narrativeFragmentsSeen ← filtered).
 *
 * TRANS-1 (CRITICAL): prestigeCount=0; transcendenceCount++. Without this,
 * Run 2+ threshold becomes infinite and the Run is unplayable.
 */
export function handleTranscendence(
  state: GameState,
  endingChosen: EndingID,
  nowTimestamp: number,
): { state: GameState; outcome: TranscendenceOutcome } {
  const archetypeArchived = state.archetype;
  const newTranscendenceCount = state.transcendenceCount + 1;
  const nextThreshold = calculateThreshold(0, newTranscendenceCount);
  const retainedFragments = filterCrossRunFragments(state.narrativeFragmentsSeen);

  const next: GameState = {
    ...state,
    ...TRANSCENDENCE_RESET,
    // RESET overrides
    dischargeLastTimestamp: nowTimestamp,
    narrativeFragmentsSeen: retainedFragments,
    // UPDATE fields (TRANS-1, TRANS-3, TRANS-4)
    prestigeCount: 0,
    transcendenceCount: newTranscendenceCount,
    currentThreshold: nextThreshold,
    cycleStartTimestamp: nowTimestamp,
    isTutorialCycle: false, // CONST-OK — post-Transcendence flag flip per GDD TUTOR-2
    archetypeHistory: archetypeArchived === null
      ? state.archetypeHistory
      : [...state.archetypeHistory, archetypeArchived],
    // Defensive: chooseEnding already appended in the EndingScreen flow.
    // Re-append only if absent (idempotent across replay / direct invocation).
    endingsSeen: state.endingsSeen.includes(endingChosen)
      ? state.endingsSeen
      : [...state.endingsSeen, endingChosen],
  };

  return {
    state: next,
    outcome: {
      prevTranscendenceCount: state.transcendenceCount,
      newTranscendenceCount,
      endingChosen,
      archetypeArchived,
      nextThreshold,
      retainedFragmentCount: retainedFragments.length,
    },
  };
}
