import { memo, useState } from 'react';
import { t } from '../../config/strings';
import { HUD } from '../tokens';

/**
 * Center-bottom Discharge button. Mockup: x=135 y=510 w=120 h=36 rx=18,
 * amber fill with stroke, DISCHARGE ⚡ label.
 *
 * Phase 5: STUB DISABLED. No click handler, locked tooltip on tap/hover.
 * Sprint 3 wires the discharge mechanic + pulse-when-ready animation
 * (per SPRINTS.md §Sprint 3 AI check "Discharge: charges accumulate").
 */
export const DischargeButton = memo(function DischargeButton() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      data-testid="hud-discharge-button-wrapper"
      style={{
        position: 'absolute',
        bottom: 'calc(var(--spacing-16) * 2.5)', // CONST-OK: CSS custom property ref + bottom-offset factor (CODE-1 exception)
        left: '50%', // CONST-OK: CSS centering idiom (CODE-1 exception)
        transform: 'translateX(-50%)', // CONST-OK: CSS centering idiom (CODE-1 exception)
        pointerEvents: 'auto',
      }}
    >
      <button
        type="button"
        data-testid="hud-discharge-button"
        disabled
        onPointerDown={() => setShowTooltip(true)}
        onPointerUp={() => setShowTooltip(false)}
        onPointerLeave={() => setShowTooltip(false)}
        style={{
          minWidth: HUD.dischargeButtonMinWidth,
          minHeight: HUD.touchTargetMin,
          padding: 'var(--spacing-2) var(--spacing-5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
          borderRadius: 'var(--radius-full)',
          background: 'color-mix(in srgb, var(--color-discharge-btn) 12%, transparent)', // CONST-OK: CSS color-mix idiom (CODE-1 exception)
          border: '1.5px solid var(--color-discharge-btn)', // CONST-OK: CSS stroke width (CODE-1 exception)
          color: 'var(--color-discharge-btn)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-bold)',
          letterSpacing: '0.02em', // CONST-OK: CSS typography idiom (CODE-1 exception)
          cursor: 'not-allowed',
          opacity: HUD.dischargeButtonDisabledOpacity,
          touchAction: 'manipulation',
        }}
      >
        {t('buttons.discharge')}
      </button>
      {showTooltip && (
        <div
          data-testid="hud-discharge-tooltip"
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '110%', // CONST-OK: CSS above-anchor idiom (CODE-1 exception)
            left: '50%', // CONST-OK: CSS centering idiom (CODE-1 exception)
            transform: 'translateX(-50%)', // CONST-OK: CSS centering idiom (CODE-1 exception)
            whiteSpace: 'nowrap',
            padding: 'var(--spacing-1) var(--spacing-3)', // CONST-OK: CSS custom property ref (CODE-1 exception)
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-medium)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--text-xs)',
            pointerEvents: 'none',
          }}
        >
          {t('buttons.discharge_locked_tooltip')}
        </div>
      )}
    </div>
  );
});
