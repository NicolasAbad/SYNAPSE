import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';

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
        top: 'calc(var(--spacing-5) + var(--text-lg) + 4px)', // CONST-OK: CSS layout offset below RateCounter
        right: 'var(--spacing-5)',
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
    </div>
  );
});
