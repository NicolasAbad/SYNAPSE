// Sprint 8b Phase 8b.2 — handleTranscendence engine tests (GDD §20 + TRANS-1..5).

import { describe, expect, test } from 'vitest';
import { handleTranscendence } from '../../src/engine/transcendence';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';
import type { EndingID } from '../../src/types';

const NOW = 2_000_000_000_000;

function s(overrides: Partial<GameState> = {}): GameState {
  return { ...createDefaultState(), ...overrides };
}

function ranOnce(): GameState {
  // Plausible Run-1 P26 state ready for Transcendence.
  return s({
    prestigeCount: 26,
    transcendenceCount: 0,
    archetype: 'analitica',
    memories: 50,
    sparks: 12,
    resonance: 80,
    resonanceUpgrades: ['eco_neural'],
    runUpgradesPurchased: [],
    patterns: [{ index: 0, isDecisionNode: false, acquiredAt: 0 }],
    totalPatterns: 1,
    patternDecisions: { 6: 'A' },
    archetypeHistory: [],
    endingsSeen: [],
    eraVisualTheme: 'cosmic',
    regionsUnlocked: ['hipocampo', 'limbico'],
    firstCycleSnapshot: { type: 'basica', count: 5, rate: 0.5, timestamp: 1 },
    narrativeFragmentsSeen: ['ana_01', 'voice_p7_a1', 'crossrun_change_1', 'greeting_calm_1', 'dream_test'],
    achievementsUnlocked: ['neuron_5'],
    lifetimePrestiges: 26,
    diaryEntries: [{ timestamp: 1, type: 'fragment', data: { fragmentId: 'ana_01' } }],
    memoryShards: { emotional: 4, procedural: 7, episodic: 3 },
    brocaNamedMoments: [{ momentId: 'awakening', phrase: 'I am here.' }],
    mastery: { hiperestimulacion: 5 },
    autoBuyConfig: { basica: { enabled: true, cap: 100 } },
    mood: 75,
    moodHistory: [{ timestamp: 1, mood: 75 }],
    precommitmentStreak: 3,
  });
}

describe('handleTranscendence — TRANS-1 + TRANS-3 + TRANS-4', () => {
  test('TRANS-1: prestigeCount → 0, transcendenceCount → +1', () => {
    const before = ranOnce();
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.prestigeCount).toBe(0);
    expect(state.transcendenceCount).toBe(before.transcendenceCount + 1);
  });

  test('TRANS-3: currentThreshold uses runThresholdMult[transcendenceCount]', () => {
    const before = ranOnce();
    const { state } = handleTranscendence(before, 'equation', NOW);
    // Run 2 mult is index [1] = 3.5, applied to baseThresholdTable[0] (800K).
    expect(state.currentThreshold).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[0] * SYNAPSE_CONSTANTS.runThresholdMult[1]);
  });

  test('TRANS-4: archetypeHistory appends current archetype', () => {
    const before = ranOnce();
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.archetypeHistory).toEqual(['analitica']);
  });

  test('archetypeHistory does NOT append when archetype is null (defensive)', () => {
    const before = s({ prestigeCount: 26, archetype: null, archetypeHistory: ['empatica'] });
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.archetypeHistory).toEqual(['empatica']);
  });

  test('endingsSeen appends chosen ending', () => {
    const before = ranOnce();
    const { state } = handleTranscendence(before, 'chorus', NOW);
    expect(state.endingsSeen).toEqual(['chorus']);
  });

  test('endingsSeen append is idempotent — does not double when chooseEnding already logged', () => {
    const before = s({ prestigeCount: 26, archetype: 'analitica', endingsSeen: ['equation'] });
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.endingsSeen).toEqual(['equation']);
  });
});

describe('handleTranscendence — RESET fields (GDD §20)', () => {
  test('memories → 0, archetype → null, regionsUnlocked → []', () => {
    const before = ranOnce();
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.memories).toBe(0);
    expect(state.archetype).toBeNull();
    expect(state.regionsUnlocked).toEqual([]);
  });

  test('eraVisualTheme → bioluminescent', () => {
    const before = ranOnce();
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.eraVisualTheme).toBe('bioluminescent');
  });

  test('firstCycleSnapshot → null', () => {
    const before = ranOnce();
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.firstCycleSnapshot).toBeNull();
  });

  test('Sprint 6.8 TRANS-5: precommitmentStreak → 0, mood → moodInitialValue, moodHistory → []', () => {
    const before = ranOnce();
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.precommitmentStreak).toBe(0);
    expect(state.mood).toBe(SYNAPSE_CONSTANTS.moodInitialValue);
    expect(state.moodHistory).toEqual([]);
  });

  test('isTutorialCycle → false (TUTOR-2: Run 2+ never sees tutorial)', () => {
    const before = ranOnce();
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.isTutorialCycle).toBe(false);
  });

  test('cycleStartTimestamp + dischargeLastTimestamp → nowTimestamp', () => {
    const before = ranOnce();
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.cycleStartTimestamp).toBe(NOW);
    expect(state.dischargeLastTimestamp).toBe(NOW);
  });
});

describe('handleTranscendence — PRESERVE fields', () => {
  test('sparks + totalGenerated + resonance + resonanceUpgrades preserved', () => {
    const before = ranOnce();
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.sparks).toBe(before.sparks);
    expect(state.resonance).toBe(before.resonance);
    expect(state.resonanceUpgrades).toEqual(before.resonanceUpgrades);
  });

  test('patterns + totalPatterns + patternDecisions preserved', () => {
    const before = ranOnce();
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.patterns).toEqual(before.patterns);
    expect(state.totalPatterns).toBe(before.totalPatterns);
    expect(state.patternDecisions).toEqual(before.patternDecisions);
  });

  test('Sprint 6.8 TRANS-5 PRESERVE: memoryShards + brocaNamedMoments + mastery + autoBuyConfig', () => {
    const before = ranOnce();
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.memoryShards).toEqual(before.memoryShards);
    expect(state.brocaNamedMoments).toEqual(before.brocaNamedMoments);
    expect(state.mastery).toEqual(before.mastery);
    expect(state.autoBuyConfig).toEqual(before.autoBuyConfig);
  });

  test('runUpgradesPurchased preserved (RUN-1)', () => {
    const before = s({ ...ranOnce(), runUpgradesPurchased: ['eco_ancestral', 'sueno_profundo'] });
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.runUpgradesPurchased).toEqual(['eco_ancestral', 'sueno_profundo']);
  });

  test('lifetimePrestiges preserved', () => {
    const before = ranOnce();
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.lifetimePrestiges).toBe(before.lifetimePrestiges);
  });
});

describe('handleTranscendence — narrativeFragmentsSeen prefix-filter (Sprint 8b V10)', () => {
  test('retains crossrun_/greeting_/dream_ prefixes; clears the rest', () => {
    const before = ranOnce();
    const { state, outcome } = handleTranscendence(before, 'equation', NOW);
    expect(state.narrativeFragmentsSeen).toEqual(
      expect.arrayContaining(['crossrun_change_1', 'greeting_calm_1', 'dream_test']),
    );
    expect(state.narrativeFragmentsSeen).not.toContain('ana_01');
    expect(state.narrativeFragmentsSeen).not.toContain('voice_p7_a1');
    expect(outcome.retainedFragmentCount).toBe(3);
  });

  test('all-cleared when no cross-run prefixes present', () => {
    const before = s({ prestigeCount: 26, narrativeFragmentsSeen: ['ana_01', 'emp_03', 'cre_01'] });
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(state.narrativeFragmentsSeen).toEqual([]);
  });
});

describe('handleTranscendence — invariants', () => {
  test('field count remains 121 after Transcendence', () => {
    const before = ranOnce();
    const { state } = handleTranscendence(before, 'equation', NOW);
    expect(Object.keys(state).length).toBe(121);
  });

  test('outcome shape exposes prev + new + ending + threshold + retained count', () => {
    const before = ranOnce();
    const { outcome } = handleTranscendence(before, 'equation', NOW);
    expect(outcome.prevTranscendenceCount).toBe(0);
    expect(outcome.newTranscendenceCount).toBe(1);
    expect(outcome.endingChosen).toBe<EndingID>('equation');
    expect(outcome.archetypeArchived).toBe('analitica');
    expect(outcome.nextThreshold).toBeGreaterThan(0);
  });

  test('Run 3 transcendence applies index [2] = 6.0 mult', () => {
    const before = s({ prestigeCount: 26, transcendenceCount: 1, archetype: 'creativa' });
    const { state } = handleTranscendence(before, 'singularity', NOW);
    expect(state.transcendenceCount).toBe(2);
    expect(state.currentThreshold).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[0] * SYNAPSE_CONSTANTS.runThresholdMult[2]);
  });
});
