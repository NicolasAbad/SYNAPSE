// Sprint 7.5 Phase 7.5.3 §16.3 — Límbico Mood panel section.
//
// Renders inside the Límbico region card when unlocked:
//   - Current mood value + tier label (mirrors HUD glyph but with full bar)
//   - 5-tier visual scale showing where current mood lies
//
// 24h history chart deferred to Sprint 7.5.7 (brain-canvas region redesign).

import { memo } from 'react';
import { effectiveMoodTier } from '../../engine/mood';
import { t } from '../../config/strings';
import type { GameState } from '../../types/GameState';

const TIER_KEYS = ['numb', 'calm', 'engaged', 'elevated', 'euphoric'] as const;
const TIER_COLORS = [
  'var(--color-text-disabled)',
  'var(--color-text-secondary)',
  'var(--color-success)',
  'var(--color-primary)',
  'var(--color-accent)',
];

export const LimbicoMoodSection = memo(function LimbicoMoodSection({ state }: { state: GameState }) {
  const tier = effectiveMoodTier(state);
  const tierKey = TIER_KEYS[tier];
  const moodPct = Math.max(0, Math.min(100, state.mood)); // CONST-OK: 100 = mood max scale (mirrors moodMaxValue, hardcoded for CSS % units)
  return (
    <div data-testid="limbico-mood-section" style={{ marginTop: 'var(--spacing-3)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-2)' /* CONST-OK */, marginBottom: 'var(--spacing-2)' /* CONST-OK */ }}>
        <span data-testid="limbico-mood-value" style={{ color: TIER_COLORS[tier], fontWeight: 'var(--font-weight-semibold)', fontFamily: 'var(--font-mono)' }}>
          {Math.floor(state.mood)}
        </span>
        <span data-testid="limbico-mood-tier" style={{ color: TIER_COLORS[tier], fontSize: 'var(--text-xs)' }}>
          {t(`mood_tiers.${tierKey}`)}
        </span>
      </div>
      <div data-testid="limbico-mood-bar" style={{ position: 'relative', width: '100%', height: 8 /* CONST-OK: bar height px */, background: 'var(--color-border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: `${moodPct}%`,
            background: TIER_COLORS[tier],
            transition: 'width 200ms ease', // CONST-OK: animation duration ms
          }}
        />
      </div>
      <div style={{ marginTop: 'var(--spacing-1)' /* CONST-OK */, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
        {t(`mood_tier_descriptions.${tierKey}`)}
      </div>
    </div>
  );
});
