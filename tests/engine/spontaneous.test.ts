// Sprint 6 Phase 6.4 — Spontaneous event engine tests (GDD §8 + SPONT-1).
//
// Covers:
//   - 12 events catalogued with correct type distribution
//   - Deterministic seed (CODE-9) — same (cycleStart, lastCheck) → same seed
//   - 1-per-cycle limits for Memoria Fugaz + Interferencia
//   - Activation state updates for each effect kind (sample coverage)
//   - Expiry clearing when now >= endTime

import { describe, expect, test } from 'vitest';
import { createDefaultState } from '../../src/store/gameStore';
import {
  spontaneousSeed,
  rollSpontaneous,
  activateSpontaneous,
  clearIfExpired,
  spontaneousProdMult,
  spontaneousFocusFillMult,
  spontaneousConnectionMult,
  spontaneousPolarityReversed,
  isEurekaActive,
} from '../../src/engine/spontaneous';
import { SPONTANEOUS_EVENTS, SPONTANEOUS_BY_ID } from '../../src/config/spontaneous';
import type { GameState } from '../../src/types/GameState';

function freshState(overrides: Partial<GameState> = {}): GameState {
  const raw = createDefaultState() as unknown as Record<string, unknown>;
  for (const k of ['activeTab', 'activeMindSubtab', 'undoToast', 'antiSpamActive']) delete raw[k];
  return { ...(raw as unknown as GameState), ...overrides };
}

describe('12 Spontaneous events catalogued (GDD §8)', () => {
  test('exactly 12 entries', () => {
    expect(SPONTANEOUS_EVENTS).toHaveLength(12);
  });

  test('type distribution: 6 positive, 4 neutral, 2 negative', () => {
    expect(SPONTANEOUS_EVENTS.filter((e) => e.type === 'positive')).toHaveLength(6);
    expect(SPONTANEOUS_EVENTS.filter((e) => e.type === 'neutral')).toHaveLength(4);
    expect(SPONTANEOUS_EVENTS.filter((e) => e.type === 'negative')).toHaveLength(2);
  });

  test('every id resolves via SPONTANEOUS_BY_ID', () => {
    for (const e of SPONTANEOUS_EVENTS) {
      expect(SPONTANEOUS_BY_ID[e.id]).toBe(e);
    }
  });
});

describe('spontaneousSeed — deterministic (CODE-9)', () => {
  test('same (cycleStart, lastCheck) → same seed', () => {
    expect(spontaneousSeed(1_000, 5_000)).toBe(spontaneousSeed(1_000, 5_000));
  });
  test('different lastCheck → different seed', () => {
    expect(spontaneousSeed(1_000, 5_000)).not.toBe(spontaneousSeed(1_000, 5_001));
  });
});

describe('rollSpontaneous — 1-per-cycle limits', () => {
  test('memoria_fugaz excluded once spontaneousMemoryUsed=true', () => {
    // Try many seeds; memoria_fugaz should never be returned when limit hit.
    for (let t = 10_000; t < 10_500; t += 1) {
      const s = freshState({
        cycleStartTimestamp: 1_000_000,
        lastSpontaneousCheck: 0,
        spontaneousMemoryUsed: true,
        spontaneousInterferenceUsed: false,
      });
      const def = rollSpontaneous(s, t);
      if (def) expect(def.id).not.toBe('memoria_fugaz');
    }
  });

  test('interferencia excluded once spontaneousInterferenceUsed=true', () => {
    for (let t = 20_000; t < 20_500; t += 1) {
      const s = freshState({
        cycleStartTimestamp: 1_000_000,
        lastSpontaneousCheck: 0,
        spontaneousMemoryUsed: false,
        spontaneousInterferenceUsed: true,
      });
      const def = rollSpontaneous(s, t);
      if (def) expect(def.id).not.toBe('interferencia');
    }
  });

  test('40% base chance blocks triggers on failed roll', () => {
    // spontaneousRateMult=0 → triggerChance=0 → never fires.
    const s = freshState({ cycleStartTimestamp: 1_000, lastSpontaneousCheck: 0 });
    for (let t = 1; t <= 20; t++) {
      expect(rollSpontaneous(s, t, 0)).toBeNull();
    }
  });
});

describe('activateSpontaneous — per-effect updates', () => {
  test('memory_add grants +1 Memory and sets spontaneousMemoryUsed', () => {
    const s = freshState({ memories: 10 });
    const def = SPONTANEOUS_BY_ID['memoria_fugaz'];
    const u = activateSpontaneous(s, def, 1_000);
    expect(u.memories).toBe(11);
    expect(u.spontaneousMemoryUsed).toBe(true);
  });

  test('focus_reset zeros focus and sets spontaneousInterferenceUsed', () => {
    const s = freshState({ focusBar: 1.5 });
    const def = SPONTANEOUS_BY_ID['interferencia'];
    const u = activateSpontaneous(s, def, 2_000);
    expect(u.focusBar).toBe(0);
    expect(u.spontaneousInterferenceUsed).toBe(true);
  });

  test('discharge_charge_add adds +1 charge clamped to max', () => {
    const s = freshState({ dischargeCharges: 0, dischargeMaxCharges: 2 });
    const u = activateSpontaneous(s, SPONTANEOUS_BY_ID['disparo_latente'], 3_000);
    expect(u.dischargeCharges).toBe(1);
  });

  test('discharge_charge_add clamps at maxCharges', () => {
    const s = freshState({ dischargeCharges: 2, dischargeMaxCharges: 2 });
    const u = activateSpontaneous(s, SPONTANEOUS_BY_ID['disparo_latente'], 3_000);
    expect(u.dischargeCharges).toBe(2);
  });

  test('production_mult sets activeSpontaneousEvent with endTime', () => {
    const s = freshState();
    const u = activateSpontaneous(s, SPONTANEOUS_BY_ID['rafaga_dopaminica'], 5_000);
    expect(u.activeSpontaneousEvent?.id).toBe('rafaga_dopaminica');
    expect(u.activeSpontaneousEvent?.endTime).toBe(35_000); // 5_000 + 30_000ms
  });

  test('free_next_upgrade sets eurekaExpiry to MAX_SAFE_INTEGER (persists until used)', () => {
    const s = freshState();
    const u = activateSpontaneous(s, SPONTANEOUS_BY_ID['eureka'], 7_000);
    expect(u.eurekaExpiry).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe('clearIfExpired', () => {
  test('clears when now >= endTime', () => {
    const s = freshState({
      activeSpontaneousEvent: { id: 'rafaga_dopaminica', type: 'positive', endTime: 1_000 },
    });
    expect(clearIfExpired(s, 2_000)).toEqual({ activeSpontaneousEvent: null });
  });

  test('no-op when still active', () => {
    const s = freshState({
      activeSpontaneousEvent: { id: 'rafaga_dopaminica', type: 'positive', endTime: 10_000 },
    });
    expect(clearIfExpired(s, 2_000)).toEqual({});
  });
});

describe('per-effect helper accessors', () => {
  test('spontaneousProdMult — Ráfaga Dopamínica ×2', () => {
    const s = freshState({
      activeSpontaneousEvent: { id: 'rafaga_dopaminica', type: 'positive', endTime: Number.MAX_SAFE_INTEGER },
    });
    expect(spontaneousProdMult(s)).toBe(2);
  });

  test('spontaneousProdMult — Fatiga Sináptica ×0.7', () => {
    const s = freshState({
      activeSpontaneousEvent: { id: 'fatiga_sinaptica', type: 'negative', endTime: Number.MAX_SAFE_INTEGER },
    });
    expect(spontaneousProdMult(s)).toBe(0.7);
  });

  test('spontaneousProdMult — Pausa Neural prod=0', () => {
    const s = freshState({
      activeSpontaneousEvent: { id: 'pausa_neural', type: 'neutral', endTime: Number.MAX_SAFE_INTEGER },
    });
    expect(spontaneousProdMult(s)).toBe(0);
  });

  test('spontaneousFocusFillMult — Claridad ×3 / Pausa ×5', () => {
    const claridad = freshState({
      activeSpontaneousEvent: { id: 'claridad_momentanea', type: 'positive', endTime: Number.MAX_SAFE_INTEGER },
    });
    expect(spontaneousFocusFillMult(claridad)).toBe(3);
    const pausa = freshState({
      activeSpontaneousEvent: { id: 'pausa_neural', type: 'neutral', endTime: Number.MAX_SAFE_INTEGER },
    });
    expect(spontaneousFocusFillMult(pausa)).toBe(5);
  });

  test('spontaneousConnectionMult — Conexión Profunda ×2', () => {
    const s = freshState({
      activeSpontaneousEvent: { id: 'conexion_profunda', type: 'positive', endTime: Number.MAX_SAFE_INTEGER },
    });
    expect(spontaneousConnectionMult(s)).toBe(2);
  });

  test('spontaneousPolarityReversed — true when Polaridad Fluctuante active', () => {
    const s = freshState({
      activeSpontaneousEvent: { id: 'polaridad_fluctuante', type: 'neutral', endTime: Number.MAX_SAFE_INTEGER },
    });
    expect(spontaneousPolarityReversed(s)).toBe(true);
  });

  test('identity when no active event', () => {
    const s = freshState();
    expect(spontaneousProdMult(s)).toBe(1);
    expect(spontaneousFocusFillMult(s)).toBe(1);
    expect(spontaneousConnectionMult(s)).toBe(1);
    expect(spontaneousPolarityReversed(s)).toBe(false);
  });

  test('isEurekaActive — true when eurekaExpiry set, false when null', () => {
    expect(isEurekaActive(freshState({ eurekaExpiry: 123 }))).toBe(true);
    expect(isEurekaActive(freshState({ eurekaExpiry: null }))).toBe(false);
  });
});
