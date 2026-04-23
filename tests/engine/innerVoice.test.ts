// Tests for src/engine/innerVoice.ts — Sprint 7.5 Phase 7.5.6 §16.5 Broca Inner Voice.
//
// Coverage: NamedMoment trigger eligibility / persistence idempotency / VOICE-2
// archetype-keyed default phrases (4-key matrix incl. neutral fallback) /
// VOICE-2a (fire regardless of Broca region UI unlock).

import { describe, expect, test } from 'vitest';
import {
  NAMED_MOMENTS,
  hasMomentBeenLogged,
  eligibleMomentForTrigger,
  defaultPhraseFor,
  logNamedMoment,
} from '../../src/engine/innerVoice';
import { createDefaultState } from '../../src/store/gameStore';
import type { GameState } from '../../src/types/GameState';

describe('innerVoice — data integrity', () => {
  test('exactly 5 Named Moments per GDD §16.5', () => {
    expect(NAMED_MOMENTS.length).toBe(5);
  });
  test('default phrase exists for every (moment × archetype + none) combo', () => {
    for (const id of NAMED_MOMENTS) {
      expect(defaultPhraseFor(id, null)).toBeTruthy();
      expect(defaultPhraseFor(id, 'analitica')).toBeTruthy();
      expect(defaultPhraseFor(id, 'empatica')).toBeTruthy();
      expect(defaultPhraseFor(id, 'creativa')).toBeTruthy();
    }
  });
});

describe('innerVoice — eligibleMomentForTrigger', () => {
  test('first_awakening fires only when newPrestigeCount === 1', () => {
    const s = createDefaultState();
    expect(eligibleMomentForTrigger(s, { kind: 'prestige_done', newPrestigeCount: 1, firstRpDiscovered: false })).toBe('first_awakening');
    expect(eligibleMomentForTrigger(s, { kind: 'prestige_done', newPrestigeCount: 2, firstRpDiscovered: false })).toBeNull();
  });
  test('resonance_found fires on first RP discovery', () => {
    const s = createDefaultState();
    expect(eligibleMomentForTrigger(s, { kind: 'prestige_done', newPrestigeCount: 5, firstRpDiscovered: true })).toBe('resonance_found');
  });
  test('first_awakening + resonance_found at the same prestige — first_awakening wins (single eligible per call)', () => {
    const s = createDefaultState();
    // First prestige + first RP — first_awakening returned first per resolver order.
    expect(eligibleMomentForTrigger(s, { kind: 'prestige_done', newPrestigeCount: 1, firstRpDiscovered: true })).toBe('first_awakening');
  });
  test('archetype_voice fires on archetype_chosen trigger', () => {
    expect(eligibleMomentForTrigger(createDefaultState(), { kind: 'archetype_chosen', archetype: 'analitica' })).toBe('archetype_voice');
  });
  test('era3_entry fires on era3_entered trigger', () => {
    expect(eligibleMomentForTrigger(createDefaultState(), { kind: 'era3_entered' })).toBe('era3_entry');
  });
  test('last_choice fires on ending_chosen trigger', () => {
    expect(eligibleMomentForTrigger(createDefaultState(), { kind: 'ending_chosen' })).toBe('last_choice');
  });
  test('already-logged moments return null (idempotent)', () => {
    const s: GameState = { ...createDefaultState(), brocaNamedMoments: [{ momentId: 'first_awakening', phrase: 'I begin.' }] };
    expect(eligibleMomentForTrigger(s, { kind: 'prestige_done', newPrestigeCount: 1, firstRpDiscovered: false })).toBeNull();
  });
});

describe('innerVoice — VOICE-2 default phrase by archetype', () => {
  test('first_awakening returns archetype-specific phrase (analitica/empatica/creativa) or neutral fallback', () => {
    expect(defaultPhraseFor('first_awakening', 'analitica')).toBe('I begin to think.');
    expect(defaultPhraseFor('first_awakening', 'empatica')).toBe('I begin to feel.');
    expect(defaultPhraseFor('first_awakening', 'creativa')).toBe('I begin to imagine.');
    expect(defaultPhraseFor('first_awakening', null)).toBe('I begin.');
  });
});

describe('innerVoice — logNamedMoment + hasMomentBeenLogged', () => {
  test('logging adds the entry; hasMomentBeenLogged returns true', () => {
    const s = createDefaultState();
    const next = logNamedMoment(s, 'first_awakening', 'I am alive.');
    expect(next).toEqual([{ momentId: 'first_awakening', phrase: 'I am alive.' }]);
    expect(hasMomentBeenLogged({ ...s, brocaNamedMoments: next }, 'first_awakening')).toBe(true);
  });
  test('logging is idempotent — re-call returns the same array reference', () => {
    const s: GameState = { ...createDefaultState(), brocaNamedMoments: [{ momentId: 'first_awakening', phrase: 'I am alive.' }] };
    const next = logNamedMoment(s, 'first_awakening', 'overwrite attempt');
    expect(next).toBe(s.brocaNamedMoments); // same reference, no mutation
    expect(next[0].phrase).toBe('I am alive.'); // original phrase preserved
  });
});
