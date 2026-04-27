// Pre-launch audit Tier 2 (C-1 / A-1 / A-2) — reusable full-screen
// activation overlay. One component, parameterised for every "moment of
// power" the player triggers (Cascade Discharge, Insight activation, and
// future Mental State / Mood-tier transitions in subsequent sprints).
//
// Visual: full-bleed `fixed` overlay with a tinted radial-gradient backdrop
// + a centered hero label (e.g. "CASCADE!" / "INSIGHT L2" / "+12,500"). The
// existing `synapse-cascade-first-fade` keyframes drive the fade — same
// 0.8 → 1.0 → 1.05 → 1.1 scale-up, opacity 0→1→0 that CascadeFirstOverlay
// uses for the once-per-session "CASCADE!" splash. Reusing the keyframes
// keeps the celebration vocabulary consistent.
//
// Reduced-motion: caller is responsible for skipping the render entirely
// when `state.reducedMotion === true` (parity with CascadeFirstOverlay /
// FocusBar pattern). The audio + haptic from the underlying action still
// fire — only the visual is suppressed.

import { memo, useEffect, useState } from 'react';

const DEFAULT_DURATION_MS = 1000; // CONST-OK UI display-duration default (CODE-1 exception)

export interface ActivationFlashProps {
  /** Non-null triggers the flash. Each new value resets the timer. */
  trigger: { id: number; label: string; subLabel?: string; tintColor: string } | null;
  /** Total display time before auto-dismiss. */
  durationMs?: number;
  /** Optional callback when the timer expires (UI hook for cleanup). */
  onComplete?: () => void;
  /** data-testid override — defaults to 'activation-flash'. */
  testId?: string;
}

export const ActivationFlash = memo(function ActivationFlash({
  trigger, durationMs = DEFAULT_DURATION_MS, onComplete, testId = 'activation-flash',
}: ActivationFlashProps) {
  const [active, setActive] = useState<ActivationFlashProps['trigger']>(null);

  useEffect(() => {
    if (trigger === null) return;
    setActive(trigger);
    const timer = setTimeout(() => {
      setActive(null);
      onComplete?.();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [trigger, durationMs, onComplete]);

  if (active === null) return null;

  return (
    <div
      data-testid={testId}
      role="status"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0, left: 0, // CONST-OK CSS full-bleed
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-2)', // CONST-OK token
        pointerEvents: 'none',
        zIndex: 950, // CONST-OK above HUD pills, below modals (matches CascadeFirstOverlay)
        background: `radial-gradient(circle at center, ${active.tintColor}55 0%, transparent 70%)`, // CONST-OK CSS gradient
        animation: `synapse-cascade-first-fade ${durationMs}ms ease-out forwards`,
      }}
    >
      <div
        data-testid={`${testId}-label`}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3.5rem', // CONST-OK CSS hero-text size
          fontWeight: 'var(--font-weight-heaviest)',
          color: active.tintColor,
          textShadow: `0 0 24px ${active.tintColor}d0, 0 0 48px ${active.tintColor}70`, // CONST-OK glow
          letterSpacing: '0.12em', // CONST-OK CSS hero spacing
        }}
      >
        {active.label}
      </div>
      {active.subLabel !== undefined && (
        <div
          data-testid={`${testId}-sublabel`}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem', // CONST-OK CSS sub-hero size
            fontWeight: 'var(--font-weight-bold)',
            color: active.tintColor,
            opacity: 0.85, // CONST-OK CSS softening
            letterSpacing: '0.08em', // CONST-OK
          }}
        >
          {active.subLabel}
        </div>
      )}
    </div>
  );
});
