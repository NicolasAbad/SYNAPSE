// Sprint 7 Phase 7.2 — Achievement store integration tests.
// Verifies processAchievementUnlocks fires from store actions and applies
// side effects (sparks, achievementsUnlocked, diary entries, toast) per ACH-3.

import { beforeEach, describe, expect, test } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';

beforeEach(() => {
  useGameStore.getState().reset();
});

describe('Achievement integration — prestige action', () => {
  test('first prestige unlocks meta_first_awakening + grants 5 Sparks', () => {
    useGameStore.setState({
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
      sparks: 0,
    });
    const before = useGameStore.getState();
    expect(before.achievementsUnlocked).toEqual([]);
    expect(before.sparks).toBe(0);

    const r = useGameStore.getState().prestige(60_000);
    expect(r.fired).toBe(true);

    const after = useGameStore.getState();
    expect(after.achievementsUnlocked).toContain('meta_first_awakening');
    expect(after.sparks).toBeGreaterThanOrEqual(5);
    // Diary entry written for prestige + achievement (per ACH-3)
    expect(after.diaryEntries.some((e) => e.type === 'achievement')).toBe(true);
    // Toast surface set
    expect(after.achievementToast).not.toBeNull();
  });

  test('cyc_under_10 unlocks when cycle duration <= 10 min', () => {
    useGameStore.setState({
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
      cycleStartTimestamp: 0,
    });
    // Prestige at 9 min elapsed = under 10 — should unlock cyc_under_10.
    useGameStore.getState().prestige(9 * 60 * 1000);
    const after = useGameStore.getState();
    expect(after.achievementsUnlocked).toContain('cyc_under_10');
  });

  test('prestige writes diary entry with dischargesUsed for hid_no_discharge_full_cycle tracking', () => {
    useGameStore.setState({
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
      cycleStartTimestamp: 0,
      cycleDischargesUsed: 0,
    });
    useGameStore.getState().prestige(60_000);
    const after = useGameStore.getState();
    const prestigeDiary = after.diaryEntries.find((e) => e.type === 'prestige');
    expect(prestigeDiary).toBeDefined();
    expect(prestigeDiary!.data['dischargesUsed']).toBe(0);
  });
});

describe('Achievement integration — setPolarity / setMutation / setPathway', () => {
  test('setPolarity at P3+ unlocks meta_polarity_picked', () => {
    useGameStore.setState({ prestigeCount: 3 });
    useGameStore.getState().setPolarity('excitatory');
    expect(useGameStore.getState().achievementsUnlocked).toContain('meta_polarity_picked');
  });

  test('setMutation at P7+ unlocks meta_mutation_picked AND tracks uniqueMutationsUsed', () => {
    useGameStore.setState({ prestigeCount: 7 });
    useGameStore.getState().setMutation('eficiencia_neural');
    const after = useGameStore.getState();
    expect(after.achievementsUnlocked).toContain('meta_mutation_picked');
    expect(after.uniqueMutationsUsed).toContain('eficiencia_neural');
  });

  test('setPathway at P10+ unlocks meta_pathway_picked AND tracks uniquePathwaysUsed', () => {
    useGameStore.setState({ prestigeCount: 10 });
    useGameStore.getState().setPathway('rapida');
    const after = useGameStore.getState();
    expect(after.achievementsUnlocked).toContain('meta_pathway_picked');
    expect(after.uniquePathwaysUsed).toContain('rapida');
  });

  test('setMutation deduplicates uniqueMutationsUsed', () => {
    useGameStore.setState({ prestigeCount: 7, uniqueMutationsUsed: ['eficiencia_neural'] });
    useGameStore.getState().setMutation('eficiencia_neural');
    expect(useGameStore.getState().uniqueMutationsUsed).toEqual(['eficiencia_neural']);
  });
});

describe('Achievement integration — setArchetype', () => {
  test('setArchetype at P5+ unlocks meta_archetype_chosen', () => {
    useGameStore.setState({ prestigeCount: 5, archetype: null, archetypeHistory: [] });
    useGameStore.getState().setArchetype('analitica');
    expect(useGameStore.getState().achievementsUnlocked).toContain('meta_archetype_chosen');
  });
});

describe('Achievement integration — chooseEnding', () => {
  test('chooseEnding writes ending diary + unlocks nar_first_ending', () => {
    useGameStore.getState().chooseEnding('equation', 'a');
    const after = useGameStore.getState();
    expect(after.endingsSeen).toContain('equation');
    expect(after.diaryEntries.some((e) => e.type === 'ending')).toBe(true);
    expect(after.achievementsUnlocked).toContain('nar_first_ending');
  });

  test('all 4 endings unlock mas_all_endings', () => {
    useGameStore.getState().chooseEnding('equation', 'a');
    useGameStore.getState().chooseEnding('chorus', 'a');
    useGameStore.getState().chooseEnding('seed', 'a');
    useGameStore.getState().chooseEnding('singularity', 'a');
    expect(useGameStore.getState().achievementsUnlocked).toContain('mas_all_endings');
  });
});

describe('Achievement idempotency + sparks accumulation', () => {
  test('once unlocked, achievement is NOT re-unlocked or re-rewarded', () => {
    useGameStore.setState({
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
      lifetimePrestiges: 1,
      achievementsUnlocked: ['meta_first_awakening'],
      sparks: 0,
    });
    const before = useGameStore.getState().sparks;
    useGameStore.getState().prestige(60_000);
    const after = useGameStore.getState();
    // sparks may grow from OTHER unlocks (cyc_under_10 if duration<=10min) but
    // meta_first_awakening should NOT contribute again.
    expect(after.achievementsUnlocked.filter((id) => id === 'meta_first_awakening').length).toBe(1);
    expect(after.sparks - before).not.toBe(5); // not specifically the 5-Spark meta_first_awakening reward
  });

  test('multiple new unlocks in one action sum sparks correctly', () => {
    useGameStore.setState({
      lifetimeDischarges: 0,
      cycleCascades: 0,
      sparks: 0,
    });
    // Manually trigger an action that touches state — we need a state change
    // that flips multiple triggers true. Use buyNeuron with a setup that primes
    // both lifetimeDischarges and cycleCascades.
    useGameStore.setState({
      lifetimeDischarges: 1,
      cycleCascades: 1,
      lifetimeInsights: 1,
    });
    // Trigger via prestige (action that runs achievement check)
    useGameStore.setState({ cycleGenerated: 25_000, currentThreshold: 25_000 });
    useGameStore.getState().prestige(60_000);
    const after = useGameStore.getState();
    expect(after.achievementsUnlocked).toContain('cyc_first_spark');
    expect(after.achievementsUnlocked).toContain('cyc_first_cascade');
    expect(after.achievementsUnlocked).toContain('cyc_full_focus');
    // Sparks should include 3 (cyc_first_spark) + 5 (cyc_first_cascade) + 3 (cyc_full_focus) = 11+
    expect(after.sparks).toBeGreaterThanOrEqual(11);
  });
});

describe('Achievement toast lifecycle (ACH-3)', () => {
  test('toast set on unlock with achievementId + expiresAt', () => {
    useGameStore.setState({ cycleGenerated: 25_000, currentThreshold: 25_000 });
    useGameStore.getState().prestige(50_000);
    const toast = useGameStore.getState().achievementToast;
    expect(toast).not.toBeNull();
    expect(typeof toast!.achievementId).toBe('string');
    expect(toast!.expiresAt).toBeGreaterThan(50_000);
  });

  test('dismissAchievementToast clears the toast', () => {
    useGameStore.setState({
      achievementToast: { achievementId: 'cyc_first_spark', expiresAt: 999_999 },
    });
    useGameStore.getState().dismissAchievementToast();
    expect(useGameStore.getState().achievementToast).toBeNull();
  });
});

describe('Diary cap (Sprint 7.5 spec — 500 entries circular)', () => {
  test('diary entries beyond 500 drop from head', () => {
    // Pre-fill with 500 entries
    const filler = Array.from({ length: 500 }, (_, i) => ({
      timestamp: i,
      type: 'fragment' as const,
      data: { fragmentId: `fill_${i}` },
    }));
    useGameStore.setState({
      diaryEntries: filler,
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
    });
    // Trigger prestige (adds prestige diary + possibly achievement diary entries)
    useGameStore.getState().prestige(99_999);
    const after = useGameStore.getState();
    // Should be capped at 500 with oldest dropped
    expect(after.diaryEntries.length).toBeLessThanOrEqual(500);
    // Latest entries should be present
    const last = after.diaryEntries[after.diaryEntries.length - 1];
    expect(last.type === 'achievement' || last.type === 'prestige').toBe(true);
  });
});

describe('Reset clears achievementToast', () => {
  test('reset() returns achievementToast to null', () => {
    useGameStore.setState({
      achievementToast: { achievementId: 'x', expiresAt: 1 },
    });
    useGameStore.getState().reset();
    expect(useGameStore.getState().achievementToast).toBeNull();
  });
});
