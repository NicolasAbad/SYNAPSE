import { memo, useEffect } from 'react';

/**
 * Generic network-error toast — scaffold for GDD §29 UI-8 patterns.
 *
 * UI-8 says network-dependent services (Firebase, RevenueCat, AdMob,
 * cloud save) must fail with graceful user-facing feedback — toast or
 * cached fallback. Sprint 9a (ads) and Sprint 9b (store) will drive
 * most triggers. Sprint 3.6.5 ships the render scaffold so later
 * sprints wire a single component for all four error surfaces.
 *
 * Controlled component:
 * - `message: string | null` — non-null shows the toast with the text.
 * - `onDismiss: () => void` — called on auto-dismiss OR user tap.
 * - `durationMs?: number` — optional timeout before auto-dismiss.
 *
 * Currently not mounted anywhere in the app tree — Sprint 9a/9b will
 * mount it at the HUD level and drive `message` via an error-bus.
 */
export const NetworkErrorToast = memo(function NetworkErrorToast({
  message,
  onDismiss,
  durationMs,
}: {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    if (message === null || durationMs === undefined) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (message === null) return null;

  return (
    <div
      data-testid="hud-network-error-toast"
      role="alert"
      onPointerDown={onDismiss}
      style={{
        position: 'absolute',
        bottom: 'calc(var(--spacing-16) * 3)', // CONST-OK: above TabBar
        left: '50%', // CONST-OK: CSS centering idiom
        transform: 'translateX(-50%)', // CONST-OK: CSS centering idiom
        padding: 'var(--spacing-2) var(--spacing-4)' /* CONST-OK: spacing tokens */,
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-medium)',
        borderLeft: '3px solid var(--color-danger, #E85050)', // CONST-OK: 3px accent + hex fallback for pre-theme contexts
        borderRadius: 'var(--radius-full)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
      }}
    >
      {message}
    </div>
  );
});
