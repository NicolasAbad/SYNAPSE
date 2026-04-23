import { memo, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { UPGRADES_BY_ID } from '../../config/upgrades';
import { MOTION } from '../tokens';
import { t } from '../../config/strings';

/**
 * Emergencia Cognitiva cap banner (Phase 3.5 Sprint 3 audit Part 2 Risk #3).
 *
 * Surfaces once per cycle when the player owns Emergencia Cognitiva AND
 * their effective multiplier has hit its cap (`perBucket^buckets >=
 * capMult`). Mirrors the text agreed in the Phase 7 kickoff:
 *   "Max bonus reached — other upgrades keep scaling"
 *
 * UX rules:
 * - Dismissed by a tap anywhere (`pointerdown`).
 * - Stays dismissed until the next prestige (keyed on `prestigeCount`,
 *   which monotonically increases). No GameState mutation — all state
 *   is React-local so the 119-field invariant is preserved.
 * - Only renders while the predicate holds. If the player dismisses,
 *   the banner stays down for the rest of the cycle even if the
 *   predicate remains true (no nagging).
 *
 * Option A (Phase 7 kickoff) — defer the "tooltip on upgrade card"
 * surface to whenever the Upgrades tab panel ships; this banner is the
 * minimum viable surface now.
 */

function capReachedSelector(upgrades: { id: string; purchased: boolean }[]): boolean {
  const def = UPGRADES_BY_ID['emergencia_cognitiva'];
  if (!def || def.effect.kind !== 'upgrades_scaling_mult') return false;
  const owned = upgrades.filter((u) => u.purchased);
  const owns = owned.some((u) => u.id === 'emergencia_cognitiva');
  if (!owns) return false;
  const { perBucket, bucketSize, capMult } = def.effect;
  const buckets = Math.floor(owned.length / bucketSize);
  return Math.pow(perBucket, buckets) >= capMult;
}

export const EmergenciaCapBanner = memo(function EmergenciaCapBanner() {
  const capReached = useGameStore((s) => capReachedSelector(s.upgrades));
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const [dismissedAtPrestige, setDismissedAtPrestige] = useState<number | null>(null);

  useEffect(() => {
    // Reset dismissal state at every prestige boundary so the banner can
    // re-surface in the next cycle if the cap is hit again.
    setDismissedAtPrestige(null);
  }, [prestigeCount]);

  if (!capReached) return null;
  if (dismissedAtPrestige === prestigeCount) return null;

  return (
    <div
      data-testid="hud-emergencia-cap-banner"
      role="status"
      onPointerDown={() => setDismissedAtPrestige(prestigeCount)}
      style={{
        position: 'absolute',
        bottom: 'calc(var(--spacing-16) * 2)', // CONST-OK: CSS layout offset above TabBar
        left: '50%', // CONST-OK: CSS centering idiom (CODE-1 exception)
        transform: 'translateX(-50%)', // CONST-OK: CSS centering idiom
        padding: 'var(--spacing-2) var(--spacing-5)',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-medium)',
        borderRadius: 'var(--radius-full)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        pointerEvents: 'auto',
        transition: `opacity ${MOTION.durFast}ms ease-out`,
      }}
    >
      {t('upgrades.emergencia_cap_reached')}
    </div>
  );
});
