import { memo, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { t } from '../../config/strings';
import { ACHIEVEMENTS_BY_ID } from '../../config/achievements';
import type { DiaryEntry, DiaryEntryType } from '../../types';

/**
 * Sprint 7.5 — Mind→Diary subtab.
 *
 * Displays the player's Neural Diary as a reverse-chronological scrollable
 * list (newest at top). 500-entry circular cap enforced at engine layer.
 *
 * Each entry renders an icon + 1-2 line summary based on type:
 *   - prestige: "Awakening #N · cycle X min"
 *   - achievement: "🏆 {name} · +X Sparks"
 *   - resonant_pattern: "✨ Resonant Pattern #N discovered"
 *   - personal_best: "⏱ Personal best at P{N}"
 *   - ending: "🌟 Ending: {id}"
 *   - fragment: "📜 Fragment: {id}"
 *   - spontaneous: "⚡ Spontaneous: {id}"
 *
 * Sprint 7.8 will add search + timeline visualization (v1.1 pull-in).
 * Sprint 10 polish will add tap-to-expand for fragments + named-moment prose.
 */
export const DiarySubtab = memo(function DiarySubtab() {
  const entries = useGameStore((s) => s.diaryEntries);
  // Reverse-chronological order (latest first).
  const sorted = useMemo(() => [...entries].reverse(), [entries]);

  if (sorted.length === 0) {
    return (
      <div
        data-testid="diary-subtab-empty"
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-sm)',
          textAlign: 'center',
          padding: 'var(--spacing-8)', // CONST-OK
        }}
      >
        {t('mind_subtabs.diary_empty')}
      </div>
    );
  }

  return (
    <div data-testid="diary-subtab" aria-label="Neural Diary">
      <div
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-xs)',
          marginBottom: 'var(--spacing-3)', // CONST-OK
          letterSpacing: '0.08em', // CONST-OK
          textTransform: 'uppercase',
        }}
      >
        {t('mind_subtabs.diary_count').replace('{n}', String(entries.length))}
      </div>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-2)', // CONST-OK
        }}
      >
        {sorted.map((entry, i) => (
          <DiaryEntryRow key={`${entry.timestamp}-${i}`} entry={entry} />
        ))}
      </ul>
    </div>
  );
});

const TYPE_ICON: Record<DiaryEntryType, string> = {
  prestige: '🌀',
  resonant_pattern: '✨',
  personal_best: '⏱',
  ending: '🌟',
  fragment: '📜',
  achievement: '🏆',
  spontaneous: '⚡',
  precommit: '🎯', // Sprint 7.5.4 §16.2 Pre-commit wager
};

function DiaryEntryRow({ entry }: { entry: DiaryEntry }) {
  const summary = formatEntrySummary(entry);
  return (
    <li
      data-testid={`diary-entry-${entry.type}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-2)', // CONST-OK
        padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK
        background: 'var(--color-bg-elevated)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <span style={{ fontSize: 'var(--text-base)', flexShrink: 0 }}>{TYPE_ICON[entry.type]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>{summary.title}</div>
        {summary.subtitle !== null && (
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>{summary.subtitle}</div>
        )}
      </div>
    </li>
  );
}

function formatEntrySummary(entry: DiaryEntry): { title: string; subtitle: string | null } {
  const d = entry.data;
  if (entry.type === 'prestige') {
    const minutes = ((d['cycleDurationMs'] as number) ?? 0) / 60_000;
    return {
      title: `${t('diary.prestige_title')} #${d['prestigeCount']}`,
      subtitle: `${minutes.toFixed(1)} min · +${d['memoriesGained']} ${t('hud.memories')}`,
    };
  }
  if (entry.type === 'achievement') {
    const id = d['achievementId'] as string;
    const def = ACHIEVEMENTS_BY_ID[id];
    if (def === undefined) return { title: id, subtitle: null };
    return {
      title: t(`achievements.${id}.name`),
      subtitle: `+${d['reward']} ${t('hud.sparks')}`,
    };
  }
  if (entry.type === 'resonant_pattern') {
    return {
      title: `${t('diary.rp_title')} #${d['rpNumber']}`,
      subtitle: t('diary.rp_subtitle'),
    };
  }
  if (entry.type === 'personal_best') {
    return {
      title: `${t('diary.pb_title')} P${d['prestigeCount']}`,
      subtitle: `${((d['cycleMinutes'] as number) ?? 0).toFixed(1)} min`,
    };
  }
  if (entry.type === 'ending') {
    return {
      title: t(`endings.${d['endingId']}.title`),
      subtitle: `${t('diary.ending_subtitle')} ${(d['option'] as string).toUpperCase()}`,
    };
  }
  if (entry.type === 'fragment') {
    return {
      title: t('diary.fragment_title'),
      subtitle: String(d['fragmentId'] ?? ''),
    };
  }
  if (entry.type === 'spontaneous') {
    const id = d['spontaneousId'] as string;
    return {
      title: t(`spontaneous.${id}.name`),
      subtitle: t('diary.spontaneous_subtitle'),
    };
  }
  if (entry.type === 'precommit') {
    const goalId = d['goalId'] as string;
    const outcome = d['outcome'] as string;
    return {
      title: t(`precommit_goals.${goalId}.name`),
      subtitle: outcome === 'success' ? t('diary.precommit_success') : t('diary.precommit_fail'),
    };
  }
  return { title: entry.type, subtitle: null };
}
