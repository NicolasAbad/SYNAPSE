import { memo } from 'react';
import { t } from '../../config/strings';
import { MUTATIONS_BY_ID } from '../../config/mutations';
import { PATHWAYS_BY_ID } from '../../config/pathways';
import type { Pathway } from '../../types';

/**
 * What-if Preview — Sprint 5 Phase 5.5 (SPRINTS.md AI check #12).
 *
 * Estimates cycle time for the player's current draft Mutation +
 * Pathway combo. Formula (from PROGRESS.md "Sprint 5 — approved
 * decisions"):
 *
 *   estimatedSeconds = currentThreshold / projectedAvgPPS
 *   projectedAvgPPS  = currentEffectivePPS × mutationProdMod ×
 *                      (1 + (1 − 1) × pathwayDamp) ≈ effectivePPS × mutationProdMod
 *
 * Pathway damp doesn't affect production directly via this formula —
 * Equilibrada's 0.85 dampens the upgrade-stack DELTA, but for the
 * preview we approximate by leaving production as-is. Disclaimer at
 * bottom (en.ts what_if.disclaimer) reminds the player this excludes
 * offline / taps / Cascades / Spontaneous.
 *
 * Returns null when no slots selected (preview hidden until 1+ choice).
 */
export interface WhatIfPreviewProps {
  effectivePPS: number;
  currentThreshold: number;
  selectedMutationId: string | null;
  selectedPathway: Pathway | null;
}

export const WhatIfPreview = memo(function WhatIfPreview({
  effectivePPS,
  currentThreshold,
  selectedMutationId,
  selectedPathway,
}: WhatIfPreviewProps) {
  if (selectedMutationId === null && selectedPathway === null) return null;

  let mutMult = 1;
  if (selectedMutationId) {
    const m = MUTATIONS_BY_ID[selectedMutationId];
    if (m?.effect.kind === 'neural_efficiency') mutMult = m.effect.neuronProdMult;
    if (m?.effect.kind === 'hyperstimulation') mutMult = m.effect.prodMult;
    // Other mutations have indirect / time-based effects — we don't model
    // them in the preview to avoid showing fake-precise numbers.
  }

  // Pathway preview is informational only — the upgrade-bonus damp affects
  // the GLOBAL upgrade multiplier delta, not the steady-state PPS estimate.
  // Reading the pathway here keeps the helper future-proof if we add
  // pathway-driven production adjustments.
  const _pathwayDef = selectedPathway ? PATHWAYS_BY_ID[selectedPathway] ?? null : null;
  void _pathwayDef;

  const projectedPPS = Math.max(0.01, effectivePPS * mutMult); // CONST-OK: avoid div-by-zero
  const remaining = Math.max(0, currentThreshold);
  const estimatedSeconds = remaining / projectedPPS;
  const display = estimatedSeconds >= 60
    ? `${(estimatedSeconds / 60).toFixed(1)} min` // CONST-OK: sec→min
    : `${Math.max(1, Math.round(estimatedSeconds))} s`;

  return (
    <div
      data-testid="cycle-setup-what-if"
      style={{
        marginTop: 'var(--spacing-3)', // CONST-OK
        padding: 'var(--spacing-3)', // CONST-OK
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--text-xs)',
      }}
    >
      <div style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
        {t('what_if.estimate_label')}: {display}
      </div>
      <div style={{ marginTop: 'var(--spacing-1)' /* CONST-OK */, opacity: 0.7 /* CONST-OK */ }}>
        {t('what_if.disclaimer')}
      </div>
    </div>
  );
});
