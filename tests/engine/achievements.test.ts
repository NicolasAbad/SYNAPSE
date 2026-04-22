// Sprint 7 Phase 7.1 — Achievements engine + data integrity tests (GDD §24.5).

import { describe, expect, test } from 'vitest';
import { ACHIEVEMENTS, ACHIEVEMENTS_BY_ID, ACHIEVEMENTS_BY_CATEGORY } from '../../src/config/achievements';
import { checkAllAchievements, achievementRewardSum, isAchievementHidden } from '../../src/engine/achievements';
import { createDefaultState } from '../../src/store/gameStore';
import type { GameState } from '../../src/types/GameState';

function fresh(overrides: Partial<GameState> = {}): GameState {
  const base = createDefaultState() as unknown as Record<string, unknown>;
  // Prune non-state action fns if they exist (mirrors resonantPatterns.test.ts pattern).
  for (const k of ['activeTab', 'activeMindSubtab', 'undoToast', 'antiSpamActive']) delete base[k];
  return { ...(base as unknown as GameState), ...overrides };
}

describe('Achievements — data integrity (GDD §24.5)', () => {
  test('exactly 35 achievements shipped', () => {
    expect(ACHIEVEMENTS.length).toBe(35);
  });

  test('all IDs match /^(cyc|meta|nar|hid|mas|reg)_[a-z_0-9]+$/', () => {
    const re = /^(cyc|meta|nar|hid|mas|reg)_[a-z_0-9]+$/;
    for (const a of ACHIEVEMENTS) expect(a.id).toMatch(re);
  });

  test('Spark reward pool totals 175 (Sprint 6.8 updated from 145)', () => {
    const total = ACHIEVEMENTS.reduce((sum, a) => sum + a.reward, 0);
    expect(total).toBe(175);
  });

  test('category counts match GDD §24.5 (6/6/6/6/6/5)', () => {
    expect(ACHIEVEMENTS_BY_CATEGORY.cyc).toHaveLength(6);
    expect(ACHIEVEMENTS_BY_CATEGORY.meta).toHaveLength(6);
    expect(ACHIEVEMENTS_BY_CATEGORY.nar).toHaveLength(6);
    expect(ACHIEVEMENTS_BY_CATEGORY.hid).toHaveLength(6);
    expect(ACHIEVEMENTS_BY_CATEGORY.mas).toHaveLength(6);
    expect(ACHIEVEMENTS_BY_CATEGORY.reg).toHaveLength(5);
  });

  test('category Spark totals match GDD §24.5 table (25/35/30/28/27/30)', () => {
    const sumOf = (cat: string) => ACHIEVEMENTS_BY_CATEGORY[cat].reduce((s, a) => s + a.reward, 0);
    expect(sumOf('cyc')).toBe(25);
    expect(sumOf('meta')).toBe(35);
    expect(sumOf('nar')).toBe(30);
    expect(sumOf('hid')).toBe(28);
    expect(sumOf('mas')).toBe(27);
    expect(sumOf('reg')).toBe(30);
  });

  test('all IDs unique', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('all 6 hid_ achievements have isHidden=true; others false (ACH-2)', () => {
    for (const a of ACHIEVEMENTS) {
      if (a.category === 'hid') expect(a.isHidden).toBe(true);
      else expect(a.isHidden).toBe(false);
    }
  });

  test('ACHIEVEMENTS_BY_ID index matches ACHIEVEMENTS length', () => {
    expect(Object.keys(ACHIEVEMENTS_BY_ID)).toHaveLength(ACHIEVEMENTS.length);
  });
});

describe('Cycle achievements (6)', () => {
  test('cyc_first_spark fires on lifetimeDischarges=1', () => {
    expect(ACHIEVEMENTS_BY_ID.cyc_first_spark.trigger(fresh({ lifetimeDischarges: 0 }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.cyc_first_spark.trigger(fresh({ lifetimeDischarges: 1 }))).toBe(true);
  });

  test('cyc_first_cascade fires on cycleCascades=1', () => {
    expect(ACHIEVEMENTS_BY_ID.cyc_first_cascade.trigger(fresh({ cycleCascades: 0 }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.cyc_first_cascade.trigger(fresh({ cycleCascades: 1 }))).toBe(true);
  });

  test('cyc_full_focus fires on lifetimeInsights=1 (proxy for focus=1.0)', () => {
    expect(ACHIEVEMENTS_BY_ID.cyc_full_focus.trigger(fresh({ lifetimeInsights: 0 }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.cyc_full_focus.trigger(fresh({ lifetimeInsights: 1 }))).toBe(true);
  });

  test('cyc_under_10 fires when latest prestige entry cycleDurationMs <= 600_000', () => {
    const s1 = fresh({ awakeningLog: [] });
    expect(ACHIEVEMENTS_BY_ID.cyc_under_10.trigger(s1)).toBe(false);
    const s2 = fresh({
      awakeningLog: [{ prestigeCount: 0, timestamp: 0, cycleDurationMs: 599_999, endProduction: 0, polarity: null, mutationId: null, pathway: null, patternsGained: 3, memoriesGained: 2, wasPersonalBest: true }],
    });
    expect(ACHIEVEMENTS_BY_ID.cyc_under_10.trigger(s2)).toBe(true);
    const s3 = fresh({
      awakeningLog: [{ prestigeCount: 0, timestamp: 0, cycleDurationMs: 600_001, endProduction: 0, polarity: null, mutationId: null, pathway: null, patternsGained: 3, memoriesGained: 2, wasPersonalBest: true }],
    });
    expect(ACHIEVEMENTS_BY_ID.cyc_under_10.trigger(s3)).toBe(false);
  });

  test('cyc_under_10 uses lenient <= per PRECOMMIT-5 style (R4 decision)', () => {
    const s = fresh({
      awakeningLog: [{ prestigeCount: 0, timestamp: 0, cycleDurationMs: 600_000, endProduction: 0, polarity: null, mutationId: null, pathway: null, patternsGained: 3, memoriesGained: 2, wasPersonalBest: true }],
    });
    expect(ACHIEVEMENTS_BY_ID.cyc_under_10.trigger(s)).toBe(true);
  });

  test('cyc_five_types fires when every neuron type count >= 1', () => {
    const allTypes: GameState['neurons'] = [
      { type: 'basica', count: 1 },
      { type: 'sensorial', count: 1 },
      { type: 'piramidal', count: 1 },
      { type: 'espejo', count: 1 },
      { type: 'integradora', count: 1 },
    ];
    expect(ACHIEVEMENTS_BY_ID.cyc_five_types.trigger(fresh({ neurons: allTypes }))).toBe(true);
    const missing = [...allTypes];
    missing[4] = { type: 'integradora', count: 0 };
    expect(ACHIEVEMENTS_BY_ID.cyc_five_types.trigger(fresh({ neurons: missing }))).toBe(false);
  });

  test('cyc_eureka_rush fires on currentMentalState===eureka', () => {
    expect(ACHIEVEMENTS_BY_ID.cyc_eureka_rush.trigger(fresh({ currentMentalState: null }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.cyc_eureka_rush.trigger(fresh({ currentMentalState: 'flow' }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.cyc_eureka_rush.trigger(fresh({ currentMentalState: 'eureka' }))).toBe(true);
  });
});

describe('Meta achievements (6)', () => {
  test('meta_first_awakening fires on lifetimePrestiges=1', () => {
    expect(ACHIEVEMENTS_BY_ID.meta_first_awakening.trigger(fresh({ lifetimePrestiges: 0 }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.meta_first_awakening.trigger(fresh({ lifetimePrestiges: 1 }))).toBe(true);
  });

  test('meta_polarity_picked fires on current OR lastCycleConfig.polarity', () => {
    const s = fresh({ currentPolarity: 'excitatory' });
    expect(ACHIEVEMENTS_BY_ID.meta_polarity_picked.trigger(s)).toBe(true);
  });

  test('meta_archetype_chosen fires on archetype set OR historyLen>=1', () => {
    expect(ACHIEVEMENTS_BY_ID.meta_archetype_chosen.trigger(fresh({ archetype: null, archetypeHistory: [] }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.meta_archetype_chosen.trigger(fresh({ archetype: 'analitica' }))).toBe(true);
  });

  test('meta_era_3 fires at prestigeCount=19', () => {
    expect(ACHIEVEMENTS_BY_ID.meta_era_3.trigger(fresh({ prestigeCount: 18 }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.meta_era_3.trigger(fresh({ prestigeCount: 19 }))).toBe(true);
  });

  test('meta_mutation_picked requires currentMutation or uniqueMutationsUsed', () => {
    expect(ACHIEVEMENTS_BY_ID.meta_mutation_picked.trigger(fresh({ currentMutation: null, uniqueMutationsUsed: [] }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.meta_mutation_picked.trigger(fresh({ uniqueMutationsUsed: ['eficiencia_neural'] }))).toBe(true);
  });

  test('meta_pathway_picked requires currentPathway or uniquePathwaysUsed', () => {
    expect(ACHIEVEMENTS_BY_ID.meta_pathway_picked.trigger(fresh({ currentPathway: null, uniquePathwaysUsed: [] }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.meta_pathway_picked.trigger(fresh({ currentPathway: 'rapida' }))).toBe(true);
  });
});

describe('Narrative achievements (6)', () => {
  test('nar_first_fragment requires >=1 fragment', () => {
    expect(ACHIEVEMENTS_BY_ID.nar_first_fragment.trigger(fresh({ narrativeFragmentsSeen: [] }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.nar_first_fragment.trigger(fresh({ narrativeFragmentsSeen: ['base_01'] }))).toBe(true);
  });

  test('nar_ten_fragments requires >=10 fragments', () => {
    expect(ACHIEVEMENTS_BY_ID.nar_ten_fragments.trigger(fresh({ narrativeFragmentsSeen: new Array(9).fill('x') }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.nar_ten_fragments.trigger(fresh({ narrativeFragmentsSeen: new Array(10).fill('x') }))).toBe(true);
  });

  test('nar_all_base requires all 12 BASE fragments seen', () => {
    const first11 = ['base_01','base_02','base_03','base_04','base_05','base_06','base_07','base_08','base_09','base_10','base_11'];
    expect(ACHIEVEMENTS_BY_ID.nar_all_base.trigger(fresh({ narrativeFragmentsSeen: first11 }))).toBe(false);
    const all12 = [...first11, 'base_12'];
    expect(ACHIEVEMENTS_BY_ID.nar_all_base.trigger(fresh({ narrativeFragmentsSeen: all12 }))).toBe(true);
  });

  test('nar_first_ending requires endingsSeen.length>=1', () => {
    expect(ACHIEVEMENTS_BY_ID.nar_first_ending.trigger(fresh({ endingsSeen: [] }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.nar_first_ending.trigger(fresh({ endingsSeen: ['equation'] }))).toBe(true);
  });

  test('nar_diary_50 requires 50 diary entries', () => {
    expect(ACHIEVEMENTS_BY_ID.nar_diary_50.trigger(fresh({ diaryEntries: [] }))).toBe(false);
    const fifty = new Array(50).fill({ timestamp: 0, type: 'prestige' as const, data: {} });
    expect(ACHIEVEMENTS_BY_ID.nar_diary_50.trigger(fresh({ diaryEntries: fifty }))).toBe(true);
  });

  test('nar_all_archetype_frags requires all 15 of current archetype', () => {
    const all15Analitica = Array.from({ length: 15 }, (_, i) => `ana_${(i + 1).toString().padStart(2, '0')}`);
    expect(ACHIEVEMENTS_BY_ID.nar_all_archetype_frags.trigger(fresh({ archetype: 'analitica', narrativeFragmentsSeen: all15Analitica }))).toBe(true);
    expect(ACHIEVEMENTS_BY_ID.nar_all_archetype_frags.trigger(fresh({ archetype: null, narrativeFragmentsSeen: all15Analitica }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.nar_all_archetype_frags.trigger(fresh({ archetype: 'analitica', narrativeFragmentsSeen: all15Analitica.slice(0, 14) }))).toBe(false);
  });
});

describe('Hidden achievements (6)', () => {
  test('hid_no_tap_cycle STUBBED to false (Sprint 8b wires real)', () => {
    // D5c decision — tracking field deferred; trigger returns false in v1.0 until field added.
    expect(ACHIEVEMENTS_BY_ID.hid_no_tap_cycle.trigger(fresh())).toBe(false);
  });

  test('hid_no_discharge_full_cycle counts 3 consecutive tail prestige entries with dischargesUsed=0', () => {
    const entries = (n: number, used: number) => new Array(n).fill({ timestamp: 0, type: 'prestige' as const, data: { dischargesUsed: used } });
    expect(ACHIEVEMENTS_BY_ID.hid_no_discharge_full_cycle.trigger(fresh({ diaryEntries: entries(2, 0) }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.hid_no_discharge_full_cycle.trigger(fresh({ diaryEntries: entries(3, 0) }))).toBe(true);
    // Streak broken by a used=1 entry interrupts
    const broken = [{ timestamp: 0, type: 'prestige' as const, data: { dischargesUsed: 0 } }, { timestamp: 0, type: 'prestige' as const, data: { dischargesUsed: 1 } }, { timestamp: 0, type: 'prestige' as const, data: { dischargesUsed: 0 } }, { timestamp: 0, type: 'prestige' as const, data: { dischargesUsed: 0 } }];
    expect(ACHIEVEMENTS_BY_ID.hid_no_discharge_full_cycle.trigger(fresh({ diaryEntries: broken }))).toBe(false);
  });

  test('hid_insight_trasc requires active L3 Insight (×18 mult)', () => {
    expect(ACHIEVEMENTS_BY_ID.hid_insight_trasc.trigger(fresh({ insightActive: false }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.hid_insight_trasc.trigger(fresh({ insightActive: true, insightMultiplier: 3 }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.hid_insight_trasc.trigger(fresh({ insightActive: true, insightMultiplier: 18 }))).toBe(true);
  });

  test('hid_max_connection fires at connectionMult >= 1.5', () => {
    expect(ACHIEVEMENTS_BY_ID.hid_max_connection.trigger(fresh({ connectionMult: 1.45 }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.hid_max_connection.trigger(fresh({ connectionMult: 1.5 }))).toBe(true);
  });

  test('hid_spontaneous_hunter requires 12 unique spontaneous diary entries', () => {
    const makeEntries = (ids: string[]) => ids.map((id) => ({ timestamp: 0, type: 'spontaneous' as const, data: { spontaneousId: id } }));
    const eleven = makeEntries(['eureka','rafaga_dopaminica','claridad_momentanea','conexion_profunda','disparo_latente','memoria_fugaz','polaridad_fluctuante','mutacion_temporal','eco_distante','pausa_neural','fatiga_sinaptica']);
    expect(ACHIEVEMENTS_BY_ID.hid_spontaneous_hunter.trigger(fresh({ diaryEntries: eleven }))).toBe(false);
    const twelve = [...eleven, ...makeEntries(['interferencia'])];
    expect(ACHIEVEMENTS_BY_ID.hid_spontaneous_hunter.trigger(fresh({ diaryEntries: twelve }))).toBe(true);
  });

  test('hid_first_rp fires on any true in resonantPatternsDiscovered', () => {
    expect(ACHIEVEMENTS_BY_ID.hid_first_rp.trigger(fresh({ resonantPatternsDiscovered: [false, false, false, false] }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.hid_first_rp.trigger(fresh({ resonantPatternsDiscovered: [true, false, false, false] }))).toBe(true);
  });
});

describe('Mastery achievements (6)', () => {
  test('mas_first_transcendence fires on transcendenceCount >= 1', () => {
    expect(ACHIEVEMENTS_BY_ID.mas_first_transcendence.trigger(fresh({ transcendenceCount: 0 }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.mas_first_transcendence.trigger(fresh({ transcendenceCount: 1 }))).toBe(true);
  });

  test('mas_all_archetypes requires all 3 archetypes in history', () => {
    expect(ACHIEVEMENTS_BY_ID.mas_all_archetypes.trigger(fresh({ archetypeHistory: ['analitica', 'empatica'] }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.mas_all_archetypes.trigger(fresh({ archetypeHistory: ['analitica', 'empatica', 'creativa'] }))).toBe(true);
  });

  test('mas_all_pathways requires 3 unique pathways used', () => {
    expect(ACHIEVEMENTS_BY_ID.mas_all_pathways.trigger(fresh({ uniquePathwaysUsed: ['rapida', 'profunda'] }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.mas_all_pathways.trigger(fresh({ uniquePathwaysUsed: ['rapida', 'profunda', 'equilibrada'] }))).toBe(true);
  });

  test('mas_all_mutations requires 15 unique mutations used', () => {
    expect(ACHIEVEMENTS_BY_ID.mas_all_mutations.trigger(fresh({ uniqueMutationsUsed: new Array(14).fill('x') }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.mas_all_mutations.trigger(fresh({ uniqueMutationsUsed: new Array(15).fill('x') }))).toBe(true);
  });

  test('mas_resonance_50 fires at resonance >= 50', () => {
    expect(ACHIEVEMENTS_BY_ID.mas_resonance_50.trigger(fresh({ resonance: 49 }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.mas_resonance_50.trigger(fresh({ resonance: 50 }))).toBe(true);
  });

  test('mas_all_endings requires 4 unique endings seen', () => {
    expect(ACHIEVEMENTS_BY_ID.mas_all_endings.trigger(fresh({ endingsSeen: ['equation', 'chorus', 'seed'] }))).toBe(false);
    expect(ACHIEVEMENTS_BY_ID.mas_all_endings.trigger(fresh({ endingsSeen: ['equation', 'chorus', 'seed', 'singularity'] }))).toBe(true);
  });
});

describe('Region achievements (5) — Sprint 7.1 STUBBED per Sprint 6.8 re-architecture', () => {
  test('all 5 region triggers return false in Sprint 7.1 (Sprint 7.5 wires real conditions)', () => {
    const regs = ['reg_shard_collector', 'reg_precommit_streak', 'reg_euphoric', 'reg_foresight_master', 'reg_integrated_mind'];
    for (const id of regs) {
      expect(ACHIEVEMENTS_BY_ID[id].trigger(fresh())).toBe(false);
    }
  });
});

describe('checkAllAchievements — engine behavior', () => {
  test('returns empty array when nothing new to unlock', () => {
    const r = checkAllAchievements(fresh());
    expect(r.newlyUnlocked).toEqual([]);
  });

  test('returns IDs that newly transitioned false → true', () => {
    const s = fresh({ lifetimeDischarges: 1, cycleCascades: 1 });
    const r = checkAllAchievements(s);
    expect(r.newlyUnlocked).toContain('cyc_first_spark');
    expect(r.newlyUnlocked).toContain('cyc_first_cascade');
  });

  test('already-unlocked IDs are NOT re-included', () => {
    const s = fresh({ lifetimeDischarges: 1, achievementsUnlocked: ['cyc_first_spark'] });
    const r = checkAllAchievements(s);
    expect(r.newlyUnlocked).not.toContain('cyc_first_spark');
  });
});

describe('achievementRewardSum', () => {
  test('sums rewards of given IDs', () => {
    expect(achievementRewardSum(['cyc_first_spark', 'cyc_first_cascade'])).toBe(3 + 5);
  });

  test('ignores unknown IDs', () => {
    expect(achievementRewardSum(['cyc_first_spark', 'nonexistent'])).toBe(3);
  });

  test('empty input returns 0', () => {
    expect(achievementRewardSum([])).toBe(0);
  });
});

describe('isAchievementHidden (ACH-2)', () => {
  test('hidden+locked returns true (display as ???)', () => {
    expect(isAchievementHidden('hid_first_rp', [])).toBe(true);
  });

  test('hidden+unlocked returns false (full reveal)', () => {
    expect(isAchievementHidden('hid_first_rp', ['hid_first_rp'])).toBe(false);
  });

  test('non-hidden returns false regardless', () => {
    expect(isAchievementHidden('cyc_first_spark', [])).toBe(false);
    expect(isAchievementHidden('cyc_first_spark', ['cyc_first_spark'])).toBe(false);
  });

  test('unknown ID returns false', () => {
    expect(isAchievementHidden('nonexistent', [])).toBe(false);
  });
});
