// Canonical 35 Achievements per GDD §24.5 (30 base) + Sprint 6.8 re-architecture
// (+5 Regions category). CANONICAL STORAGE FILE per CLAUDE.md "Canonical storage
// file rule" — Gate 3 exempt. IDs, rewards, trigger conditions are spec values
// from GDD §24.5 copied verbatim.
//
// IDs match /^(cyc|meta|nar|hid|mas|reg)_[a-z_0-9]+$/ per ACH-1 spec.
// Total Spark reward sum = 175 (25 Cycle + 35 Meta + 30 Narrative + 28 Hidden +
// 27 Mastery + 30 Regions per §24.5 reward table).
//
// Category counts: 6/6/6/6/6/5 = 35 total. Note: Regions is 5, not 6 — the
// "Integrated Mind" 5-region achievement completes the category semantically.
//
// TRIGGERS are pure functions of GameState per ACH-1. Region-category triggers
// ship STUBBED (return false) in Sprint 7.1 — they reference Region sub-system
// state that doesn't exist yet (memoryShards, mood, precommitmentStreak, etc.).
// Sprint 7.5 wires real conditions once those fields land.

import type { GameState } from '../types/GameState';
import type { AchievementDef } from '../types';
import { SYNAPSE_CONSTANTS } from './constants';

// Base narrative fragments (BASE-01..BASE-12) — for nar_all_base check.
const BASE_FRAGMENT_IDS = ['base_01', 'base_02', 'base_03', 'base_04', 'base_05', 'base_06', 'base_07', 'base_08', 'base_09', 'base_10', 'base_11', 'base_12'] as const;

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // ═══════════════════ Category 1 — Cycle (6, 25 Sparks) ═══════════════════
  {
    id: 'cyc_first_spark',
    category: 'cyc',
    nameKey: 'achievements.cyc_first_spark.name',
    descriptionKey: 'achievements.cyc_first_spark.description',
    reward: 3,
    isHidden: false,
    trigger: (s: GameState) => s.lifetimeDischarges >= 1,
  },
  {
    id: 'cyc_first_cascade',
    category: 'cyc',
    nameKey: 'achievements.cyc_first_cascade.name',
    descriptionKey: 'achievements.cyc_first_cascade.description',
    reward: 5,
    isHidden: false,
    trigger: (s: GameState) => s.cycleCascades >= 1,
  },
  {
    id: 'cyc_full_focus',
    category: 'cyc',
    nameKey: 'achievements.cyc_full_focus.name',
    descriptionKey: 'achievements.cyc_full_focus.description',
    reward: 3,
    isHidden: false,
    // Focus reaching 1.0 auto-activates Insight (§6 Insight trigger). lifetimeInsights >= 1
    // is the cleanest indirect signal that focusBar has hit 1.0 at least once.
    trigger: (s: GameState) => s.lifetimeInsights >= 1,
  },
  {
    id: 'cyc_under_10',
    category: 'cyc',
    nameKey: 'achievements.cyc_under_10.name',
    descriptionKey: 'achievements.cyc_under_10.description',
    reward: 5,
    isHidden: false,
    // Trigger fires on prestige: latest awakeningLog entry's cycleDurationMs < 10 min.
    // PRECOMMIT-5 style: lenient (<=) per Phase 6 R4 decision.
    trigger: (s: GameState) => {
      const last = s.awakeningLog[s.awakeningLog.length - 1];
      return last !== undefined && last.cycleDurationMs <= SYNAPSE_CONSTANTS.achievementCycUnder10Ms;
    },
  },
  {
    id: 'cyc_five_types',
    category: 'cyc',
    nameKey: 'achievements.cyc_five_types.name',
    descriptionKey: 'achievements.cyc_five_types.description',
    reward: 4,
    isHidden: false,
    trigger: (s: GameState) => s.neurons.every((n) => n.count >= 1),
  },
  {
    id: 'cyc_eureka_rush',
    category: 'cyc',
    nameKey: 'achievements.cyc_eureka_rush.name',
    descriptionKey: 'achievements.cyc_eureka_rush.description',
    reward: 5,
    isHidden: false,
    trigger: (s: GameState) => s.currentMentalState === 'eureka',
  },

  // ═══════════════════ Category 2 — Meta (6, 35 Sparks) ═══════════════════
  {
    id: 'meta_first_awakening',
    category: 'meta',
    nameKey: 'achievements.meta_first_awakening.name',
    descriptionKey: 'achievements.meta_first_awakening.description',
    reward: 5,
    isHidden: false,
    trigger: (s: GameState) => s.lifetimePrestiges >= 1,
  },
  {
    id: 'meta_polarity_picked',
    category: 'meta',
    nameKey: 'achievements.meta_polarity_picked.name',
    descriptionKey: 'achievements.meta_polarity_picked.description',
    reward: 3,
    isHidden: false,
    trigger: (s: GameState) => s.currentPolarity !== null || (s.lastCycleConfig !== null && s.lastCycleConfig.polarity !== ''),
  },
  {
    id: 'meta_archetype_chosen',
    category: 'meta',
    nameKey: 'achievements.meta_archetype_chosen.name',
    descriptionKey: 'achievements.meta_archetype_chosen.description',
    reward: 5,
    isHidden: false,
    trigger: (s: GameState) => s.archetype !== null || s.archetypeHistory.length >= 1,
  },
  {
    id: 'meta_mutation_picked',
    category: 'meta',
    nameKey: 'achievements.meta_mutation_picked.name',
    descriptionKey: 'achievements.meta_mutation_picked.description',
    reward: 3,
    isHidden: false,
    trigger: (s: GameState) => s.currentMutation !== null || s.uniqueMutationsUsed.length >= 1,
  },
  {
    id: 'meta_pathway_picked',
    category: 'meta',
    nameKey: 'achievements.meta_pathway_picked.name',
    descriptionKey: 'achievements.meta_pathway_picked.description',
    reward: 5,
    isHidden: false,
    trigger: (s: GameState) => s.currentPathway !== null || s.uniquePathwaysUsed.length >= 1,
  },
  {
    id: 'meta_era_3',
    category: 'meta',
    nameKey: 'achievements.meta_era_3.name',
    descriptionKey: 'achievements.meta_era_3.description',
    reward: 14,
    isHidden: false,
    trigger: (s: GameState) => s.prestigeCount >= SYNAPSE_CONSTANTS.era3StartPrestige,
  },

  // ═══════════════════ Category 3 — Narrative (6, 30 Sparks) ═══════════════
  {
    id: 'nar_first_fragment',
    category: 'nar',
    nameKey: 'achievements.nar_first_fragment.name',
    descriptionKey: 'achievements.nar_first_fragment.description',
    reward: 3,
    isHidden: false,
    trigger: (s: GameState) => s.narrativeFragmentsSeen.length >= 1,
  },
  {
    id: 'nar_ten_fragments',
    category: 'nar',
    nameKey: 'achievements.nar_ten_fragments.name',
    descriptionKey: 'achievements.nar_ten_fragments.description',
    reward: 5,
    isHidden: false,
    trigger: (s: GameState) => s.narrativeFragmentsSeen.length >= SYNAPSE_CONSTANTS.achievementNarTenFragmentsCount,
  },
  {
    id: 'nar_all_base',
    category: 'nar',
    nameKey: 'achievements.nar_all_base.name',
    descriptionKey: 'achievements.nar_all_base.description',
    reward: 5,
    isHidden: false,
    trigger: (s: GameState) => {
      const seen = new Set(s.narrativeFragmentsSeen);
      return BASE_FRAGMENT_IDS.every((id) => seen.has(id));
    },
  },
  {
    id: 'nar_first_ending',
    category: 'nar',
    nameKey: 'achievements.nar_first_ending.name',
    descriptionKey: 'achievements.nar_first_ending.description',
    reward: 7,
    isHidden: false,
    trigger: (s: GameState) => s.endingsSeen.length >= 1,
  },
  {
    id: 'nar_diary_50',
    category: 'nar',
    nameKey: 'achievements.nar_diary_50.name',
    descriptionKey: 'achievements.nar_diary_50.description',
    reward: 5,
    isHidden: false,
    trigger: (s: GameState) => s.diaryEntries.length >= SYNAPSE_CONSTANTS.achievementNarDiary50Count,
  },
  {
    id: 'nar_all_archetype_frags',
    category: 'nar',
    nameKey: 'achievements.nar_all_archetype_frags.name',
    descriptionKey: 'achievements.nar_all_archetype_frags.description',
    reward: 5,
    isHidden: false,
    trigger: (s: GameState) => {
      if (s.archetype === null) return false;
      // Check all 15 archetype-specific fragments of current archetype are in seen set.
      // Fragment IDs follow pattern: ana_01..ana_15, emp_01..emp_15, cre_01..cre_15.
      const prefix = s.archetype === 'analitica' ? 'ana_' : s.archetype === 'empatica' ? 'emp_' : 'cre_';
      const seen = new Set(s.narrativeFragmentsSeen);
      for (let i = 1; i <= 15; i++) { // CONST-OK (15 archetype fragments per §12)
        const id = `${prefix}${i.toString().padStart(2, '0')}`;
        if (!seen.has(id)) return false;
      }
      return true;
    },
  },

  // ═══════════════════ Category 4 — Hidden (6, 28 Sparks) ═════════════════════
  // ACH-2: Hidden achievements display as ??? until unlocked. isHidden: true.
  {
    id: 'hid_no_tap_cycle',
    category: 'hid',
    nameKey: 'achievements.hid_no_tap_cycle.name',
    descriptionKey: 'achievements.hid_no_tap_cycle.description',
    reward: 5,
    isHidden: true,
    // Sprint 6.8 R5-audit decision D5c: STUB to false until Sprint 8b refactor adds
    // cycle-level tap counter. Current fields only track 20-wide circular buffer
    // via lastTapTimestamps — insufficient to know cycle-total taps at prestige time.
    trigger: (_s: GameState) => false,
  },
  {
    id: 'hid_no_discharge_full_cycle',
    category: 'hid',
    nameKey: 'achievements.hid_no_discharge_full_cycle.name',
    descriptionKey: 'achievements.hid_no_discharge_full_cycle.description',
    reward: 5,
    isHidden: true,
    // Sprint 6.8 R6 decision: derive streak from diaryEntries filter instead of new
    // GameState field. Count consecutive tail prestige entries where dischargesUsed=0.
    trigger: (s: GameState) => {
      const need = SYNAPSE_CONSTANTS.achievementHidNoDischargeStreakCount;
      // Walk diary tail backward, count consecutive prestige entries with dischargesUsed===0.
      let streak = 0;
      for (let i = s.diaryEntries.length - 1; i >= 0; i--) {
        const entry = s.diaryEntries[i];
        if (entry.type !== 'prestige') continue;
        const used = entry.data['dischargesUsed'];
        if (used === 0) {
          streak++;
          if (streak >= need) return true;
        } else {
          return false; // streak broken
        }
      }
      return false;
    },
  },
  {
    id: 'hid_insight_trasc',
    category: 'hid',
    nameKey: 'achievements.hid_insight_trasc.name',
    descriptionKey: 'achievements.hid_insight_trasc.description',
    reward: 3,
    isHidden: true,
    // Level 3 Trascendente Insight multiplier is insightMultiplier[2] = 18.0 per §6.
    trigger: (s: GameState) => s.insightActive && s.insightMultiplier === SYNAPSE_CONSTANTS.insightMultiplier[2],
  },
  {
    id: 'hid_max_connection',
    category: 'hid',
    nameKey: 'achievements.hid_max_connection.name',
    descriptionKey: 'achievements.hid_max_connection.description',
    reward: 5,
    isHidden: true,
    // Connection max = 1 + C(5,2)×0.05 = 1.5 when all 5 types owned.
    // "Maintain for 30s" part requires a new tracked timestamp field; Sprint 7.5
    // adds it. For Sprint 7.1, trigger fires on instantaneous max (acceptable
    // until 30s hold is wired).
    trigger: (s: GameState) => s.connectionMult >= 1.5, // CONST-OK: derived max per §5 formula
  },
  {
    id: 'hid_spontaneous_hunter',
    category: 'hid',
    nameKey: 'achievements.hid_spontaneous_hunter.name',
    descriptionKey: 'achievements.hid_spontaneous_hunter.description',
    reward: 5,
    isHidden: true,
    // Sprint 7.1 D4 decision: diaryEntries type='spontaneous' filter gives unique IDs.
    // 12 unique spontaneous event IDs seen lifetime = trigger.
    trigger: (s: GameState) => {
      const seen = new Set<string>();
      for (const e of s.diaryEntries) {
        if (e.type === 'spontaneous' && typeof e.data['spontaneousId'] === 'string') {
          seen.add(e.data['spontaneousId']);
        }
      }
      return seen.size >= 12; // CONST-OK: matches SPONTANEOUS_EVENTS.length per §8
    },
  },
  {
    id: 'hid_first_rp',
    category: 'hid',
    nameKey: 'achievements.hid_first_rp.name',
    descriptionKey: 'achievements.hid_first_rp.description',
    reward: 5,
    isHidden: true,
    trigger: (s: GameState) => s.resonantPatternsDiscovered.some((b) => b),
  },

  // ═══════════════════ Category 5 — Mastery (6, 27 Sparks) ════════════════
  {
    id: 'mas_first_transcendence',
    category: 'mas',
    nameKey: 'achievements.mas_first_transcendence.name',
    descriptionKey: 'achievements.mas_first_transcendence.description',
    reward: 7,
    isHidden: false,
    trigger: (s: GameState) => s.transcendenceCount >= 1,
  },
  {
    id: 'mas_all_archetypes',
    category: 'mas',
    nameKey: 'achievements.mas_all_archetypes.name',
    descriptionKey: 'achievements.mas_all_archetypes.description',
    reward: 5,
    isHidden: false,
    trigger: (s: GameState) => {
      const seen = new Set(s.archetypeHistory);
      return seen.has('analitica') && seen.has('empatica') && seen.has('creativa');
    },
  },
  {
    id: 'mas_all_pathways',
    category: 'mas',
    nameKey: 'achievements.mas_all_pathways.name',
    descriptionKey: 'achievements.mas_all_pathways.description',
    reward: 3,
    isHidden: false,
    trigger: (s: GameState) => s.uniquePathwaysUsed.length >= 3, // CONST-OK: 3 pathways per §14
  },
  {
    id: 'mas_all_mutations',
    category: 'mas',
    nameKey: 'achievements.mas_all_mutations.name',
    descriptionKey: 'achievements.mas_all_mutations.description',
    reward: 5,
    isHidden: false,
    trigger: (s: GameState) => s.uniqueMutationsUsed.length >= SYNAPSE_CONSTANTS.mutationPoolSize,
  },
  {
    id: 'mas_resonance_50',
    category: 'mas',
    nameKey: 'achievements.mas_resonance_50.name',
    descriptionKey: 'achievements.mas_resonance_50.description',
    reward: 3,
    isHidden: false,
    trigger: (s: GameState) => s.resonance >= SYNAPSE_CONSTANTS.achievementMasResonance50Count,
  },
  {
    id: 'mas_all_endings',
    category: 'mas',
    nameKey: 'achievements.mas_all_endings.name',
    descriptionKey: 'achievements.mas_all_endings.description',
    reward: 4,
    isHidden: false,
    trigger: (s: GameState) => {
      const seen = new Set(s.endingsSeen);
      return seen.size >= 4; // CONST-OK: 4 v1.0 endings per §22 + NARRATIVE.md §6
    },
  },

  // ═══════════════════ Category 6 — Regions (5, 30 Sparks) — Sprint 6.8 ══════
  // All triggers STUBBED to false in Sprint 7.1. Sprint 7.5 wires real conditions
  // once Region sub-system state (memoryShards, mood, precommitmentStreak,
  // regionsUnlocked + Visual upgrade count for tier, Integrated Mind sync) exists.
  {
    id: 'reg_shard_collector',
    category: 'reg',
    nameKey: 'achievements.reg_shard_collector.name',
    descriptionKey: 'achievements.reg_shard_collector.description',
    reward: 5,
    isHidden: false,
    trigger: (_s: GameState) => false, // Sprint 7.5: s.memoryShards.{emo|proc|epi} >= 100
  },
  {
    id: 'reg_precommit_streak',
    category: 'reg',
    nameKey: 'achievements.reg_precommit_streak.name',
    descriptionKey: 'achievements.reg_precommit_streak.description',
    reward: 7,
    isHidden: false,
    trigger: (_s: GameState) => false, // Sprint 7.5: s.precommitmentStreak >= 5
  },
  {
    id: 'reg_euphoric',
    category: 'reg',
    nameKey: 'achievements.reg_euphoric.name',
    descriptionKey: 'achievements.reg_euphoric.description',
    reward: 5,
    isHidden: false,
    trigger: (_s: GameState) => false, // Sprint 7.5: s.mood >= 100 (Euphoric tier peak)
  },
  {
    id: 'reg_foresight_master',
    category: 'reg',
    nameKey: 'achievements.reg_foresight_master.name',
    descriptionKey: 'achievements.reg_foresight_master.description',
    reward: 7,
    isHidden: false,
    trigger: (_s: GameState) => false, // Sprint 7.5: visualInsightTier derives >= 4
  },
  {
    id: 'reg_integrated_mind',
    category: 'reg',
    nameKey: 'achievements.reg_integrated_mind.name',
    descriptionKey: 'achievements.reg_integrated_mind.description',
    reward: 6,
    isHidden: false,
    trigger: (_s: GameState) => false, // Sprint 7.5: all 5 regions actively engaged this Run
  },
];

/** Quick index by id for O(1) lookup. Frozen snapshot. */
export const ACHIEVEMENTS_BY_ID: Readonly<Record<string, AchievementDef>> = Object.freeze(
  Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])),
);

/** Group by category for UI rendering (Mind → Achievements sub-tab Sprint 7.2). */
export const ACHIEVEMENTS_BY_CATEGORY: Readonly<Record<string, readonly AchievementDef[]>> = {
  cyc: ACHIEVEMENTS.filter((a) => a.category === 'cyc'),
  meta: ACHIEVEMENTS.filter((a) => a.category === 'meta'),
  nar: ACHIEVEMENTS.filter((a) => a.category === 'nar'),
  hid: ACHIEVEMENTS.filter((a) => a.category === 'hid'),
  mas: ACHIEVEMENTS.filter((a) => a.category === 'mas'),
  reg: ACHIEVEMENTS.filter((a) => a.category === 'reg'),
};
