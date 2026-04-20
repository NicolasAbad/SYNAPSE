import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { t } from '../../config/strings';
import { HUD } from '../tokens';

/**
 * UI-9 step 2: GDPR consent modal. Shown only if EU detected.
 *
 * Phase 6 [D1]: `isEU` is hardcoded false for Sprint 2. The component
 * is built and wired but never renders in the live flow.
 * TODO Sprint 9a: replace with real platform EU detection.
 *
 * Accept → sets analyticsConsent=true. Manage → dismisses without
 * changing consent. Game continues regardless of choice.
 */
// TODO Sprint 9a: replace with real platform EU detection (Capacitor locale + jurisdiction probe).
export const isEU = false;

interface GdprModalProps {
  onComplete: () => void;
}

export const GdprModal = memo(function GdprModal({ onComplete }: GdprModalProps) {
  const setAnalyticsConsent = useGameStore((s) => s.setAnalyticsConsent);

  const onAccept = () => {
    setAnalyticsConsent(true);
    onComplete();
  };
  const onManage = () => {
    // Consent stays false (default); player can revisit in Settings (Sprint 9a).
    onComplete();
  };

  return (
    <div
      data-testid="gdpr-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gdpr-title"
      style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0, // CONST-OK: CSS full-bleed (CODE-1 exception)
        background: 'var(--color-overlay-scrim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-6)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        zIndex: 900, // CONST-OK: overlay stacking, below splash (CODE-1 exception)
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 420, // CONST-OK: CSS readable line-length cap (CODE-1 exception)
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-6)', // CONST-OK: CSS custom property ref (CODE-1 exception)
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <h2
          id="gdpr-title"
          data-testid="gdpr-title"
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--spacing-3)', // CONST-OK: CSS custom property ref (CODE-1 exception)
          }}
        >
          {t('gdpr.title')}
        </h2>
        <p
          data-testid="gdpr-body"
          style={{
            margin: 0,
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
            lineHeight: 1.5, // CONST-OK: CSS readability idiom (CODE-1 exception)
          }}
        >
          {t('gdpr.body')}
        </p>
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-3)', // CONST-OK: CSS custom property ref (CODE-1 exception)
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            data-testid="gdpr-manage"
            onPointerDown={onManage}
            style={{
              minHeight: HUD.touchTargetMin,
              padding: 'var(--spacing-2) var(--spacing-5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
              background: 'transparent',
              border: '1px solid var(--color-border-medium)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            {t('gdpr.manage')}
          </button>
          <button
            type="button"
            data-testid="gdpr-accept"
            onPointerDown={onAccept}
            style={{
              minHeight: HUD.touchTargetMin,
              padding: 'var(--spacing-2) var(--spacing-5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
              background: 'var(--color-primary)',
              border: '1px solid var(--color-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-bg-deep)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            {t('gdpr.accept')}
          </button>
        </div>
      </div>
    </div>
  );
});
