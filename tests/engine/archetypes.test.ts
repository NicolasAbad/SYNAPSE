// Sprint 6 Phase 6.2 — Archetype engine tests.
//
// Covers: bonus accessors return identity (1.0 / 0) when archetype === null,
// and correct per-archetype values for each of the 9 bonus slots. Consumers
// (production/insight/prestige/tap/mutations) are integration-tested via the
// existing production/prestige/tap test suites — this file owns the primitive.

import { describe, test, expect } from 'vitest';
import { createDefaultState } from '../../src/store/gameStore';
import {
  activeArchetype,
  isArchetypeUnlocked,
  archetypeActiveProductionMult,
  archetypeFocusFillRateMult,
  archetypeInsightDurationAddSec,
  archetypeMemoryMult,
  archetypeMutationBonusOptions,
  archetypeSpontaneousRateMult,
  archetypeOfflineEfficiencyMult,
  archetypeLucidDreamRate,
  archetypeResonanceGainMult,
} from '../../src/engine/archetypes';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';
import type { Archetype } from '../../src/types';

function freshState(overrides: Partial<GameState> = {}): GameState {
  const raw = createDefaultState() as unknown as Record<string, unknown>;
  for (const k of ['activeTab', 'activeMindSubtab', 'undoToast', 'antiSpamActive']) delete raw[k];
  return { ...(raw as unknown as GameState), ...overrides };
}

function withArchetype(a: Archetype): GameState {
  return freshState({ archetype: a });
}

describe('activeArchetype / isArchetypeUnlocked', () => {
  test('null archetype → activeArchetype returns null', () => {
    expect(activeArchetype(freshState())).toBeNull();
  });

  test('set archetype → activeArchetype returns the def', () => {
    expect(activeArchetype(withArchetype('analitica'))?.id).toBe('analitica');
    expect(activeArchetype(withArchetype('empatica'))?.id).toBe('empatica');
    expect(activeArchetype(withArchetype('creativa'))?.id).toBe('creativa');
  });

  test('isArchetypeUnlocked — pre-P5 false, P5+ true', () => {
    expect(isArchetypeUnlocked(freshState({ prestigeCount: 0 }))).toBe(false);
    expect(isArchetypeUnlocked(freshState({ prestigeCount: 4 }))).toBe(false);
    expect(isArchetypeUnlocked(freshState({ prestigeCount: SYNAPSE_CONSTANTS.archetypeUnlockPrestige }))).toBe(true);
    expect(isArchetypeUnlocked(freshState({ prestigeCount: 10 }))).toBe(true);
  });
});

describe('archetypeActiveProductionMult — GDD §12', () => {
  test('identity when no archetype', () => {
    expect(archetypeActiveProductionMult(freshState())).toBe(1);
  });
  test('Analítica ×1.15', () => {
    expect(archetypeActiveProductionMult(withArchetype('analitica'))).toBe(1.15);
  });
  test('Empática ×0.85', () => {
    expect(archetypeActiveProductionMult(withArchetype('empatica'))).toBe(0.85);
  });
  test('Creativa baseline ×1.0', () => {
    expect(archetypeActiveProductionMult(withArchetype('creativa'))).toBe(1);
  });
});

describe('archetypeFocusFillRateMult — Analítica ×1.25', () => {
  test('identity when no archetype', () => {
    expect(archetypeFocusFillRateMult(freshState())).toBe(1);
  });
  test('Analítica ×1.25', () => {
    expect(archetypeFocusFillRateMult(withArchetype('analitica'))).toBe(1.25);
  });
  test('Empática/Creativa baseline', () => {
    expect(archetypeFocusFillRateMult(withArchetype('empatica'))).toBe(1);
    expect(archetypeFocusFillRateMult(withArchetype('creativa'))).toBe(1);
  });
});

describe('archetypeInsightDurationAddSec — Analítica +2s', () => {
  test('identity when no archetype', () => {
    expect(archetypeInsightDurationAddSec(freshState())).toBe(0);
  });
  test('Analítica +2', () => {
    expect(archetypeInsightDurationAddSec(withArchetype('analitica'))).toBe(2);
  });
  test('Empática/Creativa +0', () => {
    expect(archetypeInsightDurationAddSec(withArchetype('empatica'))).toBe(0);
    expect(archetypeInsightDurationAddSec(withArchetype('creativa'))).toBe(0);
  });
});

describe('archetypeMemoryMult — Empática ×1.25', () => {
  test('identity when no archetype', () => {
    expect(archetypeMemoryMult(freshState())).toBe(1);
  });
  test('Empática ×1.25', () => {
    expect(archetypeMemoryMult(withArchetype('empatica'))).toBe(1.25);
  });
  test('Analítica/Creativa baseline', () => {
    expect(archetypeMemoryMult(withArchetype('analitica'))).toBe(1);
    expect(archetypeMemoryMult(withArchetype('creativa'))).toBe(1);
  });
});

describe('archetypeMutationBonusOptions — Creativa +1', () => {
  test('identity when no archetype', () => {
    expect(archetypeMutationBonusOptions(freshState())).toBe(0);
  });
  test('Creativa +1', () => {
    expect(archetypeMutationBonusOptions(withArchetype('creativa'))).toBe(1);
  });
  test('Analítica/Empática +0', () => {
    expect(archetypeMutationBonusOptions(withArchetype('analitica'))).toBe(0);
    expect(archetypeMutationBonusOptions(withArchetype('empatica'))).toBe(0);
  });
});

describe('archetypeSpontaneousRateMult — Creativa ×1.5 (Phase 6.4 consumer)', () => {
  test('Creativa ×1.5', () => {
    expect(archetypeSpontaneousRateMult(withArchetype('creativa'))).toBe(1.5);
  });
  test('others baseline', () => {
    expect(archetypeSpontaneousRateMult(freshState())).toBe(1);
    expect(archetypeSpontaneousRateMult(withArchetype('analitica'))).toBe(1);
    expect(archetypeSpontaneousRateMult(withArchetype('empatica'))).toBe(1);
  });
});

describe('archetypeOfflineEfficiencyMult — Empática ×2.5 (Sprint 8a consumer)', () => {
  test('Empática ×2.5', () => {
    expect(archetypeOfflineEfficiencyMult(withArchetype('empatica'))).toBe(2.5);
  });
  test('others baseline', () => {
    expect(archetypeOfflineEfficiencyMult(freshState())).toBe(1);
    expect(archetypeOfflineEfficiencyMult(withArchetype('analitica'))).toBe(1);
    expect(archetypeOfflineEfficiencyMult(withArchetype('creativa'))).toBe(1);
  });
});

describe('archetypeLucidDreamRate — Empática 1.0 (override)', () => {
  test('Empática returns 1.0 override', () => {
    expect(archetypeLucidDreamRate(withArchetype('empatica'))).toBe(1);
  });
  test('others return null (use default 0.33)', () => {
    expect(archetypeLucidDreamRate(freshState())).toBeNull();
    expect(archetypeLucidDreamRate(withArchetype('analitica'))).toBeNull();
    expect(archetypeLucidDreamRate(withArchetype('creativa'))).toBeNull();
  });
});

describe('archetypeResonanceGainMult — Creativa ×1.5 (Sprint 8b consumer)', () => {
  test('Creativa ×1.5', () => {
    expect(archetypeResonanceGainMult(withArchetype('creativa'))).toBe(1.5);
  });
  test('others baseline', () => {
    expect(archetypeResonanceGainMult(freshState())).toBe(1);
    expect(archetypeResonanceGainMult(withArchetype('analitica'))).toBe(1);
    expect(archetypeResonanceGainMult(withArchetype('empatica'))).toBe(1);
  });
});
