import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { t } from '../../config/strings';

/**
 * Connection-multiplier HUD chip (Sprint 3 Phase 5 — Decision B).
 *
 * Makes the invisible C(n,2) pair bonus visible. Renders only when the
 * player owns ≥ 2 neuron types (i.e. the bonus is non-trivial). Format:
 * "×1.15 conns". Placed just below RateCounter in the top-right stack.
 *
 * Rationale (audit Part 2 Risk #2): players plateau without understanding
 * why their production stops growing — the connection bonus is the
 * hidden incentive to buy new types. HUD chip teaches this passively;
 * tutorial hint #4 (Phase 7) reinforces on first eligibility.
 */
export const ConnectionChip = memo(function ConnectionChip() {
  const connectionMult = useGameStore((s) => s.connectionMult);
  const ownedTypes = useGameStore((s) => s.neurons.filter((n) => n.count > 0).length);
  if (ownedTypes < 2) return null; // CONST-OK (pair requires ≥2 types by definition, §5)
  return (
    <div
      data-testid="hud-connection-chip"
      style={{
        position: 'absolute',
        // Mi A3 playtest UX redesign Option C: aligned to the StatusRow
        // (memories left, connection center, mood right) — same vertical
        // as MemoriesCounter and MoodIndicator. Prevously sat alone below
        // RateCounter on the right.
        top: 'calc(var(--spacing-16) + var(--spacing-6))', // CONST-OK CSS — matches MemoriesCounter / MoodIndicator
        left: '50%', // CONST-OK CSS centering idiom
        transform: 'translateX(-50%)', // CONST-OK CSS centering idiom
        textAlign: 'center',
        color: 'var(--color-connection-chip, var(--color-rate-counter))',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-weight-semibold)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        opacity: 0.85, // CONST-OK (CSS design value)
        pointerEvents: 'none',
      }}
    >
      {`×${connectionMult.toFixed(2) /* CONST-OK: 2-decimal display precision */} conns`}
      {/* Inline explanation — audit fix. Previously the chip appeared at
          first multi-type ownership with no context; new players had no
          way to learn what the scaled-value text meant. */}
      <div
        data-testid="hud-connection-chip-explain"
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--color-text-secondary)',
          marginTop: 2, // CONST-OK: tight spacing
          textAlign: 'center', // centered chip => centered caption
          maxWidth: 180, // CONST-OK: keep caption narrow so it stays inside the row
        }}
      >
        {t('hud_explain.connection_chip')}
      </div>
    </div>
  );
});
