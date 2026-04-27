import { memo } from 'react';
import { t } from '../../config/strings';
import { HUD } from '../tokens';
import { useGameStore } from '../../store/gameStore';
import { hapticHeavy, hapticMedium } from '../haptics';
import { useIsTutorialTarget } from '../modals/tutorialTargetState';

/**
 * Center-bottom Discharge button (GDD §7). Sprint 3 Phase 6: full wiring.
 * Enabled when `dischargeCharges > 0`. On tap → store.discharge(Date.now()),
 * UI triggers hapticMedium for plain Discharge or hapticHeavy for Cascade
 * (focusBar ≥ 0.75 at moment of tap — BUG-07 order).
 */
export const DischargeButton = memo(function DischargeButton() {
  const charges = useGameStore((s) => s.dischargeCharges);
  // Sprint 4c Phase 4c.6 — hide Discharge button when a non-Mind panel is
  // open. The overlay panel covers the canvas area; the Discharge button
  // previously leaked through and covered panel content (audit bug).
  // Phase 4c.6.5 — also hide on non-home Mind subtabs (Nico playtest feedback:
  // DISCHARGE overlapped PatternTreeView's Reset button).
  const activeTab = useGameStore((s) => s.activeTab);
  const activeMindSubtab = useGameStore((s) => s.activeMindSubtab);
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  // Pre-launch audit C-3 — show "SUPERCHARGED ×3" badge when the next
  // Discharge will receive the tutorial multiplier (TUTOR-2 +
  // tutorialDischargeMult=3.0). Mirrors the engine condition in
  // src/engine/discharge.ts:54: isTutorialCycle && cycleDischargesUsed===0.
  const isTutorialCycle = useGameStore((s) => s.isTutorialCycle);
  const cycleDischargesUsed = useGameStore((s) => s.cycleDischargesUsed);
  const showTutorialSupercharge = isTutorialCycle && cycleDischargesUsed === 0;
  const enabled = charges > 0;
  // M-7: glow when the active tutorial hint targets the discharge button.
  const isTutorialCallout = useIsTutorialTarget('discharge-button');
  if (activeTab !== 'mind' || activeMindSubtab !== 'home') return null;
  // Playtest fix (Mi A3 device feedback 2026-04-27): don't render at all
  // when no charge is available. Previously we rendered disabled+dimmed,
  // which players read as a constant distraction in the bottom-center
  // hot zone. Visible-only-when-actionable is the standard idle pattern
  // (Cookie Clicker / AdCap / NGU all hide the prestige/discharge equivalent
  // until the trigger is met).
  if (!enabled) return null;

  const onTap = () => {
    if (!enabled) return;
    const outcome = useGameStore.getState().discharge(Date.now());
    if (!outcome.fired) return;
    if (outcome.isCascade) void hapticHeavy();
    else void hapticMedium();
  };

  return (
    <div
      data-testid="hud-discharge-button-wrapper"
      style={{
        position: 'absolute',
        bottom: 'calc(var(--spacing-16) * 2.5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        left: '50%', // CONST-OK: CSS centering idiom (CODE-1 exception)
        transform: 'translateX(-50%)', // CONST-OK: CSS centering idiom (CODE-1 exception)
        pointerEvents: 'auto',
      }}
    >
      <button
        type="button"
        data-testid="hud-discharge-button"
        disabled={!enabled}
        onPointerDown={onTap}
        aria-label={enabled ? 'Discharge — fire neural burst' : 'Discharge unavailable — wait for charges'}
        // Sprint 10 Phase 10.6 — pulse when ready, off when reducedMotion or disabled.
        // M-7 (audit Dim M Phase 2): tutorial-callout class layered on top —
        // adds a primary-violet ring + pulse when the active hint targets this
        // button. Both classes can co-exist (different animation properties).
        className={[
          enabled && !reducedMotion ? 'discharge-pulse' : null,
          isTutorialCallout ? 'synapse-tutorial-callout' : null,
        ].filter(Boolean).join(' ') || undefined}
        style={{
          minWidth: HUD.dischargeButtonMinWidth,
          minHeight: HUD.touchTargetMin,
          padding: 'var(--spacing-2) var(--spacing-5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
          borderRadius: 'var(--radius-full)',
          background: enabled
            ? 'color-mix(in srgb, var(--color-discharge-btn) 32%, transparent)'
            : 'color-mix(in srgb, var(--color-discharge-btn) 12%, transparent)', // CONST-OK: CSS color-mix idiom
          border: '1.5px solid var(--color-discharge-btn)', // CONST-OK: CSS stroke width (CODE-1 exception)
          color: 'var(--color-discharge-btn)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-bold)',
          letterSpacing: '0.02em', // CONST-OK: CSS typography idiom (CODE-1 exception)
          cursor: enabled ? 'pointer' : 'not-allowed',
          opacity: enabled ? 1 : HUD.dischargeButtonDisabledOpacity,
          touchAction: 'manipulation',
        }}
      >
        {t('buttons.discharge')}
      </button>
      {showTutorialSupercharge && enabled && (
        <div
          data-testid="hud-discharge-tutorial-badge"
          aria-label={t('buttons.discharge_tutorial_supercharge')}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + var(--spacing-1))', // CONST-OK CSS positioning idiom
            left: '50%', // CONST-OK CSS centering idiom
            transform: 'translateX(-50%)', // CONST-OK CSS centering idiom
            padding: 'var(--spacing-1) var(--spacing-2)', // CONST-OK CSS spacing tokens
            background: 'var(--color-discharge-btn)',
            color: 'var(--color-bg-deep)',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-weight-bold)',
            letterSpacing: '0.04em', // CONST-OK CSS typography idiom
            borderRadius: 'var(--radius-sm)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {t('buttons.discharge_tutorial_supercharge')}
        </div>
      )}
    </div>
  );
});
