// Tests for the GDD §4 production formula stack (Sprint 3 Phase 2).
// Covers: computeConnectionMult, per-type + all-neurons mult layering,
// global upgrade mults (incl. Emergencia Cognitiva Interpretation B),
// softCap application site, end-to-end calculateProduction invariants.

import { describe, expect, test } from 'vitest';
import { calculateProduction, computeConnectionMult } from '../../src/engine/production';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';
import type { UpgradeState } from '../../src/types';

// Helper: build a state with a list of upgrade IDs marked purchased.
function withUpgrades(state: GameState, ids: string[]): GameState {
  const upgrades: UpgradeState[] = ids.map((id) => ({ id, purchased: true, purchasedAt: 0 }));
  return { ...state, upgrades };
}

describe('computeConnectionMult (GDD §5, Sprint 3 Phase 2)', () => {
  const oneEach = [
    { type: 'basica' as const, count: 1 },
    { type: 'sensorial' as const, count: 1 },
    { type: 'piramidal' as const, count: 1 },
    { type: 'espejo' as const, count: 1 },
    { type: 'integradora' as const, count: 1 },
  ];

  test('no pairs with 0 or 1 owned type → identity 1.0', () => {
    expect(computeConnectionMult([], false)).toBe(1);
    expect(computeConnectionMult([{ type: 'basica', count: 1 }], false)).toBe(1);
  });

  test('2 owned types → 1 pair → 1.05 per GDD §5', () => {
    expect(computeConnectionMult(oneEach.slice(0, 2), false)).toBeCloseTo(1.05, 6);
  });

  test('3 owned types → C(3,2)=3 pairs → 1.15', () => {
    expect(computeConnectionMult(oneEach.slice(0, 3), false)).toBeCloseTo(1.15, 6);
  });

  test('4 owned types → C(4,2)=6 pairs → 1.30', () => {
    expect(computeConnectionMult(oneEach.slice(0, 4), false)).toBeCloseTo(1.30, 6);
  });

  test('5 owned types → C(5,2)=10 pairs → 1.50 (GDD §5 full bonus)', () => {
    expect(computeConnectionMult(oneEach, false)).toBeCloseTo(1.50, 6);
  });

  test('Sincronía Neural doubles the applied value (Phase 1 literal reading)', () => {
    expect(computeConnectionMult(oneEach, true)).toBeCloseTo(3.0, 6);
    expect(computeConnectionMult(oneEach.slice(0, 3), true)).toBeCloseTo(2.30, 6);
  });

  test('count=0 neurons do not count toward owned-types', () => {
    const mixed = [
      { type: 'basica' as const, count: 10 },
      { type: 'sensorial' as const, count: 0 },
      { type: 'piramidal' as const, count: 5 },
    ];
    // Only basica + piramidal = 2 types = 1 pair = 1.05
    expect(computeConnectionMult(mixed, false)).toBeCloseTo(1.05, 6);
  });
});

describe('calculateProduction — base sum + rate multipliers', () => {
  test('1 Básica, no upgrades → 0.5 thoughts/sec baseline × connectionMult 1.0 × softCap(1.0) = 0.5', () => {
    const state = createDefaultState();
    const { base } = calculateProduction(state);
    expect(base).toBeCloseTo(0.5, 6);
  });

  test('Red Neuronal Densa ×1.25 stacks on neuron rate (sum stage, not multiplier stack)', () => {
    const state = withUpgrades(createDefaultState(), ['red_neuronal_densa']);
    const { base } = calculateProduction(state);
    // sum = 1 × 0.5 × 1.25 = 0.625; rawMult = 1 × 1 = 1; softCap(1) = 1; base = 0.625
    expect(base).toBeCloseTo(0.625, 6);
  });

  test('Receptores AMPA ×2 applies to Básicas only', () => {
    const state = withUpgrades(createDefaultState(), ['receptores_ampa']);
    const { base } = calculateProduction(state);
    expect(base).toBeCloseTo(1.0, 6); // 1 × 0.5 × 2 = 1.0
  });

  test('all_neurons_mult stacks multiplicatively (Red Neuronal Densa × LTP = 1.25 × 1.5 = 1.875)', () => {
    const state = withUpgrades(createDefaultState(), ['red_neuronal_densa', 'ltp_potenciacion_larga']);
    const { base } = calculateProduction(state);
    // sum = 1 × 0.5 × (1.25 × 1.5) = 0.9375; rawMult = 1; base = 0.9375
    expect(base).toBeCloseTo(0.9375, 6);
  });

  test('Per-type + all-neurons stack multiplicatively (AMPA × Red Neuronal Densa on Básica)', () => {
    const state = withUpgrades(createDefaultState(), ['receptores_ampa', 'red_neuronal_densa']);
    const { base } = calculateProduction(state);
    // sum = 1 × 0.5 × 1.25 × 2 = 1.25
    expect(base).toBeCloseTo(1.25, 6);
  });

  // Sprint 7.5.2 §16.8 — basica_mult_and_memory_gain effect kind retired with
  // consolidacion_memoria. Per-type basica multiplier coverage now lives via
  // `receptores_ampa` (neuron_type_mult, basica ×2) elsewhere in this file.
});

describe('calculateProduction — global upgrade mults (§4 multiplier stack)', () => {
  test('Retroalimentación Positiva (all_production_mult ×2) applies to rawMult, not sum', () => {
    const state = withUpgrades(createDefaultState(), ['retroalimentacion_positiva']);
    const { base } = calculateProduction(state);
    // rawMult = 1 × 2 = 2; softCap(2) = 2; base = 0.5 × 2 = 1.0
    expect(base).toBeCloseTo(1.0, 6);
  });

  test('Singularidad = 1.01^prestigeCount (multiplicative per prestige)', () => {
    const base = withUpgrades(createDefaultState(), ['singularidad']);
    const atP10 = { ...base, prestigeCount: 10 };
    const { base: mult10 } = calculateProduction(atP10);
    // rawMult = 1.01^10 ≈ 1.10462; softCap pass-through (<100); base = 0.5 × 1.10462
    expect(mult10).toBeCloseTo(0.5 * Math.pow(1.01, 10), 6);
  });

  test('Convergencia Sináptica = 1 + min(0.015 × lp, 0.40) — scales to cap', () => {
    const state = withUpgrades(createDefaultState(), ['convergencia_sinaptica']);
    // lp=10 → 1 + 0.15 = 1.15
    const lp10 = calculateProduction({ ...state, lifetimePrestiges: 10 }).base;
    expect(lp10).toBeCloseTo(0.5 * 1.15, 6);
    // lp=100 → cap at +0.40 → 1.40
    const lp100 = calculateProduction({ ...state, lifetimePrestiges: 100 }).base;
    expect(lp100).toBeCloseTo(0.5 * 1.40, 6);
  });

  test('Emergencia Cognitiva — Interpretation B (multiplicative): 1.5^⌊n/5⌋, cap ×5', () => {
    // With 5 upgrades owned: 1 bucket → 1.5× before cap; but 5 upgrades × 1 (all_production_mult=1 for 4 of them) = need explicit
    // We'll use exactly 5 purchased: Emergencia + 4 filler. Filler chosen to have no production effect
    // would require a kind with identity — none exists. So: compute expected across several bucket counts.
    const base = createDefaultState();

    // 5 upgrades owned → 1 bucket → mult = 1.5. Pick 5 upgrades that have simple/no stacking with each other.
    // Use 5 upgrades where 4 have no global/per-type effect on our test state (1 Básica):
    // emergencia_cognitiva + sueno_rem (offline_cap_set — identity for production) +
    // umbral_consciencia (consciousness_fill_mult — identity) + best_upgrade_indicator (procesamiento_visual) +
    // mielina (tap_focus_fill_add — identity for production).
    const five = withUpgrades(base, [
      'emergencia_cognitiva', 'sueno_rem', 'umbral_consciencia', 'procesamiento_visual', 'mielina',
    ]);
    const { base: b5 } = calculateProduction(five);
    expect(b5).toBeCloseTo(0.5 * 1.5, 6);

    // 10 upgrades owned → 2 buckets → mult = 1.5^2 = 2.25
    const ten = withUpgrades(base, [
      'emergencia_cognitiva', 'sueno_rem', 'umbral_consciencia', 'procesamiento_visual', 'mielina',
      'concentracion_profunda', 'ritmo_circadiano', 'hiperconciencia', 'dopamina', 'focus_persistente',
    ]);
    const { base: b10 } = calculateProduction(ten);
    expect(b10).toBeCloseTo(0.5 * Math.pow(1.5, 2), 6);

    // 20 upgrades owned → 4 buckets → 1.5^4 = 5.0625 → cap at 5.0
    const twentyIds = [
      'emergencia_cognitiva', 'sueno_rem', 'umbral_consciencia', 'procesamiento_visual', 'mielina',
      'concentracion_profunda', 'ritmo_circadiano', 'hiperconciencia', 'dopamina', 'focus_persistente',
      'sincronizacion_total', 'amplificador_de_disparo', 'red_alta_velocidad', 'cascada_profunda',
      'descarga_neural', 'regulacion_emocional', 'funciones_ejecutivas', 'amplitud_banda',
      'convergencia_sinaptica', 'consciencia_distribuida',
    ];
    const twenty = withUpgrades(base, twentyIds);
    const { base: b20 } = calculateProduction(twenty);
    // Convergencia Sináptica is in the list → 1 + min(0.015 × 0 lp, 0.40) = 1 (lp=0 in default state)
    // Regulación Emocional (offline_efficiency_mult) is identity for production.
    // Amplificador/Cascada/Descarga/Sincronización (discharge-related) → identity for production.
    // Funciones Ejecutivas (upgrade_cost_reduction) → identity for production.
    // Amplitud de Banda (region_upgrades_boost) → Phase 2 treats as identity for production (region upgrades not implemented yet).
    // Consciencia Distribuida (offline_cap_set) → identity.
    // So production effect from owned = Emergencia capped at 5 × (no other mults).
    expect(b20).toBeCloseTo(0.5 * 5.0, 6);
  });
});

describe('calculateProduction — softCap application site (§4 line 209-211)', () => {
  test('softCap applies to the multiplier stack, not to the sum', () => {
    // Setup: huge neuron count → huge sum, modest multiplier stack → softCap pass-through.
    // If softCap were applied to the sum (incorrect), the result would be dampened sharply.
    const state = { ...createDefaultState(), neurons: [
      { type: 'basica' as const, count: 10_000 },
      { type: 'sensorial' as const, count: 0 },
      { type: 'piramidal' as const, count: 0 },
      { type: 'espejo' as const, count: 0 },
      { type: 'integradora' as const, count: 0 },
    ] };
    const { base } = calculateProduction(state);
    // sum = 10000 × 0.5 = 5000; rawMult = 1; softCap(1) = 1; base = 5000 × 1 = 5000 (un-dampened)
    // If softCap applied to sum, base would be softCap(5000) × 1 ≈ 1555
    expect(base).toBeCloseTo(5000, 3);
  });

  test('softCap dampens when the multiplier stack is large', () => {
    // Force rawMult > 100 by stacking Retroalimentación Positiva + Singularidad at high prestigeCount
    const state = withUpgrades({ ...createDefaultState(), prestigeCount: 500 }, [
      'retroalimentacion_positiva', 'singularidad',
    ]);
    // rawMult = 1 × 2 × 1.01^500 ≈ 2 × 144.77 = 289.5; softCap(289.5) ≈ 100 × 2.895^0.72
    const { base } = calculateProduction(state);
    const expectedRawMult = 2 * Math.pow(1.01, 500);
    const expectedSoftcap = 100 * Math.pow(expectedRawMult / 100, 0.72);
    expect(base).toBeCloseTo(0.5 * expectedSoftcap, 3);
  });
});

describe('calculateProduction — effective includes Insight, base does not', () => {
  test('Insight active multiplies effective but not base', () => {
    const state = { ...createDefaultState(), insightActive: true, insightMultiplier: 3.0 };
    const { base, effective } = calculateProduction(state);
    expect(base).toBeCloseTo(0.5, 6);
    expect(effective).toBeCloseTo(1.5, 6);
  });

  test('Insight inactive → base === effective', () => {
    const { base, effective } = calculateProduction(createDefaultState());
    expect(base).toBe(effective);
  });
});

describe('calculateProduction — purity + non-purchased upgrades ignored', () => {
  test('Upgrades with purchased=false do not contribute', () => {
    const state: GameState = {
      ...createDefaultState(),
      upgrades: [{ id: 'red_neuronal_densa', purchased: false }],
    };
    const { base } = calculateProduction(state);
    expect(base).toBeCloseTo(0.5, 6); // no boost
  });

  test('Unknown upgrade ids are ignored (defensive)', () => {
    const state = withUpgrades(createDefaultState(), ['nonexistent_upgrade']);
    const { base } = calculateProduction(state);
    expect(base).toBeCloseTo(0.5, 6);
  });

  test('Purity: same state yields same result', () => {
    const state = createDefaultState();
    const a = calculateProduction(state);
    const b = calculateProduction(state);
    expect(a.base).toBe(b.base);
    expect(a.effective).toBe(b.effective);
  });
});

describe('Constants coverage — connectionMultPerPair', () => {
  test('connectionMultPerPair = 0.05 (GDD §5)', () => {
    expect(SYNAPSE_CONSTANTS.connectionMultPerPair).toBe(0.05);
  });
});
