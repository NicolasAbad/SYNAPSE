import { memo } from 'react';
import { t } from '../../config/strings';
import { HUD } from '../tokens';
import { useGameStore } from '../../store/gameStore';
import { hapticHeavy, hapticMedium } from '../haptics';

/**
 * Center-bottom Discharge button (GDD §7). Sprint 3 Phase 6: full wiring.
 * Enabled when `dischargeCharges > 0`. On tap → store.discharge(Date.now()),
 * UI triggers hapticMedium for plain Discharge or hapticHeavy for Cascade
 * (focusBar ≥ 0.75 at moment of tap — BUG-07 order).
 */
export const DischargeButton = memo(function DischargeButton() {
  const charges = useGameStore((s) => s.dischargeCharges);
  const enabled = charges > 0;

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
    </div>
  );
});
