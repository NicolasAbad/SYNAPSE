// Sprint 6 Phase 6.3a — Narrative engine tests.
//
// Covers:
//   - 57 fragments + 30 Echoes present (GDD NARRATIVE.md counts)
//   - checkFragmentTriggers returns correct IDs for each trigger kind
//   - NARR-4 one-shot: already-seen filter
//   - NARR-8 Memory grant on first read + era3_ exclusion
//   - pickEcho deterministic + prestigeCount filter

import { describe, expect, test } from 'vitest';
import { createDefaultState } from '../../src/store/gameStore';
import {
  checkFragmentTriggers,
  applyFragmentRead,
  getFragment,
  pickEcho,
} from '../../src/engine/narrative';
import { FRAGMENTS } from '../../src/config/narrative/fragments';
import { ECHOES } from '../../src/config/narrative/echoes';
import type { GameState } from '../../src/types/GameState';

function freshState(overrides: Partial<GameState> = {}): GameState {
  const raw = createDefaultState() as unknown as Record<string, unknown>;
  for (const k of ['activeTab', 'activeMindSubtab', 'undoToast', 'antiSpamActive']) delete raw[k];
  return { ...(raw as unknown as GameState), ...overrides };
}

describe('Canonical counts (NARRATIVE.md)', () => {
  test('57 fragments total (12 base + 15 × 3 archetypes)', () => {
    expect(FRAGMENTS).toHaveLength(57);
  });

  test('30 Echoes total', () => {
    expect(ECHOES).toHaveLength(30);
  });

  test('Echo category distribution: 8 gameplay + 5 rp_hint + 9 philosophical + 8 late_game', () => {
    expect(ECHOES.filter((e) => e.category === 'gameplay')).toHaveLength(8);
    expect(ECHOES.filter((e) => e.category === 'rp_hint')).toHaveLength(5);
    expect(ECHOES.filter((e) => e.category === 'philosophical')).toHaveLength(9);
    expect(ECHOES.filter((e) => e.category === 'late_game')).toHaveLength(8);
  });

  test('Fragment IDs are unique', () => {
    const ids = FRAGMENTS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('Every base fragment (12) present; 15 per archetype present', () => {
    const base = FRAGMENTS.filter((f) => f.id.startsWith('base_'));
    const ana = FRAGMENTS.filter((f) => f.id.startsWith('ana_'));
    const emp = FRAGMENTS.filter((f) => f.id.startsWith('emp_'));
    const cre = FRAGMENTS.filter((f) => f.id.startsWith('cre_'));
    expect(base).toHaveLength(12);
    expect(ana).toHaveLength(15);
    expect(emp).toHaveLength(15);
    expect(cre).toHaveLength(15);
  });
});

describe('checkFragmentTriggers — per-trigger-kind', () => {
  test('first_neuron fires BASE-01 when cycleNeuronsBought === 1 (first *buy*)', () => {
    const s = freshState({ cycleNeuronsBought: 1 });
    const fired = checkFragmentTriggers(s, { kind: 'neuron_bought' });
    expect(fired).toContain('base_01');
  });

  test('first_neuron does NOT fire on second buy (cycleNeuronsBought > 1)', () => {
    const s = freshState({ cycleNeuronsBought: 2 });
    const fired = checkFragmentTriggers(s, { kind: 'neuron_bought' });
    expect(fired).not.toContain('base_01');
  });

  test('neurons_owned fires BASE-02 at total 5', () => {
    const s = freshState({ neurons: [{ type: 'basica', count: 5 }, { type: 'sensorial', count: 0 }, { type: 'piramidal', count: 0 }, { type: 'espejo', count: 0 }, { type: 'integradora', count: 0 }] });
    const fired = checkFragmentTriggers(s, { kind: 'neuron_bought' });
    expect(fired).toContain('base_02');
  });

  test('neurons_owned does NOT fire at total 4', () => {
    const s = freshState({ neurons: [{ type: 'basica', count: 4 }, { type: 'sensorial', count: 0 }, { type: 'piramidal', count: 0 }, { type: 'espejo', count: 0 }, { type: 'integradora', count: 0 }] });
    const fired = checkFragmentTriggers(s, { kind: 'neuron_bought' });
    expect(fired).not.toContain('base_02');
  });

  test('first_discharge fires BASE-03 on lifetimeDischarges === 1', () => {
    const s = freshState({ lifetimeDischarges: 1 });
    const fired = checkFragmentTriggers(s, { kind: 'discharge_fired' });
    expect(fired).toContain('base_03');
  });

  test('first_discharge does NOT re-fire on discharge 2+', () => {
    const s = freshState({ lifetimeDischarges: 2 });
    const fired = checkFragmentTriggers(s, { kind: 'discharge_fired' });
    expect(fired).not.toContain('base_03');
  });

  test('region_unlock fires BASE-04 on hipocampo', () => {
    const s = freshState();
    const fired = checkFragmentTriggers(s, { kind: 'region_unlocked', regionId: 'hipocampo' });
    expect(fired).toContain('base_04');
  });

  test('region_unlock does NOT fire BASE-04 on other regions', () => {
    const s = freshState();
    const fired = checkFragmentTriggers(s, { kind: 'region_unlocked', regionId: 'prefrontal' });
    expect(fired).not.toContain('base_04');
  });

  test('prestige_at — BASE-05 at prestigeCount 1, BASE-06 at 3, BASE-12 at 25', () => {
    expect(checkFragmentTriggers(freshState({ prestigeCount: 1 }), { kind: 'prestige_done' })).toContain('base_05');
    expect(checkFragmentTriggers(freshState({ prestigeCount: 3 }), { kind: 'prestige_done' })).toContain('base_06');
    expect(checkFragmentTriggers(freshState({ prestigeCount: 25 }), { kind: 'prestige_done' })).toContain('base_12');
  });

  test('prestige_at does NOT fire BASE-05 at other prestiges', () => {
    const fired = checkFragmentTriggers(freshState({ prestigeCount: 2 }), { kind: 'prestige_done' });
    expect(fired).not.toContain('base_05');
  });

  test('archetype_prestige — ANA-01 fires at archetype=analitica + P5 via archetype_chosen', () => {
    const s = freshState({ archetype: 'analitica', prestigeCount: 5 });
    const fired = checkFragmentTriggers(s, { kind: 'archetype_chosen' });
    expect(fired).toContain('ana_01');
  });

  test('archetype_prestige — EMP-06 fires at archetype=empatica + P10 via prestige_done', () => {
    const s = freshState({ archetype: 'empatica', prestigeCount: 10 });
    const fired = checkFragmentTriggers(s, { kind: 'prestige_done' });
    expect(fired).toContain('emp_06');
    expect(fired).not.toContain('ana_06');
    expect(fired).not.toContain('cre_06');
  });

  test('archetype_prestige does NOT fire when archetype mismatches', () => {
    const s = freshState({ archetype: 'analitica', prestigeCount: 5 });
    const fired = checkFragmentTriggers(s, { kind: 'archetype_chosen' });
    expect(fired).not.toContain('emp_01');
    expect(fired).not.toContain('cre_01');
  });
});

describe('NARR-4 one-shot filter', () => {
  test('already-seen fragment is excluded from checkFragmentTriggers', () => {
    const s = freshState({
      prestigeCount: 1,
      narrativeFragmentsSeen: ['base_05'],
    });
    const fired = checkFragmentTriggers(s, { kind: 'prestige_done' });
    expect(fired).not.toContain('base_05');
  });
});

describe('NARR-8 applyFragmentRead', () => {
  test('first read: appends to narrativeFragmentsSeen + grants +1 Memory', () => {
    const s = freshState({ memories: 10 });
    const updates = applyFragmentRead(s, 'base_01');
    expect(updates.narrativeFragmentsSeen).toEqual(['base_01']);
    expect(updates.memories).toBe(11);
  });

  test('re-read: no-op (already seen)', () => {
    const s = freshState({ memories: 10, narrativeFragmentsSeen: ['base_01'] });
    const updates = applyFragmentRead(s, 'base_01');
    expect(updates).toEqual({});
  });

  test('era3_ prefix: appends but does NOT grant Memory', () => {
    const s = freshState({ memories: 10 });
    const updates = applyFragmentRead(s, 'era3_p19');
    expect(updates.narrativeFragmentsSeen).toEqual(['era3_p19']);
    expect(updates.memories).toBeUndefined();
  });
});

describe('getFragment', () => {
  test('resolves by id', () => {
    const f = getFragment('base_01');
    expect(f).not.toBeNull();
    expect(f?.id).toBe('base_01');
    expect(f?.text.length).toBeGreaterThan(10);
  });

  test('returns null for unknown id', () => {
    expect(getFragment('nonexistent_id')).toBeNull();
  });
});

describe('pickEcho — NARR-3 prestigeCount filter + determinism', () => {
  test('null pre-P1 (no echoes eligible at P0)', () => {
    expect(pickEcho(0, 1_000_000)).toBeNull();
  });

  test('P1+ picks from gameplay pool (8 entries) only', () => {
    const e = pickEcho(1, 1_000_000);
    expect(e?.category).toBe('gameplay');
  });

  test('P15+ may pick from all 30 echoes', () => {
    // Deterministic pick; just assert it's non-null and id is in the full pool.
    const e = pickEcho(20, 42);
    expect(e).not.toBeNull();
    expect(ECHOES.find((x) => x.id === e!.id)).toBeDefined();
  });

  test('same (prestige, seed) → same pick (determinism)', () => {
    const a = pickEcho(10, 12345);
    const b = pickEcho(10, 12345);
    expect(a?.id).toBe(b?.id);
  });

  test('different seeds → likely different picks', () => {
    // Not a strict "always different" guarantee, but across a spread of seeds
    // at P15 (30-echo pool) we expect at least 2 distinct results.
    const picks = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => pickEcho(15, s)?.id));
    expect(picks.size).toBeGreaterThanOrEqual(2);
  });
});
