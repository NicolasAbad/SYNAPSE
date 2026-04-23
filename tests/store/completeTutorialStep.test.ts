// Sprint 7.6 Phase 7.6.3 — completeTutorialStep action tests (GDD §37
// TUTOR-5 Sparks reward + idempotency via narrativeFragmentsSeen prefix).

import { beforeEach, describe, expect, test } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

beforeEach(() => {
  useGameStore.getState().reset();
});

describe('completeTutorialStep — validation + idempotency', () => {
  test('rejects unknown step IDs', () => {
    const result = useGameStore.getState().completeTutorialStep('tutorial_step_c99');
    expect(result).toBe('invalid_step');
    expect(useGameStore.getState().sparks).toBe(0);
    expect(useGameStore.getState().narrativeFragmentsSeen).not.toContain('tutorial_step_c99');
  });

  test('rejects arbitrary non-tutorial fragment IDs', () => {
    const result = useGameStore.getState().completeTutorialStep('ana_01');
    expect(result).toBe('invalid_step');
    expect(useGameStore.getState().sparks).toBe(0);
  });

  test('first call on a valid step returns ok + grants +2 Sparks', () => {
    const before = useGameStore.getState().sparks;
    const result = useGameStore.getState().completeTutorialStep('tutorial_step_c1');
    expect(result).toBe('ok');
    expect(useGameStore.getState().sparks).toBe(before + SYNAPSE_CONSTANTS.tutorialSparksRewardPerStep);
    expect(useGameStore.getState().narrativeFragmentsSeen).toContain('tutorial_step_c1');
  });

  test('second call on same step returns already_completed (no double Sparks)', () => {
    useGameStore.getState().completeTutorialStep('tutorial_step_c1');
    const afterFirst = useGameStore.getState().sparks;
    const result = useGameStore.getState().completeTutorialStep('tutorial_step_c1');
    expect(result).toBe('already_completed');
    expect(useGameStore.getState().sparks).toBe(afterFirst);
  });

  test('each of the 5 canonical step IDs grants +2 Sparks exactly once', () => {
    let expected = 0;
    for (const stepId of SYNAPSE_CONSTANTS.tutorialStepIds) {
      const before = useGameStore.getState().sparks;
      expect(useGameStore.getState().completeTutorialStep(stepId)).toBe('ok');
      expected += SYNAPSE_CONSTANTS.tutorialSparksRewardPerStep;
      expect(useGameStore.getState().sparks).toBe(before + SYNAPSE_CONSTANTS.tutorialSparksRewardPerStep);
    }
    expect(useGameStore.getState().sparks).toBe(expected);
    expect(useGameStore.getState().sparks).toBe(SYNAPSE_CONSTANTS.tutorialTrackCycleCount * SYNAPSE_CONSTANTS.tutorialSparksRewardPerStep);
  });
});

describe('completeTutorialStep — Zustand pitfall compliance', () => {
  test('action references preserved (merge-mode setState)', () => {
    const before = useGameStore.getState().completeTutorialStep;
    useGameStore.getState().completeTutorialStep('tutorial_step_c1');
    expect(useGameStore.getState().completeTutorialStep).toBe(before);
    // prestige action remains bound too — spot check for the big one.
    expect(typeof useGameStore.getState().prestige).toBe('function');
  });
});
