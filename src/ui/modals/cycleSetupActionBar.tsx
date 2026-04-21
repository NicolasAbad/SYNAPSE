import { memo } from 'react';
import { t } from '../../config/strings';
import { HUD } from '../tokens';

/**
 * SAME AS LAST + Continue action bar at the bottom of CycleSetupScreen.
 * Split out per CODE-2 (parent would exceed 200 lines otherwise).
 */
export interface CycleSetupActionBarProps {
  canSameAsLast: boolean;
  canContinue: boolean;
  onSameAsLast: () => void;
  onContinue: () => void;
}

export const CycleSetupActionBar = memo(function CycleSetupActionBar({
  canSameAsLast, canContinue, onSameAsLast, onContinue,
}: CycleSetupActionBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 'var(--spacing-3)', // CONST-OK: CSS custom property ref
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ActionButton
        testid="cycle-setup-same-as-last"
        enabled={canSameAsLast}
        onClick={onSameAsLast}
        label={t('cycle_setup.same_as_last')}
        variant="secondary"
      />
      <ActionButton
        testid="cycle-setup-continue"
        enabled={canContinue}
        onClick={onContinue}
        label={t('cycle_setup.continue')}
        variant="primary"
      />
    </div>
  );
});

function ActionButton({
  testid, enabled, onClick, label, variant,
}: { testid: string; enabled: boolean; onClick: () => void; label: string; variant: 'primary' | 'secondary' }) {
  const primary = variant === 'primary';
  return (
    <button
      type="button"
      data-testid={testid}
      disabled={!enabled}
      onPointerDown={() => { if (enabled) onClick(); }}
      style={{
        minHeight: HUD.touchTargetMin,
        padding: 'var(--spacing-3) var(--spacing-6)', // CONST-OK: CSS custom property ref
        background: enabled && primary ? 'var(--color-primary)' : 'transparent',
        border: enabled && primary ? '1px solid var(--color-primary)' : '1px solid var(--color-border-medium)',
        borderRadius: 'var(--radius-md)',
        color: enabled && primary
          ? 'var(--color-bg-deep)'
          : enabled
            ? 'var(--color-text-primary)'
            : 'var(--color-text-disabled)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-weight-semibold)',
        cursor: enabled ? 'pointer' : 'not-allowed',
        opacity: enabled ? 1 : HUD.dischargeButtonDisabledOpacity, // CONST-OK: CSS opacity idiom
      }}
    >
      {label}
    </button>
  );
}
