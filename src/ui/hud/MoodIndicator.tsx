// HUD Mood indicator — 5-tier glyph showing current mood tier.
// Sprint 7.5 Phase 7.5.3 §16.3 REG-5.

import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { effectiveMoodTier } from '../../engine/mood';
import { t } from '../../config/strings';

const TIER_GLYPHS = ['◯', '◔', '◑', '◕', '●'] as const; // Numb to Euphoric (filled-circle progression)
const TIER_KEYS = ['numb', 'calm', 'engaged', 'elevated', 'euphoric'] as const;
const TIER_COLORS = [
  'var(--color-text-disabled)',
  'var(--color-text-secondary)',
  'var(--color-success)',
  'var(--color-primary)',
  'var(--color-accent)',
];

export const MoodIndicator = memo(function MoodIndicator() {
  const mood = useGameStore((s) => s.mood);
  const upgrades = useGameStore((s) => s.upgrades);
  const tier = effectiveMoodTier({ mood, upgrades });
  return (
    <div
      data-testid="hud-mood"
      data-tier={TIER_KEYS[tier]}
      title={`${t(`mood_tiers.${TIER_KEYS[tier]}`)} — ${Math.floor(mood)}`}
      style={{
        position: 'absolute',
        // Top-right column, mirroring MemoriesCounter on the left side.
        top: 'calc(var(--spacing-16) + var(--spacing-6))', // CONST-OK: CSS custom property math
        right: 'var(--spacing-5)', // CONST-OK: CSS custom property ref
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 'var(--spacing-1)', // CONST-OK
        color: TIER_COLORS[tier],
        fontSize: 'var(--text-sm)',
        fontFamily: 'var(--font-mono)',
        pointerEvents: 'none',
      }}
    >
      <span aria-hidden="true">{TIER_GLYPHS[tier]}</span>
      <span style={{ fontSize: 'var(--text-xs)' }}>{Math.floor(mood)}</span>
    </div>
  );
});
