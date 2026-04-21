import { memo } from 'react';
import type { PrestigeOutcome } from '../../engine/prestige';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { t } from '../../config/strings';
import { HUD } from '../tokens';
import { formatCurrency } from '../util/formatNumber';

/**
 * Awakening screen — full-bleed post-prestige summary per GDD §9 / SPRINTS.md
 * §4a: cycle duration, Memories gained, Personal Best badge, animated
 * Momentum counter ("+X thoughts, 30 s head start").
 *
 * Animation (counter ramp, glow-on-personal-best) is intentionally simple
 * for Phase 4a.5 — a polished ramp lands in Sprint 10. The values are what
 * matter: accurate outcome, clear "Continue" affordance.
 */
export interface AwakeningScreenProps {
  outcome: PrestigeOutcome | null;
  onContinue: () => void;
}

export const AwakeningScreen = memo(function AwakeningScreen({ outcome, onContinue }: AwakeningScreenProps) {
  if (!outcome) return null;

  const minutes = outcome.cycleDurationMs / 60_000; // CONST-OK (ms→min)
  // CONST-OK: ms→sec idiom.
  const minutesLabel = minutes >= 1 ? `${minutes.toFixed(1)} min` : `${Math.round(outcome.cycleDurationMs / 1000)} s`;

  return (
    <div
      data-testid="awakening-screen-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="awakening-screen-title"
      style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0, // CONST-OK
        background: 'var(--color-overlay-scrim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-6)', // CONST-OK: CSS custom property ref
        zIndex: 940, // CONST-OK: below confirm (950), above other HUD
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 420, // CONST-OK
          width: '100%', // CONST-OK
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-6)', // CONST-OK: CSS custom property ref
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-body)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-4)', // CONST-OK: CSS custom property ref
          textAlign: 'center',
        }}
      >
        <h2
          id="awakening-screen-title"
          data-testid="awakening-screen-title"
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-weight-bold)',
          }}
        >
          {t('awakening.screen_title')}
        </h2>

        <div
          data-testid="awakening-screen-stats"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-2)', // CONST-OK: CSS custom property ref
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <Row label={t('awakening.duration_label')} value={minutesLabel} testid="awakening-screen-duration" />
          <Row
            label={t('awakening.memories_label')}
            value={`+${formatCurrency(outcome.memoriesGained)}`}
            testid="awakening-screen-memories"
          />
          <Row
            label={t('awakening.momentum_label')}
            value={`+${formatCurrency(outcome.momentumBonus)} · ${SYNAPSE_CONSTANTS.momentumBonusSeconds}${t('awakening.momentum_suffix_seconds')}`}
            testid="awakening-screen-momentum"
          />
        </div>

        {outcome.wasPersonalBest && (
          <div
            data-testid="awakening-screen-personal-best"
            style={{
              color: 'var(--color-rate-counter)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            {t('awakening.personal_best')}
          </div>
        )}

        <button
          type="button"
          data-testid="awakening-screen-continue"
          onPointerDown={onContinue}
          style={{
            minHeight: HUD.touchTargetMin,
            padding: 'var(--spacing-3) var(--spacing-5)', // CONST-OK: CSS custom property ref
            background: 'var(--color-primary)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-bg-deep)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
            touchAction: 'manipulation',
            marginTop: 'var(--spacing-2)', // CONST-OK: CSS custom property ref
          }}
        >
          {t('awakening.continue')}
        </button>
      </div>
    </div>
  );
});

function Row({ label, value, testid }: { label: string; value: string; testid: string }) {
  return (
    <div
      data-testid={testid}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
    >
      <span>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>{value}</span>
    </div>
  );
}
